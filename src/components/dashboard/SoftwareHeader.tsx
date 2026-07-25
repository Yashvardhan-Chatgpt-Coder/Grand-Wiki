import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Heart,
  Plus,
  Search,
  X,
  Pin,
  Database,
  AlertCircle,
  Sparkles,
  Settings,
  CreditCard,
  LogOut,
  UserPlus,
  BookOpen,
  Users,
} from "lucide-react";
import { ProfileSettingsModal } from "./ProfileSettingsModal";
import { ComingSoonDialog } from "./ComingSoonDialog";
import { DonateModal } from "./DonateModal";
import { CreditsModal } from "./CreditsModal";
import { ThemedConfirmDialog } from "@/components/ui/dialog";
import { AnimatePresence, motion } from "framer-motion";
import { cn, optimizeCloudinaryUrl } from "@/lib/utils";
import { queue } from "@/components/ui/Toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  authApi,
  clearStoredUser,
} from "@/lib/api";

type SoftwareHeaderProps = {
  title: string;
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
};

const GLOBAL_SEARCH_TERMS = ["guides", "how to process a 10-15", "10-51 procedure", "traffic stop", "Patrolman's Guide", "vehicle ticketing tool"];

const textLoopVariants = {
  initial: {
    y: 14,
    opacity: 0,
    filter: "blur(4px)",
  },
  animate: {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
  },
  exit: {
    y: -14,
    opacity: 0,
    filter: "blur(4px)",
  },
};

const textLoopTransition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.8,
} as const;

type GlobalSearchResult = {
  id: string;
  kind: "guide";
  title: string;
  subtitle: string;
  url?: string;
};

const GUIDES_SEARCH_DATA = [
  {
    id: "introduction-to-lspd",
    title: "Introduction To LSPD",
    url: "/guides/introduction-to-lspd",
    parentSection: "Guides",
    sections: []
  }
];

const SIDEBAR_SEARCH_DATA = [
  {
    title: "Home",
    url: "/",
    icon: "Home"
  },
  {
    title: "Arrest Procedure Tool",
    url: "/arrest-procedure",
    icon: "Gavel"
  },
  {
    title: "Patrolman's Guide",
    url: "/patrolmans-guide",
    icon: "BookOpen"
  },
  {
    title: "Vehicle Ticketing Tool",
    url: "/vehicle-ticketing",
    icon: "Ticket"
  },
  {
    title: "Department Radio",
    url: "/department-radio",
    icon: "Radio"
  },
  {
    title: "Organizations",
    url: "/organizations",
    icon: "Shield",
    subItems: [
      { title: "LSPD", search: { org: "lspd" } },
      { title: "FIB", search: { org: "fib" } },
      { title: "SAHP", search: { org: "sahp" } },
      { title: "NG", search: { org: "ng" } },
      { title: "Government", search: { org: "government" } },
      { title: "EMS", search: { org: "ems" } },
      { title: "Lifeinvader", search: { org: "lifeinvader" } }
    ]
  },
  {
    title: "Guides",
    url: "/guides",
    icon: "BookOpen"
  },
  {
    title: "Questions & Answers",
    url: "/qna",
    icon: "HelpCircle",
    subItems: [
      { title: "General Questions", search: { cat: "general" } },
      { title: "LSPD", search: { cat: "lspd" } },
      { title: "FIB", search: { cat: "fib" } },
      { title: "SAHP", search: { cat: "sahp" } },
      { title: "NG", search: { cat: "ng" } },
      { title: "Government", search: { cat: "government" } },
      { title: "EMS", search: { cat: "ems" } },
      { title: "Lifeinvader", search: { cat: "lifeinvader" } },
      { title: "Gangs", search: { cat: "gangs" } }
    ]
  },
  {
    title: "Pinned Commands",
    url: "/pinned-commands",
    icon: "Pin"
  }
];

