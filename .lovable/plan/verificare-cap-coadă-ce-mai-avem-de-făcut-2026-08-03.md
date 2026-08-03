# Verificare cap-coadă — ce mai avem de făcut

Am parcurs tot codul: rute, joc, economie, backend, magazin, traduceri, SEO și pregătirea pentru APK. Mai jos e starea reală și lista de lucru, în ordinea în care recomand să o facem.

## Ce este gata

- Toate modurile active sunt funcționale și legate corect în navigație: Sudoku Drop liber, Sudoku Clasic, Provocarea Zilnică, Versus (turneu 4/8/16), Time Attack, Tutorial, Explorează.
- Rush, Time Rush, Ice și Killer au fost eliminate complet — nu mai există cod orfan.
- Economia (gemuri / monede / tichete), XP-ul, nivelurile, recordurile pe mod, skinurile și temele funcționează integral local.
- Contul: login email + Google, iar progresul se sincronizează în cloud la autentificare.

## Probleme care blochează lansarea

### 1. Bani gratuiți din migrări (critic)
În store există încă șase „testing grants” care dau automat între 9.000 și 25.000 de gemuri și 50.000 de monede. Le eliminăm complet. Soldul de start devine: **100 gemuri, 100 monede, 5 tichete**. Toate conturile existente sunt resetate la acest sold printr-o migrare nouă. Tichetele gratuite din video rămân exact cum sunt (max 5/zi).

### 2. Clasamentul este fals
Clasamentele sunt generate local cu nume fixe și scoruri aleatorii. Tabela reală din baza de date (`leaderboard_entries`) există, dar nu e folosită de nicăieri. Fără clasament real, turneele nu au miză.

### 3. Turneele sunt simulate local
Adversarii Versus și Time Attack sunt generați pe telefon, iar premiile se acordă local, deci sunt manipulabile. Avem nevoie de scoruri trimise pe server, clasament săptămânal real și premii validate pe server.

### 4. Plățile nu există
Pachetele de gemuri afișează doar „Plățile reale vin în curând”. Pentru Google Play folosim Google Play Billing, nu plăți web.

### 5. Traduceri lipsă
78 de texte folosite în cod nu au traducere — în special ecranele de turnee. Un utilizator pe engleză vede text în română.

### 6. Fără ambalaj de aplicație
Nu există configurație Capacitor și nici iconițe/splash de aplicație. Fără ele nu se poate genera APK/AAB pentru Google Play.

## Îmbunătățiri de calitate

- **Performanță joc**: tabla și piesele nu sunt memoizate deloc; la fiecare tic se redesenează tot. Important pe telefoane slabe.
- **Rezistență la erori**: o singură plasă de siguranță globală — orice eroare albește toată aplicația. Punem protecție separată pe ecranele de joc.
- **Accesibilitate**: butoanele cu doar iconițe (helperi, controale de joc) nu au etichete.
- **Metadate**: rămân minime, doar cât să nu fie goale. Nu investim în SEO/Open Graph, pentru că nu lansăm versiune de browser.

## Ordinea de execuție (le fac pe toate)

```text
Etapa 1  → economie curată: fără grant-uri de test, start 100💎 / 100🪙 / 5🎟️
Etapa 2  → backend real: scoruri + clasamente în baza de date, premii pe server
Etapa 3  → traduceri complete pentru toate ecranele
Etapa 4  → ambalaj Android: Capacitor, iconițe, splash, config pentru AAB
Etapa 5  → polish: memoizare joc, protecție erori, accesibilitate
Etapa 6  → Google Play Billing pentru pachetele de gemuri
```

## Detalii tehnice

- Store `src/store/game-store.ts`: ștergem ramurile `version < 3/6/9/10/11/12` din `migrate`, bump la v13 care setează explicit `diamonds: 100`, `coins: 100`, `tickets: 5`. Sold implicit pentru conturi noi identic. Regenerarea tichetelor (1/45 min, cap 5) și recompensa video rămân neatinse.
- Clasament: server functions care scriu în `leaderboard_entries` la finalul rundei (`mode`, `difficulty`, `score`) și citesc top-ul; `src/routes/leaderboard.tsx` consumă datele reale, cu fallback local când nu e rețea.
- Turnee: tabel de sezon cu înscrieri și scoruri, RLS pe `auth.uid()`, premiile calculate pe server la închiderea sezonului.
- Traduceri: completăm `src/i18n/dictionaries.ts` cu cele 78 de chei lipsă.
- Android: `capacitor.config.ts` cu `webDir` pe build-ul static, iconițe 512/1024, splash, `androidScheme: https`; instrucțiuni de export local pentru generarea AAB.
- Billing: plugin Capacitor pentru Google Play Billing; achiziția e verificată pe server înainte de creditarea gemurilor, ca să nu poată fi falsificată din client.

