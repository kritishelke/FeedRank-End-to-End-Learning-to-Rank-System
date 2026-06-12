## FeedRank-MIND

End-to-end **feed ranking** scaffold for the **MIND (Microsoft News)** dataset, designed as a production-style, multi-stage recommendation pipeline.

This repository focuses on clean interfaces, time-safe data handling, and modular components rather than heavy training logic. Most modules include runnable stubs, docstrings, and clear TODOs so you can iteratively fill in real logic.

### Project overview

The goal is to build a **multi-stage ranking system** over MIND:

- **Data**: `behaviors.tsv` (user impression logs) + `news.tsv` (item metadata)
- **Stages**:
  - **Ingestion & parsing** of raw MIND TSVs
  - **Explosion of impressions** into per-candidate rows with click labels
  - **Feature building** for users, items, interactions, and context
  - **Candidate generation** (recent popular, category match, embedding-based stub)
  - **Ranking models**:
    - Logistic Regression baseline
    - XGBoost ranker/classifier
    - Neural two-tower model (PyTorch)
  - **Evaluation & analysis**:
    - AUC
    - nDCG@5, nDCG@10
    - Class imbalance and slice analysis (e.g. cold-start)
    - Offline vs. simulated “online” metric gap
  - **Serving & monitoring**:
    - FastAPI ranking endpoint
    - Basic stubs for data/model drift and metrics logging

Heavy training logic, large-scale processing, and production-grade infra are **intentionally out of scope** in this scaffold.

### MIND data mapping

The scaffold assumes the standard MIND data format:

- **`behaviors.tsv`** (user impression logs)
  - Each row represents a **user impression**.
  - Key columns (exact names may vary by release; see official MIND docs):
    - `impression_id`
    - `user_id`
    - `timestamp`
    - `history` (space-separated list of previously clicked news IDs)
    - `impressions` (space-separated list of `"newsId-label"` pairs, e.g. `"N123-1 N456-0"`)
  - In this project, `behaviors.tsv` is parsed and then **exploded** so that each candidate in `impressions` becomes a separate row with:
    - `candidate_news_id`
    - `label` (1 for clicked, 0 for not-clicked)
    - `position_in_impression` (1-based index preserving order)

- **`news.tsv`** (item metadata)
  - Each row represents one **news item**.
  - Expected columns include:
    - `news_id`
    - `category`
    - `subcategory`
    - `title`
    - `abstract`
    - `url`
    - `title_entities` (JSON-like string from MIND)
    - `abstract_entities`
  - This project treats `news.tsv` as the source of **item features** (categorical and textual).

The exploded impression rows and the `news` table are joined into a **feature-ready training table** (see `docs/data_schema.md`).

### Architecture overview (6 layers)

The codebase is organized into six conceptual layers:

1. **Data ingestion & validation**
   - Modules: `feedrank.data.*`
   - Parse raw TSVs (`mind_parser`), define schemas, handle I/O and basic validation.
2. **Feature engineering**
   - Modules: `feedrank.features.*`
   - Build user, item, interaction, and context features; maintain a simple feature store; run leakage checks.
3. **Candidate generation**
   - Modules: `feedrank.candidates.*`
   - Simple candidate generators (recent popular, category match, embedding retrieval stub).
4. **Ranking models & training**
   - Modules: `feedrank.models.*`, `feedrank.training.*`
   - Shared model interface; LR/XGBoost/two-tower rankers with minimal, runnable stubs.
5. **Evaluation & analysis**
   - Modules: `feedrank.evaluation.*`, `feedrank.analysis.*`
   - Ranking metrics (AUC, nDCG), time-safe splits, slice analysis (class imbalance, cold start), offline vs. simulated online gaps.
6. **Serving & monitoring**
   - Modules: `feedrank.serving.*`, `feedrank.monitoring.*`
   - FastAPI ranking API, simple ranking service, and monitoring placeholders (data quality, drift, online metrics).

See `docs/architecture.md` for a box-and-arrow text diagram.

### Repository layout

At the project root (this directory):

- `pyproject.toml` – project metadata and dependencies.
- `README.md` – this file.
- `.gitignore` – ignores Python build artifacts, virtualenvs, and local data.
- `.env.example` – example environment variables.
- `Makefile` – common commands (install, test, parse, train, eval, serve).
- `AGENTS.md` – guidelines for coding agents (including this assistant).
- `TASKS.md` – phased build plan.
- `docs/` – architecture and data schema docs.
- `configs/` – YAML configs for data, features, training, evaluation, and serving.
- `data/` – **local-only** data directory (not committed):
  - `raw/` – downloaded MIND TSVs.
  - `interim/` – intermediate artifacts (parsed/exploded).
  - `processed/` – cleaned tables ready for modeling.
  - `features/` – feature tables.
  - `artifacts/` – trained models, reports, metrics, plots.
- `scripts/` – CLI-style scripts for the main workflow steps.
- `src/feedrank/` – main Python package (data, features, models, evaluation, serving, etc.).
- `tests/` – pytest-based unit and smoke tests.

### Expected data directory layout

Local data is expected under `data/` (relative to project root):

- `data/raw/`
  - `behaviors.tsv` (or `behaviors_train.tsv`, etc.)
  - `news.tsv`
