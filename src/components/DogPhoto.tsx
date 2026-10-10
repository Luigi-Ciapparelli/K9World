import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { DOG_PHOTO_CHANGED, DOG_PHOTO_FALLBACK, resolveDogPhotoUrl } from '../lib/dogPhotos';

type DogPhotoProps = {
  photoPath?: string | null;
  alt: string;
  className?: string;
  fallbackUrl?: string;
};

export function DogPhoto({ photoPath, alt, className, fallbackUrl = DOG_PHOTO_FALLBACK }: DogPhotoProps) {
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
  return <img src={src} alt={alt} className={className} loading="lazy" decoding="async" onError={() => setFailed(src)} />;
}
