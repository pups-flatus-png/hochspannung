#!/usr/bin/env bash
# Grid Master quality gate: build → syntax → rule tests → header check → layout audit → asset budget → phase test.
# Usage: tools/check.sh            (exit code 0 = ready to release)
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$(mktemp -d)"; PORT=${PORT:-8790}
python3 "$REPO/tools/build.py" "$OUT" >/dev/null
cp "$REPO"/icon-*.png "$OUT"/
node -e "const fs=require('fs');const h=fs.readFileSync('$REPO/src/hochspannung.html','utf8');const re=/<script>([\s\S]*?)<\/script>/g;let m,n=0;while(m=re.exec(h)){new Function(m[1]);n++}console.log('syntax ok ('+n+' scripts)')"
cd "$REPO/tests"
python3 -c "import srvthread,time; srvthread.start('$OUT',$PORT); time.sleep(3600)" & SRV=$!
trap 'kill $SRV 2>/dev/null; rm -rf "$OUT"' EXIT
sleep 1; export GM_BASE="http://localhost:$PORT"
echo "== rule tests";   python3 rules.py | tail -1
echo "== header check"; python3 hdrcheck.py | tail -1 | grep -q "fails 0" && echo "header ok" || { python3 hdrcheck.py | tail -8; exit 1; }
echo "== layout audit"; A=$(python3 fullaudit.py | grep -v "offR:actbar" || true); if [ -n "$A" ]; then echo "$A"; exit 1; else echo "layout ok"; fi
echo "== budget";       python3 "$REPO/tools/budget.py" "$OUT" | tail -1 | grep -q "budget ok" && echo "budget ok" || { python3 "$REPO/tools/budget.py" "$OUT"; exit 1; }
echo "== phase test";   python3 gate.py 2>&1 | grep -v GET
echo "ALL CHECKS PASSED"
