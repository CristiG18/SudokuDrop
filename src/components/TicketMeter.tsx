import { useEffect, useState } from "react";
import { Ticket, Play } from "lucide-react";
import { useGameStore } from "@/store/game-store";
import { TICKET_CAP, formatCountdown, msToNextTicket } from "@/game/economy";
import { useT } from "@/i18n";
import { toast } from "sonner";

/**
 * Ticket counter with live regeneration countdown and a rewarded-video button.
 * Tickets regenerate 1 / 45 min up to TICKET_CAP; videos top up to the cap too.
 */
export function TicketMeter({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const tickets = useGameStore((s) => s.tickets);
  const ticketsUpdatedAt = useGameStore((s) => s.ticketsUpdatedAt);
  const regenTickets = useGameStore((s) => s.regenTickets);
  const watchAd = useGameStore((s) => s.watchAdForTicket);
  const videosLeft = useGameStore((s) => s.ticketVideosLeft);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    regenTickets();
    const id = setInterval(() => {
      regenTickets();
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [regenTickets]);

  const remaining = msToNextTicket(tickets, ticketsUpdatedAt, now);
  const full = tickets >= TICKET_CAP;
  const left = videosLeft();

  const onWatch = () => {
    if (watchAd()) toast.success(`+1 🎟 · ${left - 1} ${t("video rămase azi")}`);
    else if (full) toast.info(t("Ai deja maximul de tichete."));
    else toast.error(t("Ai epuizat videoclipurile de azi."));
  };

  if (compact) {
    return (
      <span className="flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-card border border-border text-xs font-semibold">
        <Ticket className="w-3.5 h-3.5 text-primary" /> {tickets}
        {!full && <span className="text-muted-foreground">· {formatCountdown(remaining)}</span>}
        <button
          type="button"
          disabled={full || left <= 0}
          onClick={onWatch}
          className="ml-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40"
          aria-label={t("Vezi o reclamă pentru un tichet")}
        >
          <Play className="w-2.5 h-2.5" />
        </button>
      </span>
    );
  }


  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-xs font-semibold">
      <Ticket className="w-4 h-4 text-primary" />
      <span>
        {tickets}/{TICKET_CAP}
      </span>
      <span className="text-muted-foreground font-medium">
        {full ? t("plin") : formatCountdown(remaining)}
      </span>
      <button
        type="button"
        disabled={full || left <= 0}
        onClick={onWatch}

        className="ml-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40"
        aria-label={t("Vezi o reclamă pentru un tichet")}
      >
        <Play className="w-3 h-3" />
      </button>
    </div>
  );
}
