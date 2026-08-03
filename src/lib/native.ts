import { Capacitor } from "@capacitor/core";

/** True only inside the Android/iOS shell, false in a normal browser. */
export const isNative = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

/**
 * Short haptic tick. Uses the native Haptics plugin on device and falls back to
 * the Web Vibration API elsewhere, so callers never need to branch.
 */
export async function haptic(pattern: number | number[] = 18) {
  if (isNative()) {
    try {
      const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
      const strong = Array.isArray(pattern) || pattern > 30;
      await Haptics.impact({ style: strong ? ImpactStyle.Medium : ImpactStyle.Light });
      return;
    } catch {
      /* fall through to web */
    }
  }
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
}

/**
 * Wires the Android hardware back button to in-app navigation, so the system
 * back gesture pauses the game instead of closing the app.
 */
export async function initNativeShell(onBack: () => boolean) {
  if (!isNative()) return () => {};
  try {
    const [{ App }, { StatusBar, Style }, { SplashScreen }] = await Promise.all([
      import("@capacitor/app"),
      import("@capacitor/status-bar"),
      import("@capacitor/splash-screen"),
    ]);
    void StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    void SplashScreen.hide().catch(() => {});
    const handle = await App.addListener("backButton", ({ canGoBack }) => {
      // onBack returns true when the app handled it (closed a sheet, paused…).
      if (onBack()) return;
      if (canGoBack) window.history.back();
      else void App.exitApp();
    });
    return () => void handle.remove();
  } catch {
    return () => {};
  }
}
