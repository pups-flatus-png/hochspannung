"""Asset budget check for a Grid Master build (see DEVELOPING.md, "Budgets").

Usage: python3 tools/budget.py <build dir>
Fails (exit 1) when the page or any relief image grows past its budget.
"""
import glob, gzip, os, sys

OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
KB = 1024
BUDGETS = {
    'page_raw': 3300 * KB,      # index.html as served before compression
    'page_gzip': 1200 * KB,     # index.html as transferred (gzip -9)
    'relief_each': 300 * KB,    # one map's relief WebP, fetched only when that map is shown
    'relief_total': 2200 * KB,  # all reliefs, precached by the service worker after first load
}

fails = []
page = os.path.join(OUT, 'index.html')
raw = open(page, 'rb').read()
gz = len(gzip.compress(raw, 9))
rels = sorted(glob.glob(os.path.join(OUT, 'relief', '*.webp')))
sizes = {os.path.basename(f): os.path.getsize(f) for f in rels}

def check(name, value):
    ok = value <= BUDGETS[name]
    print(f"{name:13s} {value / KB:8.0f} KB / {BUDGETS[name] / KB:6.0f} KB  {'ok' if ok else 'OVER'}")
    if not ok:
        fails.append(name)

check('page_raw', len(raw))
check('page_gzip', gz)
check('relief_total', sum(sizes.values()))
big = max(sizes.items(), key=lambda kv: kv[1]) if sizes else ('-', 0)
check('relief_each', big[1])
if b'data:image/webp;base64' in raw:
    print('reliefs embedded in the page instead of shipped as files  OVER')
    fails.append('relief_embedded')
print(f"largest relief: {big[0]}; {len(sizes)} relief files")
if fails:
    print('budget FAILED: ' + ', '.join(fails))
    sys.exit(1)
print('budget ok')
