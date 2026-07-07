import { cn } from "@/lib/utils";

export function ScoreBar({
  label,
  value,
  color = "#8b5cf6",
  invert = false,
  className,
}: {
  label: string;
  value: number;
  color?: string;
  invert?: boolean; // true when lower is better (confusion / churn)
  className?: string;
}) {
  // good = green, bad = rose; if invert, high values are bad
  const good = invert ? value < 40 : value > 60;
  const mid = value >= 40 && value <= 60;
  const tone = mid ? "#64748b" : good ? "#0f172a" : "#475569";
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className="font-mono font-medium" style={{ color: tone }}>
          {Math.round(value)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${Math.max(2, Math.min(100, value))}%`, background: color }}
        />
      </div>
    </div>
  );
}
