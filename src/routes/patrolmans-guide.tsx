import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback, useRef } from "react";
import { Search, Star, ChevronDown, ChevronRight, Info, X } from "lucide-react";
import { OrganizerLayout } from "@/components/dashboard/OrganizerLayout";
import { SoftwareHeader } from "@/components/dashboard/SoftwareHeader";
import { cn } from "@/lib/utils";
import { PATROLMAN_GUIDE_DATA, PENAL_CODE_LEGAL_DESCRIPTIONS } from "@/data/patrolmanGuide";
import { EN1_PATROLMAN_GUIDE_DATA, EN1_PENAL_CODE_LEGAL_DESCRIPTIONS } from "@/data/patrolmanGuideEN1";
import { motion } from "framer-motion";
import { usePageSearchShortcut } from "@/hooks/use-page-search-shortcut";

export const Route = createFileRoute("/patrolmans-guide")({
  head: () => ({
    meta: [{ title: "Patrolman's Guide | Grand Wiki" }],
  }),
  validateSearch: (search: Record<string, unknown>): { server?: string } => {
    return {
      server: typeof search.server === 'string' ? search.server : 'en2',
    };
  },
  component: PatrolmansGuidePage,
});

const HIGHLIGHT_STYLES: Record<string, string> = {
  "no-bailout": "border-l-[3px] border-l-[#eab308] bg-[#eab308]/15 text-[#fef08a]",
  "sentence-varies": "border-l-[3px] border-l-[#3b82f6] bg-[#3b82f6]/15 text-[#93c5fd]",
  "revocation-driver": "border-l-[3px] border-l-[#ef4444] bg-[#ef4444]/15 text-[#fca5a5]",
  "revocation-gun": "border-l-[3px] border-l-[#22c55e] bg-[#22c55e]/15 text-[#86efac]",
  "revocation-all": "border-l-[3px] border-l-[#ec4899] bg-[#ec4899]/15 text-[#f472b6]",
  "blacklist": "border-l-[3px] border-l-[#1f2937] bg-[#1f2937]/15 text-[#d1d5db]",
  "dismissal": "border-l-[3px] border-l-[#9ca3af] bg-[#9ca3af]/15 text-[#e5e7eb]",
};

const HIGHLIGHT_COLORS: Record<string, string> = {
  "no-bailout": "#eab308",
  "sentence-varies": "#3b82f6",
  "revocation-driver": "#ef4444",
  "revocation-gun": "#22c55e",
  "revocation-all": "#ec4899",
  "blacklist": "#1f2937",
  "dismissal": "#9ca3af",
};

const ROW_BG_COLORS: Record<string, string> = {
  "no-bailout": "#fcf7da",
  "sentence-varies": "#eef4fe",
  "revocation-driver": "#fdecee",
  "revocation-gun": "#e9f9ee",
  "revocation-all": "#fdeef5",
  "blacklist": "#dedede",
  "dismissal": "#f0f1f3",
};

const BORDER_LEFT_COLORS: Record<string, string> = {
  "no-bailout": "#eab308",
  "sentence-varies": "#3b82f6",
  "revocation-driver": "#ef4444",
  "revocation-gun": "#22c55e",
  "revocation-all": "#ec4899",
  "blacklist": "#1f2937",
  "dismissal": "#9ca3af",
};

const ROW_BG_COLORS_CLASSES: Record<string, string> = {
  "no-bailout": "bg-[#fefce8] dark:bg-[#242014]",
  "sentence-varies": "bg-[#eff6ff] dark:bg-[#131416]",
  "revocation-driver": "bg-[#fef2f2] dark:bg-[#241414]",
  "revocation-gun": "bg-[#f0fdf4] dark:bg-[#162018]",
  "revocation-all": "bg-[#fdf2f8] dark:bg-[#241420]",
  "blacklist": "bg-[#f9fafb] dark:bg-[#121213]",
  "dismissal": "bg-[#f9fafb] dark:bg-[#121213]",
};

function getRowBorderAccent(highlight?: string): { className: string; style?: React.CSSProperties } {
  if (!highlight) return { className: "border-l-[3px] border-l-transparent" };
  const highlights = highlight.split(',').map(h => h.trim()).filter(Boolean);
  if (highlights.length === 0) return { className: "border-l-[3px] border-l-transparent" };
  const mainColor = BORDER_LEFT_COLORS[highlights[0]] || "transparent";
  return {
    className: "border-l-[3px]",
    style: { borderLeftColor: mainColor }
  };
}

const TOTAL_COLS = 7; // Checkbox, Code, Charges, Fine, Time, Stars/Points, Description

function getCellBgForColumn(highlight: string | undefined, colIndex: number): string {
  if (!highlight) return "bg-white dark:bg-black";
  const highlights = highlight.split(',').map(h => h.trim()).filter(Boolean);
  if (highlights.length === 0) return "bg-white dark:bg-black";

  if (highlights.length === 1) {
    const color = highlights[0];
    return ROW_BG_COLORS_CLASSES[color] || "bg-white dark:bg-black";
  }

  // Multi-highlight: divide the row's columns into equal color zones
  const zoneSize = TOTAL_COLS / highlights.length;
  const zoneIndex = Math.min(Math.floor(colIndex / zoneSize), highlights.length - 1);
  const color = highlights[zoneIndex];
  return ROW_BG_COLORS_CLASSES[color] || "bg-white dark:bg-black";
}

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
  "no-bailout": "bg-[#fefce8] text-[#854d0e] border-[#fef08a] dark:bg-[#242014] dark:text-[#fbbf24] dark:border-[#854d0e]",
  "sentence-varies": "bg-[#eff6ff] text-[#1e40af] border-[#bfdbfe] dark:bg-[#131416] dark:text-[#60a5fa] dark:border-[#1e40af]",
  "revocation-driver": "bg-[#fef2f2] text-[#991b1b] border-[#fecaca] dark:bg-[#241414] dark:text-[#f87171] dark:border-[#991b1b]",
  "revocation-gun": "bg-[#f0fdf4] text-[#166534] border-[#bbf7d0] dark:bg-[#162018] dark:text-[#4ade80] dark:border-[#166534]",
  "revocation-all": "bg-[#fdf2f8] text-[#9d174d] border-[#fbcfe8] dark:bg-[#241420] dark:text-[#f472b6] dark:border-[#9d174d]",
  "blacklist": "bg-[#f9fafb] text-[#1f2937] border-[#e5e7eb] dark:bg-[#121213] dark:text-[#e5e7eb] dark:border-[#374151]",
  "dismissal": "bg-[#f9fafb] text-[#374151] border-[#e5e7eb] dark:bg-[#121213] dark:text-[#9ca3af] dark:border-[#374151]",
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

