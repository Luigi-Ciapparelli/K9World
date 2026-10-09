import { OwnerPortraitEditor } from '../components/ClientPortrait';
import { AccountContacts } from '../components/AccountContacts';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/RouterContext';
export function AccountContactsPage() {
  const { user,profile } = useAuth();
  const { navigate } = useRouter();
  return <main className="mx-auto max-w-2xl px-4 py-10">
    <button className="mb-5 font-semibold text-emerald-800 underline" onClick={()=>navigate(profile?.role==='professional' ? '/pro' : profile?.role==='admin' ? '/admin' : '/owner')}>Torna alla tua area</button>
    <h1 className="mb-3 text-3xl font-bold">Email e telefono</h1>
    <OwnerPortraitEditor key={user?.id} />
    {profile?.role === 'professional' && <button className="mb-5 text-emerald-800 underline" onClick={() => navigate('/pro/settings?step=appearance')}>Modifica foto e banner professionali</button>}
    <AccountContacts key={user?.id}/>
  </main>;
}
