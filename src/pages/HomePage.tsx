import {
  ArrowRight,
  BookOpen,
  Compass,
  ExternalLink,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { TraceMark } from '../components/design/TraceMark';
import { useRouter } from '../lib/RouterContext';

type PathCardProps = {
  number: string;
  title: string;
  text: string;
  cta: string;
  onClick: () => void;
  icon: typeof Compass;
};

function PathCard({ number, title, text, cta, onClick, icon: Icon }: PathCardProps) {
  return (
    <button type="button" onClick={onClick} className="pc-card pc-card-interactive group w-full text-left p-6 md:p-7">
      <div className="flex items-start justify-between gap-5">
        <div>
          <div className="pc-number">{number}</div>
          <h3 className="pc-display text-2xl md:text-3xl font-semibold text-[var(--pc-ink-950)] mt-3">{title}</h3>
        </div>
        <div className="w-11 h-11 rounded-xl bg-[var(--pc-forest-100)] text-[var(--pc-forest-900)] flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-[var(--pc-muted-600)] leading-7 mt-4 max-w-xl">{text}</p>
      <span className="inline-flex items-center gap-2 text-sm font-bold text-[var(--pc-forest-900)] mt-6">
        {cta}<ArrowRight className="w-4 h-4 transition group-hover:translate-x-1" />
      </span>
    </button>
  );
}

export function HomePage() {
  const { navigate } = useRouter();

  return (
    <div className="min-h-screen bg-[var(--pc-bone-50)] text-[var(--pc-ink-950)]">
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 lg:py-28">
          <div className="grid lg:grid-cols-[1.12fr_0.88fr] gap-10 lg:gap-16 items-center">
            <div>
              <div className="flex items-center gap-4">
                <TraceMark className="text-[var(--pc-forest-700)]" />
                <span className="pc-kicker">PortaleCinofilo · Italia</span>
              </div>
              <h1 className="pc-display text-[clamp(2.8rem,6.5vw,5rem)] leading-[0.98] font-semibold mt-7 max-w-4xl">
                Prima di scegliere un cane, capisci che vita puoi offrirgli.
              </h1>
              <p className="pc-lead pc-reading mt-7">
                Dalla scelta consapevole alla gestione quotidiana: conosci il cane, confronta gruppi FCI e razze e trova professionisti competenti quando servono.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <button type="button" onClick={() => navigate('/prima-del-cane')} className="pc-btn pc-btn-primary">
                  Fai il profilo di compatibilità <ArrowRight className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => navigate('/impara')} className="pc-btn pc-btn-secondary">Ho già un cane</button>
              </div>
              <p className="text-sm text-[var(--pc-muted-600)] mt-5 max-w-2xl leading-6">
                Nessun account obbligatorio per imparare o iniziare il percorso. La registrazione serve quando vuoi salvare dati, sincronizzare progressi o prenotare.
              </p>
            </div>

            <div className="pc-field-grid border border-[var(--pc-line)] rounded-[24px] p-6 md:p-8">
              <p className="pc-kicker">La scelta parte dalla realtà</p>
              <h2 className="pc-display text-3xl md:text-4xl font-semibold mt-3">Non da una fotografia.</h2>
              <div className="mt-8 space-y-3">
                {[
                  ['Tempo quotidiano', 'Quanto puoi esserci davvero'],
                  ['Solitudine', 'Quanto resterà solo abitualmente'],
                  ['Attività', 'Che vita vuoi condividere'],
                  ['Famiglia', 'Persone e animali già presenti'],
                  ['Gestione', 'Quanta complessità puoi sostenere'],
                ].map(([label, value], index) => (
                  <div key={label} className="bg-[rgba(255,254,250,0.92)] border border-[var(--pc-line)] rounded-xl p-4 flex items-start gap-4">
                    <span className="pc-number mt-0.5">0{index + 1}</span>
                    <div><div className="font-bold">{label}</div><div className="text-sm text-[var(--pc-muted-600)] mt-1">{value}</div></div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-7 text-[var(--pc-forest-700)]">
                <TraceMark /><span className="text-sm font-bold">profilo → gruppi → razze → scelta</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pc-surface-dark">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          <div className="grid lg:grid-cols-[0.72fr_1.28fr] gap-10 lg:gap-16 items-start">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#c9d8cf]">Perché questa scelta conta</p>
              <div className="pc-display text-6xl md:text-7xl font-semibold text-white mt-4">&gt; 2 su 10</div>
              <p className="text-sm text-[#c9d8cf] mt-3">cani entrati nei canili rifugio dei comuni osservati</p>
            </div>
            <div className="max-w-3xl">
              <h2 className="pc-display text-3xl md:text-5xl font-semibold leading-tight">Una scelta dura anni. Vale la pena farla bene.</h2>
              <p className="text-[#dbe5df] text-lg leading-8 mt-5">
                Nel 2025, nei canili rifugio dei 221 comuni mappati da Legambiente, oltre due cani su dieci tra quelli entrati — circa 3.000 — non risultavano adottati, restituiti ai proprietari o inseriti come cani di quartiere.
              </p>
              <p className="text-sm text-[#b9c8bf] leading-6 mt-4">
                Questo dato non dimostra che una scelta di razza sbagliata sia la causa. Mostra perché prevenzione, compatibilità e gestione responsabile meritano attenzione.
              </p>
              <div className="flex flex-wrap gap-3 mt-7">
                <button type="button" onClick={() => navigate('/prima-del-cane')} className="pc-btn pc-btn-inverse">
                  Inizia dalla tua situazione <ArrowRight className="w-4 h-4" />
                </button>
                <a href="https://www.legambiente.it/attivita-scientifiche/animali-in-citta" target="_blank" rel="noreferrer" className="pc-btn border border-white/25 text-white hover:bg-white/10">
                  Fonte e contesto <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <p className="text-xs text-[#9fb0a6] mt-4">Legambiente · Animali in Città 2026 · dati riferiti a 221 comuni</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="max-w-3xl">
          <p className="pc-kicker">Il tuo prossimo passo utile</p>
          <h2 className="pc-display text-4xl md:text-5xl font-semibold mt-3">Capire. Decidere. Agire.</h2>
          <p className="pc-lead mt-5">
            PortaleCinofilo non prova a trattenerti più a lungo possibile. Ti porta al passo successivo che può davvero migliorare la vita con un cane.
          </p>
        </div>
        <div className="grid lg:grid-cols-3 gap-4 mt-10">
          <PathCard number="01" title="Sto pensando di prendere un cane" text="Parti dalla tua vita reale: tempo, solitudine, attività, famiglia, budget e complessità gestionale. Poi restringi il campo." cta="Inizia Prima del cane" icon={Compass} onClick={() => navigate('/prima-del-cane')} />
          <PathCard number="02" title="Voglio capire meglio il cane" text="Impara attraverso sottolezioni, osservazione, attività pratiche e verifiche. Non un blog: un percorso." cta="Vai a Impara" icon={BookOpen} onClick={() => navigate('/impara')} />
          <PathCard number="03" title="Mi serve un professionista" text="Confronta profili approvati, servizi e informazioni concrete. La competenza viene prima della popolarità." cta="Trova un professionista" icon={Search} onClick={() => navigate('/search')} />
        </div>
      </section>

      <section className="pc-evidence-surface border-y border-[#cedde1]">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-16">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--pc-evidence-700)]">Evidence layer</p>
              <h2 className="pc-display text-4xl md:text-5xl font-semibold mt-3">Non devi crederci sulla parola.</h2>
              <p className="text-[var(--pc-muted-600)] text-lg leading-8 mt-5 max-w-xl">
                Le affermazioni importanti devono poter essere controllate. Fonte, contesto e limiti fanno parte del contenuto.
              </p>
            </div>
            <div className="space-y-3">
              {[
                ['Dati con contesto', 'Anno, popolazione osservata e limiti prima del numero.'],
                ['Metodo dichiarato', 'Distinguiamo ricerca, fonte ufficiale, sintesi editoriale e approcci professionali.'],
                ['Limiti espliciti', 'Quando i dati non permettono una conclusione, PortaleCinofilo non la inventa.'],
              ].map(([title, text]) => (
                <div key={title} className="bg-[var(--pc-paper)] border border-[#cedde1] rounded-2xl p-5 flex gap-4">
                  <ShieldCheck className="w-5 h-5 text-[var(--pc-evidence-700)] shrink-0 mt-0.5" />
                  <div><h3 className="font-bold">{title}</h3><p className="text-sm text-[var(--pc-muted-600)] leading-6 mt-1">{text}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid lg:grid-cols-[1fr_0.9fr] gap-10 lg:gap-16 items-center">
          <div>
            <p className="pc-kicker">Impara</p>
            <h2 className="pc-display text-4xl md:text-5xl font-semibold mt-3">Possedere un cane non significa conoscerlo.</h2>
            <p className="pc-lead mt-5 max-w-2xl">
              Lo Stage 1 parte dalle fondamenta e arriva all’osservazione pratica. Il progresso non premia lo scrolling: studio, attività e verifica hanno pesi diversi.
            </p>
            <button type="button" onClick={() => navigate('/impara')} className="pc-btn pc-btn-primary mt-7">Entra in Impara <ArrowRight className="w-4 h-4" /></button>
          </div>
          <div className="pc-card p-6 md:p-8">
            <p className="pc-number">ESEMPIO DI PROGRESSIONE</p>
            <div className="mt-6 space-y-5">
              {[
                ['○', 'Da conoscere', 'Il concetto non è ancora stato affrontato.', 'text-[var(--pc-muted-600)]'],
                ['◐', 'Appreso', 'Hai studiato e completato l’attività prevista.', 'text-[var(--pc-ochre-900)]'],
                ['✓', 'Verificato', 'Hai dimostrato di aver capito con una verifica.', 'text-[var(--pc-forest-700)]'],
              ].map(([symbol, title, text, color]) => (
                <div key={title} className="flex gap-4"><div className={`text-2xl font-bold ${color}`}>{symbol}</div><div><div className="font-bold">{title}</div><div className="text-sm text-[var(--pc-muted-600)] leading-6 mt-1">{text}</div></div></div>
              ))}
            </div>
            <div className="pc-rule my-6" />
            <div className="flex items-center gap-3 text-sm font-bold text-[var(--pc-forest-900)]"><TraceMark /> comprendi → applica → verifica</div>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--pc-line)] bg-[var(--pc-paper)]">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-end">
            <div className="max-w-3xl">
              <p className="pc-kicker">Rete professionale</p>
              <h2 className="pc-display text-4xl md:text-5xl font-semibold mt-3">Quando serve aiuto, deve essere quello giusto.</h2>
              <p className="pc-lead mt-5">Esplora professionisti approvati e confronta servizi, esperienza e informazioni disponibili senza trasformare il numero di recensioni in una misura automatica di competenza.</p>
            </div>
            <button type="button" onClick={() => navigate('/search')} className="pc-btn pc-btn-primary lg:mb-1">Cerca professionisti <ArrowRight className="w-4 h-4" /></button>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-10">
            {[
              ['01', 'Competenza leggibile', 'Titoli, esperienza, servizi e stato di approvazione devono essere comprensibili.'],
              ['02', 'Richieste pertinenti', 'Il proprietario arriva alla prenotazione con informazioni utili sul proprio cane.'],
              ['03', 'Niente false classifiche', 'Le recensioni aiutano, ma non sostituiscono qualifiche, esperienza e compatibilità del caso.'],
            ].map(([number, title, text]) => (
              <div key={number} className="border-t border-[var(--pc-line)] pt-5"><div className="pc-number">{number}</div><h3 className="font-bold text-lg mt-2">{title}</h3><p className="text-sm text-[var(--pc-muted-600)] leading-6 mt-2">{text}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="pc-surface-dark">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          <div className="max-w-4xl">
            <TraceMark className="text-[var(--pc-ochre-500)]" />
            <h2 className="pc-display text-4xl md:text-6xl font-semibold mt-5">Il cane non può scegliere la famiglia in cui vivrà. Tu puoi scegliere meglio.</h2>
            <p className="text-[#c9d8cf] text-lg leading-8 mt-5 max-w-2xl">Il primo passo non è trovare la razza più bella. È capire quale vita sei davvero in grado di condividere.</p>
            <button type="button" onClick={() => navigate('/prima-del-cane')} className="pc-btn pc-btn-inverse mt-8">Inizia Prima del cane <ArrowRight className="w-4 h-4" /></button>
          </div>
        </div>
      </section>
    </div>
  );
}
