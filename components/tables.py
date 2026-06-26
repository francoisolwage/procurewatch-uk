"""Table rendering and export utilities."""

from __future__ import annotations

import pandas as pd
import streamlit as st

from utils.risk_scoring import explain_flags

DISPLAY_COLUMNS = [
    "title",
    "buyer",
    "supplier",
    "award_date",
    "value_gbp",
    "risk_score",
    "red_flag_count",
    "red_flags",
    "department_tag",
]

COLUMN_CONFIG = {
    "title": st.column_config.TextColumn("Title", width="large"),
    "buyer": st.column_config.TextColumn("Department", width="medium"),
    "supplier": st.column_config.TextColumn("Supplier", width="medium"),
    "award_date": st.column_config.DateColumn("Award Date", format="DD MMM YYYY"),
    "value_gbp": st.column_config.NumberColumn("Value (£)", format="£%,.0f"),
    "risk_score": st.column_config.ProgressColumn(
        "Risk Score",
        min_value=0,
        max_value=100,
        format="%d",
    ),
    "red_flag_count": st.column_config.NumberColumn("Red Flags", format="%d/3"),
    "red_flags": st.column_config.TextColumn("Flag Types"),
    "department_tag": st.column_config.TextColumn("Dept Tag"),
}


def prepare_display_df(df: pd.DataFrame) -> pd.DataFrame:
    display = df.copy()
    display["award_date"] = pd.to_datetime(display["award_date"]).dt.date
    return display[DISPLAY_COLUMNS]


def render_contracts_table(
    df: pd.DataFrame,
    key: str,
    height: int = 480,
    show_selection: bool = True,
) -> pd.DataFrame | None:
    if df.empty:
        st.info("No contracts match the current filters.")
        return None

    display = prepare_display_df(df)
    event = st.dataframe(
        display,
        column_config=COLUMN_CONFIG,
        use_container_width=True,
        height=height,
        hide_index=True,
        on_select="rerun" if show_selection else "ignore",
        selection_mode="single-row" if show_selection else None,
        key=key,
    )

    if show_selection and event and event.selection and event.selection.rows:
        selected_idx = event.selection.rows[0]
        return df.iloc[selected_idx]
    return None


def render_contract_detail(row: pd.Series) -> None:
    with st.expander("Contract details", expanded=True):
        c1, c2, c3 = st.columns(3)
        c1.metric("Contract Value", f"£{row['value_gbp']:,.0f}")
        c2.metric("Risk Score", f"{row['risk_score']}/100")
        c3.metric("Red Flags", f"{row['red_flag_count']}/3")

        st.markdown(f"**Title:** {row['title']}")
        st.markdown(f"**Department:** {row['buyer']} ({row['department_tag']})")
        st.markdown(f"**Supplier:** {row['supplier']}")
        st.markdown(f"**Award Date:** {pd.to_datetime(row['award_date']).strftime('%d %b %Y')}")
        st.markdown(f"**CPV / Category:** {row['cpv_code']} — {row['category']}")
        st.markdown(f"**OCID:** `{row['ocid']}` · **Notice ID:** `{row['notice_id']}`")
        st.markdown(f"**Description:** {row['description']}")

        if row["red_flag_count"] > 0:
            st.markdown("#### Why is this flagged?")
            st.warning(explain_flags(row))

        url = row.get("contracts_finder_url", "")
        if url:
            st.link_button("View on Contracts Finder →", url, use_container_width=False)


def export_csv_button(df: pd.DataFrame, label: str = "Download filtered data (CSV)") -> None:
    if df.empty:
        return
    csv = df.to_csv(index=False).encode("utf-8")
    st.download_button(
        label=label,
        data=csv,
        file_name="procurewatch_export.csv",
        mime="text/csv",
    )