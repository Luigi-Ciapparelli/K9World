// Only these functional data can be cleared here. Never enumerate/delete Auth keys.
export const BROWSER_DATA_EVENT = 'pc-browser-data-cleared';
export const THEME_KEY = 'pawconnect-theme';
export const BEFORE_DOG_KEY = 'pawconnect-before-dog-v1';
export const BEFORE_DOG_LEGACY_DRAFT_KEY = 'portalecinofilo-before-dog-share-draft-v1';
export const TOUR_PREFIX = 'pc-pro-explored-v1:';
export const LOCAL_PROGRESS_KEY = 'portalecinofilo-impara-v3';
export const LEGACY_PROGRESS_KEY = 'pawconnect-impara-stage1-v2';

export const browserDataGroups = [
  { id: 'learning', title: 'Appunti e progressi di Impara', action: 'Cancella dati Impara', description: 'Elimina letture, esercizi, quiz e appunti di questo browser. Prima puoi esportare il quaderno dalla pagina Impara.' },
  { id: 'before-dog', title: 'Test di scelta del cane', action: 'Cancella risposte al test', description: 'Elimina le risposte locali e le bozze lasciate dalle versioni precedenti del test.' },
  { id: 'theme', title: 'Tema chiaro o scuro', action: 'Ripristina tema automatico', description: 'Rimuove la scelta salvata e torna a seguire il tema del dispositivo.' },
  { id: 'tours', title: 'Guida agli strumenti professionali', action: 'Azzera guida agli strumenti', description: 'Azzera gli strumenti segnati come esplorati, per gli account usati in questo browser. I profili professionali restano invariati.' },
  { id: 'cache', title: 'Cache pubblica del sito', action: 'Svuota cache pubblica', description: 'Elimina le copie offline di immagini e file pubblici. Il sito potrà scaricarli di nuovo durante l’uso.' },
] as const;
export type BrowserDataGroup = typeof browserDataGroups[number]['id'];

export async function clearBrowserData(group: BrowserDataGroup): Promise<void> {
  if (group === 'cache') {
    if (!('caches' in window)) throw new Error('Cache non accessibile');
    const names = await window.caches.keys();
    await Promise.all(names.filter(name => /^(k9world-|portalecinofilo-)/.test(name)).map(name => window.caches.delete(name)));
  } else {
    const storage = window.localStorage;
    const keys = group === 'learning' ? [LOCAL_PROGRESS_KEY, LEGACY_PROGRESS_KEY]
      : group === 'before-dog' ? [BEFORE_DOG_KEY, BEFORE_DOG_LEGACY_DRAFT_KEY]
      : group === 'theme' ? [THEME_KEY]
      : Object.keys(storage).filter(key => key.startsWith(TOUR_PREFIX));
    for (const key of keys) storage.removeItem(key);
  }
  window.dispatchEvent(new CustomEvent(BROWSER_DATA_EVENT, { detail: group }));
}
