import { renderToString } from 'react-dom/server';
import type { ReactNode } from 'react';
import { AuthProvider } from '../lib/AuthContext';
import { RouterProvider } from '../lib/RouterContext';
import { ThemeProvider } from '../lib/ThemeContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { HomePage } from '../pages/HomePage';
import { ImparaHomePage } from '../pages/ImparaHomePage';
import { ImparaLessonPage } from '../pages/ImparaLessonPage';
import { BeforeDogPage } from '../pages/BeforeDogPage';
import { BreederGuidePage } from '../pages/BreederGuidePage';
import { FciGroupPage } from '../pages/FciGroupPage';
import { BreedPage } from '../pages/BreedPage';
import { SearchPage } from '../pages/SearchPage';
import { BecomeProPage } from '../pages/BecomeProPage';
import { PrivacyPage, TermsPage, CookiePage, ProfessionalTermsPage, RankingPage, ContactPage } from '../pages/LegalPages';
import { NotFoundPage } from '../pages/NotFoundPage';
import breeds from '../../public/data/fci-breeds.json';
export { PUBLIC_PAGES, pageMetadata, SITE_URL, SOCIAL_IMAGE, structuredData } from './metadata';

/** Build-time only: guest, no session, no effects, no API/Storage request. */
export function renderPublicPage(path: string) {
  const components: Record<string, ReactNode> = {
    '/': <HomePage />, '/impara': <ImparaHomePage />, '/prima-del-cane': <BeforeDogPage />,
    '/scegliere-allevatore': <BreederGuidePage />, '/search': <SearchPage />, '/sport': <SearchPage sport />, '/esposizioni': <SearchPage exhibitions />,
    '/become-pro': <BecomeProPage />, '/contact': <ContactPage />, '/ranking': <RankingPage />,
    '/privacy': <PrivacyPage />, '/terms': <TermsPage />, '/cookies': <CookiePage />, '/professional-terms': <ProfessionalTermsPage />,
  };
  let content = components[path];
  if (path.startsWith('/impara/stage-1/')) content = <ImparaLessonPage slug={path.slice('/impara/stage-1/'.length)} />;
  if (path.startsWith('/gruppi-fci/')) {
    const group = Number(path.split('/').slice(-1)[0]);
    content = <FciGroupPage group={group} initialBreeds={breeds.filter(b => b.fciGroup === group).sort((a, b) => a.name.localeCompare(b.name, 'it'))} />;
  }
  if (path.startsWith('/razze/')) {
    const slug = path.slice('/razze/'.length);
    content = <BreedPage slug={slug} initialBreed={breeds.find(b => b.slug === slug)} />;
  }
  return renderToString(<AuthProvider><ThemeProvider><RouterProvider initialPath={path}><Navbar />{content || <NotFoundPage />}<Footer /></RouterProvider></ThemeProvider></AuthProvider>);
}
