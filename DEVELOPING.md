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

## Engine and state machine (since v275)

- **Rules engine** sits in one section (`ENGINE · v275 Phase 1`). Rule functions only read and write `S`. They never touch the DOM, `UI` or timers. Screen effects (payout coins, refill, build flash, toasts) go out through `emit()` and are applied by `drainEvents()` at the start of `render()`.
- **One Dijkstra:** `netPaths(p,target)` feeds both build costs (`distFrom`) and the drawn grid lines (`linkPath`).
- **Validators decide, the screen asks:** `canOpen`, `canRaise`, `canDrop`, `canPass` (no passing in round 1), `canBuy` (stock, money, storage), `canBuildIn`. `doOpen`/`bidRaise`/`bidDrop`/`doPass`/`discardPlant` refuse illegal moves themselves. Human moves go through `cmdBuy` and `cmdPower`.
- **State machine:** `S.fsm` is one of `PHASE_1_ORDER`, `PHASE_2_SELECT_PLANT`, `PHASE_2_BIDDING`, `PHASE_3_BUY_RESOURCES`, `PHASE_4_BUILD_CITIES`, `PHASE_5_BUREAUCRACY`, `ANIMATING`, `GAME_OVER`. Only `fsmGo()` changes it, against the table `FSM_NEXT`. `fsmDerive()` rebuilds it for older saves. `turnSeq()` gives the order: forward in phases 2 and 5, reverse in 3 and 4.
- **Input guard:** `inputOK()` drops game moves that do not match the current state, and repeats of the same move within 350 ms. A scheduled computer move is re-checked when its timer fires.
- **Strict mode:** `window.__strict=true` (set by `tests/rules.py`) makes illegal transitions and refused moves throw, so every simulated game also tests the state machine.
- **Log entries** carry data in `m` (`{k:'plant'|'buy'|'build'|'pass',…}`). Readers use it and fall back to the German text only for old saves.

## Debug board

`index.html?debug=midgame` opens round 8, step 2, Germany, 4 players with 8/6/8/6 cities, a full plant market, a filled resource market and fuel in every store. It saves under `hochspannung-debug`, so your real game is never touched.

## Feedback and sound (since v277)

- **Build tooltip** `buildTip(city)`: shown on mouse hover and for the selected city on touch, during your own build turn. It reads `buildOptions`/`netPaths` only.
- **Last opponent move** `lastOpp()`: marks that player's chip with a dot and rings the cities they just built in.
- **Sound** (`SND`, `sClink`, `sThud`, `sChime`): synthesised with Web Audio, no files. Clinks for bids, spending and payouts; a thud when a house lands; a soft chime when the game waits in ANIMATING. Never plays on the start screen or in tests (`window.__fast`). Menu → Sound on/off (`hochspannung-sound`).

## Computer players (since v279)

- Level flags in `AI_LV`: `econ` (normal) adds `econAdj` (cities per fuel unit, fuel diversity, market scarcity) and a hard bid cap `econCap` (keep one round of fuel and the next city). `stockCheap` (normal) buys 1–3 € fuel with spare cash, more readily when later buyers need the same resource. `s2guard` (normal and up) won't trigger Step 2 with a city it can't power. `endgame` (normal and up) only ends the game when it can win. `top2` picks the second-best plant or city now and then when it is almost as good. `contW` (hard, expert) values contested cities.
- Strength check: `aisim.py`-style runs with all four levels at one table, 120 games: easy ~8 %, normal ~15 %, hard ~33 %, expert ~45 % wins (before: normal 5 %, below easy).
