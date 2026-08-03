import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Crown, Medal } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchTop, type LeaderRow } from "@/lib/leaderboard";

import { useGameStore, type ClassicDifficulty } from "@/store/game-store";
import {
  TIME_ATTACK_MINUTES,
  TIME_ATTACK_TIERS,
  VERSUS_DIFFICULTIES,
  timeAttackKey,
} from "@/game/economy";
import { useT } from "@/i18n";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Clasamente — Sudoku Drop" },
      {
        name: "description",
        content: "Clasamente separate pentru Sudoku Clasic, Sudoku Drop liber și turnee.",
      },
    ],
  }),
  component: Leaderboard,
});

type Tab = "classic" | "free" | "tournaments";

const NAMES = [
  "Andrei", "Maria", "Cristi", "Ioana", "Vlad", "Elena", "Mihai", "Ana",
  "Radu", "Diana", "George", "Sara", "Tudor", "Bianca", "Stefan", "Carmen",
  "Paul", "Roxana", "Marian", "Laura", "Bogdan", "Alina", "Dragos", "Camelia",
  "Liviu", "Oana", "Sorin", "Adela", "Cosmin", "Iulia",
];

function seedRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeBoard(seed: number, max: number, you: number) {
  const rng = seedRng(seed);
  const rows = NAMES.map((name) => ({
    name,
    score: Math.floor(max * (0.4 + rng() * 0.6)),
    you: false,
  }));
  if (you > 0) rows.push({ name: "Tu", score: you, you: true });
  rows.sort((a, b) => b.score - a.score);
  return rows;
}

const DROP_DIFFS = ["easy", "normal", "hard", "extreme"] as const;
const CLASSIC_DIFFS: ClassicDifficulty[] = ["easy", "medium", "hard", "expert", "extreme"];

