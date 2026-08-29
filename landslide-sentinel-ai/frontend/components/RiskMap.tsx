"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export interface RiskSite {
  site_name: string;
  latitude: number;
  longitude: number;
  risk_level: "low" | "moderate" | "high" | "critical";
}

const LEVEL_COLORS: Record<string, string> = {
  low: "#30d158",
  moderate: "#ffd60a",
  high: "#ff9f0a",
  critical: "#ff453a",
};

const LEVEL_SIZES: Record<string, number> = {
  low: 8,
  moderate: 10,
  high: 12,
  critical: 14,
};

export default function RiskMap({
  sites,
  center = [20.5937, 78.9629],
  zoom = 5,
}: {
  sites: RiskSite[];
  center?: [number, number];
  zoom?: number;
}) {
  return (
    <div className="h-full w-full rounded-2xl overflow-hidden relative" style={{ minHeight: "500px" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%", background: "#0a0a0a" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {sites.map((site, i) =>
          site.latitude !== null && site.longitude !== null ? (
            <CircleMarker
              key={`${site.site_name}-${i}`}
              center={[site.latitude, site.longitude]}
              radius={LEVEL_SIZES[site.risk_level]}
              pathOptions={{
                color: LEVEL_COLORS[site.risk_level],
                fillColor: LEVEL_COLORS[site.risk_level],
                fillOpacity: 0.6,
                weight: 2,
                opacity: 0.8,
              }}
            >
              <Popup>
                <div style={{ fontFamily: "Inter, system-ui, sans-serif", padding: "4px 0" }}>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "#1a1a1a", marginBottom: "4px" }}>
                    {site.site_name}
                  </div>
                  <div style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    background: `${LEVEL_COLORS[site.risk_level]}18`,
                    color: LEVEL_COLORS[site.risk_level],
                  }}>
                    {site.risk_level}
                  </div>
                  <div style={{ fontSize: "11px", color: "#666", marginTop: "6px" }}>
                    {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ) : null
        )}
      </MapContainer>

      {/* Map overlay controls */}
      <div
        className="absolute top-3 left-3 z-20 px-3 py-1.5 rounded-lg"
        style={{
          background: "rgba(17,17,19,0.9)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
          Dark Mode • CARTO Basemap
        </span>
      </div>

      {/* Legend */}
      <div
        className="absolute bottom-3 left-3 z-20 px-3 py-2 rounded-lg"
        style={{
          background: "rgba(17,17,19,0.9)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center gap-3">
          {Object.entries(LEVEL_COLORS).map(([level, color]) => (
            <div key={level} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="text-[10px] font-medium capitalize" style={{ color: "rgba(255,255,255,0.5)" }}>
                {level}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
