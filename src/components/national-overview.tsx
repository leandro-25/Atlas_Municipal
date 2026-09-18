import { useEffect, useMemo, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CityFinder } from "@/components/city-finder";
import { Kpi } from "@/components/kpi";
import { HEALTH_STATUS } from "@/data/health-meta";
import { formatInt, formatPct } from "@/data/format";
import {
  getExplorerData,
  getUfPulses,
  queryPulses,
  type BrazilOverview,
  type CityPulse,
  type HealthStatus,
  type UfOverview,
} from "@/data/generate";
import { REGION_ORDER, REGION_NAMES, type RegionCode } from "@/data/ufs";
import { getWatchlist, removeWatched, type WatchedCity } from "@/lib/watchlist";
import { cn } from "@/lib/utils";

type StatusFilter = "todas" | HealthStatus | "alerta";
type SortKey = "pop" | "saude" | "morar";

export function NationalOverview({
  overview,
  uf,
  onSelectUf,
  onSelectCity,
}: {
  overview: BrazilOverview;
  uf?: string;
  onSelectUf: (sigla: string) => void;
  onSelectCity: (id: number) => void;
}) {
  const selected = overview.ufs.find((u) => u.sigla === uf);
  const maxUfPop = overview.ufs[0]?.population ?? 1;
  const explorer = useMemo(() => getExplorerData(), []);
  const alerta = explorer.counts.risco + explorer.counts.declinio;

  return (
    <div className="space-y-8">
      <header className="enter max-w-2xl">
        <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Observatório</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
          A saúde de todas as cidades do Brasil.
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Descubra se um município está prosperando, estagnado ou em risco — se vive do próprio ISS ou só de
          transferência, se há emprego formal, e como fica daqui a dez anos. Feito para quem não quer se mudar para
          uma cidade que está falindo.
        </p>
      </header>

      <div className="enter enter-1 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Municípios" value={formatInt(overview.municipios)} />
        <Kpi label="População 2024" value={formatInt(overview.population)} hint="Estimativa IBGE" />
        <Kpi
          label="Prosperando"
          value={formatInt(explorer.counts.prosperando)}
          hint={formatPct((explorer.counts.prosperando / overview.municipios) * 100, 0)}
          tone="good"
        />
        <Kpi
          label="Em risco ou declínio"
          value={formatInt(alerta)}
          hint={formatPct((alerta / overview.municipios) * 100, 0)}
          tone="bad"
        />
      </div>

      {selected ? (
        <UfPanel uf={selected} onSelectCity={onSelectCity} onClear={() => onSelectUf("")} />
      ) : (
        <div className="enter enter-2 space-y-8">
          <ExplorerLists
            liveable={explorer.liveable}
            healthy={explorer.healthy}
            alert={explorer.alert}
            onSelectCity={onSelectCity}
          />
          <ExplorerFilters onSelectCity={onSelectCity} />
          <Watchlist onSelectCity={onSelectCity} />
          <CityFinder onSelectCity={onSelectCity} />
          <section>
            <h2 className="mb-4 font-display text-xl tracking-tight">Por unidade da federação</h2>
            <div className="space-y-6">
              {REGION_ORDER.map((region) => (
                <RegionBlock
                  key={region}
                  region={region}
                  ufs={overview.ufs.filter((u) => u.region === region)}
                  maxPop={maxUfPop}
                  onSelectUf={onSelectUf}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Watchlist({ onSelectCity }: { onSelectCity: (id: number) => void }) {
  // Lista vazia no servidor para hidratar igual; carrega após montar.
  const [list, setList] = useState<WatchedCity[]>([]);
  useEffect(() => {
    const refresh = () => setList(getWatchlist());
    refresh();
    window.addEventListener("atlas:watchlist", refresh);
    return () => window.removeEventListener("atlas:watchlist", refresh);
  }, []);
  if (list.length === 0) return null;
  return (
    <section>
      <h2 className="font-display text-xl tracking-tight">Acompanhadas por você</h2>
      <p className="mt-1 mb-3 text-xs leading-relaxed text-muted-foreground">
        Atalhos neste navegador. Ao abrir cada uma, o cartão "Mudanças recentes" mostra o que mudou.
      </p>
      <ul className="flex flex-wrap gap-2">
        {list.map((w) => (
          <li key={w.id} className="inline-flex items-center gap-1 rounded-full bg-card py-1 pr-1 pl-3 shadow-[var(--shadow-border)]">
            <button type="button" onClick={() => onSelectCity(w.id)} className="text-sm font-medium">
              {w.name} <span className="text-muted-foreground">{w.uf}</span>
            </button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 rounded-full p-0"
              title={`Deixar de acompanhar ${w.name}`}
              onClick={() => {
                removeWatched(w.id);
                setList(getWatchlist());
              }}
            >
              <X className="size-3" />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ExplorerLists({
  liveable,
  healthy,
  alert,
  onSelectCity,
}: {
  liveable: CityPulse[];
  healthy: CityPulse[];
  alert: CityPulse[];
  onSelectCity: (id: number) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <PulseColumn
        title="Melhores para morar"
        hint="Emprego, independência e custo — cidades com 20 mil hab. ou mais."
        rows={liveable}
        onSelect={onSelectCity}
        metric="morar"
      />
      <PulseColumn
        title="Mais saudáveis"
        hint="Quem gera receita própria e não depende só de FPM."
        rows={healthy}
        onSelect={onSelectCity}
        metric="saude"
      />
      <PulseColumn
        title="Em alerta"
        hint="Declínio, folha alta ou economia que gira na prefeitura."
        rows={alert}
        onSelect={onSelectCity}
        metric="saude"
      />
    </div>
  );
}

function PulseColumn({
  title,
  hint,
  rows,
  onSelect,
  metric,
}: {
  title: string;
  hint: string;
  rows: CityPulse[];
  onSelect: (id: number) => void;
  metric: "saude" | "morar";
}) {
  return (
    <section>
      <h2 className="font-display text-xl tracking-tight">{title}</h2>
      <p className="mt-1 mb-3 text-xs leading-relaxed text-muted-foreground">{hint}</p>
      <ul className="space-y-2">
        {rows.map((p) => (
          <li key={p.id}>
            <PulseButton pulse={p} onSelect={onSelect} metric={metric} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function PulseButton({
  pulse,
  onSelect,
  metric,
}: {
  pulse: CityPulse;
  onSelect: (id: number) => void;
  metric?: "saude" | "morar";
}) {
  const meta = HEALTH_STATUS[pulse.status];
  const score = metric === "morar" ? pulse.morarScore : pulse.score;
  return (
    <button
      type="button"
      onClick={() => onSelect(pulse.id)}
      className="flex min-h-14 w-full items-center justify-between gap-3 rounded-lg bg-card px-4 py-3 text-left shadow-[var(--shadow-border)] transition-[box-shadow,transform] duration-150 hover:shadow-[var(--shadow-border-hover)] active:scale-[0.99]"
    >
      <span className="min-w-0">
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="truncate font-medium">{pulse.name}</span>
          <span className="text-muted-foreground">{pulse.uf}</span>
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{meta.label}</span>
      </span>
      <span className="tabular text-sm">{score}</span>
    </button>
  );
}

function ExplorerFilters({ onSelectCity }: { onSelectCity: (id: number) => void }) {
  const [status, setStatus] = useState<StatusFilter>("todas");
  const [independente, setIndependente] = useState(false);
  const [minPop, setMinPop] = useState(0);
  const [sort, setSort] = useState<SortKey>("saude");

  const result = useMemo(
    () =>
      queryPulses({
        status: status === "todas" ? undefined : status,
        independente,
        minPop,
        sort,
        limit: 40,
      }),
    [status, independente, minPop, sort],
  );

  return (
    <section>
      <h2 className="mb-1 font-display text-xl tracking-tight">Explorar por filtro</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Filtre quem gera a própria receita, quem está em risco, ou cidades acima de um porte.
      </p>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["todas", "Todas"],
            ["prosperando", "Prosperando"],
            ["estavel", "Estáveis"],
            ["estagnada", "Estagnadas"],
            ["alerta", "Em alerta"],
          ] as const
        ).map(([key, label]) => (
          <Chip key={key} active={status === key} onClick={() => setStatus(key)}>
            {label}
          </Chip>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Chip active={independente} onClick={() => setIndependente((v) => !v)}>
          Receita própria ≥ 28%
        </Chip>
        {(
          [
            [0, "Qualquer porte"],
            [20000, "≥ 20 mil"],
            [50000, "≥ 50 mil"],
            [100000, "≥ 100 mil"],
          ] as const
        ).map(([n, label]) => (
          <Chip key={n} active={minPop === n} onClick={() => setMinPop(n)}>
            {label}
          </Chip>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Chip active={sort === "saude"} onClick={() => setSort("saude")}>
          Ordenar por saúde
        </Chip>
        <Chip active={sort === "morar"} onClick={() => setSort("morar")}>
          Ordenar para morar
        </Chip>
        <Chip active={sort === "pop"} onClick={() => setSort("pop")}>
          Ordenar por população
        </Chip>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {result.total === 1 ? "1 município" : `${formatInt(result.total)} municípios`} · mostrando {result.rows.length}
      </p>
      <ul className="mt-3 divide-y divide-border rounded-lg bg-card shadow-[var(--shadow-border)]">
        {result.rows.map((p) => (
          <li key={p.id}>
            <PulseRow pulse={p} onSelect={onSelectCity} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-9 rounded-full px-3 text-sm transition-[background-color,color] duration-150",
        active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

function PulseRow({ pulse, onSelect }: { pulse: CityPulse; onSelect: (id: number) => void }) {
  const meta = HEALTH_STATUS[pulse.status];
  return (
    <button
      type="button"
      onClick={() => onSelect(pulse.id)}
      className="flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-accent/60"
    >
      <span className="min-w-0 flex-1 truncate">
        {pulse.name} <span className="text-muted-foreground">{pulse.uf}</span>
      </span>
      <Badge variant={meta.variant} className="hidden sm:inline-flex">
        {meta.label}
      </Badge>
      <span className="w-10 text-right tabular text-sm">{pulse.score}</span>
      <span className="hidden w-24 text-right tabular text-sm text-muted-foreground sm:block">
        {formatInt(pulse.population)}
      </span>
    </button>
  );
}

function RegionBlock({
  region,
  ufs,
  maxPop,
  onSelectUf,
}: {
  region: RegionCode;
  ufs: UfOverview[];
  maxPop: number;
  onSelectUf: (sigla: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs tracking-wide text-muted-foreground uppercase">{REGION_NAMES[region]}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ufs.map((u) => (
          <button
            key={u.sigla}
            type="button"
            onClick={() => onSelectUf(u.sigla)}
            className="rounded-lg bg-card p-4 text-left shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium">{u.nome}</span>
              <span className="text-xs text-muted-foreground">{u.sigla}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {u.municipios === 1 ? "1 município" : `${formatInt(u.municipios)} municípios`} · {formatInt(u.population)}{" "}
              hab.
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary/80"
                style={{ width: `${Math.max((u.population / maxPop) * 100, 4)}%` }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function UfPanel({
  uf,
  onSelectCity,
  onClear,
}: {
  uf: UfOverview;
  onSelectCity: (id: number) => void;
  onClear: () => void;
}) {
  const [sort, setSort] = useState<SortKey>("pop");
  const list = useMemo(() => {
    const rows = [...getUfPulses(uf.sigla)];
    if (sort === "saude") rows.sort((a, b) => b.score - a.score || b.population - a.population);
    else if (sort === "morar") rows.sort((a, b) => b.morarScore - a.morarScore || b.population - a.population);
    else rows.sort((a, b) => b.population - a.population);
    return rows;
  }, [uf.sigla, sort]);
  const max = list[0]?.population ?? 1;

  return (
    <Card className="enter">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-2xl">
              {uf.nome} <span className="text-muted-foreground">{uf.sigla}</span>
            </CardTitle>
            <CardDescription>
              {uf.municipios === 1 ? "1 município" : `${formatInt(uf.municipios)} municípios`} · {formatInt(uf.population)}{" "}
              habitantes · capital {uf.capitalName}
            </CardDescription>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Ver o Brasil
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip active={sort === "pop"} onClick={() => setSort("pop")}>
            População
          </Chip>
          <Chip active={sort === "saude"} onClick={() => setSort("saude")}>
            Saúde
          </Chip>
          <Chip active={sort === "morar"} onClick={() => setSort("morar")}>
            Morar
          </Chip>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {list.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onSelectCity(m.id)}
                className="flex min-h-12 w-full items-center gap-3 py-2.5 text-left transition-colors duration-150 hover:bg-accent/60"
              >
                <span className="min-w-0 flex-1 truncate">{m.name}</span>
                <Badge variant={HEALTH_STATUS[m.status].variant} className="hidden shrink-0 sm:inline-flex">
                  {HEALTH_STATUS[m.status].label}
                </Badge>
                <span className="hidden w-8 text-right tabular text-xs text-muted-foreground sm:block">{m.score}</span>
                <span className="hidden w-28 sm:block">
                  <span className="block h-1 overflow-hidden rounded-full bg-secondary">
                    <span
                      className="block h-full rounded-full bg-primary/70"
                      style={{ width: `${Math.max((m.population / max) * 100, 2)}%` }}
                    />
                  </span>
                </span>
                <span className="w-24 text-right tabular text-sm text-muted-foreground">{formatInt(m.population)}</span>
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
