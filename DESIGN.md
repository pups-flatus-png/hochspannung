---
name: Grid Master
description: Power Grid as a premium digital board game – a night control room where the map is the control surface.
colors:
  console-night: "#0b1014"
  panel-slate: "#121a20"
  panel-raised: "#19232b"
  hairline: "#26333d"
  edge-steel: "#3a4b58"
  map-grid: "#141e25"
  instrument-white: "#e3eaee"
  muted-gauge: "#8495a1"
  dispatch-gold: "#f2b33d"
  gold-ink: "#1d1405"
  gold-light: "#ffd77a"
  signal-green: "#58b86a"
  fault-red: "#e0483d"
  caution-amber: "#e8a33a"
  res-coal: "#9a6a44"
  res-oil: "#2c4664"
  res-garbage: "#c9ab22"
  res-uranium: "#d93b30"
  res-eco: "#58b86a"
  seat-you: "#4f9dff"
  seat-pink: "#ff5fa2"
  seat-violet: "#b48cff"
  seat-teal: "#4fd6c4"
  seat-orange: "#ff9f43"
  seat-lime: "#c6e05a"
  co-ecostar: "#3fd0c0"
  co-kohle-stahl: "#d9824a"
  co-atomix: "#a98bff"
  co-petronord: "#ff5a4e"
  co-netzbau: "#7bd66b"
  co-recycla: "#b9c23a"
  paper-bg: "#efe6d2"
  paper-panel: "#fbf6ea"
  paper-raised: "#f3ead6"
  paper-line: "#dccdae"
  paper-ink: "#2a2116"
  paper-muted: "#6c5e48"
  paper-gold-text: "#8f520a"
typography:
  display:
    fontFamily: "Orbitron, Barlow Condensed, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 800
    letterSpacing: "0.1em"
  numeral:
    fontFamily: "Orbitron, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1
  numeral-hero:
    fontFamily: "Orbitron, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.02em"
  body:
    fontFamily: "Barlow, system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.4
  title:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.15
  label:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.14em"
  button:
    fontFamily: "Orbitron, system-ui, sans-serif"
    fontSize: "11.5px"
    fontWeight: 800
    letterSpacing: "0.05em"
rounded:
  chip: "8px"
  seat: "9px"
  card: "12px"
  tray: "12px"
  button: "13px"
  panel: "16px"
  pill: "999px"
spacing:
  sp-1: "4px"
  sp-2: "8px"
  sp-3: "12px"
  sp-4: "16px"
  sp-5: "24px"
  hit: "44px"
  bar: "56px"
components:
  button-primary:
    backgroundColor: "{colors.dispatch-gold}"
    textColor: "{colors.gold-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "9px 12px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.instrument-white}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "9px 12px"
    height: "44px"
  top-bar:
    backgroundColor: "{colors.panel-slate}"
    textColor: "{colors.instrument-white}"
    height: "56px"
  tray:
    backgroundColor: "{colors.panel-slate}"
    textColor: "{colors.instrument-white}"
    rounded: "{rounded.tray}"
    padding: "14px"
    width: "384px"
  ledger-strip:
    backgroundColor: "{colors.panel-slate}"
    textColor: "{colors.instrument-white}"
    padding: "10px 16px"
  ledger-well:
    backgroundColor: "{colors.console-night}"
    textColor: "{colors.instrument-white}"
    rounded: "{rounded.card}"
    padding: "6px 12px"
  seat-chip:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.instrument-white}"
    rounded: "{rounded.seat}"
    padding: "4px 8px 6px"
  phase-tab-active:
    textColor: "{colors.instrument-white}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: "0 12px 0 8px"
---

# Design System: Grid Master

## Overview

**Creative North Star: "The Night Control Room"**

Grid Master is played at a dispatcher's console after dark. The network map is the control surface: it fills the screen, and everything else docks to it like instruments around a wall chart. Panels are matte slate with 1 px hairline edges, not glass. Numbers read like gauges, in Orbitron; labels and prose are quiet Barlow. One colour, dispatch gold, belongs to the player's next move. Everything else stays cool, so the eye always finds the thing you can act on.

Density is high but ordered. Each turn follows the same path: see whose turn it is and what is asked, pin up to two options, read the consequences side by side in the ledger strip, then commit with one gold action at the strip's right end. The map never gives up its place to a scrolling column of cards. Company identity (Founders' Era) shows up as ownership only: city rings, line signatures and a tinted plate, never as a second accent.

