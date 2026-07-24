import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  Check,
  Copy,
  ImagePlus,
  Loader2,
  RefreshCw,
  Upload,
  ClipboardPaste,
  Car,
  User,
  AlertTriangle,
  X,
  Search,
  Star,
  ChevronDown,
  ChevronRight,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { queue } from "@/components/ui/Toast";
import {
  extractVehicleFromScreenshot,
  prefetchVehicleOcr,
  type VehicleExtractResult,
  type VehicleOcrProgress,
} from "@/lib/vehicle-screenshot-ocr";
import { PATROLMAN_GUIDE_DATA } from "@/data/patrolmanGuide";
import { motion } from "framer-motion";

const HIGHLIGHT_STYLES: Record<string, string> = {
  "no-bailout": "border-l-[3px] border-l-[#eab308] bg-[#fefce8]/40",
  "sentence-varies": "border-l-[3px] border-l-[#3b82f6] bg-[#eff6ff]/40",
  "revocation-driver": "border-l-[3px] border-l-[#ef4444] bg-[#fef2f2]/40",
  "revocation-gun": "border-l-[3px] border-l-[#22c55e] bg-[#f0fdf4]/40",
  "revocation-all": "border-l-[3px] border-l-[#ec4899] bg-[#fdf2f8]/40",
  "blacklist": "border-l-[3px] border-l-[#1f2937] bg-[#f9fafb]/40",
  "dismissal": "border-l-[3px] border-l-[#9ca3af] bg-[#f9fafb]/40",
};

const LEGEND_ITEMS = [
  { color: "bg-[#eab308]", label: "No Bailout" },
  { color: "bg-[#3b82f6]", label: "Sentence Varies" },
  { color: "bg-[#ef4444]", label: "Revocation (Driver)" },
  { color: "bg-[#22c55e]", label: "Revocation (Gun)" },
  { color: "bg-[#ec4899]", label: "Revocation (All)" },
  { color: "bg-[#1f2937]", label: "Blacklist" },
  { color: "bg-[#9ca3af]", label: "Dismissal" },
];

const LEGEND_BADGE_STYLES: Record<string, string> = {
  "no-bailout": "bg-[#fefce8] text-[#854d0e] border-[#fef08a]",
  "sentence-varies": "bg-[#eff6ff] text-[#1e40af] border-[#bfdbfe]",
  "revocation-driver": "bg-[#fef2f2] text-[#991b1b] border-[#fecaca]",
  "revocation-gun": "bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]",
  "revocation-all": "bg-[#fdf2f8] text-[#9d174d] border-[#fbcfe8]",
  "blacklist": "bg-[#f9fafb] text-[#1f2937] border-[#e5e7eb]",
  "dismissal": "bg-[#f9fafb] text-[#374151] border-[#e5e7eb]",
};

function renderStars(count: string) {
  const n = parseInt(count, 10);
  if (isNaN(n) || n <= 0) return <span className="text-[#8a90a0]">—</span>;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} className="h-3 w-3 fill-[#eab308] text-[#eab308]" />
      ))}
    </div>
  );
}

type CopyKey = "identifier" | "owner" | "both" | string;

function formatIdentifierLabel(result: VehicleExtractResult) {
  return result.identifierType === "plate" ? "Number plate" : "Vehicle name";
}

