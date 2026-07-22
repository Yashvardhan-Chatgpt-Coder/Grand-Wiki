import { useState, useCallback, useEffect, useRef } from "react";
import { Search, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContextMenu } from "@/components/dashboard/ContextMenu";
import {
  isCommandPinned,
  isGroupPinned,
  togglePinCommand,
  togglePinGroup,
} from "@/lib/pinned-store";
import { queue } from "@/components/ui/Toast";
import { usePageSearchShortcut } from "@/hooks/use-page-search-shortcut";
import { useCurrentUser } from "@/hooks/use-current-user";

interface CommandItem {
  text: string;
}

interface CommandGroup {
  title: string;
  commands: CommandItem[];
}

interface CommandCategory {
  title: string;
  groups: CommandGroup[];
}

type OrganizationCommandsProps = {
  orgLabel?: string;
};

const BASE_CATEGORIES: CommandCategory[] = [
  {
    title: "Duty & Identification",
    groups: [
      {
        title: "On Duty",
        commands: [
          { text: "/me turns on bodycam" },
          { text: "/do makes sure its recording and uploading to FIB cloud server" },
          { text: "/me connects PDA to FIB cloud server" },
          { text: "{badge} to dispatch show me going 10-41 at {time}" },
        ],
      },
      {
        title: "Off Duty",
        commands: [
          { text: "/me turns off bodycam" },
          { text: "/do makes sure it has been successfully recorded and uploaded to FIB cloud server" },
          { text: "/me disconnects the PDA from FIB cloud server" },
          { text: "{badge} to dispatch show me going 10-42 at {time}" },
        ],
      },
      {
        title: "PDA Connect",
        commands: [
          { text: "/me connect PDA to FIB cloud server" },
        ],
      },
      {
        title: "Putting ID in Car Trunk",
        commands: [
          { text: "/me puts my ID card in the car trunk" },
        ],
      },
      {
        title: "Taking ID from Car Trunk",
        commands: [
          { text: "/me take the ID card from cark trunk" },
        ],
      },
    ],
  },
  {
    title: "Drone & Radar Operations",
    groups: [
      {
        title: "Taking Drone",
        commands: [
          { text: "/me takes out drone from locker and put it in the backpack" },
        ],
      },
      {
        title: "Drone Activation",
        commands: [
          { text: "/me launches drone" },
        ],
      },
      {
        title: "Radar Deployment",
        commands: [
          { text: "/me sets the radar" },
          { text: "/me picks up the radar" },
        ],
      },
    ],
  },
  {
    title: "Evidence & Archiving",
    groups: [
      {
        title: "Refresh Bodycam",
        commands: [
          { text: "/me refreshes bodycam" },
          { text: "/do it is recording" },
        ],
      },
      {
        title: "Save Bodycam",
        commands: [
          { text: "/me saves bodycam" },
        ],
      },
      {
        title: "Handing Bodycam SSD to Lawyers",
        commands: [
          { text: "/me uploads the bodycam footage in a SSD Card" },
          { text: "/me hands over the SSD card to (lawyer's name)" },
        ],
      },
    ],
  },
];

function formatForOrg(text: string, orgLabel: string) {
  return text.replace(/\bFIB\b/g, orgLabel);
}

