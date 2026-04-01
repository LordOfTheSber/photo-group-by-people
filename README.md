# photo-group-by-people# Face Photo Sorter — LLM Execution Plan

## Purpose

This document is the **single source of truth** for building the project **"Фото-сортер по лицам"** with another LLM in a step-by-step manner.

It is designed for later execution in **Cursor** or another coding assistant, where each phase can be sent as a separate instruction.

The goal is to avoid over-engineering and produce a **practical, compact, correct MVP** that:

- scans an existing folder of photos,
- detects faces in each image,
- generates face embeddings using **pretrained models only**,
- clusters similar faces into people groups,
- lets a user review, rename, merge, split, and export results,
- supports both **backend and frontend**,
- remains simple enough for a small team or a single strong developer to build.

---

## Product Definition

### User problem
After an event, the user has hundreds of photos and needs to quickly find all photos containing a particular person.

### Product outcome
A local or self-hosted app that analyzes a folder of photos, groups photos by person, and offers a review/export interface.

### Core output
- People groups such as `Person_1`, `Person_2`, ...
- Face thumbnails / previews
- Person-to-photo mapping
- Exported grouped results
- Optional report

---

## Scope

### In scope
- Existing photos only
- Face detection
- Face embeddings via pretrained inference
- Face clustering
- Multi-face images belonging to multiple groups
- Web UI
- Rename/merge/split/review flows
- Export grouped results
- Metadata persistence
- Preview generation
- Processing progress
- Basic report

### Out of scope
- Model training
- Fine-tuning
- Distributed architecture
- Real-time video
- Mobile apps
- Cloud-scale multi-tenant deployment
- Full identity verification guarantees

---

## Key Constraints

1. **Do not train a model.**
   Use pretrained face detection + face embedding models only.

2. **Do not overbuild.**
   This is not an enterprise platform. It is a focused tool for ~682 photos.

3. **Metadata-first, export-later.**
   Do not immediately duplicate original files everywhere. Store relationships first.

4. **One photo may belong to multiple people.**
   If an image contains 3 people, it must be associated with all 3 person groups.

5. **Human review is part of the product.**
   Clustering will not be perfect. The system must support correction.

6. **Prefer local/self-hosted operation.**
   Privacy matters. Photos and embeddings should remain local unless explicitly configured otherwise.

---

## Recommended Stack

### Backend
- **Language:** Python 3.11+
- **API:** FastAPI
- **Inference runtime:** ONNX Runtime
- **Face analysis:** InsightFace (or compatible pretrained embedding pipeline)
- **Image processing:** OpenCV + Pillow
- **Clustering:** scikit-learn
- **DB:** SQLite
- **Migrations:** Alembic or lightweight schema bootstrap
- **Background tasks:** start simple; use FastAPI background task or a minimal worker only if needed

### Frontend
- **Language:** TypeScript
- **Framework:** React
- **Build tool:** Vite
- **Data fetching:** TanStack Query or simple fetch wrapper
- **State:** keep minimal; local UI state + server state
- **UI approach:** simple grid/list layout, no heavy design system required at MVP

### Why this stack
- Python has the most practical ecosystem for face analysis, image processing, inference, and clustering.
- FastAPI is quick to build with and easy to document.
- React + TypeScript is fast enough for a review UI and easy to extend.
- SQLite fits the project size and simplifies setup.

---

## High-Level Architecture

```text
[User selects photo folder]
          |
          v
[Backend scan images]
          |
          v
[Face detection]
          |
          v
[Face alignment / crop]
          |
          v
[Embedding generation]
          |
          v
[Face clustering]
          |
          v
[Person groups created in metadata]
          |
     +----+----+
     |         |
     v         v
[Preview UI] [Export grouped results]
```

### Main principle
The primary system state is **metadata in the database**, not physical folder duplication.

---

## Core Data Model

At minimum, define these entities.

### `image`
Represents an original photo.

Suggested fields:
- `id`
- `original_path`
- `file_name`
- `file_hash`
- `width`
- `height`
- `created_at`
- `exif_datetime` (nullable)
- `status` (`pending`, `processed`, `failed`)
- `error_message` (nullable)

