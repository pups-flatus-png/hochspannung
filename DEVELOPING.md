# Developing Grid Master

- **Source:** `src/hochspannung.html` (one file: HTML, CSS, JS). The rules engine sits between `/*ENGINE*/`-style sections; game data (maps, plants) at the top.
- **Build the app:** `python3 tools/build.py` → writes `index.html`, `sw.js`, `manifest.webmanifest` into the repo root (GitHub Pages serves them). Bump `APPV` in the source and the cache name in `tools/build.py` for every release.
- **Quality gate:** `tools/check.sh` – builds into a temp folder and runs:
  1. syntax check of all scripts,
  2. `tests/rules.py` – rule unit tests (resource prices, auction, build costs, payout) and 24 complete computer games on 12 maps with invariants (no negative money, no duplicate cities, market in range, game ends in 5–25 rounds),
  3. `tests/hdrcheck.py` – header never overlaps/clips (phone portrait + landscape, iPad, Mac, DE/EN, undo, bidding with 4/6 players),
  4. `tests/fullaudit.py` – 11 game states × 10 screen sizes × 2 languages: nothing clipped, no horizontal scroll, nothing outside the screen,
  5. `tests/gate.py` – phase transitions with “Continue” over two rounds.
  Release only when it prints `ALL CHECKS PASSED`.
- **Grid Master 2:** separate game in `gm2-src/` (see `gm2-src/HANDOVER.md`).
