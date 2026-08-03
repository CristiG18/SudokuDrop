import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useT } from "@/i18n";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Parolă nouă — Sudoku Drop" },
      { name: "description", content: "Setează o parolă nouă pentru contul tău Sudoku Drop." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const t = useT();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The recovery link delivers a session (hash or PKCE code) that Supabase
    // picks up automatically; we just wait for it before allowing the update.
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error(t("Parolele nu coincid"));
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success(t("Parola a fost schimbată"));
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("Eroare"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen px-5 pt-5 pb-10">
      <Link
        to="/auth"
        className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>

      <h1 className="display text-3xl font-bold mt-8 text-center">{t("Parolă nouă")}</h1>
      <p className="text-sm text-muted-foreground mt-2 text-center">
        {ready
          ? t("Alege o parolă nouă pentru contul tău.")
          : t("Deschide linkul primit pe email pentru a schimba parola.")}
      </p>

      <form onSubmit={submit} className="mt-8 space-y-3">
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("Parolă (min. 6 caractere)")}
          className="w-full px-4 py-3 rounded-2xl bg-card border border-border text-sm"
        />
        <input
          type="password"
          required
          minLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={t("Confirmă parola")}
          className="w-full px-4 py-3 rounded-2xl bg-card border border-border text-sm"
        />
        <button
          type="submit"
          disabled={busy || !ready}
          className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold shadow-card disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {t("Salvează parola")}
        </button>
      </form>
    </div>
  );
}
