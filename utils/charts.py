"""Chart helpers for ProcureWatch UK."""

from __future__ import annotations

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

from utils.constants import GOVERNMENT_ERAS
from utils.data_loader import get_government_era


def spend_by_year_chart(df: pd.DataFrame, title: str = "Total Procurement Spend by Year") -> go.Figure:
    yearly = (
        df.assign(year=df["award_date"].dt.year)
        .groupby("year", as_index=False)["value_gbp"]
        .sum()
    )
    yearly["era"] = yearly["year"].apply(
        lambda y: get_government_era(pd.Timestamp(f"{y}-06-15"))
    )
    yearly["era_color"] = yearly["era"].map(
        {k: v["color"] for k, v in GOVERNMENT_ERAS.items()}
    )

    fig = go.Figure()
    for era in yearly["era"].unique():
        subset = yearly[yearly["era"] == era]
        color = GOVERNMENT_ERAS.get(era, {}).get("color", "#64748B")
        fig.add_trace(
            go.Bar(
                x=subset["year"],
                y=subset["value_gbp"],
                name=f"{era} era",
                marker_color=color,
                hovertemplate="Year %{x}<br>Spend £%{y:,.0f}<extra></extra>",
            )
        )
    fig.update_layout(
        title=title,
        xaxis_title="Year",
        yaxis_title="Total Spend (£)",
        barmode="group",
        legend_title="Government Era",
        height=420,
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)",
        font=dict(family="Inter, system-ui, sans-serif", color="#1e293b"),
        yaxis=dict(tickformat=",.0f"),
    )
    return fig


def spend_line_chart(df: pd.DataFrame, title: str) -> go.Figure:
    monthly = (
        df.set_index("award_date")
        .resample("QE")["value_gbp"]
        .sum()
        .reset_index()
    )
    monthly.columns = ["period", "value_gbp"]
    fig = px.line(
        monthly,
        x="period",
        y="value_gbp",
        title=title,
        markers=True,
    )
    fig.update_layout(
        height=380,
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)",
        yaxis_title="Spend (£)",
        xaxis_title="Period",
        font=dict(family="Inter, system-ui, sans-serif"),
        yaxis=dict(tickformat=",.0f"),
    )
    return fig


def department_bar_chart(df: pd.DataFrame, title: str, top_n: int = 12) -> go.Figure:
    by_dept = (
        df.groupby("buyer", as_index=False)["value_gbp"]
        .sum()
        .sort_values("value_gbp", ascending=True)
        .tail(top_n)
    )
    fig = px.bar(
        by_dept,
        x="value_gbp",
        y="buyer",
        orientation="h",
        title=title,
        color_discrete_sequence=["#1e40af"],
    )
    fig.update_layout(
        height=max(320, top_n * 32),
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)",
        xaxis_title="Total Spend (£)",
        yaxis_title="",
        font=dict(family="Inter, system-ui, sans-serif"),
        xaxis=dict(tickformat=",.0f"),
    )
    return fig


def supplier_bar_chart(df: pd.DataFrame, title: str, top_n: int = 10) -> go.Figure:
    by_supplier = (
        df.groupby("supplier", as_index=False)["value_gbp"]
        .sum()
        .sort_values("value_gbp", ascending=True)
        .tail(top_n)
    )
    fig = px.bar(
        by_supplier,
        x="value_gbp",
        y="supplier",
        orientation="h",
        title=title,
        color_discrete_sequence=["#0f766e"],
    )
    fig.update_layout(
        height=max(300, top_n * 34),
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)",
        xaxis_title="Total Spend (£)",
        yaxis_title="",
        font=dict(family="Inter, system-ui, sans-serif"),
        xaxis=dict(tickformat=",.0f"),
    )
    return fig