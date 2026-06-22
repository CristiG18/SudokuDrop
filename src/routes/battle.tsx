import { createFileRoute, Link } from "@tanstack/react-router";
import { Info, Trophy, Swords, Clock } from "lucide-react";

export const Route = createFileRoute("/battle")({
  head: () => ({ meta: [{ title: "Bătălie — Sudoku Drop" }] }),
  component: Battle,
});

const TIERS = [
  { name: "Bronz", lock: null, ticket: 1, prize: "100 💎" },
  { name: "Argint", lock: 5, ticket: 2, prize: "250 💎" },
  { name: "Aur", lock: 10, ticket: 3, prize: "500 💎 + skin" },
  { name: "Maestru", lock: 20, ticket: 5, prize: "1000 💎 + skin exclusiv" },
];

function Battle() {
  const month = new Date().toLocaleDateString("ro-RO", { month: "long" });
  return (
    <div className="min-h-screen px-5 pt-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bătălie</h1>
        <button className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
          <Info className="w-4 h-4" />
        </button>
      </div>
      <p className="text-sm text-muted-foreground capitalize mt-1">{month}</p>

      {/* Hero */}
      <div className="mt-6 rounded-3xl bg-card border border-border shadow-card p-6 flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
          <Swords className="w-12 h-12 text-primary" strokeWidth={1.4} />
        </div>
        <h2 className="text-xl font-bold">Survival Duel</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Joacă pe același seed. Cel mai mare scor câștigă.
        </p>
        <div className="grid grid-cols-2 gap-6 mt-5 w-full">
          <div>
            <div className="text-2xl font-bold">0</div>
            <div className="text-xs text-muted-foreground">Câștiguri</div>
          </div>
          <div>
            <div className="text-2xl font-bold">0</div>
            <div className="text-xs text-muted-foreground">Pierderi</div>
          </div>
        </div>
      </div>

      {/* Modes */}
      <h3 className="mt-6 mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Moduri
      </h3>
      <div className="flex gap-3 mb-6">
        <ModeChip Icon={Clock} label="Time Attack" sub="2 min" />
        <ModeChip Icon={Swords} label="Duel" sub="seed identic" active />
      </div>

      {/* Tiers */}
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Tier-uri
      </h3>
      <div className="space-y-2.5">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4 shadow-soft"
          >
            <div className="w-11 h-11 rounded-xl bg-accent/60 flex items-center justify-center text-primary">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">{t.name}</div>
              <div className="text-xs text-muted-foreground">Premiu: {t.prize}</div>
            </div>
            {t.lock ? (
              <span className="text-xs text-muted-foreground">Lv. {t.lock}</span>
            ) : (
              <button className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                Joacă · {t.ticket} 🎟
              </button>
            )}
          </div>
        ))}
      </div>

      <Link
        to="/leaderboard"
        className="mt-6 mb-4 block text-center text-sm text-primary font-semibold"
      >
        Vezi clasamentele →
      </Link>
    </div>
  );
}

function ModeChip({
  Icon,
  label,
  sub,
  active,
}: {
  Icon: typeof Clock;
  label: string;
  sub: string;
  active?: boolean;
}) {
  return (
    <div
      className={
        active
          ? "flex-1 rounded-2xl p-3 bg-primary text-primary-foreground"
          : "flex-1 rounded-2xl p-3 bg-card border border-border"
      }
    >
      <Icon className="w-5 h-5" strokeWidth={1.6} />
      <div className="font-semibold text-sm mt-1">{label}</div>
      <div className={active ? "text-xs opacity-80" : "text-xs text-muted-foreground"}>{sub}</div>
    </div>
  );
}
