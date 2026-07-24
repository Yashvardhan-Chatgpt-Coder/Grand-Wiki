import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Search, Gavel, Pin } from "lucide-react";
import { OrganizerLayout } from "@/components/dashboard/OrganizerLayout";
import { SoftwareHeader } from "@/components/dashboard/SoftwareHeader";
import { cn } from "@/lib/utils";
import { ContextMenu } from "@/components/dashboard/ContextMenu";
import { queue } from "@/components/ui/Toast";
import {
  isCommandPinned,
  isGroupPinned,
  togglePinCommand,
  togglePinGroup
} from "@/lib/pinned-store";
import { usePageSearchShortcut } from "@/hooks/use-page-search-shortcut";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/arrest-procedure")({
  head: () => ({
    meta: [{ title: "Arrest Procedure Tool | Grand Wiki" }],
  }),
  component: ArrestProcedurePage,
});

export interface CommandItem {
  text: string;
}

export interface CommandGroup {
  title: string;
  commands: CommandItem[];
}

export interface CommandCategory {
  title: string;
  groups: CommandGroup[];
}

export const ARREST_CATEGORIES: CommandCategory[] = [];

function ArrestProcedurePage() {
  const { displayName, organization, refresh, loading } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  usePageSearchShortcut(searchInputRef);

  // Listen for user updates
  useEffect(() => {
    const handleUserUpdate = () => {
      refresh();
    };
    window.addEventListener("esports:user-updated", handleUserUpdate);
    return () => window.removeEventListener("esports:user-updated", handleUserUpdate);
  }, [refresh]);

  // Build dynamic ARREST_CATEGORIES with user data
  const ARREST_CATEGORIES = useMemo<CommandCategory[]>(() => {
    // Use displayName or fallback to "Your Name" if not loaded
    const userName = displayName || "Your Name";
    const userOrg = organization || "LSPD";
    
    return [
      {
        title: "Arrest Flow",
        groups: [
          {
            title: "Cuffing",
            commands: [
              { text: "I am going to cuff you." },
              { text: "You are being under arrest for" },
              { text: `I am ${userName} from ${userOrg}.` },
            ],
          },
          {
            title: "Movement & Control",
            commands: [
              { text: "I am going to drag you by your arm." },
              { text: "I am going to release you by your arm." },
              { text: "I am going to put you on the floor." },
              { text: "I am going to make you stand now." },
            ],
          },
          {
            title: "Vehicle Transport",
            commands: [
              { text: "I am going to put you inside the vehicle. Please watch your head." },
              { text: "I am going to take you out of the vehicle. Please watch your head." },
            ],
          },
          {
            title: "Reading Miranda Rights",
            commands: [
              { text: "You have the right to remain silent" },
              { text: "Anything you say can and will be used against you in the court of law." },
              { text: "You have the right to an attorney." },
              { text: "If you cannot afford an attorney, one will be provided to you by the state if available." },
              { text: "Do you understand your rights or do you want me to repeat again ?" },
              { text: "Okay I am going to repeat it again." },
              { text: "Taking your silence as a yes." },
            ],
          },
          {
            title: "Issuing Jumpsuit",
            commands: [
              { text: "/me Picks Up A Freesize Jumsuit." },
              { text: "/me Places A Freesize Jumsuit." },
            ],
          },
          {
            title: "Arresting Commands",
            commands: [
              { text: "I am going to put you behind the bars." },
              { text: "I am going to put you in the isolation cell." },
            ],
          },
        ],
      },
      {
        title: "Search & Confiscation",
        groups: [
          {
            title: "Confiscation and Search",
            commands: [
              { text: "I am going to search you." },
              { text: "I am going to confiscate your illegal items." },
              { text: "I am going to tear off your mask." },
              { text: "I am going to check your back pockets for identification." },
              { text: "Uncuffing you. Remove your mask and show me your passport within 5 seconds." },
              { text: "/try Takes cell phone and radio out." },
            ],
          },
        ],
      },
      {
        title: "Legal Handling",
        groups: [
          {
            title: "Footage Handling",
            commands: [
              { text: "/me Stops recording." },
              { text: "/me Uploads the bodycam footage in a SD Card." },
              { text: "/me Hands over the SD card to (lawyer's name)." },
            ],
          },
        ],
      },
    ];
  }, [displayName, organization]);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    isOpen: boolean;
    type: "command" | "group";
    payload: { categoryTitle: string; scenario: string; cmdText?: string } | null;
  }>({ x: 0, y: 0, isOpen: false, type: "command", payload: null });

  const handleGroupContextMenu = (e: React.MouseEvent, categoryTitle: string, scenario: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      isOpen: true,
      type: "group",
      payload: { categoryTitle, scenario }
    });
  };

  const handleCommandContextMenu = (e: React.MouseEvent, cmdText: string, scenario: string, categoryTitle: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      isOpen: true,
      type: "command",
      payload: { cmdText, scenario, categoryTitle }
    });
  };

  const handleContextMenuAction = () => {
    if (!contextMenu.payload) return;
    const { type, payload } = contextMenu;
    if (type === "group") {
      const isNowPinned = togglePinGroup("arrest", payload.categoryTitle, payload.scenario);
      queue.add(
        {
          title: isNowPinned ? "Group Pinned" : "Group Unpinned",
          description: `"${payload.scenario}" has been updated.`,
          variant: "success"
        },
        { timeout: 2000 }
      );
    } else if (type === "command") {
      const isNowPinned = togglePinCommand("arrest", payload.categoryTitle, payload.scenario, payload.cmdText || "");
      queue.add(
        {
          title: isNowPinned ? "Command Pinned" : "Command Unpinned",
          description: `"${payload.cmdText}" has been updated.`,
          variant: "success"
        },
        { timeout: 2000 }
      );
    }
    setContextMenu(prev => ({ ...prev, isOpen: false }));
  };

  const isCurrentPinned = () => {
    if (!contextMenu.payload) return false;
    const { type, payload } = contextMenu;
    if (type === "group") {
      return isGroupPinned("arrest", payload.categoryTitle, payload.scenario);
    }
    return isCommandPinned("arrest", payload.categoryTitle, payload.scenario, payload.cmdText || "");
  };

  const q = searchQuery.toLowerCase().trim();

  const filteredCategories = useMemo(() => {
    return ARREST_CATEGORIES.map((cat) => {
      const matchingGroups = cat.groups
        .map((group) => {
          const titleMatch = group.title.toLowerCase().includes(q);
          const matchingCommands = group.commands.filter((cmd) =>
            cmd.text.toLowerCase().includes(q)
          );

          if (titleMatch) {
            return group;
          }
          if (matchingCommands.length > 0) {
            return { ...group, commands: matchingCommands };
          }
          return null;
        })
        .filter(Boolean) as CommandGroup[];

      if (matchingGroups.length > 0) {
        return { ...cat, groups: matchingGroups };
      }
      return null;
    }).filter(Boolean) as CommandCategory[];
  }, [q, ARREST_CATEGORIES]);

  const categoryId = (title: string) =>
    `arrest-category-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  const handleJumpToCategory = useCallback((title: string) => {
    const scroll = () => {
      document.getElementById(categoryId(title))?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    };

    if (searchQuery) {
      setSearchQuery("");
      setTimeout(scroll, 50);
      return;
    }
    scroll();
  }, [searchQuery]);

  const handleCopy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  }, []);

  return (
    <OrganizerLayout header={<SoftwareHeader title="Arrest Procedure Tool" />}>
      <div className="flex min-w-0 flex-1 flex-col min-h-0 bg-white" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
        <header className="shrink-0 border-b border-[#e7e9f0] bg-white px-8 py-6">
          <div className="flex items-center gap-3">
            <Gavel className="h-8 w-8 text-black shrink-0" />
            <h1 className="text-[30px] font-semibold text-[#000000]">Arrest Procedure Tool</h1>
          </div>
        </header>

        <main className="relative min-h-0 flex-1 overflow-y-auto px-8 pb-8 pt-0">
          <div className="sticky top-0 z-40 -mx-8 px-8 bg-white border-b border-[#e7e9f0] pb-4 pt-6">
            <div className="mx-auto max-w-[1200px] flex items-center justify-between gap-4">
              <div className="relative w-full max-w-[320px] shrink-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a90a0]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search arrest commands... (Ctrl H)"
                  className="h-9 w-full rounded-[6px] border border-[#e2e5ec] bg-white pl-9 pr-9 text-[13px] text-[#000000] outline-none transition-colors focus:border-[#000000]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a90a0] hover:text-[#000000] transition-colors"
                    aria-label="Clear search"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                {ARREST_CATEGORIES.map((category) => (
                  <button
                    key={category.title}
                    type="button"
                    onClick={() => handleJumpToCategory(category.title)}
                    className="h-9 cursor-pointer rounded-[6px] border border-[#e2e5ec] bg-[#f4f5f7] px-3 text-[12px] font-semibold text-[#000000] transition-colors hover:bg-[#eef0f4] select-none"
                  >
                    {category.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-[1200px] mt-6 space-y-6">
            {filteredCategories.length > 0 ? (
              <div className="space-y-8">
                {filteredCategories.map((category, catIdx) => (
                  <div
                    key={category.title}
                    id={categoryId(category.title)}
                    className="scroll-mt-[88px] space-y-4"
                  >
                    <h2 className="text-[15px] font-bold text-[#000000]">
                      {category.title}
                    </h2>

                    <div className="rounded-[8px] border border-[#e2e5ec] bg-white overflow-hidden">
                      <table className="w-full text-left table-fixed border-collapse">
                        <thead>
                          <tr className="bg-[#f9fbfc] text-[11px] font-semibold uppercase tracking-wide text-[#8a93a3] border-b border-[#e2e5ec]">
                            <th className="w-[30%] px-6 py-3">Scenario / Phase</th>
                            <th className="w-[70%] px-6 py-3">Command Text (Click row to copy)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f0f1f3]">
                          {category.groups.flatMap((group, groupIdx) =>
                            group.commands.map((cmd, cmdIdx) => {
                              const uniqueId = `${catIdx}-${groupIdx}-${cmdIdx}`;
                              const isCopied = copiedId === uniqueId;

                              return (
                                <tr
                                  key={`${group.title}-${cmdIdx}`}
                                  onClick={(e) => {
                                    if ((e.target as HTMLElement).closest(".scenario-cell")) {
                                      return;
                                    }
                                    handleCopy(cmd.text, uniqueId);
                                  }}
                                  className="cursor-pointer select-none"
                                >
                                  {cmdIdx === 0 ? (
                                    <td
                                      rowSpan={group.commands.length}
                                      onContextMenu={(e) => handleGroupContextMenu(e, category.title, group.title)}
                                      className="w-[30%] px-6 py-4 text-[13px] font-bold text-[#000000] align-top border-r border-[#f0f1f3] bg-[#fcfdfe] break-words select-none scenario-cell cursor-context-menu"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span>{group.title}</span>
                                        {isGroupPinned("arrest", category.title, group.title) && (
                                          <Pin className="h-3.5 w-3.5 text-[#8a90a0] shrink-0" />
                                        )}
                                      </div>
                                    </td>
                                  ) : null}
                                  <td
                                    onContextMenu={(e) => handleCommandContextMenu(e, cmd.text, group.title, category.title)}
                                    className={cn(
                                      "w-[70%] px-6 py-4 text-[13px] leading-relaxed break-words transition-all duration-150 cursor-pointer",
                                      isCopied
                                        ? "bg-[#e6fbf4] text-[#10b981] border-l-[3px] border-l-[#10b981]"
                                        : "text-[#2b2f3a] hover:bg-[#f9fbfc] active:bg-[#f3f4f6]"
                                    )}
                                  >
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-2 min-w-0">
                                        {isCommandPinned("arrest", category.title, group.title, cmd.text) && (
                                          <Pin className="h-3 w-3 text-[#8a90a0] shrink-0" />
                                        )}
                                        <span>{cmd.text}</span>
                                      </div>
                                      {isCopied && (
                                        <span className="text-[11px] font-semibold text-[#10b981] bg-[#e6fbf4] px-2.5 h-5 flex items-center rounded-[6px] border border-[#10b981] shrink-0">
                                          Copied
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[10px] border border-[#e2e5ec] bg-white px-6 py-12 text-center">
                <p className="text-[14px] text-[#666666]">
                  No commands found matching "{searchQuery}"
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        isOpen={contextMenu.isOpen}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
        onAction={handleContextMenuAction}
        isPinned={isCurrentPinned()}
      />
    </OrganizerLayout>
  );
}
