# Etapa următoare: pregătire pentru publicare pe Google Play

## Răspunsuri la întrebările tale

**Unde stau conturile și datele (gemuri, skinuri, progres)?**
Pe Lovable Cloud — backendul inclus în proiect (bază de date + autentificare + funcții de server, găzduit de Lovable). Nu ai nevoie de cont separat la alt furnizor. Costul e inclus în abonamentul Lovable, cu limite de utilizare; la trafic mare se plătește la consum. Tabelele există deja (`player_stats`, `leaderboard_best`), iar sincronizarea contului se face la autentificare.

**Ce e implementat din cumpărături?** Nimic real. Magazinul afișează pachete de gemuri, dar butonul doar spune „Plățile reale vin în curând". Pentru Google Play trebuie Google Play Billing (nu plăți web — Google interzice plăți externe pentru bunuri digitale în aplicație).

**Ce e implementat din reclame?** Nimic real. Tot ce zice „vezi un video" (tichete, power-up-uri, hint-uri, revive) acordă recompensa instant, fără reclamă. Trebuie integrat AdMob rewarded.

**Cont cu user și parolă fără Gmail?** Da, deja există: pe `/auth` ai email + parolă, pe lângă Google. Contul se poate face doar cu email + parolă (min. 6 caractere). Adaug și „am uitat parola" (lipsește acum).

**Termeni și GDPR?** Da, sunt obligatorii — și pentru Google Play (link la politica de confidențialitate în listare) și legal în UE. Acum nu există deloc.

**La „Personal" scrie Invitat / Phase 3** — text vechi rămas în cod; se înlocuiește cu emailul real și buton de login/logout.

## Ce facem în etapa asta

### 1. Cont și date personale (obligatoriu Play)
- Ecranul Personal arată contul real (email, avatar-inițială), buton Intră / Ieși.
- Resetare parolă: `/auth` trimite email, pagină nouă `/reset-password`.
- Pagini noi: `/terms`, `/privacy` (GDPR: ce date colectăm — email, progres, ID reclame; temei legal; retenție; drepturi).
- La creare cont: bifă de acceptare Termeni + Confidențialitate, obligatorie.
- Ștergere cont din Setări (cerință Google Play: trebuie să existe și în aplicație).
- Banner de consimțământ pentru reclame personalizate (UMP/GDPR) înainte de prima reclamă.

### 2. Reclame reale (AdMob)
- Rewarded video pentru: tichete (max 5/zi), power-up-uri, hint-uri la Clasic, revive.
- Recompensa se acordă doar după ce SDK-ul confirmă vizionarea; în web/preview rămâne fallback-ul actual ca să se poată testa.
- Fără reclame intruzive în timpul jocului.

### 3. Cumpărături reale (Google Play Billing)
- Pachetele de gemuri devin produse Play (in-app products).
- Achiziția se verifică pe server înainte de creditarea gemurilor, ca să nu poată fi falsificată din client.
- Restaurare achiziții + tratare achiziții în așteptare.

### 4. Ambalaj și listare Play
- Iconițe (512 + adaptive), splash, feature graphic, capturi de ecran.
- Versionare, semnare, generare AAB, completare Data Safety + politica de confidențialitate în Play Console.

### Ordine recomandată
```text
1 → cont, termeni/GDPR, ștergere cont, reset parolă, fix ecran Personal
2 → AdMob rewarded + consimțământ
3 → Google Play Billing + verificare pe server
4 → iconițe, AAB, listare Play
```

## Detalii tehnice
- `src/routes/personal.tsx`: înlocuim „Invitat / Conectare în Phase 3" cu sesiunea Supabase reală (`onAuthStateChange`), la fel ca în `settings.tsx`.
- `src/routes/auth.tsx`: adăugăm `resetPasswordForEmail` + rută publică `/reset-password` cu `updateUser({ password })`; checkbox termeni la signup.
- Ștergere cont: server function cu verificare de sesiune care șterge rândurile din `player_stats` / `leaderboard_best` și utilizatorul din auth.
- Reclame: plugin Capacitor AdMob + strat `src/lib/ads.ts` cu aceeași interfață ca handlerele actuale de „video", astfel încât componentele existente (`TicketMeter`, `RewardedHelperModal`, `HintShopModal`, modalul de revive) să nu fie rescrise.
- Billing: plugin Capacitor de Play Billing; token-ul achiziției se validează într-o server function înainte de creditare, cu tabel `purchases` pentru idempotență.
- `capacitor.config.ts` folosește `server.url` către domeniul publicat — trebuie actualizat la domeniul final înainte de build-ul de release.
