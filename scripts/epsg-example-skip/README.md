# Check points on /convert/epsg/<code>

`lib/epsgExample.ts` shows five check points per grid, worked out with proj4 (the converter's
engine). They are shown only where PROJ, the reference implementation, gives the same easting
and northing within 25 units. To rebuild `lib/data/epsg-example-skip.json` after
`public/data/epsg-projected.json` changes:

```
node scripts/epsg-example-skip/points.mjs /tmp/points.json
pip install pyproj
python3 scripts/epsg-example-skip/compare.py /tmp/points.json lib/data/epsg-example-skip.json
```
