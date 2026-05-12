import { Mail, ShieldCheck, FileText, AlertTriangle } from 'lucide-react';

export function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="Informativa base per la fase beta di PawConnect."
      icon={<ShieldCheck className="w-7 h-7" />}
    >
      <Notice />

      <Section title="1. Titolare del progetto">
        <p>
          PawConnect / PortaleCinofilo.it è un progetto in fase beta gestito da Luigi Ciapparelli.
          Per richieste relative alla privacy puoi scrivere a:
        </p>
        <p className="font-semibold mt-2">DearerMetal525@proton.me</p>
      </Section>

      <Section title="2. Dati che possiamo raccogliere">
        <p>Durante l’utilizzo della piattaforma possiamo raccogliere:</p>
        <ul>
          <li>dati account: nome, email, telefono, ruolo;</li>
          <li>dati del cane inseriti dal proprietario;</li>
          <li>dati del profilo professionista: servizi, zona, esperienza, qualifiche, prezzi indicativi;</li>
          <li>dati relativi a richieste di prenotazione e comunicazioni operative;</li>
          <li>dati tecnici necessari al funzionamento del sito.</li>
        </ul>
      </Section>

      <Section title="3. Finalità">
        <p>I dati sono usati per:</p>
        <ul>
          <li>creare e gestire account cliente/professionista;</li>
          <li>mostrare profili professionali approvati;</li>
          <li>gestire richieste di prenotazione;</li>
          <li>migliorare sicurezza, qualità e affidabilità della piattaforma;</li>
          <li>contattare utenti e professionisti per finalità operative legate al servizio.</li>
        </ul>
      </Section>

      <Section title="4. Profili professionisti">
        <p>
          I profili professionisti possono essere visibili pubblicamente solo dopo approvazione manuale.
          Non tutti i candidati vengono pubblicati. Le informazioni pubbliche possono includere nome,
          attività, zona servita, servizi, prezzi indicativi, bio, qualifiche dichiarate e foto.
        </p>
      </Section>

      <Section title="5. Condivisione dei dati">
        <p>
          I dati non vengono venduti. Alcune informazioni possono essere trattate tramite servizi tecnici
          necessari al funzionamento della piattaforma, come hosting, database, autenticazione e strumenti email.
        </p>
      </Section>

      <Section title="6. Conservazione e diritti">
        <p>
          Gli utenti possono chiedere aggiornamento, correzione o rimozione dei propri dati scrivendo
          all’indirizzo email indicato. Durante la beta alcune operazioni possono essere gestite manualmente.
        </p>
      </Section>

      <Section title="7. Cookie e strumenti tecnici">
        <p>
          Il sito può usare strumenti tecnici necessari per login, sicurezza e funzionamento. Eventuali strumenti
          analitici o marketing verranno indicati e configurati in modo più completo prima di un lancio pubblico.
        </p>
      </Section>

      <Section title="8. Aggiornamenti">
        <p>
          Questa informativa può essere aggiornata durante l’evoluzione del progetto, soprattutto prima del lancio
          pubblico e dell’attivazione di servizi avanzati.
        </p>
      </Section>
    </LegalLayout>
  );
}

