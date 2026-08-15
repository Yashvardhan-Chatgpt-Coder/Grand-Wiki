import { createFileRoute, Link } from "@tanstack/react-router";
import { OrganizerLayout } from "@/components/dashboard/OrganizerLayout";
import { SoftwareHeader } from "@/components/dashboard/SoftwareHeader";

export const Route = createFileRoute("/government/en2/legislation")({
  head: () => ({
    meta: [{ title: "Government Legislation - EN2 | Grand Wiki" }],
  }),
  component: GovernmentLegislationPage,
});

function GovernmentLegislationPage() {
  const legislationDocs = [
    { title: "Lawyer Code", image: "/Legislation/Lawyer Code.png", link: "/government/en2/lawyer-code" },
    { title: "Criminal Code", image: "/Legislation/Criminal Code.png", link: "/government/en2/criminal-code" },
    { title: "Tax Code", image: "/Legislation/Tax Code.png", link: "/government/en2/tax-code" },
    { title: "Finance Code", image: "/Legislation/Finance Code.png", link: "/government/en2/finance-code" },
    { title: "Firearms Code", image: "/Legislation/Firearms Code.png", link: "/government/en2/firearms-code" },
    { title: "Immunity Code", image: "/Legislation/Immunity Code.png", link: "/government/en2/immunity-code" },
    { title: "Evidence Code", image: "/Legislation/Evidence Code.png", link: "/government/en2/evidence-code" },
  ];

  return (
    <OrganizerLayout header={<SoftwareHeader title="Government Legislation - EN2" />}>
      <div className="flex min-w-0 flex-1 flex-col min-h-0">
        <main className="relative min-h-0 flex-1 overflow-y-auto px-8 pb-8 pt-6">
          <div className="space-y-6">
            <h2 className="text-[20px] font-semibold text-[#000000]">Legislation (EN2)</h2>
            <div className="grid grid-cols-4 gap-4">
              {legislationDocs.map((doc, index) => {
                const cardContent = (
                  <div className="group relative aspect-[210/297] overflow-hidden rounded-[8px] border border-[#e2e5ec] cursor-pointer">
                    <img
                       src={doc.image}
                      alt={doc.title}
                      className="h-full w-full object-cover"
                    />
                    {/* Dark overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                    {/* Black gradient vignette at bottom */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0c0d12]/95 via-[#0c0d12]/60 to-transparent p-4 pt-12">
                      <h3 className="text-[16px] font-bold text-white tracking-tight">
                        {doc.title}
                      </h3>
                    </div>
                  </div>
                );

                if (doc.link) {
                  return (
                    <Link key={index} to={doc.link} className="block">
                      {cardContent}
                    </Link>
                  );
                }

                return <div key={index}>{cardContent}</div>;
              })}
            </div>
          </div>
        </main>
      </div>
    </OrganizerLayout>
  );
}