### `face`
Represents one detected face in one image.

Suggested fields:
- `id`
- `image_id`
- `bbox_x`
- `bbox_y`
- `bbox_w`
- `bbox_h`
- `detection_confidence`
- `embedding_vector_path` or binary reference
- `thumbnail_path`
- `quality_score` (nullable)
- `cluster_id` (nullable)
- `review_status` (`auto`, `confirmed`, `rejected`, `needs_review`)

### `person_cluster`
Represents a predicted person group.

Suggested fields:
- `id`
- `default_label` (e.g. `Person_12`)
- `custom_name` (nullable)
- `cover_face_id` (nullable)
- `created_by_pipeline` (boolean)
- `is_hidden`

### `person_image`
Mapping table to support multi-face photos.

Suggested fields:
- `id`
- `person_cluster_id`
- `image_id`
- `source_face_id`

### `job`
Processing job metadata.

Suggested fields:
- `id`
- `type` (`scan`, `analyze`, `cluster`, `export`)
- `status` (`queued`, `running`, `completed`, `failed`)
- `progress_current`
- `progress_total`
- `message`
- `started_at`
- `finished_at`

### `audit_event` (optional but useful)
Suggested fields:
- `id`
- `event_type` (`rename_cluster`, `merge_clusters`, `split_cluster`, `reassign_face`)
- `payload_json`
- `created_at`

---

## Folder / Repository Structure

Suggested monorepo structure:

```text
face-photo-sorter/
  README.md
  .env.example
  backend/
    app/
      api/
      core/
      db/
      models/
      schemas/
      services/
      workers/
      utils/
      main.py
    tests/
    pyproject.toml
  frontend/
    src/
      api/
      components/
      pages/
      hooks/
      types/
      utils/
      main.tsx
    package.json
  data/
    previews/
    embeddings/
    exports/
    logs/
  scripts/
  docs/
    architecture.md
    execution-notes.md
```

---

## Execution Rules for the LLM

These rules must be included in every execution phase when using another LLM.

### General behavior rules
1. Work only on the current phase.
2. Do not redesign the whole system unless a blocker requires it.
3. Keep implementation pragmatic and minimal.
4. Prefer small, reviewable commits.
5. Do not introduce heavy dependencies without a strong reason.
6. Do not add auth, cloud infra, message brokers, Kubernetes, or microservices.
7. Do not train any ML model.
8. Use pretrained face inference only.
9. Preserve original photos unchanged.
10. Prefer metadata/index relationships over early file copying.

### Output rules for the LLM on each step
For every phase, the LLM should produce:
- what it changed,
- files created/updated,
- commands to run,
- any assumptions made,
- any known limitations,
- the exact acceptance checklist status.

### Coding rules
- Write clear, modular code.
- Add type hints where practical.
- Add docstrings for non-trivial logic.
- Add error handling for file I/O and image decoding.
- Keep interfaces stable.
- Prefer pure helper functions for pipeline logic where possible.

### Review rules
Before writing code, the LLM should:
- inspect the repository structure,
- inspect relevant files,
- preserve existing conventions,
- propose only the minimum required changes for the current phase.

---

## Phase Plan

The phases below are ordered for sequential execution.

---

# Phase 0 — Repository Bootstrap

## Goal
Create the initial project structure for backend and frontend with a runnable skeleton.

## Tasks
- Create monorepo folders.
- Initialize backend with FastAPI.
- Initialize frontend with React + TypeScript + Vite.
- Add environment config examples.
- Add base README with local setup commands.
- Add `.gitignore`.
- Add placeholder data directories.

## Deliverables
- Backend starts locally.
- Frontend starts locally.
- Repo structure matches the plan.

## Acceptance criteria
- `backend` app runs successfully.
- `frontend` app runs successfully.
- Health endpoint returns 200.
- README contains setup instructions.

## Prompt to give the LLM
```text
Execute Phase 0 only.
Build the initial monorepo structure for the Face Photo Sorter project.
Use Python + FastAPI for backend and React + TypeScript + Vite for frontend.
Create only the minimum runnable scaffold needed.
Do not implement business logic yet.
Return:
1) files created/changed,
2) key design decisions,
3) commands to run locally,
4) any assumptions,
5) checklist against the phase acceptance criteria.
```

