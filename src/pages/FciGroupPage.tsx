import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  Brain,
  Heart,
  PawPrint,
  ShieldCheck,
  ArrowRight,
  Search,
} from 'lucide-react';
import { loadFciBreeds } from '../lib/fciBreeds';
import { FCI_GROUP_CONTENT } from '../lib/fciGroups';
import { useRouter } from '../lib/RouterContext';

export function FciGroupPage({ group }: { group: number }) {
  const { navigate } = useRouter();
  const [groupName, setGroupName] = useState('');
  type FciBreed = Awaited<ReturnType<typeof loadFciBreeds>>[number];
  const [breeds, setBreeds] = useState<FciBreed[]>([]);
  const [breedQuery, setBreedQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const content = FCI_GROUP_CONTENT[group];

  const filteredBreeds = useMemo(() => {
    const query = breedQuery.trim().toLocaleLowerCase('it');
    if (!query) return breeds;
    return breeds.filter((breed) =>
      breed.name.toLocaleLowerCase('it').includes(query)
    );
  }, [breeds, breedQuery]);

  useEffect(() => {
    loadFciBreeds()
      .then((allBreeds) => {
        const groupBreeds = allBreeds
          .filter((item) => item.fciGroup === group)
          .sort((a, b) => a.name.localeCompare(b.name, 'it'));

        setBreeds(groupBreeds);
        setGroupName(groupBreeds[0]?.fciGroupName || '');
      })
      .finally(() => setLoading(false));
  }, [group]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-500">
        Caricamento...
      </div>
    );
  }

  if (group < 1 || group > 10 || !groupName || !content) {
    return (
      <div className="min-h-screen bg-stone-50 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-stone-900">
            Gruppo FCI non trovato
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-5 md:px-6 py-10">
        <button
          onClick={() => {
            if (window.history.length > 1) window.history.back();
            else navigate('/prima-del-cane');
          }}
          className="flex items-center gap-2 text-sm text-stone-600 hover:text-emerald-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Indietro
        </button>

        <section className="bg-white rounded-3xl border border-stone-200 p-7 md:p-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
              <PawPrint className="w-7 h-7 text-emerald-700" />
            </div>

            <div>
              <p className="text-sm font-semibold text-emerald-700">
                Conosci meglio il tuo cane
              </p>

              <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mt-1">
                Gruppo FCI {group}
              </h1>

              <p className="text-stone-600 mt-3">
                {groupName}
              </p>
            </div>
          </div>

          <p className="mt-8 text-lg text-stone-700 leading-relaxed">
            {content.intro}
          </p>

          <div className="mt-8 rounded-2xl bg-amber-50 border border-amber-100 p-5">
            <p className="text-sm text-stone-700 leading-relaxed">
              <strong>Ricorda:</strong> appartenere a un gruppo FCI non
              determina il comportamento del singolo cane. Genetica,
              esperienze, ambiente, apprendimento, salute e relazione con le
              persone contribuiscono tutti a formare l'individuo.
            </p>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-5 mt-6">
          <InfoCard
            icon={<Brain className="w-5 h-5" />}
            title="Per cosa sono stati selezionati?"
          >
            <p>{content.selection}</p>
          </InfoCard>

          <InfoCard
            icon={<Heart className="w-5 h-5" />}
            title="Bisogni da rispettare"
          >
            <BulletList items={content.needs} />
          </InfoCard>

          <InfoCard
            icon={<ShieldCheck className="w-5 h-5" />}
            title="Gestione quotidiana"
          >
            <BulletList items={content.management} />
          </InfoCard>

          <InfoCard
            icon={<Activity className="w-5 h-5" />}
            title="Attività che possono aiutare"
          >
            <BulletList items={content.activities} />
          </InfoCard>
        </div>

        <section className="mt-6 bg-white rounded-3xl border border-stone-200 p-7 md:p-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-emerald-700">
              Razze del gruppo
            </p>
            <h2 className="text-2xl font-bold text-stone-900 mt-1">
              Esplora le razze senza ridurle a un'etichetta
            </h2>
            <p className="text-stone-600 leading-relaxed mt-3">
              Ogni scheda parte dalla classificazione FCI e rimanda alla fonte ENCI ufficiale.
              La razza aiuta a capire storia e selezione, ma non permette di prevedere da sola
              il comportamento del singolo cane.
            </p>
          </div>

          <div className="relative mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="search"
              value={breedQuery}
              onChange={(event) => setBreedQuery(event.target.value)}
              placeholder="Cerca una razza nel gruppo..."
              className="w-full rounded-xl border border-stone-300 bg-white pl-11 pr-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="mt-5 grid md:grid-cols-2 gap-3">
            {filteredBreeds.map((breed) => (
              <button
                key={breed.slug}
                type="button"
                onClick={() => navigate(`/razze/${breed.slug}`)}
                className="group flex items-center justify-between gap-4 text-left rounded-2xl border border-stone-200 p-4 hover:border-emerald-300 hover:bg-emerald-50/40 transition"
              >
                <div>
                  <div className="font-bold text-stone-900">{breed.name}</div>
                  <div className="text-xs text-stone-500 mt-1">
                    Gruppo FCI {breed.fciGroup}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 shrink-0 text-stone-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition" />
              </button>
            ))}
          </div>

          {filteredBreeds.length === 0 && (
            <div className="mt-5 rounded-2xl bg-stone-50 border border-stone-200 p-5 text-sm text-stone-600">
              Nessuna razza trovata con questa ricerca.
            </div>
          )}
        </section>

        <section className="mt-6 bg-emerald-50 border border-emerald-100 rounded-3xl p-7 md:p-8">
          <p className="text-sm font-semibold text-emerald-700">
            PortaleCinofilo Impara
          </p>

          <h2 className="text-2xl font-bold text-stone-900 mt-1">
            Il gruppo è un punto di partenza, non un'etichetta
          </h2>

          <p className="text-stone-700 leading-relaxed mt-3">
            Osservare il proprio cane, comprenderne la comunicazione e
            soddisfarne i bisogni è più importante che aspettarsi un
            comportamento soltanto perché appartiene a una determinata razza
            o categoria.
          </p>

          <p className="text-stone-600 mt-3">
            Presto qui potrai continuare con lezioni gratuite sulla corretta
            gestione del cane.
          </p>
        </section>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-stone-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
          {icon}
        </div>
        <h2 className="font-bold text-stone-900">{title}</h2>
      </div>

      <div className="text-sm text-stone-600 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="text-emerald-600 font-bold">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
