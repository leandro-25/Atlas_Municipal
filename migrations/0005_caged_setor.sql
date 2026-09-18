-- CAGED por seção CNAE (últimos 3 meses agregados) por município.
-- Leitura prefere o banco e cai para src/data/caged_setor/<UF>.json.
create table if not exists raw_caged_setor (
  ibge integer not null,
  secao text not null,
  adm integer not null default 0,
  desl integer not null default 0,
  periodo text not null default '',
  fonte text not null default 'Novo Caged/MTE',
  atualizado_em timestamptz not null default now(),
  primary key (ibge, secao)
);

create index if not exists raw_caged_setor_ibge_idx on raw_caged_setor (ibge);
