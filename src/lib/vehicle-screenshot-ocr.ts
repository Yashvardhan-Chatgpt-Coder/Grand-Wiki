import { createWorker, PSM, type Worker } from "tesseract.js";

export type VehicleIdentifierType = "plate" | "vehicle_name";

export type VehicleOcrProgress = {
  stage: "prepare" | "ocr" | "parse" | "done" | "error";
  percent: number;
  message: string;
};

export type VehicleExtractResult = {
  ownerName: string;
  identifier: string;
  identifierType: VehicleIdentifierType;
  plateRaw: string | null;
  vehicleName: string | null;
  familyName: string | null;
  warnings: string[];
};

type BBox = { x0: number; y0: number; x1: number; y1: number };

type OcrWord = {
  text: string;
  conf: number;
  bbox: BBox;
};

type WhiteBadge = {
  x: number;
  y: number;
  w: number;
  h: number;
  score: number;
};

/* ── Known UI labels ─────────────────────────────────────────────── */

const RIGHT_FENCE_LABELS = new Set([
  "FAMILY",
  "TEAM",
  "TUNER",
  "TANK",
  "CAPACITY",
  "INSURANCE",
  "TAXI",
  "TAX",
  "LICENSE",
  "LICENCE",
  "PRO",
  "LEASE",
  "REMAINING",
  "STATE",
  "VALUE",
  "ANTI",
  "RADAR",
  "ANTIRADAR",
]);

const LABEL_WORDS = new Set([
  "OWNER",
  "FAMILY",
  "TEAM",
  "TUNER",
  "TANK",
  "CAPACITY",
  "INSURANCE",
  "TAXI",
  "TAX",
  "LICENSE",
  "LICENCE",
  "LEASE",
  "REMAINING",
  "STATE",
  "VALUE",
  "ANTI",
  "RADAR",
  "CLOSE",
  "ESC",
  "OF",
  "THE",
  "VEHICLE",
  "ENGINE",
  "PRO",
  "BRAKES",
  "SUSPENSION",
  "TRANSMISSION",
  "TYRES",
  "TIRES",
  "STOCK",
  "LEVEL",
  "SPEED",
  "INSTALL",
  "PART",
  "ANTI-RADAR",
  "ANTIRADAL",
]);

const STOP_AFTER_OWNER =
  /\b(FAMILY|TEAM|TUNER|TANK|CAPACITY|INSURANCE|TAXI|TAX|LICENSE|LICENCE|LEASE|REMAINING|STATE|VALUE|ANTI[- ]?RADAR|CLOSE|ENGINE|BRAKES|PRO)\b/i;

/* ── Tesseract worker singleton ──────────────────────────────────── */

let workerPromise: Promise<Worker> | null = null;
let activeProgress: ((p: VehicleOcrProgress) => void) | null = null;

function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker("eng", 1, {
        logger: (message) => {
          if (!activeProgress) return;
          if (message.status === "recognizing text") {
            const pct = 30 + Math.round((message.progress || 0) * 45);
            activeProgress({
              stage: "ocr",
              percent: Math.min(82, pct),
              message: "Reading text from screenshot…",
            });
          } else if (message.status?.includes("loading")) {
            activeProgress({
              stage: "ocr",
              percent: 24,
              message: "Loading OCR engine…",
            });
          }
        },
      });
      return worker;
    })();
  }
  return workerPromise;
}

/* ── String helpers ──────────────────────────────────────────────── */

function normalizeToken(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function normalizeKey(text: string) {
  return normalizeToken(text)
    .toUpperCase()
    .replace(/[^A-Z0-9/]/g, "");
}

function isNaText(text: string) {
  const key = normalizeKey(text).replace(/\\/g, "/");
  if (!key) return false;
  if (key === "NA" || key === "N/A" || key === "NIA") return true;
  if (/^N\s*\/\s*A$/i.test(normalizeToken(text))) return true;
  return false;
}

function isLikelyNaOcrJunk(text: string) {
  const compact = normalizeToken(text)
    .toUpperCase()
    .replace(/\s+/g, "");
  if (!compact) return false;
  if (isNaText(compact)) return true;
  return (
    compact === "/" ||
    compact === "\\" ||
    compact === "N/" ||
    compact === "/A" ||
    compact === "N" ||
    compact === "A" ||
    compact === "N\\" ||
    compact === "\\A" ||
    compact === "NIA" ||
    compact === "-" ||
    compact === "—"
  );
}

function looksLikePlateToken(text: string) {
  const key = normalizeKey(text).replace(/\//g, "");
  if (isNaText(text)) return false;
  if (key.length < 5 || key.length > 8) return false;
  if (!/^[A-Z0-9]+$/.test(key)) return false;
  if (!/\d/.test(key)) return false;
  if (LABEL_WORDS.has(key)) return false;
  return true;
}

/**
 * Plate fonts often give "1" a top tick/serif, so Tesseract reads it as "T".
 * Same for I↔1. Only fix the leading character — safer for real plates.
 */
function correctPlateConfusions(plate: string): string {
  let p = plate.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!p) return p;

  // Leading serifed 1 → T or I
  if ((p.startsWith("T") || p.startsWith("I")) && /\d/.test(p.slice(1))) {
    p = `1${p.slice(1)}`;
  }

  return p;
}

function scorePlateCandidate(plate: string): number {
  let score = 0;
  // If it starts with a digit, it's very likely a plate
  if (/^\d/.test(plate)) score += 60;
  // Penalize leading T or I followed by digit (likely misread 1)
  if (/^[TI]/.test(plate) && /\d/.test(plate)) score -= 25;
  
  // Just require at least one digit. Don't multiply by digit count,
  // otherwise hallucinated all-digit misreads (3200750) will outscore 
  // correct alphanumeric plates (3ZLD759).
  if (/\d/.test(plate)) {
    score += 20;
  }
  
  // Break ties with length
  score += Math.min(plate.length, 8);
  return score;
}

function isOwnerLabel(text: string) {
  const key = normalizeKey(text);
  if (key === "OWNER" || key === "OWNER:") return true;
  if (/^OWN[E8]?R:?$/i.test(key)) return true;
  if (/^0WNER:?$/i.test(key)) return true;
  if (/^OWNFR:?$/i.test(key)) return true;
  if (/^OWNE[R8]:?$/i.test(key)) return true;
  // Common OCR misreads of "OWNER"
  if (/^[O0]WN[E3B8]?[R8]:?$/i.test(key)) return true;
  return false;
}

function isFenceLabel(text: string) {
  const key = normalizeKey(text);
  if (RIGHT_FENCE_LABELS.has(key)) return true;
  if (key.startsWith("FAMILY") || key.startsWith("TEAM")) return true;
  if (key.startsWith("TANK") || key.startsWith("INSUR")) return true;
  return false;
}

/* ── Canvas / image helpers ──────────────────────────────────────── */

function loadImage(source: Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = typeof source === "string" ? source : URL.createObjectURL(source);
  });
}

