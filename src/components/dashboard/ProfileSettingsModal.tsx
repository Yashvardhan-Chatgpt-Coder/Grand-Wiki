import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  User,
  ChevronRight,
  Palette,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { queue } from "@/components/ui/Toast";
import { AppSelect } from "@/components/dashboard/AppSelect";
import { useCurrentUser } from "@/hooks/use-current-user";

type ProfileSettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
};

type TabId = "profile" | "appearance";
type AppearanceMode = "system" | "light" | "dark";

export function ProfileSettingsModal({ open, onOpenChange, isAdmin }: ProfileSettingsModalProps) {
  const { user, updateUser } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  // Form states
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [inGameId, setInGameId] = useState("");
  const [badgeNumber, setBadgeNumber] = useState("");
  const [appearanceMode, setAppearanceMode] = useState<AppearanceMode>("system");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(user.name || "");
    setOrganizationName(user.organization || "LSPD");
    setInGameId(user.inGameId || "");
    setBadgeNumber(user.badgeNumber || "");
    setAppearanceMode(user.appearanceMode || "system");
  }, [open, user]);

  const handleClose = () => {
    window.dispatchEvent(new CustomEvent("esports:appearance-preview", { detail: undefined }));
    setActiveTab("profile");
    onOpenChange(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin && !name.trim()) {
      queue.add(
        { title: "Validation Error", description: "Name cannot be left empty.", variant: "error" },
        { timeout: 3000 },
      );
      return;
    }

    if (!isAdmin && !organizationName.trim()) {
      queue.add(
        {
          title: "Validation Error",
          description: "Organization name cannot be left empty.",
          variant: "error",
        },
        { timeout: 3000 },
      );
      return;
    }

    setIsSaving(true);

    try {
      // Save to localStorage
      const updatedUser = {
        name: name.trim(),
        organization: organizationName.trim(),
        inGameId: inGameId.trim(),
        badgeNumber: badgeNumber.trim(),
        appearanceMode,
      };

      updateUser(updatedUser);

      queue.add(
        {
          title: "Settings Saved",
          description: "Your profile configurations were updated successfully.",
          variant: "success",
        },
        { timeout: 3000 },
      );
      handleClose();
    } catch (error) {
      console.error(error);
      queue.add(
        {
          title: "Could not save settings",
          description: error instanceof Error ? error.message : "An error occurred.",
          variant: "error",
        },
        { timeout: 3000 },
      );
    } finally {
      setIsSaving(false);
    }
  };

  const renderTabItem = (
    id: TabId,
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
  ) => {
    const active = activeTab === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => setActiveTab(id)}
        className={cn(
          "relative flex w-full items-center gap-3 rounded-[8px] px-3.5 py-2.5 text-left text-[13px] font-semibold transition-all duration-150 cursor-pointer outline-none",
          active
            ? "bg-[#f4f6fa] text-[#000000]"
            : "text-[#5c6479] hover:bg-[#f7f8fb] hover:text-[#000000]",
        )}
      >
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-black" />
        )}
        <Icon className={cn("h-4 w-4 shrink-0", active ? "text-black" : "text-[#9aa1b0]")} />
        <span className="flex-1">{label}</span>
        <ChevronRight
          className={cn("h-3 w-3 opacity-0 transition-opacity", active && "opacity-40")}
        />
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : handleClose())}>
      <DialogContent className="fixed flex h-[620px] w-full max-w-[960px] flex-col gap-0 overflow-hidden rounded-[16px] border border-[#e2e5ec] bg-white p-0 shadow-[0_24px_80px_rgba(0,0,0,0.12)]">
        <DialogTitle className="sr-only">Profile Settings</DialogTitle>

        {/* Top Header */}
        <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-[#f0f1f3] px-6 bg-[#f9fbfc]">
          <div>
            <h2 className="text-[15px] font-bold text-[#000000]">Settings</h2>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Navigation Sidebar */}
          <div className="w-[240px] shrink-0 border-r border-[#f0f1f3] bg-[#f9fbfc] p-4">
            <div className="space-y-1.5">
              {!isAdmin && renderTabItem("profile", "Profile Information", User)}
              {renderTabItem("appearance", "Appearance", Palette)}
            </div>
          </div>

          {/* Right Content Panel */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <form
              id="profile-settings-form"
              onSubmit={handleSave}
              className="flex min-h-0 flex-1 flex-col"
            >
              {/* Tab Content Display Area */}
              <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-8 py-6">
                {/* PROFILE TAB */}
                {activeTab === "profile" && !isAdmin && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-[14px] font-bold text-[#000000]">Profile Information</h3>
                      <p className="text-[11px] text-[#888888] mt-0.5">
                        Customize your public information and preferences.
                      </p>
                    </div>

                    <div className="space-y-4 max-w-[480px]">
                      <div>
                        <label className="mb-1 block text-[11px] font-bold text-[#4b5563] uppercase tracking-wider">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative flex items-center gap-2">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa1b0]" />
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            className="h-[38px] w-full rounded-[8px] border border-[#e2e5ec] bg-white pl-9 pr-3 text-[13px] text-[#000000] outline-none focus:border-[#000000] transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-bold text-[#4b5563] uppercase tracking-wider">
                          In-Game ID
                        </label>
                        <div className="relative flex items-center gap-2">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa1b0]" />
                          <input
                            type="text"
                            value={inGameId}
                            onChange={(e) => setInGameId(e.target.value)}
                            placeholder="Enter your in-game ID"
                            className="h-[38px] w-full rounded-[8px] border border-[#e2e5ec] bg-white pl-9 pr-3 text-[13px] text-[#000000] outline-none focus:border-[#000000] transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-bold text-[#4b5563] uppercase tracking-wider">
                          Badge Number
                        </label>
                        <div className="relative flex items-center gap-2">
                          <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa1b0]" />
                          <input
                            type="text"
                            value={badgeNumber}
                            onChange={(e) => setBadgeNumber(e.target.value)}
                            placeholder="Enter your badge number"
                            className="h-[38px] w-full rounded-[8px] border border-[#e2e5ec] bg-white pl-9 pr-3 text-[13px] text-[#000000] outline-none focus:border-[#000000] transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-bold text-[#4b5563] uppercase tracking-wider">
                          Organization <span className="text-red-500">*</span>
                        </label>
                        <AppSelect
                          value={organizationName}
                          onChange={setOrganizationName}
                          options={[
                            { label: "LSPD - Los Santos Police Department", value: "LSPD" },
                            { label: "FIB - Federal Investigation Bureau", value: "FIB" },
                            { label: "SAHP - San Andreas Highway Patrol", value: "SAHP" },
                            { label: "NG - National Guard", value: "NG" },
                            { label: "Government", value: "Government" },
                            { label: "EMS - Emergency Medical Services", value: "EMS" },
                            { label: "Lifeinvader", value: "Lifeinvader" }
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* APPEARANCE TAB */}
                {activeTab === "appearance" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-[14px] font-bold text-[#000000]">Appearance</h3>
                      <p className="text-[11px] text-[#888888] mt-0.5">
                        Choose how the software should look on this device.
                      </p>
                    </div>

                    <div className="grid max-w-[620px] gap-3 sm:grid-cols-3">
                      {[
                        {
                          id: "system" as const,
                          title: "System",
                          description: "Follow device theme.",
                        },
                        {
                          id: "light" as const,
                          title: "Light",
                          description: "Use bright interface.",
                        },
                        { id: "dark" as const, title: "Dark", description: "Use dark interface." },
                      ].map((option) => {
                        const selected = appearanceMode === option.id;
                        const previewBackground =
                          option.id === "dark"
                            ? "#111827"
                            : option.id === "light"
                              ? "#ffffff"
                              : "linear-gradient(135deg,#ffffff 0%,#ffffff 50%,#111827 50%,#111827 100%)";
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                              setAppearanceMode(option.id);
                              window.dispatchEvent(
                                new CustomEvent("esports:appearance-preview", {
                                  detail: option.id,
                                }),
                              );
                            }}
                            className={cn(
                              "cursor-pointer rounded-[10px] border bg-white p-4 text-left transition-colors hover:bg-[#f7f8fb]",
                              selected
                                ? "border-[#000000] ring-2 ring-[#e8eef7]"
                                : "border-[#e2e5ec]",
                            )}
                          >
                            <div
                              className="mb-3 h-20 rounded-[8px] border border-[#e2e5ec]"
                              style={{ background: previewBackground }}
                            />
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[13px] font-bold text-[#000000]">
                                {option.title}
                              </span>
                              <span
                                className={cn(
                                  "grid h-4 w-4 place-items-center rounded-full border",
                                  selected ? "border-[#000000] bg-[#000000]" : "border-[#c8cdd5]",
                                )}
                              >
                                {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-[#777777]">{option.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Save/Cancel Bottom Footer */}
              <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[#f0f1f3] bg-white px-8 py-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="cursor-pointer rounded-[6px] border border-[#e2e5ec] bg-white px-4 py-2 text-[12px] font-bold text-[#4b5563] hover:bg-[#f7f8fb]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="cursor-pointer rounded-[6px] bg-[#000000] px-4 py-2 text-[12px] font-bold text-white shadow-sm hover:bg-[#333] disabled:bg-zinc-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[110px]"
                >
                  {isSaving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
