"use client";

import { useEffect, useState } from "react";
import { api, type AlertItem } from "../../lib/api";
import { useAlertsWS } from "../../hooks/useWebSocket";

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

type FilterType = "all" | "critical" | "high" | "moderate" | "low";

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

export default function AlertsPage() {
  const { alerts: wsAlerts, isConnected } = useAlertsWS();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    api
      .getAlerts(true)
      .then(setAlerts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (wsAlerts.length > 0) {
      setAlerts((prev) => {
        const existingIds = new Set(prev.map((a) => a.id));
        const newAlerts = wsAlerts.filter((a) => !existingIds.has(a.id));
        return [...newAlerts, ...prev];
      });
    }
  }, [wsAlerts]);

  async function handleResolve(id: number) {
    try {
      await api.resolveAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch {}
  }

  const filteredAlerts = alerts.filter(
    (a) => filter === "all" || a.risk_level === filter
  );

  const counts = {
    all: alerts.length,
    critical: alerts.filter((a) => a.risk_level === "critical").length,
    high: alerts.filter((a) => a.risk_level === "high").length,
    moderate: alerts.filter((a) => a.risk_level === "moderate").length,
    low: alerts.filter((a) => a.risk_level === "low").length,
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Alerts</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
            Active landslide risk alerts across monitored sites
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`status-dot ${isConnected ? "status-dot-connected" : "status-dot-disconnected"}`} />
          <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
            {isConnected ? "Live" : "Offline"}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "var(--color-bg-elevated)" }}>
        {(["all", "critical", "high", "moderate", "low"] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150"
            style={{
              background: filter === f ? "rgba(255,255,255,0.08)" : "transparent",
              color: filter === f ? "white" : "var(--color-text-secondary)",
            }}
          >
            {f !== "all" && (
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: RISK_COLORS[f] }}
              />
            )}
            <span className="capitalize">{f}</span>
            <span
              className="text-[11px] px-1.5 py-0.5 rounded-full font-medium"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "var(--color-text-tertiary)",
              }}
            >
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Alert Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 animate-shimmer h-24" />
          ))}
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(255,255,255,0.04)" }}>
            <svg className="w-6 h-6" style={{ color: "var(--color-text-tertiary)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>
          <p className="text-sm font-medium text-white">No active alerts</p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-tertiary)" }}>
            All sites are within safe parameters
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="group flex items-start gap-4 p-5 rounded-2xl transition-all duration-200"
              style={{
                background: RISK_BG[alert.risk_level],
                border: `1px solid ${RISK_BORDER[alert.risk_level]}`,
              }}
            >
              {/* Severity indicator */}
              <div className="shrink-0 mt-0.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${RISK_COLORS[alert.risk_level]}15` }}
                >
                  {alert.risk_level === "critical" ? (
                    <svg className="w-5 h-5" style={{ color: RISK_COLORS[alert.risk_level] }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  ) : alert.risk_level === "high" ? (
                    <svg className="w-5 h-5" style={{ color: RISK_COLORS[alert.risk_level] }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" style={{ color: RISK_COLORS[alert.risk_level] }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4m0 4h.01" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
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

              {/* Actions */}
              <div className="shrink-0 flex items-center gap-2">
                {alert.latitude && alert.longitude && (
                  <a
                    href={`/map?lat=${alert.latitude}&lng=${alert.longitude}`}
                    className="btn-ghost p-2 rounded-lg"
                    title="View on map"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </a>
                )}
                {!alert.is_resolved && (
                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text-secondary)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                      e.currentTarget.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                      e.currentTarget.style.color = "var(--color-text-secondary)";
                    }}
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
