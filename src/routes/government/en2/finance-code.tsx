import { createFileRoute } from "@tanstack/react-router";
import { OrganizerLayout } from "@/components/dashboard/OrganizerLayout";
import { SoftwareHeader } from "@/components/dashboard/SoftwareHeader";
import { FinanceCodeContent } from "@/components/FinanceCodeContent";

export const Route = createFileRoute("/government/en2/finance-code")({
  head: () => ({
    meta: [{ title: "Code of Financial and Audit Law | Government Legislation | Grand Wiki" }],
  }),
  component: FinanceCodePage,
});

function FinanceCodePage() {
  return (
    <OrganizerLayout header={<SoftwareHeader title="Code of Financial and Audit Law" />}>
      <div className="flex min-w-0 flex-1 flex-col min-h-0">
        <main className="min-h-0 flex-1 overflow-y-auto bg-[#fcfdfd] dark:bg-[#0c0d12] px-8 py-8">
          <div className="mx-auto max-w-[900px]">
            <FinanceCodeContent />
          </div>
        </main>
      </div>
    </OrganizerLayout>
  );
}
