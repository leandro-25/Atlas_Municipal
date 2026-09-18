// @ts-check
/**
 * Saneamento oficial (Censo 2022): snapshots src/data/saneamento/<UF>.json -> Postgres.
 *   node scripts/saneamento_load.mjs
 * Usa DATABASE_URL (Neon/prod) ou PGLite em memória (sessão local).
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
  const dir = path.join(root, "src", "data", "saneamento");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
  const migration = await readFile(path.join(root, "migrations", "0003_saneamento.sql"), "utf-8");
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
        const o = j * 9;
        values.push(`($${o + 1},$${o + 2},$${o + 3},$${o + 4},$${o + 5},$${o + 6},$${o + 7},$${o + 8},$${o + 9})`);
        params.push(
          Number(ibge), v.aguaRede, v.aguaEncanada, v.esgotoRede, v.esgotoAdequado,
          v.fossaRudimentar, v.lixoColetado, v.lixoQueimado, v.semBanheiro,
        );
      });
      await db.run(
        `insert into raw_saneamento (ibge, agua_rede, agua_encanada, esgoto_rede, esgoto_adequado, fossa_rudimentar, lixo_coletado, lixo_queimado, sem_banheiro)
         values ${values.join(",")}
         on conflict (ibge) do update set
           agua_rede = excluded.agua_rede, agua_encanada = excluded.agua_encanada,
           esgoto_rede = excluded.esgoto_rede, esgoto_adequado = excluded.esgoto_adequado,
           fossa_rudimentar = excluded.fossa_rudimentar, lixo_coletado = excluded.lixo_coletado,
           lixo_queimado = excluded.lixo_queimado, sem_banheiro = excluded.sem_banheiro,
           atualizado_em = now()`,
        params,
      );
      rows += batch.length;
    }
    console.log(`${file}: ${entries.length} municípios`);
  }
  const check = await db.run("select count(*)::int as n from raw_saneamento");
  console.log(`OK: ${rows} upserts, total na tabela: ${check[0]?.n}`);
  await db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
