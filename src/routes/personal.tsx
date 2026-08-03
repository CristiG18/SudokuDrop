import { createFileRoute, Link } from "@tanstack/react-router";
import { User, Trophy, Flame, Coins, Ticket, ShoppingBag, ListOrdered, Gem } from "lucide-react";
import { useState } from "react";
import { XpBar } from "@/components/XpBar";
import { useGameStore } from "@/store/game-store";
import {
  TIME_ATTACK_MINUTES,
  TIME_ATTACK_TIERS,
  VERSUS_DIFFICULTIES,
  VERSUS_SIZES,
  timeAttackKey,
} from "@/game/economy";
import { useT } from "@/i18n";

export const Route = createFileRoute("/personal")({
  head: () => ({
    meta: [
      { title: "Profil și recorduri — Sudoku Drop" },
      {
        name: "description",
        content: "Nivelul tău, monedele, tichetele și recordurile pe fiecare mod de joc.",
      },
    ],
  }),
  component: Personal,
});

type RecordTab = "free" | "classic" | "ta" | "vs";

const FREE_DIFFS = ["easy", "normal", "hard", "extreme"];
const CLASSIC_DIFFS = ["easy", "medium", "hard", "expert", "extreme"] as const;

function Personal() {
  const t = useT();
  const diamonds = useGameStore((s) => s.diamonds);
  const helpers = useGameStore((s) => s.helpers);
  const coins = useGameStore((s) => s.coins);
  const tickets = useGameStore((s) => s.tickets);
  const streak = useGameStore((s) => s.classicStreak);
  const classic = useGameStore((s) => s.highScores.classic);
  const dropHigh = useGameStore((s) => s.highScores.dropdoku);
  const modeBest = useGameStore((s) => s.modeBest);
  const entries = useGameStore((s) => s.tournamentEntries);
  const [tab, setTab] = useState<RecordTab>("free");

  const helperCount = (key: keyof typeof helpers) => {
    const value = helpers[key];
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
  };

  let records: Array<{ label: string; value: number }> = [];
  if (tab === "free") {
    records = FREE_DIFFS.map((d) => ({
      label: d,
      value: modeBest[`free:${d}`] ?? (d === "normal" ? dropHigh : 0),
    })).concat([
      { label: "Time Rush", value: modeBest["free:timerush"] ?? 0 },
      { label: "Rush", value: modeBest["free:rush"] ?? 0 },
    ]);
  } else if (tab === "classic") {
    records = CLASSIC_DIFFS.map((d) => ({ label: d, value: classic?.[d] ?? 0 }));
  } else if (tab === "ta") {
    records = TIME_ATTACK_MINUTES.flatMap((m) =>
      TIME_ATTACK_TIERS.map((tier) => ({
        label: `${m} min · ${t(tier.name)}`,
        value: entries[timeAttackKey(m, tier.id)]?.bestScore ?? modeBest[timeAttackKey(m, tier.id)] ?? 0,
      })),
    );
  } else {
    records = VERSUS_SIZES.flatMap((size) =>
      VERSUS_DIFFICULTIES.map((d) => {
        const best = Object.entries(modeBest)
          .filter(([k]) => {
            const p = k.split(":");
            return p[0] === "vs" && p[1] === String(size) && p[2] === d.id;
          })
          .reduce((m, [, v]) => Math.max(m, v), 0);
        return { label: `${size} · ${t(d.name)}`, value: best };
      }),
    );
  }

  return (
    <div className="min-h-screen px-5 pt-5 pb-10">
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
        <Stat Icon={Coins} label={t("Monede")} value={coins.toLocaleString("ro-RO")} />
        <Stat Icon={Ticket} label={t("Tichete")} value={tickets} />
        <Stat Icon={Gem} label={t("Gemuri")} value={diamonds} />
        <Stat Icon={Flame} label={t("Streak")} value={streak} />
      </div>

      <h3 className="mt-6 mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {t("Recorduri")}
      </h3>
      <div className="flex gap-1 p-1 bg-muted rounded-full">
        {([
          ["free", t("Liber")],
          ["classic", t("Clasic")],
          ["ta", "Time Attack"],
          ["vs", "Versus"],
        ] as Array<[RecordTab, string]>).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 py-2 rounded-full text-[11px] font-semibold transition ${
              tab === id ? "bg-card shadow-soft text-foreground" : "text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 bg-card border border-border rounded-2xl shadow-soft divide-y divide-border">
        {records.map((r) => (
          <div key={r.label} className="flex items-center px-4 py-2.5">
            <span className="flex-1 text-sm font-medium capitalize">{r.label}</span>
            <span className="text-sm font-bold tabular-nums text-primary">{r.value}</span>
          </div>
        ))}
      </div>

      <h3 className="mt-6 mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {t("Helperi")}
      </h3>
      <div className="bg-card border border-border rounded-2xl p-4 shadow-soft grid grid-cols-4 text-center divide-x divide-border">
        <div><div className="font-bold text-lg">{helperCount("hammer")}</div><div className="text-xs text-muted-foreground">{t("Hammer")}</div></div>
        <div><div className="font-bold text-lg">{helperCount("swap")}</div><div className="text-xs text-muted-foreground">{t("Swap")}</div></div>
        <div><div className="font-bold text-lg">{helperCount("boom")}</div><div className="text-xs text-muted-foreground">{t("Boom")}</div></div>
        <div><div className="font-bold text-lg">{helperCount("cross")}</div><div className="text-xs text-muted-foreground">Cross</div></div>
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
