import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HEALTH_STATUS } from "@/data/health-meta";
import { formatInt, formatPct } from "@/data/format";
import {
  getAllPulses,
  getCityCoreSignals,
  type CityPulse,
} from "@/data/generate";
import { REGION_NAMES, type RegionCode } from "@/data/ufs";
import { cn } from "@/lib/utils";

type Peso = 0 | 1 | 2;

type Criterio = {
  key: string;
  label: string;
  hint: string;
  valor: (p: CityPulse, s: NonNullable<ReturnType<typeof getCityCoreSignals>>) => number;
  texto: (p: CityPulse, s: NonNullable<ReturnType<typeof getCityCoreSignals>>) => string;
};

const CRITERIOS: Criterio[] = [
  {
    key: "emprego",
    label: "Emprego formal",
    hint: "Formalização alta e desemprego baixo",
    valor: (p) => p.taxaFormal * 0.7 + (1 - p.desemprego) * 0.3,
    texto: (p) => `${formatPct(p.taxaFormal * 100, 0)} de ocupação formal`,
  },
  {
    key: "renda",
    label: "Renda",
    hint: "Renda média dos ocupados",
    valor: (_p, s) => s.rendaMedia,
    texto: (_p, s) => `Renda média ${s.rendaMedia.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}`,
  },
  {
    key: "custoben",
    label: "Custo-benefício",
    hint: "Renda em relação ao custo local",
    valor: (_p, s) => s.rendaMedia / Math.max(s.custoIndice, 1),
    texto: (_p, s) => `Renda/custo ${(s.rendaMedia / Math.max(s.custoIndice, 1)).toFixed(1)}`,
  },
  {
    key: "autonomia",
    label: "Autonomia fiscal",
    hint: "Receita própria, menos FPM",
    valor: (p) => p.propriaPct,
    texto: (p) => `${formatPct(p.propriaPct * 100, 0)} de receita própria`,
  },
  {
    key: "crescimento",
    label: "Crescimento",
    hint: "Gente e emprego subindo",
    valor: (_p, s) => s.taxaAnual * 0.6 + s.empregoTaxa * 0.4,
    texto: (_p, s) => `Pop. ${(s.taxaAnual * 100).toFixed(1).replace(".", ",")}% a.a.`,
  },
  {
    key: "servicos",
    label: "Serviços (IDHM)",
    hint: "Saúde, educação e renda longa",
    valor: (p) => p.idhm,
    texto: (p) => `IDHM ${p.idhm.toLocaleString("pt-BR", { minimumFractionDigits: 3 })}`,
  },
  {
    key: "solidez",
    label: "Solidez da folha",
    hint: "Folha longe do teto",
    valor: (p) => 1 - p.folhaPct,
    texto: (p) => `Folha ${formatPct(p.folhaPct * 100, 0)} da receita`,
  },
];

const PORTES = ["qualquer", "Pequeno porte I", "Pequeno porte II", "Médio porte", "Grande porte", "Metrópole"] as const;
const REGIOES: ("qualquer" | RegionCode)[] = ["qualquer", "N", "NE", "CO", "SE", "S"];

function mediana(vals: number[]): number {
  if (vals.length === 0) return 0;
  const s = [...vals].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)]!;
}

type Scored = {
  pulse: CityPulse;
  match: number;
  motivos: { label: string; texto: string; contrib: number }[];
};

