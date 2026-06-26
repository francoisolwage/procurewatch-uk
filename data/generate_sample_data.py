"""Generate realistic sample UK procurement contract data."""

from __future__ import annotations

import random
import sys
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from utils.constants import (  # noqa: E402
    CONSULTANCY_KEYWORDS,
    CONSULTANCY_SUPPLIERS,
    CPV_CATEGORIES,
    DEPARTMENTS,
    DEPARTMENT_TAGS,
    GENERAL_SUPPLIERS,
    LAW_FIRMS,
    LEGAL_KEYWORDS,
)

random.seed(42)

CONTRACT_TEMPLATES = [
    ("IT infrastructure modernisation programme", "48000000", 500_000, 25_000_000),
    ("Cloud migration and hosting services", "72000000", 250_000, 15_000_000),
    ("Management consultancy — organisational transformation", "79000000", 100_000, 8_000_000),
    ("Legal advice — judicial review proceedings", "79110000", 50_000, 2_500_000),
    ("Highway maintenance and resurfacing contract", "45000000", 1_000_000, 40_000_000),
    ("Facilities management services", "90000000", 200_000, 12_000_000),
    ("Cyber security operations centre", "72000000", 300_000, 10_000_000),
    ("Research and development — vaccine trials", "73000000", 500_000, 30_000_000),
    ("Environmental impact assessment services", "76000000", 75_000, 3_000_000),
    ("Staff training and professional development", "80000000", 50_000, 2_000_000),
    ("NHS patient record system integration", "48000000", 1_000_000, 50_000_000),
    ("Defence equipment support and maintenance", "45000000", 5_000_000, 200_000_000),
    ("Immigration case processing system", "72000000", 500_000, 20_000_000),
    ("Waste collection and recycling services", "90000000", 300_000, 8_000_000),
    ("Architectural design — public building refurbishment", "71000000", 150_000, 5_000_000),
    ("Strategy review and business case development", "79000000", 80_000, 4_000_000),
    ("Legal representation — commercial dispute", "79140000", 100_000, 5_000_000),
    ("Social care placement framework", "85000000", 500_000, 25_000_000),
    ("Public administration support services", "75000000", 100_000, 6_000_000),
    ("Leisure centre management contract", "92000000", 200_000, 4_000_000),
]

DUPLICATE_PAIRS = [
    ("IT infrastructure modernisation programme — Phase 2", "IT infrastructure modernisation programme"),
    ("Cloud migration services — extension", "Cloud migration and hosting services"),
    ("Management consultancy — phase 2 organisational review", "Management consultancy — organisational transformation"),
    ("Legal advice — judicial review (continuation)", "Legal advice — judicial review proceedings"),
    ("Cyber security operations — year 2", "Cyber security operations centre"),
]

HS2_TITLES = [
    "HS2 ecological mitigation — bat tunnel construction",
    "HS2 Euston station enabling works consultancy",
    "HS2 Phase 1 environmental monitoring services",
]


def _random_date(start: datetime, end: datetime) -> datetime:
    delta = (end - start).days
    return start + timedelta(days=random.randint(0, delta))


def _pick_supplier(cpv: str, title: str) -> str:
    if cpv.startswith("791"):
        return random.choice(LAW_FIRMS)
    if cpv.startswith("79") or any(k in title.lower() for k in CONSULTANCY_KEYWORDS):
        return random.choice(CONSULTANCY_SUPPLIERS)
    return random.choice(GENERAL_SUPPLIERS)


def _build_description(title: str, dept: str) -> str:
    extras = [
        "Framework agreement for delivery across multiple sites.",
        "Includes option years and performance incentives.",
        "Awarded following competitive tender process.",
        "Single supplier contract with milestone payments.",
        "Urgent requirement under negotiated procedure.",
    ]
    return f"{title}. Buyer: {dept}. {random.choice(extras)}"


