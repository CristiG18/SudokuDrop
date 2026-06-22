import { cn } from "@/lib/utils";

interface JewelProps {
  value: number; // 0 = joker
  size: number;
  ghost?: boolean;
  popping?: boolean;
  clearing?: boolean;
  highlight?: boolean;
}

export function Jewel({ value, size, ghost, popping, clearing, highlight }: JewelProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center font-semibold select-none rounded-md bg-card",
        ghost && "opacity-30",
        popping && "animate-pop",
        clearing && "opacity-0 transition-opacity duration-300",
        highlight && "ring-2 ring-primary",
      )}
      style={{
        width: size,
        height: size,
        color: value === 0 ? "var(--color-muted-foreground)" : "var(--color-cell-user)",
        fontSize: size * 0.55,
        lineHeight: 1,
        border: "1px solid var(--color-border)",
      }}
    >
      {value === 0 ? "★" : value}
    </div>
  );
}
