"""Transparent risk scoring and red-flag detection."""

from __future__ import annotations

import re
from difflib import SequenceMatcher

import pandas as pd

from utils.constants import (
    CONSULTANCY_KEYWORDS,
    CONSULTANCY_SUPPLIERS,
    LEGAL_KEYWORDS,
    RED_FLAG_DEFINITIONS,
)


def _normalize_text(text: str) -> str:
    text = str(text).lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, _normalize_text(a), _normalize_text(b)).ratio()


def _is_consultancy(row: pd.Series) -> bool:
    cpv = str(row.get("cpv_code", ""))
    title = str(row.get("title", "")).lower()
    desc = str(row.get("description", "")).lower()
    supplier = str(row.get("supplier", ""))
    if cpv.startswith("79") and not cpv.startswith("791"):
        return True
    if supplier in CONSULTANCY_SUPPLIERS:
        return True
    return any(k in title or k in desc for k in CONSULTANCY_KEYWORDS)


def _is_legal(row: pd.Series) -> bool:
    cpv = str(row.get("cpv_code", ""))
    title = str(row.get("title", "")).lower()
    desc = str(row.get("description", "")).lower()
    if cpv.startswith("791"):
        return True
    return any(k in title or k in desc for k in LEGAL_KEYWORDS)


def detect_duplicate_risk(df: pd.DataFrame) -> pd.Series:
    flags = []
    for idx, row in df.iterrows():
        award = row["award_date"]
        window_start = award - pd.Timedelta(days=730)
        peers = df[
            (df.index != idx)
            & (df["supplier"] == row["supplier"])
            & (df["buyer"] == row["buyer"])
            & (df["award_date"] >= window_start)
            & (df["award_date"] <= award)
        ]
        hit = False
        for _, peer in peers.iterrows():
            title_sim = _similarity(row["title"], peer["title"])
            desc_sim = _similarity(row["description"], peer["description"])
            if title_sim >= 0.88 or (title_sim >= 0.75 and desc_sim >= 0.82):
                hit = True
                break
        flags.append(hit)
    return pd.Series(flags, index=df.index)


def detect_repeated_consultancy(df: pd.DataFrame) -> pd.Series:
    flags = []
    for idx, row in df.iterrows():
        if not _is_consultancy(row):
            flags.append(False)
            continue
        award = row["award_date"]
        window_start = award - pd.Timedelta(days=548)
        peers = df[
            (df.index != idx)
            & (df["buyer"] == row["buyer"])
            & (df["award_date"] >= window_start)
            & (df["award_date"] <= award)
        ]
        consult_count = sum(1 for _, p in peers.iterrows() if _is_consultancy(p))
        same_cat = sum(
            1
            for _, p in peers.iterrows()
            if _is_consultancy(p) and p["category"] == row["category"]
        )
        flags.append(consult_count >= 4 or same_cat >= 3)
    return pd.Series(flags, index=df.index)


def detect_value_spike(df: pd.DataFrame) -> pd.Series:
    flags = []
    df = df.copy()
    df["award_year"] = df["award_date"].dt.year
    for idx, row in df.iterrows():
        recent = df[
            (df.index != idx)
            & (df["buyer"] == row["buyer"])
            & (df["category"] == row["category"])
            & (df["award_year"] >= row["award_year"] - 3)
            & (df["award_year"] <= row["award_year"])
        ]
        if len(recent) < 8:
            flags.append(False)
            continue
        median_val = recent["value_gbp"].median()
        if median_val <= 0:
            flags.append(False)
            continue
        flags.append(row["value_gbp"] > median_val * 4 and row["value_gbp"] > 250_000)
    return pd.Series(flags, index=df.index)


def compute_risk_scores(df: pd.DataFrame) -> pd.DataFrame:
    """Add red flag columns and composite risk score to dataframe."""
    result = df.copy()
    result["award_date"] = pd.to_datetime(result["award_date"])

    dup = detect_duplicate_risk(result)
    consult = detect_repeated_consultancy(result)
    spike = detect_value_spike(result)

    result["flag_duplicate_risk"] = dup
    result["flag_repeated_consultancy"] = consult
    result["flag_value_spike"] = spike

    flag_cols = ["flag_duplicate_risk", "flag_repeated_consultancy", "flag_value_spike"]
    result["red_flag_count"] = result[flag_cols].sum(axis=1).astype(int)
    result["red_flags"] = result.apply(_format_red_flags, axis=1)

    weights = [RED_FLAG_DEFINITIONS["duplicate_risk"]["weight"],
               RED_FLAG_DEFINITIONS["repeated_consultancy"]["weight"],
               RED_FLAG_DEFINITIONS["value_spike"]["weight"]]
    result["risk_score"] = (
        result["flag_duplicate_risk"].astype(int) * weights[0]
        + result["flag_repeated_consultancy"].astype(int) * weights[1]
        + result["flag_value_spike"].astype(int) * weights[2]
    )

    # Severity bump for very high values
    p95 = result["value_gbp"].quantile(0.95)
    result.loc[result["value_gbp"] > p95, "risk_score"] = (
        result.loc[result["value_gbp"] > p95, "risk_score"] + 10
    ).clip(0, 100)

    result["is_legal"] = result.apply(_is_legal, axis=1)
    result["is_consultancy"] = result.apply(_is_consultancy, axis=1)
    result["risk_score"] = result["risk_score"].clip(0, 100).astype(int)
    return result


def _format_red_flags(row: pd.Series) -> str:
    active = []
    if row["flag_duplicate_risk"]:
        active.append("Duplicate")
    if row["flag_repeated_consultancy"]:
        active.append("Consultancy")
    if row["flag_value_spike"]:
        active.append("Value Spike")
    return ", ".join(active) if active else "—"


def explain_flags(row: pd.Series) -> str:
    parts = []
    if row["flag_duplicate_risk"]:
        parts.append(RED_FLAG_DEFINITIONS["duplicate_risk"]["description"])
    if row["flag_repeated_consultancy"]:
        parts.append(RED_FLAG_DEFINITIONS["repeated_consultancy"]["description"])
    if row["flag_value_spike"]:
        parts.append(RED_FLAG_DEFINITIONS["value_spike"]["description"])
    return " ".join(parts) if parts else "No red flags detected for this contract."