import { useState, useRef, useEffect } from "react";
import {
  Shield,
  Plus,
  Settings,
  Users,
  LayoutDashboard,
  FileText,
  History,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getFirstName, getIndianTimeGreeting } from "@/lib/utils";
import { IaOrganisation, IaUserRole, IaEmployee } from "@/lib/ia-types";
import { iaDb } from "@/lib/ia-db";
import { cn } from "@/lib/utils";

interface IaHeaderProps {
  activeTab: "dashboard" | "employees" | "reports" | "audit";
  onTabChange: (tab: "dashboard" | "employees" | "reports" | "audit") => void;
  selectedOrgId: string;
  onOrgChange: (orgId: string) => void;
  organisations: IaOrganisation[];
  currentRole: IaUserRole;
  onRoleChange: (role: IaUserRole) => void;
  onOpenNewEmployeeModal: () => void;
  onOpenOrgModal: () => void;
  onSelectEmployee: (emp: IaEmployee) => void;
  employeesCount?: number;
  auditCount?: number;
}

const ORG_LOGOS: Record<string, string> = {
  lspd: "LSPD.png",
  fib: "FIB.webp",
  sahp: "SAHP.png",
  ng: "NG.png",
  government: "Government.png",
  ems: "EMS.png",
  lifeinvader: "Lifeinvader.png",
};

export function IaHeader({
  activeTab,
  onTabChange,
  selectedOrgId,
  onOrgChange,
  organisations,
  currentRole,
  onRoleChange,
  onOpenNewEmployeeModal,
  onOpenOrgModal,
  onSelectEmployee,
  employeesCount = 0,
  auditCount = 0,
}: IaHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const currentOrg = organisations.find((o) => o.id === selectedOrgId);
  const logoFile = selectedOrgId !== "all" ? ORG_LOGOS[selectedOrgId.toLowerCase()] : null;

  // Global search quick filter
  const searchResults = searchQuery.trim()
    ? iaDb.getEmployees({
        searchQuery: searchQuery.trim(),
        organisationId: selectedOrgId,
      })
    : [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRoleToggle = () => {
    const nextRole: IaUserRole =
      currentRole === "admin" ? "ia_member" : currentRole === "ia_member" ? "viewer" : "admin";
    iaDb.setActiveRole(nextRole);
    onRoleChange(nextRole);
  };

  const { displayName } = useCurrentUser();
  const greeting = getIndianTimeGreeting();
  const firstName = getFirstName(displayName);

  return (
    <div className="shrink-0 border-b border-[#e7e9f0] bg-white">
      {/* Top Banner Row */}
      <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight text-[#000000]">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 text-[13px] text-[#666666]">
            Unified wiki database and operational utility console
          </p>
        </div>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add Employee Button */}
          {currentRole !== "viewer" && (
            <button
              type="button"
              onClick={onOpenNewEmployeeModal}
              className="h-[36px] inline-flex items-center gap-1.5 rounded-[8px] bg-[#000000] px-3.5 text-[13px] font-medium text-white hover:bg-[#333] transition-colors shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
