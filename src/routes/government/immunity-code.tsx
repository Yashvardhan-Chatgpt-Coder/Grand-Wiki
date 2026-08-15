import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/government/immunity-code")({
  beforeLoad: () => {
    throw redirect({
      to: "/government/en2/immunity-code",
    });
  },
});
