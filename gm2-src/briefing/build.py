#!/usr/bin/env python3
"""Baut das Grid-Plan-Briefing-Book als eine Offline-HTML-Datei: dist/gm2-gridplan-briefing.html"""
import os, subprocess
D = os.path.dirname(os.path.abspath(__file__)); os.makedirs(os.path.join(D, 'dist'), exist_ok=True)
out = os.path.join(D, 'dist', 'bundle.js')
subprocess.run([os.path.join(D, 'node_modules/.bin/esbuild'), os.path.join(D, 'book.js'), '--bundle', '--minify', '--format=iife', '--loader:.css=text', '--target=safari15', f'--outfile={out}', '--log-level=warning'], cwd=D, check=True)
js = open(out).read().replace('</script', '<\\/script')
html = ('<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Grid Master 2 – Grid Plan Briefing Book</title></head><body><script>' + js + '</script></body></html>')
p = os.path.join(D, 'dist', 'gm2-gridplan-briefing.html'); open(p, 'w').write(html); os.remove(out); print(p, round(len(html) / 1024), 'KB')
