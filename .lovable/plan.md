# Undo în loc de Reset la Sudoku clasic

## Ce se schimbă
Butonul „Reset" din Sudoku clasic devine „Undo": anulează doar ultima mutare, nu șterge toată tabla. Greșelile (mistakes) rămân la fel — nu se decrementa.

## Implementare

**`src/routes/play.classic.tsx`:**

1. **Istoric de mutări** — stare nouă `history: CellValue[][][]` (array de grile). Fiecare mutare (`enter`, `useHint`, auto-complete pas cu pas) adaugă grila anterioară în istoric înainte de modificare. Limita istoricului: 100 de pași (suficient pentru un puzzle complet).

2. **Funcția `undo()`** înlocuiește `reset()`:
   - Ia ultima grilă din istoric, o setează ca grila curentă, scoate-o din istoric.
   - **Greșelile NU se resetează** (mistakes rămân), la fel hintsLeft/hintsUsed dacă ultima mutare a fost indiciu — indiciul consumat rămâne consumat.
   - Buton dezactivat (opacitate redusă) când istoricul e gol.
   - Undo este blocat după win/lose (grila e finală).

3. **UI** — butonul existent primește eticheta „Undo" și iconița `Undo2` din lucide (păstrăm poziția în bara de unelte).

4. **Restart** rămâne disponibil separat — în meniul de pauză („Restart joc"), ca acum; nu îl atingem.

## Detalii tehnice
- Grila e 9x9 de `number | null`, deci o copie e ieftină; 100 de copii nu afectează performanța pe mobil.
- Auto-complete-ul (la finalul puzzle-ului) nu se înregistrează în istoric — e o secvență finală automatizată, nu o mutare a jucătorului.
- Istoricul se golește la joc nou / resume de sesiune (sesiunea salvată nu include istoricul — la continuare istoricul pornește gol).
- Eticheta „Undo" trece prin `t()` pentru localizare; adaug cheia în dicționare doar dacă lipsește (verific `src/i18n/dictionaries.ts` la implementare).
