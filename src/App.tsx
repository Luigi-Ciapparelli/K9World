import { lazy, Suspense, type ReactNode } from 'react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { RouterProvider, useRouter } from './lib/RouterContext';
import { Navbar } from './components/Navbar';
import { Chatbot } from './components/Chatbot';
import { Footer } from './components/Footer';
import { continuityEnabled } from './lib/continuity';
import { ThemeProvider } from './lib/ThemeContext';

const HomePage = lazy(() =>
  import('./pages/HomePage').then((module) => ({ default: module.HomePage }))
);
const SignInPage = lazy(() =>
  import('./pages/AuthPages').then((module) => ({ default: module.SignInPage }))
);
const SignUpPage = lazy(() =>
  import('./pages/AuthPages').then((module) => ({ default: module.SignUpPage }))
);
const SearchPage = lazy(() =>
  import('./pages/SearchPage').then((module) => ({ default: module.SearchPage }))
);
const ProfessionalProfile = lazy(() =>
  import('./pages/ProfessionalProfile').then((module) => ({
    default: module.ProfessionalProfile,
  }))
);
const FciGroupPage = lazy(() =>
  import('./pages/FciGroupPage').then((module) => ({ default: module.FciGroupPage }))
);
const BreedPage = lazy(() =>
  import('./pages/BreedPage').then((module) => ({ default: module.BreedPage }))
);
const BreederGuidePage = lazy(() =>
  import('./pages/BreederGuidePage').then((module) => ({
    default: module.BreederGuidePage,
  }))
);
const ImparaHomePage = lazy(() =>
  import('./pages/ImparaHomePage').then((module) => ({
    default: module.ImparaHomePage,
  }))
);
const ImparaLessonPage = lazy(() =>
  import('./pages/ImparaLessonPage').then((module) => ({
    default: module.ImparaLessonPage,
  }))
);
const BeforeDogPage = lazy(() =>
  import('./pages/BeforeDogPage').then((module) => ({ default: module.BeforeDogPage }))
);
const OwnerDashboard = lazy(() =>
  import('./pages/owner/OwnerDashboard').then((module) => ({
    default: module.OwnerDashboard,
  }))
);
const OwnerBookings = lazy(() =>
  import('./pages/owner/OwnerBookings').then((module) => ({
    default: module.OwnerBookings,
  }))
);
const DogsPage = lazy(() =>
  import('./pages/owner/DogsPage').then((module) => ({ default: module.DogsPage }))
);
const DogDetailPage = lazy(() =>
  import('./pages/owner/DogDetailPage').then((module) => ({
    default: module.DogDetailPage,
  }))
);
const ProDashboard = lazy(() =>
  import('./pages/pro/ProDashboard').then((module) => ({
    default: module.ProDashboard,
  }))
);
const ProBookings = lazy(() =>
  import('./pages/pro/ProBookings').then((module) => ({
    default: module.ProBookings,
  }))
);
const ProCalendar = lazy(() =>
  import('./pages/pro/ProCalendar').then((module) => ({ default: module.ProCalendar }))
);
const ProCRM = lazy(() =>
  import('./pages/pro/ProCRM').then((module) => ({ default: module.ProCRM }))
);
const ProAnalytics = lazy(() =>
  import('./pages/pro/ProAnalytics').then((module) => ({
    default: module.ProAnalytics,
  }))
);
const ProSettings = lazy(() =>
  import('./pages/pro/ProSettings').then((module) => ({
    default: module.ProSettings,
  }))
);
const AdminDashboard = lazy(() =>
  import('./pages/admin/AdminDashboard').then((module) => ({
    default: module.AdminDashboard,
  }))
);
const BecomeProPage = lazy(() =>
  import('./pages/BecomeProPage').then((module) => ({
    default: module.BecomeProPage,
  }))
);
const PrivacyPage = lazy(() =>
  import('./pages/LegalPages').then((module) => ({ default: module.PrivacyPage }))
);
const TermsPage = lazy(() =>
  import('./pages/LegalPages').then((module) => ({ default: module.TermsPage }))
);
const CookiePage = lazy(() =>
  import('./pages/LegalPages').then((module) => ({ default: module.CookiePage }))
)
const ProfessionalTermsPage = lazy(() =>
  import('./pages/LegalPages').then((module) => ({ default: module.ProfessionalTermsPage }))
)
const RankingPage = lazy(() =>
  import('./pages/LegalPages').then((module) => ({ default: module.RankingPage }))
)

