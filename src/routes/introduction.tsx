import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Image as ImageIcon,
  X,
  Send,
  Check,
} from "lucide-react";
import { AppSelect } from "@/components/dashboard/AppSelect";
import { queue } from "@/components/ui/Toast";
import { useCurrentUser } from "@/hooks/use-current-user";
import { authApi, getStoredUser, persistUser, ApiUser } from "@/lib/api";

export const Route = createFileRoute("/introduction")({
  head: () => ({
    meta: [{ title: "Profile Setup | Grand Wiki" }],
  }),
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const user = getStoredUser();
    if (!user) {
      throw redirect({ to: "/login" });
    }
    const isAdmin = user.role === "admin" || user.role === "ADMIN" || user.email?.toLowerCase().startsWith("admin");
    if (isAdmin) {
      throw redirect({ to: "/" });
    }
    const emailKey = `grand_wiki_onboarding_${user.email}`;
    const status = localStorage.getItem(emailKey) || "not_submitted";
    if (user.approvalStatus === "approved" || status === "approved") {
      throw redirect({ to: "/" });
    }
  },
  component: Introduction,
});

const SERVER_OPTIONS = [
  { label: "ENGLISH #1", value: "ENGLISH #1", iconUrl: "/Brand/UK Flag.png" },
  { label: "ENGLISH #2", value: "ENGLISH #2", iconUrl: "/Brand/UK Flag.png" },
  { label: "ENGLISH #3", value: "ENGLISH #3", iconUrl: "/Brand/UK Flag.png" },
];

const ORGANIZATION_OPTIONS = [
  { label: "LSPD - Los Santos Police Department", value: "LSPD" },
  { label: "SAHP - San Andreas Highway Patrol", value: "SAHP" },
  { label: "FIB - Federal Investigation Bureau", value: "FIB" },
  { label: "NG - National Guard", value: "NG" },
  { label: "GOV - Government", value: "GOV" },
  { label: "EMS - Emergency Medical Services", value: "EMS" },
  { label: "LI - Lifeinvader", value: "LI" },
  { label: "Gang", value: "Gang" },
];

interface ServerEntry {
  id: string;
  server: string;
  inGameId: string;
}

function hasSubmittedOnboarding(user: ApiUser | null, status: string | null): boolean {
  return Boolean(
    status === "pending_approval" &&
      user?.approvalStatus === "pending" &&
      user?.inGameId?.trim() &&
      user.organization?.name?.trim() &&
      user.inGameScreenshotUrl,
  );
}

