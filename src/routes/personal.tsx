import { createFileRoute, Link } from "@tanstack/react-router";
import { User, Trophy, Flame, Clock, ShoppingBag, ListOrdered } from "lucide-react";
import { useGameStore } from "@/store/game-store";

export const Route = createFileRoute("/personal")({
  head: () => ({ meta: [{ title: "Personal — Sudoku Drop" }] }),
  component: Personal,
});

function Personal() {
  const diamonds = useGameStore((s) => s.diamonds);
  const helpers = useGameStore((s) => s.helpers);
  const high = useGameStore((s) => s.highScores.dropdoku);

  return (
    <div className="min-h-screen px-5 pt-5">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <User className="w-8 h-8" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-xl font-bold">Invitat</h1>
          <p className="text-sm text-muted-foreground">Conectare în Phase 3</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Stat Icon={Trophy} label="Best Dropdoku" value={high} />
        <Stat Icon={Flame} label="Streak" value={0} />
        <Stat Icon={Clock} label="Total time" value="0h" />
        <Stat Icon={Trophy} label="Diamonds" value={diamonds} />
      </div>

      <h3 className="mt-6 mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Helperi
      </h3>
      <div className="bg-card border border-border rounded-2xl p-4 shadow-soft grid grid-cols-3 text-center divide-x divide-border">
        <div><div className="font-bold text-lg">{helpers.hammer}</div><div className="text-xs text-muted-foreground">Hammer</div></div>
        <div><div className="font-bold text-lg">{helpers.swap}</div><div className="text-xs text-muted-foreground">Swap</div></div>
        <div><div className="font-bold text-lg">{helpers.boom}</div><div className="text-xs text-muted-foreground">Boom</div></div>
      </div>

      <div className="mt-6 space-y-2">
        <Row to="/shop" Icon={ShoppingBag} label="Magazin" />
        <Row to="/leaderboard" Icon={ListOrdered} label="Clasamente" />
      </div>
    </div>
  );
}

function Stat({ Icon, label, value }: { Icon: typeof Trophy; label: string; value: number | string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-soft">
      <Icon className="w-5 h-5 text-primary" strokeWidth={1.6} />
      <div className="mt-2 text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Row({ to, Icon, label }: { to: string; Icon: typeof ShoppingBag; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 shadow-soft"
    >
      <Icon className="w-5 h-5 text-primary" strokeWidth={1.6} />
      <span className="font-medium flex-1">{label}</span>
      <span className="text-muted-foreground">›</span>
    </Link>
  );
}
