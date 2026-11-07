import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

/**
 * Opened in Chrome by the Android app. Signs in with Google, then hands the
 * session back to the app through the app's own link scheme.
 */
export const APP_SCHEME = "app.lovable.sudokudrop";

export const Route = createFileRoute("/auth-native")({
  head: () => ({
    meta: [
      { title: "Google sign-in — Sudoku Drop" },
      { name: "description", content: "Signing you in to Sudoku Drop with Google." },
      { property: "og:title", content: "Google sign-in — Sudoku Drop" },
      { property: "og:description", content: "Signing you in to Sudoku Drop with Google." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NativeAuth,
});

function NativeAuth() {
  const [msg, setMsg] = useState("Connecting to Google…");
  const [link, setLink] = useState<string | null>(null);

  useEffect(() => {
    let done = false;
    const handOff = (access: string, refresh: string) => {
      if (done) return;
      done = true;
      const url = `${APP_SCHEME}://auth#access_token=${encodeURIComponent(access)}&refresh_token=${encodeURIComponent(refresh)}`;
      setLink(url);
      setMsg("Signed in! Returning to the app…");
      window.location.href = url;
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) handOff(s.access_token, s.refresh_token);
    });
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) return handOff(data.session.access_token, data.session.refresh_token);
      const started = sessionStorage.getItem("native-oauth-started");
      if (started) return; // returning from Google; wait for the session
      sessionStorage.setItem("native-oauth-started", "1");
      const r = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth-native`,
      });
      if (r.error) setMsg("Sign-in failed. Close this page and try again.");
    });
    const t = setTimeout(() => sessionStorage.removeItem("native-oauth-started"), 120000);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-lg font-semibold">{msg}</p>
      {link && (
        <a href={link} className="px-5 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold">
          Open Sudoku Drop
        </a>
      )}
    </div>
  );
}
