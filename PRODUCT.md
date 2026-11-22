# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Players who already know Power Grid and play alone against computer opponents, on iPhone, iPad or Mac, often in short sessions. iPhone landscape is a first-class device.

## Product Purpose
Grid Master (repo name: Hochspannung) is a digital adaptation of the board game Power Grid / Funkenschlag. Success means a full game is quick to start, every decision shows its cost and consequence before you commit, and it feels like a premium physical game.

## Positioning
- Faithful Power Grid: Recharged rules, presented with premium craft and no clutter or ads.
- Founders' Era: our own asymmetric expansion with six companies (EcoStar, Kohle & Stahl, Atomix, Petronord, Netzbau, Recycla) and strategies.
- Strong computer opponents: four difficulty levels (easy, normal, hard, expert).
- Plays everywhere, offline: one installable web app (PWA) with local saves on phone, tablet and desktop.

## Operating Context
Single-player sessions against AI, sometimes paused and resumed. Phase changes only happen when the player presses "Continue". German and English UI.

## Capabilities and Constraints
- Vanilla HTML, CSS and JavaScript in one file (`src/hochspannung.html`), with zero dependencies and no build step beyond `tools/build.py`. The engine is an FSM with validators and 114 rule tests.
- Maps: Germany plus additional maps; several plant decks; 2–6 players.
- Undecided: company choice vs dealt companies in Founders' Era; a Home screen and era choice before setup (proposed in the Stage 1 review).

## Brand Commitments
- Name: Grid Master.
- Dark mode is the default; gold is the only accent and means "you, act now".
- Orbitron for numbers and titles, Barlow for body text.
- No sound during the boot sequence; AI personalities stay hidden.
- Text always stays inside its box.

## Evidence on Hand
- Live game and repo: pups-flatus-png/hochspannung.
- Grid Master Aesthetics Bible (Claude Doc), Stage 1 review doc and wireframes.
- Project references: mood images, GIFs and videos, design review PDF, 160 design studies PDF, navigation diagram.
- No testimonials, ratings or player numbers exist; never invent them.

## Product Principles
1. Show the consequence before the commit.
2. The network map stays the main surface.
3. Rules first: the engine decides, the UI never contradicts it.
4. One codebase, three first-class devices.

## Accessibility & Inclusion
Best effort, no formal standard: respect reduced motion, never carry meaning by colour alone, keep focus visible.
