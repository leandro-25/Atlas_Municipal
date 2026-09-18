import { createServerFn } from "@tanstack/react-start";

export type CagedMes = {
  comp: string;
  adm: number;
  desl: number;
  saldo: number;
};

export type RealCaged = {
  ibge: number;
  /** Última competência (AAAAMM). */
  ate: string;
  meses: CagedMes[];
  adm12: number;
  desl12: number;
  saldo12: number;
  /** Salário médio de admissão ponderado (R$). */
  salarioMedio: number;
  ytd: { ano: string; adm: number; desl: number; saldo: number };
  fonte: string;
};

type SnapshotRow = [number, number, number, number];

async function fromDb(ibge: number): Promise<CagedMes[] | null> {
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql.query<{
      competencia: string;
      admissoes: number;
      desligamentos: number;
      saldo: number;
    }>(
      `select competencia, admissoes, desligamentos, saldo
       from raw_caged where ibge = $1 order by competencia`,
      [ibge],
    );
    if (rows.length < 6) return null;
    return rows.map((r) => ({
      comp: r.competencia,
      adm: Number(r.admissoes) || 0,
      desl: Number(r.desligamentos) || 0,
      saldo: Number(r.saldo) || 0,
    }));
  } catch {
    return null;
  }
}

async function fromSnapshot(ibge: number): Promise<CagedMes[] | null> {
  try {
    const { getMunicipio } = await import("@/data/cities");
    const mun = getMunicipio(ibge);
    if (!mun) return null;
    const mod = (await import(`../data/caged/${mun.u.toLowerCase()}.json`)) as {
      default: Record<string, Record<string, SnapshotRow>>;
    };
    const city = mod.default[String(ibge)];
    if (!city) return null;
    const meses = Object.entries(city)
      .map(([comp, v]) => ({ comp, adm: v[0], desl: v[1], saldo: v[0] - v[1] }))
      .sort((a, b) => (a.comp < b.comp ? -1 : 1));
    return meses.length >= 6 ? meses : null;
  } catch {
    return null;
  }
}

async function salariosSnapshot(ibge: number): Promise<{ soma: number; n: number } | null> {
  try {
    const { getMunicipio } = await import("@/data/cities");
    const mun = getMunicipio(ibge);
    if (!mun) return null;
    const mod = (await import(`../data/caged/${mun.u.toLowerCase()}.json`)) as {
      default: Record<string, Record<string, SnapshotRow>>;
    };
    const city = mod.default[String(ibge)];
    if (!city) return null;
    let soma = 0;
    let n = 0;
    for (const v of Object.values(city)) {
      soma += v[2];
      n += v[3];
    }
    return n > 0 ? { soma, n } : null;
  } catch {
    return null;
  }
}

export type CagedSetor = { secao: string; adm: number; desl: number; saldo: number };
export type RealCagedSetor = {
  ibge: number;
  meses: string[];
  secoes: CagedSetor[];
  fonte: string;
};

/** Saldo por seção CNAE nos últimos 3 meses (banco → snapshot). */
export const getRealCagedSetor = createServerFn({ method: "GET" })
  .validator((data: { ibge: number }) => data)
  .handler(async ({ data }): Promise<RealCagedSetor | null> => {
    const ibge = Math.floor(Number(data.ibge));
    if (!Number.isFinite(ibge) || ibge < 1000000 || ibge > 9999999) return null;
    const toOut = (meses: string[], rows: { secao: string; adm: number; desl: number }[]): RealCagedSetor | null => {
      if (rows.length === 0) return null;
      return {
        ibge,
        meses,
        secoes: rows.map((r) => ({ secao: r.secao, adm: r.adm, desl: r.desl, saldo: r.adm - r.desl })),
        fonte: "Novo Caged/MTE — últimos 3 meses (sem ajustes)",
      };
    };
    try {
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      const rows = await sql.query<{ secao: string; adm: number; desl: number; periodo: string }>(
        `select secao, adm, desl, periodo from raw_caged_setor where ibge = $1`,
        [ibge],
      );
      if (rows.length > 0) {
        return toOut(
          String(rows[0]?.periodo ?? "").split(",").filter(Boolean),
          rows.map((r) => ({ secao: r.secao, adm: Number(r.adm) || 0, desl: Number(r.desl) || 0 })),
        );
      }
    } catch {
      // sem banco: cai para o snapshot
    }
    try {
      const { getMunicipio } = await import("@/data/cities");
      const mun = getMunicipio(ibge);
      if (!mun) return null;
      const mod = (await import(`../data/caged_setor/${mun.u.toLowerCase()}.json`)) as {
        default: Record<string, { meses: string[]; secoes: Record<string, [number, number]> }>;
      };
      const rec = mod.default[String(ibge)];
      if (!rec) return null;
      return toOut(
        rec.meses,
        Object.entries(rec.secoes).map(([secao, v]) => ({ secao, adm: v[0], desl: v[1] })),
      );
    } catch {
      return null;
    }
  });

export const getRealCaged = createServerFn({ method: "GET" })
  .validator((data: { ibge: number }) => data)
  .handler(async ({ data }): Promise<RealCaged | null> => {
    const ibge = Math.floor(Number(data.ibge));
    if (!Number.isFinite(ibge) || ibge < 1000000 || ibge > 9999999) return null;
    const meses = (await fromDb(ibge)) ?? (await fromSnapshot(ibge));
    if (!meses || meses.length === 0) return null;
    const ult12 = meses.slice(-12);
    const adm12 = ult12.reduce((s, m) => s + m.adm, 0);
    const desl12 = ult12.reduce((s, m) => s + m.desl, 0);
    const anoAtual = ult12[ult12.length - 1]!.comp.slice(0, 4);
    const ytdMeses = ult12.filter((m) => m.comp.startsWith(anoAtual));
    const ytd = {
      ano: anoAtual,
      adm: ytdMeses.reduce((s, m) => s + m.adm, 0),
      desl: ytdMeses.reduce((s, m) => s + m.desl, 0),
      saldo: ytdMeses.reduce((s, m) => s + m.saldo, 0),
    };
    // Salário médio: do banco quando disponível, senão do snapshot.
    let soma = 0;
    let n = 0;
    try {
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      const rows = await sql.query<{ soma: number; n: number }>(
        `select coalesce(sum(sal_soma_adm)::float8, 0) as soma,
                coalesce(sum(sal_n_adm), 0) as n
         from raw_caged where ibge = $1`,
        [ibge],
      );
      soma = Number(rows[0]?.soma) || 0;
      n = Number(rows[0]?.n) || 0;
    } catch {
      // sem banco: usa snapshot
    }
    if (n <= 0) {
      const snap = await salariosSnapshot(ibge);
      if (snap) {
        soma = snap.soma;
        n = snap.n;
      }
    }
    return {
      ibge,
      ate: ult12[ult12.length - 1]!.comp,
      meses: ult12,
      adm12,
      desl12,
      saldo12: adm12 - desl12,
      salarioMedio: n > 0 ? soma / n : 0,
      ytd,
      fonte: "Novo Caged/MTE — movimentação mensal (sem ajustes)",
    };
  });