---

# Phase 1 — Backend Foundation and Database Schema

## Goal
Set up backend architecture, configuration, and initial database schema.

## Tasks
- Add config management.
- Set up SQLite connection.
- Define initial models/tables.
- Add DB initialization/migration strategy.
- Add core API routers structure.
- Add job model and basic job status support.

## Deliverables
- App can initialize database.
- Basic schema exists.
- Core API routes are organized.

## Acceptance criteria
- DB initializes on first run.
- Tables for image, face, person_cluster, person_image, and job exist.
- Health endpoint works.
- API structure is ready for future endpoints.

## Prompt to give the LLM
```text
Execute Phase 1 only.
Implement the backend foundation for the Face Photo Sorter project.
Set up configuration, SQLite integration, initial schema/models, and clean API structure.
Do not implement face detection or clustering yet.
Keep everything minimal and maintainable.
Return:
1) summary of architecture choices,
2) files changed,
3) migration/init instructions,
4) commands to run,
5) acceptance checklist.
```

---

# Phase 2 — Image Scanning and Ingestion Pipeline

## Goal
Support selecting/scanning a folder of images and registering them in metadata.

## Tasks
- Implement recursive folder scan.
- Support common image formats.
- Compute stable file hash.
- Extract basic metadata: width, height, file name, optional EXIF datetime.
- Skip duplicates based on hash or path strategy.
- Create a processing job entry.
- Expose API endpoint to start scan.
- Expose API endpoint to get scan job status.

## Deliverables
- Folder can be scanned into DB.
- Images show up as registered records.
- Duplicate handling exists.

## Acceptance criteria
- A folder with images can be scanned through the API.
- Images are stored in DB with metadata.
- Duplicate files are not re-imported incorrectly.
- Failed image decoding is handled safely.

## Prompt to give the LLM
```text
Execute Phase 2 only.
Implement image ingestion for the Face Photo Sorter project.
Add recursive folder scanning, supported image filtering, file hashing, metadata extraction, duplicate handling, job tracking, and API endpoints to start scanning and check progress.
Do not implement face analysis yet.
Keep original files untouched.
Return:
1) files changed,
2) API endpoints added,
3) commands/tests to run,
4) assumptions,
5) acceptance checklist.
```

---

# Phase 3 — Face Detection and Thumbnail Generation

## Goal
Detect faces on imported photos and generate face thumbnails.

## Tasks
- Integrate pretrained face detection.
- For each image, detect one or more faces.
- Store bounding boxes and confidence.
- Crop and save normalized face thumbnails.
- Update processing statuses and job progress.
- Handle images with zero faces.
- Handle corrupted/unsupported files robustly.

## Deliverables
- Face records linked to images.
- Face thumbnails generated.
- Progress visible.

## Acceptance criteria
- Multiple faces in a single image are supported.
- Zero-face images do not crash the pipeline.
- Face thumbnails are saved and linked.
- Detection metadata is stored.

## Prompt to give the LLM
```text
Execute Phase 3 only.
Add pretrained face detection to the backend pipeline.
For each imported image, detect all faces, store bounding boxes/confidence, generate face thumbnails, and persist results.
Do not implement clustering yet.
The implementation must support multiple faces per image and robust error handling.
Return:
1) files changed,
2) detection library/runtime decisions,
3) commands to run,
4) known limitations,
5) acceptance checklist.
```

---

# Phase 4 — Embedding Generation

## Goal
Generate face embeddings for each detected face using pretrained inference.

## Tasks
- Integrate pretrained embedding model.
- Generate embeddings for each face thumbnail or aligned face crop.
- Persist embeddings in a practical way.
- Track failures and retry-safe behavior.
- Ensure embedding generation can be run independently after detection.

## Deliverables
- Every valid face has an embedding.
- Embedding storage is implemented.

## Acceptance criteria
- Embeddings are produced for detected faces.
- Failed embeddings do not crash the whole job.
- Embeddings are stored consistently.

