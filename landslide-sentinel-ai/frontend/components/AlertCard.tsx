import type { AlertItem } from "../lib/api";

const LEVEL_STYLES: Record<string, string> = {
  low: "border-risk-low/40 bg-risk-low/10 text-risk-low",
  moderate: "border-risk-moderate/40 bg-risk-moderate/10 text-risk-moderate",
  high: "border-risk-high/40 bg-risk-high/10 text-risk-high",
  critical: "border-risk-critical/40 bg-risk-critical/10 text-risk-critical",
};

export default function AlertCard({
  alert,
  onResolve,
}: {
  alert: AlertItem;
  onResolve?: (id: number) => void;
}) {
  const style = LEVEL_STYLES[alert.risk_level] ?? LEVEL_STYLES.low;

  return (
    <div className={`rounded-lg border p-4 flex items-start justify-between gap-4 ${style}`}>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide">
            {alert.risk_level}
          </span>
          <span className="text-sm text-slate-300">{alert.site_name}</span>
        </div>
        <p className="mt-1 text-sm text-slate-200">{alert.message}</p>
        <p className="mt-1 text-xs text-slate-500">
          {new Date(alert.created_at).toLocaleString()}
        </p>
      </div>
      {onResolve && !alert.is_resolved && (
        <button
          onClick={() => onResolve(alert.id)}
          className="shrink-0 text-xs px-3 py-1.5 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          Resolve
        </button>
      )}
    </div>
  );
}
