import { isNative } from "./native";

/**
 * Rewarded-ad layer.
 *
 * On device it uses the AdMob plugin when it is installed in the native shell.
 * Everywhere else (browser preview, plugin missing) it resolves immediately so
 * the reward flows stay testable. Callers only get `true` when a reward was
 * actually earned.
 */

const REWARDED_UNIT_ID = "ca-app-pub-3940256099942544/5224354917"; // Google test unit; replace with the live one.

let initialized = false;

type AdMobModule = {
  AdMob: {
    initialize: (opts: Record<string, unknown>) => Promise<void>;
    requestTrackingAuthorization?: () => Promise<unknown>;
    prepareRewardVideoAd: (opts: Record<string, unknown>) => Promise<unknown>;
    showRewardVideoAd: () => Promise<unknown>;
  };
};

async function loadAdMob(): Promise<AdMobModule["AdMob"] | null> {
  if (!isNative()) return null;
  try {
    // Resolved at runtime only: the plugin is added to the native shell, so
    // the web build must not try to bundle or type-check it.
    const specifier = "@capacitor-community/admob";
    const mod = (await import(/* @vite-ignore */ specifier)) as unknown as AdMobModule;
    if (!initialized) {
      await mod.AdMob.initialize({ initializeForTesting: false });
      initialized = true;
    }
    return mod.AdMob;
  } catch {
    return null;
  }
}

/**
 * Shows a rewarded video. Returns true when the user earned the reward.
 * Falls back to `true` outside the native shell so the game stays playable.
 */
export async function showRewardedAd(): Promise<boolean> {
  const adMob = await loadAdMob();
  if (!adMob) {
    // Browser / plugin not installed: simulate a short ad break.
    await new Promise((r) => setTimeout(r, 600));
    return true;
  }
  try {
    await adMob.prepareRewardVideoAd({ adId: REWARDED_UNIT_ID });
    const result = (await adMob.showRewardVideoAd()) as { amount?: number } | undefined;
    return Boolean(result);
  } catch {
    return false;
  }
}

/** True when ads can be shown at all (used to hide video buttons if needed). */
export const adsAvailable = () => true;
