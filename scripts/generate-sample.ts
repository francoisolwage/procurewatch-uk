/**
 * Generate representative sample procurement data covering central, local and devolved UK.
 * Clearly labelled as demonstration data — not authoritative records.
 */
import fs from "fs";
import path from "path";
import { BUYER_PROFILES } from "../lib/government";

const BUYERS = Object.keys(BUYER_PROFILES);

const TEMPLATES = [
  { title: "IT infrastructure modernisation", cpv: "48000000", cat: "Software and IT systems", vmin: 500_000, vmax: 25_000_000 },
  { title: "Cloud migration services", cpv: "72000000", cat: "IT services", vmin: 250_000, vmax: 15_000_000 },
  { title: "Management consultancy programme", cpv: "79000000", cat: "Business consultancy", vmin: 100_000, vmax: 8_000_000 },
  { title: "Highway maintenance contract", cpv: "45000000", cat: "Construction work", vmin: 1_000_000, vmax: 40_000_000 },
  { title: "Facilities management", cpv: "90000000", cat: "Cleaning services", vmin: 200_000, vmax: 12_000_000 },
  { title: "Legal advisory services", cpv: "79110000", cat: "Legal advisory", vmin: 50_000, vmax: 2_500_000 },
  { title: "Social care framework", cpv: "85000000", cat: "Health and social work", vmin: 500_000, vmax: 25_000_000 },
  { title: "Cyber security operations", cpv: "72000000", cat: "IT services", vmin: 300_000, vmax: 10_000_000 },
];

const SUPPLIERS = [
  "Deloitte LLP", "PwC LLP", "Capgemini UK plc", "Serco Group plc",
  "BAE Systems plc", "Mitie Group plc", "Microsoft Limited", "Kier Group plc",
  "Freshfields Bruckhaus Deringer LLP", "BT Group plc",
];

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randomDate(start: Date, end: Date): string {
  const t = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(t).toISOString().slice(0, 10);
}

function esc(s: string) {
  return s.includes(",") ? `"${s.replace(/"/g, '""')}"` : s;
}

const rows: string[] = [
  [
    "ocid", "notice_id", "title", "buyer", "supplier", "award_date",
    "value_gbp", "cpv_code", "category", "description", "department_tag",
    "contracts_finder_url", "government_level", "location_lat", "location_lng",
    "location_locality", "data_source", "is_sample",
  ].join(","),
];

const start = new Date("2017-01-01");
const end = new Date("2026-06-01");

for (let i = 0; i < 4200; i++) {
  const buyer = BUYERS[i % BUYERS.length];
  const profile = BUYER_PROFILES[buyer];
  const tpl = TEMPLATES[i % TEMPLATES.length];
  const award = randomDate(start, end);
  const suffixes = [
    `— Lot ${(i % 9) + 1}`,
    `(${buyer.split(" ")[0]} framework)`,
    `— FY${award.slice(2, 4)}`,
    `— Region ${["North", "South", "Midlands", "London", "West"][i % 5]}`,
    `— Phase ${(i % 4) + 1}`,
    `— Contract ${1000 + i}`,
  ];
  const title = `${tpl.title} ${suffixes[i % suffixes.length]} #${i}`;
  const value = Math.round(rand(tpl.vmin * 0.1, tpl.vmax));
  const year = award.slice(0, 4);
  const noticeId = `DEMO-${year}-${100000 + i}`;
  const ocid = `ocds-demo-${year}-${String(i).padStart(6, "0")}`;
  const supplier = SUPPLIERS[i % SUPPLIERS.length];
  const desc = `${title}. Buyer: ${buyer}. Representative demonstration record — not an official notice.`;
  const cfUrl =
    profile.level === "central" || profile.level === "local"
      ? `https://www.contractsfinder.service.gov.uk/Notice/${noticeId}`
      : "";

  rows.push(
    [
      ocid, noticeId, title, buyer, supplier, award,
      value.toFixed(2), tpl.cpv, tpl.cat, desc, profile.department_tag,
      cfUrl, profile.level, profile.lat, profile.lng,
      profile.locality, profile.data_source, "true",
    ].map((v) => esc(String(v))).join(",")
  );
}

const out = path.join(process.cwd(), "data", "sample_contracts.csv");
fs.writeFileSync(out, rows.join("\n"));
console.log(`Generated ${rows.length - 1} demonstration contracts → ${out}`);