def generate_contracts(n: int = 4000) -> pd.DataFrame:
    start = datetime(2017, 1, 1)
    end = datetime(2026, 6, 1)
    records = []

    for i in range(n):
        template = random.choice(CONTRACT_TEMPLATES)
        title, cpv, vmin, vmax = template
        dept = random.choice(DEPARTMENTS)
        award = _random_date(start, end)
        value = round(random.lognormvariate(12, 1.2), 2)
        value = max(vmin * 0.1, min(value, vmax))

        # De-template titles so only injected pairs trigger duplicate detection
        if random.random() < 0.85:
            suffix = random.choice(
                [
                    f"— Lot {random.randint(1, 9)}",
                    f"({dept.split()[0]} framework)",
                    f"— FY{award.year % 100}",
                    f"— Region {random.choice(['North', 'South', 'Midlands', 'London'])}",
                    f"— Phase {random.randint(1, 4)}",
                ]
            )
            title = f"{title} {suffix}"

        if random.random() < 0.03:
            title = random.choice(HS2_TITLES)
            dept = "Department for Transport"
            cpv = "45000000"
            value = round(random.uniform(5_000_000, 80_000_000), 2)

        if random.random() < 0.08:
            title = title.replace("consultancy", random.choice(CONSULTANCY_KEYWORDS))

        supplier = _pick_supplier(cpv, title)
        category = CPV_CATEGORIES.get(cpv, "Other services")
        ocid = f"ocds-h6vhtk-{award.year:04d}-{i:06d}"
        notice_id = f"CF-{award.year}-{random.randint(100000, 999999)}"

        records.append(
            {
                "ocid": ocid,
                "notice_id": notice_id,
                "title": title,
                "buyer": dept,
                "supplier": supplier,
                "award_date": award.strftime("%Y-%m-%d"),
                "value_gbp": value,
                "cpv_code": cpv,
                "category": category,
                "description": _build_description(title, dept),
                "department_tag": DEPARTMENT_TAGS.get(dept, "Other"),
                "contracts_finder_url": f"https://www.contractsfinder.service.gov.uk/Notice/{notice_id}",
            }
        )

    df = pd.DataFrame(records)

    # Inject deliberate duplicates for red-flag detection
    for dup_title, base_title in DUPLICATE_PAIRS:
        matches = df[df["title"].str.contains(base_title.split("—")[0].strip(), case=False, na=False)]
        if len(matches) == 0:
            continue
        base = matches.iloc[0]
        dup_date = (
            datetime.strptime(base["award_date"], "%Y-%m-%d") + timedelta(days=random.randint(30, 400))
        ).strftime("%Y-%m-%d")
        df.loc[len(df)] = {
            "ocid": f"ocds-h6vhtk-dup-{len(df)}",
            "notice_id": f"CF-DUP-{random.randint(100000, 999999)}",
            "title": dup_title,
            "buyer": base["buyer"],
            "supplier": base["supplier"],
            "award_date": dup_date,
            "value_gbp": round(base["value_gbp"] * random.uniform(0.8, 1.4), 2),
            "cpv_code": base["cpv_code"],
            "category": base["category"],
            "description": _build_description(dup_title, base["buyer"]),
            "department_tag": base["department_tag"],
            "contracts_finder_url": f"https://www.contractsfinder.service.gov.uk/Notice/CF-DUP-{random.randint(100000, 999999)}",
        }

    # Inject legal services contracts
    for _ in range(120):
        dept = random.choice(DEPARTMENTS)
        award = _random_date(start, end)
        kw = random.choice(LEGAL_KEYWORDS)
        title = f"{kw.title()} — {dept.split()[-1]} matter"
        cpv = random.choice(["79100000", "79110000", "79140000"])
        records_legal = {
            "ocid": f"ocds-h6vhtk-legal-{len(df)}",
            "notice_id": f"CF-LEG-{random.randint(100000, 999999)}",
            "title": title,
            "buyer": dept,
            "supplier": random.choice(LAW_FIRMS),
            "award_date": award.strftime("%Y-%m-%d"),
            "value_gbp": round(random.uniform(25_000, 3_000_000), 2),
            "cpv_code": cpv,
            "category": CPV_CATEGORIES[cpv],
            "description": _build_description(title, dept),
            "department_tag": DEPARTMENT_TAGS.get(dept, "Other"),
            "contracts_finder_url": f"https://www.contractsfinder.service.gov.uk/Notice/CF-LEG-{random.randint(100000, 999999)}",
        }
        df.loc[len(df)] = records_legal

    # Inject value spikes
    for _ in range(40):
        row = df.sample(1).iloc[0].copy()
        row["ocid"] = f"ocds-h6vhtk-spike-{random.randint(1, 99999)}"
        row["notice_id"] = f"CF-SPK-{random.randint(100000, 999999)}"
        row["value_gbp"] = round(row["value_gbp"] * random.uniform(4, 12), 2)
        row["award_date"] = _random_date(datetime(2022, 1, 1), end).strftime("%Y-%m-%d")
        df.loc[len(df)] = row.to_dict()

    df["award_date"] = pd.to_datetime(df["award_date"])
    df = df.sort_values("award_date").reset_index(drop=True)
    return df


if __name__ == "__main__":
    output = Path(__file__).parent / "sample_contracts.csv"
    data = generate_contracts(4000)
    data.to_csv(output, index=False)
    print(f"Generated {len(data):,} contracts -> {output}")