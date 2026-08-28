const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export type RiskLevel = "low" | "moderate" | "high" | "critical";

export interface Prediction {
  site_name: string;
  risk_label: number;
  risk_probability: number;
  risk_level: RiskLevel;
  created_at: string;
}

export interface AlertItem {
  id: number;
  site_name: string;
  risk_level: RiskLevel;
  message: string;
  latitude: number | null;
  longitude: number | null;
  is_resolved: number;
  created_at: string;
}

export interface ReportItem {
  id: number;
  reporter_name: string | null;
  site_name: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  severity: string;
  created_at: string;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export const api = {
  getPredictions: () => apiFetch<Prediction[]>("/predictions/"),
  getAlerts: (activeOnly = true) =>
    apiFetch<AlertItem[]>(`/alerts/?active_only=${activeOnly}`),
  resolveAlert: (id: number) =>
    apiFetch<AlertItem>(`/alerts/${id}/resolve`, { method: "PATCH" }),
  getReports: () => apiFetch<ReportItem[]>("/reports/"),
  createReport: (payload: Omit<ReportItem, "id" | "created_at">) =>
    apiFetch<ReportItem>("/reports/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
