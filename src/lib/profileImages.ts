import { supabase } from './supabase';

export type ImageKind = 'avatar' | 'cover' | 'client';
export const IMAGE_LIMITS = {
  avatar: { width: 512, height: 512, bytes: 160 * 1024 },
  cover: { width: 1600, height: 600, bytes: 500 * 1024 },
  client: { width: 384, height: 384, bytes: 128 * 1024 },
} as const;
export const imageBucket = (kind: ImageKind) => kind === 'client' ? 'client-portraits' : 'professional-branding';
export const imagePath = (id: string, kind: ImageKind) => `${id}/${kind === 'client' ? 'portrait' : kind}.webp`;

// Inspect dimensions before decoding; input filenames and declared MIME are not trusted.
export function imageDimensions(bytes: Uint8Array): [number, number] {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (at: number, text: string) => text.split('').every((c, i) => bytes[at + i] === c.charCodeAt(0));
  if (bytes.length >= 24 && bytes[0] === 137 && tag(1, 'PNG\r\n\x1a\n') && tag(12, 'IHDR')) return [v.getUint32(16), v.getUint32(20)];
  if (bytes.length >= 30 && tag(0, 'RIFF') && tag(8, 'WEBP')) {
    if (tag(12, 'VP8X')) {
      if (bytes[20] & 2) throw new Error('Scegli un’immagine statica, non un’animazione.');
      const n = (at: number) => 1 + bytes[at] + (bytes[at + 1] << 8) + (bytes[at + 2] << 16);
      return [n(24), n(27)];
    }
    if (tag(12, 'VP8 ') && bytes[23] === 0x9d && bytes[24] === 1 && bytes[25] === 0x2a) return [v.getUint16(26, true) & 16383, v.getUint16(28, true) & 16383];
    if (tag(12, 'VP8L') && bytes[20] === 0x2f) {
      const bits = v.getUint32(21, true);
      return [(bits & 16383) + 1, ((bits >>> 14) & 16383) + 1];
    }
  }
  if (bytes[0] === 255 && bytes[1] === 216) {
    let p = 2;
    while (p + 4 < bytes.length) {
      if (bytes[p++] !== 255) break;
      while (bytes[p] === 255) p++;
      const marker = bytes[p++];
      if (marker === 217 || marker === 218) break;
      const size = v.getUint16(p);
      if (size < 2 || p + size > bytes.length) break;
      if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker) && size >= 7) return [v.getUint16(p + 5), v.getUint16(p + 3)];
      p += size;
    }
  }
  throw new Error('Il file non è un’immagine JPG, PNG o WebP valida.');
}

export async function prepareProfileImage(file: File, kind: ImageKind, fit: 'contain' | 'cover', position = 50) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error('Scegli una foto JPG, PNG o WebP fino a 10 MB.');
  const [width, height] = imageDimensions(new Uint8Array(await file.arrayBuffer()));
  if (!width || !height || width * height > 32_000_000 || width > 16000 || height > 16000) throw new Error('Immagine troppo grande: riducila sotto 32 megapixel e 16.000 pixel per lato.');
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const limit = IMAGE_LIMITS[kind];
    const canvas = document.createElement('canvas');
    // No enlargement: small originals remain small, within the selected aspect ratio.
    const scale = Math.min(1, bitmap.width / limit.width, bitmap.height / limit.height);
    canvas.width = Math.max(1, Math.round(limit.width * scale));
    canvas.height = Math.max(1, Math.round(limit.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Il browser non riesce a preparare l’immagine.');
    ctx.fillStyle = '#f5f1e7'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const ratio = (fit === 'cover' ? Math.max : Math.min)(canvas.width / bitmap.width, canvas.height / bitmap.height);
    const w = bitmap.width * ratio, h = bitmap.height * ratio;
    ctx.drawImage(bitmap, (canvas.width - w) / 2, (canvas.height - h) * Math.max(0, Math.min(100, position)) / 100, w, h);
    for (const quality of [0.86, 0.76, 0.66, 0.56]) {
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', quality));
      if (blob?.type === 'image/webp' && blob.size <= limit.bytes) return blob;
    }
    throw new Error('Questa foto non rientra nel limite dopo la compressione. Scegli una foto meno dettagliata o ritagliala.');
  } finally { bitmap.close(); }
}

export async function saveProfileImage(userId: string, kind: ImageKind, blob: Blob) {
  if (blob.type !== 'image/webp' || blob.size > IMAGE_LIMITS[kind].bytes) throw new Error('Immagine non preparata correttamente.');
  const bucket = supabase.storage.from(imageBucket(kind));
  const path = imagePath(userId, kind);
  const { error } = await bucket.upload(path, blob, { upsert: true, contentType: 'image/webp', cacheControl: '60' });
  if (error) throw error;
  if (kind === 'client') return '';
  const url = bucket.getPublicUrl(path).data.publicUrl + `?v=${Date.now()}`;
  const result = kind === 'avatar'
    ? await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId).select('id').single()
    : await supabase.from('professionals').update({ cover_photo_url: url }).eq('id', userId).select('id').single();
  if (result.error) throw new Error('Foto caricata, ma il collegamento al profilo non è confermato. Premi di nuovo Salva foto.');
  return url;
}

export async function removeProfileImage(userId: string, kind: ImageKind) {
  // Unlink public images first: a deletion error must not leave a broken profile.
  if (kind !== 'client') {
    const result = kind === 'avatar'
      ? await supabase.from('profiles').update({ avatar_url: '' }).eq('id', userId).select('id').single()
      : await supabase.from('professionals').update({ cover_photo_url: '' }).eq('id', userId).select('id').single();
    if (result.error) throw result.error;
  }
  const { error } = await supabase.storage.from(imageBucket(kind)).remove([imagePath(userId, kind)]);
  if (error) throw new Error('Rimozione del file non confermata. Riprova.');
}
