-- Estabelecimentos de saúde oficiais por município (CNES/DATASUS, base mensal).
-- Contagem de ativos (sem motivo de desativação) por município gestor.
-- Leitura prefere o banco e cai para src/data/saude/<UF>.json.
-- unidades = rede pública (natureza jurídica 1xxx); ubs = tipo 02 da rede
-- pública; hospitais = tipos 05/07 da rede pública; total_cnes inclui a rede
-- privada (contexto). Contagem de ativos (sem motivo de desativação).
create table if not exists raw_saude (
  ibge integer primary key,
  unidades integer not null default 0,
  ubs integer not null default 0,
  hospitais integer not null default 0,
  total_cnes integer not null default 0,
  competencia text not null default '',
  fonte text not null default 'CNES/DATASUS',
  atualizado_em timestamptz not null default now()
);
