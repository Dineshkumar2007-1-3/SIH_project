"use client";

import { useEffect, useState } from "react";
import { api, type Prediction, type AlertItem } from "../../lib/api";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

const RISK_COLORS: Record<string, string> = {
  low: "#30d158",
  moderate: "#ffd60a",
  high: "#ff9f0a",
  critical: "#ff453a",
};

export default function AnalyticsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [preds, alts] = await Promise.all([
          api.getPredictions(),
          api.getAlerts(false),
        ]);
        setPredictions(preds);
        setAlerts(alts);
      } catch {
        // Backend might not be running
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Computed analytics
  const totalPredictions = predictions.length;
  const totalAlerts = alerts.length;
  const activeAlerts = alerts.filter((a) => a.is_resolved === 0).length;
  const resolvedAlerts = alerts.filter((a) => a.is_resolved === 1).length;

  const riskDistribution = [
    { name: "Low", value: predictions.filter((p) => p.risk_level === "low").length, color: RISK_COLORS.low },
    { name: "Moderate", value: predictions.filter((p) => p.risk_level === "moderate").length, color: RISK_COLORS.moderate },
    { name: "High", value: predictions.filter((p) => p.risk_level === "high").length, color: RISK_COLORS.high },
    { name: "Critical", value: predictions.filter((p) => p.risk_level === "critical").length, color: RISK_COLORS.critical },
  ].filter((d) => d.value > 0);

  // Alert distribution
  const alertDistribution = [
    { name: "Active", value: activeAlerts, color: "#0a84ff" },
    { name: "Resolved", value: resolvedAlerts, color: "#30d158" },
  ].filter((d) => d.value > 0);

  // Top sites by alert count
  const siteAlertCounts: Record<string, number> = {};
  alerts.forEach((alert) => {
    siteAlertCounts[alert.site_name] = (siteAlertCounts[alert.site_name] || 0) + 1;
  });
  const topAlertSites = Object.entries(siteAlertCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([site, count]) => ({ site, count }));

  // Risk probability distribution (bucketed)
  const probabilityBuckets = [
    { range: "0-20%", count: predictions.filter((p) => p.risk_probability < 0.2).length, color: RISK_COLORS.low },
    { range: "20-40%", count: predictions.filter((p) => p.risk_probability >= 0.2 && p.risk_probability < 0.4).length, color: RISK_COLORS.moderate },
    { range: "40-60%", count: predictions.filter((p) => p.risk_probability >= 0.4 && p.risk_probability < 0.6).length, color: RISK_COLORS.moderate },
    { range: "60-80%", count: predictions.filter((p) => p.risk_probability >= 0.6 && p.risk_probability < 0.8).length, color: RISK_COLORS.high },
    { range: "80-100%", count: predictions.filter((p) => p.risk_probability >= 0.8).length, color: RISK_COLORS.critical },
  ];

  // Timeline data (last 10 predictions by time)
  const timelineData = predictions
    .slice(0, 20)
    .reverse()
    .map((p, i) => ({
      index: i + 1,
      probability: Math.round(p.risk_probability * 100),
      site: p.site_name.substring(0, 10),
    }));

  if (loading) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto">
        <div className="space-y-6">
          <div className="h-8 w-48 skeleton" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-5 h-24 animate-shimmer" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="card p-5 h-64 animate-shimmer" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Analytics</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
          Comprehensive overview of landslide risk data
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Predictions" value={totalPredictions} color="var(--color-accent-purple)" />
        <MetricCard label="Total Alerts" value={totalAlerts} color="var(--color-accent-blue)" />
        <MetricCard label="Active Alerts" value={activeAlerts} color="var(--color-risk-critical)" />
        <MetricCard
          label="Resolution Rate"
          value={totalAlerts > 0 ? `${Math.round((resolvedAlerts / totalAlerts) * 100)}%` : "—"}
          color="var(--color-accent-green)"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Risk Distribution Pie */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Risk Level Distribution</h3>
          {riskDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="value"
                    stroke="none"
                  >
                    {riskDistribution.map((entry, i) => (
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
              <div className="flex justify-center gap-4 mt-2">
                {riskDistribution.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                      {d.name} ({d.value})
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[250px] flex items-center justify-center" style={{ color: "var(--color-text-tertiary)" }}>
              No prediction data
            </div>
          )}
        </div>

        {/* Alert Status Pie */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Alert Status</h3>
          {alertDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={alertDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="value"
                    stroke="none"
                  >
                    {alertDistribution.map((entry, i) => (
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
              <div className="flex justify-center gap-4 mt-2">
                {alertDistribution.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                      {d.name} ({d.value})
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[250px] flex items-center justify-center" style={{ color: "var(--color-text-tertiary)" }}>
              No alert data
            </div>
          )}
        </div>
      </div>

      {/* Probability Distribution Bar Chart */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Risk Probability Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={probabilityBuckets}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="range" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: "rgba(28,28,30,0.95)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "white",
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {probabilityBuckets.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Timeline + Top Sites */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timeline */}
        <div className="card lg:col-span-2 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Prediction Timeline</h3>
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="timelineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0a84ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0a84ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="site" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} tickLine={false} axisLine={false} />
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
                <Area type="monotone" dataKey="probability" stroke="#0a84ff" fill="url(#timelineGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center" style={{ color: "var(--color-text-tertiary)" }}>
              No data
            </div>
          )}
        </div>

        {/* Top Alert Sites */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Top Alert Sites</h3>
          {topAlertSites.length > 0 ? (
            <div className="space-y-3">
              {topAlertSites.map((site, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        color: "var(--color-text-tertiary)",
                      }}
                    >
                      {i + 1}
                    </div>
                    <span className="text-sm font-medium text-white truncate max-w-[120px]">
                      {site.site}
                    </span>
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {site.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center" style={{ color: "var(--color-text-tertiary)" }}>
              <p className="text-sm">No alert data</p>
            </div>
          )}
        </div>
      </div>

      {/* Export Section */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Export Data</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>
              Download analytics data for offline analysis
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => alert("CSV export — Coming soon")}
              className="btn-secondary text-sm"
            >
              Export CSV
            </button>
            <button
              onClick={() => alert("PDF export — Coming soon")}
              className="btn-primary text-sm"
            >
              Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="stat-card">
      <p className="text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>
        {label}
      </p>
      <p className="text-2xl font-semibold tracking-tight text-white mt-1">{value}</p>
      <div className="mt-2 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}>
        <div className="h-full rounded-full" style={{ background: color, width: `${Math.min(100, (Number(value) || 0) / 10)}%` }} />
      </div>
    </div>
  );
}
