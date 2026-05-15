import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Trophy,
  Users,
  Calculator,
  FileDown,
  Swords,
  Settings,
  LifeBuoy,
  Gamepad2,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const main = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Tournaments", url: "/tournaments", icon: Swords },
  { title: "Point Tables", url: "/point-tables", icon: Calculator },
  { title: "Leaderboards", url: "/leaderboards", icon: Trophy },
  { title: "Teams", url: "/teams", icon: Users },
  { title: "Exports", url: "/exports", icon: FileDown },
];

const secondary = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Support", url: "/support", icon: LifeBuoy },
];

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) => (url === "/" ? path === "/" : path.startsWith(url));

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center border border-sidebar-border bg-sidebar-accent">
            <Gamepad2 className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Esports OS
            </span>
            <span className="text-sm font-semibold">RankForge</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="mono text-[10px] uppercase tracking-[0.25em]">
            Console
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:border-l-2 data-[active=true]:border-foreground rounded-none"
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="mono text-[10px] uppercase tracking-[0.25em]">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondary.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="rounded-none">
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center border border-sidebar-border bg-background mono text-xs">
            VK
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-xs font-medium">Vortex Kings</span>
            <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Organizer · PRO
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
