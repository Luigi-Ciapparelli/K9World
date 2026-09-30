import { useEffect, useState } from 'react';
import { PawPrint, Mail, Lock, User, Phone, Check } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/RouterContext';
import type { ProfessionalType, Role } from '../lib/types';
import { loadFciBreeds, normalizeBreedSearch, type FciBreed } from '../lib/fciBreeds';
import { bookingAuthPath, bookingDestination } from '../lib/bookingEntry';
import { supabase } from '../lib/supabase';

export function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationInfo, setConfirmationInfo] = useState('');
  const [resending, setResending] = useState(false);
  const { signIn } = useAuth();
  const { navigate, path } = useRouter();
  const destination = bookingDestination(path);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error, role } = await signIn(email.trim(), password);
      if (error) {
        setError(error);
        return;
      }
      navigate(role === 'admin' ? '/admin' : role === 'professional' ? '/pro' : destination || '/owner');
    } catch {
      setError('Accesso non riuscito. Controlla la connessione e riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame title="Bentornato" subtitle={destination ? 'Accedi per continuare la richiesta al professionista scelto.' : 'Accedi al tuo account PortaleCinofilo'}>
      <form onSubmit={submit} className="space-y-4">
        <Field icon={<Mail className="w-4 h-4" />} type="email" placeholder="Email" value={email} onChange={setEmail} autoComplete="username" required />
        <Field icon={<Lock className="w-4 h-4" />} type="password" placeholder="Password" value={password} onChange={setPassword} autoComplete="current-password" required />
        <button type="button" onClick={() => navigate('/forgot-password')} className="text-sm font-semibold text-emerald-700 underline underline-offset-4">Password dimenticata?</button>
        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
        <button disabled={loading} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50">
          {loading ? 'Accesso...' : 'Accedi'}
        </button>
        <p className="text-sm text-stone-600 text-center">
          Non hai un account? <button type="button" onClick={() => navigate(bookingAuthPath('signup', destination))} className="text-emerald-700 font-semibold">Registrati</button>
        </p>
        <div className="border-t border-stone-200 pt-4 text-sm text-stone-600">
          <p>Non hai ricevuto la conferma? Inserisci la tua email nel campo sopra.</p>
          <button type="button" disabled={resending || !email.trim()} className="mt-2 font-semibold text-emerald-700 underline disabled:opacity-50" onClick={async () => {
            if (resending) return;
            setResending(true); setConfirmationInfo('');
            try {
              const result = await supabase.auth.resend({ type:'signup', email:email.trim(), options:{emailRedirectTo:window.location.origin+'/account/contacts'} });
              setConfirmationInfo(result.error ? 'Invio non riuscito. Attendi un minuto e riprova; se persiste, contatta info@portalecinofilo.com.' : 'Se l’indirizzo è in attesa di conferma, riceverai una nuova email. Controlla anche lo spam.');
            } catch { setConfirmationInfo('Invio non confermato. Controlla la connessione e riprova.'); }
            finally { setResending(false); }
          }}>{resending ? 'Invio in corso…' : 'Reinvia email di conferma'}</button>
          {confirmationInfo && <p role="status" className="mt-2">{confirmationInfo}</p>}
        </div>
      </form>
    </AuthFrame>
  );
}

