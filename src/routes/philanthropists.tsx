import { createFileRoute } from "@tanstack/react-router";
import { OrganizerLayout } from "@/components/dashboard/OrganizerLayout";
import { PhilanthropistsPage } from "@/components/dashboard/PhilanthropistsPage";
import { SoftwareHeader } from "@/components/dashboard/SoftwareHeader";

export const Route = createFileRoute("/philanthropists")({
  head: () => ({
    meta: [{ title: "Supporters | Grand Wiki" }],
  }),
  component: PhilanthropistsRoute,
});

function PhilanthropistsRoute() {
  return (
    <OrganizerLayout header={<SoftwareHeader title="Supporters" />}>
      <main className="min-h-0 flex-1 overflow-y-auto">
        <PhilanthropistsPage />
      </main>
    </OrganizerLayout>
  );
}
