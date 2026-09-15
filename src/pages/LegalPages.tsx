import {
  AlertTriangle,
  Cookie,
  FileText,
  ListOrdered,
  Mail,
  Scale,
  ShieldCheck,
} from 'lucide-react';

const CONTACT_EMAIL = 'DearerMetal525@proton.me';

export function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="Come PortaleCinofilo tratta i dati personali durante la fase beta."
      icon={<ShieldCheck className="w-7 h-7" />}
    >
      <VersionStamp />

      <Section title="1. Titolare del trattamento">
        <p>
          Il titolare del trattamento per la fase beta è <strong>Luigi Ciapparelli</strong>,
          che gestisce PortaleCinofilo come persona fisica.
        </p>
        <p className="mt-2">
          Contatto privacy e legale:{' '}
          <a className="font-semibold underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </p>
      </Section>

      <Section title="2. Dati trattati">
        <p>In base alle funzioni utilizzate, PortaleCinofilo può trattare:</p>
        <ul>
          <li>dati account e contatto, come nome, email, telefono e ruolo;</li>
          <li>informazioni del profilo proprietario e dei cani associati;</li>
          <li>
            informazioni professionali, servizi, prezzi indicativi, esperienza, qualifiche,
            risultati, fonti e stato delle verifiche;
          </li>
          <li>richieste inviate, stati operativi e comunicazioni legate al servizio;</li>
          <li>foto, note e altri contenuti caricati volontariamente;</li>
          <li>dati tecnici, log e informazioni necessarie a sicurezza e funzionamento.</li>
        </ul>
      </Section>

      <Section title="3. Finalità e basi giuridiche">
        <p>I dati vengono trattati, a seconda dei casi, per:</p>
        <ul>
          <li>
            fornire account, ricerca, profili, richieste e altre funzioni richieste dall'utente,
            sulla base dell'esecuzione del servizio;
          </li>
          <li>
            proteggere la piattaforma, prevenire abusi e mantenere affidabili profili e verifiche,
            sulla base del legittimo interesse del titolare;
          </li>
          <li>adempiere a eventuali obblighi di legge;</li>
          <li>
            svolgere attività opzionali che richiedano consenso, solo quando e se verranno introdotte.
          </li>
        </ul>
      </Section>

      <Section title="4. Visibilità e condivisione">
        <p>
          I profili dei proprietari e i dati dei cani non diventano pubblici automaticamente.
          I professionisti ricevono le informazioni rese disponibili nell'ambito di una richiesta
          o relazione autorizzata e nella misura necessaria alla relativa attività.
        </p>
        <p className="mt-3">
          I profili professionali approvati possono invece mostrare informazioni destinate alla
          pubblicazione, come nome, zona, servizi, bio, prezzi indicativi, esperienza, qualifiche,
          risultati, fonti e stati di verifica.
        </p>
        <p className="mt-3">
          La documentazione privata usata per verificare qualifiche o risultati non viene resa
          pubblica per impostazione predefinita.
        </p>
      </Section>

      <Section title="5. Fornitori tecnici">
        <p>
          PortaleCinofilo utilizza fornitori tecnici per hosting, database, autenticazione,
          sicurezza e distribuzione dell'applicazione. Nella configurazione attuale rientrano
          servizi come Vercel e Supabase. I fornitori trattano i dati nella misura necessaria
          all'erogazione dei rispettivi servizi.
        </p>
        <p className="mt-3">
          Qualora un fornitore comporti trasferimenti di dati fuori dallo Spazio Economico Europeo,
          tali trasferimenti devono avvenire secondo uno dei meccanismi previsti dalla normativa
          applicabile. L'informativa viene aggiornata quando cambiano fornitori o trattamenti rilevanti.
        </p>
      </Section>

      <Section title="6. Conservazione">
        <p>
          I dati vengono conservati per il tempo necessario a fornire il servizio e, successivamente,
          per il periodo ragionevolmente necessario a sicurezza, gestione di contestazioni, tutela
          dei diritti e obblighi di legge. Quando i dati non sono più necessari vengono cancellati
          o anonimizzati secondo le procedure applicabili.
        </p>
      </Section>

      <Section title="7. Diritti">
        <p>
          Nei casi previsti dalla normativa puoi chiedere accesso, rettifica, cancellazione,
          limitazione, portabilità o opporti al trattamento. Quando il trattamento è basato sul
          consenso, puoi revocarlo per il futuro.
        </p>
        <p className="mt-3">
          Le richieste possono essere inviate a{' '}
          <a className="font-semibold underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          . Resta inoltre possibile proporre reclamo al Garante per la protezione dei dati personali.
        </p>
      </Section>

      <Section title="8. Ranking e decisioni automatizzate">
        <p>
          PortaleCinofilo utilizza criteri automatizzati per ordinare e filtrare risultati di ricerca.
          Il ranking non costituisce una decisione automatizzata destinata a produrre effetti giuridici
          sull'utente ai sensi dell'articolo 22 GDPR. I principali criteri del ranking sono descritti
          nella pagina “Come funziona il ranking”.
        </p>
      </Section>

      <Section title="9. Aggiornamenti">
        <p>
          Questa informativa può essere aggiornata quando cambiano funzioni, fornitori o modalità di
          trattamento. La data di revisione riportata nella pagina consente di identificare la versione
          applicabile.
        </p>
      </Section>
    </LegalLayout>
  );
}