export function SignUpPage({ defaultRole }: { defaultRole?: Role }) {
  const [step, setStep] = useState<1 | 2 | 3>(defaultRole ? 2 : 1);
  const [role, setRole] = useState<Role>(defaultRole || 'owner');
  const [professionalType, setProfessionalType] = useState<ProfessionalType | ''>('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [dogName, setDogName] = useState('');
  const [dogBreed, setDogBreed] = useState('');
  const [breeds, setBreeds] = useState<FciBreed[]>([]);
  const [selectedBreed, setSelectedBreed] = useState<FciBreed | null>(null);
  const [breedMenuOpen, setBreedMenuOpen] = useState(false);
  const [dogBirthDate, setDogBirthDate] = useState('');
  const [dogWeight, setDogWeight] = useState('');
  const [dogVaccinated, setDogVaccinated] = useState(false);
  const [dogReactive, setDogReactive] = useState(false);
  const [dogNotes, setDogNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { navigate, path } = useRouter();
  const destination = bookingDestination(path);

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

    if (!email.trim() || !password || !fullName.trim() || !phone.trim()) {
      setError('Tutti i campi sono obbligatori');
      return;
    }

    if (role === 'professional' && !professionalType) {
      setError('Scegli la tua attività principale.');
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

    try {
      const { error, needsEmailConfirmation } = await signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim(),
        role,
        professionalType: professionalType || undefined,
        dogName,
        dogBreed,
        dogBirthDate,
        dogWeight,
        dogBreedSlug: selectedBreed?.slug,
        dogFciGroup: selectedBreed?.fciGroup,
        dogVaccinated,
        dogReactive,
        dogNotes,
      });

      if (error) {
        setError(error);
        return;
      }

      if (needsEmailConfirmation) {
        alert('Account creato. Controlla la tua email per confermare l’indirizzo, poi accedi a PortaleCinofilo.');
        navigate(bookingAuthPath('signin', role === 'owner' ? destination : null));
        return;
      }

      navigate(role === 'professional' ? '/pro/settings' : destination || '/owner');
    } catch {
      setError('Registrazione non confermata. Controlla la connessione e riprova. Se hai già ricevuto l’email di conferma, usa Accedi.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <AuthFrame title="Entra in PortaleCinofilo" subtitle="Come vuoi usare la piattaforma?">
        <div className="space-y-3">
          <RoleCard active={role === 'owner'} onClick={() => setRole('owner')} title="Sono proprietario di un cane" subtitle="Voglio trovare servizi affidabili per il mio cane" />
          <RoleCard active={role === 'professional'} onClick={() => setRole('professional')} title="Sono un professionista" subtitle="Voglio offrire servizi e ricevere richieste" />
          <button onClick={() => setStep(2)} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition mt-4">
            Continua
          </button>
          <p className="text-sm text-stone-600 text-center">
            Hai già un account? <button type="button" onClick={() => navigate(bookingAuthPath('signin', destination))} className="text-emerald-700 font-semibold">Accedi</button>
          </p>
        </div>
      </AuthFrame>
    );
  }

  if (step === 3 && role === 'owner') {
    return (
      <AuthFrame
        title="Presentaci il tuo cane"
        subtitle="Un ultimo passo per personalizzare PortaleCinofilo"
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
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">
                Data di nascita
              </label>
              <input
                type="date"
                value={dogBirthDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDogBirthDate(e.target.value)}
                className="w-full border border-stone-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

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

          {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}

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
    <AuthFrame title={role === 'professional' ? 'Inizia il tuo profilo professionale' : 'Crea il tuo account'} subtitle={role === 'professional' ? 'Per addestratori, centri cinofili e strutture.' : 'Il primo passo per trovare aiuto per il tuo cane.'}>
      <form onSubmit={submit} className="space-y-4">
        {role === 'professional' && <div>
          <label htmlFor="signup-activity" className="block text-sm font-semibold text-stone-700 mb-2">Attività principale</label>
          <select id="signup-activity" value={professionalType} onChange={event => setProfessionalType(event.target.value as ProfessionalType | '')} required aria-describedby="signup-activity-help" className="w-full min-w-0 border border-stone-300 rounded-xl px-3 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="" disabled>Scegli la tua attività</option>
            <option value="trainer">Educazione e addestramento</option>
            <option value="boarding">Pensione per cani</option>
            <option value="sitter">Dog sitter</option>
            <option value="walker">Passeggiate con il cane</option>
            <option value="groomer">Toelettatura</option>
          </select>
          <p id="signup-activity-help" className="mt-2 text-xs text-stone-600">Scegli l’attività prevalente. Nel profilo guidato potrai indicare il nome del centro o della struttura e aggiungere i servizi offerti.</p>
        </div>}
        <Field icon={<User className="w-4 h-4" />} placeholder={role === 'professional' ? 'Nome e cognome del referente' : 'Nome e cognome'} value={fullName} onChange={setFullName} autoComplete="name" required />
        <Field icon={<Mail className="w-4 h-4" />} type="email" placeholder="Email" value={email} onChange={setEmail} autoComplete="email" required />
        <Field icon={<Phone className="w-4 h-4" />} type="tel" placeholder="Telefono" value={phone} onChange={setPhone} autoComplete="tel" required />
        <Field icon={<Lock className="w-4 h-4" />} type="password" placeholder="Password" value={password} onChange={setPassword} autoComplete="new-password" required />
        <div className="flex items-center gap-2 text-xs text-stone-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
          <Check className="w-4 h-4 text-amber-600 shrink-0" /> Usa un’email che puoi consultare: servirà per confermare l’account.
        </div>
        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-stone-300 font-semibold">Indietro</button>
          <button disabled={loading} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50">
            {loading ? 'Creazione...' : role === 'owner' ? 'Continua: il tuo cane' : 'Crea account'}
          </button>
        </div>
      </form>
    </AuthFrame>
  );
}

export function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
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

function Field({ icon, type = 'text', placeholder, value, onChange, autoComplete, required = false }: { icon: React.ReactNode; type?: string; placeholder: string; value: string; onChange: (v: string) => void; autoComplete?: string; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-stone-700">
      <span className="block mb-2">{placeholder}</span>
      <span className="relative block font-normal">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden="true">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-3 py-3 border border-stone-300 rounded-xl text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      />
      </span>
    </label>
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
