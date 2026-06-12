import pandas as pd

from feedrank.data.mind_parser import explode_impressions


def test_explode_impressions_extracts_labels_and_positions():
    df = pd.DataFrame(
        [
            {
                "impression_id": "1",
                "user_id": "U1",
                "timestamp": pd.Timestamp("2024-01-01 10:00:00"),
                "history": "N10 N11",
                "impressions": "N4-1 N34-0 N88-0",
            }
        ]
    )

    out = explode_impressions(df)

    assert len(out) == 3
    assert list(out["candidate_news_id"]) == ["N4", "N34", "N88"]
    assert list(out["label"]) == [1, 0, 0]
    assert list(out["position_in_impression"]) == [0, 1, 2]
    assert out.iloc[0]["history_news_ids"] == ["N10", "N11"]


def test_explode_impressions_handles_empty_history():
    df = pd.DataFrame(
        [
            {
                "impression_id": "2",
                "user_id": "U2",
                "timestamp": pd.Timestamp("2024-01-01 11:00:00"),
                "history": "",
                "impressions": "N1-0 N2-1",
            }
        ]
    )

    out = explode_impressions(df)

    assert len(out) == 2
    assert out.iloc[0]["history_news_ids"] == []
    assert out.iloc[1]["history_news_ids"] == []


def test_explode_impressions_skips_empty_impressions():
    df = pd.DataFrame(
        [
            {
                "impression_id": "3",
                "user_id": "U3",
                "timestamp": pd.Timestamp("2024-01-01 12:00:00"),
                "history": "N1",
                "impressions": "",
            }
        ]
    )

    out = explode_impressions(df)

    assert out.empty