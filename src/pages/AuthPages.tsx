import { SignupPrivacyNotice, SignupTerms } from '../components/SignupLegalNotice';
import { useEffect, useRef, useState } from 'react';
import { PawPrint, Mail, Lock, User, Phone, Check } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/RouterContext';
import type { ProfessionalType, Role } from '../lib/types';
import { loadFciBreeds, normalizeBreedSearch, type FciBreed } from '../lib/fciBreeds';
import { bookingAuthPath, bookingDestination } from '../lib/bookingEntry';
import { SignupConfirmationResend } from '../components/SignupConfirmationResend';
import { confirmationPage } from '../lib/signupConfirmation';
import '../auth-journey.css';

export function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { navigate, path, params } = useRouter();
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
      {params.fromContacts && <p role="status" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-stone-800">Per vedere i tuoi recapiti devi accedere. Se sei arrivato qui dall’email, il link non ha restituito un esito di conferma. Apri l’ultima email oppure richiedine una nuova qui sotto.</p>}
      <form onSubmit={submit} className="space-y-4">
        <Field icon={<Mail className="w-4 h-4" />} type="email" placeholder="Email" value={email} onChange={setEmail} autoComplete="username" required />
        <Field icon={<Lock className="w-4 h-4" />} type="password" placeholder="Password" value={password} onChange={setPassword} autoComplete="current-password" required />
        <button type="button" onClick={() => navigate('/forgot-password')} className="pc-auth-link">Password dimenticata?</button>
        {error && <p role="alert" className="pc-auth-error">{error}</p>}
        <button disabled={loading} className="pc-auth-primary w-full">
          {loading ? 'Accesso...' : 'Accedi'}
        </button>
        <p className="text-sm text-stone-600 text-center">
          Non hai un account? <button type="button" onClick={() => navigate(bookingAuthPath('signup', destination))} className="text-emerald-700 font-semibold">Registrati</button>
        </p>
        <div className="border-t border-stone-200 pt-4 text-sm text-stone-600">
          <p>Se devi ancora confermare l’indirizzo, inserisci la tua email nel campo sopra. Non serve registrarti di nuovo.</p>
          <SignupConfirmationResend email={email} />
          <button type="button" className="mt-3 text-sm font-semibold text-emerald-700 underline" onClick={() => navigate(confirmationPage, { email: email.trim(), mode: 'code' })}>Ho un codice nell’email</button>
        </div>
      </form>
    </AuthFrame>
  );
}

