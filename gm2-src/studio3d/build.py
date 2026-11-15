#!/usr/bin/env python3
"""Baut die vier 3D-Pitch-Decks als je eine Offline-HTML-Datei: dist/gm2-3d-concept-<key>.html
Braucht three + esbuild (node_modules aus ../proto3d)."""
import os, subprocess, sys
D = os.path.dirname(os.path.abspath(__file__))
THEMES = ['a-gridplan', 'b-nightgrid', 'c-swiss', 'd-paper']
want = sys.argv[1:] or THEMES
os.makedirs(os.path.join(D, 'dist'), exist_ok=True)
for k in want:
    if not os.path.exists(os.path.join(D, f'theme-{k}.js')): continue
    entry = os.path.join(D, f'_entry-{k}.js')
    open(entry, 'w').write(f"import T from './theme-{k}.js';\nimport {{ boot }} from './deck3d.js';\nboot(T);\n")
    out = os.path.join(D, 'dist', f'bundle-{k}.js')
    subprocess.run([os.path.join(D, 'node_modules/.bin/esbuild'), entry, '--bundle', '--minify', '--format=iife', '--loader:.css=text',
                    '--target=safari15', f'--outfile={out}', '--log-level=warning'], cwd=D, check=True)
    js = open(out).read().replace('</script', '<\\/script')
    html = ('<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
            '<meta name="theme-color" content="#000"><title>Grid Master 2</title></head><body><script>' + js + '</script></body></html>')
    p = os.path.join(D, 'dist', f'gm2-3d-concept-{k}.html'); open(p, 'w').write(html); os.remove(out); os.remove(entry)
    print(p, round(len(html) / 1024), 'KB')
