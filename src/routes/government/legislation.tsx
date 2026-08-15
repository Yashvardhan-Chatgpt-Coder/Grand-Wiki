import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/government/legislation")({
  beforeLoad: () => {
    throw redirect({
      to: "/government/en2/legislation",
    });
  },
});