export function SignUpPage({ defaultRole }: { defaultRole?: Role }) {
  const [step, setStep] = useState<2 | 3>(2);
  const [submitted, setSubmitted] = useState(false);
  const lock = useRef(false);
  const focusEmail = useRef(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
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
    if (submitted || step === 3) {
      document.querySelector<HTMLElement>('#auth-title')?.focus({preventScroll: true});
      window.scrollTo(0, 0);
    } else if (focusEmail.current) {
      focusEmail.current = false;
      document.querySelector<HTMLInputElement>('input[autocomplete="email"]')?.focus();
    }
  }, [step, submitted]);

  const changeRole = (value: 'owner' | 'professional') => {
    if (value !== role) { setRole(value); setTermsAccepted(false); setError(''); }
  };
  const editContacts = () => {
    setError(''); focusEmail.current = true;
    if (step === 2 && !submitted) {
      focusEmail.current = false;
      document.querySelector<HTMLInputElement>('input[autocomplete="email"]')?.focus();
    } else { setSubmitted(false); setStep(2); }
  };

  useEffect(() => {
    if (step !== 3 || submitted) return;
    loadFciBreeds()
      .then(setBreeds)
      .catch((err) => console.error('FCI breeds load error:', err));
  }, [step, submitted]);

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

    if (lock.current) return;
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

    if (!termsAccepted) {
      setError('Per creare l’account devi accettare i termini indicati.');
      return;
    }

    lock.current = true; setLoading(true);

    try {
      const { error, needsEmailConfirmation } = await signUp({
        email: email.trim(),
        password,
        termsAccepted,
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
        setPassword('');
        setSubmitted(true);
        return;
      }

      navigate(role === 'professional' ? '/pro/settings' : destination || '/owner');
    } catch {
      setError('Registrazione non confermata. Controlla la connessione e riprova. Se hai già ricevuto l’email di conferma, usa Accedi.');
    } finally {
      lock.current = false; setLoading(false);
    }
  };

  if (submitted) return <AuthFrame eyebrow="Registrazione · Verifica email" title="Controlla la tua email" subtitle="Apri il messaggio più recente e segui le istruzioni.">
    <div className="pc-auth-confirm">
      <p>Indirizzo inserito: <strong>{email.trim()}</strong></p>
      <p>Se è in attesa di conferma, riceverai un messaggio a questo indirizzo. Controlla anche la cartella spam.</p>
      <SignupConfirmationResend email={email} />
      <button type="button" className="pc-auth-link" onClick={() => navigate(confirmationPage, { email: email.trim(), mode: 'code' })}>Ho un codice nell’email</button>
      <div className="pc-auth-confirm-other"><p>Hai scritto male l’indirizzo?</p>
        <button type="button" className="pc-auth-link" onClick={() => { setTermsAccepted(false); editContacts(); }}>Ripeti la registrazione con il recapito corretto</button>
      </div>
      <button type="button" className="pc-auth-primary w-full" onClick={() => navigate(bookingAuthPath('signin', role === 'owner' ? destination : null))}>Vai ad Accedi</button>
    </div>
  </AuthFrame>;

  const contactsReview = <div className="pc-auth-review">
    <strong>Controlla i tuoi recapiti</strong>
    <dl><div><dt>Email di conferma</dt><dd>{email.trim() || 'Da inserire'}</dd></div>
      <div><dt>Telefono</dt><dd>{phone.trim() || 'Da inserire'}</dd></div></dl>
    <button type="button" onClick={editContacts} className="pc-auth-link">Modifica i recapiti</button>
  </div>;

  if (step === 3 && role === 'owner') {
    return (
      <AuthFrame
        eyebrow="Proprietario · Passo 2 di 2"
        title="Presentaci il tuo cane"
        subtitle="Un ultimo passo per personalizzare PortaleCinofilo"
      >
        <form onSubmit={submit} className="space-y-4">
          <Field
            icon={<PawPrint className="w-4 h-4" />}
            placeholder="Nome del cane" required
            value={dogName}
            onChange={setDogName}
          />

          <div className="relative">
            <label htmlFor="signup-dog-breed" className="mb-2 block text-sm font-semibold">Razza del cane</label>
            <div className="flex items-center border border-stone-300 rounded-xl px-3 focus-within:ring-2 focus-within:ring-emerald-500">
              <PawPrint className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                id="signup-dog-breed" type="text" required
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

          <SignupPrivacyNotice dog />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="signup-dog-date" className="block text-sm font-semibold text-stone-700 mb-2">
                Data di nascita
              </label>
              <input
                id="signup-dog-date" type="date"
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
            <label htmlFor="signup-dog-notes" className="block text-sm font-semibold text-stone-700 mb-2">
              Cosa dovremmo sapere di lui?
            </label>
            <textarea id="signup-dog-notes"
              value={dogNotes}
              onChange={(e) => setDogNotes(e.target.value)}
              rows={4}
              placeholder="Carattere, esigenze particolari o altre informazioni utili..."
              className="w-full border border-stone-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {contactsReview}
          <SignupTerms professional={false} checked={termsAccepted} onChange={setTermsAccepted} />
          {error && <p role="alert" className="pc-auth-error">{error}</p>}

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
              className="pc-auth-primary flex-1"
            >
              {loading ? 'Creazione...' : 'Crea account'}
            </button>
          </div>
        </form>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame eyebrow={role === 'professional' ? 'Professionista · Dati del referente' : 'Proprietario · Passo 1 di 2'} title={role === 'professional' ? 'Inizia il tuo profilo professionale' : 'Crea il tuo account'} subtitle={role === 'professional' ? 'Inserisci i recapiti e l’attività; poi conferma l’email.' : 'Inserisci i tuoi dati. Nel prossimo passo aggiungerai il cane.'}>
      <form onSubmit={submit} className="space-y-4">
        <fieldset className="pc-signup-role"><legend>Tipo di account</legend><div>
          <RoleCard active={role === 'owner'} onClick={() => changeRole('owner')} title="Proprietario" />
          <RoleCard active={role === 'professional'} onClick={() => changeRole('professional')} title="Professionista" />
        </div></fieldset>
        <Field icon={<User className="w-4 h-4" />} placeholder={role === 'professional' ? 'Nome e cognome del referente' : 'Nome e cognome'} value={fullName} onChange={setFullName} autoComplete="name" required />
        {role === 'professional' && <div>
          <label htmlFor="signup-activity" className="block text-sm font-semibold text-stone-700 mb-2">Attività principale</label>
          <select id="signup-activity" value={professionalType} onChange={event => setProfessionalType(event.target.value as ProfessionalType | '')} required aria-describedby="signup-activity-help" className="w-full min-w-0 border border-stone-300 rounded-xl px-3 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="" disabled>Scegli la tua attività</option>
            <option value="trainer">Educazione e addestramento</option>
            <option value="boarding">Pensione per cani</option>
            <option value="handler">Handler per esposizioni</option>
            <option value="groomer">Toelettatura</option>
          </select>
          <p id="signup-activity-help" className="mt-2 text-xs text-stone-600">Scegli l’attività prevalente. Nel profilo guidato potrai indicare il nome del centro o della struttura e aggiungere i servizi offerti.</p>
        </div>}
        <Field icon={<Mail className="w-4 h-4" />} type="email" placeholder="Email" value={email} onChange={setEmail} autoComplete="email" required />
        <Field icon={<Phone className="w-4 h-4" />} type="tel" placeholder="Telefono" value={phone} onChange={setPhone} autoComplete="tel" required />
        <Field icon={<Lock className="w-4 h-4" />} type="password" placeholder="Password" value={password} onChange={setPassword} autoComplete="new-password" required />
        <SignupPrivacyNotice />
        {role === 'owner' && <p className="text-sm">Puoi leggere già ora i <a href="/terms" target="_blank" rel="noopener noreferrer" className="pc-auth-link">Termini di utilizzo (nuova scheda)</a>. Li accetterai dopo aver inserito i dati del cane.</p>}
        {role === 'professional' && contactsReview}
        {role === 'professional' && <SignupTerms professional checked={termsAccepted} onChange={setTermsAccepted} />}
        {error && <p role="alert" className="pc-auth-error">{error}</p>}
        <div className="flex gap-3">

          <button disabled={loading} className="pc-auth-primary flex-1">
            {loading ? 'Creazione...' : role === 'owner' ? 'Continua: il tuo cane' : 'Crea account'}
          </button>
        </div>
        <p className="text-sm">Hai già un account? <button type="button" onClick={() => navigate(bookingAuthPath('signin', destination))} className="pc-auth-link">Accedi</button></p>
      </form>
    </AuthFrame>
  );
}

export function AuthFrame({ title, subtitle, eyebrow = 'Il tuo account', children }: { title: string; subtitle: string; eyebrow?: string; children: React.ReactNode }) {
  return (
    <main className="pc-auth-frame">
      <div className="pc-auth-wrap">
        <header className="pc-auth-heading">
          <p className="pc-auth-kicker">{eyebrow}</p>
          <h1 id="auth-title" tabIndex={-1}>{title}</h1>
          <p>{subtitle}</p>
        </header>
        <div className="pc-auth-card">{children}</div>
      </div>
    </main>
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

function RoleCard({ active, onClick, title }: { active: boolean; onClick: () => void; title: string }) {
  return <button type="button" aria-pressed={active} onClick={onClick}>
    <span className="pc-role-mark" aria-hidden="true">{active && <Check size={12} strokeWidth={3} />}</span>{title}
  </button>;
}
