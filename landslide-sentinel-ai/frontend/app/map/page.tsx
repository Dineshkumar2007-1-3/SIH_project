"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { api, type AlertItem } from "../../lib/api";
import type { RiskSite } from "../../components/RiskMap";

const RiskMap = dynamic(() => import("../../components/RiskMap"), { ssr: false });

const RISK_COLORS: Record<string, string> = {
  low: "#30d158",
  moderate: "#ffd60a",
  high: "#ff9f0a",
  critical: "#ff453a",
};

export default function MapPage() {
  const [sites, setSites] = useState<RiskSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState<RiskSite | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    api
      .getAlerts(true)
      .then((alerts: AlertItem[]) => {
        const withCoords = alerts.filter(
          (a) => a.latitude != null && a.longitude != null
        );
        setSites(
          withCoords.map((a) => ({
            site_name: a.site_name,
            latitude: a.latitude as number,
            longitude: a.longitude as number,
            risk_level: a.risk_level,
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: sites.length,
    critical: sites.filter((s) => s.risk_level === "critical").length,
    high: sites.filter((s) => s.risk_level === "high").length,
    moderate: sites.filter((s) => s.risk_level === "moderate").length,
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Risk Map</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
            Geographic view of monitored sites with active alerts
          </p>
        </div>
        <button
          onClick={async () => {
            try {
              await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/simulation/generate`, { method: "POST" });
              // Reload data
              const alerts = await api.getAlerts(true);
              const withCoords = alerts.filter(
                (a) => a.latitude != null && a.longitude != null
              );
              setSites(
                withCoords.map((a) => ({
                  site_name: a.site_name,
                  latitude: a.latitude as number,
                  longitude: a.longitude as number,
                  risk_level: a.risk_level,
                }))
              );
            } catch {}
          }}
          className="btn-primary text-sm"
        >
          Refresh Data
        </button>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: "var(--color-risk-critical)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
            {stats.critical} Critical
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: "var(--color-risk-high)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
            {stats.high} High
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: "var(--color-risk-moderate)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
            {stats.moderate} Moderate
          </span>
        </div>
        <div className="ml-auto">
          <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
            {stats.total} total monitored sites
          </span>
        </div>
      </div>

      {/* Map Container */}
      <div className="card overflow-hidden p-0" style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}>
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 mx-auto rounded-xl animate-shimmer" style={{ background: "rgba(255,255,255,0.04)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>Loading map…</p>
            </div>
          </div>
        ) : (
          <RiskMap sites={sites} />
        )}
      </div>

      {/* Site List */}
      {sites.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Monitored Sites</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {sites.map((site, i) => (
              <div
                key={i}
                className="p-3 rounded-xl transition-all duration-150 cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--color-border)",
                }}
                onClick={() => {
                  setSelectedSite(site);
                  setShowPanel(true);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = RISK_COLORS[site.risk_level];
                  e.currentTarget.style.background = `${RISK_COLORS[site.risk_level]}08`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: RISK_COLORS[site.risk_level] }}
                  />
                  <span className="text-sm font-medium text-white truncate">{site.site_name}</span>
                </div>
                <p className="text-[11px] ml-4" style={{ color: "var(--color-text-tertiary)" }}>
                  {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
