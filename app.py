"""ProcureWatch UK — UK Public Procurement Accountability Dashboard."""

from __future__ import annotations

import pandas as pd
import streamlit as st

from components.styling import inject_custom_css, render_header
from components.tables import export_csv_button, render_contract_detail, render_contracts_table
from utils.charts import department_bar_chart, spend_by_year_chart, spend_line_chart, supplier_bar_chart
from utils.constants import DATA_SOURCES, GOVERNMENT_ERAS, NOTABLE_PROJECTS, RED_FLAG_DEFINITIONS
from utils.data_loader import get_government_era, load_sample_data, load_uploaded_data

st.set_page_config(
    page_title="ProcureWatch UK",
    page_icon="🔍",
    layout="wide",
    initial_sidebar_state="expanded",
)

inject_custom_css()
render_header()


@st.cache_data
def _get_sample():
    return load_sample_data()


def apply_filters(df: pd.DataFrame, filters: dict) -> pd.DataFrame:
    result = df.copy()

    if filters["departments"]:
        result = result[result["buyer"].isin(filters["departments"])]

    if filters["year_range"]:
        ymin, ymax = filters["year_range"]
        years = result["award_date"].dt.year
        result = result[(years >= ymin) & (years <= ymax)]

    if filters["value_range"]:
        vmin, vmax = filters["value_range"]
        result = result[(result["value_gbp"] >= vmin) & (result["value_gbp"] <= vmax)]

    if filters["search"]:
        q = filters["search"].lower()
        mask = (
            result["title"].str.lower().str.contains(q, na=False)
            | result["supplier"].str.lower().str.contains(q, na=False)
            | result["description"].str.lower().str.contains(q, na=False)
        )
        result = result[mask]

    if filters["flagged_only"]:
        result = result[result["red_flag_count"] > 0]

    if filters["era"] != "All":
        result = result[result["award_date"].apply(get_government_era) == filters["era"]]

    sort_map = {
        "Highest value": ("value_gbp", False),
        "Newest first": ("award_date", False),
        "Highest risk score": ("risk_score", False),
        "Most red flags": ("red_flag_count", False),
    }
    col, asc = sort_map[filters["sort_by"]]
    result = result.sort_values(col, ascending=asc)
    return result


def render_metrics(df: pd.DataFrame) -> None:
    total = df["value_gbp"].sum()
    avg = df["value_gbp"].mean()
    flagged = df[df["red_flag_count"] > 0]
    pct_flagged = (len(flagged) / len(df) * 100) if len(df) else 0

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Total Spend", f"£{total:,.0f}")
    c2.metric("Average Contract", f"£{avg:,.0f}")
    c3.metric("% with Red Flags", f"{pct_flagged:.1f}%")
    c4.metric("Flagged Contracts", f"{len(flagged):,}")


def render_risk_methodology() -> None:
    with st.expander("How we calculate risk — transparent methodology"):
        st.markdown(
            "Every contract receives a **Risk Score (0–100)** based on up to three explainable red flags. "
            "No black-box algorithms — each flag has a clear rule."
        )
        for key, cfg in RED_FLAG_DEFINITIONS.items():
            st.markdown(f"**{cfg['label']}** (+{cfg['weight']} points): {cfg['description']}")
        st.markdown(
            "- Contracts in the top 5% by value receive a +10 severity bump (capped at 100).\n"
            "- **Red Flags: N/3** shows how many of the three flags are active.\n"
            "- Flags are recalculated when you upload new data."
        )


def render_data_sources() -> None:
    with st.expander("Data sources & loading real OCDS bulk data"):
        st.markdown(
            """
            **Current dataset:** Sample data for demonstration (3,000–5,000 realistic contracts, 2017–2026).

            **To load real historical data:**

            1. Download bulk OCDS releases from [Open Contracting Data Standard — UK Contracts Finder]({ocds_bulk})
            2. Or export from [Contracts Finder]({cf}) search results (CSV/JSON)
            3. Use the sidebar **Upload real data** to load your file (CSV or JSONL)
            4. Required fields: OCID, Notice ID, Title, Buyer, Supplier, Award Date, Value, CPV, Description

            The app normalises common column names from OCDS exports automatically.
            """.format(
                ocds_bulk=DATA_SOURCES["ocds_bulk"],
                cf=DATA_SOURCES["contracts_finder"],
            )
        )
        st.markdown(
            f"- [Contracts Finder]({DATA_SOURCES['contracts_finder']})\n"
            f"- [OCDS Bulk Data (UK)]({DATA_SOURCES['ocds_bulk']})\n"
            f"- [Contracts Finder API]({DATA_SOURCES['ocds_api']})"
        )


