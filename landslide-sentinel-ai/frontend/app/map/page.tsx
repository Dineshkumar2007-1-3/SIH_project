"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { api, type AlertItem } from "../../lib/api";
import type { RiskSite } from "../../components/RiskMap";

// react-leaflet touches `window`, so it must be loaded client-side only.
const RiskMap = dynamic(() => import("../../components/RiskMap"), { ssr: false });

export default function MapPage() {
  const [sites, setSites] = useState<RiskSite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getAlerts(true)
      .then((alerts: AlertItem[]) => {
        const withCoords = alerts.filter(
          (a) => a.latitude != null && a.longitude != null
        );
        setSites(
          withCoords.map((a) => ({
            site_name: a.site_name,
            latitude: a.latitude as number,
            longitude: a.longitude as number,
            risk_level: a.risk_level,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-white">Risk Map</h1>
      <p className="text-sm text-slate-400">
        Sites with active high or critical alerts. Replace the default map
        center in <code>RiskMap.tsx</code> with your monitored region.
      </p>
      {loading ? (
        <p className="text-slate-500 text-sm">Loading map...</p>
      ) : (
        <RiskMap sites={sites} />
      )}
    </div>
  );
}
