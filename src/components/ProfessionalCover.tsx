import type { ReactNode } from 'react';
import '../profile-media.css';

/** Public profile and editor intentionally share the very same image geometry. */
export function ProfessionalCover({ src, alt = '', size, children, onError }: {
  src?: string; alt?: string; size?: 'mobile' | 'desktop'; children?: ReactNode; onError?: () => void;
}) {
  return <div className="pc-professional-cover" data-size={size}>
    {src ? <img src={src} alt={alt} onError={onError} /> : <span className="pc-cover-no-image">Nessun banner</span>}
    {children}
  </div>;
}