export function TermsPage() {
  return (
    <LegalLayout
      title="Termini di utilizzo"
      subtitle="Regole base per usare PawConnect durante la fase beta."
      icon={<FileText className="w-7 h-7" />}
    >
      <Notice />

      <Section title="1. Natura del servizio">
        <p>
          PawConnect è una piattaforma beta che aiuta proprietari di cani a trovare professionisti e servizi
          cinofili selezionati nella propria zona. La piattaforma non è un servizio veterinario e non sostituisce
          consulenze veterinarie, legali, fiscali o professionali.
        </p>
      </Section>

      <Section title="2. Profili approvati manualmente">
        <p>
          I professionisti possono candidarsi, ma la pubblicazione del profilo è soggetta ad approvazione manuale.
          PawConnect può rifiutare, sospendere o rimuovere profili non coerenti con la qualità o la sicurezza attesa.
        </p>
      </Section>

      <Section title="3. Responsabilità dei professionisti">
        <p>
          Ogni professionista è responsabile delle informazioni inserite, dei servizi offerti, delle qualifiche
          dichiarate, dei prezzi, delle autorizzazioni necessarie e della corretta gestione dei cani affidati.
        </p>
      </Section>

      <Section title="4. Responsabilità dei proprietari">
        <p>
          Il proprietario è responsabile delle informazioni fornite sul cane, inclusi salute, comportamento,
          vaccinazioni, esigenze particolari e possibili criticità. Le richieste devono essere chiare e veritiere.
        </p>
      </Section>

      <Section title="5. Prenotazioni e pagamenti">
        <p>
          In questa fase beta le richieste di prenotazione servono a mettere in contatto proprietario e professionista.
          I pagamenti online e le condizioni commerciali avanzate saranno eventualmente integrati in una fase successiva.
        </p>
      </Section>

      <Section title="6. Contenuti e informazioni">
        <p>
          PawConnect può ospitare descrizioni, foto, servizi e informazioni fornite dagli utenti o dai professionisti.
          Chi invia contenuti dichiara di avere il diritto di usarli e autorizzarne la pubblicazione sulla piattaforma.
        </p>
      </Section>

      <Section title="7. Fase beta">
        <p>
          La piattaforma è in evoluzione. Funzioni, testi, processi di verifica, notifiche e modalità operative possono
          cambiare durante lo sviluppo.
        </p>
      </Section>

      <Section title="8. Contatti">
        <p>
          Per richieste o segnalazioni puoi scrivere a DearerMetal525@proton.me.
        </p>
      </Section>
    </LegalLayout>
  );
}

export function ContactPage() {
  return (
    <LegalLayout
      title="Contatti"
      subtitle="Per informazioni, candidature professionisti e feedback sulla beta."
      icon={<Mail className="w-7 h-7" />}
    >
      <div className="grid md:grid-cols-2 gap-5">
        <InfoCard title="Email">
          <p className="text-stone-700">DearerMetal525@proton.me</p>
          <a
            href="mailto:DearerMetal525@proton.me"
            className="inline-flex mt-4 px-4 py-2 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
          >
            Scrivi email
          </a>
        </InfoCard>

        <InfoCard title="Area beta">
          <p className="text-stone-700">
            PawConnect è in fase beta locale su Rimini, Riccione, Cattolica e zone vicine.
          </p>
        </InfoCard>

        <InfoCard title="Per professionisti">
          <p className="text-stone-700">
            Se sei educatore, addestratore, pensione, dog sitter o dog walker, puoi candidarti dalla pagina
            “Diventa professionista”.
          </p>
        </InfoCard>

        <InfoCard title="Per proprietari">
          <p className="text-stone-700">
            Puoi cercare professionisti approvati, consultare i profili e inviare richieste di prenotazione.
          </p>
        </InfoCard>
      </div>
    </LegalLayout>
  );
}

function LegalLayout({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-stone-50">
      <section className="bg-stone-950 text-white">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-300 border border-emerald-400/20 mb-6">
            {icon}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">{title}</h1>
          <p className="text-stone-300 mt-3 text-lg">{subtitle}</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-10">
        <div className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm">
          {children}
        </div>
      </section>
    </main>
  );
}

function Notice() {
  return (
    <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3 text-amber-900">
      <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
      <div>
        <div className="font-bold">Bozza operativa</div>
        <p className="text-sm mt-1">
          Questo testo è una base per la fase beta e non sostituisce una revisione legale professionale.
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7 last:mb-0">
      <h2 className="text-xl font-bold text-stone-900 mb-2">{title}</h2>
      <div className="prose prose-stone max-w-none text-stone-700 prose-ul:my-2 prose-li:my-1">
        {children}
      </div>
    </section>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-stone-200 rounded-2xl p-5 bg-stone-50">
      <h2 className="text-xl font-bold text-stone-900 mb-2">{title}</h2>
      {children}
    </div>
  );
}