function makeScaledCanvas(img: HTMLImageElement, maxWidth = 1920) {
  const scale = Math.min(1, maxWidth / img.width);
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas unsupported in this browser");
  ctx.drawImage(img, 0, 0, width, height);
  return { canvas, ctx, scale };
}

function cropCanvas(
  source: HTMLCanvasElement,
  rect: { x: number; y: number; w: number; h: number },
  pad = 0
) {
  const x = Math.max(0, Math.floor(rect.x - pad));
  const y = Math.max(0, Math.floor(rect.y - pad));
  const w = Math.min(source.width - x, Math.ceil(rect.w + pad * 2));
  const h = Math.min(source.height - y, Math.ceil(rect.h + pad * 2));
  const out = document.createElement("canvas");
  out.width = Math.max(1, w);
  out.height = Math.max(1, h);
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");
  ctx.drawImage(source, x, y, w, h, 0, 0, w, h);
  return { canvas: out, origin: { x, y } };
}

function upscaleCanvas(source: HTMLCanvasElement, factor: number) {
  if (factor <= 1) return source;
  const out = document.createElement("canvas");
  out.width = Math.round(source.width * factor);
  out.height = Math.round(source.height * factor);
  const ctx = out.getContext("2d");
  if (!ctx) return source;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, out.width, out.height);
  return out;
}

/* ── Image preprocessing ─────────────────────────────────────────── */

/**
 * Preprocessing for the white plate badge:
 * Dark text on white/light background. Use standard grayscale rather than harsh binarization
 * so Tesseract's internal Otsu algorithm can preserve subtle serifs/curves (like distinguishing 3 from S).
 */
