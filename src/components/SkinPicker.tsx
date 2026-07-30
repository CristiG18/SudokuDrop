import { Check, Lock } from "lucide-react";
import { useGameStore, type Skin } from "@/store/game-store";
import { skinStyle } from "@/components/game/Jewel";

export const SKIN_LIST: Array<{ id: Skin; name: string }> = [
  { id: "default", name: "Pastel" },
  { id: "glass", name: "Sticlă" },
  { id: "neon", name: "Neon" },
  { id: "wood", name: "Lemn" },
  { id: "marble", name: "Marmură" },
  { id: "sunset", name: "Apus" },
  { id: "galaxy", name: "Galaxie" },
  { id: "candy", name: "Bomboană" },
  { id: "ice", name: "Gheață" },
  { id: "retro", name: "Retro" },
];

interface Props {
  /** Compact variant used inside the in-game pause sheet. */
  compact?: boolean;
}

export function SkinPicker({ compact }: Props) {
  const owned = useGameStore((s) => s.ownedSkins);
  const active = useGameStore((s) => s.activeSkin);
  const setSkin = useGameStore((s) => s.setSkin);

  const size = compact ? 40 : 48;

  return (
    <div className={compact ? "" : "bg-card border border-border rounded-2xl p-4 shadow-soft"}>
      <div className={compact ? "text-xs font-semibold text-muted-foreground" : "font-semibold"}>
        Skin piese
      </div>
      {!compact && (
        <div className="text-xs text-muted-foreground mt-0.5 mb-3">
          Se aplică pe toate modurile. Se pot schimba și în timpul meciului (pauză).
        </div>
      )}
      <div className={`flex gap-2 overflow-x-auto no-scrollbar ${compact ? "mt-2" : "mt-1"}`}>
        {SKIN_LIST.map((s) => {
          const isOwned = owned.includes(s.id);
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => isOwned && setSkin(s.id)}
              disabled={!isOwned}
              aria-label={s.name}
              className={
                "relative shrink-0 rounded-xl flex items-center justify-center font-bold transition " +
                (isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : "") +
                (isOwned ? "" : " opacity-45")
              }
              style={{ width: size, height: size, fontSize: size * 0.45, ...skinStyle(s.id, 7) }}
            >
              7
              {isActive && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </span>
              )}
              {!isOwned && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                  <Lock className="w-2.5 h-2.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
