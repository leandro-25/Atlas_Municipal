import { useEffect, useState } from "react";
import { getRealCaged, getRealCagedSetor, type RealCaged, type RealCagedSetor } from "@/lib/caged";
import { getRealIPCA, type RealIPCA } from "@/lib/inflacao";
import { getRealSaneamento, type RealSaneamento } from "@/lib/saneamento";
import { getRealSaude, type RealSaude } from "@/lib/saude";
import {
  getRealFinancas,
  getRealIbge,
  getRealFuncoes,
  getRealPatrimonio,
  getRealQualidade,
  getRealRGF,
  getRealRREO,
  getRealSerie,
  type RealFuncoesPayload,
  type RealPatrimonioPayload,
  type RealQualidadePayload,
  type RealRGFPayload,
  type RealPIBEntornoPayload,
  type RealRREOPayload,
} from "@/lib/siconfi";
import type { RealFinancas, RealSerie } from "@/data/real";

export type RealState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: RealFinancas }
  | { status: "empty" }
  | { status: "error" };

const LS_TTL_MS = 1000 * 60 * 60 * 24 * 7;

const DCA_CACHE_KEY = (ibge: number) => `siconfi:dca:v3:${ibge}`;

/** Campos numéricos que todo registro válido precisa ter (blindagem contra cache antigo). */
const REQUIRED_NUMBERS = [
  "receitaLiquida",
  "despesaTotal",
  "tributariaPropria",
  "transfTotal",
  "despesaPessoal",
  "investimentos",
  "jurosDivida",
  "amortizacaoDivida",
  "folhaRCL",
  "rigidezRCL",
  "investShare",
] as const;

function readCache(ibge: number): RealFinancas | null {
  try {
    const raw = localStorage.getItem(DCA_CACHE_KEY(ibge));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; value: RealFinancas };
    if (Date.now() - parsed.at > LS_TTL_MS) return null;
    const v = parsed.value as unknown as Record<string, unknown>;
    if (!v || typeof v !== "object") return null;
    for (const f of REQUIRED_NUMBERS) {
      if (typeof v[f] !== "number" || !Number.isFinite(v[f] as number)) return null;
    }
    return parsed.value;
  } catch {
    return null;
  }
}

export function useRealFinancas(ibge: number | undefined): RealState {
  const [state, setState] = useState<RealState>({ status: "idle" });

  useEffect(() => {
    if (!ibge) {
      setState({ status: "idle" });
      return;
    }
    let cancelled = false;
    const cached = readCache(ibge);
    if (cached) {
      setState({ status: "ready", data: cached });
      return;
    }
    setState({ status: "loading" });
    getRealFinancas({ data: { ibge } })
      .then((data) => {
        if (cancelled) return;
        if (data) {
          try {
            localStorage.setItem(DCA_CACHE_KEY(ibge), JSON.stringify({ at: Date.now(), value: data }));
          } catch {}
          setState({ status: "ready", data });
        } else {
          setState({ status: "empty" });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [ibge]);

  return state;
}

export type DeepState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "empty" }
  | { status: "error" };

function lsGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; value: T };
    if (Date.now() - parsed.at > LS_TTL_MS) return null;
    return parsed.value;
  } catch {
    return null;
  }
}

function lsSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify({ at: Date.now(), value }));
  } catch {}
}

