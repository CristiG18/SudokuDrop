import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Info, Trophy, Swords, Clock, Ticket, Coins, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useGameStore } from "@/store/game-store";
import { toast } from "sonner";
import { useT } from "@/i18n";

export const Route = createFileRoute("/battle")({
  head: () => ({ meta: [{ title: "Bătălie — Sudoku Drop" }] }),
  component: Battle,
});

type Mode = "duel" | "timeattack";

const TIERS = [
  { id: "bronze", name: "Bronz", ticket: 1, prize: 100, prizeText: "100 🪙" },
  { id: "silver", name: "Argint", ticket: 2, prize: 250, prizeText: "250 🪙" },
  { id: "gold", name: "Aur", ticket: 3, prize: 500, prizeText: "500 🪙 + skin" },
  { id: "master", name: "Maestru", ticket: 5, prize: 1000, prizeText: "1000 🪙 + skin exclusiv" },
];

const ATTACK_TIMES = [
  { min: 2, label: "2 min" },
  { min: 3, label: "3 min" },
  { min: 5, label: "5 min" },
  { min: 10, label: "10 min" },
];

function Battle() {
  const t = useT();
  const [mode, setMode] = useState<Mode>("duel");
  const [attackMin, setAttackMin] = useState<number>(3);
  const [showInfo, setShowInfo] = useState(false);
  const tickets = useGameStore((s) => s.tickets);
  const coins = useGameStore((s) => s.coins);
  const useTicket = useGameStore((s) => s.useTicket);
  const addCoins = useGameStore((s) => s.addCoins);
  const navigate = useNavigate();
  const month = new Date().toLocaleDateString("ro-RO", { month: "long" });

  const play = (tier: typeof TIERS[number]) => {
    // Time Attack: always 1 ticket, regardless of tier or duration.
    const cost = mode === "timeattack" ? 1 : tier.ticket;
    if (tickets < cost) {
      toast.error(`${t("Ai nevoie de")} ${cost} ${t("tichete. Ai")} ${tickets}.`);
      return;
    }
    for (let i = 0; i < cost; i++) useTicket();
    toast.success(`${t("Meci")} ${t(tier.name)} ${t("pornit")} · ${cost} 🎟`);
    addCoins(Math.round(tier.prize * 0.5));
    if (mode === "timeattack") {
      navigate({
        to: "/play/dropdoku",
        search: {
          difficulty: "normal",
          mode: "timeattack" as const,
          seconds: attackMin * 60,
        },
      });
    } else {
      navigate({ to: "/play/dropdoku", search: { difficulty: "normal" } });
    }
  };

  return (
    <div className="min-h-screen px-5 pt-5 pb-10">
      <div className="flex items-center justify-between">
        <Link to="/" className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-card border border-border text-xs font-semibold">
            <Ticket className="w-3.5 h-3.5 text-primary" /> {tickets}
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-card border border-border text-xs font-semibold">
            <Coins className="w-3.5 h-3.5 text-amber-500" /> {coins}
          </span>
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
        <div className="mt-3 rounded-2xl bg-accent/50 p-3 text-xs text-muted-foreground">
          🎟 {t("Tichetele se câștigă din login zilnic și turnee.")} 🪙 {t("Monedele vin din bătălii câștigate")}
          {t("și din login. Diamantele sunt doar pentru achiziții.")}
        </div>
      )}

      <div className="mt-5 rounded-3xl bg-card border border-border shadow-card p-5 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
          <Swords className="w-10 h-10 text-primary" strokeWidth={1.4} />
        </div>
        <h2 className="text-xl font-bold">
          {mode === "duel" ? "Survival Duel" : `Time Attack · ${attackMin} ${t("min")}`}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === "duel"
            ? t("Joacă pe același seed. Cel mai mare scor câștigă.")
            : `${attackMin} ${t("minute pe ceas. Scor maxim câștigă. Cost: 1 🎟.")}`}
        </p>
      </div>

      <h3 className="mt-6 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {t("Mod")}
      </h3>
      <div className="flex gap-2.5">
        <ModeChip
          Icon={Clock}
          label="Time Attack"
          sub={t("alege timpul")}
          active={mode === "timeattack"}
          onClick={() => setMode("timeattack")}
        />
        <ModeChip
          Icon={Swords}
          label="Duel"
          sub={t("seed identic")}
          active={mode === "duel"}
          onClick={() => setMode("duel")}
        />
      </div>

      {mode === "timeattack" && (
        <>
          <h3 className="mt-5 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t("Durată")}
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {ATTACK_TIMES.map((at) => (
              <button
                key={at.min}
                type="button"
                onClick={() => setAttackMin(at.min)}
                className={
                  "rounded-2xl py-2.5 text-sm font-semibold " +
                  (attackMin === at.min
                    ? "bg-primary text-primary-foreground shadow-card"
                    : "bg-card border border-border text-muted-foreground")
                }
              >
                {at.label}
              </button>
            ))}
          </div>
        </>
      )}


      <h3 className="mt-6 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {t("Tier-uri")}
      </h3>
      <div className="space-y-2.5">
        {TIERS.map((tier) => {
          const cost = mode === "timeattack" ? 1 : tier.ticket;
          const canPlay = tickets >= cost;
          return (
            <div
              key={tier.id}
              className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 shadow-soft"
            >
              <div className="w-11 h-11 rounded-xl bg-accent/60 flex items-center justify-center text-primary">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{t(tier.name)}</div>
                <div className="text-xs text-muted-foreground">{t("Premiu")}: {tier.prizeText}</div>
              </div>
              <button
                onClick={() => play(tier)}
                disabled={!canPlay}
                className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 flex items-center gap-1"
              >
                {t("Joacă")} · {cost} <Ticket className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      <Link
        to="/leaderboard"
        className="mt-6 block text-center text-sm text-primary font-semibold"
      >
        {t("Vezi clasamentele")} →
      </Link>
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
