---
version: 1
slug: "src-hochspannung-html"
primary_target: "src/hochspannung.html"
related_targets: []
---

# Command Centre (in-game surface)

Scope: the main gameplay screen of Grid Master, all five phases, Classic and Founders' Era. Visitor mode: Operate.
Audience and job: solo players who know Power Grid, playing against AI on iPhone, iPad or Mac; each turn they compare options, preview the consequence, commit.
Constraints: vanilla HTML/CSS/JS, one file; dark default; gold is the only accent and means "you, act now"; Orbitron for numbers and titles, Barlow for text; text never leaves its box; phase changes only via Continue.
Unresolved: company choice vs deal; pin gesture discoverability (playtest).

## Direction contract

THESIS: The map is the control surface. Every decision is pinned on or beside the network and its consequence is read in one ledger strip. Refuses the category default of map left plus a scrolling side panel of cards.

OWN-WORLD: Night control-room console on #0b1014; hairline 1 px edges (#26333d); matte panels, no glass; gold only on the commit action, pins and leader lines; company colour only as ownership (city rings, line signatures, mat tint). Orbitron instrument numerals, Barlow labels.

STORY: The player sees whose turn it is and what is asked, pins up to two options, reads cash, capacity, scrapped plant, fuel and build headroom side by side, commits with one gold action.

FIRST VIEWPORT: Full-bleed map under a 56 px top bar (phase + Step left, turn-order line centre, cash right). Decision tray docked on the map's trailing edge. Ledger strip along the bottom, primary action at its right end in the thumb zone; iPhone portrait stacks map, tray, ledger, action.

FORM: Concept A (Dispatch Desk) from the Stage 1 review; seed: none (pinned) — user: "go ahead with your recommendation and Stage 2".

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
