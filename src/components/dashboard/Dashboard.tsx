import {
  ArrowUpRight,
  Plus,
  Trophy,
  Users,
  Swords,
  Activity,
  Crown,
  Target,
  Zap,
  Download,
  MoreHorizontal,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { label: "Active Tournaments", value: "07", delta: "+2", icon: Swords },
  { label: "Registered Teams", value: "184", delta: "+12", icon: Users },
  { label: "Matches Played", value: "1,294", delta: "+38", icon: Activity },
  { label: "Points Awarded", value: "47,820", delta: "+1.2k", icon: Target },
];

const tournaments = [
  { name: "Apex Legends Pro Cup S4", game: "Apex Legends", teams: 32, status: "LIVE", round: "Grand Final", progress: 86 },
  { name: "Valorant Champions Series", game: "Valorant", teams: 24, status: "ONGOING", round: "Round 5 / 8", progress: 62 },
  { name: "BGMI Showdown – Season 2", game: "BGMI", teams: 48, status: "ONGOING", round: "Round 2 / 6", progress: 33 },
  { name: "CS2 Strike Invitational", game: "Counter-Strike 2", teams: 16, status: "DRAFT", round: "Setup", progress: 8 },
];

const leaderboard = [
  { rank: 1, team: "Vortex Kings", kills: 142, placement: 9, points: 312 },
  { rank: 2, team: "Nova Syndicate", kills: 128, placement: 8, points: 298 },
  { rank: 3, team: "Iron Wolves", kills: 119, placement: 7, points: 271 },
  { rank: 4, team: "Phantom Six", kills: 108, placement: 6, points: 244 },
  { rank: 5, team: "Eclipse Order", kills: 97, placement: 5, points: 219 },
];

function StatCard({ s }: { s: (typeof stats)[number] }) {
  const Icon = s.icon;
  return (
    <div className="corner-bracket relative border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <span className="mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          {s.label}
        </span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-4 flex items-end justify-between">
        <span className="mono text-3xl font-semibold tracking-tight">{s.value}</span>
        <span className="mono text-[11px] text-foreground/80">{s.delta} ▲</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const live = status === "LIVE";
  const draft = status === "DRAFT";
  return (
    <span
      className={`mono inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${
        live
          ? "border-foreground bg-foreground text-background"
          : draft
            ? "border-border text-muted-foreground"
            : "border-border text-foreground"
      }`}
    >
      {live && <Circle className="h-1.5 w-1.5 fill-current" />}
      {status}
    </span>
  );
}

export function Dashboard() {
  return (
    <div className="relative min-h-full">
      <div className="absolute inset-0 grid-bg pointer-events-none opacity-60" />

      <div className="relative space-y-8 p-6 md:p-8">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mono flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 bg-foreground" />
              Organizer Console / Overview
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Good evening, Commander.
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              4 tournaments running tonight · next match check-in in 00:42:18
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-none border-border bg-transparent">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button className="rounded-none bg-foreground text-background hover:bg-foreground/90">
              <Plus className="mr-2 h-4 w-4" /> New Tournament
            </Button>
          </div>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} s={s} />
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Tournaments */}
          <div className="xl:col-span-2 border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="flex items-center gap-2">
                <Swords className="h-4 w-4" />
                <h2 className="mono text-xs uppercase tracking-[0.25em]">Active Tournaments</h2>
              </div>
              <Button variant="ghost" size="sm" className="rounded-none mono text-[11px] uppercase tracking-widest">
                View all <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </div>

            <div className="divide-y divide-border">
              {tournaments.map((t) => (
                <div key={t.name} className="group grid grid-cols-12 items-center gap-4 px-5 py-4 hover:bg-accent/40">
                  <div className="col-span-12 md:col-span-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center border border-border bg-background">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{t.name}</div>
                        <div className="mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          {t.game} · {t.teams} teams
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-6 md:col-span-2">
                    <StatusBadge status={t.status} />
                  </div>

                  <div className="col-span-6 md:col-span-4">
                    <div className="flex items-center justify-between">
                      <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {t.round}
                      </span>
                      <span className="mono text-[10px] text-muted-foreground">{t.progress}%</span>
                    </div>
                    <div className="mt-2 h-[3px] w-full bg-muted">
                      <div
                        className="h-full bg-foreground transition-all"
                        style={{ width: `${t.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="col-span-12 md:col-span-1 flex justify-end">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                <h2 className="mono text-xs uppercase tracking-[0.25em]">Top Squads</h2>
              </div>
              <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Apex S4
              </span>
            </div>

            <div className="px-5 py-2">
              <div className="mono grid grid-cols-12 gap-2 border-b border-border py-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <span className="col-span-1">#</span>
                <span className="col-span-5">Team</span>
                <span className="col-span-2 text-right">K</span>
                <span className="col-span-2 text-right">PL</span>
                <span className="col-span-2 text-right">PTS</span>
              </div>
              {leaderboard.map((r) => (
                <div
                  key={r.team}
                  className="grid grid-cols-12 items-center gap-2 border-b border-border/60 py-3 text-sm last:border-b-0"
                >
                  <span className="mono col-span-1 flex items-center gap-1 text-muted-foreground">
                    {r.rank === 1 ? (
                      <Crown className="h-3.5 w-3.5 text-foreground" />
                    ) : (
                      <span className="text-foreground">{r.rank}</span>
                    )}
                  </span>
                  <span className="col-span-5 truncate font-medium">{r.team}</span>
                  <span className="mono col-span-2 text-right">{r.kills}</span>
                  <span className="mono col-span-2 text-right">{r.placement}</span>
                  <span className="mono col-span-2 text-right font-semibold">{r.points}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border p-4">
              <Button variant="outline" className="w-full rounded-none border-border bg-transparent mono text-[11px] uppercase tracking-widest">
                <Download className="mr-2 h-3.5 w-3.5" />
                Export Leaderboard
              </Button>
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { title: "Create Point Table", desc: "Set kill points, placement multipliers and bonus rules.", icon: Target },
            { title: "Import Match Results", desc: "Paste lobby results or upload a CSV — we'll compute the rest.", icon: Activity },
            { title: "Publish Leaderboard", desc: "Generate a shareable link or push to overlay.", icon: Trophy },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.title}
                className="group relative border border-border bg-card p-5 text-left transition-colors hover:border-foreground"
              >
                <div className="flex items-start justify-between">
                  <Icon className="h-5 w-5" />
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                </div>
                <div className="mt-6 text-sm font-semibold">{a.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{a.desc}</div>
              </button>
            );
          })}
        </section>
      </div>
    </div>
  );
}
