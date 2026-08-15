import { createFileRoute } from "@tanstack/react-router";
import { OrganizerLayout } from "@/components/dashboard/OrganizerLayout";
import { SoftwareHeader } from "@/components/dashboard/SoftwareHeader";
import { AlertCircle } from "lucide-react";

export const Route = createFileRoute("/government/en1/templates")({
  head: () => ({
    meta: [{ title: "Document Templates - EN1 | Grand Wiki" }],
  }),
  component: ComingSoonPage,
});

function ComingSoonPage() {
  return (
    <OrganizerLayout header={<SoftwareHeader title="Government Document Templates - EN1" />}>
      <div className="flex flex-1 flex-col items-center justify-center p-8 bg-[#fdfdfd] dark:bg-[#0c0d12]">
        <div className="max-w-md text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f0f4f8] dark:bg-[#1a1c23]">
            <AlertCircle className="h-8 w-8 text-[#5c6470]" />
          </div>
          <h1 className="text-[24px] font-bold text-[#1f2937] dark:text-white font-merriweather">Coming Soon</h1>
          <p className="text-[14px] text-[#5c6470] dark:text-[#9aa1b0] leading-relaxed">
            The Government Document Templates database for server EN1 is currently under preparation and will be available in a future system update.
          </p>
        </div>
      </div>
    </OrganizerLayout>
  );
}