export function VehicleTicketingTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<VehicleOcrProgress | null>(null);
  const [result, setResult] = useState<VehicleExtractResult | null>(null);
  const [editedOwner, setEditedOwner] = useState("");
  const [editedIdentifier, setEditedIdentifier] = useState("");
  const [copied, setCopied] = useState<CopyKey | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCodes, setSelectedCodes] = useState<Record<string, boolean>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const previewUrlRef = useRef<string | null>(null);

  const toggleCollapse = (title: string) =>
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));

  const handleCopyCode = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1200);
    } catch {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1200);
    }
  }, []);

  const handleCopySummary = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSummary(field);
      setTimeout(() => setCopiedSummary(null), 1200);
    } catch {
      setCopiedSummary(field);
      setTimeout(() => setCopiedSummary(null), 1200);
    }
  }, []);

  const parseFineAmount = (fineStr: string): number => {
    const clean = fineStr.replace(/[$,\s]/g, "");
    const val = parseInt(clean, 10);
    return isNaN(val) ? 0 : val;
  };

  const parseStarCount = (starStr: string): number => {
    const val = parseInt(starStr, 10);
    return isNaN(val) ? 0 : val;
  };

  const selectedCodesList = useMemo(() => {
    return Object.entries(selectedCodes)
      .filter(([_, selected]) => selected)
      .map(([code]) => code);
  }, [selectedCodes]);

  const selectedChargesStr = useMemo(() => {
    if (selectedCodesList.length === 0) return "";
    const base = selectedCodesList.join(" + ");
    if (editedIdentifier.trim()) {
      return `${base} (${editedIdentifier.trim()})`;
    }
    return base;
  }, [selectedCodesList, editedIdentifier]);

  const totalFines = useMemo(() => {
    let sum = 0;
    const allEntries = PATROLMAN_GUIDE_DATA.flatMap(a => a.entries);
    Object.entries(selectedCodes).forEach(([code, selected]) => {
      if (selected) {
        const entry = allEntries.find(e => e.code === code);
        if (entry) {
          sum += parseFineAmount(entry.fine);
        }
      }
    });
    return Math.min(sum, 50000);
  }, [selectedCodes]);

  const discordLogText = useMemo(() => {
    if (!result) return "";
    const owner = editedOwner.trim() || "N/A";
    const fineFormatted = `$${totalFines.toLocaleString()}`;
    const reason = selectedCodesList.join("+") || "None";
    const plate = result.identifierType === "plate" ? (editedIdentifier.trim() || "N/A") : "N/A";
    return [
      `Vehicle Owner Name: ${owner}`,
      `Fine Amount: ${fineFormatted}`,
      `Reason: ${reason}`,
      `Vehicle Plate: ${plate}`,
      `Proof: Attached`
    ].join("\n");
  }, [result, editedOwner, totalFines, selectedCodesList, editedIdentifier]);

  const totalStars = useMemo(() => {
    let sum = 0;
    const allEntries = PATROLMAN_GUIDE_DATA.flatMap(a => a.entries);
    Object.entries(selectedCodes).forEach(([code, selected]) => {
      if (selected) {
        const entry = allEntries.find(e => e.code === code);
        if (entry) {
          const stars = parseStarCount(entry.stars);
          const points = entry.points ? parseInt(entry.points, 10) : 0;
          sum += stars + (isNaN(points) ? 0 : points);
        }
      }
    });
    return Math.min(sum, 5);
  }, [selectedCodes]);

  const applicableLegends = useMemo(() => {
    const list: Array<{ label: string; style: string }> = [];
    const allEntries = PATROLMAN_GUIDE_DATA.flatMap(a => a.entries);
    
    const highlights = new Set<string>();
    Object.entries(selectedCodes).forEach(([code, selected]) => {
      if (selected) {
        const entry = allEntries.find(e => e.code === code);
        if (entry?.highlight) {
          highlights.add(entry.highlight);
        }
      }
    });

    const labelMap: Record<string, string> = {
      "no-bailout": "No Bailout",
      "sentence-varies": "Sentence Varies",
      "revocation-driver": "Revocation (Driver)",
      "revocation-gun": "Revocation (Gun)",
      "revocation-all": "Revocation (All)",
      "blacklist": "Blacklist",
      "dismissal": "Dismissal",
    };

    highlights.forEach((h) => {
      if (labelMap[h]) {
        list.push({
          label: labelMap[h],
          style: LEGEND_BADGE_STYLES[h] || "",
        });
      }
    });

    return list;
  }, [selectedCodes]);

  useEffect(() => {
    prefetchVehicleOcr();
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const setPreview = useCallback((url: string | null) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    if (url) previewUrlRef.current = url;
    setPreviewUrl(url);
  }, []);

  const handleCopy = useCallback(async (key: CopyKey, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1400);
    } catch {
      queue.add(
        {
          title: "Copy failed",
          description: "Could not access the clipboard.",
          variant: "error",
        },
        { timeout: 3000 }
      );
    }
  }, []);

  const processImage = useCallback(
    async (file: File | Blob, previewFromFile = true) => {
      if (!file.type.startsWith("image/")) {
        queue.add(
          {
            title: "Invalid file",
            description: "Please use a PNG, JPG, or WEBP screenshot.",
            variant: "error",
          },
          { timeout: 4000 }
        );
        return;
      }

      if (file.size > 12 * 1024 * 1024) {
        queue.add(
          {
            title: "File too large",
            description: "Keep screenshots under 12MB.",
            variant: "error",
          },
          { timeout: 4000 }
        );
        return;
      }

      if (previewFromFile) {
        setPreview(URL.createObjectURL(file));
      }

      setIsProcessing(true);
      setResult(null);
      setProgress({ stage: "prepare", percent: 4, message: "Starting…" });

      try {
        const extracted = await extractVehicleFromScreenshot(file, setProgress);
        setResult(extracted);
        setEditedOwner(extracted.ownerName);
        setEditedIdentifier(extracted.identifier);

        if (!extracted.identifier && !extracted.ownerName) {
          queue.add(
            {
              title: "Nothing detected",
              description: "Try a clearer full-screen vehicle info screenshot.",
              variant: "error",
            },
            { timeout: 5000 }
          );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Extraction failed";
        queue.add(
          {
            title: "Extraction failed",
            description: message,
            variant: "error",
          },
          { timeout: 5000 }
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [setPreview]
  );

  const processFileList = useCallback(
    (files: FileList | File[] | null | undefined) => {
      const file = files?.[0];
      if (file) void processImage(file);
    },
    [processImage]
  );

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (blob) {
            event.preventDefault();
            void processImage(blob);
          }
          break;
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [processImage]);

  const clearAll = () => {
    setPreview(null);
    setResult(null);
    setEditedOwner("");
    setEditedIdentifier("");
    setProgress(null);
    setSearchQuery("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const progressPercent = progress?.percent ?? 0;

  // Filter for only traffic codes and parking codes (exclude penal / misdemeanor codes)
  const trafficArticles = PATROLMAN_GUIDE_DATA.filter(
    (a) => a.type === "traffic" || a.type === "parking"
  );

  const isNaDetected = result?.identifierType === "vehicle_name";

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Upload panel */}
        <div className="space-y-4">
          <div
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isDragging) setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const { clientX: x, clientY: y } = e;
              if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
                setIsDragging(false);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              processFileList(e.dataTransfer.files);
            }}
            className={cn(
              "relative overflow-hidden rounded-[12px] border-2 border-dashed transition-colors",
              previewUrl ? "lg:h-[360px]" : "",
              isDragging
                ? "border-[#000000] bg-[#f0f1f3]"
                : "border-[#d8dde6] bg-white hover:border-[#9aa1b0] hover:bg-[#fcfdfe]"
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              className="hidden"
              onChange={(e) => {
                processFileList(e.target.files);
                e.target.value = "";
              }}
            />

            {previewUrl ? (
              <div className="relative h-full w-full bg-[#0b0d12]">
                <img
                  src={previewUrl}
                  alt="Vehicle screenshot preview"
                  className="h-full w-full object-contain"
                />
                <div className="absolute right-3 top-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex h-8 cursor-pointer items-center gap-1.5 rounded-[8px] border border-[#e2e5ec] bg-white px-3 text-[12px] font-semibold text-[#000000] shadow-sm hover:bg-[#f7f8fb]"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[8px] border border-[#e2e5ec] bg-white text-[#666666] shadow-sm hover:bg-[#fff5f5] hover:text-[#ef4444]"
                    aria-label="Clear screenshot"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 px-6 py-16 text-center"
              >
                <div className="grid h-14 w-14 place-items-center rounded-full bg-[#f0f1f3]">
                  <ImagePlus className="h-6 w-6 text-[#666666]" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-[#000000]">
                    Drop screenshot here, or click to upload
                  </p>
                  <p className="mt-1 text-[13px] text-[#666666]">
                    PNG, JPG, WEBP · Drag & drop · Paste with Ctrl+V
                  </p>
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#e2e5ec] bg-[#f8fafc] px-3 py-1.5 text-[12px] font-medium text-[#4b5563]">
                    <Upload className="h-3.5 w-3.5" />
                    Browse files
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#e2e5ec] bg-[#f8fafc] px-3 py-1.5 text-[12px] font-medium text-[#4b5563]">
                    <ClipboardPaste className="h-3.5 w-3.5" />
                    Ctrl+V paste
                  </span>
                </div>
              </button>
            )}
          </div>

          {isProcessing && (
            <div className="rounded-[12px] border border-[#e2e5ec] bg-white p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[13px] font-medium text-[#000000]">
                  <Loader2 className="h-4 w-4 animate-spin text-[#666666]" />
                  {progress?.message || "Processing…"}
                </div>
                <span className="text-[12px] font-semibold tabular-nums text-[#666666]">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#eef0f4]">
                <div
                  className="h-full rounded-full bg-[#000000] transition-all duration-300 ease-out"
                  style={{ width: `${Math.max(4, progressPercent)}%` }}
                />
              </div>
              <div className="mt-3 flex gap-2 text-[11px] font-medium uppercase tracking-wide text-[#9aa1b0]">
                {(["prepare", "ocr", "parse", "done"] as const).map((stage) => {
                  const order = ["prepare", "ocr", "parse", "done"] as const;
                  const current = progress?.stage ?? "prepare";
                  const currentIdx = order.indexOf(current === "error" ? "parse" : current);
                  const stageIdx = order.indexOf(stage);
                  const active = stageIdx <= currentIdx;
                  return (
                    <span
                      key={stage}
                      className={cn(
                        "rounded-[6px] px-2 py-1",
                        active ? "bg-[#f0f1f3] text-[#000000]" : "bg-transparent"
                      )}
                    >
                      {stage}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected Summary Card */}
          {result && (
            <div className="flex flex-col gap-3.5 mt-4">
              {/* Charges row */}
              <div className="flex items-center justify-between gap-3 min-w-0">
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-[#8a93a3] leading-none">
                      Charges
                    </span>
                    {selectedCodesList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedCodes({})}
                        className="text-[9px] font-semibold text-[#ef4444] hover:text-[#ef4444]/80 cursor-pointer hover:underline transition-colors leading-none"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <span className="text-[13.5px] font-semibold text-[#000000] truncate mt-1.5 leading-tight" title={selectedChargesStr || "None"}>
                    {selectedChargesStr || "None"}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={!selectedChargesStr}
                  onClick={() => handleCopySummary(selectedChargesStr, "charges")}
                  className={cn(
                    "text-[10px] font-semibold px-2.5 py-1 rounded-[6px] cursor-pointer transition-all duration-150 shrink-0",
                    !selectedChargesStr
                      ? "text-[#c3c7d3] bg-[#f0f1f3] cursor-not-allowed border border-transparent"
                      : copiedSummary === "charges"
                      ? "bg-[#e6fbf4] text-[#10b981] border border-[#10b981]/20"
                      : "bg-[#f0f1f3] text-[#4b5563] hover:bg-[#e2e5ec] hover:text-black"
                  )}
                >
                  {copiedSummary === "charges" ? "Copied" : "Copy"}
                </button>
              </div>

              {/* Divider */}
              <div className="border-t border-[#eef0f2]" />

              {/* Fines row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[#8a93a3] leading-none">
                    Fines
                  </span>
                  <div className="flex items-baseline gap-3 mt-1.5 min-w-0">
                    <span className="text-[13.5px] font-semibold text-[#000000] truncate leading-none">
                      {totalFines}
                    </span>
                    {applicableLegends.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {applicableLegends.map((leg) => (
                          <span
                            key={leg.label}
                            className={cn(
                              "rounded-[4px] border px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide leading-none",
                              leg.style
                            )}
                          >
                            {leg.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={totalFines === 0}
                  onClick={() => handleCopySummary(String(totalFines), "fines")}
                  className={cn(
                    "text-[10px] font-semibold px-2.5 py-1 rounded-[6px] cursor-pointer transition-all duration-150 shrink-0",
                    totalFines === 0
                      ? "text-[#c3c7d3] bg-[#f0f1f3] cursor-not-allowed border border-transparent"
                      : copiedSummary === "fines"
                      ? "bg-[#e6fbf4] text-[#10b981] border border-[#10b981]/20"
                      : "bg-[#f0f1f3] text-[#4b5563] hover:bg-[#e2e5ec] hover:text-black"
                  )}
                >
                  {copiedSummary === "fines" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results panel */}
        <div className="flex flex-col gap-4">
          <div className="rounded-[12px] border border-[#e2e5ec] bg-white p-4 flex flex-col lg:h-[360px] min-h-0">
          <div>
            <h2 className="text-[15px] font-bold text-[#000000]">Extracted details</h2>
            <p className="mt-0.5 text-[11px] text-[#666666]">
              Review, edit if needed, then copy into the fine form.
            </p>
          </div>

          {!result && !isProcessing && (
            <div className="flex-1 mt-6 flex flex-col items-center justify-center rounded-[10px] border border-dashed border-[#d8dde6] bg-[#fafbfc] px-4 py-8 text-center">
              <Car className="mb-2.5 h-7 w-7 text-[#c8cdd5]" />
              <p className="text-[12.5px] font-medium text-[#666666]">
                Results will appear here after you upload a screenshot.
              </p>
            </div>
          )}

          {isProcessing && !result && (
            <div className="flex-1 mt-6 flex flex-col items-center justify-center gap-2 py-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#666666]" />
              <p className="text-[12.5px] text-[#666666]">Reading vehicle info…</p>
            </div>
          )}

          {result && (
            <div className="mt-4 flex-1 flex flex-col justify-between gap-4">
              <div className="space-y-3.5">
                {result.warnings.length > 0 && (
                  <div className="flex gap-2 rounded-[6px] border border-[#fde68a] bg-[#fffbeb] px-3 py-2 text-[11.5px] text-[#92400e]">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <div className="space-y-0.5">
                      {result.warnings.map((w) => (
                        <p key={w}>{w}</p>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8a93a3]">
                    <Car className="h-3.5 w-3.5 text-[#8a93a3]" />
                    {formatIdentifierLabel(result)}
                    {result.identifierType === "vehicle_name" && (
                      <span className="rounded-[4px] bg-[#f0f1f3] px-1.5 py-0.5 text-[9px] font-bold normal-case tracking-normal text-[#4b5563]">
                        plate was N/A
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      value={editedIdentifier}
                      onChange={(e) => setEditedIdentifier(e.target.value)}
                      className="h-9 w-full rounded-[6px] border border-[#e2e5ec] bg-white pl-3 pr-16 text-[13.5px] font-semibold text-[#000000] outline-none focus:border-[#000000]"
                      placeholder={result.identifierType === "plate" ? "Number plate" : "Vehicle name"}
                    />
                    <button
                      type="button"
                      disabled={!editedIdentifier.trim()}
                      onClick={() => handleCopy("identifier", editedIdentifier.trim())}
                      className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-7 cursor-pointer items-center gap-1 rounded-[4px] border border-[#e2e5ec] bg-white px-2 text-[10.5px] font-semibold text-[#000000] hover:bg-[#f7f8fb] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {copied === "identifier" ? (
                        <Check className="h-3 w-3 text-[#10b981]" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8a93a3]">
                    <User className="h-3.5 w-3.5 text-[#8a93a3]" />
                    Owner name
                  </label>
                  <div className="relative">
                    <input
                      value={editedOwner}
                      onChange={(e) => setEditedOwner(e.target.value)}
                      className="h-9 w-full rounded-[6px] border border-[#e2e5ec] bg-white pl-3 pr-16 text-[13.5px] font-semibold text-[#000000] outline-none focus:border-[#000000]"
                      placeholder="Owner name"
                    />
                    <button
                      type="button"
                      disabled={!editedOwner.trim()}
                      onClick={() => handleCopy("owner", editedOwner.trim())}
                      className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-7 cursor-pointer items-center gap-1 rounded-[4px] border border-[#e2e5ec] bg-white px-2 text-[10.5px] font-semibold text-[#000000] hover:bg-[#f7f8fb] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {copied === "owner" ? (
                        <Check className="h-3 w-3 text-[#10b981]" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={!editedIdentifier.trim() && !editedOwner.trim()}
                onClick={() => {
                  const lines = [
                    editedIdentifier.trim() &&
                      `${formatIdentifierLabel(result)}: ${editedIdentifier.trim()}`,
                    editedOwner.trim() && `Owner: ${editedOwner.trim()}`,
                  ].filter(Boolean);
                  void handleCopy("both", lines.join("\n"));
                }}
                className="mt-auto flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-[6px] bg-[#000000] text-[12.5px] font-semibold text-white transition-colors hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {copied === "both" ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied both
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy both fields
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Discord Logs Card */}
        {result && (
          <div className="rounded-[12px] border border-[#e2e5ec] bg-white p-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8a93a3] leading-none">
                Discord Logs
              </span>
            </div>
            
            <pre className="mt-2.5 rounded-[6px] bg-[#f8fafc] border border-[#eef0f2] p-2.5 text-[11px] font-mono text-[#4b5563] whitespace-pre-wrap leading-relaxed select-text">
              {discordLogText}
            </pre>

            <button
              type="button"
              onClick={() => handleCopySummary(discordLogText, "discordLog")}
              className={cn(
                "mt-3 flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-[6px] bg-[#000000] text-[11px] font-semibold text-white transition-colors hover:bg-[#333]"
              )}
            >
              {copiedSummary === "discordLog" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#10b981]" />
                  Copied Log
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy Log
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>

    {/* Search bar & Accordion Tables */}
    {result && (
      <div className="lg:-mt-14 mt-6 flex flex-col gap-6">
        {/* Search bar */}
        <div className="relative w-full max-w-[360px] h-[36px] rounded-[6px] border border-[#e2e5ec] bg-white flex items-center shrink-0 transition-colors focus-within:border-[#000000]">
          <Search className="absolute left-3 h-4 w-4 text-[#8a90a0] pointer-events-none" />
          <input
            type="text"
            data-no-style
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by code or description..."
            className="h-full w-full bg-transparent pl-9 pr-9 text-[13px] text-[#000000] outline-none border-0 ring-0 focus:ring-0 focus:outline-none"
            style={{ border: "none", outline: "none", boxShadow: "none" }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 text-[#8a90a0] hover:text-[#000000] transition-colors"
              aria-label="Clear search"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* N/A Recommendation (T.C. 2.1) at the top */}
        {isNaDetected && (() => {
          const entry = PATROLMAN_GUIDE_DATA.flatMap(a => a.entries).find(e => e.code === "T.C. 2.1");
          if (!entry) return null;

          const isSelected = !!selectedCodes[entry.code];
          const isCopied = copiedCode === entry.code;

          return (
            <div className="w-full overflow-x-auto rounded-[8px] border border-[#2563eb]/20 bg-[#eff6ff]/35">
              <table className="w-full table-fixed border-collapse text-left">
                <tbody>
                  <tr
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest(".checkbox-cell")) {
                        return;
                      }
                      handleCopyCode(entry.code);
                    }}
                    className={cn(
                      "cursor-pointer transition-colors duration-150 select-none",
                      isCopied
                        ? "bg-[#e6fbf4] hover:bg-[#e6fbf4] border-l-[3px] border-l-[#10b981]"
                        : "bg-[#eff6ff] hover:bg-[#dbeafe] border-l-[3px] border-l-[#2563eb]"
                    )}
                  >
                    <td className="w-[6%] px-4 py-3.5 text-center checkbox-cell align-top">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          setSelectedCodes((prev) => ({
                            ...prev,
                            [entry.code]: !prev[entry.code],
                          }));
                        }}
                        className="h-4 w-4 rounded border-[#2563eb]/20 bg-white text-black accent-black cursor-pointer"
                      />
                    </td>
                    <td className="w-[15%] px-6 py-3.5 text-[13px] font-bold text-[#000000] align-top">
                      <div className="flex items-center gap-2">
                        <span>{entry.code}</span>
                        {isCopied && (
                          <span className="text-[10px] font-semibold text-[#10b981] bg-[#e6fbf4] border border-[#10b981]/20 px-1.5 py-0.5 rounded animate-pulse shrink-0">
                            Copied!
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="w-[45%] px-6 py-3.5 text-[13px] text-[#2b2f3a] font-normal leading-relaxed break-words align-top">
                      <div className="mb-2 inline-flex items-center gap-1.5 rounded-[4px] bg-[#2563eb]/10 px-2 py-0.5 text-[11px] font-semibold text-[#2563eb]">
                        <Info className="h-3.5 w-3.5 shrink-0" />
                        Recommended as the vehicle does not have a license plate
                      </div>
                      <div>{entry.description}</div>
                    </td>
                    <td className="w-[13%] px-6 py-3.5 text-[13px] font-semibold text-[#10b981] align-top">
                      {entry.fine}
                    </td>
                    <td className="w-[13%] px-6 py-3.5 text-[13px] font-medium text-[#303646] align-top">
                      —
                    </td>
                    <td className="w-[9%] px-6 py-3.5 align-top">
                      <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full bg-[#f0f1f3] text-[11px] font-bold text-[#303646]">
                        —
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })()}

        {/* Accordion Table sections */}
        <div className="space-y-6">
          {trafficArticles.map((article) => {
            const isCollapsed = collapsed[article.title] ?? false;
            const isParking = article.type === "parking";

            const filteredEntries = article.entries.filter((entry) => {
              if (isNaDetected && entry.code === "T.C. 2.1") return false;
              const query = searchQuery.toLowerCase();
              return (
                entry.code.toLowerCase().includes(query) ||
                entry.description.toLowerCase().includes(query) ||
                article.title.toLowerCase().includes(query)
              );
            });

            if (filteredEntries.length === 0) return null;

            const filteredNotes = article.notes?.filter(note => !note.toLowerCase().includes("highlight")) || [];

            return (
              <div key={article.title} className="space-y-4">
                {/* Article header */}
                <button
                  type="button"
                  onClick={() => toggleCollapse(article.title)}
                  className="flex items-center gap-2 group cursor-pointer"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-[#8a90a0] group-hover:text-[#000000] transition-colors" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[#8a90a0] group-hover:text-[#000000] transition-colors" />
                  )}
                  <h3 className="text-[15px] font-bold text-[#000000]">
                    {article.title}
                  </h3>
                </button>

                <motion.div
                  animate={{ height: isCollapsed ? 0 : "auto" }}
                  initial={false}
                  transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1.0] }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3">
                    {filteredNotes.length > 0 && (
                      <div className="space-y-1 rounded-[6px] bg-[#fafbfc] border border-[#eef0f2] p-3 text-[11.5px] leading-relaxed text-[#5c6475]">
                        {filteredNotes.map((note, i) => (
                          <p key={i}>{note}</p>
                        ))}
                      </div>
                    )}

                    <div className="overflow-x-auto rounded-[8px] border border-[#e2e5ec] bg-white">
                      <table className="w-full table-fixed border-collapse text-left">
                        <thead>
                          <tr className="border-b border-[#e2e5ec] bg-[#fafbfc] text-[10px] font-bold uppercase tracking-wider text-[#8a90a0]">
                            <th className="w-[6%] py-3 text-center checkbox-cell">
                              <input
                                type="checkbox"
                                checked={filteredEntries.every(e => !!selectedCodes[e.code])}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setSelectedCodes((prev) => {
                                    const next = { ...prev };
                                    filteredEntries.forEach(entry => {
                                      next[entry.code] = checked;
                                    });
                                    return next;
                                  });
                                }}
                                className="h-4 w-4 rounded border-[#e2e5ec] bg-white text-black accent-black cursor-pointer"
                              />
                            </th>
                            <th className="w-[15%] px-6 py-3">Code</th>
                            <th className="w-[45%] px-6 py-3">Description</th>
                            <th className="w-[13%] px-6 py-3">Fine</th>
                            <th className="w-[13%] px-6 py-3">Time (Months)</th>
                            <th className="w-[9%] px-6 py-3">{isParking ? "—" : "Stars"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f0f1f3]">
                          {filteredEntries.map((entry, idx) => {
                            const isSelected = !!selectedCodes[entry.code];
                            const isCopied = copiedCode === entry.code;
                            const isNaRecommendation = isNaDetected && entry.code === "T.C. 2.1";

                            return (
                              <tr
                                key={idx}
                                onClick={(e) => {
                                  if ((e.target as HTMLElement).closest(".checkbox-cell")) {
                                    return;
                                  }
                                  handleCopyCode(entry.code);
                                }}
                                className={cn(
                                  "cursor-pointer transition-colors duration-150 select-none",
                                  isCopied
                                    ? "bg-[#e6fbf4] hover:bg-[#e6fbf4] border-l-[3px] border-l-[#10b981]"
                                    : isNaRecommendation
                                    ? "bg-[#eff6ff] hover:bg-[#dbeafe] border-l-[3px] border-l-[#2563eb]"
                                    : cn(
                                        "hover:bg-[#f9fbfc] active:bg-[#f3f4f6]",
                                        entry.highlight ? HIGHLIGHT_STYLES[entry.highlight] : "border-l-[3px] border-l-transparent"
                                      )
                                )}
                              >
                                <td className="px-4 py-3.5 text-center checkbox-cell align-top">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      setSelectedCodes((prev) => ({
                                        ...prev,
                                        [entry.code]: !prev[entry.code],
                                      }));
                                    }}
                                    className="h-4 w-4 rounded border-[#e2e5ec] bg-white text-black accent-black cursor-pointer"
                                  />
                                </td>
                                <td className="px-6 py-3.5 text-[13px] font-bold text-[#000000] align-top">
                                  <div className="flex items-center gap-2">
                                    <span>{entry.code}</span>
                                    {isCopied && (
                                      <span className="text-[10px] font-semibold text-[#10b981] bg-[#e6fbf4] border border-[#10b981]/20 px-1.5 py-0.5 rounded animate-pulse shrink-0">
                                        Copied!
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-3.5 text-[13px] text-[#2b2f3a] font-normal leading-relaxed break-words align-top">
                                  {isNaRecommendation && (
                                    <div className="mb-2 inline-flex items-center gap-1.5 rounded-[4px] bg-[#2563eb]/10 px-2 py-0.5 text-[11px] font-semibold text-[#2563eb]">
                                      <Info className="h-3.5 w-3.5 shrink-0" />
                                      Recommended as the vehicle does not have a license plate
                                    </div>
                                  )}
                                  <div>{entry.description}</div>
                                </td>
                                <td className="px-6 py-3.5 text-[13px] font-semibold text-[#10b981] align-top">
                                  {entry.fine}
                                </td>
                                <td className="px-6 py-3.5 text-[13px] font-medium text-[#303646] align-top">
                                  {entry.time === "-" ? (
                                    <span className="text-[#8a90a0]">—</span>
                                  ) : (
                                    entry.time
                                  )}
                                </td>
                                <td className="px-6 py-3.5 align-top">
                                  {renderStars(entry.stars)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    )}
    </div>
  );
}
