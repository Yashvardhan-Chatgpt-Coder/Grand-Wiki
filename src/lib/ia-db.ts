import {
  IaOrganisation,
  IaEmployee,
  IaAuditEntry,
  IaDashboardStats,
  IaReportType,
  IaUserRole,
  IaFilterState,
  IaHiringRecord,
} from "./ia-types";

const STORAGE_KEY_ORGS = "ia_organisations_v2";
const STORAGE_KEY_EMPLOYEES = "ia_employees_v2";
const STORAGE_KEY_AUDIT = "ia_audit_logs_v2";
const STORAGE_KEY_CURRENT_ROLE = "ia_active_user_role_v2";
const EVENT_NAME = "ia:data-changed";

export const DEFAULT_ORGANISATIONS: IaOrganisation[] = [
  {
    id: "lspd",
    name: "Los Santos Police Department",
    shortName: "LSPD",
    badge: "Shield",
    themeColor: "#2563eb",
    description: "City law enforcement, patrol, traffic enforcement, SWAT tactical operations, and detective divisions.",
    departments: [
      "Patrol",
      "Traffic Division",
      "Detective Bureau",
      "SWAT / Tactical",
      "Air Support",
      "Internal Affairs",
      "High Command",
    ],
    ranks: [
      "Cadet (1)",
      "Officer I (2)",
      "Officer II (3)",
      "Senior Officer (4)",
      "Corporal (5)",
      "Sergeant I (6)",
      "Sergeant II (7)",
      "Lieutenant (8)",
      "Captain (9)",
      "Commander (10)",
      "Assistant Chief (11)",
      "Chief of Police (12)",
    ],
  },
  {
    id: "fib",
    name: "Federal Investigation Bureau",
    shortName: "FIB",
    badge: "ShieldCheck",
    themeColor: "#7c3aed",
    description: "Federal jurisdiction, counter-terrorism, high-level undercover investigations, and national security.",
    departments: [
      "Field Operations",
      "Counter-Terrorism",
      "Cyber Division",
      "Special Agent Division",
      "Executive Protection",
      "Internal Affairs",
      "Directorate",
    ],
    ranks: [
      "Trainee Agent (1)",
      "Special Agent (2)",
      "Senior Special Agent (3)",
      "Supervisory Special Agent (4)",
      "Assistant Special Agent in Charge (5)",
      "Special Agent in Charge (6)",
      "Deputy Director (7)",
      "Director (8)",
    ],
  },
  {
    id: "sahp",
    name: "San Andreas Highway Patrol",
    shortName: "SAHP",
    badge: "ShieldAlert",
    themeColor: "#ea580c",
    description: "State highway interdiction, rural county policing, speed enforcement, and convoy escorts.",
    departments: ["Highway Patrol", "Interception Unit", "Commercial Vehicle", "Internal Affairs", "Command Staff"],
    ranks: ["Cadet (1)", "Trooper (2)", "Senior Trooper (3)", "Corporal (4)", "Sergeant (5)", "Lieutenant (6)", "Captain (7)", "Commissioner (8)"],
  },
  {
    id: "gov",
    name: "Government of San Andreas",
    shortName: "GOV",
    badge: "Building",
    themeColor: "#059669",
    description: "State executive branch, Department of Justice, secret service protection, and administration.",
    departments: ["Secret Service", "Department of Justice", "State Treasury", "Executive Office"],
    ranks: ["Agent (1)", "Senior Agent (2)", "Special Agent (3)", "Lead Agent (4)", "Minister (5)", "Deputy Governor (6)", "Governor (7)"],
  },
];

