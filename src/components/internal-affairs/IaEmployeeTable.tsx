import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Download,
  Plus,
  CheckCircle2,
  XCircle,
  ClockAlert,
  Award,
  Edit2,
  Check,
  X,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
import {
  IaEmployee,
  IaOrganisation,
  IaFilterState,
  IaUserRole,
} from "@/lib/ia-types";
import { iaDb } from "@/lib/ia-db";
import { queue } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface IaEmployeeTableProps {
  employees: IaEmployee[];
  organisations: IaOrganisation[];
  selectedOrgId: string;
  onOrgChange: (orgId: string) => void;
  currentRole: IaUserRole;
  filterState: IaFilterState;
  onFilterChange: (updates: Partial<IaFilterState>) => void;
  onSelectEmployee: (emp: IaEmployee) => void;
  onOpenNewEmployeeModal: () => void;
  onOpenMarkLogCheckModal: (emp: IaEmployee) => void;
  onOpenEditEmployeeModal: (emp: IaEmployee) => void;
  onOpenRankChangeModal: (emp: IaEmployee) => void;
}

export function IaEmployeeTable({
  employees,
  organisations,
  selectedOrgId,
  onOrgChange,
  currentRole,
  filterState,
  onFilterChange,
  onSelectEmployee,
  onOpenNewEmployeeModal,
  onOpenMarkLogCheckModal,
  onOpenEditEmployeeModal,
  onOpenRankChangeModal,
}: IaEmployeeTableProps) {
  const [sortField, setSortField] = useState<"name" | "id" | "rank" | "lastLogCheck" | "joinDate">("name");
  const [sortAsc, setSortAsc] = useState(true);

  const currentOrg = organisations.find((o) => o.id === selectedOrgId);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Org filter
      if (selectedOrgId !== "all") {
        if (emp.organisationId.toLowerCase() !== selectedOrgId.toLowerCase()) return false;
      }

      // Status filter
      if (filterState.status !== "all" && emp.status !== filterState.status) {
        return false;
      }

      // Department filter
      if (filterState.department !== "all" && emp.department !== filterState.department) {
        return false;
      }

      // Rank filter
      if (filterState.rank !== "all" && emp.currentRank !== filterState.rank) {
        return false;
      }

      // Discord Role status
      if (filterState.roleStatus === "has_role" && !emp.hasRequiredRole) return false;
      if (filterState.roleStatus === "missing_role" && emp.hasRequiredRole) return false;

      // Hiring status
      if (filterState.hiringStatus === "has_hiring" && !emp.hasHiringRecord) return false;
      if (filterState.hiringStatus === "missing_hiring" && emp.hasHiringRecord) return false;

      // Log Check status
      if (filterState.logCheckStatus !== "all") {
        const sevenDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 7;
        const lastCheckTime = emp.lastLogCheck?.timestamp
          ? new Date(emp.lastLogCheck.timestamp).getTime()
          : 0;

        if (filterState.logCheckStatus === "checked_recently") {
          if (!lastCheckTime || lastCheckTime < sevenDaysAgo) return false;
        } else if (filterState.logCheckStatus === "overdue") {
          if (lastCheckTime && lastCheckTime >= sevenDaysAgo) return false;
        } else if (filterState.logCheckStatus === "never_checked") {
          if (lastCheckTime > 0) return false;
        }
      }

      // Search Query
      if (filterState.searchQuery?.trim()) {
        const q = filterState.searchQuery.toLowerCase().trim();
        const match =
          emp.fullName.toLowerCase().includes(q) ||
          emp.inGameId.toLowerCase().includes(q) ||
          emp.discordId.toLowerCase().includes(q) ||
          emp.currentRank.toLowerCase().includes(q) ||
          emp.department.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [employees, selectedOrgId, filterState]);

  // Sort employees
  const sortedEmployees = useMemo(() => {
    return [...filteredEmployees].sort((a, b) => {
      let res = 0;
      if (sortField === "name") {
        res = a.fullName.localeCompare(b.fullName);
      } else if (sortField === "id") {
        res = a.inGameId.localeCompare(b.inGameId, undefined, { numeric: true });
      } else if (sortField === "rank") {
        res = a.currentRank.localeCompare(b.currentRank);
      } else if (sortField === "lastLogCheck") {
        const timeA = a.lastLogCheck?.timestamp ? new Date(a.lastLogCheck.timestamp).getTime() : 0;
        const timeB = b.lastLogCheck?.timestamp ? new Date(b.lastLogCheck.timestamp).getTime() : 0;
        res = timeA - timeB;
      } else if (sortField === "joinDate") {
        res = new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime();
      }
      return sortAsc ? res : -res;
    });
  }, [filteredEmployees, sortField, sortAsc]);

  const handleToggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleToggleRoleStatus = (e: React.MouseEvent, emp: IaEmployee) => {
    e.stopPropagation();
    if (currentRole === "viewer") {
      queue.add({ title: "Read Only", description: "Viewers cannot modify records.", variant: "warning" });
      return;
    }
    const nextStatus = !emp.hasRequiredRole;
    iaDb.updateRoleStatus(emp.id, nextStatus, "IA Officer");
    queue.add({
      title: "Discord Role Updated",
      description: `${emp.fullName} role status set to ${nextStatus ? "Assigned (✅)" : "Missing (❌)"}.`,
      variant: "success",
    });
  };

  const handleExportCSV = () => {
    const headers = ["Full Name", "In-Game ID", "Discord ID", "Organisation", "Current Rank", "Department", "Join Date", "Status", "Discord Role", "Hiring Record", "Last Log Check Date", "Checked By"];
    const rows = sortedEmployees.map((e) => [
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
      e.lastLogCheck?.timestamp ? new Date(e.lastLogCheck.timestamp).toISOString() : "Never",
      `"${e.lastLogCheck?.checkedBy || "N/A"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `IA_Employee_Roster_${selectedOrgId}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    queue.add({ title: "CSV Downloaded", description: "Filtered roster exported successfully.", variant: "success" });
  };

  const formatLastLogCheck = (emp: IaEmployee) => {
    if (!emp.lastLogCheck?.timestamp) {
      return (
        <span className="inline-flex items-center gap-1 rounded-[4px] bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
          Never Checked
        </span>
      );
    }
    const checkDate = new Date(emp.lastLogCheck.timestamp);
    const daysAgo = Math.floor((Date.now() - checkDate.getTime()) / (1000 * 60 * 60 * 24));
    const isOverdue = daysAgo > 7;

    return (
      <div className="flex flex-col">
        <span
          className={cn(
            "text-[12px] font-medium",
            isOverdue ? "text-purple-700 font-semibold" : "text-[#000000]"
          )}
        >
          {daysAgo === 0 ? "Today" : `${daysAgo}d ago`}
        </span>
        <span className="text-[10px] text-[#8a90a0]">
          by {emp.lastLogCheck.checkedBy}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions Toolbar */}
      <div className="rounded-[10px] border border-[#e2e5ec] bg-white p-4 space-y-3">
        {/* Row 1: Search & Primary Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a90a0]" />
            <input
              type="text"
              value={filterState.searchQuery || ""}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              placeholder="Filter by name, ID, rank, discord..."
              className="h-[38px] w-full rounded-[8px] border border-[#e2e5ec] bg-white pl-10 pr-4 text-[13px] text-[#000000] outline-none placeholder:text-[#9aa1b0] focus:border-[#000000]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="h-[38px] inline-flex items-center gap-1.5 rounded-[8px] border border-[#e2e5ec] bg-white px-3.5 text-[13px] font-medium text-[#000000] hover:bg-[#f7f8fb] transition-colors"
            >
              <Download className="h-4 w-4 text-[#8a90a0]" />
              <span>Export CSV</span>
            </button>

            {currentRole !== "viewer" && (
              <button
                type="button"
                onClick={onOpenNewEmployeeModal}
                className="h-[38px] inline-flex items-center gap-1.5 rounded-[8px] bg-[#000000] px-4 text-[13px] font-medium text-white hover:bg-[#333] transition-colors shadow-xs"
              >
                <Plus className="h-4 w-4" />
                <span>Add Employee</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Secondary Dropdown Filters */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 pt-2 border-t border-[#f0f1f3]">
          {/* Org Filter */}
          <div>
            <select
              value={selectedOrgId}
              onChange={(e) => onOrgChange(e.target.value)}
              className="h-[34px] w-full rounded-[6px] border border-[#e2e5ec] bg-white px-2.5 text-[12px] font-medium text-[#000000] outline-none hover:bg-[#f7f8fb] focus:border-[#000000]"
            >
              <option value="all">All Organisations</option>
              {organisations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.shortName}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={filterState.department || "all"}
              onChange={(e) => onFilterChange({ department: e.target.value })}
              className="h-[34px] w-full rounded-[6px] border border-[#e2e5ec] bg-white px-2.5 text-[12px] font-medium text-[#000000] outline-none hover:bg-[#f7f8fb] focus:border-[#000000]"
            >
              <option value="all">All Departments</option>
              {(currentOrg?.departments || []).map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Rank Filter */}
          <div>
            <select
              value={filterState.rank || "all"}
              onChange={(e) => onFilterChange({ rank: e.target.value })}
              className="h-[34px] w-full rounded-[6px] border border-[#e2e5ec] bg-white px-2.5 text-[12px] font-medium text-[#000000] outline-none hover:bg-[#f7f8fb] focus:border-[#000000]"
            >
              <option value="all">All Ranks</option>
              {(currentOrg?.ranks || []).map((rank) => (
                <option key={rank} value={rank}>
                  {rank}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterState.status || "all"}
              onChange={(e) => onFilterChange({ status: e.target.value as any })}
              className="h-[34px] w-full rounded-[6px] border border-[#e2e5ec] bg-white px-2.5 text-[12px] font-medium text-[#000000] outline-none hover:bg-[#f7f8fb] focus:border-[#000000]"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active Duty</option>
              <option value="Left Organisation">Left Organisation</option>
            </select>
          </div>

          {/* Discord Role Status */}
          <div>
            <select
              value={filterState.roleStatus || "all"}
              onChange={(e) => onFilterChange({ roleStatus: e.target.value as any })}
              className="h-[34px] w-full rounded-[6px] border border-[#e2e5ec] bg-white px-2.5 text-[12px] font-medium text-[#000000] outline-none hover:bg-[#f7f8fb] focus:border-[#000000]"
            >
              <option value="all">All Discord Roles</option>
              <option value="has_role">✅ Role Assigned</option>
              <option value="missing_role">❌ Role Missing</option>
            </select>
          </div>

          {/* Log Check Status */}
          <div>
            <select
              value={filterState.logCheckStatus || "all"}
              onChange={(e) => onFilterChange({ logCheckStatus: e.target.value as any })}
              className="h-[34px] w-full rounded-[6px] border border-[#e2e5ec] bg-white px-2.5 text-[12px] font-medium text-[#000000] outline-none hover:bg-[#f7f8fb] focus:border-[#000000]"
            >
              <option value="all">All Log Checks</option>
              <option value="checked_recently">Checked (&le;7d)</option>
              <option value="overdue">Overdue (&gt;7d)</option>
              <option value="never_checked">Never Checked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Employee Table */}
      <div className="overflow-hidden rounded-[10px] border border-[#e2e5ec] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#e2e5ec] bg-[#f7f8fb] font-semibold text-[#8a90a0]">
                <th
                  onClick={() => handleToggleSort("name")}
                  className="cursor-pointer px-4 py-3 hover:text-[#000000] select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Officer Name</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort("id")}
                  className="cursor-pointer px-4 py-3 hover:text-[#000000] select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>In-Game ID</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-4 py-3">Discord Tag</th>
                <th
                  onClick={() => handleToggleSort("rank")}
                  className="cursor-pointer px-4 py-3 hover:text-[#000000] select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Rank</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3 text-center">Discord Role</th>
                <th className="px-4 py-3 text-center">Hiring Record</th>
                <th
                  onClick={() => handleToggleSort("lastLogCheck")}
                  className="cursor-pointer px-4 py-3 hover:text-[#000000] select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Last Log Check</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f1f3]">
              {sortedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#8a90a0]">
                    No personnel records found matching your filters.
                  </td>
                </tr>
              ) : (
                sortedEmployees.map((emp) => {
                  const isSeparated = emp.status === "Left Organisation";
                  return (
                    <tr
                      key={emp.id}
                      onClick={() => onSelectEmployee(emp)}
                      className={cn(
                        "group cursor-pointer transition-colors hover:bg-[#f7f8fb]",
                        isSeparated && "opacity-60 bg-[#fafbfc]"
                      )}
                    >
                      {/* Name */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-[#000000] group-hover:underline">
                          {emp.fullName}
                        </div>
                        <div className="text-[11px] text-[#8a90a0]">
                          {emp.organisationId.toUpperCase()}
                        </div>
                      </td>

                      {/* ID */}
                      <td className="px-4 py-3.5 font-mono font-medium text-[#000000]">
                        #{emp.inGameId}
                      </td>

                      {/* Discord */}
                      <td className="px-4 py-3.5 font-mono text-[12px] text-[#4d5568]">
                        @{emp.discordId}
                      </td>

                      {/* Rank */}
                      <td className="px-4 py-3.5">
                        <span className="rounded-[4px] bg-[#f0f1f3] px-2 py-0.5 text-[11px] font-medium text-[#000000]">
                          {emp.currentRank}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3.5 text-[#4d5568]">
                        {emp.department}
                      </td>

                      {/* Discord Role Status (Clickable) */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={(e) => handleToggleRoleStatus(e, emp)}
                          title="Click to toggle Discord role status"
                          className={cn(
                            "inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[11px] font-semibold transition-all hover:scale-105",
                            emp.hasRequiredRole
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                          )}
                        >
                          {emp.hasRequiredRole ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>Role ✅</span>
                            </>
                          ) : (
                            <>
                              <X className="h-3 w-3" />
                              <span>Missing ❌</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Hiring Record Status */}
                      <td className="px-4 py-3.5 text-center">
                        {emp.hasHiringRecord ? (
                          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Logged</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-[4px] bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                            Missing ❌
                          </span>
                        )}
                      </td>

                      {/* Last Log Check */}
                      <td className="px-4 py-3.5">
                        {formatLastLogCheck(emp)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "rounded-[4px] px-2 py-0.5 text-[11px] font-semibold",
                            emp.status === "Active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-[#f0f1f3] text-[#8a90a0]"
                          )}
                        >
                          {emp.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {currentRole !== "viewer" && (
                            <>
                              <button
                                type="button"
                                onClick={() => onOpenMarkLogCheckModal(emp)}
                                title="Mark Logs Checked"
                                className="rounded-[6px] border border-[#e2e5ec] bg-white p-1.5 text-[#4d5568] hover:bg-[#f7f8fb] hover:text-[#000000] transition-colors"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => onOpenRankChangeModal(emp)}
                                title="Promote / Change Rank"
                                className="rounded-[6px] border border-[#e2e5ec] bg-white p-1.5 text-[#4d5568] hover:bg-[#f7f8fb] hover:text-[#000000] transition-colors"
                              >
                                <Award className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => onOpenEditEmployeeModal(emp)}
                                title="Edit Profile"
                                className="rounded-[6px] border border-[#e2e5ec] bg-white p-1.5 text-[#4d5568] hover:bg-[#f7f8fb] hover:text-[#000000] transition-colors"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-[#e2e5ec] bg-[#f7f8fb] px-4 py-3 text-[12px] text-[#8a90a0]">
          <span>
            Showing <strong>{sortedEmployees.length}</strong> of <strong>{employees.length}</strong> total records
          </span>
          <span>Click any officer row to inspect complete IA profile & logs</span>
        </div>
      </div>
    </div>
  );
}