function preprocessBadge(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    // Gentle contrast stretch instead of harsh threshold
    let out = (gray - 20) * 1.3;
    out = Math.min(255, Math.max(0, out));
    data[i] = out;
    data[i + 1] = out;
    data[i + 2] = out;
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Preprocessing for the vehicle title (large white/bold text on dark background).
 * Invert so it becomes dark text on white → standard OCR expectation.
 */
function preprocessTitle(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    // Invert: white text → black on white background
    const inv = 255 - gray;
    const out = inv > 125 ? 255 : inv < 65 ? 0 : inv;
    data[i] = out;
    data[i + 1] = out;
    data[i + 2] = out;
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Preprocessing for the stats/owner row (light/white text on dark semi-transparent background).
 * This is the KEY fix: the original code used an inappropriate threshold that destroyed text.
 *
 * The text in this region is light gray/white on a dark translucent overlay.
 * Strategy: invert, then use an adaptive threshold that preserves the text.
 */
function preprocessOwnerRegion(canvas: HTMLCanvasElement, variant: "soft" | "hard" | "adaptive") {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const w = canvas.width;
  const h = canvas.height;

  if (variant === "adaptive") {
    // Compute local mean brightness for adaptive thresholding
    const gray = new Float32Array(w * h);
    for (let i = 0; i < data.length; i += 4) {
      gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    // Integral image for fast local mean
    const integral = new Float64Array(w * h);
    for (let y = 0; y < h; y++) {
      let rowSum = 0;
      for (let x = 0; x < w; x++) {
        rowSum += gray[y * w + x];
        integral[y * w + x] = rowSum + (y > 0 ? integral[(y - 1) * w + x] : 0);
      }
    }

    const radius = Math.max(8, Math.floor(Math.min(w, h) * 0.08));
    const C = 12; // bias constant

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const x0 = Math.max(0, x - radius);
        const y0 = Math.max(0, y - radius);
        const x1 = Math.min(w - 1, x + radius);
        const y1 = Math.min(h - 1, y + radius);
        const count = (x1 - x0 + 1) * (y1 - y0 + 1);

        let sum = integral[y1 * w + x1];
        if (x0 > 0) sum -= integral[y1 * w + (x0 - 1)];
        if (y0 > 0) sum -= integral[(y0 - 1) * w + x1];
        if (x0 > 0 && y0 > 0) sum += integral[(y0 - 1) * w + (x0 - 1)];

        const localMean = sum / count;
        const pixel = gray[y * w + x];
        const idx = (y * w + x) * 4;

        // Text is BRIGHT on dark — pixel > localMean means it's text
        const out = pixel > localMean + C ? 0 : 255; // black text on white bg
        data[idx] = out;
        data[idx + 1] = out;
        data[idx + 2] = out;
      }
    }
  } else {
    // Simple global inversion + threshold
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      let out: number;
      if (variant === "soft") {
        // Invert, mild threshold — preserves more detail
        const inv = 255 - gray;
        out = inv > 110 ? 255 : inv < 40 ? 0 : Math.round(inv * 1.8);
        out = Math.min(255, out);
      } else {
        // Invert, hard binary threshold
        const inv = 255 - gray;
        out = inv > 90 ? 0 : 255;
        // Wait — the text is light/white, so after inversion it becomes dark.
        // We want: bright pixel → text → make it BLACK (0) on WHITE (255) background
        out = gray > 140 ? 0 : 255;
      }
      data[i] = out;
      data[i + 1] = out;
      data[i + 2] = out;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/* ── OCR helpers ─────────────────────────────────────────────────── */

function collectWordsFromPage(page: {
  text: string;
  blocks?: Array<{
    paragraphs?: Array<{
      lines?: Array<{
        words?: Array<{ text: string; confidence: number; bbox: BBox }>;
      }>;
    }>;
  }> | null;
  words?: Array<{ text: string; confidence: number; bbox: BBox }>;
}): { words: OcrWord[]; text: string } {
  const words: OcrWord[] = [];

  const pushWord = (text: string, conf: number, bbox: BBox) => {
    const cleaned = normalizeToken(text.replace(/[|]/g, "I"));
    if (!cleaned) return;
    if (conf < 15) return;
    words.push({ text: cleaned, conf, bbox });
  };

  if (page.words?.length) {
    for (const w of page.words) pushWord(w.text, w.confidence, w.bbox);
  } else {
    for (const block of page.blocks ?? []) {
      for (const paragraph of block.paragraphs ?? []) {
        for (const line of paragraph.lines ?? []) {
          for (const w of line.words ?? []) {
            pushWord(w.text, w.confidence, w.bbox);
          }
        }
      }
    }
  }

  return { words, text: page.text || "" };
}

async function ocrCanvas(
  canvas: HTMLCanvasElement,
  psm: (typeof PSM)[keyof typeof PSM],
  whitelist?: string
) {
  const worker = await getWorker();
  await worker.setParameters({
    tessedit_pageseg_mode: psm,
    preserve_interword_spaces: "1",
    ...(whitelist
      ? { tessedit_char_whitelist: whitelist }
      : { tessedit_char_whitelist: "" }),
  });
  const result = await worker.recognize(canvas, undefined, {
    text: true,
    blocks: true,
  });
  return collectWordsFromPage(result.data as Parameters<typeof collectWordsFromPage>[0]);
}

function midY(word: OcrWord) {
  return (word.bbox.y0 + word.bbox.y1) / 2;
}

function wordHeight(word: OcrWord) {
  return Math.max(1, word.bbox.y1 - word.bbox.y0);
}

/* ── Plate interpretation ────────────────────────────────────────── */

function cleanPlateOcrText(text: string): { kind: "plate" | "na" | "unknown"; value: string } {
  const compact = normalizeToken(text).toUpperCase();
  if (!compact) return { kind: "unknown", value: "" };

  const explicitNa = normalizeKey(compact).replace(/\\/g, "/");
  if (
    explicitNa === "NA" ||
    explicitNa === "N/A" ||
    explicitNa === "NIA" ||
    /^N\s*\/\s*A$/.test(compact)
  ) {
    return { kind: "na", value: "N/A" };
  }

  const tokens = compact.split(/[^A-Z0-9]+/).filter(Boolean);
  for (const token of tokens) {
    const key = normalizeKey(token).replace(/\//g, "");
    if (key === "NA" || key === "N/A") return { kind: "na", value: "N/A" };
    const corrected = correctPlateConfusions(key);
    if (looksLikePlateToken(corrected) || looksLikePlateToken(key)) {
      const best = [corrected, key]
        .filter((p) => looksLikePlateToken(p))
        .sort((a, b) => scorePlateCandidate(b) - scorePlateCandidate(a))[0];
      return { kind: "plate", value: best };
    }
  }

  // Sometimes OCR inserts spaces: "1 HKP 461"
  const joined = correctPlateConfusions(compact.replace(/[^A-Z0-9]/g, ""));
  if (looksLikePlateToken(joined)) {
    return { kind: "plate", value: joined };
  }

  return { kind: "unknown", value: joined || compact };
}

function pickBestPlateInterpretation(
  ...texts: string[]
): { kind: "plate" | "na" | "unknown"; value: string } {
  const plates: string[] = [];
  let na: { kind: "na"; value: string } | null = null;
  let unknown: { kind: "unknown"; value: string } | null = null;

  for (const text of texts) {
    const result = cleanPlateOcrText(text);
    if (result.kind === "plate") {
      plates.push(result.value);
      plates.push(correctPlateConfusions(result.value));
      continue;
    }
    if (result.kind === "na" && !na) na = result as { kind: "na"; value: string };
    if (result.kind === "unknown" && result.value && !unknown) unknown = result as { kind: "unknown"; value: string };
  }

  const uniquePlates = [...new Set(plates.filter((p) => looksLikePlateToken(p)))];
  if (uniquePlates.length) {
    uniquePlates.sort((a, b) => scorePlateCandidate(b) - scorePlateCandidate(a));
    return { kind: "plate", value: uniquePlates[0] };
  }

  if (na) return na;
  return unknown ?? { kind: "unknown", value: "" };
}

/* ── White badge detection ───────────────────────────────────────── */

function findWhitePlateBadge(canvas: HTMLCanvasElement): WhiteBadge | null {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  const w = canvas.width;
  const h = canvas.height;
  const scanTop = Math.floor(h * 0.01);
  const scanBottom = Math.floor(h * 0.20);
  const scanH = scanBottom - scanTop;
  const imageData = ctx.getImageData(0, scanTop, w, scanH);
  const data = imageData.data;

  const step = Math.max(2, Math.floor(w / 800));
  const cols = Math.ceil(w / step);
  const rows = Math.ceil(scanH / step);
  const bright = new Uint8Array(cols * rows);

  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const px = Math.min(w - 1, gx * step);
      const py = Math.min(scanH - 1, gy * step);
      const idx = (py * w + px) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      // White badge: high brightness, low saturation
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const saturation = maxC > 0 ? (maxC - minC) / maxC : 0;
      bright[gy * cols + gx] = gray >= 195 && saturation < 0.25 ? 1 : 0;
    }
  }

  const visited = new Uint8Array(cols * rows);
  let best: WhiteBadge | null = null;
  const neighbors = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const start = gy * cols + gx;
      if (!bright[start] || visited[start]) continue;

      let minX = gx;
      let maxX = gx;
      let minY = gy;
      let maxY = gy;
      let count = 0;
      const stack = [start];
      visited[start] = 1;

      while (stack.length) {
        const cur = stack.pop()!;
        const cx = cur % cols;
        const cy = (cur / cols) | 0;
        count += 1;
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);

        for (const [dx, dy] of neighbors) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          const ni = ny * cols + nx;
          if (!bright[ni] || visited[ni]) continue;
          visited[ni] = 1;
          stack.push(ni);
        }
      }

      const bw = (maxX - minX + 1) * step;
      const bh = (maxY - minY + 1) * step;
      const area = count * step * step;

      if (bw < w * 0.03 || bw > w * 0.3) continue;
      if (bh < h * 0.01 || bh > h * 0.08) continue;
      if (bw / Math.max(bh, 1) < 1.2) continue;
      if (area < bw * bh * 0.3) continue;

      const x = minX * step;
      const y = scanTop + minY * step;
      const centerX = x + bw / 2;
      const positionScore = centerX > w * 0.12 && centerX < w * 0.75 ? 1 : 0.3;
      const score = area * positionScore * (bw / bh);

      if (!best || score > best.score) {
        best = { x, y, w: bw, h: bh, score };
      }
    }
  }

  return best;
}

