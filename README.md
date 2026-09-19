# Atlas Municipal — Saúde das Cidades

Painel web para explorar a **saúde fiscal, econômica e social de qualquer município brasileiro**. Busque por nome ou código IBGE, veja o raio-X da cidade em abas (Finanças, Economia, Sociedade, Saúde, Risco, Projeção), compare até 3 municípios lado a lado e navegue por UFs e pelo panorama nacional.

Stack: **React 19 + TanStack Start/Router + Tailwind v4 + Recharts + PGLite/Postgres (Neon em produção)**.

## O que o app faz

- **Busca nacional de municípios** (`?cidade=<cod_ibge>`) com filtro por UF.
- **Dashboard da cidade** em abas:
  - **Finanças** — receita total, receita própria vs. transferências, despesa, resultado, funções orçamentárias, série histórica (CAGR, volatilidade), patrimônio, RGF/RREO e índice de qualidade fiscal; comparação com a capital do estado.
  - **Economia** — CAGED (admissões, desligamentos, saldo 12m, salário médio, série mensal) + recorte por setor.
  - **Sociedade** — saneamento (Censo 2022: água, esgoto, lixo) e entorno/PIB regional (IBGE).
  - **Saúde** — rede pública CNES (unidades, UBS/USF, hospitais) + série local quando houver.
  - **Risco / Projeção** — volatilidade de receita, dependência de transferências, projeção de empregos e população.
- **Comparador** (`?vs=id1,id2`) — até 3 pares com troca/inversão e limpeza.
- **Visão por UF e nacional** — agregados por estado/região.
- **Watchlist local** (favoritos em `localStorage`), KPIs, gráficos, fontes citadas em cada painel (`FonteDados`).

## Fontes de dados (reais + fallback)

| Camada | Origem | Como entra |
|---|---|---|
| Finanças, funções, RGF/RREO, patrimônio, série | **SICONFI / Tesouro (DCA)** via `src/lib/siconfi.ts` | server function ao vivo, cache 24h; anos tentados 2025→2024→2023 |
| Emprego formal | **CAGED** | Postgres `raw_caged` (`migrations/0002`, `0005`) ou snapshot `src/data/caged/<uf>.json` via `scripts/caged_*.py` |
| Saneamento | **Censo 2022 / IBGE** | `raw_saneamento` (`0003`) ou `src/data/saneamento/<uf>.json` |
| Saúde | **CNES/DATASUS** | `raw_saude` (`0004`) ou `src/data/saude/<uf>.json` |
| Fallback offline/demo | gerador determinístico `src/data/generate.ts` | quando o dado real ainda não carregou |

Cada número exibe ano/competência e fonte; `use-real.ts` expõe `loading | ready | empty | error` por camada.

## Como rodar

Pré-requisito: **Node 22**.

```bash
npm install
npm run dev        # http://localhost:8080
```

Outros comandos:

```bash
npm run build      # build Vite + migrate
npm run typecheck  # tsc --noEmit
npm run test       # testes unitários (scripts + lib)
npm run lint       # eslint
npm run preview:restart  # serve o build em 127.0.0.1:8081
```

Rotas por URL: `/` (panorama), `/?uf=SP`, `/?cidade=3550308` (São Paulo), `/?cidade=3550308&vs=3106200,3304557`.

## Banco de dados

- Local/dev: **PGLite** (embarcado, `src/lib/db.ts` aplica `migrations/*.sql`).
- Produção: **Postgres/Neon** via `DATABASE_URL` (nunca commite `.env`).
- Migrações: `migrations/0002_caged.sql`, `0003_saneamento.sql`, `0004_saude.sql`, `0005_caged_setor.sql` (+ `migrations/auth/`).
- Carga: `scripts/caged_fetch.py` → `scripts/caged_load.mjs`, `censo_saneamento.py` → `saneamento_load.mjs`, `cnes_fetch.py` → `saude_load.mjs`, `npm run db:migrate`.

## Estrutura

```
src/
  routes/index.tsx          # Home: busca, UF, dashboard, comparador (?cidade, ?uf, ?vs)
  components/
    city-dashboard.tsx      # abas Finanças/Economia/Sociedade/Saúde/Risco/Projeção
    city-compare.tsx  city-finder.tsx  city-search.tsx
    national-overview.tsx  health-panel.tsx  charts.tsx  kpi.tsx  ...
  data/  cities.ts  ufs.ts  generate.ts  real.ts  use-real.ts  municipios.json
    caged/  caged_setor/  saneamento/  saude/   # snapshots por UF
  lib/  siconfi.ts  caged.ts  saneamento.ts  saude.ts  inflacao.ts  watchlist.ts
scripts/  *_load.mjs  *_fetch.py  migrate.mjs
migrations/
```

## Aviso

Dados públicos podem ter defasagem (SICONFI/CAGED/CNES atualizam em ciclos próprios). Valores monetários e per-capita usam população/ano-base exibidos em tela; confira sempre ano e fonte antes de citar.
