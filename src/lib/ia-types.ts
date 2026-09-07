export type IaUserRole = "admin" | "ia_member" | "viewer";

export interface IaOrganisation {
  id: string;
  name: string;
  shortName: string;
  badge: string;
  departments: string[];
  ranks: string[];
  description?: string;
  themeColor?: string;
}

export type IaEmployeeStatus = "Active" | "Left Organisation";

export interface IaHiringRecord {
  hasRecord: boolean;
  hiringDate: string;
  recruiter: string;
  initialRank: string;
  referenceLink?: string;
  note?: string;
}

export interface IaLogCheckEntry {
  id: string;
  timestamp: string; // ISO String
  checkedBy: string;
  note?: string;
}

export interface IaRankHistoryEntry {
  id: string;
  oldRank: string;
  newRank: string;
  date: string;
  changedBy: string;
  note?: string;
}

export interface IaEmployeeHistoryEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
}

export interface IaEmployee {
  id: string;
  fullName: string;
  inGameId: string;
  discordId: string;
  organisationId: string;
  currentRank: string;
  department: string;
  joinDate: string;
  status: IaEmployeeStatus;
  leftDate?: string;
  leftReason?: string;
  hasRequiredRole: boolean;
  hasHiringRecord: boolean;
  hiringRecord?: IaHiringRecord;
  lastLogCheck?: {
    timestamp: string;
    checkedBy: string;
    note?: string;
  };
  logChecks: IaLogCheckEntry[];
  rankHistory: IaRankHistoryEntry[];
  history: IaEmployeeHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export type IaAuditActionType =
  | "LOG_CHECK"
  | "RANK_CHANGE"
  | "HIRING_RECORD_UPDATED"
  | "ROLE_STATUS_CHANGED"
  | "EMPLOYEE_CREATED"
  | "EMPLOYEE_UPDATED"
  | "STATUS_CHANGED"
  | "ORGANISATION_UPDATED"
  | "DATABASE_IMPORT"
  | "DATABASE_RESET";

export interface IaAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: IaUserRole;
  organisationId: string;
  employeeId?: string;
  employeeName?: string;
  actionType: IaAuditActionType;
  summary: string;
  details?: string;
}

export interface IaDashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  leftEmployees: number;
  missingRolesCount: number;
  missingHiringCount: number;
  overdueLogsCount: number;
  recentChanges: IaEmployeeHistoryEntry[];
  recentActivity: IaAuditEntry[];
}

export type IaReportType =
  | "roster"
  | "missing_roles"
  | "missing_hiring"
  | "log_checks"
  | "ranks"
  | "rank_distribution"
  | "departments"
  | "department_distribution"
  | "former_employees";

export interface IaFilterState {
  searchQuery: string;
  organisationId: string;
  rank: string;
  department: string;
  status: "all" | "Active" | "Left Organisation";
  roleStatus: "all" | "has_role" | "missing_role";
  hiringStatus: "all" | "has_hiring" | "missing_hiring";
  logCheckStatus: "all" | "checked_recently" | "overdue" | "never_checked";
}
