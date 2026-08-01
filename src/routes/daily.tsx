import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Calendar } from "lucide-react";
import { dailyForDate, isoWeek, weekSchedule } from "@/game/schedule";
import { useT } from "@/i18n";

export const Route = createFileRoute("/daily")({
  head: () => ({ meta: [{ title: "Provocarea Zilnică" }] }),
  component: Daily,
});

const DAY_LABELS = ["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"];
const DIFF_COLOR: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-rose-100 text-rose-700",
};

function Daily() {
  const t = useT();
  const navigate = useNavigate();
  const today = new Date();
  const week = weekSchedule(today);
  const { year, week: weekNum } = isoWeek(today);
  const todayIdx = (today.getDay() + 6) % 7;
  const todayDiff = dailyForDate(today);

  const startGame = () => {
    // deterministic seed per day
    const seed = year * 10000 + weekNum * 10 + todayIdx;
    const diffMap = { easy: "easy", medium: "medium", hard: "expert" } as const;
    navigate({
      to: "/play/classic",
      search: { difficulty: diffMap[todayDiff], seed },
    });
  };

  return (
    <div className="min-h-screen px-5 pt-5">
      <Link to="/" className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center">
        <ArrowLeft className="w-5 h-5" />
      </Link>

      <div className="mt-6 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <Calendar className="w-6 h-6" strokeWidth={1.6} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("Provocarea Zilnică")}</h1>
          <p className="text-xs text-muted-foreground">
            {t("Săpt.")} {weekNum} · {year} · {t("3 ușoare, 2 medii, 2 grele")}
          </p>
        </div>
      </div>

      <div className="mt-6 bg-card border border-border rounded-3xl p-6 shadow-card text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("Astăzi")}</p>
        <h2 className="mt-1 text-3xl font-bold capitalize">
          {today.toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long" })}
        </h2>
        <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold ${DIFF_COLOR[todayDiff]}`}>
          {todayDiff.toUpperCase()}
        </span>
        <button
          onClick={startGame}
          className="mt-5 w-full py-3 rounded-full bg-primary text-primary-foreground font-bold shadow-soft"
        >
          {t("Joacă acum")}
        </button>
      </div>

      <h3 className="mt-6 mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {t("Săptămâna aceasta")}
      </h3>
      <div className="grid grid-cols-7 gap-2">
        {week.map((d, i) => (
          <div
            key={i}
            className={`flex flex-col items-center py-3 rounded-2xl border ${
              i === todayIdx ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"
            }`}
          >
            <span className="text-[10px] uppercase opacity-70">{DAY_LABELS[i]}</span>
            <span className={`text-[10px] mt-1.5 font-semibold ${i === todayIdx ? "" : DIFF_COLOR[d].split(" ")[1]}`}>
              {d.charAt(0).toUpperCase()}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground text-center">
        {t("Toți jucătorii primesc aceeași programare în fiecare săptămână.")}
      </p>
    </div>
  );
}
