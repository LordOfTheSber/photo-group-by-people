# Face Photo Sorter

Monorepo scaffold for a local-first app that groups photos by people.

## Structure

- `backend/` — FastAPI skeleton with health endpoint.
- `frontend/` — React + TypeScript + Vite skeleton.
- `data/` — local runtime artifacts (`previews`, `embeddings`, `exports`, `logs`).
- `docs/execution-plan.md` — full phased implementation plan.

## Quick start

### 1) Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Health check: `http://127.0.0.1:8000/health`

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Default dev URL is printed by Vite (usually `http://127.0.0.1:5173`).
