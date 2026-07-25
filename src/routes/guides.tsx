import { useMemo, useState } from "react";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { OrganizerLayout } from "@/components/dashboard/OrganizerLayout";
import { SoftwareHeader } from "@/components/dashboard/SoftwareHeader";

export const Route = createFileRoute("/guides")({
  head: () => ({
    meta: [{ title: "Guides | Grand Wiki" }],
  }),
  component: GuidesPage,
});

type GuideItem = {
  id: string;
  title: string;
  image: string;
};

const GUIDES: GuideItem[] = [
  {
    id: "introduction-to-lspd",
    title: "Introduction To LSPD",
    image: "/Guides/Introduction To LSPD.png",
  },
];

function GuidesPage() {
  const location = useLocation();
  const [search, setSearch] = useState("");
  const filteredGuides = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return GUIDES;
    return GUIDES.filter((guide) => guide.title.toLowerCase().includes(q));
  }, [search]);

  if (location.pathname !== "/guides" && location.pathname !== "/guides/") {
    return <Outlet />;
  }

  return (
    <OrganizerLayout header={<SoftwareHeader title="Guides" />}>
      <div className="flex min-w-0 flex-1 flex-col min-h-0 bg-[#f7f8fb] text-[#000000]">
        <header className="shrink-0 border-b border-[#e7e9f0] bg-white px-8 py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-[30px] font-semibold text-[#000000] leading-none">Guides</h1>
              <p className="mt-2 max-w-2xl text-[13px] text-[#666666]">
                Browse the available guides and open the one you need.
              </p>
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
          <div className="mb-5 max-w-xl">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a90a0]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search guides..."
                className="h-11 w-full rounded-[10px] border border-[#e2e5ec] bg-white pl-11 pr-11 text-[13px] outline-none placeholder:text-[#9aa1b0] focus:border-[#000000]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8a90a0] hover:text-[#000000] transition-colors"
                  aria-label="Clear search"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </label>
          </div>

          {filteredGuides.length === 0 ? (
            <div className="rounded-[10px] border border-dashed border-[#d8dde6] bg-white px-6 py-10 text-center">
              <p className="text-[15px] font-semibold text-[#000000]">No guides found</p>
              <p className="mt-2 text-[13px] text-[#8a90a0]">Try a different search term.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredGuides.map((guide) => (
                <Link
                  key={guide.id}
                  to="/guides/$guideId"
                  params={{ guideId: guide.id }}
                  className="group block cursor-pointer overflow-hidden rounded-[8px] border border-[#e2e5ec] bg-white transition-colors hover:bg-[#fcfcfd]"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img
                      src={guide.image}
                      alt={guide.title}
                      className="h-full w-full object-cover transition-opacity duration-200 group-hover:opacity-95"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <h2 className="text-[18px] font-semibold leading-tight text-white">
                        {guide.title}
                      </h2>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </OrganizerLayout>
  );
}
