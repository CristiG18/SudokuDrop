import { useEffect, useState } from "react";
import { Coins, Ticket, Gift, X } from "lucide-react";
import { useGameStore } from "@/store/game-store";

export function DailyRewardModal() {
  const checkPending = useGameStore((s) => s.checkDailyPending);
  const claim = useGameStore((s) => s.claimDaily);
  const streak = useGameStore((s) => s.loginStreak);
  const [pending, setPending] = useState<ReturnType<typeof checkPending>>(null);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    setPending(checkPending());
  }, [checkPending]);

  if (!pending) return null;

  const doClaim = () => {
    const r = claim();
    if (r) setClaimed(true);
    setTimeout(() => setPending(null), 800);
  };

  const dayInCycle = pending.day;
  const days = Array.from({ length: 7 }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-card rounded-3xl p-6 shadow-card animate-slide-up relative">
        <button
          onClick={() => setPending(null)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-muted flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Gift className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Recompensă zilnică</h2>
            <p className="text-xs text-muted-foreground">
              Ziua {dayInCycle} · streak {streak + (claimed ? 0 : 1)}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-1.5">
          {days.map((d) => {
            const isToday = d === dayInCycle;
            const past = d < dayInCycle;
            return (
              <div
                key={d}
                className={
                  "aspect-square rounded-xl flex flex-col items-center justify-center text-[10px] font-semibold " +
                  (isToday
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/40 shadow-card"
                    : past
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground")
                }
              >
                <span>Z{d}</span>
                <Coins className="w-3 h-3 mt-0.5" />
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-2xl bg-accent/40 p-4 flex items-center justify-around text-sm">
          <div className="flex items-center gap-1.5 font-bold">
            <Coins className="w-4 h-4 text-amber-500" /> +{pending.coins}
          </div>
          {pending.tickets > 0 && (
            <div className="flex items-center gap-1.5 font-bold">
              <Ticket className="w-4 h-4 text-primary" /> +{pending.tickets}
            </div>
          )}
        </div>

        <button
          onClick={doClaim}
          disabled={claimed}
          className="mt-5 w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold shadow-card active:scale-[0.98] transition disabled:opacity-50"
        >
          {claimed ? "Colectat!" : "Colectează"}
        </button>
      </div>
    </div>
  );
}
