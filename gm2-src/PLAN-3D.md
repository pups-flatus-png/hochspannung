# Grid Master 2 – 3D plan

Goal: a 3D Power Grid / Funkenschlag that feels like a €10–20 app at the detail and animation level of Terraforming Mars digital. It has to work fully offline in the iPhone home-screen app and run smoothly on iPhone (portrait and landscape), iPad and Mac Safari.

## 1. Art direction: "Night grid diorama"
The board is a physical miniature at night, lit by moonlight and the players' own power. It keeps the current design language, now in 3D.

- **The board:** Germany (later all maps) as a thick slab of dark slate set in a brushed-gold tray. Dark water around it with faint moonlight glints. The top shows soft region tints, contour lines, a little relief (Alps, uplands) and glowing rivers.
- **Colour rules:** the dark base stays. Player colours are the only bright light sources: houses, cables and pulses. Gold is reserved for "you can act here": reachable cities, the build button and the planned route. UI fonts are still Orbitron (numbers, titles) and Barlow (text).
- **Pieces:** hexagonal steel city plinths with three slot pads (10/15/20), little houses in player colours with windows that light up, and power pylons with sagging cables carrying moving energy pulses.
- **Light and depth:** soft moonlight shadows, bloom only on emissive parts, ACES tone mapping and a procedural reflection environment (works offline, no image files).
- **Motion:** every action has weight. Cables draw themselves pylon by pylon, houses drop and land with a shockwave, power delivery runs as a wave of light through each network, and money visibly flows to the counter. Each animation can be skipped by tapping and respects "Reduce motion".

## 2. Technology
- **Three.js (r187), WebGL2.** It is the lightest mature engine, has good iOS Safari support and is bundled with esbuild into the single HTML file. That adds about 0.7 MB, so the existing single-file and offline service-worker pipeline stays intact. Babylon.js (much larger) and Unity/WebGPU (heavy, or not yet dependable on iOS) were ruled out.
- **No external assets.** Geometry is procedural. Textures (region tints, contour lines, normal map, slot pads) are drawn at runtime on canvas, and the environment map comes from `RoomEnvironment`. Fonts stay embedded.
- **HUD stays HTML/CSS on top of the canvas.** That gives crisp text, the existing layout tests (`hdrcheck.py`) keep working and the layout discipline stays enforceable. City names and costs are DOM labels with collision culling: a label that doesn't fit is hidden, never overlapped.
- **Separate game logic from rendering.** The engine (rules, AI, saves) stays as it is. A `Board3D` renderer subscribes to state changes and plays animations from an event queue (build, power, buy). The existing 2D SVG map stays as a fallback when there is no WebGL, for weak devices and for the tests.
- **Performance tiers:** High (MSAA, bloom, 2048 shadows, DPR ≤ 2) and Low (no MSAA, half-resolution bloom, no shadows, DPR 1.5). The app drops to Low automatically below about 40 fps and renders only while something moves, to save battery.
- **Controls:** one finger pans, two fingers zoom and rotate, tap selects (with screen-space snapping to the nearest city for big fingers). The tilt is limited, and "View" resets to an auto-fit framing for each orientation.

## 3. Priorities
1. **P0 – Board prototype (this step):** Germany board, cities, cables, build animation, power wave, camera, HUD, tested on all four viewports.
2. **P1 – Integrate into the game:** `Board3D` behind a setting. The build phase runs on the 3D board with real state (route, costs, slots, undo), and all maps go through the same projection.
3. **P2 – Phase animations:** auction (3D plant cards that flip and slide, with a bid ticker and an affordability check), resource market (a 3D track with coal, oil, garbage and uranium pieces, buying flies them to your plants, undo), bureaucracy (power wave, income flowing to the counter, resupply refilling the track).
4. **P3 – HUD redesign:** separate layouts for portrait and landscape, a player rail with logos (colour-blind support), smart warnings, proxy bids.
5. **P4 – Polish and "premium":** final scoring as a reveal, camera moves for important moments, haptics, an optional sound design (never in the start sequence), a performance pass (instancing, render on demand) and device tests.

## 4. Risks
- **iPhone heat and battery:** handled with render on demand, quality tiers and a 30 fps cap when idle.
- **PWA memory:** Safari kills tabs over about 1.5 GB, so textures stay at 2048 or below and are shared.
- **File size:** currently 4.6 MB, plus about 0.7 MB for Three.js. That is acceptable, since it is cached offline once.
- **Text in 3D:** solved with the DOM label layer and collision culling.
