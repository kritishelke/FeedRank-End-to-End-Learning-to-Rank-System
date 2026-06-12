import React, { useMemo, useState } from "react";

type TabKey = "candidates" | "features" | "models" | "audit" | "policy";

const pipelineStages = [
  ["Raw MIND data", "1.00M impressions", "Validated"],
  ["Cleaning", "99.1% retained", "No leakage"],
  ["Candidates", "31.4 avg set", "3 sources"],
  ["Features", "42 pair features", "Train-time only"],
  ["Rankers", "4 policies", "Grouped eval"],
];

const candidateSources = [
  { source: "Logged impressions", recall: 92, coverage: 78, avgSet: 36, bias: "Medium", color: "#2f6f73" },
  { source: "Popularity", recall: 64, coverage: 41, avgSet: 24, bias: "High", color: "#c97b45" },
  { source: "Content similarity", recall: 74, coverage: 69, avgSet: 30, bias: "Low", color: "#5964a2" },
];

const featureGroups = [
  { label: "User history", value: 86, detail: "click count, activity level" },
  { label: "Preference match", value: 79, detail: "category and subcategory affinity" },
  { label: "Article signals", value: 71, detail: "popularity, source, cold-start" },
  { label: "Text similarity", value: 68, detail: "title and abstract overlap" },
];

const modelMetrics = [
  { model: "Random", type: "Baseline", auc: 0.5, ndcg5: 0.184, ndcg10: 0.236, mrr: 0.202 },
  { model: "Popularity", type: "Heuristic", auc: 0.613, ndcg5: 0.298, ndcg10: 0.356, mrr: 0.331 },
  { model: "Logistic regression", type: "Pointwise", auc: 0.681, ndcg5: 0.346, ndcg10: 0.411, mrr: 0.386 },
  { model: "XGBoost ranker", type: "Grouped", auc: 0.739, ndcg5: 0.421, ndcg10: 0.487, mrr: 0.459 },
  { model: "Two-tower retrieval", type: "Neural", auc: 0.704, ndcg5: 0.388, ndcg10: 0.462, mrr: 0.424 },
];

const segmentMetrics = [
  { segment: "Cold users", xgb: 32, logistic: 27, popularity: 29 },
  { segment: "Warm users", xgb: 46, logistic: 38, popularity: 31 },
  { segment: "Cold items", xgb: 35, logistic: 29, popularity: 21 },
  { segment: "Popular items", xgb: 49, logistic: 41, popularity: 43 },
];

const leakageChecks = [
  "Popularity computed from prior training windows only",
  "Histories stop before each impression timestamp",
  "Grouped train/validation/test evaluation by impression",
  "Logged position features excluded from default model",
];

const imbalanceData = [
  { label: "1:1", auc: 69, ndcg: 39 },
  { label: "1:4", auc: 72, ndcg: 42 },
  { label: "1:8", auc: 74, ndcg: 41 },
  { label: "Hard negatives", auc: 71, ndcg: 44 },
];

const policyLift = [
  { policy: "Popularity", ndcg: 0, mrr: 0 },
  { policy: "Logistic", ndcg: 15, mrr: 17 },
  { policy: "XGBoost", ndcg: 37, mrr: 39 },
  { policy: "Two-tower", ndcg: 30, mrr: 28 },
];

const topFeatures = [
  ["subcategory_match_score", 92],
  ["title_similarity_max", 84],
  ["candidate_popularity_7d", 76],
  ["user_click_count", 61],
  ["cold_item_indicator", 43],
];

