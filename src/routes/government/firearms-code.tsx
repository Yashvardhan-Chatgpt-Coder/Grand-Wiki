import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/government/firearms-code")({
  beforeLoad: () => {
    throw redirect({
      to: "/government/en2/firearms-code",
    });
  },
});
