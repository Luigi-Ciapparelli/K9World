import { supabase } from './supabase';
import { prepareProfileImage } from './profileImages';

export const DOG_PHOTO_BUCKET = 'dog-photos';
export const DOG_PHOTO_CHANGED = 'portalecinofilo-dog-photo-changed';
const preparedPhotos = new WeakSet<File>();

export const DOG_PHOTO_FALLBACK =
  'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=400';

export function isExternalDogPhoto(value?: string | null) {
  return Boolean(value && /^https?:\/\//i.test(value));
}

export async function resolveDogPhotoUrl(photoPath?: string | null, cacheNonce?: string) {
  if (!photoPath) return null;

  if (isExternalDogPhoto(photoPath)) {
    return photoPath;
  }

  const { data, error } = await supabase.storage
    .from(DOG_PHOTO_BUCKET)
    .createSignedUrl(photoPath, 60 * 60);

  if (error) {
    console.warn('Dog photo signed URL error:', error);
    return null;
  }

  if (!cacheNonce) return data.signedUrl;
  const url = new URL(data.signedUrl);
  url.searchParams.set('cacheNonce', cacheNonce);
  return url.toString();
}

export function validateDogPhotoFile(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Scegli una foto JPG, PNG o WebP.');
  }

  const maxBytes = 8 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error('La foto deve essere inferiore a 8 MB');
  }
}

export async function prepareDogPhoto(file: File, signal?: AbortSignal) {
  validateDogPhotoFile(file);
  if (preparedPhotos.has(file)) return file;
  const blob = await prepareProfileImage(file, 'avatar', 'contain', 50, signal);
  const prepared = new File([blob], 'profile.webp', { type: 'image/webp' });
  preparedPhotos.add(prepared);
  return prepared;
}

export async function uploadDogPhoto(params: {
  file: File;
  ownerId: string;
  dogId: string;
}) {
  const { file, ownerId, dogId } = params;

  const prepared = await prepareDogPhoto(file);

  const path = `${ownerId}/${dogId}/profile`;

  const { error } = await supabase.storage
    .from(DOG_PHOTO_BUCKET)
    .upload(path, prepared, {
      upsert: true,
      contentType: 'image/webp',
      cacheControl: '60',
    });

  if (error) throw error;

  window.dispatchEvent(new CustomEvent(DOG_PHOTO_CHANGED, { detail: path }));

  return path;
}

export async function deleteDogPhoto(photoPath?: string | null) {
  if (!photoPath || isExternalDogPhoto(photoPath)) return;

  const { error } = await supabase.storage
    .from(DOG_PHOTO_BUCKET)
    .remove([photoPath]);

  if (error) throw error;
}
