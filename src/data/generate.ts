import { CAPITAL_IDS, REGION_NAMES, UF_BY_SIGLA, type RegionCode } from "./ufs";
import { MUNICIPIOS, getMunicipio, municipiosByUf, type MunRecord } from "./cities";

export type NamedValue = { key: string; label: string; value: number };
export type YearPoint = { year: number; value: number };
export type AgeBand = { faixa: string; homens: number; mulheres: number; total: number };
export type EmpresaPorte = { porte: string; count: number };
export type Scenario = "expansao" | "estabilidade" | "retracao";
export type HealthStatus = "prosperando" | "estavel" | "estagnada" | "risco" | "declinio";
export type DependenciaClasse = "autonoma" | "mista" | "dependente";
export type MorarNivel = "boa" | "ressalvas" | "limitada" | "evitar";

export type HealthDimension = {
  key: string;
  label: string;
  score: number;
  hint: string;
};

export type HealthFlag = {
  tone: "good" | "warn" | "bad";
  text: string;
};

export type CityPulse = {
  id: number;
  name: string;
  uf: string;
  region: RegionCode;
  population: number;
  porte: string;
  isCapital: boolean;
  score: number;
  status: HealthStatus;
  morarScore: number;
  morarNivel: MorarNivel;
  dependenciaPct: number;
  propriaPct: number;
  taxaFormal: number;
  desemprego: number;
  pibPerCapita: number;
  idhm: number;
  folhaPct: number;
};

export type CityHealth = {
  score: number;
  status: HealthStatus;
  titulo: string;
  resumo: string;
  dimensions: HealthDimension[];
  flags: HealthFlag[];
  morar: {
    score: number;
    nivel: MorarNivel;
    veredito: string;
    texto: string;
  };
  rank: {
    uf: number;
    ufTotal: number;
    br: number;
    brTotal: number;
  };
  outlook: {
    pop: string;
    emprego: string;
    fiscal: string;
    custo: string;
  };
  confianca: {
    nivel: "baixa" | "moderada";
    texto: string;
  };
  metodo: string[];
  limites: string[];
  trajetoria: {
    score: number;
    rotulo: string;
    fonte: "oficial" | "estimada";
    detalhes: string[];
  };
  resiliencia: {
    score: number;
    detalhes: string[];
  };
  potencial: {
    score: number;
    detalhes: string[];
  };
  motores: string[];
};

export type CityProfile = {
  id: number;
  name: string;
  uf: string;
  ufName: string;
  region: RegionCode;
  regionName: string;
  isCapital: boolean;
  population: number;
  porte: string;
  receitaSeries: YearPoint[];
  despesaSeries: YearPoint[];
  receitaOrigem: NamedValue[];
  despesaFuncoes: NamedValue[];
  empresas: EmpresaPorte[];
  faixaEtaria: AgeBand[];
  residencias: number;
  ocupantesPorDomicilio: number;
  veiculos: { total: number; porMilHab: number; leves: number; motos: number; outros: number };
  empregos: {
    formais: number;
    informais: number;
    ocupados: number;
    taxaFormal: number;
    taxaOcupacao: number;
    desemprego: number;
    rendaMedia: number;
  };
  setores: NamedValue[];
  baseEconomica: string;
  pibPerCapita: number;
  idhm: number;
  custo: { indice: number; aluguel: number; cesta: number };
  educacao: { ideb: number; escolas: number };
  saudeServicos: { leitosPorMil: number; unidades: number };
  dependencia: {
    transferenciaPct: number;
    propriaPct: number;
    folhaPct: number;
    classificacao: DependenciaClasse;
    cargaMoradorPct: number;
    cargaEmpresaPct: number;
    familiaShare: number;
    empresaShare: number;
    pressaoMorador: number;
    poderCompra: number;
    riscoEmpresa: boolean;
    armadilhaConsumo: boolean;
  };
  migracao: { saldo: number; taxa: number };
  saude: CityHealth;
  projecao: {
    series: { year: number; pop: number; kind: "hist" | "forecast" }[];
    empregoSeries: { year: number; formais: number; kind: "hist" | "forecast" }[];
    taxaAnual: number;
    empregoTaxa: number;
    cenario: Scenario;
    horizonte2035: number;
    empregos2035: number;
    delta: number;
    relato: string;
  };
  kpis: {
    receita: number;
    despesa: number;
    resultado: number;
    resultadoPct: number;
    receitaPerCapita: number;
  };
};

type RegionProfile = {
  gdp: number;
  formal: number;
  vehicles: number;
  hhSize: number;
  young: number;
  old: number;
  growth: number;
  urban: number;
  idhm: number;
  agro: number;
  industria: number;
};

const REGION: Record<RegionCode, RegionProfile> = {
  N: { gdp: 0.78, formal: 0.44, vehicles: 0.28, hhSize: 3.35, young: 0.3, old: 0.08, growth: 0.011, urban: 0.72, idhm: 0.69, agro: 0.2, industria: 0.14 },
  NE: { gdp: 0.72, formal: 0.42, vehicles: 0.3, hhSize: 3.15, young: 0.27, old: 0.11, growth: 0.003, urban: 0.74, idhm: 0.66, agro: 0.16, industria: 0.12 },
  CO: { gdp: 1.18, formal: 0.6, vehicles: 0.5, hhSize: 2.92, young: 0.24, old: 0.1, growth: 0.013, urban: 0.88, idhm: 0.74, agro: 0.3, industria: 0.14 },
  SE: { gdp: 1.32, formal: 0.68, vehicles: 0.55, hhSize: 2.72, young: 0.2, old: 0.16, growth: 0.004, urban: 0.94, idhm: 0.76, agro: 0.08, industria: 0.22 },
  S: { gdp: 1.2, formal: 0.73, vehicles: 0.58, hhSize: 2.62, young: 0.19, old: 0.17, growth: 0.006, urban: 0.86, idhm: 0.777, agro: 0.18, industria: 0.26 },
};

