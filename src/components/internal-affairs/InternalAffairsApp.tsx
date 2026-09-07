import { useEffect, useMemo, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import {
  Archive,
  BadgeCheck,
  BookOpenCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Copy,
  FileSearch,
  FileText,
  History,
  Eye,
  EyeOff,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  Plus,
  Search,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
  Video,
  X,
} from "lucide-react";
import { AppDropdownMenu } from "@/components/dashboard/AppDropdownMenu";
import { AppPopupWindow } from "@/components/dashboard/AppPopupWindow";
import { AppSelect } from "@/components/dashboard/AppSelect";
import { AppDatePicker } from "@/components/dashboard/AppDatePicker";
import { OrganizerLayout } from "@/components/dashboard/OrganizerLayout";
import { SoftwareHeader } from "@/components/dashboard/SoftwareHeader";
import { queue } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import {
  formatUkDate,
  iaApi,
  iaSession,
  londonToday,
  type IaAuditLog,
  type IaBackgroundCheck,
  type IaBodycamRequest,
  type IaDashboard,
  type IaLicenseCheck,
  type IaMember,
  type IaSettings,
  type IaUser,
  type MemberInputWithBadge as MemberInput,
} from "@/lib/internal-affairs-api";

type Tab = "dashboard" | "members" | "archives" | "daily" | "licenses" | "background" | "bodycam" | "audit" | "admin";
type Feedback = { title: string; description?: string; variant?: "success" | "error" | "warning" | "normal" };

const inputClass = "h-9 w-full rounded-[6px] border border-[#e2e5ec] bg-white px-3 text-[13px] text-[#000000] outline-none placeholder:text-[#9aa1b0] focus:border-[#000000]";
const labelClass = "mb-1.5 block text-[12px] font-medium text-[#4d5568]";
const emptyMemberInput = (): MemberInput => ({ name: "", passportNumber: "", badgeNumber: "", discordUsername: "", rank: "", primaryDepartment: "", secondaryDepartment: "", joiningDate: londonToday(), logsAssigned: false, badgeNumberAssigned: false, discordRoles: false, hiringRecord: false });

function notify(feedback: Feedback) {
  queue.add(feedback, { timeout: 5000 });
}

function discordMention(member: IaMember) {
  const identity = member.discordUsername.replace(/^@/, "").trim();
  return identity ? `@${identity}` : "";
}

function footer(user: IaUser) {
  return `**Best Regards,**\n${user.name} — ${user.rank}\n**Internal Affairs Division**\n\n> *Integrity • Accountability • Professionalism*`;
}

function logsChannelName(member: IaMember) {
  const cleanName = member.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const badge = (member.badgeNumber || "").trim();
  return badge ? `#${badge}-${cleanName}` : `#${cleanName}`;
}

function dailyCheckReportTemplate(members: IaMember[], user: IaUser, date: string) {
  const list = members.length
    ? members.map((m) => `${m.name} — ${m.passportNumber} — ${logsChannelName(m)}`).join("\n")
    : "None";
  return `# DAILY LOG CHECK REPORT\n\n**Date:** ${date}\n**Checked By:** ${user.name}\n\n**Officers Checked:**\n${list}\n\n**Total Officers Checked:** ${members.length}\n\n${footer(user)}`;
}

function activityTemplate(member: IaMember, user: IaUser) {
  return `# ACTIVITY CHECK — 1/3\n\n> **Officer:** ${discordMention(member)}\n> **Required Action:** Submit your activity log showing your start of duty.\n\nPlease ensure your log accurately reflects your commencement of duty.\n\n${footer(user)}`;
}

function licenseTemplate(rows: LicenseRow[], user: IaUser, date: string) {
  const detail = rows.map(({ member, values }) => `**${member.name}** — ${member.passportNumber}\nDL: ${mark(values.driverLicense)}  |  WL: ${mark(values.weaponsLicense)}  |  HI: ${mark(values.healthInsurance)}  |  LL: ${values.lawyerLicense === null ? "N/A" : mark(values.lawyerLicense)}`).join("\n\n");
  return `# LICENSE CHECK REPORT\n\n**Date:** ${date}\n**Checked By:** ${user.name}\n\n${detail}\n\n**DL** — Driver's License\n**WL** — Weapons License\n**HI** — Health Insurance\n**LL** — Lawyer's License\n\n${footer(user)}`;
}

function backgroundTemplate(rows: BackgroundRow[], user: IaUser, date: string) {
  const detail = rows.map(({ member, values }) => `**${member.name}** — ${member.passportNumber}\nWanted: ${mark(values.wanted)} | Prison Terms: ${mark(values.prisonTerms)} | Previous Crimes: ${mark(values.previousCrimes)} | Criminal Structures: ${mark(values.criminalStructures)}`).join("\n\n");
  return `# BACKGROUND CHECK REPORT\n\n**Date:** ${date}\n**Checked By:** ${user.name}\n\n${detail}\n\n${footer(user)}`;
}

function bodycamRequestTemplate(member: IaMember, user: IaUser, requestType: "arrest" | "activity", values: { suspectName: string; arrestDate: string; arrestTime: string; deadline: string }) {
  if (requestType === "arrest") {
    return `# BODYCAM FOOTAGE REQUEST\n\n> **Officer:** ${discordMention(member)}\n> **Suspect:** ${values.suspectName}\n> **Arrest Date:** ${values.arrestDate}\n> **Arrest Time:** ${values.arrestTime}\n\n**Required Action**\nPlease provide the bodycam footage corresponding to the above-mentioned arrest.\n\n**Submission Deadline:** ${values.deadline}\n\n${footer(user)}`;
  }
  return `# BODYCAM ACTIVITY CHECK\n\n> **Officer:** ${discordMention(member)}\n> **Required Footage:** 10 Minutes\n> **Purpose:** Activity Verification\n\nPlease provide **10 minutes of bodycam footage** from any activity conducted while on duty. This may include an arrest, traffic stop, official event, patrol activity, or any other relevant duty-related activity.\n\n**Submission Deadline:** ${values.deadline}\n\n${footer(user)}`;
}

function bodycamCheckTemplate(members: IaMember[], user: IaUser, date: string) {
  return `# BODYCAM CHECK REPORT\n\n**Date:** ${date}\n**Checked By:** ${user.name}\n\n**Officers Checked:**\n${members.map((member) => `${member.name} — ${member.passportNumber}`).join("\n")}\n\n**Total Officers Checked:** ${members.length}\n\n${footer(user)}`;
}

function bodycamLogNoticeTemplate(requests: IaBodycamRequest[], members: IaMember[], user: IaUser, date: string) {
  const list = requests.map((r) => {
    const m = members.find((mem) => mem.id === r.memberId);
    const statusLabel = r.status === "provided" ? "Provided" : r.status === "not_provided" ? "Not Provided" : "Pending";
    return m ? `${m.name} — ${m.passportNumber} — Status: ${statusLabel}` : "Former Member";
  }).join("\n");
  return `# BODYCAM REQUEST LOG\n\n**Date:** ${date}\n**Checked By:** ${user.name}\n\n**Officers Requested:**\n${list || "None"}\n\n**Total Requests Sent:** ${requests.length}\n\n${footer(user)}`;
}

function strikeTemplate(member: IaMember, user: IaUser, reason: string) {
  return `**Name:** ${member.name}\n**Punishment:** Strike\n**Reason:** ${reason}\n**Requested By:** \n**Approved By:** \n\n${footer(user)}`;
}

function rankTemplate(member: IaMember, user: IaUser, newRank: string, reason: string, isPromotion: boolean) {
  const header = isPromotion ? `**Officer:** ${member.name}\n**Passport Number:** ${member.passportNumber}\n**Old Rank:** ${member.rank}\n**New Rank:** ${newRank}\n**Reason:** ${reason}\n**Given By:** ` : `**Officer Name:** ${member.name}\n**Passport Number:** ${member.passportNumber}\n**Old Rank:** ${member.rank}\n**New Rank:** ${newRank}\n**Reason:** ${reason}\n**Approved by:** `;
  return header;
}

function firingTemplate(member: IaMember, user: IaUser, reason: string) {
  return `**Officer Name:** ${member.name}\n**Passport Number:** ${member.passportNumber}\n**Reason:** ${reason}\n**Fired By:** ${user.name}\n**Proof:** `;
}

function mark(value: boolean) { return value ? "✓" : "✗"; }

async function copyMessage(message: string, label = "Discord message") {
  try {
    await navigator.clipboard.writeText(message);
    notify({ title: `${label} copied`, description: "The final Discord Markdown is ready to paste.", variant: "success" });
  } catch {
    notify({ title: "Could not copy automatically", description: "Please use the preview text to copy the message.", variant: "error" });
  }
}

function rankOrder(rank: string, ranks: string[]) {
  const index = ranks.indexOf(rank);
  return index < 0 ? Number.MAX_SAFE_INTEGER : index;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#4d5568]"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 rounded border-[#c8ced9] accent-black" />{label}</label>;
}

function Panel({ title, description, children, action }: { title: string; description?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <section className="rounded-[10px] border border-[#e2e5ec] bg-white"><div className="flex items-start justify-between gap-3 border-b border-[#f0f1f3] px-5 py-4"><div><h2 className="text-[15px] font-semibold text-[#000000]">{title}</h2>{description ? <p className="mt-1 text-[12px] text-[#666666]">{description}</p> : null}</div>{action}</div><div className="p-5">{children}</div></section>;
}

function PrimaryButton({ children, onClick, disabled, className }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
  return <button type="button" onClick={onClick} disabled={disabled} className={cn("inline-flex h-9 items-center justify-center gap-1.5 rounded-[7px] bg-[#000000] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-50", className)}>{children}</button>;
}

function SecondaryButton({ children, onClick, disabled, className }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
  return <button type="button" onClick={onClick} disabled={disabled} className={cn("inline-flex h-9 items-center justify-center gap-1.5 rounded-[7px] border border-[#e2e5ec] bg-white px-3.5 text-[13px] font-medium text-[#000000] transition-colors hover:bg-[#f7f8fb] disabled:cursor-not-allowed disabled:opacity-50", className)}>{children}</button>;
}

export function InternalAffairsGate() {
  const [session, setSession] = useState(iaSession.get());
  const [checking, setChecking] = useState(Boolean(session));

  useEffect(() => {
    if (!session) return;
    iaSession.me().then(({ user }) => setSession((existing) => existing ? { ...existing, user } : existing)).catch(() => { iaSession.clear(); setSession(null); }).finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    const handleUserUpdate = () => {
      const active = iaSession.get();
      if (active) setSession(active);
    };
    window.addEventListener("ia:user-updated", handleUserUpdate);
    return () => window.removeEventListener("ia:user-updated", handleUserUpdate);
  }, []);

  if (checking) return <div className="min-h-screen bg-[#fbfbfc] grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#666]" /></div>;
  return session ? <InternalAffairsApp user={session.user} onLogout={() => { iaSession.clear(); setSession(null); }} /> : <InternalAffairsLogin onLogin={setSession} />;
}

function InternalAffairsLogin({ onLogin }: { onLogin: (session: ReturnType<typeof iaSession.get> extends infer T ? NonNullable<T> : never) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try { onLogin(await iaSession.login(email, password, false)); }
    catch (error) { notify({ title: "Sign-in failed", description: error instanceof Error ? error.message : "Please try again.", variant: "error" }); }
    finally { setLoading(false); }
  };
  return <main className="flex h-screen w-screen overflow-hidden bg-white text-zinc-950 select-none">
    <div className="flex w-full items-center justify-center px-6 py-10 lg:w-1/2">
      <form onSubmit={submit} className="w-full max-w-[400px]">
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold tracking-tight text-zinc-950">Log In</h1>
          <p className="mt-1 text-[14px] text-zinc-500">Enter your email and password to access Internal Affairs.</p>
        </div>
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-[13px] font-medium text-zinc-700">Email</label>
            <input className="h-[42px] w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[14px] outline-none transition focus:border-black focus:ring-1 focus:ring-black" autoComplete="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div>
            <label className="mb-2 block text-[13px] font-medium text-zinc-700">Password</label>
            <div className="relative">
              <input className="h-[42px] w-full rounded-[10px] border border-zinc-200 bg-white px-3 pr-10 text-[14px] outline-none transition focus:border-black focus:ring-1 focus:ring-black" autoComplete="current-password" type={showPassword ? "text" : "password"} required value={password} onChange={(event) => setPassword(event.target.value)} />
              <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-zinc-700">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="flex h-[42px] w-full items-center justify-center gap-2 rounded-[10px] bg-black text-[14px] font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}Sign In
          </button>
        </div>
        <p className="mt-7 text-center text-[11px] leading-relaxed text-zinc-400">Access is issued by an Internal Affairs administrator. There is no public sign-up.</p>
      </form>
    </div>
    <div className="relative hidden h-full w-1/2 bg-zinc-900 lg:block">
      <img src="/Login/Login.jpg" alt="" className="h-full w-full object-cover opacity-90" />
      <a href="/" aria-label="Go to home" className="absolute right-8 top-8"><img src="/Brand/Favicon.png" alt="Grand Wiki" className="h-10 w-10 object-contain" /></a>
    </div>
  </main>;
}

function InternalAffairsApp({ user, onLogout }: { user: IaUser; onLogout: () => void }) {
  const location = useLocation();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [settings, setSettings] = useState<IaSettings | null>(null);
  const [members, setMembers] = useState<IaMember[]>([]);
  const [archives, setArchives] = useState<IaMember[]>([]);
  const [dashboard, setDashboard] = useState<IaDashboard | null>(null);
  const [audits, setAudits] = useState<IaAuditLog[]>([]);
  const [dailyDate, setDailyDate] = useState(londonToday());
  const [dailyCheckedIds, setDailyCheckedIds] = useState<Set<string>>(new Set());
  const [licenses, setLicenses] = useState<IaLicenseCheck[]>([]);
  const [backgrounds, setBackgrounds] = useState<IaBackgroundCheck[]>([]);
  const [bodycamRequests, setBodycamRequests] = useState<IaBodycamRequest[]>([]);
  const [bodycamChecks, setBodycamChecks] = useState<{ id: string; memberIds: string[]; date: string; checkedBy: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberModal, setMemberModal] = useState<{ open: boolean; mode: "create" | "edit" | "rehire"; member?: IaMember }>({ open: false, mode: "create" });
  const [selectedMember, setSelectedMember] = useState<IaMember | null>(null);

  const load = async () => {
    try {
      const [nextSettings, nextMembers, nextArchives, nextDashboard, nextAudits, daily, nextLicenses, nextBackgrounds, requests, checks] = await Promise.all([iaApi.getSettings(), iaApi.getMembers("active"), iaApi.getMembers("archived"), iaApi.getDashboard(), iaApi.getAuditLogs(), iaApi.getDailyChecks(dailyDate), iaApi.getLicenseChecks(), iaApi.getBackgroundChecks(), iaApi.getBodycamRequests(), iaApi.getBodycamChecks()]);
      setSettings(nextSettings); setMembers(nextMembers); setArchives(nextArchives); setDashboard(nextDashboard); setAudits(nextAudits); setDailyCheckedIds(new Set(daily.checks.map((check) => check.memberId))); setLicenses(nextLicenses); setBackgrounds(nextBackgrounds); setBodycamRequests(requests); setBodycamChecks(checks);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load the Internal Affairs system.";
      notify({ title: "Could not load Internal Affairs", description: message, variant: "error" });
      if (/session|authentication|expired|account is no longer/i.test(message)) onLogout();
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [dailyDate]);
  const refresh = async () => { setLoading(true); await load(); };

  const nav: Array<{ id: Tab; label: string; icon: React.ReactNode; admin?: boolean }> = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "members", label: "Members", icon: <Users className="h-4 w-4" /> },
    { id: "archives", label: "Archives", icon: <Archive className="h-4 w-4" /> },
    { id: "daily", label: "Daily Log Check", icon: <ClipboardCheck className="h-4 w-4" /> },
    { id: "licenses", label: "License Checks", icon: <BadgeCheck className="h-4 w-4" /> },
    { id: "background", label: "Background Checks", icon: <FileSearch className="h-4 w-4" /> },
    { id: "bodycam", label: "Bodycam Checks", icon: <Video className="h-4 w-4" /> },
    { id: "audit", label: "Audit Logs", icon: <History className="h-4 w-4" /> },
    { id: "admin", label: "Admin Panel", icon: <Settings2 className="h-4 w-4" />, admin: true },
  ];
  useEffect(() => {
    const requestedTab = (location.search as Record<string, string>).tab as Tab | undefined;
    if (requestedTab && nav.some((item) => item.id === requestedTab)) setTab(requestedTab);
  }, [location.search]);
  const label = nav.find((item) => item.id === tab)?.label || "Internal Affairs";

  return <OrganizerLayout header={<SoftwareHeader title="Internal Affairs" />}><main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-[22px] font-semibold tracking-tight">{label}</h2></div>{tab === "members" ? <PrimaryButton onClick={() => setMemberModal({ open: true, mode: "create" })}><UserPlus className="h-4 w-4" />Add Member</PrimaryButton> : null}</div>{loading ? <div className="grid min-h-[320px] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#666]" /></div> : <>{tab === "dashboard" && dashboard ? <DashboardView data={dashboard} audits={audits} onTabChange={setTab} /> : null}{tab === "members" ? <MembersView members={members} settings={settings} user={user} onOpen={(member) => setSelectedMember(member)} onEdit={(member) => setMemberModal({ open: true, mode: "edit", member })} onRefresh={refresh} /> : null}{tab === "archives" ? <ArchivesView members={archives} onRehire={(member) => setMemberModal({ open: true, mode: "rehire", member })} onRefresh={refresh} /> : null}{tab === "daily" ? <DailyLogCheckView members={members} user={user} audits={audits} onRefresh={refresh} /> : null}{tab === "licenses" ? <LicenseCheckView members={members} user={user} history={licenses} onRefresh={refresh} /> : null}{tab === "background" ? <BackgroundCheckView members={members} user={user} history={backgrounds} onRefresh={refresh} /> : null}{tab === "bodycam" ? <BodycamView members={members} user={user} requests={bodycamRequests} checks={bodycamChecks} onRefresh={refresh} /> : null}{tab === "audit" ? <AuditView audits={audits} /> : null}{tab === "admin" && user.isAdmin && settings ? <AdminView user={user} settings={settings} onRefresh={refresh} /> : null}</>}</main><MemberFormModal state={memberModal} settings={settings} onClose={() => setMemberModal((state) => ({ ...state, open: false }))} onSaved={async () => { setMemberModal({ open: false, mode: "create" }); await refresh(); }} /><MemberProfileModal member={selectedMember} user={user} settings={settings} onClose={() => setSelectedMember(null)} onEdit={() => selectedMember && setMemberModal({ open: true, mode: "edit", member: selectedMember })} onRefresh={refresh} /></OrganizerLayout>;
}

