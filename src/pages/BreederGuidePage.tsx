import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  HeartHandshake,
  SearchCheck,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { loadFciBreeds } from '../lib/fciBreeds';
import { useRouter } from '../lib/RouterContext';

const ENCI_AFFIX_URL = 'https://www.enci.it/allevatori/allevatori-con-affisso';
const ENCI_REGISTER_URL = 'https://www.enci.it/allevatori/registro-allevatori';
const ENCI_CERTIFIED_URL = 'https://www.enci.it/allevatori/ricerca-allevatore-certificato';

export function BreederGuidePage() {
  type FciBreed = Awaited<ReturnType<typeof loadFciBreeds>>[number];

  const { path, navigate } = useRouter();
  const [breed, setBreed] = useState<FciBreed | null>(null);

  useEffect(() => {
    const query = path.includes('?')
      ? new URLSearchParams(path.split('?')[1])
      : new URLSearchParams();

    const slug = query.get('razza');
    if (!slug) {
      setBreed(null);
      return;
    }

    loadFciBreeds().then((breeds) => {
      setBreed(breeds.find((item) => item.slug === slug) || null);
    });
  }, [path]);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-5 md:px-6 py-10 md:py-14">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) window.history.back();
            else navigate(breed ? `/razze/${breed.slug}` : '/prima-del-cane');
          }}
          className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-emerald-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Indietro
        </button>

        <section className="bg-white rounded-[2rem] border border-stone-200 p-7 md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
            Prima del cane
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-stone-900 tracking-tight mt-2">
            Come scegliere un allevamento
          </h1>
          <p className="text-stone-600 mt-4 max-w-3xl leading-relaxed">
            {breed
              ? `Stai approfondendo ${breed.name}. Prima di cercare un cucciolo, verifica selezione, salute, crescita e trasparenza dell’allevatore.`
              : 'Prima di cercare un cucciolo, verifica selezione, salute, crescita e trasparenza dell’allevatore.'}
          </p>

          <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="font-bold text-stone-900">Un nome o un badge non bastano da soli</p>
            <p className="text-sm text-stone-700 mt-2 leading-relaxed">
              PawConnect ti aiuta a distinguere le verifiche formali ENCI dalle valutazioni che devi fare sul singolo allevamento.
              La presenza in un registro è un dato verificabile; la qualità della scelta richiede anche domande concrete su salute,
              selezione, genitori e crescita dei cuccioli.
            </p>
          </div>
        </section>

        <section className="mt-6 bg-white rounded-3xl border border-stone-200 p-7 md:p-8">
          <p className="text-sm font-semibold text-emerald-700">Verifiche ufficiali ENCI</p>
          <h2 className="text-2xl font-bold text-stone-900 mt-1">
            Tre cose diverse da non confondere
          </h2>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <OfficialCard
              icon={<FileCheck2 className="w-5 h-5" />}
              title="Affisso"
              text="È la denominazione dell’allevamento registrata nel sistema ENCI/FCI. Identifica l’allevamento, ma non va confusa con il riconoscimento di Allevatore Certificato ENCI."
              href={ENCI_AFFIX_URL}
              linkLabel="Verifica affisso"
            />

            <OfficialCard
              icon={<SearchCheck className="w-5 h-5" />}
              title="Registro Allevatori"
              text="ENCI mantiene un Registro Allevatori con requisiti e controlli previsti dal Libro Genealogico. È una verifica formale distinta dall’affisso."
              href={ENCI_REGISTER_URL}
              linkLabel="Consulta il registro"
            />

            <OfficialCard
              icon={<ShieldCheck className="w-5 h-5" />}
              title="Allevatore Certificato ENCI"
              text="È uno specifico riconoscimento ENCI con requisiti propri. Non tutti i titolari di affisso sono automaticamente Allevatori Certificati."
              href={ENCI_CERTIFIED_URL}
              linkLabel="Cerca certificati"
            />
          </div>
        </section>

        <section className="mt-6 grid md:grid-cols-2 gap-5">
          <GuideCard
            icon={<Stethoscope className="w-5 h-5" />}
            title="1. Salute e selezione"
            items={[
              'Chiedi quali patologie sono rilevanti nella razza e quali controlli vengono eseguiti sui riproduttori.',
              'Chiedi di vedere risultati e documentazione, non soltanto rassicurazioni verbali.',
              'Informati sulla longevità e sui problemi ricorrenti anche nei parenti stretti.',
              'Valuta se l’accoppiamento ha un obiettivo dichiarato oltre all’aspetto estetico.',
            ]}
          />

          <GuideCard
            icon={<HeartHandshake className="w-5 h-5" />}
            title="2. Genitori e carattere"
            items={[
              'Quando possibile, osserva almeno la madre e chiedi informazioni concrete sul padre.',
              'Chiedi come vivono i riproduttori nella quotidianità e quali attività svolgono.',
              'Non accettare descrizioni assolute del tipo “questa razza è sempre così”.',
              'Chiedi come viene scelto il cucciolo più compatibile con la famiglia.',
            ]}
          />

          <GuideCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            title="3. Crescita dei cuccioli"
            items={[
              'Chiedi dove crescono i cuccioli e quali esperienze fanno prima dell’affido.',
              'Osserva pulizia, condizioni ambientali e possibilità di riposo.',
              'Chiedi come vengono gestite persone, rumori, superfici, manipolazioni e novità.',
              'Diffida di una socializzazione descritta come semplice esposizione indiscriminata a tutto.',
            ]}
          />

          <GuideCard
            icon={<FileCheck2 className="w-5 h-5" />}
            title="4. Trasparenza e post-affido"
            items={[
              'Chiarisci documenti, identificazione, iscrizioni e condizioni di cessione prima di impegnarti.',
              'Leggi con calma eventuale contratto e fai domande sui punti che non comprendi.',
              'Valuta la disponibilità dell’allevatore a seguire la famiglia anche dopo l’affido.',
              'Un allevatore serio dovrebbe fare domande anche a te: la scelta deve essere reciproca.',
            ]}
          />
        </section>

        <section className="mt-6 bg-emerald-50 border border-emerald-100 rounded-3xl p-7 md:p-8">
          <p className="text-sm font-semibold text-emerald-700">Il principio PawConnect</p>
          <h2 className="text-2xl font-bold text-stone-900 mt-1">
            Prima verifica, poi osserva, poi fai domande
          </h2>
          <p className="text-stone-700 mt-3 leading-relaxed">
            Nessun singolo elemento dimostra da solo che un allevamento sia quello giusto per te.
            Usa i registri ufficiali per verificare ciò che è verificabile, poi valuta concretamente
            il progetto di selezione e la compatibilità tra quel cane e la tua vita.
          </p>

          {breed && (
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a
                href={breed.enciUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-stone-900 text-white font-semibold hover:bg-stone-800"
              >
                Scheda ENCI: {breed.name}
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => navigate(`/razze/${breed.slug}`)}
                className="px-5 py-3 rounded-xl border border-emerald-300 bg-white text-emerald-800 font-semibold hover:bg-emerald-100"
              >
                Torna alla razza
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function OfficialCard({
  icon,
  title,
  text,
  href,
  linkLabel,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <article className="rounded-2xl border border-stone-200 p-5 flex flex-col">
      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="font-bold text-stone-900 mt-4">{title}</h3>
      <p className="text-sm text-stone-600 leading-relaxed mt-2 flex-1">{text}</p>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800 mt-5 hover:text-emerald-950"
      >
        {linkLabel}
        <ExternalLink className="w-4 h-4" />
      </a>
    </article>
  );
}

function GuideCard({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <section className="bg-white rounded-2xl border border-stone-200 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
          {icon}
        </div>
        <h2 className="font-bold text-stone-900">{title}</h2>
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm text-stone-600 leading-relaxed">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
