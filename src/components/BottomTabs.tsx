import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Swords, Compass, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";

const TABS = [
  { to: "/", label: "Acasă", Icon: Home },
  { to: "/battle", label: "Bătălie", Icon: Swords },
  { to: "/explore", label: "Explorează", Icon: Compass },
  { to: "/personal", label: "Personal", Icon: User },
] as const;

const HIDE_ON: (string | RegExp)[] = [
  /^\/play\//,
  /^\/classic\/game/,
];

export function BottomTabs() {
  const t = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (HIDE_ON.some((m) => (typeof m === "string" ? pathname === m : m.test(pathname)))) {
    return null;
  }
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur border-t border-border">
      <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {TABS.map(({ to, label, Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl transition",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 1.8} />
              <span className={cn("text-[11px]", active && "font-semibold")}>
                {t(label)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
