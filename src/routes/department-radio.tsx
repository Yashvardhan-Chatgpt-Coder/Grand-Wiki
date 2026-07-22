import { createFileRoute } from "@tanstack/react-router";
import { OrganizerLayout } from "@/components/dashboard/OrganizerLayout";
import { SoftwareHeader } from "@/components/dashboard/SoftwareHeader";
import { DepartmentCommands } from "@/components/dashboard/DepartmentCommands";

export const Route = createFileRoute("/department-radio")({
  head: () => ({
    meta: [{ title: "Department Radio | Grand Wiki" }],
  }),
  component: DepartmentRadioPage,
});

function DepartmentRadioPage() {
  return (
    <OrganizerLayout header={<SoftwareHeader title="Department Radio" />}>
      <div className="flex min-w-0 flex-1 flex-col min-h-0">
        <header className="shrink-0 border-b border-[#e7e9f0] bg-white px-8 py-6">
          <div className="flex items-center gap-3">
            <h1 className="text-[30px] font-semibold text-[#000000]">Department Radio</h1>
          </div>
        </header>
        <main className="relative min-h-0 flex-1 overflow-y-auto px-8 pb-8 pt-0">
          <DepartmentCommands />
        </main>
      </div>
    </OrganizerLayout>
  );
}