/* ── Owner extraction (the critical fix) ─────────────────────────── */

/**
 * Extract owner name from the info row below the vehicle title.
 * 
 * Layout analysis from screenshots:
 * - The info row sits at approximately y = 12-18% of image height
 * - "OWNER" label is in small caps, with the value directly below it
 * - The OWNER label/value pair is located at approximately x = 17-28% from left
 * - Values are in slightly larger, lighter-colored text below their labels
 * 
 * Strategy:
 * 1. Crop the info row region
 * 2. Try multiple preprocessing variants (the key to reliability)
 * 3. Parse OCR output to find OWNER label and extract the name below/after it
 */
async function extractOwnerName(
  full: HTMLCanvasElement,
  badge: WhiteBadge | null,
): Promise<string> {
  const w = full.width;
  const h = full.height;

  // The stats row with OWNER sits below the title/badge line
  // In all screenshots it's between ~10% and ~22% of image height
  const statsTop = badge
    ? Math.max(Math.floor(badge.y + badge.h * 0.5), Math.floor(h * 0.09))
    : Math.floor(h * 0.09);
  const statsBottom = Math.floor(h * 0.25);

  const statsRect = {
    x: Math.floor(w * 0.04), // start a bit from the left (skip engine state circle)
    y: statsTop,
    w: Math.floor(w * 0.55), // OWNER + value + some of FAMILY region
    h: Math.max(40, statsBottom - statsTop),
  };

  const { canvas: statsCrop } = cropCanvas(full, statsRect, 4);

  // Try three different preprocessing strategies and pick the best result
  const candidates: string[] = [];

  // Strategy 1: Adaptive thresholding (best for variable backgrounds)
  {
    const big = upscaleCanvas(statsCrop, 3);
    const c1 = cloneCanvas(big);
    preprocessOwnerRegion(c1, "adaptive");
    const result = await ocrCanvas(c1, PSM.SPARSE_TEXT);
    const name = parseOwnerFromText(result.text);
    if (name) candidates.push(name);

    // Also try word-level extraction
    const nameFromWords = parseOwnerFromWords(result.words);
    if (nameFromWords) candidates.push(nameFromWords);
  }

  // Strategy 2: Hard binary threshold (good for high contrast screenshots)
  {
    const big = upscaleCanvas(statsCrop, 3);
    const c2 = cloneCanvas(big);
    preprocessOwnerRegion(c2, "hard");
    const result = await ocrCanvas(c2, PSM.SPARSE_TEXT);
    const name = parseOwnerFromText(result.text);
    if (name) candidates.push(name);
  }

  // Strategy 3: Soft inversion (preserves more detail)
  {
    const big = upscaleCanvas(statsCrop, 3);
    const c3 = cloneCanvas(big);
    preprocessOwnerRegion(c3, "soft");
    const result = await ocrCanvas(c3, PSM.SPARSE_TEXT);
    const name = parseOwnerFromText(result.text);
    if (name) candidates.push(name);
  }

  // If no candidates yet, try a wider crop with PSM.AUTO
  if (!candidates.length) {
    const wideRect = {
      x: 0,
      y: statsTop,
      w: Math.floor(w * 0.75),
      h: Math.max(50, statsBottom - statsTop + Math.floor(h * 0.04)),
    };
    const { canvas: wideCrop } = cropCanvas(full, wideRect, 4);
    const big = upscaleCanvas(wideCrop, 2.5);
    const c = cloneCanvas(big);
    preprocessOwnerRegion(c, "adaptive");
    const result = await ocrCanvas(c, PSM.AUTO);
    const name = parseOwnerFromText(result.text);
    if (name) candidates.push(name);

    const nameFromWords = parseOwnerFromWords(result.words);
    if (nameFromWords) candidates.push(nameFromWords);
  }

  // Pick the best candidate (longest plausible name)
  if (!candidates.length) return "";

  return pickBestOwnerCandidate(candidates);
}

function cloneCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = source.width;
  out.height = source.height;
  const ctx = out.getContext("2d");
  if (!ctx) return source;
  ctx.drawImage(source, 0, 0);
  return out;
}