type GuideSection = "codes" | "radio" | "illegal-items" | "miranda";

function PatrolmansGuidePage() {
  const routeSearch = Route.useSearch();
  const server = routeSearch.server || 'en2';

  // If EN3 is selected, show coming soon message
  if (server === 'en3') {
    return (
      <OrganizerLayout header={<SoftwareHeader title="Patrolman's Guide - EN #3" />}>
        <div className="flex min-w-0 flex-1 flex-col min-h-0">
          <main className="min-h-0 flex-1 overflow-y-auto p-8">
            <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center justify-center gap-6 py-20">
              <div className="rounded-full bg-[#f0f1f3] p-6">
                <Info className="h-12 w-12 text-[#8a93a3]" />
              </div>
              <div className="text-center">
                <h2 className="text-[24px] font-bold text-[#000000] dark:text-white">Coming Soon</h2>
                <p className="mt-2 text-[14px] text-[#666666] dark:text-[#a0a5b1] max-w-[500px]">
                  EN #3 Patrolman's Guide is currently under development and will be available soon.
                </p>
              </div>
            </div>
          </main>
        </div>
      </OrganizerLayout>
    );
  }

  // Select data based on server
  const currentGuideData = server === 'en1' ? EN1_PATROLMAN_GUIDE_DATA : PATROLMAN_GUIDE_DATA;
  const currentLegalDescriptions = server === 'en1' ? EN1_PENAL_CODE_LEGAL_DESCRIPTIONS : PENAL_CODE_LEGAL_DESCRIPTIONS;

  // All hooks must be called before any conditional returns
  const [activeGuideSection, setActiveGuideSection] = useState<GuideSection>("codes");
  const [activeTab, setActiveTab] = useState<"penal" | "traffic">("penal");
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [selectedCodes, setSelectedCodes] = useState<Record<string, boolean>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  usePageSearchShortcut(searchInputRef);

  // Show placeholder for EN #3 only
  if (server === 'en3') {
    return (
      <OrganizerLayout header={<SoftwareHeader title="Patrolman's Guide" />}>
        <div className="flex min-w-0 flex-1 flex-col min-h-0 bg-[#f7f8fb] dark:bg-black">
          <header className="shrink-0 border-b border-[#e7e9f0] dark:border-[#222326] bg-white dark:bg-black px-8 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-[30px] font-semibold text-[#000000] dark:text-white">
                Patrolman's Guide - {server.toUpperCase()}
              </h1>
            </div>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto p-8">
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-[16px] text-[#666666] dark:text-[#888991]">
                Content for {server.toUpperCase()} coming soon.
              </p>
            </div>
          </main>
        </div>
      </OrganizerLayout>
    );
  }

  // Original content for EN #2
  const toggleCollapse = (title: string) =>
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));

  const handleCopyCode = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1200);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1200);
    }
  }, []);

  const [copiedSummary, setCopiedSummary] = useState<string | null>(null);

  const handleCopySummary = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSummary(field);
      setTimeout(() => setCopiedSummary(null), 1200);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
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
    return selectedCodesList.join(" + ");
  }, [selectedCodesList]);

  const hasIsolationSelected = useMemo(() => {
    return selectedCodesList.some((code) => code.startsWith("P.C. 9.1."));
  }, [selectedCodesList]);

  const totalFines = useMemo(() => {
    let sum = 0;
    const allEntries = currentGuideData.flatMap(a => a.entries);
    Object.entries(selectedCodes).forEach(([code, selected]) => {
      if (selected) {
        const entry = allEntries.find(e => e.code === code);
        if (entry) {
          sum += parseFineAmount(entry.fine);
        }
      }
    });
    return Math.min(sum, 50000);
  }, [selectedCodes, currentGuideData]);

  const totalStars = useMemo(() => {
    let sum = 0;
    const allEntries = currentGuideData.flatMap(a => a.entries);
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
  }, [selectedCodes, currentGuideData]);

  const applicableLegends = useMemo(() => {
    const list: Array<{ label: string; style: string }> = [];
    const allEntries = currentGuideData.flatMap(a => a.entries);
    
    const highlights = new Set<string>();
    Object.entries(selectedCodes).forEach(([code, selected]) => {
      if (selected) {
        const entry = allEntries.find(e => e.code === code);
        if (entry?.highlight) {
          // Split comma-separated highlights
          const entryHighlights = entry.highlight.split(',').map(h => h.trim()).filter(Boolean);
          entryHighlights.forEach(h => highlights.add(h));
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
  }, [selectedCodes, currentGuideData]);

  const filteredData = useMemo(() => {
    const articles = currentGuideData.filter((a) =>
      activeTab === "penal"
        ? a.type === "penal" || a.type === "misdemeanor"
        : a.type === "traffic" || a.type === "parking"
    );

    if (!searchQuery.trim()) return articles;

    const q = searchQuery.toLowerCase();
    return articles
      .map((a) => ({
        ...a,
        entries: a.entries.filter(
          (e) =>
            e.code.toLowerCase().includes(q) ||
            e.description.toLowerCase().includes(q) ||
            (e.legalDescription || currentLegalDescriptions[e.code] || "").toLowerCase().includes(q)
        ),
      }))
      .filter((a) => a.entries.length > 0);
  }, [activeTab, searchQuery, currentGuideData, currentLegalDescriptions]);

  const totalEntries = filteredData.reduce(
    (sum, a) => sum + a.entries.length,
    0
  );

  return (
    <>
      <style>{`
        .multi-highlight-row:hover,
        .multi-highlight-row:active {
          background-image: var(--multi-highlight-image) !important;
        }
      `}</style>
      <OrganizerLayout header={<SoftwareHeader title="Patrolman's Guide" />}>
      <div className="flex min-w-0 flex-1 flex-col min-h-0">
        {/* Header – matches org page with section view buttons on right */}
        <header className="shrink-0 border-b border-[#e7e9f0] bg-white px-8 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <h1 className="text-[30px] font-semibold text-[#000000]">
                Patrolman's Guide
              </h1>
              <div className="relative group mt-1 shrink-0">
                <Info className="h-4.5 w-4.5 text-[#8a90a0] hover:text-[#000000] cursor-help transition-colors" />
                
                {/* Tooltip content box */}
                <div className="absolute left-1/2 top-full mt-2.5 -translate-x-1/2 hidden group-hover:block bg-black text-white text-[12px] p-4 rounded-[8px] shadow-lg font-medium leading-relaxed z-[99] w-[260px] pointer-events-none animate-in fade-in slide-in-from-top-2 duration-150">
                  <span className="block font-semibold text-[13px] border-b border-white/10 pb-1 mb-2 text-white">
                    Quick Instructions
                  </span>
                  <ul className="space-y-1.5 text-slate-300 font-normal text-[11px] list-disc pl-3.5">
                    <li><strong>Checkboxes:</strong> Select charges to populate the summary card.</li>
                    <li><strong>Row Clicks:</strong> Click anywhere on a row to instantly copy the code.</li>
                    <li><strong>Summary Card:</strong> View and copy total selected charges, combined fines (capped at 50k), and stars (capped at 5).</li>
                    <li><strong>Highlight rules:</strong> Hover on the legends to check penalty variations.</li>
                  </ul>
                  {/* Tooltip arrow */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-black" />
                </div>
              </div>
            </div>

            {/* Right side multi-state navigation options */}
            <div className="flex items-center gap-1.5 rounded-[8px] border border-[#e2e5ec] bg-[#f9fbfc] p-1 shrink-0">
              {[
                { id: "codes", label: "Penal & Traffic Codes" },
                { id: "radio", label: "Radio Codes" },
                { id: "illegal-items", label: "List Of Illegal Items" },
                { id: "miranda", label: "Miranda Rights And Warnings" },
              ].map((tab) => {
                const isActive = activeGuideSection === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveGuideSection(tab.id as GuideSection)}
                    className={cn(
                      "h-8 rounded-[6px] px-3.5 text-[12px] font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap",
                      isActive
                        ? "bg-[#000000] text-white shadow-sm"
                        : "text-[#666666] hover:bg-black/5 hover:text-[#000000]"
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </header>
        {activeGuideSection !== "miranda" && (
          <div className="shrink-0 border-b border-[#e7e9f0] bg-white px-8 py-4 dark:border-[#222326] dark:bg-[#000000]">
            <div className="mx-auto max-w-[1200px] space-y-4">
              <div className="flex items-start justify-between gap-6 flex-wrap">
                <div className="flex flex-col gap-4 flex-1">
                  <div className="flex items-center gap-4 flex-wrap">
                    {activeGuideSection === "codes" && (
                      <div className="flex items-center h-[36px] rounded-[6px] border border-[#e2e5ec] bg-[#f9fbfc] p-0.5 shrink-0 dark:border-[#222326] dark:bg-[#121213]">
                        <button
                          type="button"
                          onClick={() => setActiveTab("penal")}
                          className={cn(
                            "h-8 rounded-[5px] px-4 text-[13px] font-semibold transition-all flex items-center justify-center cursor-pointer whitespace-nowrap",
                            activeTab === "penal"
                              ? "bg-[#000000] text-white shadow-sm dark:bg-white dark:text-black"
                              : "text-[#666666] hover:text-[#000000] dark:text-[#888991] dark:hover:text-white"
                          )}
                        >
                          Penal Code
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("traffic")}
                          className={cn(
                            "h-8 rounded-[5px] px-4 text-[13px] font-semibold transition-all flex items-center justify-center cursor-pointer whitespace-nowrap",
                            activeTab === "traffic"
                              ? "bg-[#000000] text-white shadow-sm dark:bg-white dark:text-black"
                              : "text-[#666666] hover:text-[#000000] dark:text-[#888991] dark:hover:text-white"
                          )}
                        >
                          Traffic Code
                        </button>
                      </div>
                    )}

                    <div className="relative w-full max-w-[360px] h-[36px] rounded-[6px] border border-[#e2e5ec] bg-white flex items-center shrink-0 transition-colors focus-within:border-[#000000] dark:border-[#222326] dark:bg-[#121213] dark:focus-within:border-white">
                      <Search className="absolute left-3 h-4 w-4 text-[#8a90a0] pointer-events-none" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        data-no-style
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={
                          activeGuideSection === "codes"
                            ? "Search by code or description... (Ctrl H)"
                            : activeGuideSection === "radio"
                            ? "Search radio codes or meanings..."
                            : "Search illegal items or notes..."
                        }
                        className="h-full w-full bg-transparent pl-9 pr-3 text-[13px] text-[#000000] dark:text-white outline-none border-0 ring-0 focus:ring-0 focus:outline-none"
                        style={{ border: "none", outline: "none", boxShadow: "none" }}
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2.5 text-[#8a90a0] transition-colors hover:cursor-pointer hover:text-[#000000] dark:hover:text-white"
                          aria-label="Clear search"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {activeGuideSection === "codes" && (
                    <div className="flex items-start gap-3">
                      <span className="text-[11px] font-bold text-[#8a93a3] uppercase tracking-wider mt-0.5 shrink-0">
                        LEGEND:
                      </span>
                      <div className="flex flex-col gap-1.5">
                        {/* First Line */}
                        <div className="flex items-center gap-3 flex-wrap">
                          {LEGEND_ITEMS.slice(0, 5).map((item) => (
                            <div key={item.label} className="flex items-center gap-1.5">
                              <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", item.color)} />
                              <span className="text-[12px] text-[#666666] whitespace-nowrap dark:text-[#a0a5b1]">
                                {item.label}
                              </span>
                            </div>
                          ))}
                        </div>
                        {/* Second Line: Blacklist & Dismissal */}
                        <div className="flex items-center gap-3 flex-wrap">
                          {LEGEND_ITEMS.slice(5).map((item) => (
                            <div key={item.label} className="flex items-center gap-1.5">
                              <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", item.color)} />
                              <span className="text-[12px] text-[#666666] whitespace-nowrap dark:text-[#a0a5b1]">
                                {item.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {activeGuideSection === "codes" && (
                  <div className="flex-1 max-w-[480px] border border-[#e2e5ec] rounded-[8px] p-4 flex flex-col gap-3 ml-auto shrink-0 dark:border-[#222326]">
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
                        <span className="text-[13px] font-semibold text-black dark:text-white truncate mt-1.5 font-sans leading-tight" title={selectedChargesStr || "None"}>
                          {selectedChargesStr || "None"}
                        </span>
                      </div>
                      <button
                      type="button"
                      disabled={!selectedChargesStr}
                      onClick={() => handleCopySummary(selectedChargesStr, "charges")}
                      className={cn(
                        "text-[10px] font-medium px-2.5 py-1 rounded-[5px] cursor-pointer transition-all duration-150 shrink-0",
                        !selectedChargesStr
                          ? "text-[#c3c7d3] bg-[#f0f1f3] cursor-not-allowed border border-transparent"
                          : copiedSummary === "charges"
                          ? "bg-[#e6fbf4] text-[#10b981] border border-[#10b981]/20"
                          : "bg-white text-black border border-[#e2e5ec] hover:bg-[#f0f1f3]"
                      )}
                    >
                      {copiedSummary === "charges" ? "Copied" : "Copy"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-[#eef0f2] pt-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-[#8a93a3] leading-none">
                          Fines
                        </span>
                        <span className="text-[13px] font-semibold text-black mt-1.5 truncate leading-none">
                          {totalFines}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={totalFines === 0}
                        onClick={() => handleCopySummary(String(totalFines), "fines")}
                        className={cn(
                          "text-[10px] font-medium px-2 py-0.5 rounded-[4px] cursor-pointer transition-all duration-150 shrink-0",
                          totalFines === 0
                            ? "text-[#c3c7d3] bg-[#f0f1f3] cursor-not-allowed border border-transparent"
                            : copiedSummary === "fines"
                            ? "bg-[#e6fbf4] text-[#10b981] border border-[#10b981]/20"
                            : "bg-white text-black border border-[#e2e5ec] hover:bg-[#f0f1f3]"
                        )}
                      >
                        {copiedSummary === "fines" ? "Copied" : "Copy"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-l border-[#eef0f2] pl-4">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-[#8a93a3] leading-none">
                          Stars
                        </span>
                        <span className="text-[13px] font-semibold text-black mt-1.5 truncate leading-none">
                          {totalStars}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={totalStars === 0}
                        onClick={() => handleCopySummary(String(totalStars), "stars")}
                        className={cn(
                          "text-[10px] font-medium px-2 py-0.5 rounded-[4px] cursor-pointer transition-all duration-150 shrink-0",
                          totalStars === 0
                            ? "text-[#c3c7d3] bg-[#f0f1f3] cursor-not-allowed border border-transparent"
                            : copiedSummary === "stars"
                            ? "bg-[#e6fbf4] text-[#10b981] border border-[#10b981]/20"
                            : "bg-white text-black border border-[#e2e5ec] hover:bg-[#f0f1f3]"
                        )}
                      >
                        {copiedSummary === "stars" ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  {applicableLegends.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap border-t border-[#eef0f2] pt-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#8a93a3] mr-1 shrink-0">
                        Rules:
                      </span>
                      {applicableLegends.map((item) => (
                        <span
                          key={item.label}
                          className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded-[4px] border",
                            item.style
                          )}
                        >
                          {item.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {hasIsolationSelected && (
                    <div className="flex items-center gap-1.5 border-t border-[#eef0f2] pt-2.5 text-[#ef4444] animate-in fade-in slide-in-from-top-1 duration-150">
                      <Info className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-[11px] font-bold uppercase tracking-wide">
                        Put the 10-15 in isolation
                      </span>
                    </div>
                  )}
                </div>
                )}
              </div>
            </div>
          </div>
        )}

        <main className="min-h-0 flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-[1200px] space-y-6">
            {activeGuideSection === "codes" && (
              filteredData.length > 0 ? (
                <div className="space-y-8">
                  {filteredData.map((article) => {
                    const isCollapsed = collapsed[article.title] ?? false;
                    const isMisdemeanor = article.type === "misdemeanor";
                    const filteredNotes = article.notes?.filter(note => !note.toLowerCase().includes("highlight")) || [];

                    return (
                      <div key={article.title} className="space-y-4">
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
                          <h2 className="text-[15px] font-bold text-[#000000]">
                            {article.title}
                          </h2>
                        </button>

                        <motion.div
                          animate={{ height: isCollapsed ? 0 : "auto" }}
                          initial={false}
                          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1.0] }}
                          className="overflow-hidden"
                        >
                          <div className="pt-2 pb-4 space-y-4">
                            {filteredNotes.length > 0 && (
                              <div className="flex items-start gap-2.5 rounded-[6px] bg-[#f8fafc] border border-[#eef0f2] px-4 py-3">
                                <Info className="h-4 w-4 text-[#8a90a0] shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                  {filteredNotes.map((note, i) => (
                                    <p
                                      key={i}
                                      className="text-[12px] text-[#666666] leading-relaxed"
                                    >
                                      {note}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="overflow-x-auto rounded-[8px] border border-[#e2e5ec] bg-white dark:bg-black dark:border-[#222326]">
                              <table className="w-full min-w-[1300px] text-left table-fixed border-collapse">
                                <thead>
                                  <tr className="bg-[#f9fbfc] text-[11px] font-semibold uppercase tracking-wide text-[#8a93a3] border-b border-[#e2e5ec]">
                                    <th className="sticky left-0 z-30 w-[50px] min-w-[50px] bg-[#f9fbfc] px-4 py-3 text-center checkbox-cell">
                                      <input
                                        type="checkbox"
                                        data-no-style
                                        checked={article.entries.length > 0 && article.entries.every((e) => selectedCodes[e.code])}
                                        onChange={() => {
                                          const allSelected = article.entries.every((e) => selectedCodes[e.code]);
                                          setSelectedCodes((prev) => {
                                            const next = { ...prev };
                                            article.entries.forEach((e) => {
                                              next[e.code] = !allSelected;
                                            });
                                            return next;
                                          });
                                        }}
                                        className="h-4 w-4 rounded cursor-pointer"
                                      />
                                    </th>
                                    <th className="sticky left-[50px] z-30 w-[140px] min-w-[140px] bg-[#f9fbfc] px-6 py-3">Code</th>
                                    <th className="sticky left-[190px] z-30 w-[280px] min-w-[280px] bg-[#f9fbfc] px-6 py-3">
                                      Charges
                                    </th>
                                    <th className="w-[110px] min-w-[100px] px-6 py-3">Fine</th>
                                    <th className="w-[120px] min-w-[110px] px-6 py-3">
                                      Time (Months)
                                    </th>
                                    <th className="w-[100px] min-w-[90px] px-6 py-3">
                                      {isMisdemeanor ? "Points" : "Stars"}
                                    </th>
                                    <th className="w-[480px] min-w-[350px] px-6 py-3">
                                      Description
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#f0f1f3]">
                                  {article.entries.map((entry, idx) => {
                                    const isSelected = !!selectedCodes[entry.code];
                                    const isCopied = copiedCode === entry.code;
                                    const borderAccent = getRowBorderAccent(entry.highlight);
                                    const copiedBgClass = "bg-[#e6fbf4] dark:bg-[#162018]";
                                    const cellBg = (col: number) => isCopied ? copiedBgClass : getCellBgForColumn(entry.highlight, col);
                                    const rowBorderStyle = isCopied
                                      ? { borderLeftColor: "#10b981" }
                                      : borderAccent.style;
                                    const rowBorderClass = isCopied
                                      ? "border-l-[3px]"
                                      : borderAccent.className;
                                    const legalDescription =
                                      entry.legalDescription || currentLegalDescriptions[entry.code] || "—";

                                    return (
                                      <tr
                                        key={idx}
                                        onClick={(e) => {
                                          if ((e.target as HTMLElement).closest(".checkbox-cell")) {
                                            return;
                                          }
                                          handleCopyCode(entry.code);
                                        }}
                                        style={rowBorderStyle}
                                        className={cn(
                                          "cursor-pointer transition-colors duration-150 select-none",
                                          rowBorderClass
                                        )}
                                      >
                                        <td
                                          className={cn("sticky left-0 z-20 w-[50px] min-w-[50px] px-4 py-3.5 text-center checkbox-cell align-top", cellBg(0))}
                                        >
                                          <input
                                            type="checkbox"
                                            data-no-style
                                            checked={isSelected}
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              setSelectedCodes((prev) => ({
                                                ...prev,
                                                [entry.code]: !prev[entry.code],
                                              }));
                                            }}
                                            className="h-4 w-4 rounded cursor-pointer"
                                          />
                                        </td>
                                        <td
                                          className={cn("sticky left-[50px] z-20 w-[140px] min-w-[140px] px-6 py-3.5 text-[13px] font-bold text-[#000000] dark:text-white align-top", cellBg(1))}
                                        >
                                          <div className="flex items-center gap-2">
                                            <span>{entry.code}</span>
                                            {isCopied && (
                                              <span className="text-[10px] font-semibold text-[#10b981] bg-[#e6fbf4] border border-[#10b981]/20 px-1.5 py-0.5 rounded animate-pulse shrink-0">
                                                Copied!
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td
                                          className={cn("sticky left-[190px] z-20 w-[280px] min-w-[280px] px-6 py-3.5 text-[13px] text-[#2b2f3a] dark:text-[#ffffff] font-normal leading-relaxed break-words align-top", cellBg(2))}
                                        >
                                          {entry.description}
                                        </td>
                                        {entry.code.startsWith("P.C. 9.1.") ? (
                                          <>
                                            <td
                                              colSpan={3}
                                              className={cn("px-6 py-3.5 text-[12px] font-semibold text-[#ef4444] text-center align-middle select-none", cellBg(4))}
                                            >
                                              Isolation
                                            </td>
                                            <td
                                              className={cn("px-6 py-3.5 text-[13px] text-[#2b2f3a] dark:text-[#ffffff] font-normal leading-relaxed break-words align-top", cellBg(6))}
                                            >
                                              {legalDescription}
                                            </td>
                                          </>
                                        ) : (
                                          <>
                                            <td
                                              className={cn("px-6 py-3.5 text-[13px] font-semibold text-[#10b981] align-top", cellBg(3))}
                                            >
                                              {entry.fine}
                                            </td>
                                            <td
                                              className={cn("px-6 py-3.5 text-[13px] font-medium text-[#303646] dark:text-[#ffffff] align-top", cellBg(4))}
                                            >
                                              {entry.time === "-" ? (
                                                <span className="text-[#8a90a0]">
                                                  —
                                                </span>
                                              ) : (
                                                entry.time
                                              )}
                                            </td>
                                            <td
                                              className={cn("px-6 py-3.5 align-top", cellBg(5))}
                                            >
                                              {isMisdemeanor ? (
                                                <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full bg-[#f0f1f3] text-[11px] font-bold text-[#303646]">
                                                  {entry.points || "—"}
                                                </span>
                                              ) : (
                                                renderStars(entry.stars)
                                              )}
                                            </td>
                                            <td
                                              className={cn("px-6 py-3.5 text-[13px] text-[#2b2f3a] dark:text-[#ffffff] font-normal leading-relaxed break-words align-top", cellBg(6))}
                                            >
                                              {legalDescription}
                                            </td>
                                          </>
                                        )}
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
              ) : (
                <div className="rounded-[10px] border border-[#e2e5ec] bg-white px-6 py-12 text-center">
                  <p className="text-[14px] text-[#666666]">
                    No entries found matching "{searchQuery}"
                  </p>
                </div>
              )
            )}

            {activeGuideSection === "radio" && (() => {
              const radio10Codes = [
                { code: "10-1", meaning: "Roll call/announcement (supervisors and above), all units return to headquarters" },
                { code: "10-2", meaning: "Negative" },
                { code: "10-3", meaning: "Stop transmitting" },
                { code: "10-4", meaning: "Acknowledged/affirmative" },
                { code: "10-5", meaning: "Repeat last transmission" },
                { code: "10-6", meaning: "Disregard the last transmission" },
                { code: "10-7", meaning: "Break at headquarters (AFK)" },
                { code: "10-8", meaning: "In-service/available" },
                { code: "10-9", meaning: "Out of service/unavailable" },
                { code: "10-10", meaning: "Training Shotsfired / Shots fired" },
                { code: "10-11", meaning: "Robbery in progress" },
                { code: "10-12", meaning: "Estimated Time of Arrival (ETA)" },
                { code: "10-13", meaning: "Agent/government employee down (Top Priority)" },
                { code: "10-15", meaning: "Suspect in custody" },
                { code: "10-16", meaning: "Injured civilian" },
                { code: "10-17", meaning: "Enroute" },
                { code: "10-19", meaning: "Return to the Headquarter" },
                { code: "10-20", meaning: "Location" },
                { code: "10-21", meaning: "Status check (Specify your current status and location)" },
                { code: "10-22", meaning: "Hostage situation" },
                { code: "10-23", meaning: "Arrived on scene" },
                { code: "10-32", meaning: "Backup needed (Specify the number of units and location)" },
                { code: "10-41", meaning: "Start of watch" },
                { code: "10-42", meaning: "End of watch" },
                { code: "10-51", meaning: "Vehicle traffic stop" },
                { code: "10-52", meaning: "Felony traffic stop" },
                { code: "10-70", meaning: "Suspect has warrants" },
                { code: "10-75", meaning: "Vehicle Wanted/Stolen" },
                { code: "10-80", meaning: "Vehicle pursuit" },
                { code: "10-80 FOXTROT", meaning: "Foot pursuit" },
                { code: "10-90", meaning: "Crime in Progress" },
                { code: "10-92", meaning: "Armed Robbery in Progress" },
                { code: "10-99", meaning: "Situation concluded" },
              ].filter(
                (item) =>
                  item.code.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                  item.meaning.toLowerCase().includes(searchQuery.toLowerCase().trim())
              );

              const statusCodes = [
                { code: "Code A", meaning: "Game Crash" },
                { code: "Code B", meaning: "Paused RP, Admin Situation" },
                { code: "Code 1", meaning: "Life-Threatening Emergency. Drop what you are doing and respond ASAP (Lights & Siren)" },
                { code: "Code 2", meaning: "Semi-Emergency (Lights Only)" },
                { code: "Code 3", meaning: "Emergency (Lights & Siren)" },
                { code: "Code 4", meaning: "Situation Under Control" },
                { code: "Code 5", meaning: "Terrorist Attack" },
                { code: "Code 6", meaning: "Out of Vehicle" },
                { code: "Code 7", meaning: "Conducting an Investigation" },
              ].filter(
                (item) =>
                  item.code.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                  item.meaning.toLowerCase().includes(searchQuery.toLowerCase().trim())
              );

              const hasResults = radio10Codes.length > 0 || statusCodes.length > 0;

              return (
                <div className="space-y-8">
                  {!hasResults ? (
                    <div className="rounded-[10px] border border-[#e2e5ec] bg-white px-6 py-12 text-center dark:border-[#222326] dark:bg-[#121213]">
                      <p className="text-[14px] text-[#666666] dark:text-[#a0a5b1]">
                        No radio codes found matching "{searchQuery}"
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* 10-Codes Section */}
                      {radio10Codes.length > 0 && (
                        <div className="space-y-3">
                          <h2 className="text-[18px] font-bold text-[#000000] dark:text-white">10-Codes</h2>
                          <div className="overflow-x-auto rounded-[8px] border border-[#e2e5ec] bg-white dark:border-[#222326] dark:bg-[#121213]">
                            <table className="w-full text-left table-fixed border-collapse">
                              <thead>
                                <tr className="bg-[#f9fbfc] text-[11px] font-semibold uppercase tracking-wide text-[#8a93a3] border-b border-[#e2e5ec] dark:bg-[#18191c] dark:border-[#222326] dark:text-[#888991]">
                                  <th className="w-[30%] px-6 py-3">Code</th>
                                  <th className="w-[70%] px-6 py-3">Meaning / Usage</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#f0f1f3] text-[13px] dark:divide-[#1f2023]">
                                {radio10Codes.map((item) => (
                                  <tr key={item.code} className="hover:bg-[#f9fbfc] dark:hover:bg-[#18191c]">
                                    <td className="px-6 py-3.5 font-bold text-[#000000] dark:text-white">{item.code}</td>
                                    <td className="px-6 py-3.5 text-[#4b5563] dark:text-[#a0a5b1]">{item.meaning}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Status Codes Section */}
                      {statusCodes.length > 0 && (
                        <div className="space-y-3">
                          <h2 className="text-[18px] font-bold text-[#000000] dark:text-white">Status Codes</h2>
                          <div className="overflow-x-auto rounded-[8px] border border-[#e2e5ec] bg-white dark:border-[#222326] dark:bg-[#121213]">
                            <table className="w-full text-left table-fixed border-collapse">
                              <thead>
                                <tr className="bg-[#f9fbfc] text-[11px] font-semibold uppercase tracking-wide text-[#8a93a3] border-b border-[#e2e5ec] dark:bg-[#18191c] dark:border-[#222326] dark:text-[#888991]">
                                  <th className="w-[30%] px-6 py-3">Code</th>
                                  <th className="w-[70%] px-6 py-3">Meaning / Usage</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#f0f1f3] text-[13px] dark:divide-[#1f2023]">
                                {statusCodes.map((item) => (
                                  <tr key={item.code} className="hover:bg-[#f9fbfc] dark:hover:bg-[#18191c]">
                                    <td className="px-6 py-3.5 font-bold text-[#000000] dark:text-white">{item.code}</td>
                                    <td className="px-6 py-3.5 text-[#4b5563] dark:text-[#a0a5b1]">{item.meaning}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })()}

            {activeGuideSection === "illegal-items" && (() => {
              const allGroupsEN2 = [
                {
                  category: "Firearms and Related Items",
                  items: [
                    { item: "All Firearms without a Serial/AMMO Number", note: "" },
                    { item: "Armoured Vest that is dyed or colored in any way", note: "Note: Only the default grey vests from an Ammunation are legal to possess." },
                    { item: "Components or parts for any type of firearms", note: "" },
                  ],
                },
                {
                  category: "State Issued Firearms and Related Items",
                  items: [
                    { item: "State Issued Firearms", note: "" },
                    { item: "Armoured Vest with government markings", note: "" },
                    { item: "Baton/Nightstick", note: "" },
                    { item: "Stun-Gun/Taser", note: "" },
                  ],
                },
                {
                  category: "State Issued Masks",
                  items: [
                    { item: "Balaclava", note: "" },
                    { item: "EMS Medical Mask", note: "Exception: Employee of EMS or authorised State Employee" },
                  ],
                },
                {
                  category: "Illicit Substances / Narcotics",
                  items: [
                    { item: "Cocaine", note: "" },
                    { item: "Marijuana / drugs", note: "" },
                  ],
                },
                {
                  category: "Items Prohibited from Selling in Public Shops",
                  items: [
                    { item: "Any kind of Firearms or Ammunition for Firearms", note: "" },
                    { item: "Any kind of Alcohol or Drugs", note: "" },
                    { item: "Any kind of Medical Products (pills, medkits, etc.)", note: "" },
                    { item: "Any type of Licence", note: "" },
                    { item: "Armoured Vest with state markings (GOV/FIB/LSPD/SAHP/NG)", note: "" },
                    { item: "Components or parts for any type of firearm", note: "" },
                  ],
                },
                {
                  category: "Items Used in the Commission of Criminal Activity",
                  items: [
                    { item: "Key Sets / Lockpicks", note: "" },
                    { item: "False or Fake Documents", note: "" },
                    { item: "Flash Drive with Virus", note: "" },
                    { item: "Vehicle Scanner", note: "" },
                    { item: "People Scanner", note: "" },
                    { item: "Paper for Counterfeit Money", note: "" },
                    { item: "Counterfeit Money", note: "" },
                    { item: "Engine Blocker", note: "" },
                    { item: "Anti-Radar", note: "" },
                    { item: "Hemp seeds / Cannabis Seed", note: "" },
                  ],
                },
              ];

              const allGroupsEN1 = [
                {
                  category: "AI.1 Weapons and Armors",
                  items: [
                    { item: "Firearm without Serial Number", note: "" },
                    { item: "State issued Weapon or melee", note: "Exception: employees of state organization with authorization from leader of state organization" },
                    { item: "Ballistic vest with state markings", note: "Exception: employees of state organization with authorization from leader of state organization" },
                    { item: "Ballistic vest of any color except grey, hypo or \"skinned\" Grey vests", note: "" },
                    { item: "Spare Weapon Parts", note: "" },
                  ],
                },
                {
                  category: "AI.2 State issued Equipment",
                  items: [
                    { item: "State issued facial coverings", note: "" },
                    { item: "Balaclava or Medical masks", note: "" },
                  ],
                },
                {
                  category: "AI.3 Illicit Substances",
                  items: [
                    { item: "Cocaine", note: "" },
                    { item: "Marijuana / Drugs", note: "" },
                    { item: "Ingredients for Cocaine", note: "" },
                  ],
                },
                {
                  category: "AI.4 Items Prohibited Selling in Public Shops",
                  items: [
                    { item: "Any Kind of Alcohol", note: "" },
                    { item: "Any Kind of Medical Products (Pills, Medkits, etc.)", note: "" },
                    { item: "Any Type of License", note: "" },
                  ],
                },
                {
                  category: "AI.5 Illicit Technologies and Other Prohibited Items",
                  items: [
                    { item: "Vehicle Scanner", note: "" },
                    { item: "USB drive with malicious software", note: "" },
                    { item: "Engine blocker (for civilians)", note: "" },
                    { item: "Search Base Hack", note: "" },
                    { item: "Lockpicks", note: "" },
                    { item: "Anti-Radar Equipment", note: "" },
                    { item: "Counterfeit cash", note: "" },
                    { item: "Stolen Goods (TV's, Furniture, Box of things)", note: "" },
                    { item: "People Scanner", note: "Exception: Dept Collectors carrying out their work" },
                    { item: "Fake documentation", note: "" },
                    { item: "Ingredients for cocaine", note: "" },
                    { item: "Spare weapons parts", note: "" },
                    { item: "Production submodules for cocaine, marijuana and ammunition", note: "" },
                  ],
                },
              ];

              const allGroups = server === 'en1' ? allGroupsEN1 : allGroupsEN2;

              const filteredGroups = allGroups
                .map((group) => {
                  const filteredItems = group.items.filter(
                    (row) =>
                      row.item.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                      row.note.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                      group.category.toLowerCase().includes(searchQuery.toLowerCase().trim())
                  );
                  return { ...group, items: filteredItems };
                })
                .filter((group) => group.items.length > 0);

              return (
                <div className="space-y-8">
                  <h2 className="text-[18px] font-bold text-[#000000] dark:text-white">List Of Illegal Items</h2>

                  {filteredGroups.length === 0 ? (
                    <div className="rounded-[10px] border border-[#e2e5ec] bg-white px-6 py-12 text-center dark:border-[#222326] dark:bg-[#121213]">
                      <p className="text-[14px] text-[#666666] dark:text-[#a0a5b1]">
                        No illegal items found matching "{searchQuery}"
                      </p>
                    </div>
                  ) : (
                    filteredGroups.map((group) => (
                      <div key={group.category} className="space-y-3">
                        <h3 className="text-[15px] font-bold text-[#111827] dark:text-white flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                          {group.category}
                          {group.category === "AI.4 Items Prohibited Selling in Public Shops" && (
                            <span className="inline-block rounded-[4px] bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 text-[12px] text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 font-medium ml-2">
                              Note: Otherwise legal to possess
                            </span>
                          )}
                        </h3>
                        <div className="overflow-x-auto rounded-[8px] border border-[#e2e5ec] bg-white dark:border-[#222326] dark:bg-[#121213]">
                          <table className="w-full text-left table-fixed border-collapse">
                            <thead>
                              <tr className="bg-[#f9fbfc] text-[11px] font-semibold uppercase tracking-wide text-[#8a93a3] border-b border-[#e2e5ec] dark:bg-[#18191c] dark:border-[#222326] dark:text-[#888991]">
                                <th className="w-[55%] px-6 py-3">Illegal Item</th>
                                <th className="w-[45%] px-6 py-3">Notes & Exceptions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f0f1f3] text-[13px] dark:divide-[#1f2023]">
                              {group.items.map((row) => (
                                <tr key={row.item} className="hover:bg-[#f9fbfc] dark:hover:bg-[#18191c]">
                                  <td className="px-6 py-3.5 font-medium text-[#000000] dark:text-white">
                                    {row.item}
                                  </td>
                                  <td className="px-6 py-3.5 text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                                    {row.note ? (
                                      <span className="inline-block rounded-[4px] bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 font-medium">
                                        {row.note}
                                      </span>
                                    ) : (
                                      <span className="text-[#9ca3af] dark:text-[#52525b]">—</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })()}

            {activeGuideSection === "miranda" && (
              <div className="space-y-6">
                <h2 className="text-[18px] font-bold text-[#000000] dark:text-white">Miranda Rights And Warnings</h2>

                {/* Standard Miranda Rights Card */}
                <div className="rounded-[8px] border border-[#e2e5ec] bg-white p-6 dark:border-[#222326] dark:bg-[#121213] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[15px] font-bold text-[#000000] dark:text-white flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      Standard Miranda Rights
                    </h3>
                    <span className="text-[11px] font-semibold text-[#8a93a3] dark:text-[#888991] uppercase tracking-wider bg-[#f9fbfc] dark:bg-[#18191c] px-2.5 py-1 rounded-[4px] border border-[#e2e5ec] dark:border-[#222326]">
                      Standard Operating Protocol
                    </span>
                  </div>
                  <blockquote className="text-[14px] leading-relaxed text-[#374151] dark:text-[#d1d5db] bg-[#f9fbfc] dark:bg-[#18191c] p-4 rounded-[8px] border-l-4 border-blue-500 font-medium italic">
                    "You have the right to remain silent. Anything you say can and will be used against you in a court of law. You have the right to an attorney. If you cannot afford an attorney, one will be provided for you, if available. Do you understand these rights as they have been read to you?"
                  </blockquote>
                </div>

                {/* Martial Law Miranda Warning Card */}
                <div className="rounded-[8px] border border-red-200 bg-white p-6 dark:border-red-950/50 dark:bg-[#121213] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[15px] font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500 shrink-0 animate-pulse" />
                      Martial Law Miranda Warning
                    </h3>
                    <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-[4px] border border-red-200 dark:border-red-900/50">
                      Emergency Protocol
                    </span>
                  </div>
                  <blockquote className="text-[14px] leading-relaxed text-[#374151] dark:text-[#d1d5db] bg-red-50/40 dark:bg-red-950/20 p-4 rounded-[8px] border-l-4 border-red-500 font-medium italic space-y-2">
                    <p>"You have the right to remain silent.</p>
                    <p className="font-semibold text-red-700 dark:text-red-300 not-italic">The State is currently under Martial Law.</p>
                    <p className="not-italic">There is no bail, attorney, lawyer, or other legal services available at this time.</p>
                    <p className="font-semibold text-black dark:text-white not-italic">Do you understand these rights as they have been read to you?"</p>
                  </blockquote>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      </OrganizerLayout>
    </>
  );
}

export default PatrolmansGuidePage;
