import { createFileRoute, Link } from "@tanstack/react-router";
import { fmtNum } from "@/lib/format";
import { ArrowLeft, Gem, Check, Coins, Ticket, ArrowLeftRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useGameStore, type Helper, type Skin } from "@/store/game-store";
import { SKIN_CATALOG, THEME_CATALOG } from "@/game/cosmetics";
import { skinStyle } from "@/components/game/Jewel";
import { toast } from "sonner";
import { useT } from "@/i18n";
import { ExchangeSheet } from "@/components/ExchangeSheet";
import { GEM_PACKS, purchaseGems } from "@/lib/billing";

export const Route = createFileRoute("/shop")({
  head: () => ({ meta: [{ title: "Magazin" }] }),
  component: ShopPage,
});

type Tab = "diamonds" | "skins" | "colors" | "helpers";

const DIAMOND_PACKS = GEM_PACKS;

const SKINS = SKIN_CATALOG;

const HELPER_PACKS: Array<{ helper: Helper; label: string }> = [
  { helper: "hammer", label: "Hammer" },
  { helper: "swap", label: "Swap" },
  { helper: "boom", label: "Bombă" },
  { helper: "cross", label: "Cruce" },
];

function PreviewBlock({ kind }: { kind: Skin }) {
  const style = skinStyle(kind, 7);
  return (
    <div
      className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg"
      style={style}
    >
      7
    </div>
  );
}

