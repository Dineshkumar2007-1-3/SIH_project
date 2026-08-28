# Landslide Sentinel AI

An early-warning system for landslide risk: a scikit-learn model trained on
site conditions (rainfall, slope, soil moisture, vegetation cover, elevation,
prior landslide history), served through a FastAPI backend, and visualized
in a Next.js dashboard with a live risk map, alerts, and community reports.

```
landslide-sentinel-ai/
├── frontend/       Next.js 14 (App Router) + TypeScript + Tailwind
├── backend/        FastAPI + SQLAlchemy (SQLite by default)
├── ml-model/       scikit-learn training + inference scripts
└── assets/         Shared static assets
```

## 1. Train the model

```bash
cd ml-model
pip install -r requirements.txt
python train.py
```

This trains a `RandomForestClassifier` on `dataset.csv` (30 synthetic rows —
**replace with real historical/sensor data before relying on this for
anything production-facing**) and writes `model.pkl` + `metrics.json`.

## 2. Run the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

- Interactive API docs: http://localhost:8000/docs
- The backend loads `../ml-model/model.pkl` at prediction time (via
  `prediction.py`), so step 1 must run first.
- Uses SQLite (`landslide_sentinel.db`) by default — set `DATABASE_URL` to
  point at Postgres/MySQL for production.

Key endpoints:
| Method | Path | Purpose |
|---|---|---|
| POST | `/predictions/` | Submit a sensor reading, get a risk score, auto-creates an alert if risk is high/critical |
| GET | `/predictions/` | List recent predictions |
| GET | `/alerts/` | List alerts (active by default) |
| PATCH | `/alerts/{id}/resolve` | Mark an alert resolved |
| GET/POST | `/reports/` | List/submit field or community reports |

## 3. Run the frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # point NEXT_PUBLIC_API_BASE_URL at your backend
npm run dev
```

Visit http://localhost:3000. Pages:
- `/dashboard` — stats + recent predictions table
- `/map` — Leaflet map of sites with active high/critical alerts
- `/alerts` — active alerts with resolve action
- `/reports` — submit and browse field reports

## Notes on the scaffold

- **Dataset**: `ml-model/dataset.csv` is synthetic placeholder data, just
  enough to make `train.py` runnable end-to-end. Swap in real landslide
  inventory + environmental data for meaningful predictions.
- **Map center**: `RiskMap.tsx` defaults to India's centroid — change this
  (and the zoom level) to your monitored region.
- **Auth**: not included. Add it before exposing report/alert-resolve
  endpoints publicly.
- **Retraining**: re-run `train.py` whenever the dataset changes; the
  backend picks up the new `model.pkl` on next restart.
