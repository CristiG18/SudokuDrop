# Remediere: build-ul Android eșuează la „Setup Android SDK"

## Ce s-a întâmplat

Din logurile tale: build-ul moare la pasul **„Setup Android SDK"**, exact la acțiunea
`android-actions/setup-android@v3`. Ea:

1. Găsește un SDK preinstalat pe server, dar „Wrong version in preinstalled sdkmanager";
2. Descarcă și dezarhivează singură un set de unelte nou;
3. Se împiedică acolo — acțiunea e abandonată de autor și s-a stricat după ultimele
   actualizări ale serverelor GitHub (ubuntu-latest a migrat la 24.04, Node 20 e retras).

Nu e nicio greșeală din partea ta. Codul aplicației nici măcar nu s-a atins — s-a oprit
la pregătirea mediului, înainte de instalare.

## Remedierea (o fac eu, în `.github/workflows/android.yml`)

**Elimin complet acțiunea stricată.** Nu avem nevoie de ea: serverele GitHub au deja
Android SDK preinstalat și funcțional. În locul ei pun un pas simplu, fără dependențe
externe:

```yaml
- name: Setup Android SDK
  run: |
    echo "ANDROID_HOME=$ANDROID_HOME"
    yes | sdkmanager --licenses > /dev/null || true
    sdkmanager "platforms;android-35" "build-tools;35.0.0" > /dev/null
```

- `sdkmanager` e cel preinstalat de GitHub (în PATH pe ubuntu-latest);
- acceptarea licențelor e necesară înainte ca Gradle să poată construi;
- instalez explicit platforma Android 35 + build-tools, să nu depindem de ce versiuni
  au preinstalat ei.

Bonus: dispare și unul dintre avertismentele galbene (celelalte două — Node 20 și
setup-java — sunt doar avertismente, nu opresc nimic).

## Ce faci tu după ce aplic remedierea

1. Aștepți ~1 minut ca modificarea să se sincronizeze singură pe GitHub (sau verifici în
   panoul Git din Lovable că e „In sync").
2. Pe GitHub: **Actions → Android AAB → Run workflow** (la fel ca înainte).
3. Aceasta va fi „rularea 1" adevărată: va ajunge la finalul pasului de semnare, va genera
   cheia și se va opri cu artifactul **keystore-setup** — exact cum era planificat.
4. De acolo continui cu pașii deja stabiliți (secretele → rularea 2 → `app-release.aab`).

## Detalii tehnice

- Fișier modificat: `.github/workflows/android.yml` (doar pașii „Setup Android SDK";
  restul workflow-ului — build web, Capacitor, injectare AdMob/BILLING, keystore,
  semnare, artifact — rămâne neschimbat).
- Nu ating `capacitor.config.ts`, nici aplicația.
- Risc: aproape zero — dacă totuși `sdkmanager` din PATH lipsește pe imaginea nouă, pasul
  echivalent explicit cu `$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager` e planul B.
