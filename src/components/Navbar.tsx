import { useState } from 'react';
import { PawPrint, LogOut, User, AlertCircle, Menu, X } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/RouterContext';

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { navigate } = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDashboard = () => {
    if (profile?.role === 'professional') navigate('/pro');
    else navigate('/owner');
    setMobileOpen(false);
  };

  const go = (p: string) => {
    navigate(p);
    setMobileOpen(false);
  };

  const needsVerification = user && profile && (!profile.email_verified || !profile.phone_verified);

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button onClick={() => go('/')} className="flex items-center gap-2 group">
          <PawPrint className="w-7 h-7 text-emerald-600 group-hover:rotate-12 transition" />
          <span className="text-xl font-bold text-stone-900">PawConnect</span>
        </button>

        <div className="hidden md:flex items-center gap-6 text-sm text-stone-700">
          <button onClick={() => go('/search')} className="hover:text-emerald-600 transition">Trova un professionista</button>
          <button onClick={() => go('/become-a-pro')} className="hover:text-emerald-600 transition">Diventa professionista</button>
          <button onClick={() => go('/?section=services')} className="hover:text-emerald-600 transition">Servizi</button>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <button onClick={handleDashboard} className="text-sm text-stone-700 hover:text-emerald-600 flex items-center gap-1.5">
                <User className="w-4 h-4" /> {profile?.full_name || 'Dashboard'}
              </button>
              <button onClick={async () => { await signOut(); go('/'); }} className="text-stone-500 hover:text-stone-900" title="Esci">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => go('/signin')} className="text-sm text-stone-700 hover:text-emerald-600 transition">Accedi</button>
              <button onClick={() => go('/signup')} className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-full hover:bg-emerald-700 transition">Registrati</button>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 -mr-2 text-stone-700 hover:text-emerald-600"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white">
          <div className="px-4 py-3 flex flex-col gap-1 text-sm">
            <button onClick={() => go('/search')} className="text-left px-3 py-2.5 rounded-lg hover:bg-stone-50 text-stone-700">Trova un professionista</button>
            <button onClick={() => go('/become-a-pro')} className="text-left px-3 py-2.5 rounded-lg hover:bg-stone-50 text-stone-700">Diventa professionista</button>
            <button onClick={() => go('/?section=services')} className="text-left px-3 py-2.5 rounded-lg hover:bg-stone-50 text-stone-700">Servizi</button>
            <div className="h-px bg-stone-200 my-2" />
            {user ? (
              <>
                <button onClick={handleDashboard} className="text-left px-3 py-2.5 rounded-lg hover:bg-stone-50 text-stone-700 flex items-center gap-2">
                  <User className="w-4 h-4" /> {profile?.full_name || 'Dashboard'}
                </button>
                <button onClick={async () => { await signOut(); go('/'); }} className="text-left px-3 py-2.5 rounded-lg hover:bg-stone-50 text-stone-700 flex items-center gap-2">
                  <LogOut className="w-4 h-4" /> Esci
                </button>
              </>
            ) : (
              <>
                <button onClick={() => go('/signin')} className="text-left px-3 py-2.5 rounded-lg hover:bg-stone-50 text-stone-700">Accedi</button>
                <button onClick={() => go('/signup')} className="text-left px-3 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-center hover:bg-emerald-700">Registrati</button>
              </>
            )}
          </div>
        </div>
      )}

      {needsVerification && (
        <button
          onClick={handleDashboard}
          className="w-full bg-amber-50 border-t border-amber-200 text-amber-800 text-xs sm:text-sm py-2 px-4 flex items-center justify-center gap-2 hover:bg-amber-100 transition"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            Please verify your {!profile?.email_verified && !profile?.phone_verified
              ? 'email and phone'
              : !profile?.email_verified ? 'email' : 'phone'} to activate your account.
          </span>
          <span className="font-semibold underline hidden sm:inline">Verify now</span>
        </button>
      )}
    </nav>
  );
}
