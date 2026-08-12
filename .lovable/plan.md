# Pași exacti pentru publicare pe Google Play + billing activ

Acest plan detaliază, pas cu pas, pe ce apeși, unde și în ce ordine, ca să publici „Sudoku Drop" (app.lovable.sudokudrop) pe Google Play și să activezi achizițiile în aplicație (gemuri).

## Important înainte să începi

- Contul **Google Play Developer** este deja făcut (taxa de $25 plătită).
- Contul **AdMob** este deja făcut.
- **Nu poți crea produse in-app până nu urci un build `.aab` cu permisiunea BILLING.** Ordinea este fixă: build → upload → abia apoi produse.
- Codul din aplicație este pregătit: `cordova-plugin-purchase`, `cordova-plugin-purchase`, AdMob App ID, permisiune BILLING, dependență billingclient. Tu doar urci build-ul și configurezi produsele în Play Console.

---

## Faza A — Publică aplicația web în Lovable (o singură dată)

Aplicația Android încarcă site-ul publicat, deci trebuie să existe un domeniu live.

1. În Lovable, în partea de sus a previzualizării, apasă butonul **Publish** (sau **Publish app**).
2. Așteaptă să se finalizeze publicarea. O să primești un domeniu de forma `https://numele-tău.lovable.app`.
3. **Copiază acel domeniu** și trimite-l mie. Eu îl voi pune în `capacitor.config.ts` la `server.url`.
4. După ce schimb domeniul în cod, **publică din nou** în Lovable ca să iei ultima versiune pe domeniul final.

---

## Faza B — Exportă proiectul pe GitHub

1. În Lovable, în colțul din stânga sus sau în meniu, caută opțiunea **Export to GitHub** / **Export project**.
2. Alege să creezi un repository nou (sau să-l legi de unul existent).
3. Apasă **Export / Push to GitHub**.
4. Copiază URL-ul repository-ului (de exemplu `https://github.com/user/sudoku-drop`).

---

## Faza C — Build local pe calculatorul tău (Android Studio)

### C1. Instalează ce ai nevoie (doar prima dată)

1. Descarcă și instalează **Android Studio** de la https://developer.android.com/studio.
2. Deschide Android Studio. La prima lansare, lasă-l să-și descarce SDK-urile implicite (Next, Next, Finish).
3. Instalează **Node.js** (LTS) de la https://nodejs.org dacă nu îl ai deja.

### C2. Clonează proiectul și pregătește build-ul

1. Deschide un terminal (cmd, PowerShell sau Terminal).
2. Rulează, înlocuind `<repo-ul-tău>` cu URL-ul de la GitHub:
   ```text
   git clone <repo-ul-tău>
   cd <numele-folderului-proiectului>
   ```
3. Instalează dependențele:
   ```text
   npm install
   ```
4. Build web:
   ```text
   npm run build
   ```
   Dacă nu există erori, va apărea folderul `dist/client`.
5. Adaugă platforma Android (doar prima dată):
   ```text
   npx cap add android
   ```
   Dacă îți spune că deja există, treci mai departe.
6. Rulează scriptul de sync (injectează AdMob App ID, permisiune BILLING, dependență billing):
   ```text
   npm run cap:sync
   ```
7. Deschide proiectul în Android Studio:
   ```text
   npx cap open android
   ```

### C3. Verifică în Android Studio

1. În Android Studio, în stânga, deschide `app → res → values → strings.xml` și confirmă că există o linie asemănătoare:
   ```xml
   <string name="admob_app_id">ca-app-pub-4013371667115642~7583618725</string>
   ```
2. Deschide `app → src → main → AndroidManifest.xml` și confirmă că există:
   ```xml
   <uses-permission android:name="com.android.vending.BILLING" />
   <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="@string/admob_app_id" />
   ```
3. Deschide `app → build.gradle` (cel din folderul `app`, nu cel rădăcină) și confirmă în interiorul blocului `dependencies`:
   ```groovy
   implementation "com.android.billingclient:billing:7.1.1"
   ```
4. În același fișier `app/build.gradle`, caută blocul `defaultConfig` și setează:
   ```groovy
   defaultConfig {
       applicationId "app.lovable.sudokudrop"
       minSdkVersion 23
       targetSdkVersion 35
       versionCode 1
       versionName "1.0.0"
       ...
   }
   ```
   - `versionCode` trebuie să fie **1** acum și **crescut cu 1 la fiecare upload următor** (2, 3, 4…).
   - `versionName` este ce văd utilizatorii (ex: "1.0.0", "1.1.0").

### C4. Generează AAB semnat

