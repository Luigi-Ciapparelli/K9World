# Media della Home — 29 settembre 2026

## Immagine illustrativa

File finali: `public/media/home/training-768.webp` e `training-1280.webp`.
Larghezze 768 e 1280 px; circa 73 e 168 KiB. La pagina sceglie una variante
tramite srcset. Derivati compressi da un originale 1536 × 1024 generato con
lo strumento OpenAI `image_gen.imagegen`, skill imagegen, non da foto di un
professionista reale. La Home espone l’etichetta «Immagine illustrativa».
Nessuna immagine di cliente o archivio professionale è stata usata.

Prompt originale:

> Use case: photorealistic-natural. Asset type: hero photograph for PortaleCinofilo, a contemporary Italian dog education portal. Create a natural editorial photograph, landscape 3:2, showing a relaxed adult woman dog trainer crouching beside a healthy medium-sized golden-brown dog during a quiet training moment outdoors in an Italian meadow. The dog is standing with both front paws on a very low stable wooden platform and rear paws naturally on the grass; it looks attentively toward the handler. Accurate canine anatomy, exactly four natural legs and intact tail; anatomically correct hands. The handler wears a plain olive jacket, dark casual trousers and outdoor shoes. Human and dog are fully inside the frame, with their faces and interaction concentrated near the central area so the image also works cropped to portrait. Natural morning light, real fur and cloth texture, tactile detail, depth of field, soft woodland and grasses behind, deep forest greens with warm neutral highlights, candid and authentic rather than staged stock photography. Calm attentive body language. No text, no logos, no watermarks, no borders, no split panels, no additional dogs or people. The photo illustrates a relationship, not an advertisement for any real professional. High photographic quality without artificial HDR, cartoon features or exaggerated cinematic orange grading.

## Anteprima animata dello shaping

File finali in `public/media/home/`:

| File | Formato | Peso approssimativo |
| --- | --- | --- |
| shaping-preview.mp4 | H.264, yuv420p, faststart | 62 KiB |
| shaping-preview.webm | VP9 | 63 KiB |
| shaping-poster.webp | WebP | 10 KiB |

12 secondi, 720 × 420, 24 fotogrammi al secondo, senza traccia audio.
Animazione creata dal DogScene già presente in
`src/components/impara/TimingLab.tsx` e dalle pose di `src/lib/shapingLab.ts`:
render React/SVG, acquisizione di 288 fotogrammi, compressione FFmpeg.
Quattro approssimazioni, tre secondi ciascuna: guardare, avvicinarsi,
una zampa, entrambe le zampe anteriori. Click e premio sono indicati visivamente.
È un esempio sintetico; non una dimostrazione di tempi reali di addestramento.
La lezione interattiva originale non viene modificata.

Il player viene montato solo quando l’utente lo apre. Ingresso senza video
autoplay di sfondo. Dopo l’apertura i controlli nativi consentono pausa e seek;
con riduzione movimento il video rimane inizialmente fermo.
La descrizione testuale accompagna l’intera sequenza, anche se il file non parte.

## Controlli

Verificati codec/durata, caricamento nel browser e assenza di richieste video
prima dell’apertura. Foto responsive e movimento con pausa. Nessun player
esterno, contenuto remoto o tracciamento aggiuntivo. I file sono versionati nel
repository e serviti come asset statici del sito.
