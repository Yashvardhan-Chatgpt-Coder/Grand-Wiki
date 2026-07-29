import { createFileRoute } from "@tanstack/react-router";
import { OrganizerLayout } from "@/components/dashboard/OrganizerLayout";
import { SoftwareHeader } from "@/components/dashboard/SoftwareHeader";
import { VehicleTicketingTool } from "@/components/dashboard/VehicleTicketingTool";

export const Route = createFileRoute("/vehicle-ticketing/en2")({
  head: () => ({
    meta: [{ title: "Vehicle Ticketing Tool - EN2 | Grand Wiki" }],
  }),
  component: VehicleTicketingPage,
});

function VehicleTicketingPage() {
  return (
    <OrganizerLayout header={<SoftwareHeader title="Vehicle Ticketing Tool - EN2" />}>
      <div className="flex min-w-0 flex-1 flex-col min-h-0">
        <header className="shrink-0 border-b border-[#e7e9f0] bg-white px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <h1 className="text-[30px] font-semibold text-[#000000] leading-none">Vehicle Ticketing Tool - EN2</h1>
            <p className="text-[12px] font-medium text-[#8a93a3] sm:text-right max-w-[340px] leading-normal">
              This tool is still under development and might not work perfectly. <span className="font-semibold text-[#dc2626]">Double check the results.</span>
            </p>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-8">
          <VehicleTicketingTool server="en2" />
        </main>
      </div>
    </OrganizerLayout>
  );
}
