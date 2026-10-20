import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { supabase } from './supabase';
import type { Profile, Role, ProfessionalType } from './types';
import { createAccountProfileState, emptyAccount } from './accountProfileState';
import { setContinuityRecordingAccount } from './continuityRecording';
import { setReviewAccount } from './reviewSubmission';

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  loading: boolean;
  profileError: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; role: Role | null }>;
  signUp: (args: SignUpArgs) => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

interface SignUpArgs {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: Role;
  professionalType?: ProfessionalType;
  dogName?: string;
  dogBreed?: string;
  dogBirthDate?: string;
  dogWeight?: string;
  dogBreedSlug?: string;
  dogFciGroup?: number;
  dogVaccinated?: boolean;
  dogReactive?: boolean;
  dogNotes?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState({ ...emptyAccount, loading: typeof window !== 'undefined' });
  const state = useRef<ReturnType<typeof createAccountProfileState> | null>(null);
  const { user, profile, loading, profileError } = account;

  useEffect(() => {
    const current = createAccountProfileState(async (userId, signal) => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).abortSignal(signal).maybeSingle();
      if (error) throw error;
      return data;
    }, setAccount);
    state.current = current;
    // INITIAL_SESSION handles the initial state; a second getSession can race it.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setContinuityRecordingAccount(session?.user?.id || null);
      setReviewAccount(session?.user?.id || null);
      current.acceptUser(session?.user ? { id: session.user.id, email: session.user.email || '' } : null, event === 'USER_UPDATED');
    });
    return () => { subscription.unsubscribe(); current.dispose(); setContinuityRecordingAccount(null); setReviewAccount(null); if (state.current === current) state.current = null; };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message, role: null };
    }

    if (!data.user) {
      return { error: 'Impossibile completare l’accesso', role: null };
    }

    const current = state.current;
    if (!current || current.getSnapshot().user?.id !== data.user.id) {
      return { error: 'La sessione è cambiata. Riprova ad accedere.', role: null };
    }
    const nextProfile = await current.refresh();
    if (current.getSnapshot().user?.id !== data.user.id) {
      return { error: 'La sessione è cambiata. Riprova ad accedere.', role: null };
    }
    // Authentication succeeded even if a temporary profile read failed.
    // The protected area offers retry; do not sign out a valid session.
    return { error: null, role: nextProfile?.role || null };
  };

  const signUp = async ({
    email,
    password,
    fullName,
    phone,
    role,
    professionalType,
    dogName,
    dogBreed,
    dogBirthDate,
    dogWeight,
    dogBreedSlug,
    dogFciGroup,
    dogVaccinated,
    dogReactive,
    dogNotes,
  }: SignUpArgs) => {
    if (role === 'professional' && (!professionalType || !['trainer', 'groomer', 'boarding', 'handler'].includes(professionalType))) {
      return { error: 'Scegli la tua attività principale.' };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + '/account/contacts',
        data: {
          pawconnect_onboarding_version: '1',
          full_name: fullName,
          phone,
          role,
          professional_type: role === 'professional' ? professionalType : null,
          dog_name: role === 'owner' ? dogName?.trim() || '' : '',
          dog_breed: role === 'owner' ? dogBreed?.trim() || '' : '',
          dog_birth_date: role === 'owner' ? dogBirthDate || '' : '',
          dog_weight: role === 'owner' ? dogWeight || '' : '',
          dog_breed_slug: role === 'owner' ? dogBreedSlug || '' : '',
          dog_fci_group: role === 'owner' ? dogFciGroup ?? null : null,
          dog_vaccinated: role === 'owner' ? Boolean(dogVaccinated) : false,
          dog_reactive: role === 'owner' ? Boolean(dogReactive) : false,
          dog_notes: role === 'owner' ? dogNotes?.trim() || '' : '',
        },
      },
    });

    if (error) return { error: error.message };
    if (!data.user) return { error: 'Signup failed' };

    // Il trigger DB crea profile, eventuale professional pending e primo cane.
    // Se la conferma email è attiva non esiste ancora una sessione browser.
    if (!data.session) {
      return { error: null, needsEmailConfirmation: true };
    }

    if (state.current?.getSnapshot().user?.id === data.user.id) await state.current.refresh();
    return { error: null, needsEmailConfirmation: false };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error && state.current?.getSnapshot().user) throw new Error('Uscita non riuscita. Controlla la connessione e riprova.');
  };

  const refreshProfile = async () => {
    await state.current?.refresh();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, profileError, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
