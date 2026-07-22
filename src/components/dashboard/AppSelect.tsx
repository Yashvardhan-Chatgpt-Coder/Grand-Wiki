import { useEffect, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronDown } from "lucide-react";

type AppSelectOption = {
  label: string;
  value: string;
  iconUrl?: string;
};

type AppSelectProps = {
  value: string;
  options: AppSelectOption[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  compact?: boolean;
};

export function AppSelect({
  value,
  options,
  placeholder = "Select option",
  onChange,
  className = "",
  disabled = false,
  compact = false,
}: AppSelectProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const typeaheadRef = useRef({ query: "", timeout: null as ReturnType<typeof setTimeout> | null });
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const idx = options.findIndex((option) => option.value === value);
    setHighlightedIndex(idx >= 0 ? idx : 0);
  }, [open, options, value]);

  useEffect(() => {
    if (!open) return;
    optionRefs.current[highlightedIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, open]);

  const clearTypeahead = () => {
    if (typeaheadRef.current.timeout) {
      clearTimeout(typeaheadRef.current.timeout);
    }
    typeaheadRef.current.query = "";
    typeaheadRef.current.timeout = null;
  };

  const findTypeaheadMatch = (query: string, startIndex = 0) => {
    const normalized = query.toLowerCase();
    const len = options.length;
    for (let offset = 0; offset < len; offset += 1) {
      const index = (startIndex + offset) % len;
      const option = options[index];
      if (
        option.label.toLowerCase().startsWith(normalized) ||
        option.value.toLowerCase().startsWith(normalized)
      ) {
        return index;
      }
    }
    return -1;
  };

  const selectIndex = (index: number, close = false) => {
    const option = options[index];
    if (!option) return;
    setHighlightedIndex(index);
    onChange(option.value);
    if (close) setOpen(false);
  };

  const handleTypeahead = (char: string) => {
    const lower = char.toLowerCase();
    const prevQuery = typeaheadRef.current.query;

    if (prevQuery === lower && lower.length === 1) {
      const matchIndex = findTypeaheadMatch(lower, highlightedIndex + 1);
      if (matchIndex >= 0) selectIndex(matchIndex);
    } else {
      const nextQuery = prevQuery + lower;
      let matchIndex = findTypeaheadMatch(nextQuery);

      if (matchIndex < 0 && prevQuery) {
        matchIndex = findTypeaheadMatch(lower, highlightedIndex + 1);
        typeaheadRef.current.query = matchIndex >= 0 ? lower : "";
      } else {
        typeaheadRef.current.query = matchIndex >= 0 ? nextQuery : "";
      }

      if (matchIndex >= 0) {
        selectIndex(matchIndex);
      }
    }

    if (typeaheadRef.current.timeout) {
      clearTimeout(typeaheadRef.current.timeout);
    }
    typeaheadRef.current.timeout = setTimeout(clearTypeahead, 700);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    if (!open) {
      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        setOpen(true);
        return;
      }
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        setOpen(true);
        handleTypeahead(event.key);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % options.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + options.length) % options.length);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setHighlightedIndex(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setHighlightedIndex(Math.max(options.length - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      selectIndex(highlightedIndex, true);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      clearTypeahead();
      setOpen(false);
      return;
    }

    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      handleTypeahead(event.key);
    }
  };

  return (
    <div className={className}>
      <Popover.Root
        open={disabled ? false : open}
        onOpenChange={(nextOpen) => {
          if (disabled) return;
          if (!nextOpen) clearTypeahead();
          setOpen(nextOpen);
        }}
      >
        <Popover.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            onKeyDown={handleKeyDown}
            className={`flex w-full items-center justify-between border border-[#e2e5ec] rounded-[6px] font-normal outline-none transition-all duration-200 ${
              compact
                ? "h-8 px-2.5 text-[12px]"
                : "h-9 px-3 text-[13px]"
            } ${
              disabled
                ? "cursor-not-allowed bg-[#f4f6fa] text-[#9aa1b0]"
                : "cursor-pointer bg-white text-[#000000] hover:border-[#b0b7c3] focus:border-[#000000]"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              {selectedOption?.iconUrl && (
                <img src={selectedOption.iconUrl} alt="" className="h-3.5 w-5 object-contain rounded-xs shrink-0" />
              )}
              <span
                className={`min-w-0 truncate ${
                  disabled ? "text-[#9aa1b0]" : selectedOption ? "text-[#000000]" : "text-[#9aa1b0]"
                }`}
              >
                {selectedOption?.label ?? placeholder}
              </span>
            </div>
            <ChevronDown
              className={`text-[#9aa1b0] transition-transform duration-200 ${
                compact ? "h-3.5 w-3.5" : "h-4 w-4"
              } ${open ? "rotate-180" : ""}`}
            />
          </button>
        </Popover.Trigger>

        <AnimatePresence>
          {open && (
            <Popover.Portal forceMount>
              <Popover.Content
                align="start"
                side="bottom"
                sideOffset={8}
                avoidCollisions={false}
                asChild
                onKeyDown={handleKeyDown}
                className="z-[90]"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -6 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  onWheel={(event) => event.stopPropagation()}
                  onTouchMove={(event) => event.stopPropagation()}
                  className="rg-dropdown-menu rg-dropdown-menu-radius-8 origin-top min-w-[var(--radix-popover-trigger-width)] w-[var(--radix-popover-trigger-width)] max-h-[220px] overflow-y-auto overscroll-contain will-change-transform"
                >
                    {options.map((option, index) => (
                      <button
                        key={option.value}
                        ref={(node) => {
                          optionRefs.current[index] = node;
                        }}
                        type="button"
                        data-highlighted={index === highlightedIndex ? "true" : undefined}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        onClick={() => {
                          onChange(option.value);
                          clearTypeahead();
                          setOpen(false);
                        }}
                        className="flex w-full cursor-pointer items-center justify-between rounded-[4px] px-2.5 py-1.5 text-[13px] font-medium text-[#1f2937] outline-none transition-colors hover:bg-[#f3f4f6] hover:text-[#000000] data-[highlighted='true']:bg-[#f3f4f6] data-[highlighted='true']:text-[#000000]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {option.iconUrl && (
                            <img src={option.iconUrl} alt="" className="h-3.5 w-5 object-contain rounded-xs shrink-0" />
                          )}
                          <span className="truncate">{option.label}</span>
                        </div>
                        {option.value === value && (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-current" />
                        )}
                      </button>
                    ))}
                </motion.div>
              </Popover.Content>
            </Popover.Portal>
          )}
        </AnimatePresence>
      </Popover.Root>
    </div>
  );
}
