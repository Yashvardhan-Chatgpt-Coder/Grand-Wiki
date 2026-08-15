import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/government/tax-code")({
  beforeLoad: () => {
    throw redirect({
      to: "/government/en2/tax-code",
    });
  },
});
