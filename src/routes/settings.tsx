import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  FileText,
  Loader2,
  LogIn,
  LogOut,
  Shield,
  Trash2,
  UserCircle2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useGameStore } from "@/store/game-store";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount } from "@/lib/account.functions";
import { toast } from "sonner";
import { ThemePicker } from "@/components/ThemePicker";
import { SkinPicker } from "@/components/SkinPicker";
import { LanguagePicker } from "@/components/LanguagePicker";
import { useT } from "@/i18n";


export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Setări — Sudoku Drop" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const settings = useGameStore((s) => s.settings);
  const setSetting = useGameStore((s) => s.setSetting);
  const navigate = useNavigate();
  const t = useT();
  const [email, setEmail] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success(t("Deconectat"));
  };

  const removeAccount = async () => {
    setDeleting(true);
    try {
      await deleteMyAccount();
      await supabase.auth.signOut();
      setConfirmDelete(false);
      toast.success(t("Contul a fost șters."));
      navigate({ to: "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("Eroare"));
    } finally {
      setDeleting(false);
    }
  };


  return (
    <div className="min-h-screen px-5 pt-5 pb-8">
      <Link
        to="/"
        className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <h1 className="display text-3xl font-bold mt-6">{t("Setări")}</h1>

      <div className="mt-6 rounded-2xl bg-card border border-border p-4 shadow-soft flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center">
          <UserCircle2 className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">
            {email ?? t("Nu ești autentificat")}
          </div>
          <div className="text-xs text-muted-foreground">
            {email ? t("Progresul se sincronizează în cloud") : t("Autentifică-te pentru a salva progresul")}
          </div>
        </div>
        {email ? (
          <button
            onClick={signOut}
            className="px-3 py-1.5 rounded-full bg-muted text-xs font-semibold flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" /> {t("Ieși")}
          </button>
        ) : (
          <button
            onClick={() => navigate({ to: "/auth" })}
            className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1"
          >
            <LogIn className="w-3.5 h-3.5" /> {t("Intră")}
          </button>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <Link
          to="/appearance"
          className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl p-4 shadow-soft"
        >
          <span className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Palette className="w-5 h-5 text-primary-foreground" />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">{t("Aspect")}</span>
            <span className="block text-xs text-muted-foreground mt-0.5">
              {t("Culoarea interfeței și skinul pieselor")}
            </span>
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>

        <LanguagePicker />

        <Row
          title={t("Mod control")}
          desc={
            settings.controlMode === "gestures"
              ? t("Gesturi: glisare = mută, swipe jos = drop, tap margini/centru = mută/rotire.")
              : t("Butoane: săgeți + rotire + drop. Gesturile sunt dezactivate.")
          }
          value={settings.controlMode === "gestures"}
          onToggle={(v) => setSetting("controlMode", v ? "gestures" : "buttons")}
        />
        <Row
          title={t("Auto-completare")}
          desc={t("Când mai rămân puține celule cu un singur candidat, se completează singure (Sudoku Clasic).")}
          value={settings.autoComplete}
          onToggle={(v) => setSetting("autoComplete", v)}
        />
        <Row
          title={t("Sunet")}
          desc={t("Efecte sonore în joc.")}
          value={settings.sound}
          onToggle={(v) => setSetting("sound", v)}
        />
        <Row
          title={t("Vibrații")}
          desc={t("Feedback haptic la atingere.")}
          value={settings.haptics}
          onToggle={(v) => setSetting("haptics", v)}
        />
      </div>

      <div className="mt-6 space-y-2">
        <Link
          to="/terms"
          className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3.5 shadow-soft"
        >
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">{t("Termeni și condiții")}</span>
        </Link>
        <Link
          to="/privacy"
          className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3.5 shadow-soft"
        >
          <Shield className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">{t("Politica de confidențialitate")}</span>
        </Link>

        {email && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full flex items-center gap-3 bg-card border border-destructive/30 rounded-2xl px-4 py-3.5 shadow-soft text-destructive"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm font-semibold">{t("Șterge contul")}</span>
          </button>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-6">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border p-5 shadow-card">
            <h2 className="text-lg font-bold">{t("Ștergi definitiv contul?")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t(
                "Progresul, gemurile, monedele, skinurile și scorurile din clasamente se șterg definitiv. Acțiunea nu poate fi anulată.",
              )}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="flex-1 py-3 rounded-2xl bg-muted font-semibold text-sm"
              >
                {t("Anulează")}
              </button>
              <button
                onClick={() => void removeAccount()}
                disabled={deleting}
                className="flex-1 py-3 rounded-2xl bg-destructive text-destructive-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("Șterge contul")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  title,
  desc,
  value,
  onToggle,
}: {
  title: string;
  desc: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onToggle(!value)}
      className="w-full flex items-center gap-4 bg-card border border-border rounded-2xl p-4 shadow-soft text-left"
    >
      <div className="flex-1">
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
      <div
        className="w-12 h-7 rounded-full p-0.5 transition"
        style={{ backgroundColor: value ? "var(--color-primary)" : "var(--color-muted)" }}
      >
        <div
          className="w-6 h-6 rounded-full bg-white shadow transition-transform"
          style={{ transform: value ? "translateX(20px)" : "translateX(0)" }}
        />
      </div>
    </button>
  );
}
