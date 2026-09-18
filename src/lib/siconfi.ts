import { createServerFn } from "@tanstack/react-start";
import {
  cagr,
  parseFuncoes,
  parsePatrimonio,
  parseQualidade,
  parseRealFinancas,
  parseRGF,
  parseRREO,
  parseSerieAno,
  volatilidadeReceita,
  type DcaItem,
  type RealFinancas,
  type RealFuncao,
  type RealPatrimonio,
  type RealQualidade,
  type RealRGF,
  type RealRREO,
  type RealSerie,
  type RealPIB,
  type RealCenso,
  type RealEntorno,
} from "@/data/real";

const BASE = "https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt";
const ANOS = [2025, 2024, 2023] as const;

type CacheEntry = { at: number; value: RealFinancas | null };
const cache = new Map<string, CacheEntry>();
const TTL_MS = 1000 * 60 * 60 * 24;

async function fetchAnexo(ibge: number, ano: number, anexo: string): Promise<DcaItem[]> {
  const url = `${BASE}/dca?an_exercicio=${ano}&id_ente=${ibge}&no_anexo=${encodeURIComponent(anexo)}`;
  const res = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "atlas-municipal/1.0" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`SICONFI HTTP ${res.status}`);
  const json = (await res.json()) as { items?: DcaItem[] };
  return Array.isArray(json.items) ? json.items : [];
}

