# Asset provenance

Every raster image that ships with Grid Master, where it comes from, and its licence. Update this file whenever a raster is added, replaced or removed.

Audited 2026-11-22 (v291) against `src/hochspannung.html`, the build output and the repo root.

## Shipping rasters

| Asset | Where | Format / size | Source | Licence | Introduced |
|---|---|---|---|---|---|
| Relief images `georel-de`, `-fr`, `-it`, `-na`, `-eu`, `-bx`, `-ce`, `-cn`, `-kr`, `-br`, `-es`, `-ru`, `-jp`, `-ne`, `-uk`, `-qc`, `-bw`, `-au`, `-ind` (19, one per map) | Source: embedded in `src/hochspannung.html` as `<script type="text/plain">` WebP data. Build: extracted to `relief/<map>.webp`, fetched only when that map is shown, precached by the service worker | WebP, 1.7 MB in total as files (29–193 KB each) | NASA Blue Marble topography, rendered per map and clipped to Natural Earth 1:10m coastlines | Public domain (NASA imagery; Natural Earth) | v176 (17d26cf); repackaged as lazy data in v210 (c228080) |
| App icons `icon-180.png`, `icon-192.png`, `icon-512.png` | Repo root, referenced by `manifest.webmanifest` and the page head | PNG, 9 / 9 / 29 KB | Original geometric drawing made for this project (grid, network nodes in seat colours, gold bolt) | Grid Master project | d6fee11 (2026-11-05). Each PNG carries this in its `Source` text chunk |
| Fonts Saira Condensed, Barlow, Orbitron, IBM Plex Mono (WOFF2, not raster; listed for licence) | Embedded in the built page by `tools/build.py` from `gm2-src/fonts` | WOFF2 | Google Fonts families; file names follow the Fontsource packaging | SIL Open Font License 1.1; licence texts with each family's copyright line in `gm2-src/fonts/OFL-*.txt` (fetched from google/fonts and IBM/plex) | — |

## Not rasters (no provenance entry needed)

- Plant illustrations, company emblems, strategy marks, the map, cities, lines and all icons inside the game are drawn as SVG or CSS in the source.
- Three SVG data URIs (hatch and texture patterns) are vector code written for the project.
- Fonts: the source links Google Fonts for development; the build strips those links and embeds the WOFF2 files instead (see table). Barlow Condensed appears in CSS only as a fallback name.

## Data sources (for completeness)

- Cities, regions and connection costs of the France, Italy, North America and Europe boards, the Deluxe resource markets and resupply tables, and the plant values of decks Set 1 and Set 2: [boardgamers/powergrid](https://github.com/boardgamers/powergrid), MIT licence.
- Coastlines: [Natural Earth](https://www.naturalearthdata.com/) via the npm package world-atlas, public domain.

## Removed

- Company "night plate" photo backgrounds (`MPLATE`), introduced in v252, removed in v264. None ship today.

## Test artefacts (not shipped)

`tests/*.png` are screenshots produced by the quality gate and are never deployed.
