# Roadmap: Economie, Turnee, Killer Sudoku și pași până la lansare

## 1. Economie unificată (3 monede, roluri clare)

| Monedă | Cum se câștigă | Ce cumpără |
|---|---|---|
| 💎 Gemuri | bani reali, top turnee, daily zi 7, reclame recompensate, come-back bonus | revive, pachete superputeri, skinuri/culori premium, intrare extra turneu |
| 🎟️ Tichete | regenerare 1/45min (max 5), daily, cumpărate cu monede (150 🪙), turnee | intrare în Battle / Time Attack / turneu (1 tichet) |
| 🪙 Monede | scor la finalul fiecărei partide, daily streak, level-up, premii turneu | tichete, skinuri ieftine, hinturi clasic, continue |

Reguli:
- Gemurile nu se câștigă din gameplay normal (doar rar), monedele nu se cumpără cu bani.
- Fiecare cosmetic are preț dublu: monede SAU gemuri (gemuri ≈ preț monede / 10).
- Recompensă la final de partidă: monede = f(scor, dificultate, mod), cu bonus pentru linii/box-uri.

## 2. Sistem de nivel (XP) și deblocări
- XP la fiecare partidă terminată; curbă crescătoare pe nivel.
- Deblocări: Hard la nivel 5, Expert la 10, Extreme la 15, moduri speciale (Rush / Time Rush) la 3 / 8.
- Level-up → recompensă monede + ocazional gemuri/skin.
- Bară de XP vizibilă pe home și în Personal.

## 3. Turnee săptămânale
- Sezon luni 00:00 → duminică 23:59 UTC, countdown vizibil.
- Înscriere: 1 tichet. Scorul reținut = cel mai bun din sezon (per mod).
- Clasament live pe server, cu poziția proprie evidențiată.
- Premii DOAR la închiderea sezonului: top 1-3 (gemuri + skin exclusiv), top 10 / 100 / participare (monede).
- Divizii pe nivel (Bronze < 5, Silver 5-14, Gold 15+) ca să nu concureze începătorii cu veteranii.

## 4. Moduri de joc
- **Se elimină Ice Mode** complet (rutare, UI, logica de îngheț, intrări din shop/explore).
- **Se adaugă Killer Sudoku** ca mod de dificultate premium în Clasic:
  - grilă fără cifre date, împărțită în cuști marcate punctat, cu sumă în colțul stânga-sus;
  - cifrele dintr-o cușcă nu se repetă și trebuie să dea suma;
  - generator: se pornește de la o soluție validă și se agregă celule în cuști de 1-5;
  - dificultate dată de mărimea cuștilor și numărul de indicii vizibile.

## 5. Monetizare reală
- Cont obligatoriu (deja există auth) + balanță de monede/gemuri în baza de date, nu doar local. Localul devine cache.
- Pachete de gemuri: 100 / 500 / 1500 / 5000 la prețuri fixe.
- Web: checkout prin integrarea de plăți Lovable; webhook verificat pe server creditează gemurile.
- Android (Capacitor): Google Play Billing obligatoriu pentru bunuri digitale, cu validare server-side a chitanței.
- Reclame recompensate reale (AdMob) în locul celor simulate, cu limită zilnică.

## 6. Pași până la publicare

**Etapa A — Fundație de cont (blocant)**
1. Tabele pentru profil, balanțe, scoruri, înscrieri turneu + RLS și grants.
2. Sincronizare progres local ↔ cloud, cu server ca sursă de adevăr pentru monede.

**Etapa B — Economie și progres**
3. Implementare XP/nivel + deblocări dificultăți.
4. Recompense de final de partidă în monede, regenerare tichete pe timp.
5. Shop cu preț dublu (monede / gemuri) și magazin de tichete.

**Etapa C — Conținut**
6. Eliminare Ice, adăugare Killer Sudoku (generator + UI cuști + validare).
7. Turnee săptămânale server-side cu premiere la final de sezon.

**Etapa D — Bani**
8. Integrare plăți + pachete de gemuri, creditare prin webhook.
9. Reclame recompensate reale.

**Etapa E — Lansare**
10. Onboarding de 30 secunde, misiuni zilnice, notificări (energie plină / sezon se încheie).
11. Privacy Policy, Termeni, consimțământ GDPR — necesare la Play Store.
12. Build Capacitor, testare pe dispozitive, iconițe/capturi/store listing.

## Decizii de confirmat
- Valorile exacte de recompense (monede per partidă, preț tichet) — pot propune eu un set de start.
- Începem cu Etapa A (cont + balanțe în cloud), care e blocantă pentru tot restul?
