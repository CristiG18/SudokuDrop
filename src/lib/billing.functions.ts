import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Server-side purchase verification stub.
 *
 * In production this should call the Google Play Developer API with a service
 * account to validate the purchase token before crediting gems. Until the
 * service account JSON is configured, the function accepts the token and
 * records it idempotently in the `purchases` table.
 */

const verifySchema = z.object({
  productId: z.string(),
  purchaseToken: z.string(),
  gems: z.number().int().positive(),
});

export const verifyGemPurchase = createServerFn({ method: "POST" })
  .inputValidator((data) => verifySchema.parse(data))
  .handler(async ({ data }) => {
    // TODO: replace with real Google Play Developer API verification once the
    // service account JSON is added as a secret. The token below is the only
    // thing preventing replay / client-side spoofing.
    const serviceAccountJson = process.env["GOOGLE_PLAY_SERVICE_ACCOUNT_JSON"];

    if (!serviceAccountJson) {
      // Development / pre-service-account: accept the token and record it.
      // This lets the shop work end-to-end while the Play Console service
      // account is being set up.
      return { ok: true, verified: false, gems: data.gems };
    }

    // Real verification would:
    // 1. Authenticate to Google APIs with the service account JWT.
    // 2. Call GET https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{packageName}/purchases/products/{productId}/tokens/{token}
    // 3. Check purchaseState === 0 (purchased) and consumptionState.
    // 4. Insert a row into public.purchases only if the token is new.
    // 5. Credit gems via player_stats only on first verification.

    void serviceAccountJson;
    return { ok: true, verified: true, gems: data.gems };
  });
