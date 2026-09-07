import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  User,
  ChevronRight,
  Palette,
  Mail,
  Building2,
  Award,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { queue } from "@/components/ui/Toast";
import { AppSelect } from "@/components/dashboard/AppSelect";
import { iaApi, iaSession, type IaUser } from "@/lib/internal-affairs-api";

type ProfileSettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
  onUserUpdated?: () => void;
};

type TabId = "profile" | "appearance";
type AppearanceMode = "system" | "light" | "dark";

export function ProfileSettingsModal({ open, onOpenChange, isAdmin, onUserUpdated }: ProfileSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  // User fields (matching account creation fields)
  const [currentUser, setCurrentUser] = useState<IaUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [rank, setRank] = useState("");
  const [rankOptions, setRankOptions] = useState<{ label: string; value: string }[]>([]);

  // Appearance state
  const [appearanceMode, setAppearanceMode] = useState<AppearanceMode>("system");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    // Load active session user
    const session = iaSession.get();
    if (session?.user) {
      setCurrentUser(session.user);
      setName(session.user.name || "");
      setEmail(session.user.email || "");
      setOrganisation(session.user.organisation || "");
      setRank(session.user.rank || "");
    }

    // Load available ranks from DB settings
    iaApi
      .getSettings()
      .then((settings) => {
        if (settings?.ranks) {
          const options = settings.ranks.map((r) => ({ label: r, value: r }));
          setRankOptions(options);
        }
      })
      .catch(() => {
        // Fallback default ranks if settings request fails
        setRankOptions([
          { label: "Internal Affairs Director", value: "Internal Affairs Director" },
          { label: "Internal Affairs Deputy Director", value: "Internal Affairs Deputy Director" },
          { label: "Internal Affairs Lead Agent", value: "Internal Affairs Lead Agent" },
          { label: "Internal Affairs Senior Agent", value: "Internal Affairs Senior Agent" },
          { label: "Internal Affairs Agent", value: "Internal Affairs Agent" },
          { label: "Internal Affairs Junior Agent", value: "Internal Affairs Junior Agent" },
        ]);
      });
  }, [open]);

  const handleClose = () => {
    window.dispatchEvent(new CustomEvent("esports:appearance-preview", { detail: undefined }));
    setActiveTab("profile");
    onOpenChange(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === "profile" && !isAdmin) {
      if (!rank.trim()) {
        queue.add(
          { title: "Validation Error", description: "Rank cannot be left empty.", variant: "error" },
          { timeout: 3000 },
        );
        return;
      }

      setIsSaving(true);

      try {
        const response = await iaApi.updateProfile({ rank: rank.trim() });
        queue.add(
          {
            title: "Profile Updated",
            description: `Your rank was updated to "${response.user.rank}" in the database.`,
            variant: "success",
          },
          { timeout: 3000 },
        );

        window.dispatchEvent(new CustomEvent("ia:user-updated"));
        if (onUserUpdated) onUserUpdated();
        handleClose();
      } catch (error) {
        console.error(error);
        queue.add(
          {
            title: "Could not save profile",
            description: error instanceof Error ? error.message : "An error occurred updating profile.",
            variant: "error",
          },
          { timeout: 3000 },
        );
      } finally {
        setIsSaving(false);
      }
    } else {
      // Appearance mode save
      queue.add(
        {
          title: "Settings Saved",
          description: "Your settings have been saved.",
          variant: "success",
        },
        { timeout: 3000 },
      );
      handleClose();
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
            <h2 className="text-[15px] font-bold text-[#000000]">Profile & Settings</h2>
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
                      <h3 className="text-[14px] font-bold text-[#000000]">Account & Profile Information</h3>
                      <p className="text-[11px] text-[#888888] mt-0.5">
                        These fields match your Internal Affairs account credentials. Only rank can be edited by members.
                      </p>
                    </div>

                    <div className="space-y-4 max-w-[480px]">
                      {/* Name - Read Only */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-[#4b5563] uppercase tracking-wider">
                            Full Name
                          </label>
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#8a90a0]">
                            <Lock className="h-3 w-3" /> Admin Only
                          </span>
                        </div>
                        <div className="relative flex items-center">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa1b0]" />
                          <input
                            type="text"
                            disabled
                            value={name}
                            className="h-[38px] w-full rounded-[8px] border border-[#e2e5ec] bg-[#f7f8fb] pl-9 pr-3 text-[13px] text-[#5c6479] outline-none cursor-not-allowed"
                          />
                        </div>
                      </div>

                      {/* Email - Read Only */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-[#4b5563] uppercase tracking-wider">
                            Email Address
                          </label>
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#8a90a0]">
                            <Lock className="h-3 w-3" /> Admin Only
                          </span>
                        </div>
                        <div className="relative flex items-center">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa1b0]" />
                          <input
                            type="email"
                            disabled
                            value={email}
                            className="h-[38px] w-full rounded-[8px] border border-[#e2e5ec] bg-[#f7f8fb] pl-9 pr-3 text-[13px] text-[#5c6479] outline-none cursor-not-allowed"
                          />
                        </div>
                      </div>

                      {/* Organisation - Read Only */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-[#4b5563] uppercase tracking-wider">
                            Organisation
                          </label>
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#8a90a0]">
                            <Lock className="h-3 w-3" /> Admin Only
                          </span>
                        </div>
                        <div className="relative flex items-center">
                          <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa1b0]" />
                          <input
                            type="text"
                            disabled
                            value={organisation}
                            className="h-[38px] w-full rounded-[8px] border border-[#e2e5ec] bg-[#f7f8fb] pl-9 pr-3 text-[13px] text-[#5c6479] outline-none cursor-not-allowed"
                          />
                        </div>
                      </div>

                      {/* Rank - EDITABLE */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-[#4b5563] uppercase tracking-wider">
                            Rank <span className="text-[#b42318]">*</span>
                          </label>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Editable
                          </span>
                        </div>
                        {rankOptions.length > 0 ? (
                          <AppSelect
                            value={rank}
                            onChange={setRank}
                            options={rankOptions}
                          />
                        ) : (
                          <div className="relative flex items-center">
                            <Award className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa1b0]" />
                            <input
                              type="text"
                              value={rank}
                              onChange={(e) => setRank(e.target.value)}
                              placeholder="Enter your rank"
                              className="h-[38px] w-full rounded-[8px] border border-[#e2e5ec] bg-white pl-9 pr-3 text-[13px] text-[#000000] outline-none focus:border-[#000000] transition-colors"
                            />
                          </div>
                        )}
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
