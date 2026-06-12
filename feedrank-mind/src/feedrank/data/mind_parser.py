"""Parse MIND behaviors.tsv and news.tsv; explode impressions into per-candidate rows."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd


BEHAVIORS_COLUMNS = [
    "impression_id",
    "user_id",
    "timestamp",
    "history",
    "impressions",
]

NEWS_COLUMNS = [
    "news_id",
    "category",
    "subcategory",
    "title",
    "abstract",
    "url",
    "title_entities",
    "abstract_entities",
]


def parse_news(path: str | Path) -> pd.DataFrame:
    """Parse MIND news.tsv into a DataFrame."""
    df = pd.read_csv(
        path,
        sep="\t",
        header=None,
        names=NEWS_COLUMNS,
        dtype=str,
    )
    return df


def parse_behaviors(path: str | Path) -> pd.DataFrame:
    """Parse MIND behaviors.tsv into a DataFrame."""
    df = pd.read_csv(
        path,
        sep="\t",
        header=None,
        names=BEHAVIORS_COLUMNS,
        dtype=str,
    )
    # timestamps in MIND are strings like "11/9/2019 3:36:01 PM"
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    return df


def _parse_history(history_value: Any) -> list[str]:
    """Convert history field into list of news IDs."""
    if pd.isna(history_value) or history_value is None:
        return []
    history_str = str(history_value).strip()
    if history_str == "":
        return []
    return history_str.split()


def explode_impressions(behaviors_df: pd.DataFrame) -> pd.DataFrame:
    """
    Explode MIND impressions into one row per candidate item.

    Each token in `impressions` looks like: 'N12345-1' or 'N67890-0'
    """
    rows: list[dict[str, Any]] = []

    for _, row in behaviors_df.iterrows():
        impressions_raw = row.get("impressions", "")
        if pd.isna(impressions_raw) or str(impressions_raw).strip() == "":
            continue

        history_list = _parse_history(row.get("history"))

        tokens = str(impressions_raw).strip().split()
        for pos, token in enumerate(tokens):
            # Robust split in case IDs ever contain '-'
            news_id, label_str = token.rsplit("-", 1)
            label = int(label_str)

            rows.append(
                {
                    "impression_id": row["impression_id"],
                    "user_id": row["user_id"],
                    "timestamp": row["timestamp"],
                    "history_news_ids": history_list.copy(),
                    "candidate_news_id": news_id,
                    "label": label,
                    "position_in_impression": pos,
                }
            )

    out = pd.DataFrame(rows)

    if not out.empty:
        out["label"] = out["label"].astype(int)
        out["position_in_impression"] = out["position_in_impression"].astype(int)

    return out