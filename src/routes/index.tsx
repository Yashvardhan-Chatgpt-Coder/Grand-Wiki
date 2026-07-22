import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { OrganizerLayout } from "@/components/dashboard/OrganizerLayout";
import { SoftwareHeader } from "@/components/dashboard/SoftwareHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Home | Grand Wiki" }],
  }),
  component: Index,
});

function Index() {
  return (
    <OrganizerLayout header={<SoftwareHeader title="Home" />}>
      <main className="min-h-0 flex-1 overflow-y-auto">
        <Dashboard />
      </main>
    </OrganizerLayout>
  );
}
