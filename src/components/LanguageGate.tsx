import { useEffect, useState } from "react";
import { LANGUAGES, useLangStore } from "@/i18n";

/** First launch: pick the interface language before anything else. */
export function LanguageGate() {
  const chosen = useLangStore((s) => s.chosen);
  const setLang = useLangStore((s) => s.setLang);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready || chosen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col items-center justify-center px-6">
      <h1 className="text-2xl font-bold text-center">Choose your language</h1>
      <p className="text-sm text-muted-foreground mt-1">Alege limba · Elige idioma</p>
      <div className="grid grid-cols-2 gap-3 mt-6 w-full max-w-sm">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className={
              "flex items-center gap-2 rounded-2xl border p-3 font-semibold active:scale-[0.98] " +
              (l.code === "en" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")
            }
          >
            <span className="text-xl">{l.flag}</span>
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}
