import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { SidebarBrand } from "@/components/dashboard/SidebarBrand";

type OrganizerLayoutProps = {
  header: React.ReactNode;
  children: React.ReactNode;
};

export function OrganizerLayout({ header, children }: OrganizerLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const previousIndexRef = useRef(0);
  const [pageDirection, setPageDirection] = useState(1);

  const pageIndex = (() => {
    if (location.pathname === "/") return 0;
    if (location.pathname.startsWith("/events")) return 1;
    if (location.pathname.startsWith("/scoring-rules")) return 2;
    if (location.pathname.startsWith("/teams")) return 3;
    return previousIndexRef.current;
  })();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate({ to: "/login" });
      return;
    }

  }, [navigate]);

  useEffect(() => {
    const previousIndex = previousIndexRef.current;
    setPageDirection(pageIndex >= previousIndex ? 1 : -1);
    previousIndexRef.current = pageIndex;
  }, [pageIndex]);

  return (
    <div className="es-app-shell h-screen overflow-hidden bg-[#f7f8fb] text-[#000000]">
      <div className="flex h-screen">
        <div className="flex h-screen shrink-0 flex-col">
          <SidebarBrand />
          <AppSidebar />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          {header}
          <AnimatePresence mode="wait" initial={false} custom={pageDirection}>
            <motion.div
              key={location.pathname}
              custom={pageDirection}
              initial={{ opacity: 0, y: pageDirection > 0 ? 28 : -28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: pageDirection > 0 ? -28 : 28 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="flex min-h-0 flex-1 flex-col"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
