import { useState } from "react";
import {
  User,
  Shield,
  FileText,
  Clock,
  Award,
  History,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Edit2,
  AlertCircle,
  Check,
  X,
  UserX,
  UserCheck,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { IaEmployee, IaOrganisation, IaUserRole } from "@/lib/ia-types";
import { iaDb } from "@/lib/ia-db";
import { queue } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface IaEmployeeProfileModalProps {
  employee: IaEmployee | null;
  organisations: IaOrganisation[];
  currentRole: IaUserRole;
  onClose: () => void;
  onOpenMarkLogCheckModal: (emp: IaEmployee) => void;
  onOpenRankChangeModal: (emp: IaEmployee) => void;
  onOpenEditEmployeeModal: (emp: IaEmployee) => void;
}

type TabType = "overview" | "hiring" | "logs" | "ranks" | "audit";

export function IaEmployeeProfileModal({
  employee,
  organisations,
  currentRole,
  onClose,
  onOpenMarkLogCheckModal,
  onOpenRankChangeModal,
  onOpenEditEmployeeModal,
}: IaEmployeeProfileModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  if (!employee) return null;

  const org = organisations.find((o) => o.id === employee.organisationId);

  const handleToggleRoleStatus = () => {
    if (currentRole === "viewer") {
      queue.add({ title: "Read Only", description: "Viewers cannot modify records.", variant: "warning" });
      return;
    }
    const nextStatus = !employee.hasRequiredRole;
    iaDb.updateRoleStatus(employee.id, nextStatus, "IA Officer");
    queue.add({
      title: "Discord Role Updated",
      description: `${employee.fullName} role status set to ${nextStatus ? "Assigned (✅)" : "Missing (❌)"}.`,
      variant: "success",
    });
  };

  const handleToggleActiveStatus = () => {
    if (currentRole === "viewer") {
      queue.add({ title: "Read Only", description: "Viewers cannot modify records.", variant: "warning" });
      return;
    }
    const nextStatus = employee.status === "Active" ? "Left Organisation" : "Active";
    iaDb.changeEmployeeStatus(
      employee.id,
      nextStatus,
      "IA Officer",
      nextStatus === "Left Organisation" ? "Officer separated from force" : "Officer reinstated to active duty"
    );
    queue.add({
      title: "Status Changed",
      description: `${employee.fullName} marked as ${nextStatus}.`,
      variant: "success",
    });
  };

  return (
    <Dialog open={Boolean(employee)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-[#e7e9f0] bg-[#f7f8fb] p-6 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pr-8">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#000000] text-white shrink-0 font-bold text-[18px]">
                {employee.fullName.charAt(0)}
              </div>
              <div>
                <DialogTitle className="text-[20px] font-bold text-[#000000]">
                  {employee.fullName}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-[12px] text-[#8a90a0]">
                  <span className="font-mono font-bold text-[#000000]">
                    ID: #{employee.inGameId}
                  </span>
                  <span>•</span>
                  <span>@{employee.discordId}</span>
                  <span>•</span>
                  <span className="font-medium text-[#000000]">
                    {org?.shortName || employee.organisationId.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-[6px] bg-white border border-[#e2e5ec] px-2.5 py-1 text-[12px] font-semibold text-[#000000]">
                {employee.currentRank}
              </span>
              <span
                className={cn(
                  "rounded-[6px] px-2.5 py-1 text-[12px] font-semibold",
                  employee.status === "Active"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-[#f0f1f3] text-[#8a90a0]"
                )}
              >
                {employee.status}
              </span>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          {currentRole !== "viewer" && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-[#e2e5ec]">
              <button
                type="button"
                onClick={() => onOpenMarkLogCheckModal(employee)}
                className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#000000] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#333] transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Mark Logs Checked</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenRankChangeModal(employee)}
                className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#e2e5ec] bg-white px-3 py-1.5 text-[12px] font-medium text-[#000000] hover:bg-[#f7f8fb] transition-colors"
              >
                <Award className="h-3.5 w-3.5 text-[#8a90a0]" />
                <span>Promote / Rank</span>
              </button>

              <button
                type="button"
                onClick={handleToggleRoleStatus}
                className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#e2e5ec] bg-white px-3 py-1.5 text-[12px] font-medium text-[#000000] hover:bg-[#f7f8fb] transition-colors"
              >
                {employee.hasRequiredRole ? (
                  <>
                    <X className="h-3.5 w-3.5 text-rose-500" />
                    <span>Unset Discord Role</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Set Discord Role ✅</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onOpenEditEmployeeModal(employee)}
                className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#e2e5ec] bg-white px-3 py-1.5 text-[12px] font-medium text-[#000000] hover:bg-[#f7f8fb] transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5 text-[#8a90a0]" />
                <span>Edit Info</span>
              </button>

              <button
                type="button"
                onClick={handleToggleActiveStatus}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-[6px] border px-3 py-1.5 text-[12px] font-medium transition-colors",
                  employee.status === "Active"
                    ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                )}
              >
                {employee.status === "Active" ? (
                  <>
                    <UserX className="h-3.5 w-3.5" />
                    <span>Mark Left Org</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Reinstate Active</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Tab Selection */}
          <div className="flex gap-1 mt-4">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={cn(
                "rounded-[6px] px-3 py-1 text-[12px] font-medium transition-colors",
                activeTab === "overview"
                  ? "bg-[#000000] text-white"
                  : "text-[#8a90a0] hover:text-[#000000]"
              )}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("hiring")}
              className={cn(
                "rounded-[6px] px-3 py-1 text-[12px] font-medium transition-colors",
                activeTab === "hiring"
                  ? "bg-[#000000] text-white"
                  : "text-[#8a90a0] hover:text-[#000000]"
              )}
            >
              Hiring Paperwork
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("logs")}
              className={cn(
                "rounded-[6px] px-3 py-1 text-[12px] font-medium transition-colors",
                activeTab === "logs"
                  ? "bg-[#000000] text-white"
                  : "text-[#8a90a0] hover:text-[#000000]"
              )}
            >
              Log Checks ({employee.logChecks.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ranks")}
              className={cn(
                "rounded-[6px] px-3 py-1 text-[12px] font-medium transition-colors",
                activeTab === "ranks"
                  ? "bg-[#000000] text-white"
                  : "text-[#8a90a0] hover:text-[#000000]"
              )}
            >
              Rank Progression ({employee.rankHistory.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("audit")}
              className={cn(
                "rounded-[6px] px-3 py-1 text-[12px] font-medium transition-colors",
                activeTab === "audit"
                  ? "bg-[#000000] text-white"
                  : "text-[#8a90a0] hover:text-[#000000]"
              )}
            >
              Audit Logs ({employee.history.length})
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Telemetry Summary */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-[8px] border border-[#e2e5ec] bg-[#f7f8fb] p-3">
                  <span className="text-[11px] font-medium uppercase text-[#8a90a0]">
                    Organisation
                  </span>
                  <div className="mt-1 text-[14px] font-bold text-[#000000]">
                    {org?.name || employee.organisationId.toUpperCase()}
                  </div>
                </div>

                <div className="rounded-[8px] border border-[#e2e5ec] bg-[#f7f8fb] p-3">
                  <span className="text-[11px] font-medium uppercase text-[#8a90a0]">
                    Department
                  </span>
                  <div className="mt-1 text-[14px] font-bold text-[#000000]">
                    {employee.department}
                  </div>
                </div>

                <div className="rounded-[8px] border border-[#e2e5ec] bg-[#f7f8fb] p-3">
                  <span className="text-[11px] font-medium uppercase text-[#8a90a0]">
                    Discord Role
                  </span>
                  <div className="mt-1 text-[13px] font-bold">
                    {employee.hasRequiredRole ? (
                      <span className="text-emerald-700">Assigned ✅</span>
                    ) : (
                      <span className="text-rose-700">Missing ❌</span>
                    )}
                  </div>
                </div>

                <div className="rounded-[8px] border border-[#e2e5ec] bg-[#f7f8fb] p-3">
                  <span className="text-[11px] font-medium uppercase text-[#8a90a0]">
                    Hiring Record
                  </span>
                  <div className="mt-1 text-[13px] font-bold">
                    {employee.hasHiringRecord ? (
                      <span className="text-emerald-700">Logged ✅</span>
                    ) : (
                      <span className="text-amber-700">Missing ❌</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Identity & Dates */}
              <div className="rounded-[10px] border border-[#e2e5ec] bg-white p-4 space-y-3">
                <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[#8a90a0]">
                  Personnel Identity & Service Dates
                </h3>
                <div className="grid grid-cols-2 gap-3 text-[13px]">
                  <div>
                    <span className="text-[#8a90a0]">Full Legal Name:</span>
                    <div className="font-semibold text-[#000000]">{employee.fullName}</div>
                  </div>
                  <div>
                    <span className="text-[#8a90a0]">In-Game Citizen ID:</span>
                    <div className="font-mono font-semibold text-[#000000]">#{employee.inGameId}</div>
                  </div>
                  <div>
                    <span className="text-[#8a90a0]">Discord Tag:</span>
                    <div className="font-mono font-semibold text-[#000000]">@{employee.discordId}</div>
                  </div>
                  <div>
                    <span className="text-[#8a90a0]">Join Date:</span>
                    <div className="font-semibold text-[#000000]">{employee.joinDate}</div>
                  </div>
                  {employee.leftDate && (
                    <div>
                      <span className="text-[#8a90a0]">Separation Date:</span>
                      <div className="font-semibold text-rose-700">{employee.leftDate}</div>
                    </div>
                  )}
                  {employee.leftReason && (
                    <div className="col-span-2">
                      <span className="text-[#8a90a0]">Separation Reason:</span>
                      <div className="text-[#4d5568] italic">{employee.leftReason}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Last Log Check Overview */}
              <div className="rounded-[10px] border border-[#e2e5ec] bg-white p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[#8a90a0]">
                    Most Recent Log Check
                  </h3>
                  {employee.lastLogCheck && (
                    <span className="text-[12px] text-[#8a90a0]">
                      {new Date(employee.lastLogCheck.timestamp).toLocaleString()}
                    </span>
                  )}
                </div>

                {employee.lastLogCheck ? (
                  <div className="rounded-[8px] bg-[#f7f8fb] p-3 text-[13px] space-y-1">
                    <div className="font-semibold text-[#000000]">
                      Verified by: {employee.lastLogCheck.checkedBy}
                    </div>
                    {employee.lastLogCheck.note && (
                      <p className="text-[#4d5568] italic">"{employee.lastLogCheck.note}"</p>
                    )}
                  </div>
                ) : (
                  <div className="py-4 text-center text-[13px] text-purple-700">
                    No log checks recorded yet for this officer.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. HIRING PAPERWORK */}
          {activeTab === "hiring" && (
            <div className="space-y-4">
              {employee.hasHiringRecord && employee.hiringRecord ? (
                <div className="rounded-[10px] border border-[#e2e5ec] bg-white p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#f0f1f3]">
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold text-[14px]">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Verified Hiring Record</span>
                    </div>
                    <span className="text-[12px] text-[#8a90a0]">
                      Hired on {employee.hiringRecord.hiringDate}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[13px]">
                    <div>
                      <span className="text-[#8a90a0]">Recruiter / Authorizer:</span>
                      <div className="font-semibold text-[#000000]">
                        {employee.hiringRecord.recruiter || "N/A"}
                      </div>
                    </div>
                    <div>
                      <span className="text-[#8a90a0]">Initial Rank at Hire:</span>
                      <div className="font-semibold text-[#000000]">
                        {employee.hiringRecord.initialRank || "Cadet (1)"}
                      </div>
                    </div>
                    {employee.hiringRecord.referenceLink && (
                      <div className="col-span-2">
                        <span className="text-[#8a90a0]">Discord Reference / Paperwork:</span>
                        <div className="mt-0.5">
                          <a
                            href={employee.hiringRecord.referenceLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline font-mono text-[12px]"
                          >
                            <span>{employee.hiringRecord.referenceLink}</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    )}
                    {employee.hiringRecord.note && (
                      <div className="col-span-2">
                        <span className="text-[#8a90a0]">Hiring Notes:</span>
                        <div className="mt-0.5 text-[#4d5568] bg-[#f7f8fb] p-2.5 rounded-[6px]">
                          {employee.hiringRecord.note}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-[10px] border border-amber-200 bg-amber-50/50 p-6 text-center space-y-3">
                  <AlertCircle className="h-8 w-8 text-amber-600 mx-auto" />
                  <div>
                    <h4 className="text-[14px] font-semibold text-amber-900">
                      Missing Hiring Record
                    </h4>
                    <p className="text-[12px] text-amber-800/80 mt-1 max-w-md mx-auto">
                      This employee does not have documented hiring paperwork in the IA system.
                    </p>
                  </div>
                  {currentRole !== "viewer" && (
                    <button
                      type="button"
                      onClick={() => onOpenEditEmployeeModal(employee)}
                      className="rounded-[6px] bg-amber-600 px-4 py-2 text-[12px] font-medium text-white hover:bg-amber-700 transition-colors"
                    >
                      Add Hiring Paperwork Now
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. LOG CHECK HISTORY */}
          {activeTab === "logs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-[#000000]">
                  Log Inspection History
                </h3>
                {currentRole !== "viewer" && (
                  <button
                    type="button"
                    onClick={() => onOpenMarkLogCheckModal(employee)}
                    className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#000000] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#333] transition-colors"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>+ Log New Check</span>
                  </button>
                )}
              </div>

              <div className="divide-y divide-[#f0f1f3] rounded-[10px] border border-[#e2e5ec] bg-white">
                {employee.logChecks.length === 0 ? (
                  <div className="py-8 text-center text-[13px] text-[#8a90a0]">
                    No log inspections on record.
                  </div>
                ) : (
                  employee.logChecks.map((log) => (
                    <div key={log.id} className="p-4 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span className="text-[13px] font-semibold text-[#000000]">
                            Verified by {log.checkedBy}
                          </span>
                        </div>
                        {log.note && (
                          <p className="text-[12px] text-[#4d5568] pl-6 italic">
                            "{log.note}"
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] text-[#8a90a0] shrink-0 font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 4. RANK HISTORY */}
          {activeTab === "ranks" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-[#000000]">
                  Rank & Promotion Career Progression
                </h3>
                {currentRole !== "viewer" && (
                  <button
                    type="button"
                    onClick={() => onOpenRankChangeModal(employee)}
                    className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#e2e5ec] bg-white px-3 py-1.5 text-[12px] font-medium text-[#000000] hover:bg-[#f7f8fb] transition-colors"
                  >
                    <Award className="h-3.5 w-3.5" />
                    <span>Promote / Demote</span>
                  </button>
                )}
              </div>

              <div className="divide-y divide-[#f0f1f3] rounded-[10px] border border-[#e2e5ec] bg-white">
                {employee.rankHistory.length === 0 ? (
                  <div className="py-8 text-center text-[13px] text-[#8a90a0]">
                    No rank changes recorded.
                  </div>
                ) : (
                  employee.rankHistory.map((entry) => (
                    <div key={entry.id} className="p-4 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-amber-600" />
                          <span className="text-[13px] font-semibold text-[#000000]">
                            {entry.oldRank ? `${entry.oldRank} → ${entry.newRank}` : entry.newRank}
                          </span>
                        </div>
                        {entry.department && (
                          <div className="text-[11px] text-[#8a90a0] pl-6">
                            Department: {entry.department}
                          </div>
                        )}
                        {entry.note && (
                          <p className="text-[12px] text-[#4d5568] pl-6 italic">
                            "{entry.note}"
                          </p>
                        )}
                        <div className="text-[11px] text-[#8a90a0] pl-6">
                          Authorized by: <span className="font-medium text-[#000000]">{entry.changedBy}</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-[#8a90a0] shrink-0 font-mono">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 5. AUDIT LOGS */}
          {activeTab === "audit" && (
            <div className="space-y-4">
              <h3 className="text-[14px] font-semibold text-[#000000]">
                File Modification History
              </h3>

              <div className="divide-y divide-[#f0f1f3] rounded-[10px] border border-[#e2e5ec] bg-white">
                {employee.history.length === 0 ? (
                  <div className="py-8 text-center text-[13px] text-[#8a90a0]">
                    No history entries on file.
                  </div>
                ) : (
                  employee.history.map((entry) => (
                    <div key={entry.id} className="p-3.5 flex items-start justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="text-[13px] font-semibold text-[#000000]">
                          {entry.summary}
                        </div>
                        {entry.note && (
                          <p className="text-[12px] text-[#4d5568]">{entry.note}</p>
                        )}
                        <div className="text-[11px] text-[#8a90a0]">
                          Actor: <span className="font-medium text-[#000000]">{entry.changedBy}</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-[#8a90a0] shrink-0 font-mono">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
