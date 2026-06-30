import { cn } from "@/lib/utils";
import { useGameStore, type Skin } from "@/store/game-store";

interface JewelProps {
  value: number; // 0 = joker
  size: number;
  ghost?: boolean;
  popping?: boolean;
  clearing?: boolean;
  highlight?: boolean;
}

function skinStyle(skin: Skin, value: number): React.CSSProperties {
  if (skin === "glass") {
    return {
      background:
        "linear-gradient(160deg, rgba(255,255,255,0.95), color-mix(in oklab, var(--color-primary) 12%, white))",
      border: "1px solid color-mix(in oklab, var(--color-primary) 30%, white)",
      color: value === 0 ? "var(--color-muted-foreground)" : "var(--color-primary)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
    };
  }
  if (skin === "neon") {
    return {
      background: "oklch(0.22 0.02 250)",
      border: "1px solid color-mix(in oklab, var(--color-primary) 60%, transparent)",
      color: value === 0 ? "oklch(0.85 0 0)" : "color-mix(in oklab, var(--color-primary) 80%, white)",
      boxShadow: "0 0 12px color-mix(in oklab, var(--color-primary) 50%, transparent)",
    };
  }
  if (skin === "wood") {
    return {
      background: "linear-gradient(160deg, #f5d9a8, #d6a86b)",
      border: "1px solid #a4763d",
      color: value === 0 ? "#5b3d1d" : "#3a2410",
    };
  }
  return {
    background: "var(--color-card)",
    border: "1px solid var(--color-border)",
    color: value === 0 ? "var(--color-muted-foreground)" : "var(--color-cell-user)",
  };
}

export function Jewel({ value, size, ghost, popping, clearing, highlight }: JewelProps) {
  const skin = useGameStore((s) => s.activeSkin);
  return (
    <div
      className={cn(
        "flex items-center justify-center font-semibold select-none rounded-md",
        ghost && "opacity-30",
        popping && "animate-pop",
        clearing && "opacity-0 transition-opacity duration-300",
        highlight && "ring-2 ring-primary",
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.55,
        lineHeight: 1,
        ...skinStyle(skin, value),
      }}
    >
      {value === 0 ? "★" : value}
    </div>
  );
}
