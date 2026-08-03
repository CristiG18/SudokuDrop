import { useGameStore } from "@/store/game-store";
import { xpForLevel } from "@/game/economy";
import { useT } from "@/i18n";

/** Level badge + XP progress bar. */
export function XpBar({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const level = useGameStore((s) => s.level);
  const xp = useGameStore((s) => s.xp);
  const need = xpForLevel(level);
  const pct = Math.min(100, Math.round((xp / need) * 100));

  return (
    <div className={compact ? "flex items-center gap-2" : "w-full"}>
      <div className="flex items-center justify-between text-xs font-semibold mb-1">
        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">
          {t("Nivel")} {level}
        </span>
        <span className="text-muted-foreground font-medium">
          {xp}/{need} XP
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
