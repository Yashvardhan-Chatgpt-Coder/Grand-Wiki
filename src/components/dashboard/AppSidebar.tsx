import { Link, useRouterState, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home,
  Shield,
  HelpCircle,
  Ticket,
  Headset,
  ChevronRight,
  Gavel,
  Pin,
  BookOpen,
  Radio,
  RadioReceiver,
  Users,
  Heart,
  ShieldCheck,
  Bell,
  FileText,
  Building,
  Calendar,
  type LucideIcon
} from "lucide-react";
import { SidebarCollapseButton } from "@/components/dashboard/SidebarCollapseButton";
import { useSidebarCollapsed } from "@/hooks/use-sidebar-collapsed";
import { cn } from "@/lib/utils";
import { ContactSupportDialog } from "@/components/dashboard/ContactSupportDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { useCurrentUser } from "@/hooks/use-current-user";

interface SubItemConfig {
  title: string;
  search?: Record<string, string>;
  url?: string;
  subItems?: SubItemConfig[];
}

interface NavItemConfig {
  title: string;
  url: string;
  icon: LucideIcon;
  search?: Record<string, string>;
  subItems?: SubItemConfig[];
  comingSoon?: boolean;
}

const mainNavConfig: NavItemConfig[] = [
  { title: "Home", url: "/", icon: Home },
  { title: "Arrest Procedure Tool", url: "/arrest-procedure", icon: Gavel },
  { 
    title: "Patrolman's Guide", 
    url: "/patrolmans-guide", 
    icon: BookOpen,
    subItems: [
      { title: "EN #1", search: { server: "en1" } },
      { title: "EN #2", search: { server: "en2" } },
      { title: "EN #3", search: { server: "en3" } }
    ]
  },
  { 
    title: "Vehicle Ticketing Tool", 
    url: "/vehicle-ticketing/en1", 
    icon: Ticket,
    subItems: [
      { title: "EN #1", url: "/vehicle-ticketing/en1" },
      { title: "EN #2", url: "/vehicle-ticketing/en2" },
      { title: "EN #3", url: "/vehicle-ticketing/en3" }
    ]
  },
  { title: "Department Radio", url: "/department-radio", icon: Radio },
  {
    title: "Organizations",
    url: "/organizations",
    icon: Shield,
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
    title: "Government",
    url: "/government/legislation",
    icon: Building,
    subItems: [
      {
        title: "EN #1",
        subItems: [
          { title: "Legislation", url: "/government/en1/legislation" },
          { title: "Templates", url: "/government/en1/templates" }
        ]
      },
      {
        title: "EN #2",
        subItems: [
          { title: "Legislation", url: "/government/en2/legislation" },
          { title: "Templates", url: "/government/en2/templates" }
        ]
      },
      {
        title: "EN #3",
        subItems: [
          { title: "Legislation", url: "/government/en3/legislation" },
          { title: "Templates", url: "/government/en3/templates" }
        ]
      }
    ]
  },
  { title: "Guides", url: "/guides", icon: BookOpen },
  { title: "Events", url: "/events", icon: Calendar },
  {
    title: "Questions & Answers",
    url: "/qna",
    icon: HelpCircle,
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
  { title: "Server Rules", url: "/server-rules", icon: FileText },
  { title: "Pinned Commands", url: "/pinned-commands", icon: Pin }
];

const adminNavConfig: NavItemConfig[] = [
  { title: "Philanthropists", url: "/admin", search: { tab: "philanthropists" }, icon: Heart },
  { title: "Notifications", url: "/admin", search: { tab: "notifications" }, icon: Bell },
  { title: "Back to Dashboard", url: "/", icon: Home }
];

export function AppSidebar() {
  const { user } = useCurrentUser();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const location = useLocation();
  const { collapsed, toggle } = useSidebarCollapsed();
  const [supportOpen, setSupportOpen] = useState(false);

  const [userToggledExpanded, setUserToggledExpanded] = useState<Record<string, boolean>>({});
  const [expandedSubmenus, setExpandedSubmenus] = useState<Record<string, boolean>>({});

  const toggleSubmenuExpand = (subItemTitle: string) => {
    setExpandedSubmenus((prev) => ({
      ...prev,
      [subItemTitle]: !prev[subItemTitle],
    }));
  };

  useEffect(() => {
    // Automatically collapse other menus and reset when user moves between root path structures
    setUserToggledExpanded({});
    setExpandedSubmenus({});
  }, [path]);

  const toggleExpand = (title: string) => {
    setUserToggledExpanded(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const isAdminPage = path.startsWith("/admin");
  const userNavConfig = user?.role === "admin"
    ? [...mainNavConfig, { title: "Admin Panel", url: "/admin", icon: ShieldCheck }]
    : mainNavConfig;
  const itemsToRender = isAdminPage ? adminNavConfig : userNavConfig;

  const isItemActive = (item: NavItemConfig) => {
    if (isAdminPage) {
      if (item.url === "/") return false;
      const search = location.search as Record<string, string>;
      const currentTab = search.tab || "philanthropists";
      return item.search?.tab === currentTab;
    }
    if (item.url === "/") return path === "/";
    return path.startsWith(item.url);
  };

  const getActiveParam = (key: string, itemUrl: string) => {
    const search = location.search as Record<string, string>;
    if (itemUrl === "/organizations" && key === "org") {
      return search.org || "lspd";
    }
    if (itemUrl === "/patrolmans-guide" && key === "server") {
      return search.server || "en2";
    }
    if (itemUrl === "/qna" && key === "cat") {
      return search.cat || "general";
    }
    return search[key];
  };

  const isSubItemActive = (item: NavItemConfig, subItem: SubItemConfig): boolean => {
    if (subItem.subItems) {
      return subItem.subItems.some((child) => isSubItemActive(item, child));
    }

    const targetUrl = subItem.url || item.url;

    // For government server paths (e.g. /government/en2/legislation, /government/en2/criminal-code)
    // we want any page in the same server subdirectory to activate the corresponding menu!
    if (targetUrl.startsWith("/government/en1/") && path.startsWith("/government/en1/")) {
      if (targetUrl.endsWith("/templates")) {
        return path === targetUrl;
      }
      if (path.endsWith("/templates")) {
        return false;
      }
      return true;
    }
    if (targetUrl.startsWith("/government/en2/") && path.startsWith("/government/en2/")) {
      if (targetUrl.endsWith("/templates")) {
        return path === targetUrl;
      }
      if (path.endsWith("/templates")) {
        return false;
      }
      return true;
    }
    if (targetUrl.startsWith("/government/en3/") && path.startsWith("/government/en3/")) {
      if (targetUrl.endsWith("/templates")) {
        return path === targetUrl;
      }
      if (path.endsWith("/templates")) {
        return false;
      }
      return true;
    }

    if (path !== targetUrl) return false;

    if (subItem.search) {
      return Object.entries(subItem.search).every(([key, val]) => {
        const activeVal = getActiveParam(key, item.url);
        return activeVal?.toLowerCase() === val.toLowerCase();
      });
    }
    return true;
  };

  return (
    <aside
      className={cn(
        "es-app-sidebar relative flex min-h-0 flex-1 flex-col border-r border-[#e5e7ef] bg-white transition-[width] duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      <SidebarCollapseButton collapsed={collapsed} onToggle={toggle} />

      <nav
        className={cn(
          "min-h-0 flex-1 overflow-x-hidden overflow-y-auto pb-6 pt-2",
          collapsed ? "px-2" : "px-3",
        )}
      >
        <div className="space-y-1">
          {isAdminPage && !collapsed && (
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#8a90a0]">
              Admin Panel
            </div>
          )}
          {itemsToRender.map((item) => {
            const active = isItemActive(item);
            const Icon = item.icon;
            const hasSubItems = !!item.subItems;
            const hasActiveChild = item.subItems?.some((subItem) => isSubItemActive(item, subItem)) ?? false;
            const isExpanded = userToggledExpanded[item.title] !== undefined
              ? userToggledExpanded[item.title]
              : hasActiveChild;

            const sharedClasses = cn(
              "flex h-9 w-full items-center rounded-[6px] text-[14px] transition-all duration-300 ease-in-out justify-start",
              item.comingSoon ? "opacity-60 cursor-not-allowed select-none" : "cursor-pointer",
              collapsed ? "pl-[18px] pr-0" : "pl-3 pr-3",
              active
                ? "bg-[#f0f1f3] font-medium text-[#000000]"
                : item.comingSoon
                ? "text-[#8a90a0]"
                : "text-[#666666] hover:bg-[#f7f6fb] hover:text-[#000000]",
            );

            // Parent items with submenus: plain button, only toggles expand/collapse
            // Coming soon items: plain div with badge
            // Standard items without submenus: Link, navigates
            const mainElement = hasSubItems ? (
              <button
                type="button"
                onClick={() => toggleExpand(item.title)}
                data-active={active ? "true" : undefined}
                className={sharedClasses}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span
                  className={cn(
                    "overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
                    collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-[170px] opacity-100 ml-3",
                  )}
                >
                  {item.title}
                </span>
                {!collapsed && (
                  <div className="ml-auto p-1">
                    <ChevronRight
                      className={cn(
                        "h-3.5 w-3.5 text-[#8a90a0] transition-transform duration-300 ease-in-out",
                        isExpanded && "rotate-90"
                      )}
                    />
                  </div>
                )}
              </button>
            ) : item.comingSoon ? (
              <div className={sharedClasses}>
                <Icon className="h-5 w-5 shrink-0" />
                <span
                  className={cn(
                    "overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
                    collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-[170px] opacity-100 ml-3",
                  )}
                >
                  {item.title}
                </span>
                {!collapsed && (
                  <span className="ml-auto text-[9px] font-bold uppercase tracking-wider bg-[#f0f1f3] text-[#8a90a0] px-1.5 py-0.5 rounded-[4px] border border-[#e5e7ef] scale-90 select-none">
                    Soon
                  </span>
                )}
              </div>
            ) : (
              <Link
                to={item.url}
                search={item.search}
                data-active={active ? "true" : undefined}
                className={sharedClasses}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span
                  className={cn(
                    "overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
                    collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-[170px] opacity-100 ml-3",
                  )}
                >
                  {item.title}
                </span>
              </Link>
            );

            return (
              <div key={item.title} className="space-y-0.5">
                {collapsed ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>{mainElement}</TooltipTrigger>
                      <TooltipContent side="right">{item.title}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  mainElement
                )}

                <AnimatePresence initial={false}>
                  {hasSubItems && isExpanded && !collapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pl-8 pr-1 py-1 space-y-0.5 border-l border-[#eef0f5] ml-[27px]">
                        {item.subItems?.map((subItem) => {
                          const subActive = isSubItemActive(item, subItem);

                          if (subItem.subItems) {
                            const subExpanded = expandedSubmenus[subItem.title] !== undefined
                              ? expandedSubmenus[subItem.title]
                              : subActive; // Default expand if any child is active
                            return (
                              <div key={subItem.title} className="space-y-0.5">
                                <button
                                  type="button"
                                  onClick={() => toggleSubmenuExpand(subItem.title)}
                                  className={cn(
                                    "flex h-7 w-full cursor-pointer items-center justify-between rounded-[4px] px-2 text-[12px] transition-all duration-200",
                                    subActive
                                      ? "bg-black/5 font-semibold text-[#000000]"
                                      : "text-[#666666] hover:bg-[#f7f6fb] hover:text-[#000000]",
                                  )}
                                >
                                  <span className="truncate">{subItem.title}</span>
                                  <ChevronRight
                                    className={cn(
                                      "h-3.5 w-3.5 text-[#8a90a0] transition-transform duration-200",
                                      subExpanded && "rotate-90"
                                    )}
                                  />
                                </button>
                                <AnimatePresence initial={false}>
                                  {subExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.15, ease: "easeInOut" }}
                                      className="overflow-hidden"
                                    >
                                      <div className="pl-4 pr-0 py-0.5 space-y-0.5 border-l border-[#eef0f5] ml-[10px]">
                                        {subItem.subItems.map((childItem) => {
                                          const childActive = isSubItemActive(item, childItem);
                                          return (
                                            <Link
                                              key={childItem.title}
                                              to={childItem.url || item.url}
                                              search={childItem.search}
                                              className={cn(
                                                "flex h-6 w-full cursor-pointer items-center rounded-[4px] px-2 text-[11px] transition-all duration-200",
                                                childActive
                                                  ? "bg-black/5 font-semibold text-[#000000]"
                                                  : "text-[#666666] hover:bg-[#f7f6fb] hover:text-[#000000]",
                                              )}
                                            >
                                              <span className="truncate">{childItem.title}</span>
                                            </Link>
                                          );
                                        })}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          }

                          return (
                            <Link
                              key={subItem.title}
                              to={subItem.url || item.url}
                              search={subItem.search}
                              className={cn(
                                "flex h-7 w-full cursor-pointer items-center rounded-[4px] px-2 text-[12px] transition-all duration-200",
                                subActive
                                  ? "bg-black/5 font-semibold text-[#000000]"
                                  : "text-[#666666] hover:bg-[#f7f6fb] hover:text-[#000000]",
                              )}
                            >
                              <span className="truncate">{subItem.title}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </nav>

      {collapsed ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setSupportOpen(true)}
                className="mt-auto flex h-[56px] cursor-pointer items-center justify-center border-t border-[#eef0f5] px-0 text-[13px] text-[#8a90a0] transition-all duration-300 ease-in-out hover:bg-[#f9fbfc] hover:text-[#000000]"
              >
                <Headset className="h-5 w-5 shrink-0" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Contact support</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <button
          type="button"
          onClick={() => setSupportOpen(true)}
          className={cn(
            "mt-auto flex h-[56px] cursor-pointer items-center border-t border-[#eef0f5] text-[13px] text-[#8a90a0] transition-all duration-300 ease-in-out hover:bg-[#f9fbfc] hover:text-[#000000]",
            "gap-3 px-6",
          )}
        >
          <Headset className="h-5 w-5 shrink-0" />
          <span className="max-w-[160px] overflow-hidden whitespace-nowrap opacity-100 transition-all duration-300 ease-in-out">
            Contact support
          </span>
        </button>
      )}
      <ContactSupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
    </aside>
  );
}
