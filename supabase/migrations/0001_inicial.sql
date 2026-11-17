-- Rumo — esquema inicial. Rode UMA vez no Supabase: SQL Editor → New query → colar → Run.
-- Cada pessoa só enxerga e altera as próprias linhas (RLS por user_id).

-- 1) Remove as tabelas da versão antiga (Streamlit), que tinham outros formatos.
--    Elas só tinham dados de teste. Se quiser guardar algo, exporte antes (Table Editor → Export).

drop table if exists public.config, public.lancamentos, public.investimentos, public.cenarios, public.fases, public.metas, public.criterios, public.carreiras, public.notas_carreira, public.decisoes, public.materias, public.conteudos, public.videoaulas, public.sessoes_estudo, public.simulados, public.temas_redacao, public.redacoes cascade;

-- 2) Tabelas novas

create table public.perfil (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  nome text not null default '', nascimento date, data_enem date not null default '2028-11-05', curso text not null default '', faculdade text not null default '',
  metas_nota jsonb not null default '{}', missoes jsonb not null default '{}', renda_desejada numeric(14,2) not null default 50000,
  taxa_saque numeric(6,4) not null default 0.04, inflacao numeric(6,4) not null default 0.045, criterios jsonb not null default '[]',
  onboarding_ok boolean not null default false
);
create index on public.perfil (user_id);
alter table public.perfil enable row level security;
create policy "perfil: só o dono" on public.perfil for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.perfil to authenticated;

create table public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  mes text not null check (mes ~ '^\d{4}-\d{2}$'), tipo text not null check (tipo in ('receita','despesa','aporte')),
  categoria text not null, descricao text, valor numeric(14,2) not null check (valor >= 0)
);
create index on public.lancamentos (user_id);
alter table public.lancamentos enable row level security;
create policy "lancamentos: só o dono" on public.lancamentos for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.lancamentos to authenticated;

create table public.investimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  nome text not null, tipo text not null default 'Outro', valor_aplicado numeric(14,2) not null default 0,
  saldo_atual numeric(14,2) not null default 0, atualizado_em date
);
create index on public.investimentos (user_id);
alter table public.investimentos enable row level security;
create policy "investimentos: só o dono" on public.investimentos for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.investimentos to authenticated;

create table public.cenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  nome text not null, taxa_real numeric(6,4) not null default 0.05, descricao text, fases jsonb not null default '[]', ordem int not null default 0
);
create index on public.cenarios (user_id);
alter table public.cenarios enable row level security;
create policy "cenarios: só o dono" on public.cenarios for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.cenarios to authenticated;

create table public.metas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  titulo text not null, area text not null default 'Pessoal', prazo date,
  status text not null default 'não iniciada' check (status in ('não iniciada','em andamento','concluída')), notas text
);
create index on public.metas (user_id);
alter table public.metas enable row level security;
create policy "metas: só o dono" on public.metas for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.metas to authenticated;

create table public.carreiras (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  nome text not null, notas jsonb not null default '{}', observacoes text
);
create index on public.carreiras (user_id);
alter table public.carreiras enable row level security;
create policy "carreiras: só o dono" on public.carreiras for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.carreiras to authenticated;

create table public.decisoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  data date not null, decisao text not null, premissas text, revisar_em date, resultado text
);
create index on public.decisoes (user_id);
alter table public.decisoes enable row level security;
create policy "decisoes: só o dono" on public.decisoes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.decisoes to authenticated;

create table public.materias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  area text not null, nome text not null, ordem int not null default 0
);
create index on public.materias (user_id);
alter table public.materias enable row level security;
create policy "materias: só o dono" on public.materias for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.materias to authenticated;

create table public.conteudos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  materia_id uuid not null references public.materias(id) on delete cascade, nome text not null,
  frequencia text not null default 'Média' check (frequencia in ('Alta','Média','Baixa')),
  status text not null default 'não estudado' check (status in ('não estudado','estudando','revisado','dominado')),
  revisado_em date, ordem int not null default 0
);
create index on public.conteudos (user_id);
alter table public.conteudos enable row level security;
create policy "conteudos: só o dono" on public.conteudos for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.conteudos to authenticated;

create table public.aulas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  materia_id uuid not null references public.materias(id) on delete cascade, conteudo text, titulo text not null,
  url text not null check (url ~ '^https?://'), canal text, assistida boolean not null default false, assistida_em date, notas text
);
create index on public.aulas (user_id);
alter table public.aulas enable row level security;
create policy "aulas: só o dono" on public.aulas for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.aulas to authenticated;

create table public.sessoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  data date not null, materia_id uuid references public.materias(id) on delete set null, minutos int not null check (minutos > 0),
  questoes int check (questoes >= 0), acertos int check (acertos >= 0), observacoes text
);
create index on public.sessoes (user_id);
alter table public.sessoes enable row level security;
create policy "sessoes: só o dono" on public.sessoes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.sessoes to authenticated;

create table public.simulados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  data date not null, nome text not null, lc numeric(6,1), ch numeric(6,1), cn numeric(6,1), mt numeric(6,1), redacao numeric(6,1)
);
create index on public.simulados (user_id);
alter table public.simulados enable row level security;
create policy "simulados: só o dono" on public.simulados for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.simulados to authenticated;

create table public.temas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  tema text not null, ano int, origem text not null default 'Treino' check (origem in ('ENEM','Treino'))
);
create index on public.temas (user_id);
alter table public.temas enable row level security;
create policy "temas: só o dono" on public.temas for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.temas to authenticated;

create table public.redacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  data date not null, tema text not null, texto text not null,
  c1 int check (c1 between 0 and 200), c2 int check (c2 between 0 and 200), c3 int check (c3 between 0 and 200),
  c4 int check (c4 between 0 and 200), c5 int check (c5 between 0 and 200), corretor text, comentarios text
);
create index on public.redacoes (user_id);
alter table public.redacoes enable row level security;
create policy "redacoes: só o dono" on public.redacoes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.redacoes to authenticated;

create table public.revisoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  tipo text not null check (tipo in ('erro','cartao')), materia_id uuid references public.materias(id) on delete set null,
  frente text not null, verso text, origem text, caixa int not null default 1 check (caixa between 1 and 6), proxima date not null default current_date,
  feitas int not null default 0, ultima date
);
create index on public.revisoes (user_id);
alter table public.revisoes enable row level security;
create policy "revisoes: só o dono" on public.revisoes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.revisoes to authenticated;

alter table public.perfil add constraint perfil_um_por_pessoa unique (user_id);
