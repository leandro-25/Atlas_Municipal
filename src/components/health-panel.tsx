import { useMemo } from "react";
import { AlertTriangle, Check, Home, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreBar } from "@/components/score-bar";
import { HEALTH_STATUS } from "@/data/health-meta";
import { formatInt, formatPct } from "@/data/format";
import { getNationalRank, getStateRank, type CityProfile } from "@/data/generate";
import { cn } from "@/lib/utils";

export function HealthPanel({ city, sinais }: { city: CityProfile; sinais?: string[] }) {
  const h = city.saude;
  const meta = HEALTH_STATUS[h.status];
  const national = useMemo(() => getNationalRank(city.id), [city.id]);
  const state = useMemo(() => getStateRank(city.id, city.uf), [city.id, city.uf]);
  const dep = city.dependencia;
  const scoreTone =
    h.status === "prosperando"
      ? "good"
      : h.status === "estavel"
        ? "default"
        : h.status === "estagnada"
          ? "warn"
          : "bad";

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-6 p-5 lg:grid-cols-[minmax(0,220px)_1fr]">
          <div>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">Índice de saúde</p>
            <p
              className={cn(
                "mt-1 font-display text-6xl leading-none tracking-tight tabular",
                scoreTone === "good" && "text-success",
                scoreTone === "warn" && "text-warning",
                scoreTone === "bad" && "text-destructive",
              )}
            >
              {h.score}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">de 100</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full rounded-full bg-primary",
                  scoreTone === "good" && "bg-success",
                  scoreTone === "warn" && "bg-warning",
                  scoreTone === "bad" && "bg-destructive",
                )}
                style={{ width: `${h.score}%` }}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant={meta.variant}>{meta.label}</Badge>
              <Badge variant="outline">{h.morar.veredito}</Badge>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {state.uf}ª de {formatInt(state.ufTotal)} em {city.uf}
              {national.brTotal > 0 ? ` · ${national.br}ª no Brasil` : null}
            </p>
          </div>
          <div>
            <h2 className="font-display text-xl tracking-tight">{h.titulo}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{h.resumo}</p>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Confiança {h.confianca.nivel}: {h.confianca.texto}
            </p>
            <div className="mt-4 rounded-lg bg-secondary/70 p-4">
              <p className="flex items-center gap-2 text-xs tracking-wide text-muted-foreground uppercase">
                <Home className="size-3.5" />
                Moradia e trabalho — leitura
              </p>
              <p className="mt-1 text-sm font-medium">{h.morar.veredito}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{h.morar.texto}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Trajetória</CardTitle>
            <CardDescription>
              {h.trajetoria.fonte === "oficial" ? "Medida na série fiscal" : "Projetada pelo modelo"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-display text-4xl tabular tracking-tight">
              {h.trajetoria.score > 0 ? "+" : ""}
              {h.trajetoria.score}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{h.trajetoria.rotulo}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-muted-foreground">
              {h.trajetoria.detalhes.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Resiliência</CardTitle>
            <CardDescription>Suporta uma crise?</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-display text-4xl tabular tracking-tight">{h.resiliencia.score}</p>
            <p className="mt-1 text-sm text-muted-foreground">de 100</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-muted-foreground">
              {h.resiliencia.detalhes.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Potencial</CardTitle>
            <CardDescription>Condições para crescer</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-display text-4xl tabular tracking-tight">{h.potencial.score}</p>
            <p className="mt-1 text-sm text-muted-foreground">de 100</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-muted-foreground">
              {h.potencial.detalhes.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {h.motores.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>O que puxa a cidade</CardTitle>
            <CardDescription>Motores identificados nas evidências, do mais forte ao mais fraco.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {h.motores.map((m, i) => (
                <li key={m} className="flex gap-3 text-sm leading-relaxed">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-xs font-medium text-success">
                    {i + 1}
                  </span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {sinais && sinais.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Mudanças recentes</CardTitle>
            <CardDescription>Quebras e acelerações detectadas só em dado oficial — leitura do ocorrido, não projeção.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
              {sinais.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sete eixos, de 0 a 100</CardTitle>
            <CardDescription>Pontos fortes e fracos lado a lado, com o indicador observado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {h.dimensions.map((d) => (
              <ScoreBar key={d.key} label={d.label} value={d.score} hint={d.hint} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leituras por indicador</CardTitle>
            <CardDescription>O que foi observado, em que direção pesa e com que limite.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {h.flags.map((f) => (
                <li key={f.text} className="flex gap-3 text-sm leading-relaxed">
                  <span
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                      f.tone === "good" && "bg-success/15 text-success",
                      f.tone === "warn" && "bg-warning/15 text-warning",
                      f.tone === "bad" && "bg-destructive/15 text-destructive",
                    )}
                  >
                    {f.tone === "good" ? (
                      <Check className="size-3" />
                    ) : f.tone === "warn" ? (
                      <AlertTriangle className="size-3" />
                    ) : (
                      <Minus className="size-3" />
                    )}
                  </span>
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 space-y-3 border-t border-border pt-4">
              <p className="text-xs tracking-wide text-muted-foreground uppercase">De onde vem o caixa</p>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-secondary">
                <div className="bg-primary" style={{ width: `${dep.propriaPct * 100}%` }} />
                <div className="flex-1 bg-chart-2" />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Própria {formatPct(dep.propriaPct * 100, 0)}</span>
                <span>Transferências {formatPct(dep.transferenciaPct * 100, 0)}</span>
              </div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">Quem paga a conta própria</p>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-secondary">
                <div className="bg-success" style={{ width: `${dep.empresaShare * 100}%` }} />
                <div className="flex-1 bg-warning" />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Empresas (ISS) {formatPct(dep.empresaShare * 100, 0)}</span>
                <span>Morador (IPTU/taxas) {formatPct(dep.familiaShare * 100, 0)}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Folha consome {formatPct(dep.folhaPct * 100, 0)} da receita. Classificação:{" "}
                {dep.classificacao === "autonoma"
                  ? "autônoma"
                  : dep.classificacao === "mista"
                    ? "mista"
                    : "dependente de fora"}
                .
              </p>
              {dep.armadilhaConsumo ? (
                <p className="text-sm text-warning">
                  Hipótese em observação: maior carga direta sobre moradores + cesta elevada = pressão sobre o consumo local no cenário central.
                </p>
              ) : null}
              {dep.riscoEmpresa ? (
                <p className="text-sm text-destructive">
                  ISS em patamar elevado na estimativa — o modelo assume retorno decrescente de novas altas.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Futuro possível — cenário central até 2035</CardTitle>
          <CardDescription>Projeção com incerteza alta, não previsão. Pequenas mudanças alteram o resultado.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <OutlookBlock label="População" text={h.outlook.pop} />
          <OutlookBlock label="Emprego" text={h.outlook.emprego} />
          <OutlookBlock label="Finanças" text={h.outlook.fiscal} />
          <OutlookBlock label="Custo de vida" text={h.outlook.custo} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como ler esta análise</CardTitle>
          <CardDescription>Fato, estimativa e limite — separados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <div>
            <p className="text-xs tracking-wide text-foreground uppercase">Método</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {h.metodo.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs tracking-wide text-foreground uppercase">Limites</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {h.limites.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
          <p className="text-xs">
            Para decisão real (mudar de cidade, investir, abrir empresa): cruzar com RREO/SICONFI, eSocial/RAIS,
            Censo IBGE e visita local. Este painel serve para triagem e comparação, não como laudo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function OutlookBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-lg bg-secondary/60 p-4">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 text-sm leading-relaxed">{text}</p>
    </div>
  );
}
