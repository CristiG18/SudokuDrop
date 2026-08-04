# Build Android (AAB) + Google Play Billing

Aplicația: `app.lovable.sudokudrop` — "Sudoku Drop".

## 0. Publică aplicația web
Capacitor încarcă site-ul publicat (`server.url` din `capacitor.config.ts`).
Publică din Lovable și pune domeniul final acolo înainte de build-ul de release.

## 1. Export + build local
```bash
git clone <repo-ul-tau>
cd <proiect>
npm install
npm run build
npx cap add android      # doar prima dată
npm run cap:sync         # sync + injectare AdMob App ID + permisiune BILLING
npx cap open android
```

`npm run cap:sync` rulează `scripts/inject-admob-android.js`, care:
- pune AdMob App ID în `strings.xml` + `AndroidManifest.xml`
- adaugă `<uses-permission android:name="com.android.vending.BILLING" />`
- adaugă `com.android.billingclient:billing` în `android/app/build.gradle`

Fără permisiunea BILLING, Play Console afișează "trebuie să adaugi permisiunea
FACTURARE în APK" și nu lasă crearea produselor in-app.

## 2. Versionare
În `android/app/build.gradle` → `defaultConfig`:
- `versionCode` — număr întreg, crescut la fiecare upload (1, 2, 3, ...)
- `versionName` — text vizibil ("1.0.0")

## 3. AAB semnat
Android Studio → Build → Generate Signed App Bundle → Android App Bundle.
Prima dată: Create new… keystore. **Păstrează keystore-ul și parolele** —
fără ele nu mai poți publica actualizări niciodată.

Rezultat: `android/app/release/app-release.aab`.

## 4. Upload în Play Console
Aplicația → Testare → Testare internă → Creați o versiune → încarcă `.aab`.

## 5. Produse in-app (după upload)
Generarea de bani → Produse → Produse cu plată unică. Toate **consumabile**,
apoi **Activează**:

| ID produs | Preț | Gemuri |
|---|---|---|
| `gems_100` | 0,99 € | 100 |
| `gems_500` | 3,99 € | 500 |
| `gems_1200` | 7,99 € | 1.200 |
| `gems_3000` | 17,99 € | 3.000 |

ID-urile sunt hardcodate în `src/lib/billing.ts` (`GEM_PACKS`) — trebuie identice.

## 6. Testare fără bani reali
Play Console → Setări cont → Testare licențe → adaugă adresa ta Gmail.

## 7. Verificare pe server (anti-fraudă)
`src/lib/billing.functions.ts` validează token-ul achiziției. Când există
secretul `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`, verificarea se face la Google
Play Developer API, iar achiziția se înregistrează în tabela `purchases`
pentru idempotență.
