// @ts-check
/**
 * CAGED por setor: snapshots src/data/caged_setor/<UF>.json -> Postgres.
 *   node scripts/caged_setor_load.mjs
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

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
  const dir = path.join(root, "src", "data", "caged_setor");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
  const migration = await readFile(path.join(root, "migrations", "0005_caged_setor.sql"), "utf-8");
  const db = await getRunner();
  console.log(`banco: ${db.kind}`);
  const noComments = migration
    .split("\n")
    .filter((l) => !l.trim().startsWith("--"))
    .join("\n");
  for (const stmt of noComments.split(";").map((s) => s.trim()).filter(Boolean)) {
    await db.run(stmt);
  }
  let rows = 0;
  for (const file of files.sort()) {
    const cities = JSON.parse(await readFile(path.join(dir, file), "utf-8"));
    for (const [ibge, rec] of Object.entries(cities)) {
      const periodo = rec.meses.join(",");
      for (const [secao, vals] of Object.entries(rec.secoes)) {
        await db.run(
          `insert into raw_caged_setor (ibge, secao, adm, desl, periodo)
           values ($1,$2,$3,$4,$5)
           on conflict (ibge, secao) do update set
             adm = excluded.adm, desl = excluded.desl, periodo = excluded.periodo,
             atualizado_em = now()`,
          [Number(ibge), secao, vals[0], vals[1], periodo],
        );
        rows += 1;
      }
    }
    console.log(`${file}: ${Object.keys(cities).length} municípios`);
  }
  const check = await db.run("select count(*)::int as n from raw_caged_setor");
  console.log(`OK: ${rows} upserts, total na tabela: ${check[0]?.n}`);
  await db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
