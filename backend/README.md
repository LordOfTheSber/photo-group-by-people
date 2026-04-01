# Backend

## Run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Optional ML dependencies

Face detection/embedding/clustering jobs need additional ML packages:

```bash
pip install -r requirements-ml.txt
```

> On Windows, `face-recognition` depends on `dlib` and may require Visual Studio C++ build tools.

## Schema updates

The app applies lightweight backward-compatible startup migrations (for example, adding missing `person_cluster.cover_face_id` and legacy `face` columns like `person_cluster_id`/`thumbnail_path` in older databases).

## PostgreSQL

1. Create a database, for example `face_photo_sorter`.
2. Copy `.env.example` to `.env`.
3. Set `FPS_DATABASE_URL` in `.env`, for example:
   `postgresql+psycopg://postgres:postgres@localhost:5432/face_photo_sorter`
4. Optional: set `FPS_CORS_ORIGINS` (comma-separated) if frontend runs on a different origin.

## API (Phase 1 + 2)

- `GET /health` — health check.
- `POST /scan` — start recursive image ingestion job.
- `GET /scan/jobs/{job_id}` — get scan job status and counters.
