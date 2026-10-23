// Qatar National Grid (QND95): the projection and the shift to WGS84 of Excel to KML's built-in
// Qatar National Grid (kml-convertor-src, app/index.html: ELL.intl24, invTM, shift3, config() "qnd"),
// checked there against 56 approved marks (worst 0.09 m), with the point scale factor and height
// factor added. Copied from Traverse Pro, where it is checked against PROJ. Keep the copies in step.
/* QNG START */
export const QNG = (function () {
  var D2R = Math.PI / 180, R2D = 180 / Math.PI;
  var P = { a: 6378388.0, invf: 297.0, k0: 0.99999, lat0: 24.45, lon0: 51.2166666666667, FE: 200000, FN: 300000 };
  var SHIFT = { dx: -128.033, dy: -283.697, dz: 21.052 }, BASE = { lat: 0.44, lon: -0.20 };
  var f = 1 / P.invf, e2 = 2 * f - f * f, ep2 = e2 / (1 - e2);
  function meridArc(phi, a, e2) {
    return a * ((1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256) * phi
      - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 * e2 * e2 / 1024) * Math.sin(2 * phi)
      + (15 * e2 * e2 / 256 + 45 * e2 * e2 * e2 / 1024) * Math.sin(4 * phi)
      - (35 * e2 * e2 * e2 / 3072) * Math.sin(6 * phi));
  }
  /* inverse transverse Mercator -> geographic on the SAME ellipsoid, radians */
  function invTM(E, N, p) {
    var a = p.a, f = 1 / p.invf, e2 = 2 * f - f * f, ep2 = e2 / (1 - e2);
    var lat0 = p.lat0 * D2R, lon0 = p.lon0 * D2R;
    var Mv = meridArc(lat0, a, e2) + (N - p.FN) / p.k0;
    var mu = Mv / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256));
    var e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
    var fp = mu + (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32) * Math.sin(2 * mu)
      + (21 * e1 * e1 / 16 - 55 * Math.pow(e1, 4) / 32) * Math.sin(4 * mu)
      + (151 * Math.pow(e1, 3) / 96) * Math.sin(6 * mu)
      + (1097 * Math.pow(e1, 4) / 512) * Math.sin(8 * mu);
    var C = ep2 * Math.cos(fp) * Math.cos(fp), T = Math.tan(fp) * Math.tan(fp);
    var s = Math.sin(fp), n1 = a / Math.sqrt(1 - e2 * s * s), r1 = a * (1 - e2) / Math.pow(1 - e2 * s * s, 1.5);
    var D = (E - p.FE) / (n1 * p.k0), D2 = D * D, D3 = D2 * D, D4 = D3 * D, D5 = D4 * D, D6 = D5 * D;
    var lat = fp - (n1 * Math.tan(fp) / r1) * (D2 / 2 - (5 + 3 * T + 10 * C - 4 * C * C - 9 * ep2) * D4 / 24
      + (61 + 90 * T + 298 * C + 45 * T * T - 252 * ep2 - 3 * C * C) * D6 / 720);
    var lon = lon0 + (D - (1 + 2 * T + C) * D3 / 6
      + (5 - 2 * C + 28 * T - 3 * C * C + 8 * ep2 + 24 * T * T) * D5 / 120) / Math.cos(fp);
    return [lat, lon];
  }
  /* three-parameter geocentric shift, source ellipsoid -> WGS84, radians in/out */
  function shift3(lat, lon, h, a, invf, dx, dy, dz) {
    var f = 1 / invf, e2 = 2 * f - f * f;
    var sl = Math.sin(lat), cl = Math.cos(lat);
    var v = a / Math.sqrt(1 - e2 * sl * sl);
    var x = (v + h) * cl * Math.cos(lon) + dx, y = (v + h) * cl * Math.sin(lon) + dy, z = (v * (1 - e2) + h) * sl + dz;
    var aw = 6378137.0, fw = 1 / 298.257223563, e2w = 2 * fw - fw * fw;
    var pr = Math.sqrt(x * x + y * y), la = Math.atan2(z, pr * (1 - e2w)), la2;
    for (var i = 0; i < 10; i++) {
      var s2 = Math.sin(la), vw = aw / Math.sqrt(1 - e2w * s2 * s2);
      la2 = Math.atan2(z + e2w * vw * s2, pr);
      if (Math.abs(la2 - la) < 1e-13) { la = la2; break; }
      la = la2;
    }
    return [la, Math.atan2(y, x)];
  }
  /* grid -> WGS84 degrees, as Excel to KML's gridToLatLon does for the Qatar National Grid */
  function toWGS84(E, N, h) {
    var g = invTM(E, N, P), s = shift3(g[0], g[1], h || 0, P.a, P.invf, SHIFT.dx, SHIFT.dy, SHIFT.dz);
    var latD = s[0] * R2D, lonD = s[1] * R2D;
    latD += BASE.lat / 111320;
    lonD += BASE.lon / (111320 * Math.cos(s[0]));
    return [latD, lonD];
  }
  /* the point scale factor of the projection (Snyder 8-11), from the latitude and longitude on the grid's own ellipsoid */
  function pointScale(E, N) {
    var g = invTM(E, N, P), phi = g[0], A = (g[1] - P.lon0 * D2R) * Math.cos(phi);
    var T = Math.tan(phi) * Math.tan(phi), C = ep2 * Math.cos(phi) * Math.cos(phi), A2 = A * A;
    return P.k0 * (1 + (1 + C) * A2 / 2 + (5 - 4 * T + 42 * C + 13 * C * C - 28 * ep2) * A2 * A2 / 24 + (61 - 148 * T + 16 * T * T) * A2 * A2 * A2 / 720);
  }
  /* distances at height h above the ellipsoid shrink by R / (R + h) on the ellipsoid */
  function heightFactor(N, h) {
    var phi = invTM(P.FE, N, P)[0], s = Math.sin(phi);
    var nu = P.a / Math.sqrt(1 - e2 * s * s), rho = P.a * (1 - e2) / Math.pow(1 - e2 * s * s, 1.5), R = Math.sqrt(rho * nu);
    return R / (R + (h || 0));
  }
  /* Qatar and its waters, generously, as latitude and longitude */
  function inQatar(E, N) { var w = toWGS84(E, N, 0); return w[0] > 24.3 && w[0] < 26.4 && w[1] > 50.5 && w[1] < 52.2; }
  return { P: P, toWGS84: toWGS84, pointScale: pointScale, heightFactor: heightFactor, inQatar: inQatar };
})();
/* QNG END */
