# Grid Master 2 – Übergabe

Grid Master 2 ist eine eigenständige Kopie von Grid Master (Stand v209, 14.11.2026), damit es stark umgebaut werden kann, ohne Grid Master zu verändern.

## Wo was liegt
- **Quelltext (einzige Quelle):** `gm2-src/gridmaster2.html` – eine Datei mit HTML, CSS und JS.
- **Build:** `python3 gm2-src/build.py` → schreibt die iPhone-App nach `gm2/` (index.html, sw.js, manifest, Icons). Schriften liegen in `gm2-src/fonts/`, Icons in `gm2-src/icons/`.
- **iPhone-App (GitHub Pages):** https://pups-flatus-png.github.io/hochspannung/gm2/ (Safari → Teilen → „Zum Home-Bildschirm“).
- **claude.ai-Seite mit eigener Rangliste:** https://claude.ai/artifact/BCSKBvfMdX6vLbpEGTw77k (Fähigkeiten: db + user; Rangliste in Sammlung `results`). Veröffentlichen mit dem Artifact-Werkzeug aus `gm2-src/gridmaster2.html`, URL beibehalten.
- **Grid Master (Original):** Quelle `src/hochspannung.html`, Build im Repo-Stamm (`index.html`, `sw.js`); Artifact https://claude.ai/artifact/8zW5oTwCiGBjg4bKxMM14g.

## Trennung von Grid Master
- Alle localStorage-Schlüssel beginnen mit `gm2-` (Grid Master: `hochspannung-`/`gm-`), gleiche Domain → strikt getrennte Spielstände, Statistik, Einstellungen.
- Service-Worker-Cache `gridmaster2-vN`; der Grid-Master-Worker ignoriert Anfragen unter `/gm2/`.
- `BOARD_URL` zeigt auf das Grid-Master-2-Artifact.

## Release-Ablauf
1. `APPV` in `gridmaster2.html` erhöhen und `const CACHE='gridmaster2-vN'` in `build.py` mitziehen.
2. `python3 gm2-src/build.py`
3. Tests (siehe unten), dann commit + push (GitHub Pages aktualisiert sich selbst), dann Artifact neu veröffentlichen.

## Tests (`gm2-src/tests/`)
Lokaler Server: `python3 -c "import srvthread,time; srvthread.start('<repo>/gm2'); time.sleep(3000)"` (Port 8778). Playwright + Chromium sind vorinstalliert.
- `hdrcheck.py` – Kopfzeile: keine Überlappung, nichts abgeschnitten, keine leeren Chips (iPhone hoch/quer, iPad, Mac, DE/EN, Rückgängig, Gebote 4/6 Spieler).
- `gate.py` – Phasenwechsel mit „Weiter“ über zwei Runden.
- `land.py` – Querformat-Screenshots aller Phasen.
- `bootall.py` / `bootstress.py` – Startpunkt bleibt auf der ersten Stadt (alle Karten, Layout-Verschiebung).
- Spielstände: `midgame.json`, `endgame.json`, `history.json`.

## Design-Regeln (vom Nutzer bestätigt)
- Bekannte Designsprache: dunkel, Gold als einziger Akzent, Orbitron für Zahlen/Titel, Barlow für Text; Karte „Night grid“ (Spielerfarben als Hauptfarben, Gold = handeln).
- Layout-Disziplin: Text bleibt in seiner Box oder wird weggelassen; immer auch iPhone quer prüfen; Safari-Eigenheiten beachten (keine CSS-Transforms auf SVG-Kindern, keine Container-Queries für Chips).
- KI-Persönlichkeiten im Spiel nicht anzeigen; Phasenwechsel nur per „Weiter“; kein Ton in der Startsequenz.
- Design-Vorschläge im „Studio“-Format präsentieren (wie die Grid-Plan-Studie, claude.ai/artifact/HpXxEzDKDh7tkjU3yMzSmA): eine Seite mit Live-Brett aus echten Kartendaten, Tafeln für alle Zustände (Städte, Leitungen, …) und jede Animation mit „Replay“; Hell/Dunkel-Umschalter, Standard folgt dem Gerätemodus.

## Nächstes großes Ziel (Auftrag des Nutzers)
Layout, Tiefe und Komplexität komplett neu denken: eine aufwendige 3D-Version auf dem Detail- und Animationsniveau von Terraforming Mars digital – ein Spiel, für das man 10–20 € zahlen würde. Ideen aus der Recherche (Scythe, Risk, TM): Proxy-Gebote, kluge Warnungen, Bau-Animation (Leitung zeichnet sich, Haus fällt ein), Endwertung als Enthüllung, Leistbarkeit in der Auktion zeigen, Farbenblind-Unterstützung (Logos in Slots), Undo auch beim Rohstoffkauf.