function DashboardView({ data, audits, onTabChange }: { data: IaDashboard; audits: IaAuditLog[]; onTabChange: (tab: Tab) => void }) {
  const cards = [["Total Members", data.totalMembers], ["Members on LOA", data.membersOnLoa], ["Archived Members", data.archivedMembers], ["Missing Logs", data.missingLogs], ["Missing Hiring Logs", data.missingHiringLogs], ["Missing Roles", data.missingRoles], ["Daily Log Check", `${data.dailyLogProgress.checked} / ${data.dailyLogProgress.checked + data.dailyLogProgress.remaining}`], ["Pending Bodycam", `${data.pendingBodycam.provided} provided / ${data.pendingBodycam.notProvided} pending`]];
  return <div className="space-y-5"><div className="overflow-x-auto border-y border-[#e2e5ec]"><div className="grid min-w-[1080px] grid-cols-[repeat(7,minmax(0,1fr))_minmax(260px,1.5fr)] divide-x divide-[#e2e5ec] py-3">{cards.map(([title, value]) => <div key={String(title)} className="min-w-0 px-3 first:pl-0 last:pr-0"><p className="truncate text-[10px] font-medium uppercase tracking-[0.08em] text-[#8a90a0]">{title}</p><p className="mt-1 whitespace-nowrap text-[17px] font-semibold tracking-tight text-[#000]">{value}</p></div>)}</div></div><Panel title="Quick Actions" description="Open a confirmed Internal Affairs workflow."><div className="flex flex-wrap gap-2">{([ ["Add Member", "members"], ["Daily Log Check", "daily"], ["License Check", "licenses"], ["Background Check", "background"], ["Bodycam Check", "bodycam"], ["Audit Logs", "audit"] ] as Array<[string, Tab]>).map(([title, destination]) => <SecondaryButton key={title} onClick={() => onTabChange(destination)}>{title}</SecondaryButton>)}</div></Panel><Panel title="Recent IA Activity" description="Latest material changes recorded by the system."><AuditRows audits={audits.slice(0, 10)} /></Panel></div>;
}