const DEFAULT_EMPLOYEES: IaEmployee[] = [
  {
    id: "emp-lspd-1",
    fullName: "John Doe",
    inGameId: "4521",
    discordId: "johndoe_lspd",
    organisationId: "lspd",
    currentRank: "Sergeant I (6)",
    department: "Patrol",
    joinDate: "2026-05-12",
    status: "Active",
    hasRequiredRole: true,
    hasHiringRecord: true,
    hiringRecord: {
      hasRecord: true,
      hiringDate: "2026-05-12",
      recruiter: "Chief Marcus Vance",
      initialRank: "Cadet (1)",
      referenceLink: "https://discord.com/channels/grandrp/lspd-hiring/4521",
      note: "Standard academy graduate, cleared medical exam.",
    },
    lastLogCheck: {
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      checkedBy: "Yash",
      note: "All weekly arrest and patrol logs verified clean.",
    },
    logChecks: [
      {
        id: "lc-1",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        checkedBy: "Yash",
        note: "All weekly arrest and patrol logs verified clean.",
      },
      {
        id: "lc-2",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        checkedBy: "Rahul",
        note: "Routine patrol logs checked. 14 hours clocked.",
      },
      {
        id: "lc-3",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
        checkedBy: "Yash",
        note: "Initial sergeant shift logs verified.",
      },
    ],
    rankHistory: [
      {
        id: "rh-1",
        oldRank: "Corporal (5)",
        newRank: "Sergeant I (6)",
        date: "2026-08-22",
        changedBy: "Yash",
        note: "Promoted for leadership in patrol division.",
      },
      {
        id: "rh-2",
        oldRank: "Senior Officer (4)",
        newRank: "Corporal (5)",
        date: "2026-08-15",
        changedBy: "Rahul",
        note: "Field supervisor exam passed.",
      },
      {
        id: "rh-3",
        oldRank: "Officer II (3)",
        newRank: "Senior Officer (4)",
        date: "2026-08-08",
        changedBy: "Chief Marcus Vance",
        note: "Standard promotion cycle.",
      },
      {
        id: "rh-4",
        oldRank: "Cadet (1)",
        newRank: "Officer I (2)",
        date: "2026-08-01",
        changedBy: "Training Academy",
        note: "Academy graduated with honors.",
      },
    ],
    history: [
      {
        id: "eh-1",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        actor: "Yash",
        action: "Log Check",
        details: "Marked logs as checked with note: All weekly arrest and patrol logs verified clean.",
      },
      {
        id: "eh-2",
        timestamp: "2026-08-22T17:40:00.000Z",
        actor: "Yash",
        action: "Rank Promotion",
        details: "Changed rank from Corporal (5) → Sergeant I (6)",
      },
      {
        id: "eh-3",
        timestamp: "2026-05-12T10:00:00.000Z",
        actor: "Chief Marcus Vance",
        action: "Hiring Record Added",
        details: "Added hiring record with Cadet (1) initial rank.",
      },
    ],
    createdAt: "2026-05-12T10:00:00.000Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "emp-lspd-2",
    fullName: "Mike Smith",
    inGameId: "7214",
    discordId: "mikesmith#1209",
    organisationId: "lspd",
    currentRank: "Officer II (3)",
    department: "Traffic Division",
    joinDate: "2026-06-18",
    status: "Active",
    hasRequiredRole: false,
    hasHiringRecord: true,
    hiringRecord: {
      hasRecord: true,
      hiringDate: "2026-06-18",
      recruiter: "Capt. Steve Miller",
      initialRank: "Officer I (2)",
      referenceLink: "https://discord.com/channels/grandrp/lspd-hiring/7214",
      note: "Lateral transfer from SAHP.",
    },
    lastLogCheck: {
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
      checkedBy: "Rahul",
      note: "Speed enforcement citations cross-checked.",
    },
    logChecks: [
      {
        id: "lc-4",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
        checkedBy: "Rahul",
        note: "Speed enforcement citations cross-checked.",
      },
    ],
    rankHistory: [
      {
        id: "rh-5",
        oldRank: "Officer I (2)",
        newRank: "Officer II (3)",
        date: "2026-07-20",
        changedBy: "Capt. Steve Miller",
        note: "Assigned full patrol duties in Traffic Division.",
      },
    ],
    history: [
      {
        id: "eh-4",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
        actor: "Rahul",
        action: "Log Check",
        details: "Marked logs as checked.",
      },
    ],
    createdAt: "2026-06-18T12:00:00.000Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "emp-lspd-3",
    fullName: "Sarah Jenkins",
    inGameId: "1982",
    discordId: "sarah_detective",
    organisationId: "lspd",
    currentRank: "Lieutenant (8)",
    department: "Detective Bureau",
    joinDate: "2026-03-01",
    status: "Active",
    hasRequiredRole: true,
    hasHiringRecord: true,
    hiringRecord: {
      hasRecord: true,
      hiringDate: "2026-03-01",
      recruiter: "Chief Marcus Vance",
      initialRank: "Senior Officer (4)",
      referenceLink: "https://discord.com/channels/grandrp/lspd-hiring/1982",
      note: "Specialized investigator background.",
    },
    lastLogCheck: {
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      checkedBy: "Yash",
      note: "Search warrant logs and case filings inspected.",
    },
    logChecks: [
      {
        id: "lc-5",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
        checkedBy: "Yash",
        note: "Search warrant logs and case filings inspected.",
      },
    ],
    rankHistory: [],
    history: [],
    createdAt: "2026-03-01T08:00:00.000Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "emp-lspd-4",
    fullName: "David Vance",
    inGameId: "8832",
    discordId: "vance_d88",
    organisationId: "lspd",
    currentRank: "Officer I (2)",
    department: "Patrol",
    joinDate: "2026-07-05",
    status: "Active",
    hasRequiredRole: true,
    hasHiringRecord: false,
    lastLogCheck: {
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11).toISOString(), // 11 days ago (OVERDUE)
      checkedBy: "Rahul",
      note: "Missing hiring documentation flagged.",
    },
    logChecks: [
      {
        id: "lc-6",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11).toISOString(),
        checkedBy: "Rahul",
        note: "Missing hiring documentation flagged.",
      },
    ],
    rankHistory: [],
    history: [],
    createdAt: "2026-07-05T14:30:00.000Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "emp-lspd-5",
    fullName: "Marcus Brody",
    inGameId: "5102",
    discordId: "brody_tactical",
    organisationId: "lspd",
    currentRank: "Corporal (5)",
    department: "SWAT / Tactical",
    joinDate: "2026-07-15",
    status: "Active",
    hasRequiredRole: false,
    hasHiringRecord: false,
    logChecks: [],
    rankHistory: [],
    history: [],
    createdAt: "2026-07-15T09:00:00.000Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "emp-lspd-6",
    fullName: "Alex Rossi",
    inGameId: "3341",
    discordId: "capt_rossi",
    organisationId: "lspd",
    currentRank: "Captain (9)",
    department: "High Command",
    joinDate: "2026-01-10",
    status: "Active",
    hasRequiredRole: true,
    hasHiringRecord: true,
    hiringRecord: {
      hasRecord: true,
      hiringDate: "2026-01-10",
      recruiter: "Chief Marcus Vance",
      initialRank: "Lieutenant (8)",
      referenceLink: "https://discord.com/channels/grandrp/lspd-hiring/3341",
    },
    lastLogCheck: {
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      checkedBy: "Yash",
      note: "High Command supervisory logs verified.",
    },
    logChecks: [],
    rankHistory: [],
    history: [],
    createdAt: "2026-01-10T11:00:00.000Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "emp-lspd-7",
    fullName: "Emily Clarke",
    inGameId: "9104",
    discordId: "emily_sky",
    organisationId: "lspd",
    currentRank: "Senior Officer (4)",
    department: "Air Support",
    joinDate: "2026-04-20",
    status: "Active",
    hasRequiredRole: true,
    hasHiringRecord: true,
    lastLogCheck: {
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(), // Overdue
      checkedBy: "Rahul",
      note: "Flight hours verified.",
    },
    logChecks: [],
    rankHistory: [],
    history: [],
    createdAt: "2026-04-20T10:00:00.000Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "emp-lspd-8",
    fullName: "Robert King",
    inGameId: "1120",
    discordId: "rking_retired",
    organisationId: "lspd",
    currentRank: "Senior Officer (4)",
    department: "Patrol",
    joinDate: "2026-02-14",
    status: "Left Organisation",
    leftDate: "2026-08-10",
    leftReason: "Resigned honorable discharge - moved to private security.",
    hasRequiredRole: false,
    hasHiringRecord: true,
    hiringRecord: {
      hasRecord: true,
      hiringDate: "2026-02-14",
      recruiter: "Lt. Jenkins",
      initialRank: "Cadet (1)",
    },
    logChecks: [],
    rankHistory: [],
    history: [],
    createdAt: "2026-02-14T09:00:00.000Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "emp-lspd-9",
    fullName: "Lucas Meyer",
    inGameId: "6672",
    discordId: "meyer_lucas",
    organisationId: "lspd",
    currentRank: "Officer I (2)",
    department: "Traffic Division",
    joinDate: "2026-06-01",
    status: "Left Organisation",
    leftDate: "2026-07-28",
    leftReason: "Dishonorably discharged - inactive without notice.",
    hasRequiredRole: false,
    hasHiringRecord: false,
    logChecks: [],
    rankHistory: [],
    history: [],
    createdAt: "2026-06-01T10:00:00.000Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "emp-lspd-10",
    fullName: "Samantha Hayes",
    inGameId: "2847",
    discordId: "ia_samantha",
    organisationId: "lspd",
    currentRank: "Sergeant II (7)",
    department: "Internal Affairs",
    joinDate: "2026-02-01",
    status: "Active",
    hasRequiredRole: true,
    hasHiringRecord: true,
    lastLogCheck: {
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
      checkedBy: "Yash",
      note: "IA disciplinary audit completed.",
    },
    logChecks: [],
    rankHistory: [],
    history: [],
    createdAt: "2026-02-01T08:00:00.000Z",
    updatedAt: new Date().toISOString(),
  },
  // FIB Employees
  {
    id: "emp-fib-1",
    fullName: "Ethan Hunt",
    inGameId: "9012",
    discordId: "agent_hunt_fib",
    organisationId: "fib",
    currentRank: "Special Agent in Charge (6)",
    department: "Directorate",
    joinDate: "2026-01-05",
    status: "Active",
    hasRequiredRole: true,
    hasHiringRecord: true,
    hiringRecord: {
      hasRecord: true,
      hiringDate: "2026-01-05",
      recruiter: "Director Vance",
      initialRank: "Special Agent (2)",
      referenceLink: "https://discord.com/channels/grandrp/fib-records/9012",
      note: "Top Secret clearance verified.",
    },
    lastLogCheck: {
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      checkedBy: "Yash",
      note: "Classified operations logs reviewed.",
    },
    logChecks: [
      {
        id: "lc-fib-1",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        checkedBy: "Yash",
        note: "Classified operations logs reviewed.",
      },
    ],
    rankHistory: [],
    history: [],
    createdAt: "2026-01-05T09:00:00.000Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "emp-fib-2",
    fullName: "Olivia Pierce",
    inGameId: "6114",
    discordId: "olivia_fib",
    organisationId: "fib",
    currentRank: "Supervisory Special Agent (4)",
    department: "Field Operations",
    joinDate: "2026-03-10",
    status: "Active",
    hasRequiredRole: true,
    hasHiringRecord: true,
    hiringRecord: {
      hasRecord: true,
      hiringDate: "2026-03-10",
      recruiter: "Ethan Hunt",
      initialRank: "Trainee Agent (1)",
    },
    lastLogCheck: {
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      checkedBy: "Rahul",
      note: "Surveillance logs verified.",
    },
    logChecks: [],
    rankHistory: [],
    history: [],
    createdAt: "2026-03-10T10:00:00.000Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "emp-fib-3",
    fullName: "Daniel Craig",
    inGameId: "3491",
    discordId: "cyber_craig",
    organisationId: "fib",
    currentRank: "Senior Special Agent (3)",
    department: "Cyber Division",
    joinDate: "2026-04-15",
    status: "Active",
    hasRequiredRole: false,
    hasHiringRecord: true,
    lastLogCheck: {
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // Overdue
      checkedBy: "Rahul",
      note: "Wiretap authorization logs.",
    },
    logChecks: [],
    rankHistory: [],
    history: [],
    createdAt: "2026-04-15T11:00:00.000Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "emp-fib-4",
    fullName: "Rachel Adams",
    inGameId: "8203",
    discordId: "rachel_adams_fib",
    organisationId: "fib",
    currentRank: "Trainee Agent (1)",
    department: "Special Agent Division",
    joinDate: "2026-08-01",
    status: "Active",
    hasRequiredRole: false,
    hasHiringRecord: false,
    logChecks: [],
    rankHistory: [],
    history: [],
    createdAt: "2026-08-01T14:00:00.000Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "emp-fib-5",
    fullName: "Walter White",
    inGameId: "1001",
    discordId: "heisenberg_fib",
    organisationId: "fib",
    currentRank: "Special Agent (2)",
    department: "Field Operations",
    joinDate: "2026-01-20",
    status: "Left Organisation",
    leftDate: "2026-08-01",
    leftReason: "Transferred to Federal Marshals.",
    hasRequiredRole: false,
    hasHiringRecord: true,
    logChecks: [],
    rankHistory: [],
    history: [],
    createdAt: "2026-01-20T08:00:00.000Z",
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_AUDIT_LOGS: IaAuditEntry[] = [
  {
    id: "audit-1",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    actor: "Yash",
    actorRole: "admin",
    organisationId: "lspd",
    employeeId: "emp-lspd-1",
    employeeName: "John Doe",
    actionType: "LOG_CHECK",
    summary: "Yash marked John Doe's logs as checked.",
    details: "Note: All weekly arrest and patrol logs verified clean.",
  },
  {
    id: "audit-2",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    actor: "Yash",
    actorRole: "admin",
    organisationId: "fib",
    employeeId: "emp-fib-1",
    employeeName: "Ethan Hunt",
    actionType: "LOG_CHECK",
    summary: "Yash marked Ethan Hunt's logs as checked.",
    details: "Classified operations logs reviewed.",
  },
  {
    id: "audit-3",
    timestamp: "2026-08-22T17:40:00.000Z",
    actor: "Yash",
    actorRole: "admin",
    organisationId: "lspd",
    employeeId: "emp-lspd-1",
    employeeName: "John Doe",
    actionType: "RANK_CHANGE",
    summary: "Yash changed John Doe's rank from Corporal (5) → Sergeant I (6).",
    details: "Promoted for leadership in patrol division.",
  },
  {
    id: "audit-4",
    timestamp: "2026-08-18T14:45:00.000Z",
    actor: "Rahul",
    actorRole: "ia_member",
    organisationId: "lspd",
    employeeId: "emp-lspd-2",
    employeeName: "Mike Smith",
    actionType: "HIRING_RECORD_UPDATED",
    summary: "Rahul verified Mike Smith's hiring record.",
    details: "Lateral transfer from SAHP documented.",
  },
];

// Helper functions for storage
function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { key } }));
  } catch (err) {
    console.error(`Error saving to ${key}:`, err);
  }
}

