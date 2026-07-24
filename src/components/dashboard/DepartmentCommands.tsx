import { useState, useCallback, useRef } from "react";
import { Search, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContextMenu } from "@/components/dashboard/ContextMenu";
import { AppSearchSelect } from "@/components/dashboard/AppSearchSelect";
import {
  isCommandPinned,
  isGroupPinned,
  togglePinCommand,
  togglePinGroup,
} from "@/lib/pinned-store";
import { queue } from "@/components/ui/Toast";
import { usePageSearchShortcut } from "@/hooks/use-page-search-shortcut";

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

const RECIPIENT_OPTIONS = [
  "LAST",
  "LSPD",
  "SAHP",
  "FIB",
  "NG",
  "GOV",
  "EMS",
  "ALL",
  "DOJ",
  "DOL",
  "DOT",
  "DOC",
  "DOP",
] as const;

type Recipient = (typeof RECIPIENT_OPTIONS)[number];

const DEFAULT_RECIPIENT: Recipient = "LAST";

const RECIPIENT_SELECT_OPTIONS = RECIPIENT_OPTIONS.map((option) => ({
  label: option,
  value: option,
}));

function applyRecipient(text: string, recipient: string): string {
  return text.replace(/\bto\s+[^:]+:/i, `to ${recipient}:`);
}

function recipientKey(categoryTitle: string, groupTitle: string, cmdText: string) {
  return `${categoryTitle}::${groupTitle}::${cmdText}`;
}

