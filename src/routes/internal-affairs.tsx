import { createFileRoute } from "@tanstack/react-router";
import { InternalAffairsGate } from "@/components/internal-affairs/InternalAffairsApp";

export const Route = createFileRoute("/internal-affairs")({
  head: () => ({
    meta: [
      { title: "Internal Affairs | Grand Wiki" },
      { name: "description", content: "Protected Internal Affairs management system." },
    ],
  }),
  component: InternalAffairsGate,
});