def render_notable_projects() -> None:
    st.subheader("Notable High-Cost / Controversial Projects")
    st.caption(
        "Curated examples of major projects with documented cost overruns or delays. "
        "Suggest additions via GitHub Issues."
    )
    for proj in NOTABLE_PROJECTS:
        with st.container(border=True):
            c1, c2 = st.columns([3, 1])
            c1.markdown(f"**{proj['name']}** — {proj['department']}")
            c1.markdown(proj["explanation"])
            c2.markdown(f"**Original:** £{proj['original_cost_m']:,}m")
            c2.markdown(f"**Final / latest:** £{proj['final_cost_m']:,}m")
            c2.markdown(f"*{proj['status']}*")


# ── Sidebar ──────────────────────────────────────────────────────────────────

with st.sidebar:
    st.markdown("### Navigation")
    page = st.radio(
        "Section",
        [
            "Overview",
            "All Contracts",
            "By Department",
            "Legal Services / Lawfare",
            "Red Flags Explorer",
            "Notable Projects",
            "Methodology & Data",
        ],
        label_visibility="collapsed",
    )

    st.divider()
    st.markdown("### Data Source")
    data_mode = st.radio("Dataset", ["Sample data", "Upload real data"], index=0)

    uploaded = None
    if data_mode == "Upload real data":
        uploaded = st.file_uploader("Upload CSV or JSONL", type=["csv", "json", "jsonl"])
        if uploaded is None:
            st.info("Upload a file or switch to sample data.")
    else:
        st.caption("Using built-in sample dataset (2017–2026).")

    st.divider()
    st.markdown("### Filters")

    try:
        if data_mode == "Upload real data" and uploaded:
            raw_df = load_uploaded_data(uploaded)
        elif data_mode == "Upload real data":
            raw_df = _get_sample()
        else:
            raw_df = _get_sample()
    except Exception as exc:
        st.error(f"Failed to load data: {exc}")
        st.stop()

    departments = sorted(raw_df["buyer"].unique())
    selected_depts = st.multiselect("Department", departments, placeholder="All departments")

    year_min = int(raw_df["award_date"].dt.year.min())
    year_max = int(raw_df["award_date"].dt.year.max())
    year_range = st.slider("Year range", year_min, year_max, (year_min, year_max))

    val_min = float(raw_df["value_gbp"].min())
    val_max = float(raw_df["value_gbp"].max())
    value_range = st.slider(
        "Value range (£)",
        val_min,
        val_max,
        (val_min, val_max),
        format="£%0.0f",
    )

    search = st.text_input("Search title / supplier", placeholder="e.g. consultancy, HS2…")
    flagged_only = st.checkbox("Show only flagged contracts")
    era = st.selectbox("Government era", ["All"] + list(GOVERNMENT_ERAS.keys()))
    sort_by = st.selectbox(
        "Sort by",
        ["Highest value", "Newest first", "Highest risk score", "Most red flags"],
    )

    filters = {
        "departments": selected_depts,
        "year_range": year_range,
        "value_range": value_range,
        "search": search,
        "flagged_only": flagged_only,
        "era": era,
        "sort_by": sort_by,
    }

    df = apply_filters(raw_df, filters)

    st.divider()
    st.caption(f"Showing **{len(df):,}** of **{len(raw_df):,}** contracts")

# ── Main content ─────────────────────────────────────────────────────────────

if page == "Overview":
    st.subheader("Overview")
    render_metrics(df)

    st.plotly_chart(spend_by_year_chart(df), use_container_width=True)

    era_cols = st.columns(len(GOVERNMENT_ERAS))
    for col, (name, cfg) in zip(era_cols, GOVERNMENT_ERAS.items()):
        col.markdown(
            f'<span style="display:inline-block;width:12px;height:12px;background:{cfg["color"]};'
            f'border-radius:2px;margin-right:6px;"></span>{name}',
            unsafe_allow_html=True,
        )

    st.subheader("All Contracts")
    selected = render_contracts_table(df, key="overview_table")
    if selected is not None:
        render_contract_detail(selected)
    export_csv_button(df)
    render_risk_methodology()

