import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { OrganizerLayout } from "@/components/dashboard/OrganizerLayout";
import { SoftwareHeader } from "@/components/dashboard/SoftwareHeader";

export const Route = createFileRoute("/government/en2/templates")({
  head: () => ({
    meta: [{ title: "Government Templates - EN2 | Grand Wiki" }],
  }),
  component: GovernmentTemplatesPage,
});

function GovernmentTemplatesPage() {
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  const templateDocs = [
    {
      title: "Civil Case",
      image: "/Government Templates/Civil Case.jpg",
      download: "/Government Templates/TEMPLATE Civil Case [Date]-[Plaintiff Name]-CF.docx"
    },
    {
      title: "Criminal Case",
      image: "/Government Templates/Criminal Case.jpg",
      download: "/Government Templates/TEMPLATE Criminal Case [Date]-[Defendant Name]-CF.docx"
    },
    {
      title: "Motion To The Court",
      image: "/Government Templates/Motion To The Court.jpg",
      download: "/Government Templates/TEMPLATE Motion to the Court [DATE]-[CASE FILE OR DOCUMENT DETAILS].docx"
    },
    {
      title: "Subpeona",
      image: "/Government Templates/Subpeona.jpg",
      download: "/Government Templates/TEMPLATE Subpoena [date]-DOJ-[name]-SI.docx"
    },
    {
      title: "Warrant",
      image: "/Government Templates/Warrant.jpg",
      download: "/Government Templates/TEMPLATE Warrant [date]-[your org]-[defendant name]-WA.docx"
    },
  ];

  const handleDownload = async (e: React.MouseEvent, downloadUrl: string, index: number) => {
    e.preventDefault();
    if (loadingIndex !== null) return;
    setLoadingIndex(index);

    try {
      const response = await fetch(encodeURI(downloadUrl));
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.statusText}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      const fileName = decodeURIComponent(downloadUrl.split('/').pop() || 'document.docx');
      link.download = fileName;
      document.body.appendChild(link);
      
      // Delay slightly before revoking URL so browser handles click event
      link.click();
      document.body.removeChild(link);
      
      // Wait a moment for browser download popup window to launch
      await new Promise((resolve) => setTimeout(resolve, 100));
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setLoadingIndex(null);
    }
  };

  return (
    <OrganizerLayout header={<SoftwareHeader title="Government Document Templates - EN2" />}>
      <div className="flex min-w-0 flex-1 flex-col min-h-0">
        <main className="relative min-h-0 flex-1 overflow-y-auto px-8 pb-8 pt-6">
          <div className="space-y-6">
            <h2 className="text-[20px] font-semibold text-[#000000]">Document Templates (EN2)</h2>
            <div className="grid grid-cols-4 gap-4">
              {templateDocs.map((doc, index) => (
                <button
                  key={index}
                  onClick={(e) => handleDownload(e, doc.download, index)}
                  disabled={loadingIndex === index}
                  className="group relative aspect-[210/297] overflow-hidden rounded-[8px] border border-[#e2e5ec] cursor-pointer block text-left"
                >
                  <img
                    src={doc.image}
                    alt={doc.title}
                    className="h-full w-full object-cover"
                  />
                  {/* Dark overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                  {/* Loading overlay */}
                  {loadingIndex === index && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-white text-[13px] font-medium flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Downloading...
                      </div>
                    </div>
                  )}
                  {/* Black gradient vignette at bottom */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0c0d12]/95 via-[#0c0d12]/60 to-transparent p-4 pt-12">
                    <h3 className="text-[16px] font-bold text-white tracking-tight">
                      {doc.title}
                    </h3>
                  </div>
                  {/* Click to download text on hover */}
                  {loadingIndex !== index && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-white text-[13px] font-medium">
                        Click to download
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </OrganizerLayout>
  );
}
