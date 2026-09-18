-- Etapa B: Novo CAGED (MTE) — movimentação mensal por município.
-- Camada RAW agregada: 1 linha por (competência, município). Microdados brutos
-- (linha por vínculo) ficam fora do banco; o script scripts/caged_fetch.py
-- agrega por município e scripts/caged_load.mjs faz o upsert aqui.
-- Em ambientes sem Postgres persistente (PGLite em memória), a leitura usa os
-- snapshots estáticos em src/data/caged/<UF>.json (mesmo conteúdo).
create table if not exists raw_caged (
  competencia text not null,
  ibge integer not null,
  admissoes integer not null default 0,
  desligamentos integer not null default 0,
  saldo integer not null default 0,
  sal_soma_adm numeric not null default 0,
  sal_n_adm integer not null default 0,
  fonte text not null default 'Novo Caged/MTE',
  atualizado_em timestamptz not null default now(),
  primary key (competencia, ibge)
);

create index if not exists raw_caged_ibge_idx on raw_caged (ibge);
create index if not exists raw_caged_competencia_idx on raw_caged (competencia);
