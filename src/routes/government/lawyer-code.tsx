import { createFileRoute, Link } from "@tanstack/react-router";
import { OrganizerLayout } from "@/components/dashboard/OrganizerLayout";
import { SoftwareHeader } from "@/components/dashboard/SoftwareHeader";
import { ArrowLeft } from "lucide-react";
import { LawyerCodeContent } from "@/components/LawyerCodeContent";

export const Route = createFileRoute("/government/lawyer-code")({
  head: () => ({
    meta: [{ title: "Code of Lawyers and Judicial Law | Government Legislation | Grand Wiki" }],
  }),
  component: LawyerCodePage,
});

function LawyerCodePage() {
  return (
    <OrganizerLayout header={<SoftwareHeader title="Code of Lawyers and Judicial Law" />}>
      <div className="flex min-w-0 flex-1 flex-col min-h-0">
        {/* Content - directly on page without card container */}
        <main className="min-h-0 flex-1 overflow-y-auto bg-[#fcfdfd] dark:bg-[#0c0d12] px-8 py-8">
          <div className="mx-auto max-w-[900px]">
            <LawyerCodeContent />
          </div>
        </main>
      </div>
    </OrganizerLayout>
  );
}
