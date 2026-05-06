import { AuthProvider, useAuth } from './lib/AuthContext';
import { RouterProvider, useRouter } from './lib/RouterContext';
import { Navbar } from './components/Navbar';
import { Chatbot } from './components/Chatbot';
import { HomePage } from './pages/HomePage';
import { SignInPage, SignUpPage } from './pages/AuthPages';
import { SearchPage } from './pages/SearchPage';
import { ProfessionalProfile } from './pages/ProfessionalProfile';
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import { OwnerBookings } from './pages/owner/OwnerBookings';
import { DogsPage } from './pages/owner/DogsPage';
import { ProDashboard } from './pages/pro/ProDashboard';
import { ProBookings } from './pages/pro/ProBookings';
import { ProCRM } from './pages/pro/ProCRM';
import { ProAnalytics } from './pages/pro/ProAnalytics';
import { ProMemberships } from './pages/pro/ProMemberships';
import { ProPasses } from './pages/pro/ProPasses';
import { ProSubscriptions } from './pages/pro/ProSubscriptions';
import { ProCampaigns } from './pages/pro/ProCampaigns';
import { ProSettings } from './pages/pro/ProSettings';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { BecomeProPage } from './pages/BecomeProPage';
function AppShell() {
  const { path, navigate } = useRouter();
  const { user, loading } = useAuth();

  const basePath = path.split('?')[0];
  const queryParams = path.includes('?')
    ? new URLSearchParams(path.split('?')[1])
    : new URLSearchParams();

  const signupRole = queryParams.get('role') === 'professional' ? 'professional' : undefined;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-50"><div className="text-stone-500">Loading...</div></div>;
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
  else if (basePath === '/become-a-pro') content = <BecomeProPage />;
  else if (!user) { navigate('/signin'); return null; }
  else if (basePath === '/admin') content = <AdminDashboard />;
  else if (basePath === '/owner') content = <OwnerDashboard />;
  else if (basePath === '/owner/bookings') content = <OwnerBookings />;
  else if (basePath === '/owner/dogs') content = <DogsPage />;
  else if (basePath === '/pro') content = <ProDashboard />;
  else if (basePath === '/pro/bookings') content = <ProBookings />;
  else if (basePath === '/pro/crm') content = <ProCRM />;
  else if (basePath === '/pro/analytics') content = <ProAnalytics />;
  else if (basePath === '/pro/memberships') content = <ProMemberships />;
  else if (basePath === '/pro/passes') content = <ProPasses />;
  else if (basePath === '/pro/subscriptions') content = <ProSubscriptions />;
  else if (basePath === '/pro/campaigns') content = <ProCampaigns />;
  else if (basePath === '/pro/settings') content = <ProSettings />;
  else content = <HomePage />;

  return (
    <>
      <Navbar />
      {content}
      {user && <Chatbot />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <AppShell />
      </RouterProvider>
    </AuthProvider>
  );
}

export default App;
