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
  /** True once the player picked a language on first launch. */
  chosen: boolean;
  setLang: (l: LangCode) => void;
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: "en" as LangCode,
      chosen: false,
      setLang: (lang) => set({ lang, chosen: true }),
    }),
    { name: "sudoku-drop-lang-v2" },
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
