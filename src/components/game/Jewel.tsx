import { cn } from "@/lib/utils";

const JEWEL_COLORS: Record<number, string> = {
  0: "bg-jewel-joker",
  1: "bg-jewel-1",
  2: "bg-jewel-2",
  3: "bg-jewel-3",
  4: "bg-jewel-4",
  5: "bg-jewel-5",
  6: "bg-jewel-6",
  7: "bg-jewel-7",
  8: "bg-jewel-8",
  9: "bg-jewel-9",
};

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
        "flex items-center justify-center font-bold select-none rounded-[14px]",
        JEWEL_COLORS[value] ?? "bg-muted",
        ghost && "opacity-30",
        popping && "animate-jewel-pop",
        clearing && "animate-jewel-clear",
        highlight && "ring-2 ring-primary",
      )}
      style={{
        width: size,
        height: size,
        boxShadow: "var(--shadow-jewel)",
        color: "oklch(0.25 0.08 280)",
        fontSize: size * 0.5,
        lineHeight: 1,
      }}
    >
      {value === 0 ? "★" : value}
    </div>
  );
}
