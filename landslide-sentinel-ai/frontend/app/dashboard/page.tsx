"use client";

import { useEffect, useState } from "react";
import { api, type Prediction, type AlertItem } from "../../lib/api";

const LEVEL_COLORS: Record<string, string> = {
  low: "text-risk-low",
  moderate: "text-risk-moderate",
  high: "text-risk-high",
  critical: "text-risk-critical",
};

export default function DashboardPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getPredictions(), api.getAlerts(true)])
      .then(([p, a]) => {
        setPredictions(p);
        setAlerts(a);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const activeCount = alerts.length;
  const criticalCount = alerts.filter((a) => a.risk_level === "critical").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Dashboard</h1>

      {error && (
        <p className="text-sm text-risk-critical">
          Could not reach the backend ({error}). Is it running on{" "}
          <code>NEXT_PUBLIC_API_BASE_URL</code>?
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Active alerts" value={activeCount} />
        <StatCard label="Critical alerts" value={criticalCount} accent="text-risk-critical" />
        <StatCard label="Recent predictions" value={predictions.length} />
      </div>

      <section>
        <h2 className="text-lg font-medium text-white mb-3">Recent predictions</h2>
        {loading ? (
          <p className="text-slate-500 text-sm">Loading...</p>
        ) : predictions.length === 0 ? (
          <p className="text-slate-500 text-sm">
            No predictions yet. Submit a sensor reading via the backend's
            <code className="mx-1">/predictions/</code> endpoint to see results here.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-slate-400 text-left">
                <tr>
                  <th className="px-4 py-2">Site</th>
                  <th className="px-4 py-2">Risk level</th>
                  <th className="px-4 py-2">Probability</th>
                  <th className="px-4 py-2">Recorded</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((p, i) => (
                  <tr key={i} className="border-t border-slate-800">
                    <td className="px-4 py-2 text-white">{p.site_name}</td>
                    <td className={`px-4 py-2 font-medium ${LEVEL_COLORS[p.risk_level]}`}>
                      {p.risk_level}
                    </td>
                    <td className="px-4 py-2 text-slate-300">
                      {(p.risk_probability * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-2 text-slate-500">
                      {new Date(p.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = "text-white",
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`text-3xl font-semibold mt-1 ${accent}`}>{value}</p>
    </div>
  );
}
