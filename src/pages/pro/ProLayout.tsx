import { ReactNode, useState } from 'react';
import { LayoutDashboard, Calendar, Users, BarChart3, Settings, Menu, X } from 'lucide-react';
import { useRouter } from '../../lib/RouterContext';
import { useAuth } from '../../lib/AuthContext';

export function ProLayout({ children, active }: { children: ReactNode; active: string }) {
  const { navigate } = useRouter();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);

  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/pro' },
    { id: 'bookings', label: 'Richieste', icon: Calendar, path: '/pro/bookings' },
    { id: 'crm', label: 'Clienti', icon: Users, path: '/pro/crm' },
    { id: 'analytics', label: 'Statistiche', icon: BarChart3, path: '/pro/analytics' },
    { id: 'settings', label: 'Profilo e servizi', icon: Settings, path: '/pro/settings' },
  ];

  const activeLabel = nav.find((n) => n.id === active)?.label || 'Area professionista';

  const handleNav = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <div className="bg-stone-50 min-h-[calc(100vh-4rem)] md:grid md:grid-cols-[240px_1fr]">
      <div className="md:hidden sticky top-16 z-30 bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Area professionista</div>
          <div className="text-sm font-semibold text-stone-900">{activeLabel}</div>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 -mr-2 text-stone-700"
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div
          className="md:hidden fixed inset-0 bg-stone-900/40 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`
          fixed md:static top-0 left-0 z-50 md:z-auto
          h-full md:h-auto w-72 md:w-auto
          bg-white border-r border-stone-200 py-6 px-3
          md:min-h-[calc(100vh-4rem)]
          transform transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
          overflow-y-auto
        `}
      >
        <div className="px-3 mb-6 flex items-center justify-between md:block">
          <div>
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">Area professionista</div>
            <div className="text-sm font-semibold text-stone-900 mt-1">{profile?.full_name}</div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="md:hidden p-1 text-stone-500"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="space-y-1">
          {nav.map((n) => {
            const Icon = n.icon;
            const isActive = active === n.id;
            return (
              <button
                key={n.id}
                onClick={() => handleNav(n.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  isActive ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {n.label}
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
