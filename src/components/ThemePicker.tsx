import { useEffect } from "react";
import { Check } from "lucide-react";
import { useGameStore, type ThemeKey } from "@/store/game-store";

interface ThemeInfo {
  key: ThemeKey;
  name: string;
  swatch: string;
}

const THEMES: ThemeInfo[] = [
  { key: "emerald", name: "Verde smarald", swatch: "oklch(0.62 0.15 160)" },
  { key: "amber", name: "Portocaliu maroniu", swatch: "oklch(0.58 0.12 60)" },
  { key: "ocean", name: "Albastru ocean", swatch: "oklch(0.55 0.18 245)" },
  { key: "rose", name: "Roz coral", swatch: "oklch(0.62 0.19 350)" },
];

export function ThemePicker() {
  const activeTheme = useGameStore((s) => s.activeTheme);
  const ownedThemes = useGameStore((s) => s.ownedThemes);
  const setTheme = useGameStore((s) => s.setTheme);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = activeTheme;
    }
  }, [activeTheme]);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-soft">
      <div className="font-semibold">Aspect (culoare interfață)</div>
      <div className="text-xs text-muted-foreground mt-0.5 mb-3">
        Alege culoarea principală. Alte nuanțe se deblochează din magazin sau ca premii la turnee.
      </div>
      <div className="grid grid-cols-4 gap-2.5">
        {THEMES.map((t) => {
          const owned = ownedThemes.includes(t.key);
          const active = activeTheme === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => owned && setTheme(t.key)}
              disabled={!owned}
              className={
                "relative aspect-square rounded-2xl flex flex-col items-center justify-end p-2 border transition " +
                (active ? "border-primary ring-2 ring-primary/40" : "border-border")
              }
              style={{ background: t.swatch }}
              aria-label={t.name}
            >
              {active && (
                <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary" />
                </span>
              )}
              {!owned && (
                <span className="absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-white/90 text-foreground font-bold">
                  🔒
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
        {THEMES.map((t) => (
          <span key={t.key} className={activeTheme === t.key ? "font-bold text-foreground" : ""}>
            {t.name}
          </span>
        )).reduce<React.ReactNode[]>((acc, el, i) => {
          if (i > 0) acc.push(<span key={`s${i}`}>·</span>);
          acc.push(el);
          return acc;
        }, [])}
      </div>
    </div>
  );
}
