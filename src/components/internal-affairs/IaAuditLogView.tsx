import { useState, useMemo } from "react";
import {
  History,
  Download,
  Filter,
  Search,
  Shield,
  Clock,
  User,
} from "lucide-react";
import { IaAuditEntry, IaOrganisation } from "@/lib/ia-types";
import { queue } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface IaAuditLogViewProps {
  auditLogs: IaAuditEntry[];
  organisations: IaOrganisation[];
  selectedOrgId: string;
  onOrgChange: (orgId: string) => void;
}

export function IaAuditLogView({
  auditLogs,
  organisations,
  selectedOrgId,
  onOrgChange,
}: IaAuditLogViewProps) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((entry) => {
      if (selectedOrgId !== "all" && entry.organisationId) {
        if (entry.organisationId.toLowerCase() !== selectedOrgId.toLowerCase()) return false;
      }

      const action = entry.actionType || (entry as any).action;
      if (actionFilter !== "all" && action !== actionFilter) {
        return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const target = entry.employeeName || (entry as any).targetName || "";
        const match =
          (entry.summary || "").toLowerCase().includes(q) ||
          (entry.actor || "").toLowerCase().includes(q) ||
          target.toLowerCase().includes(q) ||
          (entry.details && entry.details.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [auditLogs, selectedOrgId, actionFilter, search]);

  const handleExportCSV = () => {
    const headers = ["Timestamp", "Actor", "Action", "Summary", "Target Name", "Target ID", "Organisation", "Details"];
    const rows = filteredLogs.map((l) => [
      `"${new Date(l.timestamp).toISOString()}"`,
      `"${l.actor || ""}"`,
      `"${l.actionType || (l as any).action || ""}"`,
      `"${l.summary || ""}"`,
      `"${l.employeeName || (l as any).targetName || ""}"`,
      `"${l.employeeId || (l as any).targetInGameId || ""}"`,
      `"${l.organisationId || ""}"`,
      `"${l.details || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `IA_Audit_Trail_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    queue.add({ title: "Audit Log Exported", description: "CSV file downloaded successfully.", variant: "success" });
  };

  return (
    <div className="space-y-4">
      {/* Filters & Export Toolbar */}
      <div className="rounded-[10px] border border-[#e2e5ec] bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#f0f1f3]">
          <div>
            <h2 className="text-[16px] font-semibold text-[#000000]">
              IA Activity & Audit Logs
            </h2>
            <p className="text-[12px] text-[#8a90a0]">
              Immutable chronological record of all actions performed by Internal Affairs personnel.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="h-[36px] inline-flex items-center gap-1.5 rounded-[8px] bg-[#000000] px-3.5 text-[12px] font-medium text-white hover:bg-[#333] transition-colors shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Audit CSV</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 gap-2 pt-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8a90a0]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit records..."
              className="h-[34px] w-full rounded-[6px] border border-[#e2e5ec] bg-white pl-9 pr-3 text-[12px] text-[#000000] outline-none focus:border-[#000000]"
            />
          </div>

          <div>
            <select
              value={selectedOrgId}
              onChange={(e) => onOrgChange(e.target.value)}
              className="h-[34px] w-full rounded-[6px] border border-[#e2e5ec] bg-white px-2.5 text-[12px] font-medium text-[#000000] outline-none focus:border-[#000000]"
            >
              <option value="all">All Organisations</option>
              {organisations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.shortName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-[34px] w-full rounded-[6px] border border-[#e2e5ec] bg-white px-2.5 text-[12px] font-medium text-[#000000] outline-none focus:border-[#000000]"
            >
              <option value="all">All Action Types</option>
              <option value="log_checked">Log Checks</option>
              <option value="promoted">Promotions & Transfers</option>
              <option value="role_updated">Discord Role Changes</option>
              <option value="status_changed">Status Changes (Left Org)</option>
              <option value="created">Employee Registration</option>
              <option value="updated">Profile Updates</option>
              <option value="org_updated">Org Config Changes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Timeline / List */}
      <div className="rounded-[10px] border border-[#e2e5ec] bg-white overflow-hidden">
        <div className="divide-y divide-[#f0f1f3]">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-[#8a90a0]">
              No audit activities found matching your filters.
            </div>
          ) : (
            filteredLogs.map((entry) => (
              <div
                key={entry.id}
                className="p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between hover:bg-[#f7f8fb] transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-[#000000]">
                      {entry.summary}
                    </span>
                    {entry.organisationId && (
                      <span className="rounded-[4px] bg-[#f0f1f3] px-1.5 py-0.5 text-[10px] font-bold text-[#4d5568]">
                        {entry.organisationId.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {entry.details && (
                    <p className="text-[12px] text-[#4d5568]">{entry.details}</p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-[#8a90a0]">
                    <span>
                      Officer / Actor: <strong className="text-[#000000]">{entry.actor}</strong>
                    </span>
                    {entry.targetName && (
                      <>
                        <span>•</span>
                        <span>
                          Target: <strong className="text-[#000000]">{entry.targetName}</strong> (#{entry.targetInGameId})
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-[#8a90a0] font-mono shrink-0 sm:text-right">
                  <div>{new Date(entry.timestamp).toLocaleDateString()}</div>
                  <div>{new Date(entry.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#e2e5ec] bg-[#f7f8fb] px-4 py-3 text-[12px] text-[#8a90a0]">
          Showing <strong>{filteredLogs.length}</strong> of <strong>{auditLogs.length}</strong> recorded audit events
        </div>
      </div>
    </div>
  );
}
