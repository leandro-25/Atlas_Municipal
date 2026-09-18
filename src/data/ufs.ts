export type RegionCode = "N" | "NE" | "CO" | "SE" | "S";

export const REGION_NAMES: Record<RegionCode, string> = {
  N: "Norte",
  NE: "Nordeste",
  CO: "Centro-Oeste",
  SE: "Sudeste",
  S: "Sul",
};

export const REGION_ORDER: RegionCode[] = ["N", "NE", "CO", "SE", "S"];

export type UfMeta = {
  sigla: string;
  nome: string;
  region: RegionCode;
  capitalId: number;
};

export const UFS: UfMeta[] = [
  { sigla: "AC", nome: "Acre", region: "N", capitalId: 1200401 },
  { sigla: "AP", nome: "Amapá", region: "N", capitalId: 1600303 },
  { sigla: "AM", nome: "Amazonas", region: "N", capitalId: 1302603 },
  { sigla: "PA", nome: "Pará", region: "N", capitalId: 1501402 },
  { sigla: "RO", nome: "Rondônia", region: "N", capitalId: 1100205 },
  { sigla: "RR", nome: "Roraima", region: "N", capitalId: 1400100 },
  { sigla: "TO", nome: "Tocantins", region: "N", capitalId: 1721000 },
  { sigla: "AL", nome: "Alagoas", region: "NE", capitalId: 2704302 },
  { sigla: "BA", nome: "Bahia", region: "NE", capitalId: 2927408 },
  { sigla: "CE", nome: "Ceará", region: "NE", capitalId: 2304400 },
  { sigla: "MA", nome: "Maranhão", region: "NE", capitalId: 2111300 },
  { sigla: "PB", nome: "Paraíba", region: "NE", capitalId: 2507507 },
  { sigla: "PE", nome: "Pernambuco", region: "NE", capitalId: 2611606 },
  { sigla: "PI", nome: "Piauí", region: "NE", capitalId: 2211001 },
  { sigla: "RN", nome: "Rio Grande do Norte", region: "NE", capitalId: 2408102 },
  { sigla: "SE", nome: "Sergipe", region: "NE", capitalId: 2800308 },
  { sigla: "DF", nome: "Distrito Federal", region: "CO", capitalId: 5300108 },
  { sigla: "GO", nome: "Goiás", region: "CO", capitalId: 5208707 },
  { sigla: "MT", nome: "Mato Grosso", region: "CO", capitalId: 5103403 },
  { sigla: "MS", nome: "Mato Grosso do Sul", region: "CO", capitalId: 5002704 },
  { sigla: "ES", nome: "Espírito Santo", region: "SE", capitalId: 3205309 },
  { sigla: "MG", nome: "Minas Gerais", region: "SE", capitalId: 3106200 },
  { sigla: "RJ", nome: "Rio de Janeiro", region: "SE", capitalId: 3304557 },
  { sigla: "SP", nome: "São Paulo", region: "SE", capitalId: 3550308 },
  { sigla: "PR", nome: "Paraná", region: "S", capitalId: 4106902 },
  { sigla: "RS", nome: "Rio Grande do Sul", region: "S", capitalId: 4314902 },
  { sigla: "SC", nome: "Santa Catarina", region: "S", capitalId: 4205407 },
];

export const UF_BY_SIGLA = Object.fromEntries(UFS.map((u) => [u.sigla, u])) as Record<
  string,
  UfMeta
>;

export const CAPITAL_IDS = new Set(UFS.map((u) => u.capitalId));
