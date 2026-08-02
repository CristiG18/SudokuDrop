import { cn } from "@/lib/utils";
import { useGameStore, type Skin } from "@/store/game-store";

interface JewelProps {
  value: number; // 0 = joker
  size: number;
  ghost?: boolean;
  popping?: boolean;
  clearing?: boolean;
  highlight?: boolean;
}

export function skinStyle(skin: Skin, value: number): React.CSSProperties {
  if (skin === "glass") {
    return {
      background:
        "linear-gradient(160deg, rgba(255,255,255,0.95), color-mix(in oklab, var(--color-primary) 12%, white))",
      border: "1px solid color-mix(in oklab, var(--color-primary) 30%, white)",
      color: value === 0 ? "var(--color-muted-foreground)" : "var(--color-primary)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
    };
  }
  if (skin === "neon") {
    return {
      background: "oklch(0.22 0.02 250)",
      border: "1px solid color-mix(in oklab, var(--color-primary) 60%, transparent)",
      color: value === 0 ? "oklch(0.85 0 0)" : "color-mix(in oklab, var(--color-primary) 80%, white)",
      boxShadow: "0 0 12px color-mix(in oklab, var(--color-primary) 50%, transparent)",
    };
  }
  if (skin === "wood") {
    return {
      background: "linear-gradient(160deg, #f5d9a8, #d6a86b)",
      border: "1px solid #a4763d",
      color: value === 0 ? "#5b3d1d" : "#3a2410",
    };
  }
  if (skin === "marble") {
    return {
      background: "linear-gradient(135deg, #f7f5f0 0%, #e6e2d8 50%, #d8d3c6 100%)",
      border: "1px solid #b8b1a1",
      color: value === 0 ? "#7a6f57" : "#3a3529",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
    };
  }
  if (skin === "sunset") {
    return {
      background: "linear-gradient(160deg, #ffb457, #ff6b6b 55%, #c44569)",
      border: "1px solid #a63e56",
      color: "#fff8e7",
      textShadow: "0 1px 2px rgba(0,0,0,0.25)",
    };
  }
  if (skin === "galaxy") {
    return {
      background:
        "radial-gradient(circle at 30% 30%, #6a4cff 0%, #2b1a6b 60%, #0a0524 100%)",
      border: "1px solid #7a5cff",
      color: value === 0 ? "#e0d4ff" : "#f6f0ff",
      boxShadow: "0 0 10px rgba(122,92,255,0.5), inset 0 0 8px rgba(255,255,255,0.1)",
    };
  }
  if (skin === "candy") {
    return {
      background: "linear-gradient(160deg, #ffd1e8, #ff8cc8 60%, #ff6bb0)",
      border: "1px solid #ff5aa3",
      color: "#5a1b3d",
      boxShadow: "inset 0 2px 4px rgba(255,255,255,0.7)",
    };
  }
  if (skin === "ice") {
    return {
      background: "linear-gradient(160deg, #e7f7ff, #b8e2f5 60%, #7ec4e6)",
      border: "1px solid #62a8cc",
      color: value === 0 ? "#3a6d85" : "#0f3a52",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 0 6px rgba(126,196,230,0.4)",
    };
  }
  if (skin === "retro") {
    return {
      background: "#ffde3d",
      border: "2px solid #1a1a1a",
      color: "#1a1a1a",
      boxShadow: "2px 2px 0 #1a1a1a",
      borderRadius: 4,
    };
  }
  if (skin === "paper") {
    return {
      background: "#fdfaf1",
      border: "1px dashed #c8bda2",
      color: value === 0 ? "#8a7f66" : "#3c3524",
    };
  }
  if (skin === "mono") {
    return {
      background: "#ffffff",
      border: "1px solid #2b2b2b",
      color: value === 0 ? "#7a7a7a" : "#1a1a1a",
    };
  }
  if (skin === "bubble") {
    return {
      background: "radial-gradient(circle at 32% 28%, #ffffff 0%, #bfe6ff 45%, #7fc4f2 100%)",
      border: "1px solid #64aede",
      color: "#0f3f5c",
      boxShadow: "inset 0 2px 6px rgba(255,255,255,0.8)",
      borderRadius: "50%",
    };
  }
  if (skin === "forest") {
    return {
      background: "linear-gradient(160deg, #cdeccb, #86c98c 60%, #4f9b60)",
      border: "1px solid #3b7a4c",
      color: "#13341d",
    };
  }
  if (skin === "sakura") {
    return {
      background: "linear-gradient(160deg, #fff0f5, #ffc9dc 60%, #ff9fc0)",
      border: "1px solid #f07ba5",
      color: "#6b2340",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
    };
  }
  if (skin === "lava") {
    return {
      background: "radial-gradient(circle at 35% 25%, #ffd166 0%, #ff6b1a 45%, #8c1b0b 100%)",
      border: "1px solid #ff8a3d",
      color: "#fff4e0",
      boxShadow: "0 0 10px rgba(255,107,26,0.5)",
      textShadow: "0 1px 2px rgba(0,0,0,0.35)",
    };
  }
  if (skin === "aurora") {
    return {
      background: "linear-gradient(140deg, #23d5ab, #23a6d5 50%, #7b5cff)",
      border: "1px solid #63e6c4",
      color: "#f2fffb",
      boxShadow: "0 0 10px rgba(35,213,171,0.45)",
    };
  }
  if (skin === "cyber") {
    return {
      background: "linear-gradient(160deg, #071b22, #0d3440)",
      border: "1px solid #22e0d0",
      color: value === 0 ? "#9ff6ee" : "#5ffbe8",
      boxShadow: "0 0 12px rgba(34,224,208,0.45), inset 0 0 6px rgba(34,224,208,0.2)",
    };
  }
  if (skin === "obsidian") {
    return {
      background: "linear-gradient(160deg, #2a2a2e, #121214)",
      border: "1px solid #45454c",
      color: value === 0 ? "#a9a9b2" : "#f2f2f5",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
    };
  }
  if (skin === "gold") {
    return {
      background: "linear-gradient(160deg, #fff2b8, #e8c25a 55%, #b98b1f)",
      border: "1px solid #8a6512",
      color: "#3a2a05",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 0 8px rgba(232,194,90,0.4)",
    };
  }
  return {
    background: "var(--color-card)",
    border: "1px solid var(--color-border)",
    color: value === 0 ? "var(--color-muted-foreground)" : "var(--color-cell-user)",
  };
}

export function Jewel({ value, size, ghost, popping, clearing, highlight }: JewelProps) {
  const skin = useGameStore((s) => s.activeSkin);
  return (
    <div
      className={cn(
        "flex items-center justify-center font-semibold select-none rounded-md",
        ghost && "opacity-30",
        popping && "animate-pop",
        clearing && "opacity-0 transition-opacity duration-300",
        highlight && "ring-2 ring-primary",
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.55,
        lineHeight: 1,
        ...skinStyle(skin, value),
      }}
    >
      {value === 0 ? "★" : value}
    </div>
  );
}
