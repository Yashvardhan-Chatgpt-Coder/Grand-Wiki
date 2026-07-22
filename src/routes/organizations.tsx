import { createFileRoute, Navigate } from "@tanstack/react-router";
import { OrganizerLayout } from "@/components/dashboard/OrganizerLayout";
import { SoftwareHeader } from "@/components/dashboard/SoftwareHeader";
import { FIBCommands } from "@/components/dashboard/FIBCommands";

export const Route = createFileRoute("/organizations")({
  head: () => ({
    meta: [{ title: "Organizations | Grand Wiki" }],
  }),
  component: OrganizationsPage,
});

const ORG_FULL_NAMES: Record<string, string> = {
  lspd: "Los Santos Police Department",
  fib: "Federal Investigation Bureau",
  sahp: "San Andreas Highway Patrol",
  ng: "National Guard",
  government: "Government",
  ems: "Emergency Medical Services",
  lifeinvader: "Lifeinvader"
};

const ORG_LOGOS: Record<string, string> = {
  lspd: "LSPD.png",
  fib: "FIB.webp",
  sahp: "SAHP.png",
  ng: "NG.png",
  government: "Government.png",
  ems: "EMS.png",
  lifeinvader: "Lifeinvader.png"
};

function OrganizationsPage() {
  const { org } = Route.useSearch<{ org?: string }>() as { org?: string };
  const orgKey = org?.toLowerCase() || "";

  if (orgKey === "department") {
    return <Navigate to="/department-radio" replace />;
  }

  const orgName = ORG_FULL_NAMES[orgKey] || org?.toUpperCase() || "ORGANIZATIONS";

  return (
    <OrganizerLayout header={<SoftwareHeader title="Organizations" />}>
      <div className="flex min-w-0 flex-1 flex-col min-h-0">
        <header className="shrink-0 border-b border-[#e7e9f0] bg-white px-8 py-6">
          <div className="flex items-center gap-3">
            {orgKey && ORG_LOGOS[orgKey] && (
              <img
                src={`/Organization Logos/${ORG_LOGOS[orgKey]}`}
                alt={`${orgName} Logo`}
                className="h-14 w-14 object-contain shrink-0"
              />
            )}
            <h1 className="text-[30px] font-semibold text-[#000000]">{orgName}</h1>
          </div>
        </header>
        <main className="relative min-h-0 flex-1 overflow-y-auto px-8 pb-8 pt-0">
          {["fib", "lspd", "sahp", "ng", "government"].includes(orgKey) && (
            <FIBCommands
              orgLabel={
                orgKey === "government"
                  ? "GOV"
                  : orgKey === "fib"
                    ? "FIB"
                    : orgKey.toUpperCase()
              }
            />
          )}
        </main>
      </div>
    </OrganizerLayout>
  );
}
