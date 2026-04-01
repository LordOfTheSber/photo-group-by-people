# Backend

## Run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## PostgreSQL

1. Create a database, for example `face_photo_sorter`.
2. Copy `.env.example` to `.env`.
3. Set `FPS_DATABASE_URL` in `.env`, for example:
   `postgresql+psycopg://postgres:postgres@localhost:5432/face_photo_sorter`

## API (Phase 1 + 2)

- `GET /health` — health check.
- `POST /scan` — start recursive image ingestion job.
- `GET /scan/jobs/{job_id}` — get scan job status and counters.
