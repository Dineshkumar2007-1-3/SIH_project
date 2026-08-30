"use client";

import { useEffect, useState, useCallback } from "react";
import { api, type SiteWeather, type Earthquake, type WorldSummary } from "../../lib/api";

function getWeatherEmoji(code: number): string {
  if (code <= 1) return "\u2600\uFE0F";
  if (code <= 3) return "\u26C5";
  if (code <= 48) return "\uD83C\uDF2B\uFE0F";
  if (code <= 55) return "\uD83C\uDF26\uFE0F";
  if (code <= 65) return "\uD83C\uDF27\uFE0F";
  if (code <= 75) return "\u2744\uFE0F";
  if (code <= 82) return "\uD83C\uDF26\uFE0F";
  return "\u26A1";
}

function getMagnitudeColor(mag: number): string {
  if (mag >= 5) return "#ff453a";
  if (mag >= 4) return "#ff9f0a";
  if (mag >= 3) return "#ffd60a";
  return "#30d158";
}

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
  return "just now";
}

function formatTime(dateString: string): string {
  try {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

export default function WorldPage() {
  const [weather, setWeather] = useState<SiteWeather[]>([]);
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [summary, setSummary] = useState<WorldSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [eqLoading, setEqLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadData = useCallback(async () => {
    try {
      const [w, eq, s] = await Promise.all([
        api.getWorldWeather().catch(() => []),
        api.getEarthquakes(2.5, 72).catch(() => []),
        api.getWorldSummary().catch(() => null),
      ]);
      setWeather(w);
      setEarthquakes(eq);
      setSummary(s);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
      setWeatherLoading(false);
      setEqLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
            <span className="text-3xl">🌍</span>
            Live World Data
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Real-time weather conditions and seismic activity across monitoring sites
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
            Updated {getTimeAgo(lastRefresh.toISOString())}
          </span>
          <button
            onClick={() => { setWeatherLoading(true); setEqLoading(true); loadData(); }}
            className="btn-primary text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card" style={{ borderLeft: "3px solid #0a84ff" }}>
            <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>
              Sites with Rain
            </p>
            <p className="text-2xl font-semibold text-white mt-1">
              {summary.weather.sites_with_rain}
              <span className="text-sm font-normal ml-1" style={{ color: "var(--color-text-tertiary)" }}>
                / {weather.length}
              </span>
            </p>
          </div>
          <div className="stat-card" style={{ borderLeft: "3px solid #0a84ff" }}>
            <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>
              Max Rainfall
            </p>
            <p className="text-2xl font-semibold text-white mt-1">
              {summary.weather.max_rainfall_mm}
              <span className="text-sm font-normal ml-1" style={{ color: "var(--color-text-tertiary)" }}>mm</span>
            </p>
          </div>
          <div className="stat-card" style={{ borderLeft: "3px solid #ff9f0a" }}>
            <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>
              Earthquakes (24h)
            </p>
            <p className="text-2xl font-semibold text-white mt-1">{summary.earthquakes.count_24h}</p>
          </div>
          <div className="stat-card" style={{ borderLeft: "3px solid #30d158" }}>
            <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>
              Avg Temperature
            </p>
            <p className="text-2xl font-semibold text-white mt-1">
              {summary.weather.average_temperature_c}
              <span className="text-sm font-normal ml-1" style={{ color: "var(--color-text-tertiary)" }}>\u00B0C</span>
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Weather Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-xl">🌧️</span> Live Weather
            </h2>
            <span className="text-[11px] px-2 py-1 rounded-full" style={{ background: "rgba(10,132,255,0.12)", color: "#0a84ff" }}>
              Open-Meteo
            </span>
          </div>

          {weatherLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card p-5 h-28 animate-shimmer" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {weather.map((w, i) => (
                <div
                  key={w.site_name || i}
                  className="card p-5 group hover:scale-[1.01] transition-transform duration-200"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {w.error ? (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <p className="text-sm font-medium text-white">{w.site_name}</p>
                        <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{w.error}</p>
                      </div>
                    </div>
                  ) : w.current ? (
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{getWeatherEmoji(w.current.weather_code)}</span>
                          <div>
                            <p className="text-sm font-semibold text-white">{w.site_name}</p>
                            <p className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
                              {w.current.weather_description}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-white">{w.current.temperature_c}\u00B0</p>
                          <p className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>Celsius</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-3 mt-3">
                        <div className="text-center">
                          <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>Rain</p>
                          <p className="text-sm font-semibold" style={{ color: w.current.rain_mm > 10 ? "#0a84ff" : "white" }}>
                            {w.current.rain_mm ?? w.current.precipitation_mm ?? 0} mm
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>Humidity</p>
                          <p className="text-sm font-semibold text-white">{w.current.humidity_pct}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>Wind</p>
                          <p className="text-sm font-semibold text-white">{w.current.wind_speed_kmh} km/h</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>Dir</p>
                          <p className="text-sm font-semibold text-white">{w.current.wind_direction_deg}\u00B0</p>
                        </div>
                      </div>

                      {/* Forecast row */}
                      {w.forecast && w.forecast.length > 0 && (
                        <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
                          {w.forecast.map((f, fi) => (
                            <div key={fi} className="flex-1 text-center">
                              <p className="text-[10px]" style={{ color: "var(--color-text-tertiary)" }}>
                                {f.date ? new Date(f.date).toLocaleDateString("en-US", { weekday: "short" }) : ""}
                              </p>
                              <p className="text-xs font-medium text-white">
                                {f.min_temp_c}\u00B0 / {f.max_temp_c}\u00B0
                              </p>
                              <p className="text-[10px]" style={{ color: "#0a84ff" }}>
                                {f.precipitation_probability_pct ?? 0}% rain
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Earthquake Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-xl">🔴</span> Earthquake Activity
            </h2>
            <span className="text-[11px] px-2 py-1 rounded-full" style={{ background: "rgba(255,159,10,0.12)", color: "#ff9f0a" }}>
              USGS Live
            </span>
          </div>

          {eqLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="card p-4 h-16 animate-shimmer" />
              ))}
            </div>
          ) : earthquakes.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-4xl mb-3">🌏</p>
              <p className="text-sm font-medium text-white">No recent earthquakes</p>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-tertiary)" }}>
                No M2.5+ events in the past 72 hours near monitoring sites
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
              {earthquakes.map((eq, i) => (
                <div
                  key={eq.id || i}
                  className="card p-4 flex items-start gap-3 hover:scale-[1.01] transition-transform duration-150"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
                    style={{
                      background: `${getMagnitudeColor(eq.magnitude)}18`,
                      color: getMagnitudeColor(eq.magnitude),
                      border: `1px solid ${getMagnitudeColor(eq.magnitude)}30`,
                    }}
                  >
                    {eq.magnitude?.toFixed(1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{eq.place}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
                        Depth: {eq.depth_km?.toFixed(1)} km
                      </span>
                      {eq.felt && (
                        <span className="text-[11px]" style={{ color: "var(--color-accent-orange)" }}>
                          Felt: {eq.felt}
                        </span>
                      )}
                      {eq.tsunami === 1 && (
                        <span className="text-[11px] font-semibold" style={{ color: "#ff453a" }}>
                          TSUNAMI
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] font-medium" style={{ color: "var(--color-text-tertiary)" }}>
                      {eq.time ? getTimeAgo(eq.time) : ""}
                    </p>
                    {eq.url && (
                      <a
                        href={eq.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] mt-1 inline-block"
                        style={{ color: "var(--color-accent-blue)" }}
                      >
                        Details \u2192
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Risk Context Banner */}
      <div
        className="card p-6"
        style={{
          background: "linear-gradient(135deg, rgba(10,132,255,0.08) 0%, rgba(191,90,242,0.08) 100%)",
          border: "1px solid rgba(10,132,255,0.15)",
        }}
      >
        <div className="flex items-start gap-4">
          <div className="text-3xl">🔬</div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">How This Data Helps</h3>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              Live weather data from Open-Meteo feeds directly into our landslide risk models.
              Heavy rainfall is the primary trigger for landslides in the Western Ghats and Himalayan regions.
              Seismic activity from USGS is cross-referenced with terrain vulnerability data to identify
              compound risk zones where earthquakes could destabilize saturated slopes.
              This real-time integration ensures our alerts reflect actual environmental conditions, not just historical patterns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
