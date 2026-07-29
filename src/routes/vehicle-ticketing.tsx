import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/vehicle-ticketing")({
  component: () => <Outlet />,
});
