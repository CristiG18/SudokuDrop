import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Info, Trophy, Swords, Clock, Ticket, Coins, ArrowLeft, Repeat, Lock } from "lucide-react";
import { useState } from "react";
import { useGameStore } from "@/store/game-store";
import { toast } from "sonner";
import { useT } from "@/i18n";
import { TicketMeter } from "@/components/TicketMeter";
import { ExchangeSheet } from "@/components/ExchangeSheet";
import {
  DUEL_CATEGORIES,
  TIME_ATTACK_MINUTES,
  TIME_ATTACK_TIERS,
  TOURNAMENT_ENTRY_COINS,
  duelKey,
  timeAttackKey,
  timeAttackPrize,
  type TierId,
} from "@/game/economy";

export const Route = createFileRoute("/battle")({
  head: () => ({ meta: [{ title: "Bătălie — Sudoku Drop" }] }),
  component: Battle,
});

type Mode = "duel" | "timeattack";

function Battle() {
  const t = useT();
  const [mode, setMode] = useState<Mode>("duel");
  const [attackMin, setAttackMin] = useState<number>(3);
  const [showInfo, setShowInfo] = useState(false);
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const tickets = useGameStore((s) => s.tickets);
  const coins = useGameStore((s) => s.coins);
  const level = useGameStore((s) => s.level);
  const useTicket = useGameStore((s) => s.useTicket);
  const entries = useGameStore((s) => s.tournamentEntries);
  const getEntry = useGameStore((s) => s.getTournamentEntry);
  const enterCategory = useGameStore((s) => s.enterTournamentCategory);
  const navigate = useNavigate();
  const month = new Date().toLocaleDateString("ro-RO", { month: "long" });

  const enter = (key: string) => {
    if (enterCategory(key)) {
      toast.success(`${t("Te-ai înscris")} · -${TOURNAMENT_ENTRY_COINS} 🪙`);
    } else {
      toast.error(t("Nu ai suficiente monede."));
      setExchangeOpen(true);
    }
  };

  const play = (key: string, minLevel: number, seconds?: number) => {
    if (level < minLevel) {
      toast.error(`${t("Deblochezi la nivelul")} ${minLevel}.`);
      return;
    }
    if (!getEntry(key)) {
      toast.error(t("Înscrie-te la această categorie mai întâi."));
      return;
    }
    // Every tournament run costs exactly one ticket, regardless of category.
    if (!useTicket()) {
      toast.error(t("Nu ai tichete. Așteaptă regenerarea sau schimbă monede."));
      return;
    }
    if (seconds) {
      navigate({
        to: "/play/dropdoku",
        search: { difficulty: "normal", mode: "timeattack" as const, seconds, tkey: key },
      });
    } else {
      const difficulty = key.split(":")[1] as "easy" | "normal" | "hard";
      navigate({ to: "/play/dropdoku", search: { difficulty, tkey: key } });
    }
  };

  return (
    <div className="min-h-screen px-5 pt-5 pb-10">
      <div className="flex items-center justify-between">
        <Link to="/" className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <TicketMeter />
          <button
            onClick={() => setExchangeOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-card border border-border text-xs font-semibold"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" /> {coins}
            <Repeat className="w-3 h-3 text-muted-foreground" />
          </button>
          <button
            onClick={() => setShowInfo((v) => !v)}
            className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      <h1 className="text-3xl font-bold mt-4">{t("Bătălie")}</h1>
      <p className="text-sm text-muted-foreground capitalize mt-1">{month}</p>

      {showInfo && (
        <div className="mt-3 rounded-2xl bg-accent/50 p-3 text-xs text-muted-foreground leading-relaxed">
          🪙 {t("Te înscrii separat la fiecare categorie")} ({TOURNAMENT_ENTRY_COINS} 🪙).{" "}
          {t("Clasamentul este dat de cel mai bun scor dintr-un singur meci — poate doar să crească.")}{" "}
          🎟 {t("Fiecare meci costă 1 tichet. Premiile se împart la finalul săptămânii.")}
        </div>
      )}

      <ExchangeSheet open={exchangeOpen} onOpenChange={setExchangeOpen} />

      <h3 className="mt-6 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {t("Mod")}
      </h3>
      <div className="flex gap-2.5">
        <ModeChip
          Icon={Swords}
          label="Duel"
          sub={t("seed identic")}
          active={mode === "duel"}
          onClick={() => setMode("duel")}
        />
        <ModeChip
          Icon={Clock}
          label="Time Attack"
          sub={t("3 / 5 / 10 min")}
          active={mode === "timeattack"}
          onClick={() => setMode("timeattack")}
        />
      </div>

      {mode === "duel" ? (
        <>
          <p className="mt-5 text-sm text-muted-foreground">
            {t("Același seed pentru toți. Se contorizează scorul maxim dintr-un meci.")}
          </p>
          <div className="mt-3 space-y-2.5">
            {DUEL_CATEGORIES.map((cat) => {
              const key = duelKey(cat.id);
              const entry = entries[key];
              const joined = !!getEntry(key);
              const locked = level < cat.minLevel;
              return (
                <CategoryCard
                  key={key}
                  title={`${t("Duel")} · ${t(cat.name)}`}
                  prize={cat.prizeText}
                  minLevel={cat.minLevel}
                  locked={locked}
                  joined={joined}
                  best={joined ? (entry?.bestScore ?? 0) : null}
                  canPlay={joined && !locked && tickets >= 1}
                  onEnter={() => enter(key)}
                  onPlay={() => play(key, cat.minLevel)}
                  t={t}
                />
              );
            })}
          </div>
        </>
      ) : (
        <>
          <h3 className="mt-5 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t("Durată")}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {TIME_ATTACK_MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setAttackMin(m)}
                className={
                  "rounded-2xl py-2.5 text-sm font-semibold " +
                  (attackMin === m
                    ? "bg-primary text-primary-foreground shadow-card"
                    : "bg-card border border-border text-muted-foreground")
                }
              >
                {m} min
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("Linie/coloană +10s · box +15s. Fiecare tier are înscriere și premii proprii.")}
          </p>
          <div className="mt-3 space-y-2.5">
            {TIME_ATTACK_TIERS.map((tier) => {
              const key = timeAttackKey(attackMin, tier.id as TierId);
              const entry = entries[key];
              const joined = !!getEntry(key);
              const locked = level < tier.minLevel;
              return (
                <CategoryCard
                  key={key}
                  title={`${attackMin} min · ${t(tier.name)}`}
                  prize={timeAttackPrize(attackMin, tier.id).text}
                  minLevel={tier.minLevel}
                  locked={locked}
                  joined={joined}
                  best={joined ? (entry?.bestScore ?? 0) : null}
                  canPlay={joined && !locked && tickets >= 1}
                  onEnter={() => enter(key)}
                  onPlay={() => play(key, tier.minLevel, attackMin * 60)}
                  t={t}
                />
              );
            })}
          </div>
        </>
      )}

      <Link
        to="/leaderboard"
        className="mt-6 block text-center text-sm text-primary font-semibold"
      >
        {t("Vezi clasamentele")} →
      </Link>
    </div>
  );
}

