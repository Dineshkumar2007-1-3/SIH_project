"use client";

import { useEffect, useState } from "react";
import { api, type AlertItem } from "../../lib/api";
import AlertCard from "../../components/AlertCard";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .getAlerts(true)
      .then(setAlerts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleResolve(id: number) {
    await api.resolveAlert(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-white">Active Alerts</h1>

      {error && <p className="text-sm text-risk-critical">{error}</p>}
      {loading && <p className="text-slate-500 text-sm">Loading...</p>}

      {!loading && alerts.length === 0 && !error && (
        <p className="text-slate-500 text-sm">No active alerts right now.</p>
      )}

      <div className="space-y-3">
        {alerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} onResolve={handleResolve} />
        ))}
      </div>
    </div>
  );
}
