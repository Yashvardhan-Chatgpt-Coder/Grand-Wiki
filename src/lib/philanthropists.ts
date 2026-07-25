export interface Philanthropist {
  id: string;
  name: string;
  amount: number;
  server: string;
}

export const PHILANTHROPISTS: Philanthropist[] = [];

export function formatDonationAmount(amount: number): string {
  return `$${amount.toLocaleString("en-US")}`;
}

export function getSortedPhilanthropists(): Philanthropist[] {
  return [...PHILANTHROPISTS].sort((a, b) => b.amount - a.amount);
}

export function getTopPhilanthropists(limit = 5) {
  return getSortedPhilanthropists().slice(0, limit).map((philanthropist, index) => ({
    ...philanthropist,
    rank: index + 1,
    amountLabel: formatDonationAmount(philanthropist.amount),
  }));
}

export function getTotalDonations(): number {
  return PHILANTHROPISTS.reduce((sum, philanthropist) => sum + philanthropist.amount, 0);
}

export function formatServerNames(servers: string[]): string {
  const shortMap: Record<string, string> = {
    "ENGLISH #1": "EN1",
    "ENGLISH #2": "EN2",
    "ENGLISH #3": "EN3",
    "EN1": "EN1",
    "EN2": "EN2",
    "EN3": "EN3",
  };

  const uniqueShort = Array.from(
    new Set(
      servers
        .map((s) => (s || "").trim())
        .filter(Boolean)
        .map((s) => shortMap[s] || s)
    )
  );

  return uniqueShort.length > 0 ? uniqueShort.join(" / ") : "EN1";
}
