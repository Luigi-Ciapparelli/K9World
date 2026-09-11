import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabase';
import type { Profile, Role, ProfessionalType } from './types';

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  loading: boolean;
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
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Profile load error:', error);
      setProfile(null);
      return null;
    }

    const nextProfile = data ? (data as Profile) : null;
    setProfile(nextProfile);
    return nextProfile;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' });
        loadProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email || '' });
          await loadProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      })();
    });

    return () => subscription.unsubscribe();
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

    setUser({
      id: data.user.id,
      email: data.user.email || '',
    });

    const nextProfile = await loadProfile(data.user.id);

    if (!nextProfile) {
      await supabase.auth.signOut();
      return {
        error: 'Profilo account non trovato. Contatta l’assistenza.',
        role: null,
      };
    }

    return {
      error: null,
      role: nextProfile.role,
    };
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          pawconnect_onboarding_version: '1',
          full_name: fullName,
          phone,
          role,
          professional_type: role === 'professional' ? professionalType || 'walker' : null,
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

    await loadProfile(data.user.id);
    return { error: null, needsEmailConfirmation: false };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
