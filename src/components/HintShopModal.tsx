import { useEffect, useState } from "react";
import { Gem, Play, X } from "lucide-react";
import { useGameStore } from "@/store/game-store";
import { useT } from "@/i18n";
import { showRewardedAd } from "@/lib/ads";
import { isNative } from "@/lib/native";

const MAX_ADS = 3;
const BUNDLE_COST = 50;
const BUNDLE_SIZE = 3;

interface Props {
  open: boolean;
  adsUsed: number;
  onClose: () => void;
  /** Called with how many hints were granted. */
  onGrant: (n: number, fromAd: boolean) => void;
}

/** Offered in Classic Sudoku when the 3 free hints are gone. */
export function HintShopModal({ open, adsUsed, onClose, onGrant }: Props) {
  const t = useT();
  const diamonds = useGameStore((s) => s.diamonds);
  const spendDiamonds = useGameStore((s) => s.spendDiamonds);
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
        setAdPlaying(false);
        setProgress(0);
        onGrant(1, true);
        onClose();
      }
    }, 80);
    return () => clearInterval(id);
  }, [adPlaying, onGrant, onClose]);

  /** Real rewarded ad on device, simulated ad break in the browser. */
  const startAd = async () => {
    if (!isNative()) {
      setAdPlaying(true);
      return;
    }
    if (await showRewardedAd()) {
      onGrant(1, true);
      onClose();
    }
  };

  if (!open) return null;
  const adsLeft = Math.max(0, MAX_ADS - adsUsed);

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
            <h3 className="text-lg font-bold text-center">{t("Reclamă")}</h3>
            <p className="text-center text-xs text-muted-foreground mt-1">
              {t("Primești 1 indiciu")}
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
              <h3 className="text-lg font-bold">{t("Nu mai ai indicii")}</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">{t("Cum vrei să primești ajutor?")}</p>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => void startAd()}
                disabled={adsLeft <= 0}
                className="w-full py-3 rounded-2xl bg-accent text-accent-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Play className="w-4 h-4" />
                {t("Vezi reclamă · 1 indiciu")}
                <span className="text-xs opacity-70 ml-1">
                  ({adsLeft}/{MAX_ADS})
                </span>
              </button>
              <button
                onClick={() => {
                  if (spendDiamonds(BUNDLE_COST)) {
                    onGrant(BUNDLE_SIZE, false);
                    onClose();
                  }
                }}
                disabled={diamonds < BUNDLE_COST}
                className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Gem className="w-4 h-4" /> {BUNDLE_COST} · {BUNDLE_SIZE} {t("indicii")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
