import type { HealthStatus } from "./generate";

export const HEALTH_STATUS: Record<
  HealthStatus,
  {
    label: string;
    variant: "success" | "default" | "warning" | "danger";
    short: string;
  }
> = {
  prosperando: {
    label: "Quadro favorável",
    variant: "success",
    short: "Indicadores acima da média em emprego e receita própria",
  },
  estavel: {
    label: "Quadro intermediário",
    variant: "default",
    short: "Indicadores próximos da média, sem tendência forte",
  },
  estagnada: {
    label: "Quadro de estagnação",
    variant: "warning",
    short: "Baixa tração de vagas e população no cenário central",
  },
  risco: {
    label: "Quadro de atenção",
    variant: "danger",
    short: "Dependência elevada e sinais de aperto fiscal",
  },
  declinio: {
    label: "Quadro crítico",
    variant: "danger",
    short: "Retração de gente, vagas e fôlego fiscal no cenário central",
  },
};

export const MORAR_LABELS = {
  boa: "Condições favoráveis para morar e trabalhar",
  ressalvas: "Condições intermediárias",
  limitada: "Condições restritas",
  evitar: "Condições muito restritas",
} as const;
