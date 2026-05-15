import { createFileRoute } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { Bell, Search, Command } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col bg-background">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger className="rounded-none" />
            <div className="mono hidden items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-muted-foreground md:flex">
              <span>RankForge</span>
              <span className="text-border">/</span>
              <span className="text-foreground">Dashboard</span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="hidden items-center gap-2 border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground md:flex">
                <Search className="h-3.5 w-3.5" />
                <span>Search tournaments, teams…</span>
                <span className="mono ml-6 flex items-center gap-1 border border-border px-1.5 py-0.5 text-[10px]">
                  <Command className="h-3 w-3" /> K
                </span>
              </div>
              <button className="relative flex h-8 w-8 items-center justify-center border border-border bg-card hover:bg-accent">
                <Bell className="h-4 w-4" />
                <span className="absolute -right-1 -top-1 h-2 w-2 bg-foreground" />
              </button>
            </div>
          </header>
          <main className="flex-1">
            <Dashboard />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
