import { registerPlugin } from "@capacitor/core";
import { isNative } from "./native";

/**
 * Google Play Billing for gem packs via the native Capacitor plugin
 * (@capgo/native-purchases). The plugin is reached through the Capacitor
 * bridge, so it also works when the shell loads the published site.
 * In a normal browser we simulate the purchase so the flow stays testable.
 */

export const GEM_PACKS = [
  { id: "gems_100", gems: 100, price: "€0,99" },
  { id: "gems_500", gems: 500, price: "€3,99" },
  { id: "gems_1200", gems: 1200, price: "€7,99" },
  { id: "gems_3000", gems: 3000, price: "€17,99" },
];

type Transaction = { transactionId?: string; purchaseToken?: string; productIdentifier?: string };

interface NativePurchasesPlugin {
  isBillingSupported: () => Promise<{ isBillingSupported: boolean }>;
  purchaseProduct: (opts: {
    productIdentifier: string;
    productType?: "inapp" | "subs";
    quantity?: number;
    isConsumable?: boolean;
  }) => Promise<Transaction>;
  getProducts: (opts: {
    productIdentifiers: string[];
    productType?: "inapp" | "subs";
  }) => Promise<{ products: { identifier: string; priceString: string }[] }>;
}

const NativePurchases = registerPlugin<NativePurchasesPlugin>("NativePurchases");

export type PurchaseResult = {
  productId: string;
  gems: number;
  purchaseToken: string;
};

/** Localized store prices (e.g. "4,99 RON"), keyed by product id. */
export async function loadStorePrices(): Promise<Record<string, string>> {
  if (!isNative()) return {};
  try {
    const { products } = await NativePurchases.getProducts({
      productIdentifiers: GEM_PACKS.map((p) => p.id),
      productType: "inapp",
    });
    return Object.fromEntries(products.map((p) => [p.identifier, p.priceString]));
  } catch {
    return {};
  }
}

export async function purchaseGems(productId: string): Promise<PurchaseResult> {
  const pack = GEM_PACKS.find((p) => p.id === productId);
  if (!pack) throw new Error("Invalid gem pack");

  if (!isNative()) {
    await new Promise((r) => setTimeout(r, 800));
    return { productId, gems: pack.gems, purchaseToken: `sim-${Date.now()}` };
  }

  const tx = await NativePurchases.purchaseProduct({
    productIdentifier: productId,
    productType: "inapp",
    quantity: 1,
    isConsumable: true,
  });
  return {
    productId,
    gems: pack.gems,
    purchaseToken: tx.purchaseToken ?? tx.transactionId ?? "",
  };
}

export function billingAvailable(): boolean {
  return isNative();
}
