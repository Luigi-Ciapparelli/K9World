import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Heart, PawPrint, Scale } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DogPhoto } from '../../components/DogPhoto';
import { useAuth } from '../../lib/AuthContext';
import { useRouter } from '../../lib/RouterContext';
import type { Dog } from '../../lib/types';

export function DogDetailPage({ id }: { id: string }) {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [dog, setDog] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    supabase
      .from('dogs')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('Dog detail error:', error);
        setDog(data as Dog | null);
        setLoading(false);
      });
  }, [id, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-500">
        Caricamento...
      </div>
    );
  }

  if (!dog) {
    return (
      <div className="min-h-screen bg-stone-50 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-stone-900">Cane non trovato</h1>
          <button
            onClick={() => navigate('/owner/dogs')}
            className="mt-5 text-emerald-700 font-semibold"
          >
            Torna ai tuoi cani
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-5 md:px-6 py-10">
        <button
          onClick={() => navigate('/owner/dogs')}
          className="flex items-center gap-2 text-sm text-stone-600 hover:text-emerald-700 mb-7"
        >
          <ArrowLeft className="w-4 h-4" />
          I miei cani
        </button>

        <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden">
          <div className="h-64 md:h-80 bg-stone-100">
            <DogPhoto
              photoPath={dog.photo_url}
              fallbackUrl="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1000"
              className="w-full h-full object-cover"
              alt={dog.name}
            />
          </div>

          <div className="p-6 md:p-9">
            <div>
              <p className="text-sm font-semibold text-emerald-700">Il tuo cane</p>
              <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mt-1">
                {dog.name}
              </h1>
              <p className="text-lg text-stone-600 mt-1">{dog.breed}</p>

              {dog.fci_group && (
                <button
                  type="button"
                  onClick={() => navigate(`/gruppi-fci/${dog.fci_group}`)}
                  className="inline-flex mt-3 bg-emerald-50 text-emerald-700 rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-emerald-100"
                >
                  Gruppo FCI {dog.fci_group} · Conoscilo meglio →
                </button>
              )}
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mt-8">
              <Info
                icon={<CalendarDays className="w-5 h-5" />}
                label="Età"
                value={formatDogAge(dog.birth_date, dog.age)}
              />

              <Info
                icon={<Scale className="w-5 h-5" />}
                label="Peso"
                value={dog.weight ? `${dog.weight} kg` : 'Non indicato'}
              />

              <Info
                icon={<Heart className="w-5 h-5" />}
                label="Vaccinazioni"
                value={dog.vaccinated ? 'In regola' : 'Non indicate'}
              />
            </div>

            {dog.birth_date && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-stone-700">
                  Data di nascita
                </p>
                <p className="text-stone-600 mt-1">
                  {formatBirthDate(dog.birth_date)}
                </p>
              </div>
            )}

            <div className="mt-6">
              <p className="text-sm font-semibold text-stone-700">
                Gestione e comportamento
              </p>

              <div className="flex flex-wrap gap-2 mt-2">
                {dog.aggressive ? (
                  <span className="text-sm bg-amber-50 text-amber-800 px-3 py-1.5 rounded-full">
                    Può essere reattivo con altri cani
                  </span>
                ) : (
                  <span className="text-sm bg-stone-100 text-stone-600 px-3 py-1.5 rounded-full">
                    Nessuna reattività indicata
                  </span>
                )}
              </div>
            </div>

            {dog.medical_notes && (
              <div className="mt-6 border-t border-stone-200 pt-6">
                <p className="text-sm font-semibold text-stone-700">
                  Informazioni utili
                </p>
                <p className="text-stone-600 mt-2 whitespace-pre-wrap">
                  {dog.medical_notes}
                </p>
              </div>
            )}

            {dog.fci_group && (
              <div className="mt-8 bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                <div className="flex gap-3">
                  <PawPrint className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <h2 className="font-bold text-stone-900">
                      Conosci meglio il tuo cane
                    </h2>
                    <p className="text-sm text-stone-600 mt-1">
                      Scopri selezione, bisogni, gestione e attività utili per i
                      cani appartenenti al Gruppo FCI {dog.fci_group}.
                    </p>
                    <button
                      onClick={() => navigate(`/gruppi-fci/${dog.fci_group}`)}
                      className="text-sm font-semibold text-emerald-700 mt-3"
                    >
                      Vai alla guida del Gruppo FCI {dog.fci_group} →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-stone-50 rounded-2xl p-4">
      <div className="text-emerald-700">{icon}</div>
      <p className="text-xs text-stone-500 mt-3">{label}</p>
      <p className="font-semibold text-stone-900 mt-1">{value}</p>
    </div>
  );
}

function formatBirthDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

function formatDogAge(birthDate: string | null | undefined, fallbackAge: number) {
  if (!birthDate) {
    return fallbackAge > 0
      ? `${fallbackAge} ${fallbackAge === 1 ? 'anno' : 'anni'}`
      : 'Non indicata';
  }

  const [year, month, day] = birthDate.split('-').map(Number);
  const today = new Date();

  let totalMonths =
    (today.getFullYear() - year) * 12 +
    (today.getMonth() + 1 - month);

  if (today.getDate() < day) totalMonths -= 1;
  if (totalMonths < 0) return 'Data non valida';

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years === 0) return `${months} ${months === 1 ? 'mese' : 'mesi'}`;
  if (months === 0) return `${years} ${years === 1 ? 'anno' : 'anni'}`;

  return `${years} ${years === 1 ? 'anno' : 'anni'} e ${months} ${
    months === 1 ? 'mese' : 'mesi'
  }`;
}
