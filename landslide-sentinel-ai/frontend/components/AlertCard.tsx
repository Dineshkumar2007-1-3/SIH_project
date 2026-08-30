"use client";

import type { AlertItem } from "../lib/api";

const RISK_COLORS: Record<string, string> = {
  low: "#30d158",
  moderate: "#ffd60a",
  high: "#ff9f0a",
  critical: "#ff453a",
};

const RISK_BG: Record<string, string> = {
  low: "rgba(48,209,88,0.08)",
  moderate: "rgba(255,214,10,0.08)",
  high: "rgba(255,159,10,0.08)",
  critical: "rgba(255,69,58,0.08)",
};

const RISK_BORDER: Record<string, string> = {
  low: "rgba(48,209,88,0.15)",
  moderate: "rgba(255,214,10,0.15)",
  high: "rgba(255,159,10,0.15)",
  critical: "rgba(255,69,58,0.15)",
};

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return "now";
}

export default function AlertCard({
  alert,
  onResolve,
}: {
  alert: AlertItem;
  onResolve?: (id: number) => void;
}) {
  return (
    <div
      className="flex items-start gap-4 p-5 rounded-2xl transition-all duration-200"
      style={{
        background: RISK_BG[alert.risk_level],
        border: `1px solid ${RISK_BORDER[alert.risk_level]}`,
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${RISK_COLORS[alert.risk_level]}15` }}
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{ background: RISK_COLORS[alert.risk_level] }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{
              background: `${RISK_COLORS[alert.risk_level]}15`,
              color: RISK_COLORS[alert.risk_level],
            }}
          >
            {alert.risk_level}
          </span>
          <span className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
            {getTimeAgo(alert.created_at)}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-white">{alert.site_name}</h3>
        <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>
          {alert.message}
        </p>
      </div>

      {onResolve && !alert.is_resolved && (
        <button
          onClick={() => onResolve(alert.id)}
          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-secondary)",
          }}
        >
          Resolve
        </button>
      )}
    </div>
  );
}
