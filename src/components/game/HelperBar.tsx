import { Hammer, ArrowLeftRight, Bomb } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Helper } from "@/store/game-store";

interface HelperBarProps {
  counts: Record<Helper, number>;
  active: Helper | null;
  onPick: (h: Helper) => void;
  disabled?: boolean;
}

const META: Record<Helper, { label: string; Icon: typeof Hammer }> = {
  hammer: { label: "Hammer", Icon: Hammer },
  swap: { label: "Swap", Icon: ArrowLeftRight },
  boom: { label: "Boom", Icon: Bomb },
};

export function HelperBar({ counts, active, onPick, disabled }: HelperBarProps) {
  return (
    <div className="flex justify-center gap-3">
      {(Object.keys(META) as Helper[]).map((h) => {
        const { label, Icon } = META[h];
        const isActive = active === h;
        const count = counts[h];
        return (
          <button
            key={h}
            onClick={() => onPick(h)}
            disabled={disabled || count <= 0}
            className={cn(
              "relative flex flex-col items-center justify-center w-20 h-20 rounded-2xl transition",
              "soft-card",
              isActive && "ring-4 ring-primary scale-105",
              (disabled || count <= 0) && "opacity-40",
            )}
          >
            <Icon className="w-7 h-7 text-primary" />
            <span className="text-xs mt-1 font-semibold">{label}</span>
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow">
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
