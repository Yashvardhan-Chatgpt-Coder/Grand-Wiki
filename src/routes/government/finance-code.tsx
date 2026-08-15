import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/government/finance-code")({
  beforeLoad: () => {
    throw redirect({
      to: "/government/en2/finance-code",
    });
  },
});
