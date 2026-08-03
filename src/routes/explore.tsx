import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Square, Blocks, Swords, Clock, Zap, Timer } from "lucide-react";
import { useT } from "@/i18n";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explorează modurile — Sudoku Drop" },
      {
        name: "description",
        content:
          "Toate modurile din Sudoku Drop explicate pe larg: liber, clasic, Versus și Time Attack.",
      },
    ],
  }),
  component: Explore,
});

interface Variant {
  to: string;
  search?: Record<string, unknown>;
  title: string;
  tag: string;
  Icon: typeof Blocks;
  body: string;
  prize: string;
}

const VARIANTS: Variant[] = [
  {
    to: "/play/dropdoku",
    search: { difficulty: "normal" as const },
    title: "Sudoku Drop (liber)",
    tag: "Gratuit · fără limită",
    Icon: Blocks,
    body: "Piesele de tip domino cad una câte una într-o grilă de 9×9. Le muți stânga-dreapta, le rotești și le lași să cadă. Când o linie, o coloană sau un box de 3×3 conține cifrele fără să se repete, zona se sparge și îți dă puncte. Cifrele rămase cad mai jos, ca un joc de gravitație — dacă o piesă orizontală rămâne suspendată, se rupe în două. Jocul se termină când nu mai ai loc sus. Nu costă nimic, poți juca oricând, offline.",
    prize: "XP + record personal pe fiecare dificultate",
  },
  {
    to: "/classic",
    title: "Sudoku Clasic",
    tag: "Gratuit · 9×9 clasic",
    Icon: Square,
    body: "Sudoku-ul pe care îl știi: completezi grila astfel încât fiecare linie, coloană și box de 3×3 să conțină cifrele 1-9 o singură dată. Ai 3 indicii, maximum 3 greșeli și o limită de timp care scade odată cu dificultatea (de la 30 de minute la Ușor până la 12 minute la Extrem). Scorul depinde de cât de repede termini și de câte greșeli faci.",
    prize: "XP + monede la serii de victorii consecutive",
  },
  {
    to: "/battle",
    title: "Versus (turneu)",
    tag: "Taxă în monede · 1 🎟 / meci",
    Icon: Swords,
    body: "Turneu eliminatoriu de 4, 8 sau 16 jucători, exact ca o schemă de fotbal. Toți primesc exact aceleași piese, în aceeași ordine, deci contează doar cum le folosești. Fiecare meci durează 3 minute, iar cine termină cu scorul mai mare merge mai departe. Alegi dificultatea (Ușor, Mediu, Dificil) și taxa de intrare, de la 100 de monede până la 1 milion.",
    prize: "Locul 1 ia tot potul · locul 2 își recuperează taxa",
  },
  {
    to: "/battle",
    title: "Time Attack (ligă)",
    tag: "1000 🪙 înscriere · 1 🎟 / meci",
    Icon: Clock,
    body: "Ligă săptămânală pe 3, 5 sau 10 minute și patru niveluri: Ușor, Mediu, Dificil și Extrem (5 săculeți de cifre și cădere la fel de rapidă ca la Dificil). Pornești cu timpul ales, dar fiecare linie sau coloană îți dă +10 secunde și fiecare box +15, așa că o rundă bună poate dura mult peste durata inițială. În clasament intră doar cel mai bun scor dintr-un singur meci — îl poți doar îmbunătăți. Te înscrii separat la fiecare categorie.",
    prize: "Premii pentru locurile 1-3, top 10 și top 25% la final de săptămână",
  },
];

function Explore() {
  const t = useT();
  return (
    <div className="min-h-screen px-5 pt-5 pb-10">
      <h1 className="display text-3xl font-bold">{t("Explorează")}</h1>
      <p className="text-sm text-muted-foreground mt-1">
        {t("Fiecare mod, explicat pe larg — și ce poți câștiga.")}
      </p>

      <Link
        to="/tutorial"
        className="mt-5 flex items-center gap-3 bg-accent text-accent-foreground rounded-2xl p-4"
      >
        <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-primary">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="font-semibold">{t("Cum se joacă")}</div>
          <div className="text-xs opacity-80">{t("Tutoriale pas cu pas")}</div>
        </div>
        <span>→</span>
      </Link>

      <div className="mt-5 space-y-4">
        {VARIANTS.map((v) => (
          <div
            key={v.title}
            className="bg-card border border-border rounded-3xl p-5 shadow-soft"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-primary shrink-0">
                <v.Icon className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-lg font-bold leading-tight">{t(v.title)}</div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground mt-0.5">
                  {t(v.tag)}
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{t(v.body)}</p>

            <div className="mt-4 rounded-2xl bg-muted px-3.5 py-2.5 text-xs font-medium">
              🏆 {t(v.prize)}
            </div>

            <Link
              to={v.to}
              search={v.search as never}
              className="mt-4 block w-full text-center py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.99] transition"
            >
              {t("Joacă")}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