async function loadReal(ibge: number): Promise<RealFinancas | null> {
  const key = `dca:${ibge}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;

  const tentados: number[] = [];
  for (const ano of ANOS) {
    tentados.push(ano);
    try {
      const [rec, des] = await Promise.all([
        fetchAnexo(ibge, ano, "DCA-Anexo I-C"),
        fetchAnexo(ibge, ano, "DCA-Anexo I-D"),
      ]);
      const parsed = parseRealFinancas(ibge, ano, rec, des, [...tentados]);
      if (parsed) {
        cache.set(key, { at: Date.now(), value: parsed });
        return parsed;
      }
    } catch {
      // tenta o exercício anterior
    }
  }
  cache.set(key, { at: Date.now(), value: null });
  return null;
}

export const getRealFinancas = createServerFn({ method: "GET" })
  .validator((data: { ibge: number }) => data)
  .handler(async ({ data }): Promise<RealFinancas | null> => {
    const ibge = Math.floor(Number(data.ibge));
    if (!Number.isFinite(ibge) || ibge < 1000000 || ibge > 9999999) return null;
    try {
      return await loadReal(ibge);
    } catch {
      return null;
    }
  });

export type RealFuncoesPayload = { ibge: number; ano: number; funcoes: RealFuncao[] } | null;

const funcoesCache = new Map<string, { at: number; value: RealFuncoesPayload }>();

/** Despesa por função (DCA-Anexo I-E) do exercício-base, com fallback ao anterior. */
export const getRealFuncoes = createServerFn({ method: "GET" })
  .validator((data: { ibge: number; ano: number }) => data)
  .handler(async ({ data }): Promise<RealFuncoesPayload> => {
    const ibge = Math.floor(Number(data.ibge));
    const anoBase = Math.floor(Number(data.ano));
    if (!Number.isFinite(ibge) || ibge < 1000000 || ibge > 9999999) return null;
    if (!Number.isFinite(anoBase)) return null;
    const key = `ie:${ibge}:${anoBase}`;
    const hit = funcoesCache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
    for (const ano of [anoBase, anoBase - 1]) {
      try {
        const items = await fetchAnexo(ibge, ano, "DCA-Anexo I-E");
        const funcoes = parseFuncoes(items);
        if (funcoes.length > 0) {
          const value: RealFuncoesPayload = { ibge, ano, funcoes };
          funcoesCache.set(key, { at: Date.now(), value });
          return value;
        }
      } catch {
        // tenta o exercício anterior
      }
    }
    funcoesCache.set(key, { at: Date.now(), value: null });
    return null;
  });

export type RealPatrimonioPayload = { ibge: number; ano: number; patrimonio: RealPatrimonio } | null;

const patrimonioCache = new Map<string, { at: number; value: RealPatrimonioPayload }>();

/** Balanço patrimonial (DCA-Anexo I-AB) do exercício-base, com fallback ao anterior. */
export const getRealPatrimonio = createServerFn({ method: "GET" })
  .validator((data: { ibge: number; ano: number }) => data)
  .handler(async ({ data }): Promise<RealPatrimonioPayload> => {
    const ibge = Math.floor(Number(data.ibge));
    const anoBase = Math.floor(Number(data.ano));
    if (!Number.isFinite(ibge) || ibge < 1000000 || ibge > 9999999) return null;
    if (!Number.isFinite(anoBase)) return null;
    const key = `iab:${ibge}:${anoBase}`;
    const hit = patrimonioCache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
    for (const ano of [anoBase, anoBase - 1]) {
      try {
        const items = await fetchAnexo(ibge, ano, "DCA-Anexo I-AB");
        const patrimonio = parsePatrimonio(ibge, ano, items);
        if (patrimonio) {
          const value: RealPatrimonioPayload = { ibge, ano, patrimonio };
          patrimonioCache.set(key, { at: Date.now(), value });
          return value;
        }
      } catch {
        // tenta o exercício anterior
      }
    }
    patrimonioCache.set(key, { at: Date.now(), value: null });
    return null;
  });

export type RealRGFPayload = RealRGF | null;

const rgfCache = new Map<string, { at: number; value: RealRGFPayload }>();

async function fetchRGF(
  ibge: number,
  ano: number,
  periodicidade: "Q" | "S",
  periodo: number,
  tipo: string,
): Promise<DcaItem[]> {
  const params = new URLSearchParams({
    an_exercicio: String(ano),
    in_periodicidade: periodicidade,
    nr_periodo: String(periodo),
    co_tipo_demonstrativo: tipo,
    co_poder: "E",
    id_ente: String(ibge),
    no_anexo: "RGF-Anexo 01",
  });
  const res = await fetch(`${BASE}/rgf?${params.toString()}`, {
    headers: { accept: "application/json", "user-agent": "atlas-municipal/1.0" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`SICONFI RGF HTTP ${res.status}`);
  const json = (await res.json()) as { items?: DcaItem[] };
  return Array.isArray(json.items) ? json.items : [];
}

/**
 * RGF Anexo 01 do Executivo mais recente: tenta quadrimestres recentes,
 * depois RGF Simplificado semestral (municípios < 50 mil hab.).
 */
export const getRealRGF = createServerFn({ method: "GET" })
  .validator((data: { ibge: number }) => data)
  .handler(async ({ data }): Promise<RealRGFPayload> => {
    const ibge = Math.floor(Number(data.ibge));
    if (!Number.isFinite(ibge) || ibge < 1000000 || ibge > 9999999) return null;
    const key = `rgf:${ibge}`;
    const hit = rgfCache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
    const tentativas: { ano: number; per: "Q" | "S"; periodo: number; tipo: string }[] = [
      { ano: 2026, per: "Q", periodo: 2, tipo: "RGF" },
      { ano: 2026, per: "Q", periodo: 1, tipo: "RGF" },
      { ano: 2025, per: "Q", periodo: 3, tipo: "RGF" },
      { ano: 2025, per: "Q", periodo: 2, tipo: "RGF" },
      { ano: 2025, per: "S", periodo: 2, tipo: "RGF Simplificado" },
      { ano: 2025, per: "S", periodo: 1, tipo: "RGF Simplificado" },
      { ano: 2024, per: "Q", periodo: 3, tipo: "RGF" },
    ];
    for (const t of tentativas) {
      try {
        const items = await fetchRGF(ibge, t.ano, t.per, t.periodo, t.tipo);
        const parsed = parseRGF(ibge, t.ano, t.periodo, t.per, t.tipo, items);
        if (parsed) {
          rgfCache.set(key, { at: Date.now(), value: parsed });
          return parsed;
        }
      } catch {
        // tenta a próxima combinação
      }
    }
    rgfCache.set(key, { at: Date.now(), value: null });
    return null;
  });

export type RealQualidadePayload = { ibge: number; ano: number; qualidade: RealQualidade } | null;

const qualidadeCache = new Map<string, { at: number; value: RealQualidadePayload }>();

/** Selo de qualidade: extrato de entregas (homologações e retificações). */
export const getRealQualidade = createServerFn({ method: "GET" })
  .validator((data: { ibge: number; ano: number }) => data)
  .handler(async ({ data }): Promise<RealQualidadePayload> => {
    const ibge = Math.floor(Number(data.ibge));
    const ano = Math.floor(Number(data.ano));
    if (!Number.isFinite(ibge) || ibge < 1000000 || ibge > 9999999) return null;
    if (!Number.isFinite(ano)) return null;
    const key = `ext:${ibge}:${ano}`;
    const hit = qualidadeCache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
    try {
      const res = await fetch(
        `${BASE}/extrato_entregas?id_ente=${ibge}&an_referencia=${ano}`,
        {
          headers: { accept: "application/json", "user-agent": "atlas-municipal/1.0" },
          signal: AbortSignal.timeout(20000),
        },
      );
      if (!res.ok) throw new Error(`SICONFI extrato HTTP ${res.status}`);
      const json = (await res.json()) as { items?: DcaItem[] };
      const items = Array.isArray(json.items) ? json.items : [];
      if (items.length === 0) {
        qualidadeCache.set(key, { at: Date.now(), value: null });
        return null;
      }
      const value: RealQualidadePayload = { ibge, ano, qualidade: parseQualidade(ibge, ano, items) };
      qualidadeCache.set(key, { at: Date.now(), value });
      return value;
    } catch {
      qualidadeCache.set(key, { at: Date.now(), value: null });
      return null;
    }
  });

export type RealRREOPayload = RealRREO | null;

const rreoCache = new Map<string, { at: number; value: RealRREOPayload }>();

/** RREO Anexo 01 parcial mais recente (receita até o bimestre vs. previsão). */
export const getRealRREO = createServerFn({ method: "GET" })
  .validator((data: { ibge: number }) => data)
  .handler(async ({ data }): Promise<RealRREOPayload> => {
    const ibge = Math.floor(Number(data.ibge));
    if (!Number.isFinite(ibge) || ibge < 1000000 || ibge > 9999999) return null;
    const key = `rreo:${ibge}`;
    const hit = rreoCache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
    const tentativas: { ano: number; bim: number; tipo: string }[] = [
      { ano: 2026, bim: 4, tipo: "RREO" },
      { ano: 2026, bim: 3, tipo: "RREO" },
      { ano: 2026, bim: 2, tipo: "RREO" },
      { ano: 2026, bim: 1, tipo: "RREO" },
      { ano: 2026, bim: 2, tipo: "RREO Simplificado" },
      { ano: 2026, bim: 1, tipo: "RREO Simplificado" },
      { ano: 2025, bim: 6, tipo: "RREO" },
    ];
    for (const t of tentativas) {
      try {
        const params = new URLSearchParams({
          an_exercicio: String(t.ano),
          nr_periodo: String(t.bim),
          co_tipo_demonstrativo: t.tipo,
          id_ente: String(ibge),
          no_anexo: "RREO-Anexo 01",
        });
        const res = await fetch(`${BASE}/rreo?${params.toString()}`, {
          headers: { accept: "application/json", "user-agent": "atlas-municipal/1.0" },
          signal: AbortSignal.timeout(20000),
        });
        if (!res.ok) continue;
        const json = (await res.json()) as { items?: DcaItem[] };
        const items = Array.isArray(json.items) ? json.items : [];
        const parsed = parseRREO(ibge, t.ano, t.bim, t.tipo, items);
        if (parsed) {
          rreoCache.set(key, { at: Date.now(), value: parsed });
          return parsed;
        }
      } catch {
        // tenta a próxima combinação
      }
    }
    rreoCache.set(key, { at: Date.now(), value: null });
    return null;
  });

export type RealPIBEntornoPayload =
  | { ibge: number; pib: RealPIB | null; entorno: RealEntorno | null; censo: RealCenso | null }
  | null;

const ibgeCache = new Map<string, { at: number; value: RealPIBEntornoPayload }>();

async function sidraValor(tabela: string, cod: number, ano: number, variavel: string): Promise<number | null> {
  try {
    const url = `https://apisidra.ibge.gov.br/values/t/${tabela}/n6/${cod}/p/${ano}/v/${variavel}`;
    const res = await fetch(url, {
      headers: { accept: "application/json", "user-agent": "atlas-municipal/1.0" },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.trimStart().startsWith("[")) return null;
    const json = JSON.parse(text) as Record<string, string>[];
    const row = json[1];
    const v = Number(row?.["V"]);
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

/**
 * Fase 4 (IBGE oficial): PIB municipal (SIDRA 5938) + região imediata
 * (localidades). PIB em mil reais; per capita com população do mesmo ano.
 */
export const getRealIbge = createServerFn({ method: "GET" })
  .validator((data: { ibge: number }) => data)
  .handler(async ({ data }): Promise<RealPIBEntornoPayload> => {
    const ibge = Math.floor(Number(data.ibge));
    if (!Number.isFinite(ibge) || ibge < 1000000 || ibge > 9999999) return null;
    const key = `ibge:${ibge}`;
    const hit = ibgeCache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.value;

    let pib: RealPIB | null = null;
    for (const anoPib of [2022, 2021]) {
      try {
        const totalMil = await sidraValor("5938", ibge, anoPib, "37");
        if (totalMil == null) continue;
        let pop: number | null = null;
        let anoPop = anoPib;
        for (const a of [anoPib, 2021]) {
          pop = await sidraValor("6579", ibge, a, "9324");
          if (pop != null) {
            anoPop = a;
            break;
          }
        }
        if (pop == null) continue;
        pib = {
          ibge,
          anoPib,
          pibTotal: totalMil * 1000,
          pibPerCapita: (totalMil * 1000) / pop,
          anoPop,
        };
        break;
      } catch {
        // tenta o ano anterior
      }
    }

    let censo: RealCenso | null = null;
    try {
      const [pop, dom, alf, fav] = await Promise.all([
        sidraValor("9923", ibge, 2022, "93"),
        sidraValor("9928", ibge, 2022, "381"),
        sidraValor("9543", ibge, 2022, "2513"),
        sidraValor("9897", ibge, 2022, "9914"),
      ]);
      if (pop != null) {
        censo = {
          pop2022: Math.round(pop),
          domicilios2022: dom != null ? Math.round(dom) : 0,
          alfabetizacao: alf ?? 0,
          moradoresFavelas: fav != null ? Math.round(fav) : 0,
        };
      }
    } catch {
      // censo indisponível: mantém nulo
    }

    let entorno: RealEntorno | null = null;
    try {
      const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${ibge}`, {
        headers: { accept: "application/json", "user-agent": "atlas-municipal/1.0" },
        signal: AbortSignal.timeout(20000),
      });
      if (res.ok) {
        const mun = (await res.json()) as {
          nome?: string;
          microrregiao?: { mesorregiao?: { nome?: string } };
          "regiao-imediata"?: {
            id?: number;
            nome?: string;
            "regiao-intermediaria"?: { nome?: string };
          };
        };
        const imediata = mun["regiao-imediata"];
        if (imediata?.id) {
          const list = (await (
            await fetch(
              `https://servicodados.ibge.gov.br/api/v1/localidades/regioes-imediatas/${imediata.id}/municipios`,
              {
                headers: { accept: "application/json", "user-agent": "atlas-municipal/1.0" },
                signal: AbortSignal.timeout(20000),
              },
            )
          ).json()) as { id?: number; nome?: string }[];
          // Polo = maior população na estimativa local do app.
          const { getMunicipio } = await import("@/data/cities");
          let polo = { id: ibge, nome: mun.nome ?? "" };
          for (const m of list) {
            const rec = typeof m.id === "number" ? getMunicipio(m.id) : undefined;
            const cur = polo.id === ibge ? getMunicipio(ibge)?.p ?? 0 : (getMunicipio(polo.id)?.p ?? 0);
            if (rec && rec.p > cur) polo = { id: rec.i, nome: rec.n };
          }
          entorno = {
            ibge,
            imediataId: imediata.id,
            imediataNome: imediata.nome ?? "",
            intermediariaNome: imediata["regiao-intermediaria"]?.nome ?? "",
            mesorregiaoNome: mun.microrregiao?.mesorregiao?.nome ?? "",
            municipiosNaImediata: list.length,
            poloId: polo.id,
            poloNome: polo.nome,
            souPolo: polo.id === ibge,
          };
        }
      }
    } catch {
      // entorno indisponível: mantém nulo
    }

    const value: RealPIBEntornoPayload =
      ibge && (pib || entorno || censo) ? { ibge, pib, entorno, censo } : null;
    ibgeCache.set(key, { at: Date.now(), value });
    return value;
  });

