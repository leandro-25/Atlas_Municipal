/**
 * Dados fiscais oficiais (Tesouro Nacional / SICONFI) — tipos e parser puros,
 * compartilhados entre servidor e cliente. Nenhum fetch aqui.
 */

export type RealFinancas = {
  ibge: number;
  ano: number;
  exerciciosTentados: number[];
  populacao: number;
  receitaLiquida: number;
  receitaCorrenteLiquida: number;
  tributariaPropria: number;
  iptu: number;
  itbi: number;
  iss: number;
  taxas: number;
  transfUnião: number;
  transfEstado: number;
  transfTotal: number;
  despesaTotal: number;
  despesaPessoal: number;
  jurosDivida: number;
  investimentos: number;
  amortizacaoDivida: number;
  outrasCorrentes: number;
  folhaRCL: number;
  rigidezRCL: number;
  investShare: number;
  propriaPct: number;
  transferenciaPct: number;
  uniaoShare: number;
  estadoShare: number;
  fonte: string;
  urlFonte: string;
};

export type DcaItem = {
  exercicio?: number;
  cod_ibge?: number;
  anexo?: string;
  coluna?: string;
  cod_conta?: string;
  conta?: string;
  valor?: number;
  populacao?: number;
};

const COL_BRUTAS = "Receitas Brutas Realizadas";
const COL_FUNDEB = "Deduções - FUNDEB";
const COL_OUTRAS = "Outras Deduções da Receita";
const COL_EMPENHADA = "Despesas Empenhadas";

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function sumExact(items: DcaItem[], code: string, col: string): number {
  let s = 0;
  for (const it of items) {
    if (it.cod_conta === code && it.coluna === col) s += num(it.valor);
  }
  return s;
}

/** Líquido = brutas − FUNDEB − outras deduções, para um código exato. */
function net(items: DcaItem[], code: string): number {
  return sumExact(items, code, COL_BRUTAS) - sumExact(items, code, COL_FUNDEB) - sumExact(items, code, COL_OUTRAS);
}

/**
 * Soma o nível agregado do prefixo. No PCASP/DCA a conta totalizadora é a que
 * tem segmento "0" logo após o prefixo (ex.: RO1.7.1.0.00.0.0 totaliza o grupo
 * RO1.7.1.*); as irmãs (.1.00, .2.00…) são o detalhamento e não entram. Sem a
 * totalizadora, soma as irmãs de menor comprimento. Valores idênticos no mesmo
 * nível contam uma vez só (alguns entes repetem o valor em .0.0 e .1.0).
 */
function sumLevel(items: DcaItem[], prefix: string, col: string): number {
  const cands = items.filter((it) => (it.cod_conta ?? "").startsWith(prefix) && it.coluna === col);
  if (cands.length === 0) return 0;
  let minLen = Infinity;
  for (const it of cands) minLen = Math.min(minLen, (it.cod_conta ?? "").length);
  const level = cands.filter((it) => (it.cod_conta ?? "").length === minLen);
  const totals = level.filter((it) => (it.cod_conta ?? "").slice(prefix.length).startsWith("0"));
  const sumUnique = (rows: DcaItem[]) => {
    let s = 0;
    const seen = new Set<number>();
    for (const it of rows) {
      const v = num(it.valor);
      if (v !== 0 && seen.has(v)) continue;
      seen.add(v);
      s += v;
    }
    return s;
  };
  // Totalizadora zerada com filhas preenchidas = reporte parcial: usa as filhas.
  const tot = totals.length > 0 ? sumUnique(totals) : 0;
  if (totals.length > 0 && (tot !== 0 || sumUnique(level) === 0)) return tot;
  return sumUnique(level);
}

/** Líquido no nível agregado do prefixo (sem dupla contagem). */
function netLevel(items: DcaItem[], prefix: string): number {
  return sumLevel(items, prefix, COL_BRUTAS) - sumLevel(items, prefix, COL_FUNDEB) - sumLevel(items, prefix, COL_OUTRAS);
}

