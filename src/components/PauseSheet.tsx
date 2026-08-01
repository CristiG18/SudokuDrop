import { Play, RotateCcw, Home, X } from "lucide-react";
import { SkinPicker } from "@/components/SkinPicker";
import { useT } from "@/i18n";


interface Props {
  open: boolean;
  title?: string;
  canRestart?: boolean;
  onResume: () => void;
  onRestart?: () => void;
  onMenu: () => void; // back to previous menu (keep session)
  onExit?: () => void; // discard session and leave
}

export function PauseSheet({
  open,
  title = "Pauză",
  canRestart = true,
  onResume,
  onRestart,
  onMenu,
  onExit,
}: Props) {
  const t = useT();
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-40 flex items-end sm:items-center justify-center px-4"
      onClick={onResume}
    >
      <div
        className="bg-card rounded-3xl p-6 w-full max-w-sm shadow-card animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-center">{t(title)}</h2>
        <p className="text-center text-sm text-muted-foreground mt-1">{t("Ce vrei să faci?")}</p>

        <div className="mt-4 rounded-2xl bg-muted/60 p-3">
          <SkinPicker compact />
        </div>

        <div className="flex flex-col gap-2 mt-4">

          <button
            onClick={onResume}
            className="py-3 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" /> {t("Reia jocul")}
          </button>
          {canRestart && onRestart && (
            <button
              onClick={onRestart}
              className="py-3 rounded-2xl bg-muted font-semibold flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> {t("Restart")}
            </button>
          )}
          <button
            onClick={onMenu}
            className="py-3 rounded-2xl bg-card border border-border font-semibold flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> {t("Meniu principal")}
          </button>
          {onExit && (
            <button
              onClick={onExit}
              className="py-3 rounded-2xl text-muted-foreground font-medium flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" /> {t("Ieși și șterge sesiunea")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
