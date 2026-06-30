import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Gem, Check } from "lucide-react";
import { useState } from "react";
import { useGameStore, type Helper, type Skin } from "@/store/game-store";
import { toast } from "sonner";

export const Route = createFileRoute("/shop")({
  head: () => ({ meta: [{ title: "Magazin" }] }),
  component: ShopPage,
});

type Tab = "diamonds" | "skins" | "helpers";

const DIAMOND_PACKS = [
  { n: 100, price: "€0,99" },
  { n: 500, price: "€3,99" },
  { n: 1200, price: "€7,99" },
  { n: 3000, price: "€17,99" },
];

const SKINS: Array<{ id: Skin; name: string; cost: number; preview: string }> = [
  { id: "default", name: "Pastel", cost: 0, preview: "default" },
  { id: "glass", name: "Sticlă", cost: 300, preview: "glass" },
  { id: "neon", name: "Neon", cost: 500, preview: "neon" },
  { id: "wood", name: "Lemn", cost: 400, preview: "wood" },
];

const HELPER_PACKS: Array<{ helper: Helper; label: string }> = [
  { helper: "hammer", label: "Hammer" },
  { helper: "swap", label: "Swap" },
  { helper: "boom", label: "Bombă" },
  { helper: "cross", label: "Cruce" },
];

function PreviewBlock({ kind }: { kind: string }) {
  const style: React.CSSProperties = (() => {
    if (kind === "glass")
      return {
        background:
          "linear-gradient(160deg, rgba(255,255,255,0.95), color-mix(in oklab, var(--color-primary) 12%, white))",
        border: "1px solid color-mix(in oklab, var(--color-primary) 30%, white)",
        color: "var(--color-primary)",
      };
    if (kind === "neon")
      return {
        background: "oklch(0.22 0.02 250)",
        color: "color-mix(in oklab, var(--color-primary) 80%, white)",
        boxShadow: "0 0 12px color-mix(in oklab, var(--color-primary) 50%, transparent)",
      };
    if (kind === "wood")
      return {
        background: "linear-gradient(160deg, #f5d9a8, #d6a86b)",
        color: "#3a2410",
      };
    return {
      background: "var(--color-card)",
      border: "1px solid var(--color-border)",
      color: "var(--color-cell-user)",
    };
  })();
  return (
    <div
      className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg"
      style={style}
    >
      7
    </div>
  );
}

function ShopPage() {
  const [tab, setTab] = useState<Tab>("diamonds");
  const diamonds = useGameStore((s) => s.diamonds);
  const ownedSkins = useGameStore((s) => s.ownedSkins);
  const activeSkin = useGameStore((s) => s.activeSkin);
  const unlockSkin = useGameStore((s) => s.unlockSkin);
  const setSkin = useGameStore((s) => s.setSkin);
  const spend = useGameStore((s) => s.spendDiamonds);
  const addHelpers = useGameStore((s) => s.addHelpers);
  const helpers = useGameStore((s) => s.helpers);

  const buySkin = (s: typeof SKINS[number]) => {
    if (ownedSkins.includes(s.id)) {
      setSkin(s.id);
      toast.success(`Skin ${s.name} activat`);
      return;
    }
    if (spend(s.cost)) {
      unlockSkin(s.id);
      setSkin(s.id);
      toast.success(`Ai cumpărat ${s.name}`);
    } else {
      toast.error("Diamante insuficiente");
    }
  };

  const buyHelpers = (h: Helper) => {
    if (spend(100)) {
      addHelpers(h, 3);
      toast.success(`+3 ${h}`);
    } else toast.error("Diamante insuficiente");
  };

  return (
    <div className="min-h-screen px-5 pt-5 pb-10">
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-sm font-semibold">
          <Gem className="w-4 h-4 text-primary" />
          {diamonds}
        </div>
      </div>
      <h1 className="display text-3xl font-bold mt-5">Magazin</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Skinuri, helperi și pachete de diamante.
      </p>

      <div className="mt-4 flex gap-1 p-1 bg-muted rounded-full">
        {(["diamonds", "skins", "helpers"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${
              tab === t ? "bg-card shadow-soft text-foreground" : "text-muted-foreground"
            }`}
          >
            {t === "diamonds" ? "Diamante" : t === "skins" ? "Skinuri" : "Helperi"}
          </button>
        ))}
      </div>

      {tab === "diamonds" && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {DIAMOND_PACKS.map((p) => (
            <button
              key={p.n}
              onClick={() => toast.info("Plățile reale vin în curând.")}
              className="bg-card border border-border rounded-2xl p-4 shadow-soft text-left active:scale-[0.98] transition"
            >
              <div className="flex items-center gap-1 text-primary">
                <Gem className="w-5 h-5" />
                <span className="text-2xl font-bold">{p.n}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">diamante</p>
              <div className="mt-3 inline-block px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                {p.price}
              </div>
            </button>
          ))}
        </div>
      )}

      {tab === "skins" && (
        <div className="mt-5 space-y-2">
          {SKINS.map((s) => {
            const owned = ownedSkins.includes(s.id);
            const active = activeSkin === s.id;
            return (
              <button
                key={s.id}
                onClick={() => buySkin(s)}
                className="w-full flex items-center bg-card border border-border rounded-2xl p-3 shadow-soft active:scale-[0.99] transition"
              >
                <PreviewBlock kind={s.preview} />
                <div className="flex-1 text-left ml-3">
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {owned ? (active ? "Activ" : "Tap pentru a activa") : "Skin piesă Dropdoku"}
                  </div>
                </div>
                {active ? (
                  <span className="px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Activ
                  </span>
                ) : owned ? (
                  <span className="px-3 py-1 rounded-full bg-muted text-xs font-bold">
                    Activează
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1">
                    <Gem className="w-3 h-3" /> {s.cost}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {tab === "helpers" && (
        <div className="mt-5 space-y-2">
          {HELPER_PACKS.map((p) => (
            <button
              key={p.helper}
              onClick={() => buyHelpers(p.helper)}
              className="w-full flex items-center bg-card border border-border rounded-2xl p-4 shadow-soft active:scale-[0.99] transition"
            >
              <span className="w-1.5 h-10 rounded-full bg-primary mr-3" />
              <div className="flex-1 text-left">
                <div className="font-semibold">3× {p.label}</div>
                <div className="text-xs text-muted-foreground">
                  Stoc curent: {helpers[p.helper]}
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1">
                <Gem className="w-3 h-3" /> 100
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