function Introduction() {
  const { displayName } = useCurrentUser();
  const navigate = useNavigate();
  const currentUser = getStoredUser();

  // Redirect immediately if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate({ to: "/login", replace: true });
    }
  }, [currentUser, navigate]);

  // Wizard Step: 1 = Profile Setup, 2 = Identity Proof, 3 = Sent for Approval
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [copiedUsername, setCopiedUsername] = useState(false);

  // Step 1 Form State
  const [name, setName] = useState(displayName || currentUser?.name || "");
  const [organization, setOrganization] = useState("LSPD");
  const [badgeNumber, setBadgeNumber] = useState("");
  const [servers, setServers] = useState<ServerEntry[]>([
    { id: "s-1", server: "ENGLISH #1", inGameId: "" },
  ]);

  // Badge Number is hidden for Lifeinvader ("LI") and "Gang"
  const showBadgeNumber = organization !== "LI" && organization !== "Gang";

  // Step 2 Form State
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyUsername = () => {
    navigator.clipboard.writeText(".yashvardhan.");
    setCopiedUsername(true);
    setTimeout(() => setCopiedUsername(false), 1500);
  };

  // Sync prefilled name & check onboarding status
  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      navigate({ to: "/login", replace: true });
      return;
    }

    if (displayName && !name) {
      setName(displayName);
    }

    const isAdmin = user.role === "admin" || user.role === "ADMIN" || user.email?.toLowerCase().startsWith("admin");
    if (isAdmin) {
      navigate({ to: "/", replace: true });
      return;
    }

    const emailKey = `grand_wiki_onboarding_${user.email}`;
    const status = localStorage.getItem(emailKey);

    if (user.approvalStatus === "approved" || status === "approved") {
      navigate({ to: "/", replace: true });
    } else if (hasSubmittedOnboarding(user, status)) {
      setStep(3);
    } else {
      if (status === "pending_approval") {
        localStorage.removeItem(emailKey);
      }
      setStep(1);
    }
  }, [displayName, name, navigate]);

  // Background Intro Music playback
  useEffect(() => {
    const user = getStoredUser();
    if (!user) return;
    const isAdmin = Boolean(user.role === "admin" || user.role === "ADMIN" || user.email?.toLowerCase().includes("admin"));
    const emailKey = `grand_wiki_onboarding_${user.email}`;
    const status = localStorage.getItem(emailKey);

    if (isAdmin || user?.approvalStatus === "approved" || status === "approved") {
      return;
    }

    const audio = new Audio("/Login/Intro Music.mp3");
    audio.loop = true;
    audio.volume = 0.5;

    let handleGesture: (() => void) | null = null;

    const playMusic = () => {
      audio.play().catch(() => {
        handleGesture = () => {
          audio.play().catch(() => {});
        };
        window.addEventListener("click", handleGesture, { once: true });
        window.addEventListener("keydown", handleGesture, { once: true });
      });
    };

    playMusic();

    return () => {
      audio.pause();
      audio.currentTime = 0;
      if (handleGesture) {
        window.removeEventListener("click", handleGesture);
        window.removeEventListener("keydown", handleGesture);
      }
    };
  }, []);

  // Listen for Ctrl+V paste on Step 2
  useEffect(() => {
    if (step !== 2) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              setProofImage(dataUrl);
              setProofFile(new File([blob], "identity-proof.png", { type: blob.type || "image/png" }));
              queue.add(
                {
                  title: "Image Pasted!",
                  description: "Identity proof loaded from clipboard.",
                  variant: "success",
                },
                { timeout: 3000 }
              );
            };
            reader.readAsDataURL(blob);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [step]);

  // Handle Server Row Operations
  const handleAddServer = () => {
    setServers((prev) => [
      ...prev,
      { id: `s-${Date.now()}`, server: "ENGLISH #1", inGameId: "" },
    ]);
  };

  const handleRemoveServer = (id: string) => {
    if (servers.length <= 1) return;
    setServers((prev) => prev.filter((s) => s.id !== id));
  };

  const handleServerChange = (id: string, field: "server" | "inGameId", value: string) => {
    setServers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  // Step 1 Continue
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      queue.add({ title: "Missing Field", description: "Please enter your name.", variant: "error" }, { timeout: 3000 });
      return;
    }

    const hasAtLeastOneServer = servers.some((s) => s.server && s.inGameId.trim());
    if (!hasAtLeastOneServer) {
      queue.add(
        {
          title: "Missing Field",
          description: "Please enter an In-Game ID for at least one server.",
          variant: "error",
        },
        { timeout: 3000 }
      );
      return;
    }

    if (!organization) {
      queue.add({ title: "Missing Field", description: "Please select an organization.", variant: "error" }, { timeout: 3000 });
      return;
    }

    setStep(2);
  };

  // Step 2 Drag & Drop & File Select
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProofImage(event.target?.result as string);
        setProofFile(file);
      };
      reader.readAsDataURL(file);
    } else if (file) {
      queue.add({ title: "Invalid File", description: "Please upload an image file.", variant: "error" }, { timeout: 3000 });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProofImage(event.target?.result as string);
        setProofFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    if (!proofImage || !proofFile) {
      queue.add(
        {
          title: "Proof Required",
          description: "Please upload or paste your identity proof image.",
          variant: "error",
        },
        { timeout: 3000 },
      );
      return;
    }

    const user = getStoredUser();
    if (!user) {
      navigate({ to: "/login", replace: true });
      return;
    }

    setIsSubmitting(true);
    try {
      const mainServer = servers[0] || { server: "ENGLISH #1", inGameId: "" };
      const updatedUser = await authApi.updateProfile({
        name: name.trim(),
        server: mainServer.server,
        inGameId: mainServer.inGameId.trim(),
        badgeNumber: showBadgeNumber ? badgeNumber.trim() : "",
        organization: { name: organization },
        inGameScreenshotFile: proofFile,
      });
      persistUser(updatedUser);

      const userEmail = updatedUser.email;
      localStorage.setItem(`grand_wiki_onboarding_${userEmail}`, "pending_approval");
      
      // Don't store large base64 images in localStorage to avoid quota errors
      // The image is already uploaded to Cloudinary via the backend
      
      // Keep the offline admin preview in sync when the API fallback is active.
      const rawUsers = localStorage.getItem("esports_admin_users");
      const users: ApiUser[] = rawUsers ? JSON.parse(rawUsers) : [];
      const userIndex = users.findIndex(
        (entry) =>
          (entry.email && entry.email.toLowerCase() === userEmail.toLowerCase()) ||
          entry._id === updatedUser._id,
      );
      const pendingUserData: ApiUser = {
        ...updatedUser,
        server: mainServer.server || "ENGLISH #1",
        inGameId: mainServer.inGameId || "N/A",
        badgeNumber: showBadgeNumber ? badgeNumber : undefined,
        organization: { name: organization },
        approvalStatus: "pending",
        inGameScreenshotUrl: updatedUser.inGameScreenshotUrl || "offline-uploaded-proof",
      };

      // Don't store base64 image in adminPreviewUser - use the Cloudinary URL instead
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...pendingUserData };
      } else {
        users.push(pendingUserData);
      }
      
      try {
        localStorage.setItem("esports_admin_users", JSON.stringify(users));
      } catch (storageErr) {
        console.warn("Could not save to localStorage (quota exceeded):", storageErr);
        // Continue anyway - the data is already saved to the backend
      }
      
      persistUser(pendingUserData);
      setStep(3);
    } catch (err) {
      console.error("Failed to submit onboarding:", err);
      queue.add(
        {
          title: "Submission Failed",
          description: err instanceof Error ? err.message : "Could not submit your details for approval.",
          variant: "error",
        },
        { timeout: 3000 },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 select-none overflow-x-hidden">
      {/* Background Image */}
      <div className="fixed inset-0 z-0">
        <img
          src="/Login/Introduction.jpg"
          alt="Introduction Background"
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      {/* Main Theme-Compliant Popup Modal Window */}
      <div
        className={`relative z-10 w-full overflow-hidden rounded-[16px] border border-[#e2e5ec] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.12)] transition-all duration-300 ease-in-out ${
          step === 2 ? "max-w-[760px]" : step === 3 ? "max-w-[480px]" : "max-w-[440px]"
        }`}
      >
        <AnimatePresence mode="wait">
          {/* Step 1: Profile Setup */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -25 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#f0f1f3] px-6 py-4">
                <h2 className="text-[18px] font-semibold text-[#000000]">Profile Setup</h2>
              </div>

              {/* Form Body */}
              <form onSubmit={handleStep1Submit} noValidate className="flex flex-col">
                <div className="space-y-4 px-6 py-5">
                  {/* Name */}
                  <div>
                    <label className="mb-1.5 block text-[12px] font-medium text-[#4b5563]">
                      Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="h-9 w-full rounded-[6px] border border-[#e2e5ec] bg-white px-3 text-[13px] font-normal text-[#000000] outline-none transition-colors hover:border-[#b0b7c3] focus:border-[#000000]"
                    />
                  </div>

                  {/* Server and In-Game ID */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] font-medium text-[#4b5563]">
                        Server & In-Game ID
                      </label>
                      <button
                        type="button"
                        onClick={handleAddServer}
                        className="flex items-center gap-1 text-[12px] font-semibold text-[#000000] hover:underline cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" /> Server
                      </button>
                    </div>

                    {servers.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <div className="w-[50%]">
                          <AppSelect
                            value={item.server}
                            options={SERVER_OPTIONS}
                            onChange={(val) => handleServerChange(item.id, "server", val)}
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={item.inGameId}
                            onChange={(e) => handleServerChange(item.id, "inGameId", e.target.value)}
                            placeholder="In-Game ID (e.g. 1024)"
                            className="h-9 w-full rounded-[6px] border border-[#e2e5ec] bg-white px-3 text-[13px] font-normal text-[#000000] outline-none transition-colors hover:border-[#b0b7c3] focus:border-[#000000]"
                          />
                        </div>
                        {servers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveServer(item.id)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border border-[#e2e5ec] text-[#666666] hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove Server"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Organization */}
                  <div>
                    <label className="mb-1.5 block text-[12px] font-medium text-[#4b5563]">
                      Organization
                    </label>
                    <AppSelect
                      value={organization}
                      options={ORGANIZATION_OPTIONS}
                      onChange={(val) => setOrganization(val)}
                    />
                  </div>

                  {/* Badge Number (Optional, smoothly animates) */}
                  <AnimatePresence initial={false}>
                    {showBadgeNumber && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <label className="mb-1.5 block text-[12px] font-medium text-[#4b5563]">
                          Badge Number <span className="font-normal text-[#9aa1b0]">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={badgeNumber}
                          onChange={(e) => setBadgeNumber(e.target.value)}
                          placeholder="e.g. 402"
                          className="h-9 w-full rounded-[6px] border border-[#e2e5ec] bg-white px-3 text-[13px] font-normal text-[#000000] outline-none transition-colors hover:border-[#b0b7c3] focus:border-[#000000]"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end border-t border-[#f0f1f3] px-6 py-4">
                  <button
                    type="submit"
                    className="flex h-9 items-center justify-center gap-1.5 rounded-[6px] bg-[#000000] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#333333] cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Step 2: Identity Proof */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -25 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#f0f1f3] px-6 py-4">
                <h2 className="text-[18px] font-semibold text-[#000000]">Identity Proof</h2>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                <p className="text-[13px] leading-5 text-[#666666]">
                  Upload proof of your in-game identity. <span className="font-semibold text-rose-600">ID and Server should be clearly visible.</span>
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                  {/* Left Column: Sample Format */}
                  <div className="flex flex-col">
                    <span className="text-[12px] font-semibold text-[#4b5563] mb-2 flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-[#5863ef]" /> Sample Format
                    </span>
                    <div className="overflow-hidden rounded-[8px] border border-[#e2e5ec] bg-[#f9fbfc]">
                      <img
                        src="/Login/Sample.png"
                        alt="Sample Format"
                        className="w-full h-[220px] object-cover"
                      />
                    </div>
                  </div>

                  {/* Right Column: Upload Area */}
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-semibold text-[#4b5563]">Upload Screenshot</span>
                      {proofImage && (
                        <span className="text-[12px] font-medium text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Ready
                        </span>
                      )}
                    </div>

                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative flex h-[220px] cursor-pointer flex-col items-center justify-center rounded-[8px] border-2 border-dashed p-4 text-center transition-colors ${
                        isDragging
                          ? "border-[#000000] bg-[#f7f8fb]"
                          : proofImage
                          ? "border-emerald-500 bg-emerald-50/20"
                          : "border-[#e2e5ec] bg-[#fcfdfd] hover:border-[#b0b7c3]"
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />

                      {proofImage ? (
                        <div className="relative flex flex-col items-center justify-center h-full w-full group">
                          {/* Remove Image Cross Button */}
                          <button
                            type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setProofImage(null);
                                setProofFile(null);
                            }}
                            className="absolute top-0 right-0 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-[#000000] text-white hover:bg-rose-600 transition-colors shadow-md cursor-pointer"
                            title="Remove Image"
                          >
                            <X className="h-4 w-4" />
                          </button>

                          <img
                            src={proofImage}
                            alt="Uploaded Proof Preview"
                            className="max-h-[170px] w-auto rounded-[6px] object-contain border border-[#e2e5ec] shadow-sm"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-2 my-auto">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f0f2f6] text-[#000000]">
                            <Upload className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[13px] font-medium text-[#000000]">
                              Click to upload or drag & drop
                            </p>
                            <p className="text-[11.5px] text-[#8a90a0] mt-0.5">
                              Supports upload, drag & drop, or <kbd className="px-1 py-0.5 bg-[#e2e5ec] rounded text-[10.5px] font-mono text-[#000000]">Ctrl + V</kbd> paste
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-[#f0f1f3] px-6 py-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="h-9 px-4 rounded-[6px] border border-[#e2e5ec] bg-white text-[13px] font-medium text-[#666666] hover:bg-[#f7f8fb] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="h-9 px-5 rounded-[6px] bg-[#000000] text-white text-[13px] font-semibold hover:bg-[#333333] disabled:bg-[#8a90a0] disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Approval Confirmation Message (Clean, Theme-Compliant, No Top Header) */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -25 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex flex-col p-6 sm:p-7"
            >
              {/* Body */}
              <div className="text-center space-y-4">
                <Clock className="mx-auto h-7 w-7 text-[#000000]" />

                <div className="space-y-1.5">
                  <h3 className="text-[20px] font-bold text-[#000000]">
                    Account Sent for Approval
                  </h3>
                  <p className="text-[13px] text-[#666666] leading-relaxed max-w-[380px] mx-auto">
                    Thank you! Your profile setup and identity proof have been successfully submitted for administrative review.
                  </p>
                </div>

                <div className="text-[12px] font-medium text-[#666666]">
                  Max approval time — 3 hours
                </div>

                <p className="text-[12.5px] font-medium text-[#4b5563] pt-1">
                  You will be notified via email once your account is verified.
                </p>

                {/* Instant Approval Discord Section */}
                <div className="pt-4 border-t border-[#f0f1f3] flex flex-col items-center space-y-2.5">
                  <span className="text-[12px] font-semibold text-[#666666]">
                    For instant approval contact:
                  </span>

                  {/* Discord Profile Card */}
                  <div className="inline-flex items-center gap-4 rounded-[5px] border border-[#2d2d34] bg-[#202024] px-3.5 py-2 shadow-md">
                    <div className="flex items-center gap-2.5">
                      <div className="relative h-7 w-7 shrink-0">
                        <img
                          src="/Login/Discord PFP.jpg"
                          alt="Yashvardhan Chauhan"
                          className="h-full w-full rounded-full object-cover border border-white/10"
                        />
                        <span className="absolute bottom-0 right-0 z-20 h-2.5 w-2.5 rounded-full border-2 border-[#202024] bg-emerald-500" />
                      </div>
                      <div className="flex flex-col text-left">
                        <h4 className="text-[12px] font-bold text-white leading-none">
                          Yashvardhan Chauhan
                        </h4>
                        <button
                          type="button"
                          onClick={handleCopyUsername}
                          className="text-left text-[10px] font-medium text-[#888991] hover:text-white transition-colors mt-0.5 flex items-center gap-1 cursor-pointer outline-none"
                          title="Click to copy username"
                        >
                          @.yashvardhan.
                          {copiedUsername ? (
                            <Check className="h-2.5 w-2.5 text-emerald-400 inline" />
                          ) : null}
                        </button>
                      </div>
                    </div>

                    <a
                      href="https://discord.com"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-[4px] bg-[#5863ef] px-2.5 py-1 text-[11px] font-semibold text-white transition-opacity hover:opacity-90 shadow-sm shrink-0"
                    >
                      <Send className="h-3 w-3" />
                      Discord
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
