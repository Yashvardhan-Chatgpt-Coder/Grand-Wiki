import { createFileRoute } from "@tanstack/react-router";
import { OrganizerLayout } from "@/components/dashboard/OrganizerLayout";
import { SoftwareHeader } from "@/components/dashboard/SoftwareHeader";

export const Route = createFileRoute("/qna")({
  head: () => ({
    meta: [{ title: "Questions & Answers | Grand Wiki" }],
  }),
  component: QnaPage,
});

function QnaPage() {
  const { cat } = Route.useSearch<{ cat?: string }>() as { cat?: string };
  const categoryName = cat ? cat.toUpperCase() : "GENERAL";

  return (
    <OrganizerLayout header={<SoftwareHeader title="Questions & Answers" />}>
      <div className="flex min-w-0 flex-1 flex-col min-h-0">
        <header className="shrink-0 border-b border-[#e7e9f0] bg-white px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-[30px] font-semibold text-[#000000]">{categoryName} Questions</h1>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-8">
          {/* Content goes here */}
        </main>
      </div>
    </OrganizerLayout>
  );
}