function CategoryCard({
  title,
  prize,
  minLevel,
  locked,
  joined,
  best,
  canPlay,
  onEnter,
  onPlay,
  t,
}: {
  title: string;
  prize: string;
  minLevel: number;
  locked: boolean;
  joined: boolean;
  best: number | null;
  canPlay: boolean;
  onEnter: () => void;
  onPlay: () => void;
  t: (s: string) => string;
}) {
  return (
    <div className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 shadow-soft">
      <div className="w-11 h-11 rounded-xl bg-accent/60 flex items-center justify-center text-primary shrink-0">
        {locked ? <Lock className="w-5 h-5" /> : <Trophy className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">{title}</div>
        <div className="text-xs text-muted-foreground truncate">
          {locked
            ? `${t("Deblochezi la nivelul")} ${minLevel}`
            : joined
              ? `${t("Cel mai bun scor")}: ${best} · ${prize}`
              : `${t("Premiu")}: ${prize}`}
        </div>
      </div>
      {locked ? null : joined ? (
        <button
          onClick={onPlay}
          disabled={!canPlay}
          className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 flex items-center gap-1 shrink-0"
        >
          {t("Joacă")} · 1 <Ticket className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button
          onClick={onEnter}
          className="px-3 py-2 rounded-full bg-accent text-accent-foreground text-xs font-semibold shrink-0"
        >
          {t("Înscrie-te")} · {TOURNAMENT_ENTRY_COINS} 🪙
        </button>
      )}
    </div>
  );
}

function ModeChip({
  Icon,
  label,
  sub,
  active,
  onClick,
}: {
  Icon: typeof Clock;
  label: string;
  sub: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "flex-1 rounded-2xl p-3 bg-primary text-primary-foreground text-left"
          : "flex-1 rounded-2xl p-3 bg-card border border-border text-left"
      }
    >
      <Icon className="w-5 h-5" strokeWidth={1.6} />
      <div className="font-semibold text-sm mt-1">{label}</div>
      <div className={active ? "text-xs opacity-80" : "text-xs text-muted-foreground"}>{sub}</div>
    </button>
  );
}
