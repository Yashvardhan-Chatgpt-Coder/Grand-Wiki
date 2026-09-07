import { useState } from "react";
import { CheckCircle2, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { IaEmployee } from "@/lib/ia-types";
import { iaDb } from "@/lib/ia-db";
import { queue } from "@/components/ui/Toast";

interface IaMarkLogCheckModalProps {
  employee: IaEmployee;
  onClose: () => void;
  onSuccess: () => void;
}

export function IaMarkLogCheckModal({
  employee,
  onClose,
  onSuccess,
}: IaMarkLogCheckModalProps) {
  const [checkedBy, setCheckedBy] = useState("IA Officer");
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkedBy.trim()) {
      queue.add({
        title: "Validation Error",
        description: "Checker name is required.",
        variant: "error",
      });
      return;
    }

    iaDb.addLogCheck(employee.id, checkedBy.trim(), note.trim() || undefined);
    queue.add({
      title: "Logs Marked Checked",
      description: `Successfully recorded IA log inspection for ${employee.fullName}.`,
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
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <DialogTitle className="text-[17px] font-bold text-[#000000]">
              Mark Logs Checked
            </DialogTitle>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-[8px] bg-[#f7f8fb] p-3 text-[13px]">
            <div className="font-semibold text-[#000000]">{employee.fullName}</div>
            <div className="text-[11px] text-[#8a90a0]">
              ID: #{employee.inGameId} • {employee.currentRank} • {employee.organisationId.toUpperCase()}
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#4d5568] mb-1">
              IA Officer / Inspector Name *
            </label>
            <input
              type="text"
              required
              value={checkedBy}
              onChange={(e) => setCheckedBy(e.target.value)}
              placeholder="e.g. IA Agent Miller"
              className="h-[36px] w-full rounded-[8px] border border-[#e2e5ec] bg-white px-3 text-[13px] text-[#000000] outline-none focus:border-[#000000]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#4d5568] mb-1">
              Inspection Notes / Verification Findings
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. All arrest and confiscation logs reviewed for current week. 100% compliant."
              className="w-full rounded-[8px] border border-[#e2e5ec] bg-white p-3 text-[13px] text-[#000000] outline-none focus:border-[#000000]"
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
              Confirm Log Inspection
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
