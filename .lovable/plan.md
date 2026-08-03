# Verificare cap-coadă — ce mai avem de făcut

Am parcurs tot codul: rute, joc, economie, backend, magazin, traduceri, SEO și pregătirea pentru APK. Mai jos e starea reală și lista de lucru, în ordinea în care recomand să o facem.

## Ce este gata

- Toate modurile active sunt funcționale și legate corect în navigație: Sudoku Drop liber, Sudoku Clasic, Provocarea Zilnică, Versus (turneu 4/8/16), Time Attack, Tutorial, Explorează.
- Rush, Time Rush, Ice și Killer au fost eliminate complet — nu mai există cod orfan.
- Economia (gemuri / monede / tichete), XP-ul, nivelurile, recordurile pe mod, skinurile și temele funcționează integral local.
- Contul: login email + Google, iar progresul se sincronizează în cloud la autentificare.

## Probleme care blochează lansarea

### 1. Bani gratuiți din migrări (critic)
În store există încă șase „testing grants” care dau automat între 9.000 și 25.000 de gemuri și 50.000 de monede oricui a mai deschis jocul. Cu ele active, magazinul nu are niciun sens economic. Trebuie eliminate și înlocuite cu un sold de start normal.

### 2. Clasamentul este fals
Clasamentele sunt generate local cu nume fixe și scoruri aleatorii. Tabela reală din baza de date (`leaderboard_entries`) există, dar nu e folosită de nicăieri. Fără clasament real, turneele nu au miză.

### 3. Turneele sunt simulate local
Adversarii Versus și Time Attack sunt generați pe telefon. Premiile se acordă local, deci sunt manipulabile. Pentru lansare avem nevoie măcar de: scoruri trimise pe server, clasament săptămânal real și acordarea premiilor pe server, nu în telefon.

### 4. Plățile nu există
Pachetele de gemuri afișează doar „Plățile reale vin în curând”. Fără billing, nu există venit.

### 5. Traduceri lipsă
78 de texte folosite în cod nu au traducere — în special ecranele de turnee. Un utilizator pe engleză vede text în română.

### 6. Fără ambalaj de aplicație
Nu există configurație Capacitor, manifest PWA sau iconițe de aplicație (doar un favicon). Jocul nu se poate instala și nu se poate construi APK în starea actuală.

## Îmbunătățiri de calitate (după blocante)

- **SEO / partajare**: 8 rute au doar titlu, fără descriere; nicio rută nu are tag-uri Open Graph, deci un link partajat arată gol. Tutorialul pe moduri folosește același titlu pentru toate modurile.
- **Performanță joc**: tabla și piesele nu sunt memoizate deloc; la fiecare tic se redesenează tot. De optimizat înainte de rularea pe telefoane slabe.
- **Rezistență la erori**: există o singură plasă de siguranță globală — orice eroare într-un ecran albește toată aplicația. De pus protecție separată pe ecranele de joc.
- **Accesibilitate**: butoanele cu doar iconițe (helperi, controale de joc) nu au etichete.

## Ordinea propusă

```text
Etapa 1 (blocante economie)   → scoatem grant-urile de test, sold de start corect
Etapa 2 (backend real)        → scoruri + clasamente reale, premii pe server
Etapa 3 (traduceri + SEO)     → completăm dicționarul, descrieri + OG pe fiecare rută
Etapa 4 (ambalaj)             → manifest PWA, iconițe, configurație Capacitor pentru APK
Etapa 5 (polish)              → memoizare joc, protecție erori, accesibilitate
Etapa 6 (plăți)               → Google Play Billing pentru APK / Stripe pentru web
```

## Detalii tehnice

- Grant-uri de șters: `src/store/game-store.ts`, ramurile `version < 3/6/9/10/11/12` din `migrate`; bump la v13 cu resetare controlată a soldurilor.
- Clasament real: server functions (`createServerFn`) care scriu în `leaderboard_entries` la finalul unei runde și citesc top-ul pe `mode`+`difficulty`; `src/routes/leaderboard.tsx` trece de la PRNG local la aceste date, cu fallback local când e offline.
- Turnee: tabel nou pentru înscrieri și scoruri de sezon, cu politici RLS pe `auth.uid()`, plus validarea premiilor pe server.
- Traduceri: completare `src/i18n/dictionaries.ts` pentru cele 78 de chei lipsă (grup turnee/versus).
- Ambalaj: `public/manifest.webmanifest`, iconițe 192/512, `theme-color`, apoi `capacitor.config.ts` cu build static.
- Plăți: pe APK Google Play Billing prin plugin Capacitor; pe web Stripe Checkout cu verificare pe server înainte de creditarea gemurilor.

## De confirmat

1. Ținta principală de lansare: APK în Play Store, sau web/PWA întâi?
2. La resetarea economiei: vrei să păstrezi un sold de test pe contul tău, sau pornim toți de la zero?