export function CookiePage() {
  return (
    <LegalLayout
      title="Cookie e tecnologie locali"
      subtitle="Una configurazione beta deliberatamente semplice e priva di profilazione pubblicitaria."
      icon={<Cookie className="w-7 h-7" />}
    >
      <VersionStamp />

      <Section title="1. Strumenti necessari">
        <p>
          PortaleCinofilo può utilizzare cookie tecnici, session storage, local storage e tecnologie
          equivalenti strettamente necessarie a login, sicurezza, navigazione, preferenze e salvataggio
          di bozze o passaggi dell'esperienza utente.
        </p>
      </Section>

      <Section title="2. Niente profilazione pubblicitaria nella beta">
        <p>
          Nella configurazione attuale della beta PortaleCinofilo non integra strumenti di profilazione
          pubblicitaria, retargeting o tracking cross-site come Meta Pixel, TikTok Pixel o analoghi.
        </p>
      </Section>

      <Section title="3. Analytics e marketing futuri">
        <p>
          Se in futuro verranno introdotti strumenti non strettamente necessari, la loro attivazione
          verrà valutata preventivamente e, quando richiesto, subordinata al consenso dell'utente prima
          del relativo utilizzo.
        </p>
      </Section>

      <Section title="4. Gestione dal browser">
        <p>
          Puoi gestire o cancellare cookie e dati locali dalle impostazioni del browser. La rimozione
          di dati tecnici necessari può richiedere un nuovo login o impedire il corretto funzionamento
          di alcune funzioni.
        </p>
      </Section>
    </LegalLayout>
  );
}

