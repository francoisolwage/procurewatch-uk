# ProcureWatch UK

UK Public Procurement Accountability Dashboard — transparent scrutiny of government spending using Contracts Finder / OCDS data.

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Generate sample data (first time only)
python data/generate_sample_data.py

# Run locally
streamlit run app.py
```

Open [http://localhost:8501](http://localhost:8501)

## Features

- **Overview** — Spend by year with PM/government era colour-coding, key metrics, searchable contract table
- **All Contracts** — Sortable, filterable, paginated table with risk scores
- **By Department** — Department spend charts and filtered contracts
- **Legal Services / Lawfare Tracker** — Legal spend analysis (CPV 791xxxx + keywords)
- **Red Flags Explorer** — Duplicate risk, repeated consultancy, value spike detection
- **Notable Projects** — Curated high-cost/controversial infrastructure projects
- **CSV export** — Download any filtered view
- **Real data upload** — Switch from sample to OCDS bulk CSV/JSONL

## Deploy

### Streamlit Community Cloud (recommended for the dashboard)

1. Push this repo to GitHub
2. Go to [share.streamlit.io](https://share.streamlit.io)
3. Connect your GitHub account → New app → select this repo
4. Main file: `app.py` → Deploy

### Vercel (landing page)

The `public/` folder contains a static landing page. Deploy with:

```bash
npx vercel --prod
```

The live Streamlit dashboard runs on Streamlit Cloud; Vercel hosts the project landing/redirect page.

## Data Sources

- [Contracts Finder](https://www.contractsfinder.service.gov.uk/)
- [OCDS Bulk Data (UK)](https://data.open-contracting.org/en/publication/143)

## License

MIT