-- Saneamento oficial por município (Censo 2022, agregados por município).
-- Percentuais sobre moradores em DPPO; semBanheiro é contagem.
-- Leitura prefere o banco e cai para src/data/saneamento/<UF>.json.
create table if not exists raw_saneamento (
  ibge integer primary key,
  agua_rede numeric not null default 0,
  agua_encanada numeric not null default 0,
  esgoto_rede numeric not null default 0,
  esgoto_adequado numeric not null default 0,
  fossa_rudimentar numeric not null default 0,
  lixo_coletado numeric not null default 0,
  lixo_queimado numeric not null default 0,
  sem_banheiro integer not null default 0,
  fonte text not null default 'Censo 2022/IBGE',
  atualizado_em timestamptz not null default now()
);
