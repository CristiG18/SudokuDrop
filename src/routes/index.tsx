import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Gem,
  Play,
  Calendar,
  Trophy,
  ShoppingBag,
  Sparkles,
  ListOrdered,
  Grid3x3,
  X,
} from "lucide-react";
import { useGameStore } from "@/store/game-store";
import type { Difficulty } from "@/game/engine";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sudoku Drop — Jewel Style" },
      { name: "description", content: "A pastel jewel Sudoku puzzle for mobile." },
    ],
  }),
  component: Menu,
});

function Menu() {
  const navigate = useNavigate();
  const diamonds = useGameStore((s) => s.diamonds);
  const highScore = useGameStore((s) => s.highScores.dropdoku);
  const [sheetOpen, setSheetOpen] = useState(false);

  const pick = (difficulty: Difficulty) => {
    setSheetOpen(false);
    navigate({ to: "/play/dropdoku", search: { difficulty } });
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pt-10 pb-8">
      {/* HUD */}
      <div className="flex items-center justify-between">
        <div className="soft-card px-3 py-2 flex items-center gap-1.5 font-bold">
          <Gem className="w-4 h-4 text-diamond" />
          {diamonds}
        </div>
        <Link
          to="/shop"
          className="soft-card px-3 py-2 text-sm font-semibold flex items-center gap-1.5"
        >
          <ShoppingBag className="w-4 h-4" /> Shop
        </Link>
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="relative mb-4">
          <Sparkles className="absolute -top-3 -left-6 w-6 h-6 text-jewel-7 animate-pulse" />
          <Sparkles className="absolute -bottom-2 -right-4 w-5 h-5 text-jewel-2 animate-pulse" />
          <div className="grid grid-cols-3 gap-1.5 jewel-panel p-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <div
                key={n}
                className={`w-10 h-10 rounded-xl bg-jewel-${n} flex items-center justify-center font-bold text-foreground/80`}
                style={{ boxShadow: "var(--shadow-jewel)" }}
              >
                {n}
              </div>
            ))}
          </div>
        </div>
        <h1 className="text-4xl font-black tracking-tight">Sudoku Drop</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-2">Jewel Style</p>
        <p className="text-xs text-muted-foreground">Best Dropdoku: {highScore}</p>

        <button
          onClick={() => setSheetOpen(true)}
          className="mt-8 px-12 py-5 rounded-3xl bg-primary text-primary-foreground font-black text-xl shadow-pop active:scale-95 transition flex items-center gap-2"
          style={{ boxShadow: "var(--shadow-pop)" }}
        >
          <Play className="w-6 h-6 fill-current" /> PLAY
        </button>
      </div>

      {/* Mode grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <ModeCard to="/classic" Icon={Grid3x3} label="Classic" tint="jewel-5" />
        <ModeCard to="/daily" Icon={Calendar} label="Daily" tint="jewel-3" />
        <ModeCard to="/events" Icon={Sparkles} label="Events" tint="jewel-8" />
        <ModeCard to="/tournaments" Icon={Trophy} label="Tournaments" tint="jewel-2" />
      </div>

      <Link
        to="/leaderboard"
        className="soft-card py-3 flex items-center justify-center gap-2 font-semibold"
      >
        <ListOrdered className="w-5 h-5" /> Leaderboards
      </Link>

      {/* Bottom sheet */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm flex items-end"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="bg-card w-full rounded-t-3xl p-6 pb-10 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Choose difficulty</h3>
              <button onClick={() => setSheetOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <DiffBtn label="Easy" desc="2 sets · slower drops" tint="jewel-4" onClick={() => pick("easy")} />
              <DiffBtn label="Normal" desc="3 sets · balanced" tint="jewel-5" onClick={() => pick("normal")} />
              <DiffBtn label="Hard" desc="4 sets · fast & dense" tint="jewel-8" onClick={() => pick("hard")} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModeCard({
  to,
  Icon,
  label,
  tint,
}: {
  to: string;
  Icon: typeof Play;
  label: string;
  tint: string;
}) {
  return (
    <Link
      to={to}
      className="soft-card p-4 flex flex-col items-start gap-2 active:scale-95 transition"
    >
      <div className={`w-10 h-10 rounded-xl bg-${tint} flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-foreground/80" />
      </div>
      <span className="font-bold">{label}</span>
    </Link>
  );
}

function DiffBtn({
  label,
  desc,
  tint,
  onClick,
}: {
  label: string;
  desc: string;
  tint: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-2xl bg-muted/60 hover:bg-muted active:scale-[0.98] transition text-left"
    >
      <div className={`w-12 h-12 rounded-2xl bg-${tint}`} style={{ boxShadow: "var(--shadow-jewel)" }} />
      <div className="flex-1">
        <div className="font-bold">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Play className="w-5 h-5 text-primary" />
    </button>
  );
}
