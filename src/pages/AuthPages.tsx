import { useEffect, useState } from 'react';
import { PawPrint, Mail, Lock, User, Phone, Check } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/RouterContext';
import type { ProfessionalType, Role } from '../lib/types';
import { loadFciBreeds, normalizeBreedSearch, type FciBreed } from '../lib/fciBreeds';

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
    <AuthFrame title="Bentornato" subtitle="Accedi al tuo account PawConnect">
      <form onSubmit={submit} className="space-y-4">
        <Field icon={<Mail className="w-4 h-4" />} type="email" placeholder="Email" value={email} onChange={setEmail} />
        <Field icon={<Lock className="w-4 h-4" />} type="password" placeholder="Password" value={password} onChange={setPassword} />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button disabled={loading} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50">
          {loading ? 'Signing in...' : 'Accedi'}
        </button>
        <p className="text-sm text-stone-600 text-center">
          Non hai un account? <button type="button" onClick={() => navigate('/signup')} className="text-emerald-700 font-semibold">Registrati</button>
        </p>
      </form>
    </AuthFrame>
  );
}

export function SignUpPage({ defaultRole }: { defaultRole?: Role }) {
  const [step, setStep] = useState<1 | 2 | 3>(defaultRole ? 2 : 1);
  const [role, setRole] = useState<Role>(defaultRole || 'owner');
  const [professionalType, setProfessionalType] = useState<ProfessionalType>('walker');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [dogName, setDogName] = useState('');
  const [dogBreed, setDogBreed] = useState('');
  const [breeds, setBreeds] = useState<FciBreed[]>([]);
  const [selectedBreed, setSelectedBreed] = useState<FciBreed | null>(null);
  const [breedMenuOpen, setBreedMenuOpen] = useState(false);
  const [dogAge, setDogAge] = useState('');
  const [dogWeight, setDogWeight] = useState('');
  const [dogVaccinated, setDogVaccinated] = useState(false);
  const [dogReactive, setDogReactive] = useState(false);
  const [dogNotes, setDogNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { navigate } = useRouter();

  useEffect(() => {
    loadFciBreeds()
      .then(setBreeds)
      .catch((err) => console.error('FCI breeds load error:', err));
  }, []);

  const normalizedBreed = normalizeBreedSearch(dogBreed);

  const breedSuggestions =
    normalizedBreed.length >= 2
      ? breeds
          .filter((breed) =>
            normalizeBreedSearch(breed.name).includes(normalizedBreed)
          )
          .sort((a, b) => {
            const aStarts = normalizeBreedSearch(a.name).startsWith(normalizedBreed);
            const bStarts = normalizeBreedSearch(b.name).startsWith(normalizedBreed);

            if (aStarts !== bStarts) return aStarts ? -1 : 1;
            return a.name.localeCompare(b.name, 'it');
          })
          .slice(0, 8)
      : [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !fullName || !phone) {
      setError('Tutti i campi sono obbligatori');
      return;
    }

    if (role === 'owner' && step === 2) {
      setStep(3);
      return;
    }

    if (role === 'owner' && (!dogName.trim() || !dogBreed.trim())) {
      setError('Inserisci almeno nome e razza del cane');
      return;
    }

    if (
      role === 'owner' &&
      dogBreed !== 'Meticcio / altra razza' &&
      !selectedBreed
    ) {
      setError('Seleziona la razza dai suggerimenti oppure scegli Meticcio / altra razza');
      return;
    }

    setLoading(true);

    const { error, needsEmailConfirmation } = await signUp({
      email,
      password,
      fullName,
      phone,
      role,
      professionalType,
      dogName,
      dogBreed,
      dogAge,
      dogWeight,
      dogBreedSlug: selectedBreed?.slug,
      dogFciGroup: selectedBreed?.fciGroup,
      dogVaccinated,
      dogReactive,
      dogNotes,
    });

    setLoading(false);

    if (error) {
      setError(error);
      return;
    }

    if (needsEmailConfirmation) {
      alert('Account creato. Controlla la tua email per confermare l’indirizzo, poi accedi a PawConnect.');
      navigate('/signin');
      return;
    }

    navigate(role === 'professional' ? '/pro' : '/owner');
  };

  if (step === 1) {
    return (
      <AuthFrame title="Entra in PawConnect" subtitle="Come vuoi usare la piattaforma?">
        <div className="space-y-3">
          <RoleCard active={role === 'owner'} onClick={() => setRole('owner')} title="Sono proprietario di un cane" subtitle="Voglio trovare servizi affidabili per il mio cane" />
          <RoleCard active={role === 'professional'} onClick={() => setRole('professional')} title="Sono un professionista" subtitle="Voglio offrire servizi e ricevere richieste" />
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
            Continua
          </button>
          <p className="text-sm text-stone-600 text-center">
            Hai già un account? <button type="button" onClick={() => navigate('/signin')} className="text-emerald-700 font-semibold">Accedi</button>
          </p>
        </div>
      </AuthFrame>
    );
  }

  if (step === 3 && role === 'owner') {
    return (
      <AuthFrame
        title="Presentaci il tuo cane"
        subtitle="Un ultimo passo per personalizzare PawConnect"
      >
        <form onSubmit={submit} className="space-y-4">
          <Field
            icon={<PawPrint className="w-4 h-4" />}
            placeholder="Nome del cane"
            value={dogName}
            onChange={setDogName}
          />

          <div className="relative">
            <div className="flex items-center border border-stone-300 rounded-xl px-3 focus-within:ring-2 focus-within:ring-emerald-500">
              <PawPrint className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                type="text"
                value={dogBreed}
                onFocus={() => {
                  if (dogBreed.trim().length >= 2) setBreedMenuOpen(true);
                }}
                onChange={(e) => {
                  setDogBreed(e.target.value);
                  setSelectedBreed(null);
                  setBreedMenuOpen(true);
                }}
                placeholder="Razza, es. Rottweiler"
                autoComplete="off"
                className="w-full px-3 py-3 outline-none bg-transparent"
              />
            </div>

            {breedMenuOpen && dogBreed.trim().length >= 2 && (
              <div className="absolute z-30 left-0 right-0 mt-2 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden max-h-72 overflow-y-auto">
                {breedSuggestions.map((breed) => (
                  <button
                    key={breed.slug}
                    type="button"
                    onClick={() => {
                      setDogBreed(breed.name);
                      setSelectedBreed(breed);
                      setBreedMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-emerald-50 border-b border-stone-100 last:border-0"
                  >
                    <span className="block font-semibold text-stone-900">
                      {breed.name}
                    </span>
                    <span className="block text-xs text-stone-500 mt-0.5">
                      Gruppo FCI {breed.fciGroup} · {breed.fciGroupName}
                    </span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setDogBreed('Meticcio / altra razza');
                    setSelectedBreed(null);
                    setBreedMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-stone-50"
                >
                  <span className="block font-semibold text-stone-800">
                    Meticcio / altra razza
                  </span>
                  <span className="block text-xs text-stone-500">
                    Nessun gruppo FCI
                  </span>
                </button>
              </div>
            )}

            {selectedBreed && (
              <div className="mt-2 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                <p className="text-sm font-semibold text-emerald-800">
                  Gruppo FCI {selectedBreed.fciGroup}
                </p>
                <p className="text-xs text-stone-600 mt-0.5">
                  {selectedBreed.fciGroupName}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field
              icon={<PawPrint className="w-4 h-4" />}
              type="number"
              placeholder="Età"
              value={dogAge}
              onChange={setDogAge}
            />

            <Field
              icon={<PawPrint className="w-4 h-4" />}
              type="number"
              placeholder="Peso (kg)"
              value={dogWeight}
              onChange={setDogWeight}
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={dogVaccinated}
                onChange={(e) => setDogVaccinated(e.target.checked)}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-semibold text-stone-800">
                  Vaccinazioni in regola
                </span>
                <span className="text-xs text-stone-500">
                  Puoi aggiornare questa informazione in qualsiasi momento.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={dogReactive}
                onChange={(e) => setDogReactive(e.target.checked)}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-semibold text-stone-800">
                  Può essere reattivo con altri cani
                </span>
                <span className="text-xs text-stone-500">
                  Serve ad aiutare il professionista a prepararsi correttamente.
                </span>
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              Cosa dovremmo sapere di lui?
            </label>
            <textarea
              value={dogNotes}
              onChange={(e) => setDogNotes(e.target.value)}
              rows={4}
              placeholder="Carattere, esigenze particolari o altre informazioni utili..."
              className="w-full border border-stone-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 py-3 rounded-xl border border-stone-300 font-semibold"
            >
              Indietro
            </button>

            <button
              disabled={loading}
              className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {loading ? 'Creazione...' : 'Crea account'}
            </button>
          </div>
        </form>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame title="Crea il tuo account" subtitle="Verifichiamo email e telefono per aumentare la sicurezza">
      <form onSubmit={submit} className="space-y-4">
        <Field icon={<User className="w-4 h-4" />} placeholder="Nome e cognome" value={fullName} onChange={setFullName} />
        <Field icon={<Mail className="w-4 h-4" />} type="email" placeholder="Email" value={email} onChange={setEmail} />
        <Field icon={<Phone className="w-4 h-4" />} type="tel" placeholder="Telefono" value={phone} onChange={setPhone} />
        <Field icon={<Lock className="w-4 h-4" />} type="password" placeholder="Password" value={password} onChange={setPassword} />
        <div className="flex items-center gap-2 text-xs text-stone-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
          <Check className="w-4 h-4 text-amber-600" /> Dopo la registrazione potrai verificare email e telefono.
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-stone-300 font-semibold">Indietro</button>
          <button disabled={loading} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50">
            {loading ? 'Creazione...' : 'Crea account'}
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
