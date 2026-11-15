#!/usr/bin/env python3
"""Build the 3D prototype into one offline HTML file: proto3d/dist/gm2-3d.html
Needs: npm install (three, esbuild) in this folder."""
import base64, os, subprocess
D = os.path.dirname(os.path.abspath(__file__))
F = os.path.join(D, '..', 'fonts')
subprocess.run([os.path.join(D, 'node_modules/.bin/esbuild'), 'main.js', '--bundle', '--minify', '--format=iife',
                '--target=safari15', '--outfile=dist/bundle.js', '--log-level=warning'], cwd=D, check=True)
js = open(os.path.join(D, 'dist/bundle.js')).read().replace('</script', '<\\/script')
def ff(fam, w, f):
    b = base64.b64encode(open(os.path.join(F, f), 'rb').read()).decode()
    return f"@font-face{{font-family:{fam};font-weight:{w};font-display:block;src:url(data:font/woff2;base64,{b}) format('woff2')}}"
fonts = ''.join([ff('Orbitron', 800, 'orbitron-latin-800-normal.woff2'), ff('Barlow', 500, 'barlow-latin-500-normal.woff2'),
                 ff('Barlow', 600, 'barlow-latin-600-normal.woff2'), ff('Barlow', 700, 'barlow-latin-700-normal.woff2')])
h = open(os.path.join(D, 'proto.html')).read().replace('/*FONTS*/', fonts).replace('/*JS*/', js)
open(os.path.join(D, 'dist/gm2-3d.html'), 'w').write(h)
print('dist/gm2-3d.html', round(len(h) / 1024), 'KB')