export function parseRealFinancas(
  ibge: number,
  ano: number,
  receitaItems: DcaItem[],
  despesaItems: DcaItem[],
  tentados: number[],
): RealFinancas | null {
  const r = receitaItems;
  const receitaBruta = sumExact(r, "TotalReceitas", COL_BRUTAS);
  if (!(receitaBruta > 0)) return null;
  const receitaLiquida =
    receitaBruta - sumExact(r, "TotalReceitas", COL_FUNDEB) - sumExact(r, "TotalReceitas", COL_OUTRAS);
  if (!(receitaLiquida > 0)) return null;

  const rcl = net(r, "RO1.0.0.0.00.0.0");
  const tributariaPropria = net(r, "RO1.1.0.0.00.0.0");
  const iptu = netLevel(r, "RO1.1.1.2.50");
  const itbi = netLevel(r, "RO1.1.1.2.53");
  const iss = netLevel(r, "RO1.1.1.4.51");
  const taxas = net(r, "RO1.1.2.0.00.0.0");

  const transfUniãoCorr = netLevel(r, "RO1.7.1.");
  const transfEstadoCorr = netLevel(r, "RO1.7.2.");
  const transfUniãoCap = sumLevel(r, "RO2.4.1.", COL_BRUTAS);
  const transfEstadoCap = sumLevel(r, "RO2.4.2.", COL_BRUTAS);
  const transfUnião = Math.max(0, transfUniãoCorr + transfUniãoCap);
  const transfEstado = Math.max(0, transfEstadoCorr + transfEstadoCap);
  const transfTotal = transfUnião + transfEstado;

  const despesaTotal = sumExact(despesaItems, "TotalDespesas", COL_EMPENHADA);
  const despesaPessoal = sumExact(despesaItems, "DO3.1.00.00.00.00", COL_EMPENHADA);
  if (!(despesaTotal > 0)) return null;
  const jurosDivida = sumExact(despesaItems, "DO3.2.00.00.00.00", COL_EMPENHADA);
  const investimentos = sumExact(despesaItems, "DO4.4.00.00.00.00", COL_EMPENHADA);
  const amortizacaoDivida = sumExact(despesaItems, "DO4.6.00.00.00.00", COL_EMPENHADA);
  const outrasCorrentes = sumExact(despesaItems, "DO3.3.00.00.00.00", COL_EMPENHADA);

  const rclBase = rcl > 0 ? rcl : receitaLiquida;
  const folhaRCL = rclBase > 0 ? despesaPessoal / rclBase : 0;
  const rigidezRCL = rclBase > 0 ? (despesaPessoal + jurosDivida) / rclBase : 0;
  const investShare = despesaTotal > 0 ? investimentos / despesaTotal : 0;
  const populacao =
    r.find((it) => num(it.populacao) > 0)?.populacao ??
    despesaItems.find((it) => num(it.populacao) > 0)?.populacao ??
    0;

  const propriaPct = Math.min(0.95, Math.max(0, tributariaPropria / receitaLiquida));
  const transferenciaPct = Math.min(0.95, Math.max(0, transfTotal / receitaLiquida));

  return {
    ibge,
    ano,
    exerciciosTentados: tentados,
    populacao: Math.round(num(populacao)),
    receitaLiquida,
    receitaCorrenteLiquida: rclBase,
    tributariaPropria: Math.max(0, tributariaPropria),
    iptu: Math.max(0, iptu),
    itbi: Math.max(0, itbi),
    iss: Math.max(0, iss),
    taxas: Math.max(0, taxas),
    transfUnião: Math.max(0, transfUnião),
    transfEstado: Math.max(0, transfEstado),
    transfTotal: Math.max(0, transfTotal),
    despesaTotal,
    despesaPessoal: Math.max(0, despesaPessoal),
    jurosDivida: Math.max(0, jurosDivida),
    investimentos: Math.max(0, investimentos),
    amortizacaoDivida: Math.max(0, amortizacaoDivida),
    outrasCorrentes: Math.max(0, outrasCorrentes),
    folhaRCL: Math.min(1.2, Math.max(0, folhaRCL)),
    rigidezRCL: Math.min(1.2, Math.max(0, rigidezRCL)),
    investShare: Math.min(1, Math.max(0, investShare)),
    propriaPct,
    transferenciaPct,
    uniaoShare: receitaLiquida > 0 ? transfUnião / receitaLiquida : 0,
    estadoShare: receitaLiquida > 0 ? transfEstado / receitaLiquida : 0,
    fonte: `SICONFI/DCA ${ano} — Tesouro Nacional`,
    urlFonte: "https://siconfi.tesouro.gov.br/",
  };
}

