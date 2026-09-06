import { Check, Gem } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useGameStore } from "@/store/game-store";
import { THEME_CATALOG } from "@/game/cosmetics";
import { useT } from "@/i18n";

export function ThemePicker() {
  const t = useT();
  const activeTheme = useGameStore((s) => s.activeTheme);
  const ownedThemes = useGameStore((s) => s.ownedThemes);
  const setTheme = useGameStore((s) => s.setTheme);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-soft">
      <div className="font-semibold">{t("Aspect (culoare interfață)")}</div>
      <div className="text-xs text-muted-foreground mt-0.5 mb-3">
        {t("Alege culoarea principală. Cele blocate se cumpără din magazin.")}
      </div>
      <div className="grid grid-cols-4 gap-2.5">
        {THEME_CATALOG.map((theme) => {
          const owned = ownedThemes.includes(theme.key);
          const active = activeTheme === theme.key;
          const inner = (
            <>
              {active && (
                <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary" />
                </span>
              )}
              {!owned && (
                <span className="absolute bottom-1.5 left-1.5 right-1.5 text-[11px] px-1.5 py-1 rounded-full bg-white text-foreground font-bold flex items-center justify-center gap-1 shadow-md">
                  <Gem className="w-3 h-3 text-primary" />
                  {theme.cost}
                </span>
              )}
            </>
          );
          const className =
            "relative aspect-square rounded-2xl flex flex-col items-center justify-end p-2 border transition " +
            (active ? "border-primary ring-2 ring-primary/40" : "border-border") +
            (owned ? "" : " opacity-70");

          if (!owned) {
            return (
              <Link
                key={theme.key}
                to="/shop"
                className={className}
                style={{ background: theme.swatch }}
                aria-label={`${t(theme.name)} — ${t("Magazin")}`}
              >
                {inner}
              </Link>
            );
          }
          return (
            <button
              key={theme.key}
              type="button"
              onClick={() => setTheme(theme.key)}
              className={className}
              style={{ background: theme.swatch }}
              aria-label={t(theme.name)}
            >
              {inner}
            </button>
          );
        })}
      </div>
      <div className="mt-3 text-[11px] text-muted-foreground">
        {t("Activ")}: <span className="font-bold text-foreground">
          {t(THEME_CATALOG.find((x) => x.key === activeTheme)?.name ?? "")}
        </span>
      </div>
    </div>
  );
}
