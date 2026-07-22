"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronDown, Search } from "lucide-react";
import { Command } from "cmdk";

type AppSearchSelectOption = {
  label: string;
  value: string;
  icon?: React.ReactNode;
};

type AppSearchSelectProps = {
  value: string;
  options: AppSearchSelectOption[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  compact?: boolean;
};

export function AppSearchSelect({
  value,
  options,
  placeholder = "Select option",
  onChange,
  className = "",
  disabled = false,
  compact = false,
}: AppSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className={className}>
      <Popover.Root
        open={disabled ? false : open}
        onOpenChange={(nextOpen) => !disabled && setOpen(nextOpen)}
      >
        <Popover.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={`flex w-full cursor-pointer items-center justify-between rounded-[6px] border border-[#e2e5ec] bg-white text-[13px] font-normal text-[#000000] outline-none transition-all duration-200 hover:border-[#b0b7c3] focus:border-[#000000] disabled:cursor-not-allowed disabled:bg-[#f4f6fa] disabled:text-[#9aa1b0] ${
              compact ? "h-8 px-2.5" : "h-9 px-3"
            }`}
          >
            <span
              className={`flex min-w-0 items-center ${compact ? "gap-1.5" : "gap-2"} ${
                selectedOption ? "text-[#000000]" : "text-[#9aa1b0]"
              }`}
            >
              {selectedOption?.icon}
              <span className="truncate">{selectedOption?.label ?? placeholder}</span>
            </span>
            <ChevronDown
              className={`h-4 w-4 text-[#9aa1b0] transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>
        </Popover.Trigger>

        <AnimatePresence>
          {open && (
            <Popover.Portal forceMount>
              <Popover.Content
                align="start"
                sideOffset={6}
                collisionPadding={12}
                asChild
                className="z-[90]"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  onWheel={(event) => event.stopPropagation()}
                  onTouchMove={(event) => event.stopPropagation()}
                  className="w-[var(--radix-popover-trigger-width)] min-w-[180px] overflow-hidden rounded-[8px] border border-[#e2e5ec] bg-white shadow-xl"
                >
                  <Command label="Search options" className="flex flex-col h-full bg-white">
                    <div className="flex items-center border-b border-[#f0f1f3] px-3">
                      <Search className="mr-2 h-3.5 w-3.5 shrink-0 text-[#9aa1b0]" />
                      <Command.Input
                        placeholder="Search..."
                        data-no-style
                        className="h-9 w-full border-none bg-transparent text-[13px] text-[#000000] outline-none placeholder:text-[#9aa1b0]"
                      />
                    </div>
                    <Command.List className="max-h-[220px] overflow-y-auto p-1 text-[13px]">
                      <Command.Empty className="py-4 text-center text-[12px] text-[#9aa1b0]">
                        No results found.
                      </Command.Empty>
                      {options.map((option) => (
                        <Command.Item
                          key={option.value}
                          value={option.label}
                          onSelect={() => {
                            onChange(option.value);
                            setOpen(false);
                          }}
                          className="flex w-full cursor-pointer items-center justify-between rounded-[4px] px-2.5 py-1.5 text-[13px] font-medium text-[#1f2937] outline-none transition-colors hover:bg-[#f3f4f6] hover:text-[#000000] data-[selected='true']:bg-[#f3f4f6] data-[selected='true']:text-[#000000]"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            {option.icon}
                            <span className="truncate">{option.label}</span>
                          </div>
                          {value === option.value && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#000000]" />
                          )}
                        </Command.Item>
                      ))}
                    </Command.List>
                  </Command>
                </motion.div>
              </Popover.Content>
            </Popover.Portal>
          )}
        </AnimatePresence>
      </Popover.Root>
    </div>
  );
}
