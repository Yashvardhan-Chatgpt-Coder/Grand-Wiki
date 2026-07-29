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
        {/* Header with back button */}
        <header className="shrink-0 border-b border-[#232630] bg-[#0c0d12] px-8 py-4">
          <div className="flex items-center gap-3">
            <Link
              to="/government/legislation"
              className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#2b303c] text-[#a0a5b5] hover:bg-[#1a1d26] hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-[24px] font-semibold text-white">The Code of Lawyers and Judicial Law</h1>
          </div>
        </header>

        {/* Content - directly on page without card container */}
        <main className="min-h-0 flex-1 overflow-y-auto bg-[#0c0d12] px-8 py-8">
          <div className="mx-auto max-w-[900px]">
            <LawyerCodeContent />
          </div>
        </main>
      </div>
    </OrganizerLayout>
  );
}
