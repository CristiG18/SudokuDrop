import { isNative } from "./native";

/**
 * Google Play Billing layer for gem packs.
 *
 * Uses cordova-plugin-purchase on the native Android shell. In browser / preview
 * we simulate a successful purchase so the shop flow stays testable.
 */

export const GEM_PACKS = [
  { id: "gems_100", gems: 100, price: "€0,99" },
  { id: "gems_500", gems: 500, price: "€3,99" },
  { id: "gems_1200", gems: 1200, price: "€7,99" },
  { id: "gems_3000", gems: 3000, price: "€17,99" },
];

// cordova-plugin-purchase exposes a global CdvPurchase namespace.
declare global {
  interface Window {
    CdvPurchase?: {
      store: {
        verbosity: number;
        register: (products: unknown[]) => void;
        when: () => {
          approved: (cb: (transaction: { products: { id?: string }[]; purchaseId?: string; transactionId?: string; finish: () => Promise<void> }) => void) => { cancelled: (cb: () => void) => void };
        };
        initialize: (platforms: unknown[]) => Promise<unknown>;
        get: (productId: string) => { getOffer: () => { order: () => Promise<unknown> } | undefined } | undefined;
      };
      LogLevel: { ERROR: number };
      ProductType: { CONSUMABLE: string };
      Platform: { GOOGLE_PLAY: string };
    };
  }
}

export type PurchaseResult = {
  productId: string;
  gems: number;
  purchaseToken: string;
};

let storeInitStarted = false;
let storeReady = false;
let pendingResolver: ((result: PurchaseResult) => void) | null = null;
let pendingRejecter: ((err: Error) => void) | null = null;

function getStore() {
  if (!isNative()) return null;
  return window.CdvPurchase?.store ?? null;
}

function getGemAmount(productId: string): number {
  return GEM_PACKS.find((p) => p.id === productId)?.gems ?? 0;
}

async function initStore(): Promise<void> {
  const store = getStore();
  if (!store || storeInitStarted) return;
  storeInitStarted = true;

  const Cdv = window.CdvPurchase!;
  store.verbosity = Cdv.LogLevel.ERROR;

  store.register(
    GEM_PACKS.map((p) => ({
      id: p.id,
      type: Cdv.ProductType.CONSUMABLE,
      platform: Cdv.Platform.GOOGLE_PLAY,
    }))
  );

  store
    .when()
    .approved((transaction) => {
      const pid = transaction.products[0]?.id ?? "";
      const gems = getGemAmount(pid);
      if (gems && pendingResolver) {
        pendingResolver({
          productId: pid,
          gems,
          purchaseToken: transaction.purchaseId ?? transaction.transactionId ?? "",
        });
        pendingResolver = null;
        pendingRejecter = null;
      }
      void transaction.finish();
    })
    .cancelled(() => {
      if (pendingRejecter) {
        pendingRejecter(new Error("Purchase cancelled"));
        pendingResolver = null;
        pendingRejecter = null;
      }
    });

  await store.initialize([{ platform: Cdv.Platform.GOOGLE_PLAY }]);
  storeReady = true;
}

/**
 * Initiates a purchase for the given gem pack. Resolves with the granted gems
 * and the store purchase token. Throws on cancellation or error.
 */
export async function purchaseGems(productId: string): Promise<PurchaseResult> {
  const pack = GEM_PACKS.find((p) => p.id === productId);
  if (!pack) throw new Error("Invalid gem pack");

  const store = getStore();
  if (!store) {
    // Browser / preview: simulate a purchase so the UI stays testable.
    await new Promise((r) => setTimeout(r, 800));
    return { productId, gems: pack.gems, purchaseToken: `sim-${Date.now()}` };
  }

  if (!storeReady) await initStore();

  return new Promise<PurchaseResult>((resolve, reject) => {
    pendingResolver = resolve;
    pendingRejecter = reject;

    const product = store.get(productId);
    const offer = product?.getOffer();
    if (!offer) {
      pendingResolver = null;
      pendingRejecter = null;
      reject(new Error("Product not available in store"));
      return;
    }

    offer.order().catch((err: unknown) => {
      pendingResolver = null;
      pendingRejecter = null;
      reject(err instanceof Error ? err : new Error(String(err)));
    });
  });
}

/** True when the native billing store is available. */
export function billingAvailable(): boolean {
  return getStore() !== null;
}
