import { useState, useMemo } from "react";
import {
  FileText,
  Download,
  Printer,
  Users,
  ShieldAlert,
  FileQuestion,
  ClockAlert,
  Award,
  Layers,
  UserX,
  CheckCircle2,
} from "lucide-react";
import { IaEmployee, IaOrganisation, IaReportType } from "@/lib/ia-types";
import { queue } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface IaReportsViewProps {
  employees: IaEmployee[];
  organisations: IaOrganisation[];
  selectedOrgId: string;
  onOrgChange: (orgId: string) => void;
  onSelectEmployee: (emp: IaEmployee) => void;
  defaultReportType?: IaReportType;
}

interface ReportDefinition {
  id: IaReportType;
  title: string;
  description: string;
  icon: any;
}

const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: "roster",
    title: "Active Duty Roster",
    description: "Complete list of all active sworn personnel and assigned divisions.",
    icon: Users,
  },
  {
    id: "missing_roles",
    title: "Missing Discord Roles",
    description: "Officers active on the roster without verified Discord organization permissions.",
    icon: ShieldAlert,
  },
  {
    id: "missing_hiring",
    title: "Missing Hiring Records",
    description: "Personnel lacking documented recruitment paperwork and verification records.",
    icon: FileQuestion,
  },
  {
    id: "log_checks",
    title: "Log Check Compliance",
    description: "Audit status of employee log checks, highlighting overdue records (>7 days).",
    icon: ClockAlert,
  },
  {
    id: "rank_distribution",
    title: "Rank Distribution",
    description: "Breakdown of personnel numbers and proportions across each rank.",
    icon: Award,
  },
  {
    id: "department_distribution",
    title: "Department Breakdown",
    description: "Organizational staffing levels by division and operational unit.",
    icon: Layers,
  },
  {
    id: "former_employees",
    title: "Former Personnel Archive",
    description: "Historical register of all separated employees, exit dates, and reasons.",
    icon: UserX,
  },
];

