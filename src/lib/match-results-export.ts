import type { ResultEntry, TeamData } from "@/components/dashboard/AddResultModal";
import {
  buildMatchResultRows,
  type EventScoringRules,
  DEFAULT_MATCH_SCORING,
} from "@/lib/match-scoring";

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function safeFilename(name: string) {
  return name.replace(/[^\w\-]+/g, "_").replace(/_+/g, "_");
}

export function exportMatchResultsToExcel(
  match: { name: string },
  results: ResultEntry[],
  teams: TeamData[],
  scoring: EventScoringRules = DEFAULT_MATCH_SCORING,
) {
  const rows = buildMatchResultRows(results, teams, scoring);
  const header = [
    "Rank",
    "Team name",
    "Position",
    "Placement points",
    "Kill points",
    "Total points",
  ];
  const data = rows.map((row) => [
    String(row.rank),
    row.teamName,
    typeof row.position === "number" ? String(row.position) : "-",
    String(row.placementPoints),
    String(row.killPoints),
    String(row.totalPoints),
  ]);

  const csv = [header, ...data]
    .map((cells) => cells.map((cell) => escapeCsv(cell)).join(","))
    .join("\n");

  const blob = new Blob([`\uFEFF${csv}`], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });

  downloadBlob(blob, `${safeFilename(match.name)}-results.xls`);
}

export async function exportMatchResultsToImage(
  element: HTMLElement,
  match: { name: string },
) {
  const { toPng } = await import("html-to-image");
  const dataUrl = await toPng(element, {
    backgroundColor: "#ffffff",
    pixelRatio: 2,
    cacheBust: true,
  });

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `${safeFilename(match.name)}-results.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function exportMatchResultsPlainImage(
  match: { name: string; map?: string },
  results: ResultEntry[],
  teams: TeamData[],
  scoring: EventScoringRules = DEFAULT_MATCH_SCORING,
) {
  const { toPng } = await import("html-to-image");
  const rows = buildMatchResultRows(results, teams, scoring);
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement("div");
  canvas.style.position = "absolute";
  canvas.style.left = "0";
  canvas.style.top = "0";
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.style.background = "#ffffff";
  canvas.style.padding = "72px";
  canvas.style.boxSizing = "border-box";
  canvas.style.fontFamily = "Plus Jakarta Sans, Arial, sans-serif";
  canvas.style.color = "#000000";
  canvas.style.zIndex = "-1";
  canvas.style.pointerEvents = "none";

  const safe = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char] || char);

  canvas.innerHTML = `
    <div style="height:100%; display:flex; flex-direction:column;">
      <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:24px; margin-bottom:36px;">
        <div>
          <div style="font-size:22px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#666;">Match Results</div>
          <div style="font-size:54px; font-weight:800; line-height:1.05; margin-top:8px;">${safe(match.name)}</div>
        </div>
        <div style="font-size:24px; font-weight:700; color:#111; text-align:right;">${safe(match.map || "")}</div>
      </div>
      <div style="overflow:hidden; border:1px solid #e2e5ec; border-radius:14px;">
        <table style="width:100%; border-collapse:collapse; table-layout:fixed; font-size:24px;">
          <thead>
            <tr style="height:62px; background:#000; color:#fff;">
              <th style="width:10%; text-align:center;">#</th>
              <th style="width:34%; text-align:left; padding:0 18px;">Team</th>
              <th style="width:14%; text-align:center;">Pos</th>
              <th style="width:16%; text-align:center;">Place Pts</th>
              <th style="width:14%; text-align:center;">Kill Pts</th>
              <th style="width:12%; text-align:center;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row, index) => `
                  <tr style="height:58px; background:${index % 2 ? "#f7f8fb" : "#ffffff"};">
                    <td style="text-align:center; font-weight:800; border-top:1px solid #e2e5ec;">${safe(row.rank)}</td>
                    <td style="padding:0 18px; font-weight:800; text-transform:uppercase; border-top:1px solid #e2e5ec; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${safe(row.teamName)}</td>
                    <td style="text-align:center; font-weight:700; border-top:1px solid #e2e5ec;">${safe(row.position || "-")}</td>
                    <td style="text-align:center; font-weight:700; border-top:1px solid #e2e5ec;">${safe(row.placementPoints)}</td>
                    <td style="text-align:center; font-weight:700; border-top:1px solid #e2e5ec;">${safe(row.killPoints)}</td>
                    <td style="text-align:center; font-weight:900; border-top:1px solid #e2e5ec;">${safe(row.totalPoints)}</td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
      <div style="margin-top:auto; display:flex; justify-content:space-between; align-items:center; border-top:1px solid #e2e5ec; padding-top:24px; color:#666; font-size:20px; font-weight:700;">
        <span>Exported from Esportific</span>
        <span>${rows.length} teams</span>
      </div>
    </div>
  `;

  document.body.appendChild(canvas);
  try {
    if ("fonts" in document) {
      await document.fonts.ready.catch(() => undefined);
    }
    const dataUrl = await toPng(canvas, {
      backgroundColor: "#ffffff",
      width,
      height,
      pixelRatio: 2,
      cacheBust: true,
      style: {
        margin: "0",
        transform: "none",
      },
    });

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${safeFilename(match.name)}-results.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    canvas.remove();
  }
}

export { buildMatchResultRows };
