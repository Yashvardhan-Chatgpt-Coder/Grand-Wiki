import { useState, useEffect } from "react";
import { UserPlus, Save } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { IaEmployee, IaOrganisation, IaUserRole } from "@/lib/ia-types";
import { iaDb } from "@/lib/ia-db";
import { queue } from "@/components/ui/Toast";

interface IaAddEditEmployeeModalProps {
  employee: IaEmployee | null;
  organisations: IaOrganisation[];
  selectedOrgId: string;
  currentRole: IaUserRole;
  onClose: () => void;
  onSaved: (emp: IaEmployee) => void;
}

export function IaAddEditEmployeeModal({
  employee,
  organisations,
  selectedOrgId,
  currentRole,
  onClose,
  onSaved,
}: IaAddEditEmployeeModalProps) {
  const isEditing = Boolean(employee);
  const defaultOrgId = employee?.organisationId || (selectedOrgId !== "all" ? selectedOrgId : "lspd");

  const [fullName, setFullName] = useState(employee?.fullName || "");
  const [inGameId, setInGameId] = useState(employee?.inGameId || "");
  const [discordId, setDiscordId] = useState(employee?.discordId || "");
  const [organisationId, setOrganisationId] = useState(defaultOrgId);
  const [department, setDepartment] = useState(employee?.department || "");
  const [currentRank, setCurrentRank] = useState(employee?.currentRank || "");
  const [joinDate, setJoinDate] = useState(employee?.joinDate || new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState<"Active" | "Left Organisation">(employee?.status || "Active");
  const [hasRequiredRole, setHasRequiredRole] = useState(employee ? employee.hasRequiredRole : true);

  // Hiring record fields
  const [hasHiringRecord, setHasHiringRecord] = useState(employee ? employee.hasHiringRecord : true);
  const [recruiter, setRecruiter] = useState(employee?.hiringRecord?.recruiter || "");
  const [hiringDate, setHiringDate] = useState(employee?.hiringRecord?.hiringDate || joinDate);
  const [initialRank, setInitialRank] = useState(employee?.hiringRecord?.initialRank || "");
  const [referenceLink, setReferenceLink] = useState(employee?.hiringRecord?.referenceLink || "");
  const [hiringNote, setHiringNote] = useState(employee?.hiringRecord?.note || "");

  const currentOrg = organisations.find((o) => o.id === organisationId) || organisations[0];

  useEffect(() => {
    if (!department && currentOrg?.departments?.length) {
      setDepartment(currentOrg.departments[0]);
    }
    if (!currentRank && currentOrg?.ranks?.length) {
      setCurrentRank(currentOrg.ranks[0]);
    }
    if (!initialRank && currentOrg?.ranks?.length) {
      setInitialRank(currentOrg.ranks[0]);
    }
  }, [organisationId, currentOrg]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !inGameId.trim() || !discordId.trim()) {
      queue.add({
        title: "Validation Error",
        description: "Full Name, In-Game ID, and Discord ID are required.",
        variant: "error",
      });
      return;
    }

    const hiringRecord = {
      hasRecord: hasHiringRecord,
      hiringDate: hiringDate || joinDate,
      recruiter: recruiter.trim(),
      initialRank: initialRank || currentRank,
      referenceLink: referenceLink.trim() || undefined,
      note: hiringNote.trim() || undefined,
    };

    if (isEditing && employee) {
      const updated = iaDb.updateEmployee(
        employee.id,
        {
          fullName: fullName.trim(),
          inGameId: inGameId.trim(),
          discordId: discordId.trim().replace(/^@/, ""),
          organisationId,
          department: department || currentOrg?.departments?.[0] || "Patrol",
          currentRank: currentRank || currentOrg?.ranks?.[0] || "Cadet (1)",
          joinDate,
          status,
          hasRequiredRole,
          hasHiringRecord,
          hiringRecord,
        },
        "IA Officer",
        "Updated employee profile information."
      );
      if (updated) {
        queue.add({
          title: "Employee Updated",
          description: `Updated record for ${updated.fullName} (ID: ${updated.inGameId}).`,
          variant: "success",
        });
        onSaved(updated);
      }
    } else {
      const created = iaDb.createEmployee(
        {
          fullName: fullName.trim(),
          inGameId: inGameId.trim(),
          discordId: discordId.trim().replace(/^@/, ""),
          organisationId,
          department: department || currentOrg?.departments?.[0] || "Patrol",
          currentRank: currentRank || currentOrg?.ranks?.[0] || "Cadet (1)",
          joinDate,
          status,
          hasRequiredRole,
          hasHiringRecord,
          hiringRecord,
        },
        "IA Officer"
      );
      queue.add({
        title: "Employee Added",
        description: `Successfully registered ${created.fullName} in ${organisationId.toUpperCase()}.`,
        variant: "success",
      });
      onSaved(created);
    }
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-[#e7e9f0] bg-[#f7f8fb] px-6 py-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#000000]" />
            <DialogTitle className="text-[18px] font-bold text-[#000000]">
              {isEditing ? "Edit Personnel Profile" : "Add New Employee"}
            </DialogTitle>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Section 1: Basic Identity */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#8a90a0] mb-3">
              1. Basic Identity
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[12px] font-medium text-[#4d5568] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="h-[36px] w-full rounded-[8px] border border-[#e2e5ec] bg-white px-3 text-[13px] text-[#000000] outline-none placeholder:text-[#9aa1b0] focus:border-[#000000]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#4d5568] mb-1">
                  In-Game ID *
                </label>
                <input
                  type="text"
                  required
                  value={inGameId}
                  onChange={(e) => setInGameId(e.target.value)}
                  placeholder="e.g. 4521"
                  className="h-[36px] w-full rounded-[8px] border border-[#e2e5ec] bg-white px-3 font-mono text-[13px] text-[#000000] outline-none placeholder:text-[#9aa1b0] focus:border-[#000000]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#4d5568] mb-1">
                  Discord Username *
                </label>
                <input
                  type="text"
                  required
                  value={discordId}
                  onChange={(e) => setDiscordId(e.target.value)}
                  placeholder="e.g. johndoe"
                  className="h-[36px] w-full rounded-[8px] border border-[#e2e5ec] bg-white px-3 text-[13px] text-[#000000] outline-none placeholder:text-[#9aa1b0] focus:border-[#000000]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Organisation Assignment */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#8a90a0] mb-3">
              2. Organisation & Rank
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <label className="block text-[12px] font-medium text-[#4d5568] mb-1">
                  Organisation
                </label>
                <select
                  value={organisationId}
                  onChange={(e) => setOrganisationId(e.target.value)}
                  className="h-[36px] w-full rounded-[8px] border border-[#e2e5ec] bg-white px-2.5 text-[12px] font-medium text-[#000000] outline-none focus:border-[#000000]"
                >
                  {organisations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.shortName} - {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#4d5568] mb-1">
                  Department / Unit
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="h-[36px] w-full rounded-[8px] border border-[#e2e5ec] bg-white px-2.5 text-[12px] font-medium text-[#000000] outline-none focus:border-[#000000]"
                >
                  {(currentOrg?.departments || []).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#4d5568] mb-1">
                  Current Rank
                </label>
                <select
                  value={currentRank}
                  onChange={(e) => setCurrentRank(e.target.value)}
                  className="h-[36px] w-full rounded-[8px] border border-[#e2e5ec] bg-white px-2.5 text-[12px] font-medium text-[#000000] outline-none focus:border-[#000000]"
                >
                  {(currentOrg?.ranks || []).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#4d5568] mb-1">
                  Join Date
                </label>
                <input
                  type="date"
                  value={joinDate}
                  onChange={(e) => setJoinDate(e.target.value)}
                  className="h-[36px] w-full rounded-[8px] border border-[#e2e5ec] bg-white px-2.5 text-[12px] text-[#000000] outline-none focus:border-[#000000]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Status & Compliance */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#8a90a0] mb-3">
              3. Status & Compliance Flags
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-[8px] border border-[#e2e5ec] p-3">
                <div>
                  <div className="text-[13px] font-semibold text-[#000000]">
                    Required Discord Role
                  </div>
                  <div className="text-[11px] text-[#8a90a0]">
                    Employee holds official organization role on Discord.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={hasRequiredRole}
                  onChange={(e) => setHasRequiredRole(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-[#000000] focus:ring-[#000000]"
                />
              </div>

              <div className="flex items-center justify-between rounded-[8px] border border-[#e2e5ec] p-3">
                <div>
                  <div className="text-[13px] font-semibold text-[#000000]">
                    Employment Status
                  </div>
                  <div className="text-[11px] text-[#8a90a0]">
                    Active duty vs Left organisation.
                  </div>
                </div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="h-[32px] rounded-[6px] border border-[#e2e5ec] bg-white px-2 text-[12px] font-medium text-[#000000]"
                >
                  <option value="Active">Active Duty</option>
                  <option value="Left Organisation">Left Organisation</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Hiring Record Information */}
          <div className="rounded-[8px] border border-[#e2e5ec] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#8a90a0]">
                4. Hiring Paperwork
              </h3>
              <label className="flex items-center gap-2 text-[12px] font-medium text-[#000000] cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasHiringRecord}
                  onChange={(e) => setHasHiringRecord(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-[#000000] focus:ring-[#000000]"
                />
                <span>Hiring Record Exists</span>
              </label>
            </div>

            {hasHiringRecord ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[12px] font-medium text-[#4d5568] mb-1">
                    Recruiter Name / ID
                  </label>
                  <input
                    type="text"
                    value={recruiter}
                    onChange={(e) => setRecruiter(e.target.value)}
                    placeholder="e.g. Chief Marcus Vance"
                    className="h-[34px] w-full rounded-[6px] border border-[#e2e5ec] bg-white px-2.5 text-[12px] text-[#000000] outline-none focus:border-[#000000]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#4d5568] mb-1">
                    Initial Starting Rank
                  </label>
                  <select
                    value={initialRank}
                    onChange={(e) => setInitialRank(e.target.value)}
                    className="h-[34px] w-full rounded-[6px] border border-[#e2e5ec] bg-white px-2 text-[12px] font-medium text-[#000000] outline-none focus:border-[#000000]"
                  >
                    {(currentOrg?.ranks || []).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-medium text-[#4d5568] mb-1">
                    Discord / Reference Link
                  </label>
                  <input
                    type="url"
                    value={referenceLink}
                    onChange={(e) => setReferenceLink(e.target.value)}
                    placeholder="https://discord.com/channels/..."
                    className="h-[34px] w-full rounded-[6px] border border-[#e2e5ec] bg-white px-2.5 text-[12px] text-[#000000] outline-none focus:border-[#000000]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-medium text-[#4d5568] mb-1">
                    Hiring Notes
                  </label>
                  <input
                    type="text"
                    value={hiringNote}
                    onChange={(e) => setHiringNote(e.target.value)}
                    placeholder="e.g. Academy graduate, passed background investigation"
                    className="h-[34px] w-full rounded-[6px] border border-[#e2e5ec] bg-white px-2.5 text-[12px] text-[#000000] outline-none focus:border-[#000000]"
                  />
                </div>
              </div>
            ) : (
              <div className="py-2 text-center text-[12px] text-amber-700">
                This employee will be flagged as <strong>Missing Hiring Record (❌)</strong> until paperwork is logged.
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f0f1f3]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[8px] border border-[#e2e5ec] bg-white px-4 py-2 text-[13px] font-medium text-[#000000] hover:bg-[#f7f8fb] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#000000] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#333] transition-colors shadow-xs"
            >
              <Save className="h-4 w-4" />
              <span>{isEditing ? "Save Changes" : "Create Employee"}</span>
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
