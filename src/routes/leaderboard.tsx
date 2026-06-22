import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";
export const Route = createFileRoute("/leaderboard")({
  component: () => <ComingSoon title="Leaderboards" blurb="All-time Best & Weekly Global rankings from Lovable Cloud." />,
});
