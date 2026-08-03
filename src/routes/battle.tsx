import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Info, Trophy, Swords, Clock, Ticket, Coins, ArrowLeft, Repeat, Lock, X } from "lucide-react";
import { useState } from "react";
import { useGameStore } from "@/store/game-store";
import { toast } from "sonner";
import { useT } from "@/i18n";
import { TicketMeter } from "@/components/TicketMeter";
import { ExchangeSheet } from "@/components/ExchangeSheet";
import {
  TIME_ATTACK_MINUTES,
  TIME_ATTACK_TIERS,
  TOURNAMENT_ENTRY_COINS,
  VERSUS_DIFFICULTIES,
  VERSUS_FEES,
  VERSUS_MATCH_SECONDS,
  VERSUS_SIZES,
  timeAttackKey,
  timeAttackPrizeTable,
  versusKey,
  versusPrize,
  type TierId,
} from "@/game/economy";

export const Route = createFileRoute("/battle")({
  head: () => ({
    meta: [
      { title: "Turnee — Sudoku Drop" },
      {
        name: "description",
        content: "Turnee Versus în format eliminatoriu și ligi Time Attack cu premii săptămânale.",
      },
    ],
  }),
  component: Battle,
});

type Mode = "versus" | "timeattack";

const fmtCoins = (n: number) => n.toLocaleString("ro-RO");

