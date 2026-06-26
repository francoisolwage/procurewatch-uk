export function formatGBP(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getYear(dateStr: string): number {
  return new Date(dateStr).getFullYear();
}

export function riskColor(score: number): string {
  if (score >= 70) return "text-risk-high";
  if (score >= 35) return "text-risk-medium";
  return "text-risk-low";
}