import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";
export const Route = createFileRoute("/events")({
  component: () => <ComingSoon title="Monthly Events" blurb="100 progressive levels with a seasonal reskin each month." />,
});
