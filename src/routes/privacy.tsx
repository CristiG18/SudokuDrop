import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useT } from "@/i18n";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Politica de confidențialitate — Sudoku Drop" },
      {
        name: "description",
        content: "Ce date colectăm în Sudoku Drop, de ce, cât le păstrăm și cum îți exerciți drepturile GDPR.",
      },
      { property: "og:title", content: "Politica de confidențialitate — Sudoku Drop" },
      {
        property: "og:description",
        content: "Ce date colectăm în Sudoku Drop, de ce, cât le păstrăm și cum îți exerciți drepturile GDPR.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const t = useT();
  return (
    <div className="min-h-screen px-5 pt-5 pb-16">
      <Link
        to="/settings"
        className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <h1 className="display text-3xl font-bold mt-6">{t("Politica de confidențialitate")}</h1>
      <p className="text-xs text-muted-foreground mt-1">
        {t("Ultima actualizare")}: 03.08.2026
      </p>

      <div className="mt-6 space-y-5 text-sm leading-relaxed">
        <Section title={t("Ce date colectăm")}>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t("Adresa de email și identificatorul de cont (dacă te autentifici).")}</li>
            <li>{t("Progresul de joc: nivel, XP, recorduri, gemuri, monede, tichete, skinuri deținute.")}</li>
            <li>{t("Scorurile trimise în clasamente și turnee.")}</li>
            <li>{t("Identificatorul de reclame al dispozitivului, dacă accepți reclamele personalizate.")}</li>
          </ul>
        </Section>
        <Section title={t("De ce le folosim")}>
          {t(
            "Pentru a-ți salva progresul între dispozitive, pentru a afișa clasamentele, pentru a acorda premii în turnee și pentru a afișa reclame recompensate opționale.",
          )}
        </Section>
        <Section title={t("Temeiul legal")}>
          {t(
            "Executarea contractului (contul și progresul), interesul legitim (prevenirea fraudei) și consimțământul tău (reclame personalizate). Îți poți retrage consimțământul oricând din Setări.",
          )}
        </Section>
        <Section title={t("Cine le procesează")}>
          {t(
            "Datele sunt găzduite pe infrastructura Lovable Cloud (baza de date și autentificarea aplicației). Rețeaua de reclame primește doar identificatorii necesari afișării reclamelor. Nu vindem datele nimănui.",
          )}
        </Section>
        <Section title={t("Cât le păstrăm")}>
          {t(
            "Cât timp contul este activ. La ștergerea contului, progresul și intrările din clasamente sunt șterse definitiv, în cel mult 30 de zile.",
          )}
        </Section>
        <Section title={t("Drepturile tale (GDPR)")}>
          {t(
            "Ai dreptul de acces, rectificare, ștergere, restricționare, portabilitate și opoziție. Ștergerea o poți face singur din Setări → Șterge contul. Pentru celelalte cereri scrie-ne la",
          )}{" "}
          privacy@sudokudrop.app.{" "}
          {t("Poți depune plângere la autoritatea de protecție a datelor din țara ta.")}
        </Section>
        <Section title={t("Copii")}>
          {t("Aplicația nu se adresează copiilor sub 13 ani și nu colectăm intenționat datele lor.")}
        </Section>
        <Section title={t("Contact")}>privacy@sudokudrop.app</Section>
      </div>

      <Link to="/terms" className="mt-8 block text-sm text-primary font-semibold">
        {t("Termeni și condiții")} →
      </Link>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-bold text-base mb-1">{title}</h2>
      <div className="text-muted-foreground">{children}</div>
    </section>
  );
}
