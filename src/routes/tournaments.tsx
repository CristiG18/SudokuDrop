import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";
export const Route = createFileRoute("/tournaments")({
  component: () => <ComingSoon title="Tournaments" blurb="Time Attack & Survival Duel with cash-prize style rewards." />,
});
