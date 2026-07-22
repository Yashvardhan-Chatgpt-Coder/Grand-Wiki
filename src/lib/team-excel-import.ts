import * as XLSX from "xlsx";
import type { Team } from "@/components/dashboard/AddTeamModal";
import type { AddPoolTeamInput } from "@/components/dashboard/AddPoolTeamModal";
import type { PoolTeam } from "@/lib/team-pool";

export const TEAM_IMPORT_HEADERS = [
  "Slot Number",
  "Team Name",
  "Tags",
  "Players",
  "Save to Database",
];

export const POOL_TEAM_IMPORT_HEADERS = [
  "Team Name",
  "Tags",
  "Mobile Number",
];

const TEAM_IMPORT_SAMPLE_ROWS = [
  ["1", "Team Phoenix", "Invited, Pro", "Player 1, Player 2, Player 3, Player 4", "No"],
  ["2", "Deadly Squad", "Qualifier", "Aryan, Rohit, Kabir, Dev", "Yes"],
];

const POOL_TEAM_IMPORT_SAMPLE_ROWS = [
  ["Team Phoenix", "Invited, Pro", "+91 98765 43210"],
  ["Deadly Squad", "Qualifier", "+91 98765 43211"],
];

type ParsedTeamRow = {
  slotNumber: string;
  name: string;
  tags: string[];
  players: string[];
  addToDatabase: boolean;
  contactMobile: string;
};

const normalizeHeader = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const splitList = (value: unknown) =>
  String(value ?? "")
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

const parseBoolean = (value: unknown) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  return ["yes", "y", "true", "1", "save"].includes(normalized);
};

const findColumnIndex = (headers: string[], aliases: string[]) => {
  const normalizedAliases = aliases.map(normalizeHeader);
  return headers.findIndex((header) => normalizedAliases.includes(normalizeHeader(header)));
};

function parseRows(rows: unknown[][]): ParsedTeamRow[] {
  const headerIndex = rows.findIndex((row) =>
    row.some((cell) => normalizeHeader(cell) === "teamname" || normalizeHeader(cell) === "team"),
  );

  if (headerIndex === -1) {
    throw new Error("Excel must include a Team Name column.");
  }

  const headers = rows[headerIndex].map((cell) => String(cell ?? "").trim());
  const dataRows = rows.slice(headerIndex + 1);
  const slotIndex = findColumnIndex(headers, ["Slot Number", "Slot", "Slot No", "Slot No."]);
  const nameIndex = findColumnIndex(headers, ["Team Name", "Team"]);
  const tagsIndex = findColumnIndex(headers, ["Tags", "Tag"]);
  const playersIndex = findColumnIndex(headers, ["Players", "Player Names"]);
  const saveToDatabaseIndex = findColumnIndex(headers, ["Save to Database", "Add to Database", "Save Team", "Pool"]);
  const contactMobileIndex = findColumnIndex(headers, ["Mobile Number", "Mobile", "Contact Mobile", "Phone", "Phone Number"]);

  if (nameIndex === -1) {
    throw new Error("Excel must include a Team Name column.");
  }

  return dataRows
    .map((row) => {
      const name = String(row[nameIndex] ?? "").trim();

      return {
        slotNumber: slotIndex >= 0 ? String(row[slotIndex] ?? "").trim() : "",
        name,
        tags: tagsIndex >= 0 ? splitList(row[tagsIndex]) : [],
        players: playersIndex >= 0 ? splitList(row[playersIndex]) : [],
        addToDatabase: saveToDatabaseIndex >= 0 ? parseBoolean(row[saveToDatabaseIndex]) : false,
        contactMobile: contactMobileIndex >= 0 ? String(row[contactMobileIndex] ?? "").trim() : "",
      };
    })
    .filter((row) => row.name);
}

export async function parseTeamsExcelFile(file: File): Promise<Team[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("Excel file does not contain a sheet.");
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    blankrows: false,
    defval: "",
  });
  const parsedRows = parseRows(rows);

  if (parsedRows.length === 0) {
    throw new Error("No valid teams found. Add at least one row with Team Name.");
  }

  return parsedRows.map((row) => ({
    id: crypto.randomUUID(),
    name: row.name,
    logo: null,
    slotNumber: row.slotNumber,
    tags: row.tags,
    addToDatabase: row.addToDatabase,
    players: row.players,
  }));
}

export async function parsePoolTeamsExcelFile(file: File): Promise<AddPoolTeamInput[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("Excel file does not contain a sheet.");
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    blankrows: false,
    defval: "",
  });
  const parsedRows = parseRows(rows);

  if (parsedRows.length === 0) {
    throw new Error("No valid teams found. Add at least one row with Team Name.");
  }

  return parsedRows.map((row) => ({
    name: row.name,
    logo: null,
    tags: row.tags,
    contactMobile: row.contactMobile,
  }));
}

export function downloadTeamImportTemplate(mode: "event" | "pool" = "event") {
  const headers = mode === "pool" ? POOL_TEAM_IMPORT_HEADERS : TEAM_IMPORT_HEADERS;
  const sampleRows = mode === "pool" ? POOL_TEAM_IMPORT_SAMPLE_ROWS : TEAM_IMPORT_SAMPLE_ROWS;
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  worksheet["!cols"] = [
    ...(mode === "event"
      ? [{ wch: 12 }, { wch: 26 }, { wch: 24 }, { wch: 44 }, { wch: 18 }]
      : [{ wch: 28 }, { wch: 24 }, { wch: 22 }]),
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Teams");
  XLSX.writeFile(workbook, mode === "pool" ? "team-pool-import-format.xlsx" : "team-import-format.xlsx");
}

function safeFilename(value: string) {
  return value.replace(/[^\w\-]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "") || "teams-pool";
}

export function exportPoolTeamsToExcel(
  teams: PoolTeam[],
  options: { filename?: string; getLastEventLabel?: (team: PoolTeam) => string } = {},
) {
  const headers = [
    "Team Name",
    "Tags",
    "Mobile Number",
    "Matches Played",
    "Last Event",
    "Added From",
    "Added At",
  ];
  const rows = teams.map((team) => [
    team.name,
    team.tags.join(", "),
    team.contactMobile,
    team.matchesPlayed,
    options.getLastEventLabel?.(team) ?? "",
    team.addedFrom.label,
    team.addedAt ? new Date(team.addedAt).toLocaleString() : "",
  ]);
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  worksheet["!cols"] = [
    { wch: 30 },
    { wch: 28 },
    { wch: 22 },
    { wch: 16 },
    { wch: 30 },
    { wch: 22 },
    { wch: 24 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Teams Pool");
  XLSX.writeFile(workbook, `${safeFilename(options.filename || "teams-pool")}.xlsx`);
}
