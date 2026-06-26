"""Custom CSS and styling for ProcureWatch UK."""

import streamlit as st


def inject_custom_css() -> None:
    st.markdown(
        """
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        html, body, [class*="css"] {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .main .block-container {
            padding-top: 1.5rem;
            max-width: 1400px;
        }

        .pw-header {
            background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
            color: white;
            padding: 1.25rem 1.5rem;
            border-radius: 12px;
            margin-bottom: 1.5rem;
            border-left: 4px solid #3b82f6;
        }
        .pw-header h1 {
            margin: 0;
            font-size: 1.75rem;
            font-weight: 700;
            color: white !important;
        }
        .pw-header p {
            margin: 0.35rem 0 0 0;
            opacity: 0.85;
            font-size: 0.95rem;
        }

        div[data-testid="stMetric"] {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 0.75rem 1rem;
        }
        div[data-testid="stMetric"] label {
            color: #64748b !important;
            font-size: 0.8rem !important;
        }
        div[data-testid="stMetric"] [data-testid="stMetricValue"] {
            color: #0f172a !important;
            font-weight: 600 !important;
        }

        .risk-high { color: #dc2626; font-weight: 600; }
        .risk-medium { color: #d97706; font-weight: 600; }
        .risk-low { color: #16a34a; font-weight: 600; }

        .pw-footer {
            margin-top: 3rem;
            padding: 1.25rem;
            background: #f1f5f9;
            border-radius: 8px;
            font-size: 0.85rem;
            color: #475569;
            border-top: 2px solid #cbd5e1;
        }

        .flag-badge {
            display: inline-block;
            background: #fef2f2;
            color: #b91c1c;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 2px 8px;
            font-size: 0.8rem;
            font-weight: 500;
        }

        section[data-testid="stSidebar"] {
            background-color: #f8fafc;
            border-right: 1px solid #e2e8f0;
        }

        .stTabs [data-baseweb="tab-list"] {
            gap: 8px;
        }
        .stTabs [data-baseweb="tab"] {
            padding: 10px 20px;
            font-weight: 500;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def render_header() -> None:
    st.markdown(
        """
        <div class="pw-header">
            <h1>ProcureWatch UK</h1>
            <p>UK Public Procurement Accountability Dashboard — transparent scrutiny of government spending</p>
        </div>
        """,
        unsafe_allow_html=True,
    )


def risk_badge(score: int) -> str:
    if score >= 70:
        cls = "risk-high"
    elif score >= 35:
        cls = "risk-medium"
    else:
        cls = "risk-low"
    return f'<span class="{cls}">{score}</span>'