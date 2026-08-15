import { createFileRoute } from "@tanstack/react-router";
import { OrganizerLayout } from "@/components/dashboard/OrganizerLayout";
import { SoftwareHeader } from "@/components/dashboard/SoftwareHeader";
import { EvidenceCodeContent } from "@/components/EvidenceCodeContent";

export const Route = createFileRoute("/government/en2/evidence-code")({
  head: () => ({
    meta: [{ title: "Code of Evidence and Judicial Procedure | Government Legislation | Grand Wiki" }],
  }),
  component: EvidenceCodePage,
});

function EvidenceCodePage() {
  return (
    <OrganizerLayout header={<SoftwareHeader title="Code of Evidence and Judicial Procedure" />}>
      <div className="flex min-w-0 flex-1 flex-col min-h-0">
        <main className="min-h-0 flex-1 overflow-y-auto bg-[#fcfdfd] dark:bg-[#0c0d12] px-8 py-8">
          <div className="mx-auto max-w-[900px]">
            <EvidenceCodeContent />
          </div>
        </main>
      </div>
    </OrganizerLayout>
  );
}
