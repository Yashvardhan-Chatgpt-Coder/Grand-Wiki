import { useState } from "react";
import { Settings, Plus, Trash2, Download, Upload, RotateCcw, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { IaOrganisation } from "@/lib/ia-types";
import { iaDb } from "@/lib/ia-db";
import { queue } from "@/components/ui/Toast";

interface IaOrgManagementModalProps {
  organisations: IaOrganisation[];
  onClose: () => void;
}

export function IaOrgManagementModal({
  organisations,
  onClose,
}: IaOrgManagementModalProps) {
  const [activeOrgId, setActiveOrgId] = useState(organisations[0]?.id || "lspd");
  const selectedOrg = organisations.find((o) => o.id === activeOrgId) || organisations[0];

  const [newDepartment, setNewDepartment] = useState("");
  const [newRank, setNewRank] = useState("");

  const handleAddDepartment = () => {
    if (!newDepartment.trim() || !selectedOrg) return;
    const currentDepts = selectedOrg.departments || [];
    if (currentDepts.includes(newDepartment.trim())) {
      queue.add({ title: "Duplicate", description: "Department already exists.", variant: "warning" });
      return;
    }
    iaDb.updateOrganisation(selectedOrg.id, {
      departments: [...currentDepts, newDepartment.trim()],
    });
    setNewDepartment("");
    queue.add({ title: "Department Added", description: `Added ${newDepartment} to ${selectedOrg.shortName}.`, variant: "success" });
  };

  const handleRemoveDepartment = (dept: string) => {
    if (!selectedOrg) return;
    iaDb.updateOrganisation(selectedOrg.id, {
      departments: (selectedOrg.departments || []).filter((d) => d !== dept),
    });
    queue.add({ title: "Department Removed", description: `Removed ${dept}.`, variant: "success" });
  };

  const handleAddRank = () => {
    if (!newRank.trim() || !selectedOrg) return;
    const currentRanks = selectedOrg.ranks || [];
    if (currentRanks.includes(newRank.trim())) {
      queue.add({ title: "Duplicate", description: "Rank already exists.", variant: "warning" });
      return;
    }
    iaDb.updateOrganisation(selectedOrg.id, {
      ranks: [...currentRanks, newRank.trim()],
    });
    setNewRank("");
    queue.add({ title: "Rank Added", description: `Added ${newRank} to ${selectedOrg.shortName}.`, variant: "success" });
  };

  const handleRemoveRank = (rank: string) => {
    if (!selectedOrg) return;
    iaDb.updateOrganisation(selectedOrg.id, {
      ranks: (selectedOrg.ranks || []).filter((r) => r !== rank),
    });
    queue.add({ title: "Rank Removed", description: `Removed ${rank}.`, variant: "success" });
  };

  const handleExportBackup = () => {
    const jsonStr = iaDb.exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `IA_Database_Backup_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    queue.add({ title: "Backup Exported", description: "Full JSON database backup downloaded.", variant: "success" });
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const success = iaDb.importDatabaseJson(json);
        if (success) {
          queue.add({ title: "Backup Restored", description: "Database imported successfully.", variant: "success" });
          onClose();
        } else {
          queue.add({ title: "Import Failed", description: "Invalid database JSON file.", variant: "error" });
        }
      } catch (err) {
        queue.add({ title: "Import Error", description: "Could not read backup file.", variant: "error" });
      }
    };
    reader.readAsText(file);
  };

  const handleResetToDefaults = () => {
    iaDb.resetToSampleData();
    queue.add({ title: "Database Reset", description: "Reset to default realistic sample data.", variant: "success" });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-[#e7e9f0] bg-[#f7f8fb] px-6 py-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#000000]" />
            <DialogTitle className="text-[18px] font-bold text-[#000000]">
              Organisation Settings & Database Backup
            </DialogTitle>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Org Selector Tabs */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8a90a0] mb-2">
              Select Organisation To Configure
            </label>
            <div className="flex flex-wrap gap-2">
              {organisations.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => setActiveOrgId(org.id)}
                  className={`rounded-[8px] px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
                    activeOrgId === org.id
                      ? "bg-[#000000] text-white"
                      : "border border-[#e2e5ec] bg-white text-[#000000] hover:bg-[#f7f8fb]"
                  }`}
                >
                  {org.shortName}
                </button>
              ))}
            </div>
          </div>

          {selectedOrg && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Departments List */}
              <div className="rounded-[8px] border border-[#e2e5ec] p-4 space-y-3">
                <h4 className="text-[13px] font-semibold text-[#000000]">
                  {selectedOrg.shortName} Departments
                </h4>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    placeholder="New department name..."
                    className="h-[32px] flex-1 rounded-[6px] border border-[#e2e5ec] bg-white px-2.5 text-[12px] outline-none focus:border-[#000000]"
                  />
                  <button
                    type="button"
                    onClick={handleAddDepartment}
                    className="h-[32px] rounded-[6px] bg-[#000000] px-3 text-[12px] font-medium text-white hover:bg-[#333]"
                  >
                    Add
                  </button>
                </div>

                <div className="max-h-[160px] overflow-y-auto divide-y divide-[#f0f1f3] rounded-[6px] border border-[#e2e5ec]">
                  {(selectedOrg.departments || []).map((dept) => (
                    <div key={dept} className="flex items-center justify-between p-2 text-[12px]">
                      <span className="font-medium text-[#000000]">{dept}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDepartment(dept)}
                        className="rounded-[4px] p-1 text-[#8a90a0] hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ranks Ladder */}
              <div className="rounded-[8px] border border-[#e2e5ec] p-4 space-y-3">
                <h4 className="text-[13px] font-semibold text-[#000000]">
                  {selectedOrg.shortName} Rank Hierarchy
                </h4>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRank}
                    onChange={(e) => setNewRank(e.target.value)}
                    placeholder="New rank (e.g. Captain (10))..."
                    className="h-[32px] flex-1 rounded-[6px] border border-[#e2e5ec] bg-white px-2.5 text-[12px] outline-none focus:border-[#000000]"
                  />
                  <button
                    type="button"
                    onClick={handleAddRank}
                    className="h-[32px] rounded-[6px] bg-[#000000] px-3 text-[12px] font-medium text-white hover:bg-[#333]"
                  >
                    Add
                  </button>
                </div>

                <div className="max-h-[160px] overflow-y-auto divide-y divide-[#f0f1f3] rounded-[6px] border border-[#e2e5ec]">
                  {(selectedOrg.ranks || []).map((rank) => (
                    <div key={rank} className="flex items-center justify-between p-2 text-[12px]">
                      <span className="font-medium text-[#000000]">{rank}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRank(rank)}
                        className="rounded-[4px] p-1 text-[#8a90a0] hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Database Backup & Restore */}
          <div className="rounded-[8px] border border-[#e2e5ec] p-4 space-y-3">
            <h4 className="text-[13px] font-semibold text-[#000000]">
              Database Backup & Recovery
            </h4>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExportBackup}
                className="h-[36px] inline-flex items-center gap-2 rounded-[8px] border border-[#e2e5ec] bg-white px-3.5 text-[12px] font-medium text-[#000000] hover:bg-[#f7f8fb]"
              >
                <Download className="h-4 w-4 text-[#8a90a0]" />
                <span>Download Database JSON</span>
              </button>

              <label className="h-[36px] inline-flex items-center gap-2 rounded-[8px] border border-[#e2e5ec] bg-white px-3.5 text-[12px] font-medium text-[#000000] hover:bg-[#f7f8fb] cursor-pointer">
                <Upload className="h-4 w-4 text-[#8a90a0]" />
                <span>Restore Backup File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleResetToDefaults}
                className="h-[36px] inline-flex items-center gap-2 rounded-[8px] border border-rose-200 bg-rose-50 px-3.5 text-[12px] font-medium text-rose-700 hover:bg-rose-100"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset to Default Data</span>
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
