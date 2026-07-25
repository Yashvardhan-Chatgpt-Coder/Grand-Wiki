import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, Check, Send } from "lucide-react";

interface CreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreditsModal({ open, onOpenChange }: CreditsModalProps) {
  const [copiedInitiative, setCopiedInitiative] = useState(false);
  const [copiedContributor, setCopiedContributor] = useState(false);

  const handleCopyInitiative = () => {
    navigator.clipboard.writeText(".yashvardhan.");
    setCopiedInitiative(true);
    setTimeout(() => setCopiedInitiative(false), 1500);
  };

  const handleCopyContributor = () => {
    navigator.clipboard.writeText("adi_babu");
    setCopiedContributor(true);
    setTimeout(() => setCopiedContributor(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[720px] !w-[92vw] p-7 overflow-hidden rounded-[18px] border border-[#e2e5ec] bg-white shadow-2xl dark:border-[#222326] dark:bg-[#000000] dark:text-white">
        {/* Header - Icon on left, centered title */}
        <div className="flex items-center justify-center gap-2.5 pb-1">
          <Users className="h-6 w-6 shrink-0" />
          <DialogTitle className="text-[22px] font-bold tracking-tight text-[#000000] dark:text-white">
            Credits
          </DialogTitle>
        </div>

        <div className="space-y-5 pt-1">
          {/* Initiative By Section */}
          <div className="flex flex-col items-center space-y-3">
            <h3 className="text-[14px] font-semibold text-[#000000] dark:text-white tracking-wide">
              Initiative By
            </h3>
            
            {/* Discord Profile Card - Larger size for Initiative By */}
            <div className="inline-flex items-center gap-5 rounded-[5px] border border-[#2d2d34] bg-[#202024] px-3 py-1.5 shadow-md">
              <div className="flex items-center gap-3.5">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10">
                  <img
                    src="/Brand/Discord PFP.jpg"
                    alt="Yashvardhan Chauhan"
                    className="h-full w-full object-cover rounded-full overflow-hidden"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#202024] bg-emerald-500" />
                </div>
                <div className="flex flex-col">
                  <h4 className="text-[15px] font-bold text-white leading-none">
                    Yashvardhan Chauhan
                  </h4>
                  <button
                    type="button"
                    onClick={handleCopyInitiative}
                    className="text-left text-[12px] font-medium text-[#888991] hover:text-white transition-colors mt-1 flex items-center gap-1 cursor-pointer"
                    title="Click to copy username"
                  >
                    @.yashvardhan.
                    {copiedInitiative ? (
                      <Check className="h-3 w-3 text-emerald-400 inline" />
                    ) : null}
                  </button>
                </div>
              </div>

              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-[4px] bg-[#5863ef] px-3 py-1.5 text-[12px] font-semibold text-white transition-opacity hover:opacity-90 shadow-sm shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
                Discord
              </a>
            </div>
          </div>

          {/* Separator Line */}
          <div className="border-t border-[#e2e5ec] dark:border-[#222326]" />

          {/* Contributors Section */}
          <div className="flex flex-col items-center space-y-3">
            <h3 className="text-[14px] font-semibold text-[#000000] dark:text-white tracking-wide">
              Contributors
            </h3>
            
            {/* Contributor Discord Card - EXACT same from DonateModal */}
            <div className="inline-flex items-center gap-4 rounded-[5px] border border-[#2d2d34] bg-[#202024] px-3 py-1.5 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10">
                  <img
                    src="/Brand/Contributors/Adityaa Ssingh.png"
                    alt="Adityaa Ssingh"
                    className="h-full w-full object-cover rounded-full overflow-hidden"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#202024] bg-emerald-500" />
                </div>
                <div className="flex flex-col">
                  <h4 className="text-[12px] font-bold text-white leading-none">
                    Adityaa Ssingh
                  </h4>
                  <button
                    type="button"
                    onClick={handleCopyContributor}
                    className="text-left text-[10px] font-medium text-[#888991] hover:text-white transition-colors mt-0.5 flex items-center gap-1 cursor-pointer"
                    title="Click to copy username"
                  >
                    @adi_babu
                    {copiedContributor ? (
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
      </DialogContent>
    </Dialog>
  );
}
