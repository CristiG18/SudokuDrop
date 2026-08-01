import { create } from "zustand";
import { persist } from "zustand/middleware";
import { dictionaries } from "./dictionaries";

export const LANGUAGES = [
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

interface LangState {
  lang: LangCode;
  setLang: (l: LangCode) => void;
}

function detect(): LangCode {
  if (typeof navigator === "undefined") return "ro";
  const nav = (navigator.language || "ro").slice(0, 2).toLowerCase();
  return (LANGUAGES.some((l) => l.code === nav) ? nav : "en") as LangCode;
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: "ro" as LangCode,
      setLang: (lang) => set({ lang }),
    }),
    {
      name: "sudoku-drop-lang",
      onRehydrateStorage: () => (state, error) => {
        if (!error && state && !localStorage.getItem("sudoku-drop-lang-touched")) {
          localStorage.setItem("sudoku-drop-lang-touched", "1");
          state.setLang(detect());
        }
      },
    },
  ),
);

/** Translate a Romanian source string into the active language. */
export function translate(lang: LangCode, key: string): string {
  if (lang === "ro") return key;
  return dictionaries[lang]?.[key] ?? key;
}

/** Hook returning a translator bound to the active language. */
export function useT() {
  const lang = useLangStore((s) => s.lang);
  return (key: string) => translate(lang, key);
}

export function useLang() {
  return useLangStore((s) => s.lang);
}
