"use client";

import { useEffect, useState, useMemo } from "react";
import { api, type Prediction, type AlertItem, type SiteWeather } from "../../lib/api";
import { usePredictionsWS, useAlertsWS } from "../../hooks/useWebSocket";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const RISK_COLORS: Record<string, string> = {
  low: "#30d158",
  moderate: "#ffd60a",
  high: "#ff9f0a",
  critical: "#ff453a",
};

const RISK_BG: Record<string, string> = {
  low: "rgba(48,209,88,0.12)",
  moderate: "rgba(255,214,10,0.12)",
  high: "rgba(255,159,10,0.12)",
  critical: "rgba(255,69,58,0.12)",
};

const RISK_BORDER: Record<string, string> = {
  low: "rgba(48,209,88,0.2)",
  moderate: "rgba(255,214,10,0.2)",
  high: "rgba(255,159,10,0.2)",
  critical: "rgba(255,69,58,0.2)",
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

function getWeatherEmoji(code: number): string {
  if (code <= 1) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 65) return "🌧️";
  if (code <= 75) return "❄️";
  if (code <= 82) return "🌦️";
  return "⛈️";
}

export default function DashboardPage() {
  const { predictions: wsPredictions, isConnected: predWs } = usePredictionsWS();
  const { alerts: wsAlerts, isConnected: alertWs } = useAlertsWS();

  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [weather, setWeather] = useState<SiteWeather[]>([]);
  const [loading, setLoading] = useState(true);

  const isConnected = predWs || alertWs;

  useEffect(() => {
    const load = async () => {
      try {
        const [preds, activeAlts, w] = await Promise.all([
          api.getPredictions(),
          api.getAlerts(true),
          api.getWorldWeather().catch(() => []),
        ]);
        setPredictions(preds);
        setAlerts(activeAlts);
        setWeather(w);
      } catch {
        // Backend might not be running
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (wsPredictions.length > 0) setPredictions(wsPredictions);
  }, [wsPredictions]);

  useEffect(() => {
    if (wsAlerts.length > 0) setAlerts(wsAlerts);
  }, [wsAlerts]);

  const stats = useMemo(() => {
    const activeAlerts = alerts.length;
    const criticalAlerts = alerts.filter((a) => a.risk_level === "critical").length;
    const highAlerts = alerts.filter((a) => a.risk_level === "high").length;
    const totalPredictions = predictions.length;
    const avgRisk =
      predictions.length > 0
        ? predictions.reduce((s, p) => s + p.risk_probability, 0) / predictions.length
        : 0;

    const distribution = [
      { name: "Low", value: predictions.filter((p) => p.risk_level === "low").length, color: RISK_COLORS.low },
      { name: "Moderate", value: predictions.filter((p) => p.risk_level === "moderate").length, color: RISK_COLORS.moderate },
      { name: "High", value: predictions.filter((p) => p.risk_level === "high").length, color: RISK_COLORS.high },
      { name: "Critical", value: predictions.filter((p) => p.risk_level === "critical").length, color: RISK_COLORS.critical },
    ].filter((d) => d.value > 0);

    const trendData = predictions
      .slice(0, 10)
      .reverse()
      .map((p, i) => ({
        index: i + 1,
        risk: Math.round(p.risk_probability * 100),
        name: p.site_name.substring(0, 12),
      }));

    return { activeAlerts, criticalAlerts, highAlerts, totalPredictions, avgRisk, distribution, trendData };
  }, [alerts, predictions]);

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Monitoring Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
            Real-time landslide risk overview with live world data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <span className={`status-dot ${isConnected ? "status-dot-connected" : "status-dot-disconnected"}`} />
            <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
              {isConnected ? "Live" : "Offline"}
            </span>
          </div>
          <button
            onClick={async () => {
              try {
                await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/simulation/generate`, { method: "POST" });
              } catch {}
            }}
            className="btn-primary text-sm"
          >
            Generate Data
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Alerts"
          value={stats.activeAlerts}
          icon={<BellIcon />}
          color="var(--color-accent-blue)"
          subtitle={`${stats.criticalAlerts} critical`}
        />
        <StatCard
          label="Critical Sites"
          value={stats.criticalAlerts}
          icon={<WarningIcon />}
          color="var(--color-risk-critical)"
          subtitle="Immediate attention"
          pulse={stats.criticalAlerts > 0}
        />
        <StatCard
          label="Predictions"
          value={stats.totalPredictions}
          icon={<ChartIcon />}
          color="var(--color-accent-purple)"
          subtitle="Total assessments"
        />
        <StatCard
          label="Avg Risk"
          value={`${Math.round(stats.avgRisk * 100)}%`}
          icon={<ShieldIcon />}
          color={stats.avgRisk > 0.5 ? "var(--color-risk-high)" : "var(--color-accent-green)"}
          subtitle="Across all sites"
        />
      </div>

      {/* Live Weather Quick Strip */}
      {weather.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              🌧️ Live Weather Conditions
            </h3>
            <a href="/world" className="text-xs font-medium" style={{ color: "var(--color-accent-blue)" }}>
              View all →
            </a>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {weather.slice(0, 4).map((w, i) => (
              <div
                key={w.site_name || i}
                className="p-3 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border)" }}
              >
                {w.current && !w.error ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{getWeatherEmoji(w.current.weather_code)}</span>
                      <span className="text-xs font-medium text-white truncate">{w.site_name}</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-bold text-white">{w.current.temperature_c}°C</span>
                      <span className="text-[11px]" style={{ color: "#0a84ff" }}>
                        {w.current.rain_mm ?? 0}mm rain
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⏳</span>
                    <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>Loading...</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend Chart */}
        <div className="card lg:col-span-2 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Risk Trend</h3>
          {stats.trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.trendData}>
                <defs>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent-blue)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-accent-blue)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(28,28,30,0.95)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "white",
                  }}
                />
                <Area type="monotone" dataKey="risk" stroke="var(--color-accent-blue)" fill="url(#riskGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center" style={{ color: "var(--color-text-tertiary)" }}>
              <p className="text-sm">Generate data to see trends</p>
            </div>
          )}
        </div>

        {/* Distribution Pie */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Risk Distribution</h3>
          {stats.distribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={stats.distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats.distribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "rgba(28,28,30,0.95)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "white",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2">
                {stats.distribution.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      {d.name} ({d.value})
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center" style={{ color: "var(--color-text-tertiary)" }}>
              <p className="text-sm">No data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Alerts + Recent Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Alerts Feed */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Active Alerts</h3>
            <a href="/alerts" className="text-xs font-medium" style={{ color: "var(--color-accent-blue)" }}>
              View all →
            </a>
          </div>
          {alerts.length === 0 ? (
            <div className="py-10 text-center" style={{ color: "var(--color-text-tertiary)" }}>
              <p className="text-sm">No active alerts</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {alerts.slice(0, 8).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-xl transition-all duration-150"
                  style={{
                    background: RISK_BG[alert.risk_level],
                    border: `1px solid ${RISK_BORDER[alert.risk_level]}`,
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ background: RISK_COLORS[alert.risk_level] }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white truncate">{alert.site_name}</p>
                      <span className="text-[11px] shrink-0" style={{ color: "var(--color-text-tertiary)" }}>
                        {getTimeAgo(alert.created_at)}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--color-text-secondary)" }}>
                      {alert.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Predictions Table */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Recent Predictions</h3>
          </div>
          {predictions.length === 0 ? (
            <div className="py-10 text-center" style={{ color: "var(--color-text-tertiary)" }}>
              <p className="text-sm">No predictions yet</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Site</th>
                    <th>Risk</th>
                    <th>Probability</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.slice(0, 8).map((p, i) => (
                    <tr key={i}>
                      <td>
                        <span className="text-white font-medium">{p.site_name}</span>
                      </td>
                      <td>
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
                          style={{
                            background: RISK_BG[p.risk_level],
                            color: RISK_COLORS[p.risk_level],
                            border: `1px solid ${RISK_BORDER[p.risk_level]}`,
                          }}
                        >
                          {p.risk_level}
                        </span>
                      </td>
                      <td>
                        <span className="text-white tabular-nums">
                          {(p.risk_probability * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <span style={{ color: "var(--color-text-tertiary)" }}>
                          {getTimeAgo(p.created_at)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  subtitle,
  pulse = false,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  pulse?: boolean;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${color}15` }}
          >
            <div style={{ color }}>{icon}</div>
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>
              {label}
            </p>
            <div className="flex items-baseline gap-2">
              <p
                className="text-2xl font-semibold tracking-tight text-white"
                style={pulse ? { color } : undefined}
              >
                {value}
              </p>
              {subtitle && (
                <p className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BellIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}
