# ProcureWatch UK

UK public procurement transparency dashboard — central government, local authorities, and devolved administrations (Scotland, Wales, Northern Ireland) with searchable data, risk scoring, and an interactive project map.

Built with **Next.js**, **TypeScript**, **Tailwind CSS**, **Recharts**, and **Leaflet**.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Build & Test

```bash
npm run build
npm test
npm start
```

## Features

- **Multi-tier coverage** — Central, local (England), Scotland, Wales, Northern Ireland
- **Interactive project map** — Buyer-location markers, filter-reactive, click for details
- **Official portal attribution** — Contracts Finder, Public Contracts Scotland, Sell2Wales, eTendersNI
- **Sample vs real data** — Demonstration data clearly labelled; upload official CSV/JSONL exports
- **Risk scoring** — Duplicate, consultancy, value spike flags
- **All dashboard sections** — Overview, Project Map, contracts table, legal tracker, red flags, notable projects

## Data sources

| Portal | Coverage |
|--------|----------|
| [Contracts Finder](https://www.contractsfinder.service.gov.uk/) | UK central & local |
| [Public Contracts Scotland](https://www.publiccontractsscotland.gov.uk/) | Scotland |
| [Sell2Wales](https://www.sell2wales.gov.wales/) | Wales |
| [eTendersNI](https://etendersni.gov.uk/) | Northern Ireland |

## Deploy

**Live:** [procurewatch-uk.vercel.app](https://procurewatch-uk.vercel.app)

```bash
npx vercel --prod
```

## License

MIT