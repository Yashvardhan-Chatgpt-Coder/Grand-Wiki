import { useState, type FormEvent } from "react";
import { Headset } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { queue } from "@/components/ui/Toast";
import { AppSelect } from "@/components/dashboard/AppSelect";
import { supportApi, type ApiSupportRequest, getStoredUser } from "@/lib/api";

const SUPPORT_SUBJECTS = [
  { label: "Suggestion", value: "Suggestion" as const },
  { label: "Bug Report", value: "Bug Report" as const },
];

type ContactSupportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ContactSupportDialog({ open, onOpenChange }: ContactSupportDialogProps) {
  const user = getStoredUser();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedMessage = message.trim();

    if (!subject) {
      queue.add(
        {
          title: "Select a subject",
          description: "Choose the support category before sending.",
          variant: "error",
        },
        { timeout: 3000 },
      );
      return;
    }

    if (!trimmedMessage) {
      queue.add(
        {
          title: "Message required",
          description: "Add a short message before sending your request.",
          variant: "error",
        },
        { timeout: 3000 },
      );
      return;
    }

    setSubmitting(true);
    try {
      await supportApi.create({
        subject: subject as ApiSupportRequest["subject"],
        message: trimmedMessage,
      });
      queue.add(
        {
          title: "Support request received",
          description: "Our team will get back to you soon.",
          variant: "success",
        },
        { timeout: 4000 },
      );
      setSubject("");
      setMessage("");
      onOpenChange(false);
    } catch (error) {
      queue.add(
        {
          title: "Could not send request",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "error",
        },
        { timeout: 4000 },
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex w-full max-w-[460px] flex-col gap-0 overflow-hidden rounded-[14px] border border-[#e2e5ec] bg-white p-0 shadow-[0_24px_80px_rgba(0,0,0,0.12)]">
        <DialogTitle className="sr-only">Contact support</DialogTitle>
        <div className="border-b border-[#f0f1f3] px-6 py-4">
          <div className="mb-3 grid h-10 w-10 place-items-center rounded-[8px] bg-[#f7f8fb] text-[#000000]">
            <Headset className="h-5 w-5" />
          </div>
          <h2 className="text-[18px] font-semibold text-[#000000]">Contact support</h2>
          <DialogDescription className="mt-1 text-[13px] leading-5 text-[#666666]">
            Tell us what you need help with. We will follow up with you soon.
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="rounded-[8px] border border-[#e2e5ec] bg-[#f9fbfc] px-3 py-2 text-[12px] text-[#666666]">
            Sending as <span className="font-semibold text-[#000000]">{user?.name || "current user"}</span>
          </div>

          <label className="block space-y-1.5">
              <span className="text-[12px] font-medium text-[#4b5563]">
                Subject <span className="text-[#dc2626]">*</span>
              </span>
            <AppSelect
              value={subject}
              onChange={setSubject}
              options={SUPPORT_SUBJECTS}
              placeholder="Select a subject"
              className="[&_button]:h-9 [&_button]:rounded-[6px] [&_button]:border [&_button]:border-[#e2e5ec] [&_button]:text-[13px]"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[12px] font-medium text-[#4b5563]">
              Message <span className="text-[#dc2626]">*</span>
            </span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="min-h-[110px] w-full resize-none rounded-[6px] border border-[#e2e5ec] bg-white px-3 py-2 text-[13px] outline-none placeholder:text-[#b0b7c4] focus:border-[#000000]"
              placeholder="Describe the issue or request..."
            />
          </label>

          <div className="flex justify-end gap-3 border-t border-[#f0f1f3] pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-8 cursor-pointer rounded-[6px] border border-[#e2e5ec] bg-white px-4 text-[13px] font-medium text-[#666666] transition-colors hover:bg-[#f7f8fb]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-8 cursor-pointer rounded-[6px] bg-[#000000] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#333]"
            >
              {submitting ? "Sending..." : "Send request"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
