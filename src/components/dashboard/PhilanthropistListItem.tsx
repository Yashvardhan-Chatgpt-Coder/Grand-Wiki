import { Trophy } from "lucide-react";

interface PhilanthropistListItemProps {
  rank: number;
  name: string;
  server: string;
  amountLabel: string;
  showDivider?: boolean;
}

export function PhilanthropistListItem({
  rank,
  name,
  server,
  amountLabel,
  showDivider = true,
}: PhilanthropistListItemProps) {
  return (
    <div
      className={`flex items-center gap-3 ${
        showDivider ? "border-b border-[#f0f1f3] pb-3" : ""
      }`}
    >
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
          rank === 1
            ? "bg-[#fef3c7] text-[#b45309]"
            : rank === 2
              ? "bg-[#f3f4f6] text-[#4b5563]"
              : rank === 3
                ? "bg-[#ffedd5] text-[#c2410c]"
                : "bg-[#f0f1f3] text-[#6b7280]"
        }`}
      >
        {rank <= 3 ? <Trophy className="h-3.5 w-3.5" /> : rank}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-[13px] font-semibold text-[#000000] truncate">{name}</h3>
        <p className="text-[10px] text-[#8a90a0] font-medium mt-0.5">{server}</p>
      </div>

      <span className="text-[12px] font-bold text-[#10b981] shrink-0">{amountLabel}</span>
    </div>
  );
}