export type RealFuncao = {
  codigo: string;
  nome: string;
  valor: number;
};

const FUNCAO_RE = /^(\d{2}) - (.+)$/;

/**
 * Despesa por função (DCA-Anexo I-E, coluna empenhada). Linhas de função têm
 * cod_conta "TotalDespesas" e conta "TotalDespesas | NN - Nome". Subfunções
 * (NN.NNN ou FU-prefixed) são ignoradas para não duplicar.
 */
export function parseFuncoes(funcItems: DcaItem[]): RealFuncao[] {
  const out: RealFuncao[] = [];
  for (const it of funcItems) {
    if (it.coluna !== COL_EMPENHADA) continue;
    if (it.cod_conta !== "TotalDespesas") continue;
    const m = FUNCAO_RE.exec((it.conta ?? "").trim());
    if (!m) continue;
    const valor = num(it.valor);
    if (!(valor > 0)) continue;
    out.push({ codigo: m[1], nome: m[2], valor });
  }
  out.sort((a, b) => b.valor - a.valor);
  return out;
}

export type RealSerieAno = {
  ano: number;
  receita: number;
  despesa: number;
  pessoal: number;
  juros: number;
  investimentos: number;
  rcl: number;
  folhaRCL: number;
  propria: number;
  transf: number;
  populacao: number;
};

/** Um ponto anual da série a partir dos anexos I-C + I-D de um exercício. */
export function parseSerieAno(ano: number, recItems: DcaItem[], desItems: DcaItem[]): RealSerieAno | null {
  const receitaBruta = sumExact(recItems, "TotalReceitas", COL_BRUTAS);
  const despesaTotal = sumExact(desItems, "TotalDespesas", COL_EMPENHADA);
  if (!(receitaBruta > 0) || !(despesaTotal > 0)) return null;
  const receita =
    receitaBruta - sumExact(recItems, "TotalReceitas", COL_FUNDEB) - sumExact(recItems, "TotalReceitas", COL_OUTRAS);
  if (!(receita > 0)) return null;
  const rcl = net(recItems, "RO1.0.0.0.00.0.0");
  const rclBase = rcl > 0 ? rcl : receita;
  const pessoal = sumExact(desItems, "DO3.1.00.00.00.00", COL_EMPENHADA);
  const juros = sumExact(desItems, "DO3.2.00.00.00.00", COL_EMPENHADA);
  const investimentos = sumExact(desItems, "DO4.4.00.00.00.00", COL_EMPENHADA);
  const propria = net(recItems, "RO1.1.0.0.00.0.0");
  const transf =
    netLevel(recItems, "RO1.7.1.") +
    netLevel(recItems, "RO1.7.2.") +
    sumLevel(recItems, "RO2.4.1.", COL_BRUTAS) +
    sumLevel(recItems, "RO2.4.2.", COL_BRUTAS);
  const populacao =
    recItems.find((it) => num(it.populacao) > 0)?.populacao ??
    desItems.find((it) => num(it.populacao) > 0)?.populacao ??
    0;
  return {
    ano,
    receita,
    despesa: despesaTotal,
    pessoal: Math.max(0, pessoal),
    juros: Math.max(0, juros),
    investimentos: Math.max(0, investimentos),
    rcl: rclBase,
    folhaRCL: rclBase > 0 ? pessoal / rclBase : 0,
    propria: Math.max(0, propria),
    transf: Math.max(0, transf),
    populacao: Math.round(num(populacao)),
  };
}

