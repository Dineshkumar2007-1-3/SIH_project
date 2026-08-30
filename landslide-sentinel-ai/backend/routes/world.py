"""
routes/world.py — Real-world data integration.

Fetches live weather from Open-Meteo (free, no API key) and earthquake
data from USGS for each monitored site, providing context for landslide risk.

Uses stdlib urllib (no extra dependencies needed).
"""

import asyncio
import json
from datetime import datetime, timedelta
from urllib.request import urlopen, Request
from urllib.parse import urlencode
from urllib.error import URLError

from fastapi import APIRouter

router = APIRouter(prefix="/world", tags=["world"])

OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast"
USGS_EARTHQUAKE_FEED = "https://earthquake.usgs.gov/fdsnws/event/1/query"

WMO_CODES = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Moderate drizzle",
    55: "Dense drizzle", 61: "Slight rain", 63: "Moderate rain",
    65: "Heavy rain", 71: "Slight snow", 73: "Moderate snow",
    75: "Heavy snow", 80: "Slight rain showers", 81: "Moderate rain showers",
    82: "Violent rain showers", 85: "Slight snow showers", 86: "Heavy snow showers",
    95: "Thunderstorm", 96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def _fetch_json_sync(url: str) -> dict:
    """Fetch JSON from a URL using stdlib."""
    req = Request(url, headers={"User-Agent": "LandslideSentinelAI/1.0"})
    with urlopen(req, timeout=25) as resp:
        return json.loads(resp.read().decode())


def _fetch_weather_for_site_sync(site: dict) -> dict:
    """Fetch current weather from Open-Meteo for a single site."""
    try:
        params = urlencode({
            "latitude": site["latitude"],
            "longitude": site["longitude"],
            "current": ",".join([
                "temperature_2m", "relative_humidity_2m", "precipitation",
                "rain", "weather_code", "wind_speed_10m", "wind_direction_10m",
            ]),
            "daily": ",".join([
                "temperature_2m_max", "temperature_2m_min",
                "precipitation_sum", "precipitation_probability_max", "weather_code",
            ]),
            "timezone": "Asia/Kolkata",
            "forecast_days": 3,
        })
        data = _fetch_json_sync(f"{OPEN_METEO_BASE}?{params}")
        current = data.get("current", {})
        daily = data.get("daily", {})
        weather_code = current.get("weather_code", 0)

        return {
            "site_name": site["name"],
            "latitude": site["latitude"],
            "longitude": site["longitude"],
            "current": {
                "temperature_c": current.get("temperature_2m"),
                "humidity_pct": current.get("relative_humidity_2m"),
                "precipitation_mm": current.get("precipitation"),
                "rain_mm": current.get("rain"),
                "weather_code": weather_code,
                "weather_description": WMO_CODES.get(weather_code, "Unknown"),
                "wind_speed_kmh": current.get("wind_speed_10m"),
                "wind_direction_deg": current.get("wind_direction_10m"),
                "observation_time": current.get("time"),
            },
            "forecast": [
                {
                    "date": daily.get("time", [])[i],
                    "max_temp_c": (daily.get("temperature_2m_max") or [])[i] if i < len(daily.get("temperature_2m_max") or []) else None,
                    "min_temp_c": (daily.get("temperature_2m_min") or [])[i] if i < len(daily.get("temperature_2m_min") or []) else None,
                    "precipitation_mm": (daily.get("precipitation_sum") or [])[i] if i < len(daily.get("precipitation_sum") or []) else None,
                    "precipitation_probability_pct": (daily.get("precipitation_probability_max") or [])[i] if i < len(daily.get("precipitation_probability_max") or []) else None,
                }
                for i in range(min(3, len(daily.get("time") or [])))
            ],
            "fetched_at": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        return {"site_name": site["name"], "error": str(e), "fetched_at": datetime.utcnow().isoformat()}


def _fetch_earthquakes_sync(min_magnitude: float = 2.5, hours_back: int = 72) -> list:
    """Fetch recent earthquakes from USGS near India."""
    try:
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours_back)

        params = urlencode({
            "format": "geojson",
            "starttime": start_time.strftime("%Y-%m-%dT%H:%M:%S"),
            "endtime": end_time.strftime("%Y-%m-%dT%H:%M:%S"),
            "minlatitude": 3.5,
            "maxlatitude": 38.0,
            "minlongitude": 66.0,
            "maxlongitude": 100.0,
            "minmagnitude": min_magnitude,
            "orderby": "time",
            "limit": 50,
        })

        data = _fetch_json_sync(f"{USGS_EARTHQUAKE_FEED}?{params}")
        features = data.get("features", [])
        earthquakes = []
        for f in features:
            props = f.get("properties", {})
            coords = f.get("geometry", {}).get("coordinates", [0, 0, 0])
            earthquakes.append({
                "id": f.get("id"),
                "magnitude": props.get("mag"),
                "magnitude_type": props.get("magType"),
                "place": props.get("place", "Unknown location"),
                "time": datetime.fromtimestamp(props["time"] / 1000).isoformat() if props.get("time") else None,
                "longitude": coords[0] if len(coords) > 0 else None,
                "latitude": coords[1] if len(coords) > 1 else None,
                "depth_km": coords[2] if len(coords) > 2 else None,
                "tsunami": props.get("tsunami", 0),
                "felt": props.get("felt"),
                "significance": props.get("sig"),
                "url": props.get("url"),
            })
        return earthquakes
    except Exception as e:
        return [{"error": str(e)}]


