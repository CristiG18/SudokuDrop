import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Gem,
  Crown,
  Flame,
  BookOpen,
  Sparkles,
  Trophy,
  Blocks,
  Settings as SettingsIcon,
} from "lucide-react";
import { useGameStore } from "@/store/game-store";
import { currentMonthTheme, dailyForDate } from "@/game/schedule";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sudoku Drop — Acasă" },
      {
        name: "description",
        content: "Sudoku Drop, sudoku clasic, provocări zilnice, evenimente și turnee.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const diamonds = useGameStore((s) => s.diamonds);
  const streak = useGameStore((s) => s.classicStreak);
  const setTheme = useGameStore((s) => s.setTheme);
  const month = currentMonthTheme();
  const today = new Date();
  const todayDiff = dailyForDate(today);
  const monthShort = today.toLocaleDateString("ro-RO", { month: "short" });
  const day = today.getDate();

  useEffect(() => {
    setTheme(month.key);
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = month.key;
    }
  }, [month.key, setTheme]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Asymmetric header */}
      <header className="px-5 pt-5 flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {monthShort} · {month.name}
          </p>
          <h1 className="display text-2xl font-bold mt-0.5">Sudoku Drop</h1>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Stat chips */}
      <div className="px-5 mt-4 flex gap-2">
        <Chip Icon={Flame} label={`${streak} consecutive`} />
        <Chip Icon={Crown} label="0 trofee" />
      </div>

      {/* Carousel of activities */}
      <div className="mt-5 -mx-1 overflow-x-auto no-scrollbar">
        <div className="flex gap-3 px-4 snap-x snap-mandatory">
          <CarouselCard
            to="/daily"
            tag="Zilnică"
            title={`${monthShort} ${day}`}
            sub={todayDiff.toUpperCase()}
            Icon={Trophy}
          />
          <CarouselCard
            to="/events"
            tag="Eveniment"
            title={month.name}
            sub="100 niveluri"
            Icon={Sparkles}
          />
          <CarouselCard to="/battle" tag="Turneu" title="Bronz" sub="Începe acum" Icon={Trophy} />
          <CarouselCard
            to="/classic"
            tag="Clasic"
            title="Sudoku 9×9"
            sub="Puzzle clasic"
            Icon={Blocks}
          />
        </div>
      </div>

      {/* Hero CTA: Sudoku Drop */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative">
          <div
            className="absolute inset-0 rounded-3xl blur-2xl opacity-40"
            style={{ background: "var(--color-primary)" }}
          />
          <div className="relative w-32 h-32 rounded-3xl bg-card border border-border shadow-card flex items-center justify-center">
            <Blocks className="w-16 h-16 text-primary" strokeWidth={1.4} />
          </div>
        </div>
        <h2 className="display text-4xl font-bold tracking-tight mt-6">Sudoku Drop</h2>
        <p className="text-sm text-muted-foreground mt-1.5">Piesele cad. Tu completezi.</p>
        <Link
          to="/tutorial"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm font-medium text-primary shadow-soft"
        >
          <BookOpen className="w-4 h-4" /> Cum se joacă
        </Link>
      </div>

      {/* CTAs */}
      <div className="px-6 pb-6 space-y-2">
        <Link
          to="/play/dropdoku"
          search={{ difficulty: "normal" }}
          className="block w-full text-center py-4 rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-card active:scale-[0.98] transition"
        >
          Joacă acum
        </Link>
        <Link
          to="/classic"
          className="block w-full text-center py-3 rounded-full bg-card border border-border font-semibold text-sm active:scale-[0.98] transition"
        >
          Sudoku Clasic
        </Link>
      </div>
    </div>
  );
}

function Chip({ Icon, label }: { Icon: typeof Flame; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-xs font-medium text-muted-foreground">
      <Icon className="w-3.5 h-3.5" />
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
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
          {tag}
        </p>
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
