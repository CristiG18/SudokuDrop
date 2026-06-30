import { useEffect, useState } from "react";
import { Gem, Play, X } from "lucide-react";
import { useGameStore, type Helper } from "@/store/game-store";

const LABELS: Record<Helper, string> = {
  hammer: "Hammer",
  swap: "Swap",
  boom: "Bombă",
  cross: "Cruce",
};

const MAX_FREE = 3;
const BUNDLE_COST = 100;
const BUNDLE_SIZE = 3;

interface Props {
  helper: Helper | null;
  onClose: () => void;
}

export function RewardedHelperModal({ helper, onClose }: Props) {
  const rewardsUsed = useGameStore((s) => s.rewardsUsed);
  const bumpReward = useGameStore((s) => s.bumpRewardUsed);
  const addHelpers = useGameStore((s) => s.addHelpers);
  const spendDiamonds = useGameStore((s) => s.spendDiamonds);
  const diamonds = useGameStore((s) => s.diamonds);

  const [adPlaying, setAdPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!adPlaying) return;
    const start = Date.now();
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / 5000);
      setProgress(p);
      if (p >= 1) {
        clearInterval(id);
        if (helper) {
          bumpReward(helper);
          addHelpers(helper, 1);
        }
        setAdPlaying(false);
        setProgress(0);
        onClose();
      }
    }, 80);
    return () => clearInterval(id);
  }, [adPlaying, helper, bumpReward, addHelpers, onClose]);

  if (!helper) return null;
  const used = rewardsUsed[helper] ?? 0;
  const adsLeft = Math.max(0, MAX_FREE - used);
  const label = LABELS[helper];

  const buy = () => {
    if (spendDiamonds(BUNDLE_COST)) {
      addHelpers(helper, BUNDLE_SIZE);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-foreground/60 backdrop-blur-sm z-50 flex items-center justify-center px-5"
      onClick={adPlaying ? undefined : onClose}
    >
      <div
        className="bg-card rounded-3xl p-6 w-full max-w-sm shadow-card animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {adPlaying ? (
          <>
            <h3 className="text-lg font-bold text-center">Reclamă</h3>
            <p className="text-center text-xs text-muted-foreground mt-1">
              Mulțumim! Primești 1× {label}
            </p>
            <div className="mt-5 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-[width] duration-100"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="mt-3 text-center text-xs text-muted-foreground tabular-nums">
              {Math.ceil((1 - progress) * 5)}s
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold">{label} epuizat</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">Cum vrei să primești ajutor?</p>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => setAdPlaying(true)}
                disabled={adsLeft <= 0}
                className="w-full py-3 rounded-2xl bg-accent text-accent-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Play className="w-4 h-4" />
                Vezi reclamă · primești 1× {label}
                <span className="text-xs opacity-70 ml-1">({adsLeft}/{MAX_FREE})</span>
              </button>
              <button
                onClick={buy}
                disabled={diamonds < BUNDLE_COST}
                className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Gem className="w-4 h-4" /> {BUNDLE_COST} · {BUNDLE_SIZE}× {label}
              </button>
              {adsLeft <= 0 && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Ai consumat reclamele pentru acest meci.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
