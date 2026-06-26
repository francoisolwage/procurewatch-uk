"""Data loading for sample and user-uploaded OCDS data."""

from __future__ import annotations

from pathlib import Path

import pandas as pd
import streamlit as st

from utils.constants import DEPARTMENT_TAGS, REQUIRED_COLUMNS
from utils.risk_scoring import compute_risk_scores

SAMPLE_PATH = Path(__file__).resolve().parent.parent / "data" / "sample_contracts.csv"


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    mapping = {
        "ocid": ["ocid", "OCID", "release_id"],
        "notice_id": ["notice_id", "notice id", "id", "Notice ID"],
        "title": ["title", "contract_title", "Contract Title", "name"],
        "buyer": ["buyer", "department", "Buyer", "organisation", "buyer_name"],
        "supplier": ["supplier", "Supplier", "supplier_name", "awardee"],
        "award_date": ["award_date", "Award Date", "date", "awardDate"],
        "value_gbp": ["value_gbp", "value", "Contract Value", "amount", "value_amount"],
        "cpv_code": ["cpv_code", "cpv", "CPV", "main_cpv"],
        "category": ["category", "Category", "cpv_description"],
        "description": ["description", "Description", "summary", "keywords"],
    }
    result = df.copy()
    lower_cols = {c.lower().strip(): c for c in result.columns}
    renamed = {}
    for target, aliases in mapping.items():
        for alias in aliases:
            key = alias.lower().strip()
            if key in lower_cols:
                renamed[lower_cols[key]] = target
                break
    result = result.rename(columns=renamed)
    return result


def _validate_and_prepare(df: pd.DataFrame) -> pd.DataFrame:
    df = _normalize_columns(df)
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Uploaded data is missing required columns: {', '.join(missing)}")

    df["award_date"] = pd.to_datetime(df["award_date"], errors="coerce")
    df["value_gbp"] = pd.to_numeric(df["value_gbp"], errors="coerce")
    df = df.dropna(subset=["award_date", "value_gbp", "title", "buyer", "supplier"])
    df["value_gbp"] = df["value_gbp"].abs()

    if "department_tag" not in df.columns:
        df["department_tag"] = df["buyer"].map(DEPARTMENT_TAGS).fillna("Other")

    if "contracts_finder_url" not in df.columns:
        df["contracts_finder_url"] = df["notice_id"].apply(
            lambda x: f"https://www.contractsfinder.service.gov.uk/Notice/{x}"
        )

    if "category" not in df.columns or df["category"].isna().any():
        df["category"] = df["category"].fillna("Uncategorised")

    return compute_risk_scores(df)


@st.cache_data(show_spinner="Loading procurement data…")
def load_sample_data() -> pd.DataFrame:
    if not SAMPLE_PATH.exists():
        raise FileNotFoundError(
            f"Sample data not found at {SAMPLE_PATH}. Run: python data/generate_sample_data.py"
        )
    df = pd.read_csv(SAMPLE_PATH)
    return _validate_and_prepare(df)


def load_uploaded_data(uploaded_file) -> pd.DataFrame:
    name = uploaded_file.name.lower()
    if name.endswith(".csv"):
        df = pd.read_csv(uploaded_file)
    elif name.endswith(".json") or name.endswith(".jsonl"):
        df = pd.read_json(uploaded_file, lines=name.endswith(".jsonl"))
    else:
        raise ValueError("Unsupported file format. Please upload CSV or JSON/JSONL.")
    return _validate_and_prepare(df)


def get_government_era(date: pd.Timestamp) -> str:
    from utils.constants import GOVERNMENT_ERAS

    for era, cfg in GOVERNMENT_ERAS.items():
        if pd.Timestamp(cfg["start"]) <= date <= pd.Timestamp(cfg["end"]):
            return era
    return "Other"