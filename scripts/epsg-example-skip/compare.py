# Compare the proj4 check points with PROJ (pyproj) and list the systems to skip.
import json, math, sys
import pyproj

rows = json.load(open(sys.argv[1]))
skip = []
for r in rows:
    if r.get("err"):
        skip.append(r["code"]); continue
    try:
        t = pyproj.Transformer.from_crs(4326, r["code"], always_xy=True)
    except Exception:
        skip.append(r["code"]); continue
    worst = 0
    for la, lo, x, y in r["p"]:
        if x is None: continue
        X, Y = t.transform(lo, la)
        if all(map(math.isfinite, [X, Y])): worst = max(worst, math.hypot(X - x, Y - y))
    if worst > 25: skip.append(r["code"])
json.dump(sorted(skip), open(sys.argv[2], "w"))
print(len(rows) - len(skip), "systems with check points,", len(skip), "skipped")
