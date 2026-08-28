"""
predict.py — Loads the trained model bundle and scores new observations.

Usage (CLI):
    python predict.py --rainfall 150 --slope 35 --moisture 55 \
        --vegetation 20 --elevation 900 --previous 2

Usage (import, e.g. from backend/prediction.py):
    from predict import predict_risk
    result = predict_risk({
        "rainfall_mm": 150,
        "slope_angle": 35,
        "soil_moisture": 55,
        "vegetation_cover": 20,
        "elevation_m": 900,
        "previous_landslides": 2,
    })
"""

import argparse
import pickle
from pathlib import Path
from typing import Dict, Any

MODEL_PATH = Path(__file__).parent / "model.pkl"

_bundle_cache: Dict[str, Any] | None = None


def _load_bundle() -> Dict[str, Any]:
    global _bundle_cache
    if _bundle_cache is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"No trained model found at {MODEL_PATH}. Run `python train.py` first."
            )
        with open(MODEL_PATH, "rb") as f:
            _bundle_cache = pickle.load(f)
    return _bundle_cache


def predict_risk(features: Dict[str, float]) -> Dict[str, Any]:
    """
    features: dict with keys rainfall_mm, slope_angle, soil_moisture,
              vegetation_cover, elevation_m, previous_landslides
    returns: {"risk_label": 0|1, "risk_probability": float, "risk_level": str}
    """
    bundle = _load_bundle()
    model = bundle["model"]
    scaler = bundle["scaler"]
    columns = bundle["feature_columns"]

    missing = [c for c in columns if c not in features]
    if missing:
        raise ValueError(f"Missing required features: {missing}")

    ordered = [[features[c] for c in columns]]
    scaled = scaler.transform(ordered)

    label = int(model.predict(scaled)[0])
    proba = float(model.predict_proba(scaled)[0][1])  # probability of class "1" (high risk)

    if proba >= 0.75:
        level = "critical"
    elif proba >= 0.5:
        level = "high"
    elif proba >= 0.25:
        level = "moderate"
    else:
        level = "low"

    return {
        "risk_label": label,
        "risk_probability": round(proba, 4),
        "risk_level": level,
    }


def _cli() -> None:
    parser = argparse.ArgumentParser(description="Predict landslide risk for a single site.")
    parser.add_argument("--rainfall", type=float, required=True, help="Rainfall in mm")
    parser.add_argument("--slope", type=float, required=True, help="Slope angle in degrees")
    parser.add_argument("--moisture", type=float, required=True, help="Soil moisture (%)")
    parser.add_argument("--vegetation", type=float, required=True, help="Vegetation cover (%)")
    parser.add_argument("--elevation", type=float, required=True, help="Elevation in meters")
    parser.add_argument("--previous", type=float, required=True, help="Prior landslide count")
    args = parser.parse_args()

    result = predict_risk(
        {
            "rainfall_mm": args.rainfall,
            "slope_angle": args.slope,
            "soil_moisture": args.moisture,
            "vegetation_cover": args.vegetation,
            "elevation_m": args.elevation,
            "previous_landslides": args.previous,
        }
    )
    print(result)


if __name__ == "__main__":
    _cli()
