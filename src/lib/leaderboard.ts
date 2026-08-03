import { supabase } from "@/integrations/supabase/client";

export type LeaderRow = { position: number; userId: string | null; name: string; score: number };

/**
 * Records a run score for the global leaderboard. Only the player's best score
 * per (mode, difficulty) is kept server-side. Silently no-ops when the player
 * is not signed in or offline — local progress is still saved by the store.
 */
export async function submitScore(mode: string, difficulty: string, score: number) {
  if (!Number.isFinite(score) || score <= 0) return;
  try {
    const { data: auth } = await supabase.auth.getSession();
    if (!auth.session) return;
    await supabase.rpc("submit_score", {
      _mode: mode,
      _difficulty: difficulty ?? "",
      _score: Math.floor(score),
    });
  } catch {
    /* offline — ignore */
  }
}

export async function fetchTop(mode: string, difficulty: string, limit = 50): Promise<LeaderRow[]> {
  try {
    const { data, error } = await supabase.rpc("leaderboard_top", {
      _mode: mode,
      _difficulty: difficulty ?? "",
      _limit: limit,
    });
    if (error || !Array.isArray(data)) return [];
    return (data as Array<Record<string, unknown>>).map((r, i) => ({
      position: Number(r["position"] ?? i + 1),
      userId: (r["user_id"] as string) ?? null,
      name: (r["display_name"] as string) || "Player",
      score: Number(r["score"] ?? 0),
    }));
  } catch {
    return [];
  }
}

export async function fetchMyRank(
  mode: string,
  difficulty: string,
): Promise<{ position: number; total: number; score: number } | null> {
  try {
    const { data: auth } = await supabase.auth.getSession();
    if (!auth.session) return null;
    const { data, error } = await supabase.rpc("leaderboard_rank", {
      _mode: mode,
      _difficulty: difficulty ?? "",
    });
    const row = Array.isArray(data) ? (data[0] as Record<string, unknown> | undefined) : undefined;
    if (error || !row || row["score"] == null) return null;
    return {
      position: Number(row["position"] ?? 0),
      total: Number(row["total"] ?? 0),
      score: Number(row["score"] ?? 0),
    };
  } catch {
    return null;
  }
}
