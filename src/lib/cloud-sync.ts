import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGameStore } from "@/store/game-store";

/**
 * Fields of the local store that belong to the player's account and therefore
 * follow them across devices. Sessions in progress stay device-local.
 */
const SYNCED_KEYS = [
  "diamonds",
  "coins",
  "tickets",
  "ticketsUpdatedAt",
  "xp",
  "level",
  "loginStreak",
  "lastLoginDate",
  "highScores",
  "modeBest",
  "helpers",
  "ownedSkins",
  "activeSkin",
  "ownedThemes",
  "activeTheme",
  "tournamentEntries",
  "classicStreak",
] as const;

type Snapshot = Record<string, unknown>;

function snapshot(): Snapshot {
  const s = useGameStore.getState() as unknown as Snapshot;
  const out: Snapshot = {};
  for (const k of SYNCED_KEYS) out[k] = s[k];
  return out;
}

/** Merge cloud into local, keeping the most generous value for each field. */
function merge(local: Snapshot, cloud: Snapshot): Snapshot {
  const out: Snapshot = { ...local };
  const num = (k: string) =>
    (out[k] = Math.max(Number(local[k] ?? 0), Number(cloud[k] ?? 0)));
  for (const k of ["diamonds", "coins", "tickets", "xp", "level", "loginStreak", "classicStreak"])
    num(k);

  const bestMap = (k: string) => {
    const a = (local[k] ?? {}) as Record<string, number>;
    const b = (cloud[k] ?? {}) as Record<string, number>;
    const m: Record<string, number> = { ...a };
    for (const [key, v] of Object.entries(b)) m[key] = Math.max(m[key] ?? 0, v ?? 0);
    out[k] = m;
  };
  bestMap("modeBest");
  bestMap("helpers");

  const hsA = (local.highScores ?? {}) as Record<string, unknown>;
  const hsB = (cloud.highScores ?? {}) as Record<string, unknown>;
  const classicA = (hsA.classic ?? {}) as Record<string, number>;
  const classicB = (hsB.classic ?? {}) as Record<string, number>;
  const classic: Record<string, number> = { ...classicA };
  for (const [k, v] of Object.entries(classicB)) classic[k] = Math.max(classic[k] ?? 0, v ?? 0);
  out.highScores = {
    dropdoku: Math.max(Number(hsA.dropdoku ?? 0), Number(hsB.dropdoku ?? 0)),
    classic,
  };

  const union = (k: string) => {
    const a = Array.isArray(local[k]) ? (local[k] as string[]) : [];
    const b = Array.isArray(cloud[k]) ? (cloud[k] as string[]) : [];
    out[k] = Array.from(new Set([...a, ...b]));
  };
  union("ownedSkins");
  union("ownedThemes");

  out.tournamentEntries = {
    ...((cloud.tournamentEntries ?? {}) as object),
    ...((local.tournamentEntries ?? {}) as object),
  };
  out.ticketsUpdatedAt = Math.max(
    Number(local.ticketsUpdatedAt ?? 0),
    Number(cloud.ticketsUpdatedAt ?? 0),
  );
  out.lastLoginDate = (local.lastLoginDate as string) ?? (cloud.lastLoginDate as string) ?? null;
  return out;
}

async function pull(userId: string) {
  const { data, error } = await supabase
    .from("player_stats")
    .select("high_scores")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return;
  const cloud = ((data.high_scores as Snapshot) ?? {}).progress as Snapshot | undefined;
  if (!cloud) return;
  useGameStore.setState(merge(snapshot(), cloud) as never);
}

async function push(userId: string) {
  const snap = snapshot();
  await supabase.from("player_stats").upsert(
    {
      user_id: userId,
      diamonds: Number(snap.diamonds ?? 0),
      coins: Number(snap.coins ?? 0),
      tickets: Number(snap.tickets ?? 0),
      login_streak: Number(snap.loginStreak ?? 0),
      owned_skins: (snap.ownedSkins as string[]) ?? ["default"],
      active_skin: (snap.activeSkin as string) ?? "default",
      high_scores: { progress: snap } as never,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
}

/**
 * Keeps the signed-in player's progress mirrored in the cloud: pulls once on
 * sign-in (merging with whatever was played offline), then pushes debounced.
 */
export function useCloudSync() {
  const userRef = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ready = useRef(false);

  useEffect(() => {
    let unsubStore: (() => void) | undefined;

    const attach = async (userId: string) => {
      userRef.current = userId;
      ready.current = false;
      await pull(userId);
      await push(userId);
      ready.current = true;
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const id = session?.user?.id ?? null;
      if (id && id !== userRef.current) void attach(id);
      if (!id) {
        userRef.current = null;
        ready.current = false;
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      const id = data.session?.user?.id;
      if (id) void attach(id);
    });

    unsubStore = useGameStore.subscribe(() => {
      if (!userRef.current || !ready.current) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        if (userRef.current) void push(userRef.current);
      }, 2500);
    });

    return () => {
      sub.subscription.unsubscribe();
      unsubStore?.();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
}
