"""
train.py — Trains a landslide risk classifier from dataset.csv.

Features:
    rainfall_mm, slope_angle, soil_moisture, vegetation_cover,
    elevation_m, previous_landslides
Target:
    risk_label (0 = low/no risk, 1 = high risk)

Usage:
    python train.py
Outputs:
    model.pkl        — trained RandomForestClassifier (+ scaler) bundle
    metrics.json      — evaluation metrics from the held-out test split
"""

import json
import pickle
from pathlib import Path

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

DATA_PATH = Path(__file__).parent / "dataset.csv"
MODEL_PATH = Path(__file__).parent / "model.pkl"
METRICS_PATH = Path(__file__).parent / "metrics.json"

FEATURE_COLUMNS = [
    "rainfall_mm",
    "slope_angle",
    "soil_moisture",
    "vegetation_cover",
    "elevation_m",
    "previous_landslides",
]
TARGET_COLUMN = "risk_label"


def load_data() -> pd.DataFrame:
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found at {DATA_PATH}. Replace dataset.csv with real "
            "sensor/historical landslide records before training for production use."
        )
    return pd.read_csv(DATA_PATH)


def train() -> None:
    df = load_data()

    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y if y.nunique() > 1 else None
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=6,
        min_samples_leaf=2,
        random_state=42,
        class_weight="balanced",
    )
    model.fit(X_train_scaled, y_train)

    y_pred = model.predict(X_test_scaled)

    metrics = {
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "precision": round(precision_score(y_test, y_pred, zero_division=0), 4),
        "recall": round(recall_score(y_test, y_pred, zero_division=0), 4),
        "f1_score": round(f1_score(y_test, y_pred, zero_division=0), 4),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
        "feature_importances": dict(
            zip(FEATURE_COLUMNS, [round(v, 4) for v in model.feature_importances_])
        ),
        "n_train_samples": len(X_train),
        "n_test_samples": len(X_test),
    }

    print(classification_report(y_test, y_pred, zero_division=0))
    print("Metrics:", json.dumps(metrics, indent=2))

    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)

    bundle = {
        "model": model,
        "scaler": scaler,
        "feature_columns": FEATURE_COLUMNS,
    }
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(bundle, f)

    print(f"\nSaved model to {MODEL_PATH}")
    print(f"Saved metrics to {METRICS_PATH}")


if __name__ == "__main__":
    train()
