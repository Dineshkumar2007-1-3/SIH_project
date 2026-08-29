"use client";

import { useEffect, useState } from "react";
import { api, type ReportItem } from "../../lib/api";

const SEVERITY_COLORS: Record<string, string> = {
  unverified: "rgba(255,255,255,0.15)",
  low: "rgba(48,209,88,0.15)",
  medium: "rgba(255,214,10,0.15)",
  high: "rgba(255,69,58,0.15)",
};

const SEVERITY_TEXT: Record<string, string> = {
  unverified: "var(--color-text-tertiary)",
  low: "#30d158",
  medium: "#ffd60a",
  high: "#ff453a",
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

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [siteName, setSiteName] = useState("");
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [severity, setSeverity] = useState("unverified");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  function load() {
    setLoading(true);
    api
      .getReports()
      .then(setReports)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(false);
    try {
      await api.createReport({
        reporter_name: reporterName || null,
        site_name: siteName,
        description,
        latitude: null,
        longitude: null,
        severity,
      });
      setSiteName("");
      setDescription("");
      setReporterName("");
      setSeverity("unverified");
      setFormSuccess(true);
      load();
      setTimeout(() => setFormSuccess(false), 3000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Reports</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
          Community and field observations of ground movement
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-white mb-5">Submit a Report</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Site Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>
                  Site / Location Name *
                </label>
                <input
                  required
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Munnar Hillside Road"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>
                  Observation *
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="textarea-field"
                  placeholder="Cracks in road, soil movement, unusual water flow..."
                />
              </div>

              {/* Name + Severity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>
                    Your Name
                  </label>
                  <input
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="input-field"
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>
                    Severity
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="select-field"
                  >
                    <option value="unverified">Unverified</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              {/* Success/Error Messages */}
              {formError && (
                <div className="p-3 rounded-xl text-sm" style={{ background: "rgba(255,69,58,0.08)", color: "var(--color-risk-critical)" }}>
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 rounded-xl text-sm" style={{ background: "rgba(48,209,88,0.08)", color: "var(--color-accent-green)" }}>
                  Report submitted successfully
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full"
              >
                {submitting ? "Submitting…" : "Submit Report"}
              </button>
            </form>
          </div>
        </div>

        {/* Reports List */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Recent Reports</h3>
            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
              {reports.length} total
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-5 h-24 animate-shimmer" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(255,255,255,0.04)" }}>
                <svg className="w-6 h-6" style={{ color: "var(--color-text-tertiary)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-white">No reports yet</p>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-tertiary)" }}>
                Be the first to submit a field observation
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="card p-5 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-white">{report.site_name}</h4>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{
                            background: SEVERITY_COLORS[report.severity] || SEVERITY_COLORS.unverified,
                            color: SEVERITY_TEXT[report.severity] || SEVERITY_TEXT.unverified,
                          }}
                        >
                          {report.severity}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>
                        {report.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {report.reporter_name && (
                          <span className="text-[11px] flex items-center gap-1" style={{ color: "var(--color-text-tertiary)" }}>
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                            {report.reporter_name}
                          </span>
                        )}
                        <span className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
                          {getTimeAgo(report.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
