import { createFileRoute } from "@tanstack/react-router";
import { OrganizerLayout } from "@/components/dashboard/OrganizerLayout";
import { SoftwareHeader } from "@/components/dashboard/SoftwareHeader";
import { Info } from "lucide-react";

export const Route = createFileRoute("/vehicle-ticketing/en3")({
  head: () => ({
    meta: [{ title: "Vehicle Ticketing Tool - EN3 | Grand Wiki" }],
  }),
  component: VehicleTicketingPage,
});

function VehicleTicketingPage() {
  return (
    <OrganizerLayout header={<SoftwareHeader title="Vehicle Ticketing Tool - EN3" />}>
      <div className="flex min-w-0 flex-1 flex-col min-h-0">
        <header className="shrink-0 border-b border-[#e7e9f0] bg-white px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <h1 className="text-[30px] font-semibold text-[#000000] leading-none">Vehicle Ticketing Tool - EN3</h1>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-8">
          <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center justify-center gap-6 py-20">
            <div className="rounded-full bg-[#f0f1f3] p-6">
              <Info className="h-12 w-12 text-[#8a93a3]" />
            </div>
            <div className="text-center">
              <h2 className="text-[24px] font-bold text-[#000000]">Coming Soon</h2>
              <p className="mt-2 text-[14px] text-[#666666] max-w-[500px]">
                EN #3 Vehicle Ticketing Tool is currently under development and will be available soon.
              </p>
            </div>
          </div>
        </main>
      </div>
    </OrganizerLayout>
  );
}
