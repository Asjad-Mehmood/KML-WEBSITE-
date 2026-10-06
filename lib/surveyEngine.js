// The traverse and level arithmetic of the Excel to KML app (Traverse adjust), copied
// unchanged from app/index.html in the program's repository so the website's tool and the
// app give the same answers to the last digit. Plain JavaScript on purpose: change it there,
// then copy it here again.
/* ================= traverse and level adjustment: the arithmetic =================
   Pure functions, no page. A traverse is closed (loop or link) or open, adjusted by
   Bowditch, Transit or least squares; a level run is reduced by rise and fall (or
   from height differences) and its misclosure spread along it. */
export const SURV = (function () {
  var D2R = Math.PI / 180, R2D = 180 / Math.PI, S2R = Math.PI / 648000;
  function n360(a) { a = a % 360; if (a < 0) a += 360; if (a >= 360 - 1e-12) a = 0; return a; }
  function n180(a) { a = n360(a); return a > 180 ? a - 360 : a; }

  /* an angle as typed: 123.4530 (DDD.MMSS), 123°45'30", 123 45 30, decimal degrees or gons */
  function parseAngle(raw, fmt) {
    if (raw === null || raw === undefined) return null;
    var s = String(raw).trim();
    if (s === "") return null;
    var neg = false, v;
    if (s.charAt(0) === "-") { neg = true; s = s.slice(1).trim(); }
    if (/[°'"′″\s:dms]/i.test(s)) {
      var parts = s.split(/[^0-9.]+/).filter(Boolean).map(Number);
      if (!parts.length || parts.length > 3 || parts.some(function (x) { return isNaN(x); })) return NaN;
      var m0 = parts[1] || 0, s0 = parts[2] || 0;
      if (m0 >= 60 || s0 >= 60) return NaN;
      v = parts[0] + m0 / 60 + s0 / 3600;
    } else if (!/^\d*\.?\d*$/.test(s) || s === ".") {
      return NaN;
    } else if (fmt === "deg") {
      v = parseFloat(s);
    } else if (fmt === "gon") {
      v = parseFloat(s) * 0.9;
    } else {
      var ip = s.split(".")[0], fp = s.split(".")[1] || "";
      var d = parseInt(ip || "0", 10), f = fp + "0000";
      var mm = parseInt(f.slice(0, 2), 10);
      var ss = parseFloat(f.slice(2, 4) + (fp.length > 4 ? "." + fp.slice(4) : ""));
      if (mm >= 60 || ss >= 60) return NaN;
      v = d + mm / 60 + ss / 3600;
    }
    if (isNaN(v)) return NaN;
    return neg ? -v : v;
  }

  function fmtDMS(deg, dp, padDeg) {
    if (deg === null || deg === undefined || isNaN(deg)) return "";
    if (dp === undefined) dp = 1;
    var sign = deg < 0 ? "-" : "", k = Math.pow(10, dp);
    var t = Math.round(Math.abs(deg) * 3600 * k);
    var d = Math.floor(t / (3600 * k)); t -= d * 3600 * k;
    var m = Math.floor(t / (60 * k)); t -= m * 60 * k;
    var s = (t / k).toFixed(dp);
    if (s.indexOf(".") === 1 || (dp === 0 && s.length === 1)) s = "0" + s;
    var ds = String(d);
    if (padDeg !== false) while (ds.length < 3) ds = "0" + ds;
    return sign + ds + "°" + (m < 10 ? "0" : "") + m + "'" + s + '"';
  }
  function fmtSec(sec, dp) { return (sec >= 0 ? "+" : "") + sec.toFixed(dp === undefined ? 1 : dp) + '"'; }
  function azimuth(E1, N1, E2, N2) { return n360(Math.atan2(E2 - E1, N2 - N1) * R2D); }
  function dist2D(E1, N1, E2, N2) { return Math.sqrt((E2 - E1) * (E2 - E1) + (N2 - N1) * (N2 - N1)); }
  function sum(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }

  /* ---- small dense linear algebra ---- */
  function zeros(n) { var a = []; for (var i = 0; i < n; i++) a.push(new Float64Array(n)); return a; }
  function cholesky(A, n) {
    var L = zeros(n);
    for (var i = 0; i < n; i++) {
      for (var j = 0; j <= i; j++) {
        var s = A[i][j];
        for (var k = 0; k < j; k++) s -= L[i][k] * L[j][k];
        if (i === j) {
          if (s <= 1e-30) throw new Error("The traverse geometry is not fixed. Check the control points and the orientation.");
          L[i][i] = Math.sqrt(s);
        } else L[i][j] = s / L[j][j];
      }
    }
    return L;
  }
  function cholSolve(L, b, n) {
    var y = new Float64Array(n), x = new Float64Array(n), i, k, s;
    for (i = 0; i < n; i++) { s = b[i]; for (k = 0; k < i; k++) s -= L[i][k] * y[k]; y[i] = s / L[i][i]; }
    for (i = n - 1; i >= 0; i--) { s = y[i]; for (k = i + 1; k < n; k++) s -= L[k][i] * x[k]; x[i] = s / L[i][i]; }
    return x;
  }

  /* ---- chi-square quantile, from the regularized gamma function ---- */
  function gammaln(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, tmp = x + 5.5; tmp -= (x + 0.5) * Math.log(tmp);
    var ser = 1.000000000190015;
    for (var j = 0; j < 6; j++) ser += c[j] / ++y;
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  }
  function gammp(a, x) {
    if (x <= 0) return 0;
    if (x < a + 1) {
      var ap = a, sm = 1 / a, del = sm;
      for (var n = 0; n < 500; n++) { ap++; del *= x / ap; sm += del; if (Math.abs(del) < Math.abs(sm) * 1e-15) break; }
      return sm * Math.exp(-x + a * Math.log(x) - gammaln(a));
    }
    var b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
    for (var i = 1; i < 500; i++) {
      var an = -i * (i - a); b += 2;
      d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d; var dl = d * c; h *= dl; if (Math.abs(dl - 1) < 1e-15) break;
    }
    return 1 - Math.exp(-x + a * Math.log(x) - gammaln(a)) * h;
  }
  function chi2inv(p, dof) {
    var lo = 0, hi = Math.max(10, dof * 10 + 100);
    for (var i = 0; i < 200; i++) { var mid = (lo + hi) / 2; if (gammp(dof / 2, mid / 2) < p) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }

  /* ---- one traverse ----
     t: type loop|link|open, method bowditch|transit|lsq, angleDir cw|ccw, scale,
        startPt/endPt {name,E,N,H}, startOri/endOri {mode,az}, rows [{name, angle, dist, dh}],
        tol {angK, ratio, hC}, sigma {ang, dA, dB}, useH */
  function compute(t) {
    var warnings = [], rows = t.rows, n = rows.length, legs = n - 1, i;
    var closed = t.type !== "open";
    if (n < 2) throw new Error("Add at least two stations, so there is one leg to work out.");
    if (!t.startPt) throw new Error("Choose a start station with known coordinates.");
    if (t.type === "link" && !t.endPt) throw new Error("Choose a closing station with known coordinates.");
    if (!(t.scale > 0)) throw new Error("The scale factor must be a number above 0.");
    if (t.startOri.az === null || t.startOri.az === undefined || isNaN(t.startOri.az)) throw new Error("The opening orientation is missing. Set a backsight point or bearing.");

    var useStartAngle = t.startOri.mode !== "firstleg";
    var hasClose = closed && t.endOri.mode !== "none";
    if (hasClose && (t.endOri.az === null || t.endOri.az === undefined || isNaN(t.endOri.az))) throw new Error("The closing orientation is missing. Set a foresight point or bearing, or choose No closing angle.");
    var angleRequired = function (k) { return k === 0 ? useStartAngle : k === n - 1 ? hasClose : true; };
    var label = function (k) { return rows[k].name || "row " + (k + 1); };

    for (i = 0; i < legs; i++) {
      if (!(rows[i].dist > 0)) throw new Error("The distance " + label(i) + " to " + label(i + 1) + " is missing or not above 0.");
    }
    var obsAng = rows.map(function (r, k) {
      if (!angleRequired(k)) return null;
      if (r.angle === null || r.angle === undefined) throw new Error("The angle at " + label(k) + " is missing.");
      if (isNaN(r.angle)) throw new Error("The angle at " + label(k) + " could not be read. Check how it is typed.");
      return t.angleDir === "ccw" ? n360(360 - r.angle) : n360(r.angle);
    });
    var names = rows.map(function (r) { return String(r.name || "").trim(); });
    names.forEach(function (nm, k) { if (!nm) throw new Error("A station name is missing on row " + (k + 1) + "."); });
    var seen = {}; seen[names[0]] = 1; if (closed) seen[names[n - 1]] = 1;
    names.slice(1, closed ? n - 1 : n).forEach(function (nm) {
      if (seen[nm]) throw new Error("The station name " + nm + " is used more than once in this traverse.");
      seen[nm] = 1;
    });
    var nAng = obsAng.filter(function (a) { return a !== null; }).length;

    var bearings = function (A) {
      var az = new Array(legs);
      az[0] = n360(useStartAngle ? t.startOri.az + A[0] : t.startOri.az);
      for (var k = 1; k < legs; k++) az[k] = n360(az[k - 1] + 180 + A[k]);
      return { az: az, close: hasClose ? n360(az[legs - 1] + 180 + A[n - 1]) : null };
    };
    var raw = bearings(obsAng), angMis = null, corr = 0;
    if (hasClose) { angMis = n180(raw.close - t.endOri.az) * 3600; corr = -angMis / nAng; }
    var balAng = obsAng.map(function (a) { return a === null ? null : n360(a + corr / 3600); });
    var bal = bearings(balAng);

    var sd = rows.slice(0, legs).map(function (r) { return r.dist; });
    var d = sd.map(function (x) { return x * t.scale; });
    var sumD = sum(d);
    var dE = bal.az.map(function (az, k) { return d[k] * Math.sin(az * D2R); });
    var dN = bal.az.map(function (az, k) { return d[k] * Math.cos(az * D2R); });
    var S = t.startPt, endPt = t.type === "loop" ? S : t.endPt;

    var fE = null, fN = null, fL = null, precision = null;
    var cE = [], cN = [];
    for (i = 0; i < legs; i++) { cE.push(0); cN.push(0); }
    if (closed) {
      fE = sum(dE) - (endPt.E - S.E);
      fN = sum(dN) - (endPt.N - S.N);
      fL = Math.sqrt(fE * fE + fN * fN);
      precision = fL > 0 ? sumD / fL : Infinity;
      var sAE = 0, sAN = 0;
      for (i = 0; i < legs; i++) { sAE += Math.abs(dE[i]); sAN += Math.abs(dN[i]); }
      for (i = 0; i < legs; i++) {
        if (t.method === "transit" && sAE > 0 && sAN > 0) { cE[i] = -fE * Math.abs(dE[i]) / sAE; cN[i] = -fN * Math.abs(dN[i]) / sAN; }
        else { cE[i] = -fE * d[i] / sumD; cN[i] = -fN * d[i] / sumD; }
      }
    }
    var E = [S.E], N = [S.N];
    for (i = 0; i < legs; i++) { E.push(E[i] + dE[i] + cE[i]); N.push(N[i] + dN[i] + cN[i]); }
    if (closed) { E[n - 1] = endPt.E; N[n - 1] = endPt.N; }

    /* heights from the height difference of each leg */
    var H = null, fH = null, hAllow = null, cH = null, dH = null;
    var noH = function (v) { return v === null || v === undefined || isNaN(v); };
    if (t.useH) {
      var dhs = rows.slice(0, legs).map(function (r) { return r.dh; });
      var miss = -1;
      for (i = 0; i < dhs.length; i++) if (noH(dhs[i])) { miss = i; break; }
      if (noH(S.H)) warnings.push("Heights left out: the start station has no known height.");
      else if (miss >= 0) warnings.push("Heights left out: the height difference " + names[miss] + " to " + names[miss + 1] + " is missing.");
      else if (closed && noH(endPt.H)) warnings.push("Heights left out: the closing station has no known height.");
      else {
        dH = dhs; cH = dhs.map(function () { return 0; });
        if (closed) {
          fH = sum(dhs) - (endPt.H - S.H);
          for (i = 0; i < legs; i++) cH[i] = -fH * d[i] / sumD;
          hAllow = t.tol.hC * Math.sqrt(sumD / 1000) / 1000;
        }
        H = [S.H];
        for (i = 0; i < legs; i++) H.push(H[i] + dhs[i] + cH[i]);
        if (closed) H[n - 1] = endPt.H;
      }
    }

    var angAllow = t.tol.angK * Math.sqrt(nAng);
    var closure = {
      hasClose: hasClose, nAng: nAng, angMis: angMis, angAllow: angAllow,
      angPass: hasClose ? Math.abs(angMis) <= angAllow + 1e-9 : null, angCorr: hasClose ? corr : null,
      fE: fE, fN: fN, fL: fL, sumD: sumD, precision: precision, ratioReq: t.tol.ratio,
      precPass: closed ? precision >= t.tol.ratio : null,
      fH: fH, hAllow: hAllow, hPass: fH !== null ? Math.abs(fH) <= hAllow + 1e-12 : null
    };
    var res = {
      type: t.type, method: t.method, closed: closed, names: names, warnings: warnings, closure: closure,
      rows: rows.map(function (r, k) { return { name: names[k], obs: obsAng[k] }; }),
      balAng: balAng, rawAz: raw.az, balAz: bal.az, sd: sd, d: d, dE: dE, dN: dN, cE: cE, cN: cN, dH: dH, cH: cH,
      E: E, N: N, H: H, lsq: null
    };
    if (t.method === "lsq") {
      if (!closed) warnings.push("Least squares needs a closed traverse, so this open traverse is worked out without an adjustment.");
      else res.lsq = leastSquares(t, res, obsAng, useStartAngle);
    }
    if (!closed) warnings.push("An open traverse has no closure, so a mistake in the observations cannot be found.");

    var Ef = res.lsq ? res.lsq.E : E, Nf = res.lsq ? res.lsq.N : N;
    res.finalE = Ef; res.finalN = Nf;
    res.adjLegs = [];
    for (i = 0; i < legs; i++) {
      res.adjLegs.push({
        from: names[i], to: names[i + 1], az: azimuth(Ef[i], Nf[i], Ef[i + 1], Nf[i + 1]),
        d: dist2D(Ef[i], Nf[i], Ef[i + 1], Nf[i + 1]), dh: H ? H[i + 1] - H[i] : null
      });
    }
    res.adjAng = obsAng.map(function (a, k) {
      if (a === null) return null;
      if (!res.lsq) return balAng[k];
      var bsAz = k === 0 ? t.startOri.az : azimuth(Ef[k], Nf[k], Ef[k - 1], Nf[k - 1]), fsAz;
      if (k === n - 1) fsAz = t.endOri.mode === "firstleg" ? azimuth(Ef[k], Nf[k], Ef[1], Nf[1]) : t.endOri.az;
      else fsAz = azimuth(Ef[k], Nf[k], Ef[k + 1], Nf[k + 1]);
      return n360(fsAz - bsAz);
    });
    res.stations = names.map(function (nm, k) {
      var fixed = k === 0 || (closed && k === n - 1);
      var st = { name: nm, E: Ef[k], N: Nf[k], H: H ? H[k] : null, fixed: fixed };
      if (res.lsq && !fixed && res.lsq.stat[k]) {
        var q = res.lsq.stat[k];
        st.sE = q.sE; st.sN = q.sN; st.ellA = q.ellA; st.ellB = q.ellB; st.ellAz = q.ellAz;
      }
      return st;
    });
    return res;
  }

  /* least squares on the angles and distances: coordinates of the new stations are the unknowns */
  function leastSquares(t, cls, obsAng, useStartAngle) {
    var rows = t.rows, n = rows.length, legs = n - 1, i, j, k;
    var S = t.startPt, Ept = t.type === "loop" ? S : t.endPt;
    var uIdx = rows.map(function (r, q) { return q === 0 || q === n - 1 ? -1 : q - 1; });
    var u = 2 * (n - 2);
    if (u === 0) return null;
    var x = new Float64Array(u);
    for (i = 1; i < n - 1; i++) { x[2 * (i - 1)] = cls.E[i]; x[2 * (i - 1) + 1] = cls.N[i]; }
    var coord = function (q) { return q === 0 ? [S.E, S.N] : q === n - 1 ? [Ept.E, Ept.N] : [x[2 * uIdx[q]], x[2 * uIdx[q] + 1]]; };

    var obs = [];
    for (i = 0; i < legs; i++) {
      var dd = rows[i].dist * t.scale;
      var sg = Math.sqrt(Math.pow(t.sigma.dA / 1000, 2) + Math.pow(t.sigma.dB * 1e-6 * dd, 2));
      obs.push({ type: "dist", from: i, to: i + 1, val: dd, sig: Math.max(sg, 1e-6) });
    }
    var sigA = Math.max(t.sigma.ang, 0.01) * S2R;
    for (i = 0; i < n; i++) {
      if (obsAng[i] === null) continue;
      var bs = i === 0 ? { az: t.startOri.az } : { row: i - 1 }, fs;
      if (i === n - 1) fs = t.endOri.mode === "firstleg" ? { row: 1 } : { az: t.endOri.az };
      else fs = { row: i + 1 };
      obs.push({ type: "ang", at: i, bs: bs, fs: fs, val: obsAng[i] * D2R, sig: sigA });
    }
    if (!useStartAngle) obs.push({ type: "az", from: 0, to: 1, val: t.startOri.az * D2R, sig: 0.001 * S2R, fixed: true });

    var m = obs.length, r = m - u;
    var dirAz = function (a1, b1, row, sign) {
      var p1 = coord(a1), p2 = coord(b1);
      var de = p2[0] - p1[0], dn = p2[1] - p1[1], d2 = de * de + dn * dn;
      if (uIdx[b1] >= 0) { row[2 * uIdx[b1]] += sign * dn / d2; row[2 * uIdx[b1] + 1] += sign * -de / d2; }
      if (uIdx[a1] >= 0) { row[2 * uIdx[a1]] += sign * -dn / d2; row[2 * uIdx[a1] + 1] += sign * de / d2; }
      return Math.atan2(de, dn);
    };
    var wrap = function (v) { v = v % (2 * Math.PI); if (v > Math.PI) v -= 2 * Math.PI; if (v <= -Math.PI) v += 2 * Math.PI; return v; };
    var evalObs = function (o) {
      var a = new Float64Array(u), f;
      if (o.type === "dist") {
        var p1 = coord(o.from), p2 = coord(o.to);
        var de = p2[0] - p1[0], dn = p2[1] - p1[1], dl = Math.sqrt(de * de + dn * dn);
        if (uIdx[o.to] >= 0) { a[2 * uIdx[o.to]] += de / dl; a[2 * uIdx[o.to] + 1] += dn / dl; }
        if (uIdx[o.from] >= 0) { a[2 * uIdx[o.from]] -= de / dl; a[2 * uIdx[o.from] + 1] -= dn / dl; }
        return { a: a, misc: o.val - dl, f: dl };
      }
      if (o.type === "az") { f = dirAz(o.from, o.to, a, 1); return { a: a, misc: wrap(o.val - f), f: f }; }
      var fsAz = o.fs.row !== undefined ? dirAz(o.at, o.fs.row, a, 1) : o.fs.az * D2R;
      var bsAz = o.bs.row !== undefined ? dirAz(o.at, o.bs.row, a, -1) : o.bs.az * D2R;
      f = fsAz - bsAz;
      return { a: a, misc: wrap(o.val - f), f: f };
    };
    var normals = function (evs) {
      var Nm = zeros(u), b = new Float64Array(u);
      evs.forEach(function (ev, q) {
        var p = 1 / (obs[q].sig * obs[q].sig), nz = [];
        for (var c = 0; c < u; c++) if (ev.a[c] !== 0) nz.push(c);
        nz.forEach(function (j1) {
          b[j1] += ev.a[j1] * p * ev.misc;
          nz.forEach(function (k1) { Nm[j1][k1] += ev.a[j1] * p * ev.a[k1]; });
        });
      });
      return { Nm: Nm, b: b };
    };

    var iter = 0, maxDx = Infinity, L;
    while (iter < 25 && maxDx > 1e-7) {
      iter++;
      var ne = normals(obs.map(evalObs));
      L = cholesky(ne.Nm, u);
      var dx = cholSolve(L, ne.b, u);
      maxDx = 0;
      for (k = 0; k < u; k++) { x[k] += dx[k]; maxDx = Math.max(maxDx, Math.abs(dx[k])); }
    }
    if (maxDx > 1e-4) throw new Error("Least squares did not settle. Look for a gross mistake: a wrong angle or distance.");
    var evals = obs.map(evalObs);
    L = cholesky(normals(evals).Nm, u);
    var Q = [];
    for (k = 0; k < u; k++) { var e = new Float64Array(u); e[k] = 1; Q.push(cholSolve(L, e, u)); }
    var vtpv = 0;
    var resid = obs.map(function (o, q) {
      var v = -evals[q].misc, p = 1 / (o.sig * o.sig);
      vtpv += v * v * p;
      var a = evals[q].a, aqa = 0;
      for (j = 0; j < u; j++) if (a[j]) for (k = 0; k < u; k++) if (a[k]) aqa += a[j] * Q[j][k] * a[k];
      var qvv = o.sig * o.sig - aqa, sv = qvv > 1e-20 ? Math.sqrt(qvv) : 0;
      return { v: v, std: sv > 0 && !o.fixed ? v / sv : null };
    });
    var s02 = r > 0 ? vtpv / r : 1, chi = null;
    if (r > 0) {
      var lo = chi2inv(0.025, r), hi = chi2inv(0.975, r);
      chi = { value: vtpv, lo: lo, hi: hi, pass: vtpv >= lo && vtpv <= hi };
    }
    var E = cls.E.slice(), N = cls.N.slice();
    for (i = 1; i < n - 1; i++) { E[i] = x[2 * (i - 1)]; N[i] = x[2 * (i - 1) + 1]; }
    if (t.type === "loop") { E[n - 1] = S.E; N[n - 1] = S.N; }
    var stat = {}, k95 = Math.sqrt(chi2inv(0.95, 2));
    for (i = 1; i < n - 1; i++) {
      j = 2 * (i - 1);
      var vE = s02 * Q[j][j], vN = s02 * Q[j + 1][j + 1], cEN = s02 * Q[j][j + 1];
      var mean = (vE + vN) / 2, rad = Math.sqrt(Math.pow((vN - vE) / 2, 2) + cEN * cEN);
      stat[i] = {
        sE: Math.sqrt(vE), sN: Math.sqrt(vN),
        ellA: Math.sqrt(Math.max(mean + rad, 0)) * k95, ellB: Math.sqrt(Math.max(mean - rad, 0)) * k95,
        ellAz: n360(0.5 * Math.atan2(2 * cEN, vN - vE) * R2D) % 180
      };
    }
    var nm = function (q) { return rows[q].name; };
    var obsOut = obs.map(function (o, q) {
      var o2 = { type: o.type, std: resid[q].std, flag: resid[q].std !== null && Math.abs(resid[q].std) > 3 };
      if (o.type === "dist") {
        o2.label = "Distance"; o2.at = nm(o.from); o2.to = nm(o.to); o2.obs = o.val; o2.adj = evals[q].f;
        o2.v = resid[q].v; o2.sigma = o.sig; o2.unit = "m";
      } else if (o.type === "az") {
        o2.label = "Fixed bearing"; o2.at = nm(o.from); o2.to = nm(o.to); o2.obs = o.val * R2D; o2.adj = n360(evals[q].f * R2D);
        o2.v = resid[q].v / S2R; o2.sigma = o.sig / S2R; o2.unit = "sec";
      } else {
        o2.label = "Angle"; o2.at = nm(o.at);
        o2.to = (o.bs.row !== undefined ? nm(o.bs.row) : "BS") + " to " + (o.fs.row !== undefined ? nm(o.fs.row) : "FS");
        o2.obs = o.val * R2D; o2.adj = n360(evals[q].f * R2D); o2.v = resid[q].v / S2R; o2.sigma = o.sig / S2R; o2.unit = "sec";
      }
      return o2;
    });
    return { E: E, N: N, iter: iter, m: m, u: u, r: r, vtpv: vtpv, s02: s02, s0: Math.sqrt(s02), chi: chi, stat: stat, obs: obsOut, k95: k95 };
  }

  /* ---- one level run ----
     L: mode "staff" (rows {pt, bs, is, fs, dist}) or "dh" (rows {pt, dh, dist}),
        startRL, closeRL (null: no closing benchmark), C (mm per root km), spread "dist"|"setups".
     The first row is the starting benchmark; in staff mode it carries the first backsight.
     A row with both a foresight and a backsight is a change point. */
  function levels(L) {
    var rows = L.rows, n = rows.length, i, warnings = [];
    var bad = function (v) { return v === null || v === undefined || isNaN(v); };
    if (n < 2) throw new Error("Add at least two rows: the benchmark you start on and one more staff position.");
    if (bad(L.startRL)) throw new Error("The starting benchmark needs a known level.");
    rows.forEach(function (r, k) { if (!String(r.pt || "").trim()) throw new Error("A point name is missing on row " + (k + 1) + "."); });
    var out = [{ pt: rows[0].pt, rise: null, fall: null, raw: L.startRL }];
    var sBS = 0, sFS = 0, sRise = 0, sFall = 0, setups = 0, setupAt = [0], cum = [0], dist = 0, hasDist = true;
    if (L.mode === "dh") {
      for (i = 1; i < n; i++) {
        var dh = rows[i].dh;
        if (bad(dh)) throw new Error("The height difference to " + rows[i].pt + " is missing or could not be read.");
        out.push({ pt: rows[i].pt, rise: dh > 0 ? dh : null, fall: dh < 0 ? -dh : null, raw: out[i - 1].raw + dh });
        if (dh > 0) sRise += dh; else sFall -= dh;
        setups++; setupAt.push(setups);
      }
    } else {
      if (bad(rows[0].bs)) throw new Error("The first row needs a backsight on the benchmark.");
      var last = rows[0].bs; sBS += rows[0].bs; setups = 1;
      for (i = 1; i < n; i++) {
        var r = rows[i], hasIS = !bad(r.is), hasFS = !bad(r.fs), hasBS = !bad(r.bs);
        if (hasIS && hasFS) throw new Error("Row " + (i + 1) + " (" + r.pt + ") has both an intermediate sight and a foresight. Keep one.");
        if (!hasIS && !hasFS) throw new Error("Row " + (i + 1) + " (" + r.pt + ") needs an intermediate sight or a foresight.");
        if (hasBS && !hasFS) throw new Error("Row " + (i + 1) + " (" + r.pt + ") has a backsight but no foresight. A change point needs both.");
        var cur = hasIS ? r.is : r.fs, rf = last - cur;
        out.push({ pt: r.pt, rise: rf > 0 ? rf : null, fall: rf < 0 ? -rf : null, raw: out[i - 1].raw + rf });
        if (rf > 0) sRise += rf; else sFall -= rf;
        if (hasFS) sFS += r.fs;
        setupAt.push(setups);
        if (hasBS) { sBS += r.bs; last = r.bs; setups++; } else last = cur;
        if (i === n - 1 && !hasFS) throw new Error("The last row must be a foresight, on the closing benchmark or the last point.");
        if (i === n - 1 && hasBS) warnings.push("The last row also has a backsight; it is not used.");
      }
    }
    for (i = 1; i < n; i++) {
      var dv = rows[i].dist;
      if (bad(dv) || dv < 0) { hasDist = false; dv = 0; }
      dist += dv; cum.push(dist);
    }
    if (!(dist > 0)) hasDist = false;
    var lastRaw = out[n - 1].raw, closed = !bad(L.closeRL);
    var mis = closed ? lastRaw - L.closeRL : null;
    var spread = L.spread === "setups" || !hasDist ? "setups" : "dist";
    if (closed && L.spread !== "setups" && !hasDist) warnings.push("Not every row has a distance, so the misclosure is spread by set-ups instead.");
    var km = hasDist ? dist / 1000 : null;
    /* without distances the allowable falls back on the set-up count: C x root(n) */
    var allow = closed ? (km !== null ? L.C * Math.sqrt(km) : L.C * Math.sqrt(Math.max(setups, 1))) / 1000 : null;
    var totalW = spread === "dist" ? dist : setupAt[n - 1];
    out.forEach(function (o, k) {
      var w = spread === "dist" ? cum[k] : setupAt[k];
      o.corr = closed && totalW > 0 ? -mis * w / totalW : 0;
      o.rl = o.raw + o.corr;
      o.cum = hasDist ? cum[k] : null;
    });
    if (closed) out[n - 1].rl = L.closeRL;
    if (!closed) warnings.push("No closing benchmark, so the run has no check and a misread staff cannot be found.");
    return {
      rows: out, mode: L.mode, closed: closed, mis: mis, allow: allow,
      pass: closed ? Math.abs(mis) <= allow + 1e-12 : null,
      dist: hasDist ? dist : null, km: km, setups: setups, spread: spread, C: L.C,
      sBS: sBS, sFS: sFS, sRise: sRise, sFall: sFall,
      arith: L.mode === "staff" ? Math.abs((sBS - sFS) - (sRise - sFall)) < 1e-9 && Math.abs((sRise - sFall) - (lastRaw - L.startRL)) < 1e-9 : null,
      warnings: warnings
    };
  }

  return {
    parseAngle: parseAngle, fmtDMS: fmtDMS, fmtSec: fmtSec, azimuth: azimuth, dist2D: dist2D,
    n360: n360, n180: n180, compute: compute, levels: levels, chi2inv: chi2inv
  };
})();
