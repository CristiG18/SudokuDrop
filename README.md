# SudokuDrop

Target Platform: Mobile Web App (React, Vite, Tailwind CSS, Lucide Icons) optimized for Capacitor APK build.

Backend/Database: Supabase (Authentication, Leaderboards, User Diamonds, Purchased Skins, Helpers Inventory, Tournament states).

Create a high-fidelity mobile puzzle game called "Sudoku Drop - Jewel Style" based on the following comprehensive specifications. The app must look premium, modern, minimalist pastel style, with soft shadows and rounded corners, optimized perfectly for a vertical smartphone screen.

### 1. CORE GAMEPLAY ENGINE (DROPDUKO & SUDOKU LOGIC)

- Grid: 9x9 Sudoku board. Standard cells are 64x64px, scaled down to 0.8 (approx. 51.2px) to fit mobile screens perfectly.

- Pieces: Domino-style (2 attached cells, each with a number from 1-9). Visuals: Rounded panels (Corner radius: 15-20px) with a 4px inner gap (gutter) between numbers and grid boundaries to create a "jewel/panel" look.

- Sudoku Lines: High-contrast 6px thickness lines separating the nine 3x3 sub-grids.

- Block/Drop Logic: Pieces fall from the top center (Spawn at Y=-1, Grace Period). If a placement triggers a line/row/box clear, pieces above fall down smoothly one-by-one with a "bounce" Tween animation.

- Bag System for Randomization:

  * Easy Mode: 2 sets of 1-9 numbers (18 total).

  * Normal Mode: 3 sets (27 total).

  * Hard Mode: 4 sets (36 total).

- Controls: Split-screen touch layout: Left 30% and Right 30% areas for lateral movement, Center 40% area for piece rotation.

- Wall-Kick: Smart rotation near boundaries (columns 0 and 8) pushes the piece 1 column inward to allow rotation instead of blocking it.

- Joker Pieces: Randomly spawn a single-cell "Joker" piece once every 12 pieces that can match any required number to complete a Sudoku rule.

### 2. COMPREHENSIVE GAME MODES

Implement a multi-tab or main menu navigation to switch between modes:

1. Dropdoku (Endless Survival): Score-based endless falling puzzle. Standard clear yields 100 points per row, column, or 3x3 square. Score multiplier increases by +50% for every 10 successful clears (e.g., 1.0x -> 1.5x -> 2.0x).

2. Classic Sudoku: A static digital Sudoku game with levels generated via templates.

3. Daily Challenges (Smart Randomization Engine):

   - Goal: A new, unique challenge every day.

   - Weekly Difficulty Balance: Every calendar week must contain exactly 3 Easy, 2 Medium, and 2 Hard challenges.

   - Randomization: The order of these difficulties must be shuffled randomly at the start of each week using a deterministic seed based on the current Year + Week Number so all global players get the same difficulty on the same day.

   - Objectives: Randomly pull from a pool of conditions based on difficulty (Easy: clear 1 row/box; Medium: clear 2 columns under 3 minutes; Hard: clear specific target patterns with limited pieces).

4. Monthly Events (100-Level Progressive Campaign):

   - Structure: A seasonal map limited to exactly 100 levels.

   - Difficulty Scaling: Linear progression from ultra-easy (Level 1) to extremely complex/hard (Level 100). 

     * Levels 1-25 (Easy): Simple goals like clearing 1 row, 1 column, or 1 specific 3x3 box.

     * Levels 26-60 (Medium): Combined goals (e.g., 2 columns + 1 row) and slightly faster dropping speed.

     * Levels 61-90 (Hard): Complex structural shapes (e.g., clearing the center 3x3 box and the entire 4th row) or survival with pre-placed fixed block obstacles.

     * Levels 91-100 (Grandmaster/Boss Levels): High-tier challenges requiring perfect helper management under strict move limits or time limits.

   - Monthly Reset & Reskin: On the 1st of every month, the event completely resets to Level 1. The visual aspect changes automatically based on the month (e.g., January: Ice/Sapphire Theme; February: Amethyst/Rose Theme; October: Amber/Halloween Theme), and the 100 level objectives are algorithmically regenerated so it feels like a brand-new season.

