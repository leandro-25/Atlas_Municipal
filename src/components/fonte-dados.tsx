import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRLFull, formatInt, formatPct } from "@/data/format";
import type { DeepState, RealState } from "@/data/use-real";
import type { RealQualidadePayload } from "@/lib/siconfi";

export function FonteDados({
  real,
  qualidade,
  estimadaReceita,
}: {
  real: RealState;
  qualidade?: DeepState<Exclude<RealQualidadePayload, null>>;
  estimadaReceita: number;
}) {
  if (real.status === "loading" || real.status === "idle") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Fonte oficial <Badge variant="outline">buscando…</Badge>
          </CardTitle>
          <CardDescription>Consultando SICONFI/DCA no Tesouro Nacional.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  if (real.status === "ready") {
    const d = real.data;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            Fonte oficial <Badge variant="success">SICONFI/DCA {d.ano}</Badge>
          </CardTitle>
          <CardDescription>
            Tesouro Nacional — Declaração de Contas Anuais. Valores líquidos (brutas − FUNDEB − deduções).
            População {d.populacao > 0 ? formatInt(d.populacao) : "—"} (IBGE via SICONFI).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <Dato label="Receita líquida oficial" value={formatBRLFull(d.receitaLiquida)} />
          <Dato label="Despesa empenhada oficial" value={formatBRLFull(d.despesaTotal)} />
          <Dato label="Tributária própria" value={`${formatBRLFull(d.tributariaPropria)} · ${formatPct(d.propriaPct * 100, 1)}`} />
          <Dato label="Transferências (União+Estado)" value={`${formatBRLFull(d.transfTotal)} · ${formatPct(d.transferenciaPct * 100, 1)}`} />
          <Dato label="ISS / IPTU / ITBI / Taxas" value={`${formatBRLFull(d.iss)} · ${formatBRLFull(d.iptu)} · ${formatBRLFull(d.itbi)} · ${formatBRLFull(d.taxas)}`} />
          <Dato label="Pessoal / RCL (folha oficial)" value={d.receitaCorrenteLiquida > 0 ? `${formatBRLFull(d.despesaPessoal)} · ${formatPct(d.folhaRCL * 100, 1)}` : "—"} />
          <Dato label="Rigidez (pessoal+juros / RCL)" value={d.receitaCorrenteLiquida > 0 ? formatPct(d.rigidezRCL * 100, 1) : "—"} />
          <Dato label="Investimentos" value={`${formatBRLFull(d.investimentos)} · ${formatPct(d.investShare * 100, 1)} da despesa`} />
          <Dato label="Juros + amortização da dívida" value={`${formatBRLFull(d.jurosDivida)} · ${formatBRLFull(d.amortizacaoDivida)}`} />
          <p className="text-xs text-muted-foreground sm:col-span-2">
            <a className="underline" href={d.urlFonte} target="_blank" rel="noreferrer">Conferir no SICONFI</a>
            {" · "}Emprego, empresas, demografia e projeções seguem estimados e estão marcados como tal.
          </p>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            Qualidade do envio:{" "}
            {qualidade?.status === "ready" ? (
              <QualidadeTexto
                dca={qualidade.data.qualidade.dcaHomologado}
                rgfHo={qualidade.data.qualidade.rgfHomologados}
                rgfRe={qualidade.data.qualidade.rgfRetificados}
                rreoHo={qualidade.data.qualidade.rreoHomologados}
                rreoRe={qualidade.data.qualidade.rreoRetificados}
              />
            ) : qualidade?.status === "loading" || qualidade?.status === "idle" ? (
              "verificando entregas…"
            ) : (
              "extrato indisponível"
            )}
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          Fonte oficial <Badge variant="warning">sem dado publicado</Badge>
        </CardTitle>
        <CardDescription>
          O município não tem DCA 2025/2024/2023 publicado no SICONFI (ou a consulta falhou). Exibindo estimativa de{" "}
          {formatBRLFull(estimadaReceita)} para comparação — não trate como valor oficial.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function QualidadeTexto({
  dca,
  rgfHo,
  rgfRe,
  rreoHo,
  rreoRe,
}: {
  dca: boolean;
  rgfHo: number;
  rgfRe: number;
  rreoHo: number;
  rreoRe: number;
}) {
  const parts = [
    dca ? "DCA homologado" : "DCA sem homologação registrada",
    `RGF ${rgfHo} homologado(s)${rgfRe > 0 ? `, ${rgfRe} retificado(s)` : ""}`,
    `RREO ${rreoHo} homologado(s)${rreoRe > 0 ? `, ${rreoRe} retificado(s)` : ""}`,
  ];
  return <>{parts.join(" · ")}. Retificações frequentes pedem cautela extra na leitura.</>;
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/60 p-3">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 font-medium tabular">{value}</p>
    </div>
  );
}