function useDeep<T>(key: string | null, fetcher: () => Promise<T | null>): DeepState<T> {
  const [state, setState] = useState<DeepState<T>>({ status: "idle" });

  useEffect(() => {
    if (!key) {
      setState({ status: "idle" });
      return;
    }
    let cancelled = false;
    const cached = lsGet<T>(key);
    if (cached) {
      setState({ status: "ready", data: cached });
      return;
    }
    setState({ status: "loading" });
    fetcher()
      .then((data) => {
        if (cancelled) return;
        if (data) {
          lsSet(key, data);
          setState({ status: "ready", data });
        } else {
          setState({ status: "empty" });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}

/** Camada 2a: despesa por função oficial. Inicia quando o ano-base é conhecido. */
export function useRealFuncoes(
  ibge: number | undefined,
  ano: number | undefined,
): DeepState<NonNullable<RealFuncoesPayload>> {
  return useDeep<NonNullable<RealFuncoesPayload>>(
    ibge && ano ? `siconfi:ie:v1:${ibge}:${ano}` : null,
    () => getRealFuncoes({ data: { ibge: ibge!, ano: ano! } }) as Promise<NonNullable<RealFuncoesPayload> | null>,
  );
}

/** Camada 2c: balanço patrimonial oficial. Inicia quando o ano-base é conhecido. */
export function useRealPatrimonio(
  ibge: number | undefined,
  ano: number | undefined,
): DeepState<Exclude<RealPatrimonioPayload, null>> {
  return useDeep<Exclude<RealPatrimonioPayload, null>>(
    ibge && ano ? `siconfi:iab:v1:${ibge}:${ano}` : null,
    () => getRealPatrimonio({ data: { ibge: ibge!, ano: ano! } }) as Promise<Exclude<RealPatrimonioPayload, null> | null>,
  );
}

/** Camada 2d: RGF mais recente (Executivo). Independe do ano-base. */
export function useRealRGF(ibge: number | undefined): DeepState<Exclude<RealRGFPayload, null>> {
  return useDeep<Exclude<RealRGFPayload, null>>(
    ibge ? `siconfi:rgf:v1:${ibge}` : null,
    () => getRealRGF({ data: { ibge: ibge! } }) as Promise<Exclude<RealRGFPayload, null> | null>,
  );
}

/** Camada 2e: selo de qualidade (extrato de entregas). Inicia com o ano-base. */
export function useRealQualidade(
  ibge: number | undefined,
  ano: number | undefined,
): DeepState<Exclude<RealQualidadePayload, null>> {
  return useDeep<Exclude<RealQualidadePayload, null>>(
    ibge && ano ? `siconfi:ext:v1:${ibge}:${ano}` : null,
    () =>
      getRealQualidade({ data: { ibge: ibge!, ano: ano! } }) as Promise<Exclude<RealQualidadePayload, null> | null>,
  );
}

/** Camada 2f: RREO parcial mais recente. Busca única por cidade. */
export function useRealRREO(ibge: number | undefined): DeepState<Exclude<RealRREOPayload, null>> {
  return useDeep<Exclude<RealRREOPayload, null>>(
    ibge ? `siconfi:rreo:v1:${ibge}` : null,
    () => getRealRREO({ data: { ibge: ibge! } }) as Promise<Exclude<RealRREOPayload, null> | null>,
  );
}

/** CAGED por setor (banco → snapshot). Busca única por cidade. */
export function useRealCagedSetor(ibge: number | undefined): DeepState<RealCagedSetor> {
  return useDeep<RealCagedSetor>(ibge ? `siconfi:cagedsetor:v1:${ibge}` : null, () =>
    getRealCagedSetor({ data: { ibge: ibge! } }),
  );
}

/** IPCA oficial (BCB). Global, buscado uma vez e cacheado. */
export function useRealIPCA(): DeepState<RealIPCA> {
  return useDeep<RealIPCA>("siconfi:ipca:v1", () => getRealIPCA({ data: {} }));
}

/** Etapa B: CAGED oficial (banco → snapshot). Busca única por cidade. */
export function useRealCaged(ibge: number | undefined): DeepState<RealCaged> {
  return useDeep<RealCaged>(ibge ? `siconfi:caged:v1:${ibge}` : null, () =>
    getRealCaged({ data: { ibge: ibge! } }),
  );
}

/** Saneamento oficial (Censo 2022; banco → snapshot). Busca única por cidade. */
export function useRealSaneamento(ibge: number | undefined): DeepState<RealSaneamento> {
  return useDeep<RealSaneamento>(ibge ? `siconfi:san:v1:${ibge}` : null, () =>
    getRealSaneamento({ data: { ibge: ibge! } }),
  );
}

/** Estabelecimentos de saúde oficiais (CNES; banco → snapshot). */
export function useRealSaude(ibge: number | undefined): DeepState<RealSaude> {
  return useDeep<RealSaude>(ibge ? `siconfi:saude:v2:${ibge}` : null, () =>
    getRealSaude({ data: { ibge: ibge! } }),
  );
}

/** Fase 4: PIB + entorno IBGE. Busca única por cidade. */
export function useRealIbge(ibge: number | undefined): DeepState<Exclude<RealPIBEntornoPayload, null>> {
  return useDeep<Exclude<RealPIBEntornoPayload, null>>(
    ibge ? `siconfi:ibge:v2:${ibge}` : null,
    () => getRealIbge({ data: { ibge: ibge! } }) as Promise<Exclude<RealPIBEntornoPayload, null> | null>,
  );
}

/** Camada 2b: série anual 5 anos. Inicia quando o ano-base é conhecido. */
export function useRealSerie(
  ibge: number | undefined,
  ano: number | undefined,
): DeepState<RealSerie> {
  return useDeep<RealSerie>(
    ibge && ano ? `siconfi:serie:v2:${ibge}:${ano}` : null,
    () => getRealSerie({ data: { ibge: ibge!, ano: ano! } }),
  );
}
