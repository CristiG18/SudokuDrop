import { isNative } from "./native";

/**
 * Rewarded-ad layer with GDPR/UMP consent.
 *
 * On device it uses the AdMob plugin when it is installed in the native shell.
 * Before the first real ad we initialize AdMob and request/show the Google
 * consent form when it is required (EEA/UK / IDFA).
 * Everywhere else (browser preview, plugin missing) we simulate a short ad
 * break so reward flows stay testable.
 */

// AdMob App ID from the Google Play / AdMob dashboard.
export const ADMOB_APP_ID = "ca-app-pub-4013371667115642~7583618725";

// Rewarded ad unit. In development / preview we use Google's test unit.
// Replace with the live rewarded unit from AdMob → Ad units.
const REWARDED_UNIT_ID =
  (typeof import.meta.env !== "undefined" && import.meta.env.VITE_ADMOB_REWARDED_UNIT_ID) ||
  "ca-app-pub-3940256099942544/5224354917";

let initialized = false;
let canRequestAds = false;

type ConsentInfo = {
  canRequestAds: boolean;
  isConsentFormAvailable: boolean;
  status: string;
};

type AdMobModule = {
  AdMob: {
    initialize: (opts: Record<string, unknown>) => Promise<void>;
    requestConsentInfo: (opts?: Record<string, unknown>) => Promise<ConsentInfo>;
    showConsentForm: () => Promise<ConsentInfo>;
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
    return mod.AdMob;
  } catch {
    return null;
  }
}

/**
 * Initializes AdMob and resolves the user's consent status.
 * Safe to call multiple times; runs only on the native shell.
 */
export async function initAds(): Promise<void> {
  const adMob = await loadAdMob();
  if (!adMob) return;

  try {
    if (!initialized) {
      await adMob.initialize({ initializeForTesting: false });
      initialized = true;
    }

    const info = await adMob.requestConsentInfo();
    if (!info.canRequestAds && info.isConsentFormAvailable) {
      const result = await adMob.showConsentForm();
      canRequestAds = result.canRequestAds;
    } else {
      canRequestAds = info.canRequestAds;
    }
  } catch {
    canRequestAds = false;
  }
}

/**
 * Shows a rewarded video. Returns true when the user earned the reward.
 * Falls back to a simulated ad break outside the native shell so the game
 * stays playable in browser preview.
 */
export async function showRewardedAd(): Promise<boolean> {
  const adMob = await loadAdMob();
  if (!adMob) {
    // Browser / plugin not installed: simulate a short ad break.
    await new Promise((r) => setTimeout(r, 600));
    return true;
  }

  if (!initialized) await initAds();
  if (!canRequestAds) return false;

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