const serieCache = new Map<string, { at: number; value: RealSerie | null }>();

/** Série anual 5 anos (I-C + I-D por exercício), sequencial para respeitar 1 req/s. */
export const getRealSerie = createServerFn({ method: "GET" })
  .validator((data: { ibge: number; ano: number }) => data)
  .handler(async ({ data }): Promise<RealSerie | null> => {
    const ibge = Math.floor(Number(data.ibge));
    const anoBase = Math.floor(Number(data.ano));
    if (!Number.isFinite(ibge) || ibge < 1000000 || ibge > 9999999) return null;
    if (!Number.isFinite(anoBase)) return null;
    const key = `serie:${ibge}:${anoBase}`;
    const hit = serieCache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.value;

    const anos: RealSerie["anos"] = [];
    for (let ano = anoBase - 4; ano <= anoBase; ano++) {
      try {
        const [rec, des] = await Promise.all([
          fetchAnexo(ibge, ano, "DCA-Anexo I-C"),
          fetchAnexo(ibge, ano, "DCA-Anexo I-D"),
        ]);
        const ponto = parseSerieAno(ano, rec, des);
        if (ponto) anos.push(ponto);
      } catch {
        // ano sem dado publicado: pula, mantém os demais pontos
      }
    }
    if (anos.length < 2) {
      serieCache.set(key, { at: Date.now(), value: null });
      return null;
    }
    const value: RealSerie = {
      ibge,
      anos,
      cagrPropria: cagr(anos.map((a) => a.propria)),
      cagrTransf: cagr(anos.map((a) => a.transf)),
      volatilidade: volatilidadeReceita(anos.map((a) => a.receita)),
    };
    serieCache.set(key, { at: Date.now(), value });
    return value;
  });
