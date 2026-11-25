import { exerciseIndex } from './practiceCatalog';
export type HomeExercise = (typeof exerciseIndex)[number] & {setup: string; steps: string[]; observe: string; easier: string; stop: string};
function card(slug: string, setup: string, steps: string[], observe: string, easier: string, stop: string): HomeExercise {
  const info = exerciseIndex.find(entry => entry.slug === slug);
  if (!info) throw new Error('Esercizio senza indice: ' + slug);
  return {...info, setup, steps, observe, easier, stop};
}
export const homeExercises: HomeExercise[] = [
  card('rispondere-al-nome','Una stanza tranquilla; resta vicino, di lato al cane.',[
    'Aspetta un momento in cui è sveglio e non sta mangiando o dormendo. Pronuncia il nome una volta, con voce normale.',
    'Appena inizia a voltarsi, fagli arrivare un piccolo premio dove si trova. Non chiedere anche un seduto.',
    'Lascialo tornare a ciò che stava facendo. In un altro momento prova da una posizione diversa.'
  ],'Si orienta alla prima chiamata? Annota cosa stava facendo prima.','Togli una distrazione oppure avvicinati.','Se si sottrae alla tua voce, non seguirlo e non ripetere il nome più forte.'),
  card('parola-premio','Scegliete una parola breve e preparate il premio prima di iniziare.',[
    'Di’ la parola una volta e falla seguire dal premio. Qui il cane non deve fare nulla per ottenerlo.',
    'Fai una pausa. Ripeti solo se è ancora a suo agio. Anche quando sbagli il momento, fai seguire il premio.',
    'Quando il segnale gli è familiare, usalo mentre si gira spontaneamente verso di te e poi premia.'
  ],'La parola arriva mentre il cane si gira, o solo dopo che ha già fatto altro?','Prima prova il tempismo senza il cane, con un familiare che batte una mano sul tavolo.','Se il suono lo fa sobbalzare, fermati e scegli con l’istruttore un segnale più discreto.'),
  card('bisogni-fuori','Scegli un’area tranquilla e adatta al cucciolo con chi lo segue.',[
    'Al risveglio o dopo il gioco, accompagnalo nello stesso punto e dagli tempo di annusare.',
    'Aspetta che finisca prima di lodarlo o premiarlo sul posto. Una breve esplorazione può seguire.',
    'Scrivi quando hai colto il momento. Se capita in casa, pulisci senza sgridarlo e prova a uscire prima la volta dopo.'
  ],'In quale momento sei riuscito ad anticipare l’uscita?','Parti da un solo momento prevedibile, per esempio il risveglio.','Se noti un cambiamento improvviso o difficoltà a urinare, sospendi la prova e senti il veterinario.'),
  card('mordicchiare-nel-gioco','Un adulto, un gioco morbido abbastanza lungo e un posto dove riposare.',[
    'Inizia il gioco tenendo l’oggetto lontano dalle mani. Muovilo piano e basso.',
    'Se lascia il gioco per la manica, ferma il movimento; quando c’è spazio proponi di nuovo l’oggetto.',
    'Fai una pausa prima che abbia bisogno di afferrarti ancora. Osserva se cerca altro gioco o riposo.'
  ],'È riuscito a tornare al gioco o aveva soprattutto bisogno di calma?','Accorcia il gioco successivo e prepara prima l’oggetto.','Se il contatto fa male, il cane si irrigidisce o ci sono bambini coinvolti, interrompi e fatti seguire.'),
  card('esplorare-una-novita','Un oggetto fermo e innocuo, in uno spazio noto con una via di uscita.',[
    'Sistema l’oggetto prima che arrivi il cane. Resta a una distanza alla quale può guardare senza avvicinarsi.',
    'Se annusa l’aria o si volta verso di te, accogli quella scelta. Non attirarlo fino all’oggetto con il cibo.',
    'Andate via insieme se vuole. La prima esperienza può finire senza averlo toccato.'
  ],'Che distanza ha scelto? Dopo aver guardato è riuscito a fare altro?','Usa un oggetto più familiare o spostalo più lontano.','Se tenta di fuggire, si blocca o non recupera, togli lo stimolo e chiedi indicazioni.'),
  card('riposo-sul-tappeto','Un tappeto che non scivola, lontano dal passaggio; siediti accanto.',[
    'Lascia libero l’accesso e aspetta che il cane si avvicini di sua iniziativa.',
    'Se vi resta, appoggia piano il premio tra le zampe. Evita di chiamarlo perché ti guardi.',
    'Se si allontana, lascialo andare. La prossima volta prova mentre leggi per un momento.'
  ],'Si è fermato spontaneamente? Ha potuto alzarsi senza essere rimesso al posto?','Usa il suo posto abituale e riduci rumore e passaggio.','Se ansima, si agita o cerca di allontanarsi, chiudi e lascia libero il passaggio.'),
  card('attesa-alla-porta','Inizia da una porta interna; tieni chiuse le uscite su strada.',[
    'Avvicinati alla porta chiusa e fermati. Nota un istante in cui il cane rimane accanto a te.',
    'Tocca la maniglia; se resta tranquillo, apri uno spiraglio. Se si precipita lascia la maniglia e riparti più lontano.',
    'Di’ il vostro segnale di via e attraversate insieme. Non chiudere mai l’anta sul cane.'
  ],'A che punto è partito: con la mano, con lo spiraglio o al vostro via?','Premia una pausa a porta chiusa.','Se la porta dà sul traffico o non puoi impedire una fuga, non fare la prova lì.'),
  card('salutare-con-quattro-zampe','Una persona adulta conosciuta, spazio per arretrare e un ingresso tranquillo.',[
    'Chiedi alla persona di restare di lato. Parti abbastanza lontano perché il cane possa guardarla.',
    'Quando le quattro zampe sono a terra, la persona può fare un piccolo passo. Premia basso se questo lo aiuta.',
    'Lascia che si allontani dopo il saluto. Se salta, aumentate la distanza senza spingerlo via.'
  ],'A quale distanza ha salutato senza slanciarsi?','Prova con un familiare già seduto, senza suonare il campanello.','Se ringhia, indietreggia o l’ospite non è a suo agio, interrompi il saluto.'),
  card('a-tavola','Prepara il posto di riposo prima di apparecchiare; inizia da uno spuntino breve.',[
    'Mentre un adulto si siede, accompagna il cane verso il posto che già conosce, senza trattenerlo.',
    'Quando si sistema, lascia un piccolo premio sul posto. Chi è a tavola evita di chiamarlo e di passargli avanzi.',
    'Finisci la prova mentre è ancora tranquillo. Al prossimo pasto cambia un solo dettaglio.'
  ],'È rimasto tranquillo mentre una persona si sedeva o si alzava?','Fai la prima prova con la tavola vuota.','Se il cibo provoca competizione con persone o animali, separa gli spazi e parlane con l’istruttore.'),
  card('brevi-separazioni','Solo con un cane già tranquillo in casa. Lascia una via aperta e nessun obbligo di restare.',[
    'Mentre è rilassato fai un piccolo passo di lato e torna. Non chiedere un resta.',
    'In un momento successivo aumenta appena la distanza solo se il primo passo non lo ha allarmato.',
    'Se ti segue, lascialo fare: annota il punto di partenza. Non uscire di casa per metterlo alla prova.'
  ],'È rimasto rilassato o si è alzato appena ti sei mosso?','Limita la prova al gesto di alzarti e sederti.','Se ci sono già vocalizzi, agitazione o tentativi di fuga quando esci, salta questa scheda e chiedi un piano individuale.'),
  card('guinzaglio-morbido','Scegli un tratto tranquillo e sicuro, con attrezzatura ben regolata e già familiare.',[
    'Parti quando il guinzaglio forma una curva. Fai due passi alla velocità del cane.',
    'Mentre è ancora morbido, premia vicino al tuo fianco. Poi lascia tempo per annusare.',
    'Se si tende, rallenta e fermati senza dare strattoni. Riparti quando torna un po’ di spazio.'
  ],'Dove si è teso per la prima volta? Bastano due passi osservati bene.','Prova in cortile o nel corridoio e fai un passo solo.','Se tira per allontanarsi da qualcosa che lo spaventa, accompagnalo a distanza invece di fermarlo sul posto.'),
  card('inversione-in-passeggiata','Un luogo sgombro; impara il movimento quando non c’è nulla da evitare.',[
    'Dì il segnale concordato mentre il cane è vicino e il guinzaglio è morbido.',
    'Gira con una curva ampia. Premia quando cambia direzione con te senza essere trascinato.',
    'Riprendi la passeggiata. Provalo in un altro tratto facile prima di usarlo in città.'
  ],'Quando hai iniziato la curva il cane aveva spazio per seguirti?','Disegna una curva più larga e muoviti lentamente.','Se lo spazio non consente una curva o siete già in difficoltà, pensa solo ad allontanarti in sicurezza.'),
  card('incroci-a-distanza','Una zona ampia con una via alternativa; nessun incontro organizzato per metterlo alla prova.',[
    'Appena noti un passante, scegli con anticipo una traiettoria spaziosa.',
    'Se il cane guarda e poi riesce a rivolgersi altrove, continua sulla curva o lascia che annusi.',
    'Mentre vi allontanate, annota ambiente e distanza utile. Non ridurla nello stesso incontro.'
  ],'Poteva distogliere lo sguardo e proseguire?','Cambia lato molto prima o osserva da un luogo più tranquillo.','Se si irrigidisce, abbaia ripetutamente o si slancia, aumenta la distanza. Non provocare un altro incontro per esercitarti.'),
  card('richiamo-vicino','In casa o in un’area realmente recintata. Parti a pochi passi, senza competizione.',[
    'Quando è libero di raggiungerti, usa una sola volta la parola concordata.',
    'Accogli il cane vicino a te e premia. Non chinarti su di lui e non inseguirlo.',
    'Rilascialo perché torni a esplorare. Se non viene, la prossima prova sarà più facile.'
  ],'È arrivato fino a te o si è fermato prima? Dove si trovava all’inizio?','Riduci la distanza e scegli un momento senza odori o giochi molto interessanti.','Non provare il richiamo in libertà vicino a strade, fauna o cani sconosciuti.'),
  card('annusare-e-ripartire','Un punto sicuro in cui è consentito fermarsi e un tratto facile per ripartire.',[
    'Lascia il guinzaglio morbido mentre esplora e aspetta che rallenti o alzi il naso.',
    'Dai un breve invito e fai un passo. Se viene con te premia la ripartenza.',
    'Dopo pochi passi concedi un’altra esplorazione: partire con te non fa finire tutte le cose interessanti.'
  ],'Hai chiesto la ripartenza durante l’annusata o quando stava già finendo?','Scegli un odore meno coinvolgente e aspetta un istante in più.','Se tenta di ingerire qualcosa di rischioso, metti in sicurezza la situazione e interrompi l’esercizio.'),
  card('seduto','Superficie stabile e non scivolosa; lavora solo se sedersi gli è confortevole.',[
    'Aspetta un seduto spontaneo. Segnala il momento in cui il posteriore tocca a terra e premia.',
    'Lascialo rialzare. Quando anticipi con facilità il movimento, pronuncia il segnale appena prima.',
    'Prova in un altro momento e dì la parola una volta. Non spingere il dorso.'
  ],'Si è seduto comodamente o ha solo seguito la tua mano?','Torna a osservare un seduto spontaneo senza parola.','Se evita di sedersi, si alza con difficoltà o sembra dolorante, interrompi e parlane con il veterinario.'),
  card('terra','Usa il tappeto sul quale ama già sdraiarsi, lontano dal passaggio.',[
    'Mentre si sistema, osserva i gomiti. Nel momento in cui toccano a terra, segna e premia in basso.',
    'Lascia che si rialzi quando vuole. Ripeti solo in occasioni spontanee.',
    'Quando sai prevedere il gesto, pronuncia il segnale prima che inizi a sdraiarsi.'
  ],'I gomiti erano già a terra prima del premio?','Scegli un momento tranquillo e rinuncia per ora al segnale verbale.','Non tirare le zampe né premere sulle spalle. Se il movimento sembra difficile, fermati.'),
  card('resta-e-libero','Inizia accanto al cane in una posizione comoda, senza chiedere distanza.',[
    'Premia un breve istante di quiete mentre resti vicino.',
    'Dì la parola di via e muoviti insieme al cane; la fine deve essere riconoscibile.',
    'In un altro tentativo cambia solo la durata di un istante. Se si muove prima, riparti più facile.'
  ],'Quale dei tuoi gesti viene interpretato come fine dell’attesa?','Rimani fermo e libera il cane quasi subito.','Se aumenta la tensione o continua a rialzarsi, chiudi invece di rimetterlo ripetutamente in posizione.'),
  card('target-mano','Una mano aperta e ferma un poco di lato, mai spinta verso il muso.',[
    'Presenta la mano a portata di naso. Se il cane si avvicina spontaneamente, segna il movimento.',
    'Dai il premio con l’altra mano e ritira entrambe per una pausa.',
    'Al tentativo successivo osserva se tocca il palmo. Solo dopo prova una posizione poco diversa.'
  ],'È stato il cane a chiudere la distanza?','Presenta la mano più bassa e premia il solo sguardo verso di essa.','Se arretra o evita la mano, toglila: non deve abituarsi a essere inseguito dal palmo.'),
  card('scambiare-un-gioco','Due giochi graditi; un adulto e un cane già sereno quando ha oggetti.',[
    'Mentre tiene il primo gioco, mostra il secondo a distanza senza toccare quello che ha in bocca.',
    'Quando lascia spontaneamente, offrigli subito l’altro. Puoi riproporre il primo più tardi.',
    'Solo quando lo scambio è prevedibile, aggiungi una parola prima del rilascio.'
  ],'Ha lasciato di sua iniziativa, senza che tu abbia tirato?','Scegli un oggetto meno prezioso e aumenta lo spazio tra voi.','Se protegge gli oggetti, si irrigidisce o ringhia, non fare prove, non portarglieli via e chiedi aiuto individuale.'),
  card('pettorina-volontaria','Attrezzatura adatta già controllata; scegli un momento diverso dall’uscita urgente.',[
    'Tieni la pettorina ferma e lascia che si avvicini. Premia l’interesse senza inseguirlo.',
    'Per un modello da infilare, fermati anche solo al naso vicino all’apertura; per un modello apribile, al primo contatto sul fianco.',
    'Riabbassa l’attrezzatura. Avvicinamento, appoggio e chiusura sono passi distinti.'
  ],'A quale passaggio il cane è rimasto disponibile?','Riparti dalla sola vista dell’attrezzatura a terra.','Se si nasconde, arretra o mostra disagio fisico, non chiudere le fibbie per finire la prova.'),
  card('contatto-con-pausa','Una zona del corpo dove accetta già il contatto; nessun nodo o zona dolente da trattare.',[
    'Lascia vedere la spazzola, poi fai un solo passaggio leggero in un punto gradito.',
    'Ferma la mano e ritirala. Aspetta: se si allontana, la sessione è finita.',
    'Se torna a cercare il contatto con il corpo rilassato, puoi ripetere un solo passaggio.'
  ],'Che cosa ha fatto durante la pausa, quando poteva scegliere?','Inizia con la sola presenza della spazzola, senza contatto.','Se si sottrae, si irrigidisce o sembra provare dolore, non trattenerlo: chiedi aiuto adeguato.'),
  card('fiuto-facile','Pavimento sgombro, pochi bocconcini adatti e nessun altro animale vicino.',[
    'Fagli vedere un bocconcino mentre lo posi in un punto facile. Lascialo cercare.',
    'Poi posa due bocconcini poco distanti, senza nasconderli in oggetti da smontare o ingerire.',
    'Aspetta che finisca e chiudi la ricerca con un segnale semplice. Nota come ti fa capire che ha finito.'
  ],'Ha usato il naso senza dover seguire il tuo dito?','Riduci lo spazio e lascia il primo premio ben visibile.','Se ingoia materiali o c’è competizione per il cibo, sospendi e cambia attività.'),
  card('piattaforma-shaping','Pedana bassissima, ferma e antiscivolo; il cane deve poter aggirarla.',[
    'Senza guidarlo col cibo, segna uno sguardo o un passo verso la pedana e consegna il premio.',
    'Quando vi torna con facilità, aspetta una zampa e premia. Mantieni questo passo se è sufficiente per oggi.',
    'In un’altra breve prova, osserva se porta spontaneamente anche la seconda zampa anteriore. Non sollevarla tu.'
  ],'Quale piccolo passo hai premiato davvero: sguardo, avvicinamento, una zampa o due?','Premia di nuovo il passo precedente prima che il cane debba indovinare troppo a lungo.','Se la pedana scivola, il cane esita a salirci o si frustra, termina la prova.'),
  card("lasciare-a-terra", "In casa, usa un oggetto grande e poco interessante che non possa ingerire.", [
    "Mettilo a lato del vostro percorso, abbastanza lontano perché il cane possa semplicemente notarlo.",
    "Quando distoglie lo sguardo, premialo vicino a te. Prosegui lasciando l’oggetto dov’è.",
    "Quando questo passaggio è facile, anticipalo con la parola scelta al campo. Non usare esche pericolose per vedere se funziona."
  ], "Quanto spazio è servito perché distogliesse lo sguardo?", "Passa più lontano o scegli un oggetto ancora meno interessante.", "Se cerca di ingoiare oggetti o difende ciò che trova, non impostare prove da solo."),
  card("sosta-al-marciapiede", "Disegna prima un bordo simbolico in cortile. Per la strada serve sempre il controllo dell’adulto.", [
    "Avvicinati alla linea con il guinzaglio morbido e rallenta prima di arrivare al bordo.",
    "Fermati con il cane. Premia vicino a te una breve pausa, senza pretendere una posizione.",
    "Dai il segnale di ripartenza e camminate oltre la linea insieme. L’eventuale prova in strada va concordata al campo."
  ], "Si è fermato prima della linea, o solo quando il guinzaglio era già teso?", "Cammina più lentamente e fermati a un passo dalla linea.", "Non provare lasciando il guinzaglio o usando il traffico per mettere alla prova il cane."),
  card("auto-ferma", "Auto parcheggiata e spenta in un luogo sicuro e fresco; l’adulto resta con il cane.", [
    "Passa vicino all’auto dal lato lontano dal traffico. Osserva se può guardarla e poi fare altro.",
    "In una seconda occasione apri la portiera prima di arrivare con il cane. Può avvicinarsi e andarsene subito.",
    "Termina anche senza farlo salire. Motore, chiusura e movimento sono prove distinte da concordare."
  ], "Era diverso con la portiera aperta? A quale distanza?", "Inizia semplicemente da una passeggiata nella zona dove è parcheggiata.", "Se si blocca, cerca di scappare o nei viaggi sta male, non insistere: senti chi lo segue e il veterinario."),
  card("trasportino-aperto", "Trasportino stabile e adatto alla taglia, con la porta bloccata aperta o rimossa.", [
    "Mettilo nella stanza prima del cane e osserva se sceglie di orientarsi verso l’apertura.",
    "Premia l’esplorazione sul bordo senza spingere il cane dentro. Lascia completamente sgombra l’uscita.",
    "Se entra, aspetta che esca quando vuole. Questa prova finisce a porta aperta."
  ], "Può avvicinarsi e uscire rilassato, senza essere trattenuto?", "Parti dal tappetino familiare fuori dal trasportino.", "Se raspa, ansima o cerca la fuga, aumenta la distanza: non chiudere per farlo abituare."),
  card("museruola-con-scelta", "Modello e misura verificati con un professionista; il cane deve poter ansimare e bere.", [
    "Tieni il cestello fermo, basso e di lato. Lascia che lo guardi o lo annusi, poi allontanalo.",
    "Premia un avvicinamento spontaneo. Se propone di infilare il naso, non spingere il cestello verso di lui.",
    "Chiudi la prova senza allacciare i cinturini. Vestibilità e permanenza sono passi successivi."
  ], "Ha scelto lui di avvicinarsi e di ritrarre il muso?", "Rimani alla sola vista del cestello, a distanza comoda.", "Non provarla da solo se c’è rischio di morso. Non serve per avvicinare il cane a situazioni che teme."),
  card("riportare-un-gioco", "Un gioco gradito e sicuro, un secondo simile, spazio recintato senza altri cani.", [
    "Lascia rotolare il gioco per poco, senza lanci alti. Se lo prende, resta vicino e invitante.",
    "Quando si gira verso di te, fai un piccolo passo indietro e accogli anche un ritorno parziale.",
    "Proponi lo scambio con il secondo gioco. Poi lasciagli la possibilità di ricominciare o riposare."
  ], "È tornato spontaneamente di un passo o ha preferito tenere il gioco distante?", "Parti da un normale scambio da fermo e riduci ancora la distanza.", "Se protegge il gioco o si agita, non inseguire né afferrare: termina e concorda la variante al campo."),
];
export const findExercise = (slug: string) => homeExercises.find(exercise => exercise.slug === slug);
