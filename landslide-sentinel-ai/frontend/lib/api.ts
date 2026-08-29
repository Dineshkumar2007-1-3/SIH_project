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

// Real-world data types
export interface SiteWeather {
  site_name: string;
  latitude: number;
  longitude: number;
  current?: {
    temperature_c: number;
    humidity_pct: number;
    precipitation_mm: number;
    rain_mm: number;
    weather_code: number;
    weather_description: string;
    wind_speed_kmh: number;
    wind_direction_deg: number;
    observation_time: string;
  };
  forecast?: Array<{
    date: string;
    max_temp_c: number;
    min_temp_c: number;
    precipitation_mm: number;
    precipitation_probability_pct: number;
  }>;
  error?: string;
  fetched_at: string;
}

export interface Earthquake {
  id: string;
  magnitude: number;
  magnitude_type: string;
  place: string;
  time: string;
  longitude: number;
  latitude: number;
  depth_km: number;
  tsunami: number;
  felt: number | null;
  significance: number;
  url: string;
}

export interface WorldSummary {
  weather: {
    sites_with_rain: number;
    total_rainfall_mm: number;
    max_rainfall_mm: number;
    average_temperature_c: number;
  };
  earthquakes: {
    count_24h: number;
    max_magnitude: number;
  };
  updated_at: string;
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

// WebSocket types
export interface WebSocketMessage {
  type: 'prediction' | 'alert' | 'report';
  data: any;
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
  // Real-world data
  getWorldWeather: () => apiFetch<SiteWeather[]>("/world/weather"),
  getSiteWeather: (name: string) => apiFetch<SiteWeather>(`/world/weather/${encodeURIComponent(name)}`),
  getEarthquakes: (minMag = 2.5, hours = 72) =>
    apiFetch<Earthquake[]>(`/world/earthquakes?min_magnitude=${minMag}&hours_back=${hours}`),
  getWorldSummary: () => apiFetch<WorldSummary>("/world/summary"),
};

// WebSocket hook exports will be used directly in components
// export { usePredictionsWS, useAlertsWS, useReportsWS } from './hooks/useWebSocket';