Motion is direct and short. It acknowledges a press at once, replays what the engine already decided, and always ends in the same state as a skip.

**Key Characteristics:**
- Full-bleed map under a 56 px bar; tray docked on the trailing edge; ledger strip along the bottom.
- Gold means "you, act now" and nothing else.
- Orbitron numerals and titles, Barlow text; uppercase spaced labels for instrument captions.
- Hairline borders and tonal layering; shadows only to lift floating panels off the map.
- Dark by default, with a warm "paper" light theme that keeps every rule.
- Text always stays inside its box, at every device size.

## Colors

A cool slate console with a single warm signal colour; resources and seats carry their own fixed hues so they can be told apart at a glance.

### Primary
- **Dispatch Gold** (#f2b33d): the commit action, active phase tab, pins (A/B tags), leader lines, the gold pulse on the first legal move, your cash. On primary buttons it is a vertical gradient (#ffd06a → #f2b33d → #d99520) with **Gold Ink** (#1d1405) text. **Gold Light** (#ffd77a) is the wallet numeral.

### Neutral
- **Console Night** (#0b1014): app background and the ledger's inner wells.
- **Panel Slate** (#121a20): top bar, tray, ledger strip, sheets.
- **Panel Raised** (#19232b): cards, seat chips, rows inside panels.
- **Hairline** (#26333d): all 1 px dividers and panel borders.
- **Edge Steel** (#3a4b58): control outlines, scrollbars, stronger borders.
- **Map Grid** (#141e25): map land fill and grid texture.
- **Instrument White** (#e3eaee): primary text.
- **Muted Gauge** (#8495a1): labels, captions, secondary values.

### Status
- **Signal Green** (#58b86a): gains, "best" in comparisons, positive deltas.
- **Fault Red** (#e0483d): losses, warnings, "drop out".
- **Caution Amber** (#e8a33a): soft warnings that are not errors.

### Resources (fixed, never reassigned)
- **Coal** (#9a6a44), **Oil** (#2c4664), **Garbage** (#c9ab22), **Uranium** (#d93b30), **Eco** (#58b86a). Each has a lighter rim tone for tokens on dark ground.

### Seats and companies
- Classic seats: **You** (#4f9dff), then #ff5fa2, #b48cff, #4fd6c4, #ff9f43, #c6e05a.
- Founders' Era: the company colour becomes the seat colour. EcoStar (#3fd0c0), Kohle & Stahl (#d9824a), Atomix (#a98bff), Petronord (#ff5a4e), Netzbau (#7bd66b), Recycla (#b9c23a). Each company also has a line signature (solid, double, dotted, long dash, short dash, dash-dot), so ownership never depends on colour alone.

### Light theme ("paper")
Same roles, warm paper values: background #efe6d2, panel #fbf6ea, raised #f3ead6, line #dccdae, ink #2a2116, muted #6c5e48, gold text #8f520a (darker so gold copy stays readable on paper). The map keeps its own plan paper (Night or Blueprint) chosen in the menu.

### Named Rules
**The One Signal Rule.** Gold appears only on what the player can act on now: the commit button, pins and their leader lines, the active phase, the first-move pulse, and your money. Never use it for decoration or rival information. The one sanctioned exception is the white-to-gold gradient fill on large titles, which stays a tint and never a solid gold.

**The Ownership-Only Rule.** Company and seat colours mark who owns what (city rings, lines, seat chips, the company plate tint). They never colour a button or a call to action.

**The Two-Channel Rule.** Anything coloured also carries a second cue: a line signature, an emblem shape, a label, or a ▲/▼ glyph.

## Typography

**Display / numerals:** Orbitron (fallback Barlow Condensed, system-ui)
**Body / labels:** Barlow (fallback system-ui, -apple-system)
**Map labels and city costs:** Saira Condensed (inherited map lettering)

**Character:** Orbitron gives the console its instrument read-outs: wide, technical and easy to scan at small sizes. Barlow keeps everything else calm and legible.

### Hierarchy
- **Display** (Orbitron 800, 14 px, 0.1em, uppercase): tray phase titles ("BUILD"), section titles, sheet titles. On dark, large titles use a white-to-gold vertical gradient fill.
- **Numeral hero** (Orbitron 800, 24 px): the wallet, highest bid, payout.
- **Numeral** (Orbitron 700, 13–18 px, tabular figures): ledger values, prices, capacity, seat power.
- **Title** (Barlow 600, 13–14 px): row names, plate names, ledger row headers.
- **Body** (Barlow 400, 14 px, 1.4): explanations, coach tips, log lines. Keep to about 65 characters per line in sheets.
- **Label** (Barlow 600, 10 px, 0.14em, uppercase, Muted Gauge): instrument captions ("CASH", "PAYOUT THIS ROUND"). On phones, ledger column heads switch to 10 px sentence case without tracking.
- **Button** (Orbitron 800, 11.5 px, 0.05em, uppercase).

### Named Rules
**The Gauge Rule.** Every number a player compares is Orbitron with tabular figures; words are never Orbitron except titles and buttons.

**The No-Shrink Rule.** When space runs out, drop secondary parts (status line, logo, note) before shrinking type. Body never goes below 11 px and interface captions never below 10 px (enforced since v291). Print on plant cards, map lettering and the price ticks on the resource tracks are exempt: they behave like printed artwork and scale with the card or map.

## Layout

The map is always the largest surface. Three device classes share one structure; a class on `#app` selects it (`desk`, `desk port`, `phone`).

- **Desk (Mac and iPad landscape, ≥1000×640):** one 56 px bar (round, step + phase tabs left; turn order centre; cash, undo, menu right). The map is full bleed. The tray (384 px; 352 px under 1360 px) floats over the map's trailing edge with a 14 px inset, and the map fit leaves room for it. Docked sheets (Markets, Opponents) float on the leading edge as its mirror. The ledger strip runs along the bottom: company plate (Founders) · payout and next prices · ledger · commit action. Between 1000 and 1179 px wide the strip takes two rows (ledger full width, the action on its own row), and the bar drops the money label, order caption and seat power.
- **Desk portrait (iPad portrait, ≥744×1000):** the same bar; map above a docked tray (rows 1fr / 0.92fr); strip with prices beside the ledger and the action on its own row.
- **Phone (landscape ≤500 px tall, portrait ≤600 px wide):** the compact phone header stays; the strip (ledger reading across plus the commit action) is pinned under the tray: in landscape in the right column beside the map, in portrait as its own row under the sheet. The draggable map/sheet split and the minimised map keep working. The strip hides when there is nothing to compare or commit.
- **Spacing:** a 4 px base (4, 8, 12, 16, 24). Panels use 14 px padding, 10–12 px gaps between strip blocks. Touch targets are at least 44 px; strip buttons are 44 px tall (40 px on phones).

**The Map-First Rule.** No layout may reduce the map to a column. Panels dock to it or float over its edges; the map fit always centres the network in the part that stays visible.

**The Thumb-Zone Rule.** The commit action sits at the right end of the strip (bottom right) on every device, so the hand finds it in the same place every turn.

## Elevation & Depth

Depth is mostly tonal: Console Night → Panel Slate → Panel Raised, separated by hairlines. Shadows appear only where a panel floats over the map.

### Shadow Vocabulary
- **Floating panel** (`0 14px 34px -8px rgba(0,0,0,.55), 0 2px 6px rgba(0,0,0,.3)`): the desk tray and the floating docked sheet.
- **Strip lift** (`0 -10px 22px -14px rgba(0,0,0,.6)`): the phone strip and portrait tray over content.
- **Gold pulse** (`0 0 0 3px rgba(242,179,61,.9), 0 0 18px rgba(242,179,61,.45)`, animated once): first legal move after the start hand-off.
- **Company flash** (3 px ring in the company colour, 360 ms, once): a seat receiving its emblem.

**The Matte Rule.** No glass, no blur on in-game panels (the statistics header is the one exception). Glows are reserved for gold "act now" moments and single company flashes, never ambient decoration.

## Shapes

Gently rounded, instrument-like rectangles: chips 8 px, seats 9 px, cards and tray 12 px, buttons 13 px, large panels 16 px, pills fully round. All borders are 1 px. Company emblems keep distinct silhouettes (hexagon, shield, circle, star, diamond, octagon), so a company is recognisable without its colour.

## Components

### Buttons
Confident and tactile, never playful.
- **Shape:** gently rounded (13 px), 44 px tall.
- **Primary:** gold gradient, Gold Ink text, Orbitron 800 uppercase 11.5 px. It names the action and its cost ("BUILD · 21 €", "BID 24 €", "DELIVER POWER · +10 €"). It takes the remaining width of its row.
- **Secondary:** Panel Raised with a hairline border, the same type ("BUY NOTHING", "DONE", "PASS THIS ROUND"); at most 40% of the row.
- **Danger:** red-tinted outline ("DROP OUT").
- **Press:** sinks 1 px; the state is final at the press, and any motion afterwards only replays it.

### Top bar (desk)
- 56 px, Panel Slate, hairline bottom border.
- Phase tabs show Step plus the active phase with its label; finished and upcoming phases collapse to numbered circles.
- Turn-order seats sit centre. Under 1240 px they drop the seat number and logo; with four or more seats they also drop the status line and power.
- The cash is the only gold numeral in the bar.

### Tray
- Floating Panel Slate card (12 px radius, floating panel shadow) on desk; docked with a top border in portrait and on phones.
- Holds the phase's choices (market, cities, resources, power plants), latest moves and your company. It scrolls internally; the commit action never lives here on strip devices.

### Ledger strip
The signature component: consequences before the commit.
- **Ledger well:** Console Night inset (12 px radius). With a selection it reads across: one row per option (A gold tag, B outlined tag), one column per consequence (you pay, cash left, scraps, capacity, fuel to buy, after cheapest city). The best value in a pair is marked; negative values turn red. Without a selection it shows where you stand (cash, cities, capacity, fuel held).
- **Round facts (desk):** payout this round and next resource prices.
- **Action slot:** the phase's commit control with its title above it; bid steppers and auto-bid live here too.
- **Company plate (Founders):** emblem in the company colour on a tinted plate (13% → 4% of the colour over Panel Raised), company · strategy, "n effects this phase", and an "All effects" pill that opens the full mat in the tray.

### Seat chips
Panel Raised, 9 px radius, hairline border; the seat or company colour shows as an underline power bar and an emblem. The active seat gets a gold outline; finished seats dim.

### Phase tabs
The active tab is a gold-tinted pill (18% → 5% gold gradient) with an Orbitron number circle and a Barlow 700 uppercase label; the Step badge sits first.

### Motion (applies to every component)
- **Profile:** Corporate, no overshoot. Durations: 140 ms (feedback), 300–420 ms (panels and moves), 900 ms (camera). Curves: `cubic-bezier(.2,0,0,1)` for moves and entrances, `cubic-bezier(.4,0,.2,1)` for the map camera.
- **Replays:** clash moments and the start hand-off replay engine results, take 2.4 s or less, end in the same state as a skip, and skip on a tap without acting on it.
- **Camera:** on desk it moves at most 15% of the visible map; on phones it pans only when the contested city is off-screen. It always returns to the saved view.
- **Many changes:** three or more clashes collapse into one "n changes since your turn" chip over the map; a tap plays them condensed. On phones the strip shows a change card in place of the ledger's B row.
- **Reduced motion:** short fades and static rings only; no camera, no line drawing.

## Do's and Don'ts

### Do:
- **Do** keep the map full bleed and dock everything else to it (The Map-First Rule).
- **Do** put the commit action at the strip's right end, naming the action and its cost.
- **Do** show every comparison side by side in the ledger before the commit.
- **Do** use Orbitron with tabular figures for any number a player compares.
- **Do** pair every colour cue with a shape, line signature, label or glyph.
- **Do** test at 1440×900, 1280×720, 1024×768, 1194×834, 834×1194, 844×390 and 390×844, in German and English, Classic and Founders, dark and light.
- **Do** drop secondary text before shrinking type when space runs out.

### Don't:
- **Don't** use gold for anything the player cannot act on now (The One Signal Rule).
- **Don't** let a company or seat colour style a button or call to action.
- **Don't** go back to the map-left, scrolling-cards-right layout.
- **Don't** add glass, blur or ambient glows to in-game panels.
- **Don't** let any text leave its box or truncate a number; truncate names with an ellipsis instead.
- **Don't** change the phase without the player pressing "Continue", and don't play sound during the boot sequence.
- **Don't** reveal AI personalities in the interface.
