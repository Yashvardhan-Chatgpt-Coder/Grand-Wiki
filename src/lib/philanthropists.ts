export interface Philanthropist {
  id: string;
  name: string;
  amount: number;
  server: string;
}

export const PHILANTHROPISTS: Philanthropist[] = [
  { id: "p1", name: "Marcus Vale", amount: 2_450_000, server: "EN1" },
  { id: "p2", name: "Elena Cross", amount: 1_820_000, server: "EN3" },
  { id: "p3", name: "Jordan Pike", amount: 1_150_000, server: "EN1" },
  { id: "p4", name: "Sofia Reyes", amount: 980_000, server: "EN3" },
  { id: "p5", name: "Tyler Nash", amount: 740_000, server: "EN1" },
  { id: "p6", name: "Aiden Brooks", amount: 620_000, server: "EN3" },
  { id: "p7", name: "Mia Chen", amount: 510_000, server: "EN1" },
  { id: "p8", name: "Noah Sterling", amount: 425_000, server: "EN3" },
  { id: "p9", name: "Liam Ortiz", amount: 380_000, server: "EN1" },
  { id: "p10", name: "Harper Quinn", amount: 295_000, server: "EN3" },
];

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
