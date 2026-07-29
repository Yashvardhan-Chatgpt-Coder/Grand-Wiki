import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/vehicle-ticketing/")({
  component: () => <Navigate to="/vehicle-ticketing/en1" replace />,
});
