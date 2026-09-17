const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SESSION_KEY = "internal_affairs_session";

export type IaUser = {
  id: string;
  name: string;
  email: string;
  organisation: string;
  rank: string;
  isAdmin: boolean;
  createdAt?: string;
};

export type IaSession = { token: string; user: IaUser };

export type IaStrike = { id: string; reason: string; addedBy: string; createdAt: string };
export type IaLoa = { id: string; startDate: string; endDate: string; reason: string; addedBy: string; createdAt: string };

export type IaMember = {
  id: string;
  name: string;
  passportNumber: string;
  badgeNumber: string;
  discordUsername: string;
  rank: string;
  primaryDepartment: string;
  secondaryDepartment: string;
  joiningDate: string;
  logsAssigned: boolean;
  badgeNumberAssigned: boolean;
  discordRoles: boolean;
  hiringRecord: boolean;
  status: "active" | "archived";
  leftDate: string;
  leftReason: string;
  rolesRemoved: boolean;
  strikes: IaStrike[];
  loas: IaLoa[];
  activeLoas: IaLoa[];
  createdAt: string;
  updatedAt: string;
};

export type IaSettings = { id: string; key: string; departments: string[]; ranks: string[] };
export type IaAuditLog = { id: string; actorName: string; actorEmail?: string; actorRank?: string; action: string; details: string; entityType: string; entityId: string; entityName: string; metadata: Record<string, unknown>; createdAt: string };
export type IaDailyCheck = { id: string; memberId: string; date: string; checkedBy: string; createdAt: string };
export type IaLicenseCheck = { id: string; memberId: string; date: string; driverLicense: boolean; weaponsLicense: boolean; healthInsurance: boolean; lawyerLicense: boolean | null; checkedBy: string; createdAt: string };
export type IaBackgroundCheck = { id: string; memberId: string; date: string; wanted: boolean; prisonTerms: boolean; previousCrimes: boolean; criminalStructures: boolean; checkedBy: string; createdAt: string };
export type IaBodycamRequest = { id: string; memberId: string; requestType: "arrest" | "activity"; suspectName: string; arrestDate: string; arrestTime: string; deadline: string; status: "pending" | "provided" | "not_provided"; requestedBy: string; createdAt: string };
export type IaBodycamCheck = { id: string; memberIds: string[]; date: string; checkedBy: string; createdAt: string };
export type IaDashboard = { totalMembers: number; membersOnLoa: number; archivedMembers: number; missingLogs: number; missingHiringLogs: number; missingRoles: number; archivedMembersWithRoles: number; dailyLogProgress: { checked: number; remaining: number }; pendingBodycam: { provided: number; notProvided: number }; recentActivity: IaAuditLog[] };

export type MemberInput = Pick<IaMember, "name" | "passportNumber" | "discordUsername" | "rank" | "primaryDepartment" | "secondaryDepartment" | "joiningDate" | "logsAssigned" | "badgeNumberAssigned" | "discordRoles" | "hiringRecord">;

export type MemberInputWithBadge = MemberInput & Partial<Pick<IaMember, "badgeNumber">>;

function getSession(): IaSession | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null") as IaSession | null;
  } catch {
    return null;
  }
}