5. Tournaments (8 Ball Pool Style Matchmaking UI):

   - Mode A: Time Attack - Who scores the most points within a strict 2-minute or 3-minute countdown.

   - Mode B: Survival Duel - Players play simultaneously on separate identical seeds; whoever survives longest with the highest score wins.

### 3. MONETIZABLE POWER-UPS (HELPERS) & ANTI-CHEAT/ANTI-STALLING TIMER

Provide 3 monetizable helper buttons on the gameplay screen. Activating any helper immediately PAUSES the main game board and triggers an anti-stalling countdown overlay:

- Helper Types:

  1. Hammer: Smash and remove 1 single number/cell from the board.

  2. Swap: Swap the position of 2 existing adjacent digits on the board.

  3. Boom (Cross/Line explosion): Clears an entire row, column, or a "+" cross-shape area centered on the selected cell.

- Anti-Stalling / Anti-Peeking Timer Logic:

  * 1st time pressing a helper button in a session: User has exactly 10 seconds to execute the action on the board.

  * 2nd consecutive time pressing it (without executing the previous time, i.e., trying to peek at the board to gain thinking time): User has only 6 seconds.

  * 3rd time onwards: User has only 3 seconds.

  * Once a helper is successfully USED and executed, the timer sequence resets back to 10s -> 6s -> 3s.

### 4. TOURNAMENT PRIZE ECONOMY & LEADERBOARD REWARDS

Implement a backend check via Supabase and a beautiful UI pop-up to distribute rewards at the conclusion of each tournament tier based on the leaderboard standings:

- **1st Place (Champion):** 500 Diamonds + 1 Exclusive Monthly Visual Skin (only obtainable during this current month's tournament) + 3x of EACH helper tool (3 Hammers, 3 Swaps, 3 Booms).

- **2nd Place:** 400 Diamonds + 2x of EACH helper tool (2 Hammers, 2 Swaps, 2 Booms).

- **3rd Place:** 300 Diamonds + 1x of EACH helper tool (1 Hammer, 1 Swap, 1 Boom).

- **4th to 10th Place:** 100 Diamonds + 1 Single Helper Tool of the player's choice. (Provide a clean choice modal UI pop-up where the player can tap to claim either 1 Hammer, 1 Swap, or 1 Boom).

### 5. ECONOMY, MAGASIN (SHOP) & MONETIZATION

- Game Over Layout: Transparent dark overlay. Options:

  * Watch Video to Revive (1st death only). Revive action clears the top 3 rows of the grid.

  * Use Diamonds to Revive (Subsequent deaths cost 50 Diamonds).

- Shop View: A dedicated UI store screen where players can:

  * Buy Diamond packs (Mock In-App Purchases).

  * Buy Visual Customizations: Unlock custom background themes (Pastel Pink, Cyber Slate, Warm Terracotta) and custom Piece Skins (Glass Jewel, Retro Neon, Wooden Minimalist).

- Global Leaderboards: Render a beautiful "All-Time Best" and "Weekly Global" ranking list pulling data from Supabase profiles.

### 6. UI/UX & TECHNICAL ARCHITECTURE

- Main Menu: Airy, elegant, clean interface with a prominent "Play" button.

- Bottom Sheet (Difficulty Selector): Smooth slide-up panel with rounded top corners showing Easy, Normal, Hard mode selectors.

- Technical State Management: Use a global context or state manager to persist diamonds, high scores, unlocked skins, helper inventory counters, and active skin selections across screens. Ensure all heavy animations use asynchronous delays so the rendering never freezes on mobile.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://sudokudrop.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2538813d-8407-4e2d-9b74-fe79e54a2fbb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
