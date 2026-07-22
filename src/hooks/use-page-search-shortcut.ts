import { useEffect, type RefObject } from "react";

/** Shown in page search placeholders, e.g. "Search… (Ctrl H)" */
export const PAGE_SEARCH_SHORTCUT_HINT = "Ctrl H";

/**
 * Focuses a page-level search input on Ctrl+H (overrides the browser History shortcut).
 */
export function usePageSearchShortcut(inputRef: RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (!event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      if (event.key.toLowerCase() !== "h") return;

      // Always consume so the browser History UI never opens.
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();

      const input = inputRef.current;
      if (!input || input.disabled || input.readOnly) return;

      input.focus();
      input.select();
    };

    window.addEventListener("keydown", handleShortcut, true);
    return () => window.removeEventListener("keydown", handleShortcut, true);
  }, [inputRef]);
}