export function IaReportsView({
  employees,
  organisations,
  selectedOrgId,
  onOrgChange,
  onSelectEmployee,
  defaultReportType = "roster",
}: IaReportsViewProps) {
  const [selectedReport, setSelectedReport] = useState<IaReportType>(defaultReportType);

  const currentOrg = organisations.find((o) => o.id === selectedOrgId);

  // Filter employees for the selected org
  const orgEmployees = useMemo(() => {
    if (selectedOrgId === "all") return employees;
    return employees.filter(
      (e) => e.organisationId.toLowerCase() === selectedOrgId.toLowerCase()
    );
  }, [employees, selectedOrgId]);

  // Report Specific Data
  const reportData = useMemo(() => {
    switch (selectedReport) {
      case "roster":
        return orgEmployees.filter((e) => e.status === "Active");
      case "missing_roles":
        return orgEmployees.filter((e) => e.status === "Active" && !e.hasRequiredRole);
      case "missing_hiring":
        return orgEmployees.filter((e) => e.status === "Active" && !e.hasHiringRecord);
      case "log_checks":
        return orgEmployees.filter((e) => e.status === "Active");
      case "former_employees":
        return orgEmployees.filter((e) => e.status === "Left Organisation");
      case "rank_distribution": {
        const counts: Record<string, number> = {};
        const active = orgEmployees.filter((e) => e.status === "Active");
        active.forEach((e) => {
          counts[e.currentRank] = (counts[e.currentRank] || 0) + 1;
        });
        return Object.entries(counts).map(([rank, count]) => ({
          rank,
          count,
          percentage: active.length > 0 ? Math.round((count / active.length) * 100) : 0,
        }));
      }
      case "department_distribution": {
        const counts: Record<string, number> = {};
        const active = orgEmployees.filter((e) => e.status === "Active");
        active.forEach((e) => {
          counts[e.department] = (counts[e.department] || 0) + 1;
        });
        return Object.entries(counts).map(([dept, count]) => ({
          dept,
          count,
          percentage: active.length > 0 ? Math.round((count / active.length) * 100) : 0,
        }));
      }
      default:
        return [];
    }
  }, [orgEmployees, selectedReport]);

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (selectedReport === "rank_distribution") {
      headers = ["Rank", "Count", "Percentage"];
      rows = (reportData as any[]).map((r) => [`"${r.rank}"`, `${r.count}`, `${r.percentage}%`]);
    } else if (selectedReport === "department_distribution") {
      headers = ["Department", "Count", "Percentage"];
      rows = (reportData as any[]).map((r) => [`"${r.dept}"`, `${r.count}`, `${r.percentage}%`]);
    } else {
      headers = ["Full Name", "In-Game ID", "Discord", "Org", "Rank", "Department", "Join Date", "Status", "Has Role", "Has Hiring"];
      rows = (reportData as IaEmployee[]).map((e) => [
        `"${e.fullName}"`,
        `"${e.inGameId}"`,
        `"${e.discordId}"`,
        `"${e.organisationId.toUpperCase()}"`,
        `"${e.currentRank}"`,
        `"${e.department}"`,
        `"${e.joinDate}"`,
        `"${e.status}"`,
        e.hasRequiredRole ? "Yes" : "No",
        e.hasHiringRecord ? "Yes" : "No",
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `IA_Report_${selectedReport}_${selectedOrgId}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    queue.add({ title: "Report Exported", description: "CSV report downloaded successfully.", variant: "success" });
  };

  const handlePrint = () => {
    window.print();
  };

  const activeDef = REPORT_DEFINITIONS.find((r) => r.id === selectedReport)!;

  return (
    <div className="space-y-6">
      {/* Top Report Selection Pills */}
      <div className="rounded-[10px] border border-[#e2e5ec] bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#f0f1f3]">
          <div>
            <h2 className="text-[16px] font-semibold text-[#000000]">
              Compliance & Operational Reports
            </h2>
            <p className="text-[12px] text-[#8a90a0]">
              Select a specialized report to analyze organizational health and compliance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="h-[36px] inline-flex items-center gap-1.5 rounded-[8px] border border-[#e2e5ec] bg-white px-3 text-[12px] font-medium text-[#000000] hover:bg-[#f7f8fb] transition-colors"
            >
              <Printer className="h-3.5 w-3.5 text-[#8a90a0]" />
              <span>Print View</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="h-[36px] inline-flex items-center gap-1.5 rounded-[8px] bg-[#000000] px-3.5 text-[12px] font-medium text-white hover:bg-[#333] transition-colors shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Report Selector Pills */}
        <div className="flex flex-wrap gap-2 pt-3">
          {REPORT_DEFINITIONS.map((def) => {
            const Icon = def.icon;
            const isSelected = selectedReport === def.id;
            return (
              <button
                key={def.id}
                type="button"
                onClick={() => setSelectedReport(def.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-[8px] px-3.5 py-2 text-[12px] font-medium transition-all",
                  isSelected
                    ? "bg-[#000000] text-white shadow-xs"
                    : "border border-[#e2e5ec] bg-white text-[#000000] hover:bg-[#f7f8fb]"
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", isSelected ? "text-white" : "text-[#8a90a0]")} />
                <span>{def.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Report Content Card */}
      <div className="rounded-[10px] border border-[#e2e5ec] bg-white p-6 space-y-4">
        {/* Report Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#f0f1f3]">
          <div>
            <h3 className="text-[18px] font-bold text-[#000000]">
              {activeDef.title} — {selectedOrgId === "all" ? "All Organisations" : currentOrg?.name}
            </h3>
            <p className="text-[13px] text-[#8a90a0]">{activeDef.description}</p>
          </div>
          <div className="rounded-[6px] bg-[#f0f1f3] px-3 py-1 text-[12px] font-semibold text-[#4d5568]">
            {Array.isArray(reportData) ? `${reportData.length} records` : ""}
          </div>
        </div>

        {/* 1. RANK DISTRIBUTION */}
        {selectedReport === "rank_distribution" && (
          <div className="space-y-4">
            <div className="divide-y divide-[#f0f1f3] rounded-[8px] border border-[#e2e5ec] overflow-hidden">
              {(reportData as any[]).map((r) => (
                <div key={r.rank} className="p-4 flex items-center justify-between gap-4 hover:bg-[#f7f8fb]">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1 text-[13px]">
                      <span className="font-semibold text-[#000000]">{r.rank}</span>
                      <span className="font-mono text-[#8a90a0]">{r.count} officers ({r.percentage}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#f0f1f3] overflow-hidden">
                      <div
                        className="h-full bg-[#000000] rounded-full transition-all duration-500"
                        style={{ width: `${r.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. DEPARTMENT DISTRIBUTION */}
        {selectedReport === "department_distribution" && (
          <div className="space-y-4">
            <div className="divide-y divide-[#f0f1f3] rounded-[8px] border border-[#e2e5ec] overflow-hidden">
              {(reportData as any[]).map((r) => (
                <div key={r.dept} className="p-4 flex items-center justify-between gap-4 hover:bg-[#f7f8fb]">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1 text-[13px]">
                      <span className="font-semibold text-[#000000]">{r.dept}</span>
                      <span className="font-mono text-[#8a90a0]">{r.count} officers ({r.percentage}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#f0f1f3] overflow-hidden">
                      <div
                        className="h-full bg-emerald-700 rounded-full transition-all duration-500"
                        style={{ width: `${r.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. STANDARD EMPLOYEE LIST REPORTS */}
        {selectedReport !== "rank_distribution" && selectedReport !== "department_distribution" && (
          <div className="overflow-x-auto rounded-[8px] border border-[#e2e5ec]">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#e2e5ec] bg-[#f7f8fb] font-semibold text-[#8a90a0]">
                  <th className="px-4 py-3">Officer Name</th>
                  <th className="px-4 py-3">In-Game ID</th>
                  <th className="px-4 py-3">Discord</th>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Join Date</th>
                  {selectedReport === "log_checks" && <th className="px-4 py-3">Last Checked</th>}
                  {selectedReport === "former_employees" && <th className="px-4 py-3">Reason</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f1f3]">
                {(reportData as IaEmployee[]).length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#8a90a0]">
                      No records found for this report criteria.
                    </td>
                  </tr>
                ) : (
                  (reportData as IaEmployee[]).map((emp) => (
                    <tr
                      key={emp.id}
                      onClick={() => onSelectEmployee(emp)}
                      className="cursor-pointer hover:bg-[#f7f8fb] transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-[#000000]">
                        {emp.fullName}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-[#000000]">
                        #{emp.inGameId}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#8a90a0]">
                        @{emp.discordId}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-[4px] bg-[#f0f1f3] px-2 py-0.5 text-[11px] font-medium text-[#000000]">
                          {emp.currentRank}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#4d5568]">
                        {emp.department}
                      </td>
                      <td className="px-4 py-3 text-[#8a90a0]">
                        {emp.joinDate}
                      </td>

                      {selectedReport === "log_checks" && (
                        <td className="px-4 py-3">
                          {emp.lastLogCheck ? (
                            <span className="text-[12px] text-[#000000]">
                              {new Date(emp.lastLogCheck.timestamp).toLocaleDateString()} ({emp.lastLogCheck.checkedBy})
                            </span>
                          ) : (
                            <span className="rounded-[4px] bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                              Never
                            </span>
                          )}
                        </td>
                      )}

                      {selectedReport === "former_employees" && (
                        <td className="px-4 py-3 text-[12px] text-[#8a90a0] italic">
                          {emp.leftReason || "Separated"}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
