import { useEffect, useState } from 'react';
import { DOG_PHOTO_FALLBACK, resolveDogPhotoUrl } from '../lib/dogPhotos';

type DogPhotoProps = {
  photoPath?: string | null;
  alt: string;
  className?: string;
  fallbackUrl?: string;
};

export function DogPhoto({
  photoPath,
  alt,
  className,
  fallbackUrl = DOG_PHOTO_FALLBACK,
}: DogPhotoProps) {
  const [src, setSrc] = useState(fallbackUrl);

  useEffect(() => {
    let active = true;

    setSrc(fallbackUrl);

    resolveDogPhotoUrl(photoPath).then((resolved) => {
      if (active && resolved) setSrc(resolved);
    });

    return () => {
      active = false;
    };
  }, [photoPath, fallbackUrl]);

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setSrc(fallbackUrl)}
    />
  );
}
