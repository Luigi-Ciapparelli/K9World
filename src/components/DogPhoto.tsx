import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { DOG_PHOTO_CHANGED, DOG_PHOTO_FALLBACK, resolveDogPhotoUrl } from '../lib/dogPhotos';

type DogPhotoProps = {
  photoPath?: string | null;
  alt: string;
  className?: string;
  fallbackUrl?: string;
  silhouette?: boolean;
};

export function DogPhoto({ photoPath, alt, className, fallbackUrl = DOG_PHOTO_FALLBACK, silhouette = false }: DogPhotoProps) {
  const { user } = useAuth();
  const [revision, setRevision] = useState('');
  const [image, setImage] = useState<{ key: string; src: string }>({ key: '', src: '' });
  const [failed, setFailed] = useState('');
  const key = `${user?.id || ''}:${photoPath || ''}:${revision}`;

  useEffect(() => {
    const changed = (event: Event) => {
      if ((event as CustomEvent).detail === photoPath) setRevision(crypto.randomUUID());
    };
    window.addEventListener(DOG_PHOTO_CHANGED, changed);
    return () => window.removeEventListener(DOG_PHOTO_CHANGED, changed);
  }, [photoPath]);

  useEffect(() => {
    let active = true;
    if (!user || !photoPath) return;
    void resolveDogPhotoUrl(photoPath, revision).then(src => {
      if (active) setImage({ key, src: src || fallbackUrl });
    }).catch(() => { if (active) setImage({ key, src: fallbackUrl }); });
    return () => { active = false; };
  }, [key, user?.id, photoPath, revision, fallbackUrl]);

  const src = image.key === key && image.src && failed !== image.src ? image.src : fallbackUrl;
  if (silhouette && src === fallbackUrl) return <span role="img" aria-label={`Foto non disponibile: ${alt}`} className={`${className || ''} pc-dog-silhouette`}>
    <svg aria-hidden="true" viewBox="0 0 64 64" fill="currentColor"><path d="M6 42c3-2 7-7 8-13l7 3c6 1 12 0 16-3l4-9 5-7 2 7 5-2 1 5 6 3-1 5-8 2-4 8-1 12h-5l-1-10-10 1-4 9h-5l2-12-5-2-4 5H8z"/></svg>
  </span>;
  return <img src={src} alt={alt} className={className} loading="lazy" decoding="async" onError={() => setFailed(src)} />;
}
