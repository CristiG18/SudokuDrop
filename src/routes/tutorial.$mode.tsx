import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useT } from "@/i18n";

export const Route = createFileRoute("/tutorial/$mode")({
  head: () => ({ meta: [{ title: "Tutorial — Sudoku Drop" }] }),
  component: TutorialDetail,
});

interface Lesson {
  title: string;
  intro: string;
  steps: { title: string; body: string }[];
  play: { to: string; search?: Record<string, unknown>; label: string };
}

const LESSONS: Record<string, Lesson> = {
  dropdoku: {
    title: "Sudoku Drop",
    intro:
      "Piesele cad de sus. Tu le aranjezi astfel încât pe fiecare rând, coloană sau pătrat 3×3 să apară toate cifrele 1–9 fără să se repete.",
    steps: [
      {
        title: "Mută piesa",
        body: "Trage cu degetul stânga sau dreapta peste tablă. Sau folosește butoanele.",
      },
      {
        title: "Rotește",
        body: "Atinge tabla o singură dată. Piesele orizontale devin verticale și invers.",
      },
      { title: "Aruncă", body: "Apasă butonul ⬇ sau trage rapid în jos pentru drop instant." },
      {
        title: "Completează",
        body: "Un rând, o coloană sau un pătrat 3×3 complet (1–9 fără dubluri) dispare.",
      },
      {
        title: "Joker ★",
        body: "La fiecare a 12-a piesă primești un joker, care înlocuiește orice cifră lipsă.",
      },
      {
        title: "Helpers",
        body: "Hammer șterge o celulă, Swap interschimbă două vecine, Boom curăță un + pe tablă.",
      },
    ],
    play: { to: "/play/dropdoku", search: { difficulty: "normal" }, label: "Joacă Sudoku Drop" },
  },
  classic: {
    title: "Sudoku Clasic",
    intro:
      "Completează grila 9×9 astfel încât fiecare rând, fiecare coloană și fiecare pătrat 3×3 să conțină cifrele 1–9 fără repetare.",
    steps: [
      { title: "Selectează", body: "Atinge o celulă goală pentru a o evidenția." },
      {
        title: "Scrie o cifră",
        body: "Folosește tastatura de jos. Contorul de sub fiecare cifră arată câte mai sunt de plasat.",
      },
      { title: "Greșeli", body: "Ai voie 3 greșeli. La a 3-a se termină jocul." },
      {
        title: "Indicii",
        body: "Începi cu 3 indicii. Selectează o celulă și apasă becul pentru a o completa.",
      },
      {
        title: "Auto-completare",
        body: "Când rămân doar câteva celule și fiecare are un singur candidat, grila se umple singură. Poți dezactiva din Setări.",
      },
    ],
    play: { to: "/classic", label: "Joacă Sudoku Clasic" },
  },
  daily: {
    title: "Provocarea Zilnică",
    intro:
      "În fiecare zi un puzzle nou, identic pentru toți jucătorii. 3 zile ușoare, 2 medii și 2 grele pe săptămână.",
    steps: [
      { title: "Câștigă serii", body: "Termină în fiecare zi pentru bonusuri în diamante." },
      { title: "Comparat global", body: "După victorie vezi unde te clasezi față de ceilalți." },
    ],
    play: { to: "/daily", label: "Vezi provocarea de azi" },
  },
  battle: {
    title: "Turnee 1v1",
    intro:
      "Joacă același puzzle împotriva altui jucător. Câștigă cine termină mai repede cu mai puține greșeli.",
    steps: [
      {
        title: "Tiere",
        body: "Bronz, Argint, Aur, Platină — te înscrii separat la fiecare categorie, cu 1000 🪙.",
      },
      { title: "Premii", body: "Top fiecărui sezon primește diamante și skinuri exclusive." },
    ],
    play: { to: "/battle", label: "Intră în turneu" },
  },
};

function TutorialDetail() {
  const t = useT();
  const { mode } = Route.useParams();
  const navigate = useNavigate();
  const lesson = LESSONS[mode];
  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-muted-foreground">{t("Tutorial inexistent.")}</p>
          <Link to="/tutorial" className="text-primary underline mt-3 inline-block">
            {t("Înapoi la tutorial")}
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen px-5 pt-5 pb-8">
      <Link
        to="/tutorial"
        className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <h1 className="display text-3xl font-bold mt-6">{t(lesson.title)}</h1>
      <p className="text-sm text-muted-foreground mt-2">{t(lesson.intro)}</p>

      <ol className="mt-6 space-y-3">
        {lesson.steps.map((s, i) => (
          <li key={s.title} className="bg-card border border-border rounded-2xl p-4 shadow-soft">
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <div>
                <div className="font-semibold">{t(s.title)}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{t(s.body)}</div>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <button
        onClick={() => navigate({ to: lesson.play.to, search: lesson.play.search as never })}
        className="mt-6 block w-full text-center py-4 rounded-full bg-primary text-primary-foreground font-bold shadow-card active:scale-[0.98] transition"
      >
        {t(lesson.play.label)}
      </button>
    </div>
  );
}
