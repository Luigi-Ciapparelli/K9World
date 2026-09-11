import { supabase } from './supabase';

export const DOG_PHOTO_BUCKET = 'dog-photos';

export const DOG_PHOTO_FALLBACK =
  'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=400';

export function isExternalDogPhoto(value?: string | null) {
  return Boolean(value && /^https?:\/\//i.test(value));
}

export async function resolveDogPhotoUrl(photoPath?: string | null) {
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

  return data.signedUrl;
}

export function validateDogPhotoFile(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Seleziona un file immagine');
  }

  const maxBytes = 8 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error('La foto deve essere inferiore a 8 MB');
  }
}

export async function uploadDogPhoto(params: {
  file: File;
  ownerId: string;
  dogId: string;
}) {
  const { file, ownerId, dogId } = params;

  validateDogPhotoFile(file);

  const path = `${ownerId}/${dogId}/profile`;

  const { error } = await supabase.storage
    .from(DOG_PHOTO_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: '3600',
    });

  if (error) throw error;

  return path;
}

export async function deleteDogPhoto(photoPath?: string | null) {
  if (!photoPath || isExternalDogPhoto(photoPath)) return;

  const { error } = await supabase.storage
    .from(DOG_PHOTO_BUCKET)
    .remove([photoPath]);

  if (error) throw error;
}