const DEPARTMENT_CATEGORIES: CommandCategory[] = [
  {
    title: "Generic Commands",
    groups: [
      {
        title: "Good Copy Reply",
        commands: [{ text: "LSPD to LAST: Good Copy! Please proceed." }],
      },
      {
        title: "Bad Copy Reply",
        commands: [{ text: "LSPD to LAST: Negative Copy !" }],
      },
      {
        title: "Asking Bad Copy Reason",
        commands: [{ text: "LSPD to LAST: Inquiring on the reason for the negative copy?" }],
      },
      {
        title: "Asking How Copy",
        commands: [{ text: "LSPD to DOJ: How copy?" }],
      },
      {
        title: "10-15 Requesting State Lawyer",
        commands: [
          {
            text: "LSPD to LAST: We have a 10-15 at DOC requesting state legal representation. Please check availability.",
          },
        ],
      },
      {
        title: "10-15 Requesting Private Lawyer",
        commands: [
          {
            text: "LSPD to LAST: Could you verify if Mr. (Lawyer's Name) is Bar certified?",
          },
        ],
      },
      {
        title: "Global Finished",
        commands: [
          {
            text: "LSPD to ALL: Global situation is now 10-99. Thank you for your assistance.",
          },
        ],
      },
      {
        title: "Global at 10-10",
        commands: [
          {
            text: "LSPD to ALL: Confirming a 10-10 situation at the global location. Requesting backup.",
          },
        ],
      },
      {
        title: "Legal Org Employee in Custody",
        commands: [
          {
            text: "LSPD to FIB: We have one of your agents in custody. Please 10-17 to Capital for investigation.",
          },
        ],
      },
      {
        title: "State Employee in Custody",
        commands: [
          {
            text: "LSPD to DOJ: State employee in custody. Requesting formal trial proceedings.",
          },
        ],
      },
      {
        title: "Meeting Request",
        commands: [
          {
            text: "LSPD to LAST: Requesting a briefing with your team at the main barracks.",
          },
        ],
      },
      {
        title: "Meeting Request Reply",
        commands: [
          {
            text: "LSPD to LAST: 10-4. Standing by for your arrival at the designated location.",
          },
        ],
      },
      {
        title: "Standby",
        commands: [
          {
            text: "LSPD to ALL: Stand by for a possible hostage situation.",
          },
        ],
      },
      {
        title: "Officer Getting Robbed",
        commands: [
          {
            text: "LSPD to ALL: Officer under robbery at Global — all available units respond immediately!",
          },
        ],
      },
      {
        title: "Spec Ops Completion",
        commands: [
          {
            text: "LSPD to ALL: Special operation completed successfully. Thank you for your assistance.",
          },
        ],
      },
      {
        title: "Spec Ops (Heavy Weapons)",
        commands: [
          {
            text: "LSPD to ALL: Global designated for special operations — maximum 10-32 respond ASAP! Heavy weapons authorized!",
          },
        ],
      },
      {
        title: "Spec Ops (No Heavy Weapons)",
        commands: [
          {
            text: "LSPD to ALL: Global designated for special operations — maximum 10-32 respond ASAP! Heavy weapons not authorized!",
          },
        ],
      },
      {
        title: "Currently Enroute",
        commands: [
          {
            text: "LSPD to LAST: We're currently enroute to your location!",
          },
        ],
      },
      {
        title: "Acknowledgment",
        commands: [
          {
            text: "LSPD to LAST: 10-4, much appreciated!",
          },
        ],
      },
      {
        title: "Permission Granted",
        commands: [
          {
            text: "LSPD to LAST: Permission Granted! Proceed as requested.",
          },
        ],
      },
      {
        title: "Units Enroute",
        commands: [
          {
            text: "LSPD to LAST: Units are enroute to assist!",
          },
        ],
      },
      {
        title: "Officer in Custody Notification",
        commands: [
          {
            text: "LSPD to LAST: We have one of your personnel in custody. Could you 10-17 to DOC?",
          },
        ],
      },
      {
        title: "Jurisdiction Entry Notice",
        commands: [
          {
            text: "LSPD to LAST: We are entering your jurisdiction pursuing a vehicle hijacker. Assistance would be appreciated.",
          },
        ],
      },
      {
        title: "Requesting HQ Entry Permission",
        commands: [
          {
            text: "LSPD to LAST: Requesting permission to enter your headquarters for official business.",
          },
        ],
      },
      {
        title: "EMS Area Restrictions",
        commands: [
          {
            text: "LSPD to EMS: Ghetto area is off-limits for the next 25 minutes. Please notify all medical units.",
          },
        ],
      },
      {
        title: "Background Check",
        commands: [
          {
            text: "LSPD to LAST: Background is clean!",
          },
        ],
      },
    ],
  },
  {
    title: "Events Department",
    groups: [
      {
        title: "24/7 Store Robbery",
        commands: [
          {
            text: "LSPD to ALL: Active global at 24/7 store robbery. Requesting maximum 10-32 units from all orgs.",
          },
          {
            text: "LSPD to ALL: Suspect demands at the store robbery have been received. Negative hostages on scene.",
          },
          {
            text: "LSPD to ALL: Suspect demands at the store robbery have been received. Hostages confirmed on scene.",
          },
        ],
      },
      {
        title: "Hostage Situation",
        commands: [
          {
            text: "LSPD to ALL: Active global at hostage situation. Requesting maximum 10-32 units from all orgs.",
          },
        ],
      },
      {
        title: "Gun Store Robbery",
        commands: [
          {
            text: "LSPD to ALL: Active Global at Gun Store robbery. Armed suspects reported—maximum 10-32 units respond.",
          },
          {
            text: "LSPD to ALL: Suspect demands at the store robbery have been received. Negative hostages on scene.",
          },
          {
            text: "LSPD to ALL: Suspect demands at the store robbery have been received. Hostages confirmed on scene.",
          },
        ],
      },
      {
        title: "Hacker Attack / Data Breach",
        commands: [
          {
            text: "LSPD to ALL: Global activated for cyberattack response. Secure the facility and establish an outer perimeter.",
          },
        ],
      },
      {
        title: "Transport Protection",
        commands: [
          {
            text: "LSPD to ALL: Global escort in progress. Maintain convoy security and clear the designated route.",
          },
        ],
      },
      {
        title: "Submarine Protection",
        commands: [
          {
            text: "LSPD to ALL: Global assigned to submarine security. Hold the perimeter until the operation concludes.",
          },
        ],
      },
      {
        title: "Protecting the Informer",
        commands: [
          {
            text: "LSPD to ALL: Global assigned to witness protection. Ensure the informer reaches the destination safely.",
          },
        ],
      },
      {
        title: "Aircraft Carrier Protection",
        commands: [
          {
            text: "LSPD to ALL: Global activated for carrier security. Secure all access points and maintain defensive positions.",
          },
        ],
      },
      {
        title: "Bank Protection",
        commands: [
          {
            text: "LSPD to ALL: Global assigned to bank security. Establish a defensive perimeter and prevent hostile access.",
          },
        ],
      },
    ],
  },
  {
    title: "GOV",
    groups: [
      {
        title: "State Lawyer Available",
        commands: [
          {
            text: "GOV to LAST: A state lawyer is available and enroute to your location.",
          },
        ],
      },
      {
        title: "State Lawyer Unavailable",
        commands: [
          {
            text: "GOV to LAST: No state lawyer is currently available. You may proceed as per SOP.",
          },
        ],
      },
      {
        title: "Private Lawyer Certification Confirmed",
        commands: [
          {
            text: "GOV to LAST: Confirmed. Mr. (Lawyer's Name) is Bar certified.",
          },
        ],
      },
    ],
  },
];

