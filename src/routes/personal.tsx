import { createFileRoute, Link } from "@tanstack/react-router";
import { User, Trophy, Flame, Coins, Ticket, ShoppingBag, ListOrdered } from "lucide-react";
import { XpBar } from "@/components/XpBar";
import { useGameStore } from "@/store/game-store";
import { useT } from "@/i18n";

export const Route = createFileRoute("/personal")({
  head: () => ({ meta: [{ title: "Personal — Sudoku Drop" }] }),
  component: Personal,
});

function Personal() {
  const t = useT();
  const diamonds = useGameStore((s) => s.diamonds);
  const helpers = useGameStore((s) => s.helpers);
  const high = useGameStore((s) => s.highScores.dropdoku);
  const coins = useGameStore((s) => s.coins);
  const tickets = useGameStore((s) => s.tickets);
  const streak = useGameStore((s) => s.classicStreak);
  const helperCount = (key: keyof typeof helpers) => {
    const value = helpers[key];
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
  };

  return (
    <div className="min-h-screen px-5 pt-5">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <User className="w-8 h-8" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-xl font-bold">{t("Invitat")}</h1>
          <p className="text-sm text-muted-foreground">{t("Conectare în Phase 3")}</p>
        </div>
      </div>

      <div className="mt-6 bg-card border border-border rounded-2xl p-4 shadow-soft">
        <XpBar />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat Icon={Trophy} label={t("Best Dropdoku")} value={high} />
        <Stat Icon={Flame} label={t("Streak")} value={streak} />
        <Stat Icon={Coins} label={t("Monede")} value={coins} />
        <Stat Icon={Ticket} label={t("Tichete")} value={tickets} />
        <Stat Icon={Trophy} label={t("Diamonds")} value={diamonds} />
      </div>

      <h3 className="mt-6 mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {t("Helperi")}
      </h3>
      <div className="bg-card border border-border rounded-2xl p-4 shadow-soft grid grid-cols-3 text-center divide-x divide-border">
        <div><div className="font-bold text-lg">{helperCount("hammer")}</div><div className="text-xs text-muted-foreground">{t("Hammer")}</div></div>
        <div><div className="font-bold text-lg">{helperCount("swap")}</div><div className="text-xs text-muted-foreground">{t("Swap")}</div></div>
        <div><div className="font-bold text-lg">{helperCount("boom")}</div><div className="text-xs text-muted-foreground">{t("Boom")}</div></div>
      </div>

      <div className="mt-6 space-y-2">
        <Row to="/shop" Icon={ShoppingBag} label={t("Magazin")} />
        <Row to="/leaderboard" Icon={ListOrdered} label={t("Clasamente")} />
      </div>
    </div>
  );
}

function Stat({ Icon, label, value }: { Icon: typeof Trophy; label: string; value: number | string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-soft">
      <Icon className="w-5 h-5 text-primary" strokeWidth={1.6} />
      <div className="mt-2 text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Row({ to, Icon, label }: { to: string; Icon: typeof ShoppingBag; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 shadow-soft"
    >
      <Icon className="w-5 h-5 text-primary" strokeWidth={1.6} />
      <span className="font-medium flex-1">{label}</span>
      <span className="text-muted-foreground">›</span>
    </Link>
  );
}
