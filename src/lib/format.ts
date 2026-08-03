/** Thousands separator used everywhere for currencies and scores: 9000 -> 9.000 */
export function fmtNum(n: number | null | undefined) {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v)) return "0";
  return Math.round(v).toLocaleString("ro-RO");
}
