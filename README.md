# StructSense

AI-powered **Structural Health Monitoring** image analyzer. Upload a photo of a
civil structure (beam, column, slab, bridge deck) and StructSense returns a
condition score, detected distresses, a maintenance plan, and an NDT follow-up
checklist — all running **fully locally**. No external APIs.

## Architecture

- **Frontend** — React + TypeScript + Tailwind + Recharts + Framer Motion
- **Backend** — Python FastAPI on `localhost:8000` (local model inference)
- **Storage** — `localStorage` (analysis history + NDT checklist state)

## Run the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.

- `GET  /health` → `{ "status": "ok" }`
- `POST /analyze` → multipart `image` upload, returns the full analysis JSON.

## Run the frontend

```bash
npm install
npm run dev
```

The frontend expects the backend at `http://localhost:8000`. To override, set
`VITE_STRUCTSENSE_API` in a `.env` file at the project root.

## Replacing the mock with a real model

`backend/main.py` ships with a deterministic mock so the UI works end-to-end.
To plug in a real model:

1. Drop your model file (ONNX / PyTorch / TF) into `backend/models/`.
2. Load it once at startup — see the `# TODO: load your ONNX or PyTorch model here`
   marker near the top of `main.py`.
3. Replace the body of `run_inference(image)` with real preprocessing
   (resize, normalize, to-tensor) and a `MODEL.run(...)` / `model(image)` call.
4. Map the raw model outputs onto the same response schema the UI consumes
   (`structureType`, `overallHealthScore`, `distressTypes`, `maintenancePlan`,
   `healthSummary`, `ndtChecklist`, …).

The response schema is documented inline in `backend/main.py`.

## Recommended model

> _Leave blank — fill in once you've chosen a model._
>

## Offline use

After the initial `pip install` and `npm install`, the entire stack runs
without any internet connection.
