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
  low: "#22c55e",
  moderate: "#eab308",
  high: "#f97316",
  critical: "#dc2626",
};

export default function RiskMap({
  sites,
  center = [20.5937, 78.9629], // default: India centroid — replace with your monitored region
  zoom = 5,
}: {
  sites: RiskSite[];
  center?: [number, number];
  zoom?: number;
}) {
  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden border border-slate-800">
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {sites.map((site, i) => (
          <CircleMarker
            key={`${site.site_name}-${i}`}
            center={[site.latitude, site.longitude]}
            radius={10}
            pathOptions={{
              color: LEVEL_COLORS[site.risk_level],
              fillColor: LEVEL_COLORS[site.risk_level],
              fillOpacity: 0.6,
            }}
          >
            <Popup>
              <strong>{site.site_name}</strong>
              <br />
              Risk: {site.risk_level}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
