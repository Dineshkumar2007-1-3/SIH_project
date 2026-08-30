"use client";

import { useState } from "react";
import { api } from "../lib/api";
import { usePredictionsWS, useAlertsWS, useReportsWS } from "../hooks/useWebSocket";

export default function ReportForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const [siteName, setSiteName] = useState("");
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [severity, setSeverity] = useState("unverified");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number | null; longitude: number | null }>({
    latitude: null,
    longitude: null
  });
  const [locationSelectionMode, setLocationSelectionMode] = useState(false);

  // WebSocket hooks for real-time updates (we don't need the data but need the connection)
  useReportsWS();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.createReport({
        reporter_name: reporterName || null,
        site_name: siteName,
        description,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        severity,
      });
      setSiteName("");
      setDescription("");
      setReporterName("");
      setSeverity("unverified");
      setImagePreview(null);
      setSelectedLocation({ latitude: null, longitude: null });
      setLocationSelectionMode(false);
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError("Please select an image file");
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image file too large (max 5MB)");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({ latitude: lat, longitude: lng });
    setLocationSelectionMode(false);
  };

  const handleClearLocation = () => {
    setSelectedLocation({ latitude: null, longitude: null });
  };

  const handleClearImage = () => {
    setImagePreview(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-slate-800 p-6">
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">
            Site / location name
          </label>
          <div className="space-y-2">
            <input
              required
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Munnar Hillside Road, Sector 4"
            />
            {selectedLocation.latitude !== null && selectedLocation.longitude !== null && (
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-500 rounded-full"></span>
                <span>Location selected on map</span>
                <button
                  type="button"
                  onClick={handleClearLocation}
                  className="ml-auto text-xs text-slate-400 hover:text-slate-300"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">
            What did you observe?
          </label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500"
            placeholder="Cracks in the road, soil movement, unusual water flow, etc."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Your name (optional)
            </label>
            <input
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Perceived severity
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="unverified">Unverified</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-400">
              Photo (optional)
            </label>
            <button
              type="button"
              onClick={() => document.getElementById('image-upload')?.click()}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {imagePreview ? 'Change' : 'Add photo'}
            </button>
          </div>

          {imagePreview && (
            <div className="mt-3">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-slate-500">Preview</span>
                <button
                  onClick={handleClearImage}
                  className="text-xs text-slate-400 hover:text-slate-300"
                >
                  Remove
                </button>
              </div>
              <img
                src={imagePreview}
                alt="Uploaded image preview"
                className="max-w-xs rounded border border-slate-700"
                style={{ maxHeight: '200px', objectFit: 'cover' }}
              />
            </div>
          )}

          <input
            type="file"
            id="image-upload"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">Location Selection</h3>
            <button
              type="button"
              onClick={() => setLocationSelectionMode(true)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium
                ${locationSelectionMode ? 'bg-slate-800 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}
              `}
            >
              {locationSelectionMode ? 'Cancel' : 'Select on Map'}
            </button>
          </div>

          {locationSelectionMode && (
            <div className="mt-4">
              <div className="space-y-3">
                <p className="text-sm text-slate-400">
                  Click on the map below to select a location for your report:
                </p>
                <div id="report-map-preview" className="h-48 w-full rounded-lg border border-slate-700 bg-slate-900/50">
                  {/* In a real implementation, this would be an interactive map */}
                  <div className="flex h-full items-center justify-center text-slate-500">
                    Interactive map would appear here
                    <br />
                    <span className="text-xs">(Integration with RiskMap component)</span>
                  </div>
                </div>
                {selectedLocation.latitude !== null && selectedLocation.longitude !== null && (
                  <div className="text-xs text-slate-500">
                    Selected: {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
                  </div>
                )}
              </div>
            </div>
          )}

          {!locationSelectionMode && selectedLocation.latitude !== null && selectedLocation.longitude !== null && (
            <div className="text-xs text-slate-500 mt-2">
              Location: {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
              <button
                onClick={handleClearLocation}
                className="ml-2 text-xs text-slate-400 hover:text-slate-300"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-2">
          <p className="text-sm text-risk-critical">{error}</p>
        </div>
      )}

      <div className="mt-4">
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-all"
        >
          {submitting ? "Submitting..." : "Submit report"}
        </button>
      </div>
    </form>
  );
}
