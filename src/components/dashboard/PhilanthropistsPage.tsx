import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import {
  formatDonationAmount,
  formatServerNames,
  getSortedPhilanthropists,
  getTotalDonations,
  type Philanthropist
} from "@/lib/philanthropists";
import { CountUp } from "@/components/dashboard/CountUp";
import { PhilanthropistListItem } from "@/components/dashboard/PhilanthropistListItem";
import { donationsApi } from "@/lib/api";

export function PhilanthropistsPage() {
  const [donors, setDonors] = useState<Philanthropist[]>(() => getSortedPhilanthropists());
  const [totalDonations, setTotalDonations] = useState<number>(() => getTotalDonations());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    donationsApi.getPublic().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        const map = new Map<string, { id: string; name: string; amount: number; servers: string[] }>();
        let grandTotal = 0;

        data.forEach((d) => {
          const key = (d.name || "").trim();
          if (!key) return;
          const amt = Number(d.amount) || 0;
          grandTotal += amt;

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
          .map((item) => ({
            id: item.id,
            name: item.name,
            amount: item.amount,
            server: formatServerNames(item.servers)
          }));

        setDonors(sorted);
        setTotalDonations(grandTotal);
      }
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  return (
    <div className="mx-auto max-w-[720px] space-y-10 p-8">
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center justify-center rounded-full bg-[#fef2f2] p-3">
          <Heart className="h-6 w-6 text-red-500 fill-red-500" />
        </div>

        <div>
          <p className="text-[13px] font-medium uppercase tracking-wider text-[#8a90a0]">
            Total Donations
          </p>
          <CountUp
            value={totalDonations}
            format={formatDonationAmount}
            className="mt-2 block text-[56px] font-bold leading-none tracking-tight text-[#000000] sm:text-[64px]"
          />
        </div>
      </div>

      <div className="space-y-5">
        <h2 className="text-center text-[22px] font-semibold tracking-tight text-[#000000]">
          Thanks To All The Supporters
        </h2>

        <div className="rounded-[10px] border border-[#e2e5ec] bg-white p-5 space-y-3">
          {donors.length > 0 ? (
            donors.map((donor, index) => (
              <PhilanthropistListItem
                key={donor.id}
                rank={index + 1}
                name={donor.name}
                server={donor.server}
                amountLabel={formatDonationAmount(donor.amount)}
                showDivider={index !== donors.length - 1}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-[14px] text-[#8a90a0]">
                {loading ? "Loading supporters..." : "No donations yet. Be the first to support!"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
