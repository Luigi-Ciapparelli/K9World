import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Heart,
  PawPrint,
  ShieldCheck,
} from 'lucide-react';
import { loadFciBreeds } from '../lib/fciBreeds';
import { FCI_GROUP_CONTENT } from '../lib/fciGroups';
import { useRouter } from '../lib/RouterContext';

export function BreedPage({ slug }: { slug: string }) {
  type FciBreed = Awaited<ReturnType<typeof loadFciBreeds>>[number];
  const { navigate } = useRouter();
  const [breed, setBreed] = useState<FciBreed | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFciBreeds()
      .then((breeds) => {
        setBreed(breeds.find((item) => item.slug === slug) || null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-500">
        Caricamento...
      </div>
    );
  }

  if (!breed) {
    return (
      <div className="min-h-screen bg-stone-50 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <button
            type="button"
            onClick={() => navigate('/prima-del-cane')}
            className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-emerald-700 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Prima del cane
          </button>

          <h1 className="text-2xl font-bold text-stone-900">
            Razza non trovata
          </h1>
        </div>
      </div>
    );
  }

  const groupContent = FCI_GROUP_CONTENT[breed.fciGroup];

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-5 md:px-6 py-10">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) window.history.back();
            else navigate(`/gruppi-fci/${breed.fciGroup}`);
          }}
          className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-emerald-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Indietro
        </button>

        <section className="bg-white rounded-3xl border border-stone-200 p-7 md:p-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
              <PawPrint className="w-7 h-7 text-emerald-700" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-700">
                Razza FCI
              </p>
              <h1 className="text-3xl md:text-5xl font-bold text-stone-900 mt-1 tracking-tight">
                {breed.name}
              </h1>
              <button
                type="button"
                onClick={() => navigate(`/gruppi-fci/${breed.fciGroup}`)}
                className="inline-flex items-center gap-2 text-stone-600 hover:text-emerald-700 mt-3"
              >
                Gruppo FCI {breed.fciGroup} · {breed.fciGroupName}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-amber-50 border border-amber-100 p-5">
            <p className="text-sm text-stone-700 leading-relaxed">
              <strong>Una razza non è un profilo comportamentale individuale.</strong>{' '}
              Standard, funzione storica e selezione aiutano a formulare domande migliori,
              ma sviluppo, salute, esperienze, ambiente e relazione contribuiscono al cane che avrai davanti.
            </p>
          </div>
        </section>

        {groupContent && (
          <section className="mt-6 grid md:grid-cols-2 gap-5">
            <InfoCard
              icon={<Heart className="w-5 h-5" />}
              title="Da quale storia funzionale partire"
            >
              <p>{groupContent.selection}</p>
            </InfoCard>

            <InfoCard
              icon={<ShieldCheck className="w-5 h-5" />}
              title="Domande di gestione da portarti dietro"
            >
              <ul className="space-y-2">
                {groupContent.management.slice(0, 3).map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </InfoCard>
          </section>
        )}

        <section className="mt-6 bg-white rounded-3xl border border-stone-200 p-7 md:p-8">
          <p className="text-sm font-semibold text-emerald-700">
            Fonte ufficiale
          </p>
          <h2 className="text-2xl font-bold text-stone-900 mt-1">
            Continua dalla scheda ENCI
          </h2>
          <p className="text-stone-600 leading-relaxed mt-3 max-w-3xl">
            PawConnect usa la propria interfaccia per orientarti, ma non sostituisce il Libro Genealogico
            o le informazioni ufficiali dell'ENCI. Apri la scheda ufficiale della razza per approfondire
            standard, classificazione e collegamenti messi a disposizione dall'ente.
          </p>

          <a
            href={breed.enciUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 mt-6 px-5 py-3 rounded-xl bg-stone-900 text-white font-semibold hover:bg-stone-800"
          >
            Apri la scheda ENCI ufficiale
            <ExternalLink className="w-4 h-4" />
          </a>
        </section>

        <section className="mt-6 bg-emerald-50 border border-emerald-100 rounded-3xl p-7 md:p-8">
          <p className="text-sm font-semibold text-emerald-700">
            Prima di scegliere un allevamento
          </p>
          <h2 className="text-2xl font-bold text-stone-900 mt-1">
            Trasforma l'interesse per la razza in domande concrete
          </h2>

          <div className="mt-5 grid md:grid-cols-2 gap-3 text-sm text-stone-700">
            {[
              'Qual è l’obiettivo della selezione e come vengono scelti gli accoppiamenti?',
              'Quali controlli sanitari sono rilevanti per questa razza e quali risultati hanno i genitori?',
              'Che carattere e che stile di vita hanno i genitori e i parenti stretti?',
              'Come crescono i cuccioli prima della consegna e quali esperienze fanno?',
              'L’allevatore resta disponibile anche dopo l’affido?',
              'Le aspettative della tua famiglia sono compatibili con il singolo cucciolo proposto?',
            ].map((question) => (
              <div
                key={question}
                className="rounded-2xl bg-white/70 border border-emerald-100 p-4"
              >
                {question}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-200 bg-white p-5">
            <p className="font-bold text-stone-900">
              PawConnect non attribuisce certificazioni agli allevatori
            </p>
            <p className="text-sm text-stone-600 mt-2 leading-relaxed">
              Per verifiche formali su affissi, registri o eventuali qualifiche ENCI,
              usa sempre i canali ufficiali dell'ente. PawConnect può aiutarti a capire cosa cercare,
              non sostituirsi alla fonte ufficiale.
            </p>
          </div>
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
