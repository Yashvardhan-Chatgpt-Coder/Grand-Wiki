import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export function TopAnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="top-announcement-bar"
          initial={{ height: 36, opacity: 1, y: 0 }}
          animate={{ height: 36, opacity: 1, y: 0 }}
          exit={{
            height: 0,
            y: -36,
            opacity: 0,
            transition: {
              height: { duration: 0.32, ease: [0.32, 0.72, 0, 1] },
              y: { duration: 0.32, ease: [0.32, 0.72, 0, 1] },
              opacity: { duration: 0.2, ease: "easeInOut" },
            },
          }}
          className="relative z-50 w-full shrink-0 overflow-hidden select-none"
          style={{
            backgroundColor: "#151113",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div className="relative flex h-[36px] w-full items-center justify-center px-10">
            {/* Centered announcement text */}
            <span
              className="text-[12.5px] font-medium tracking-[0.02em]"
              style={{ color: "rgba(255, 255, 255, 0.92)" }}
            >
              Powered By <span className="font-semibold text-white">Baba Group</span>
            </span>

            {/* Cross button on the very right side */}
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Close bar"
              className="group absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-md transition-colors duration-150 hover:bg-white/10 focus:outline-none"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              <X className="h-3.5 w-3.5 transition-transform duration-150 group-hover:scale-110 group-hover:text-white" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