import { useCurrentUser } from "@/hooks/use-current-user";

const ORG_KEY = "department";

export function DepartmentCommands() {
  const { organization } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<Record<string, Recipient>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("Generic Commands");
  const searchInputRef = useRef<HTMLInputElement>(null);
  usePageSearchShortcut(searchInputRef);

  // Dynamic prefix logic based on selected organization
  const prefix = organization && ["LSPD", "FIB", "SAHP", "NG", "GOVERNMENT", "EMS"].includes(organization.toUpperCase())
    ? organization.toUpperCase() === "GOVERNMENT" ? "GOV" : organization.toUpperCase()
    : "LSPD";

  const applyRecipientLocal = useCallback((text: string, recipient: string): string => {
    // Determine which prefix to use based on selected category
    let commandPrefix = prefix; // Default to user's org for Generic/Events
    
    // For organization-specific categories, use that org's name
    if (["LSPD", "FIB", "SAHP", "NG", "GOV", "EMS"].includes(selectedCategory)) {
      commandPrefix = selectedCategory === "GOV" ? "GOV" : selectedCategory;
    }
    
    // Replaces 'LSPD to' or similar with appropriate prefix
    const withPrefix = text.replace(/^[A-Za-z0-9\s]+to\b/i, `${commandPrefix} to`);
    return withPrefix.replace(/\bto\s+[^:]+:/i, `to ${recipient}:`);
  }, [prefix, selectedCategory]);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    isOpen: boolean;
    type: "command" | "group";
    payload: { categoryTitle: string; scenario: string; cmdText?: string } | null;
  }>({ x: 0, y: 0, isOpen: false, type: "command", payload: null });

  const getRecipient = (key: string): Recipient => {
    if (recipients[key]) return recipients[key];
    if (key.toLowerCase().includes("events department")) return "ALL";
    return DEFAULT_RECIPIENT;
  };

  const setRecipient = (key: string, value: Recipient) => {
    setRecipients((prev) => ({ ...prev, [key]: value }));
  };

  const q = searchQuery.toLowerCase().trim();

  const filteredCategories = DEPARTMENT_CATEGORIES
    .filter((cat) => !selectedCategory || cat.title === selectedCategory)
    .map((cat) => {
      const matchingGroups = cat.groups
        .map((group) => {
          const titleMatch = group.title.toLowerCase().includes(q);
          const matchingCommands = group.commands.filter((cmd) => {
            const key = recipientKey(cat.title, group.title, cmd.text);
            const displayText = applyRecipientLocal(cmd.text, getRecipient(key));
            return (
              cmd.text.toLowerCase().includes(q) ||
              displayText.toLowerCase().includes(q)
            );
          });

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
      payload: { categoryTitle, scenario },
    });
  };

  const handleCommandContextMenu = (
    e: React.MouseEvent,
    cmdText: string,
    scenario: string,
    categoryTitle: string
  ) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      isOpen: true,
      type: "command",
      payload: { cmdText, scenario, categoryTitle },
    });
  };

  const handleContextMenuAction = () => {
    if (!contextMenu.payload) return;
    const { type, payload } = contextMenu;
    if (type === "group") {
      const isNowPinned = togglePinGroup(ORG_KEY, payload.categoryTitle, payload.scenario);
      queue.add(
        {
          title: isNowPinned ? "Group Pinned" : "Group Unpinned",
          description: `"${payload.scenario}" has been updated.`,
          variant: "success",
        },
        { timeout: 2000 }
      );
    } else if (type === "command") {
      const isNowPinned = togglePinCommand(
        ORG_KEY,
        payload.categoryTitle,
        payload.scenario,
        payload.cmdText || ""
      );
      queue.add(
        {
          title: isNowPinned ? "Command Pinned" : "Command Unpinned",
          description: `"${payload.cmdText}" has been updated.`,
          variant: "success",
        },
        { timeout: 2000 }
      );
    }
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  };

  const isCurrentPinned = () => {
    if (!contextMenu.payload) return false;
    const { type, payload } = contextMenu;
    if (type === "group") {
      return isGroupPinned(ORG_KEY, payload.categoryTitle, payload.scenario);
    }
    return isCommandPinned(
      ORG_KEY,
      payload.categoryTitle,
      payload.scenario,
      payload.cmdText || ""
    );
  };

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="sticky top-0 z-40 -mx-8 border-b border-[#e7e9f0] bg-white px-8 pb-4 pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-[320px] shrink-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a90a0]" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search commands or procedures... (Ctrl H)"
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
          
          {/* Segmented Control Menu */}
          <div className="inline-flex rounded-[8px] border border-[#e2e5ec] bg-[#f7f8fb] p-1">
            {DEPARTMENT_CATEGORIES.map((category) => (
              <button
                key={category.title}
                type="button"
                onClick={() => setSelectedCategory(category.title)}
                className={cn(
                  "cursor-pointer rounded-[6px] px-4 py-1.5 text-[12px] font-semibold transition-all select-none whitespace-nowrap",
                  selectedCategory === category.title
                    ? "bg-white text-[#000000] shadow-sm"
                    : "text-[#666666] hover:text-[#000000]"
                )}
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
          {filteredCategories.map((category) => {
            return (
              <div key={category.title} className="space-y-4">
                <div className="overflow-x-auto rounded-[8px] border border-[#e2e5ec] bg-white">
                  <table className="w-full text-left table-fixed border-collapse">
                    <thead>
                      <tr className="bg-[#f9fbfc] text-[11px] font-semibold uppercase tracking-wide text-[#8a93a3] border-b border-[#e2e5ec]">
                        <th className="w-[26%] px-6 py-3">Scenario / Trigger</th>
                        <th className="w-[12%] px-4 py-3">To</th>
                        <th className="w-[62%] px-6 py-3">Command Text (Click row to copy)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f1f3]">
                      {category.groups.flatMap((group) =>
                        group.commands.map((cmd, cmdIdx) => {
                          const uniqueId = `${category.title}-${group.title}-${cmdIdx}`;
                          const rKey = recipientKey(category.title, group.title, cmd.text);
                          const recipient = getRecipient(rKey);
                          const displayText = applyRecipientLocal(cmd.text, recipient);
                          const isCopied = copiedId === uniqueId;
                          const isCmdPinnedState = isCommandPinned(
                            ORG_KEY,
                            category.title,
                            group.title,
                            cmd.text
                          );
                          const isGroupPinnedState = isGroupPinned(
                            ORG_KEY,
                            category.title,
                            group.title
                          );

                          return (
                            <tr
                              key={`${group.title}-${cmdIdx}`}
                              onClick={(e) => {
                                if (
                                  (e.target as HTMLElement).closest(
                                    ".scenario-cell, .recipient-cell"
                                  )
                                ) {
                                  return;
                                }
                                handleCopy(displayText, uniqueId);
                              }}
                              className="cursor-pointer select-none"
                            >
                              {cmdIdx === 0 ? (
                                <td
                                  rowSpan={group.commands.length}
                                  onContextMenu={(e) =>
                                    handleGroupContextMenu(e, category.title, group.title)
                                  }
                                  className="w-[26%] px-6 py-4 text-[13px] font-bold text-[#000000] align-top border-r border-[#f0f1f3] bg-[#fcfdfe] break-words cursor-context-menu select-none scenario-cell"
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
                                className="w-[12%] px-4 py-3 align-middle border-r border-[#f0f1f3] recipient-cell"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <AppSearchSelect
                                  compact
                                  value={recipient}
                                  onChange={(value) =>
                                    setRecipient(rKey, value as Recipient)
                                  }
                                  options={RECIPIENT_SELECT_OPTIONS}
                                />
                              </td>
                              <td
                                onContextMenu={(e) =>
                                  handleCommandContextMenu(
                                    e,
                                    cmd.text,
                                    group.title,
                                    category.title
                                  )
                                }
                                className={cn(
                                  "w-[62%] px-6 py-4 text-[13px] leading-relaxed break-words transition-all duration-150 cursor-pointer",
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
                                    <span>{displayText}</span>
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
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
        onAction={handleContextMenuAction}
        isPinned={isCurrentPinned()}
      />
      </div>
    </div>
  );
}
