import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  Car,
  Home,
  Landmark,
  Star,
  Stethoscope,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AgeChart,
  ExpenseBars,
  FinanceChart,
  JobProjectionChart,
  OriginPie,
  ProjectionChart,
  ShareBars,
} from "@/components/charts";
import { CityCompare } from "@/components/city-compare";
import { CitySearch } from "@/components/city-search";
import { FonteDados } from "@/components/fonte-dados";
import { HealthPanel } from "@/components/health-panel";
import { Kpi } from "@/components/kpi";
import { HEALTH_STATUS } from "@/data/health-meta";
import { formatBRL, formatBRLFull, formatIdhm, formatInt, formatPct, formatRate } from "@/data/format";
import type { CityProfile } from "@/data/generate";
import type { RealCaged, RealCagedSetor } from "@/lib/caged";
import type { RealIPCA } from "@/lib/inflacao";
import type { RealSerie } from "@/data/real";
import type { RealSaneamento } from "@/lib/saneamento";
import type { RealSaude } from "@/lib/saude";
import type { DeepState, RealState } from "@/data/use-real";
import { useRealIPCA } from "@/data/use-real";
import type {
  RealFuncoesPayload,
  RealPatrimonioPayload,
  RealPIBEntornoPayload,
  RealQualidadePayload,
  RealRGFPayload,
  RealRREOPayload,
} from "@/lib/siconfi";
import { cagr } from "@/data/real";
import { cn } from "@/lib/utils";
import { isWatched, toggleWatch } from "@/lib/watchlist";

