# FeedRank-MIND: Phased build plan

## Phase 1: Parse + explode behaviors (current)
- [x] `mind_parser`: parse behaviors.tsv, news.tsv, explode impressions
- [x] Time-based split helpers (`feedrank.data.splits`)
- [x] Unit tests with synthetic data
- [ ] Download MIND (small or full) and run parser on real data
- [ ] Wire a script (e.g. `scripts/parse_mind.py`) that reads from `data/raw/`, writes to `data/interim/`

## Phase 2: Feature table + LR baseline
- [ ] Build feature table: join exploded impressions with news metadata
- [ ] Implement/wire feature builders (user, item, interaction, context)
- [ ] Leakage checks on feature columns
- [ ] Train Logistic Regression baseline (stub → real fit)
- [ ] Save artifacts to `data/artifacts/`

## Phase 3: XGBoost + metrics
- [ ] XGBoost ranker/classifier with shared model interface
- [ ] Implement AUC and nDCG@5, nDCG@10 in `feedrank.evaluation.ranking_metrics`
- [ ] Aggregate ranking report per impression / globally
- [ ] Config-driven train/eval (configs/train_xgb.yaml, eval.yaml)

## Phase 4: Two-tower model
- [ ] PyTorch two-tower stub (user tower, item tower, score = dot product)
- [ ] Training loop (epochs, negative sampling, optimizer)
- [ ] Save/load model artifacts

## Phase 5: Slice analysis + offline A/B simulation
- [ ] Class imbalance analysis
- [ ] Cold-start slices (new users / new items)
- [ ] Offline–online metric gap simulation (e.g. position bias, truncation)

## Phase 6: FastAPI + monitoring stubs
- [ ] FastAPI app: `/health`, `/rank` (user context + candidates → sorted scores)
- [ ] Rank service that loads a model artifact (or dummy scorer)
- [ ] Monitoring: data quality, drift, and online metrics placeholders
