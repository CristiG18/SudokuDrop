# Cum legăm aplicația de plățile Google Play

Mesajul din Play Console („trebuie să adaugi permisiunea FACTURARE în APK") înseamnă un singur lucru: Google nu îți lasă să creezi produse in-app până nu urci un build care conține permisiunea `com.android.vending.BILLING`. Deci ordinea corectă e: build → upload la Testare internă → abia apoi produsele.

## Ce lipsește acum în proiect

- Nu există folderul `android/` (proiectul nativ nu a fost generat încă).
- `cordova-plugin-purchase` e instalat ca pachet npm, dar nu e conectat la proiectul Android, deci permisiunea BILLING nu ajunge în manifest.
- `capacitor.config.ts` trimite spre `https://sudoku-drop.lovable.app` — domeniul trebuie să fie cel publicat real înainte de build-ul de release.

## Ce fac eu în cod

1. Adaug permisiunea BILLING explicit, ca să nu depindă de plugin: intrare `<uses-permission android:name="com.android.vending.BILLING" />` injectată în `AndroidManifest.xml` prin scriptul existent `scripts/inject-admob-android.js` (îl extind, rulează deja la `bun run cap:sync`).
2. Adaug dependența nativă de billing în `android/app/build.gradle` (`com.android.billingclient:billing`), cerută de cordova-plugin-purchase.
3. Setez `versionCode`/`versionName` și `applicationId = app.lovable.sudokudrop` verificat.
4. Confirm domeniul publicat în `capacitor.config.ts`.
5. Adaug în README pașii de generare AAB semnat.

Notă: `npx cap add android` și build-ul AAB nu pot rula aici (nu există Android SDK/Java în mediul Lovable) — se rulează pe calculatorul tău, în Android Studio. Eu pregătesc tot ce ține de cod și configurare.

## Ce faci tu, pas cu pas

### A. Publică aplicația web (o dată)
Apeși Publish în Lovable și îmi spui domeniul final. Aplicația Android încarcă acel site, deci trebuie să existe.

### B. Exportă proiectul și generează AAB
1. Export to GitHub din Lovable, apoi `git clone` pe calculatorul tău.
2. În folderul proiectului:
   ```text
   npm install
   npm run build
   npx cap add android
   npm run cap:sync
   npx cap open android
   ```
3. În Android Studio: Build → Generate Signed App Bundle.
   - Creezi un keystore nou (Create new…) și **îl păstrezi într-un loc sigur** — dacă îl pierzi, nu mai poți actualiza niciodată aplicația.
   - Rezultă `app-release.aab`.

### C. Urcă build-ul în Play Console
Meniul aplicației → Testare → **Testare internă** → Creați o versiune → urci `.aab`-ul → Salvează și lansează.

### D. Abia acum creezi produsele
Generarea de bani → Produse → **Produse cu plată unică** → Creează produs, toate **consumabile**, apoi **Activează**:

| ID produs | Preț | Gemuri |
|---|---|---|
| `gems_100` | 0,99 € | 100 |
| `gems_500` | 3,99 € | 500 |
| `gems_1200` | 7,99 € | 1.200 |
| `gems_3000` | 17,99 € | 3.000 |

ID-urile trebuie scrise exact așa — sunt deja hardcodate în `src/lib/billing.ts`.

### E. Profil de plăți
Setări → Profil de plăți: completează-l acum, validarea durează zile. Fără el nu încasezi bani.

### F. Testare fără bani reali
Play Console → Setări cont → **Testare licențe**: adaugi adresa ta de Gmail. Apoi, ca tester intern, achizițiile sunt gratuite dar trec prin fluxul real.

## Verificare anti-fraudă (pasul final, opțional acum)
`src/lib/billing.functions.ts` are deja stub-ul de validare pe server. Când vrei protecție reală: în Google Cloud Console creezi un service account legat de Play Console (Utilizatori și permisiuni → acces API), descarci JSON-ul și mi-l dai — îl salvez ca secret și activez validarea token-ului la Google înainte de creditarea gemurilor. Adaug și tabela `purchases` pentru idempotență (migrarea a eșuat data trecută, o reiau).

## Detalii tehnice
- Fișiere atinse: `scripts/inject-admob-android.js`, `capacitor.config.ts`, `src/routes/README.md` (instrucțiuni build), plus migrarea pentru `purchases`.
- `src/lib/billing.ts` și `src/lib/billing.functions.ts` rămân neschimbate ca API; doar validarea server-side se completează la pasul final.
