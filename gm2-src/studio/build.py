#!/usr/bin/env python3
"""Baut die vier Studio-Pitch-Decks als eigenständige HTML-Dateien: dist/gm2-concept-*.html"""
import os, json
D = os.path.dirname(os.path.abspath(__file__)); os.makedirs(os.path.join(D, 'dist'), exist_ok=True)
CONCEPTS = {
  'a-gridplan': ('Grid Plan', 'family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+Condensed:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600'),
  'b-nightgrid': ('Night Grid', 'family=Orbitron:wght@600;700;800&family=Barlow:wght@400;500;600;700'),
  'c-swiss': ('Swiss Signal', 'family=Archivo:wght@500;700;800;900&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700'),
  'd-paper': ('Paper Craft', 'family=Fraunces:opsz,wght@9..144,500;9..144,700;9..144,800&family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@500'),
}
mapdata = open(os.path.join(D, 'map.json')).read(); engine = open(os.path.join(D, 'engine.js')).read(); deck = open(os.path.join(D, 'deck.js')).read(); deckcss = open(os.path.join(D, 'deck.css')).read()
for key, (name, fonts) in CONCEPTS.items():
    tf = os.path.join(D, f'theme-{key}.js')
    if not os.path.exists(tf): continue
    theme = open(tf).read()
    h = f'''<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Grid Master 2 – {name}</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?{fonts}&display=swap" rel="stylesheet"><style>{deckcss}</style></head>
<body><div id="deck"></div><script>window.MAPDATA={mapdata};</script><script>{engine}\n{deck}\n{theme}\nbuildDeck(THEME);</script></body></html>'''
    out = os.path.join(D, 'dist', f'gm2-concept-{key}.html'); open(out, 'w').write(h); print(out, round(len(h) / 1024), 'KB')
