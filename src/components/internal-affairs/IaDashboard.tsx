import { IaDashboardStats, IaOrganisation } from "@/lib/ia-types";

interface IaDashboardProps {
  stats: IaDashboardStats;
  selectedOrgId: string;
  onOrgChange: (orgId: string) => void;
  organisations: IaOrganisation[];
  onNavigateToEmployeesWithFilter: (filters: {
    status?: "Active" | "Left Organisation";
    roleStatus?: "missing_role";
    hiringStatus?: "missing_hiring";
    logCheckStatus?: "overdue";
  }) => void;
  onNavigateToReports: (reportType: string) => void;
  onNavigateToAudit: () => void;
}

export function IaDashboard({}: IaDashboardProps) {
  return null;
}