export function TermsPage() {
  return (
    <LegalLayout
      title="Termini di utilizzo"
      subtitle="Regole essenziali per proprietari e visitatori della beta PortaleCinofilo."
      icon={<FileText className="w-7 h-7" />}
    >
      <VersionStamp />

      <Section title="1. Natura del servizio">
        <p>
          PortaleCinofilo è una piattaforma digitale dedicata alla cultura cinofila, alla conoscenza,
          alla ricerca di professionisti e alla continuità della relazione tra persona, cane e
          professionista.
        </p>
        <p className="mt-3">
          Salvo indicazione espressa contraria, PortaleCinofilo non presta direttamente il servizio
          cinofilo offerto dal professionista e non diventa parte del rapporto professionale tra
          utente e professionista.
        </p>
      </Section>

      <Section title="2. Account e informazioni fornite">
        <p>
          L'utente deve fornire informazioni accurate e mantenere sicure le proprie credenziali.
          Le informazioni relative al cane, incluse esigenze, comportamento e condizioni rilevanti
          per il servizio richiesto, devono essere comunicate in modo veritiero e responsabile.
        </p>
      </Section>

      <Section title="3. Richieste, accordi e pagamenti">
        <p>
          Nella beta le funzioni di richiesta o prenotazione servono principalmente a mettere in
          contatto proprietario e professionista e a gestirne lo stato operativo. PortaleCinofilo
          non incassa attualmente pagamenti per la prestazione professionale.
        </p>
        <p className="mt-3">
          Prezzo definitivo, condizioni della prestazione, eventuali pagamenti, cancellazioni e altri
          accordi commerciali restano tra proprietario e professionista salvo diversa indicazione
          esplicita futura della piattaforma.
        </p>
      </Section>

      <Section title="4. Profili e verifiche">
        <p>
          PortaleCinofilo distingue tra profilo approvato, professionista verificato, qualifica
          verificata e risultato verificato. Una verifica indica esclusivamente che una specifica
          informazione ha superato il processo previsto dalla piattaforma sulla base delle evidenze
          disponibili.
        </p>
        <p className="mt-3">
          La verifica non garantisce il risultato futuro di una prestazione e non sostituisce la
          valutazione individuale del professionista da parte dell'utente.
        </p>
      </Section>

      <Section title="5. Albo d'Oro PortaleCinofilo">
        <p>
          L'Albo d'Oro è una classificazione editoriale interna basata sui criteri dichiarati da
          PortaleCinofilo e sulle informazioni verificate disponibili. Non costituisce titolo
          professionale, certificazione pubblica, qualifica ENCI o FCI né riconoscimento rilasciato
          da un'autorità esterna.
        </p>
      </Section>

      <Section title="6. Recensioni e contenuti">
        <p>
          Recensioni e contributi devono riferirsi a esperienze reali e rispettare persone e legge.
          PortaleCinofilo può moderare o rimuovere contenuti falsi, manipolati, abusivi, illeciti,
          discriminatori o non pertinenti.
        </p>
        <p className="mt-3">
          Chi carica testi, foto o altri contenuti dichiara di avere il diritto di utilizzarli e
          concede alla piattaforma le autorizzazioni necessarie a mostrarli nell'ambito del servizio.
        </p>
      </Section>

      <Section title="7. Contenuti educativi">
        <p>
          I contenuti di Impara, Prima del cane e delle altre aree informative hanno finalità
          generali di educazione e informazione. Non sostituiscono una valutazione veterinaria,
          comportamentale o professionale individuale quando questa sia necessaria.
        </p>
      </Section>

      <Section title="8. Beta e disponibilità">
        <p>
          PortaleCinofilo è in fase beta: funzioni e processi possono evolvere. Correzioni, manutenzione
          o esigenze di sicurezza possono rendere temporaneamente indisponibili parti del servizio.
        </p>
      </Section>

      <Section title="9. Segnalazioni">
        <p>
          Per assistenza, contestazioni o segnalazioni puoi scrivere a{' '}
          <a className="font-semibold underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  );
}

export function ProfessionalTermsPage() {
  return (
    <LegalLayout
      title="Termini per i professionisti"
      subtitle="Trasparenza su pubblicazione, verifiche, ranking e rapporto con PortaleCinofilo."
      icon={<Scale className="w-7 h-7" />}
    >
      <VersionStamp />

      <Section title="1. Candidatura e pubblicazione">
        <p>
          La candidatura non comporta automaticamente la pubblicazione. PortaleCinofilo può verificare
          coerenza, identità, informazioni professionali e requisiti ritenuti necessari prima di
          approvare un profilo.
        </p>
      </Section>

      <Section title="2. Veridicità delle informazioni">
        <p>
          Il professionista è responsabile della veridicità e dell'aggiornamento di nome, servizi,
          prezzi indicativi, esperienza, qualifiche, risultati, fotografie, fonti e documentazione
          caricata e dichiara di avere il diritto di utilizzarli.
        </p>
        <p className="mt-3">
          Informazioni false, documenti manipolati, appropriazione dell'identità altrui o risultati
          non veritieri possono comportare rimozione del dato, perdita dello stato verificato,
          sospensione o esclusione dalla piattaforma.
        </p>
      </Section>

      <Section title="3. Significato delle verifiche">
        <ul>
          <li><strong>Profilo approvato:</strong> il profilo può essere pubblicato nella piattaforma.</li>
          <li><strong>Professionista verificato:</strong> il processo previsto per il profilo è stato completato.</li>
          <li><strong>Qualifica verificata:</strong> la verifica riguarda esclusivamente la specifica qualifica.</li>
          <li><strong>Risultato verificato:</strong> la verifica riguarda esclusivamente lo specifico risultato.</li>
        </ul>
        <p className="mt-3">
          Le verifiche possono essere corrette, revocate o riesaminate quando emergono nuovi elementi,
          errori o variazioni della fonte.
        </p>
      </Section>

      <Section title="4. Ranking">
        <p>
          I principali criteri del ranking sono descritti nella pagina “Come funziona il ranking”.
          In particolare, corrispondenza con il servizio cercato, area geografica, esperienza,
          informazioni verificate e, per determinate ricerche sportive o di addestramento, merito
          sportivo verificato possono incidere sulla posizione.
        </p>
        <p className="mt-3 font-semibold">
          L'acquisto di un eventuale piano PortaleCinofilo Pro non consente di acquistare una posizione
          migliore nel ranking meritocratico.
        </p>
      </Section>

      <Section title="5. Accesso ai dati del cliente e del cane">
        <p>
          Il professionista può utilizzare i dati resi disponibili tramite PortaleCinofilo soltanto
          per gestire la richiesta o relazione autorizzata e nel rispetto della normativa applicabile.
          Non acquisisce diritti generali sul database, sui dati di altri utenti o su informazioni
          non necessarie alla relazione.
        </p>
      </Section>

      <Section title="6. Restrizioni, sospensione e cessazione">
        <p>
          In caso di restrizione o sospensione PortaleCinofilo comunica, salvo impedimenti legali o
          motivi di sicurezza, le ragioni principali della decisione. Nei casi gravi, urgenti,
          fraudolenti, illeciti o di ripetuta violazione delle regole possono essere adottate misure
          immediate nei limiti consentiti dalla normativa applicabile.
        </p>
      </Section>

      <Section title="7. Modifiche dei termini">
        <p>
          Le modifiche sostanziali dei presenti termini vengono comunicate ai professionisti con un
          preavviso normalmente non inferiore a 15 giorni, salvo i casi in cui la legge consenta o
          richieda un'applicazione più rapida.
        </p>
      </Section>

      <Section title="8. Contestazioni e contatti">
        <p>
          Un professionista può chiedere chiarimenti, contestare una verifica o segnalare un problema
          scrivendo a{' '}
          <a className="font-semibold underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          . Durante la beta le contestazioni possono essere gestite manualmente.
        </p>
      </Section>
    </LegalLayout>
  );
}

export function RankingPage() {
  return (
    <LegalLayout
      title="Come funziona il ranking"
      subtitle="I principali criteri con cui PortaleCinofilo ordina i risultati."
      icon={<ListOrdered className="w-7 h-7" />}
    >
      <VersionStamp />

      <Section title="1. Obiettivo">
        <p>
          Il ranking prova a mostrare risultati pertinenti alla ricerca dell'utente senza trasformare
          la competenza professionale in uno spazio pubblicitario acquistabile.
        </p>
      </Section>

      <Section title="2. Principali fattori">
        <p>A seconda della ricerca possono contribuire, tra gli altri:</p>
        <ul>
          <li>corrispondenza tra servizio cercato e servizi realmente offerti;</li>
          <li>zona, distanza e raggio di copertura;</li>
          <li>tipo di professionista o struttura e altri filtri selezionati dall'utente;</li>
          <li>esperienza professionale dichiarata o verificata, quando pertinente;</li>
          <li>qualifiche e risultati con stato di verifica;</li>
          <li>prezzo, rating e altri criteri secondari quando pertinenti all'ordinamento scelto.</li>
        </ul>
      </Section>

      <Section title="3. Merito sportivo">
        <p>
          Nelle ricerche legate all'addestramento e alla carriera sportiva, il merito verificato può
          avere rilevanza primaria. Possono contribuire il livello sportivo raggiunto, la disciplina,
          il numero di cani distinti portati a risultati verificati, la ripetibilità dei risultati,
          il livello della competizione e il piazzamento.
        </p>
        <p className="mt-3">
          Risultati soltanto dichiarati o ancora in attesa di verifica non ricevono lo stesso peso
          dei risultati verificati.
        </p>
      </Section>

      <Section title="4. Distanza e professionisti di merito">
        <p>
          La distanza resta importante, ma in alcune ricerche PortaleCinofilo può rendere visibili
          professionisti con merito sportivo verificato anche oltre il normale raggio locale, così
          che l'utente possa confrontare competenze particolarmente rilevanti.
        </p>
      </Section>

      <Section title="5. Nessun pay-to-rank">
        <p className="font-semibold">
          Pagare PortaleCinofilo non permette di comprare merito, verifiche o una posizione migliore
          nel ranking meritocratico.
        </p>
        <p className="mt-3">
          Eventuali futuri servizi a pagamento potranno offrire strumenti professionali aggiuntivi,
          ma non altereranno la sostanza dei criteri di competenza e merito dichiarati in questa pagina.
        </p>
      </Section>

      <Section title="6. Limiti">
        <p>
          Il ranking è uno strumento di orientamento e non garantisce che il primo risultato sia il
          professionista migliore in assoluto per ogni cane o situazione. L'utente deve valutare il
          profilo completo, il contesto e il confronto diretto con il professionista.
        </p>
      </Section>
    </LegalLayout>
  );
}

export function ContactPage() {
  return (
    <LegalLayout
      title="Contatti"
      subtitle="Informazioni, candidature, assistenza e segnalazioni sulla beta."
      icon={<Mail className="w-7 h-7" />}
    >
      <div className="grid md:grid-cols-2 gap-5">
        <InfoCard title="Email">
          <p className="text-[#3F4943]">{CONTACT_EMAIL}</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex mt-4 px-4 py-2 rounded-full bg-[#163D2A] text-white font-semibold hover:bg-[#235B40]"
          >
            Scrivi email
          </a>
        </InfoCard>

        <InfoCard title="Area beta">
          <p className="text-[#3F4943]">
            PortaleCinofilo sta preparando la beta locale in Romagna prima dell'espansione nazionale.
          </p>
        </InfoCard>

        <InfoCard title="Per professionisti">
          <p className="text-[#3F4943]">
            Educatori, addestratori e altri professionisti possono candidarsi dalla pagina
            “Diventa professionista”.
          </p>
        </InfoCard>

        <InfoCard title="Segnalazioni e contestazioni">
          <p className="text-[#3F4943]">
            Puoi segnalare contenuti, problemi, verifiche contestate o comportamenti non conformi
            scrivendo all'indirizzo indicato e descrivendo il profilo o la richiesta interessata.
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
    <main className="min-h-screen bg-[#F5F1E7]">
      <section className="bg-[#18211C] text-white">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#235B40]/30 text-[#E4EEE7] border border-[#E4EEE7]/15 mb-6">
            {icon}
          </div>
          <p className="uppercase tracking-[0.22em] text-xs font-semibold text-[#D5A33A] mb-3">
            PortaleCinofilo · Beta
          </p>
          <h1 className="text-4xl md:text-5xl font-bold">{title}</h1>
          <p className="text-[#D7DED8] mt-3 text-lg">{subtitle}</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-10">
        <div className="bg-[#FFFEFA] border border-[#D8D5CC] rounded-3xl p-6 md:p-8 shadow-sm">
          {children}
        </div>
      </section>
    </main>
  );
}

function VersionStamp() {
  return (
    <div className="mb-8 rounded-2xl border border-[#D5A33A]/30 bg-[#D5A33A]/10 p-4 flex gap-3 text-[#58451A]">
      <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
      <div>
        <div className="font-bold">Versione beta</div>
        <p className="text-sm mt-1">
          Ultima revisione: 15 settembre 2026. I testi saranno sottoposti a revisione professionale
          prima della monetizzazione o del lancio commerciale su larga scala.
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7 last:mb-0">
      <h2 className="text-xl font-bold text-[#18211C] mb-2">{title}</h2>
      <div className="prose max-w-none text-[#3F4943] prose-ul:my-2 prose-li:my-1 prose-strong:text-[#18211C]">
        {children}
      </div>
    </section>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#D8D5CC] bg-[#FFFEFA] p-5">
      <h2 className="font-bold text-[#18211C] mb-2">{title}</h2>
      {children}
    </div>
  );
}
