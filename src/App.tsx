import { AuthProvider, useAuth } from './lib/AuthContext';
import { RouterProvider, useRouter } from './lib/RouterContext';
import { Navbar } from './components/Navbar';
import { Chatbot } from './components/Chatbot';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { SignInPage, SignUpPage } from './pages/AuthPages';
import { SearchPage } from './pages/SearchPage';
import { ProfessionalProfile } from './pages/ProfessionalProfile';
import { FciGroupPage } from './pages/FciGroupPage';
import { BreedPage } from './pages/BreedPage';
import { BreederGuidePage } from './pages/BreederGuidePage';
import { BeforeDogPage } from './pages/BeforeDogPage';
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import { OwnerBookings } from './pages/owner/OwnerBookings';
import { DogsPage } from './pages/owner/DogsPage';
import { DogDetailPage } from './pages/owner/DogDetailPage';
import { ProDashboard } from './pages/pro/ProDashboard';
import { ProBookings } from './pages/pro/ProBookings';
import { ProCRM } from './pages/pro/ProCRM';
import { ProAnalytics } from './pages/pro/ProAnalytics';
import { ProSettings } from './pages/pro/ProSettings';
import { ThemeProvider } from './lib/ThemeContext';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { BecomeProPage } from './pages/BecomeProPage';
import { PrivacyPage, TermsPage, ContactPage } from './pages/LegalPages';
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

  let content: React.ReactNode;

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
  else if (basePath === '/prima-del-cane') content = <BeforeDogPage />;
  else if (basePath === '/become-a-pro') content = <BecomeProPage />;
  else if (basePath === '/privacy') content = <PrivacyPage />;
  else if (basePath === '/terms') content = <TermsPage />;
  else if (basePath === '/contact') content = <ContactPage />;
  else if (basePath === '/admin') content = <AdminDashboard />;
  else if (basePath === '/owner') content = <OwnerDashboard />;
  else if (basePath === '/owner/bookings') content = <OwnerBookings />;
  else if (basePath === '/owner/dogs') content = <DogsPage />;
  else if (basePath.startsWith('/owner/dogs/')) {
    const id = basePath.slice('/owner/dogs/'.length);
    content = <DogDetailPage id={id} />;
  }
  else if (basePath === '/pro') content = <ProDashboard />;
  else if (basePath === '/pro/bookings') content = <ProBookings />;
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
      {content}
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
