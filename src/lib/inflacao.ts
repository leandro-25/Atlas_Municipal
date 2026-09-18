import { createServerFn } from "@tanstack/react-start";

export type IpcaAno = { ano: number; ipca: number; parcial: boolean; ateMes?: string };
export type RealIPCA = {
  anos: IpcaAno[];
  /** Fator acumulado jan/2021 até o último mês (R$ 1 de jan/21 = X hoje). */
  fatorAcumulado: number;
  ultimoMes: string;
  fonte: string;
};

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

let cache: { at: number; value: RealIPCA | null } | null = null;
const TTL_MS = 1000 * 60 * 60 * 24 * 7;

export const getRealIPCA = createServerFn({ method: "GET" })
  .validator((data: { desde?: number } | undefined | null) => data ?? {})
  .handler(async (): Promise<RealIPCA | null> => {
    if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
    try {
      const res = await fetch(
        "https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial=01/01/2020&dataFinal=31/12/2030",
        {
          headers: { accept: "application/json", "user-agent": "atlas-municipal/1.0" },
          signal: AbortSignal.timeout(20000),
        },
      );
      if (!res.ok) throw new Error(`BCB HTTP ${res.status}`);
      const rows = (await res.json()) as { data: string; valor: string }[];
      const porAno = new Map<number, number[]>();
      const mesesPorAno = new Map<number, string[]>();
      for (const r of rows) {
        const [d, m, a] = r.data.split("/").map(Number);
        const v = Number(String(r.valor).replace(",", "."));
        if (!Number.isFinite(v) || !a || a < 2021) continue;
        if (!porAno.has(a)) {
          porAno.set(a, []);
          mesesPorAno.set(a, []);
        }
        porAno.get(a)!.push(v);
        mesesPorAno.get(a)!.push(`${MESES[(m ?? 1) - 1]}/${String(a).slice(2)}`);
      }
      const anos: IpcaAno[] = [...porAno.entries()]
        .sort((x, y) => x[0] - y[0])
        .map(([ano, vals]) => {
          const fator = vals.reduce((s, v) => s * (1 + v / 100), 1);
          const parcial = vals.length < 12;
          const meses = mesesPorAno.get(ano) ?? [];
          return {
            ano,
            ipca: (fator - 1) * 100,
            parcial,
            ateMes: parcial ? meses[meses.length - 1] : undefined,
          };
        });
      if (anos.length === 0) {
        cache = { at: Date.now(), value: null };
        return null;
      }
      const fatorAcumulado = anos
        .filter((a) => !a.parcial)
        .reduce((s, a) => s * (1 + a.ipca / 100), 1);
      const last = anos[anos.length - 1]!;
      const value: RealIPCA = {
        anos,
        fatorAcumulado,
        ultimoMes: last.parcial && last.ateMes ? last.ateMes : `dez/${String(last.ano).slice(2)}`,
        fonte: "IPCA/IBGE via BCB (série 433)",
      };
      cache = { at: Date.now(), value };
      return value;
    } catch {
      cache = { at: Date.now(), value: null };
      return null;
    }
  });
