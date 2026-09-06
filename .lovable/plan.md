# Siglă adaptată automat la temă

## Ce schimb
- Păstrez forma rotundă, textul și piesele multicolore exact ca acum.
- Recolorez numai nuanțele albastre ale ramei și interiorului în culoarea temei active.
- Actualizez sigla imediat când utilizatorul schimbă tema și verific afișarea pe ecranul principal.

## Detalii tehnice
- Adaug o componentă dedicată care desenează sigla și remapează doar pixelii albaștri/cyan către accentul semantic al temei.
- Imaginea originală rămâne sursa și fallback-ul; nu modific economia, XP-ul, skinurile sau logica jocului.
