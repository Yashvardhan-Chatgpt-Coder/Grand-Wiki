import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Heart, Copy, Check, FileText, Send } from "lucide-react";

interface DonateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DonateModal({ open, onOpenChange }: DonateModalProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedUsername, setCopiedUsername] = useState(false);

  const serverCards = [
    { name: "ENGLISH #1", code: "EN1", idText: "Coming Soon" },
    { name: "ENGLISH #2", code: "EN2", idText: "Coming Soon" },
    { name: "ENGLISH #3", code: "EN3", idText: "Coming Soon" },
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleCopyUsername = () => {
    navigator.clipboard.writeText("billly.butcher");
    setCopiedUsername(true);
    setTimeout(() => setCopiedUsername(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[720px] !w-[92vw] p-7 overflow-hidden rounded-[18px] border border-[#e2e5ec] bg-white shadow-2xl dark:border-[#222326] dark:bg-[#000000] dark:text-white">
        {/* Header - Icon on left, centered title */}
        <div className="flex items-center justify-center gap-2.5 pb-1">
          <Heart className="h-6 w-6 text-red-500 fill-red-500 shrink-0" />
          <DialogTitle className="text-[22px] font-bold tracking-tight text-[#000000] dark:text-white">
            Donate Us
          </DialogTitle>
        </div>

        <div className="space-y-4 pt-1">
          {/* Uncontainerized Clean Disclaimer Paragraph */}
          <p className="text-[13px] text-[#4b5563] dark:text-[#a0a5b1] leading-relaxed text-center max-w-[660px] mx-auto">
            We are strictly committed to adhering to all official Grand RP server regulations and do <strong className="text-black dark:text-white font-semibold">NOT</strong> support or engage in IRL trading or real-money transactions under any circumstances. Consequently, we do not accept real-life money. To support our work, you may freely send in-game currency (IC) via bank transfer to the account IDs below.
          </p>

          {/* 3 Server Cards Centered */}
          <div className="flex justify-center pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full max-w-[620px]">
              {serverCards.map((card, idx) => (
                <div
                  key={card.name}
                  className="relative flex flex-col justify-between rounded-[12px] border border-[#e5e7eb] bg-[#f8fafc] px-4 py-3 dark:border-[#222326] dark:bg-[#121213]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#374151] dark:text-[#d1d5db]">
                      {card.name}
                    </span>
                    {/* Custom UK Flag image */}
                    <img
                      src="/Brand/UK Flag.png"
                      alt="UK Flag"
                      className="h-4 w-6 rounded-[2px] shadow-sm shrink-0 object-cover"
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[16px] font-extrabold text-[#000000] dark:text-white tracking-tight">
                      {card.idText}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopy(card.idText, idx)}
                      className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-[#e5e7eb] bg-white text-[#4b5563] transition-colors hover:bg-black hover:text-white dark:border-[#2a2b2e] dark:bg-[#1a1b1e] dark:text-[#a0a5b1] dark:hover:bg-white dark:hover:text-black cursor-pointer"
                      title="Copy"
                    >
                      {copiedIndex === idx ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Notice & Discord Contact */}
          <div className="flex flex-col items-center space-y-3 pt-1">
            {/* POV Proof Notice - Styled in site theme */}
            <div className="w-full max-w-[620px] flex items-start gap-2.5 rounded-[10px] border border-[#e2e5ec] bg-[#f8fafc] p-3 text-[12px] text-[#4b5563] dark:border-[#222326] dark:bg-[#121213] dark:text-[#a0a5b1]">
              <FileText className="h-4 w-4 text-[#8a90a0] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="font-semibold text-black dark:text-white">POV Proof Required:</strong> Donations are recorded as valid only after submitting POV video/screenshot proof of the IC bank transfer to our Discord contact below.
              </p>
            </div>

            {/* Discord Profile Card - Clickable username to copy */}
            <div className="inline-flex items-center gap-4 rounded-[5px] border border-[#2d2d34] bg-[#202024] px-3 py-1.5 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full overflow-hidden border border-white/10">
                  <img
                    src="/Brand/Billy.jpg"
                    alt="Billy Butcher"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-[#202024] bg-emerald-500" />
                </div>
                <div className="flex flex-col">
                  <h4 className="text-[12px] font-bold text-white leading-none">
                    Billy Butcher
                  </h4>
                  <button
                    type="button"
                    onClick={handleCopyUsername}
                    className="text-left text-[10px] font-medium text-[#888991] hover:text-white transition-colors mt-0.5 flex items-center gap-1 cursor-pointer"
                    title="Click to copy username"
                  >
                    @billly.butcher
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

          {/* Footer Disclaimer & Safety Note */}
          <div className="pt-2 text-center">
            <p className="text-[11px] text-[#9ca3af] dark:text-[#71717a] leading-relaxed">
              <strong className="text-[#6b7280] dark:text-[#9ca3af]">Disclaimer:</strong> Donations are your personal choice and we do not force anyone to donate.<br />
              We are not affiliated with Grand RP project in any means.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
