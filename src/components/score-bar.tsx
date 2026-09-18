import { cn } from "@/lib/utils";

export function ScoreBar({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number;
  hint?: string;
  tone?: "default" | "good" | "bad" | "warn";
}) {
  const width = Math.max(4, Math.min(100, value));
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="tabular text-muted-foreground">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full bg-primary",
            tone === "good" && "bg-success",
            tone === "bad" && "bg-destructive",
            tone === "warn" && "bg-warning",
          )}
          style={{ width: `${width}%` }}
        />
      </div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
