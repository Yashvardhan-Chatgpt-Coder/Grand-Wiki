import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Info,
  Heart,
  BookOpen,
} from "lucide-react";
import { PhilanthropistListItem } from "@/components/dashboard/PhilanthropistListItem";
import { useCurrentUser } from "@/hooks/use-current-user";
import { formatDonationAmount, formatServerNames } from "@/lib/philanthropists";
import { getFirstName, getIndianTimeGreeting } from "@/lib/utils";
import { donationsApi } from "@/lib/api";

interface WhatsNewItem {
  id: string;
  tag: string;
  title: string;
  description: string;
  time: string;
  url: string;
}

interface GuideCard {
  id: string;
  title: string;
  image: string;
}

const GUIDES: GuideCard[] = [
  {
    id: "how-to-process-a-10-15",
    title: "How To Process A 10-15",
    image: "/Guides/How to arrest a 10-15.png"
  }
  // Add more guides here as they're created
];

export function Dashboard() {
  const { displayName } = useCurrentUser();
  const greeting = getIndianTimeGreeting();
  const firstName = getFirstName(displayName);

  const [topPhilanthropists, setTopPhilanthropists] = useState<Array<{
    id: string;
    rank: number;
    name: string;
    server: string;
    amountLabel: string;
  }>>([]);

  useEffect(() => {
    donationsApi.getPublic().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        const map = new Map<string, { id: string; name: string; amount: number; servers: string[] }>();

        data.forEach((d) => {
          const key = (d.name || "").trim();
          if (!key) return;
          const amt = Number(d.amount) || 0;

          const existing = map.get(key);
          if (existing) {
            existing.amount += amt;
            if (d.server) existing.servers.push(d.server);
          } else {
            map.set(key, {
              id: d._id || d.id,
              name: key,
              amount: amt,
              servers: d.server ? [d.server] : ["EN1"]
            });
          }
        });

        const sorted = Array.from(map.values())
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5)
          .map((item, idx) => ({
            id: item.id,
            rank: idx + 1,
            name: item.name,
            server: formatServerNames(item.servers),
            amountLabel: formatDonationAmount(item.amount)
          }));

        setTopPhilanthropists(sorted);
      }
    }).catch((err) => {
      console.error(err);
    });
  }, []);

  // Professional updates list
  const [whatsNewList] = useState<WhatsNewItem[]>([
    {
      id: "1",
      tag: "TOOL",
      title: "Vehicle Ticketing Tool",
      description: "Complete vehicle ticketing system with tax multipliers and penalty points tracking.",
      time: "Today",
      url: "/vehicle-ticketing"
    },
    {
      id: "2",
      tag: "GUIDE",
      title: "Patrolman's Guide",
      description: "Essential patrol procedures, radio codes, and field operations handbook.",
      time: "Today",
      url: "/patrolman-guide"
    },
    {
      id: "3",
      tag: "REFERENCE",
      title: "Department Radio",
      description: "Official radio frequencies and communication protocols for all departments.",
      time: "Today",
      url: "/department-radio"
    }
  ]);

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 p-8">
      {/* Page Header */}
      <div>
        <h1 className="text-[24px] font-semibold tracking-tight text-[#000000]">
          {greeting}, {firstName}
        </h1>
        <p className="mt-1 text-[13px] text-[#666666]">
          Unified wiki database and operational utility console
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Featured & What's New */}
        <div className="lg:col-span-2 space-y-6">
          {/* Guides Section */}
          <div>
            <div className="grid gap-4 grid-cols-1">
              {GUIDES.slice(0, 5).map((guide) => (
                <Link
                  key={guide.id}
                  to={`/guides/${guide.id}`}
                  className="group relative h-[280px] overflow-hidden rounded-[10px] border border-[#e2e5ec]"
                >
                  <img
                    src={guide.image}
                    alt={guide.title}
                    className="h-full w-full object-cover"
                  />
                  {/* White overlay on hover */}
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                  {/* Black gradient (always visible) */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0c0d12]/95 via-[#0c0d12]/60 to-transparent p-6 pt-16">
                    <h2 className="text-[20px] font-bold text-white tracking-tight">
                      {guide.title}
                    </h2>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* What's New */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-[#000000]" />
              <h2 className="text-[15px] font-semibold text-[#000000]">What's New</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {whatsNewList.map((item) => (
                <Link
                  key={item.id}
                  to={item.url}
                  className="flex flex-col rounded-[8px] border border-[#e2e5ec] bg-white p-4 transition-all hover:bg-[#f7f8fb] cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-block rounded-[3px] bg-[#f0f1f3] px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-[#4b5563]">
                      {item.tag}
                    </span>
                    <span className="text-[10px] text-[#8a90a0]">{item.time}</span>
                  </div>

                  <h3 className="mt-3 text-[13px] font-bold text-[#000000] leading-snug line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 flex-1 text-[12px] text-[#666666] leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Top Philanthropists */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500 fill-red-500" />
              <h2 className="text-[15px] font-semibold text-[#000000]">Top Philanthropists</h2>
            </div>
            <Link
              to="/philanthropists"
              className="text-[12px] font-medium text-[#666666] hover:text-[#000000] cursor-pointer"
            >
              View All
            </Link>
          </div>

          <div className="rounded-[10px] border border-[#e2e5ec] bg-white p-5 space-y-3">
            {topPhilanthropists.length > 0 ? (
              topPhilanthropists.map((item, idx) => (
                <PhilanthropistListItem
                  key={item.id}
                  rank={item.rank}
                  name={item.name}
                  server={item.server}
                  amountLabel={item.amountLabel}
                  showDivider={idx !== topPhilanthropists.length - 1}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Heart className="h-10 w-10 text-[#e5e7eb] mb-3" />
                <p className="text-[13px] font-medium text-[#000000]">No donations yet</p>
                <p className="mt-1 text-[12px] text-[#9aa1b0]">
                  Be the first to support Grand Wiki
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
