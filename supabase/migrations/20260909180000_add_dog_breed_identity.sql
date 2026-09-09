alter table public.dogs
add column if not exists breed_slug text;

alter table public.dogs
add column if not exists fci_group integer
check (fci_group is null or fci_group between 1 and 10);
