import { ArrowLeftRight, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HEALTH_STATUS } from "@/data/health-meta";
import { formatBRL, formatIdhm, formatInt, formatPct } from "@/data/format";
import type { CityProfile } from "@/data/generate";
import { cn } from "@/lib/utils";

const rows: { key: string; label: string; a: (c: CityProfile) => string; better?: "high" | "low" }[] = [
  { key: "saude", label: "Saúde municipal", a: (c) => String(c.saude.score), better: "high" },
  { key: "traj", label: "Trajetória", a: (c) => `${c.saude.trajetoria.score > 0 ? "+" : ""}${c.saude.trajetoria.score}`, better: "high" },
  { key: "resil", label: "Resiliência", a: (c) => String(c.saude.resiliencia.score), better: "high" },
  { key: "pot", label: "Potencial", a: (c) => String(c.saude.potencial.score), better: "high" },
  { key: "morar", label: "Índice para morar", a: (c) => String(c.saude.morar.score), better: "high" },
  { key: "pop", label: "População", a: (c) => formatInt(c.population) },
  { key: "prop", label: "Receita própria", a: (c) => formatPct(c.dependencia.propriaPct * 100, 0), better: "high" },
  { key: "empresas", label: "Conta paga por empresas", a: (c) => formatPct(c.dependencia.empresaShare * 100, 0), better: "high" },
  { key: "dep", label: "Transferências", a: (c) => formatPct(c.dependencia.transferenciaPct * 100, 0), better: "low" },
  { key: "folha", label: "Folha / receita", a: (c) => formatPct(c.dependencia.folhaPct * 100, 0), better: "low" },
  { key: "formal", label: "Emprego formal", a: (c) => formatPct(c.empregos.taxaFormal * 100, 0), better: "high" },
  { key: "unemp", label: "Desemprego", a: (c) => formatPct(c.empregos.desemprego * 100, 1), better: "low" },
  { key: "pib", label: "PIB per capita", a: (c) => formatBRL(c.pibPerCapita), better: "high" },
  { key: "renda", label: "Renda média", a: (c) => formatBRL(c.empregos.rendaMedia), better: "high" },
  { key: "custo", label: "Custo de vida", a: (c) => String(c.custo.indice), better: "low" },
  { key: "idhm", label: "IDHM", a: (c) => formatIdhm(c.idhm), better: "high" },
  { key: "base", label: "Base econômica", a: (c) => c.baseEconomica },
  { key: "2035", label: "População 2035", a: (c) => formatInt(c.projecao.horizonte2035) },
];

function raw(c: CityProfile, key: string): number | null {
  switch (key) {
    case "saude":
      return c.saude.score;
    case "traj":
      return c.saude.trajetoria.score;
    case "resil":
      return c.saude.resiliencia.score;
    case "pot":
      return c.saude.potencial.score;
    case "morar":
      return c.saude.morar.score;
    case "pop":
      return c.population;
    case "prop":
      return c.dependencia.propriaPct;
    case "empresas":
      return c.dependencia.empresaShare;
    case "dep":
      return c.dependencia.transferenciaPct;
    case "folha":
      return c.dependencia.folhaPct;
    case "formal":
      return c.empregos.taxaFormal;
    case "unemp":
      return c.empregos.desemprego;
    case "pib":
      return c.pibPerCapita;
    case "renda":
      return c.empregos.rendaMedia;
    case "custo":
      return c.custo.indice;
    case "idhm":
      return c.idhm;
    case "2035":
      return c.projecao.horizonte2035;
    default:
      return null;
  }
}

export function CityCompare({
  city,
  peers,
  onClear,
  onRemove,
  onSwap,
}: {
  city: CityProfile;
  peers: CityProfile[];
  onClear: () => void;
  onRemove: (id: number) => void;
  onSwap: (id: number) => void;
}) {
  const all = [city, ...peers];
  return (
    <Card className="enter">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Comparar ({all.length} cidades)</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {all.map((c) => c.name).join(" × ")} · até 3 comparadas por vez
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="size-4" />
            Fechar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[36rem] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
              <th className="px-5 py-2 font-medium">Indicador</th>
              {all.map((c, i) => (
                <th key={c.id} className="px-5 py-2 font-medium">
                  <span className="inline-flex flex-wrap items-center gap-2">
                    {c.name}
                    <Badge variant={HEALTH_STATUS[c.saude.status].variant} className="align-middle">
                      {HEALTH_STATUS[c.saude.status].label}
                    </Badge>
                    {i > 0 ? (
                      <span className="inline-flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-xs"
                          title={`Tornar ${c.name} a cidade principal`}
                          onClick={() => onSwap(c.id)}
                        >
                          <ArrowLeftRight className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-xs"
                          title={`Remover ${c.name}`}
                          onClick={() => onRemove(c.id)}
                        >
                          <X className="size-3" />
                        </Button>
                      </span>
                    ) : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const vals = all.map((c) => raw(c, row.key));
              let best = -1;
              if (row.better) {
                let bestV: number | null = null;
                vals.forEach((v, i) => {
                  if (v == null) return;
                  if (bestV == null || (row.better === "high" ? v > bestV : v < bestV)) {
                    bestV = v;
                    best = i;
                  }
                });
                if (vals.filter((v) => v != null && v === bestV).length > 1) best = -1;
              }
              return (
                <tr key={row.key} className="border-b border-border last:border-0">
                  <td className="px-5 py-2.5 text-muted-foreground">{row.label}</td>
                  {all.map((c, i) => (
                    <td key={c.id} className={cn("px-5 py-2.5 tabular", i === best && "text-success")}>
                      {row.a(c)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