/**
 * Parse owner name from OCR plain text output.
 * Looks for "OWNER" label followed by the name.
 */
function parseOwnerFromText(text: string): string {
  const cleaned = text.replace(/\r/g, "\n");

  // Pattern 1: "OWNER" on same line as name with other labels after
  // e.g., "OWNER FAMILY TANK CAPACITY INSURANCE..."
  // with values on next line: "Obed Sablosky Dark Horizon 70 liters..."
  // OR: "OWNER Obed Sablosky FAMILY ..."

  // Try inline: OWNER followed directly by name before next label
  const inline = cleaned.match(
    /(?:OWNER|OWNFR|0WNER|OWN[E8]R)\s*[:\-–]?\s*([A-Za-z][A-Za-z0-9 .''\-]{1,48}?)(?=\s*(?:FAMILY|TEAM|TUNER|TANK|CAPACITY|INSURANCE|TAXI|TAX|STATE|REMAINING|ANTI|PRO|$|\n))/i
  );
  if (inline?.[1]) {
    const name = cleanOwnerName(inline[1]);
    if (name) return name;
  }

  // Pattern 2: labels on one line, values on next line
  // Find OWNER in a line of labels, then find the corresponding value below
  const lines = cleaned
    .split(/\n+/)
    .map((l) => normalizeToken(l))
    .filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/\bOWNER\b/i.test(line) && !isOwnerLabel(line.split(/\s+/)[0] || "")) continue;

    // Check if the owner name is on the same line after "OWNER"
    const afterOwner = line.replace(/^.*?\b(?:OWNER|OWNFR|0WNER|OWN[E8]R)\b\s*[:\-–]?\s*/i, "");
    if (afterOwner && afterOwner !== line) {
      // The rest of the line might be "FAMILY TANK CAPACITY..." (all labels)
      // or it might be "John Wayde FAMILY La Cosa Nostra..." (name + labels)
      const beforeNextLabel = afterOwner.split(STOP_AFTER_OWNER)[0].trim();
      if (beforeNextLabel && /[a-z]/i.test(beforeNextLabel)) {
        const name = cleanOwnerName(beforeNextLabel);
        if (name) return name;
      }
    }

    // Check next line for the value
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      // The next line typically has all values: "Obed Sablosky Dark Horizon 70 liters N/A N/A $120 000"
      // We need to extract just the owner name portion

      // If the current line has multiple labels, find OWNER's position
      const ownerMatch = line.match(/\bOWNER\b/i);
      if (ownerMatch) {
        // Simple heuristic: take the first 1-3 words that look like a name
        const nameCandidate = extractNameFromValueLine(nextLine);
        if (nameCandidate) return nameCandidate;
      }
    }
  }

  return "";
}

/**
 * Extract a person's name from a value line.
 * Values line looks like: "Obed Sablosky Dark Horizon 70 liters N/A N/A $120 000"
 * or: "Sulii Dadaa Dark Horizon 90 liters N/A N/A $100 000"
 * or: "John Wayde La Cosa Nostra 83 liters 26 days N/A $7 000 000"
 * 
 * Strategy: take leading words that look like name parts (capitalized, alphabetic),
 * stop when we hit a number, N/A, dollar sign, or a known non-name pattern.
 */