## Prompt to give the LLM
```text
Execute Phase 4 only.
Implement face embedding generation using pretrained inference only.
Store embeddings in a practical local format and connect them to the existing face records.
Keep the design simple for ~682 photos.
Do not add model training, vector DBs, or distributed systems.
Return:
1) files changed,
2) embedding storage approach,
3) commands/tests to run,
4) failure handling notes,
5) acceptance checklist.
```

---

# Phase 5 — Clustering and Person Group Creation

## Goal
Group similar faces into predicted person clusters.

## Tasks
- Implement clustering using a pragmatic default, preferably DBSCAN first.
- Create person cluster records.
- Assign each face to a cluster or mark as unclustered/noise.
- Derive person-to-image relationships.
- Auto-generate default labels like `Person_1`, `Person_2`.
- Choose a cover face/thumbnail for each person cluster.

## Deliverables
- Person groups exist.
- Images are associated with groups.
- Noise/unclustered faces are handled.

## Acceptance criteria
- Cluster creation works on existing embeddings.
- Each cluster has a stable label.
- Multi-face images map to multiple people.
- Unclustered faces are retained, not discarded.

## Prompt to give the LLM
```text
Execute Phase 5 only.
Implement clustering for the Face Photo Sorter project using a pragmatic default approach suitable for a few hundred photos.
Prefer DBSCAN first unless a clear reason suggests otherwise.
Create person groups, face-to-cluster assignments, and person-to-image mappings.
Keep uncertain faces available for later review.
Return:
1) files changed,
2) clustering logic summary,
3) tuning parameters exposed or documented,
4) commands/tests to run,
5) acceptance checklist.
```

---

# Phase 6 — Core Read API for the Frontend

## Goal
Expose read endpoints needed by the UI.

## Tasks
- Add endpoint to list jobs and job status.
- Add endpoint to list person clusters.
- Add endpoint to get person cluster details.
- Add endpoint to list images for a cluster.
- Add endpoint to serve thumbnails/previews safely.
- Add pagination/basic filtering where useful.

## Deliverables
- Frontend can load people groups and drill into details.

## Acceptance criteria
- Cluster list endpoint returns summary data.
- Cluster detail endpoint returns images/faces.
- Preview endpoints work for thumbnails.
- API responses are typed and stable.

## Prompt to give the LLM
```text
Execute Phase 6 only.
Add the minimum read APIs required for a frontend review interface.
Expose endpoints for jobs, person clusters, cluster details, associated images, and preview assets.
Keep response models explicit and stable.
Return:
1) files changed,
2) endpoints added,
3) sample response shapes,
4) commands/tests to run,
5) acceptance checklist.
```

---

# Phase 7 — Frontend Skeleton and Processing Flow

## Goal
Create the basic frontend app and connect it to the backend.

## Tasks
- Create app shell and routing.
- Add page for selecting a folder path or starting an existing processing flow.
- Add page showing processing progress.
- Add page listing person clusters in a grid.
- Add minimal API client.
- Add loading/error states.

## Deliverables
- User can move through the core app flow.

## Acceptance criteria
- Frontend builds successfully.
- Jobs/progress render.
- Person clusters render.
- Error/loading states are handled.

## Prompt to give the LLM
```text
Execute Phase 7 only.
Build the minimal frontend shell for the Face Photo Sorter project using React + TypeScript.
Create the core pages and connect them to the existing backend APIs.
Do not over-design the UI.
Prioritize clarity and correct data flow.
Return:
1) files changed,
2) pages/components added,
3) commands to run,
4) assumptions or limitations,
5) acceptance checklist.
```

---

# Phase 8 — Cluster Review UI

## Goal
Support real review work in the frontend.

## Tasks
- Add person detail page.
- Show cover thumbnail and cluster stats.
- Display all related images for a person.
- Show face crops for confidence/review context.
- Support renaming a cluster.
- Support marking a face as incorrect / remove from cluster.

## Deliverables
- Basic review workflow exists.

## Acceptance criteria
- User can open a person group and review its photos.
- User can rename the cluster.
- User can remove incorrect face assignments.

