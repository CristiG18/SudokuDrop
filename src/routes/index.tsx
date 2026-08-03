import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Gem,
  Crown,
  Flame,
  BookOpen,
  Sparkles,
  Trophy,
  Blocks,
  Settings as SettingsIcon,
  ShoppingBag,
  Coins,
  Timer,
  Zap,
  Snowflake,

} from "lucide-react";
import { useState, useEffect } from "react";
import { useGameStore } from "@/store/game-store";
import { currentMonthTheme, dailyForDate } from "@/game/schedule";
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
      { title: "Sudoku Drop (Dropdoku) — Acasă" },
      {
        name: "description",
        content:
          "Sudoku Drop, aka Dropdoku — piese care cad într-o grilă 9x9. Zilnice, evenimente, turnee.",
      },
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
  const month = currentMonthTheme();
  const today = new Date();
  const todayDiff = dailyForDate(today);
  const monthShort = today.toLocaleDateString("ro-RO", { month: "short" });
  const day = today.getDate();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState(false);

  // Apply user's chosen theme (do NOT auto-switch by month — that was jarring).
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
      <header className="px-5 pt-5 flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {monthShort} · {month.name}
          </p>
          <h1 className="display text-2xl font-bold mt-0.5">Sudoku Drop</h1>
        </div>
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
            {diamonds}
          </div>
        </div>
      </header>

      <div className="px-5 mt-4 flex flex-wrap gap-2">
        <Chip Icon={Flame} label={`${streak} ${t("consecutive")}`} />
        <Chip Icon={Coins} label={`${coins}`} tint="amber" />
        <TicketMeter />
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

      <div className="mt-5 -mx-1 overflow-x-auto no-scrollbar">
        <div className="flex gap-3 px-4 snap-x snap-mandatory">
          <CarouselCard to="/daily" tag={t("Zilnică")} title={`${monthShort} ${day}`} sub={todayDiff.toUpperCase()} Icon={Trophy} />
          <CarouselCard
            to="/play/dropdoku"
            search={{ difficulty: "normal", mode: "timerush" }}
            tag={t("Mod nou")}
            title="Time Rush"
            sub={`3 ${t("min")} · +10s/${t("linie")}, +15s/box`}
            Icon={Timer}
          />
          <CarouselCard
            to="/play/dropdoku"
            search={{ difficulty: "normal", mode: "rush" }}
            tag={t("Mod nou")}
            title="Rush"
            sub={t("Cădere rapidă, scor mare")}
            Icon={Zap}
          />
          <CarouselCard
            to="/play/dropdoku"
            search={{ difficulty: "normal", mode: "ice" }}
            tag={t("Mod nou")}
            title="Ice"
            sub={t("Rânduri înghețate urcă")}
            Icon={Snowflake}
          />
          <CarouselCard to="/events" tag={t("Eveniment")} title={month.name} sub={`100 ${t("niveluri")}`} Icon={Sparkles} />
          <CarouselCard to="/battle" tag={t("Turneu")} title={t("Bronz")} sub={t("Începe acum")} Icon={Trophy} />
          <CarouselCard to="/classic" tag={t("Clasic")} title="Sudoku 9×9" sub={t("Puzzle clasic")} Icon={Blocks} />

        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="relative">
          <div
            className="absolute inset-0 rounded-3xl blur-3xl opacity-30"
            style={{ background: "var(--color-primary)" }}
          />
          <img
            src={logo}
            alt="Sudoku Drop logo — grilă 3x3 cu o piesă bijuterie ce cade"
            width={144}
            height={144}
            className="relative w-36 h-36 object-contain drop-shadow-xl"
          />
        </div>
        <h2 className="display text-4xl font-bold tracking-tight mt-6">Sudoku Drop</h2>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">aka Dropdoku</p>
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

function CarouselCard({
  to,
  search,
  tag,
  title,
  sub,
  Icon,
}: {
  to: string;
  search?: Record<string, unknown>;
  tag: string;
  title: string;
  sub: string;
  Icon: typeof Trophy;
}) {
  return (
    <Link
      to={to}
      search={search as never}
      className="snap-start shrink-0 w-44 h-52 rounded-2xl p-4 flex flex-col justify-between bg-card border border-border shadow-soft active:scale-[0.98] transition relative overflow-hidden"
    >
      <span className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-primary" />
      <div className="pl-2">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{tag}</p>
        <h3 className="text-xl font-bold mt-1 leading-tight">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
      <div className="flex justify-end pl-2">
        <div className="w-12 h-12 rounded-2xl bg-accent text-primary flex items-center justify-center">
          <Icon className="w-6 h-6" strokeWidth={1.6} />
        </div>
      </div>
    </Link>
  );
}
