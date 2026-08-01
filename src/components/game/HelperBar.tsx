import { Hammer, ArrowLeftRight, Bomb, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Helper } from "@/store/game-store";
import { useT } from "@/i18n";

interface HelperBarProps {
  counts: Record<Helper, number>;
  active: Helper | null;
  onPick: (h: Helper) => void;
  onEmpty?: (h: Helper) => void;
  disabled?: boolean;
}

const META: Record<Helper, { label: string; Icon: typeof Hammer }> = {
  hammer: { label: "Hammer", Icon: Hammer },
  swap: { label: "Swap", Icon: ArrowLeftRight },
  boom: { label: "Bombă", Icon: Bomb },
  cross: { label: "Cruce", Icon: Plus },
};

export function HelperBar({ counts, active, onPick, onEmpty, disabled }: HelperBarProps) {
  const t = useT();
  return (
    <div className="flex justify-center gap-2 flex-wrap overflow-visible">
      {(Object.keys(META) as Helper[]).map((h) => {
        const { label, Icon } = META[h];
        const isActive = active === h;
        const rawCount = counts[h];
        const count = typeof rawCount === "number" && Number.isFinite(rawCount) ? rawCount : 0;
        const empty = count <= 0;
        return (
          <button
            key={h}
            onClick={() => (empty ? onEmpty?.(h) : onPick(h))}
            disabled={disabled}
            className={cn(
              "relative flex flex-col items-center justify-center w-[72px] h-[72px] rounded-2xl transition",
              "soft-card overflow-visible",
              isActive && "ring-4 ring-primary scale-105",
              disabled && "opacity-40",
              empty && !disabled && "opacity-60",
            )}
          >
            <Icon className="w-7 h-7 text-primary" />
            <span className="text-xs mt-1 font-semibold">{t(label)}</span>
            <span
              className={cn(
                "absolute -top-1.5 -right-1.5 text-xs font-bold rounded-full min-w-[22px] h-[22px] px-1 flex items-center justify-center shadow z-10",
                empty
                  ? "bg-muted text-muted-foreground border border-border"
                  : "bg-primary text-primary-foreground",
              )}
            >
              {empty ? "+" : count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