const ContactPage = lazy(() =>
  import('./pages/LegalPages').then((module) => ({ default: module.ContactPage }))
);
const ContinuityPage = lazy(() => import('./pages/continuity/ContinuityPage').then(module => ({ default: module.ContinuityPage })));
function AppShell() {
  const { path, navigate } = useRouter();
  const { user, profile, loading } = useAuth();

  const basePath = path.split('?')[0];
  const queryParams = path.includes('?')
    ? new URLSearchParams(path.split('?')[1])
    : new URLSearchParams();

  const signupRole = queryParams.get('role') === 'professional' ? 'professional' : undefined;

  const isAdminRoute = basePath === '/admin' || basePath.startsWith('/admin/');
  const isProRoute = basePath === '/pro' || basePath.startsWith('/pro/');
  const isOwnerRoute = basePath === '/owner' || basePath.startsWith('/owner/');
  const isProtectedRoute = isAdminRoute || isProRoute || isOwnerRoute;

  const roleHome =
    profile?.role === 'admin'
      ? '/admin'
      : profile?.role === 'professional'
        ? '/pro'
        : '/owner';

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-50"><div className="text-stone-500">Loading...</div></div>;
  }

  if (isProtectedRoute) {
    if (!user) {
      navigate('/signin');
      return null;
    }

    if (!profile) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50">
          <div className="text-stone-600">Profilo account non disponibile.</div>
        </div>
      );
    }

    const canAccessAdmin = isAdminRoute && profile.role === 'admin';
    const canAccessPro =
      isProRoute && (profile.role === 'professional' || profile.role === 'admin');
    const canAccessOwner =
      isOwnerRoute && (profile.role === 'owner' || profile.role === 'admin');

    if (!canAccessAdmin && !canAccessPro && !canAccessOwner) {
      navigate(roleHome);
      return null;
    }
  }

  let content: ReactNode;

  if (basePath === '/' || basePath === '') content = <HomePage />;
  else if (basePath === '/signin') content = <SignInPage />;
  else if (basePath === '/signup') content = <SignUpPage defaultRole={signupRole} />;
  else if (basePath === '/become-pro') content = <BecomeProPage />;
  else if (basePath === '/search') content = <SearchPage />;
  else if (basePath === '/services') content = <HomePage />;
  else if (basePath.startsWith('/p/')) {
    const id = basePath.slice(3);
    content = <ProfessionalProfile id={id} />;
  }
  else if (basePath.startsWith('/gruppi-fci/')) {
    const group = Number(basePath.slice('/gruppi-fci/'.length));
    content = <FciGroupPage group={group} />;
  }
  else if (basePath.startsWith('/razze/')) {
    const slug = basePath.slice('/razze/'.length);
    content = <BreedPage slug={slug} />;
  }
  else if (basePath === '/scegliere-allevatore') content = <BreederGuidePage />;
  else if (basePath === '/impara') content = <ImparaHomePage />;
  else if (basePath.startsWith('/impara/stage-1/')) {
    const slug = basePath.slice('/impara/stage-1/'.length);
    content = <ImparaLessonPage slug={slug} />;
  }
  else if (basePath === '/prima-del-cane') content = <BeforeDogPage />;
  else if (basePath === '/become-a-pro') content = <BecomeProPage />;
  else if (basePath === '/privacy') content = <PrivacyPage />;
  else if (basePath === '/terms') content = <TermsPage />;
  else if (basePath === '/cookies') content = <CookiePage />;
  else if (basePath === '/professional-terms') content = <ProfessionalTermsPage />;
  else if (basePath === '/ranking') content = <RankingPage />;
  else if (basePath === '/contact') content = <ContactPage />;
  else if (basePath === '/admin') content = <AdminDashboard />;
  else if (basePath === '/owner') content = <OwnerDashboard />;
  else if (basePath === '/owner/relationships' && continuityEnabled) content = <ContinuityPage professional={false} />;
  else if (basePath === '/owner/bookings') content = <OwnerBookings />;
  else if (basePath === '/owner/dogs') content = <DogsPage />;
  else if (basePath.startsWith('/owner/dogs/')) {
    const id = basePath.slice('/owner/dogs/'.length);
    content = <DogDetailPage id={id} />;
  }
  else if (basePath === '/pro') content = <ProDashboard />;
  else if (basePath === '/pro/archive' && continuityEnabled) content = <ContinuityPage professional />;
  else if (basePath === '/pro/bookings') content = <ProBookings />;
  else if (basePath === '/pro/calendar') content = <ProCalendar />;
  else if (basePath === '/pro/crm') content = <ProCRM />;
  else if (basePath === '/pro/analytics') content = <ProAnalytics />;
  else if (basePath === '/pro/settings') content = <ProSettings />;
  else content = <HomePage />;

  const showFooter =
    !basePath.startsWith('/owner') &&
    !basePath.startsWith('/pro') &&
    basePath !== '/admin';

  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center bg-stone-50">
            <div className="text-stone-500">Caricamento...</div>
          </div>
        }
      >
        {content}
      </Suspense>
      {showFooter && <Footer />}
      {user && <Chatbot />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
  <ThemeProvider>
    <RouterProvider>
      <AppShell />
    </RouterProvider>
  </ThemeProvider>
</AuthProvider>
  );
}

export default App;
