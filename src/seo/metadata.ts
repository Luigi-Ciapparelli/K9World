import { STAGE_1_LESSONS } from '../lib/imparaContent';
import { FCI_GROUP_NAMES, FCI_GROUP_CONTENT } from '../lib/fciGroups';
import breeds from '../../public/data/fci-breeds.json';
import { normalizeRoute, privateRoute } from '../lib/routeUrls';

export const SITE_URL = 'https://www.portalecinofilo.com';
export const SITE_NAME = 'PortaleCinofilo';
export const SOCIAL_IMAGE = `${SITE_URL}/brand/portalecinofilo-lockup.png`;
export type PageMeta = { path: string; title: string; description: string; index: boolean; type?: string; parent?: string };
const pages: PageMeta[] = [
  { path: '/', title: 'PortaleCinofilo | Educazione del cane e professionisti cinofili', description: 'Impara a conoscere i bisogni del cane, scegli con consapevolezza e trova educatori, addestratori e servizi. Cultura cinofila di base gratuita.', index: true },
  { path: '/impara', title: 'Educazione del cane: lezioni gratuite | PortaleCinofilo', description: 'Otto lezioni gratuite su bisogni, comportamento e apprendimento del cane. Letture, attività pratiche, shaping e autoverifiche per i proprietari.', index: true, type: 'CollectionPage' },
  { path: '/prima-del-cane', title: 'Scegliere un cane: parti dalla tua vita | PortaleCinofilo', description: 'Prima di prendere un cane, valuta tempo, abitudini, ambiente e impegno quotidiano. Un percorso orientativo per una scelta consapevole.', index: true },
  { path: '/scegliere-allevatore', title: 'Come scegliere un allevatore di cani | PortaleCinofilo', description: 'Domande, documenti e controlli utili per scegliere un allevatore. Consulta i riferimenti ENCI e valuta salute, selezione e gestione dei cuccioli.', index: true },
  { path: '/search', title: 'Trova educatori e servizi per il cane | PortaleCinofilo', description: 'Cerca un addestratore, una pensione, un dog sitter o altri servizi per il cane. Confronta zona, profilo e competenze prima di contattare il professionista.', index: true, type: 'CollectionPage' },
  { path: '/sport', title: 'Sport cinofili: trova un addestratore | PortaleCinofilo', description: 'Cerca professionisti per disciplina sportiva e zona. Consulta esperienze e risultati, distinguendo dichiarazioni, fonti e informazioni verificate.', index: true, type: 'CollectionPage' },
  { path: '/become-pro', title: 'Strumenti per professionisti cinofili | PortaleCinofilo', description: 'Presenta la tua attività cinofila e gestisci richieste, calendario, clienti e percorsi dei cani. Scopri gli strumenti di PortaleCinofilo.', index: true },
  { path: '/contact', title: 'Contatti | PortaleCinofilo', description: 'Contatta PortaleCinofilo: info@portalecinofilo.com, telefono +39 353 407 7841. Informazioni sul portale e segnalazioni.', index: true, type: 'ContactPage' },
  { path: '/ranking', title: 'Competenze, verifiche e criteri di ricerca | PortaleCinofilo', description: 'Come leggere profili, qualifiche e risultati sportivi su PortaleCinofilo. Dichiarazioni e informazioni verificate hanno significati distinti.', index: true },
  { path: '/privacy', title: 'Informativa privacy | PortaleCinofilo', description: 'Informativa sul trattamento dei dati personali e sui diritti degli utenti di PortaleCinofilo.', index: false },
  { path: '/terms', title: 'Condizioni di utilizzo | PortaleCinofilo', description: 'Condizioni di utilizzo del portale e dei servizi di PortaleCinofilo.', index: false },
  { path: '/cookies', title: 'Cookie e archiviazione locale | PortaleCinofilo', description: 'Informazioni su cookie e archiviazione locale utilizzati da PortaleCinofilo.', index: false },
  { path: '/professional-terms', title: 'Condizioni per professionisti | PortaleCinofilo', description: 'Condizioni per la presenza e l’attività dei professionisti su PortaleCinofilo.', index: false },
  ...STAGE_1_LESSONS.map(lesson => ({ path: `/impara/stage-1/${lesson.slug}`, title: `${lesson.title} | PortaleCinofilo`, description: lesson.summary, index: true, type: 'LearningResource', parent: '/impara' })),
  ...Object.entries(FCI_GROUP_NAMES).map(([group, name]) => ({ path: `/gruppi-fci/${group}`, title: `Gruppo FCI ${group}: ${name} | PortaleCinofilo`, description: FCI_GROUP_CONTENT[Number(group)].intro, index: true, parent: '/prima-del-cane', type: 'CollectionPage' })),
  ...breeds.map(breed => ({ path: `/razze/${breed.slug}`, title: `${breed.name}: gruppo FCI e bisogni | PortaleCinofilo`, description: `Conosci ${breed.name}: classificazione nel gruppo FCI ${breed.fciGroup}, contesto di selezione e domande utili sulla gestione. Con riferimenti ENCI.`, index: true, parent: `/gruppi-fci/${breed.fciGroup}` })),
];
export const PUBLIC_PAGES = pages;
const byPath = new Map(pages.map(page => [page.path, page]));
export function pageMetadata(route: string): PageMeta {
  const [path, query = ''] = normalizeRoute(route).split('?');
  if (path === '/forgot-password' || path === '/reset-password') return { path, title: `${path === '/forgot-password' ? 'Recupera la password' : 'Nuova password'} | PortaleCinofilo`, description: 'Recupera l’accesso al tuo account PortaleCinofilo.', index: false };
  if (privateRoute(path)) return { path, title: 'Area personale | PortaleCinofilo', description: 'Accedi alla tua area personale su PortaleCinofilo.', index: false };
  const known = byPath.get(path);
  if (known) {
    const filters = new URLSearchParams(query);
    const filteredSearch = ['/search', '/sport'].includes(path) && [...filters.keys()].some(key => !['source', 'from', 'topic', 'intent', 'utm_source', 'utm_medium', 'utm_campaign'].includes(key));
    return { ...known, index: known.index && !filteredSearch };
  }
  if (/^\/p\/[a-f0-9-]{36}$/i.test(path)) return { path, title: 'Profilo professionista cinofilo | PortaleCinofilo', description: 'Consulta presentazione, servizi e competenze del professionista su PortaleCinofilo.', index: true };
  return { path, title: 'Pagina non trovata | PortaleCinofilo', description: 'Questo indirizzo non corrisponde a una pagina di PortaleCinofilo.', index: false };
}
export function structuredData(page: PageMeta) {
  if (!page.index) return [];
  const org = { '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: SITE_NAME, url: `${SITE_URL}/`, logo: `${SITE_URL}/brand/portalecinofilo-mark.png`, email: 'info@portalecinofilo.com', telephone: '+393534077841' };
  const data: Record<string, unknown>[] = [org, { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: `${SITE_URL}/`, name: SITE_NAME, inLanguage: 'it-IT', publisher: { '@id': org['@id'] } }, { '@type': page.type || 'WebPage', '@id': `${SITE_URL}${page.path}#page`, url: SITE_URL + page.path, name: page.title, description: page.description, inLanguage: 'it-IT', isPartOf: { '@id': `${SITE_URL}/#website` } }];
  if (page.path !== '/') {
    const crumbs = [{ name: 'Home', path: '/' }];
    if (page.parent) crumbs.push({ name: byPath.get(page.parent)?.title.split(' | ')[0] || 'Approfondimenti', path: page.parent });
    crumbs.push({ name: page.title.split(' | ')[0], path: page.path });
    data.push({ '@type': 'BreadcrumbList', itemListElement: crumbs.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: SITE_URL + item.path })) });
  }
  return { '@context': 'https://schema.org', '@graph': data };
}
export function applyPageMetadata(page: PageMeta) {
  // Clear the initial-render marker: returning to that page must restore its metadata too.
  delete document.documentElement.dataset.seoPath;
  document.documentElement.lang = 'it';
  document.title = page.title;
  const set = (key: string, value: string, property = false) => {
    const attr = property ? 'property' : 'name';
    let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
    if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.append(el); }
    el.content = value;
  };
  set('description', page.description); set('robots', page.index ? 'index, follow, max-image-preview:large' : 'noindex, follow');
  set('og:title', page.title, true); set('og:description', page.description, true); set('og:url', SITE_URL + page.path, true); set('og:image', SOCIAL_IMAGE, true);
  set('og:type', 'website', true); set('og:site_name', SITE_NAME, true); set('og:locale', 'it_IT', true);
  set('twitter:card', 'summary_large_image'); set('twitter:title', page.title); set('twitter:description', page.description); set('twitter:image', SOCIAL_IMAGE);
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.append(link); }
  link.href = SITE_URL + page.path;
  let script = document.getElementById('pc-structured-data');
  if (!script) { script = document.createElement('script'); script.id = 'pc-structured-data'; script.setAttribute('type', 'application/ld+json'); document.head.append(script); }
  script.textContent = JSON.stringify(structuredData(page));
}