function GemPackButton({ pack }: { pack: (typeof GEM_PACKS)[number] }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const addDiamonds = useGameStore((s) => s.addDiamonds);

  const buy = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const gems = await purchaseGems(pack.id);
      addDiamonds(gems);
      toast.success(`${t("Ai primit")} ${fmtNum(gems)} ${t("gemuri")}!`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.toLowerCase().includes("cancel")) {
        toast.info(t("Achiziție anulată."));
      } else {
        toast.error(`${t("Achiziție eșuată")}: ${message}`);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      disabled={busy}
      onClick={buy}
      className="bg-card border border-border rounded-2xl p-4 shadow-soft text-left active:scale-[0.98] transition disabled:opacity-60"
    >
      <div className="flex items-center gap-1 text-primary">
        <Gem className="w-5 h-5" />
        {busy ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <span className="text-2xl font-bold">{fmtNum(pack.gems)}</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1">{t("diamante")}</p>
      <div className="mt-3 inline-block px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
        {pack.price}
      </div>
    </button>
  );
}

function ShopPage() {
  const t = useT();
  const [tab, setTab] = useState<Tab>("diamonds");
  const [exchange, setExchange] = useState(false);
  const coins = useGameStore((s) => s.coins);
  const tickets = useGameStore((s) => s.tickets);
  const diamonds = useGameStore((s) => s.diamonds);
  const ownedSkins = useGameStore((s) => s.ownedSkins);
  const activeSkin = useGameStore((s) => s.activeSkin);
  const unlockSkin = useGameStore((s) => s.unlockSkin);
  const setSkin = useGameStore((s) => s.setSkin);
  const spend = useGameStore((s) => s.spendDiamonds);
  const addHelpers = useGameStore((s) => s.addHelpers);
  const ownedThemes = useGameStore((s) => s.ownedThemes);
  const activeTheme = useGameStore((s) => s.activeTheme);
  const unlockTheme = useGameStore((s) => s.unlockTheme);
  const setTheme = useGameStore((s) => s.setTheme);
  const helpers = useGameStore((s) => s.helpers);
  const helperCount = (helper: Helper) => {
    const value = helpers[helper];
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
  };

  const buySkin = (skin: typeof SKINS[number]) => {
    if (ownedSkins.includes(skin.id)) {
      setSkin(skin.id);
      toast.success(`${t("Skin")} ${t(skin.name)} ${t("activat")}`);
      return;
    }
    if (spend(skin.cost)) {
      unlockSkin(skin.id);
      setSkin(skin.id);
      toast.success(`${t("Ai cumpărat")} ${t(skin.name)}`);
    } else {
      toast.error(t("Diamante insuficiente"));
    }
  };

  const buyTheme = (theme: (typeof THEME_CATALOG)[number]) => {
    if (ownedThemes.includes(theme.key)) {
      setTheme(theme.key);
      toast.success(`${t("Culoare activată")}: ${t(theme.name)}`);
      return;
    }
    if (spend(theme.cost)) {
      unlockTheme(theme.key);
      setTheme(theme.key);
      toast.success(`${t("Ai cumpărat")} ${t(theme.name)}`);
    } else {
      toast.error(t("Diamante insuficiente"));
    }
  };

  const buyHelpers = (h: Helper) => {
    if (spend(100)) {
      addHelpers(h, 3);
      toast.success(`+3 ${h}`);
    } else toast.error(t("Diamante insuficiente"));
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
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-card border border-border text-xs font-semibold">
            <Ticket className="w-3.5 h-3.5 text-primary" /> {tickets}
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-card border border-border text-xs font-semibold">
            <Coins className="w-3.5 h-3.5 text-amber-500" /> {fmtNum(coins)}
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-card border border-border text-xs font-semibold">
            <Gem className="w-3.5 h-3.5 text-primary" /> {fmtNum(diamonds)}
          </span>
        </div>
      </div>
      <h1 className="display text-3xl font-bold mt-5">{t("Magazin")}</h1>
      <p className="text-sm text-muted-foreground mt-1">
        {t("Skinuri, helperi și pachete de diamante.")}
      </p>

      <div className="mt-4 flex gap-1 p-1 bg-muted rounded-full">
        {(["diamonds", "skins", "colors", "helpers"] as Tab[]).map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`flex-1 py-2 rounded-full text-xs font-semibold transition ${
              tab === tb ? "bg-card shadow-soft text-foreground" : "text-muted-foreground"
            }`}
          >
            {tb === "diamonds"
              ? t("Diamante")
              : tb === "skins"
                ? t("Skinuri")
                : tb === "colors"
                  ? t("Culori")
                  : t("Helperi")}
          </button>
        ))}
      </div>

      {tab === "diamonds" && (
        <button
          type="button"
          onClick={() => setExchange(true)}
          className="mt-5 w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border shadow-soft"
        >
          <ArrowLeftRight className="w-5 h-5 text-primary" />
          <span className="text-left flex-1">
            <span className="block font-semibold text-sm">{t("Schimb valutar")}</span>
            <span className="block text-xs text-muted-foreground">
              {t("Gemuri → monede → tichete")}
            </span>
          </span>
          <span className="text-muted-foreground">›</span>
        </button>
      )}

      {tab === "diamonds" && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {DIAMOND_PACKS.map((p) => (
            <GemPackButton key={p.id} pack={p} />
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
                <PreviewBlock kind={s.id} />
                <div className="flex-1 text-left ml-3">
                  <div className="font-semibold">{t(s.name)}</div>
                  <div className="text-xs text-muted-foreground">
                    {owned ? (active ? t("Activ") : t("Tap pentru a activa")) : t("Skin complet: piese, tablă, fundal")}
                  </div>
                </div>
                {active ? (
                  <span className="px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> {t("Activ")}
                  </span>
                ) : owned ? (
                  <span className="px-3 py-1 rounded-full bg-muted text-xs font-bold">
                    {t("Activează")}
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

      {tab === "colors" && (
        <div className="mt-5">
          <p className="text-xs text-muted-foreground mb-3">
            {t("Culoarea de fundal și accentele interfeței. Se aplică pe tot jocul.")}
          </p>
          <div className="space-y-2">
            {THEME_CATALOG.map((th) => {
              const owned = ownedThemes.includes(th.key);
              const active = activeTheme === th.key;
              return (
                <button
                  key={th.key}
                  onClick={() => buyTheme(th)}
                  className="w-full flex items-center bg-card border border-border rounded-2xl p-3 shadow-soft active:scale-[0.99] transition"
                >
                  <span
                    className="w-12 h-12 rounded-lg border border-border"
                    style={{ background: th.swatch }}
                  />
                  <div className="flex-1 text-left ml-3">
                    <div className="font-semibold">{t(th.name)}</div>
                    <div className="text-xs text-muted-foreground">
                      {owned ? (active ? t("Activ") : t("Tap pentru a activa")) : t("Culoare interfață")}
                    </div>
                  </div>
                  {active ? (
                    <span className="px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> {t("Activ")}
                    </span>
                  ) : owned ? (
                    <span className="px-3 py-1 rounded-full bg-muted text-xs font-bold">
                      {t("Activează")}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1">
                      <Gem className="w-3 h-3" /> {th.cost}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
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
                <div className="font-semibold">3× {t(p.label)}</div>
                <div className="text-xs text-muted-foreground">
                  {t("Stoc curent")}: {helperCount(p.helper)}
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1">
                <Gem className="w-3 h-3" /> 100
              </span>
            </button>
          ))}
        </div>
      )}
      <ExchangeSheet open={exchange} onOpenChange={setExchange} />
    </div>
  );
}
