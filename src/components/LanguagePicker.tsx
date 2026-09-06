import { Check, Globe } from "lucide-react";
import { LANGUAGES, useLangStore, useT } from "@/i18n";
import { cn } from "@/lib/utils";

export function LanguagePicker() {
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const t = useT();

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-soft">
      <div className="flex items-center gap-2 mb-1">
        <Globe className="w-4 h-4 text-primary" />
        <div className="font-semibold">{t("Limbă")}</div>
      </div>
      <div className="text-xs text-muted-foreground mb-3">
        {t("Alege limba interfeței.")}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {LANGUAGES.map((l) => {
          const active = l.code === lang;
          return (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={cn(
                "flex items-center gap-2 rounded-xl border p-2.5 text-sm transition active:scale-[0.98]",
                active
                  ? "border-primary bg-primary text-primary-foreground font-semibold"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              <span className="text-base">{l.flag}</span>
              <span className="flex-1 text-left">{l.label}</span>
              {active && <Check className="w-4 h-4 text-primary-foreground" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