export function FIBCommands({ orgLabel = "FIB" }: OrganizationCommandsProps) {
  const { user } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  usePageSearchShortcut(searchInputRef);
  
  const [badgeNumber, setBadgeNumber] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("grandrp-badge-number") || "XXX";
    }
    return "XXX";
  });

  const effectiveBadge = user?.badgeNumber || badgeNumber;

  const [londonTime, setLondonTime] = useState("");

  useEffect(() => {
    const update = () => {
      setLondonTime(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "Europe/London",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        }).format(new Date())
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCommandText = useCallback((text: string) => {
    return formatForOrg(
      text
        .replace("{badge}", effectiveBadge)
        .replace("{time}", londonTime),
      orgLabel,
    );
  }, [effectiveBadge, londonTime, orgLabel]);

  const handleBadgeChange = (val: string) => {
    const cleaned = val.trim();
    setBadgeNumber(cleaned || "XXX");
    if (typeof window !== "undefined") {
      localStorage.setItem("grandrp-badge-number", cleaned || "XXX");
    }
  };

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    isOpen: boolean;
    type: "command" | "group";
    payload: { categoryTitle: string; scenario: string; cmdText?: string } | null;
  }>({ x: 0, y: 0, isOpen: false, type: "command", payload: null });

  const q = searchQuery.toLowerCase().trim();

  // Filter categories, groups, and commands dynamically based on the search query
  const filteredCategories = BASE_CATEGORIES.map((cat) => {
    const matchingGroups = cat.groups
      .map((group) => {
        const titleMatch = group.title.toLowerCase().includes(q);
        const matchingCommands = group.commands.filter((cmd) =>
          formatCommandText(cmd.text).toLowerCase().includes(q)
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

  const handleCopy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Fallback copy execution
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
      const isNowPinned = togglePinGroup("fib", payload.categoryTitle, payload.scenario);
      queue.add(
        {
          title: isNowPinned ? "Group Pinned" : "Group Unpinned",
          description: `"${payload.scenario}" has been updated.`,
          variant: "success"
        },
        { timeout: 2000 }
      );
    } else if (type === "command") {
      const isNowPinned = togglePinCommand("fib", payload.categoryTitle, payload.scenario, payload.cmdText || "");
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
      return isGroupPinned("fib", payload.categoryTitle, payload.scenario);
    }
    return isCommandPinned("fib", payload.categoryTitle, payload.scenario, payload.cmdText || "");
  };

  const categoryId = (title: string) =>
    `fib-category-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  const handleJumpToCategory = (title: string) => {
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
  };

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="sticky top-0 z-40 -mx-8 border-b border-[#e7e9f0] bg-white px-8 pb-4 pt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-full max-w-[280px] shrink-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a90a0]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search commands or procedures... (Ctrl H)"
                className="h-9 w-full rounded-[6px] border border-[#e2e5ec] bg-white pl-9 pr-3 text-[13px] text-[#000000] outline-none transition-colors focus:border-[#000000]"
              />
            </div>
            <div className="flex items-center gap-1.5 text-[12px] bg-[#f8f9fa] border border-[#e2e5ec] rounded-[6px] px-3 h-9 font-semibold text-[#4d5568]">
              <span>Badge:</span>
              <span className="font-bold text-black">{effectiveBadge}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {filteredCategories.map((category) => (
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

      <div className="space-y-6 pt-6">
      {filteredCategories.length > 0 ? (
        <div className="space-y-8">
          {filteredCategories.map((category, catIdx) => {
            return (
              <div key={category.title} id={categoryId(category.title)} className="scroll-mt-[88px] space-y-4">
                <h2 className="text-[15px] font-bold text-[#000000]">
                  {category.title}
                </h2>
                
                <div className="overflow-x-auto rounded-[8px] border border-[#e2e5ec] bg-white">
                  <table className="w-full text-left table-fixed border-collapse">
                    <thead>
                      <tr className="bg-[#f9fbfc] text-[11px] font-semibold uppercase tracking-wide text-[#8a93a3] border-b border-[#e2e5ec]">
                        <th className="w-[30%] px-6 py-3">Scenario / Trigger</th>
                        <th className="w-[70%] px-6 py-3">Command Text (Click row to copy)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f1f3]">
                      {category.groups.flatMap((group, groupIdx) => 
                        group.commands.map((cmd, cmdIdx) => {
                          const uniqueId = `${catIdx}-${groupIdx}-${cmdIdx}`;
                          const isCopied = copiedId === uniqueId;
                          const isCmdPinnedState = isCommandPinned("fib", category.title, group.title, cmd.text);
                          const isGroupPinnedState = isGroupPinned("fib", category.title, group.title);

                          return (
                            <tr 
                              key={`${group.title}-${cmdIdx}`} 
                              onClick={(e) => {
                                if ((e.target as HTMLElement).closest(".scenario-cell")) {
                                  return;
                                }
                                handleCopy(formatCommandText(cmd.text), uniqueId);
                              }}
                              className="cursor-pointer select-none"
                            >
                              {cmdIdx === 0 ? (
                                <td 
                                  rowSpan={group.commands.length} 
                                  onContextMenu={(e) => handleGroupContextMenu(e, category.title, group.title)}
                                  className="w-[30%] px-6 py-4 text-[13px] font-bold text-[#000000] align-top border-r border-[#f0f1f3] bg-[#fcfdfe] break-words cursor-context-menu select-none scenario-cell"
                                >
                                  <div className="flex items-center gap-2">
                                    <span>{group.title}</span>
                                    {isGroupPinnedState && (
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
                                    {isCmdPinnedState && (
                                      <Pin className="h-3 w-3 text-[#8a90a0] shrink-0" />
                                    )}
                                    <span>{formatCommandText(cmd.text)}</span>
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
            );
          })}
        </div>
      ) : (
        <div className="rounded-[10px] border border-[#e2e5ec] bg-white px-6 py-12 text-center">
          <p className="text-[14px] text-[#666666]">
            No commands found matching "{searchQuery}"
          </p>
        </div>
      )}

      <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        isOpen={contextMenu.isOpen}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
        onAction={handleContextMenuAction}
        isPinned={isCurrentPinned()}
      />
      </div>
    </div>
  );
}
