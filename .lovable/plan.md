# Lansare Sudoku Drop — de la GitHub la Google Play

Ghid complet, în ordinea corectă, cu valorile exacte din proiectul tău.

## Informațiile tale fixe

```text
ID pachet Android:                    app.lovable.sudokudrop
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

## PARTEA 1 — Salvează proiectul pe GitHub

### 1.1 Creează un repository nou

1. Pe telefon/tabletă sau PC, intră pe [github.com/new](https://github.com/new).
2. Nume: `sudoku-drop` (sau cum vrei tu). Lasă public sau private.
3. NU bifa „Initialize this repository with a README" — vom împinge tot de aici.
4. Copiază URL-ul SSH sau HTTPS (de ex. `https://github.com/USER/sudoku-drop.git`).

### 1.2 Conectează proiectul Lovable la GitHub

Cel mai simplu și sigur: din editorul Lovable, mergi la **Settings → Git → Connect to GitHub**. Alege repository-ul creat. Astfel:

- codul se sincronizează automat la fiecare modificare;
- poți descărca proiectul pe PC pentru build Android;
- nu mai trebuie să copiezi fișiere manual.

### 1.3 Alternativa manuală (doar dacă nu funcționează conectarea automată)

Pe un PC cu Git instalat:

```bash
# 1. Descarcă proiectul din Lovable (File → Export ZIP) și dezarhivează.
# 2. În folderul proiectului:
git init
git add .
git commit -m "Initial Sudoku Drop commit"
git branch -M main
git remote add origin https://github.com/USER/sudoku-drop.git
git push -u origin main
```

---

## PARTEA 2 — Generează fișierul .aab (ai nevoie de laptop/PC)

Acest pas NU se poate face de pe tabletă/telefon.

1. Pe PC: clonează repository-ul:
   ```bash
   git clone https://github.com/USER/sudoku-drop.git
   cd sudoku-drop
   ```
2. Instalează dependențele:
   ```bash
   npm install
   ```
3. Sincronizează proiectul Android (injectează automat AdMob App ID):
   ```bash
   npm run cap:sync
   ```
4. Dacă lipsește, adaugă pluginurile native:
   ```bash
   npm install @capacitor-community/admob cordova-plugin-purchase
   npm run cap:sync
   ```
5. Deschide în Android Studio:
   ```bash
   npx cap open android
   ```
6. În Android Studio: **Build → Generate Signed App Bundle / APK → Android App Bundle (.aab)**.
7. La „Key store", creează o cheie nouă. **Păstrează fișierul .jks și parolele în cel puțin 2 locuri sigure** (fără ele nu mai poți actualiza aplicația). Sau activează **Play App Signing** la primul upload și Google păstrează cheia principală.
8. Alege varianta **release** și generează. Rezultatul: `app-release.aab`.

---

## PARTEA 3 — Play Console: creează aplicația

1. Intră pe [play.google.com/console](https://play.google.com/console) → **Creează aplicație**.
2. Nume: `Sudoku Drop`, limbă implicită română, tip: Joc, gratuit.
3. Bifează declarațiile cerute (reguli dezvoltator, legi SUA).
4. La primul upload .aab, alege **Play App Signing (Google)** — recomandat.
5. Mergi la **Testare → Testare internă** → Creează lansare → încarcă `app-release.aab`.
6. Completează datele obligatorii din panoul stâng:

   - **Fișa magazinului**: descriere scurtă (max 80 car.) + lungă, iconiță 512×512, imagine reprezentativă 1024×500, minim 2 capturi telefon.
   - **Evaluare conținut (IARC)**: răspunde „Nu" la violență/jocuri de noroc → PEGI 3 / Everyone.
   - **Politica de confidențialitate**: URL public. Îți generez paginile `/privacy` și `/terms` (vezi „Ce fac eu").
   - **Declarație reclame**: DA, aplicația conține reclame (AdMob).
   - **Siguranța datelor (Data safety)**: bifează e-mail, ID-uri dispozitiv, date de joc; criptate în tranzit: Da.
   - **Țară/regiuni**: România + restul lumii.
   - **Public țintă**: 13+.

7. Adaugă-te ca tester (adresa ta de Gmail) și instalează aplicația din linkul de testare internă pe telefon. **Testează real**: cumpărare gemuri, reclamă cu recompensă, cont Google, turnee.

---

## PARTEA 4 — Produsele de cumpărare (monetizarea gemurilor)

În Play Console → **Monetizare → Produse → Produse în aplicație** → Creează, câte unul:

| ID produs (exact!) | Nume | Preț |
|---|---|---|
| `gems_100` | 100 gemuri | 0,99 € |
| `gems_500` | 500 gemuri | 3,99 € |
| `gems_1200` | 1200 gemuri | 7,99 € |
| `gems_3000` | 3000 gemuri | 17,99 € |

- ID-urile trebuie scrise **exact** ca în tabel.
- Activează fiecare produs.
- Completează **Configurare → Cont de plăți** cu datele tale și IBAN (Google plătește lunar, prag minim 100 $).

---

## PARTEA 5 — AdMob (reclamele)

Unitățile de reclamă sunt deja create și puse în cod. Mai faci:

1. În [apps.admob.com](https://apps.admob.com) → **Aplicații → Setări aplicație**: leagă aplicația de pachetul `app.lovable.sudokudrop` (devine disponibil după ce aplicația apare în Play Console).
2. **app-ads.txt**: AdMob → Setări → îți arată fișierul și domeniul unde trebuie publicat. Noi avem deja `public/app-ads.txt` — îl public pe URL-ul aplicației și-ți dau URL-ul exact pentru AdMob.
3. **Mesaj GDPR (UMP)**: AdMob → **Confidențialitate și mesagerie → Mesaje europene** → creează mesajul GDPR pentru aplicație. Codul din aplicație afișează automat formularul.
4. Completează datele de plată în AdMob (CNP/date fiscale + IBAN; prag de plată 100 $).
5. Reclamele reale apar doar în build release pe dispozitiv; în testare pot apărea reclame de test — e normal.

---

## PARTEA 6 — Lansarea în producție

1. După ce testarea internă e OK: **Testare → Promovează lansarea → Producție** (sau creează o lansare nouă de producție cu același .aab).
2. Alege țările, apasă **Trimite spre examinare**.
3. Prima examinare durează de obicei **3–7 zile**. După aprobare, aplicația e live.
4. În prima săptămână verifică: Play Console → Statistici (instalări, erori ANR) și AdMob → venituri.

---

## Ce fac eu în acest proiect (după aprobarea planului)

1. Public paginile `/privacy` și `/terms` pe URL-uri publice și-ți dau linkurile exacte de pus în Play Console.
2. Verific că `public/app-ads.txt` e servit corect și-ți dau URL-ul exact pentru AdMob.
3. Adaug în scriptul de build o verificare automată a AdMob App ID-ului, ca să nu poți publica din greșeală fără el.
4. Îți pregătesc textele fișei de magazin (descriere scurtă + lungă, română + engleză).

## Ce îmi mai trebuie de la tine (pe parcurs, nu acum)

- Dacă vrei anti-fraudă completă la cumpărături (verificare pe server a bonurilor): un fișier JSON „service account" din Google Cloud — îți explic atunci, pas cu pas, cum se generează. Fără el, cumpărările funcționează, dar validarea e doar locală.
