#!/usr/bin/env node
/**
 * Injects the AdMob App ID from capacitor.config.ts into the Android native
 * project (strings.xml + AndroidManifest.xml).
 *
 * Run automatically after `npx cap sync` via the `cap:sync` npm script,
 * or manually with `node scripts/inject-admob-android.js`.
 */
import fs from "node:fs";
import path from "node:path";

const configPath = path.resolve("capacitor.config.ts");
const androidDir = path.resolve("android/app/src/main");
const stringsPath = path.join(androidDir, "res/values/strings.xml");
const manifestPath = path.join(androidDir, "AndroidManifest.xml");

function readConfigAppId() {
  const text = fs.readFileSync(configPath, "utf8");
  const match = text.match(/AdMob:\s*\{[^}]*appId:\s*"([^"]+)"/);
  if (!match) {
    throw new Error("AdMob appId not found in capacitor.config.ts");
  }
  return match[1];
}

function ensureStringsXml(appId) {
  const content = fs.readFileSync(stringsPath, "utf8");
  const key = 'name="admob_app_id"';
  if (content.includes(key)) {
    const updated = content.replace(
      new RegExp(`<string ${key}>[^<]*</string>`, "g"),
      `<string ${key}>${appId}</string>`
    );
    fs.writeFileSync(stringsPath, updated);
  } else {
    const updated = content.replace(
      /(<resources>)/,
      `$1\n    <string ${key}>${appId}</string>`
    );
    fs.writeFileSync(stringsPath, updated);
  }
}

function ensureManifestMetaData() {
  const content = fs.readFileSync(manifestPath, "utf8");
  const metaName = "com.google.android.gms.ads.APPLICATION_ID";
  const metaLine = `    <meta-data android:name="${metaName}" android:value="@string/admob_app_id"/>`;

  if (content.includes(metaName)) {
    const updated = content.replace(
      new RegExp(`(<meta-data[^>]*android:name="${metaName}"[^>]*android:value=")[^"]*("[^/]*/>)`, "g"),
      `$1@string/admob_app_id$2`
    );
    fs.writeFileSync(manifestPath, updated);
  } else {
    const updated = content.replace(
      /(<application[^>]*>)/,
      `$1\n${metaLine}`
    );
    fs.writeFileSync(manifestPath, updated);
  }
}

/**
 * Google Play Billing permission. Play Console refuses to create in-app
 * products until an uploaded build declares it.
 */
function ensureBillingPermission() {
  const content = fs.readFileSync(manifestPath, "utf8");
  const perm = "com.android.vending.BILLING";
  if (content.includes(perm)) return;
  const line = `    <uses-permission android:name="${perm}" />`;
  const updated = content.replace(/(<manifest[^>]*>)/, `$1\n${line}`);
  fs.writeFileSync(manifestPath, updated);
}

/** Native Play Billing library required by cordova-plugin-purchase. */
function ensureBillingDependency() {
  const gradlePath = path.resolve("android/app/build.gradle");
  if (!fs.existsSync(gradlePath)) return;
  const content = fs.readFileSync(gradlePath, "utf8");
  if (content.includes("com.android.billingclient:billing")) return;
  const updated = content.replace(
    /(dependencies\s*\{)/,
    `$1\n    implementation "com.android.billingclient:billing:7.1.1"`
  );
  fs.writeFileSync(gradlePath, updated);
}

function main() {
  if (!fs.existsSync(manifestPath)) {
    console.log("[inject-admob-android] Android project not found. Run `npx cap add android` first.");
    process.exit(0);
  }

  const appId = readConfigAppId();
  ensureStringsXml(appId);
  ensureManifestMetaData();
  ensureBillingPermission();
  ensureBillingDependency();
  console.log(`[inject-admob-android] AdMob App ID injected: ${appId}`);
  console.log("[inject-admob-android] Google Play Billing permission + dependency ensured.");
}

main();
