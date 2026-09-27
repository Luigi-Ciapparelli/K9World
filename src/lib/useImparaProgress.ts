import { useCallback, useEffect, useState } from 'react';
import { PROGRESS_EVENT, PROGRESS_KEY, readProgress, writeProgress, storageAvailable, type LearningProgress } from './imparaProgress';
export function useImparaProgress() {
  const [progress, setProgress] = useState(readProgress);
  const [saved, setSaved] = useState(storageAvailable);
  useEffect(() => {
    const sync = (event: Event) => {
      if (event instanceof StorageEvent && event.key !== PROGRESS_KEY && event.key !== null) return;
      setProgress(readProgress()); setSaved(storageAvailable());
    };
    window.addEventListener(PROGRESS_EVENT, sync); window.addEventListener('storage', sync);
    return () => { window.removeEventListener(PROGRESS_EVENT, sync); window.removeEventListener('storage', sync); };
  }, []);
  const update = useCallback((fn: (current: LearningProgress) => LearningProgress) => { writeProgress(fn(readProgress())); setProgress(readProgress()); setSaved(storageAvailable()); }, []);
  return { progress, update, saved };
}
