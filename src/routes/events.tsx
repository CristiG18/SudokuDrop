import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Lock, Sparkles, Check } from "lucide-react";
import { currentMonthTheme } from "@/game/schedule";

export const Route = createFileRoute("/events")({
  head: () => ({ meta: [{ title: "Eveniment lunar" }] }),
  component: Events,
});

function Events() {
  const navigate = useNavigate();
  const theme = currentMonthTheme();
  const monthName = new Date().toLocaleDateString("ro-RO", { month: "long" });
  // Mock progress — Phase 3 will persist
  const completed = 4;

  const startLevel = (lvl: number) => {
    const diff = lvl <= 25 ? "easy" : lvl <= 60 ? "medium" : lvl <= 90 ? "hard" : "extreme";
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + lvl;
    navigate({ to: "/play/classic", search: { difficulty: diff as never, seed } });
  };

  return (
    <div className="min-h-screen px-5 pt-5">
      <Link to="/" className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center">
        <ArrowLeft className="w-5 h-5" />
      </Link>

      {/* Theme banner */}
      <div className="mt-6 rounded-3xl bg-card border border-border p-5 shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground capitalize">{monthName}</p>
            <h1 className="text-xl font-bold">{theme.name}</h1>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Progres</span>
            <span>{completed}/100</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${completed}%` }} />
          </div>
        </div>
      </div>

      {/* Bands */}
      <Band label="Ușor" range="1–25" tint="emerald" />
      <LevelGrid from={1} to={25} completed={completed} onPick={startLevel} />
      <Band label="Mediu" range="26–60" tint="amber" />
      <LevelGrid from={26} to={60} completed={completed} onPick={startLevel} />
      <Band label="Greu" range="61–90" tint="rose" />
      <LevelGrid from={61} to={90} completed={completed} onPick={startLevel} />
      <Band label="Maestru" range="91–100" tint="violet" />
      <LevelGrid from={91} to={100} completed={completed} onPick={startLevel} />

      <div className="h-6" />
    </div>
  );
}

function Band({ label, range, tint }: { label: string; range: string; tint: string }) {
  return (
    <div className="mt-6 mb-3 flex items-center gap-2">
      <span className={`w-1.5 h-5 rounded-full bg-${tint}-400`} />
      <h3 className="text-sm font-semibold">{label}</h3>
      <span className="text-xs text-muted-foreground">· {range}</span>
    </div>
  );
}

function LevelGrid({
  from,
  to,
  completed,
  onPick,
}: {
  from: number;
  to: number;
  completed: number;
  onPick: (n: number) => void;
}) {
  const levels = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  return (
    <div className="grid grid-cols-5 gap-2">
      {levels.map((lvl) => {
        const isCompleted = lvl <= completed;
        const isLocked = lvl > completed + 1;
        const isCurrent = lvl === completed + 1;
        return (
          <button
            key={lvl}
            disabled={isLocked}
            onClick={() => onPick(lvl)}
            className={
              "aspect-square rounded-xl border flex items-center justify-center font-semibold text-sm transition " +
              (isCompleted
                ? "bg-primary/10 border-primary/30 text-primary"
                : isCurrent
                  ? "bg-primary text-primary-foreground border-primary shadow-soft scale-105"
                  : "bg-card border-border text-muted-foreground")
            }
          >
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : isCompleted ? <Check className="w-4 h-4" /> : lvl}
          </button>
        );
      })}
    </div>
  );
}