function BarPairChart({
  rows,
  firstKey,
  secondKey,
  firstLabel,
  secondLabel,
}: {
  rows: Array<Record<string, string | number>>;
  firstKey: string;
  secondKey: string;
  firstLabel: string;
  secondLabel: string;
}) {
  return (
    <div className="chart-list" aria-label={`${firstLabel} and ${secondLabel} chart`}>
      <div className="legend">
        <span><i className="swatch teal" />{firstLabel}</span>
        <span><i className="swatch indigo" />{secondLabel}</span>
      </div>
      {rows.map((row) => (
        <div className="chart-row" key={String(row.source ?? row.segment ?? row.policy ?? row.label)}>
          <div className="chart-label">{String(row.source ?? row.segment ?? row.policy ?? row.label)}</div>
          <div className="bar-track">
            <span className="bar teal" style={{ width: `${Number(row[firstKey])}%` }} />
          </div>
          <div className="bar-track">
            <span className="bar indigo" style={{ width: `${Number(row[secondKey])}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgressLine({ label, detail, value }: { label: string; detail?: string; value: number }) {
  return (
    <div className="progress-line">
      <div className="progress-meta">
        <div>
          <strong>{label}</strong>
          {detail ? <span>{detail}</span> : null}
        </div>
        <em>{value}%</em>
      </div>
      <div className="progress-track">
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  tone: "teal" | "indigo" | "amber" | "rose";
}) {
  return (
    <section className="metric-card">
      <div className="metric-top">
        <span>{label}</span>
        <i className={`metric-icon ${tone}`} />
      </div>
      <div className="metric-bottom">
        <strong>{value}</strong>
        <em>{delta}</em>
      </div>
    </section>
  );
}

function CandidatePanel() {
  return (
    <div className="panel-grid">
      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h3>Candidate source quality</h3>
            <p>Recall, coverage, and source mix before ranking.</p>
          </div>
          <span className="badge">retrieval stage</span>
        </div>
        <BarPairChart
          rows={candidateSources}
          firstKey="recall"
          secondKey="coverage"
          firstLabel="Recall"
          secondLabel="Coverage"
        />
      </section>
      <section className="panel">
        <h3>Source diagnostics</h3>
        <div className="stack">
          {candidateSources.map((source) => (
            <ProgressLine
              key={source.source}
              label={source.source}
              detail={`${source.avgSet} avg candidates, ${source.bias} popularity bias`}
              value={source.coverage}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function FeaturesPanel() {
  return (
    <div className="panel-grid">
      <section className="panel">
        <h3>Train-time feature groups</h3>
        <p>User-news pair features with leakage controls.</p>
        <div className="stack">
          {featureGroups.map((group) => (
            <ProgressLine key={group.label} {...group} />
          ))}
        </div>
      </section>
      <section className="panel wide">
        <h3>Feature contract</h3>
        <div className="contract-grid">
          <article>
            <strong>User</strong>
            <p>historical clicks, category distribution, activity level</p>
          </article>
          <article>
            <strong>Item</strong>
            <p>popularity bucket, cold-start flag, source indicator</p>
          </article>
          <article>
            <strong>Pair</strong>
            <p>category match, subcategory match, title similarity</p>
          </article>
          <article>
            <strong>Guardrail</strong>
            <p>aggregates use only previous train windows</p>
          </article>
        </div>
      </section>
    </div>
  );
}

function ModelsPanel() {
  return (
    <div className="panel-grid">
      <section className="panel wide table-panel">
        <div className="panel-header">
          <div>
            <h3>Grouped ranking leaderboard</h3>
            <p>Metrics are evaluated within impression groups.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Model</th>
                <th>Type</th>
                <th>AUC</th>
                <th>NDCG@5</th>
                <th>NDCG@10</th>
                <th>MRR</th>
              </tr>
            </thead>
            <tbody>
              {modelMetrics.map((model) => (
                <tr key={model.model} className={model.model === "XGBoost ranker" ? "winner" : ""}>
                  <td>{model.model}</td>
                  <td><span className="table-badge">{model.type}</span></td>
                  <td>{model.auc.toFixed(3)}</td>
                  <td>{model.ndcg5.toFixed(3)}</td>
                  <td>{model.ndcg10.toFixed(3)}</td>
                  <td>{model.mrr.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <h3>Segment performance</h3>
        <p>NDCG@5 by cold-start and popularity slices.</p>
        <BarPairChart
          rows={segmentMetrics}
          firstKey="xgb"
          secondKey="logistic"
          firstLabel="XGBoost"
          secondLabel="Logistic"
        />
      </section>
    </div>
  );
}

function AuditPanel() {
  return (
    <div className="panel-grid">
      <section className="panel">
        <h3>Leakage audit</h3>
        <div className="check-list">
          {leakageChecks.map((check) => (
            <div key={check}><span />{check}</div>
          ))}
        </div>
      </section>
      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h3>Class imbalance experiment</h3>
            <p>AUC can rise while ranking quality stalls.</p>
          </div>
          <span className="badge amber">hard negatives win</span>
        </div>
        <BarPairChart rows={imbalanceData} firstKey="auc" secondKey="ndcg" firstLabel="AUC" secondLabel="NDCG" />
      </section>
    </div>
  );
}

function PolicyPanel() {
  return (
    <div className="panel-grid">
      <section className="panel wide">
        <h3>Offline policy simulation</h3>
        <p>Estimated lift against popularity baseline.</p>
        <BarPairChart rows={policyLift} firstKey="ndcg" secondKey="mrr" firstLabel="NDCG lift" secondLabel="MRR lift" />
      </section>
      <section className="panel">
        <h3>Top model drivers</h3>
        <div className="stack">
          {topFeatures.map(([feature, value]) => (
            <ProgressLine key={String(feature)} label={String(feature)} value={Number(value)} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("candidates");
  const tabPanels = useMemo(
    () => ({
      candidates: <CandidatePanel />,
      features: <FeaturesPanel />,
      models: <ModelsPanel />,
      audit: <AuditPanel />,
      policy: <PolicyPanel />,
    }),
    [],
  );

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 48 48" role="img">
              <path d="M8 34h7V18H8v16Zm13 0h7V10h-7v24Zm13 0h7V24h-7v10Z" />
              <path d="M7 38h34" />
            </svg>
          </div>
          <div>
            <h1>FeedRank</h1>
            <p>Production-style news feed ranking system</p>
          </div>
        </div>
        <div className="header-actions">
          <button type="button">Last train window</button>
          <button type="button" className="primary">Compare policies</button>
        </div>
      </header>

      <div className="page">
        <section className="hero">
          <div className="hero-copy">
            <div className="tags">
              <span>grouped ranking</span>
              <span>leakage guarded</span>
            </div>
            <h2>Rank candidate news articles for each user impression with measurable offline lift.</h2>
            <p>
              FeedRank turns MIND behavior logs, article metadata, click histories, and impression candidates into a
              debuggable recommendation pipeline with retrieval diagnostics, train-time-safe features, grouped
              evaluation, and policy simulation.
            </p>
            <div className="hero-facts">
              <div><span>Objective</span><strong>Highest click relevance</strong></div>
              <div><span>Main metric</span><strong>NDCG@5 by impression</strong></div>
              <div><span>Best MVP</span><strong>XGBoost grouped ranker</strong></div>
            </div>
          </div>
          <aside className="pipeline">
            <div className="panel-header">
              <div>
                <h3>Live pipeline snapshot</h3>
                <p>Data to policy evaluation</p>
              </div>
            </div>
            {pipelineStages.map(([name, count, status], index) => (
              <div className="stage" key={name}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{name}</strong>
                  <p>{status} · {count}</p>
                </div>
              </div>
            ))}
          </aside>
        </section>

        <section className="metrics">
          <MetricCard label="AUC" value="0.739" delta="+9.1%" tone="teal" />
          <MetricCard label="NDCG@5" value="0.421" delta="+37.0%" tone="indigo" />
          <MetricCard label="MRR" value="0.459" delta="+39.0%" tone="amber" />
          <MetricCard label="Cold-user gap" value="0.14" delta="-18.4%" tone="rose" />
        </section>

        <section className="workbench">
          <div className="section-heading">
            <span>ranking system</span>
            <h2>A complete offline feed ranking workbench</h2>
            <p>
              Candidate generation, feature engineering, model training, grouped evaluation, class imbalance analysis,
              cold-start slicing, leakage audit, and policy comparison.
            </p>
          </div>

          <div className="tabs" role="tablist" aria-label="FeedRank views">
            {([
              ["candidates", "Candidates"],
              ["features", "Features"],
              ["models", "Models"],
              ["audit", "Audit"],
              ["policy", "Policy"],
            ] as Array<[TabKey, string]>).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={activeTab === key}
                className={activeTab === key ? "active" : ""}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {tabPanels[activeTab]}
        </section>

        <section className="caveat">
          <div>
            <h3>Operational caveats</h3>
            <p>
              Offline gains are interpreted alongside position bias, logging-policy bias, selection effects,
              distribution shift, and the difference between NDCG and real engagement.
            </p>
          </div>
          <strong>online risk reviewed before launch</strong>
        </section>
      </div>
    </main>
  );
}