export type RealPatrimonio = {
  ibge: number;
  ano: number;
  ativo: number;
  ativoCirculante: number;
  caixa: number;
  passivoCirculante: number;
  passivoNaoCirculante: number;
  passivoExigivel: number;
  patrimonioLiquido: number;
  /** Passivo exigível / ativo. */
  endividamento: number;
  /** Ativo circulante / passivo circulante. */
  liquidezCorrente: number;
  /** Caixa / passivo circulante. */
  caixaSobrePC: number;
};

/** Balanço patrimonial (DCA-Anexo I-AB). Coluna é a data-base (31/12/AAAA). */
export function parsePatrimonio(ibge: number, ano: number, items: DcaItem[]): RealPatrimonio | null {
  const col = items.find((it) => typeof it.coluna === "string" && it.coluna.startsWith("31/12/"))?.coluna;
  if (!col) return null;
  const get = (code: string) => {
    const it = items.find((i) => i.cod_conta === code && i.coluna === col);
    return num(it?.valor);
  };
  const ativo = get("P1.0.0.0.0.00.00");
  if (!(ativo > 0)) return null;
  const ativoCirculante = get("P1.1.0.0.0.00.00");
  const caixa = get("P1.1.1.0.0.00.00");
  const passivoCirculante = get("P2.1.0.0.0.00.00");
  const passivoNaoCirculante = get("P2.2.0.0.0.00.00");
  const patrimonioLiquido =
    items.find((i) => i.cod_conta === "P2.3.0.0.0.00.00" && i.coluna === col)?.valor ?? ativo - passivoCirculante - passivoNaoCirculante;
  const passivoExigivel = passivoCirculante + passivoNaoCirculante;
  return {
    ibge,
    ano,
    ativo,
    ativoCirculante,
    caixa: Math.max(0, caixa),
    passivoCirculante: Math.max(0, passivoCirculante),
    passivoNaoCirculante: Math.max(0, passivoNaoCirculante),
    passivoExigivel: Math.max(0, passivoExigivel),
    patrimonioLiquido: num(patrimonioLiquido),
    endividamento: ativo > 0 ? passivoExigivel / ativo : 0,
    liquidezCorrente: passivoCirculante > 0 ? ativoCirculante / passivoCirculante : 0,
    caixaSobrePC: passivoCirculante > 0 ? caixa / passivoCirculante : 0,
  };
}

export type RealRGF = {
  ibge: number;
  ano: number;
  periodo: number;
  periodicidade: "Q" | "S";
  tipo: string;
  /** Despesa total com pessoal do Executivo (R$). */
  dtp: number;
  /** RCL ajustada para limites (R$). */
  rclAjustada: number;
  /** DTP / RCL ajustada (% 0-100). */
  dtpPct: number;
  limiteMax: number;
  limitePrudencial: number;
  limiteAlerta: number;
  faixa: "dentro" | "alerta" | "prudencial" | "acima";
};

export function faixaLRF(dtpPct: number, alerta: number, prud: number, max: number): RealRGF["faixa"] {
  if (max > 0 && dtpPct >= max) return "acima";
  if (prud > 0 && dtpPct >= prud) return "prudencial";
  if (alerta > 0 && dtpPct >= alerta) return "alerta";
  return "dentro";
}