# Simple in-memory cache
_weather_cache: dict = {}
_weather_cache_time: float = 0
_CACHE_TTL = 300  # 5 minutes


@router.get("/weather")
async def get_weather_all_sites():
    """Get current weather for all monitoring sites (cached for 5 min)."""
    global _weather_cache, _weather_cache_time

    now = datetime.utcnow().timestamp()
    if _weather_cache and (now - _weather_cache_time) < _CACHE_TTL:
        return _weather_cache

    from routes.simulation import MONITOR_SITES

    results = await asyncio.gather(*[
        asyncio.to_thread(_fetch_weather_for_site_sync, site)
        for site in MONITOR_SITES
    ])

    _weather_cache = results
    _weather_cache_time = now
    return results


@router.get("/weather/{site_name}")
async def get_weather_for_site(site_name: str):
    """Get current weather for a specific monitoring site."""
    from routes.simulation import MONITOR_SITES
    site = next((s for s in MONITOR_SITES if s["name"].lower() == site_name.lower()), None)
    if not site:
        return {"error": f"Site '{site_name}' not found"}
    try:
        return await asyncio.to_thread(_fetch_weather_for_site_sync, site)
    except Exception as e:
        return {"site_name": site_name, "error": str(e)}


@router.get("/earthquakes")
async def get_earthquakes(min_magnitude: float = 2.5, hours_back: int = 72):
    """Get recent earthquakes in the India region from USGS."""
    try:
        return await asyncio.to_thread(_fetch_earthquakes_sync, min_magnitude, hours_back)
    except Exception:
        return []


@router.get("/summary")
async def get_world_summary():
    """Combined summary of weather + earthquakes for the dashboard."""
    weather = await get_weather_all_sites()
    earthquakes = await get_earthquakes(min_magnitude=3.0, hours_back=24)

    sites_with_rain = 0
    total_rainfall = 0.0
    max_rainfall = 0.0
    avg_temp = 0.0
    temp_count = 0

    for w in weather:
        if isinstance(w, dict) and "current" in w:
            c = w["current"]
            rain = c.get("rain_mm") or c.get("precipitation_mm") or 0
            if rain and rain > 0:
                sites_with_rain += 1
                total_rainfall += rain
                max_rainfall = max(max_rainfall, rain)
            t = c.get("temperature_c")
            if t is not None:
                avg_temp += t
                temp_count += 1

    if temp_count > 0:
        avg_temp = round(avg_temp / temp_count, 1)

    eq_count = len([e for e in earthquakes if isinstance(e, dict) and e.get("magnitude")])
    max_mag = max((e.get("magnitude", 0) for e in earthquakes if isinstance(e, dict)), default=0)

    return {
        "weather": {
            "sites_with_rain": sites_with_rain,
            "total_rainfall_mm": round(total_rainfall, 1),
            "max_rainfall_mm": round(max_rainfall, 1),
            "average_temperature_c": avg_temp,
        },
        "earthquakes": {
            "count_24h": eq_count,
            "max_magnitude": max_mag,
        },
        "updated_at": datetime.utcnow().isoformat(),
    }
