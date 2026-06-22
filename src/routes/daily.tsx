import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";
export const Route = createFileRoute("/daily")({
  component: () => <ComingSoon title="Daily Challenges" blurb="3 Easy · 2 Medium · 2 Hard per week, shuffled by ISO week seed." />,
});
