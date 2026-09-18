// @ts-check
/**
 * Etapa B — carrega o agregado CAGED (scripts/caged_fetch.py) no Postgres.
 *
 *   node scripts/caged_load.mjs
 *
 * Usa DATABASE_URL (Neon/prod) ou PGLite em memória (preview local — os dados
 * duram só a sessão; o caminho de leitura prefere o banco e cai para os
 * snapshots estáticos em src/data/caged/<UF>.json).
 * Aplica migrations/0002_caged.sql antes (idempotente).
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const TMP = "D:\\Temp\\opencode\\caged";

async function getRunner() {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url });
    return {
      kind: "neon",
      run: async (text, params = []) => (await pool.query(text, params)).rows,
      close: () => pool.end(),
    };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const pg = new PGlite();
  await pg.waitReady;
  return {
    kind: "pglite",
    run: async (text, params = []) => (await pg.query(text, params)).rows,
    close: async () => {},
  };
}

async function main() {
  const agg = JSON.parse(await readFile(path.join(TMP, "agg_all.json"), "utf-8"));
  const migration = await readFile(path.join(root, "migrations", "0002_caged.sql"), "utf-8");
  const db = await getRunner();
  console.log(`banco: ${db.kind}`);
  const noComments = migration
    .split("\n")
    .filter((l) => !l.trim().startsWith("--"))
    .join("\n");
  for (const stmt of noComments.split(";").map((s) => s.trim()).filter(Boolean)) {
    await db.run(stmt);
  }
  let months = 0;
  let rows = 0;
  for (const month of Object.keys(agg).sort()) {
    const cities = agg[month];
    const entries = Object.entries(cities);
    // Upsert em lotes de 500 para não estourar parâmetros.
    for (let i = 0; i < entries.length; i += 500) {
      const batch = entries.slice(i, i + 500);
      const values = [];
      const params = [];
      batch.forEach(([ibge, v], j) => {
        const o = j * 8;
        values.push(
          `($${o + 1},$${o + 2},$${o + 3},$${o + 4},$${o + 5},$${o + 6},$${o + 7},$${o + 8})`,
        );
        params.push(month, Number(ibge), v[0], v[1], v[0] - v[1], v[2], v[3], "Novo Caged/MTE");
      });
      await db.run(
        `insert into raw_caged (competencia, ibge, admissoes, desligamentos, saldo, sal_soma_adm, sal_n_adm, fonte)
         values ${values.join(",")}
         on conflict (competencia, ibge) do update set
           admissoes = excluded.admissoes, desligamentos = excluded.desligamentos,
           saldo = excluded.saldo, sal_soma_adm = excluded.sal_soma_adm,
           sal_n_adm = excluded.sal_n_adm, atualizado_em = now()`,
        params,
      );
      rows += batch.length;
    }
    months += 1;
    console.log(`${month}: ${entries.length} municípios`);
  }
  const check = await db.run("select count(*)::int as n from raw_caged");
  console.log(`OK: ${months} meses, ${rows} upserts, total na tabela: ${check[0]?.n}`);
  await db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
