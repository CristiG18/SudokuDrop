import { useEffect, useState } from "react";
import { Gem, Timer, Play, ShoppingBag } from "lucide-react";
import { useT } from "@/i18n";
import { useGameStore, type Skin } from "@/store/game-store";
import { SKIN_CATALOG } from "@/game/cosmetics";
import { GEM_PACKS } from "@/lib/billing";
import { GemPackButton } from "@/routes/shop";
import { fmtNum } from "@/lib/format";

const RETURN_SECS = 120;

/** Step 1: ask before leaving the match. Step 2: in-match gem shop with a 2-min clock. */
export function LockedSkinPrompt({
  skinId,
  onClose,
  onGoShop,
}: {
  skinId: string | null;
  onClose: () => void;
  onGoShop: () => void;
}) {
  const t = useT();
  const diamonds = useGameStore((s) => s.diamonds);
  const spend = useGameStore((s) => s.spendDiamonds);
  const unlock = useGameStore((s) => s.unlockSkin);
  const setSkin = useGameStore((s) => s.setSkin);
  if (!skinId) return null;
  const skin = SKIN_CATALOG.find((s) => s.id === skinId);
  if (!skin) return null;
  const enough = diamonds >= skin.cost;

  return (
    <div className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-center justify-center px-6">
      <div className="bg-card rounded-3xl p-6 w-full max-w-sm shadow-card animate-slide-up text-center">
        <Gem className="w-8 h-8 text-primary mx-auto" />
        <h2 className="text-lg font-bold mt-2">{t(skin.name)}</h2>
        {enough ? (
          <p className="text-sm text-muted-foreground mt-1">
            {t("Deblochezi skinul pentru")} {fmtNum(skin.cost)} {t("gemuri")}?
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">
            {t("Nu ai suficiente gemuri pentru acest skin. Vrei să mergi la magazin? Ai 2 minute să revii la meci, altfel vei fi descalificat.")}
          </p>
        )}
        <div className="flex flex-col gap-2 mt-4">
          {enough ? (
            <button
              className="py-3 rounded-2xl bg-primary text-primary-foreground font-semibold"
              onClick={() => {
                if (spend(skin.cost)) {
                  unlock(skin.id as Skin);
                  setSkin(skin.id as Skin);
                }
                onClose();
              }}
            >
              {t("Deblochează")}
            </button>
          ) : (
            <button
              className="py-3 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2"
              onClick={onGoShop}
            >
              <ShoppingBag className="w-4 h-4" /> {t("Da, mergi la magazin")}
            </button>
          )}
          <button className="py-3 rounded-2xl bg-muted font-semibold" onClick={onClose}>
            {t("Nu")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function MatchShopSheet({
  open,
  onReturn,
  onExpire,
}: {
  open: boolean;
  onReturn: () => void;
  onExpire: () => void;
}) {
  const t = useT();
  const diamonds = useGameStore((s) => s.diamonds);
  const [left, setLeft] = useState(RETURN_SECS);

  useEffect(() => {
    if (!open) return;
    setLeft(RETURN_SECS);
    const id = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (open && left <= 0) onExpire();
  }, [open, left, onExpire]);

  if (!open) return null;
  const mm = Math.floor(Math.max(0, left) / 60);
  const ss = String(Math.max(0, left) % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col px-4 pt-6 pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-lg">
          <ShoppingBag className="w-5 h-5 text-primary" /> {t("Magazin")}
        </div>
        <div className="flex items-center gap-1 text-primary font-bold">
          <Gem className="w-4 h-4" /> {fmtNum(diamonds)}
        </div>
      </div>
      <div className="mt-3 rounded-2xl bg-destructive/10 text-destructive p-3 text-sm font-semibold flex items-center gap-2">
        <Timer className="w-4 h-4 shrink-0" />
        {t("Revino la meci în")} {mm}:{ss}
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        {GEM_PACKS.map((p) => (
          <GemPackButton key={p.id} pack={p} />
        ))}
      </div>
      <button
        onClick={onReturn}
        className="mt-auto py-3 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2"
      >
        <Play className="w-4 h-4" /> {t("Reia meciul")} ({mm}:{ss})
      </button>
    </div>
  );
}
