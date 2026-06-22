import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";
export const Route = createFileRoute("/classic")({
  component: () => <ComingSoon title="Classic Sudoku" blurb="Template-based daily levels with multiple difficulties." />,
});
