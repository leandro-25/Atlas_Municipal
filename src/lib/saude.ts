import { createServerFn } from "@tanstack/react-start";

export type RealSaude = {
  ibge: number;
  /** Unidades da rede pública (natureza jurídica 1xxx, CNES). */
  unidades: number;
  /** UBS/USF da rede pública (tipo 02). */
  ubs: number;
  /** Hospitais da rede pública (tipos 05/07). */
  hospitais: number;
  /** Total CNES (inclui rede privada) — contexto. */
  total: number;
  /** Competência AAAAMM. */
  competencia: string;
  fonte: string;
};

const FONTE = "CNES/DATASUS — rede pública (natureza jurídica pública)";

function toReal(ibge: number, r: Record<string, number | string>): RealSaude | null {
  const unidades = Number(r["unidades"]) || 0;
  if (!(unidades > 0)) return null;
  return {
    ibge,
    unidades,
    ubs: Number(r["ubs"] ?? 0) || 0,
    hospitais: Number(r["hospitais"] ?? 0) || 0,
    total: Number(r["total"] ?? r["total_cnes"] ?? unidades) || unidades,
    competencia: String(r["competencia"] ?? r["ano"] ?? ""),
    fonte: FONTE,
  };
}

export const getRealSaude = createServerFn({ method: "GET" })
  .validator((data: { ibge: number }) => data)
  .handler(async ({ data }): Promise<RealSaude | null> => {
    const ibge = Math.floor(Number(data.ibge));
    if (!Number.isFinite(ibge) || ibge < 1000000 || ibge > 9999999) return null;
    try {
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      const rows = await sql.query<Record<string, number | string>>(
        `select unidades, ubs, hospitais, total_cnes as "total", competencia
         from raw_saude where ibge = $1`,
        [ibge],
      );
      const parsed = rows[0] ? toReal(ibge, rows[0]) : null;
      if (parsed) return parsed;
    } catch {
      // sem banco: cai para o snapshot
    }
    try {
      const { getMunicipio } = await import("@/data/cities");
      const mun = getMunicipio(ibge);
      if (!mun) return null;
      const mod = (await import(`../data/saude/${mun.u.toLowerCase()}.json`)) as {
        default: Record<string, Record<string, number | string>>;
      };
      const r = mod.default[String(ibge)];
      return r ? toReal(ibge, r) : null;
    } catch {
      return null;
    }
  });
