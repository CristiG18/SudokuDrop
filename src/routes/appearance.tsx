import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useState } from "react";
import { ThemePicker } from "@/components/ThemePicker";
import { SkinPicker } from "@/components/SkinPicker";
import { useGameStore } from "@/store/game-store";
import { useT } from "@/i18n";

export const Route = createFileRoute("/appearance")({
  head: () => ({
    meta: [
      { title: "Aspect — culoare și skin | Sudoku Drop" },
      {
        name: "description",
        content:
          "Alege culoarea interfeței și skinul pieselor din Sudoku Drop. Schimbi tema oricând, dintr-un singur ecran.",
      },
      { property: "og:title", content: "Aspect — culoare și skin | Sudoku Drop" },
      {
        property: "og:description",
        content: "Culoarea interfeței și skinul pieselor, într-un singur ecran.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppearancePage,
});

function AppearancePage() {
  const t = useT();
  const [tab, setTab] = useState<"color" | "skin">("color");
  const setTheme = useGameStore((s) => s.setTheme);
  const setSkin = useGameStore((s) => s.setSkin);
  const activeSkin = useGameStore((s) => s.activeSkin);
  const activeTheme = useGameStore((s) => s.activeTheme);
  const isDefault = activeSkin === "default" && activeTheme === "emerald";

  return (
    <div className="min-h-screen px-5 pt-5 pb-8">
      <Link
        to="/settings"
        className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>

      <h1 className="display text-3xl font-bold mt-6">{t("Aspect")}</h1>
      <p className="text-sm text-muted-foreground mt-1">
        {t("Culoarea interfeței și skinul pieselor. Skinul poate schimba și fundalul jocului.")}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2 p-1 rounded-2xl bg-muted">
        {(["color", "skin"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={
              "py-2.5 rounded-xl text-sm font-semibold transition " +
              (tab === k ? "bg-card shadow-soft text-foreground" : "text-muted-foreground")
            }
          >
            {k === "color" ? t("Culoare") : t("Skin piese")}
          </button>
        ))}
      </div>

      <div className="mt-4">{tab === "color" ? <ThemePicker /> : <SkinPicker />}</div>

      <button
        type="button"
        disabled={isDefault}
        onClick={() => {
          setTheme("emerald");
          setSkin("default");
        }}
        className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-card border border-border shadow-soft text-sm font-semibold disabled:opacity-50"
      >
        <RotateCcw className="w-4 h-4" />
        {t("Revino la verdele implicit")}
      </button>
    </div>
  );
}
