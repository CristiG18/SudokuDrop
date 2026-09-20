# Lansare fără laptop — analiza răspunsului celuilalt AI + planul final

## Verdictul meu despre ce ți-a zis celălalt AI

**Ce are dreptate:** Da, se poate publica pe Google Play fără laptop, prin build în cloud. E o metodă reală și gratuită.

**Ce greșește sau nu știe despre proiectul tău:**

1. **Pasul 2 e inutil** — Capacitor e deja configurat complet (`capacitor.config.ts`, appId `app.lovable.sudokudrop`, AdMob, splash, script de injectare care adaugă și permisiunea de facturare). Dacă ai urma sfatul lui cu `com.sudokudrop.app`, ai strica legătura cu AdMob și cu produsele de cumpărare deja stabilite. NU schimbăm appId.
2. **Codemagic de pe telefon e chinuitor** — cere configurare YAML și încărcare manuală de chei de semnare, greoi fără tastatură. Varianta mai bună: **GitHub Actions** — eu scriu fișierul de build direct în proiect, se sincronizează singur pe GitHub, tu doar apeși un buton „Run" din browser.
3. **„Politica de confidențialitate generată pe un site random" e o prostie** — ai deja pagini reale publicate: `sudokudrop.lovable.app/privacy` și `/terms`. Le folosim pe alea.
4. **„Declară că nu colectezi date" e periculos** — aplicația colectează e-mail (cont) și ID-uri de dispozitiv (AdMob). O declarație falsă în Data Safety poate duce la respingerea sau eliminarea aplicației.
5. **Omite complet:** cheia de semnare, permisiunea de facturare (fără ea nu poți crea produsele de gemuri), produsele in-app, legarea AdMob, mesajul GDPR.

## Planul final — totul de pe telefon/tabletă

```text
PASUL 1  → Conectezi proiectul la GitHub (2 minute, din Lovable)
PASUL 2  → Eu scriu workflow-ul de build; tu adaugi 4 secrete în GitHub
PASUL 3  → Apeși „Run workflow" în GitHub → descarci app-release.aab
PASUL 4  → Play Console: creezi aplicația, urci .aab, completezi fișa
PASUL 5  → Creezi cele 4 produse de gemuri + profil de plăți
PASUL 6  → AdMob: legi aplicația, mesaj GDPR, date de plată
PASUL 7  → Testare internă → promovezi în producție
```

### Pasul 1 — GitHub (tu, 2 minute)
În editorul Lovable: meniul **+** din chat → **GitHub → Connect project** → autorizezi → **Create Repository**. Gata, codul se sincronizează singur de acum.

### Pasul 2 — Build-ul automat (eu scriu codul, tu pui secretele)
Eu creez `.github/workflows/android.yml` care: instalează proiectul, construiește aplicația web, generează proiectul Android, injectează AdMob + permisiunea de facturare, semnează și livrează `app-release.aab`.

Pentru semnare ai nevoie de o cheie (keystore). Fluxul fără laptop:
- Prima rulare a workflow-ului **generează singură cheia** și ți-o dă ca fișier de descărcat, plus un text lung de copiat.
- Tu copiezi acel text în **GitHub → repo → Settings → Secrets and variables → Actions** ca secret `KEYSTORE_BASE64`, împreună cu parolele afișate de workflow (`KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD` — toate ți le dă workflow-ul gata de copiat).
- **Copiază cheia și parolele și într-o notiță/Google Drive.** Cu „Play App Signing" (pasul 4) Google poate reseta cheia dacă o pierzi, deci riscul e mic.
- Rulezi workflow-ul a doua oară → primești `app-release.aab` la „Artifacts", pe care îl descarci pe telefon.

### Pasul 3 — descarci `.aab`
GitHub → repo → **Actions** → rularea terminată → **Artifacts** → descarci. Fișierul ajunge în Downloads pe telefon.

### Pasul 4 — Play Console (din browser, activează „Versiune desktop" în Chrome)
1. [play.google.com/console](https://play.google.com/console) → **Creează aplicație**: nume `Sudoku Drop`, română, Joc, Gratuit.
2. La primul upload alege **Play App Signing** (recomandat).
3. **Testare → Testare internă → Creează versiune** → încarci `app-release.aab` din Downloads.
4. Completezi checklist-ul:
   - **Fișa magazinului**: descrieri (ți le scriu eu, română + engleză), iconiță 512×512 și imagine 1024×500 (ți le generez eu), 2 capturi de ecran făcute pe telefon.
   - **Evaluare conținut (IARC)**: „Nu" la violență/jocuri de noroc → PEGI 3.
   - **Politica de confidențialitate**: `https://sudokudrop.lovable.app/privacy` (există deja).
   - **Declarație reclame**: DA (AdMob).
   - **Data safety**: e-mail, ID dispozitiv, date de joc; criptate în tranzit: Da.
   - **Public țintă**: 13+. **Țări**: toate.

### Pasul 5 — Produsele de gemuri
Play Console → **Monetizare → Produse → Produse în aplicație**, câte unul, toate **consumabile**, apoi **Activează**:

| ID produs (exact!) | Preț |
|---|---|
| `gems_100` | 0,99 € |
| `gems_500` | 3,99 € |
| `gems_1200` | 7,99 € |
| `gems_3000` | 17,99 € |

Plus: **Setări → Profil de plăți** — completezi datele și IBAN-ul (validarea durează câteva zile, fă-o devreme).

### Pasul 6 — AdMob
1. [apps.admob.com](https://apps.admob.com) → **Aplicații** → leagi aplicația de pachetul `app.lovable.sudokudrop`.
2. **Confidențialitate și mesagerie** → creezi mesajul GDPR (aplicația îl afișează singură).
3. Completezi datele de plată AdMob (prag 100 $).
4. `app-ads.txt` e deja publicat la `https://sudokudrop.lovable.app/app-ads.txt` — pui acest URL în AdMob când îl cere.

### Pasul 7 — Testare și lansare
1. Play Console → Testare internă → te adaugi ca tester (Gmail) → instalezi pe telefon din linkul de testare.
2. Testezi real: o partidă, o reclamă cu recompensă, o cumpărare de gemuri (ca tester e gratuită).
3. **Promovează în Producție** → Trimite spre examinare. Prima examinare: 3–7 zile.

## Ce fac eu după aprobarea planului
1. Scriu `.github/workflows/android.yml` (build complet + semnare + generarea cheii la prima rulare).
2. Generez iconița 512×512 și imaginea reprezentativă 1024×500 pentru fișa magazinului.
3. Scriu descrierile scurtă + lungă (română + engleză) gata de copiat în Play Console.

## Ce trebuie să știi
- Taxa de 25 $ pentru contul Google Play Developer o plătești tu, o singură dată.
- Build-ul durează ~5–10 minute la fiecare rulare; GitHub oferă gratuit 2.000 minute/lună — ajung lejer.
- Singurul lucru care rămâne opțional pe viitor: verificarea anti-fraudă a cumpărăturilor pe server (necesită un fișier din Google Cloud — îți explic atunci).
