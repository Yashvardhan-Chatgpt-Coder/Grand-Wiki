import { createFileRoute } from "@tanstack/react-router";
import { OrganizerLayout } from "@/components/dashboard/OrganizerLayout";
import { SoftwareHeader } from "@/components/dashboard/SoftwareHeader";
import { CriminalCodeContent } from "@/components/CriminalCodeContent";

export const Route = createFileRoute("/government/en2/criminal-code")({
  head: () => ({
    meta: [{ title: "Code of Criminal and Misdemeanour Law | Government Legislation | Grand Wiki" }],
  }),
  component: CriminalCodePage,
});

function CriminalCodePage() {
  return (
    <OrganizerLayout header={<SoftwareHeader title="Code of Criminal and Misdemeanour Law" />}>
      <div className="flex min-w-0 flex-1 flex-col min-h-0">
        <main className="min-h-0 flex-1 overflow-y-auto bg-[#fcfdfd] dark:bg-[#0c0d12] px-8 py-8">
          <div className="mx-auto max-w-[900px]">
            <CriminalCodeContent />
          </div>
        </main>
      </div>
    </OrganizerLayout>
  );
}
