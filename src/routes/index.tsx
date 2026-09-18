import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { CityDashboard } from "@/components/city-dashboard";
import { CitySearch } from "@/components/city-search";
import { NationalOverview } from "@/components/national-overview";
import { getMunicipio } from "@/data/cities";
import {
  getBrazilOverview,
  getCityProfile,
  getCityProfileWithReal,
  type NamedValue,
} from "@/data/generate";
import {
  useRealCaged,
  useRealCagedSetor,
  useRealFinancas,
  useRealSaneamento,
  useRealFuncoes,
  useRealIbge,
  useRealPatrimonio,
  useRealQualidade,
  useRealRGF,
  useRealRREO,
  useRealSaude,
  useRealSerie,
} from "@/data/use-real";
import { UF_BY_SIGLA } from "@/data/ufs";

type Search = {
  cidade?: number;
  uf?: string;
  vs?: number[];
};

function numParam(raw: unknown): number | undefined {
  const n =
    typeof raw === "number" ? raw : typeof raw === "string" && raw.length ? Number(raw) : undefined;
  return Number.isFinite(n) ? n : undefined;
}

function vsParam(raw: unknown, cidade: number | undefined): number[] | undefined {
  const list = typeof raw === "string" ? raw.split(",") : Array.isArray(raw) ? raw : [];
  const out: number[] = [];
  for (const item of list) {
    const n = typeof item === "number" ? item : typeof item === "string" && item.length ? Number(item) : NaN;
    if (Number.isFinite(n) && n !== cidade && !out.includes(n as number)) out.push(n as number);
    if (out.length >= 3) break;
  }
  return out.length > 0 ? out : undefined;
}

export const Route = createFileRoute("/")({
  validateSearch: (raw: Record<string, unknown>): Search => {
    const cidade = numParam(raw.cidade);
    const vs = vsParam(raw.vs, cidade);
    const uf = typeof raw.uf === "string" && raw.uf.length === 2 ? raw.uf.toUpperCase() : undefined;
    return { cidade, uf, vs };
  },
  component: Home,
});

