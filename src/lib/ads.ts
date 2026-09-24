import { registerPlugin } from "@capacitor/core";
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

export type RewardedAdKind = "ticket" | "revive" | "hint" | "powerup";

// Live rewarded ad units from AdMob. Env vars can override them for testing.
const REWARDED_UNITS: Record<RewardedAdKind, string> = {
  ticket:
    (typeof import.meta.env !== "undefined" && import.meta.env.VITE_ADMOB_REWARDED_TICKET_UNIT_ID) ||
    "ca-app-pub-4013371667115642/6073196121",
  revive:
    (typeof import.meta.env !== "undefined" && import.meta.env.VITE_ADMOB_REWARDED_REVIVE_UNIT_ID) ||
    "ca-app-pub-4013371667115642/6560995296",
  hint:
    (typeof import.meta.env !== "undefined" && import.meta.env.VITE_ADMOB_REWARDED_HINT_UNIT_ID) ||
    "ca-app-pub-4013371667115642/1308668611",
  powerup:
    (typeof import.meta.env !== "undefined" && import.meta.env.VITE_ADMOB_REWARDED_POWERUP_UNIT_ID) ||
    "ca-app-pub-4013371667115642/9590749246",
};

// Google's universal rewarded test unit for development / emulators.
const TEST_REWARDED_UNIT_ID = "ca-app-pub-3940256099942544/5224354917";

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

const AdMobPlugin = registerPlugin<AdMobModule["AdMob"]>("AdMob");

// Reached through the Capacitor bridge (works with the remote site too).
async function loadAdMob(): Promise<AdMobModule["AdMob"] | null> {
  if (!isNative()) return null;
  return AdMobPlugin;
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

function getUnitId(kind: RewardedAdKind): string {
  const useTest =
    typeof import.meta.env !== "undefined" && import.meta.env.VITE_ADMOB_USE_TEST_UNITS === "true";
  if (useTest) return TEST_REWARDED_UNIT_ID;
  return REWARDED_UNITS[kind];
}

/**
 * Shows a rewarded video. Returns true when the user earned the reward.
 * Falls back to a simulated ad break outside the native shell so the game
 * stays playable in browser preview.
 */
export async function showRewardedAd(kind: RewardedAdKind = "ticket"): Promise<boolean> {
  const adMob = await loadAdMob();
  if (!adMob) {
    // Browser / plugin not installed: simulate a short ad break.
    await new Promise((r) => setTimeout(r, 600));
    return true;
  }

  if (!initialized) await initAds();
  if (!canRequestAds) return false;

  const tryUnit = async (adId: string) => {
    await adMob.prepareRewardVideoAd({ adId });
    const result = (await adMob.showRewardVideoAd()) as { amount?: number } | undefined;
    return Boolean(result);
  };
  try {
    return await tryUnit(getUnitId(kind));
  } catch {
    // New / not-yet-approved apps get "no fill" on live units — fall back to
    // Google's official test ad so the reward flow still works.
    try {
      return await tryUnit(TEST_REWARDED_UNIT_ID);
    } catch {
      return false;
    }
  }
}

/** True when ads can be shown at all (used to hide video buttons if needed). */
export const adsAvailable = () => true;
