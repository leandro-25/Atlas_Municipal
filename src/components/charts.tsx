import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatBRL, formatCompact, formatInt, formatPct } from "@/data/format";
import type { AgeBand, NamedValue, YearPoint } from "@/data/generate";

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--color-popover-foreground)",
};

const TICK = { fill: "var(--color-muted-foreground)", fontSize: 11 };
const GRID = "var(--color-border)";

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-muted-foreground)",
  "var(--color-chart-2)",
  "var(--color-chart-1)",
  "var(--color-chart-4)",
];

export function FinanceChart({
  receita,
  despesa,
  receitaProj,
  despesaProj,
}: {
  receita: YearPoint[];
  despesa: YearPoint[];
  receitaProj?: YearPoint[];
  despesaProj?: YearPoint[];
}) {
  const data = receita.map((r, i) => ({
    year: r.year,
    receita: r.value,
    despesa: despesa[i]?.value ?? 0,
    receitaProj: undefined as number | undefined,
    despesaProj: undefined as number | undefined,
  }));
  // Emenda a projeção a partir do último ponto observado para a linha não quebrar.
  if (receitaProj && receitaProj.length > 0 && despesaProj && despesaProj.length > 0) {
    const last = data[data.length - 1];
    if (last) {
      last.receitaProj = last.receita;
      last.despesaProj = last.despesa;
    }
    for (let i = 0; i < receitaProj.length; i++) {
      data.push({
        year: receitaProj[i]!.year,
        receita: undefined as unknown as number,
        despesa: undefined as unknown as number,
        receitaProj: receitaProj[i]!.value,
        despesaProj: despesaProj[i]?.value ?? 0,
      });
    }
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="year" tick={TICK} axisLine={false} tickLine={false} />
          <YAxis
            tick={TICK}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => formatCompact(v)}
            width={52}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => formatBRL(Number(value ?? 0))}
            labelFormatter={(l) => String(l)}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-muted-foreground)" }} />
          <Line type="monotone" dataKey="receita" name="Receita" stroke="var(--color-chart-1)" strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="despesa" name="Despesa" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} connectNulls />
          {receitaProj && receitaProj.length > 0 ? (
            <Line type="monotone" dataKey="receitaProj" name="Receita (projeção)" stroke="var(--color-chart-1)" strokeDasharray="5 4" strokeWidth={2} dot={false} connectNulls opacity={0.75} />
          ) : null}
          {despesaProj && despesaProj.length > 0 ? (
            <Line type="monotone" dataKey="despesaProj" name="Despesa (projeção)" stroke="var(--color-chart-2)" strokeDasharray="5 4" strokeWidth={2} dot={false} connectNulls opacity={0.75} />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OriginPie({ data }: { data: NamedValue[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={56}
            outerRadius={88}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatBRL(Number(value ?? 0))} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ExpenseBars({ data }: { data: NamedValue[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={GRID} horizontal={false} />
          <XAxis type="number" tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatCompact(v)} />
          <YAxis type="category" dataKey="label" width={118} tick={{ fill: "var(--color-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatBRL(Number(value ?? 0))} />
          <Bar dataKey="value" name="Despesa" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ShareBars({ data, asPercent = true }: { data: NamedValue[]; asPercent?: boolean }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={GRID} horizontal={false} />
          <XAxis
            type="number"
            tick={TICK}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => (asPercent ? formatPct(v * 100, 0) : formatCompact(v))}
            domain={asPercent ? [0, 1] : undefined}
          />
          <YAxis type="category" dataKey="label" width={118} tick={{ fill: "var(--color-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => (asPercent ? formatPct(Number(value ?? 0) * 100, 1) : formatInt(Number(value ?? 0)))}
          />
          <Bar dataKey="value" name="Participação" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AgeChart({ data }: { data: AgeBand[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="faixa" tick={TICK} axisLine={false} tickLine={false} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatCompact(v)} width={44} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [formatInt(Number(value ?? 0)), String(name)]}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-muted-foreground)" }} />
          <Bar dataKey="homens" name="Homens" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="mulheres" name="Mulheres" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProjectionChart({
  data,
  observadoAte = 2024,
}: {
  data: { year: number; pop: number; kind: "hist" | "forecast" }[];
  observadoAte?: number;
}) {
  const hist = data.filter((d) => d.year <= observadoAte);
  const lastHist = hist[hist.length - 1];
  const forecast = data.filter((d) => d.year > observadoAte);
  const proj = lastHist ? [{ year: lastHist.year, pop: lastHist.pop }, ...forecast] : [...forecast];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={[]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="popFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="year" tick={TICK} axisLine={false} tickLine={false} allowDuplicatedCategory={false} />
          <YAxis
            tick={TICK}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => formatCompact(v)}
            width={48}
          />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatInt(Number(value ?? 0))} />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-muted-foreground)" }} />
          <Area type="monotone" data={hist} dataKey="pop" name="Observado" stroke="var(--color-chart-1)" fill="url(#popFill)" strokeWidth={2} dot={false} />
          <Line type="monotone" data={proj} dataKey="pop" name="Projeção" stroke="var(--color-chart-2)" strokeDasharray="5 4" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function JobProjectionChart({
  data,
  observadoAte = 2024,
}: {
  data: { year: number; formais: number; kind: "hist" | "forecast" }[];
  observadoAte?: number;
}) {
  const hist = data.filter((d) => d.year <= observadoAte);
  const lastHist = hist[hist.length - 1];
  const forecast = data.filter((d) => d.year > observadoAte);
  const proj = lastHist ? [{ year: lastHist.year, formais: lastHist.formais }, ...forecast] : [...forecast];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={[]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="jobFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="year" tick={TICK} axisLine={false} tickLine={false} allowDuplicatedCategory={false} />
          <YAxis
            tick={TICK}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => formatCompact(v)}
            width={48}
          />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatInt(Number(value ?? 0))} />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-muted-foreground)" }} />
          <Area type="monotone" data={hist} dataKey="formais" name="Formais observados" stroke="var(--color-chart-1)" fill="url(#jobFill)" strokeWidth={2} dot={false} />
          <Line type="monotone" data={proj} dataKey="formais" name="Projeção" stroke="var(--color-chart-2)" strokeDasharray="5 4" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