## Prompt to give the LLM
```text
Execute Phase 8 only.
Implement the first real review workflow in the frontend and backend.
Add the person detail page and support renaming clusters plus removing incorrect face assignments.
Keep interactions minimal but functional.
Return:
1) files changed,
2) API changes if any,
3) commands/tests to run,
4) limitations,
5) acceptance checklist.
```

---

# Phase 9 — Merge, Split, and Manual Corrections

## Goal
Support the most important correction tools for imperfect clustering.

## Tasks
- Add merge clusters action.
- Add split-out selected faces action.
- Add create-new-cluster from selected faces.
- Update cover image logic after edits.
- Write audit events for user corrections.

## Deliverables
- Core manual correction loop exists.

## Acceptance criteria
- Two clusters can be merged.
- Selected faces can be moved into a new cluster.
- Metadata stays consistent after edits.

## Prompt to give the LLM
```text
Execute Phase 9 only.
Implement manual correction tools for cluster quality: merge clusters, split selected faces, and create a new cluster from selected faces.
Keep the data model consistent and avoid accidental data loss.
Return:
1) files changed,
2) mutation/API summary,
3) commands/tests to run,
4) data integrity notes,
5) acceptance checklist.
```

---

# Phase 10 — Export Results

## Goal
Export grouped results to a filesystem structure usable by the end user.

## Tasks
- Add export job.
- Export by person cluster.
- Support either copy, symlink, or hardlink strategy where practical.
- Preserve original file names where possible.
- Export previews/report summary.
- Ensure one photo can appear in multiple exported groups.

## Deliverables
- Output folder with grouped results.

## Acceptance criteria
- Export creates group folders.
- Photos with multiple people appear under multiple groups.
- Export does not mutate originals.
- Export summary is available.

## Prompt to give the LLM
```text
Execute Phase 10 only.
Implement export for the Face Photo Sorter project.
Create grouped output folders by person cluster and ensure a single image can appear in multiple groups.
Prefer a metadata-first design and avoid unnecessary duplication where possible.
Return:
1) files changed,
2) export strategy choices,
3) commands/tests to run,
4) platform caveats,
5) acceptance checklist.
```

---

# Phase 11 — Reporting, Polishing, and Reliability

## Goal
Make the MVP usable and stable.

## Tasks
- Add processing summary report.
- Add counts: total images, images with faces, total faces, cluster count, unclustered faces.
- Add empty states.
- Add retry handling for failed items.
- Add smoke tests for critical flows.
- Improve logging.
- Add small UX improvements only where needed.

## Deliverables
- MVP is reasonably stable and understandable.

## Acceptance criteria
- User can understand what happened during processing.
- Main critical flows have tests.
- Errors are diagnosable.

## Prompt to give the LLM
```text
Execute Phase 11 only.
Polish the Face Photo Sorter MVP for reliability and usability.
Add reporting, better error handling, logging, and tests for the main flows.
Avoid feature creep.
Return:
1) files changed,
2) tests added,
3) commands to run validation,
4) remaining risks,
5) acceptance checklist.
```

---

# Phase 12 — Packaging and Local Delivery

## Goal
Make the app easy to run locally or share.

## Tasks
- Add Docker support only if it stays simple.
- Add one-command startup instructions.
- Add sample `.env` and path config.
- Document local run, export, and review workflow.

## Deliverables
- Another developer can run the project with minimal friction.

## Acceptance criteria
- Setup docs are complete.
- Local run path is clear.
- Packaging does not add unnecessary complexity.

## Prompt to give the LLM
```text
Execute Phase 12 only.
Package the Face Photo Sorter project for easy local use.
Keep deployment simple and self-hosted.
Add documentation and optional Docker support only if it remains lightweight.
Return:
1) files changed,
2) run instructions,
3) packaging summary,
4) caveats,
5) acceptance checklist.
```

---

## Shared Technical Decisions to Preserve Across Phases

These decisions should remain stable unless a real blocker appears.

### 1) Do not use training
No fine-tuning, no dataset creation, no retraining, no metric-learning work.

### 2) Use metadata-first architecture
Do not immediately duplicate photo files into person folders during core processing.
Use DB relationships. Export folders later.

### 3) Face-to-photo and person-to-photo are separate concepts
A single photo can contain many faces and therefore belong to many people.