1. În Android Studio, în meniul de sus, apasă **Build → Generate Signed App Bundle / APK...**
2. Selectează **Android App Bundle (AAB)** → **Next**.
3. La **Key store path**, apasă **Create new...** (doar prima dată).
   - **Key store path**: alege un loc sigur pe calculator (de ex. `C:\Users\Tine\sudoku-drop-keystore.jks`).
   - **Password**: parolă puternică, pe care să o ții minte.
   - **Key alias**: pune `sudokudrop`.
   - **Key password**: poate fi aceeași cu cea de mai sus.
   - Completează restul câmpurilor (numele, organizația) — pot fi fictive.
   - Apasă **OK**.
   - **ATENȚIE**: păstrează fișierul `.jks` și parolele într-un loc sigur. Dacă le pierzi, nu mai poți actualiza aplicația niciodată.
4. Alege keystore-ul creat, introdu parola și aliasul, apoi apasă **Next**.
5. La **Destination folder**, lasă calea implicită (`android/app/release/`).
6. La **Build variants**, selectează **release**.
7. Apasă **Finish**.
8. Așteaptă. La final, fișierul `app-release.aab` va fi în:
   ```text
   android/app/release/app-release.aab
   ```

---

## Faza D — Creează aplicația în Google Play Console (dacă nu ai făcut-o deja)

