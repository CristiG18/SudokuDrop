import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { useGameStore } from "@/store/game-store";
import { useT } from "@/i18n";

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function ContinueCard() {
  const t = useT();
  const drop = useGameStore((s) => s.dropdokuSession);
  const classic = useGameStore((s) => s.classicSession);

  if (!drop && !classic) return null;

  return (
    <div className="mx-5 mt-4 space-y-2">
      {drop && (
        <Link
          to="/play/dropdoku"
          search={{ difficulty: drop.difficulty as never, resume: true }}
          className="flex items-center bg-primary text-primary-foreground rounded-2xl p-4 shadow-card active:scale-[0.99] transition"
        >
          <Play className="w-5 h-5 mr-3" />
          <div className="flex-1 text-left">
            <div className="font-bold text-sm">{t("Continuă Sudoku Drop")}</div>
            <div className="text-xs opacity-80 capitalize">
              {drop.difficulty} · {fmt(drop.seconds ?? 0)} · {drop.score}p
            </div>
          </div>
          <span className="text-xl">→</span>
        </Link>
      )}
      {classic && (
        <Link
          to="/play/classic"
          search={{ difficulty: classic.difficulty as never, resume: true }}
          className="flex items-center bg-card border border-border rounded-2xl p-4 shadow-soft active:scale-[0.99] transition"
        >
          <Play className="w-5 h-5 mr-3 text-primary" />
          <div className="flex-1 text-left">
            <div className="font-bold text-sm">{t("Continuă Sudoku Clasic")}</div>
            <div className="text-xs text-muted-foreground capitalize">
              {classic.difficulty} · {fmt(classic.seconds)} · {t("greșeli")} {classic.mistakes}/3
            </div>
          </div>
          <span className="text-xl text-primary">→</span>
        </Link>
      )}
    </div>
  );
}
