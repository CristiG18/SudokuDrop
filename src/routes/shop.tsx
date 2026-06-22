import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";
export const Route = createFileRoute("/shop")({
  component: () => <ComingSoon title="Shop" blurb="Diamond packs, jewel skins, and themes." />,
});
