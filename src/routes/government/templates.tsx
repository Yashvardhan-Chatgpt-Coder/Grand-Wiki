import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/government/templates")({
  beforeLoad: () => {
    throw redirect({
      to: "/government/en2/templates",
    });
  },
});
