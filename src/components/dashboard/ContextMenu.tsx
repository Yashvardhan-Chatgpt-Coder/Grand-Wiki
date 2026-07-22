import { useEffect, useRef } from "react";
import { Pin, PinOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  onAction: () => void;
  isPinned: boolean;
}

export function ContextMenu({ x, y, isOpen, onClose, onAction, isPinned }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          style={{ top: y, left: x }}
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          className="fixed z-[9999] w-[160px] rounded-[8px] border border-[#e2e5ec] bg-white p-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.08)] outline-none"
        >
          <button
            type="button"
            onClick={() => {
              onAction();
              onClose();
            }}
            className={cn(
              "flex w-full cursor-pointer items-center gap-2.5 rounded-[8px] px-3 py-2 text-[13px] font-medium text-left transition-colors",
              isPinned
                ? "text-[#ef4444] hover:bg-[#fff5f5]"
                : "text-[#303646] hover:bg-[#f7f8fb] hover:text-[#000000]"
            )}
          >
            {isPinned ? (
              <>
                <PinOff className="h-4 w-4 shrink-0" />
                <span>Unpin</span>
              </>
            ) : (
              <>
                <Pin className="h-4 w-4 shrink-0" />
                <span>Pin</span>
              </>
            )}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
