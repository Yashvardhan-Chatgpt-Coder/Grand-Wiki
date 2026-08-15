import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/government/lawyer-code")({
  beforeLoad: () => {
    throw redirect({
      to: "/government/en2/lawyer-code",
    });
  },
});
