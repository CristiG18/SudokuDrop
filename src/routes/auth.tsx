import { isNative } from "@/lib/native";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { useT } from "@/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Cont — Sudoku Drop" }] }),
  component: AuthPage,
});

function AuthPage() {
  const t = useT();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  // Google blocks sign-in inside the Android app view; email login is used there.
  const [native, setNative] = useState(false);
  useEffect(() => setNative(isNative()), []);

  const signInGoogle = async () => {
    if (mode === "signup" && !accepted) {
      toast.error(t("Trebuie să accepți termenii și politica de confidențialitate."));
      return;
    }
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      toast.success(t("Autentificat"));
      navigate({ to: "/" });
    } catch (e) {
      toast.error(t("Autentificare eșuată"));
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const forgotPassword = async () => {
    if (!email) {
      toast.error(t("Scrie întâi adresa de email."));
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success(t("Ți-am trimis un email cu linkul de resetare."));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("Eroare"));
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup" && !accepted) {
      toast.error(t("Trebuie să accepți termenii și politica de confidențialitate."));
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t("Autentificat"));
        navigate({ to: "/" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) {
          toast.success(t("Autentificat"));
          navigate({ to: "/" });
        } else {
          toast.success(t("Verifică-ți emailul pentru a confirma contul."));
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("Eroare");
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen px-5 pt-5 pb-10">
      <Link
        to="/"
        className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>

      <div className="mt-8 text-center">
        <h1 className="display text-3xl font-bold">
          {mode === "signin" ? t("Bine ai revenit") : t("Creează un cont")}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          {t("Salvează progresul pe orice dispozitiv.")}
        </p>
      </div>

      {!native && (<>
      <button
        onClick={signInGoogle}
        disabled={busy}
        className="mt-8 w-full py-3.5 rounded-2xl bg-card border border-border font-semibold flex items-center justify-center gap-3 shadow-soft active:scale-[0.98] transition disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
        </svg>
        {t("Continuă cu Google")}
      </button>

      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">{t("sau email")}</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      </>)}

      <form onSubmit={submit} className="space-y-3">
        <div className="relative">
          <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplu.ro"
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-card border border-border text-sm"
          />
        </div>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("Parolă (min. 6 caractere)")}
          className="w-full px-4 py-3 rounded-2xl bg-card border border-border text-sm"
        />

        {mode === "signup" && (
          <label className="flex items-start gap-3 px-1 pt-1 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[var(--color-primary)]"
            />
            <span>
              {t("Am citit și accept")}{" "}
              <Link to="/terms" className="text-primary font-semibold">
                {t("Termenii și condițiile")}
              </Link>{" "}
              {t("și")}{" "}
              <Link to="/privacy" className="text-primary font-semibold">
                {t("Politica de confidențialitate")}
              </Link>
              .
            </span>
          </label>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold shadow-card disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === "signin" ? t("Autentificare") : t("Creează cont")}
        </button>
      </form>

      {mode === "signin" && (
        <button onClick={forgotPassword} disabled={busy} className="mt-4 w-full text-sm text-primary font-semibold">
          {t("Ai uitat parola?")}
        </button>
      )}

      <button
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="mt-4 w-full text-sm text-muted-foreground"
      >
        {mode === "signin" ? t("Nu ai cont? Creează unul") : t("Ai deja cont? Autentifică-te")}
      </button>

      <p className="mt-6 text-center text-[11px] text-muted-foreground leading-relaxed">
        <Link to="/terms" className="underline">
          {t("Termeni și condiții")}
        </Link>{" "}
        ·{" "}
        <Link to="/privacy" className="underline">
          {t("Politica de confidențialitate")}
        </Link>
      </p>
    </div>
  );
}