function TextLoop({ words, interval = 1650 }: { words: string[]; interval?: number }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (words.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % words.length);
    }, interval);

    return () => window.clearInterval(timer);
  }, [interval, words.length]);

  return (
    <span className="relative inline-grid min-w-[112px] overflow-hidden align-bottom">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={words[index]}
          variants={textLoopVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={textLoopTransition}
          className="col-start-1 row-start-1 whitespace-nowrap"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function SoftwareHeader({
  title,
  searchValue,
  searchPlaceholder = "Search by event or team",
  onSearchChange,
}: SoftwareHeaderProps) {
  const navigate = useNavigate();
  const { displayName, initials, avatarUrl } = useCurrentUser();
  
  // Check if admin from stored user (for logged-in admins)
  const getStoredAdminUser = () => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      const user = JSON.parse(raw);
      return user?.role === "admin" || user?.role === "ADMIN" || user?.email?.toLowerCase().includes("admin") ? user : null;
    } catch {
      return null;
    }
  };
  const isAdmin = !!getStoredAdminUser();
  
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [pinnedComingSoonOpen, setPinnedComingSoonOpen] = useState(false);
  const [upgradeComingSoonOpen, setUpgradeComingSoonOpen] = useState(false);
  const [donateModalOpen, setDonateModalOpen] = useState(false);
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [billingComingSoonOpen, setBillingComingSoonOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchDataLoading, setSearchDataLoading] = useState(false);
  const [activeSearchResultIndex, setActiveSearchResultIndex] = useState(0);
  const enableGlobalSearch = true;
  const searchQuery = enableGlobalSearch ? (searchValue ?? globalSearch) : (searchValue ?? "");
  const trimmedSearchQuery = searchQuery.trim();

  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      title: string;
      description: string;
      time: string;
      type: string;
      unread: boolean;
    }>
  >([]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const updateSearchQuery = (value: string) => {
    setGlobalSearch(value);
    onSearchChange?.(value);
  };

  const globalSearchResults = useMemo<GlobalSearchResult[]>(() => {
    if (!enableGlobalSearch || !trimmedSearchQuery) return [];

    const query = trimmedSearchQuery.toLowerCase();
    const includesQuery = (...values: Array<string | undefined | null>) =>
      values.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query),
      );

    // Search through sidebar items
    const sidebarResults = SIDEBAR_SEARCH_DATA.flatMap((item) => {
      const matchesMain = includesQuery(item.title);
      
      // If main item matches, return it
      if (matchesMain) {
        return [{
          id: item.title,
          kind: "guide" as const,
          title: item.title,
          subtitle: "Sidebar Navigation",
          url: item.url
        }];
      }

      // If has subitems, check if any match
      if (item.subItems) {
        const matchingSubItems = item.subItems.filter(sub => includesQuery(sub.title));
        return matchingSubItems.map(sub => ({
          id: `${item.title}-${sub.title}`,
          kind: "guide" as const,
          title: sub.title,
          subtitle: item.title,
          url: `${item.url}?${new URLSearchParams(sub.search).toString()}`
        }));
      }

      return [];
    }).slice(0, 9);

    // If we don't have enough sidebar results, add guide results
    let guideResults: GlobalSearchResult[] = [];
    if (sidebarResults.length < 9) {
      guideResults = GUIDES_SEARCH_DATA.flatMap((guide) => {
        const matchesGuide = includesQuery(guide.title);
        if (matchesGuide) {
          return [{
            id: guide.id,
            kind: "guide" as const,
            title: guide.title,
            subtitle: guide.parentSection || "Guides",
            url: guide.url
          }];
        }
        return [];
      }).slice(0, 9 - sidebarResults.length);
    }

    return [...sidebarResults, ...guideResults].slice(0, 9);
  }, [enableGlobalSearch, trimmedSearchQuery]);

  const handleSearchResultSelect = (result: GlobalSearchResult) => {
    updateSearchQuery("");
    setSearchFocused(false);
    setActiveSearchResultIndex(0);

    if (result.kind === "guide") {
      navigate({ to: result.url || "/" });
      return;
    }
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!enableGlobalSearch) return;

    if (event.key === "Escape") {
      event.preventDefault();
      setSearchFocused(false);
      searchInputRef.current?.blur();
      return;
    }

    if (!trimmedSearchQuery || globalSearchResults.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSearchResultIndex((index) => (index + 1) % globalSearchResults.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSearchResultIndex(
        (index) => (index - 1 + globalSearchResults.length) % globalSearchResults.length,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const result = globalSearchResults[activeSearchResultIndex];
      if (result) handleSearchResultSelect(result);
    }
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    queue.add(
      {
        title: "Notifications",
        description: "All notifications marked as read.",
        variant: "success",
      },
      { timeout: 3000 },
    );
  };

  const confirmLogout = () => {
    setLogoutConfirmOpen(false);
    void authApi
      .logout()
      .catch(() => null)
      .finally(() => {
        clearStoredUser();
        queue.add(
          {
            title: "Log Out",
            description: "You have been securely signed out.",
            variant: "success",
          },
          { timeout: 3000 },
        );
        navigate({ to: "/admin" });
      });
  };

  useEffect(() => {
    if (!notifOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  useEffect(() => {
    if (!profileOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  useEffect(() => {
    if (!searchFocused) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchFocused]);

  useEffect(() => {
    setActiveSearchResultIndex(0);
  }, [trimmedSearchQuery]);

  useEffect(() => {
    if (activeSearchResultIndex >= globalSearchResults.length) {
      setActiveSearchResultIndex(0);
    }
  }, [activeSearchResultIndex, globalSearchResults.length]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const isSearchShortcut = event.ctrlKey && event.key.toLowerCase() === "k";
      if (!isSearchShortcut) return;

      event.preventDefault();
      setSearchFocused(true);
      searchInputRef.current?.focus();
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [enableGlobalSearch]);

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "match":
        return Swords;
      case "registration":
        return UserPlus;
      case "system":
        return Database;
      case "promotion":
        return Sparkles;
      default:
        return Bell;
    }
  };

  const getNotifIconBg = (type: string) => {
    switch (type) {
      case "match":
        return "bg-amber-50 text-amber-600";
      case "registration":
        return "bg-emerald-50 text-emerald-600";
      case "system":
        return "bg-rose-50 text-rose-600";
      case "promotion":
        return "bg-zinc-100 text-zinc-800";
      default:
        return "bg-gray-50 text-[#666666]";
    }
  };

  return (
    <>
      <AnimatePresence>
        {searchFocused && (
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="fixed inset-0 z-40 bg-black/70"
          />
        )}
      </AnimatePresence>

      <header
        className={cn(
          "es-app-header sticky top-0 z-45 flex h-[56px] shrink-0 items-center border-b bg-white px-4",
          searchFocused ? "border-transparent" : "border-[#e7e9f0]",
        )}
      >
        <AnimatePresence>
          {searchFocused && (
            <motion.div
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              onMouseDown={() => setSearchFocused(false)}
              className="absolute inset-x-0 -bottom-px top-0 z-10 bg-black/70"
            />
          )}
        </AnimatePresence>
        <div className="w-[310px] px-1 text-[16px] font-medium text-[#4d5568]">{title}</div>

        <div ref={searchRef} className="relative z-50 w-[340px] max-w-[38vw]">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa1b0]" />
          <input
            ref={searchInputRef}
            data-no-style
            value={searchQuery}
            onFocus={() => setSearchFocused(true)}
            onChange={(event) => updateSearchQuery(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="h-[36px] w-full rounded-[5px] border-2 border-[#eef0f4] bg-white pl-10 pr-20 text-[14px] outline-none placeholder:text-[#9aa1b0] transition-all duration-200 focus:border-[#eef0f4]"
            placeholder={enableGlobalSearch ? "" : `${searchPlaceholder} (Ctrl K)`}
            aria-label={`${searchPlaceholder}. Press Control K to focus search.`}
            aria-expanded={
              enableGlobalSearch && searchFocused && trimmedSearchQuery ? true : undefined
            }
            aria-activedescendant={
              enableGlobalSearch && globalSearchResults[activeSearchResultIndex]
                ? `global-search-result-${globalSearchResults[activeSearchResultIndex].kind}-${globalSearchResults[activeSearchResultIndex].id}`
                : undefined
            }
            role={enableGlobalSearch ? "combobox" : undefined}
          />
          {searchQuery && (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => updateSearchQuery("")}
              className="absolute right-3 top-1/2 z-20 -translate-y-1/2 text-[#9aa1b0] transition-colors hover:cursor-pointer hover:text-[#000000]"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {enableGlobalSearch && !searchQuery && (
            <>
              <div className="pointer-events-none absolute left-10 top-1/2 flex -translate-y-1/2 items-center text-[14px] text-[#9aa1b0]">
                <span>Search for&nbsp;</span>
                <TextLoop words={GLOBAL_SEARCH_TERMS} />
              </div>
              <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-[5px] border border-[#e2e5ec] bg-[#f7f8fb] px-1.5 py-0.5 text-[10px] font-semibold text-[#8a90a0]">
                <span>Ctrl</span>
                <span>K</span>
              </div>
            </>
          )}

          <AnimatePresence>
            {enableGlobalSearch && searchFocused && trimmedSearchQuery && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="absolute left-0 top-[42px] z-[110] w-full overflow-hidden rounded-[12px] border border-[#e2e5ec] bg-white shadow-[0_16px_50px_rgba(0,0,0,0.14)]"
              >
                <div className="border-b border-[#f0f1f3] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#9aa1b0]">
                  Search results
                </div>
                <div className="max-h-[320px] overflow-y-auto p-1.5">
                  {searchDataLoading ? (
                    <div className="px-3 py-5 text-center text-[13px] text-[#9aa1b0]">
                      Searching...
                    </div>
                  ) : globalSearchResults.length > 0 ? (
                    globalSearchResults.map((result, index) => {
                      const Icon = BookOpen;
                      const label = "Guide";

                      return (
                        <button
                          key={`${result.kind}-${result.id}`}
                          id={`global-search-result-${result.kind}-${result.id}`}
                          type="button"
                          onClick={() => handleSearchResultSelect(result)}
                          role="option"
                          aria-selected={index === activeSearchResultIndex}
                          onMouseEnter={() => setActiveSearchResultIndex(index)}
                          className={cn(
                            "flex w-full cursor-pointer items-center gap-3 rounded-[8px] px-3 py-2.5 text-left transition-colors hover:bg-[#f7f8fb]",
                            index === activeSearchResultIndex && "bg-[#f0f1f3]",
                          )}
                        >
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-[#f0f1f3] text-[#4b5563]">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-semibold text-[#000000]">
                              {result.title}
                            </span>
                            <span className="block truncate text-[11px] text-[#666666]">
                              {result.subtitle}
                            </span>
                          </span>
                          <span className="rounded-full bg-[#f0f1f3] px-2 py-0.5 text-[10px] font-semibold text-[#666666]">
                            {label}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-5 text-center">
                      <p className="text-[13px] font-medium text-[#000000]">No results found</p>
                      <p className="mt-0.5 text-[12px] text-[#9aa1b0]">
                        Try searching for a page or guide.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="ml-auto flex items-center gap-4">
          {!isAdmin && (
            <>
              <button
                onClick={() => setCreditsModalOpen(true)}
                className="flex h-[34px] cursor-pointer items-center gap-2 rounded-[8px] border border-[#e2e5ec] bg-white px-3 text-[14px] font-medium text-[#000000] hover:bg-[#f7f8fb]"
              >
                <Users className="h-4 w-4" />
                Credits
              </button>
              <button
                onClick={() => navigate({ to: "/pinned-commands" })}
                className="flex h-[34px] cursor-pointer items-center gap-2 rounded-[8px] border border-[#e2e5ec] bg-white px-3 text-[14px] font-medium text-[#000000] hover:bg-[#f7f8fb]"
              >
                <Pin className="h-4 w-4" />
                Pinned Commands
              </button>
              <button
                onClick={() => setDonateModalOpen(true)}
                className="flex h-[34px] cursor-pointer items-center gap-2 rounded-[8px] border border-[#e2e5ec] bg-white px-3 text-[14px] font-medium text-[#000000] hover:bg-[#f7f8fb]"
              >
                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                Donate
              </button>
            </>
          )}

          <div className="es-app-header-separator h-7 w-px bg-[#edf0f4]" />
          <div className="relative" ref={dropdownRef}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className={cn(
                      "relative grid h-[34px] w-[34px] cursor-pointer place-items-center rounded-[5px] text-[#303646] transition-colors hover:bg-[#f7f8fb] hover:text-[#000000]",
                      notifOpen && "bg-[#f7f8fb] text-[#000000]",
                    )}
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#dc2626] text-[9px] font-bold text-white ring-2 ring-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Notifications</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Notification Dropdown Panel */}
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 top-[40px] z-[110] flex w-[360px] flex-col rounded-[12px] border border-[#e2e5ec] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)] overflow-hidden"
                >
                  {/* Dropdown Header */}
                  <div className="flex items-center justify-between border-b border-[#f0f1f3] px-4 py-3">
                    <span className="text-[14px] font-semibold text-[#000000]">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="cursor-pointer text-[12px] font-semibold text-[#000000] hover:text-[#444444] hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {/* Notification List Content */}
                  <div className="max-h-[320px] overflow-y-auto divide-y divide-[#f0f1f3]">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                        <Bell className="h-8 w-8 text-[#9aa1b0] mb-2" />
                        <p className="text-[13px] font-medium text-[#000000]">All caught up!</p>
                        <p className="text-[11px] text-[#9aa1b0] mt-0.5">
                          No new notifications at this time.
                        </p>
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const Icon = getNotifIcon(notif.type);
                        const iconBg = getNotifIconBg(notif.type);

                        return (
                          <div
                            key={notif.id}
                            onClick={() => toggleRead(notif.id)}
                            className={cn(
                              "flex gap-3 p-4 cursor-pointer transition-colors hover:bg-[#f9fbfc]",
                              notif.unread && "bg-[#f8fafc]/60",
                            )}
                          >
                            <div
                              className={cn(
                                "grid h-8 w-8 shrink-0 place-items-center rounded-full",
                                iconBg,
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 space-y-0.5 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p
                                  className={cn(
                                    "text-[13px] font-semibold truncate leading-none",
                                    notif.unread ? "text-[#000000]" : "text-[#4b5563]",
                                  )}
                                >
                                  {notif.title}
                                </p>
                                <span className="text-[10px] text-[#9aa1b0] shrink-0 whitespace-nowrap">
                                  {notif.time}
                                </span>
                              </div>
                              <p className="text-[11px] leading-relaxed text-[#666666] break-words">
                                {notif.description}
                              </p>
                            </div>
                            {notif.unread && (
                              <div className="h-2 w-2 rounded-full bg-black mt-1.5 shrink-0" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Dropdown Footer */}
                  <div className="border-t border-[#f0f1f3] px-4 py-2.5 bg-[#f9fbfc] text-center">
                    <button
                      onClick={() => {
                        setNotifOpen(false);
                        queue.add(
                          {
                            title: "Notifications Panel",
                            description: "Expanded full-screen notification logs coming in v2.",
                            variant: "normal",
                          },
                          { timeout: 3000 },
                        );
                      }}
                      className="cursor-pointer text-[12px] font-medium text-[#4b5563] hover:text-[#000000] hover:underline"
                    >
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="relative" ref={profileDropdownRef}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className={cn(
                      "grid h-8 w-8 cursor-pointer place-items-center overflow-hidden rounded-full border border-[#e2e5ec] bg-[#e8eef7] text-[13px] font-semibold text-[#666666] outline-none transition-all duration-200 active:scale-95 hover:border-[#9aa1b0]",
                      profileOpen && "border-[#000000] ring-2 ring-[#e8eef7]",
                    )}
                  >
                    {!isAdmin && avatarUrl ? (
                      <img
                        src={optimizeCloudinaryUrl(avatarUrl, 80, 80)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : isAdmin ? (
                      "AD"
                    ) : (
                      initials
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {isAdmin ? "Admin profile" : "Profile"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Profile Dropdown Panel */}
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 top-[40px] z-[110] flex w-[240px] flex-col rounded-[12px] border border-[#e2e5ec] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)] overflow-hidden"
                >
                  {/* User Profile Info Card */}
                  <div className="flex flex-col border-b border-[#f0f1f3] px-4 py-3 bg-[#f9fbfc]">
                    <span className="text-[13px] font-bold text-[#000000] truncate">
                      {isAdmin ? "Admin Dashboard" : displayName}
                    </span>
                  </div>

                  {/* Menu Items */}
                  <div className="flex flex-col p-1">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        setProfileModalOpen(true);
                      }}
                      className="flex cursor-pointer items-center gap-2.5 rounded-[6px] px-3 py-2 text-left text-[12px] font-medium text-[#4b5563] transition-colors hover:bg-[#f7f8fb] hover:text-[#000000]"
                    >
                      <Settings className="h-4 w-4 shrink-0 text-[#9aa1b0]" />
                      Settings
                    </button>
                  </div>

                  {isAdmin && (
                    <>
                      <div className="h-px bg-[#f0f1f3] mx-1" />

                      <div className="flex flex-col p-1">
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            setLogoutConfirmOpen(true);
                          }}
                          className="flex cursor-pointer items-center gap-2.5 rounded-[6px] px-3 py-2 text-left text-[12px] font-semibold text-[#dc2626] transition-colors hover:bg-rose-50 hover:text-[#dc2626]"
                        >
                          <LogOut className="h-4 w-4 shrink-0 text-[#fca5a5]" />
                          Log out
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>


      {!isAdmin && (
        <ComingSoonDialog
          open={pinnedComingSoonOpen}
          onOpenChange={setPinnedComingSoonOpen}
          icon={<Pin className="h-5 w-5" />}
        />
      )}
      {!isAdmin && (
        <DonateModal
          open={donateModalOpen}
          onOpenChange={setDonateModalOpen}
        />
      )}
      {!isAdmin && (
        <CreditsModal
          open={creditsModalOpen}
          onOpenChange={setCreditsModalOpen}
        />
      )}
      {!isAdmin && (
        <ComingSoonDialog
          open={upgradeComingSoonOpen}
          onOpenChange={setUpgradeComingSoonOpen}
          icon={<Heart className="h-5 w-5 fill-red-500 text-red-500" />}
        />
      )}
      {!isAdmin && (
        <ComingSoonDialog
          open={billingComingSoonOpen}
          onOpenChange={setBillingComingSoonOpen}
          icon={<CreditCard className="h-5 w-5" />}
        />
      )}
      <ProfileSettingsModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        isAdmin={isAdmin}
      />
      <ThemedConfirmDialog
        open={logoutConfirmOpen}
        onOpenChange={setLogoutConfirmOpen}
        title="Log out?"
        description="You will be signed out of this workspace and returned to the login screen."
        cancelLabel="Stay logged in"
        confirmLabel="Log out"
        onConfirm={confirmLogout}
      />
    </>
  );
}
