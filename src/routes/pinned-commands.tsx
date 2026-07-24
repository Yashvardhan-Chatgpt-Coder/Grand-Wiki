import { useState, useCallback, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { OrganizerLayout } from "@/components/dashboard/OrganizerLayout";
import { SoftwareHeader } from "@/components/dashboard/SoftwareHeader";
import { Search, Pin } from "lucide-react";
import { queue } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { ContextMenu } from "@/components/dashboard/ContextMenu";
import {
  getPinnedCommands,
  getPinnedGroups,
  togglePinCommand,
  togglePinGroup,
  isCommandPinned,
  isGroupPinned,
} from "@/lib/pinned-store";
import { ARREST_CATEGORIES } from "@/routes/arrest-procedure";
import { usePageSearchShortcut } from "@/hooks/use-page-search-shortcut";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/pinned-commands")({
  head: () => ({
    meta: [{ title: "Pinned Commands | Grand Wiki" }],
  }),
  component: PinnedCommandsPage,
});

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

const ALL_ORG_COMMANDS: Record<string, { orgName: string; categories: CommandCategory[] }> = {
  fib: {
    orgName: "Federal Investigation Bureau",
    categories: [
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
            title: "Going as UC (Undercover)",
            commands: [
              { text: "/me turns on bodycam" },
              { text: "/me straps ballistic waterproof hidden bodycam in belt" },
              { text: "/do it is recording and uploading to FIB cloud server" },
              { text: "/me connects PDA to nearest cell tower and FIB cloud server" },
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
            title: "Drone While Undercover",
            commands: [
              { text: "/me takes out drone from backpack and launches it" },
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
    ],
  },
  arrest: {
    orgName: "Arrest Procedure",
    categories: ARREST_CATEGORIES as any,
  },
};

const ORG_LOGOS: Record<string, string> = {
  lspd: "LSPD.png",
  fib: "FIB.webp",
  sahp: "SAHP.png",
  ng: "NG.png",
  government: "Government.png",
  ems: "EMS.png",
  lifeinvader: "Lifeinvader.png"
};

interface ResolvedCommand {
  orgKey: string;
  orgName: string;
  category: string;
  group: string;
  command: string;
}

function PinnedCommandsPage() {
  const { badgeNumber: userBadgeNumber } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  usePageSearchShortcut(searchInputRef);

  const effectiveBadge = userBadgeNumber || "XXX";

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
    return text
      .replace("{badge}", effectiveBadge)
      .replace("{time}", londonTime);
  }, [effectiveBadge, londonTime]);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    isOpen: boolean;
    type: "command" | "group";
    payload: { orgKey: string; categoryTitle: string; scenario: string; cmdText?: string } | null;
  }>({ x: 0, y: 0, isOpen: false, type: "command", payload: null });

  // Resolve pinned items to full command lists
  const getResolvedPinnedCommands = (): ResolvedCommand[] => {
    const pinnedGroups = getPinnedGroups();
    const pinnedCmds = getPinnedCommands();
    const resolved: ResolvedCommand[] = [];

    // 1. Process Pinned Groups
    pinnedGroups.forEach((pGroup) => {
      const orgData = ALL_ORG_COMMANDS[pGroup.orgKey];
      if (!orgData) return;
      const catData = orgData.categories.find((c) => c.title === pGroup.category);
      if (!catData) return;
      const groupData = catData.groups.find((g) => g.title === pGroup.group);
      if (!groupData) return;

      groupData.commands.forEach((cmd) => {
        resolved.push({
          orgKey: pGroup.orgKey,
          orgName: orgData.orgName,
          category: pGroup.category,
          group: pGroup.group,
          command: cmd.text,
        });
      });
    });

    // 2. Process Pinned Commands (avoid duplicates)
    pinnedCmds.forEach((pCmd) => {
      const alreadyAdded = resolved.some(
        (r) =>
          r.orgKey === pCmd.orgKey &&
          r.category === pCmd.category &&
          r.group === pCmd.group &&
          r.command === pCmd.command
      );
      if (alreadyAdded) return;

      const orgData = ALL_ORG_COMMANDS[pCmd.orgKey];
      resolved.push({
        orgKey: pCmd.orgKey,
        orgName: orgData ? orgData.orgName : pCmd.orgKey.toUpperCase(),
        category: pCmd.category,
        group: pCmd.group,
        command: pCmd.command,
      });
    });

    return resolved;
  };

  // Triggered by dummy state update
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _refresh = refreshTrigger;
  const resolvedList = getResolvedPinnedCommands();

  // Search filtering
  const q = searchQuery.toLowerCase().trim();
  const filteredList = resolvedList.filter((item) => {
    return (
      formatCommandText(item.command).toLowerCase().includes(q) ||
      item.group.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.orgName.toLowerCase().includes(q)
    );
  });

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

  const handleGroupContextMenu = (
    e: React.MouseEvent,
    orgKey: string,
    category: string,
    group: string
  ) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      isOpen: true,
      type: "group",
      payload: { orgKey, categoryTitle: category, scenario: group }
    });
  };

  const handleCommandContextMenu = (
    e: React.MouseEvent,
    orgKey: string,
    category: string,
    group: string,
    command: string
  ) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      isOpen: true,
      type: "command",
      payload: { orgKey, categoryTitle: category, scenario: group, cmdText: command }
    });
  };

  const handleContextMenuAction = () => {
    if (!contextMenu.payload) return;
    const { type, payload } = contextMenu;
    
    if (type === "group") {
      togglePinGroup(payload.orgKey, payload.categoryTitle, payload.scenario);
      queue.add(
        {
          title: "Group Unpinned",
          description: `"${payload.scenario}" removed from pins.`,
          variant: "success",
        },
        { timeout: 2000 }
      );
    } else {
      togglePinCommand(payload.orgKey, payload.categoryTitle, payload.scenario, payload.cmdText || "");
      queue.add(
        {
          title: "Command Unpinned",
          description: `"${payload.cmdText}" removed from pins.`,
          variant: "success",
        },
        { timeout: 2000 }
      );
    }
    setRefreshTrigger((prev) => prev + 1);
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  };

  const isCurrentPinned = () => {
    if (!contextMenu.payload) return false;
    const { type, payload } = contextMenu;
    if (type === "group") {
      return isGroupPinned(payload.orgKey, payload.categoryTitle, payload.scenario);
    }
    return isCommandPinned(payload.orgKey, payload.categoryTitle, payload.scenario, payload.cmdText || "");
  };

  // Group by Organization + Category for table visual grouping
  const groupedData = filteredList.reduce((acc, curr) => {
    let orgSection = acc.find((o) => o.orgKey === curr.orgKey);
    if (!orgSection) {
      orgSection = { orgKey: curr.orgKey, orgName: curr.orgName, categories: [] };
      acc.push(orgSection);
    }

    let catSection = orgSection.categories.find((c) => c.title === curr.category);
    if (!catSection) {
      catSection = { title: curr.category, groups: [] };
      orgSection.categories.push(catSection);
    }

    let groupSection = catSection.groups.find((g) => g.title === curr.group);
    if (!groupSection) {
      groupSection = { title: curr.group, commands: [] };
      catSection.groups.push(groupSection);
    }

    groupSection.commands.push({ text: curr.command });
    return acc;
  }, [] as Array<{ orgKey: string; orgName: string; categories: Array<{ title: string; groups: Array<{ title: string; commands: Array<{ text: string }> }> }> }>);

  return (
    <OrganizerLayout header={<SoftwareHeader title="Pinned Commands" />}>
      <div className="flex min-w-0 flex-1 flex-col min-h-0">
        {/* Header Block */}
        <header className="shrink-0 border-b border-[#e7e9f0] bg-white px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-[30px] font-semibold text-[#000000]">Pinned Commands</h1>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="min-h-0 flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-[1200px] space-y-6">
            {/* Search Bar */}
            <div className="flex items-center justify-between gap-4 border-b border-[#e7e9f0] pb-4">
              <div className="relative w-full max-w-[320px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a90a0]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pinned commands... (Ctrl H)"
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
              <span className="text-[12px] font-medium text-[#666666]">
                {filteredList.length} {filteredList.length === 1 ? "command" : "commands"} pinned
              </span>
            </div>

            {/* Instruction Banner */}
            <div className="rounded-[6px] bg-[#f8fafc] border border-[#eef0f2] px-4 py-3 text-[12px] text-[#666666]">
              Right click any command in the table to unpin it from this list.
            </div>

            {/* Grouped Table Layout */}
            {groupedData.length > 0 ? (
              <div className="space-y-8">
                {groupedData.map((orgSec) => (
                  <div key={orgSec.orgKey} className="space-y-6">
                    <h2 className="text-[16px] font-bold text-[#000000] border-l-4 border-black pl-3 py-0.5 flex items-center gap-2">
                      {orgSec.orgKey && ORG_LOGOS[orgSec.orgKey] && (
                        <img
                          src={`/Organization Logos/${ORG_LOGOS[orgSec.orgKey]}`}
                          alt={`${orgSec.orgName} Logo`}
                          className="h-8 w-8 object-contain shrink-0"
                        />
                      )}
                      <span>{orgSec.orgName}</span>
                    </h2>

                    {orgSec.categories.map((catSec) => (
                      <div key={catSec.title} className="space-y-3">
                        <h3 className="text-[13px] font-bold text-[#666666] flex items-center gap-1.5">
                          <Pin className="h-3.5 w-3.5 text-[#8a90a0] shrink-0" />
                          <span>{catSec.title}</span>
                        </h3>

                        <div className="overflow-x-auto rounded-[8px] border border-[#e2e5ec] bg-white">
                          <table className="w-full text-left table-fixed border-collapse">
                            <thead>
                              <tr className="bg-[#f9fbfc] text-[11px] font-semibold uppercase tracking-wide text-[#8a93a3] border-b border-[#e2e5ec]">
                                <th className="w-[30%] px-6 py-3">Scenario / Trigger</th>
                                <th className="w-[70%] px-6 py-3">Command Text (Click row to copy)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f0f1f3]">
                              {catSec.groups.flatMap((gSec) =>
                                gSec.commands.map((cmd, cmdIdx) => {
                                  const uniqueId = `${orgSec.orgKey}-${catSec.title}-${gSec.title}-${cmd.text}`;
                                  const isCopied = copiedId === uniqueId;
                                  const isGroupPinnedState = isGroupPinned(orgSec.orgKey, catSec.title, gSec.title);

                                  return (
                                    <tr
                                      key={`${gSec.title}-${cmdIdx}`}
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
                                          rowSpan={gSec.commands.length}
                                          onContextMenu={(e) =>
                                            handleGroupContextMenu(
                                              e,
                                              orgSec.orgKey,
                                              catSec.title,
                                              gSec.title
                                            )
                                          }
                                          className="w-[30%] px-6 py-4 text-[13px] font-bold text-[#000000] align-top border-r border-[#f0f1f3] bg-[#fcfdfe] break-words cursor-context-menu select-none scenario-cell"
                                        >
                                          <div className="flex items-center gap-2">
                                            <span>{gSec.title}</span>
                                            {isGroupPinnedState && (
                                              <Pin className="h-3.5 w-3.5 text-[#8a90a0] shrink-0" />
                                            )}
                                          </div>
                                        </td>
                                      ) : null}
                                      <td
                                        onContextMenu={(e) =>
                                          handleCommandContextMenu(
                                            e,
                                            orgSec.orgKey,
                                            catSec.title,
                                            gSec.title,
                                            cmd.text
                                          )
                                        }
                                        className={cn(
                                          "w-[70%] px-6 py-4 text-[13px] leading-relaxed break-words transition-all duration-150 cursor-pointer",
                                          isCopied
                                            ? "bg-[#e6fbf4] text-[#10b981] border-l-[3px] border-l-[#10b981]"
                                            : "text-[#2b2f3a] hover:bg-[#f9fbfc] active:bg-[#f3f4f6]"
                                        )}
                                      >
                                        <div className="flex items-center justify-between gap-4">
                                          <span>{formatCommandText(cmd.text)}</span>
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
                ))}
              </div>
            ) : (
              <div className="rounded-[10px] border border-[#e2e5ec] bg-white px-6 py-12 text-center">
                <p className="text-[14px] text-[#666666]">
                  {q ? "No pinned commands match your search." : "No pinned commands yet. Go to an organization and right click to pin commands!"}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Floating Custom Right-Click Context Menu */}
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