type Core = {
  mun: MunRecord;
  isCapital: boolean;
  pop: number;
  gdp: number;
  urban: number;
  porte: string;
  rpc: number;
  receitaNow: number;
  despesaNow: number;
  resultadoPct: number;
  ownShare: number;
  stateShare: number;
  unionShare: number;
  issShare: number;
  iptuShare: number;
  itbiShare: number;
  taxasShare: number;
  cargaMorador: number;
  cargaEmpresa: number;
  familiaShare: number;
  empresaShare: number;
  pressaoMorador: number;
  poderCompra: number;
  riscoEmpresa: boolean;
  armadilhaConsumo: boolean;
  edu: number;
  saudeFn: number;
  admin: number;
  prev: number;
  urbanismo: number;
  assist: number;
  transp: number;
  demais: number;
  totalEmp: number;
  grandes: number;
  medias: number;
  pequenas: number;
  young: number;
  old: number;
  a15: number;
  a30: number;
  a45: number;
  hhSize: number;
  residencias: number;
  veiculosTotal: number;
  leves: number;
  motos: number;
  outrosVeiculos: number;
  ocupados: number;
  formais: number;
  informais: number;
  formalRate: number;
  taxaOcupacao: number;
  desemprego: number;
  rendaMedia: number;
  taxaAnual: number;
  empregoTaxa: number;
  cenario: Scenario;
  folhaPct: number;
  agro: number;
  industria: number;
  servicos: number;
  adminPub: number;
  baseEconomica: string;
  pibPerCapita: number;
  idhm: number;
  custoIndice: number;
  aluguel: number;
  cesta: number;
  ideb: number;
  escolas: number;
  leitosPorMil: number;
  unidades: number;
  migracaoTaxa: number;
  dimFiscal: number;
  dimIndep: number;
  dimEmprego: number;
  dimDemo: number;
  dimEcon: number;
  dimCusto: number;
  dimServicos: number;
  score: number;
  morarScore: number;
  status: HealthStatus;
  morarNivel: MorarNivel;
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function roundTo(n: number, step: number) {
  return Math.round(n / step) * step;
}

function porteLabel(pop: number): string {
  if (pop >= 1_000_000) return "Metrópole";
  if (pop >= 500_000) return "Grande porte";
  if (pop >= 100_000) return "Médio porte";
  if (pop >= 20_000) return "Pequeno porte II";
  return "Pequeno porte I";
}

function urbanShare(pop: number, isCapital: boolean, regionUrban: number, rng: () => number) {
  const size = clamp(Math.log10(pop) / 7, 0.2, 1);
  const base = lerp(regionUrban * 0.72, 0.99, size);
  return clamp(base + (isCapital ? 0.04 : 0) + (rng() - 0.5) * 0.04, 0.28, 0.995);
}

function receitaPerCapita(
  pop: number,
  gdp: number,
  urban: number,
  isCapital: boolean,
  rng: () => number,
) {
  const fpmFloor = 2650 * Math.pow(12000 / (12000 + pop), 0.18);
  const own = 980 * gdp * urban;
  const scale = 240 * Math.log10(Math.max(pop, 200)) * gdp;
  const capital = isCapital ? 900 + Math.log10(pop) * 80 : 0;
  const noise = lerp(0.94, 1.08, rng());
  return (fpmFloor + own + scale + capital) * noise;
}

function statusFromScore(score: number): HealthStatus {
  if (score >= 73) return "prosperando";
  if (score >= 61) return "estavel";
  if (score >= 49) return "estagnada";
  if (score >= 37) return "risco";
  return "declinio";
}

function morarFromScore(score: number): MorarNivel {
  if (score >= 70) return "boa";
  if (score >= 55) return "ressalvas";
  if (score >= 42) return "limitada";
  return "evitar";
}

const coreCache = new Map<number, Core>();
const pulseCache = new Map<number, CityPulse>();
const profileCache = new Map<number, CityProfile>();
let allPulsesCache: CityPulse[] | undefined;
const pulsesByUf = new Map<string, CityPulse[]>();
let rankedByScore: CityPulse[] | undefined;

function getCore(mun: MunRecord): Core {
  const hit = coreCache.get(mun.i);
  if (hit) return hit;
  const core = computeCore(mun);
  coreCache.set(mun.i, core);
  return core;
}

function computeCore(mun: MunRecord): Core {
  const rng = mulberry32(mun.i * 9973 + 13);
  const region = mun.r;
  const rp = REGION[region];
  const isCapital = CAPITAL_IDS.has(mun.i);
  const pop = Math.max(mun.p, 400);
  const gdp = rp.gdp * (isCapital ? 1.28 : 1) * lerp(0.9, 1.12, rng());
  const urban = urbanShare(pop, isCapital, rp.urban, rng);
  const porte = porteLabel(pop);

  const rpc = receitaPerCapita(pop, gdp, urban, isCapital, rng);
  const receitaNow = rpc * pop;
  const resultNoise = lerp(-0.05, 0.048, rng());
  const despesaNow = receitaNow * (1 - resultNoise);
  const resultadoPct = (receitaNow - despesaNow) / receitaNow;

  const sizeLog = Math.log10(Math.max(pop, 500) / 1000);
  const ownShare = clamp(
    0.07 + urban * 0.12 + sizeLog * 0.09 * gdp + (isCapital ? 0.1 : 0) + (pop >= 500_000 ? 0.06 : 0),
    0.08,
    0.62,
  );
  const stateShare = clamp(0.16 + gdp * 0.05, 0.14, 0.28);
  const unionShare = clamp(1 - ownShare - stateShare, 0.18, 0.72);
  const issShare = ownShare * (0.28 + urban * 0.35);
  const iptuShare = ownShare * (0.18 + urban * 0.22);
  const itbiShare = ownShare * 0.12;
  const taxasShare = ownShare - issShare - iptuShare - itbiShare;
  // Quem paga a conta própria: empresas (ISS) x moradores (IPTU + ITBI + taxas).
  const cargaEmpresa = issShare;
  const cargaMorador = iptuShare + itbiShare + taxasShare;
  const familiaShare = cargaMorador / Math.max(ownShare, 0.001);
  const empresaShare = issShare / Math.max(ownShare, 0.001);

  const edu = 0.26 + rng() * 0.03;
  const saudeFn = 0.22 + rng() * 0.03;
  const admin = 0.12 + rng() * 0.04;
  const prev = 0.1 + rng() * 0.04;
  const urbanismo = 0.08 + rng() * 0.03;
  const assist = 0.06 + rng() * 0.02;
  const transp = 0.04 + rng() * 0.02;
  const used = edu + saudeFn + admin + prev + urbanismo + assist + transp;
  const demais = Math.max(0.04, 1 - used);

  const firmDensity = 0.021 * gdp * lerp(0.88, 1.08, urban) * lerp(0.94, 1.06, rng());
  const totalEmp = Math.max(12, roundTo(pop * firmDensity, 1));
  const largeShare = clamp(0.00022 * Math.log10(pop) * gdp, 0.0002, 0.006);
  const medShare = clamp(0.008 * gdp * Math.log10(pop) * 0.15, 0.006, 0.04);
  const grandes = Math.max(isCapital ? 8 : 0, Math.round(totalEmp * largeShare));
  const medias = Math.max(isCapital ? 40 : 1, Math.round(totalEmp * medShare));
  const pequenas = Math.max(8, totalEmp - grandes - medias);

  const young = clamp(rp.young + (rng() - 0.5) * 0.03, 0.14, 0.36);
  const old = clamp(rp.old + (rng() - 0.5) * 0.02, 0.06, 0.22);
  const a15 = clamp(0.22 + (rng() - 0.5) * 0.02, 0.18, 0.26);
  const a30 = clamp(0.23 + (rng() - 0.5) * 0.02, 0.19, 0.27);
  const a45 = Math.max(0.12, 1 - young - old - a15 - a30);

  const hhSize = rp.hhSize * lerp(0.96, 1.04, rng()) * (urban > 0.9 ? 0.96 : 1);
  const residencias = Math.round(pop / hhSize);
  const vehicleRate = rp.vehicles * gdp * lerp(0.7, 1.05, urban) * lerp(0.92, 1.08, rng());
  const veiculosTotal = Math.round(pop * vehicleRate);
  const leves = Math.round(veiculosTotal * 0.62);
  const motos = Math.round(veiculosTotal * (region === "N" || region === "NE" ? 0.3 : 0.22));
  const outrosVeiculos = Math.max(0, veiculosTotal - leves - motos);

  const working = pop * 0.66;
  const partic = lerp(0.54, 0.64, urban) * lerp(0.96, 1.04, rng());
  const ocupados = Math.round(working * partic);
  const formalRate = clamp(rp.formal * lerp(0.85, 1.12, urban) * (isCapital ? 1.08 : 1), 0.22, 0.86);
  const formais = Math.round(ocupados * formalRate);
  const informais = Math.max(0, ocupados - formais);
  const taxaOcupacao = ocupados / pop;

  const sizeDrag = pop < 20000 ? (region === "CO" || region === "N" ? 0.002 : -0.006) : pop > 500000 ? 0.001 : 0.002;
  const capitalBoost = isCapital ? 0.003 : 0;
  const taxaAnual = clamp(rp.growth + sizeDrag + capitalBoost + (rng() - 0.5) * 0.006, -0.018, 0.028);
  const cenario: Scenario = taxaAnual > 0.007 ? "expansao" : taxaAnual < -0.002 ? "retracao" : "estabilidade";

  let adminPub = 0.07 + (1 - urban) * 0.1 + (pop < 20000 ? 0.18 : pop < 50000 ? 0.1 : 0.02);
  adminPub += (1 - gdp) * 0.08;
  adminPub = clamp(adminPub + (rng() - 0.5) * 0.04, 0.05, 0.5);
  let agro = rp.agro * (1.35 - urban * 0.7) * lerp(0.85, 1.15, rng());
  let industria = rp.industria * (0.55 + urban * 0.55) * gdp * lerp(0.88, 1.12, rng());
  agro = clamp(agro, 0.03, 0.48);
  industria = clamp(industria, 0.05, 0.42);
  let servicos = 1 - adminPub - agro - industria;
  if (servicos < 0.18) {
    const overflow = 0.18 - servicos;
    adminPub = Math.max(0.05, adminPub - overflow * 0.4);
    agro = Math.max(0.03, agro - overflow * 0.3);
    industria = Math.max(0.05, industria - overflow * 0.3);
    servicos = 1 - adminPub - agro - industria;
  }

  let baseEconomica = "serviços";
  const top = Math.max(adminPub, agro, industria, servicos);
  if (top === adminPub) baseEconomica = "administração pública";
  else if (top === agro) baseEconomica = "agronegócio";
  else if (top === industria) baseEconomica = "indústria";

  const folhaPct = clamp(
    0.36 + (1 - ownShare) * 0.22 + (pop < 20000 ? 0.08 : 0) + adminPub * 0.12 + (rng() - 0.5) * 0.04,
    0.32,
    0.72,
  );

  const pibPerCapita = clamp(
    16500 * gdp * lerp(0.88, 1.14, urban) * (isCapital ? 1.32 : 1) * (1 + Math.log10(Math.max(pop, 800)) * 0.045) * lerp(0.92, 1.1, rng()),
    9800,
    145000,
  );
  const rendaMedia = clamp(
    980 * gdp * (0.65 + formalRate) * lerp(0.9, 1.12, urban) * (isCapital ? 1.18 : 1) * lerp(0.94, 1.08, rng()),
    980,
    7200,
  );
  let desemprego = 0.155 - formalRate * 0.09 - gdp * 0.025 + (1 - urban) * 0.02 + (region === "NE" ? 0.018 : 0);
  desemprego = clamp(desemprego + (rng() - 0.5) * 0.02, 0.038, 0.19);

  let custoIndice =
    52 + urban * 22 + Math.log10(Math.max(pop, 800)) * 5.5 + (isCapital ? 11 : 0) + gdp * 7;
  if (mun.u === "SP" && isCapital) custoIndice += 16;
  if (mun.u === "RJ" && isCapital) custoIndice += 14;
  if (mun.u === "DF") custoIndice += 12;
  custoIndice = clamp(custoIndice * lerp(0.96, 1.05, rng()), 58, 168);
  const aluguel = Math.round(420 * (custoIndice / 100) * (isCapital ? 1.35 : 1) * lerp(0.92, 1.1, rng()));
  const cesta = Math.round(590 * (custoIndice / 100) * lerp(0.95, 1.06, rng()));

  const idhm = clamp(
    rp.idhm + Math.log10(Math.max(pop, 800)) * 0.012 + (isCapital ? 0.035 : 0) + (gdp - 1) * 0.04 + (urban - 0.7) * 0.05 + (rng() - 0.5) * 0.02,
    0.55,
    0.89,
  );
  const ideb = clamp(3.4 + idhm * 3.2 + (rng() - 0.5) * 0.35, 3.5, 6.9);
  const escolas = Math.max(1, Math.round(pop / (380 + (1 - urban) * 220)));
  const leitosPorMil = clamp(1.1 + (isCapital ? 1.4 : 0) + urban * 0.9 + gdp * 0.4 + (rng() - 0.5) * 0.3, 0.7, 5.2);
  const unidades = Math.max(1, Math.round(pop / 4200 + (isCapital ? 8 : 0)));

  // Inflação corrói consumo: cesta e aluguel pesam contra a renda.
  // Tributo direto do morador (IPTU/ITBI/taxas) sai do mesmo bolso — quanto maior,
  // menos sobra para gastar no comércio local, o que trava emprego e população.
  const poderCompra = cesta / Math.max(rendaMedia, 1);
  const tributoMoradorMes = (receitaNow * cargaMorador) / Math.max(pop, 1) / 12;
  const pressaoMorador = tributoMoradorMes / Math.max(rendaMedia, 1);
  // ISS alto demais fecha empresa: carga sobre atividade acima de ~24% da receita
  // total (ou 65% da receita própria) vira risco de fechamento / fuga.
  const riscoEmpresa = cargaEmpresa > 0.24 || (empresaShare > 0.65 && custoIndice > 110);
  const armadilhaConsumo = familiaShare > 0.58 && (poderCompra > 0.38 || pressaoMorador > 0.012);
  // Arrocho no morador drena a economia local ao longo do tempo.
  const consumoDrag = armadilhaConsumo
    ? 0.004 + Math.min(0.008, (familiaShare - 0.58) * 0.06 + Math.max(0, poderCompra - 0.38) * 0.02)
    : 0;
  const empresaDrag = riscoEmpresa ? 0.005 : 0;

  const migracaoTaxa = clamp(taxaAnual * 0.55 + (formalRate - 0.5) * 0.01 - consumoDrag * 0.5, -0.02, 0.025);
  const empregoTaxa = clamp(
    taxaAnual * 0.85 + (formalRate - 0.5) * 0.012 + (adminPub > 0.32 ? -0.004 : 0.003) - consumoDrag - empresaDrag,
    -0.02,
    0.03,
  );

  const dimFiscal = clamp(
    52 + resultadoPct * 380 - Math.max(0, folhaPct - 0.5) * 200 + (ownShare - 0.28) * 50,
    8,
    96,
  );
  // Independência só vale se vier de empresa em dose moderada. Receita própria
  // bancada pelo morador (IPTU/taxas) não é autonomia — é arrocho.
  const qualidadeBase = 0.62 + empresaShare * 0.75 - Math.max(0, familiaShare - 0.5) * 0.7;
  const dimIndep = clamp(ownShare * 155 * clamp(qualidadeBase, 0.45, 1.15) - Math.max(0, unionShare - 0.35) * 55, 8, 96);
  const dimEmprego = clamp(
    formalRate * 78 + (0.11 - desemprego) * 220 + (formais / Math.max(pop, 1)) * 90 - consumoDrag * 900 - empresaDrag * 700,
    8,
    96,
  );
  const dimDemo = clamp(50 + (taxaAnual - consumoDrag * 0.6) * 1600 + (0.14 - old) * 110 + (young - 0.2) * 40, 8, 96);
  const maxSetor = Math.max(adminPub, agro, industria, servicos);
  const dimEcon = clamp(
    88 - adminPub * 130 - Math.max(0, maxSetor - 0.45) * 50 + ((grandes + medias) / Math.max(pop, 1)) * 18000 - (riscoEmpresa ? 9 : 0),
    8,
    96,
  );
  const dimCusto = clamp(108 - (custoIndice - 78) * 0.72 - pressaoMorador * 260, 12, 94);
  const dimServicos = clamp(idhm * 72 + (ideb - 4) * 8 + leitosPorMil * 4, 12, 96);

  let score =
    dimFiscal * 0.18 +
    dimIndep * 0.18 +
    dimEmprego * 0.22 +
    dimDemo * 0.14 +
    dimEcon * 0.12 +
    dimServicos * 0.1 +
    dimCusto * 0.06;
  if (folhaPct > 0.58 && ownShare < 0.22) score -= 6;
  if (taxaAnual < -0.006 && adminPub > 0.32) score -= 5;
  if (ownShare < 0.18) score -= 7;
  if (pop < 30000 && adminPub > 0.28) score -= 4;
  // Cidade que vive de transferência não prospera: teto de estagnação.
  const transferenciaPctPre = unionShare + stateShare;
  if (transferenciaPctPre > 0.72) score = Math.min(score, 56);
  else if (transferenciaPctPre > 0.65 && familiaShare > 0.55) score = Math.min(score, 60);
  // Receita própria à custa do morador não é prosperidade.
  if (armadilhaConsumo) score -= 4 + Math.min(6, (familiaShare - 0.58) * 30);
  if (riscoEmpresa) score -= 5;
  score = clamp(score, 10, 94);

  let morarScore =
    dimEmprego * 0.28 +
    dimIndep * 0.14 +
    dimDemo * 0.16 +
    dimEcon * 0.12 +
    dimServicos * 0.14 +
    dimCusto * 0.16;
  if (adminPub > 0.36) morarScore -= 8;
  if (ownShare < 0.2) morarScore -= 6;
  if (desemprego > 0.13) morarScore -= 5;
  if (armadilhaConsumo) morarScore -= 6;
  if (riscoEmpresa) morarScore -= 3;
  morarScore = clamp(morarScore, 10, 94);

  const status = statusFromScore(score);
  const morarNivel = morarFromScore(morarScore);

  return {
    mun,
    isCapital,
    pop,
    gdp,
    urban,
    porte,
    rpc,
    receitaNow,
    despesaNow,
    resultadoPct,
    ownShare,
    stateShare,
    unionShare,
    issShare,
    iptuShare,
    itbiShare,
    taxasShare,
    cargaMorador,
    cargaEmpresa,
    familiaShare,
    empresaShare,
    pressaoMorador,
    poderCompra,
    riscoEmpresa,
    armadilhaConsumo,
    edu,
    saudeFn,
    admin,
    prev,
    urbanismo,
    assist,
    transp,
    demais,
    totalEmp,
    grandes,
    medias,
    pequenas,
    young,
    old,
    a15,
    a30,
    a45,
    hhSize,
    residencias,
    veiculosTotal,
    leves,
    motos,
    outrosVeiculos,
    ocupados,
    formais,
    informais,
    formalRate,
    taxaOcupacao,
    desemprego,
    rendaMedia,
    taxaAnual,
    empregoTaxa,
    cenario,
    folhaPct,
    agro,
    industria,
    servicos,
    adminPub,
    baseEconomica,
    pibPerCapita,
    idhm,
    custoIndice,
    aluguel,
    cesta,
    ideb,
    escolas,
    leitosPorMil,
    unidades,
    migracaoTaxa,
    dimFiscal,
    dimIndep,
    dimEmprego,
    dimDemo,
    dimEcon,
    dimCusto,
    dimServicos,
    score,
    morarScore,
    status,
    morarNivel,
  };
}

function pulseFromCore(c: Core): CityPulse {
  return {
    id: c.mun.i,
    name: c.mun.n,
    uf: c.mun.u,
    region: c.mun.r,
    population: c.pop,
    porte: c.porte,
    isCapital: c.isCapital,
    score: Math.round(c.score),
    status: c.status,
    morarScore: Math.round(c.morarScore),
    morarNivel: c.morarNivel,
    dependenciaPct: c.unionShare + c.stateShare,
    propriaPct: c.ownShare,
    taxaFormal: c.formalRate,
    desemprego: c.desemprego,
    pibPerCapita: c.pibPerCapita,
    idhm: c.idhm,
    folhaPct: c.folhaPct,
  };
}

export function getCityPulse(id: number): CityPulse | undefined {
  const hit = pulseCache.get(id);
  if (hit) return hit;
  const mun = getMunicipio(id);
  if (!mun) return undefined;
  const pulse = pulseFromCore(getCore(mun));
  pulseCache.set(id, pulse);
  return pulse;
}

export function getAllPulses(): CityPulse[] {
  if (allPulsesCache) return allPulsesCache;
  const list = MUNICIPIOS.map((m) => {
    const existing = pulseCache.get(m.i);
    if (existing) return existing;
    const pulse = pulseFromCore(getCore(m));
    pulseCache.set(m.i, pulse);
    return pulse;
  });
  allPulsesCache = list;
  return list;
}

export function getUfPulses(uf: string): CityPulse[] {
  const cached = pulsesByUf.get(uf);
  if (cached) return cached;
  const list = municipiosByUf(uf).map((m) => getCityPulse(m.i)!).filter(Boolean);
  pulsesByUf.set(uf, list);
  return list;
}

function getRankedByScore(): CityPulse[] {
  if (rankedByScore) return rankedByScore;
  rankedByScore = [...getAllPulses()].sort((a, b) => b.score - a.score || b.population - a.population);
  return rankedByScore;
}

export function getStateRank(id: number, uf: string): { uf: number; ufTotal: number } {
  const ufList = [...getUfPulses(uf)].sort((a, b) => b.score - a.score || b.population - a.population);
  const ufRank = ufList.findIndex((p) => p.id === id) + 1;
  return { uf: Math.max(1, ufRank), ufTotal: ufList.length };
}

export function getNationalRank(id: number): { br: number; brTotal: number } {
  const brList = getRankedByScore();
  const brRank = brList.findIndex((p) => p.id === id) + 1;
  return { br: Math.max(1, brRank), brTotal: brList.length };
}

export type PulseQuery = {
  uf?: string;
  status?: HealthStatus | "alerta";
  independente?: boolean;
  minPop?: number;
  sort?: "pop" | "saude" | "morar";
  limit?: number;
};

export function queryPulses(opts: PulseQuery = {}): { rows: CityPulse[]; total: number } {
  let rows = opts.uf ? getUfPulses(opts.uf) : getAllPulses();
  if (opts.status === "alerta") rows = rows.filter((p) => p.status === "risco" || p.status === "declinio");
  else if (opts.status) rows = rows.filter((p) => p.status === opts.status);
  if (opts.independente) rows = rows.filter((p) => p.propriaPct >= 0.28);
  const minPop = opts.minPop;
  if (minPop) rows = rows.filter((p) => p.population >= minPop);
  const total = rows.length;
  const copy = [...rows];
  if (opts.sort === "saude") copy.sort((a, b) => b.score - a.score || b.population - a.population);
  else if (opts.sort === "morar") copy.sort((a, b) => b.morarScore - a.morarScore || b.population - a.population);
  else copy.sort((a, b) => b.population - a.population);
  return { rows: copy.slice(0, opts.limit ?? 60), total };
}

export type ExplorerData = {
  liveable: CityPulse[];
  healthy: CityPulse[];
  alert: CityPulse[];
  counts: Record<HealthStatus, number>;
};

function pickSpread(sorted: CityPulse[], n: number): CityPulse[] {
  const out: CityPulse[] = [];
  const seen = new Set<number>();
  const ufCount = new Map<string, number>();
  for (const p of sorted) {
    if (out.length >= n) break;
    if ((ufCount.get(p.uf) ?? 0) >= 2) continue;
    out.push(p);
    seen.add(p.id);
    ufCount.set(p.uf, (ufCount.get(p.uf) ?? 0) + 1);
  }
  for (const p of sorted) {
    if (out.length >= n) break;
    if (seen.has(p.id)) continue;
    out.push(p);
  }
  return out;
}

export function getExplorerData(): ExplorerData {
  const all = getAllPulses();
  const mid = all.filter((p) => p.population >= 20000);
  const liveable = pickSpread(
    [...mid].sort((a, b) => b.morarScore - a.morarScore || b.score - a.score),
    9,
  );
  const healthy = pickSpread(
    [...mid].sort((a, b) => b.score - a.score || b.population - a.population),
    9,
  );
  const alertPool = all.filter(
    (p) => p.population >= 10000 && (p.status === "risco" || p.status === "declinio" || p.status === "estagnada"),
  );
  const alert = pickSpread(
    [...alertPool].sort((a, b) => a.score - b.score || a.population - b.population),
    9,
  );
  const counts: Record<HealthStatus, number> = {
    prosperando: 0,
    estavel: 0,
    estagnada: 0,
    risco: 0,
    declinio: 0,
  };
  for (const p of all) counts[p.status] += 1;
  return { liveable, healthy, alert, counts };
}

export function getCityProfile(id: number): CityProfile | undefined {
  const hit = profileCache.get(id);
  if (hit) return hit;
  const mun = getMunicipio(id);
  if (!mun) return undefined;
  const profile = buildProfile(getCore(mun));
  profileCache.set(id, profile);
  return profile;
}

export type RealInput = {
  ano: number;
  populacao: number;
  receitaLiquida: number;
  tributariaPropria: number;
  iptu: number;
  itbi: number;
  iss: number;
  taxas: number;
  uniaoShare: number;
  estadoShare: number;
  despesaTotal: number;
  folhaRCL: number;
};

/**
 * Perfil com fiscais oficiais aplicados: receita, despesa, composição
 * tributária e folha vêm do SICONFI/DCA; o restante segue estimado e
 * rotulado como tal na UI. A saúde é recalculada sobre o núcleo ajustado.
 */
export type RealExtras = {
  /** Despesa por função oficial (DCA-Anexo I-E) — substitui a composição estimada. */
  funcoes?: NamedValue[];
  /** Resumo da série fiscal oficial para o índice de trajetória. */
  serie?: {
    cagrPropria: number | null;
    cagrTransf: number | null;
    volatilidade: number | null;
    anos: number;
    /** População oficial por ano (DCA) — estende o observado além de 2024. */
    popPorAno?: { ano: number; pop: number }[];
  } | null;
  /** Cidade-polo da região imediata (IBGE) — pondera o potencial. */
  souPolo?: boolean;
};

/** Sinais do núcleo para a busca por perfil (sem expor o modelo interno). */
export function getCityCoreSignals(
  id: number,
):
  | {
      taxaAnual: number;
      empregoTaxa: number;
      custoIndice: number;
      empresaShare: number;
      familiaShare: number;
      propriaPct: number;
      transferenciaPct: number;
      rendaMedia: number;
      folhaPct: number;
    }
  | undefined {
  const mun = getMunicipio(id);
  if (!mun) return undefined;
  const c = getCore(mun);
  return {
    taxaAnual: c.taxaAnual,
    empregoTaxa: c.empregoTaxa,
    custoIndice: c.custoIndice,
    empresaShare: c.empresaShare,
    familiaShare: c.familiaShare,
    propriaPct: c.ownShare,
    transferenciaPct: c.unionShare + c.stateShare,
    rendaMedia: c.rendaMedia,
    folhaPct: c.folhaPct,
  };
}

export function getCityProfileWithReal(
  id: number,
  real: RealInput,
  extras?: RealExtras,
): CityProfile | undefined {
  const mun = getMunicipio(id);
  if (!mun) return undefined;
  const base = getCore(mun);
  const rec = Math.max(real.receitaLiquida, 1);
  const own = Math.min(0.95, Math.max(0, real.tributariaPropria / rec));
  const union = Math.min(0.9, Math.max(0, real.uniaoShare));
  const state = Math.min(0.9, Math.max(0, real.estadoShare));
  const iss = Math.min(0.9, Math.max(0, real.iss / rec));
  const iptu = Math.min(0.9, Math.max(0, real.iptu / rec));
  const itbi = Math.min(0.9, Math.max(0, real.itbi / rec));
  const taxasRest = Math.max(0, own - iss - iptu - itbi);
  const pop = real.populacao > 0 ? real.populacao : base.pop;

  const over: Core = {
    ...base,
    pop,
    receitaNow: rec,
    despesaNow: real.despesaTotal > 0 ? real.despesaTotal : base.despesaNow,
    resultadoPct:
      real.despesaTotal > 0 ? (rec - real.despesaTotal) / rec : base.resultadoPct,
    ownShare: own,
    unionShare: union,
    stateShare: state,
    issShare: iss,
    iptuShare: iptu,
    itbiShare: itbi,
    taxasShare: taxasRest,
    cargaMorador: iptu + itbi + taxasRest,
    cargaEmpresa: iss,
    familiaShare: own > 0 ? (iptu + itbi + taxasRest) / own : base.familiaShare,
    empresaShare: own > 0 ? iss / own : base.empresaShare,
    folhaPct: real.folhaRCL > 0 ? Math.min(0.85, real.folhaRCL) : base.folhaPct,
  };
  const profile = buildProfile(over, extras);
  if (extras?.funcoes && extras.funcoes.length > 0) {
    profile.despesaFuncoes = [...extras.funcoes].sort((a, b) => b.value - a.value);
  }
  const oficial = `Fiscal oficial aplicado (SICONFI/DCA ${real.ano}): receita, despesa, composição tributária e folha${extras?.funcoes && extras.funcoes.length > 0 ? ", despesa por função" : ""}. Demografia, emprego, empresas e projeções seguem estimados.`;
  profile.saude.metodo = [oficial, ...profile.saude.metodo];
  profile.saude.confianca = {
    nivel: "moderada",
    texto: `Confiança moderada: fiscal oficial de ${real.ano} combinado a estimativas para emprego e demografia. Confirme emprego em RAIS/eSocial e população no IBGE.`,
  };
  return profile;
}

function buildProfile(c: Core, extras?: RealExtras): CityProfile {
  const rng = mulberry32(c.mun.i * 9973 + 91);
  const pop = c.pop;
  const years = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  const receitaSeries: YearPoint[] = [];
  const despesaSeries: YearPoint[] = [];
  for (const year of years) {
    const covid = year === 2020 ? 0.93 : year === 2021 ? 0.97 : 1;
    const nominal = Math.pow(1.075, year - 2025);
    const rec = c.receitaNow * nominal * covid * lerp(0.97, 1.03, rng());
    const dep = c.despesaNow * nominal * (year === 2020 ? 0.96 : covid) * lerp(0.97, 1.03, rng());
    receitaSeries.push({ year, value: rec });
    despesaSeries.push({ year, value: dep });
  }

  const receitaNow = c.receitaNow;
  const despesaNow = c.despesaNow;
  const receitaOrigem: NamedValue[] = [
    { key: "uniao", label: "Transferências da União", value: receitaNow * c.unionShare },
    { key: "estado", label: "Transferências do Estado", value: receitaNow * c.stateShare },
    { key: "iss", label: "ISS", value: receitaNow * c.issShare },
    { key: "iptu", label: "IPTU", value: receitaNow * c.iptuShare },
    { key: "itbi", label: "ITBI", value: receitaNow * Math.max(c.itbiShare, 0.02) },
    { key: "taxas", label: "Taxas e outras próprias", value: receitaNow * Math.max(c.taxasShare, 0.02) },
  ];

  const despesaFuncoes: NamedValue[] = [
    { key: "edu", label: "Educação", value: despesaNow * c.edu },
    { key: "saude", label: "Saúde", value: despesaNow * c.saudeFn },
    { key: "admin", label: "Administração", value: despesaNow * c.admin },
    { key: "prev", label: "Previdência", value: despesaNow * c.prev },
    { key: "urb", label: "Urbanismo", value: despesaNow * c.urbanismo },
    { key: "assist", label: "Assistência social", value: despesaNow * c.assist },
    { key: "transp", label: "Transporte", value: despesaNow * c.transp },
    { key: "outros", label: "Demais funções", value: despesaNow * c.demais },
  ].sort((a, b) => b.value - a.value);

  const empresas: EmpresaPorte[] = [
    { porte: "Pequenas", count: c.pequenas },
    { porte: "Médias", count: c.medias },
    { porte: "Grandes", count: c.grandes },
  ];

  const bands = [
    { faixa: "0–14", w: c.young },
    { faixa: "15–29", w: c.a15 },
    { faixa: "30–44", w: c.a30 },
    { faixa: "45–59", w: c.a45 },
    { faixa: "60+", w: c.old },
  ];
  const faixaEtaria: AgeBand[] = bands.map((b) => {
    const total = Math.round(pop * b.w);
    const maleShare = b.faixa === "60+" ? 0.45 : b.faixa === "0–14" ? 0.51 : 0.49;
    const homens = Math.round(total * maleShare);
    return { faixa: b.faixa, homens, mulheres: total - homens, total };
  });

  const setores: NamedValue[] = [
    { key: "serv", label: "Serviços", value: c.servicos },
    { key: "ind", label: "Indústria", value: c.industria },
    { key: "agro", label: "Agropecuária", value: c.agro },
    { key: "adm", label: "Admin. pública", value: c.adminPub },
  ].sort((a, b) => b.value - a.value);

  // Observado vai até o último ano com dado oficial (DCA), não para em 2024.
  // O histórico é reconstruído DE TRÁS PARA FRENTE a partir da âncora — nunca
  // se "força" um ano no valor atual, que era o que criava a dobra 2023→2024
  // seguida de arrancada (queda forçada + salto).
  const popOficial = new Map<number, number>();
  for (const pt of extras?.serie?.popPorAno ?? []) {
    if (pt.ano >= 2020 && pt.ano <= 2026 && pt.pop > 0) popOficial.set(pt.ano, Math.round(pt.pop));
  }
  let lastHistPop = 2024;
  for (const y of popOficial.keys()) if (y > lastHistPop) lastHistPop = y;
  const lastHistJobs = 2024;

  const ratePop = (year: number) => c.taxaAnual * (year < 2020 ? 1.15 : year < 2022 ? 0.4 : 1);
  const rateJobs = (year: number) => c.empregoTaxa * (year < 2020 ? 1.1 : year < 2022 ? 0.2 : 1);

  const histPop = new Map<number, number>();
  histPop.set(lastHistPop, popOficial.get(lastHistPop) ?? pop);
  for (const [y, v] of popOficial) if (y < lastHistPop) histPop.set(y, v);
  for (let year = lastHistPop; year > 2015; year--) {
    if (!histPop.has(year - 1)) {
      histPop.set(year - 1, Math.round(histPop.get(year)! / (1 + ratePop(year))));
    }
  }

  // Cenário atual pesa mais: a projeção parte do ritmo recente (CAGR oficial
  // dos últimos anos quando há dado) e converge para a taxa de longo prazo.
  const clampG = (g: number) => Math.max(-0.03, Math.min(0.05, g));
  let recentePop = c.taxaAnual;
  {
    const ys = [...popOficial.keys()].filter((y) => y <= lastHistPop).sort((a, b) => a - b);
    if (ys.length >= 3) {
      const first = popOficial.get(ys[0])!;
      const last = popOficial.get(ys[ys.length - 1])!;
      if (first > 0 && last > 0) recentePop = clampG(Math.pow(last / first, 1 / (ys[ys.length - 1]! - ys[0]!)) - 1);
    }
  }
  const series: CityProfile["projecao"]["series"] = [];
  const empregoSeries: CityProfile["projecao"]["empregoSeries"] = [];
  let p = histPop.get(lastHistPop)!;
  for (let year = 2015; year <= 2035; year++) {
    if (year <= lastHistPop) {
      p = histPop.get(year)!;
    } else {
      const i = year - lastHistPop;
      const w = Math.pow(0.65, i - 1);
      p = Math.round(p * (1 + w * recentePop + (1 - w) * c.taxaAnual));
    }
    series.push({ year, pop: Math.round(p), kind: year <= lastHistPop ? "hist" : "forecast" });
  }
  // Reconstrói empregos para trás a partir da âncora 2024.
  let jb = c.formais;
  const backJobs = new Map<number, number>([[lastHistJobs, c.formais]]);
  for (let year = lastHistJobs; year > 2015; year--) {
    jb = Math.round(jb / (1 + rateJobs(year)));
    backJobs.set(year - 1, jb);
  }
  let jf = c.formais;
  for (let year = 2015; year <= 2035; year++) {
    if (year <= lastHistJobs) {
      jf = backJobs.get(year)!;
    } else {
      // Sem estoque oficial de vagas, a projeção parte da âncora sem dobra.
      jf = Math.round(jf * (1 + c.empregoTaxa));
    }
    empregoSeries.push({ year, formais: Math.round(jf), kind: year <= lastHistJobs ? "hist" : "forecast" });
  }
  const horizonte2035 = series[series.length - 1]?.pop ?? Math.round(pop * Math.pow(1 + c.taxaAnual, 11));
  const empregos2035 = empregoSeries[empregoSeries.length - 1]?.formais ?? Math.round(c.formais * Math.pow(1 + c.empregoTaxa, 11));
  const delta = horizonte2035 - pop;

  const transferenciaPct = c.unionShare + c.stateShare;
  const classificacao: DependenciaClasse =
    c.ownShare >= 0.4 ? "autonoma" : c.ownShare >= 0.22 ? "mista" : "dependente";

  const saude = buildHealth(c, { uf: 0, ufTotal: 0, br: 0, brTotal: 0 }, extras);
  const relato = saude.resumo;

  return {
    id: c.mun.i,
    name: c.mun.n,
    uf: c.mun.u,
    ufName: UF_BY_SIGLA[c.mun.u]?.nome ?? c.mun.u,
    region: c.mun.r,
    regionName: REGION_NAMES[c.mun.r],
    isCapital: c.isCapital,
    population: pop,
    porte: c.porte,
    receitaSeries,
    despesaSeries,
    receitaOrigem,
    despesaFuncoes,
    empresas,
    faixaEtaria,
    residencias: c.residencias,
    ocupantesPorDomicilio: Math.round(c.hhSize * 10) / 10,
    veiculos: {
      total: c.veiculosTotal,
      porMilHab: Math.round((c.veiculosTotal / pop) * 1000),
      leves: c.leves,
      motos: c.motos,
      outros: c.outrosVeiculos,
    },
    empregos: {
      formais: c.formais,
      informais: c.informais,
      ocupados: c.ocupados,
      taxaFormal: c.formalRate,
      taxaOcupacao: c.taxaOcupacao,
      desemprego: c.desemprego,
      rendaMedia: c.rendaMedia,
    },
    setores,
    baseEconomica: c.baseEconomica,
    pibPerCapita: c.pibPerCapita,
    idhm: c.idhm,
    custo: { indice: Math.round(c.custoIndice), aluguel: c.aluguel, cesta: c.cesta },
    educacao: { ideb: Math.round(c.ideb * 10) / 10, escolas: c.escolas },
    saudeServicos: { leitosPorMil: Math.round(c.leitosPorMil * 10) / 10, unidades: c.unidades },
    dependencia: {
      transferenciaPct,
      propriaPct: c.ownShare,
      folhaPct: c.folhaPct,
      classificacao,
      cargaMoradorPct: c.cargaMorador,
      cargaEmpresaPct: c.cargaEmpresa,
      familiaShare: c.familiaShare,
      empresaShare: c.empresaShare,
      pressaoMorador: c.pressaoMorador,
      poderCompra: c.poderCompra,
      riscoEmpresa: c.riscoEmpresa,
      armadilhaConsumo: c.armadilhaConsumo,
    },
    migracao: { saldo: Math.round(pop * c.migracaoTaxa), taxa: c.migracaoTaxa },
    saude,
    projecao: {
      series,
      empregoSeries,
      taxaAnual: c.taxaAnual,
      empregoTaxa: c.empregoTaxa,
      cenario: c.cenario,
      horizonte2035,
      empregos2035,
      delta,
      relato,
    },
    kpis: {
      receita: receitaNow,
      despesa: despesaNow,
      resultado: receitaNow - despesaNow,
      resultadoPct: c.resultadoPct,
      receitaPerCapita: c.rpc,
    },
  };
}

function rotuloTrajetoria(score: number): string {
  if (score >= 30) return "melhorando rapidamente";
  if (score >= 10) return "melhorando";
  if (score > -10) return "estável";
  if (score > -30) return "deteriorando";
  return "deteriorando rapidamente";
}

function fmtTx(v: number): string {
  return `${(v * 100).toFixed(1).replace(".", ",")} % a.a.`;
}

function computeTrajetoria(c: Core, serie: RealExtras["serie"]): CityHealth["trajetoria"] {
  if (serie && serie.cagrPropria != null) {
    const cp = serie.cagrPropria;
    const ct = serie.cagrTransf ?? 0;
    const autonomia = (cp - ct) * 500;
    const propria = cp * 250;
    const score = Math.max(-100, Math.min(100, Math.round(autonomia + propria)));
    const detalhes = [
      `Receita própria: ${fmtTx(cp)} no período oficial (${serie.anos} anos).`,
      `Transferências: ${fmtTx(ct)} no mesmo período.`,
      cp >= ct
        ? "A autonomia fiscal aumenta: o próprio caixa cresce mais que os repasses."
        : "A dependência de repasses cresce: transferências avançam mais que o caixa próprio.",
    ];
    return { score, rotulo: rotuloTrajetoria(score), fonte: "oficial", detalhes };
  }
  const folhaPeso = c.folhaPct > 0.54 ? (c.folhaPct - 0.54) * 400 : 0;
  const score = Math.max(
    -100,
    Math.min(100, Math.round(c.taxaAnual * 2200 + c.empregoTaxa * 1200 + c.resultadoPct * 300 - folhaPeso)),
  );
  return {
    score,
    rotulo: rotuloTrajetoria(score),
    fonte: "estimada",
    detalhes: [
      `Crescimento populacional estimado: ${fmtTx(c.taxaAnual)}.`,
      `Emprego formal estimado: ${fmtTx(c.empregoTaxa)}.`,
      "Sem série fiscal oficial publicada: trajetória projetada pelo modelo, não medida.",
    ],
  };
}

function computeResiliencia(c: Core): CityHealth["resiliencia"] {
  const transferenciaPct = c.unionShare + c.stateShare;
  const maxSetor = Math.max(c.adminPub, c.agro, c.industria, c.servicos);
  const densidadeFirmas = ((c.grandes + c.medias) / Math.max(c.pop, 1)) * 10000;
  const partes: { label: string; pts: number }[] = [
    { label: `Autonomia fiscal (${Math.round(c.ownShare * 100)}% própria)`, pts: c.ownShare * 40 },
    { label: `Concentração setorial (maior setor ${Math.round(maxSetor * 100)}%)`, pts: -(Math.max(0, maxSetor - 0.35) * 80) },
    { label: `Dependência de repasses (${Math.round(transferenciaPct * 100)}%)`, pts: -transferenciaPct * 25 },
    {
      label: `Folha (${Math.round(c.folhaPct * 100)}% da receita)`,
      pts: c.folhaPct > 0.5 ? -(c.folhaPct - 0.5) * 60 : 2,
    },
    { label: `Base de médias/grandes empresas (${c.grandes + c.medias})`, pts: Math.min(10, densidadeFirmas * 3) },
    { label: `Peso da administração pública (${Math.round(c.adminPub * 100)}%)`, pts: -c.adminPub * 30 },
  ];
  const score = Math.max(0, Math.min(100, Math.round(45 + partes.reduce((s, p) => s + p.pts, 0))));
  const top = [...partes].sort((a, b) => Math.abs(b.pts) - Math.abs(a.pts)).slice(0, 3);
  return {
    score,
    detalhes: top.map((p) => `${p.pts >= 0 ? "+" : "−"}${Math.abs(Math.round(p.pts))} pts — ${p.label}.`),
  };
}

function computePotencial(c: Core, souPolo: boolean | undefined): CityHealth["potencial"] {
  const partes: { label: string; pts: number }[] = [
    { label: `Crescimento populacional (${fmtTx(c.taxaAnual)})`, pts: c.taxaAnual * 1800 },
    { label: `Expansão do emprego formal (${fmtTx(c.empregoTaxa)})`, pts: c.empregoTaxa * 900 },
    { label: `Formalização (${Math.round(c.formalRate * 100)}%)`, pts: (c.formalRate - 0.5) * 30 },
    { label: `Custo de vida (índice ${Math.round(c.custoIndice)})`, pts: (55 - c.custoIndice) * 0.3 },
    { label: `Autonomia fiscal (${Math.round(c.ownShare * 100)}% própria)`, pts: c.ownShare * 25 },
    { label: `População jovem (${Math.round(c.young * 100)}% 0–14)`, pts: (c.young - 0.2) * 150 },
  ];
  if (souPolo === true) partes.push({ label: "Cidade-polo regional (IBGE)", pts: 6 });
  else if (souPolo === false)
    partes.push({ label: "Cidade satélite: mercado da cidade-polo ao alcance", pts: 2 });
  const score = Math.max(0, Math.min(100, Math.round(45 + partes.reduce((s, p) => s + p.pts, 0))));
  const top = [...partes].sort((a, b) => Math.abs(b.pts) - Math.abs(a.pts)).slice(0, 3);
  return {
    score,
    detalhes: top.map((p) => `${p.pts >= 0 ? "+" : "−"}${Math.abs(Math.round(p.pts))} pts — ${p.label}.`),
  };
}

function computeMotores(c: Core, serie: RealExtras["serie"]): string[] {
  const out: string[] = [];
  if (c.empregoTaxa > 0.008) out.push(`Emprego formal em expansão (${fmtTx(c.empregoTaxa)}).`);
  if (serie?.cagrPropria != null && serie.cagrPropria > 0.03)
    out.push(`Receita própria cresce ${fmtTx(serie.cagrPropria)} — autonomia aumentando.`);
  if (c.formalRate >= 0.6) out.push(`Alta formalização: ${Math.round(c.formalRate * 100)}% dos ocupados.`);
  if (c.empresaShare >= 0.38 && c.empresaShare <= 0.65 && !c.riscoEmpresa)
    out.push(`Empresas sustentam ${Math.round(c.empresaShare * 100)}% da receita própria em dose moderada.`);
  if (c.resultadoPct > 0.015) out.push("Resultado fiscal positivo no cenário central.");
  if (c.grandes + c.medias > 20) out.push(`${c.grandes + c.medias} médias e grandes empresas na base.`);
  if (c.custoIndice < 95) out.push(`Custo de vida abaixo da média (índice ${Math.round(c.custoIndice)}).`);
  if (c.young > 0.25) out.push(`População jovem: ${Math.round(c.young * 100)}% têm 0–14 anos.`);
  if (c.taxaAnual > 0.008) out.push(`Atrai moradores: ${fmtTx(c.taxaAnual)} de crescimento.`);
  return out.slice(0, 3);
}

function buildHealth(c: Core, rank: CityHealth["rank"], extras?: RealExtras): CityHealth {
  const score = Math.round(c.score);
  const morarScore = Math.round(c.morarScore);
  const depPct = Math.round((c.unionShare + c.stateShare) * 100);
  const ownPct = Math.round(c.ownShare * 100);
  const folha = Math.round(c.folhaPct * 100);
  const formal = Math.round(c.formalRate * 100);
  const unemp = (c.desemprego * 100).toFixed(1).replace(".", ",");

  const dimensions: HealthDimension[] = [
    {
      key: "emprego",
      label: "Emprego",
      score: Math.round(c.dimEmprego),
      hint: `${formal}% formal · ${unemp}% desemprego`,
    },
    {
      key: "indep",
      label: "Independência fiscal",
      score: Math.round(c.dimIndep),
      hint: `${ownPct}% própria · ${Math.round(c.empresaShare * 100)}% via empresas`,
    },
    {
      key: "fiscal",
      label: "Finanças",
      score: Math.round(c.dimFiscal),
      hint: `Folha consome ${folha}% da receita`,
    },
    {
      key: "demo",
      label: "Demografia",
      score: Math.round(c.dimDemo),
      hint: c.taxaAnual >= 0 ? "População em trajetória positiva" : "Perda populacional projetada",
    },
    {
      key: "econ",
      label: "Base econômica",
      score: Math.round(c.dimEcon),
      hint: `Gira em torno de ${c.baseEconomica}`,
    },
    {
      key: "serv",
      label: "Serviços",
      score: Math.round(c.dimServicos),
      hint: `IDHM ${c.idhm.toFixed(3).replace(".", ",")}`,
    },
    {
      key: "custo",
      label: "Custo de vida",
      score: Math.round(c.dimCusto),
      hint: `Índice ${Math.round(c.custoIndice)} (100 = média)`,
    },
  ];

  // Leitura imparcial: descreve o indicador observado, a implicação em cada
  // direção e o limite da estimativa. Evita prescrever mudança ou julgar mérito.
  const flags: HealthFlag[] = [];
  const moradorPct = Math.round(c.familiaShare * 100);
  const empresaPct = Math.round(c.empresaShare * 100);
  if (c.ownShare >= 0.38 && !c.armadilhaConsumo && !c.riscoEmpresa) {
    flags.push({ tone: "good", text: `Receita própria estimada em ${ownPct}% (${empresaPct}% via ISS, ${moradorPct}% via IPTU/taxas). Composição com maior participação de empresas em nível moderado.` });
  } else if (c.ownShare >= 0.3 && c.armadilhaConsumo) {
    flags.push({ tone: "warn", text: `Receita própria estimada em ${ownPct}%, com ${moradorPct}% originada de IPTU/taxas sobre moradores. Hipótese do modelo: tributação direta elevada reduz renda disponível e consumo local ao longo do tempo.` });
  } else if (c.ownShare < 0.2) {
    flags.push({ tone: "bad", text: `Receita própria estimada em ${ownPct}%. ${depPct}% viriam de transferências — o orçamento fica mais sensível a mudanças no FPM/ICMS.` });
  } else {
    flags.push({ tone: "warn", text: `${depPct}% da receita estimado de União e Estado. Transferências estabilizam o caixa, mas reduzem controle local sobre a receita.` });
  }
  if (c.riscoEmpresa) {
    flags.push({ tone: "bad", text: "Participação do ISS em nível elevado na estimativa. Hipótese do modelo: elevações adicionais de carga tendem a reduzir base (fechamento/migração de firmas)." });
  } else if (c.empresaShare >= 0.38 && c.empresaShare <= 0.65) {
    flags.push({ tone: "good", text: `Empresas responderiam por ${empresaPct}% da receita própria — faixa intermediária na calibragem do modelo.` });
  }
  if (c.armadilhaConsumo) {
    flags.push({ tone: "warn", text: "Combinação observada: alta participação de tributos sobre moradores + custo de cesta elevado em relação à renda. Hipótese: pressão sobre o consumo local." });
  }

  if (c.formalRate >= 0.6) {
    flags.push({ tone: "good", text: `Formalização estimada em ${formal}% dos ocupados — acima da mediana da calibragem.` });
  } else if (c.formalRate < 0.38) {
    flags.push({ tone: "bad", text: `Formalização estimada em ${formal}% — abaixo da mediana. Uma parte maior da ocupação estaria fora da RAIS.` });
  }

  if (c.folhaPct >= 0.58) {
    flags.push({ tone: "bad", text: `Folha estimada em ${folha}% da receita — acima do teto prudencial de 54% da LRF. Reduz margem para investimento.` });
  } else if (c.resultadoPct < -0.02) {
    flags.push({ tone: "warn", text: "Resultado primário estimado negativo: despesa projetada acima da receita no cenário central." });
  } else if (c.resultadoPct > 0.015) {
    flags.push({ tone: "good", text: "Resultado primário estimado positivo no cenário central." });
  }

  if (c.adminPub >= 0.34) {
    flags.push({ tone: "bad", text: "Administração pública com participação elevada na ocupação estimada — menor peso relativo da iniciativa privada." });
  } else if (c.baseEconomica === "agronegócio") {
    flags.push({ tone: "warn", text: "Base com peso do agronegócio: gera renda, com menor densidade típica de vagas urbanas e ISS." });
  } else if (c.grandes + c.medias > 20) {
    flags.push({ tone: "good", text: `${c.grandes + c.medias} empresas médias e grandes estimadas — ampliam a base de emprego formal.` });
  }

  if (c.taxaAnual < -0.004) {
    flags.push({ tone: "bad", text: "Cenário central indica retração populacional. Se confirmado, base de IPTU e demanda local se reduzem." });
  } else if (c.taxaAnual > 0.008) {
    flags.push({ tone: "good", text: "Cenário central indica crescimento populacional acima da média nacional, com saldo migratório positivo." });
  }

  if (c.desemprego > 0.13) {
    flags.push({ tone: "warn", text: `Desemprego estimado em ${unemp}% — acima do patamar intermediário da calibragem.` });
  }
  if (c.custoIndice > 125) {
    flags.push({ tone: "warn", text: "Índice de custo acima de 125 (100 = média). Pesa mais para faixas de renda menor." });
  }

  const titulo = healthTitle(c);
  const resumo = healthResumo(c, ownPct, depPct, formal);
  const morarTexto = morarTextoOf(c, formal, unemp);
  const veredito =
    c.morarNivel === "boa"
      ? "Condições favoráveis para morar e trabalhar"
      : c.morarNivel === "ressalvas"
        ? "Condições intermediárias"
        : c.morarNivel === "limitada"
          ? "Condições restritas"
          : "Condições muito restritas";

  // Futuro como cenário central com incerteza explícita — não como previsão.
  const taxaFmt = `${(c.taxaAnual * 100).toFixed(1).replace(".", ",")} % a.a.`;
  const popTxt =
    c.cenario === "expansao"
      ? `Cenário central: ganho de população até 2035 (~${taxaFmt}). Intervalo incerto — depende de migração, emprego e fecundidade.`
      : c.cenario === "retracao"
        ? `Cenário central: perda de população (~${Math.abs(c.taxaAnual * 100).toFixed(1).replace(".", ",")} % a.a.). Intervalo incerto — pequenas mudanças na migração alteram o sinal.`
        : "Cenário central: estabilidade populacional. Variações de ±0,3 p.p. ao ano mudariam o quadro.";
  const empTxt =
    c.empregoTaxa > 0.008
      ? "Cenário central: emprego formal cresce acima da população, se mantidas formalização e base de firmas."
      : c.empregoTaxa < -0.004
        ? "Cenário central: redução do estoque formal. Sensível a abertura/fechamento de poucas firmas médias."
        : "Cenário central: estabilidade do estoque formal, sem tendência forte. Margem de erro alta.";
  const fiscalTxt =
    c.armadilhaConsumo
      ? "Hipótese do modelo: maior carga direta sobre moradores reduz renda disponível e consumo; o efeito líquido sobre a receita total pode ser neutro ou negativo."
      : c.riscoEmpresa
        ? "ISS em patamar elevado na estimativa: o modelo assume que novas altas tendem a reduzir a base, não a ampliar a receita."
        : c.ownShare < 0.2 && c.folhaPct > 0.52
          ? "Combinação observada: folha elevada + baixa receita própria = menor margem a cortes de transferências."
          : c.ownShare > 0.38 && c.resultadoPct > 0
            ? "Combinação observada: receita própria relevante + resultado positivo = maior margem para investimento, mantidas as condições."
            : "Orçamento próximo do equilíbrio no cenário central, com sensibilidade a transferências e folha.";
  const custoTxt =
    c.armadilhaConsumo
      ? "Cesta elevada em relação à renda + tributos diretos: pressão sobre o poder de compra no cenário central."
      : c.taxaAnual > 0.008 && c.custoIndice > 100
        ? "Com crescimento populacional, o modelo projeta pressão sobre aluguéis — intensidade incerta."
        : c.taxaAnual < 0
          ? "Custo tende a ficar contido, mas o fator limitante no cenário é a disponibilidade de vagas, não o preço."
          : "Custo deve acompanhar a inflação no cenário central, sem choque projetado.";

  const porteBase = c.pop < 20000 ? "baixa" : c.pop < 100000 ? "moderada" : "moderada";
  const trajetoria = computeTrajetoria(c, extras?.serie);
  const resiliencia = computeResiliencia(c);
  const potencial = computePotencial(c, extras?.souPolo);
  const motores = computeMotores(c, extras?.serie);
  return {
    score,
    status: c.status,
    titulo,
    resumo,
    dimensions,
    flags: flags.slice(0, 7),
    morar: { score: morarScore, nivel: c.morarNivel, veredito, texto: morarTexto },
    rank,
    outlook: { pop: popTxt, emprego: empTxt, fiscal: fiscalTxt, custo: custoTxt },
    trajetoria,
    resiliencia,
    potencial,
    motores,
    confianca: {
      nivel: porteBase,
      texto:
        porteBase === "baixa"
          ? "Confiança baixa: município pequeno, alta variância. Use para comparação geral, não para decisão."
          : "Confiança moderada: estimativa calibrada por porte/região. Útil para comparar, insuficiente como diagnóstico oficial.",
    },
    metodo: [
      "População e malha: IBGE (fato). Finanças, emprego, empresas, frota, IDHM e projeções: estimativas sintéticas calibradas por porte, região e padrões de SICONFI, RAIS, DENATRAN e PNUD.",
      "Pesos do índice: emprego 22%, finanças 18%, independência 18%, demografia 14%, base econômica 12%, serviços 10%, custo 6%.",
      "Futuro = cenário central até 2035 com taxa anual constante + ruído. Não incorpora choques (fábrica abrindo/fechando, seca, mudança de FPM).",
    ],
    limites: [
      "Não substitui boletins oficiais (RREO, RAIS/eSocial, Censo). Valores em R$ são ordens de grandeza.",
      "Municípios pequenos têm erro maior: poucos eventos mudam a taxa.",
      "Correlação não é causalidade: associação entre tributo e consumo é hipótese do modelo, não medição local.",
    ],
  };
}

function healthTitle(c: Core): string {
  if (c.status === "prosperando") {
    return c.empresaShare >= 0.38 && !c.armadilhaConsumo ? "Quadro favorável, com base em empresas" : "Quadro favorável, composição mista";
  }
  if (c.status === "estavel") {
    return c.ownShare < 0.25 ? "Quadro intermediário, com dependência de transferências" : "Quadro intermediário, sem tendência forte";
  }
  if (c.status === "estagnada") {
    if (c.armadilhaConsumo) return "Estagnação com pressão sobre o consumo local";
    return c.adminPub > 0.3 ? "Estagnação com peso da administração pública" : "Estagnação com baixa tração de vagas";
  }
  if (c.status === "risco") {
    return c.folhaPct > 0.55 ? "Atenção: margem fiscal estreita" : "Atenção: emprego e receita abaixo da média";
  }
  return c.taxaAnual < 0 ? "Quadro crítico: retração populacional no cenário central" : "Quadro crítico na atividade econômica";
}

function healthResumo(c: Core, ownPct: number, depPct: number, formal: number): string {
  const role = c.isCapital ? "capital estadual" : `município de ${c.porte.toLowerCase()}`;
  const name = `${c.mun.n} (${c.mun.u})`;
  const base = `Estimativa para comparação entre cidades, não diagnóstico oficial. ${name}, ${role}: receita própria estimada em ${ownPct}%, transferências em ${depPct}%, formalização em ${formal}%.`;
  if (c.status === "prosperando") {
    return `${base} No cenário central, combinação acima da média em emprego e autonomia relativa, com participação de empresas em nível intermediário. Pontos a monitorar: folha, custo e concentração setorial.`;
  }
  if (c.status === "estavel") {
    return `${base} No cenário central, indicadores próximos da média, sem tendência forte de expansão ou retração. Leitura depende do objetivo: estabilidade de serviços de um lado, baixo dinamismo de vagas de outro.`;
  }
  if (c.status === "estagnada") {
    return `${base} No cenário central, baixa tração de vagas e população. Fatores associados variam: informalidade, dependência de transferências (${depPct}%) e/ou peso da administração pública. O intervalo de incerteza inclui estabilidade e retração leve.`;
  }
  if (c.status === "risco") {
    return `${base} Sinais conjuntos de atenção: folha elevada e/ou baixa receita própria e formalização abaixo da mediana. O orçamento fica mais exposto a variações de FPM/ICMS e a choques locais. Requer checagem em fontes oficiais antes de qualquer decisão.`;
  }
  return `${base} No cenário central, trajetória de esgotamento: população ${c.taxaAnual < 0 ? "em retração" : "sem geração suficiente de emprego"}, folha elevada e ${depPct}% do caixa estimado de fora. A incerteza é alta — confirme com RREO, RAIS e Censo.`;
}

function morarTextoOf(c: Core, formal: number, unemp: string): string {
  if (c.morarNivel === "boa") {
    return `Formalização estimada em ${formal}%, custo no índice ${Math.round(c.custoIndice)} (100 = média). Leitura: combinação relativamente favorável entre vagas e serviços — ponderar renda, aluguel e distância de rede de apoio.`;
  }
  if (c.morarNivel === "ressalvas") {
    return `Desemprego estimado em ${unemp}%, receita própria ${c.ownShare < 0.28 ? "abaixo da mediana" : "intermediária"}. Leitura: condições intermediárias — o resultado varia muito por setor, bairro e situação contratual.`;
  }
  if (c.morarNivel === "limitada") {
    return `Setor privado com menor densidade estimada; economia com peso de ${c.baseEconomica}. Leitura: oportunidades mais concentradas em nichos, setor público ou negócio próprio.`;
  }
  return `Formalização baixa e alta dependência de transferências na estimativa. Leitura: mercado privado restrito no cenário central — avaliar com dados oficiais recentes antes de decidir mudança.`;
}

export type UfOverview = {
  sigla: string;
  nome: string;
  region: RegionCode;
  municipios: number;
  population: number;
  capitalId: number;
  capitalName: string;
};

export type BrazilOverview = {
  municipios: number;
  population: number;
  ufs: UfOverview[];
  byRegion: { region: RegionCode; name: string; municipios: number; population: number }[];
  topCities: MunRecord[];
};

let brazilCache: BrazilOverview | undefined;

export function getBrazilOverview(): BrazilOverview {
  if (brazilCache) return brazilCache;
  const ufs: UfOverview[] = [];
  for (const uf of Object.values(UF_BY_SIGLA)) {
    const list = municipiosByUf(uf.sigla);
    const capital = getMunicipio(uf.capitalId);
    ufs.push({
      sigla: uf.sigla,
      nome: uf.nome,
      region: uf.region,
      municipios: list.length,
      population: list.reduce((s, m) => s + m.p, 0),
      capitalId: uf.capitalId,
      capitalName: capital?.n ?? "",
    });
  }
  ufs.sort((a, b) => b.population - a.population);

  const byRegion = (["N", "NE", "CO", "SE", "S"] as RegionCode[]).map((region) => {
    const slice = ufs.filter((u) => u.region === region);
    return {
      region,
      name: REGION_NAMES[region],
      municipios: slice.reduce((s, u) => s + u.municipios, 0),
      population: slice.reduce((s, u) => s + u.population, 0),
    };
  });

  const topCities = [...MUNICIPIOS].sort((a, b) => b.p - a.p).slice(0, 12);
  brazilCache = {
    municipios: MUNICIPIOS.length,
    population: MUNICIPIOS.reduce((s, m) => s + m.p, 0),
    ufs,
    byRegion,
    topCities,
  };
  return brazilCache;
}