export const iaDb = {
  // Listener subscription
  subscribe(callback: () => void): () => void {
    if (typeof window === "undefined") return () => {};
    const handler = () => callback();
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  },

  // Active User Role management
  getActiveRole(): IaUserRole {
    return readStorage<IaUserRole>(STORAGE_KEY_CURRENT_ROLE, "admin");
  },

  setActiveRole(role: IaUserRole): void {
    writeStorage(STORAGE_KEY_CURRENT_ROLE, role);
  },

  // Organisations
  getOrganisations(): IaOrganisation[] {
    return readStorage<IaOrganisation[]>(STORAGE_KEY_ORGS, DEFAULT_ORGANISATIONS);
  },

  getOrganisation(id: string): IaOrganisation | undefined {
    return this.getOrganisations().find((org) => org.id.toLowerCase() === id.toLowerCase());
  },

  saveOrganisations(orgs: IaOrganisation[]): void {
    writeStorage(STORAGE_KEY_ORGS, orgs);
  },

  addOrganisation(org: IaOrganisation, actor: string): void {
    const orgs = this.getOrganisations();
    orgs.push(org);
    this.saveOrganisations(orgs);
    this.addAuditEntry({
      actor,
      actorRole: this.getActiveRole(),
      organisationId: org.id,
      actionType: "ORGANISATION_UPDATED",
      summary: `${actor} created new organization: ${org.name} (${org.shortName})`,
    });
  },

  updateOrganisation(
    orgOrId: IaOrganisation | string,
    updatesOrActor?: Partial<IaOrganisation> | string,
    optionalActor?: string
  ): void {
    const orgs = this.getOrganisations();
    let updatedOrg: IaOrganisation | undefined;
    let actor = "High Command";

    if (typeof orgOrId === "string") {
      const id = orgOrId;
      const updates = (updatesOrActor && typeof updatesOrActor === "object" ? updatesOrActor : {}) as Partial<IaOrganisation>;
      actor = optionalActor || (typeof updatesOrActor === "string" ? updatesOrActor : "High Command");
      const index = orgs.findIndex((o) => o.id === id);
      if (index !== -1) {
        orgs[index] = { ...orgs[index], ...updates };
        updatedOrg = orgs[index];
      }
    } else {
      const org = orgOrId;
      actor = (typeof updatesOrActor === "string" ? updatesOrActor : optionalActor) || "High Command";
      const index = orgs.findIndex((o) => o.id === org.id);
      if (index !== -1) {
        orgs[index] = org;
        updatedOrg = org;
      }
    }

    if (updatedOrg) {
      this.saveOrganisations(orgs);
      this.addAuditEntry({
        actor,
        actorRole: this.getActiveRole(),
        organisationId: updatedOrg.id,
        actionType: "ORGANISATION_UPDATED",
        summary: `${actor} updated organization settings for ${updatedOrg.name}`,
      });
    }
  },

  // Employees
  getEmployees(
    filterOrOrgId?:
      | string
      | {
          organisationId?: string;
          searchQuery?: string;
          status?: string;
          rank?: string;
          department?: string;
        }
  ): IaEmployee[] {
    const all = readStorage<IaEmployee[]>(STORAGE_KEY_EMPLOYEES, DEFAULT_EMPLOYEES);
    if (!filterOrOrgId) return all;

    if (typeof filterOrOrgId === "string") {
      const orgId = filterOrOrgId;
      if (orgId === "all") return all;
      return all.filter((e) => (e.organisationId || "").toLowerCase() === orgId.toLowerCase());
    }

    const { organisationId, searchQuery, status, rank, department } = filterOrOrgId;
    return all.filter((e) => {
      if (organisationId && organisationId !== "all") {
        if ((e.organisationId || "").toLowerCase() !== organisationId.toLowerCase()) return false;
      }
      if (status && status !== "all" && e.status !== status) {
        return false;
      }
      if (rank && rank !== "all" && e.currentRank !== rank) {
        return false;
      }
      if (department && department !== "all" && e.department !== department) {
        return false;
      }
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          (e.fullName || "").toLowerCase().includes(q) ||
          (e.inGameId || "").toLowerCase().includes(q) ||
          (e.discordId || "").toLowerCase().includes(q) ||
          (e.currentRank || "").toLowerCase().includes(q) ||
          (e.department || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  },

  getEmployeeById(id: string): IaEmployee | undefined {
    return this.getEmployees().find((e) => e.id === id);
  },

  saveEmployees(employees: IaEmployee[]): void {
    writeStorage(STORAGE_KEY_EMPLOYEES, employees);
  },

  createEmployee(
    data: Omit<IaEmployee, "id" | "createdAt" | "updatedAt" | "logChecks" | "rankHistory" | "history">,
    actor: string,
  ): IaEmployee {
    const now = new Date().toISOString();
    const newEmp: IaEmployee = {
      ...data,
      id: `emp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      logChecks: [],
      rankHistory: [
        {
          id: `rh-${Date.now()}`,
          oldRank: "None",
          newRank: data.currentRank,
          date: data.joinDate || now.split("T")[0],
          changedBy: actor,
          note: "Initial hiring and assignment.",
        },
      ],
      history: [
        {
          id: `eh-${Date.now()}`,
          timestamp: now,
          actor,
          action: "Employee Added",
          details: `Created record for ${data.fullName} (ID: ${data.inGameId}) in ${data.department}`,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    const all = readStorage<IaEmployee[]>(STORAGE_KEY_EMPLOYEES, DEFAULT_EMPLOYEES);
    all.unshift(newEmp);
    this.saveEmployees(all);

    this.addAuditEntry({
      actor,
      actorRole: this.getActiveRole(),
      organisationId: data.organisationId,
      employeeId: newEmp.id,
      employeeName: newEmp.fullName,
      actionType: "EMPLOYEE_CREATED",
      summary: `${actor} registered new employee ${newEmp.fullName} (ID: ${newEmp.inGameId}) in ${newEmp.organisationId.toUpperCase()}`,
      details: `Rank: ${newEmp.currentRank}, Dept: ${newEmp.department}`,
    });

    return newEmp;
  },

  updateEmployee(
    id: string,
    updates: Partial<IaEmployee>,
    actor: string,
    changeDescription?: string,
  ): IaEmployee | undefined {
    const all = readStorage<IaEmployee[]>(STORAGE_KEY_EMPLOYEES, DEFAULT_EMPLOYEES);
    const index = all.findIndex((e) => e.id === id);
    if (index === -1) return undefined;

    const existing = all[index];
    const now = new Date().toISOString();

    const historyEntry = {
      id: `eh-${Date.now()}`,
      timestamp: now,
      actor,
      action: "Profile Updated",
      details: changeDescription || "Updated employee information.",
    };

    const updatedEmp: IaEmployee = {
      ...existing,
      ...updates,
      history: [historyEntry, ...(existing.history || [])],
      updatedAt: now,
    };

    all[index] = updatedEmp;
    this.saveEmployees(all);

    this.addAuditEntry({
      actor,
      actorRole: this.getActiveRole(),
      organisationId: updatedEmp.organisationId,
      employeeId: updatedEmp.id,
      employeeName: updatedEmp.fullName,
      actionType: "EMPLOYEE_UPDATED",
      summary: `${actor} updated record for ${updatedEmp.fullName} (ID: ${updatedEmp.inGameId})`,
      details: changeDescription,
    });

    return updatedEmp;
  },

  changeEmployeeStatus(
    id: string,
    status: "Active" | "Left Organisation",
    param3?: string,
    param4?: string
  ): IaEmployee | undefined {
    const all = readStorage<IaEmployee[]>(STORAGE_KEY_EMPLOYEES, DEFAULT_EMPLOYEES);
    const index = all.findIndex((e) => e.id === id);
    if (index === -1) return undefined;

    let actor = "IA Officer";
    let reason: string | undefined = undefined;

    if (param3 && param4) {
      if (
        param3.toLowerCase().includes("officer") ||
        param3.toLowerCase().includes("admin") ||
        param3.toLowerCase().includes("agent") ||
        param3.toLowerCase().includes("yash") ||
        param3.toLowerCase().includes("rahul")
      ) {
        actor = param3;
        reason = param4;
      } else {
        reason = param3;
        actor = param4;
      }
    } else if (param3) {
      if (
        param3.toLowerCase().includes("officer") ||
        param3.toLowerCase().includes("admin") ||
        param3.toLowerCase().includes("agent") ||
        param3.toLowerCase().includes("yash") ||
        param3.toLowerCase().includes("rahul")
      ) {
        actor = param3;
      } else {
        reason = param3;
      }
    }

    const existing = all[index];
    const now = new Date().toISOString();
    const today = now.split("T")[0];

    const historyEntry = {
      id: `eh-${Date.now()}`,
      timestamp: now,
      actor,
      action: "Status Change",
      details: `Changed status from ${existing.status} → ${status}${reason ? `. Reason: ${reason}` : ""}`,
    };

    const updatedEmp: IaEmployee = {
      ...existing,
      status,
      leftDate: status === "Left Organisation" ? (existing.leftDate || today) : undefined,
      leftReason: status === "Left Organisation" ? reason : undefined,
      history: [historyEntry, ...(existing.history || [])],
      updatedAt: now,
    };

    all[index] = updatedEmp;
    this.saveEmployees(all);

    this.addAuditEntry({
      actor,
      actorRole: this.getActiveRole(),
      organisationId: updatedEmp.organisationId,
      employeeId: updatedEmp.id,
      employeeName: updatedEmp.fullName,
      actionType: "STATUS_CHANGED",
      summary: `${actor} marked ${updatedEmp.fullName} (ID: ${updatedEmp.inGameId}) as "${status}"`,
      details: reason,
    });

    return updatedEmp;
  },

  // Mark Logs Checked (Strict requirement: records employee, IA member, date, time, optional note)
  markLogChecked(employeeId: string, actor: string, note?: string): IaEmployee | undefined {
    const all = readStorage<IaEmployee[]>(STORAGE_KEY_EMPLOYEES, DEFAULT_EMPLOYEES);
    const index = all.findIndex((e) => e.id === employeeId);
    if (index === -1) return undefined;

    const emp = all[index];
    const now = new Date().toISOString();

    const logCheckEntry = {
      id: `lc-${Date.now()}`,
      timestamp: now,
      checkedBy: actor,
      note: note?.trim() || undefined,
    };

    const historyEntry = {
      id: `eh-${Date.now()}`,
      timestamp: now,
      actor,
      action: "Log Check",
      details: `Marked logs as checked.${note ? ` Note: ${note.trim()}` : ""}`,
    };

    const updatedEmp: IaEmployee = {
      ...emp,
      lastLogCheck: logCheckEntry,
      logChecks: [logCheckEntry, ...(emp.logChecks || [])],
      history: [historyEntry, ...(emp.history || [])],
      updatedAt: now,
    };

    all[index] = updatedEmp;
    this.saveEmployees(all);

    this.addAuditEntry({
      actor,
      actorRole: this.getActiveRole(),
      organisationId: emp.organisationId,
      employeeId: emp.id,
      employeeName: emp.fullName,
      actionType: "LOG_CHECK",
      summary: `${actor} marked ${emp.fullName}'s logs as checked.`,
      details: note?.trim() ? `Note: ${note.trim()}` : undefined,
    });

    return updatedEmp;
  },

  addLogCheck(employeeId: string, actor: string, note?: string): IaEmployee | undefined {
    return this.markLogChecked(employeeId, actor, note);
  },

  // Promotion / Rank & Department Change
  changeRank(
    employeeId: string,
    newRank: string,
    newDept: string | undefined,
    actor: string,
    note?: string,
  ): IaEmployee | undefined {
    const all = readStorage<IaEmployee[]>(STORAGE_KEY_EMPLOYEES, DEFAULT_EMPLOYEES);
    const index = all.findIndex((e) => e.id === employeeId);
    if (index === -1) return undefined;

    const emp = all[index];
    const oldRank = emp.currentRank;
    const oldDept = emp.department;
    const now = new Date().toISOString();
    const today = now.split("T")[0];

    const rankHistoryEntry = {
      id: `rh-${Date.now()}`,
      oldRank,
      newRank,
      date: today,
      changedBy: actor,
      note: note?.trim() || undefined,
    };

    const details = `Changed rank from ${oldRank} → ${newRank}${newDept && newDept !== oldDept ? ` (Dept: ${oldDept} → ${newDept})` : ""}${note ? `. Note: ${note.trim()}` : ""}`;

    const historyEntry = {
      id: `eh-${Date.now()}`,
      timestamp: now,
      actor,
      action: "Rank Promotion / Change",
      details,
    };

    const updatedEmp: IaEmployee = {
      ...emp,
      currentRank: newRank,
      department: newDept || emp.department,
      rankHistory: [rankHistoryEntry, ...(emp.rankHistory || [])],
      history: [historyEntry, ...(emp.history || [])],
      updatedAt: now,
    };

    all[index] = updatedEmp;
    this.saveEmployees(all);

    this.addAuditEntry({
      actor,
      actorRole: this.getActiveRole(),
      organisationId: emp.organisationId,
      employeeId: emp.id,
      employeeName: emp.fullName,
      actionType: "RANK_CHANGE",
      summary: `${actor} changed ${emp.fullName}'s rank from ${oldRank} → ${newRank}.`,
      details: note?.trim() || undefined,
    });

    return updatedEmp;
  },

  promoteEmployee(
    employeeId: string,
    newRank: string,
    newDept: string | undefined,
    actor: string,
    note?: string,
  ): IaEmployee | undefined {
    return this.changeRank(employeeId, newRank, newDept, actor, note);
  },

  // Discord Role Status toggle
  updateRoleStatus(employeeId: string, hasRequiredRole: boolean, actor: string): IaEmployee | undefined {
    const all = readStorage<IaEmployee[]>(STORAGE_KEY_EMPLOYEES, DEFAULT_EMPLOYEES);
    const index = all.findIndex((e) => e.id === employeeId);
    if (index === -1) return undefined;

    const emp = all[index];
    const now = new Date().toISOString();

    const historyEntry = {
      id: `eh-${Date.now()}`,
      timestamp: now,
      actor,
      action: "Role Status Updated",
      details: `Discord role status set to ${hasRequiredRole ? "Has Required Role (✅)" : "Missing Required Role (❌)"}`,
    };

    const updatedEmp: IaEmployee = {
      ...emp,
      hasRequiredRole,
      history: [historyEntry, ...(emp.history || [])],
      updatedAt: now,
    };

    all[index] = updatedEmp;
    this.saveEmployees(all);

    this.addAuditEntry({
      actor,
      actorRole: this.getActiveRole(),
      organisationId: emp.organisationId,
      employeeId: emp.id,
      employeeName: emp.fullName,
      actionType: "ROLE_STATUS_CHANGED",
      summary: `${actor} set ${emp.fullName}'s Discord role status to ${hasRequiredRole ? "✅ Present" : "❌ Missing"}.`,
    });

    return updatedEmp;
  },

  // Hiring Record update
  updateHiringRecord(
    employeeId: string,
    hiringRecord: IaHiringRecord,
    actor: string,
  ): IaEmployee | undefined {
    const all = readStorage<IaEmployee[]>(STORAGE_KEY_EMPLOYEES, DEFAULT_EMPLOYEES);
    const index = all.findIndex((e) => e.id === employeeId);
    if (index === -1) return undefined;

    const emp = all[index];
    const now = new Date().toISOString();

    const historyEntry = {
      id: `eh-${Date.now()}`,
      timestamp: now,
      actor,
      action: "Hiring Record Updated",
      details: hiringRecord.hasRecord
        ? `Hiring paperwork logged. Recruiter: ${hiringRecord.recruiter || "N/A"}, Date: ${hiringRecord.hiringDate}`
        : "Hiring paperwork marked missing.",
    };

    const updatedEmp: IaEmployee = {
      ...emp,
      hasHiringRecord: hiringRecord.hasRecord,
      hiringRecord,
      history: [historyEntry, ...(emp.history || [])],
      updatedAt: now,
    };

    all[index] = updatedEmp;
    this.saveEmployees(all);

    this.addAuditEntry({
      actor,
      actorRole: this.getActiveRole(),
      organisationId: emp.organisationId,
      employeeId: emp.id,
      employeeName: emp.fullName,
      actionType: "HIRING_RECORD_UPDATED",
      summary: `${actor} updated hiring record for ${emp.fullName}.`,
      details: hiringRecord.hasRecord
        ? `Recruiter: ${hiringRecord.recruiter}, Initial Rank: ${hiringRecord.initialRank}`
        : "Marked hiring record as missing.",
    });

    return updatedEmp;
  },

  // Audit History
  getAuditLog(filters?: { organisationId?: string; actor?: string; actionType?: string }): IaAuditEntry[] {
    let logs = readStorage<IaAuditEntry[]>(STORAGE_KEY_AUDIT, DEFAULT_AUDIT_LOGS);
    if (filters?.organisationId && filters.organisationId !== "all") {
      logs = logs.filter((l) => l.organisationId.toLowerCase() === filters.organisationId?.toLowerCase());
    }
    if (filters?.actor) {
      logs = logs.filter((l) => l.actor.toLowerCase().includes(filters.actor!.toLowerCase()));
    }
    if (filters?.actionType && filters.actionType !== "all") {
      logs = logs.filter((l) => l.actionType === filters.actionType);
    }
    return logs;
  },

  addAuditEntry(entry: Omit<IaAuditEntry, "id" | "timestamp">): void {
    const fullEntry: IaAuditEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    const logs = readStorage<IaAuditEntry[]>(STORAGE_KEY_AUDIT, DEFAULT_AUDIT_LOGS);
    logs.unshift(fullEntry);
    writeStorage(STORAGE_KEY_AUDIT, logs.slice(0, 300)); // Keep latest 300 entries
  },

  // Dashboard Stats
  getDashboardStats(orgId: string): IaDashboardStats {
    const employees = this.getEmployees(orgId);
    const active = employees.filter((e) => e.status === "Active");
    const left = employees.filter((e) => e.status === "Left Organisation");
    const missingRoles = active.filter((e) => !e.hasRequiredRole);
    const missingHiring = active.filter((e) => !e.hasHiringRecord);

    const sevenDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 7;
    const overdueLogs = active.filter((e) => {
      if (!e.lastLogCheck?.timestamp) return true;
      const lastCheckTime = new Date(e.lastLogCheck.timestamp).getTime();
      return lastCheckTime < sevenDaysAgo;
    });

    // Recent changes across employees in this org
    const allChanges: IaEmployeeHistoryEntry[] = [];
    employees.forEach((e) => {
      (e.history || []).forEach((h) => {
        allChanges.push({
          ...h,
          details: `[${e.fullName} (${e.inGameId})]: ${h.details}`,
        });
      });
    });
    allChanges.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const recentActivity = this.getAuditLog({ organisationId: orgId }).slice(0, 10);

    return {
      totalEmployees: employees.length,
      activeEmployees: active.length,
      leftEmployees: left.length,
      missingRolesCount: missingRoles.length,
      missingHiringCount: missingHiringCountCalc(active),
      overdueLogsCount: overdueLogs.length,
      recentChanges: allChanges.slice(0, 10),
      recentActivity,
    };
  },

  // Database Backup / Import / Reset
  exportDatabase(): string {
    const data = {
      version: 2,
      exportedAt: new Date().toISOString(),
      organisations: this.getOrganisations(),
      employees: this.getEmployees(),
      auditLogs: this.getAuditLog(),
    };
    return JSON.stringify(data, null, 2);
  },

  importDatabase(jsonData: string, actor: string): boolean {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed.organisations || !parsed.employees) {
        throw new Error("Invalid database format.");
      }
      writeStorage(STORAGE_KEY_ORGS, parsed.organisations);
      writeStorage(STORAGE_KEY_EMPLOYEES, parsed.employees);
      if (parsed.auditLogs) {
        writeStorage(STORAGE_KEY_AUDIT, parsed.auditLogs);
      }
      this.addAuditEntry({
        actor,
        actorRole: this.getActiveRole(),
        organisationId: "all",
        actionType: "DATABASE_IMPORT",
        summary: `${actor} imported and restored IA database backup.`,
      });
      return true;
    } catch (e) {
      console.error("Import error:", e);
      return false;
    }
  },

  resetDatabase(actor: string = "Admin"): void {
    writeStorage(STORAGE_KEY_ORGS, DEFAULT_ORGANISATIONS);
    writeStorage(STORAGE_KEY_EMPLOYEES, DEFAULT_EMPLOYEES);
    writeStorage(STORAGE_KEY_AUDIT, DEFAULT_AUDIT_LOGS);
    this.addAuditEntry({
      actor,
      actorRole: this.getActiveRole(),
      organisationId: "all",
      actionType: "DATABASE_RESET",
      summary: `${actor} reset the IA database to default state.`,
    });
  },

  exportDatabaseJson(): string {
    return this.exportDatabase();
  },

  importDatabaseJson(jsonData: string, actor: string = "Admin"): boolean {
    return this.importDatabase(jsonData, actor);
  },

  resetToSampleData(actor: string = "Admin"): void {
    this.resetDatabase(actor);
  },
};

function missingHiringCountCalc(active: IaEmployee[]): number {
  return active.filter((e) => !e.hasHiringRecord).length;
}