export function parseRGF(
  ibge: number,
  ano: number,
  periodo: number,
  periodicidade: "Q" | "S",
  tipo: string,
  items: DcaItem[],
): RealRGF | null {
  let dtp = 0;
  let dtpPct = 0;
  let rclAjustada = 0;
  let limiteMax = 54;
  let limitePrud = 51.3;
  let limiteAlerta = 48.6;
  for (const it of items) {
    const conta = it.conta ?? "";
    const col = it.coluna ?? "";
    if (conta.startsWith("DESPESA TOTAL COM PESSOAL")) {
      if (col === "Valor") dtp = num(it.valor);
      else if (col === "% sobre a RCL Ajustada") dtpPct = num(it.valor);
    } else if (conta.includes("RECEITA CORRENTE") && conta.includes("AJUSTADA") && col === "Valor") {
      rclAjustada = num(it.valor);
    } else if (conta.startsWith("LIMITE M") && col === "% sobre a RCL Ajustada") {
      limiteMax = num(it.valor) || limiteMax;
    } else if (conta.startsWith("LIMITE PRUDENCIAL") && col === "% sobre a RCL Ajustada") {
      limitePrud = num(it.valor) || limitePrud;
    } else if (conta.startsWith("LIMITE DE ALERTA") && col === "% sobre a RCL Ajustada") {
      limiteAlerta = num(it.valor) || limiteAlerta;
    }
  }
  if (!(dtp > 0) || !(rclAjustada > 0)) return null;
  if (!(dtpPct > 0)) dtpPct = (dtp / rclAjustada) * 100;
  return {
    ibge,
    ano,
    periodo,
    periodicidade,
    tipo,
    dtp,
    rclAjustada,
    dtpPct,
    limiteMax,
    limitePrudencial: limitePrud,
    limiteAlerta,
    faixa: faixaLRF(dtpPct, limiteAlerta, limitePrud, limiteMax),
  };
}

export type RealQualidade = {
  ibge: number;
  ano: number;
  dcaHomologado: boolean;
  rgfHomologados: number;
  rgfRetificados: number;
  rreoHomologados: number;
  rreoRetificados: number;
};

const DCA_ENT = "Balanço Anual (DCA)";
const RGF_ENT = "Relatório de Gestão Fiscal";
const RREO_ENT = "Relatório Resumido de Execução Orçamentária";

/** Selo de qualidade a partir do extrato de entregas (HO = homologado, RE = retificado). */
export function parseQualidade(ibge: number, ano: number, items: DcaItem[]): RealQualidade {
  let dcaHomologado = false;
  let rgfHomologados = 0;
  let rgfRetificados = 0;
  let rreoHomologados = 0;
  let rreoRetificados = 0;
  for (const it of items as unknown as Record<string, unknown>[]) {
    const ent = String(it["entregavel"] ?? "");
    const st = String(it["status_relatorio"] ?? "");
    const ho = st === "HO";
    const re = st === "RE";
    if (ent === DCA_ENT && ho) dcaHomologado = true;
    else if (ent.startsWith(RGF_ENT)) {
      if (ho) rgfHomologados++;
      else if (re) rgfRetificados++;
    } else if (ent.startsWith(RREO_ENT)) {
      if (ho) rreoHomologados++;
      else if (re) rreoRetificados++;
    }
  }
  return { ibge, ano, dcaHomologado, rgfHomologados, rgfRetificados, rreoHomologados, rreoRetificados };
}

export type RealRREO = {
  ibge: number;
  ano: number;
  bimestre: number;
  tipo: string;
  receitaPrevista: number;
  receitaAteBimestre: number;
  pctArrecadado: number;
  impostosAteBimestre: number;
  impostosPct: number;
  despesaDotacao: number;
  despesaEmpenhadaAte: number;
  despesaLiquidadaAte: number;
  /** Fração do ano decorrida no bimestre (bimestre*2/12). */
  fracaoAno: number;
};