function Home() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const overview = getBrazilOverview();
  const real = useRealFinancas(search.cidade);
  const anoBase = real.status === "ready" ? real.data.ano : undefined;
  // Camada 2 (profundidade): funções + série iniciam sozinhas quando há ano-base.
  const funcoes = useRealFuncoes(search.cidade, anoBase);
  const serie = useRealSerie(search.cidade, anoBase);
  const patrimonio = useRealPatrimonio(search.cidade, anoBase);
  const rgf = useRealRGF(search.cidade);
  const qualidade = useRealQualidade(search.cidade, anoBase);
  const rreo = useRealRREO(search.cidade);
  const ibgeReal = useRealIbge(search.cidade);
  const caged = useRealCaged(search.cidade);
  const cagedSetor = useRealCagedSetor(search.cidade);
  const saneamento = useRealSaneamento(search.cidade);
  const saude = useRealSaude(search.cidade);
  const souPolo =
    ibgeReal.status === "ready" && ibgeReal.data.entorno ? ibgeReal.data.entorno.souPolo : undefined;
  const serieResumo = useMemo(
    () =>
      serie.status === "ready"
        ? {
            cagrPropria: serie.data.cagrPropria,
            cagrTransf: serie.data.cagrTransf,
            volatilidade: serie.data.volatilidade,
            anos: serie.data.anos.length,
            popPorAno: serie.data.anos
              .filter((a) => a.populacao > 0)
              .map((a) => ({ ano: a.ano, pop: a.populacao })),
          }
        : undefined,
    [serie],
  );
  const baseCity = search.cidade ? getCityProfile(search.cidade) : undefined;
  const capitalId =
    baseCity && !baseCity.isCapital ? (UF_BY_SIGLA[baseCity.uf]?.capitalId ?? undefined) : undefined;
  const capitalReal = useRealFinancas(capitalId);
  const capitalName = capitalId ? getMunicipio(capitalId)?.n : undefined;
  const funcoesNamed: NamedValue[] | undefined = useMemo(() => {
    if (funcoes.status !== "ready") return undefined;
    return funcoes.data.funcoes.map((f) => ({
      key: `f${f.codigo}`,
      label: f.nome,
      value: f.valor,
    }));
  }, [funcoes]);
  const city = useMemo(() => {
    if (baseCity && real.status === "ready") {
      return (
        getCityProfileWithReal(baseCity.id, real.data, {
          funcoes: funcoesNamed,
          serie: serieResumo,
          souPolo,
        }) ?? baseCity
      );
    }
    return baseCity;
  }, [baseCity, real, funcoesNamed, serieResumo, souPolo]);
  const peers = useMemo(
    () => (search.vs ?? []).map((id) => getCityProfile(id)).filter((p) => p != null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [search.vs ? search.vs.join(",") : ""],
  );
  const selectedMun = search.cidade ? getMunicipio(search.cidade) : undefined;

  function goCity(id: number) {
    const mun = getMunicipio(id);
    void navigate({
      search: {
        cidade: id,
        uf: mun?.u,
        vs: (search.vs ?? []).filter((v) => v !== id),
      },
    });
  }

  function goUf(sigla: string) {
    if (!sigla) {
      void navigate({ search: {} });
      return;
    }
    void navigate({ search: { uf: sigla } });
  }

  function goCompare(id: number) {
    if (!search.cidade || id === search.cidade) return;
    const cur = search.vs ?? [];
    if (cur.includes(id) || cur.length >= 3) return;
    void navigate({ search: { ...search, vs: [...cur, id] } });
  }

  function clearCompare() {
    void navigate({ search: { cidade: search.cidade, uf: search.uf } });
  }

  function removeCompare(id: number) {
    const cur = (search.vs ?? []).filter((v) => v !== id);
    void navigate({ search: { ...search, vs: cur.length > 0 ? cur : undefined } });
  }

  function swapCompare(id: number) {
    if (!search.cidade) return;
    const peerMun = getMunicipio(id);
    const rest = (search.vs ?? []).filter((v) => v !== id);
    void navigate({
      search: {
        cidade: id,
        uf: peerMun?.u,
        vs: [search.cidade, ...rest].slice(0, 3),
      },
    });
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-6">
          <button
            type="button"
            onClick={() => void navigate({ search: {} })}
            className="flex items-center gap-2 text-left"
          >
            <span className="flex size-9 items-center justify-center rounded-md bg-secondary">
              <Compass className="size-4" />
            </span>
            <span>
              <span className="block font-display text-lg leading-none tracking-tight">Atlas Municipal</span>
              <span className="text-xs text-muted-foreground">Saúde das cidades</span>
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <CitySearch
              uf={city ? undefined : search.uf}
              selected={selectedMun}
              onSelect={goCity}
              placeholder="Buscar qualquer município"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 pb-16">
        {city ? (
          <CityDashboard
            city={city}
            peers={peers}
            real={real}
            funcoes={funcoes}
            serie={serie}
            patrimonio={patrimonio}
            rgf={rgf}
            qualidade={qualidade}
            rreo={rreo}
            capitalReal={capitalReal}
            capitalName={capitalName}
            ibgeReal={ibgeReal}
            caged={caged}
            cagedSetor={cagedSetor}
            saneamento={saneamento}
            saudeReal={saude}
            baseReceita={baseCity?.kpis.receita ?? city.kpis.receita}
            onBack={() => goUf(city.uf)}
            onCompare={goCompare}
            onClearCompare={clearCompare}
            onRemoveCompare={removeCompare}
            onSwap={swapCompare}
          />
        ) : (
          <NationalOverview
            overview={overview}
            uf={search.uf}
            onSelectUf={goUf}
            onSelectCity={goCity}
          />
        )}
      </main>
    </div>
  );
}