function Battle() {
  const t = useT();
  const [mode, setMode] = useState<Mode>("versus");
  const [attackMin, setAttackMin] = useState<number>(3);
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [info, setInfo] = useState<{ title: string; body: string; rows: string[] } | null>(null);

  const [size, setSize] = useState<number>(4);
  const [vdiff, setVdiff] = useState<string>("easy");
  const [fee, setFee] = useState<number>(100);

  const tickets = useGameStore((s) => s.tickets);
  const coins = useGameStore((s) => s.coins);
  const level = useGameStore((s) => s.level);
  const useTicket = useGameStore((s) => s.useTicket);
  const entries = useGameStore((s) => s.tournamentEntries);
  const getEntry = useGameStore((s) => s.getTournamentEntry);
  const enterCategory = useGameStore((s) => s.enterTournamentCategory);
  const versus = useGameStore((s) => s.versus);
  const startVersus = useGameStore((s) => s.startVersus);
  const clearVersus = useGameStore((s) => s.clearVersus);
  const navigate = useNavigate();

  const vDiffCfg = VERSUS_DIFFICULTIES.find((d) => d.id === vdiff) ?? VERSUS_DIFFICULTIES[0];
  const prize = versusPrize(size, fee);

  /* ------------------------------- Versus -------------------------------- */

  const joinVersus = () => {
    if (level < vDiffCfg.minLevel) {
      toast.error(`${t("Deblochezi la nivelul")} ${vDiffCfg.minLevel}.`);
      return;
    }
    const key = versusKey(size, vdiff, fee);
    if (!startVersus(key, size, vdiff, fee)) {
      toast.error(t("Nu ai suficiente monede."));
      setExchangeOpen(true);
      return;
    }
    toast.success(`${t("Înscris în bracket")} · -${fmtCoins(fee)} 🪙`);
  };

  const playVersusMatch = () => {
    if (!versus || versus.done) return;
    if (!useTicket()) {
      toast.error(t("Nu ai tichete. Așteaptă regenerarea sau schimbă monede."));
      return;
    }
    navigate({
      to: "/play/dropdoku",
      search: {
        difficulty: vDiffCfgFor(versus.difficulty),
        mode: "timeattack" as const,
        seconds: VERSUS_MATCH_SECONDS,
        vkey: versus.key,
      },
    });
  };

  /* ----------------------------- Time Attack ----------------------------- */

  const enterTa = (key: string) => {
    if (enterCategory(key)) {
      toast.success(`${t("Te-ai înscris")} · -${TOURNAMENT_ENTRY_COINS} 🪙`);
    } else {
      toast.error(t("Nu ai suficiente monede."));
      setExchangeOpen(true);
    }
  };

  const playTa = (key: string, minLevel: number, seconds: number, engine: string) => {
    if (level < minLevel) {
      toast.error(`${t("Deblochezi la nivelul")} ${minLevel}.`);
      return;
    }
    if (!getEntry(key)) {
      toast.error(t("Înscrie-te la această categorie mai întâi."));
      return;
    }
    if (!useTicket()) {
      toast.error(t("Nu ai tichete. Așteaptă regenerarea sau schimbă monede."));
      return;
    }
    navigate({
      to: "/play/dropdoku",
      search: {
        difficulty: engine as "easy" | "normal" | "hard" | "extreme",
        mode: "timeattack" as const,
        seconds,
        tkey: key,
      },
    });
  };

  return (
    <div className="min-h-screen px-5 pt-5 pb-10">
      <div className="flex items-center justify-between">
        <Link to="/" className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <TicketMeter compact />
          <button
            onClick={() => setExchangeOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-card border border-border text-xs font-semibold"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" /> {fmtCoins(coins)}
            <Repeat className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      </div>

      <h1 className="display text-3xl font-bold mt-4">{t("Turnee")}</h1>

      <ExchangeSheet open={exchangeOpen} onOpenChange={setExchangeOpen} />

      <div className="flex gap-2.5 mt-5">
        <ModeChip
          Icon={Swords}
          label="Versus"
          sub={t("bracket 4 / 8 / 16")}
          active={mode === "versus"}
          onClick={() => setMode("versus")}
        />
        <ModeChip
          Icon={Clock}
          label="Time Attack"
          sub={t("3 / 5 / 10 min")}
          active={mode === "timeattack"}
          onClick={() => setMode("timeattack")}
        />
      </div>

      {mode === "versus" ? (
        versus ? (
          <VersusBracket
            onPlay={playVersusMatch}
            onLeave={() => clearVersus()}
            tickets={tickets}
            t={t}
          />
        ) : (
          <>
            <p className="mt-5 text-sm text-muted-foreground leading-relaxed">
              {t(
                "Bracket eliminatoriu pe seed identic: toți jucătorii primesc aceleași piese, în aceeași ordine. Fiecare meci durează 3 minute — cine face scorul mai mare avansează. Campionul ia tot potul, locul 2 își recuperează taxa.",
              )}
            </p>

            <Section title={t("Jucători")}>
              <div className="grid grid-cols-3 gap-2">
                {VERSUS_SIZES.map((s) => (
                  <Pill key={s} active={size === s} onClick={() => setSize(s)}>
                    {s} {t("jucători")}
                  </Pill>
                ))}
              </div>
            </Section>

            <Section title={t("Dificultate")}>
              <div className="grid grid-cols-3 gap-2">
                {VERSUS_DIFFICULTIES.map((d) => (
                  <Pill
                    key={d.id}
                    active={vdiff === d.id}
                    disabled={level < d.minLevel}
                    onClick={() => setVdiff(d.id)}
                  >
                    {level < d.minLevel ? `${t(d.name)} · Lv${d.minLevel}` : t(d.name)}
                  </Pill>
                ))}
              </div>
            </Section>

            <Section title={t("Taxă de intrare")}>
              <div className="grid grid-cols-3 gap-2">
                {VERSUS_FEES.map((f) => (
                  <Pill key={f} active={fee === f} onClick={() => setFee(f)}>
                    {fmtCoins(f)} 🪙
                  </Pill>
                ))}
              </div>
            </Section>

            <div className="mt-5 rounded-2xl bg-card border border-border p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{t("Premii")}</span>
                <button
                  onClick={() =>
                    setInfo({
                      title: `Versus ${size} · ${t(vDiffCfg.name)}`,
                      body: t(
                        "Bracket eliminatoriu pe seed identic. 3 minute per meci, avansează scorul mai mare. Fiecare meci costă 1 tichet.",
                      ),
                      rows: [
                        `${t("Pot total")}: ${fmtCoins(prize.pot)} 🪙`,
                        `${t("Locul 1")}: ${fmtCoins(prize.first)} 🪙`,
                        `${t("Locul 2")}: ${fmtCoins(prize.second)} 🪙 (${t("taxa înapoi")})`,
                        `${t("Restul")}: ${t("fără premiu")} · ${t("primești XP")}`,
                      ],
                    })
                  }
                  className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-primary"
                  aria-label={t("Detalii premii")}
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                <div>🥇 {t("Locul 1")}: <b className="text-foreground">{fmtCoins(prize.first)} 🪙</b></div>
                <div>🥈 {t("Locul 2")}: {fmtCoins(prize.second)} 🪙</div>
                <div>
                  {Math.round(Math.log2(size))} {t("runde")} · {VERSUS_MATCH_SECONDS / 60} {t("min")} / {t("meci")} · 1 🎟 / {t("meci")}
                </div>
              </div>
            </div>

            <button
              onClick={joinVersus}
              className="mt-4 w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold shadow-card active:scale-[0.99] transition"
            >
              {t("Înscrie-te")} · {fmtCoins(fee)} 🪙
            </button>
          </>
        )
      ) : (
        <>
          <p className="mt-5 text-sm text-muted-foreground leading-relaxed">
            {t(
              "Ligi săptămânale. Pornești cu timpul ales, iar fiecare linie/coloană îți adaugă 10s și fiecare box 15s — deci contează doar cel mai mare scor dintr-un singur meci.",
            )}
          </p>

          <Section title={t("Durată")}>
            <div className="grid grid-cols-3 gap-2">
              {TIME_ATTACK_MINUTES.map((m) => (
                <Pill key={m} active={attackMin === m} onClick={() => setAttackMin(m)}>
                  {m} min
                </Pill>
              ))}
            </div>
          </Section>

          <div className="mt-4 space-y-2.5">
            {TIME_ATTACK_TIERS.map((tier) => {
              const key = timeAttackKey(attackMin, tier.id as TierId);
              const entry = entries[key];
              const joined = !!getEntry(key);
              const locked = level < tier.minLevel;
              const table = timeAttackPrizeTable(attackMin, tier.id);
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 shadow-soft"
                >
                  <div className="w-11 h-11 rounded-xl bg-accent/60 flex items-center justify-center text-primary shrink-0">
                    {locked ? <Lock className="w-5 h-5" /> : <Trophy className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">
                      {attackMin} min · {t(tier.name)}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {locked
                        ? `${t("Deblochezi la nivelul")} ${tier.minLevel}`
                        : joined
                          ? `${t("Cel mai bun scor")}: ${entry?.bestScore ?? 0}`
                          : `${t("Locul 1")}: ${fmtCoins(table[0].coins)} 🪙 + ${table[0].gems} 💎`}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setInfo({
                        title: `Time Attack ${attackMin} min · ${t(tier.name)}`,
                        body: t(
                          "Înscriere unică pe sezon (o săptămână). Fiecare meci costă 1 tichet, iar în clasament intră cel mai bun scor dintr-un singur meci.",
                        ),
                        rows: table.map(
                          (r) =>
                            `${t(r.place)}: ${fmtCoins(r.coins)} 🪙 + ${r.gems} 💎${r.extra ? ` + ${t(r.extra)}` : ""}`,
                        ),
                      })
                    }
                    className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-primary shrink-0"
                    aria-label={t("Detalii premii")}
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  {locked ? null : joined ? (
                    <button
                      onClick={() => playTa(key, tier.minLevel, attackMin * 60, tier.engine)}
                      disabled={tickets < 1}
                      className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 flex items-center gap-1 shrink-0"
                    >
                      {t("Joacă")} · 1 <Ticket className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => enterTa(key)}
                      className="px-3 py-2 rounded-full bg-accent text-accent-foreground text-xs font-semibold shrink-0"
                    >
                      {fmtCoins(TOURNAMENT_ENTRY_COINS)} 🪙
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <Link to="/leaderboard" className="mt-6 block text-center text-sm text-primary font-semibold">
        {t("Vezi clasamentele")} →
      </Link>

      {info && (
        <div
          className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm flex items-end"
          onClick={() => setInfo(null)}
        >
          <div
            className="w-full bg-card rounded-t-3xl p-5 pb-8 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-bold">{info.title}</h2>
              <button
                onClick={() => setInfo(null)}
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{info.body}</p>
            <div className="mt-4 space-y-1.5">
              {info.rows.map((r) => (
                <div key={r} className="text-sm bg-muted rounded-xl px-3 py-2 font-medium">
                  {r}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function vDiffCfgFor(id: string): "easy" | "normal" | "hard" {
  return (VERSUS_DIFFICULTIES.find((d) => d.id === id)?.engine ?? "normal") as
    | "easy"
    | "normal"
    | "hard";
}

function VersusBracket({
  onPlay,
  onLeave,
  tickets,
  t,
}: {
  onPlay: () => void;
  onLeave: () => void;
  tickets: number;
  t: (s: string) => string;
}) {
  const run = useGameStore((s) => s.versus)!;
  const totalRounds = Math.round(Math.log2(run.size));
  const roundName = (i: number) => {
    const left = Math.pow(2, totalRounds - i);
    if (left === 2) return t("Finală");
    if (left === 4) return t("Semifinală");
    if (left === 8) return t("Sferturi");
    return `${t("Optimi")}`;
  };

  return (
    <div className="mt-5">
      <div className="rounded-2xl bg-card border border-border p-4 shadow-soft">
        <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
          Versus · {run.size} {t("jucători")}
        </div>
        <div className="text-lg font-bold mt-0.5">
          {run.done ? t("Turneu încheiat") : roundName(run.round)}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {t("Taxă")}: {fmtCoins(run.fee)} 🪙 · {t("Pot")}: {fmtCoins(versusPrize(run.size, run.fee).pot)} 🪙
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {run.matches.map((m) => (
          <div
            key={m.round}
            className={`flex items-center gap-3 rounded-2xl border p-3 ${
              m.won ? "border-primary/40 bg-accent/40" : "border-border bg-card"
            }`}
          >
            <span className="text-xs font-semibold text-muted-foreground w-20 shrink-0">
              {roundName(m.round)}
            </span>
            <span className="flex-1 text-sm font-semibold tabular-nums">
              {t("Tu")} {m.you} <span className="text-muted-foreground">vs</span> {m.rival} {m.rivalName}
            </span>
            <span className={`text-xs font-bold ${m.won ? "text-primary" : "text-muted-foreground"}`}>
              {m.won ? t("Victorie") : t("Eliminat")}
            </span>
          </div>
        ))}
      </div>

      {run.done ? (
        <div className="mt-4">
          <div className="rounded-2xl bg-primary text-primary-foreground p-4 text-center shadow-card">
            <div className="text-2xl font-bold">
              {run.place === 1 ? "🏆" : run.place === 2 ? "🥈" : "🎯"} {t("Locul")} {run.place}
            </div>
            <div className="text-sm opacity-90 mt-1">
              {run.reward > 0 ? `+${fmtCoins(run.reward)} 🪙` : t("Fără premiu de data asta")}
            </div>
          </div>
          <button
            onClick={onLeave}
            className="mt-3 w-full py-3.5 rounded-2xl bg-card border border-border font-semibold"
          >
            {t("Turneu nou")}
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={onPlay}
            disabled={tickets < 1}
            className="mt-4 w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold shadow-card disabled:opacity-40 active:scale-[0.99] transition"
          >
            {t("Joacă meciul")} · 3 {t("min")} · 1 🎟
          </button>
          <button onClick={onLeave} className="mt-2 w-full py-3 text-sm text-muted-foreground">
            {t("Abandonează turneul")}
          </button>
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Pill({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={
        "rounded-2xl py-2.5 text-xs font-semibold disabled:opacity-40 " +
        (active
          ? "bg-primary text-primary-foreground shadow-card"
          : "bg-card border border-border text-muted-foreground")
      }
    >
      {children}
    </button>
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
