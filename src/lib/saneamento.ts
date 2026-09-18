import { createServerFn } from "@tanstack/react-start";

export type RealSaneamento = {
  ibge: number;
  aguaRede: number;
  aguaEncanada: number;
  esgotoRede: number;
  esgotoAdequado: number;
  fossaRudimentar: number;
  lixoColetado: number;
  lixoQueimado: number;
  semBanheiro: number;
  fonte: string;
};

function valid(r: Record<string, unknown>): r is Record<string, number> {
  for (const f of ["aguaRede", "esgotoRede", "esgotoAdequado", "lixoColetado"]) {
    if (typeof r[f] !== "number" || !Number.isFinite(r[f] as number)) return false;
  }
  return true;
}

export const getRealSaneamento = createServerFn({ method: "GET" })
  .validator((data: { ibge: number }) => data)
  .handler(async ({ data }): Promise<RealSaneamento | null> => {
    const ibge = Math.floor(Number(data.ibge));
    if (!Number.isFinite(ibge) || ibge < 1000000 || ibge > 9999999) return null;
    // 1) Postgres (Neon em produção).
    try {
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      const rows = await sql.query<Record<string, unknown>>(
        `select agua_rede::float8 as "aguaRede", agua_encanada::float8 as "aguaEncanada",
                esgoto_rede::float8 as "esgotoRede", esgoto_adequado::float8 as "esgotoAdequado",
                fossa_rudimentar::float8 as "fossaRudimentar", lixo_coletado::float8 as "lixoColetado",
                lixo_queimado::float8 as "lixoQueimado", sem_banheiro as "semBanheiro"
         from raw_saneamento where ibge = $1`,
        [ibge],
      );
      const r = rows[0];
      if (r && valid(r)) {
        return {
          ibge,
          aguaRede: r.aguaRede as number,
          aguaEncanada: Number(r.aguaEncanada) || 0,
          esgotoRede: r.esgotoRede as number,
          esgotoAdequado: r.esgotoAdequado as number,
          fossaRudimentar: Number(r.fossaRudimentar) || 0,
          lixoColetado: r.lixoColetado as number,
          lixoQueimado: Number(r.lixoQueimado) || 0,
          semBanheiro: Number(r.semBanheiro) || 0,
          fonte: "Censo 2022/IBGE — moradores em DPPO",
        };
      }
    } catch {
      // sem banco: cai para o snapshot
    }
    // 2) Snapshot estático por UF.
    try {
      const { getMunicipio } = await import("@/data/cities");
      const mun = getMunicipio(ibge);
      if (!mun) return null;
      const mod = (await import(`../data/saneamento/${mun.u.toLowerCase()}.json`)) as {
        default: Record<string, Record<string, number>>;
      };
      const r = mod.default[String(ibge)];
      if (r && valid(r)) {
        return {
          ibge,
          aguaRede: r.aguaRede as number,
          aguaEncanada: r.aguaEncanada ?? 0,
          esgotoRede: r.esgotoRede as number,
          esgotoAdequado: r.esgotoAdequado as number,
          fossaRudimentar: r.fossaRudimentar ?? 0,
          lixoColetado: r.lixoColetado as number,
          lixoQueimado: r.lixoQueimado ?? 0,
          semBanheiro: r.semBanheiro ?? 0,
          fonte: "Censo 2022/IBGE — moradores em DPPO",
        };
      }
    } catch {
      return null;
    }
    return null;
  });