1. Intri pe https://play.google.com/console.
2. Meniu stânga sus → **Toate aplicațiile**.
3. Apasă butonul **Creați o aplicație**.
4. Completează:
   - **Titlu aplicației**: `Sudoku Drop`
   - **Limba implicită**: Română
   - **Tip aplicație**: `Joc`
   - **Gratuit** (nu bifa „Cu plată")
   - Bifează declarațiile legale.
5. Apasă **Creați aplicația**.
6. După creare, apasă în meniu stânga: **Setări aplicației → Informații de bază**.
   - Confirmă că **Numele pachetului** este `app.lovable.sudokudrop` (sau îl setezi dacă te lasă). Dacă nu-l poți schimba, anunță-mă.

---

## Faza E — Urcă build-ul în Play Console (Testare internă)

1. În Play Console, asigură-te că ești în aplicația „Sudoku Drop".
2. Meniu stânga → **Testare** → **Testare internă**.
3. Apasă **Creați o versiune** (sau **Create new release**).
4. În secțiunea **App bundles**, apasă **Încărcați** (Upload) și selectează fișierul:
   ```text
   android/app/release/app-release.aab
   ```
5. Așteaptă să se proceseze. Dacă îți cere să completezi ceva, urmează pașii (de obicei trebuie să setezi țintele de conținut și prețul).
6. Apasă **Salvați și lansați** (Save and publish).
7. Așteaptă câteva minute (până la câteva ore) ca Google să proceseze build-ul. O să primești o bifă verde când este disponibil.

---

## Faza F — Creează produsele in-app (după ce build-ul a fost procesat)

Mesajul „trebuie să adaugi permisiunea FACTURARE în APK" trebuie să dispară abia acum.

1. În Play Console, în aplicația ta, meniu stânga → **Generarea de bani** → **Produse** → **Produse cu plată unică**.
2. Apasă **Creați produs** (Create product).
3. Completează pentru primul produs:
   - **ID produs**: `gems_100`
   - **Nume**: `100 Gemuri`
   - **Descriere**: `Pachet de 100 de gemuri pentru magazinul din joc.`
   - **Tip**: **Consumabil**
   - **Preț**: `0,99 EUR` (sau echivalent în moneda ta locală)
4. Apasă **Creați**.
5. La produsul creat, apasă butonul **Activare** (Activate). Fără asta, produsul nu este vizibil în aplicație.
6. Repetă pașii 2-5 pentru celelalte 3 produse:

| ID produs | Nume | Tip | Preț |
|---|---|---|---|
| `gems_100` | 100 Gemuri | Consumabil | 0,99 € |
| `gems_500` | 500 Gemuri | Consumabil | 3,99 € |
| `gems_1200` | 1.200 Gemuri | Consumabil | 7,99 € |
| `gems_3000` | 3.000 Gemuri | Consumabil | 17,99 € |

7. După ce toate 4 sunt **Active**, produsele sunt gata de achiziție în aplicație.

---

## Faza G — Profil de plăți (pentru a încasa bani)

1. În Play Console, meniu stânga → **Setări** → **Profil de plăți** (sau în contul tău, dacă nu este la nivel de aplicație).
2. Completează toate câmpurile:
   - Datele tale personale/firmă.
   - Cont bancar unde să primești banii.
   - Informații fiscale (W-8BEN dacă ești în afara SUA, formularul corespunzător).
3. Apasă **Salvați** / **Trimiteți**.
4. Validarea durează de la câteva zile până la săptămâni. Fără profil de plăți validat, nu primești banii, dar achizițiile pot funcționa în testare.

---

## Faza H — Configurează testarea fără bani reali

1. În Play Console, meniu stânga → **Setări cont** → **Testare licențe**.
2. Adaugă adresa ta de Gmail în lista de testeri licențe.
3. Pe telefonul Android, asigură-te că ești logat cu același Gmail în Google Play Store.
4. Instalează aplicația din testarea internă (linkul de invitație apare în Play Console la Testare internă → Testeri).
5. Când faci achiziții în aplicație, vei vedea un text de genul „Acesta este un test, nu vei fi taxat".

---

## Faza I — Consimțământ GDPR în AdMob (pentru utilizatorii din EEA)

1. Intri pe https://apps.admob.com.
2. Meniu stânga → **Privacy & messaging** (sau **Confidențialitate și mesaje**).
3. Apasă **GDPR**.
4. Apasă **Create message**.
5. Selectează aplicația „Sudoku Drop".
6. Alege un stil de banner (standard este OK).
7. Completează textele în limbile dorite (română, engleză etc.). Poți folosi textul standard sugerat de Google.
8. Publică mesajul (Publish).
9. În aplicație, codul deja cere consimțământul la pornire prin UMP. Nu trebuie să faci altceva în cod.

---

## Faza J — Verificare anti-fraudă pe server (pas final, opțional acum, obligatoriu înainte de publicare)

Momentan, achizițiile creditează gemurile imediat, fără verificare la Google. Asta e OK pentru testare internă, dar înainte de publicare trebuie să verificăm tokenul pe server.

### Ce trebuie să faci în Google Cloud Console

1. Intri pe https://console.cloud.google.com.
2. Selectează sau creează un proiect (poți folosi același proiect legat de Play Console).
3. Meniu → **APIs & Services** → **Library**.
4. Caută **Google Play Android Developer API** și apasă **Enable**.
5. Meniu → **IAM & Admin** → **Service accounts**.
6. Apasă **Create service account**.
   - **Name**: `play-billing-verifier`
   - **Role**: `Owner` (sau `Editor`)
   - Apasă **Create and continue**, apoi **Done**.
7. Deschide service account-ul creat, mergi la tab-ul **Keys**.
8. Apasă **Add key** → **Create new key**.
9. Selectează **JSON** și apasă **Create**.
10. Se descarcă automat un fișier `.json` pe calculator. **Nu-l pierde și nu-l încărca public nicăieri.**

### Ce faci cu fișierul JSON

1. Trimite-mi mie conținutul fișierului JSON (poți copia textul din el și să mi-l dai într-un mesaj separat).
2. Eu îl salvez ca secret în backend (`GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`) și activez verificarea reală a achizițiilor.
3. Eu creez și tabela `purchases` pentru idempotență (să nu poți primi gemuri de două ori pentru același token).

---

## Faza K — Ce urmează după ce termini pașii de mai sus

1. **Mie îmi trimiți**:
   - Domeniul publicat din Lovable.
   - Fișierul JSON al service account-ului (când l-ai creat).
2. **Eu voi face**:
   - Actualizez `capacitor.config.ts` cu domeniul final.
   - Activez verificarea reală anti-fraudă când ai service account JSON.
   - Reîncerc migrarea tabelului `purchases` (a eșuat anterior din cauza timeout-ului).
3. **Tu testezi**:
   - Faci un build nou după ce schimb domeniul.
   - Urci din nou AAB-ul în Testare internă.
   - Te loghezi ca tester licențe și cumperi un pachet de gemuri — trebuie să vezi mesaj de test, fără bani reali.

---

## Rezumat ordine acțiuni

1. **Publică în Lovable** → trimite-mi domeniul.
2. **Exportă pe GitHub**.
3. **Build local** → `npm install && npm run build && npx cap add android && npm run cap:sync && npx cap open android`.
4. **Android Studio** → Generate Signed App Bundle → obții `app-release.aab`.
5. **Play Console** → creezi aplicația Sudoku Drop (dacă nu există).
6. **Play Console** → Testare internă → urci `.aab` → Salvează și lansează.
7. **Play Console** → Generarea de bani → Produse cu plată unică → creezi 4 consumabile (`gems_100`, `gems_500`, `gems_1200`, `gems_3000`) și le activezi.
8. **Play Console** → Setări → Profil de plăți → completezi datele.
9. **Play Console** → Setări cont → Testare licențe → adaugi Gmail-ul.
10. **AdMob** → Privacy & messaging → GDPR → creezi și publici mesajul.
11. **Google Cloud Console** → enable Google Play Android Developer API + creezi service account JSON → îmi trimiți JSON-ul.
12. **Eu** activez verificarea reală și finalizez tabela `purchases`.
13. **Tu** faci build nou, urci din nou AAB și testezi achiziția de test.