### 4) Keep embeddings local and simple
Do not introduce a vector database for this scale unless absolutely necessary.

### 5) Keep processing asynchronous only when justified
For ~682 photos, simple background job handling is enough.
Avoid Celery/Redis unless a real bottleneck appears.

### 6) UI is for review, not only display
The product is incomplete without rename/merge/split/manual correction.

---

## Performance Guidance

For roughly 682 photos:

### Enough
- Local CPU processing can be acceptable.
- Small background task/job tracking is enough.
- SQLite is enough.
- Local disk storage is enough.

### Nice to have
- GPU acceleration if already available.
- Batch embedding inference if it meaningfully improves runtime.
- Lazy image loading in the frontend.

### Unnecessary at MVP
- Message brokers
- Distributed workers
- Vector database
- Microservices
- Cloud inference APIs for privacy-sensitive photo sets

---

## Main Risks and Mitigations

### Risk: false matches
Mitigation:
- conservative default clustering threshold,
- review UI,
- allow face removal from cluster,
- merge/split tools.

### Risk: same person split into multiple clusters
Mitigation:
- merge action,
- show visually similar clusters later if needed,
- adjust clustering parameters conservatively.

### Risk: poor side profiles / blur / occlusions
Mitigation:
- keep low-confidence or poor-quality faces reviewable,
- avoid forcing all faces into confident clusters.

### Risk: duplicate storage explosion
Mitigation:
- metadata-first design,
- export only on demand,
- use symlink/hardlink where practical.

### Risk: slow processing
Mitigation:
- process in phases,
- track progress,
- avoid unnecessary image copies,
- batch where useful.

### Risk: privacy concerns
Mitigation:
- local-only by default,
- document what embeddings are stored,
- avoid sending photos to external services.

---

## Definition of MVP Done

The MVP is done when all of the following are true:

1. A user can point the app to a folder of photos.
2. The system scans and registers images.
3. The system detects faces and creates thumbnails.
4. The system generates embeddings using pretrained inference.
5. The system clusters faces into person groups.
6. The UI shows people groups and cluster details.
7. The user can rename a cluster.
8. The user can remove wrong assignments.
9. The user can merge or split groups.
10. The user can export grouped results.
11. The system provides a basic processing report.

---

## Suggested Order of Real Development

If execution time is constrained, use this order:

1. Phase 0
2. Phase 1
3. Phase 2
4. Phase 3
5. Phase 4
6. Phase 5
7. Phase 6
8. Phase 7
9. Phase 8
10. Phase 10
11. Phase 9
12. Phase 11
13. Phase 12

Reason:
- You need an end-to-end slice early.
- Export can be more valuable than advanced review tools in some MVPs.
- Merge/split can follow once the full path works.

---

## Reusable Master Prompt for Any Phase

Use this when instructing the LLM in Cursor.

```text
You are implementing one phase of the Face Photo Sorter project.
Follow the project execution document strictly.

Rules:
- Work only on the requested phase.
- Keep the implementation pragmatic and minimal.
- Preserve the existing architecture unless a blocker exists.
- Do not add model training, distributed systems, microservices, or heavy infrastructure.
- Use pretrained face inference only.
- Keep original photos untouched.
- Prefer metadata/index relationships over early file duplication.
- Before coding, inspect the repository and relevant files.
- After coding, summarize exactly what changed.

When done, return:
1. Summary of work completed
2. Files created/modified
3. Commands to run
4. Any assumptions or open questions
5. Acceptance checklist status

Now execute: [INSERT PHASE NAME HERE]
```

---

## Optional Future Enhancements After MVP

Do not build these until the MVP works.

- Similar-cluster suggestions
- Better face quality scoring
- Automatic cover face selection tuning
- Duplicate photo detection beyond file hash
- Search by uploaded reference face
- Drag-and-drop UI improvements
- Desktop wrapper via Tauri or Electron
- Better export presets
- Batch rename tools
- Advanced analytics/reporting

---

## Final Instruction to Future LLMs

Build the smallest correct version first.
Do not optimize prematurely.
Do not add architecture that the project size does not justify.
A clean, reviewable, local-first tool is better than a large but fragile system.