export function CityFinder({ onSelectCity }: { onSelectCity: (id: number) => void }) {
  const [porte, setPorte] = useState<(typeof PORTES)[number]>("qualquer");
  const [regiao, setRegiao] = useState<(typeof REGIOES)[number]>("qualquer");
  const [pesos, setPesos] = useState<Record<string, Peso>>({
    emprego: 2,
    renda: 1,
    custoben: 1,
    autonomia: 1,
    crescimento: 1,
    servicos: 0,
    solidez: 0,
  });

  const resultados = useMemo<Scored[]>(() => {
    const ativos = CRITERIOS.filter((c) => (pesos[c.key] ?? 0) > 0);
    if (ativos.length === 0) return [];
    const pool = getAllPulses().filter(
      (p) =>
        (porte === "qualquer" || p.porte === porte) &&
        (regiao === "qualquer" || p.region === regiao) &&
        p.population >= 5000,
    );
    const linhas = pool
      .map((p) => ({ p, s: getCityCoreSignals(p.id) }))
      .filter((r): r is { p: CityPulse; s: NonNullable<ReturnType<typeof getCityCoreSignals>> } => r.s != null);
    if (linhas.length === 0) return [];
    const norm: Record<string, { min: number; max: number; med: number }> = {};
    for (const c of ativos) {
      const vals = linhas.map((r) => c.valor(r.p, r.s));
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      norm[c.key] = { min, max, med: mediana(vals) };
    }
    const pesoTotal = ativos.reduce((s, c) => s + (pesos[c.key] ?? 0), 0);
    return linhas
      .map((r) => {
        let soma = 0;
        const motivos = ativos.map((c) => {
          const { min, max, med } = norm[c.key]!;
          const v = c.valor(r.p, r.s);
          const n = max > min ? (v - min) / (max - min) : 0.5;
          const w = pesos[c.key] ?? 0;
          soma += w * n;
          return { label: c.label, texto: c.texto(r.p, r.s), contrib: w * n, mediana: med, valor: v };
        });
        motivos.sort((a, b) => b.contrib - a.contrib);
        return {
          pulse: r.p,
          match: pesoTotal > 0 ? Math.round((soma / pesoTotal) * 100) : 0,
          motivos: motivos.slice(0, 3).map((m) => ({ label: m.label, texto: m.texto, contrib: m.contrib })),
        };
      })
      .sort((a, b) => b.match - a.match || b.pulse.population - a.pulse.population)
      .slice(0, 12);
  }, [porte, regiao, pesos]);

  const primeiro = resultados[0];

  return (
    <section>
      <h2 className="font-display text-xl tracking-tight">Encontre sua cidade ideal</h2>
      <p className="mt-1 mb-3 text-xs leading-relaxed text-muted-foreground">
        Diga o que importa e o sistema ranqueia os municípios — sempre mostrando o porquê de cada posição.
      </p>
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-xs tracking-wide text-muted-foreground uppercase">Porte</span>
              <select
                value={porte}
                onChange={(e) => setPorte(e.target.value as (typeof PORTES)[number])}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {PORTES.map((p) => (
                  <option key={p} value={p}>
                    {p === "qualquer" ? "Qualquer porte" : p}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs tracking-wide text-muted-foreground uppercase">Região</span>
              <select
                value={regiao}
                onChange={(e) => setRegiao(e.target.value as (typeof REGIOES)[number])}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {REGIOES.map((r) => (
                  <option key={r} value={r}>
                    {r === "qualquer" ? "Qualquer região" : REGION_NAMES[r]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="space-y-2">
            {CRITERIOS.map((c) => (
              <div key={c.key} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.hint}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {(
                    [
                      [0, "Indiferente"],
                      [1, "Importa"],
                      [2, "Essencial"],
                    ] as [Peso, string][]
                  ).map(([v, label]) => (
                    <Button
                      key={v}
                      variant={(pesos[c.key] ?? 0) === v ? "default" : "outline"}
                      size="sm"
                      className="h-7 px-2.5 text-xs"
                      onClick={() => setPesos((p) => ({ ...p, [c.key]: v }))}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {resultados.length > 0 && primeiro ? (
        <div className="mt-4 space-y-4">
          <Card className="border-success/40">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                Por que {primeiro.pulse.name} ficou em primeiro?
                <Badge variant="success">{primeiro.match}% compatível</Badge>
              </CardTitle>
              <CardDescription>
                {primeiro.pulse.name} ({primeiro.pulse.uf}) · {formatInt(primeiro.pulse.population)} hab. ·{" "}
                {HEALTH_STATUS[primeiro.pulse.status].label}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
                {primeiro.motivos.map((m) => (
                  <li key={m.label}>
                    <strong>{m.label}:</strong> {m.texto}.
                  </li>
                ))}
              </ul>
              <Button size="sm" className="mt-3" onClick={() => onSelectCity(primeiro.pulse.id)}>
                Abrir raio-x de {primeiro.pulse.name}
              </Button>
            </CardContent>
          </Card>
          <ul className="space-y-2">
            {resultados.slice(1).map((r, i) => (
              <li key={r.pulse.id}>
                <button
                  type="button"
                  onClick={() => onSelectCity(r.pulse.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg bg-card px-4 py-3 text-left shadow-[var(--shadow-border)] transition-[box-shadow,transform] duration-150 hover:shadow-[var(--shadow-border-hover)] active:scale-[0.99]"
                >
                  <span className="min-w-0">
                    <span className="flex min-w-0 items-baseline gap-2">
                      <span className="text-muted-foreground tabular">{i + 2}.</span>
                      <span className="truncate font-medium">{r.pulse.name}</span>
                      <span className="text-muted-foreground">{r.pulse.uf}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {r.motivos
                        .slice(0, 2)
                        .map((m) => m.texto)
                        .join(" · ")}
                    </span>
                  </span>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-medium tabular")}>
                    {r.match}%
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Marque ao menos um critério como "Importa" ou "Essencial" para ver o ranking.
        </p>
      )}
    </section>
  );
}