export function CityDashboard({
  city,
  peers,
  real,
  funcoes,
  serie,
  patrimonio,
  rgf,
  qualidade,
  rreo,
  capitalReal,
  capitalName,
  ibgeReal,
  caged,
  cagedSetor,
  saneamento,
  saudeReal,
  baseReceita,
  onBack,
  onCompare,
  onClearCompare,
  onRemoveCompare,
  onSwap,
}: {
  city: CityProfile;
  peers?: CityProfile[];
  real?: RealState;
  funcoes?: DeepState<Exclude<RealFuncoesPayload, null>>;
  serie?: DeepState<RealSerie>;
  patrimonio?: DeepState<Exclude<RealPatrimonioPayload, null>>;
  rgf?: DeepState<Exclude<RealRGFPayload, null>>;
  qualidade?: DeepState<Exclude<RealQualidadePayload, null>>;
  rreo?: DeepState<Exclude<RealRREOPayload, null>>;
  capitalReal?: RealState;
  capitalName?: string;
  ibgeReal?: DeepState<Exclude<RealPIBEntornoPayload, null>>;
  caged?: DeepState<RealCaged>;
  cagedSetor?: DeepState<RealCagedSetor>;
  saneamento?: DeepState<RealSaneamento>;
  saudeReal?: DeepState<RealSaude>;
  baseReceita?: number;
  onBack: () => void;
  onCompare: (id: number) => void;
  onClearCompare: () => void;
  onRemoveCompare: (id: number) => void;
  onSwap: (id: number) => void;
}) {
  const status = HEALTH_STATUS[city.saude.status];
  const totalEmp = city.empresas.reduce((s, e) => s + e.count, 0);
  const resultadoPos = city.kpis.resultado >= 0;
  // Camada 2: pontos oficiais da série substituem os estimados ano a ano.
  const serieReal = serie?.status === "ready" ? serie.data : undefined;
  const observadoAtePop = useMemo(() => {
    let m = 2024;
    for (const a of serieReal?.anos ?? []) {
      if (a.populacao > 0 && a.ano > m && a.ano <= 2026) m = a.ano;
    }
    return m;
  }, [serieReal]);
  const funcoesReady = funcoes?.status === "ready";
  const receitaMerged = useMemo(
    () =>
      city.receitaSeries.map((p) => {
        const f = serieReal?.anos.find((a) => a.ano === p.year);
        return f ? { ...p, value: f.receita } : p;
      }),
    [city, serieReal],
  );
  const despesaMerged = useMemo(
    () =>
      city.despesaSeries.map((p) => {
        const f = serieReal?.anos.find((a) => a.ano === p.year);
        return f ? { ...p, value: f.despesa } : p;
      }),
    [city, serieReal],
  );
  // Projeção 2026–2035 pelo CAGR do período oficial (ou da série estimada).
  // Cenário central, não previsão — a taxa aparece escrita no cartão.
  const projecaoFiscal = useMemo(() => {
    const recVals =
      serieReal && serieReal.anos.length >= 2
        ? serieReal.anos.map((a) => a.receita)
        : city.receitaSeries.slice(-6).map((p) => p.value);
    const desVals =
      serieReal && serieReal.anos.length >= 2
        ? serieReal.anos.map((a) => a.despesa)
        : city.despesaSeries.slice(-6).map((p) => p.value);
    const gRec = cagr(recVals) ?? 0.06;
    const gDes = cagr(desVals) ?? 0.06;
    const baseRec = receitaMerged[receitaMerged.length - 1]?.value ?? 0;
    const baseDes = despesaMerged[despesaMerged.length - 1]?.value ?? 0;
    const receitaProj = [];
    const despesaProj = [];
    for (let i = 1; i <= 10; i++) {
      receitaProj.push({ year: 2025 + i, value: baseRec * Math.pow(1 + gRec, i) });
      despesaProj.push({ year: 2025 + i, value: baseDes * Math.pow(1 + gDes, i) });
    }
    return {
      receitaProj,
      despesaProj,
      gRec,
      gDes,
      oficial: Boolean(serieReal && serieReal.anos.length >= 2),
    };
  }, [city, serieReal, receitaMerged, despesaMerged]);
  const realRigidez = real?.status === "ready" ? real.data : undefined;
  const patri = patrimonio?.status === "ready" ? patrimonio.data.patrimonio : undefined;
  const rgfData = rgf?.status === "ready" ? rgf.data : undefined;
  const rreoData = rreo?.status === "ready" ? rreo.data : undefined;
  const capitalData = capitalReal?.status === "ready" ? capitalReal.data : undefined;
  const ibgeData = ibgeReal?.status === "ready" ? ibgeReal.data : undefined;
  const cagedData = caged?.status === "ready" ? caged.data : undefined;
  // Inicializa desligado para hidratar igual ao servidor; sincroniza após montar.
  const [watching, setWatching] = useState(false);
  useEffect(() => {
    setWatching(isWatched(city.id));
  }, [city.id]);
  const sanData = saneamento?.status === "ready" ? saneamento.data : undefined;
  const saudeData = saudeReal?.status === "ready" ? saudeReal.data : undefined;
  const ipca = useRealIPCA();
  const ipcaData = ipca.status === "ready" ? ipca.data : undefined;
  // Orçamento 2035 a partir da projeção fiscal (receita/despesa 2026–2035).
  const orcamento2035 = useMemo(() => {
    const rec35 = projecaoFiscal.receitaProj[projecaoFiscal.receitaProj.length - 1]?.value ?? 0;
    const des35 = projecaoFiscal.despesaProj[projecaoFiscal.despesaProj.length - 1]?.value ?? 0;
    const baseRec = receitaMerged[receitaMerged.length - 1]?.value ?? 0;
    const baseDes = despesaMerged[despesaMerged.length - 1]?.value ?? 0;
    const gRec = projecaoFiscal.gRec;
    const gDes = projecaoFiscal.gDes;
    // Ano em que a despesa alcançaria a receita, mantidas as taxas.
    let breakEven: number | null = null;
    if (gDes > gRec && baseDes > 0 && baseRec > 0) {
      const n = Math.log(baseRec / baseDes) / Math.log((1 + gDes) / (1 + gRec));
      if (Number.isFinite(n) && n > 0 && n <= 30) breakEven = 2025 + Math.ceil(n);
    }
    return { rec35, des35, res35: rec35 - des35, breakEven };
  }, [projecaoFiscal, receitaMerged, despesaMerged]);
  // Detector de mudanças (§39 do plano): compara janelas recentes contra o passado,
  // só com dado oficial. Nada aqui é projeção — é leitura do que já aconteceu.
  const sinaisRecentes = useMemo(() => {
    const out: string[] = [];
    if (cagedData && cagedData.meses.length >= 6) {
      const last3 = cagedData.meses.slice(-3);
      const prev = cagedData.meses.slice(0, -3);
      const m3 = last3.reduce((s, m) => s + m.saldo, 0) / 3;
      const mp = prev.reduce((s, m) => s + m.saldo, 0) / Math.max(prev.length, 1);
      if (m3 >= 0 && mp < 0)
        out.push(`Vagas formais voltaram a crescer: média de +${formatInt(Math.round(m3))}/mês nos últimos 3 meses (CAGED).`);
      else if (m3 < 0 && mp >= 0)
        out.push(`Vagas formais inverteram para queda: média de ${formatInt(Math.round(m3))}/mês nos últimos 3 meses (CAGED).`);
      else if (m3 > Math.max(mp * 1.5, mp + 50))
        out.push(`Criação de vagas acelerou: +${formatInt(Math.round(m3))}/mês recentes contra +${formatInt(Math.round(mp))}/mês antes (CAGED).`);
      else if (m3 < Math.min(mp * 0.5, mp - 50))
        out.push(`Criação de vagas desacelerou: +${formatInt(Math.round(m3))}/mês recentes contra +${formatInt(Math.round(mp))}/mês antes (CAGED).`);
    }
    if (serieReal && serieReal.anos.length >= 2) {
      const first = serieReal.anos[0]!;
      const last = serieReal.anos[serieReal.anos.length - 1]!;
      const auto = last.propria / Math.max(last.receita, 1) - first.propria / Math.max(first.receita, 1);
      if (auto >= 0.02)
        out.push(`Autonomia fiscal subiu ${(auto * 100).toFixed(1).replace(".", ",")} p.p. em ${serieReal.anos.length} anos (DCA).`);
      else if (auto <= -0.02)
        out.push(`Autonomia fiscal caiu ${(Math.abs(auto) * 100).toFixed(1).replace(".", ",")} p.p. em ${serieReal.anos.length} anos (DCA).`);
      const folha = last.folhaRCL - first.folhaRCL;
      if (folha >= 0.03)
        out.push(`Folha passou de ${formatPct(first.folhaRCL * 100, 0)} para ${formatPct(last.folhaRCL * 100, 0)} da RCL (DCA).`);
      else if (folha <= -0.03)
        out.push(`Folha caiu de ${formatPct(first.folhaRCL * 100, 0)} para ${formatPct(last.folhaRCL * 100, 0)} da RCL (DCA).`);
    }
    if (rreoData) {
      const diff = rreoData.pctArrecadado - rreoData.fracaoAno * 100;
      if (diff >= 3)
        out.push(`Arrecadação ${rreoData.ano} acima do ritmo do ano (${formatPct(rreoData.pctArrecadado, 1)} arrecadado, ${formatPct(rreoData.fracaoAno * 100, 0)} decorrido).`);
      else if (diff <= -3)
        out.push(`Arrecadação ${rreoData.ano} abaixo do ritmo do ano (${formatPct(rreoData.pctArrecadado, 1)} arrecadado, ${formatPct(rreoData.fracaoAno * 100, 0)} decorrido).`);
    }
    return out.slice(0, 5);
  }, [cagedData, serieReal, rreoData]);
  // Banda 2035 calibrada na volatilidade oficial da receita.
  const banda2035 = useMemo(() => {
    if (!serieReal || serieReal.volatilidade == null || serieReal.anos.length < 3) return undefined;
    const last = serieReal.anos[serieReal.anos.length - 1]!;
    const g = cagr(serieReal.anos.map((a) => a.receita)) ?? 0;
    const v = serieReal.volatilidade;
    const n = Math.max(1, 2035 - last.ano);
    return {
      base: last.receita,
      baixa: last.receita * Math.pow(1 + g - v, n),
      alta: last.receita * Math.pow(1 + g + v, n),
    };
  }, [serieReal]);
  const depTone =
    city.dependencia.classificacao === "autonoma"
      ? "good"
      : city.dependencia.classificacao === "dependente"
        ? "bad"
        : "warn";

  return (
    <div className="space-y-6">
      <div className="enter flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={onBack}>
              <ArrowLeft className="size-4" />
              Voltar
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{city.name}</h1>
            <Button
              variant={watching ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              title={watching ? "Deixar de acompanhar" : "Acompanhar cidade"}
              onClick={() => setWatching(toggleWatch({ id: city.id, name: city.name, uf: city.uf }))}
            >
              <Star className={cn("size-3.5", watching && "fill-current")} />
              {watching ? "Acompanhando" : "Acompanhar"}
            </Button>
            <Badge variant="outline">{city.uf}</Badge>
            {city.isCapital ? <Badge>Capital</Badge> : null}
            <Badge variant={status.variant}>{status.label}</Badge>
            {real?.status === "ready" ? (
              <Badge variant="success">Fiscal oficial {real.data.ano}</Badge>
            ) : real?.status === "loading" || real?.status === "idle" ? (
              <Badge variant="outline">Buscando oficial…</Badge>
            ) : (
              <Badge variant="warning">Estimativa</Badge>
            )}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {city.ufName} · {city.regionName} · {city.porte} · IBGE {city.id}
          </p>
        </div>
        <div className="flex w-full flex-col items-stretch gap-3 sm:w-72 sm:items-end">
          <div className="text-left sm:text-right">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              População {real?.status === "ready" ? real.data.ano : 2024}
              {real?.status === "ready" ? " · oficial" : " · estimada"}
            </p>
            <p className="font-display text-3xl tabular tracking-tight">{formatInt(city.population)}</p>
          </div>
          <div className="w-full">
            <CitySearch onSelect={onCompare} placeholder="Comparar com até 3 cidades" />
          </div>
        </div>
      </div>

      {peers && peers.length > 0 ? (
        <CityCompare
          city={city}
          peers={peers}
          onClear={onClearCompare}
          onRemove={onRemoveCompare}
          onSwap={onSwap}
        />
      ) : null}

      <div className="enter enter-1 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi
          label={real?.status === "ready" ? `Receita ${real.data.ano} · oficial` : "Receita · estimada"}
          value={formatBRL(city.kpis.receita)}
          hint={`${formatBRL(city.kpis.receitaPerCapita)} / hab.`}
          icon={<Landmark className="size-4" />}
        />
        <Kpi
          label={real?.status === "ready" ? `Despesa ${real.data.ano} · oficial` : "Despesa · estimada"}
          value={formatBRL(city.kpis.despesa)}
          hint={
            resultadoPos
              ? real?.status === "ready"
                ? "Superávit oficial"
                : "Superávit estimado"
              : real?.status === "ready"
                ? "Déficit oficial"
                : "Déficit estimado"
          }
          icon={<Wallet className="size-4" />}
          tone={resultadoPos ? "good" : "bad"}
        />
        <Kpi
          label={real?.status === "ready" ? "Receita própria · oficial" : "Receita própria · estimada"}
          value={formatPct(city.dependencia.propriaPct * 100, 0)}
          hint={
            city.dependencia.classificacao === "autonoma"
              ? "Autônoma"
              : city.dependencia.classificacao === "mista"
                ? "Mista"
                : "Dependente de fora"
          }
          tone={depTone}
        />
        <Kpi
          label="Emprego formal · estimado"
          value={formatPct(city.empregos.taxaFormal * 100, 0)}
          hint={`${formatInt(city.empregos.formais)} vagas`}
          icon={<Briefcase className="size-4" />}
        />
        <Kpi
          label="Desemprego · estimado"
          value={formatPct(city.empregos.desemprego * 100, 1)}
          hint={`Renda média ${formatBRL(city.empregos.rendaMedia)}`}
          tone={city.empregos.desemprego > 0.12 ? "bad" : city.empregos.desemprego > 0.09 ? "warn" : "good"}
        />
        <Kpi
          label="PIB per capita · estimado"
          value={formatBRL(city.pibPerCapita)}
          hint={`IDHM ${formatIdhm(city.idhm)}`}
        />
      </div>

      <Tabs defaultValue="saude" className="enter enter-2">
        <div className="overflow-x-auto">
          <TabsList>
            <TabsTrigger value="saude">Saúde</TabsTrigger>
            <TabsTrigger value="financas">Finanças</TabsTrigger>
            <TabsTrigger value="economia">Economia</TabsTrigger>
            <TabsTrigger value="sociedade">Sociedade</TabsTrigger>
            <TabsTrigger value="futuro">Futuro</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="saude">
          <HealthPanel city={city} sinais={sinaisRecentes} />
        </TabsContent>

        <TabsContent value="financas" className="space-y-4">
          {real ? (
            <FonteDados real={real} qualidade={qualidade} estimadaReceita={baseReceita ?? city.kpis.receita} />
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle>
                Receita e despesa até 2035 {real?.status === "ready" ? `— oficial ${real.data.ano}` : "— série estimada"}
              </CardTitle>
                <CardDescription>
                  {serieReal ? (
                    <>
                      Pontos {serieReal.anos[0]?.ano}–{serieReal.anos[serieReal.anos.length - 1]?.ano} oficiais
                      (SICONFI/DCA); anos anteriores, estimativa para contexto. Linha tracejada: projeção
                      2026–2035 pelo CAGR {projecaoFiscal.oficial ? "oficial" : "estimado"} (
                      {formatRate(projecaoFiscal.gRec)} receita · {formatRate(projecaoFiscal.gDes)} despesa).
                      Reais correntes.
                    </>
                  ) : serie?.status === "loading" ? (
                    <>Buscando série oficial 2021–{real?.status === "ready" ? real.data.ano : "…"} no SICONFI…</>
                  ) : real?.status === "ready" ? (
                    <>Totais oficiais SICONFI/DCA; série histórica mantida como estimativa para contexto. Linha tracejada: projeção 2026–2035 (cenário).</>
                  ) : (
                    <>Série nominal 2016–2025 em reais correntes mais projeção tracejada até 2035 (cenário). Estimativa para comparação, não execução orçamentária oficial.</>
                  )}
                </CardDescription>
            </CardHeader>
            <CardContent>
              <FinanceChart
                receita={receitaMerged}
                despesa={despesaMerged}
                receitaProj={projecaoFiscal.receitaProj}
                despesaProj={projecaoFiscal.despesaProj}
              />
              {serieReal && (serieReal.cagrPropria != null || serieReal.cagrTransf != null) ? (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Tendência oficial ({serieReal.anos[0]?.ano}–{serieReal.anos[serieReal.anos.length - 1]?.ano}): receita
                  própria {serieReal.cagrPropria != null ? formatRate(serieReal.cagrPropria) : "—"} · transferências{" "}
                  {serieReal.cagrTransf != null ? formatRate(serieReal.cagrTransf) : "—"}
                  {serieReal.volatilidade != null ? (
                    <> · volatilidade da receita {formatPct(serieReal.volatilidade * 100, 1)}</>
                  ) : null}
                  .{" "}
                  {serieReal.cagrPropria != null && serieReal.cagrTransf != null
                    ? serieReal.cagrPropria >= serieReal.cagrTransf
                      ? "A cidade ganha autonomia no período."
                      : "A dependência de repasses cresce no período."
                    : null}
                </p>
              ) : null}
            </CardContent>
          </Card>
          {realRigidez ? (
            <Card>
              <CardHeader>
                <CardTitle>Rigidez orçamentária — oficial {realRigidez.ano}</CardTitle>
                <CardDescription>
                  Parcela da RCL já comprometida antes de qualquer decisão (pessoal + juros da dívida).
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-4">
                <Kpi
                  className="shadow-none"
                  label="Rigidez / RCL"
                  value={formatPct(realRigidez.rigidezRCL * 100, 1)}
                  hint={realRigidez.rigidezRCL > 0.6 ? "Alta — pouca margem" : realRigidez.rigidezRCL > 0.45 ? "Intermediária" : "Moderada"}
                  tone={realRigidez.rigidezRCL > 0.6 ? "bad" : realRigidez.rigidezRCL > 0.45 ? "warn" : "good"}
                />
                <Kpi
                  className="shadow-none"
                  label="Pessoal"
                  value={formatBRL(realRigidez.despesaPessoal)}
                  hint={`${formatPct(realRigidez.folhaRCL * 100, 1)} da RCL`}
                />
                <Kpi
                  className="shadow-none"
                  label="Juros da dívida"
                  value={formatBRL(realRigidez.jurosDivida)}
                  hint="3.2 — sem amortização"
                />
                <Kpi
                  className="shadow-none"
                  label="Investimentos"
                  value={formatBRL(realRigidez.investimentos)}
                  hint={`${formatPct(realRigidez.investShare * 100, 1)} da despesa`}
                />
              </CardContent>
            </Card>
          ) : null}
          {patri ? (
            <Card>
              <CardHeader>
                <CardTitle>Solvência — oficial {patrimonio?.status === "ready" ? patrimonio.data.ano : ""}</CardTitle>
                <CardDescription>
                  Balanço patrimonial (DCA-Anexo I-AB). Endividamento e liquidez em 31/12.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-4">
                <Kpi
                  className="shadow-none"
                  label="Endividamento"
                  value={formatPct(patri.endividamento * 100, 1)}
                  hint="Passivo exigível / ativo"
                  tone={patri.endividamento > 0.5 ? "bad" : patri.endividamento > 0.3 ? "warn" : "good"}
                />
                <Kpi
                  className="shadow-none"
                  label="Liquidez corrente"
                  value={`${patri.liquidezCorrente.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}×`}
                  hint="Ativo circ. / passivo circ."
                  tone={patri.liquidezCorrente < 1 ? "bad" : patri.liquidezCorrente < 2 ? "warn" : "good"}
                />
                <Kpi
                  className="shadow-none"
                  label="Caixa"
                  value={formatBRL(patri.caixa)}
                  hint={`${patri.caixaSobrePC.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}× o passivo circulante`}
                />
                <Kpi
                  className="shadow-none"
                  label="Patrimônio líquido"
                  value={formatBRL(patri.patrimonioLiquido)}
                  hint={patri.patrimonioLiquido < 0 ? "Passivo a descoberto" : "Positivo"}
                  tone={patri.patrimonioLiquido < 0 ? "bad" : "good"}
                />
              </CardContent>
            </Card>
          ) : patrimonio?.status === "loading" ? (
            <Card>
              <CardHeader>
                <CardTitle>Solvência</CardTitle>
                <CardDescription>Buscando balanço patrimonial no SICONFI…</CardDescription>
              </CardHeader>
            </Card>
          ) : null}
          {rgfData ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  Teto da LRF — oficial{" "}
                  {rgfData.periodicidade === "Q"
                    ? `${rgfData.periodo}º quadrimestre/${rgfData.ano}`
                    : `${rgfData.periodo}º semestre/${rgfData.ano}`}
                </CardTitle>
                <CardDescription>
                  Despesa com pessoal do Executivo sobre a RCL ajustada (RGF Anexo 01, art. 20 da LRF).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-1 flex items-baseline justify-between text-sm">
                    <span>
                      DTP {formatPct(rgfData.dtpPct, 2)} · teto {formatPct(rgfData.limiteMax, 0)}
                    </span>
                    <Badge
                      variant={
                        rgfData.faixa === "dentro"
                          ? "success"
                          : rgfData.faixa === "acima"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {rgfData.faixa === "dentro"
                        ? "Dentro do limite"
                        : rgfData.faixa === "alerta"
                          ? "Faixa de alerta"
                          : rgfData.faixa === "prudencial"
                            ? "Limite prudencial"
                            : "Acima do teto"}
                    </Badge>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, (rgfData.dtpPct / rgfData.limiteMax) * 100)}%` }}
                    />
                    <div
                      className="absolute inset-y-0 w-px bg-warning"
                      style={{ width: "2px", left: `${(rgfData.limiteAlerta / rgfData.limiteMax) * 100}%` }}
                    />
                    <div
                      className="absolute inset-y-0 w-px bg-destructive"
                      style={{ width: "2px", left: `${(rgfData.limitePrudencial / rgfData.limiteMax) * 100}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>Alerta {formatPct(rgfData.limiteAlerta, 1)}</span>
                    <span>Prudencial {formatPct(rgfData.limitePrudencial, 1)}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  DTP {formatBRLFull(rgfData.dtp)} sobre RCL ajustada de {formatBRLFull(rgfData.rclAjustada)}.
                </p>
              </CardContent>
            </Card>
          ) : rgf?.status === "loading" ? (
            <Card>
              <CardHeader>
                <CardTitle>Teto da LRF</CardTitle>
                <CardDescription>Buscando RGF mais recente no SICONFI…</CardDescription>
              </CardHeader>
            </Card>
          ) : null}
          {rreoData ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {rreoData.ano} em curso — {rreoData.bimestre}º bimestre (oficial)
                </CardTitle>
                <CardDescription>
                  RREO Anexo 01 parcial. Não anualizar: compara-se ritmo contra o ano decorrido.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                <Kpi
                  className="shadow-none"
                  label="Arrecadado / previsto"
                  value={formatPct(rreoData.pctArrecadado, 1)}
                  hint={`${formatPct(rreoData.fracaoAno * 100, 0)} do ano decorrido`}
                  tone={rreoData.pctArrecadado >= rreoData.fracaoAno * 100 ? "good" : "warn"}
                />
                <Kpi
                  className="shadow-none"
                  label="Receita até o bimestre"
                  value={formatBRL(rreoData.receitaAteBimestre)}
                  hint={`Previsto ${formatBRL(rreoData.receitaPrevista)}`}
                />
                <Kpi
                  className="shadow-none"
                  label="Despesa empenhada"
                  value={formatBRL(rreoData.despesaEmpenhadaAte)}
                  hint={`Liquidada ${formatBRL(rreoData.despesaLiquidadaAte)}`}
                />
              </CardContent>
            </Card>
          ) : rreo?.status === "loading" ? (
            <Card>
              <CardHeader>
                <CardTitle>Ano em curso</CardTitle>
                <CardDescription>Buscando RREO parcial no SICONFI…</CardDescription>
              </CardHeader>
            </Card>
          ) : null}
          {capitalData && real?.status === "ready" ? (
            <Card>
              <CardHeader>
                <CardTitle>Contra a capital — {capitalName} (oficial {capitalData.ano})</CardTitle>
                <CardDescription>Mesma fonte, mesmo exercício-base quando disponível.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border text-sm">
                  <CompareRow
                    label="Receita por habitante"
                    a={`${formatBRLFull(Math.round(real.data.receitaLiquida / Math.max(real.data.populacao, 1)))}`}
                    b={`${formatBRLFull(Math.round(capitalData.receitaLiquida / Math.max(capitalData.populacao, 1)))}`}
                  />
                  <CompareRow
                    label="Receita própria"
                    a={formatPct(real.data.propriaPct * 100, 1)}
                    b={formatPct(capitalData.propriaPct * 100, 1)}
                  />
                  <CompareRow
                    label="Folha / RCL"
                    a={formatPct(real.data.folhaRCL * 100, 1)}
                    b={formatPct(capitalData.folhaRCL * 100, 1)}
                  />
                </ul>
              </CardContent>
            </Card>
          ) : null}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {real?.status === "ready" ? `De onde veio a receita (${real.data.ano})` : "De onde viria a receita"}
                </CardTitle>
                <CardDescription>
                  {real?.status === "ready" ? (
                    <>
                      Oficial: {formatPct(city.dependencia.transferenciaPct * 100, 0)} de União e Estado — o restante de
                      arrecadação própria (ISS, IPTU, ITBI, taxas).
                    </>
                  ) : (
                    <>
                      Estimativa: {formatPct(city.dependencia.transferenciaPct * 100, 0)} de União e Estado — o restante de
                      arrecadação própria.
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OriginPie data={city.receitaOrigem} />
                <ul className="mt-2 space-y-1.5 text-sm">
                  {city.receitaOrigem.map((row, i) => (
                    <li key={row.key} className="flex justify-between gap-3">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span
                          className={[
                            "size-2 shrink-0 rounded-full",
                            ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-muted-foreground", "bg-chart-2"][
                              i
                            ],
                          ].join(" ")}
                        />
                        {row.label}
                      </span>
                      <span className="tabular">{formatBRL(row.value)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  {funcoesReady
                    ? `Onde o dinheiro foi — oficial ${funcoes.data.ano}`
                    : "Composição estimada dos gastos"}
                </CardTitle>
                <CardDescription>
                  {funcoesReady ? (
                    <>
                      Despesa empenhada por função (DCA-Anexo I-E). Folha oficial em{" "}
                      {formatPct(city.dependencia.folhaPct * 100, 0)} da receita. Referência LRF: teto prudencial de 54%.
                    </>
                  ) : funcoes?.status === "loading" ? (
                    <>Buscando despesa por função no SICONFI…</>
                  ) : (
                    <>
                      Folha estimada em {formatPct(city.dependencia.folhaPct * 100, 0)} da receita. Referência LRF: teto prudencial de 54%.
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExpenseBars data={city.despesaFuncoes} />
              </CardContent>
            </Card>
          </div>
          {serieReal && serieReal.anos.length >= 2 ? (
            <Card>
              <CardHeader>
                <CardTitle>Retrato fiscal ano a ano — oficial</CardTitle>
                <CardDescription>
                  Autonomia, folha e resultado (DCA). É aqui que se vê se a cidade melhora ou piora de verdade.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full min-w-[30rem] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
                      <th className="px-5 py-2 font-medium">Ano</th>
                      <th className="px-5 py-2 font-medium">Autonomia</th>
                      <th className="px-5 py-2 font-medium">Folha / RCL</th>
                      <th className="px-5 py-2 font-medium">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serieReal.anos.map((a) => {
                      const autonomia = a.propria / Math.max(a.receita, 1);
                      const resultado = (a.receita - a.despesa) / Math.max(a.receita, 1);
                      return (
                        <tr key={a.ano} className="border-b border-border last:border-0">
                          <td className="px-5 py-2.5 text-muted-foreground tabular">{a.ano}</td>
                          <td className="px-5 py-2.5 tabular">{formatPct(autonomia * 100, 1)}</td>
                          <td className="px-5 py-2.5 tabular">{formatPct(a.folhaRCL * 100, 1)}</td>
                          <td className={cn("px-5 py-2.5 tabular", resultado >= 0 ? "text-success" : "text-destructive")}>
                            {resultado >= 0 ? "+" : "−"}{formatPct(Math.abs(resultado) * 100, 1)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="economia" className="space-y-4">
          {cagedData ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  Mercado formal — oficial até {cagedData.ate.slice(4)}/{cagedData.ate.slice(0, 4)}
                </CardTitle>
                <CardDescription>
                  Novo Caged/MTE: admissões e desligamentos CLT por mês (sem ajustes). Estoque e
                  informalidade seguem estimados abaixo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-4">
                  <Kpi
                    className="shadow-none"
                    label="Saldo 12 meses"
                    value={`${cagedData.saldo12 >= 0 ? "+" : "−"}${formatInt(Math.abs(cagedData.saldo12))}`}
                    hint="Admitidos − desligados"
                    tone={cagedData.saldo12 >= 0 ? "good" : "bad"}
                  />
                  <Kpi
                    className="shadow-none"
                    label="Admissões 12m"
                    value={formatInt(cagedData.adm12)}
                    hint={`Deslig. ${formatInt(cagedData.desl12)}`}
                  />
                  <Kpi
                    className="shadow-none"
                    label="Salário médio adm."
                    value={cagedData.salarioMedio > 0 ? formatBRLFull(Math.round(cagedData.salarioMedio)) : "—"}
                    hint="Ponderado 12m"
                  />
                  <Kpi
                    className="shadow-none"
                    label={`Saldo ${cagedData.ytd.ano}`}
                    value={`${cagedData.ytd.saldo >= 0 ? "+" : "−"}${formatInt(Math.abs(cagedData.ytd.saldo))}`}
                    hint="Acumulado no ano"
                    tone={cagedData.ytd.saldo >= 0 ? "good" : "bad"}
                  />
                </div>
                <div>
                  <div className="flex h-20 items-end gap-1">
                    {cagedData.meses.map((m) => {
                      const max = Math.max(...cagedData.meses.map((x) => Math.abs(x.saldo)), 1);
                      const h = Math.max(4, (Math.abs(m.saldo) / max) * 100);
                      return (
                        <div key={m.comp} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${m.comp}: ${m.saldo >= 0 ? "+" : ""}${formatInt(m.saldo)}`}>
                          <div
                            className={m.saldo >= 0 ? "w-full rounded-sm bg-success" : "w-full rounded-sm bg-destructive"}
                            style={{ height: `${(h / 2).toFixed(1)}%`, minHeight: 3 }}
                          />
                          <span className="text-[10px] tabular text-muted-foreground">{m.comp.slice(4)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Saldo mensal de vagas formais (admissões − desligamentos).</p>
                </div>
              </CardContent>
            </Card>
          ) : caged?.status === "loading" ? (
            <Card>
              <CardHeader>
                <CardTitle>Mercado formal</CardTitle>
                <CardDescription>Buscando Novo Caged no banco de dados…</CardDescription>
              </CardHeader>
            </Card>
          ) : null}
          {cagedSetor?.status === "ready" ? (
            <SetoresContratacao data={cagedSetor.data} />
          ) : cagedSetor?.status === "loading" ? (
            <Card>
              <CardHeader>
                <CardTitle>Quem contrata e demite</CardTitle>
                <CardDescription>Buscando saldos por setor no CAGED…</CardDescription>
              </CardHeader>
            </Card>
          ) : null}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Base produtiva</CardTitle>
                <CardDescription>
                  A cidade vive de {city.baseEconomica}. Quanto mais concentrada na prefeitura, menos oportunidade
                  privada.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ShareBars data={city.setores} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Empresas por porte</CardTitle>
                <CardDescription>Estabelecimentos ativos estimados.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {city.empresas.map((e) => {
                  const share = e.count / Math.max(totalEmp, 1);
                  return (
                    <div key={e.porte}>
                      <div className="mb-1 flex items-baseline justify-between text-sm">
                        <span>{e.porte}</span>
                        <span className="tabular text-muted-foreground">
                          {formatInt(e.count)} · {formatPct(share * 100, 1)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.max(share * 100, 1.5)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground">
                  {formatInt(totalEmp)} empresas no total · {formatInt(city.empresas[2]?.count ?? 0)} grandes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Empregos formais e informais</CardTitle>
                <CardDescription>População ocupada estimada.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Kpi
                    className="shadow-none"
                    label="Formais"
                    value={formatInt(city.empregos.formais)}
                    hint={formatPct(city.empregos.taxaFormal * 100)}
                    icon={<Briefcase className="size-4" />}
                  />
                  <Kpi
                    className="shadow-none"
                    label="Informais"
                    value={formatInt(city.empregos.informais)}
                    hint="Fora da RAIS"
                  />
                </div>
                <Separator className="my-4" />
                <p className="text-sm text-muted-foreground">
                  {formatInt(city.empregos.ocupados)} pessoas ocupadas —{" "}
                  {formatPct(city.empregos.taxaOcupacao * 100, 0)} da população. Desemprego {formatPct(city.empregos.desemprego * 100, 1)}.
                </p>
                <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-secondary">
                  <div className="bg-primary" style={{ width: `${city.empregos.taxaFormal * 100}%` }} />
                  <div className="flex-1 bg-chart-2" />
                </div>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>Formal</span>
                  <span>Informal</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Renda e custo</CardTitle>
                <CardDescription>O que sobra depois do aluguel e da cesta.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Kpi className="shadow-none" label="Renda média" value={formatBRL(city.empregos.rendaMedia)} hint="Ocupados, por mês" />
                <Kpi className="shadow-none" label="Aluguel médio" value={formatBRLFull(city.custo.aluguel)} hint="Residencial" />
                <Kpi className="shadow-none" label="Cesta básica" value={formatBRLFull(city.custo.cesta)} />
                <Kpi
                  className="shadow-none"
                  label="Índice de custo"
                  value={String(city.custo.indice)}
                  hint="100 = média Brasil"
                />
              </CardContent>
            </Card>
          </div>
          {ibgeData && (ibgeData.pib || ibgeData.entorno) ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {ibgeData.pib ? (
                <Card>
                  <CardHeader>
                    <CardTitle>PIB oficial — IBGE {ibgeData.pib.anoPib}</CardTitle>
                    <CardDescription>
                      Produto Interno Bruto municipal (SIDRA 5938). Último publicado; defasado por metodologia.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3">
                    <Kpi className="shadow-none" label="PIB total" value={formatBRL(ibgeData.pib.pibTotal)} hint={`${ibgeData.pib.anoPib}`} />
                    <Kpi
                      className="shadow-none"
                      label="PIB per capita"
                      value={formatBRL(ibgeData.pib.pibPerCapita)}
                      hint={`Pop. ${ibgeData.pib.anoPop} (IBGE)`}
                    />
                  </CardContent>
                </Card>
              ) : null}
              {ibgeData.entorno ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Entorno regional — IBGE</CardTitle>
                    <CardDescription>
                      Região imediata de {ibgeData.entorno.imediataNome}. O futuro de cidade pequena depende do polo.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="divide-y divide-border text-sm">
                      <li className="flex items-center justify-between gap-3 py-2">
                        <span className="text-muted-foreground">Municípios na imediata</span>
                        <span className="tabular">{formatInt(ibgeData.entorno.municipiosNaImediata)}</span>
                      </li>
                      <li className="flex items-center justify-between gap-3 py-2">
                        <span className="text-muted-foreground">Polo regional</span>
                        <span className="tabular">
                          {ibgeData.entorno.poloNome}
                          {ibgeData.entorno.souPolo ? " (esta cidade)" : ""}
                        </span>
                      </li>
                      <li className="flex items-center justify-between gap-3 py-2">
                        <span className="text-muted-foreground">Intermediária</span>
                        <span className="tabular">{ibgeData.entorno.intermediariaNome || "—"}</span>
                      </li>
                    </ul>
                    {!ibgeData.entorno.souPolo ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Cidade satélite: emprego e serviços avançados tendem a concentrar-se em {ibgeData.entorno.poloNome}.
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Cidade-polo: atrai gente e firmas da região — o que sustenta ISS e consumo, mas pressiona custo.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : null}
            </div>
          ) : ibgeReal?.status === "loading" ? (
            <Card>
              <CardHeader>
                <CardTitle>Economia oficial (IBGE)</CardTitle>
                <CardDescription>Buscando PIB municipal e região imediata…</CardDescription>
              </CardHeader>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="sociedade" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Faixa etária</CardTitle>
                <CardDescription>Pirâmide simplificada da população residente.</CardDescription>
              </CardHeader>
              <CardContent>
                <AgeChart data={city.faixaEtaria} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Domicílios e frota</CardTitle>
                <CardDescription>
                  Estoque residencial e veículos licenciados.
                  {ibgeData?.censo && ibgeData.censo.domicilios2022 > 0 ? (
                    <> Domicílios oficiais (Censo 2022): {formatInt(ibgeData.censo.domicilios2022)}.</>
                  ) : null}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Kpi
                  className="shadow-none"
                  label="Residências"
                  value={formatInt(city.residencias)}
                  icon={<Home className="size-4" />}
                />
                <Kpi
                  className="shadow-none"
                  label="Hab. / domicílio"
                  value={String(city.ocupantesPorDomicilio).replace(".", ",")}
                />
                {ibgeData?.censo && ibgeData.censo.moradoresFavelas > 0 && city.population > 0 ? (
                  <Kpi
                    className="shadow-none col-span-2"
                    label="Moradores em favelas (Censo 2022)"
                    value={`${formatPct((ibgeData.censo.moradoresFavelas / Math.max(city.population, 1)) * 100, 1)}`}
                    hint={`${formatInt(ibgeData.censo.moradoresFavelas)} pessoas`}
                    tone="warn"
                  />
                ) : null}
                <Kpi className="shadow-none" label="Leves" value={formatInt(city.veiculos.leves)} />
                <Kpi className="shadow-none" label="Motos" value={formatInt(city.veiculos.motos)} />
                <Kpi
                  className="col-span-2 shadow-none"
                  label="Frota total"
                  value={formatInt(city.veiculos.total)}
                  hint={`${formatInt(city.veiculos.porMilHab)} / mil hab.`}
                  icon={<Car className="size-4" />}
                />
              </CardContent>
            </Card>
            {sanData ? (
              <Card>
                <CardHeader>
                  <CardTitle>Saneamento básico — Censo 2022</CardTitle>
                  <CardDescription>
                    % de moradores em domicílios particulares permanentes ocupados (IBGE oficial).
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <Kpi
                    className="shadow-none"
                    label="Água rede geral"
                    value={formatPct(sanData.aguaRede, 1)}
                    tone={sanData.aguaRede >= 90 ? "good" : sanData.aguaRede >= 70 ? "warn" : "bad"}
                  />
                  <Kpi
                    className="shadow-none"
                    label="Esgoto adequado"
                    value={formatPct(sanData.esgotoAdequado, 1)}
                    hint={`Rede ${formatPct(sanData.esgotoRede, 1)}`}
                    tone={sanData.esgotoAdequado >= 80 ? "good" : sanData.esgotoAdequado >= 50 ? "warn" : "bad"}
                  />
                  <Kpi
                    className="shadow-none"
                    label="Lixo coletado"
                    value={formatPct(sanData.lixoColetado, 1)}
                    tone={sanData.lixoColetado >= 90 ? "good" : sanData.lixoColetado >= 70 ? "warn" : "bad"}
                  />
                  <Kpi
                    className="shadow-none"
                    label="Fossa rudimentar"
                    value={formatPct(sanData.fossaRudimentar, 1)}
                    hint={sanData.semBanheiro > 0 ? `${formatInt(sanData.semBanheiro)} sem banheiro` : "Sem registro sem banheiro"}
                    tone={sanData.fossaRudimentar <= 5 ? "good" : sanData.fossaRudimentar <= 25 ? "warn" : "bad"}
                  />
                </CardContent>
              </Card>
            ) : saneamento?.status === "loading" ? (
              <Card>
                <CardHeader>
                  <CardTitle>Saneamento básico</CardTitle>
                  <CardDescription>Buscando Censo 2022 no banco de dados…</CardDescription>
                </CardHeader>
              </Card>
            ) : null}
            <Card>
              <CardHeader>
                <CardTitle>Educação e saúde</CardTitle>
                <CardDescription>Serviços que sustentam a decisão de morar.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Kpi className="shadow-none" label="IDHM" value={formatIdhm(city.idhm)} />
                <Kpi className="shadow-none" label="IDEB · estimado" value={String(city.educacao.ideb).replace(".", ",")} />
                {ibgeData?.censo && ibgeData.censo.alfabetizacao > 0 ? (
                  <Kpi
                    className="shadow-none col-span-2"
                    label="Alfabetização 15+ (Censo 2022)"
                    value={formatPct(ibgeData.censo.alfabetizacao, 1)}
                    hint="IBGE oficial"
                    tone={ibgeData.censo.alfabetizacao >= 90 ? "good" : ibgeData.censo.alfabetizacao >= 80 ? "warn" : "bad"}
                  />
                ) : null}
                <Kpi
                  className="shadow-none"
                  label="Leitos / mil hab. · estimado"
                  value={String(city.saudeServicos.leitosPorMil).replace(".", ",")}
                  icon={<Stethoscope className="size-4" />}
                />
                <Kpi
                  className="col-span-2 shadow-none"
                  label={
                    saudeData
                      ? `Rede pública · oficial ${saudeData.competencia.slice(4)}/${saudeData.competencia.slice(0, 4)}`
                      : "Rede pública · estimado"
                  }
                  value={formatInt(saudeData ? saudeData.unidades : city.saudeServicos.unidades)}
                  hint={
                    saudeData
                      ? `${formatInt(saudeData.ubs)} UBS/USF · ${formatInt(saudeData.hospitais)} hospitais · ${formatInt(saudeData.total)} no CNES total`
                      : "Modelo — aguarde o oficial"
                  }
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Migração</CardTitle>
                <CardDescription>Gente chegando ou saindo — proxy de oportunidade.</CardDescription>
              </CardHeader>
              <CardContent>
                <Kpi
                  className="shadow-none"
                  label="Saldo anual estimado"
                  value={`${city.migracao.saldo >= 0 ? "+" : "−"}${formatInt(Math.abs(city.migracao.saldo))}`}
                  hint={city.migracao.saldo >= 0 ? "Chegam mais do que saem" : "A cidade perde gente"}
                  tone={city.migracao.saldo >= 0 ? "good" : "bad"}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="futuro" className="space-y-4">
          {banda2035 && serieReal ? (
            <Card>
              <CardHeader>
                <CardTitle>Receita em 2035 — intervalo oficial</CardTitle>
                <CardDescription>
                  Calibrado na volatilidade real {serieReal.anos[0]?.ano}–
                  {serieReal.anos[serieReal.anos.length - 1]?.ano} (±
                  {formatPct((serieReal.volatilidade ?? 0) * 100, 1)} a.a.). Não é previsão: é o corredor
                  histórico.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                <Kpi className="shadow-none" label="Piso" value={formatBRL(banda2035.baixa)} hint="Crescimento − 1 desvio" />
                <Kpi className="shadow-none" label="Base atual" value={formatBRL(banda2035.base)} hint="Receita líquida oficial" />
                <Kpi className="shadow-none" label="Teto" value={formatBRL(banda2035.alta)} hint="Crescimento + 1 desvio" />
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>População até 2035</CardTitle>
                <CardDescription>
                  Observado até {observadoAtePop}
                  {serieReal ? " (DCA oficial)" : ""} e trajetória projetada a partir do ritmo recente.
                </CardDescription>
              </div>
              <Badge variant={status.variant} className="w-fit">
                {formatRate(city.projecao.taxaAnual)}
              </Badge>
            </CardHeader>
            <CardContent>
              <ProjectionChart data={city.projecao.series} observadoAte={observadoAtePop} />
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Kpi className="shadow-none" label={String(observadoAtePop)} value={formatInt(city.population)} />
                <Kpi className="shadow-none" label="2035" value={formatInt(city.projecao.horizonte2035)} />
                <Kpi
                  className="shadow-none"
                  label="Variação"
                  value={`${city.projecao.delta >= 0 ? "+" : "−"}${formatInt(Math.abs(city.projecao.delta))}`}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Orçamento em 2035 — e o ponto de aperto</CardTitle>
              <CardDescription>
                Receita e despesa projetadas pelo CAGR {projecaoFiscal.oficial ? "oficial" : "estimado"} (
                {formatRate(projecaoFiscal.gRec)} receita · {formatRate(projecaoFiscal.gDes)} despesa). Cenário, não previsão.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <Kpi className="shadow-none" label="Receita 2035" value={formatBRL(orcamento2035.rec35)} />
              <Kpi className="shadow-none" label="Despesa 2035" value={formatBRL(orcamento2035.des35)} />
              <Kpi
                className="shadow-none"
                label="Resultado 2035"
                value={`${orcamento2035.res35 >= 0 ? "+" : ""}${formatBRL(orcamento2035.res35)}`}
                hint={orcamento2035.breakEven ? `Despesa alcança a receita em ~${orcamento2035.breakEven}` : "Receita cresce acima da despesa"}
                tone={orcamento2035.res35 >= 0 ? "good" : "bad"}
              />
            </CardContent>
          </Card>
          {ipcaData ? (
            <Card>
              <CardHeader>
                <CardTitle>Inflação e poder de compra — IPCA oficial</CardTitle>
                <CardDescription>
                  IPCA/IBGE via BCB até {ipcaData.ultimoMes}. R$ 1.000 de jan/21 valem{" "}
                  {formatBRLFull(Math.round(1000 * ipcaData.fatorAcumulado))} hoje. Abaixo: quanto a receita da
                  cidade cresceu acima (ou abaixo) da inflação.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="divide-y divide-border text-sm">
                  {ipcaData.anos.map((a) => (
                    <li key={a.ano} className="flex items-center justify-between gap-3 py-2">
                      <span className="tabular text-muted-foreground">
                        {a.ano}
                        {a.parcial ? ` (até ${a.ateMes})` : ""}
                      </span>
                      <span className="tabular">{formatPct(a.ipca, 2)}</span>
                    </li>
                  ))}
                </ul>
                {serieReal && serieReal.anos.length >= 2 ? (
                  <RealVsInflacao serie={serieReal} ipca={ipcaData} />
                ) : null}
              </CardContent>
            </Card>
          ) : ipca.status === "loading" ? (
            <Card>
              <CardHeader>
                <CardTitle>Inflação e poder de compra</CardTitle>
                <CardDescription>Buscando IPCA no Banco Central…</CardDescription>
              </CardHeader>
            </Card>
          ) : null}
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Empregos formais até 2035</CardTitle>
                <CardDescription>Observado até 2024; projeção parte da âncora, sem salto artificial.</CardDescription>
              </div>
              <Badge variant="outline" className="w-fit">
                {formatRate(city.projecao.empregoTaxa)}
              </Badge>
            </CardHeader>
            <CardContent>
              <JobProjectionChart data={city.projecao.empregoSeries} />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Kpi className="shadow-none" label="Formais hoje" value={formatInt(city.empregos.formais)} />
                <Kpi className="shadow-none" label="Formais 2035" value={formatInt(city.projecao.empregos2035)} />
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">{city.saude.resumo}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="text-xs leading-relaxed text-muted-foreground">
        {real?.status === "ready" ? (
          <>
            Receita {formatBRLFull(city.kpis.receita)} e despesa oficiais (SICONFI/DCA {real.data.ano}, Tesouro
            Nacional). População {formatInt(city.population)} (IBGE via SICONFI). Estimativa restante: emprego,
            empresas, frota, IDHM e projeções — modelagem sintética para comparação. Projeções até 2035 são cenários
            centrais com incerteza alta; confirme emprego em RAIS/eSocial.
          </>
        ) : (
          <>
            Receita de referência {formatBRLFull(city.kpis.receita)} (ordem de grandeza estimada). Fato: malha e
            população (IBGE, Estimativas 2024). Estimativa: finanças, emprego, empresas, frota, IDHM e projeções —
            modelagem sintética calibrada por porte, região e padrões de SICONFI, RAIS, DENATRAN e PNUD. Serve para
            triagem e comparação entre cidades; não substitui RREO, eSocial/RAIS, Censo nem boletins oficiais.
            Projeções até 2035 são cenários centrais com incerteza alta.
          </>
        )}
      </p>
    </div>
  );
}

function RealVsInflacao({ serie, ipca }: { serie: RealSerie; ipca: RealIPCA }) {
  const anos = serie.anos;
  const first = anos[0]!;
  const last = anos[anos.length - 1]!;
  const nominal = first.receita > 0 ? last.receita / first.receita - 1 : 0;
  const inflacao = ipca.anos
    .filter((a) => !a.parcial && a.ano >= first.ano && a.ano <= last.ano)
    .reduce((s, a) => s * (1 + a.ipca / 100), 1);
  if (!(inflacao > 1)) return null;
  const real = (1 + nominal) / inflacao - 1;
  return (
    <p className="text-sm leading-relaxed text-muted-foreground">
      Receita {first.ano}→{last.ano}: {formatPct(nominal * 100, 1)} nominal contra{" "}
      {formatPct((inflacao - 1) * 100, 1)} de IPCA no período —{" "}
      <span className={real >= 0 ? "text-success" : "text-destructive"}>
        {formatPct(real * 100, 1)} em termos reais
      </span>
      . Se a inflação corre acima da receita, o poder de compra da prefeitura (e do morador) encolhe mesmo com
      arrecadação recorde em reais.
    </p>
  );
}

const SECAO_NOMES: Record<string, string> = {
  A: "Agropecuária",
  B: "Ind. extrativa",
  C: "Ind. transformação",
  D: "Energia e gás",
  E: "Água e esgoto",
  F: "Construção",
  G: "Comércio",
  H: "Transporte",
  I: "Alimentação/hospedagem",
  J: "Informação/comunicação",
  K: "Financeiro",
  L: "Imobiliário",
  M: "Profissional/científico",
  N: "Admin. e serviços",
  O: "Adm. pública",
  P: "Educação",
  Q: "Saúde humana/social",
  R: "Artes e cultura",
  S: "Outros serviços",
  T: "Serv. domésticos",
  U: "Org. internacionais",
};

function SetoresContratacao({ data }: { data: RealCagedSetor }) {
  const ordenadas = [...data.secoes].sort((a, b) => b.saldo - a.saldo);
  const positivas = ordenadas.filter((s) => s.saldo > 0).slice(0, 3);
  const negativas = [...ordenadas].reverse().filter((s) => s.saldo < 0).slice(0, 3);
  const max = Math.max(...ordenadas.map((s) => Math.abs(s.saldo)), 1);
  const periodo =
    data.meses.length > 0 ? `${data.meses[0]}–${data.meses[data.meses.length - 1]}` : "";
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quem contrata e demite — últimos 3 meses</CardTitle>
        <CardDescription>
          Saldo de vagas CLT por setor, {periodo} ({data.fonte}). Verde contrata, vermelho demite.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {ordenadas.map((s) => (
            <li key={s.secao} className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
              <span className="min-w-0">
                <span className="block truncate">
                  {SECAO_NOMES[s.secao] ?? `Seção ${s.secao}`} ·{" "}
                  <span className="tabular text-muted-foreground">
                    {s.saldo >= 0 ? "+" : "−"}{formatInt(Math.abs(s.saldo))}
                  </span>
                </span>
                <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-secondary">
                  <span
                    className={`block h-full rounded-full ${s.saldo >= 0 ? "bg-success" : "bg-destructive"}`}
                    style={{ width: `${Math.max(2, (Math.abs(s.saldo) / max) * 100)}%` }}
                  />
                </span>
              </span>
              <span className="tabular text-xs text-muted-foreground">
                {formatInt(s.adm)} adm. / {formatInt(s.desl)} desl.
              </span>
            </li>
          ))}
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {positivas.length > 0 ? (
            <>Puxam vagas: {positivas.map((s) => SECAO_NOMES[s.secao] ?? s.secao).join(", ")}. </>
          ) : null}
          {negativas.length > 0 ? (
            <>Cortam vagas: {negativas.map((s) => SECAO_NOMES[s.secao] ?? s.secao).join(", ")}.</>
          ) : (
            <>Nenhum setor com saldo negativo no período.</>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

function CompareRow({ label, a, b }: { label: string; a: string; b: string }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex gap-4 tabular">
        <span>{a}</span>
        <span className="text-muted-foreground">{b}</span>
      </span>
    </li>
  );
}
