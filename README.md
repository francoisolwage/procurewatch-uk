# ProcureWatch UK

UK Public Procurement Accountability Dashboard — transparent scrutiny of government spending using Contracts Finder / OCDS data.

Built with **Next.js**, **TypeScript**, **Tailwind CSS**, and **Recharts**. Deploys natively to Vercel.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Build

```bash
npm run build    # preprocesses sample data + builds Next.js
npm start        # production server
```

## Features

- **Overview** — Spend by year with PM/government era colour-coding, key metrics, searchable contract table
- **All Contracts** — Sortable, filterable, paginated table with risk scores
- **By Department** — Department spend charts and filtered contracts
- **Legal Services / Lawfare Tracker** — Legal spend analysis (CPV 791xxxx + keywords)
- **Red Flags Explorer** — Duplicate risk, repeated consultancy, value spike detection
- **Notable Projects** — Curated high-cost/controversial infrastructure projects
- **CSV export** — Download any filtered view
- **Real data upload** — Switch from sample to OCDS bulk CSV/JSONL

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/francoisolwage/procurewatch-uk)

Or via CLI:

```bash
npx vercel --prod
```

**Live:** [procurewatch-uk.vercel.app](https://procurewatch-uk.vercel.app)

## Regenerate Sample Data

```bash
python data/generate_sample_data.py
npm run preprocess
```

## Data Sources

- [Contracts Finder](https://www.contractsfinder.service.gov.uk/)
- [OCDS Bulk Data (UK)](https://data.open-contracting.org/en/publication/143)

## License

MIT