function Leaderboard() {
  const t = useT();
  const [tab, setTab] = useState<Tab>("free");
  const [classicDiff, setClassicDiff] = useState<ClassicDifficulty>("medium");
  const [dropDiff, setDropDiff] = useState<string>("normal");
  const [tType, setTType] = useState<"ta" | "vs">("ta");
  const [taMin, setTaMin] = useState<number>(3);
  const [taTier, setTaTier] = useState<string>("easy");
  const [vsDiff, setVsDiff] = useState<string>("easy");

  const classic = useGameStore((s) => s.highScores.classic);
  const modeBest = useGameStore((s) => s.modeBest);
  const entries = useGameStore((s) => s.tournamentEntries);
  const dropHigh = useGameStore((s) => s.highScores.dropdoku);

  let key = "";
  let label = "";
  let max = 3000;
  let you = 0;

  if (tab === "classic") {
    key = `classic:${classicDiff}`;
    label = `${t("Clasic")} · ${classicDiff}`;
    max = classicDiff === "extreme" ? 5200 : 3200;
    you = classic?.[classicDiff] ?? 0;
  } else if (tab === "free") {
    key = `free:${dropDiff}`;
    label = `${t("Liber")} · ${dropDiff}`;
    max = dropDiff === "extreme" ? 12000 : dropDiff === "hard" ? 9500 : dropDiff === "normal" ? 8000 : 6000;
    you = modeBest[key] ?? (dropDiff === "normal" ? dropHigh : 0);
  } else if (tType === "ta") {
    key = timeAttackKey(taMin, taTier as never);
    const tier = TIME_ATTACK_TIERS.find((x) => x.id === taTier);
    label = `Time Attack ${taMin} min · ${t(tier?.name ?? "")}`;
    max = 3000 * (tier?.mult ?? 1) * (taMin / 3);
    you = entries[key]?.bestScore ?? 0;
  } else {
    key = `vs:${vsDiff}`;
    const d = VERSUS_DIFFICULTIES.find((x) => x.id === vsDiff);
    label = `Versus · ${t(d?.name ?? "")}`;
    max = vsDiff === "hard" ? 9000 : vsDiff === "medium" ? 6500 : 4500;
    you = Object.entries(modeBest)
      .filter(([k]) => k.startsWith("vs:") && k.split(":")[2] === vsDiff)
      .reduce((m, [, v]) => Math.max(m, v), 0);
  }

  const [remote, setRemote] = useState<LeaderRow[] | null>(null);
  useEffect(() => {
    let alive = true;
    setRemote(null);
    const [m, ...rest] = key.split(":");
    fetchTop(m ?? key, rest.join(":")).then((r) => {
      if (alive) setRemote(r);
    });
    return () => {
      alive = false;
    };
  }, [key]);

  const rows =
    remote && remote.length > 0
      ? remote.map((r) => ({ name: r.name, score: r.score, you: false }))
      : makeBoard(hash(key), Math.round(max), you);
  const isGlobal = !!remote && remote.length > 0;


  return (
    <div className="min-h-screen px-5 pt-5 pb-10">
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Crown className="w-6 h-6 text-primary" />
      </div>
      <h1 className="display text-3xl font-bold mt-5">{t("Clasamente")}</h1>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>

      <div className="mt-4 flex gap-1 p-1 bg-muted rounded-full">
        {([
          ["free", "Sudoku Drop"],
          ["classic", t("Clasic")],
          ["tournaments", t("Turnee")],
        ] as Array<[Tab, string]>).map(([m, lbl]) => (
          <button
            key={m}
            onClick={() => setTab(m)}
            className={`flex-1 py-2 rounded-full text-xs font-semibold transition ${
              tab === m ? "bg-card shadow-soft text-foreground" : "text-muted-foreground"
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {tab === "classic" && (
        <Chips
          items={CLASSIC_DIFFS.map((d) => ({ id: d, label: d }))}
          active={classicDiff}
          onPick={(v) => setClassicDiff(v as ClassicDifficulty)}
        />
      )}

      {tab === "free" && (
        <Chips
          items={DROP_DIFFS.map((d) => ({ id: d, label: d }))}
          active={dropDiff}
          onPick={setDropDiff}
        />
      )}

      {tab === "tournaments" && (
        <>
          <Chips
            items={[
              { id: "ta", label: "Time Attack" },
              { id: "vs", label: "Versus" },
            ]}
            active={tType}
            onPick={(v) => setTType(v as "ta" | "vs")}
          />
          {tType === "ta" ? (
            <>
              <Chips
                items={TIME_ATTACK_MINUTES.map((m) => ({ id: String(m), label: `${m} min` }))}
                active={String(taMin)}
                onPick={(v) => setTaMin(Number(v))}
              />
              <Chips
                items={TIME_ATTACK_TIERS.map((x) => ({ id: x.id, label: t(x.name) }))}
                active={taTier}
                onPick={setTaTier}
              />
            </>
          ) : (
            <Chips
              items={VERSUS_DIFFICULTIES.map((x) => ({ id: x.id, label: t(x.name) }))}
              active={vsDiff}
              onPick={setVsDiff}
            />
          )}
        </>
      )}

      <div className="mt-4 bg-card border border-border rounded-2xl shadow-soft divide-y divide-border">
        {rows.slice(0, 50).map((row, i) => (
          <div
            key={`${row.name}-${i}`}
            className={`flex items-center px-4 py-2.5 ${row.you ? "bg-accent" : ""}`}
          >
            <span className="w-7 text-sm font-bold text-muted-foreground tabular-nums">{i + 1}</span>
            {i < 3 ? (
              <Medal
                className={`w-4 h-4 mr-2 ${
                  i === 0 ? "text-amber-400" : i === 1 ? "text-muted-foreground" : "text-rose-400"
                }`}
              />
            ) : (
              <span className="w-4 h-4 mr-2" />
            )}
            <span className={`flex-1 text-sm ${row.you ? "font-bold" : "font-medium"}`}>
              {row.name}
              {row.you && (
                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                  {t("TU")}
                </span>
              )}
            </span>
            <span className="text-sm font-bold tabular-nums text-primary">{row.score}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {isGlobal
          ? t("Clasament global · actualizat în timp real.")
          : t("Clasament local · conectează-te pentru clasamentul global.")}

      </p>
    </div>
  );
}

function Chips({
  items,
  active,
  onPick,
}: {
  items: Array<{ id: string; label: string }>;
  active: string;
  onPick: (id: string) => void;
}) {
  return (
    <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar">
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onPick(it.id)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap ${
            active === it.id
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-muted-foreground"
          }`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
