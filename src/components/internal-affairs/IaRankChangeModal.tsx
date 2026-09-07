import { useState } from "react";
import { Award } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { IaEmployee, IaOrganisation } from "@/lib/ia-types";
import { iaDb } from "@/lib/ia-db";
import { queue } from "@/components/ui/Toast";

interface IaRankChangeModalProps {
  employee: IaEmployee;
  organisations: IaOrganisation[];
  onClose: () => void;
  onSuccess: () => void;
}

export function IaRankChangeModal({
  employee,
  organisations,
  onClose,
  onSuccess,
}: IaRankChangeModalProps) {
  const org = organisations.find((o) => o.id === employee.organisationId);
  const ranks = org?.ranks || [];
  const departments = org?.departments || [];

  const [newRank, setNewRank] = useState(employee.currentRank);
  const [department, setDepartment] = useState(employee.department);
  const [changedBy, setChangedBy] = useState("High Command");
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newRank) {
      queue.add({
        title: "Validation Error",
        description: "Please select a rank.",
        variant: "error",
      });
      return;
    }

    iaDb.promoteEmployee(
      employee.id,
      newRank,
      department || undefined,
      changedBy.trim() || "High Command",
      note.trim() || undefined
    );

    queue.add({
      title: "Rank Updated",
      description: `Promoted ${employee.fullName} to ${newRank}.`,
      variant: "success",
    });

    onSuccess();
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        {/* Header */}
        <div className="border-b border-[#e7e9f0] bg-[#f7f8fb] px-6 py-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-600" />
            <DialogTitle className="text-[17px] font-bold text-[#000000]">
              Promote / Change Rank
            </DialogTitle>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-[8px] bg-[#f7f8fb] p-3 text-[13px]">
            <div className="font-semibold text-[#000000]">{employee.fullName}</div>
            <div className="text-[11px] text-[#8a90a0]">
              Current: <strong className="text-[#000000]">{employee.currentRank}</strong> • Dept: {employee.department}
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#4d5568] mb-1">
              New Rank Assignment *
            </label>
            <select
              value={newRank}
              onChange={(e) => setNewRank(e.target.value)}
              className="h-[36px] w-full rounded-[8px] border border-[#e2e5ec] bg-white px-3 text-[13px] font-medium text-[#000000] outline-none focus:border-[#000000]"
            >
              {ranks.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#4d5568] mb-1">
              Department / Division Transfer (Optional)
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="h-[36px] w-full rounded-[8px] border border-[#e2e5ec] bg-white px-3 text-[13px] font-medium text-[#000000] outline-none focus:border-[#000000]"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#4d5568] mb-1">
              Authorized By *
            </label>
            <input
              type="text"
              required
              value={changedBy}
              onChange={(e) => setChangedBy(e.target.value)}
              placeholder="e.g. Chief Marcus Vance"
              className="h-[36px] w-full rounded-[8px] border border-[#e2e5ec] bg-white px-3 text-[13px] text-[#000000] outline-none focus:border-[#000000]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#4d5568] mb-1">
              Promotion / Transfer Notes
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Passed Senior Officer Exam with excellence"
              className="h-[36px] w-full rounded-[8px] border border-[#e2e5ec] bg-white px-3 text-[13px] text-[#000000] outline-none focus:border-[#000000]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f0f1f3]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[8px] border border-[#e2e5ec] bg-white px-4 py-2 text-[13px] font-medium text-[#000000] hover:bg-[#f7f8fb] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-[8px] bg-[#000000] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#333] transition-colors shadow-xs"
            >
              Confirm Promotion
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