function extractNameFromValueLine(line: string): string {
  const tokens = normalizeToken(line).split(/\s+/);
  const nameTokens: string[] = [];

  for (const token of tokens) {
    const clean = token.replace(/[,.:;'"]/g, "");
    // Stop at numbers, currency, N/A, or known label-like words
    if (/^\d/.test(clean)) break;
    if (/^\$/.test(token)) break;
    if (isNaText(clean)) break;
    if (/^N\/A$/i.test(clean)) break;
    if (/^\d+$/.test(clean)) break;
    // Stop at words that are clearly values, not names
    if (/^(liters?|litres?|days?|hours?)$/i.test(clean)) break;
    // Stop at ALL-CAPS words when we already have name tokens
    // (ALEMDAR, HORIZON etc. are family/team values, not owner names)
    if (nameTokens.length >= 1 && /^[A-Z]{3,}$/.test(clean)) break;

    // Check if this looks like a name token (starts with letter)
    if (/^[A-Za-z]/.test(clean) && clean.length >= 2) {
      // Owner names are typically 2 words (first + last).
      // Stop at 2 words if both look like proper names.
      if (nameTokens.length >= 2) {
        break; // Two-word name is enough — anything after is family/team
      }
      nameTokens.push(clean);
    } else {
      break;
    }
  }

  return nameTokens.length >= 2 ? nameTokens.join(" ") : nameTokens.length === 1 ? nameTokens[0] : "";
}

/**
 * Parse owner from word-level OCR data with bounding box positions.
 */
function parseOwnerFromWords(words: OcrWord[]): string {
  const ownerIdx = words.findIndex((w) => isOwnerLabel(w.text));
  if (ownerIdx < 0) return "";

  const ownerLabel = words[ownerIdx];
  const labelH = wordHeight(ownerLabel);

  // Find the right fence (FAMILY, TEAM, TANK, etc.)
  const rightFence =
    words
      .filter(
        (w) =>
          isFenceLabel(w.text) &&
          w.bbox.x0 > ownerLabel.bbox.x0 + 8 &&
          Math.abs(midY(w) - midY(ownerLabel)) < labelH * 3
      )
      .sort((a, b) => a.bbox.x0 - b.bbox.x0)[0] ?? null;

  // Look for value words BELOW the OWNER label.
  // Use the OWNER label's x-span as a column guide — the owner value sits
  // roughly in the same horizontal column. Use the right fence (FAMILY label)
  // x-position as the hard right boundary so the family VALUE doesn't leak in.
  const ownerColWidth = ownerLabel.bbox.x1 - ownerLabel.bbox.x0;
  const top = ownerLabel.bbox.y1 - labelH * 0.2;
  const bottom = ownerLabel.bbox.y1 + labelH * 6;
  const left = ownerLabel.bbox.x0 - labelH * 1.5;
  // Right boundary: if we found a fence label, stop well before its x-start.
  // The fence LABEL sits above the fence VALUE, so the fence value is roughly
  // at the same x as the fence label. We subtract a generous margin.
  const right = rightFence
    ? rightFence.bbox.x0 - labelH * 0.5
    : ownerLabel.bbox.x0 + Math.max(ownerColWidth * 6, labelH * 12);

  const below = words
    .filter((w) => {
      const y = midY(w);
      if (y < top || y > bottom) return false;
      if (w.bbox.x1 < left || w.bbox.x0 > right) return false;
      if (y <= midY(ownerLabel) + labelH * 0.3) return false;
      const key = normalizeKey(w.text);
      if (LABEL_WORDS.has(key) || isOwnerLabel(w.text) || isFenceLabel(w.text)) return false;
      if (isNaText(w.text)) return false;
      if (/^\d+$/.test(w.text.replace(/[^A-Za-z0-9]/g, ""))) return false;
      return /[A-Za-z]/.test(w.text);
    })
    // Sort by Y first to find the top-most line of text below OWNER
    .sort((a, b) => midY(a) - midY(b));

  if (!below.length) return "";

  // Keep only the first value line (by y proximity)
  const firstY = midY(below[0]);
  const firstLine = below.filter((w) => Math.abs(midY(w) - firstY) < labelH * 1.5);
  
  // Now sort the words in that line by X to read left-to-right
  firstLine.sort((a, b) => a.bbox.x0 - b.bbox.x0);
  
  const name = normalizeToken(firstLine.map((w) => w.text).join(" "));
  return cleanOwnerName(name);
}

function cleanOwnerName(raw: string): string {
  let name = normalizeToken(raw);
  name = name
    .replace(/\bN\/A\b/gi, "")
    .replace(STOP_AFTER_OWNER, "")
    .replace(/\b\d+\s*(liters?|litres?|days?|hours?)\b/gi, "")
    .replace(/\$[\d\s,.]+/g, "")
    .replace(/\b\d{2,}\b/g, "")
    .trim();
  name = normalizeToken(name);

  if (!name || !(/[A-Za-z]/.test(name))) return "";
  if (LABEL_WORDS.has(normalizeKey(name))) return "";
  if (isNaText(name)) return "";
  if (name.length < 2) return "";

  return name;
}

function pickBestOwnerCandidate(candidates: string[]): string {
  // Filter valid candidates
  const valid = candidates
    .map((c) => cleanOwnerName(c))
    .filter((c) => c.length >= 2 && /[A-Za-z]/.test(c));

  if (!valid.length) return "";

  // Prefer candidates with exactly 2 words (first + last name)
  const multiWord = valid.filter((c) => c.includes(" "));
  if (multiWord.length) {
    // Pick the one that looks most like a 2-word person name
    const scored = multiWord.map((name) => {
      let score = 0;
      const words = name.split(" ");
      // Strongly prefer exactly 2 words (first + last name)
      score += words.length === 2 ? 80 : words.length === 3 ? 30 : 0;
      // Penalize candidates with more than 3 words (likely includes family/other data)
      if (words.length > 3) score -= 50;
      // Bonus for each Title Case word (typical name format)
      for (const w of words) {
        if (/^[A-Z][a-z]+$/.test(w)) score += 25;
        // ALL-CAPS words are suspicious — could be family/team names leaking in
        if (/^[A-Z]{3,}$/.test(w)) score -= 15;
      }
      score += Math.min(name.length, 25);
      return { name, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored[0].name;
  }

  // Single word — return the longest
  valid.sort((a, b) => b.length - a.length);
  return valid[0];
}

/* ── Vehicle name extraction ─────────────────────────────────────── */

async function extractVehicleNameLeftOfBadge(
  full: HTMLCanvasElement,
  badge: WhiteBadge
): Promise<string> {
  const padY = Math.round(badge.h * 0.85);
  // Stop further from the badge edge to avoid picking up badge border artifacts
  // that OCR reads as "I" or "l" or "|"
  const rightMargin = Math.max(12, Math.round(badge.w * 0.12));
  const titleRect = {
    x: Math.floor(full.width * 0.01),
    y: Math.max(0, Math.floor(badge.y - padY)),
    w: Math.max(40, Math.floor(badge.x - full.width * 0.01 - rightMargin)),
    h: Math.min(full.height, Math.ceil(badge.h + padY * 2)),
  };

  if (titleRect.w < 30) return "";

  const { canvas: titleCrop } = cropCanvas(full, titleRect, 2);
  const titleBig = upscaleCanvas(titleCrop, 2.5);
  preprocessTitle(titleBig);

  const sparse = await ocrCanvas(titleBig, PSM.SPARSE_TEXT);
  const line = await ocrCanvas(titleBig, PSM.SINGLE_LINE);

  const candidates = [sparse.text, line.text, sparse.words.map((w) => w.text).join(" ")];

  let best = "";
  for (const raw of candidates) {
    let text = normalizeToken(raw);
    text = text
      .replace(/\bN\s*\/?\s*A\b/gi, "")
      .replace(/\bCLOSE\b.*$/gi, "")
      .replace(/\bESC\b.*$/gi, "")
      .replace(/[|/\\]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    text = text.replace(/[^A-Za-z0-9() \-]+$/g, "").trim();

    // Strip trailing single characters that are OCR artifacts from badge edge
    // Common: "I", "l", "1", "|", "i"
    text = text.replace(/\s+[Il1|i]$/g, "").trim();

    if (text.length > best.length && /[A-Za-z]/.test(text)) {
      best = text;
    }
  }

  return best;
}

function extractFamilyOrTeam(text: string) {
  const m = text.match(
    /(?:FAMILY|TEAM)\s*[:\-–]?\s*([A-Za-z][A-Za-z0-9 .''\-]{1,48}?)(?=\s*(?:TANK|CAPACITY|INSURANCE|TAXI|TAX|STATE|REMAINING|PRO|$))/i
  );
  return m?.[1] ? normalizeToken(m[1]) : null;
}

/* ── Main extraction pipeline ────────────────────────────────────── */

async function extractVehicleFromPrepared(
  full: HTMLCanvasElement,
  onProgress?: (p: VehicleOcrProgress) => void
): Promise<VehicleExtractResult> {
  const warnings: string[] = [];
  const w = full.width;
  const h = full.height;

  onProgress?.({ stage: "prepare", percent: 16, message: "Locating number-plate badge…" });
  const badge = findWhitePlateBadge(full);

  // --- Pass A: OCR the white badge (plate OR N/A) ---
  let plateRaw = "";
  let plateKind: "plate" | "na" | "unknown" = "unknown";

  if (badge) {
    onProgress?.({ stage: "ocr", percent: 25, message: "Reading number-plate badge…" });
    const { canvas: badgeCrop } = cropCanvas(full, badge, Math.round(badge.h * 0.55));
    const badgeBig = upscaleCanvas(badgeCrop, 3.5);

    // Preprocessed version
    const badgeProcessed = cloneCanvas(badgeBig);
    preprocessBadge(badgeProcessed);

    const lineSoft = await ocrCanvas(
      badgeProcessed,
      PSM.SINGLE_LINE,
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\"
    );
    const wordSoft = await ocrCanvas(
      badgeProcessed,
      PSM.SINGLE_WORD,
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\"
    );
    // Raw (unprocessed) pass
    const lineRaw = await ocrCanvas(
      badgeBig,
      PSM.SINGLE_LINE,
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\"
    );

    const badgeTexts = [
      lineSoft.text,
      lineSoft.words.map((x) => x.text).join(""),
      wordSoft.text,
      wordSoft.words.map((x) => x.text).join(""),
      lineRaw.text,
      lineRaw.words.map((x) => x.text).join(""),
    ];

    const interpreted = pickBestPlateInterpretation(...badgeTexts);

    plateKind = interpreted.kind;
    plateRaw = interpreted.value;

    // Fallback: scan wider strip around badge
    if (plateKind === "unknown") {
      const strip = {
        x: Math.max(0, badge.x - badge.w * 0.2),
        y: Math.max(0, badge.y - badge.h * 0.5),
        w: Math.min(w - badge.x + badge.w * 0.4, badge.w * 2.2),
        h: badge.h * 2,
      };
      const { canvas: stripCrop } = cropCanvas(full, strip, 2);
      const stripBig = upscaleCanvas(stripCrop, 2.8);
      preprocessBadge(stripBig);
      const stripOcr = await ocrCanvas(
        stripBig,
        PSM.SPARSE_TEXT,
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\"
      );
      const stripGuess = pickBestPlateInterpretation(
        stripOcr.text,
        stripOcr.words.map((x) => x.text).join(" ")
      );
      if (stripGuess.kind !== "unknown") {
        plateKind = stripGuess.kind;
        plateRaw = stripGuess.value;
      }
    }

    // If still unknown and every read looks like N/A junk
    if (plateKind === "unknown") {
      const joinedBadge = badgeTexts.map((t) => normalizeToken(t)).filter(Boolean).join(" ");
      if (joinedBadge && badgeTexts.every((t) => !t.trim() || isLikelyNaOcrJunk(t))) {
        plateKind = "na";
        plateRaw = "N/A";
      } else if (!joinedBadge) {
        // Empty OCR on white pill — likely N/A
      } else {
        warnings.push("Plate badge found but text was unclear — verify the plate.");
        plateRaw = "";
      }
    } else if (plateKind === "na") {
      plateRaw = "N/A";
    }
  } else {
    warnings.push("White plate badge not found — results may be less accurate.");
  }

  const plateIsMissing = plateKind === "na" || isNaText(plateRaw);

  // --- Pass B: Vehicle name ---
  let vehicleName = "";
  if (plateIsMissing && badge) {
    onProgress?.({ stage: "ocr", percent: 40, message: "Reading vehicle name…" });
    vehicleName = await extractVehicleNameLeftOfBadge(full, badge);
  } else if (plateIsMissing) {
    onProgress?.({ stage: "ocr", percent: 40, message: "Reading vehicle title…" });
    const titleRect = {
      x: 0,
      y: Math.floor(h * 0.01),
      w: Math.floor(w * 0.65),
      h: Math.floor(h * 0.14),
    };
    const { canvas: titleCrop } = cropCanvas(full, titleRect, 2);
    const titleBig = upscaleCanvas(titleCrop, 2.2);
    preprocessTitle(titleBig);
    const titleOcr = await ocrCanvas(titleBig, PSM.SPARSE_TEXT);
    vehicleName = normalizeToken(
      titleOcr.text
        .replace(/\bN\s*\/?\s*A\b/gi, "")
        .replace(/\bCLOSE\b.*$/gi, "")
        .trim()
    );
  } else if (badge) {
    onProgress?.({ stage: "ocr", percent: 40, message: "Reading vehicle title…" });
    vehicleName = await extractVehicleNameLeftOfBadge(full, badge);
  }

  // If badge OCR was unclear, scan title row over the badge for a plate-like token
  if (plateKind === "unknown" && badge) {
    const titleWithBadge = {
      x: 0,
      y: Math.max(0, badge.y - badge.h),
      w: Math.min(w, badge.x + badge.w * 1.8),
      h: badge.h * 3,
    };
    const { canvas: rowCrop, origin } = cropCanvas(full, titleWithBadge, 2);
    const rowBig = upscaleCanvas(rowCrop, 2.2);
    preprocessTitle(rowBig);
    const rowOcr = await ocrCanvas(rowBig, PSM.SPARSE_TEXT);
    const scale = 2.2;
    const rowWords = rowOcr.words.map((word) => ({
      ...word,
      bbox: {
        x0: word.bbox.x0 / scale + origin.x,
        y0: word.bbox.y0 / scale + origin.y,
        x1: word.bbox.x1 / scale + origin.x,
        y1: word.bbox.y1 / scale + origin.y,
      },
    }));
    const plateWord = rowWords
      .filter(
        (word) =>
          looksLikePlateToken(word.text) &&
          word.bbox.x0 >= badge.x - badge.w * 0.3 &&
          word.bbox.x0 <= badge.x + badge.w * 1.2
      )
      .sort((a, b) => b.conf - a.conf)[0];
    if (plateWord) {
      plateKind = "plate";
      plateRaw = normalizeKey(plateWord.text).replace(/\//g, "");
    }
  }

  // After all plate fallbacks: empty white pill with no plate token ⇒ N/A
  if (plateKind === "unknown" && badge) {
    plateKind = "na";
    plateRaw = "N/A";
  }

  // --- Pass C: Owner name (the critical extraction) ---
  onProgress?.({ stage: "ocr", percent: 55, message: "Reading owner name…" });
  let ownerName = await extractOwnerName(full, badge);

  // Fallback: full header scan if targeted extraction failed
  if (!ownerName) {
    onProgress?.({ stage: "ocr", percent: 75, message: "Retrying owner detection…" });
    const headerRect = { x: 0, y: 0, w, h: Math.floor(h * 0.3) };
    const { canvas: headerCrop } = cropCanvas(full, headerRect, 0);
    const headerBig = upscaleCanvas(headerCrop, 2.5);
    const headerProcessed = cloneCanvas(headerBig);
    preprocessOwnerRegion(headerProcessed, "adaptive");
    const headerOcr = await ocrCanvas(headerProcessed, PSM.SPARSE_TEXT);
    ownerName = parseOwnerFromText(headerOcr.text) || parseOwnerFromWords(headerOcr.words);
  }

  // Final cleanup
  if (ownerName) {
    ownerName = cleanOwnerName(ownerName);
  }

  onProgress?.({ stage: "parse", percent: 88, message: "Finalizing results…" });

  // Extract family/team for bonus info
  // Do a quick OCR of the stats row for family text
  let familyName: string | null = null;
  {
    const statsTop2 = badge
      ? Math.max(Math.floor(badge.y + badge.h * 0.5), Math.floor(h * 0.09))
      : Math.floor(h * 0.09);
    const fRect = {
      x: Math.floor(w * 0.2),
      y: statsTop2,
      w: Math.floor(w * 0.5),
      h: Math.floor(h * 0.15),
    };
    const { canvas: fCrop } = cropCanvas(full, fRect, 2);
    const fBig = upscaleCanvas(fCrop, 2.5);
    const fProcessed = cloneCanvas(fBig);
    preprocessOwnerRegion(fProcessed, "adaptive");
    const fOcr = await ocrCanvas(fProcessed, PSM.SPARSE_TEXT);
    familyName = extractFamilyOrTeam(fOcr.text);
  }

  if (!ownerName) {
    warnings.push("Owner name was not detected clearly. You can type it manually.");
  }

  const hasPlate =
    plateKind === "plate" && !!plateRaw && looksLikePlateToken(plateRaw);
  const isExplicitNa = plateKind === "na" || isNaText(plateRaw);

  if (hasPlate) {
    return {
      ownerName: ownerName || "",
      identifier: plateRaw,
      identifierType: "plate",
      plateRaw,
      vehicleName: vehicleName || null,
      familyName,
      warnings,
    };
  }

  if (isExplicitNa) {
    if (!vehicleName && badge) {
      vehicleName = await extractVehicleNameLeftOfBadge(full, badge);
    }
    if (!vehicleName) {
      warnings.push("Plate is N/A but vehicle name could not be read.");
    }
    return {
      ownerName: ownerName || "",
      identifier: vehicleName || "",
      identifierType: "vehicle_name",
      plateRaw: "N/A",
      vehicleName: vehicleName || null,
      familyName,
      warnings,
    };
  }

  warnings.push(
    "Number plate could not be read clearly. Check the screenshot or type it manually."
  );
  if (!vehicleName && badge) {
    vehicleName = await extractVehicleNameLeftOfBadge(full, badge);
  }

  return {
    ownerName: ownerName || "",
    identifier: plateRaw || "",
    identifierType: "plate",
    plateRaw: plateRaw || null,
    vehicleName: vehicleName || null,
    familyName,
    warnings,
  };
}

/* ── Public API ──────────────────────────────────────────────────── */

export async function extractVehicleFromScreenshot(
  source: Blob | string,
  onProgress?: (p: VehicleOcrProgress) => void
): Promise<VehicleExtractResult> {
  try {
    onProgress?.({ stage: "prepare", percent: 6, message: "Preparing screenshot…" });
    const img = await loadImage(source);
    if (typeof source !== "string") URL.revokeObjectURL(img.src);

    const { canvas } = makeScaledCanvas(img, 1920);
    onProgress?.({ stage: "prepare", percent: 14, message: "Screenshot ready" });

    activeProgress = onProgress ?? null;
    try {
      const result = await extractVehicleFromPrepared(canvas, onProgress);
      onProgress?.({ stage: "done", percent: 100, message: "Extraction complete" });
      return result;
    } finally {
      activeProgress = null;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Extraction failed";
    onProgress?.({ stage: "error", percent: 100, message });
    throw error;
  }
}

export function prefetchVehicleOcr() {
  void getWorker().catch(() => {
    workerPromise = null;
  });
}
