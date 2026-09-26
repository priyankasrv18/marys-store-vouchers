import { createFileRoute, redirect } from "@tanstack/react-router";

// Authentication has been removed; keep this legacy URL from showing a login screen.
export const Route = createFileRoute("/auth")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