function saveSession(session: IaSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = getSession();
  return fetch(`${API_BASE}/internal-affairs${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...init.headers,
    },
  }).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Internal Affairs request failed.");
    const refreshedToken = response.headers.get("X-IA-Token");
    if (refreshedToken && session) saveSession({ ...session, token: refreshedToken });
    return data as T;
  });
}

export const iaSession = {
  get: getSession,
  clear: () => localStorage.removeItem(SESSION_KEY),
  login: async (email: string, password: string, adminOnly: boolean) => {
    const response = await request<IaSession>("/auth/login", { method: "POST", body: JSON.stringify({ email, password, adminOnly }) });
    saveSession(response);
    return response;
  },
  me: () => request<{ user: IaUser }>("/auth/me"),
};

export const iaApi = {
  getSettings: () => request<IaSettings>("/settings"),
  updateSettings: (input: Pick<IaSettings, "departments" | "ranks">) => request<IaSettings>("/settings", { method: "PATCH", body: JSON.stringify(input) }),
  updateProfile: async (input: { rank: string }) => {
    const res = await request<{ user: IaUser }>("/auth/profile", { method: "PATCH", body: JSON.stringify(input) });
    const session = getSession();
    if (session) saveSession({ ...session, user: res.user });
    return res;
  },
  getUsers: () => request<IaUser[]>("/admin/users"),
  createUser: (input: { name: string; email: string; password: string; organisation: string; rank: string }) => request<IaUser>("/admin/users", { method: "POST", body: JSON.stringify(input) }),
  deleteUser: (id: string) => request<{ message: string }>(`/admin/users/${id}`, { method: "DELETE" }),
  getMembers: (status: "active" | "archived", filters?: { search?: string; department?: string; rank?: string }) => {
    const query = new URLSearchParams({ status });
    if (filters?.search) query.set("search", filters.search);
    if (filters?.department) query.set("department", filters.department);
    if (filters?.rank) query.set("rank", filters.rank);
    return request<IaMember[]>(`/members?${query}`);
  },
  createMember: (input: MemberInputWithBadge) => request<IaMember>("/members", { method: "POST", body: JSON.stringify(input) }),
  updateMember: (id: string, input: MemberInputWithBadge) => request<IaMember>(`/members/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteMember: (id: string) => request<{ message: string }>(`/members/${id}`, { method: "DELETE" }),
  fireMember: (id: string, reason: string) => request<IaMember>(`/members/${id}/fire`, { method: "POST", body: JSON.stringify({ reason }) }),
  rehireMember: (id: string, input: MemberInputWithBadge) => request<IaMember>(`/members/${id}/rehire`, { method: "POST", body: JSON.stringify(input) }),
  changeRank: (id: string, newRank: string, reason: string) => request<IaMember>(`/members/${id}/rank-change`, { method: "POST", body: JSON.stringify({ newRank, reason }) }),
  addStrike: (id: string, reason: string) => request<IaMember>(`/members/${id}/strikes`, { method: "POST", body: JSON.stringify({ reason }) }),
  addLoa: (id: string, input: { startDate: string; endDate: string; reason: string }) => request<IaMember>(`/members/${id}/loa`, { method: "POST", body: JSON.stringify(input) }),
  markRolesRemoved: (id: string) => request<IaMember>(`/members/${id}/roles-removed`, { method: "POST" }),
  getDailyChecks: (date: string) => request<{ date: string; checks: IaDailyCheck[] }>(`/checks/daily?date=${encodeURIComponent(date)}`),
  saveDailyChecks: (date: string, memberIds: string[]) => request<{ date: string; checkedMemberIds: string[] }>("/checks/daily", { method: "POST", body: JSON.stringify({ date, memberIds }) }),
  getLicenseChecks: () => request<IaLicenseCheck[]>("/checks/license"),
  saveLicenseChecks: (date: string, checks: Omit<IaLicenseCheck, "id" | "date" | "checkedBy" | "createdAt">[]) => request<IaLicenseCheck[]>("/checks/license", { method: "POST", body: JSON.stringify({ date, checks }) }),
  getBackgroundChecks: () => request<IaBackgroundCheck[]>("/checks/background"),
  saveBackgroundChecks: (date: string, checks: Omit<IaBackgroundCheck, "id" | "date" | "checkedBy" | "createdAt">[]) => request<IaBackgroundCheck[]>("/checks/background", { method: "POST", body: JSON.stringify({ date, checks }) }),
  getBodycamRequests: () => request<IaBodycamRequest[]>("/bodycam/requests"),
  createBodycamRequests: (input: { memberIds: string[]; requestType: "arrest" | "activity"; suspectName?: string; arrestDate?: string; arrestTime?: string; deadline?: string }) => request<IaBodycamRequest[]>("/bodycam/requests", { method: "POST", body: JSON.stringify(input) }),
  updateBodycamRequest: (id: string, status: IaBodycamRequest["status"]) => request<IaBodycamRequest>(`/bodycam/requests/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  getBodycamChecks: () => request<IaBodycamCheck[]>("/bodycam/checks"),
  saveBodycamCheck: (date: string, memberIds: string[]) => request<IaBodycamCheck>("/bodycam/checks", { method: "POST", body: JSON.stringify({ date, memberIds }) }),
  getDashboard: () => request<IaDashboard>("/dashboard"),
  getAuditLogs: () => request<IaAuditLog[]>("/audit-logs"),
  undoAudit: (id: string) => request<{ message?: string }>(`/audit-logs/${id}/undo`, { method: "POST" }),
};

export function londonToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date());
}

export function formatUkDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: value.includes("T") ? "short" : undefined, timeZone: "Europe/London" }).format(date);
}
