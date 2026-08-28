"use client";

import { useState } from "react";
import { api } from "../lib/api";

export default function ReportForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const [siteName, setSiteName] = useState("");
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [severity, setSeverity] = useState("unverified");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
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
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-800 p-5">
      <div>
        <label className="block text-sm text-slate-400 mb-1">Site / location name</label>
        <input
          required
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
          className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
          placeholder="e.g. Munnar Hillside Road, Sector 4"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1">What did you observe?</label>
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
          placeholder="Cracks in the road, soil movement, unusual water flow, etc."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Your name (optional)</label>
          <input
            value={reporterName}
            onChange={(e) => setReporterName(e.target.value)}
            className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Perceived severity</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
          >
            <option value="unverified">Unverified</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-risk-critical">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit report"}
      </button>
    </form>
  );
}