function LegacyMembersView({ members, settings, user, onOpen, onEdit, onRefresh }: { members: IaMember[]; settings: IaSettings | null; user: IaUser; onOpen: (member: IaMember) => void; onEdit: (member: IaMember) => void; onRefresh: () => Promise<void> }) {
  const [search, setSearch] = useState(""); const [department, setDepartment] = useState(""); const [rank, setRank] = useState(""); const [page, setPage] = useState(1); const [confirm, setConfirm] = useState<{ kind: "delete" | "fire"; member: IaMember } | null>(null); const [fireReason, setFireReason] = useState("");
  const filtered = useMemo(() => members.filter((member) => (!search || [member.name, member.passportNumber, member.discordUsername].join(" ").toLowerCase().includes(search.toLowerCase())) && (!department || member.primaryDepartment === department) && (!rank || member.rank === rank)), [members, search, department, rank]);
  const pages = Math.max(1, Math.ceil(filtered.length / 20)); const visible = filtered.slice((page - 1) * 20, page * 20);
  useEffect(() => setPage(1), [search, department, rank]);
  const utility = { missingLogs: members.filter((member) => !member.logsAssigned), missingHiring: members.filter((member) => !member.hiringRecord), missingRoles: members.filter((member) => !member.discordRoles) };
  const runConfirm = async () => { if (!confirm) return; try { if (confirm.kind === "delete") await iaApi.deleteMember(confirm.member.id); else { if (!fireReason.trim()) return notify({ title: "Reason required", variant: "warning" }); await iaApi.fireMember(confirm.member.id, fireReason); } notify({ title: confirm.kind === "delete" ? "Member deleted" : "Member moved to Archives successfully", variant: "success" }); setConfirm(null); setFireReason(""); await onRefresh(); } catch (error) { notify({ title: "Action failed", description: error instanceof Error ? error.message : "Please try again.", variant: "error" }); } };
  return <div className="space-y-5"><Panel title={`Members (${members.length})`} description="Search the current organisation roster. Filters are limited to Department and Rank."><div className="mb-4 flex flex-col gap-2 lg:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#9aa1b0]" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="h-9 w-full rounded-[6px] border border-[#e2e5ec] bg-white pl-9 pr-3 text-[13px] outline-none focus:border-[#000]" placeholder="Search name, passport number, or Discord username" /></div><AppSelect compact value={department} onChange={setDepartment} options={[{ value: "", label: "All departments" }, ...(settings?.departments || []).map((value) => ({ value, label: value }))]} className="lg:w-[190px]" /><AppSelect compact value={rank} onChange={setRank} options={[{ value: "", label: "All ranks" }, ...(settings?.ranks || []).map((value) => ({ value, label: value }))]} className="lg:w-[190px]" /></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-[13px]"><thead><tr className="border-y border-[#e2e5ec] bg-[#f7f8fb] text-[11px] font-semibold uppercase tracking-wide text-[#8a90a0]"><th className="px-3 py-2.5">Name</th><th className="px-3 py-2.5">Rank</th><th className="px-3 py-2.5">Primary Department</th><th className="px-3 py-2.5 text-right">Manage</th><th className="px-3 py-2.5 text-right">Actions</th></tr></thead><tbody>{visible.map((member) => <tr key={member.id} className="border-b border-[#f0f1f3] hover:bg-[#fafbfc] [&>td]:align-middle"><td className="px-3 py-3"><button type="button" onClick={() => onOpen(member)} className="text-left font-medium hover:underline">{member.name}<span className="mt-0.5 block text-[11px] font-normal text-[#8a90a0]">{member.passportNumber}</span></button></td><td className="px-3 py-3"><span className="rounded-[4px] bg-[#f0f1f3] px-2 py-1 text-[11px]">{member.rank}</span></td><td className="px-3 py-3 text-[#4d5568]">{member.primaryDepartment || "-"}</td><td className="px-3 py-3 text-right"><SecondaryButton onClick={() => onEdit(member)}><UserCog className="h-3.5 w-3.5" />Manage</SecondaryButton></td><td className="px-3 py-3 text-right"><AppDropdownMenu trigger={<button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-[7px] border border-[#e2e5ec] bg-white px-3 text-[13px] font-medium text-[#000] hover:bg-[#f7f8fb]">Actions</button>} items={[{ label: "Delete", danger: true, icon: <X className="h-4 w-4" />, onSelect: () => setConfirm({ kind: "delete", member }) }, { label: "Fire", danger: true, icon: <Archive className="h-4 w-4" />, onSelect: () => setConfirm({ kind: "fire", member }) }]} /></td></tr>)}{!visible.length ? <tr><td colSpan={5} className="px-3 py-10 text-center text-[#8a90a0]">No current members match the selected filters.</td></tr> : null}</tbody></table></div>{filtered.length > 20 ? <div className="mt-4 flex items-center justify-between text-[12px] text-[#666]"><span>Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, filtered.length)} of {filtered.length}</span><div className="flex gap-1"><SecondaryButton disabled={page === 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft className="h-3.5 w-3.5" /></SecondaryButton><SecondaryButton disabled={page === pages} onClick={() => setPage((value) => value + 1)}><ChevronRight className="h-3.5 w-3.5" /></SecondaryButton></div></div> : null}</Panel><div className="grid gap-4 xl:grid-cols-3"><UtilityPanel title="Missing Logs" members={utility.missingLogs} user={user} template={(list) => `# LOG REQUEST NOTICE\n\nThe following members currently do not have their required logs assigned.\n\n**Members Required to Request Logs:**\n${list.map((member) => `${member.name} — ${discordMention(member)}`).join("\n")}\n\nAll listed members are given **24 hours** to submit a request for their required logs.\n\nFailure to request the required logs within the given timeframe may result in further action.\n\n${footer(user)}`} /><UtilityPanel title="Missing Hiring Logs" members={utility.missingHiring} user={user} template={() => ""} /><UtilityPanel title="Missing Roles" members={utility.missingRoles} user={user} template={(list) => `# ROLE REQUEST NOTICE\n\nThe following members are currently part of the organisation but do not have the required organisation roles.\n\n**Members Required to Request Roles:**\n${list.map((member) => `${member.name} — ${discordMention(member)}`).join("\n")}\n\nAll listed members are given **24 hours** to submit a role request.\n\nFailure to request the required roles within the given timeframe may result in further action.\n\n${footer(user)}`} /></div><AppPopupWindow open={Boolean(confirm)} onOpenChange={(open) => !open && setConfirm(null)} title={confirm?.kind === "fire" ? "Fire Member" : "Delete Member"} description={confirm?.kind === "fire" ? "This moves the member to Archives and preserves their record for rehire." : "This permanently removes the member from the database."} footer={<><SecondaryButton onClick={() => setConfirm(null)}>Cancel</SecondaryButton><PrimaryButton onClick={runConfirm} className="bg-[#b42318] hover:bg-[#8f1c13]">{confirm?.kind === "fire" ? "Fire Member" : "Delete Member"}</PrimaryButton></>}><div className="space-y-4 p-6">{confirm?.kind === "fire" ? <><div className="rounded-[7px] bg-[#f7f8fb] p-3 text-[13px]"><strong>{confirm.member.name}</strong> — {confirm.member.passportNumber}</div><div><label className={labelClass}>Reason <span className="text-[#b42318]">*</span></label><textarea className="min-h-[92px] w-full rounded-[6px] border border-[#e2e5ec] p-3 text-[13px] outline-none focus:border-[#000]" value={fireReason} onChange={(event) => setFireReason(event.target.value)} /><DiscordPreview value={firingTemplate(confirm.member, user, fireReason)} /></div></> : <p className="text-[13px] text-[#4d5568]">Delete {confirm?.member.name}'s record?</p>}</div></AppPopupWindow></div>;
}

function UtilityPanel({ title, members, template }: { title: string; members: IaMember[]; user: IaUser; template: (members: IaMember[]) => string }) { return <Panel title={`${title} (${members.length})`}><div className="space-y-2">{members.slice(0, 5).map((member) => <p key={member.id} className="text-[12px] text-[#4d5568]">{member.name} <span className="text-[#9aa1b0]">— {member.passportNumber}</span></p>)}{!members.length ? <p className="text-[12px] text-[#8a90a0]">Nothing requires attention.</p> : null}{template(members) ? <SecondaryButton onClick={() => copyMessage(template(members), `${title} notice`)}><Copy className="h-3.5 w-3.5" />Copy notice</SecondaryButton> : null}</div></Panel>; }

function UtilityPopup({ kind, open, members, user, onClose }: { kind: "logs" | "hiring" | "roles"; open: boolean; members: IaMember[]; user: IaUser; onClose: () => void }) {
  const title = kind === "logs" ? "Missing Logs" : kind === "hiring" ? "Missing Hiring Logs" : "Missing Roles";
  const template = kind === "logs"
    ? (list: IaMember[]) => `# LOG REQUEST NOTICE\n\nThe following members currently do not have their required logs assigned.\n\n**Members Required to Request Logs:**\n${list.map((member) => `${member.name} — ${discordMention(member)}`).join("\n")}\n\nAll listed members are given **24 hours** to submit a request for their required logs.\n\nFailure to request the required logs within the given timeframe may result in further action.\n\n${footer(user)}`
    : kind === "roles"
      ? (list: IaMember[]) => `# ROLE REQUEST NOTICE\n\nThe following members are currently part of the organisation but do not have the required organisation roles.\n\n**Members Required to Request Roles:**\n${list.map((member) => `${member.name} — ${discordMention(member)}`).join("\n")}\n\nAll listed members are given **24 hours** to submit a role request.\n\nFailure to request the required roles within the given timeframe may result in further action.\n\n${footer(user)}`
      : () => "";
  const message = template(members);
  return <AppPopupWindow open={open} onOpenChange={(value) => !value && onClose()} title={`${title} (${members.length})`} description="Review the complete list of members requiring attention." footer={<><SecondaryButton onClick={onClose}>Close</SecondaryButton>{message ? <PrimaryButton onClick={() => copyMessage(message, `${title} notice`)}><Copy className="h-3.5 w-3.5" />Copy notice</PrimaryButton> : null}</>}><div className="max-h-[55vh] overflow-y-auto p-6">{members.length ? <div className="divide-y divide-[#f0f1f3]">{members.map((member) => <div key={member.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"><div><p className="text-[13px] font-medium">{member.name}</p><p className="text-[11px] text-[#8a90a0]">Passport {member.passportNumber}</p></div><span className="text-[12px] text-[#666]">{member.rank}</span></div>)}</div> : <p className="text-[13px] text-[#8a90a0]">Nothing requires attention.</p>}</div></AppPopupWindow>;
}

function ArchivesView({
  members,
  onRehire,
  onRefresh,
}: {
  members: IaMember[];
  onRehire: (member: IaMember) => void;
  onRefresh: () => Promise<void>;
}) {
  const [rolesModalOpen, setRolesModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const needingRoles = useMemo(() => {
    return members.filter((member) => !member.rolesRemoved && member.discordRoles);
  }, [members]);

  const removeRoles = async (member: IaMember) => {
    setUpdatingId(member.id);
    try {
      await iaApi.markRolesRemoved(member.id);
      notify({
        title: "Roles marked as removed",
        description: `${member.name} no longer appears in the roles-removal list.`,
        variant: "success",
      });
      await onRefresh();
    } catch (error) {
      notify({
        title: "Could not update roles",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#e2e5ec] bg-white p-4">
        <div>
          <h3 className="text-[16px] font-semibold text-[#000]">Archives Roster</h3>
          <p className="mt-0.5 text-[12px] text-[#666]">
            Former members stored for verified rehire records and role removals.
          </p>
        </div>
        <SecondaryButton onClick={() => setRolesModalOpen(true)}>
          <ShieldAlert className="h-4 w-4 text-[#8a90a0]" />
          Roles Removal ({needingRoles.length})
        </SecondaryButton>
      </div>

      <Panel title={`Archives (${members.length})`} description="Former members available for rehire.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-[13px]">
            <thead>
              <tr className="border-y border-[#e2e5ec] bg-[#f7f8fb] text-[11px] font-semibold uppercase tracking-wide text-[#8a90a0]">
                <th className="px-3 py-2.5">Name</th>
                <th className="px-3 py-2.5">Left Date</th>
                <th className="px-3 py-2.5">Reason</th>
                <th className="px-3 py-2.5 text-right">Rehire</th>
                <th className="px-3 py-2.5 text-right">Roles Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-[#f0f1f3]">
                  <td className="px-3 py-3 font-medium">
                    {member.name}
                    <span className="mt-0.5 block text-[11px] font-normal text-[#8a90a0]">{member.passportNumber}</span>
                  </td>
                  <td className="px-3 py-3 text-[#4d5568]">{member.leftDate || "-"}</td>
                  <td className="max-w-[280px] px-3 py-3 text-[#4d5568]">{member.leftReason || "-"}</td>
                  <td className="px-3 py-3 text-right">
                    <SecondaryButton onClick={() => onRehire(member)}>
                      <UserPlus className="h-3.5 w-3.5" />Rehire
                    </SecondaryButton>
                  </td>
                  <td className="px-3 py-3 text-right">
                    {member.rolesRemoved || !member.discordRoles ? (
                      <span className="rounded-[4px] bg-[#f0f1f3] px-2 py-0.5 text-[11px] font-medium text-[#8a90a0]">Removed</span>
                    ) : (
                      <span className="rounded-[4px] bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">Pending Removal</span>
                    )}
                  </td>
                </tr>
              ))}
              {!members.length ? (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-[#8a90a0]">
                    No archived members.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>

      <AppPopupWindow
        open={rolesModalOpen}
        onOpenChange={(open) => !open && setRolesModalOpen(false)}
        title={`Roles Removal List (${needingRoles.length})`}
        description="Archived members who still require organisation roles removed."
        className="max-w-[650px]"
        footer={<SecondaryButton onClick={() => setRolesModalOpen(false)}>Close</SecondaryButton>}
      >
        <div className="max-h-[60vh] space-y-3 overflow-y-auto p-6">
          {needingRoles.map((member) => (
            <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[#e2e5ec] bg-[#fafbfc] p-3 text-[13px]">
              <div>
                <p className="font-semibold text-[#000]">{member.name}</p>
                <p className="text-[11px] text-[#8a90a0]">
                  Passport: {member.passportNumber} {member.rank ? `· ${member.rank}` : ""}
                </p>
              </div>
              <PrimaryButton
                disabled={updatingId === member.id}
                onClick={() => removeRoles(member)}
              >
                {updatingId === member.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Mark Removed
              </PrimaryButton>
            </div>
          ))}
          {!needingRoles.length ? (
            <p className="py-8 text-center text-[13px] text-[#8a90a0]">
              All archived members have had their roles removed.
            </p>
          ) : null}
        </div>
      </AppPopupWindow>
    </div>
  );
}

type LicenseValues = { driverLicense: boolean; weaponsLicense: boolean; healthInsurance: boolean; lawyerLicense: boolean | null };
type LicenseRow = { member: IaMember; values: LicenseValues };
type BackgroundValues = { wanted: boolean; prisonTerms: boolean; previousCrimes: boolean; criminalStructures: boolean };
type BackgroundRow = { member: IaMember; values: BackgroundValues };

function DailyLogCheckView({
  members,
  user,
  audits = [],
  onRefresh,
}: {
  members: IaMember[];
  user: IaUser;
  audits?: IaAuditLog[];
  onRefresh: () => Promise<void>;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCheckedIds, setModalCheckedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const dailyAudits = useMemo(() => {
    return audits.filter((a) => a.action === "DAILY_LOG_CHECK_SAVED");
  }, [audits]);

  const historyDates = useMemo(() => {
    const list = [londonToday()];
    dailyAudits.forEach((a) => {
      const d = (a.metadata?.id as string) || a.entityId || a.details?.match(/\d{4}-\d{2}-\d{2}/)?.[0];
      if (d && !list.includes(d)) list.push(d);
    });
    return list;
  }, [dailyAudits]);

  const [selectedDate, setSelectedDate] = useState(historyDates[0] || londonToday());

  useEffect(() => {
    if (!historyDates.includes(selectedDate) && historyDates[0]) {
      setSelectedDate(historyDates[0]);
    }
  }, [historyDates, selectedDate]);

  const [dailyData, setDailyData] = useState<{ date: string; checks: IaDailyCheck[] }>({ date: selectedDate, checks: [] });

  useEffect(() => {
    let cancelled = false;
    iaApi.getDailyChecks(selectedDate).then((res) => {
      if (!cancelled && res) setDailyData(res);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [selectedDate]);

  const checkedSetForSelected = useMemo(() => {
    return new Set(dailyData.checks.map((c) => c.memberId));
  }, [dailyData]);

  const toggleModalMember = (id: string) => {
    setModalCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllModal = () => setModalCheckedIds(new Set(members.map((m) => m.id)));
  const clearAllModal = () => setModalCheckedIds(new Set());

  const saveModalCheck = async () => {
    setSaving(true);
    try {
      const today = londonToday();
      await iaApi.saveDailyChecks(today, [...modalCheckedIds]);
      notify({ title: "Daily log check saved", description: `Recorded daily log checks for ${today}.`, variant: "success" });
      setModalOpen(false);
      setSelectedDate(today);
      await onRefresh();
    } catch (error) {
      notify({ title: "Could not save daily checks", description: error instanceof Error ? error.message : "Please try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const visibleModalMembers = members.filter((m) =>
    `${m.name} ${m.passportNumber}`.toLowerCase().includes(search.toLowerCase())
  );

  const selectedAudit = dailyAudits.find((a) => (a.metadata?.id || a.entityId) === selectedDate);
  const checkedMembersCount = checkedSetForSelected.size;

  const copyNoticeText = useMemo(() => {
    const checkedMembers = members.filter((m) => checkedSetForSelected.has(m.id));
    return dailyCheckReportTemplate(checkedMembers, user, selectedDate);
  }, [members, checkedSetForSelected, selectedDate, user]);

  const modalCheckedMembers = useMemo(() => {
    return members.filter((m) => modalCheckedIds.has(m.id));
  }, [members, modalCheckedIds]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#e2e5ec] bg-white p-4">
        <div>
          <h3 className="text-[16px] font-semibold text-[#000]">Daily Log Check</h3>
          <p className="mt-0.5 text-[12px] text-[#666]">Select a past check record on the left to view results, or add a new record.</p>
        </div>
        <PrimaryButton onClick={() => { setModalCheckedIds(new Set(dailyData.checks.map(c => c.memberId))); setModalOpen(true); }}>
          <Plus className="h-4 w-4" />Add Record
        </PrimaryButton>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="rounded-[10px] border border-[#e2e5ec] bg-white p-4">
          <div className="mb-3 flex items-center justify-between border-b border-[#f0f1f3] pb-3">
            <h4 className="text-[13px] font-semibold text-[#000]">Past Log Checks</h4>
            <span className="text-[11px] font-medium text-[#8a90a0]">{historyDates.length} Records</span>
          </div>
          <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
            {historyDates.map((d) => {
              const auditForDate = dailyAudits.find((a) => (a.metadata?.id || a.entityId) === d);
              const isSelected = d === selectedDate;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDate(d)}
                  className={cn(
                    "block w-full rounded-[8px] border p-3 text-left transition-all",
                    isSelected
                      ? "border-[#000000] bg-[#f7f8fb] shadow-2xs"
                      : "border-[#e2e5ec] bg-white hover:border-[#b0b7c3] hover:bg-[#fafbfc]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-[#000]">{formatUkDate(d)}</span>
                    {d === londonToday() ? (
                      <span className="rounded-[4px] bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Today</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[11px] text-[#666]">
                    {auditForDate ? `Recorded by ${auditForDate.actorName}` : "Recorded Daily Check"}
                  </p>
                </button>
              );
            })}
            {!historyDates.length ? <p className="py-6 text-center text-[12px] text-[#8a90a0]">No past daily log checks.</p> : null}
          </div>
        </div>

        <div className="rounded-[10px] border border-[#e2e5ec] bg-white p-4 space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f1f3] pb-3">
            <div>
              <h4 className="text-[15px] font-semibold text-[#000]">{formatUkDate(selectedDate)} — Result</h4>
              <p className="mt-0.5 text-[12px] text-[#666]">
                {checkedMembersCount} of {members.length} members checked
                {selectedAudit ? ` · Recorded by ${selectedAudit.actorName}` : ""}
              </p>
            </div>
            <SecondaryButton onClick={() => copyMessage(copyNoticeText, "Daily log check notice")}>
              <Copy className="h-3.5 w-3.5" />Copy Notice
            </SecondaryButton>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] text-left text-[13px]">
              <thead>
                <tr className="border-y border-[#e2e5ec] bg-[#f7f8fb] text-[11px] font-semibold uppercase tracking-wide text-[#8a90a0]">
                  <th className="px-3 py-2.5">Member</th>
                  <th className="px-3 py-2.5">LOA Status</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const isChecked = checkedSetForSelected.has(m.id);
                  const onLoa = (m.activeLoas || []).length > 0;
                  return (
                    <tr key={m.id} className="border-b border-[#f0f1f3]">
                      <td className="px-3 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            title={`Copy ${m.name}`}
                            onClick={() => copyMessage(m.name, "Officer name")}
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] border border-[#e2e5ec] bg-white text-[#666] transition-colors hover:border-[#000] hover:bg-[#f7f8fb] hover:text-[#000]"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                          <div>
                            <span className="block text-[13px] font-medium text-[#000]">{m.name}</span>
                            <span className="block text-[11px] font-normal text-[#8a90a0]">{m.passportNumber}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {onLoa ? (
                          <span className="rounded-[4px] bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800">
                            On LOA until {m.activeLoas[0].endDate}
                          </span>
                        ) : (
                          <span className="text-[12px] text-[#8a90a0]">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {isChecked ? (
                          <span className="inline-flex items-center gap-1 rounded-[4px] bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">✓ Checked</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-[4px] bg-zinc-100 px-2 py-0.5 text-[11px] text-[#8a90a0]">✗ Not Checked</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AppPopupWindow
        open={modalOpen}
        onOpenChange={(open) => !open && setModalOpen(false)}
        title="Add Daily Log Check Record"
        description="Select current organization members whose activity logs were verified today."
        className="max-w-[900px]"
        footer={
          <>
            <SecondaryButton onClick={() => setModalOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton disabled={saving} onClick={saveModalCheck}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save Record
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] bg-[#f7f8fb] p-3 text-[13px]">
            <div>
              <span className="font-semibold text-[#000]">Check Date: </span>
              <span className="font-mono text-[#000]">{londonToday()}</span>
            </div>
            <div className="flex gap-2">
              <SecondaryButton onClick={selectAllModal}>Select All</SecondaryButton>
              <SecondaryButton onClick={clearAllModal}>Clear All</SecondaryButton>
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#9aa1b0]" />
            <input
              className="h-9 w-full rounded-[6px] border border-[#e2e5ec] bg-white pl-9 pr-3 text-[13px] outline-none focus:border-[#000]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search member name or passport number"
            />
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            <table className="w-full min-w-[550px] text-left text-[13px]">
              <thead>
                <tr className="border-y border-[#e2e5ec] bg-[#f7f8fb] text-[11px] font-semibold uppercase tracking-wide text-[#8a90a0]">
                  <th className="px-3 py-2.5">Member</th>
                  <th className="px-3 py-2.5">Rank</th>
                  <th className="px-3 py-2.5">LOA</th>
                  <th className="px-3 py-2.5 text-center">Copy Notice</th>
                  <th className="px-3 py-2.5 text-center">Mark Checked</th>
                </tr>
              </thead>
              <tbody>
                {visibleModalMembers.map((m) => {
                  const checked = modalCheckedIds.has(m.id);
                  const onLoa = (m.activeLoas || []).length > 0;
                  return (
                    <tr key={m.id} className="border-b border-[#f0f1f3]">
                      <td className="px-3 py-3 font-medium">
                        {m.name}
                        <span className="mt-0.5 block text-[11px] font-normal text-[#8a90a0]">{m.passportNumber}</span>
                      </td>
                      <td className="px-3 py-3 text-[#4d5568]">{m.rank}</td>
                      <td className="px-3 py-3">
                        {onLoa ? <span className="rounded-[4px] bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">LOA Active</span> : "-"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <SecondaryButton onClick={() => copyMessage(activityTemplate(m, user), "Activity check notice")}>
                          <Copy className="h-3.5 w-3.5" />Copy Notice
                        </SecondaryButton>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleModalMember(m.id)}
                          className="h-4 w-4 rounded border-[#c8ced9] accent-black"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </AppPopupWindow>
    </div>
  );
}

function LicenseCheckView({
  members,
  user,
  history = [],
  onRefresh,
}: {
  members: IaMember[];
  user: IaUser;
  history: IaLicenseCheck[];
  onRefresh: () => Promise<void>;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [modalRows, setModalRows] = useState<Record<string, LicenseValues>>({});
  const [saving, setSaving] = useState(false);

  const historyBatches = useMemo(() => {
    const map = new Map<string, IaLicenseCheck[]>();
    history.forEach((check) => {
      const key = `${check.date}_${check.checkedBy || "IA"}_${check.createdAt ? check.createdAt.slice(0, 16) : ""}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(check);
    });
    return Array.from(map.entries()).map(([key, items]) => ({
      key,
      date: items[0].date,
      checkedBy: items[0].checkedBy,
      createdAt: items[0].createdAt,
      items,
      firstId: items[0].id,
    }));
  }, [history]);

  const [selectedBatchKey, setSelectedBatchKey] = useState(historyBatches[0]?.key || "");

  useEffect(() => {
    if (!historyBatches.some((b) => b.key === selectedBatchKey) && historyBatches[0]) {
      setSelectedBatchKey(historyBatches[0].key);
    }
  }, [historyBatches, selectedBatchKey]);

  const activeBatch = historyBatches.find((b) => b.key === selectedBatchKey) || historyBatches[0];

  const visibleModalMembers = members.filter((m) =>
    `${m.name} ${m.passportNumber}`.toLowerCase().includes(search.toLowerCase())
  );

  const toggleModalMember = (m: IaMember) => {
    setModalRows((prev) => {
      const next = { ...prev };
      if (next[m.id]) delete next[m.id];
      else {
        next[m.id] = {
          driverLicense: true,
          weaponsLicense: true,
          healthInsurance: true,
          lawyerLicense: m.rank === "District Attorney" ? true : null,
        };
      }
      return next;
    });
  };

  const setModalValue = (id: string, field: keyof LicenseValues, value: boolean) => {
    setModalRows((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const selectedModalList = Object.entries(modalRows)
    .map(([id, values]) => ({ member: members.find((m) => m.id === id), values }))
    .filter((row): row is LicenseRow => Boolean(row.member));

  const saveModalCheck = async () => {
    if (!selectedModalList.length) {
      return notify({ title: "Choose a member", description: "Select at least one member for the license check.", variant: "warning" });
    }
    setSaving(true);
    try {
      const today = londonToday();
      await iaApi.saveLicenseChecks(
        today,
        selectedModalList.map(({ member, values }) => ({ memberId: member.id, ...values }))
      );
      notify({ title: "License checks saved", description: `${selectedModalList.length} record(s) were recorded.`, variant: "success" });
      setModalRows({});
      setModalOpen(false);
      await onRefresh();
    } catch (error) {
      notify({ title: "Could not save license checks", description: error instanceof Error ? error.message : "Please try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const batchReportText = useMemo(() => {
    if (!activeBatch?.items.length) return "No completed license checks recorded.";
    const rows = activeBatch.items
      .map((item) => {
        const m = members.find((mem) => mem.id === item.memberId);
        if (!m) return null;
        return { member: m, values: item };
      })
      .filter((r): r is LicenseRow => Boolean(r));
    if (!rows.length) return "No member data available for this check.";
    return licenseTemplate(rows, user, activeBatch.date);
  }, [activeBatch, members, user]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#e2e5ec] bg-white p-4">
        <div>
          <h3 className="text-[16px] font-semibold text-[#000]">License Checks</h3>
          <p className="mt-0.5 text-[12px] text-[#666]">Select a past license check on the left to view results, or add a new record.</p>
        </div>
        <PrimaryButton onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />Add Record
        </PrimaryButton>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="rounded-[10px] border border-[#e2e5ec] bg-white p-4">
          <div className="mb-3 flex items-center justify-between border-b border-[#f0f1f3] pb-3">
            <h4 className="text-[13px] font-semibold text-[#000]">Past License Checks</h4>
            <span className="text-[11px] font-medium text-[#8a90a0]">{historyBatches.length} Records</span>
          </div>
          <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
            {historyBatches.map((batch) => {
              const isSelected = batch.key === activeBatch?.key;
              return (
                <button
                  key={batch.key}
                  type="button"
                  onClick={() => setSelectedBatchKey(batch.key)}
                  className={cn(
                    "block w-full rounded-[8px] border p-3 text-left transition-all",
                    isSelected
                      ? "border-[#000000] bg-[#f7f8fb] shadow-2xs"
                      : "border-[#e2e5ec] bg-white hover:border-[#b0b7c3] hover:bg-[#fafbfc]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-[#000]">{formatUkDate(batch.date)}</span>
                    <span className="rounded-[4px] bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-[#666]">
                      {batch.items.length} {batch.items.length === 1 ? "Officer" : "Officers"}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#666]">
                    Checked by {batch.checkedBy || "IA Member"}
                  </p>
                </button>
              );
            })}
            {!historyBatches.length ? (
              <p className="py-6 text-center text-[12px] text-[#8a90a0]">No past license checks recorded.</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-[10px] border border-[#e2e5ec] bg-white p-4 space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f1f3] pb-3">
            <div>
              <h4 className="text-[15px] font-semibold text-[#000]">
                {activeBatch ? formatUkDate(activeBatch.date) : "Selected Result"} — License Check
              </h4>
              <p className="mt-0.5 text-[12px] text-[#666]">
                {activeBatch ? `${activeBatch.items.length} officer(s) checked by ${activeBatch.checkedBy || "IA Member"}` : "Select a record on the left"}
              </p>
            </div>
            {activeBatch ? (
              <SecondaryButton onClick={() => copyMessage(batchReportText, "License check report")}>
                <Copy className="h-3.5 w-3.5" />Copy Notice
              </SecondaryButton>
            ) : null}
          </div>

          {activeBatch ? (
            <div className="overflow-x-auto">
                <table className="w-full min-w-[580px] text-left text-[13px]">
                  <thead>
                    <tr className="border-y border-[#e2e5ec] bg-[#f7f8fb] text-[11px] font-semibold uppercase tracking-wide text-[#8a90a0]">
                      <th className="px-3 py-2.5">Member</th>
                      <th className="px-3 py-2.5 text-center">DL</th>
                      <th className="px-3 py-2.5 text-center">WL</th>
                      <th className="px-3 py-2.5 text-center">HI</th>
                      <th className="px-3 py-2.5 text-center">LL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeBatch.items.map((item) => {
                      const m = members.find((mem) => mem.id === item.memberId);
                      return (
                        <tr key={item.id} className="border-b border-[#f0f1f3]">
                          <td className="px-3 py-3 font-medium">
                            <div className="flex items-center gap-2">
                              {m?.name ? (
                                <button
                                  type="button"
                                  title={`Copy ${m.name}`}
                                  onClick={() => copyMessage(m.name, "Officer name")}
                                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] border border-[#e2e5ec] bg-white text-[#666] transition-colors hover:border-[#000] hover:bg-[#f7f8fb] hover:text-[#000]"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              ) : null}
                              <div>
                                <span className="block text-[13px] font-medium text-[#000]">{m?.name || "Former member"}</span>
                                <span className="block text-[11px] font-normal text-[#8a90a0]">{m?.passportNumber || "-"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">{mark(item.driverLicense)}</td>
                          <td className="px-3 py-3 text-center">{mark(item.weaponsLicense)}</td>
                          <td className="px-3 py-3 text-center">{mark(item.healthInsurance)}</td>
                          <td className="px-3 py-3 text-center">
                            {item.lawyerLicense === null ? <span className="text-[#9aa1b0]">N/A</span> : mark(item.lawyerLicense)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
          ) : (
            <p className="py-8 text-center text-[13px] text-[#8a90a0]">Select a past check record from the left list.</p>
          )}
        </div>
      </div>

      <AppPopupWindow
        open={modalOpen}
        onOpenChange={(open) => !open && setModalOpen(false)}
        title="Add License Check Record"
        description="Verify and record officer license statuses."
        className="max-w-[900px]"
        footer={
          <>
            <SecondaryButton onClick={() => setModalOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton disabled={saving} onClick={saveModalCheck}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save Record
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4 p-6">
          <div className="rounded-[8px] bg-[#f7f8fb] p-3 text-[13px]">
            <span className="font-semibold text-[#000]">Check Date: </span>
            <span className="font-mono text-[#000]">{londonToday()}</span>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#9aa1b0]" />
            <input
              className="h-9 w-full rounded-[6px] border border-[#e2e5ec] bg-white pl-9 pr-3 text-[13px] outline-none focus:border-[#000]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members"
            />
          </div>

          <CheckTable
            members={visibleModalMembers}
            selected={modalRows}
            onToggleSelected={toggleModalMember}
            fields={[
              { key: "driverLicense", label: "DL" },
              { key: "weaponsLicense", label: "WL" },
              { key: "healthInsurance", label: "HI" },
              { key: "lawyerLicense", label: "LL", onlyDistrictAttorney: true },
            ]}
            onSet={setModalValue}
          />
        </div>
      </AppPopupWindow>
    </div>
  );
}

function BackgroundCheckView({
  members,
  user,
  history = [],
  onRefresh,
}: {
  members: IaMember[];
  user: IaUser;
  history: IaBackgroundCheck[];
  onRefresh: () => Promise<void>;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [modalRows, setModalRows] = useState<Record<string, BackgroundValues>>({});
  const [saving, setSaving] = useState(false);

  const historyBatches = useMemo(() => {
    const map = new Map<string, IaBackgroundCheck[]>();
    history.forEach((check) => {
      const key = `${check.date}_${check.checkedBy || "IA"}_${check.createdAt ? check.createdAt.slice(0, 16) : ""}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(check);
    });
    return Array.from(map.entries()).map(([key, items]) => ({
      key,
      date: items[0].date,
      checkedBy: items[0].checkedBy,
      createdAt: items[0].createdAt,
      items,
      firstId: items[0].id,
    }));
  }, [history]);

  const [selectedBatchKey, setSelectedBatchKey] = useState(historyBatches[0]?.key || "");

  useEffect(() => {
    if (!historyBatches.some((b) => b.key === selectedBatchKey) && historyBatches[0]) {
      setSelectedBatchKey(historyBatches[0].key);
    }
  }, [historyBatches, selectedBatchKey]);

  const activeBatch = historyBatches.find((b) => b.key === selectedBatchKey) || historyBatches[0];

  const visibleModalMembers = members.filter((m) =>
    `${m.name} ${m.passportNumber}`.toLowerCase().includes(search.toLowerCase())
  );

  const toggleModalMember = (m: IaMember) => {
    setModalRows((prev) => {
      const next = { ...prev };
      if (next[m.id]) delete next[m.id];
      else {
        next[m.id] = {
          wanted: false,
          prisonTerms: false,
          previousCrimes: false,
          criminalStructures: false,
        };
      }
      return next;
    });
  };

  const setModalValue = (id: string, field: keyof BackgroundValues, value: boolean) => {
    setModalRows((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const selectedModalList = Object.entries(modalRows)
    .map(([id, values]) => ({ member: members.find((m) => m.id === id), values }))
    .filter((row): row is BackgroundRow => Boolean(row.member));

  const saveModalCheck = async () => {
    if (!selectedModalList.length) {
      return notify({ title: "Choose a member", description: "Select at least one member for the background check.", variant: "warning" });
    }
    setSaving(true);
    try {
      const today = londonToday();
      await iaApi.saveBackgroundChecks(
        today,
        selectedModalList.map(({ member, values }) => ({ memberId: member.id, ...values }))
      );
      notify({ title: "Background checks saved", description: `${selectedModalList.length} record(s) were recorded.`, variant: "success" });
      setModalRows({});
      setModalOpen(false);
      await onRefresh();
    } catch (error) {
      notify({ title: "Could not save background checks", description: error instanceof Error ? error.message : "Please try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const batchReportText = useMemo(() => {
    if (!activeBatch?.items.length) return "No completed background checks recorded.";
    const rows = activeBatch.items
      .map((item) => {
        const m = members.find((mem) => mem.id === item.memberId);
        if (!m) return null;
        return { member: m, values: item };
      })
      .filter((r): r is BackgroundRow => Boolean(r));
    if (!rows.length) return "No member data available for this check.";
    return backgroundTemplate(rows, user, activeBatch.date);
  }, [activeBatch, members, user]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#e2e5ec] bg-white p-4">
        <div>
          <h3 className="text-[16px] font-semibold text-[#000]">Background Checks</h3>
          <p className="mt-0.5 text-[12px] text-[#666]">Select a past background check on the left to view results, or add a new record.</p>
        </div>
        <PrimaryButton onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />Add Record
        </PrimaryButton>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="rounded-[10px] border border-[#e2e5ec] bg-white p-4">
          <div className="mb-3 flex items-center justify-between border-b border-[#f0f1f3] pb-3">
            <h4 className="text-[13px] font-semibold text-[#000]">Past Background Checks</h4>
            <span className="text-[11px] font-medium text-[#8a90a0]">{historyBatches.length} Records</span>
          </div>
          <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
            {historyBatches.map((batch) => {
              const isSelected = batch.key === activeBatch?.key;
              return (
                <button
                  key={batch.key}
                  type="button"
                  onClick={() => setSelectedBatchKey(batch.key)}
                  className={cn(
                    "block w-full rounded-[8px] border p-3 text-left transition-all",
                    isSelected
                      ? "border-[#000000] bg-[#f7f8fb] shadow-2xs"
                      : "border-[#e2e5ec] bg-white hover:border-[#b0b7c3] hover:bg-[#fafbfc]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-[#000]">{formatUkDate(batch.date)}</span>
                    <span className="rounded-[4px] bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-[#666]">
                      {batch.items.length} {batch.items.length === 1 ? "Officer" : "Officers"}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#666]">
                    Checked by {batch.checkedBy || "IA Member"}
                  </p>
                </button>
              );
            })}
            {!historyBatches.length ? (
              <p className="py-6 text-center text-[12px] text-[#8a90a0]">No past background checks recorded.</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-[10px] border border-[#e2e5ec] bg-white p-4 space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f1f3] pb-3">
            <div>
              <h4 className="text-[15px] font-semibold text-[#000]">
                {activeBatch ? formatUkDate(activeBatch.date) : "Selected Result"} — Background Check
              </h4>
              <p className="mt-0.5 text-[12px] text-[#666]">
                {activeBatch ? `${activeBatch.items.length} officer(s) checked by ${activeBatch.checkedBy || "IA Member"}` : "Select a record on the left"}
              </p>
            </div>
            {activeBatch ? (
              <SecondaryButton onClick={() => copyMessage(batchReportText, "Background check report")}>
                <Copy className="h-3.5 w-3.5" />Copy Notice
              </SecondaryButton>
            ) : null}
          </div>

          {activeBatch ? (
            <div className="overflow-x-auto">
                <table className="w-full min-w-[580px] text-left text-[13px]">
                  <thead>
                    <tr className="border-y border-[#e2e5ec] bg-[#f7f8fb] text-[11px] font-semibold uppercase tracking-wide text-[#8a90a0]">
                      <th className="px-3 py-2.5">Member</th>
                      <th className="px-3 py-2.5 text-center">Wanted</th>
                      <th className="px-3 py-2.5 text-center">Prison Terms</th>
                      <th className="px-3 py-2.5 text-center">Previous Crimes</th>
                      <th className="px-3 py-2.5 text-center">Criminal Structures</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeBatch.items.map((item) => {
                      const m = members.find((mem) => mem.id === item.memberId);
                      return (
                        <tr key={item.id} className="border-b border-[#f0f1f3]">
                          <td className="px-3 py-3 font-medium">
                            <div className="flex items-center gap-2">
                              {m?.name ? (
                                <button
                                  type="button"
                                  title={`Copy ${m.name}`}
                                  onClick={() => copyMessage(m.name, "Officer name")}
                                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] border border-[#e2e5ec] bg-white text-[#666] transition-colors hover:border-[#000] hover:bg-[#f7f8fb] hover:text-[#000]"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              ) : null}
                              <div>
                                <span className="block text-[13px] font-medium text-[#000]">{m?.name || "Former member"}</span>
                                <span className="block text-[11px] font-normal text-[#8a90a0]">{m?.passportNumber || "-"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">{mark(item.wanted)}</td>
                          <td className="px-3 py-3 text-center">{mark(item.prisonTerms)}</td>
                          <td className="px-3 py-3 text-center">{mark(item.previousCrimes)}</td>
                          <td className="px-3 py-3 text-center">{mark(item.criminalStructures)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
          ) : (
            <p className="py-8 text-center text-[13px] text-[#8a90a0]">Select a past check record from the left list.</p>
          )}
        </div>
      </div>

      <AppPopupWindow
        open={modalOpen}
        onOpenChange={(open) => !open && setModalOpen(false)}
        title="Add Background Check Record"
        description="✓ means an issue exists; ✗ means clear / no issue."
        className="max-w-[900px]"
        footer={
          <>
            <SecondaryButton onClick={() => setModalOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton disabled={saving} onClick={saveModalCheck}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save Record
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4 p-6">
          <div className="rounded-[8px] bg-[#f7f8fb] p-3 text-[13px]">
            <span className="font-semibold text-[#000]">Check Date: </span>
            <span className="font-mono text-[#000]">{londonToday()}</span>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#9aa1b0]" />
            <input
              className="h-9 w-full rounded-[6px] border border-[#e2e5ec] bg-white pl-9 pr-3 text-[13px] outline-none focus:border-[#000]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members"
            />
          </div>

          <CheckTable
            members={visibleModalMembers}
            selected={modalRows}
            onToggleSelected={toggleModalMember}
            fields={[
              { key: "wanted", label: "Wanted" },
              { key: "prisonTerms", label: "Prison Terms" },
              { key: "previousCrimes", label: "Previous Crimes" },
              { key: "criminalStructures", label: "Criminal Structures" },
            ]}
            onSet={setModalValue}
          />
        </div>
      </AppPopupWindow>
    </div>
  );
}

function CheckTable<T extends Record<string, boolean | null>>({
  members,
  selected,
  onToggleSelected,
  fields,
  onSet,
}: {
  members: IaMember[];
  selected: Record<string, T>;
  onToggleSelected: (member: IaMember) => void;
  fields: Array<{ key: keyof T; label: string; onlyDistrictAttorney?: boolean }>;
  onSet: (id: string, field: keyof T, value: boolean) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[750px] text-left text-[13px]">
        <thead>
          <tr className="border-y border-[#e2e5ec] bg-[#f7f8fb] text-[11px] font-semibold uppercase tracking-wide text-[#8a90a0]">
            <th className="px-3 py-2.5">Member</th>
            <th className="px-3 py-2.5 text-center">Include</th>
            {fields.map((field) => (
              <th key={String(field.key)} className="px-3 py-2.5 text-center">
                {field.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const values = selected[member.id];
            return (
              <tr key={member.id} className="border-b border-[#f0f1f3]">
                <td className="px-3 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      title={`Copy ${member.name}`}
                      onClick={() => copyMessage(member.name, "Officer name")}
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] border border-[#e2e5ec] bg-white text-[#666] transition-colors hover:border-[#000] hover:bg-[#f7f8fb] hover:text-[#000]"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <div>
                      <span className="block text-[13px] font-medium text-[#000]">{member.name}</span>
                      <span className="block text-[11px] font-normal text-[#8a90a0]">{member.passportNumber}</span>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <input
                    aria-label={`Include ${member.name}`}
                    type="checkbox"
                    checked={Boolean(values)}
                    onChange={() => onToggleSelected(member)}
                    className="h-4 w-4 rounded border-[#c8ced9] accent-black"
                  />
                </td>
                {fields.map((field) => {
                  const disabled = !values || (field.onlyDistrictAttorney && member.rank !== "District Attorney");
                  const value = values?.[field.key];
                  return (
                    <td key={String(field.key)} className="px-3 py-3 text-center">
                      {field.onlyDistrictAttorney && member.rank !== "District Attorney" ? (
                        <span className="text-[11px] text-[#9aa1b0]">N/A</span>
                      ) : (
                        <input
                          aria-label={`${field.label} for ${member.name}`}
                          disabled={disabled}
                          type="checkbox"
                          checked={Boolean(value)}
                          onChange={(event) => onSet(member.id, field.key, event.target.checked)}
                          className="h-4 w-4 rounded border-[#c8ced9] accent-black disabled:opacity-40"
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BodycamView({
  members,
  user,
  requests = [],
  checks = [],
  onRefresh,
}: {
  members: IaMember[];
  user: IaUser;
  requests: IaBodycamRequest[];
  checks: { id: string; memberIds: string[]; date: string; checkedBy: string; createdAt: string }[];
  onRefresh: () => Promise<void>;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [deadline, setDeadline] = useState("24 Hours");
  const [saving, setSaving] = useState(false);

  const historyList = useMemo(() => {
    return [...checks]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .map((c) => ({
        id: c.id,
        title: `${c.memberIds.length} Officers Checked`,
        date: c.date,
        checkedBy: c.checkedBy,
        createdAt: c.createdAt,
        memberIds: c.memberIds,
      }));
  }, [checks]);

  const [selectedId, setSelectedId] = useState(historyList[0]?.id || "");

  useEffect(() => {
    if (!historyList.some((h) => h.id === selectedId) && historyList[0]) {
      setSelectedId(historyList[0].id);
    }
  }, [historyList, selectedId]);

  const activeCheck = historyList.find((h) => h.id === selectedId) || historyList[0];

  const visibleModalMembers = members.filter((m) =>
    `${m.name} ${m.passportNumber}`.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSet = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const saveModalAction = async () => {
    if (!selectedIds.size) {
      notify({ title: "Choose a member", description: "Select at least one member for the bodycam request.", variant: "warning" });
      return;
    }
    setSaving(true);
    try {
      const memberIdArray = Array.from(selectedIds);
      const dl = deadline.trim() || "24 Hours";
      await iaApi.createBodycamRequests({
        memberIds: memberIdArray,
        requestType: "activity",
        deadline: dl,
        suspectName: "",
        arrestDate: "",
        arrestTime: "",
      });
      const today = londonToday();
      const created = await iaApi.saveBodycamCheck(today, memberIdArray);
      notify({ title: "Bodycam requests recorded", description: `${memberIdArray.length} request(s) added with Pending status.`, variant: "success" });
      setSelectedIds(new Set());
      if (created?.id) {
        setSelectedId(created.id);
      }
      setModalOpen(false);
      await onRefresh();
    } catch (error) {
      notify({ title: "Could not save bodycam record", description: error instanceof Error ? error.message : "Please try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (request: IaBodycamRequest, status: IaBodycamRequest["status"]) => {
    try {
      await iaApi.updateBodycamRequest(request.id, status);
      notify({ title: "Bodycam request status updated", variant: "success" });
      await onRefresh();
    } catch (error) {
      notify({ title: "Could not update request status", description: error instanceof Error ? error.message : "Please try again.", variant: "error" });
    }
  };

  const activeReportMembers = useMemo(() => {
    if (!activeCheck?.memberIds) return [];
    const idSet = new Set(activeCheck.memberIds.map(String));
    return members.filter((m) => idSet.has(String(m.id)));
  }, [activeCheck, members]);

  const reportText = useMemo(() => {
    if (!activeCheck) return "No bodycam check record selected.";
    return bodycamCheckTemplate(activeReportMembers, user, activeCheck.date);
  }, [activeCheck, activeReportMembers, user]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#e2e5ec] bg-white p-4">
        <div>
          <h3 className="text-[16px] font-semibold text-[#000]">Bodycam Checks & Requests</h3>
          <p className="mt-0.5 text-[12px] text-[#666]">Record bodycam requests for officers, copy individual notices, and update submission statuses.</p>
        </div>
        <PrimaryButton onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />Add Request
        </PrimaryButton>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="rounded-[10px] border border-[#e2e5ec] bg-white p-4">
          <div className="mb-3 flex items-center justify-between border-b border-[#f0f1f3] pb-3">
            <h4 className="text-[13px] font-semibold text-[#000]">Past Bodycam Checks</h4>
            <span className="text-[11px] font-medium text-[#8a90a0]">{historyList.length} Records</span>
          </div>
          <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
            {historyList.map((check) => {
              const isSelected = check.id === activeCheck?.id;
              return (
                <button
                  key={check.id}
                  type="button"
                  onClick={() => setSelectedId(check.id)}
                  className={cn(
                    "block w-full rounded-[8px] border p-3 text-left transition-all",
                    isSelected
                      ? "border-[#000000] bg-[#f7f8fb] shadow-2xs"
                      : "border-[#e2e5ec] bg-white hover:border-[#b0b7c3] hover:bg-[#fafbfc]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-[#000]">{formatUkDate(check.date)}</span>
                    <span className="rounded-[4px] bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-[#666]">
                      {check.memberIds.length} Checked
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#666]">
                    Recorded by {check.checkedBy || "IA Member"}
                  </p>
                </button>
              );
            })}
            {!historyList.length ? (
              <p className="py-6 text-center text-[12px] text-[#8a90a0]">No past bodycam checks recorded.</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-[10px] border border-[#e2e5ec] bg-white p-4 space-y-5 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f1f3] pb-3">
            <div>
              <h4 className="text-[15px] font-semibold text-[#000]">
                {activeCheck ? formatUkDate(activeCheck.date) : "Selected Result"} — Bodycam Check
              </h4>
              <p className="mt-0.5 text-[12px] text-[#666]">
                {activeCheck ? `${activeReportMembers.length} officer(s) checked by ${activeCheck.checkedBy}` : "Select a record on the left"}
              </p>
            </div>
            {activeCheck ? (
              <SecondaryButton onClick={() => copyMessage(reportText, "Bodycam check report")}>
                <Copy className="h-3.5 w-3.5" />Copy Notice
              </SecondaryButton>
            ) : null}
          </div>

          {activeCheck ? (
            <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-left text-[13px]">
                  <thead>
                    <tr className="border-y border-[#e2e5ec] bg-[#f7f8fb] text-[11px] font-semibold uppercase tracking-wide text-[#8a90a0]">
                      <th className="px-3 py-2.5">Officer Name</th>
                      <th className="px-3 py-2.5">Rank</th>
                      <th className="px-3 py-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeReportMembers.map((m) => (
                      <tr key={m.id} className="border-b border-[#f0f1f3]">
                        <td className="px-3 py-3 font-medium">
                          {m.name}
                          <span className="mt-0.5 block text-[11px] font-normal text-[#8a90a0]">{m.passportNumber}</span>
                        </td>
                        <td className="px-3 py-3 text-[#4d5568]">{m.rank}</td>
                        <td className="px-3 py-3 text-right">
                          <span className="inline-flex items-center gap-1 rounded-[4px] bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">✓ Checked</span>
                        </td>
                      </tr>
                    ))}
                    {!activeReportMembers.length ? (
                      <tr><td colSpan={3} className="px-3 py-6 text-center text-[#8a90a0]">No officer details stored for this check.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
          ) : (
            <p className="py-8 text-center text-[13px] text-[#8a90a0]">Select a past check record from the left list.</p>
          )}

          {requests.length ? (
            <div className="rounded-[8px] border border-[#e2e5ec] p-4 space-y-3">
              <div className="border-b border-[#f0f1f3] pb-2">
                <h5 className="text-[13px] font-semibold text-[#000]">Tracked Bodycam Requests ({requests.length})</h5>
                <p className="text-[11px] text-[#666]">Manage requested bodycam submission statuses for officers.</p>
              </div>
              <div className="divide-y divide-[#f0f1f3]">
                {requests.map((r) => {
                  const m = members.find((mem) => mem.id === r.memberId);
                  return (
                    <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-[12px]">
                      <div>
                        <span className="font-medium text-[#000]">{m?.name || "Former member"}</span>
                        <span className="ml-2 text-[#8a90a0]">requested {formatUkDate(r.createdAt)}</span>
                      </div>
                      <AppSelect
                        value={r.status}
                        onChange={(val) => updateStatus(r, val as IaBodycamRequest["status"])}
                        options={[
                          { value: "pending", label: "Pending" },
                          { value: "provided", label: "Provided" },
                          { value: "not_provided", label: "Not provided" },
                        ]}
                        className="w-[150px]"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <AppPopupWindow
        open={modalOpen}
        onOpenChange={(open) => !open && setModalOpen(false)}
        title="Add Bodycam Request"
        description="Select officers to request bodycam footage from. Saving records requests with a Pending status."
        className="max-w-[900px]"
        footer={
          <>
            <SecondaryButton onClick={() => setModalOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton disabled={saving} onClick={saveModalAction}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save Requests
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Record Date</label>
              <input className={inputClass} value={londonToday()} disabled readOnly />
            </div>
            <div>
              <label className={labelClass}>Submission Deadline</label>
              <input
                className={inputClass}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="Submission deadline (e.g., 24 Hours)"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#9aa1b0]" />
              <input
                className="h-9 w-full rounded-[6px] border border-[#e2e5ec] bg-white pl-9 pr-3 text-[13px] outline-none focus:border-[#000]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search officers by name or passport number..."
              />
            </div>
            <MemberPickTable
              members={visibleModalMembers}
              selectedIds={selectedIds}
              onToggle={toggleSet}
              onRequestCopy={(m) => copyMessage(bodycamRequestTemplate(m, user, "activity", { suspectName: "", arrestDate: "", arrestTime: "", deadline: deadline || "24 Hours" }), "Bodycam request notice")}
            />
          </div>
        </div>
      </AppPopupWindow>
    </div>
  );
}

function MemberPickTable({
  members,
  selectedIds,
  onToggle,
  onRequestCopy,
}: {
  members: IaMember[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onRequestCopy?: (member: IaMember) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[500px] text-left text-[13px]">
        <thead>
          <tr className="border-y border-[#e2e5ec] bg-[#f7f8fb] text-[11px] font-semibold uppercase tracking-wide text-[#8a90a0]">
            <th className="px-3 py-2.5">Member</th>
            <th className="px-3 py-2.5">Rank</th>
            <th className="px-3 py-2.5 text-right">Include</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-b border-[#f0f1f3]">
              <td className="px-3 py-3 font-medium">
                <div className="flex items-center gap-2">
                  {onRequestCopy ? (
                    <SecondaryButton
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestCopy(member);
                      }}
                      className="h-7 shrink-0 gap-1 px-2 text-[11px]"
                    >
                      <Copy className="h-3 w-3" /> Copy Notice
                    </SecondaryButton>
                  ) : (
                    <button
                      type="button"
                      title={`Copy ${member.name}`}
                      onClick={() => copyMessage(member.name, "Officer name")}
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] border border-[#e2e5ec] bg-white text-[#666] transition-colors hover:border-[#000] hover:bg-[#f7f8fb] hover:text-[#000]"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  )}
                  <div>
                    <span className="block text-[13px] font-medium text-[#000]">{member.name}</span>
                    <span className="block text-[11px] font-normal text-[#8a90a0]">{member.passportNumber}</span>
                  </div>
                </div>
              </td>
              <td className="px-3 py-3 text-[#4d5568]">{member.rank}</td>
              <td className="px-3 py-3 text-right">
                <input
                  aria-label={`Select ${member.name}`}
                  type="checkbox"
                  checked={selectedIds.has(member.id)}
                  onChange={() => onToggle(member.id)}
                  className="h-4 w-4 cursor-pointer rounded border-[#c8ced9] accent-black"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuditView({ audits }: { audits: IaAuditLog[] }) { return <Panel title="Audit Logs" description="Every material database change is recorded with the responsible Internal Affairs user and timestamp."><AuditRows audits={audits} /></Panel>; }

function AuditRows({ audits }: { audits: IaAuditLog[] }) { return <div className="divide-y divide-[#f0f1f3]">{audits.map((audit) => <div key={audit.id} className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-start sm:gap-5"><div><p className="text-[13px] font-medium">{audit.action.replace(/_/g, " ")}</p><p className="mt-0.5 text-[12px] text-[#666]">{audit.details || audit.entityName}</p><p className="mt-1 text-[11px] text-[#8a90a0]">Performed by {audit.actorName}{audit.actorEmail ? ` · ${audit.actorEmail}` : ""}{audit.actorRank ? ` · ${audit.actorRank}` : ""}</p></div><time className="shrink-0 text-[11px] text-[#8a90a0]">{formatUkDate(audit.createdAt)}</time></div>)}{!audits.length ? <p className="py-8 text-center text-[13px] text-[#8a90a0]">No audit events yet.</p> : null}</div>; }

function AdminView({ user, settings, onRefresh }: { user: IaUser; settings: IaSettings; onRefresh: () => Promise<void> }) {
  const [users, setUsers] = useState<IaUser[]>([]); const [open, setOpen] = useState(false); const [department, setDepartment] = useState(""); const [rank, setRank] = useState(""); const [saving, setSaving] = useState(false);
  useEffect(() => { iaApi.getUsers().then(setUsers).catch((error) => notify({ title: "Could not load accounts", description: error instanceof Error ? error.message : "Please try again.", variant: "error" })); }, []);
  const updateSettings = async (next: Pick<IaSettings, "departments" | "ranks">) => { setSaving(true); try { await iaApi.updateSettings(next); notify({ title: "Organisation settings saved", variant: "success" }); await onRefresh(); } catch (error) { notify({ title: "Could not save settings", description: error instanceof Error ? error.message : "Please try again.", variant: "error" }); } finally { setSaving(false); } };
  const add = (type: "departments" | "ranks") => { const value = (type === "departments" ? department : rank).trim(); if (!value) return; const current = settings[type]; if (current.includes(value)) return notify({ title: "Already listed", variant: "warning" }); void updateSettings({ departments: type === "departments" ? [...settings.departments, value] : settings.departments, ranks: type === "ranks" ? [...settings.ranks, value] : settings.ranks }); type === "departments" ? setDepartment("") : setRank(""); };
  const remove = (type: "departments" | "ranks", value: string) => void updateSettings({ departments: type === "departments" ? settings.departments.filter((item) => item !== value) : settings.departments, ranks: type === "ranks" ? settings.ranks.filter((item) => item !== value) : settings.ranks });
  return <div className="space-y-5"><Panel title="Software Users" description="Only administrators can create and view Internal Affairs software accounts." action={<PrimaryButton onClick={() => setOpen(true)}><UserPlus className="h-4 w-4" />Create User</PrimaryButton>}><div className="divide-y divide-[#f0f1f3]">{users.map((account) => <div key={account.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-[13px] font-medium">{account.name}{account.isAdmin ? <span className="ml-2 rounded-[4px] bg-[#f0f1f3] px-1.5 py-0.5 text-[10px] uppercase text-[#666]">Admin</span> : null}</p><p className="text-[12px] text-[#666]">{account.email} · {account.organisation}</p></div><span className="text-[12px] text-[#8a90a0]">{account.rank}</span></div>)}{!users.length ? <p className="py-5 text-[12px] text-[#8a90a0]">No accounts to show.</p> : null}</div></Panel><div className="grid gap-5 xl:grid-cols-2"><Panel title="Departments" description="These options are used in the Add and Manage Member popups."><div className="flex gap-2"><input className={inputClass} value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="New department" /><PrimaryButton disabled={saving} onClick={() => add("departments")}><Plus className="h-3.5 w-3.5" />Add</PrimaryButton></div><OptionList values={settings.departments} onRemove={(value) => remove("departments", value)} /></Panel><Panel title="Ranks" description="Every configured rank is available in the member rank dropdown."><div className="flex gap-2"><input className={inputClass} value={rank} onChange={(event) => setRank(event.target.value)} placeholder="New rank" /><PrimaryButton disabled={saving} onClick={() => add("ranks")}><Plus className="h-3.5 w-3.5" />Add</PrimaryButton></div><OptionList values={settings.ranks} onRemove={(value) => remove("ranks", value)} /></Panel></div><CreateUserModal open={open} user={user} settings={settings} onClose={() => setOpen(false)} onCreated={(account) => { setUsers((current) => [...current, account].sort((a, b) => a.name.localeCompare(b.name))); setOpen(false); }} /></div>;
}

function OptionList({ values, onRemove }: { values: string[]; onRemove: (value: string) => void }) { return <div className="mt-4 flex flex-wrap gap-2">{values.map((value) => <span key={value} className="inline-flex items-center gap-1 rounded-[5px] bg-[#f0f1f3] px-2 py-1 text-[12px] text-[#4d5568]">{value}<button type="button" onClick={() => onRemove(value)} className="rounded p-0.5 hover:bg-white" aria-label={`Remove ${value}`}><X className="h-3 w-3" /></button></span>)}</div>; }

function CreateUserModal({ open, user, settings, onClose, onCreated }: { open: boolean; user: IaUser; settings: IaSettings; onClose: () => void; onCreated: (user: IaUser) => void }) {
  const organisations = ["Los Santos Police Department", "Federal Investigation Bureau", "San Andreas Highway Patrol", "National Guard", "Government"];
  const [form, setForm] = useState({ name: "", email: "", password: "", organisation: organisations[0], rank: settings.ranks[0] || "" }); const [saving, setSaving] = useState(false);
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async () => { setSaving(true); try { const created = await iaApi.createUser(form); notify({ title: "Software account created", description: `${created.name} can now sign in to Internal Affairs.`, variant: "success" }); setForm({ name: "", email: "", password: "", organisation: organisations[0], rank: settings.ranks[0] || "" }); onCreated(created); } catch (error) { notify({ title: "Could not create account", description: error instanceof Error ? error.message : "Please try again.", variant: "error" }); } finally { setSaving(false); } };
  return <AppPopupWindow open={open} onOpenChange={(value) => !value && onClose()} title="Create User" description="Create an Internal Affairs software account. Public sign-up is not available." footer={<><SecondaryButton onClick={onClose}>Cancel</SecondaryButton><PrimaryButton disabled={saving} onClick={submit}>{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}Create User</PrimaryButton></>}><div className="grid gap-4 p-6 sm:grid-cols-2"><div><label className={labelClass}>Name</label><input className={inputClass} value={form.name} onChange={(event) => update("name", event.target.value)} /></div><div><label className={labelClass}>Email</label><input className={inputClass} type="email" value={form.email} onChange={(event) => update("email", event.target.value)} /></div><div><label className={labelClass}>Password</label><input className={inputClass} type="text" autoComplete="new-password" value={form.password} onChange={(event) => update("password", event.target.value)} /><p className="mt-1 text-[11px] text-[#8a90a0]">At least 12 characters.</p></div><div><label className={labelClass}>Organisation</label><AppSelect value={form.organisation} onChange={(value) => update("organisation", value)} options={organisations.map((value) => ({ value, label: value }))} /></div><div><label className={labelClass}>Rank</label><input className={inputClass} value={form.rank} onChange={(event) => update("rank", event.target.value)} placeholder="Enter rank" /></div></div></AppPopupWindow>;
}

function MemberFormModal({ state, settings, onClose, onSaved }: { state: { open: boolean; mode: "create" | "edit" | "rehire"; member?: IaMember }; settings: IaSettings | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState<MemberInput>(emptyMemberInput()); const [saving, setSaving] = useState(false);
  useEffect(() => { if (!state.open) return; const member = state.member; setForm(member ? { name: member.name, passportNumber: member.passportNumber, discordUsername: member.discordUsername, rank: member.rank, primaryDepartment: member.primaryDepartment, secondaryDepartment: member.secondaryDepartment, joiningDate: member.joiningDate, logsAssigned: member.logsAssigned, badgeNumberAssigned: member.badgeNumberAssigned, discordRoles: member.discordRoles, hiringRecord: member.hiringRecord } : emptyMemberInput()); }, [state.open, state.member]);
  useEffect(() => { if (state.open && state.member) setForm((current) => ({ ...current, badgeNumber: state.member?.badgeNumber || "" })); }, [state.open, state.member]);
  const set = <K extends keyof MemberInput>(key: K, value: MemberInput[K]) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async () => { setSaving(true); try { if (state.mode === "edit" && state.member) await iaApi.updateMember(state.member.id, form); else if (state.mode === "rehire" && state.member) await iaApi.rehireMember(state.member.id, form); else await iaApi.createMember(form); notify({ title: state.mode === "rehire" ? "Member rehired successfully" : state.mode === "edit" ? "Member record updated" : "Member added successfully", variant: "success" }); await onSaved(); } catch (error) { notify({ title: "Could not save member", description: error instanceof Error ? error.message : "Please try again.", variant: "error" }); } finally { setSaving(false); } };
  const title = state.mode === "create" ? "Add Member" : state.mode === "rehire" ? "Rehire Member" : "Manage Member";
  return <AppPopupWindow open={state.open} onOpenChange={(value) => !value && onClose()} title={title} description={state.mode === "rehire" ? "Archived details are pre-filled. Saving moves this member back to the current Members list." : "Name, Passport Number, and Rank are required."} className="max-w-[800px]" bodyClassName="overflow-y-auto" footer={<><SecondaryButton onClick={onClose}>Cancel</SecondaryButton><PrimaryButton disabled={saving} onClick={submit}>{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}{state.mode === "rehire" ? "Rehire Member" : "Save Member"}</PrimaryButton></>}><div className="grid gap-x-4 gap-y-4 p-6 sm:grid-cols-2"><div><label className={labelClass}>Name <span className="text-[#b42318]">*</span></label><input className={inputClass} value={form.name} onChange={(event) => set("name", event.target.value)} /></div><div><label className={labelClass}>Passport Number <span className="text-[#b42318]">*</span></label><input className={inputClass} value={form.passportNumber} onChange={(event) => set("passportNumber", event.target.value)} /></div><div><label className={labelClass}>Badge Number</label><input className={inputClass} value={form.badgeNumber || ""} onChange={(event) => set("badgeNumber", event.target.value)} /></div><div><label className={labelClass}>Discord Username</label><div className="flex gap-2"><input className={inputClass} value={form.discordUsername} onChange={(event) => set("discordUsername", event.target.value)} />{form.discordUsername ? <SecondaryButton onClick={() => copyMessage(form.discordUsername, "Discord username")}><Copy className="h-3.5 w-3.5" /></SecondaryButton> : null}</div></div><div><label className={labelClass}>Rank <span className="text-[#b42318]">*</span></label><AppSelect value={form.rank} onChange={(value) => set("rank", value)} options={[{ value: "", label: "Select rank" }, ...(settings?.ranks || []).map((value) => ({ value, label: value }))]} /></div><div><label className={labelClass}>Primary Department</label><AppSelect value={form.primaryDepartment} onChange={(value) => set("primaryDepartment", value)} options={[{ value: "", label: "Select department" }, ...(settings?.departments || []).map((value) => ({ value, label: value }))]} /></div><div><label className={labelClass}>Secondary Department</label><AppSelect value={form.secondaryDepartment} onChange={(value) => set("secondaryDepartment", value)} options={[{ value: "", label: "Select department" }, ...(settings?.departments || []).map((value) => ({ value, label: value }))]} /></div><div><label className={labelClass}>Joining Date</label><AppDatePicker value={form.joiningDate} onChange={(value) => set("joiningDate", value.slice(0, 10))} placeholder="Select joining date" /></div><div className="flex flex-col justify-end gap-2"><Toggle checked={form.logsAssigned} onChange={(value) => set("logsAssigned", value)} label="Logs Assigned" /><Toggle checked={form.badgeNumberAssigned} onChange={(value) => set("badgeNumberAssigned", value)} label="Badge Number Assigned" /><Toggle checked={form.discordRoles} onChange={(value) => set("discordRoles", value)} label="Discord Roles" /><Toggle checked={form.hiringRecord} onChange={(value) => set("hiringRecord", value)} label="Hiring Record" /></div></div></AppPopupWindow>;
}

function MemberProfileModal({ member, user, settings, onClose, onEdit, onRefresh }: { member: IaMember | null; user: IaUser; settings: IaSettings | null; onClose: () => void; onEdit: () => void; onRefresh: () => Promise<void> }) {
  const [action, setAction] = useState<"" | "strike" | "loa" | "rank">(""); const [reason, setReason] = useState(""); const [loa, setLoa] = useState({ startDate: londonToday(), endDate: londonToday(), reason: "" }); const [newRank, setNewRank] = useState(""); const [saving, setSaving] = useState(false);
  useEffect(() => { setAction(""); setReason(""); setNewRank(""); }, [member?.id]);
  if (!member) return null;
  const actionSave = async () => { setSaving(true); try { if (action === "strike") { if (!reason.trim()) return notify({ title: "Reason required", variant: "warning" }); await iaApi.addStrike(member.id, reason); notify({ title: "Strike added", variant: "success" }); } if (action === "loa") { if (!loa.reason.trim()) return notify({ title: "Reason required", variant: "warning" }); await iaApi.addLoa(member.id, loa); notify({ title: "LOA recorded", variant: "success" }); } if (action === "rank") { if (!newRank || !reason.trim()) return notify({ title: "New rank and reason are required", variant: "warning" }); await iaApi.changeRank(member.id, newRank, reason); notify({ title: "Rank change saved", variant: "success" }); } setAction(""); await onRefresh(); onClose(); } catch (error) { notify({ title: "Could not save action", description: error instanceof Error ? error.message : "Please try again.", variant: "error" }); } finally { setSaving(false); } };
  const promotion = newRank ? rankOrder(newRank, settings?.ranks || []) < rankOrder(member.rank, settings?.ranks || []) : false;
  return <AppPopupWindow open={Boolean(member)} onOpenChange={(value) => !value && onClose()} title={member.name} description={`${member.rank} · Passport ${member.passportNumber}`} className="max-w-[900px]" bodyClassName="overflow-y-auto" footer={<><SecondaryButton onClick={onClose}>Close</SecondaryButton><PrimaryButton onClick={onEdit}><UserCog className="h-3.5 w-3.5" />Edit</PrimaryButton></>}><div className="space-y-5 p-6"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><ProfileField label="Discord Username" value={member.discordUsername || "-"} /><ProfileField label="Badge Number" value={member.badgeNumber || "-"} /><ProfileField label="Primary Department" value={member.primaryDepartment || "-"} /><ProfileField label="Secondary Department" value={member.secondaryDepartment || "-"} /><ProfileField label="Joining Date" value={member.joiningDate || "-"} /><ProfileField label="Logs Assigned" value={member.logsAssigned ? "Yes" : "No"} /><ProfileField label="Badge Number Assigned" value={member.badgeNumberAssigned ? "Yes" : "No"} /><ProfileField label="Discord Roles" value={member.discordRoles ? "Yes" : "No"} /><ProfileField label="Hiring Record" value={member.hiringRecord ? "Yes" : "No"} /></div><div className="grid gap-4 lg:grid-cols-2"><div className="rounded-[8px] border border-[#e2e5ec] p-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-[13px] font-semibold">Strikes ({member.strikes.length})</h3><SecondaryButton onClick={() => setAction("strike")}><Plus className="h-3.5 w-3.5" />Add Strike</SecondaryButton></div>{member.strikes.map((strike) => <div key={strike.id} className="border-t border-[#f0f1f3] py-2 text-[12px]"><p>{strike.reason}</p><p className="mt-1 text-[#8a90a0]">{strike.addedBy} · {formatUkDate(strike.createdAt)}</p></div>)}{!member.strikes.length ? <p className="text-[12px] text-[#8a90a0]">No strikes recorded.</p> : null}</div><div className="rounded-[8px] border border-[#e2e5ec] p-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-[13px] font-semibold">Leave of Absence</h3><SecondaryButton onClick={() => setAction("loa")}><Plus className="h-3.5 w-3.5" />Add LOA</SecondaryButton></div>{member.loas.filter((value) => value.endDate >= londonToday()).map((entry) => <div key={entry.id} className="border-t border-[#f0f1f3] py-2 text-[12px]"><p>{entry.startDate} to {entry.endDate}</p><p className="mt-1 text-[#666]">{entry.reason}</p></div>)}{!member.loas.filter((value) => value.endDate >= londonToday()).length ? <p className="text-[12px] text-[#8a90a0]">No active or upcoming LOA.</p> : null}</div></div><div className="flex flex-wrap gap-2"><SecondaryButton onClick={() => setAction("rank")}><BookOpenCheck className="h-3.5 w-3.5" />Change Rank</SecondaryButton>{member.discordUsername ? <SecondaryButton onClick={() => copyMessage(member.discordUsername, "Discord username")}><Copy className="h-3.5 w-3.5" />Copy Discord Username</SecondaryButton> : null}</div>{action ? <div className="rounded-[9px] border border-[#e2e5ec] bg-[#f7f8fb] p-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-[14px] font-semibold">{action === "strike" ? "Add Strike" : action === "loa" ? "Add Leave of Absence" : "Confirm Rank Change"}</h3><button type="button" onClick={() => setAction("")}><X className="h-4 w-4 text-[#666]" /></button></div>{action === "loa" ? <div className="grid gap-3 sm:grid-cols-2"><div><label className={labelClass}>Start Date</label><input className={inputClass} type="date" value={loa.startDate} onChange={(event) => setLoa((current) => ({ ...current, startDate: event.target.value }))} /></div><div><label className={labelClass}>End Date</label><input className={inputClass} type="date" value={loa.endDate} onChange={(event) => setLoa((current) => ({ ...current, endDate: event.target.value }))} /></div><div className="sm:col-span-2"><label className={labelClass}>Reason</label><textarea className="min-h-[72px] w-full rounded-[6px] border border-[#e2e5ec] p-3 text-[13px] outline-none focus:border-[#000]" value={loa.reason} onChange={(event) => setLoa((current) => ({ ...current, reason: event.target.value }))} /></div></div> : <div>{action === "rank" ? <div className="mb-3"><label className={labelClass}>New Rank</label><AppSelect value={newRank} onChange={setNewRank} options={[{ value: "", label: "Select new rank" }, ...(settings?.ranks || []).filter((rank) => rank !== member.rank).map((value) => ({ value, label: value }))]} /></div> : null}<label className={labelClass}>Reason</label><textarea className="min-h-[72px] w-full rounded-[6px] border border-[#e2e5ec] p-3 text-[13px] outline-none focus:border-[#000]" value={reason} onChange={(event) => setReason(event.target.value)} /></div>}<div className="mt-4">{action === "strike" ? <DiscordPreview value={strikeTemplate(member, user, reason)} copy={() => copyMessage(strikeTemplate(member, user, reason), "Strike message")} /> : null}{action === "rank" && newRank ? <DiscordPreview value={rankTemplate(member, user, newRank, reason, promotion)} copy={() => copyMessage(rankTemplate(member, user, newRank, reason, promotion), `${promotion ? "Promotion" : "Demotion"} log`)} /> : null}</div><div className="mt-4 flex justify-end"><PrimaryButton disabled={saving} onClick={actionSave}>{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}Save</PrimaryButton></div></div> : null}</div></AppPopupWindow>;
}

function ProfileField({ label, value }: { label: string; value: string }) { return <div className="rounded-[7px] border border-[#e2e5ec] bg-[#f7f8fb] p-3"><p className="text-[10px] font-medium uppercase tracking-wide text-[#8a90a0]">{label}</p><p className="mt-1 text-[13px] font-medium">{value}</p></div>; }

function DiscordPreview({ value, copy }: { value: string; copy?: () => void }) { return <div className="rounded-[8px] border border-[#e2e5ec] bg-white"><div className="flex items-center justify-between border-b border-[#f0f1f3] px-3 py-2"><span className="text-[11px] font-medium uppercase tracking-wide text-[#8a90a0]">Discord Preview</span>{copy ? <SecondaryButton onClick={copy}><Copy className="h-3.5 w-3.5" />Copy</SecondaryButton> : null}</div><pre className="max-h-[250px] overflow-auto whitespace-pre-wrap p-3 text-[12px] leading-relaxed text-[#4d5568]">{value}</pre></div>; }

function MembersView({ members, settings, user, onOpen, onEdit, onRefresh }: { members: IaMember[]; settings: IaSettings | null; user: IaUser; onOpen: (member: IaMember) => void; onEdit: (member: IaMember) => void; onRefresh: () => Promise<void> }) {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [rank, setRank] = useState("");
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState<{ kind: "delete" | "fire"; member: IaMember } | null>(null);
  const [fireReason, setFireReason] = useState("");
  const [rankChange, setRankChange] = useState<{ member: IaMember; newRank: string } | null>(null);
  const [utilityOpen, setUtilityOpen] = useState<"logs" | "hiring" | "roles" | null>(null);

  const filtered = useMemo(
    () => members.filter((member) =>
      (!search || [member.name, member.passportNumber, member.discordUsername].join(" ").toLowerCase().includes(search.toLowerCase())) &&
      (!department || member.primaryDepartment === department) &&
      (!rank || member.rank === rank),
    ),
    [members, search, department, rank],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 20));
  const visible = filtered.slice((page - 1) * 20, page * 20);
  useEffect(() => setPage(1), [search, department, rank]);

  const runDeleteOrFire = async () => {
    if (!confirm) return;
    try {
      if (confirm.kind === "delete") {
        await iaApi.deleteMember(confirm.member.id);
      } else {
        if (!fireReason.trim()) {
          notify({ title: "Reason required", variant: "warning" });
          return;
        }
        await iaApi.fireMember(confirm.member.id, fireReason);
      }
      notify({ title: confirm.kind === "delete" ? "Member deleted" : "Member moved to Archives successfully", variant: "success" });
      setConfirm(null);
      setFireReason("");
      await onRefresh();
    } catch (error) {
      notify({ title: "Action failed", description: error instanceof Error ? error.message : "Please try again.", variant: "error" });
    }
  };

  const missingLogs = members.filter((member) => !member.logsAssigned);
  const missingHiring = members.filter((member) => !member.hiringRecord);
  const missingRoles = members.filter((member) => !member.discordRoles);

  return <>
    <div className="space-y-5">
      <Panel title={`Members (${members.length})`} description="Search the current organisation roster. Filters are limited to Department and Rank." action={<div className="flex flex-wrap gap-2"><SecondaryButton onClick={() => setUtilityOpen("logs")}>Missing Logs ({missingLogs.length})</SecondaryButton><SecondaryButton onClick={() => setUtilityOpen("hiring")}>Missing Hiring Logs ({missingHiring.length})</SecondaryButton><SecondaryButton onClick={() => setUtilityOpen("roles")}>Missing Roles ({missingRoles.length})</SecondaryButton></div>}>
        <div className="mb-4 flex flex-col gap-2 lg:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#9aa1b0]" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="h-9 w-full rounded-[6px] border border-[#e2e5ec] bg-white pl-9 pr-3 text-[13px] outline-none focus:border-[#000]" placeholder="Search name, passport number, or Discord username" />
          </div>
          <AppSelect value={department} onChange={setDepartment} options={[{ value: "", label: "All departments" }, ...(settings?.departments || []).map((value) => ({ value, label: value }))]} className="lg:w-[190px]" />
          <AppSelect value={rank} onChange={setRank} options={[{ value: "", label: "All ranks" }, ...(settings?.ranks || []).map((value) => ({ value, label: value }))]} className="lg:w-[190px]" />
        </div>
        <div className="min-w-0 overflow-hidden rounded-[6px] border border-[#e2e5ec] text-[13px]">
          <div className="hidden grid-cols-[minmax(0,1.35fr)_minmax(0,1.1fr)_120px_minmax(0,1fr)_110px_100px] items-center gap-x-4 border-b border-[#e2e5ec] bg-[#f7f8fb] px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#8a90a0] lg:grid">
            <span>Name</span><span>Rank</span><span>Badge Number</span><span>Primary Department</span><span className="block text-center">Manage</span><span className="block text-center">Actions</span>
          </div>
          {visible.map((member) => <div key={member.id} className="grid min-w-0 gap-x-4 gap-y-3 border-b border-[#f0f1f3] px-3 py-4 last:border-b-0 hover:bg-[#fafbfc] sm:grid-cols-2 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1.1fr)_120px_minmax(0,1fr)_110px_100px] lg:items-center lg:gap-y-0">
            <div className="min-w-0 sm:col-span-2 lg:col-span-1"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#8a90a0] lg:hidden">Member</span><button type="button" onClick={() => onOpen(member)} className="max-w-full text-left font-medium hover:underline">{member.name}<span className="mt-0.5 block text-[11px] font-normal text-[#8a90a0]">{member.passportNumber}</span></button></div>
            <div className="min-w-0"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#8a90a0] lg:hidden">Rank</span><AppSelect className="w-full" value={member.rank} onChange={(newRank) => { if (newRank !== member.rank) setRankChange({ member, newRank }); }} options={(settings?.ranks || [member.rank]).map((value) => ({ value, label: value }))} /></div>
            <div className="min-w-0"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#8a90a0] lg:hidden">Badge Number</span><p className="truncate text-[#4d5568]">{member.badgeNumber || "-"}</p></div>
            <div className="min-w-0"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#8a90a0] lg:hidden">Primary Department</span><p className="truncate text-[#4d5568]">{member.primaryDepartment || "-"}</p></div>
            <div className="flex items-center justify-center"><SecondaryButton onClick={() => onEdit(member)}><UserCog className="h-3.5 w-3.5" />Manage</SecondaryButton></div>
            <div className="flex items-center justify-center"><AppDropdownMenu trigger={<button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-[7px] border border-[#e2e5ec] bg-white px-3 text-[13px] font-medium text-[#000] hover:bg-[#f7f8fb]">Actions</button>} items={[{ label: "Delete", danger: true, icon: <X className="h-4 w-4" />, onSelect: () => setConfirm({ kind: "delete", member }) }, { label: "Fire", danger: true, icon: <Archive className="h-4 w-4" />, onSelect: () => setConfirm({ kind: "fire", member }) }]} /></div>
          </div>)}
          {!visible.length ? <div className="px-3 py-10 text-center text-[#8a90a0]">No current members match the selected filters.</div> : null}
        </div>
        {filtered.length > 20 ? <div className="mt-4 flex items-center justify-between text-[12px] text-[#666]"><span>Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, filtered.length)} of {filtered.length}</span><div className="flex gap-1"><SecondaryButton disabled={page === 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft className="h-3.5 w-3.5" /></SecondaryButton><SecondaryButton disabled={page === pages} onClick={() => setPage((value) => value + 1)}><ChevronRight className="h-3.5 w-3.5" /></SecondaryButton></div></div> : null}
      </Panel>
      <UtilityPopup kind="logs" open={utilityOpen === "logs"} members={missingLogs} user={user} onClose={() => setUtilityOpen(null)} />
      <UtilityPopup kind="hiring" open={utilityOpen === "hiring"} members={missingHiring} user={user} onClose={() => setUtilityOpen(null)} />
      <UtilityPopup kind="roles" open={utilityOpen === "roles"} members={missingRoles} user={user} onClose={() => setUtilityOpen(null)} />
    </div>
    <AppPopupWindow open={Boolean(confirm)} onOpenChange={(open) => !open && setConfirm(null)} title={confirm?.kind === "fire" ? "Fire Member" : "Delete Member"} description={confirm?.kind === "fire" ? "This moves the member to Archives and preserves their record for rehire." : "This permanently removes the member from the database."} footer={<><SecondaryButton onClick={() => setConfirm(null)}>Cancel</SecondaryButton><PrimaryButton onClick={runDeleteOrFire} className="bg-[#b42318] hover:bg-[#8f1c13]">{confirm?.kind === "fire" ? "Fire Member" : "Delete Member"}</PrimaryButton></>}>
      <div className="p-6">{confirm?.kind === "fire" ? <div className="grid items-start gap-4 lg:grid-cols-2"><div className="space-y-4"><div className="rounded-[7px] bg-[#f7f8fb] p-3 text-[13px]"><strong>{confirm.member.name}</strong> — {confirm.member.passportNumber}</div><div><label className={labelClass}>Reason <span className="text-[#b42318]">*</span></label><textarea className="min-h-[148px] w-full rounded-[6px] border border-[#e2e5ec] p-3 text-[13px] outline-none focus:border-[#000]" value={fireReason} onChange={(event) => setFireReason(event.target.value)} /></div></div><DiscordPreview value={firingTemplate(confirm.member, user, fireReason)} /></div> : <p className="text-[13px] text-[#4d5568]">Delete {confirm?.member.name}'s record?</p>}</div>
    </AppPopupWindow>
    <RankChangeModal state={rankChange} user={user} ranks={settings?.ranks || []} onClose={() => setRankChange(null)} onSaved={async () => { setRankChange(null); await onRefresh(); }} />
  </>;
}

function RankChangeModal({ state, user, ranks, onClose, onSaved }: { state: { member: IaMember; newRank: string } | null; user: IaUser; ranks: string[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => setReason(""), [state?.member.id, state?.newRank]);
  const isPromotion = state ? rankOrder(state.newRank, ranks) < rankOrder(state.member.rank, ranks) : false;
  const save = async () => {
    if (!state) return;
    if (!reason.trim()) return notify({ title: "Reason required", description: "Give a reason before saving the rank change.", variant: "warning" });
    setSaving(true);
    try {
      await iaApi.changeRank(state.member.id, state.newRank, reason);
      notify({ title: isPromotion ? "Promotion saved" : "Demotion saved", variant: "success" });
      await onSaved();
    } catch (error) {
      notify({ title: "Could not change rank", description: error instanceof Error ? error.message : "Please try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  };
  if (!state) return null;
  const preview = rankTemplate(state.member, user, state.newRank, reason, isPromotion);
  return <AppPopupWindow open={Boolean(state)} onOpenChange={(open) => !open && onClose()} title={isPromotion ? "Confirm Promotion" : "Confirm Demotion"} description={`${state.member.rank} → ${state.newRank}`} className="max-w-[900px]" footer={<><SecondaryButton onClick={onClose}>Cancel</SecondaryButton><PrimaryButton disabled={saving} onClick={save}>{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}Confirm Change</PrimaryButton></>}>
    <div className="grid gap-5 p-6 lg:grid-cols-2"><div><p className="mb-4 rounded-[7px] bg-[#f7f8fb] p-3 text-[13px]"><strong>{state.member.name}</strong> · Passport {state.member.passportNumber}</p><label className={labelClass}>Reason <span className="text-[#b42318]">*</span></label><textarea className="min-h-[160px] w-full rounded-[6px] border border-[#e2e5ec] p-3 text-[13px] outline-none focus:border-[#000]" value={reason} onChange={(event) => setReason(event.target.value)} /></div><DiscordPreview value={preview} copy={() => copyMessage(preview, `${isPromotion ? "Promotion" : "Demotion"} log`)} /></div>
  </AppPopupWindow>;
}
