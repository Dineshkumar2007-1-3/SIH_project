"""
prediction.py — Bridges the FastAPI backend to the trained ML model in
../ml-model. Loads the model bundle once and exposes a simple scoring
function used by routes/predictions.py.
"""

import sys
from pathlib import Path

# Make ../ml-model importable so we can reuse predict_risk() instead of
# duplicating model-loading logic.
ML_MODEL_DIR = Path(__file__).resolve().parent.parent / "ml-model"
sys.path.insert(0, str(ML_MODEL_DIR))

try:
    from predict import predict_risk as _predict_risk  # noqa: E402
except FileNotFoundError:
    _predict_risk = None


def get_risk_prediction(features: dict) -> dict:
    """
    features: rainfall_mm, slope_angle, soil_moisture, vegetation_cover,
              elevation_m, previous_landslides
    returns: {"risk_label": int, "risk_probability": float, "risk_level": str}

    Raises RuntimeError if the model hasn't been trained yet
    (i.e. ml-model/model.pkl is missing — run `python train.py` first).
    """
    if _predict_risk is None:
        raise RuntimeError(
            "No trained model found. From ml-model/, run `python train.py` "
            "to generate model.pkl before requesting predictions."
        )
    return _predict_risk(features)
