from pathlib import Path

from feedrank.data.mind_parser import explode_impressions, parse_behaviors, parse_news

# Project root (feedrank-mind): one level up from scripts/
_PROJECT_ROOT = Path(__file__).resolve().parent.parent


def main() -> None:
    train_dir = _PROJECT_ROOT / "data/raw/mind_small/train"
    out_dir = _PROJECT_ROOT / "data/interim"
    out_dir.mkdir(parents=True, exist_ok=True)

    news_path = train_dir / "news.tsv"
    behaviors_path = train_dir / "behaviors.tsv"

    if not news_path.exists():
        raise FileNotFoundError(f"Missing file: {news_path}")
    if not behaviors_path.exists():
        raise FileNotFoundError(f"Missing file: {behaviors_path}")

    print(f"Reading {news_path}...")
    news_df = parse_news(news_path)

    print(f"Reading {behaviors_path}...")
    behaviors_df = parse_behaviors(behaviors_path)

    print("Exploding impressions...")
    exploded_df = explode_impressions(behaviors_df)

    news_out = out_dir / "train_news.parquet"
    exploded_out = out_dir / "train_impressions_exploded.parquet"

    news_df.to_parquet(news_out, index=False)
    exploded_df.to_parquet(exploded_out, index=False)

    print(f"Saved {news_out} ({len(news_df)} rows)")
    print(f"Saved {exploded_out} ({len(exploded_df)} rows)")


if __name__ == "__main__":
    main()