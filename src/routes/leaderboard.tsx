import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Crown, Medal } from "lucide-react";
import { useState } from "react";
import { useGameStore, type ClassicDifficulty } from "@/store/game-store";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({ meta: [{ title: "Clasament" }] }),
  component: Leaderboard,
});

type Mode = "dropdoku" | "classic";

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

function makeBoard(seed: number, max: number, you: number, label: string) {
  const rng = seedRng(seed);
  const out = NAMES.map((name) => ({
    name,
    score: Math.floor(max * (0.5 + rng() * 0.5)),
    you: false,
  }));
  if (you > 0) out.push({ name: "Tu", score: you, you: true });
  out.sort((a, b) => b.score - a.score);
  return { rows: out, label };
}

function Leaderboard() {
  const [mode, setMode] = useState<Mode>("dropdoku");
  const [diff, setDiff] = useState<ClassicDifficulty>("medium");
  const drop = useGameStore((s) => s.highScores.dropdoku);
  const classic = useGameStore((s) => s.highScores.classic);

  const board =
    mode === "dropdoku"
      ? makeBoard(101, 8400, drop, "Sudoku Drop")
      : makeBoard(diff.charCodeAt(0) * 7, diff === "extreme" ? 5200 : 3200, classic[diff], `Clasic · ${diff}`);

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
      <h1 className="display text-3xl font-bold mt-5">Clasament</h1>
      <p className="text-sm text-muted-foreground mt-1">Top jucători</p>

      <div className="mt-4 flex gap-1 p-1 bg-muted rounded-full">
        {(["dropdoku", "classic"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${
              mode === m ? "bg-card shadow-soft text-foreground" : "text-muted-foreground"
            }`}
          >
            {m === "dropdoku" ? "Sudoku Drop" : "Clasic"}
          </button>
        ))}
      </div>

      {mode === "classic" && (
        <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar">
          {(["easy", "medium", "hard", "expert", "extreme"] as ClassicDifficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDiff(d)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap ${
                diff === d ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 bg-card border border-border rounded-2xl shadow-soft divide-y divide-border">
        {board.rows.slice(0, 50).map((row, i) => (
          <div
            key={`${row.name}-${i}`}
            className={`flex items-center px-4 py-2.5 ${row.you ? "bg-accent" : ""}`}
          >
            <span className="w-7 text-sm font-bold text-muted-foreground tabular-nums">
              {i + 1}
            </span>
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
                  TU
                </span>
              )}
            </span>
            <span className="text-sm font-bold tabular-nums text-primary">{row.score}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Clasament local · sincronizare globală vine cu Lovable Cloud.
      </p>
    </div>
  );
}
