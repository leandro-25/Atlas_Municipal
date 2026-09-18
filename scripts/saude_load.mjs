// @ts-check
/**
 * Estabelecimentos de saúde oficiais (CNES): snapshots src/data/saude/<UF>.json -> Postgres.
 *   node scripts/saude_load.mjs
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
  const dir = path.join(root, "src", "data", "saude");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
  const migration = await readFile(path.join(root, "migrations", "0004_saude.sql"), "utf-8");
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
    const entries = Object.entries(cities);
    for (let i = 0; i < entries.length; i += 500) {
      const batch = entries.slice(i, i + 500);
      const values = [];
      const params = [];
      batch.forEach(([ibge, v], j) => {
        const o = j * 6;
        values.push(`($${o + 1},$${o + 2},$${o + 3},$${o + 4},$${o + 5},$${o + 6})`);
        params.push(Number(ibge), v.unidades, v.ubs ?? 0, v.hospitais ?? 0, v.total ?? v.unidades, v.ano);
      });
      await db.run(
        `insert into raw_saude (ibge, unidades, ubs, hospitais, total_cnes, competencia)
         values ${values.join(",")}
         on conflict (ibge) do update set
           unidades = excluded.unidades, ubs = excluded.ubs,
           hospitais = excluded.hospitais, total_cnes = excluded.total_cnes,
           competencia = excluded.competencia, atualizado_em = now()`,
        params,
      );
      rows += batch.length;
    }
  }
  const check = await db.run("select count(*)::int as n from raw_saude");
  console.log(`OK: ${rows} upserts, total na tabela: ${check[0]?.n}`);
  await db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
