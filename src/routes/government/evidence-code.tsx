import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/government/evidence-code")({
  beforeLoad: () => {
    throw redirect({
      to: "/government/en2/evidence-code",
    });
  },
});
