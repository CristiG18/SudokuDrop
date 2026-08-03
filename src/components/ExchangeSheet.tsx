import { Gem, Coins, Ticket, ArrowRight } from "lucide-react";
import { fmtNum } from "@/lib/format";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useGameStore } from "@/store/game-store";
import { COINS_TO_TICKETS, GEMS_TO_COINS } from "@/game/economy";
import { useT } from "@/i18n";
import { toast } from "sonner";

/**
 * Currency conversion panel. Flow is one-way: gems -> coins -> tickets.
 */
export function ExchangeSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const t = useT();
  const diamonds = useGameStore((s) => s.diamonds);
  const coins = useGameStore((s) => s.coins);
  const gemsToCoins = useGameStore((s) => s.exchangeGemsForCoins);
  const coinsToTickets = useGameStore((s) => s.exchangeCoinsForTickets);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl border-border">
        <SheetHeader>
          <SheetTitle>{t("Schimb valutar")}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pb-6">
          <section>
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              {t("Gemuri în monede")} · {fmtNum(diamonds)} 💎
            </p>
            <div className="grid gap-2">
              {GEMS_TO_COINS.map((p) => (
                <button
                  key={p.gems}
                  type="button"
                  disabled={diamonds < p.gems}
                  onClick={() => {
                    if (gemsToCoins(p.gems, p.coins)) toast.success(`+${fmtNum(p.coins)} 🪙`);
                    else toast.error(t("Nu ai suficiente gemuri."));
                  }}
                  className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border disabled:opacity-40"
                >
                  <span className="flex items-center gap-2 font-semibold text-sm">
                    <Gem className="w-4 h-4 text-primary" /> {p.gems}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="flex items-center gap-2 font-semibold text-sm">
                    <Coins className="w-4 h-4 text-amber-500" /> {fmtNum(p.coins)}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              {t("Monede în tichete")} · {fmtNum(coins)} 🪙
            </p>
            <div className="grid gap-2">
              {COINS_TO_TICKETS.map((p) => (
                <button
                  key={p.coins}
                  type="button"
                  disabled={coins < p.coins}
                  onClick={() => {
                    if (coinsToTickets(p.coins, p.tickets)) toast.success(`+${p.tickets} 🎟`);
                    else toast.error(t("Nu ai suficiente monede."));
                  }}
                  className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border disabled:opacity-40"
                >
                  <span className="flex items-center gap-2 font-semibold text-sm">
                    <Coins className="w-4 h-4 text-amber-500" /> {fmtNum(p.coins)}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="flex items-center gap-2 font-semibold text-sm">
                    <Ticket className="w-4 h-4 text-primary" /> {p.tickets}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
