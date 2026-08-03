import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useT } from "@/i18n";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Termeni și condiții — Sudoku Drop" },
      {
        name: "description",
        content: "Regulile de utilizare a jocului Sudoku Drop: cont, monedă virtuală, turnee și achiziții.",
      },
      { property: "og:title", content: "Termeni și condiții — Sudoku Drop" },
      {
        property: "og:description",
        content: "Regulile de utilizare a jocului Sudoku Drop: cont, monedă virtuală, turnee și achiziții.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const t = useT();
  return (
    <div className="min-h-screen px-5 pt-5 pb-16">
      <Link
        to="/settings"
        className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <h1 className="display text-3xl font-bold mt-6">{t("Termeni și condiții")}</h1>
      <p className="text-xs text-muted-foreground mt-1">
        {t("Ultima actualizare")}: 03.08.2026
      </p>

      <div className="mt-6 space-y-5 text-sm leading-relaxed text-foreground/90">
        <Section title={t("1. Acceptarea termenilor")}>
          {t(
            "Prin crearea unui cont sau prin utilizarea aplicației Sudoku Drop accepți acești termeni. Dacă nu ești de acord, nu folosi aplicația.",
          )}
        </Section>
        <Section title={t("2. Contul tău")}>
          {t(
            "Îți poți crea cont cu email și parolă sau cu Google. Ești responsabil pentru păstrarea în siguranță a datelor de autentificare și pentru activitatea din contul tău. Trebuie să ai cel puțin 13 ani.",
          )}
        </Section>
        <Section title={t("3. Monedă virtuală")}>
          {t(
            "Gemurile, monedele și tichetele sunt bunuri virtuale fără valoare monetară reală. Nu pot fi retrase, vândute sau transferate în afara jocului și nu se rambursează, cu excepția cazurilor prevăzute de lege sau de regulile magazinului Google Play.",
          )}
        </Section>
        <Section title={t("4. Achiziții")}>
          {t(
            "Achizițiile din aplicație se procesează prin Google Play. Cererile de rambursare se rezolvă conform politicii Google Play. Bunurile virtuale se livrează imediat după confirmarea plății.",
          )}
        </Section>
        <Section title={t("5. Turnee și clasamente")}>
          {t(
            "Taxele de înscriere se plătesc în monede virtuale, iar premiile se acordă tot în monedă virtuală. Nu este vorba de jocuri de noroc: nu există câștiguri în bani reali. Ne rezervăm dreptul de a anula scoruri obținute prin fraudă sau modificarea aplicației.",
          )}
        </Section>
        <Section title={t("6. Conduită interzisă")}>
          {t(
            "Este interzisă modificarea aplicației, folosirea de programe automate, exploatarea erorilor sau orice încercare de a obține avantaje neloiale. Conturile implicate pot fi suspendate sau șterse.",
          )}
        </Section>
        <Section title={t("7. Reclame")}>
          {t(
            "Aplicația poate afișa reclame recompensate, opționale. Nu ești obligat să le vizionezi pentru a juca.",
          )}
        </Section>
        <Section title={t("8. Încetarea contului")}>
          {t(
            "Îți poți șterge contul oricând din Setări. Putem suspenda conturile care încalcă acești termeni.",
          )}
        </Section>
        <Section title={t("9. Limitarea răspunderii")}>
          {t(
            "Aplicația este oferită „ca atare”. Nu garantăm funcționarea neîntreruptă și nu răspundem pentru pierderea progresului cauzată de defecțiuni tehnice, în limitele permise de lege.",
          )}
        </Section>
        <Section title={t("10. Contact")}>
          {t("Pentru întrebări legate de acești termeni ne poți scrie la")}: support@sudokudrop.app
        </Section>
      </div>

      <Link to="/privacy" className="mt-8 block text-sm text-primary font-semibold">
        {t("Politica de confidențialitate")} →
      </Link>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-bold text-base mb-1">{title}</h2>
      <p className="text-muted-foreground">{children}</p>
    </section>
  );
}
