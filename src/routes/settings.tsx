import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useGameStore } from "@/store/game-store";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Setări — Sudoku Drop" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const settings = useGameStore((s) => s.settings);
  const setSetting = useGameStore((s) => s.setSetting);

  return (
    <div className="min-h-screen px-5 pt-5 pb-8">
      <Link
        to="/"
        className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <h1 className="display text-3xl font-bold mt-6">Setări</h1>

      <div className="mt-6 space-y-3">
        <Row
          title="Auto-completare"
          desc="Când mai rămân puține celule cu un singur candidat, se completează singure (Sudoku Clasic)."
          value={settings.autoComplete}
          onToggle={(v) => setSetting("autoComplete", v)}
        />
        <Row
          title="Sunet"
          desc="Efecte sonore în joc."
          value={settings.sound}
          onToggle={(v) => setSetting("sound", v)}
        />
        <Row
          title="Vibrații"
          desc="Feedback haptic la atingere."
          value={settings.haptics}
          onToggle={(v) => setSetting("haptics", v)}
        />
      </div>
    </div>
  );
}

function Row({
  title,
  desc,
  value,
  onToggle,
}: {
  title: string;
  desc: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onToggle(!value)}
      className="w-full flex items-center gap-4 bg-card border border-border rounded-2xl p-4 shadow-soft text-left"
    >
      <div className="flex-1">
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
      <div
        className="w-12 h-7 rounded-full p-0.5 transition"
        style={{ backgroundColor: value ? "var(--color-primary)" : "var(--color-muted)" }}
      >
        <div
          className="w-6 h-6 rounded-full bg-white shadow transition-transform"
          style={{ transform: value ? "translateX(20px)" : "translateX(0)" }}
        />
      </div>
    </button>
  );
}
