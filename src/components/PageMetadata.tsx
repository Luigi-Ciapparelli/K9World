import { useEffect } from 'react';
import { useRouter } from '../lib/RouterContext';
export function PageMetadata() {
  const { path } = useRouter();
  useEffect(() => {
    // Initial public HTML already has its metadata. Load the catalog only on client navigation.
    if (document.documentElement.dataset.seoPath === path) return;
    let active = true;
    void import('../seo/metadata').then(({ applyPageMetadata, pageMetadata }) => {
      if (active) applyPageMetadata(pageMetadata(path));
    });
    return () => { active = false; };
  }, [path]);
  return null;
}
