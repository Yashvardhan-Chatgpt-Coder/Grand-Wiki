import { createFileRoute } from "@tanstack/react-router";
import { OrganizerLayout } from "@/components/dashboard/OrganizerLayout";
import { SoftwareHeader } from "@/components/dashboard/SoftwareHeader";
import { ImmunityCodeContent } from "@/components/ImmunityCodeContent";

export const Route = createFileRoute("/government/en2/immunity-code")({
  head: () => ({
    meta: [{ title: "Code of Immunity and Privilege | Government Legislation | Grand Wiki" }],
  }),
  component: ImmunityCodePage,
});

function ImmunityCodePage() {
  return (
    <OrganizerLayout header={<SoftwareHeader title="Code of Immunity and Privilege" />}>
      <div className="flex min-w-0 flex-1 flex-col min-h-0">
        <main className="min-h-0 flex-1 overflow-y-auto bg-[#fcfdfd] dark:bg-[#0c0d12] px-8 py-8">
          <div className="mx-auto max-w-[900px]">
            <ImmunityCodeContent />
          </div>
        </main>
      </div>
    </OrganizerLayout>
  );
}
