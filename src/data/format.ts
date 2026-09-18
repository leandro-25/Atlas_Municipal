const pt = new Intl.NumberFormat("pt-BR");
const pt1 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const pt0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

export function formatInt(n: number): string {
  return pt.format(Math.round(n));
}

export function formatPct(n: number, digits = 1): string {
  return `${n.toLocaleString("pt-BR", { maximumFractionDigits: digits, minimumFractionDigits: digits })}%`;
}

export function formatBRL(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 1_000_000_000) return `${sign}R$ ${pt1.format(abs / 1_000_000_000)} bi`;
  if (abs >= 1_000_000) return `${sign}R$ ${pt1.format(abs / 1_000_000)} mi`;
  if (abs >= 1_000) return `${sign}R$ ${pt0.format(abs / 1_000)} mil`;
  return `${sign}R$ ${pt0.format(abs)}`;
}

export function formatBRLFull(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return (n as number).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function formatCompact(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 1_000_000_000) return `${sign}${pt1.format(abs / 1_000_000_000)} bi`;
  if (abs >= 1_000_000) return `${sign}${pt1.format(abs / 1_000_000)} mi`;
  if (abs >= 1_000) return `${sign}${pt1.format(abs / 1_000)} mil`;
  return `${sign}${pt.format(Math.round(abs))}`;
}

export function formatRate(n: number): string {
  const sign = n >= 0 ? "+" : "−";
  return `${sign}${Math.abs(n * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })}% a.a.`;
}

export function formatIdhm(n: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

export function formatScore(n: number): string {
  return Math.round(n).toString();
}