elif page == "All Contracts":
    st.subheader("All Contracts")
    render_metrics(df)
    selected = render_contracts_table(df, key="all_table", height=560)
    if selected is not None:
        render_contract_detail(selected)
    export_csv_button(df)

elif page == "By Department":
    st.subheader("Spend by Department")
    dept_choice = st.selectbox(
        "Select department",
        ["All departments"] + departments,
        index=0,
    )
    dept_df = df if dept_choice == "All departments" else df[df["buyer"] == dept_choice]

    if dept_choice == "All departments":
        st.plotly_chart(department_bar_chart(dept_df, "Total Spend by Department"), use_container_width=True)
    else:
        render_metrics(dept_df)
        st.plotly_chart(
            spend_by_year_chart(dept_df, f"{dept_choice} — Spend by Year"),
            use_container_width=True,
        )

    selected = render_contracts_table(dept_df, key="dept_table")
    if selected is not None:
        render_contract_detail(selected)
    export_csv_button(dept_df)

elif page == "Legal Services / Lawfare":
    st.subheader("Legal Services / Lawfare Tracker")
    legal_df = df[df["is_legal"]].copy()

    c1, c2 = st.columns(2)
    c1.metric("Legal Contracts", f"{len(legal_df):,}")
    c2.metric("Total Legal Spend", f"£{legal_df['value_gbp'].sum():,.0f}")

    if legal_df.empty:
        st.info("No legal services contracts match current filters.")
    else:
        st.plotly_chart(
            spend_line_chart(legal_df, "Legal Services Spend Over Time"),
            use_container_width=True,
        )
        c1, c2 = st.columns(2)
        with c1:
            st.plotly_chart(
                department_bar_chart(legal_df, "Legal Spend by Department"),
                use_container_width=True,
            )
        with c2:
            st.plotly_chart(
                supplier_bar_chart(legal_df, "Top 10 Law Firms / Suppliers"),
                use_container_width=True,
            )

        st.markdown("#### All Legal-Related Contracts")
        selected = render_contracts_table(legal_df, key="legal_table")
        if selected is not None:
            render_contract_detail(selected)
        export_csv_button(legal_df, "Download legal contracts (CSV)")

    st.caption(
        "Detection: CPV codes 791xxxx or keywords (legal advice, solicitors, judicial review, litigation, etc.)"
    )

elif page == "Red Flags Explorer":
    st.subheader("Red Flags Explorer")
    flagged_df = df[df["red_flag_count"] > 0].sort_values(
        ["red_flag_count", "risk_score"], ascending=False
    )

    st.markdown(
        f"**{len(flagged_df):,}** contracts with at least one red flag "
        f"({len(flagged_df)/len(df)*100:.1f}% of filtered set)"
        if len(df) else "No data"
    )

    for key, cfg in RED_FLAG_DEFINITIONS.items():
        st.markdown(f"- **{cfg['label']}:** {cfg['description']}")

    if flagged_df.empty:
        st.success("No flagged contracts in the current filter set.")
    else:
        selected = render_contracts_table(flagged_df, key="flags_table", height=560)
        if selected is not None:
            render_contract_detail(selected)
        export_csv_button(flagged_df, "Download flagged contracts (CSV)")

    render_risk_methodology()

elif page == "Notable Projects":
    render_notable_projects()

elif page == "Methodology & Data":
    st.subheader("Methodology & Transparency")
    render_risk_methodology()
    render_data_sources()
    st.markdown("#### Government Era Colour Key")
    for name, cfg in GOVERNMENT_ERAS.items():
        st.markdown(
            f"- **{name}** ({cfg['start']} → {cfg['end']}) "
            f'<span style="color:{cfg["color"]};">■</span>',
            unsafe_allow_html=True,
        )

# ── Footer ───────────────────────────────────────────────────────────────────

st.markdown(
    f"""
    <div class="pw-footer">
        <strong>ProcureWatch UK</strong> · Data sources:
        <a href="{DATA_SOURCES['contracts_finder']}">Contracts Finder</a> ·
        <a href="{DATA_SOURCES['ocds_bulk']}">OCDS Bulk Data</a><br>
        Sample dataset last generated: June 2026 ·
        Not affiliated with HM Government · For accountability research purposes
    </div>
    """,
    unsafe_allow_html=True,
)