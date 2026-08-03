import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { fmtNum } from "@/lib/format";
import {
  Gem,
  Crown,
  Flame,
  BookOpen,
  Trophy,
  Settings as SettingsIcon,
  ShoppingBag,
  Coins,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useGameStore } from "@/store/game-store";
import { dailyForDate } from "@/game/schedule";
import { DifficultySheet, type DropDifficulty } from "@/components/DifficultySheet";
import { ContinueCard } from "@/components/ContinueCard";
import { DailyRewardModal } from "@/components/DailyRewardModal";
import logo from "@/assets/logo.png";
import { useT } from "@/i18n";
import { TicketMeter } from "@/components/TicketMeter";
import { XpBar } from "@/components/XpBar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sudoku Drop — puzzle cu piese care cad" },
      {
        name: "description",
        content:
          "Sudoku Drop: piese care cad într-o grilă 9x9. Provocări zilnice, turnee Versus și ligi Time Attack.",
      },
      { property: "og:title", content: "Sudoku Drop" },
      {
        property: "og:description",
        content: "Piese care cad într-o grilă 9x9. Zilnice, turnee Versus și Time Attack.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const t = useT();
  const diamonds = useGameStore((s) => s.diamonds);
  const coins = useGameStore((s) => s.coins);
  const streak = useGameStore((s) => s.classicStreak);
  const activeTheme = useGameStore((s) => s.activeTheme);
  const today = new Date();
  const todayDiff = dailyForDate(today);
  const monthShort = today.toLocaleDateString("ro-RO", { month: "short" });
  const day = today.getDate();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = activeTheme;
    }
  }, [activeTheme]);

  const pick = (d: DropDifficulty, resume: boolean) => {
    setSheet(false);
    navigate({ to: "/play/dropdoku", search: { difficulty: d, ...(resume ? { resume: true } : {}) } });
  };

  return (
    <div className="min-h-screen flex flex-col pb-6">
      <header className="px-5 pt-5 flex items-center justify-between">
        <h1 className="display text-2xl font-bold">Sudoku Drop</h1>
        <div className="flex items-center gap-2">
          <Link
            to="/shop"
            className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center"
          >
            <ShoppingBag className="w-4 h-4 text-muted-foreground" />
          </Link>
          <Link
            to="/settings"
            className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center"
          >
            <SettingsIcon className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-sm font-semibold">
            <Gem className="w-4 h-4 text-primary" />
            {fmtNum(diamonds)}
          </div>
        </div>
      </header>

      <div className="px-5 mt-4 flex flex-wrap gap-2">
        <Chip Icon={Flame} label={`${streak} ${t("consecutive")}`} />
        <Chip Icon={Coins} label={fmtNum(coins)} tint="amber" />
        <TicketMeter compact />
        <Link
          to="/leaderboard"
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-xs font-medium text-muted-foreground"
        >
          <Crown className="w-3.5 h-3.5" /> {t("Clasament")}
        </Link>
      </div>

      <div className="px-5 mt-4">
        <XpBar />
      </div>

      <ContinueCard />

      <div className="px-5 mt-4">
        <Link
          to="/daily"
          className="flex items-center gap-3 rounded-2xl bg-card border border-border px-4 py-3 shadow-soft active:scale-[0.99] transition"
        >
          <div className="w-9 h-9 rounded-xl bg-accent text-primary flex items-center justify-center shrink-0">
            <Trophy className="w-4.5 h-4.5" strokeWidth={1.7} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold leading-tight">{t("Provocarea zilei")}</div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wide">
              {monthShort} {day} · {todayDiff}
            </div>
          </div>
          <span className="text-primary">→</span>
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="relative">
          <div
            className="absolute inset-0 rounded-3xl blur-3xl opacity-30"
            style={{ background: "var(--color-primary)" }}
          />
          <img
            src={logo}
            alt="Sudoku Drop logo — grilă 3x3 cu o piesă care cade"
            width={144}
            height={144}
            className="relative w-36 h-36 object-contain drop-shadow-xl"
          />
        </div>
        <h2 className="display text-4xl font-bold tracking-tight mt-6">Sudoku Drop</h2>
        <p className="text-sm text-muted-foreground mt-2">{t("Piesele cad. Tu completezi.")}</p>
        <Link
          to="/tutorial"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm font-medium text-primary shadow-soft"
        >
          <BookOpen className="w-4 h-4" /> {t("Cum se joacă")}
        </Link>
      </div>

      <div className="px-6 space-y-3">
        <button
          onClick={() => setSheet(true)}
          className="block w-full text-center py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-card active:scale-[0.98] transition"
        >
          {t("Joacă acum")}
        </button>
        <Link
          to="/classic"
          className="block w-full text-center py-3.5 rounded-2xl bg-card border border-border font-semibold text-sm active:scale-[0.98] transition"
        >
          {t("Sudoku Clasic")}
        </Link>
      </div>

      <DifficultySheet
        open={sheet}
        onClose={() => setSheet(false)}
        onPick={pick}
        onPickMode={(m) => {
          setSheet(false);
          navigate({ to: "/play/dropdoku", search: { difficulty: "normal", mode: m } });
        }}
      />
      <DailyRewardModal />
    </div>
  );
}

function Chip({ Icon, label, tint }: { Icon: typeof Flame; label: string; tint?: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-xs font-medium text-muted-foreground">
      <Icon className={`w-3.5 h-3.5 ${tint === "amber" ? "text-amber-500" : ""}`} />
      {label}
    </div>
  );
}
