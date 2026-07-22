import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useSidebarCollapsed } from "@/hooks/use-sidebar-collapsed";

type SidebarBrandProps = {
  className?: string;
};

export function SidebarBrand({ className }: SidebarBrandProps) {
  const { collapsed } = useSidebarCollapsed();

  return (
    <Link
      to="/"
      className={cn(
        "es-sidebar-brand relative flex h-[72px] shrink-0 flex-col items-center justify-center border-b border-r border-[#e5e7ef] bg-white transition-[width] duration-300 ease-in-out overflow-hidden cursor-pointer",
        collapsed ? "w-[72px]" : "w-[260px]",
        className,
      )}
    >
      {/* Full logo — fades out when collapsed */}
      <img
        src="/Brand/Logo.png"
        alt="Grand Wiki"
        className={cn(
          "absolute max-w-[240px] w-auto object-contain transition-opacity duration-300 ease-in-out",
          "h-[62px]",
          collapsed ? "opacity-0 pointer-events-none" : "opacity-100",
        )}
      />

      {/* Compact logo — fades in when collapsed */}
      <img
        src="/Brand/Favicon.png"
        alt="Grand Wiki"
        className={cn(
          "absolute w-auto object-contain transition-opacity duration-300 ease-in-out",
          collapsed ? "h-9 opacity-100" : "h-9 opacity-0 pointer-events-none",
        )}
      />
    </Link>
  );
}