- `data/interim/`
  - Parsed/normalized TSVs, exploded impression tables.
- `data/processed/`
  - Time-split training/validation/test tables.
- `data/features/`
  - Final feature matrices or parquet/arrow tables.
- `data/artifacts/`
  - Model weights, metrics JSON, offline reports, plots.

**Datasets are never committed**; only small metadata/configs and `.gitkeep` placeholders are versioned.

### Setup instructions

#### 1. Create and activate a virtualenv

```bash
cd feedrank-mind
python3.11 -m venv .venv
source .venv/bin/activate
```

#### 2. Install the package (editable)

```bash
pip install -U pip
pip install -e .
```

Optionally, install extras:

```bash
pip install "feedrank-mind[polars]"
pip install "feedrank-mind[reports]"
```

#### 3. Copy `.env.example` to `.env` (optional)

```bash
cp .env.example .env
```

Then adjust paths and environment-specific settings as needed.

#### 4. Recommended Python environment (Cursor / VS Code)

The project includes a `.venv` and `.vscode/settings.json` so the IDE recommends this environment:

- **Interpreter:** `${workspaceFolder}/.venv/bin/python`
- **Terminal:** New terminals auto-activate `.venv` when you open the `feedrank-mind` folder as the workspace.

If you just created `.venv`, install the package into it (from the project root):

```bash
source .venv/bin/activate
pip install -e .
```

Then choose **"Python: Select Interpreter"** in the Command Palette and pick the `.venv` interpreter if it isn’t already selected.

#### 5. Run tests

```bash
pytest
```

### CLI entry point

After `pip install -e .`, a `feedrank-cli` command is available (backed by Typer):

```bash
feedrank-cli --help
```

Example commands (see `scripts/` and `feedrank.cli` for details):

```bash
# Parse and explode behaviors
feedrank-cli parse-mind --behaviors-path data/raw/behaviors.tsv --news-path data/raw/news.tsv

# Build training table + simple features
feedrank-cli build-training-table
feedrank-cli build-features

# Train baseline models (stubs)
feedrank-cli train-lr
feedrank-cli train-xgb
feedrank-cli train-two-tower

# Evaluate with AUC + nDCG
feedrank-cli evaluate

# Run slice analysis and offline A/B simulation
feedrank-cli run-slice-analysis
feedrank-cli simulate-offline-ab

# Start the FastAPI app
feedrank-cli serve-api
```

Each of these commands delegates to small, testable functions in `src/feedrank/` and thin scripts in `scripts/`.

### What is implemented vs. TODO

**Implemented (scaffolded)**

- Project layout, packaging (`pyproject.toml`).
- Core utilities:
  - Logging setup (`feedrank.logging_utils`).
  - Settings and paths (`feedrank.settings`, `feedrank.paths`).
  - Typer CLI entrypoint (`feedrank.cli`).
- Data layer:
  - `mind_parser` with a **realistic parser skeleton**:
    - Parse `behaviors.tsv` and `news.tsv` via pandas.
    - Explode `impressions` into one row per candidate with `label` and `position_in_impression`.
    - Return DataFrames with clear column expectations.
  - Time-based split helpers (`feedrank.data.splits`) to avoid leakage.
- Models:
  - Unified model interface (`fit`, `predict_score`, `save`, `load`) in `feedrank.models.interfaces`.
  - Minimal stubs for LR/XGBoost/two-tower models.
- Evaluation:
  - AUC wrapper and nDCG utilities in `feedrank.evaluation.ranking_metrics`.
  - Helpers to aggregate a ranking report.
- Serving:
  - FastAPI app at `feedrank.serving.api` with:
    - `/health`
    - `/rank` (accepts simple user context + candidate list and returns scored, sorted candidates using a dummy scorer when no artifact is present).
- Monitoring:
  - Stubs for data quality, drift, and online metrics.
- Tests:
  - Basic pytest tests for:
    - `mind_parser` with synthetic, in-memory TSVs.
    - Feature builder placeholders.
    - Ranking metrics.
    - Time-based splits.
    - FastAPI `/health` and `/rank` smoke tests.

**TODOs (clearly marked in code)**

- Efficient, large-scale parsing and feature computation.
- Real model training loops (epochs, optimizers, early stopping).
- Persisted feature store and model registry.
- Real-time candidate generation + embeddings for the two-tower model.
- Robust monitoring, dashboards, and alerting.

### Time-safe splits and leakage risks

This project emphasizes **no target leakage**:

- Time-based splits (see `feedrank.data.splits`) ensure that:
  - Training data strictly precedes validation and test data in time.
  - No impression or user-level information from the future is used to predict the past.
- Leakage checks in `feedrank.features.leakage_checks` flag:
  - Columns that are obvious **future aggregates** (e.g., “post-click dwell time” when training on pre-click signals).
  - Columns with near-perfect correlation to the target (potential proxies).
  - Post-outcome signals mistakenly included in features.

When adding new features or model inputs, always:

- Derive features only from information that would be available **at ranking time**.
- Review data schemas in `docs/data_schema.md`.
- Prefer **time-based cross-validation** where applicable.

See `AGENTS.md` for guidelines for contributors and coding agents.

