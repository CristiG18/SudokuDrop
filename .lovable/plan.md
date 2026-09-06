# Lansare Sudoku Drop pe Google Play — pași exacți

Ghid complet, în ordinea corectă, cu valorile exacte din proiectul tău (ID pachet, produse, reclame).

## Informațiile tale fixe (le vei folosi de mai multe ori)

```text
ID pachet (nu se mai poate schimba):  app.lovable.sudokudrop
AdMob App ID:                         ca-app-pub-4013371667115642~7583618725
Unități reclamă cu recompensă:
  - Tichet:    ca-app-pub-4013371667115642/6073196121
  - Revivire:  ca-app-pub-4013371667115642/6560995296
  - Indiciu:   ca-app-pub-4013371667115642/1308668611
  - Power-up:  ca-app-pub-4013371667115642/9590749246
Produse în aplicație (consumabile):
  - gems_100   = 100 gemuri    → 0,99 €
  - gems_500   = 500 gemuri    → 3,99 €
  - gems_1200  = 1200 gemuri   → 7,99 €
  - gems_3000  = 3000 gemuri   → 17,99 €
```

---

## PASUL 1 — Generează fișierul .aab (ai nevoie de laptop/PC)

De pe tabletă/telefon NU se poate — este singurul pas care cere un calculator.

1. Instalează pe calculator: Android Studio (include Java + Android SDK).
2. Descarcă proiectul (din GitHub → Code → Download ZIP, sau `git clone`).
3. În folderul proiectului, în terminal:
   ```bash
   npm install
   npm run cap:sync
   ```
   (scriptul de sincronizare injectează automat AdMob App ID-ul în proiectul Android.)
4. Dacă lipsește, instalează pluginurile native:
   ```bash
   npm install @capacitor-community/admob cordova-plugin-purchase
   npm run cap:sync
   ```
5. Deschide proiectul Android: `npx cap open android` (se deschide Android Studio).
6. În Android Studio: **Build → Generate Signed App Bundle / APK → Android App Bundle (.aab)**.
7. La „Key store": creează una nouă — alege fișier, parolă, alias. **Păstrează acest fișier și parolele în 2 locuri sigure** (fără ele nu mai poți actualiza aplicația vreodată — alternativ, la pasul 2 activezi Play App Signing și Google păstrează cheia principală).
8. Alege varianta **release** și generează. Fișierul rezultat: `app-release.aab`.

---

## PASUL 2 — Play Console: creează aplicația

1. Intră pe [play.google.com/console](https://play.google.com/console) → **Creează aplicația**.
2. Nume: `Sudoku Drop`, limbă implicită română, tip: Joc, gratuit.
3. Bifează declarațiile cerute (reguli dezvoltator, legi SUA).
4. La prima încărcare .aab, Play îți cere semnarea: **activează Play App Signing (Google)** — recomandat, Google păstrează cheia.
5. **Testare → Testare internă** → Creează lansare → încarcă `app-release.aab`.
6. Completează datele obligatorii din panoul stâng (secțiunea „Configurare aplicație"):

   - **Fișa magazinului**: descriere scurtă (max 80 car.) + lungă, iconiță 512×512 (ai sigla rotundă — o punem pe fundal), imagine reprezentativă 1024×500, minim 2 capturi de ecran telefon.
   - **Evaluare conținut (IARC)**: chestionar → răspunde „Nu" la violență/jocuri de noroc; rezultat probabil PEGI 3 / Everyone.
   - **Politica de confidențialitate**: URL public. Îți generez un link (vezi „Ce fac eu" mai jos).
   - **Declarație reclame**: DA, aplicația conține reclame (AdMob).
   - **Siguranța datelor (Data safety)**: bifează: colectează e-mail (cont), ID-uri dispozitiv (reclame), date de joc; criptate în tranzit: Da.
   - **Țară/regiuni**: alege România + restul lumii.
   - **Public țintă**: 13+ (reclamele și achizițiile nu sunt pentru copii mici).

7. Adaugă-te ca tester (adresa ta de Gmail) și instalează aplicația din linkul de testare internă pe telefon. **Testează real**: cumpărare de gemuri (cu cont de testare nu se plătesc bani reali), reclamă cu recompensă, cont Google, turnee.

---

## PASUL 3 — Produsele de cumpărare (monetizarea gemurilor)

În Play Console → **Monetizare → Produse → Produse în aplicație** → Creează, câte unul:

| ID produs (exact!) | Nume | Preț |
|---|---|---|
| `gems_100` | 100 gemuri | 0,99 € |
| `gems_500` | 500 gemuri | 3,99 € |
| `gems_1200` | 1200 gemuri | 7,99 € |
| `gems_3000` | 3000 gemuri | 17,99 € |

- ID-urile trebuie scrise **exact** ca în tabel — aplicația le caută pe acestea.
- Fiecare produs: setează prețul în EUR și apasă **Activează**.
- Legătura cu banii: **Configurare → Cont de plăți** → completezi datele firmei/persoanei fizice și IBAN-ul (Google plătește lunar, prag minim 100 $).

---

## PASUL 4 — AdMob (reclamele)

Unitățile de reclamă sunt deja create și puse în cod. Rămân:

1. În [apps.admob.com](https://apps.admob.com) → **Aplicații → Setări aplicație**: verifică că aplicația e legată de pachetul `app.lovable.sudokudrop` din Play Store (legătura se face după ce aplicația apare în Play Console; poate dura câteva zile să devină „disponibilă pentru legare").
2. **app-ads.txt**: în AdMob → Setări → îți arată fișierul app-ads.txt și domeniul unde trebuie publicat. Noi avem deja `public/app-ads.txt` în proiect — îl public pe URL-ul aplicației și introduci acel URL în AdMob (vezi „Ce fac eu").
3. **Mesaj GDPR (UMP)**: AdMob → **Confidențialitate și mesagerie → Mesaje europene** → Creează mesajul GDPR pentru aplicație (altfel reclamele nu se afișează în UE). Codul din aplicație afișează automat formularul.
4. **Date de plată AdMob**: completează CNP/date fiscale și IBAN în AdMob → Plăți (prag de plată 100 $).
5. Reclamele reale apar doar în build-ul release, pe dispozitiv; în testare Google poate servi reclame de test — e normal.

---

## PASUL 5 — Lansarea în producție

1. Când testarea internă e OK: **Testare → Promovează lansarea → Producție** (sau creează o lansare nouă de producție cu același .aab).
2. Completează țările, apasă **Trimite spre examinare**.
3. Prima examinare durează de obicei **3–7 zile**. După aprobare, aplicația e live în magazin.
4. Verifică în prima săptămână: Play Console → Statistici (instalări, erori ANR) și AdMob → venituri.

---

## Ce fac eu (în acest proiect, la aprobarea planului)

1. Public politica de confidențialitate și termenii pe URL-uri publice ale aplicației (paginile `/privacy` și `/terms` există deja) — îți dau linkurile exacte de pus în Play Console.
2. Verific că `public/app-ads.txt` e servit corect și-ți dau URL-ul exact pentru AdMob.
3. Adaug în scriptul de build verificarea automată a AdMob App ID-ului, ca să nu poți publica din greșeală fără el.
4. Îți pregătesc textele fișei de magazin (descriere scurtă + lungă, în română și engleză).

## Ce îmi mai trebuie de la tine (pe parcurs, nu acum)

- Dacă la testarea cumpărărilor vrei anti-fraudă completă (verificarea pe server a bonurilor): un fișier JSON „service account" din Google Cloud — îți explic atunci, pas cu pas, cum se generează. Fără el, cumpărările funcționează, dar validarea e doar locală.
