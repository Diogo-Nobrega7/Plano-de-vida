-- Rumo — cronograma semanal e faculdades-alvo (SISU). Rode UMA vez, depois da 0001.

create table public.cronograma (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  dia int not null check (dia between 0 and 6),            -- 0 = segunda … 6 = domingo
  inicio text not null check (inicio ~ '^\d{2}:\d{2}$'),   -- HH:MM
  minutos int not null check (minutos between 5 and 600),
  materia_id uuid references public.materias(id) on delete set null,
  titulo text
);
create index on public.cronograma (user_id);
alter table public.cronograma enable row level security;
create policy "cronograma: só o dono" on public.cronograma for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.cronograma to authenticated;

-- Sessão de estudo pode vir de um bloco do cronograma (para marcar o bloco como feito).
alter table public.sessoes add column cronograma_id uuid references public.cronograma(id) on delete set null;

create table public.faculdades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  nome text not null,
  curso text not null default 'Medicina',
  nota_corte numeric(6,2),
  ano_ref int,
  pesos jsonb not null default '{"lc":1,"ch":1,"cn":1,"mt":1,"redacao":1}',
  fonte text,
  prioridade int not null default 0
);
create index on public.faculdades (user_id);
alter table public.faculdades enable row level security;
create policy "faculdades: só o dono" on public.faculdades for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.faculdades to authenticated;
