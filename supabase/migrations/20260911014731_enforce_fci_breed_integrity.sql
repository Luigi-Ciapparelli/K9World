-- Canonical FCI/ENCI breed identity for dogs.
-- Generated from public/data/fci-breeds.json (364 breeds).
-- Existing legacy dogs are not rewritten. New inserts and changes to breed
-- identity are canonicalized by the database.

BEGIN;

CREATE TABLE IF NOT EXISTS public.fci_breeds (
  slug text PRIMARY KEY,
  name text NOT NULL,
  fci_group integer NOT NULL CHECK (fci_group BETWEEN 1 AND 10),
  fci_group_name text NOT NULL,
  enci_url text NOT NULL
);

ALTER TABLE public.fci_breeds ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_fci_breeds_group
ON public.fci_breeds (fci_group);

INSERT INTO public.fci_breeds (
  slug,
  name,
  fci_group,
  fci_group_name,
  enci_url
)
VALUES
  ('affenpinscher', 'Affenpinscher', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/affenpinscher'),
  ('airedale-terrier', 'Airedale Terrier', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/airedale-terrier'),
  ('akita', 'Akita', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/akita'),
  ('akita-americano', 'Akita Americano', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/akita-americano'),
  ('alano', 'Alano', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/alano'),
  ('alaskan-malamute', 'Alaskan Malamute', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/alaskan-malamute'),
  ('alpenlaendische-dachsbracke', 'Alpenlaendische Dachsbracke', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/alpenlaendische-dachsbracke'),
  ('american-staffordshire-terrier', 'American Staffordshire Terrier', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/american-staffordshire-terrier'),
  ('american-water-spaniel', 'American Water Spaniel', 8, 'CANI DA RIPORTO CANI DA CERCA CANI DA ACQUA', 'https://www.enci.it/libro-genealogico/razze/american-water-spaniel'),
  ('anglo-francais-de-petite-venerie', 'Anglo Francais De Petite Venerie', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/anglo-francais-de-petite-venerie'),
  ('anjing-kintamani-bali', 'Anjing Kintamani-Bali', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/anjing-kintamani-bali'),
  ('ariegeois', 'Ariegeois', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/ariegeois'),
  ('australian-cattledog', 'Australian Cattledog', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/australian-cattledog'),
  ('australian-shepherd', 'Australian Shepherd', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/australian-shepherd'),
  ('australian-silky-terrier', 'Australian Silky Terrier', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/australian-silky-terrier'),
  ('australian-stumpy-tail-cattle-dog', 'Australian Stumpy Tail Cattle Dog', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/australian-stumpy-tail-cattle-dog'),
  ('australian-terrier', 'Australian Terrier', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/australian-terrier'),
  ('azawakh', 'Azawakh', 10, 'LEVRIERI', 'https://www.enci.it/libro-genealogico/razze/azawakh'),
  ('barbet', 'Barbet', 8, 'CANI DA RIPORTO CANI DA CERCA CANI DA ACQUA', 'https://www.enci.it/libro-genealogico/razze/barbet'),
  ('barboni', 'Barboni', 9, 'CANI DA COMPAGNIA', 'https://www.enci.it/libro-genealogico/razze/barboni'),
  ('barzoi', 'Barzoi', 10, 'LEVRIERI', 'https://www.enci.it/libro-genealogico/razze/barzoi'),
  ('basenji', 'Basenji', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/basenji'),
  ('bassett-artesian-normand', 'Basset Artesian Normand', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/bassett-artesian-normand'),
  ('basset-blue-de-gascogne', 'Basset Blue De Gascogne', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/basset-blue-de-gascogne'),
  ('bassett-fauve-de-bretagne', 'Basset Fauve De Bretagne', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/bassett-fauve-de-bretagne'),
  ('bassethound', 'Bassethound', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/bassethound'),
  ('bassotti-tedeschi', 'Bassotti Tedeschi', 4, 'BASSOTTI', 'https://www.enci.it/libro-genealogico/razze/bassotti-tedeschi'),
  ('bayerischer-gebirgsschweisshund', 'Bayerischer Gebirgsschweisshund', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/bayerischer-gebirgsschweisshund'),
  ('beagle', 'Beagle', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/beagle'),
  ('beagle-harrier', 'Beagle Harrier', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/beagle-harrier'),
  ('bearded-collie', 'Bearded Collie', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/bearded-collie'),
  ('bedlington-terrier', 'Bedlington Terrier', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/bedlington-terrier'),
  ('bichon-a-poil-frise', 'Bichon A Poil Frise', 9, 'CANI DA COMPAGNIA', 'https://www.enci.it/libro-genealogico/razze/bichon-a-poil-frise'),
  ('bichon-havanais', 'Bichon Havanais', 9, 'CANI DA COMPAGNIA', 'https://www.enci.it/libro-genealogico/razze/bichon-havanais'),
  ('billy', 'Billy', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/billy'),
  ('black-and-tan-coonhound', 'Black And Tan Coonhound', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/black-and-tan-coonhound'),
  ('bloodhound-chien-de-saint-ubert', 'Bloodhound Chien De Saint-Ubert', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/bloodhound-chien-de-saint-ubert'),
  ('bolognese', 'Bolognese', 9, 'CANI DA COMPAGNIA', 'https://www.enci.it/libro-genealogico/razze/bolognese'),
  ('border-collie', 'Border Collie', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/border-collie'),
  ('border-terrier', 'Border Terrier', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/border-terrier'),
  ('boston-terrier', 'Boston Terrier', 9, 'CANI DA COMPAGNIA', 'https://www.enci.it/libro-genealogico/razze/boston-terrier'),
  ('bouledogue-francese', 'Bouledogue  Francese', 9, 'CANI DA COMPAGNIA', 'https://www.enci.it/libro-genealogico/razze/bouledogue-francese'),
  ('bovaro-del-bernese', 'Bovaro Del Bernese', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/bovaro-del-bernese'),
  ('bovaro-dell-appenzell', 'Bovaro Dell''Appenzell', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/bovaro-dell-appenzell'),
  ('bovaro-dell-entlebuch', 'Bovaro Dell''Entlebuch', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/bovaro-dell-entlebuch'),
  ('bovaro-delle-ardenne', 'Bovaro Delle Ardenne', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/bovaro-delle-ardenne'),
  ('bovaro-delle-fiandre', 'Bovaro Delle Fiandre', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/bovaro-delle-fiandre'),
  ('boxer', 'Boxer', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/boxer'),
  ('bracco-d-ariege', 'Bracco D''Ariege', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/bracco-d-ariege'),
  ('bracco-d-auvergne', 'Bracco D''Auvergne', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/bracco-d-auvergne'),
  ('bracco-del-bourbonnais', 'Bracco Del Bourbonnais', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/bracco-del-bourbonnais'),
  ('bracco-di-burgos', 'Bracco Di Burgos', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/bracco-di-burgos'),
  ('bracco-francese-tipo-gascogne', 'Bracco Francese Tipo Gascogne', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/bracco-francese-tipo-gascogne'),
  ('bracco-francese-tipo-pirenei', 'Bracco Francese Tipo Pirenei', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/bracco-francese-tipo-pirenei'),
  ('bracco-italiano', 'Bracco Italiano', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/bracco-italiano'),
  ('bracco-portoghese', 'Bracco Portoghese', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/bracco-portoghese'),
  ('bracco-saint-germain', 'Bracco Saint Germain', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/bracco-saint-germain'),
  ('bracco-slovacco-a-pelo-duro', 'Bracco Slovacco A Pelo Duro', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/bracco-slovacco-a-pelo-duro'),
  ('bracco-ungherese-a-pelo-corto', 'Bracco Ungherese A Pelo Corto', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/bracco-ungherese-a-pelo-corto'),
  ('bracco-ungherese-a-pelo-duro', 'Bracco Ungherese A Pelo Duro', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/bracco-ungherese-a-pelo-duro'),
  ('briquet-griffon-vendeen', 'Briquet Griffon Vendeen', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/briquet-griffon-vendeen'),
  ('broholmer', 'Broholmer', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/broholmer'),
  ('bull-terrier-inglese-miniatura', 'Bull Terrier Inglese Miniatura', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/bull-terrier-inglese-miniatura'),
  ('bull-terrier-inglese-taglia-normale', 'Bull Terrier Inglese Taglia Normale', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/bull-terrier-inglese-taglia-normale'),
  ('bulldog', 'Bulldog', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/bulldog'),
  ('bullmastiff', 'Bullmastiff', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/bullmastiff'),
  ('cairn-terrier', 'Cairn Terrier', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/cairn-terrier'),
  ('canaan-dog', 'Canaan Dog', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/canaan-dog'),
  ('canadian-eskimo-dog', 'Canadian Eskimo Dog (Chien Esquimau Canadien)', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/canadian-eskimo-dog'),
  ('cane-corso', 'Cane Corso', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/cane-corso'),
  ('cane-da-ferma-boemo-a-pelo-ruvido', 'Cane Da Ferma Boemo A Pelo Ruvido', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/cane-da-ferma-boemo-a-pelo-ruvido'),
  ('cane-da-ferma-tedesco-a-pelo-corto', 'Cane Da Ferma Tedesco A Pelo Corto', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/cane-da-ferma-tedesco-a-pelo-corto'),
  ('cane-da-ferma-tedesco-a-pelo-duro', 'Cane Da Ferma Tedesco A Pelo Duro', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/cane-da-ferma-tedesco-a-pelo-duro'),
  ('cane-da-ferma-tedesco-a-pelo-lungo', 'Cane Da Ferma Tedesco A Pelo Lungo', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/cane-da-ferma-tedesco-a-pelo-lungo'),
  ('cane-da-ferma-tedesco-a-pelo-ruvido', 'Cane Da Ferma Tedesco A Pelo Ruvido', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/cane-da-ferma-tedesco-a-pelo-ruvido'),
  ('cane-da-montagna-dei-pirenei', 'Cane Da Montagna Dei Pirenei', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/cane-da-montagna-dei-pirenei'),
  ('cane-da-orso-della-carelia', 'Cane Da Orso Della Carelia', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/cane-da-orso-della-carelia'),
  ('cane-da-pastore-abruzzese-maremmano', 'Cane Da Pastore Abruzzese Maremmano', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/cane-da-pastore-abruzzese-maremmano'),
  ('cane-da-pastore-australiano-kelpie', 'Cane Da Pastore Australiano Kelpie', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/cane-da-pastore-australiano-kelpie'),
  ('cane-da-pastore-belga', 'Cane Da Pastore Belga', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/cane-da-pastore-belga'),
  ('cane-da-pastore-bergamasco', 'Cane Da Pastore Bergamasco', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/cane-da-pastore-bergamasco'),
  ('cane-da-pastore-catalano', 'Cane Da Pastore Catalano', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/cane-da-pastore-catalano'),
  ('cane-da-pastore-croato', 'Cane Da Pastore Croato', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/cane-da-pastore-croato'),
  ('cane-da-pastore-di-oropa', 'Cane Da Pastore D''Oropa', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/cane-da-pastore-di-oropa'),
  ('cane-da-pastore-dei-pirenei-a-faccia-rasa', 'Cane Da Pastore Dei Pirenei A Faccia Rasa', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/cane-da-pastore-dei-pirenei-a-faccia-rasa'),
  ('cane-da-pastore-dei-pirenei-a-pelo-lungo', 'Cane Da Pastore Dei Pirenei A Pelo Lungo', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/cane-da-pastore-dei-pirenei-a-pelo-lungo'),
  ('cane-da-pastore-del-caucaso', 'Cane Da Pastore Del Caucaso', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/cane-da-pastore-del-caucaso'),
  ('cane-da-pastore-dell-asia-centrale', 'Cane Da Pastore Dell''Asia Centrale', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/cane-da-pastore-dell-asia-centrale'),
  ('cane-da-pastore-della-russia-meridionale', 'Cane Da Pastore Della Russia Meridionale', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/cane-da-pastore-della-russia-meridionale'),
  ('cane-da-pastore-della-sila', 'Cane Da Pastore Della Sila', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/cane-da-pastore-della-sila'),
  ('cane-da-pastore-di-beauce', 'Cane Da Pastore Di Beauce', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/cane-da-pastore-di-beauce'),
  ('cane-da-pastore-di-brie', 'Cane Da Pastore Di Brie', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/cane-da-pastore-di-brie'),
  ('cane-da-pastore-di-ciarplanina', 'Cane Da Pastore Di Ciarplanina', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/cane-da-pastore-di-ciarplanina'),
  ('cane-da-pastore-di-karst', 'Cane Da Pastore Di Karst', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/cane-da-pastore-di-karst'),
  ('cane-da-pastore-di-picardia', 'Cane Da Pastore Di Picardia', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/cane-da-pastore-di-picardia'),
  ('cane-da-pastore-di-tatra', 'Cane Da Pastore Di Tatra', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/cane-da-pastore-di-tatra'),
  ('cane-da-pastore-mallorquin', 'Cane Da Pastore Mallorquin', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/cane-da-pastore-mallorquin'),
  ('cane-da-pastore-olandese', 'Cane Da Pastore Olandese', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/cane-da-pastore-olandese'),
  ('cane-da-pastore-polacco-di-vallee', 'Cane Da Pastore Polacco Di Vallee', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/cane-da-pastore-polacco-di-vallee'),
  ('cane-da-pastore-scozzese-a-pelo-corto', 'Cane Da Pastore Scozzese A Pelo Corto', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/cane-da-pastore-scozzese-a-pelo-corto'),
  ('cane-da-pastore-scozzese-a-pelo-lungo', 'Cane Da Pastore Scozzese A Pelo Lungo', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/cane-da-pastore-scozzese-a-pelo-lungo'),
  ('cane-da-pastore-scozzese-shetland', 'Cane Da Pastore Scozzese Shetland', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/cane-da-pastore-scozzese-shetland'),
  ('cane-da-sierra-di-estrela', 'Cane Da Sierra Di Estrela', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/cane-da-sierra-di-estrela'),
  ('cane-de-castro-laboreiro', 'Cane De Castro Laboreiro', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/cane-de-castro-laboreiro'),
  ('cane-dell-atlas', 'Cane Dell''Atlas', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/cane-dell-atlas'),
  ('cane-delle-alpi-apuane', 'Cane Delle Alpi Apuane', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/cane-delle-alpi-apuane'),
  ('cane-di-san-bernardo', 'Cane Di San Bernardo', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/cane-di-san-bernardo'),
  ('cane-fonnese', 'Cane Fonnese', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/cane-fonnese'),
  ('cane-lupo-cecoslovacco', 'Cane Lupo Cecoslovacco', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/cane-lupo-cecoslovacco'),
  ('cane-lupo-di-saarloos', 'Cane Lupo Di Saarloos', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/cane-lupo-di-saarloos'),
  ('cao-da-sierra-de-aires', 'Cao Da Sierra De Aires', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/cao-da-sierra-de-aires'),
  ('cao-de-agua', 'Cao De Agua', 8, 'CANI DA RIPORTO CANI DA CERCA CANI DA ACQUA', 'https://www.enci.it/libro-genealogico/razze/cao-de-agua'),
  ('cao-de-gado-transmontano', 'Cao De Gado Transmontano', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/cao-de-gado-transmontano'),
  ('cao-fila-de-sao-miguel', 'Cao Fila De Sao Miguel', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/cao-fila-de-sao-miguel'),
  ('carlino', 'Carlino', 9, 'CANI DA COMPAGNIA', 'https://www.enci.it/libro-genealogico/razze/carlino'),
  ('cavalier-king-charles-spaniel', 'Cavalier King Charles Spaniel', 9, 'CANI DA COMPAGNIA', 'https://www.enci.it/libro-genealogico/razze/cavalier-king-charles-spaniel'),
  ('chesapeake-bay-retriever', 'Chesapeake Bay Retriever', 8, 'CANI DA RIPORTO CANI DA CERCA CANI DA ACQUA', 'https://www.enci.it/libro-genealogico/razze/chesapeake-bay-retriever'),
  ('chien-d-artois', 'Chien D''Artois', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/chien-d-artois'),
  ('chihuahua', 'Chihuahua', 9, 'CANI DA COMPAGNIA', 'https://www.enci.it/libro-genealogico/razze/chihuahua'),
  ('chin', 'Chin', 9, 'CANI DA COMPAGNIA', 'https://www.enci.it/libro-genealogico/razze/chin'),
  ('chinese-crested-dog', 'Chinese Crested Dog', 9, 'CANI DA COMPAGNIA', 'https://www.enci.it/libro-genealogico/razze/chinese-crested-dog'),
  ('chodsky-pes-cz', 'Chodský Pes', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/chodsky-pes-cz'),
  ('chow-chow', 'Chow-Chow', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/chow-chow'),
  ('cimarron-uruguayo', 'Cimarron Uruguayo', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/cimarron-uruguayo'),
  ('ciobanesc-romanesc-de-bucovina', 'Ciobanesc Romanesc De Bucovina', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/ciobanesc-romanesc-de-bucovina'),
  ('cirneco-dell-etna', 'Cirneco Dell''Etna', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/cirneco-dell-etna'),
  ('clumber-spaniel', 'Clumber Spaniel', 8, 'CANI DA RIPORTO CANI DA CERCA CANI DA ACQUA', 'https://www.enci.it/libro-genealogico/razze/clumber-spaniel'),
  ('cocker-americano', 'Cocker Americano', 8, 'CANI DA RIPORTO CANI DA CERCA CANI DA ACQUA', 'https://www.enci.it/libro-genealogico/razze/cocker-americano'),
  ('cocker-spaniel-inglese', 'Cocker Spaniel Inglese', 8, 'CANI DA RIPORTO CANI DA CERCA CANI DA ACQUA', 'https://www.enci.it/libro-genealogico/razze/cocker-spaniel-inglese'),
  ('continental-bulldog', 'Continental Bulldog', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/continental-bulldog'),
  ('coton-de-tulear', 'Coton De Tulear', 9, 'CANI DA COMPAGNIA', 'https://www.enci.it/libro-genealogico/razze/coton-de-tulear'),
  ('curly-coated-retriever', 'Curly-Coated Retriever', 8, 'CANI DA RIPORTO CANI DA CERCA CANI DA ACQUA', 'https://www.enci.it/libro-genealogico/razze/curly-coated-retriever'),
  ('dalmata', 'Dalmata', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/dalmata'),
  ('dandie-dinmont-terrier', 'Dandie Dinmont Terrier', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/dandie-dinmont-terrier'),
  ('dansk-svensk-gardshund', 'Dansk-Svensk Gardshund', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/dansk-svensk-gardshund'),
  ('deerhound', 'Deerhound', 10, 'LEVRIERI', 'https://www.enci.it/libro-genealogico/razze/deerhound'),
  ('deutscher-jagdterrier', 'Deutscher Jagdterrier', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/deutscher-jagdterrier'),
  ('dobermann', 'Dobermann', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/dobermann'),
  ('dogo-argentino', 'Dogo Argentino', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/dogo-argentino'),
  ('dogue-de-bordeaux', 'Dogue De Bordeaux', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/dogue-de-bordeaux'),
  ('drever', 'Drever', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/drever'),
  ('dunker', 'Dunker', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/dunker'),
  ('eesti-hagijas', 'Eesti Hagijas', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/eesti-hagijas'),
  ('english-toy-terrier-black-and-tan', 'English Toy Terrier Black And Tan', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/english-toy-terrier-black-and-tan'),
  ('epagneul-blue-de-picardie', 'Epagneul Blue De Picardie', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/epagneul-blue-de-picardie'),
  ('epagneul-breton', 'Epagneul Breton', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/epagneul-breton'),
  ('epagneul-de-pont-audemer', 'Epagneul De Pont - Audemer', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/epagneul-de-pont-audemer'),
  ('epagneul-francais', 'Epagneul Francais', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/epagneul-francais'),
  ('epagneul-nano-continentale', 'Epagneul Nano Continentale', 9, 'CANI DA COMPAGNIA', 'https://www.enci.it/libro-genealogico/razze/epagneul-nano-continentale'),
  ('epagneul-olandese-di-drent', 'Epagneul Olandese Di Drent', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/epagneul-olandese-di-drent'),
  ('epagneul-picard', 'Epagneul Picard', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/epagneul-picard'),
  ('eurasier', 'Eurasier', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/eurasier'),
  ('field-spaniel', 'Field Spaniel', 8, 'CANI DA RIPORTO CANI DA CERCA CANI DA ACQUA', 'https://www.enci.it/libro-genealogico/razze/field-spaniel'),
  ('fila-brasileiro', 'Fila Brasileiro', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/fila-brasileiro'),
  ('flat-coated-retriever', 'Flat Coated Retriever', 8, 'CANI DA RIPORTO CANI DA CERCA CANI DA ACQUA', 'https://www.enci.it/libro-genealogico/razze/flat-coated-retriever'),
  ('fox-terrier-a-pelo-liscio', 'Fox Terrier A Pelo Liscio', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/fox-terrier-a-pelo-liscio'),
  ('fox-terrier-a-pelo-ruvido', 'Fox Terrier A Pelo Ruvido', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/fox-terrier-a-pelo-ruvido'),
  ('foxhound', 'Foxhound', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/foxhound'),
  ('foxhound-americano', 'Foxhound Americano', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/foxhound-americano'),
  ('francais-blanc-e-noir', 'Francais Blanc E Noir', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/francais-blanc-e-noir'),
  ('francais-blanc-e-orange', 'Francais Blanc E Orange', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/francais-blanc-e-orange'),
  ('francais-tricolore', 'Francais Tricolore', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/francais-tricolore'),
  ('galgo-espanol', 'Galgo Espanol', 10, 'LEVRIERI', 'https://www.enci.it/libro-genealogico/razze/galgo-espanol'),
  ('gammel-dansk-honsenhund', 'Gammel Dansk Honsenhund', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/gammel-dansk-honsenhund'),
  ('gascon-saintongeois', 'Gascon Saintongeois', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/gascon-saintongeois'),
  ('golden-retriever', 'Golden Retriever', 8, 'CANI DA RIPORTO CANI DA CERCA CANI DA ACQUA', 'https://www.enci.it/libro-genealogico/razze/golden-retriever'),
  ('gonczy-polski', 'Gonczy Polski', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/gonczy-polski'),
  ('gos-rater-valencia', 'Gos Rater Valencia', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/gos-rater-valencia'),
  ('grand-anglo-francais-blanc-et-noir', 'Grand Anglo Francais Blanc Et Noir', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/grand-anglo-francais-blanc-et-noir'),
  ('grand-anglo-francais-blanc-et-orange', 'Grand Anglo Francais Blanc Et Orange', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/grand-anglo-francais-blanc-et-orange'),
  ('grand-anglo-francais-tricolore', 'Grand Anglo Francais Tricolore', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/grand-anglo-francais-tricolore'),
  ('grand-basset-griffon-vendeen', 'Grand Basset Griffon Vendeen', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/grand-basset-griffon-vendeen'),
  ('grand-bleu-de-gascogne', 'Grand Bleu De Gascogne', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/grand-bleu-de-gascogne'),
  ('grand-griffon-vendeen', 'Grand Griffon Vendeen', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/grand-griffon-vendeen'),
  ('grande-bovaro-svizzero', 'Grande Bovaro Svizzero', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/grande-bovaro-svizzero'),
  ('grande-muensterlander', 'Grande Muensterlander', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/grande-muensterlander'),
  ('greyhound', 'Greyhound', 10, 'LEVRIERI', 'https://www.enci.it/libro-genealogico/razze/greyhound'),
  ('griffon-bleu-de-gascogne', 'Griffon Bleu De Gascogne', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/griffon-bleu-de-gascogne'),
  ('griffon-fauve-de-bretagne', 'Griffon Fauve De Bretagne', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/griffon-fauve-de-bretagne'),
  ('griffon-nivernais', 'Griffon Nivernais', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/griffon-nivernais'),
  ('griffone-a-pelo-duro-korthals', 'Griffone A Pelo Duro (Korthals)', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/griffone-a-pelo-duro-korthals'),
  ('griffone-belga', 'Griffone Belga', 9, 'CANI DA COMPAGNIA', 'https://www.enci.it/libro-genealogico/razze/griffone-belga'),
  ('griffone-di-bruxelles', 'Griffone Di Bruxelles', 9, 'CANI DA COMPAGNIA', 'https://www.enci.it/libro-genealogico/razze/griffone-di-bruxelles'),
  ('groenlandese', 'Groenlandese', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/groenlandese'),
  ('haldenstovare', 'Haldenstovare', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/haldenstovare'),
  ('hamilton-stovare', 'Hamilton Stovare', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/hamilton-stovare'),
  ('hannoverischer-schweisshund', 'Hannoverischer Schweisshund', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/hannoverischer-schweisshund'),
  ('harrier', 'Harrier', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/harrier'),
  ('hokkaido', 'Hokkaido', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/hokkaido'),
  ('hovawart', 'Hovawart', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/hovawart'),
  ('hyghenhund', 'Hyghenhund', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/hyghenhund'),
  ('iceland-dog-cane-da-pastore-di-islanda', 'Iceland Dog- Cane Da Pastore Di Islanda', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/iceland-dog-cane-da-pastore-di-islanda'),
  ('irish-water-spaniel', 'Irish  Water Spaniel', 8, 'CANI DA RIPORTO CANI DA CERCA CANI DA ACQUA', 'https://www.enci.it/libro-genealogico/razze/irish-water-spaniel'),
  ('irish-glen-of-imaal-terrier', 'Irish Glen Of Imaal Terrier', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/irish-glen-of-imaal-terrier'),
  ('irish-soft-coated-wheaten-terrier', 'Irish Soft-Coated Wheaten Terrier', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/irish-soft-coated-wheaten-terrier'),
  ('irish-terrier', 'Irish Terrier', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/irish-terrier'),
  ('irish-wolfhound', 'Irish Wolfhound', 10, 'LEVRIERI', 'https://www.enci.it/libro-genealogico/razze/irish-wolfhound'),
  ('jack-russell-terrier', 'Jack Russell Terrier', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/jack-russell-terrier'),
  ('jamthund', 'Jamthund', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/jamthund'),
  ('kai', 'Kai', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/kai'),
  ('kangal-coban-kopegi', 'Kangal Coban Kopegi (Ex Cane Da Pastore Dell''Anatolia)', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/kangal-coban-kopegi'),
  ('kerry-blue-terrier', 'Kerry Blue Terrier', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/kerry-blue-terrier'),
  ('king-charles-spaniel', 'King Charles Spaniel', 9, 'CANI DA COMPAGNIA', 'https://www.enci.it/libro-genealogico/razze/king-charles-spaniel'),
  ('kishu', 'Kishu', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/kishu'),
  ('komondor', 'Komondor', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/komondor'),
  ('kooikerhondje', 'Kooikerhondje', 8, 'CANI DA RIPORTO CANI DA CERCA CANI DA ACQUA', 'https://www.enci.it/libro-genealogico/razze/kooikerhondje'),
  ('korea-jindo-dog', 'Korea Jindo Dog', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/korea-jindo-dog'),
  ('kromforhlander', 'Kromforhlander', 9, 'CANI DA COMPAGNIA', 'https://www.enci.it/libro-genealogico/razze/kromforhlander'),
  ('kuvasz', 'Kuvasz', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/kuvasz'),
  ('labrador-retriever', 'Labrador Retriever', 8, 'CANI DA RIPORTO CANI DA CERCA CANI DA ACQUA', 'https://www.enci.it/libro-genealogico/razze/labrador-retriever'),
  ('lagotto-romagnolo', 'Lagotto Romagnolo', 8, 'CANI DA RIPORTO CANI DA CERCA CANI DA ACQUA', 'https://www.enci.it/libro-genealogico/razze/lagotto-romagnolo'),
  ('laika-della-siberia-occidentale', 'Laika Della Siberia Occidentale', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/laika-della-siberia-occidentale'),
  ('laika-della-siberia-orientale', 'Laika Della Siberia Orientale', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/laika-della-siberia-orientale'),
  ('laika-russo-europeo', 'Laika Russo-Europeo', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/laika-russo-europeo'),
  ('lakeland-terrier', 'Lakeland Terrier', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/lakeland-terrier'),
  ('lancashire-heeler', 'Lancashire Heeler', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/lancashire-heeler'),
  ('landseer', 'Landseer', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/landseer'),
  ('lapinkoira', 'Lapinkoira', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/lapinkoira'),
  ('lapinporokoira-pastore-finlandese-della-lapponia', 'Lapinporokoira - Pastore Finlandese Della Lapponia', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/lapinporokoira-pastore-finlandese-della-lapponia'),
  ('leonberger', 'Leonberger', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/leonberger'),
  ('levriero-afgano', 'Levriero Afgano', 10, 'LEVRIERI', 'https://www.enci.it/libro-genealogico/razze/levriero-afgano'),
  ('levriero-polacco', 'Levriero Polacco', 10, 'LEVRIERI', 'https://www.enci.it/libro-genealogico/razze/levriero-polacco'),
  ('lhasa-apso', 'Lhasa Apso', 9, 'CANI DA COMPAGNIA', 'https://www.enci.it/libro-genealogico/razze/lhasa-apso'),
  ('magyar-agar', 'Magyar Agar', 10, 'LEVRIERI', 'https://www.enci.it/libro-genealogico/razze/magyar-agar'),
  ('maltese', 'Maltese', 9, 'CANI DA COMPAGNIA', 'https://www.enci.it/libro-genealogico/razze/maltese'),
  ('manchester-terrier', 'Manchester Terrier', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/manchester-terrier'),
  ('mastiff', 'Mastiff', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/mastiff'),
  ('mastino-dei-pirenei', 'Mastino Dei Pirenei', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/mastino-dei-pirenei'),
  ('mastino-napoletano', 'Mastino Napoletano', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/mastino-napoletano'),
  ('mastino-siciliano-cane-di-mannara', 'Mastino Siciliano/Cane Di Mannara', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/mastino-siciliano-cane-di-mannara'),
  ('mastino-spagnolo', 'Mastino Spagnolo', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/mastino-spagnolo'),
  ('miniature-american-shepherd', 'Miniature American Shepherd', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/miniature-american-shepherd'),
  ('mudi', 'Mudi', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/mudi'),
  ('norbottenspets', 'Norbottenspets', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/norbottenspets'),
  ('norfolk-terrier', 'Norfolk Terrier', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/norfolk-terrier'),
  ('norsk-buhund', 'Norsk Buhund', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/norsk-buhund'),
  ('norsk-elghund-grigio', 'Norsk Elghund Grigio', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/norsk-elghund-grigio'),
  ('norsk-elghund-nero', 'Norsk Elghund Nero', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/norsk-elghund-nero'),
  ('norsk-lundehund', 'Norsk Lundehund', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/norsk-lundehund'),
  ('norwich-terrier', 'Norwich Terrier', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/norwich-terrier'),
  ('nova-scotia-duck-tolling-retriever', 'Nova Scotia Duck Tolling Retriever', 8, 'CANI DA RIPORTO CANI DA CERCA CANI DA ACQUA', 'https://www.enci.it/libro-genealogico/razze/nova-scotia-duck-tolling-retriever'),
  ('old-english-sheepdog', 'Old English Sheepdog', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/old-english-sheepdog'),
  ('otterhound', 'Otterhound', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/otterhound'),
  ('parson-russell-terrier', 'Parson  Russell Terrier', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/parson-russell-terrier'),
  ('pastore-della-lessinia-e-del-lagorai', 'Pastore Della Lessinia E Del Lagorai', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/pastore-della-lessinia-e-del-lagorai'),
  ('pastore-svizzero-bianco', 'Pastore Svizzero Bianco', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/pastore-svizzero-bianco'),
  ('pastore-tedesco', 'Pastore Tedesco', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/pastore-tedesco'),
  ('pechinese', 'Pechinese', 9, 'CANI DA COMPAGNIA', 'https://www.enci.it/libro-genealogico/razze/pechinese'),
  ('perro-de-agua-espanol', 'Perro De Agua Espanol', 8, 'CANI DA RIPORTO CANI DA CERCA CANI DA ACQUA', 'https://www.enci.it/libro-genealogico/razze/perro-de-agua-espanol'),
  ('perro-dogo-mallorquin', 'Perro Dogo Mallorquin', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/perro-dogo-mallorquin'),
  ('perro-sin-pelo-del-peru', 'Perro Sin Pelo Del Peru''', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/perro-sin-pelo-del-peru'),
  ('petit-basset-griffon-vendeen', 'Petit Basset Griffon Vendeen', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/petit-basset-griffon-vendeen'),
  ('petit-bleu-de-gascogne', 'Petit Bleu De Gascogne', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/petit-bleu-de-gascogne'),
  ('pharaon-hound', 'Pharaon Hound', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/pharaon-hound'),
  ('piccolo-brabantino', 'Piccolo Brabantino', 9, 'CANI DA COMPAGNIA', 'https://www.enci.it/libro-genealogico/razze/piccolo-brabantino'),
  ('piccolo-cane-leone', 'Piccolo Cane Leone', 9, 'CANI DA COMPAGNIA', 'https://www.enci.it/libro-genealogico/razze/piccolo-cane-leone'),
  ('piccolo-levriero-italiano', 'Piccolo Levriero Italiano', 10, 'LEVRIERI', 'https://www.enci.it/libro-genealogico/razze/piccolo-levriero-italiano'),
  ('piccolo-muensterlander', 'Piccolo Muensterlander', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/piccolo-muensterlander'),
  ('piccolo-segugio-della-svizzera', 'Piccolo Segugio Della Svizzera', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/piccolo-segugio-della-svizzera'),
  ('pinscher', 'Pinscher', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/pinscher'),
  ('pinscher-austriaco-a-pelo-corto', 'Pinscher Austriaco A Pelo Corto', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/pinscher-austriaco-a-pelo-corto'),
  ('podenco-canario', 'Podenco Canario', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/podenco-canario'),
  ('podenco-ibicenco', 'Podenco Ibicenco', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/podenco-ibicenco'),
  ('podengo-portugues', 'Podengo Portugues', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/podengo-portugues'),
  ('pointer-inglese', 'Pointer Inglese', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/pointer-inglese'),
  ('poitevin', 'Poitevin', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/poitevin'),
  ('porcelaine', 'Porcelaine', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/porcelaine'),
  ('prazsky-krysarik', 'Prazsky Krysarik', 9, 'CANI DA COMPAGNIA', 'https://www.enci.it/libro-genealogico/razze/prazsky-krysarik'),
  ('presa-canario', 'Presa Canario (Ex Dogo Canario)', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/presa-canario'),
  ('pudel-pointer', 'Pudel Pointer', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/pudel-pointer'),
  ('puli', 'Puli', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/puli'),
  ('pumi', 'Pumi', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/pumi'),
  ('rafeiro-do-alentejo', 'Rafeiro Do Alentejo', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/rafeiro-do-alentejo'),
  ('rastreador-brasileiro', 'Rastreador Brasileiro', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/rastreador-brasileiro'),
  ('rhodesian-ridgeback', 'Rhodesian Ridgeback', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/rhodesian-ridgeback'),
  ('riesenschnauzer', 'Riesenschnauzer', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/riesenschnauzer'),
  ('romanian-carpathian-sheperd-dog', 'Romanian Carpathian Sheperd Dog', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/romanian-carpathian-sheperd-dog'),
  ('romanian-mioritic-sheperd-dog', 'Romanian Mioritic Sheperd Dog', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/romanian-mioritic-sheperd-dog'),
  ('rottweiler', 'Rottweiler', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/rottweiler'),
  ('russian-toy', 'Russian Toy', 9, 'CANI DA COMPAGNIA', 'https://www.enci.it/libro-genealogico/razze/russian-toy'),
  ('sabueso-espagnol', 'Sabueso Espagnol', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/sabueso-espagnol'),
  ('saluki', 'Saluki', 10, 'LEVRIERI', 'https://www.enci.it/libro-genealogico/razze/saluki'),
  ('samoiedo', 'Samoiedo', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/samoiedo'),
  ('schapendoes', 'Schapendoes', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/schapendoes'),
  ('schiller-stovare', 'Schiller Stovare', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/schiller-stovare'),
  ('schipperke', 'Schipperkee', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/schipperke'),
  ('schnauzer-medio', 'Schnauzer Medio', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/schnauzer-medio'),
  ('scottish-terrier', 'Scottish Terrier', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/scottish-terrier'),
  ('sealyham-terrier', 'Sealyham Terrier', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/sealyham-terrier'),
  ('segugi-svizzeri', 'Segugi Svizzeri', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/segugi-svizzeri'),
  ('segugio-austriaco-nero-focato', 'Segugio Austriaco Nero Focato', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/segugio-austriaco-nero-focato'),
  ('segugio-dell-appennino', 'Segugio Dell''Appennino', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/segugio-dell-appennino'),
  ('segugio-dell-istria-a-pelo-duro', 'Segugio Dell''Istria A Pelo Duro', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/segugio-dell-istria-a-pelo-duro'),
  ('segugio-dell-istria-a-pelo-raso', 'Segugio Dell''Istria A Pelo Raso', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/segugio-dell-istria-a-pelo-raso'),
  ('segugio-della-bosnia-a-pelo-duro', 'Segugio Della Bosnia A Pelo Duro', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/segugio-della-bosnia-a-pelo-duro'),
  ('segugio-della-stiria-a-pelo-ruvido', 'Segugio Della Stiria A Pelo Ruvido', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/segugio-della-stiria-a-pelo-ruvido'),
  ('segugio-della-transilvania', 'Segugio Della Transilvania', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/segugio-della-transilvania'),
  ('segugio-della-westfalia', 'Segugio Della Westfalia', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/segugio-della-westfalia'),
  ('segugio-ellenico', 'Segugio Ellenico', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/segugio-ellenico'),
  ('segugio-finlandese', 'Segugio Finlandese', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/segugio-finlandese'),
  ('segugio-italiano-a-pelo-forte', 'Segugio Italiano A Pelo Forte', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/segugio-italiano-a-pelo-forte'),
  ('segugio-italiano-a-pelo-raso', 'Segugio Italiano A Pelo Raso', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/segugio-italiano-a-pelo-raso'),
  ('segugio-maremmano', 'Segugio Maremmano', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/segugio-maremmano'),
  ('segugio-yugoslavo-da-montagna', 'Segugio Montenegrino Da Montagna (Ex Segugio Yugoslavo Da Montagna)', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/segugio-yugoslavo-da-montagna'),
  ('segugio-polacco', 'Segugio Polacco', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/segugio-polacco'),
  ('segugio-posavatz', 'Segugio Posavatz', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/segugio-posavatz'),
  ('segugio-serbo', 'Segugio Serbo', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/segugio-serbo'),
  ('segugio-tricolore-jugoslavo', 'Segugio Serbo Tricolore (Ex Segugio Tricolore Jugoslavo)', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/segugio-tricolore-jugoslavo'),
  ('segugio-tedesco', 'Segugio Tedesco', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/segugio-tedesco'),
  ('segugio-tirolese', 'Segugio Tirolese', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/segugio-tirolese'),
  ('setter-gordon', 'Setter Gordon', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/setter-gordon'),
  ('setter-inglese', 'Setter Inglese', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/setter-inglese'),
  ('setter-irlandese-rosso', 'Setter Irlandese Rosso', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/setter-irlandese-rosso'),
  ('setter-irlandese-rosso-bianco', 'Setter Irlandese Rosso-Bianco', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/setter-irlandese-rosso-bianco'),
  ('shar-pei', 'Shar Pei', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/shar-pei'),
  ('shiba', 'Shiba', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/shiba'),
  ('shih-tzu', 'Shih Tzu', 9, 'CANI DA COMPAGNIA', 'https://www.enci.it/libro-genealogico/razze/shih-tzu'),
  ('shikoku', 'Shikoku', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/shikoku'),
  ('siberian-husky', 'Siberian Husky', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/siberian-husky'),
  ('skye-terrier', 'Skye Terrier', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/skye-terrier'),
  ('sloughi', 'Sloughi', 10, 'LEVRIERI', 'https://www.enci.it/libro-genealogico/razze/sloughi'),
  ('slovensky-cuvac', 'Slovensky Cuvac', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/slovensky-cuvac'),
  ('slovensky-kopov', 'Slovensky Kopov', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/slovensky-kopov'),
  ('smaalandsstovare', 'Smaalandsstovare', 6, 'SEGUGI E CANI PER PISTA DI SANGUE', 'https://www.enci.it/libro-genealogico/razze/smaalandsstovare'),
  ('smoushound-olandese', 'Smoushound Olandese', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/smoushound-olandese'),
  ('spaniel-olandese', 'Spaniel Olandese', 8, 'CANI DA RIPORTO CANI DA CERCA CANI DA ACQUA', 'https://www.enci.it/libro-genealogico/razze/spaniel-olandese'),
  ('spaniel-tedesco', 'Spaniel Tedesco', 8, 'CANI DA RIPORTO CANI DA CERCA CANI DA ACQUA', 'https://www.enci.it/libro-genealogico/razze/spaniel-tedesco'),
  ('spino-degli-iblei', 'Spino Degli Iblei', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/spino-degli-iblei'),
  ('spinone-italiano', 'Spinone Italiano', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/spinone-italiano'),
  ('spitz-finnico', 'Spitz Finnico', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/spitz-finnico'),
  ('spitz-giapponese', 'Spitz Giapponese', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/spitz-giapponese'),
  ('spitz-tedeschi', 'Spitz Tedeschi', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/spitz-tedeschi'),
  ('springer-spaniel-inglese', 'Springer Spaniel Inglese', 8, 'CANI DA RIPORTO CANI DA CERCA CANI DA ACQUA', 'https://www.enci.it/libro-genealogico/razze/springer-spaniel-inglese'),
  ('stabyhound', 'Stabyhound', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/stabyhound'),
  ('staffordshire-bull-terrier', 'Staffordshire Bull Terrier', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/staffordshire-bull-terrier'),
  ('sussex-spaniel', 'Sussex Spaniel', 8, 'CANI DA RIPORTO CANI DA CERCA CANI DA ACQUA', 'https://www.enci.it/libro-genealogico/razze/sussex-spaniel'),
  ('svensk-lapphund', 'Svensk Lapphund', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/svensk-lapphund'),
  ('taiwan-dog', 'Taiwan Dog', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/taiwan-dog'),
  ('terranova', 'Terranova', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/terranova'),
  ('terrier-boemo', 'Terrier Boemo', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/terrier-boemo'),
  ('terrier-brazileiro', 'Terrier Brazileiro', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/terrier-brazileiro'),
  ('terrier-giapponese', 'Terrier Giapponese', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/terrier-giapponese'),
  ('terrier-nero-russo', 'Terrier Nero Russo', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/terrier-nero-russo'),
  ('thai-bangkaew-dog', 'Thai Bangkaew Dog', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/thai-bangkaew-dog'),
  ('thai-ridgeback-dog', 'Thai Ridgeback Dog', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/thai-ridgeback-dog'),
  ('tibetan-mastiff', 'Tibetan Mastiff', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/tibetan-mastiff'),
  ('tibetan-spaniel', 'Tibetan Spaniel', 9, 'CANI DA COMPAGNIA', 'https://www.enci.it/libro-genealogico/razze/tibetan-spaniel'),
  ('tibetan-terrier', 'Tibetan Terrier', 9, 'CANI DA COMPAGNIA', 'https://www.enci.it/libro-genealogico/razze/tibetan-terrier'),
  ('tornjak', 'Tornjak', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/tornjak'),
  ('tosa', 'Tosa', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/tosa'),
  ('volpino-italiano', 'Volpino Italiano', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/volpino-italiano'),
  ('vastgotaspets', 'Västgötaspets', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/vastgotaspets'),
  ('weimaraner', 'Weimaraner', 7, 'CANI DA FERMA', 'https://www.enci.it/libro-genealogico/razze/weimaraner'),
  ('welsh-corgi-cardigan', 'Welsh Corgi Cardigan', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/welsh-corgi-cardigan'),
  ('welsh-corgi-pembroke', 'Welsh Corgi Pembroke', 1, 'CANI DA PASTORE E BOVARI (ESCLUSI BOVARI SVIZZERI)', 'https://www.enci.it/libro-genealogico/razze/welsh-corgi-pembroke'),
  ('welsh-springer-spaniel', 'Welsh Springer Spaniel', 8, 'CANI DA RIPORTO CANI DA CERCA CANI DA ACQUA', 'https://www.enci.it/libro-genealogico/razze/welsh-springer-spaniel'),
  ('welsh-terrier', 'Welsh Terrier', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/welsh-terrier'),
  ('west-highland-white-terrier', 'West Highland White Terrier', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/west-highland-white-terrier'),
  ('whippet', 'Whippet', 10, 'LEVRIERI', 'https://www.enci.it/libro-genealogico/razze/whippet'),
  ('xoloitzcuintle', 'Xoloitzcuintle', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/xoloitzcuintle'),
  ('yakutskaya-laika', 'Yakutskaya Laika', 5, 'CANI TIPO SPITZ E TIPO PRIMITIVO', 'https://www.enci.it/libro-genealogico/razze/yakutskaya-laika'),
  ('yorkshire-terrier', 'Yorkshire Terrier', 3, 'TERRIER', 'https://www.enci.it/libro-genealogico/razze/yorkshire-terrier'),
  ('zwergpinscher', 'Zwergpinscher', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/zwergpinscher'),
  ('zwergschnauzer', 'Zwergschnauzer', 2, 'CANI DI TIPO PINSCHER E SCHNAUZER- MOLOSSOIDI E CANI BOVARI SVIZZERI', 'https://www.enci.it/libro-genealogico/razze/zwergschnauzer')
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  fci_group = EXCLUDED.fci_group,
  fci_group_name = EXCLUDED.fci_group_name,
  enci_url = EXCLUDED.enci_url;

-- Keep the canonical table internal for now. The public frontend continues to
-- use its static ENCI dataset; client roles do not need direct table access.
REVOKE ALL ON TABLE public.fci_breeds FROM PUBLIC;
REVOKE ALL ON TABLE public.fci_breeds FROM anon;
REVOKE ALL ON TABLE public.fci_breeds FROM authenticated;

-- Add the FK without forcing old legacy rows to validate immediately.
-- PostgreSQL still enforces a NOT VALID FK for new/changed breed_slug values.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'dogs_breed_slug_fkey'
      AND conrelid = 'public.dogs'::regclass
  ) THEN
    ALTER TABLE public.dogs
      ADD CONSTRAINT dogs_breed_slug_fkey
      FOREIGN KEY (breed_slug)
      REFERENCES public.fci_breeds(slug)
      NOT VALID;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_dog_breed_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_name text;
  v_group integer;
BEGIN
  NEW.breed := BTRIM(COALESCE(NEW.breed, ''));
  NEW.breed_slug := NULLIF(BTRIM(NEW.breed_slug), '');

  IF NEW.breed_slug IS NULL THEN
    IF NEW.breed = 'Meticcio / altra razza' THEN
      NEW.fci_group := NULL;
      RETURN NEW;
    END IF;

    RAISE EXCEPTION
      'Select a canonical FCI breed or Meticcio / altra razza';
  END IF;

  SELECT
    fb.name,
    fb.fci_group
  INTO
    v_name,
    v_group
  FROM public.fci_breeds AS fb
  WHERE fb.slug = NEW.breed_slug;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown FCI breed slug: %', NEW.breed_slug;
  END IF;

  -- The slug is the canonical identity. Never trust a client-supplied
  -- display name or group once a canonical slug is present.
  NEW.breed := v_name;
  NEW.fci_group := v_group;

  RETURN NEW;
END;
$$;

REVOKE ALL
ON FUNCTION public.enforce_dog_breed_identity()
FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_enforce_dog_breed_identity
ON public.dogs;

CREATE TRIGGER trg_enforce_dog_breed_identity
BEFORE INSERT OR UPDATE OF breed, breed_slug, fci_group
ON public.dogs
FOR EACH ROW
EXECUTE FUNCTION public.enforce_dog_breed_identity();

COMMIT;
