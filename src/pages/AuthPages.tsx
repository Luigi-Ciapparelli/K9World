import { useState } from 'react';
import { PawPrint, Mail, Lock, User, Phone, Check } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/RouterContext';
import type { ProfessionalType, Role } from '../lib/types';

export function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { navigate } = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) setError(error);
    else navigate('/owner');
  };

  return (
    <AuthFrame title="Welcome back" subtitle="Sign in to your PawConnect account">
      <form onSubmit={submit} className="space-y-4">
        <Field icon={<Mail className="w-4 h-4" />} type="email" placeholder="Email" value={email} onChange={setEmail} />
        <Field icon={<Lock className="w-4 h-4" />} type="password" placeholder="Password" value={password} onChange={setPassword} />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button disabled={loading} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50">
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <p className="text-sm text-stone-600 text-center">
          No account? <button type="button" onClick={() => navigate('/signup')} className="text-emerald-700 font-semibold">Sign up</button>
        </p>
      </form>
    </AuthFrame>
  );
}

export function SignUpPage({ defaultRole }: { defaultRole?: Role }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role>(defaultRole || 'owner');
  const [professionalType, setProfessionalType] = useState<ProfessionalType>('walker');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { navigate } = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password || !fullName || !phone) {
      setError('All fields are required');
      return;
    }
    setLoading(true);
    const { error } = await signUp({ email, password, fullName, phone, role, professionalType });
    setLoading(false);
    if (error) setError(error);
    else navigate(role === 'professional' ? '/pro' : '/owner');
  };

  if (step === 1) {
    return (
      <AuthFrame title="Join PawConnect" subtitle="How do you want to use the platform?">
        <div className="space-y-3">
          <RoleCard active={role === 'owner'} onClick={() => setRole('owner')} title="I'm a dog owner" subtitle="Find trusted care for my dog" />
          <RoleCard active={role === 'professional'} onClick={() => setRole('professional')} title="I'm a professional" subtitle="Offer services and grow my business" />
          {role === 'professional' && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              {(['walker','sitter','trainer','groomer','boarding'] as ProfessionalType[]).map((t) => (
                <button key={t} onClick={() => setProfessionalType(t)} className={`py-2 rounded-lg text-sm capitalize border ${professionalType === t ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-stone-200 text-stone-600'}`}>
                  {t}
                </button>
              ))}
            </div>
          )}
          <button onClick={() => setStep(2)} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition mt-4">
            Continue
          </button>
          <p className="text-sm text-stone-600 text-center">
            Already have an account? <button type="button" onClick={() => navigate('/signin')} className="text-emerald-700 font-semibold">Sign in</button>
          </p>
        </div>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame title="Create your account" subtitle="We verify email and phone to keep the community safe">
      <form onSubmit={submit} className="space-y-4">
        <Field icon={<User className="w-4 h-4" />} placeholder="Full name" value={fullName} onChange={setFullName} />
        <Field icon={<Mail className="w-4 h-4" />} type="email" placeholder="Email (we verify it)" value={email} onChange={setEmail} />
        <Field icon={<Phone className="w-4 h-4" />} type="tel" placeholder="Phone number (we verify it)" value={phone} onChange={setPhone} />
        <Field icon={<Lock className="w-4 h-4" />} type="password" placeholder="Password (min 6 chars)" value={password} onChange={setPassword} />
        <div className="flex items-center gap-2 text-xs text-stone-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
          <Check className="w-4 h-4 text-amber-600" /> After signup you will verify your email and phone with a 6-digit code.
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-stone-300 font-semibold">Back</button>
          <button disabled={loading} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50">
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </div>
      </form>
    </AuthFrame>
  );
}

function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-12 bg-stone-50">
      <div className="max-w-md w-full">
        <div className="flex flex-col items-center mb-6">
          <PawPrint className="w-10 h-10 text-emerald-600 mb-2" />
          <h1 className="text-2xl font-bold text-stone-900">{title}</h1>
          <p className="text-stone-600 text-sm mt-1">{subtitle}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">{children}</div>
      </div>
    </div>
  );
}

function Field({ icon, type = 'text', placeholder, value, onChange }: { icon: React.ReactNode; type?: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">{icon}</div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-3 py-3 border border-stone-300 rounded-xl text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      />
    </div>
  );
}

function RoleCard({ active, onClick, title, subtitle }: { active: boolean; onClick: () => void; title: string; subtitle: string }) {
  return (
    <button onClick={onClick} className={`w-full text-left p-4 rounded-xl border-2 transition ${active ? 'border-emerald-600 bg-emerald-50' : 'border-stone-200 hover:border-stone-300'}`}>
      <div className="font-semibold text-stone-900">{title}</div>
      <div className="text-sm text-stone-600 mt-0.5">{subtitle}</div>
    </button>
  );
}
