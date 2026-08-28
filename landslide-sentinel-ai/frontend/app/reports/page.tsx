"use client";

import { useEffect, useState } from "react";
import { api, type ReportItem } from "../../lib/api";
import ReportForm from "../../components/ReportForm";

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api
      .getReports()
      .then(setReports)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-white mb-4">Submit a Report</h1>
        <ReportForm onSubmitted={load} />
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-white mb-4">Recent Reports</h2>
        {loading ? (
          <p className="text-slate-500 text-sm">Loading...</p>
        ) : reports.length === 0 ? (
          <p className="text-slate-500 text-sm">No reports submitted yet.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="rounded-lg border border-slate-800 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{r.site_name}</span>
                  <span className="text-xs uppercase text-slate-500">{r.severity}</span>
                </div>
                <p className="mt-1 text-sm text-slate-300">{r.description}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {r.reporter_name ? `${r.reporter_name} · ` : ""}
                  {new Date(r.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