export function parseRREO(
  ibge: number,
  ano: number,
  bimestre: number,
  tipo: string,
  items: DcaItem[],
): RealRREO | null {
  let receitaPrevista = 0;
  let receitaAteBimestre = 0;
  let pctArrecadado = 0;
  let impostosAteBimestre = 0;
  let impostosPct = 0;
  let despesaDotacao = 0;
  let despesaEmpenhadaAte = 0;
  let despesaLiquidadaAte = 0;
  for (const it of items) {
    const conta = it.conta ?? "";
    const col = it.coluna ?? "";
    if (conta.startsWith("RECEITAS (EXCETO")) {
      if (col.startsWith("PREVISÃO ATUALIZADA")) receitaPrevista = num(it.valor);
      else if (col.startsWith("Até o Bimestre")) receitaAteBimestre = num(it.valor);
      else if (col.startsWith("% (c/a)")) pctArrecadado = num(it.valor);
    } else if (conta === "Impostos") {
      if (col.startsWith("Até o Bimestre")) impostosAteBimestre = num(it.valor);
      else if (col.startsWith("% (c/a)")) impostosPct = num(it.valor);
    } else if (conta.startsWith("DESPESAS (EXCETO")) {
      if (col.startsWith("DOTAÇÃO ATUALIZADA")) despesaDotacao = num(it.valor);
      else if (col.startsWith("DESPESAS EMPENHADAS ATÉ")) despesaEmpenhadaAte = num(it.valor);
      else if (col.startsWith("DESPESAS LIQUIDADAS ATÉ")) despesaLiquidadaAte = num(it.valor);
    }
  }
  if (!(receitaPrevista > 0)) return null;
  if (!(pctArrecadado > 0) && receitaPrevista > 0) pctArrecadado = (receitaAteBimestre / receitaPrevista) * 100;
  return {
    ibge,
    ano,
    bimestre,
    tipo,
    receitaPrevista,
    receitaAteBimestre,
    pctArrecadado,
    impostosAteBimestre: Math.max(0, impostosAteBimestre),
    impostosPct: Math.max(0, impostosPct),
    despesaDotacao: Math.max(0, despesaDotacao),
    despesaEmpenhadaAte: Math.max(0, despesaEmpenhadaAte),
    despesaLiquidadaAte: Math.max(0, despesaLiquidadaAte),
    fracaoAno: Math.min(1, (bimestre * 2) / 12),
  };
}

export type RealPIB = {
  ibge: number;
  anoPib: number;
  /** PIB total em R$. */
  pibTotal: number;
  pibPerCapita: number;
  anoPop: number;
};

export type RealCenso = {
  pop2022: number;
  domicilios2022: number;
  /** Taxa de alfabetização 15+ (%, 0-100). */
  alfabetizacao: number;
  moradoresFavelas: number;
};

export type RealEntorno = {
  ibge: number;
  imediataId: number;
  imediataNome: string;
  intermediariaNome: string;
  mesorregiaoNome: string;
  municipiosNaImediata: number;
  poloId: number;
  poloNome: string;
  souPolo: boolean;
};

export type RealSerie = {
  ibge: number;
  anos: RealSerieAno[];
  /** CAGR da receita própria tributária no período (a.a.). */
  cagrPropria: number | null;
  /** CAGR das transferências (União+Estado) no período (a.a.). */
  cagrTransf: number | null;
  /** Volatilidade da receita líquida (desvio-padrão das variações anuais). */
  volatilidade: number | null;
};

/** CAGR entre primeiro e último ponto positivo de uma série de valores. */
export function cagr(valores: number[]): number | null {
  const pts = valores.filter((v) => v > 0);
  if (pts.length < 2) return null;
  const first = pts[0]!;
  const last = pts[pts.length - 1]!;
  const n = pts.length - 1;
  return Math.pow(last / first, 1 / n) - 1;
}

export function volatilidadeReceita(valores: number[]): number | null {
  const pts = valores.filter((v) => v > 0);
  if (pts.length < 3) return null;
  const vars: number[] = [];
  for (let i = 1; i < pts.length; i++) vars.push(pts[i]! / pts[i - 1]! - 1);
  const mean = vars.reduce((s, v) => s + v, 0) / vars.length;
  const variance = vars.reduce((s, v) => s + (v - mean) * (v - mean), 0) / vars.length;
  return Math.sqrt(variance);
}
