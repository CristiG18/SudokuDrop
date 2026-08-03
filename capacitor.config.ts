import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Android (Google Play) packaging config.
 *
 * The app is a TanStack Start app with a server runtime, so the APK/AAB loads
 * the deployed build instead of a bundled static folder. Replace `server.url`
 * with the published domain before generating a release build.
 */
const config: CapacitorConfig = {
  appId: "app.lovable.sudokudrop",
  appName: "Sudoku Drop",
  webDir: "dist/client",
  android: {
    backgroundColor: "#ffffff",
    allowMixedContent: false,
  },
  server: {
    url: "https://sudoku-drop.lovable.app",
    androidScheme: "https",
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 900,
      backgroundColor: "#ffffff",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#ffffff",
    },
  },
};

export default config;
