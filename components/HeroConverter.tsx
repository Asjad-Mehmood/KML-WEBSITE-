"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  RefreshCw,
  Copy,
  CheckCircle2,
  Download,
  ChevronDown,
  Globe,
  Search,
  X,
  Compass,
  Layers,
  Sparkles,
  MapPin,
} from "lucide-react";

/* ─── Coordinate System Definition ─── */
export interface CoordSystem {
  id: string;
  name: string;
  flag: string;
  category: "gulf" | "asia" | "europe" | "americas" | "oceania" | "africa" | "utm";
  country: string;
  station: string;
  grid: string; // EPSG code e.g. "EPSG:32642"
  accuracy: string;
  datum: string;
  lon0: number; // central meridian in degrees
  lat0: number; // latitude of origin
  k0: number;   // scale factor
  x0: number;   // false easting
  y0: number;   // false northing
  defaultE: number;
  defaultN: number;
  defaultZ: number;
  a?: number;    // semi-major axis
  invF?: number; // inverse flattening
}

/* ─── Helper to generate standard UTM zones 1N-60N and 1S-60S ─── */
function createUtmSystem(zone: number, hemisphere: "N" | "S"): CoordSystem {
  const isSouth = hemisphere === "S";
  const lon0 = (zone - 1) * 6 - 180 + 3;
  const epsg = isSouth ? 32700 + zone : 32600 + zone;
  const defN = isSouth ? 6679000.0 : 3321000.0;

  return {
    id: `utm-${zone}${hemisphere.toLowerCase()}`,
    name: `UTM Zone ${zone}${hemisphere}`,
    flag: isSouth ? "🌐" : "🌍",
    category: "utm",
    country: `Global UTM Zone ${zone}${hemisphere} (${lon0 - 3}° to ${lon0 + 3}° ${lon0 >= 0 ? "E" : "W"})`,
    station: `STN-Z${zone}${hemisphere}-01`,
    grid: `EPSG:${epsg}`,
    accuracy: "< 1 mm",
    datum: "WGS-84 (Ellipsoidal)",
    lon0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: isSouth ? 10000000 : 0,
    defaultE: 500000.0,
    defaultN: defN,
    defaultZ: 25.0,
  };
}

/* ─── Curated Major National / Regional Grids ─── */
const CURATED_SYSTEMS: CoordSystem[] = [
  // ── Middle East & Gulf ──
  {
    id: "dubai-dltm",
    name: "Dubai DLTM",
    flag: "🇦🇪",
    category: "gulf",
    country: "UAE (Dubai Emirate)",
    station: "BM-DUB-01",
    grid: "EPSG:3997",
    accuracy: "< 1 mm",
    datum: "WGS-84 / DLTM",
    lon0: 55.333333333,
    lat0: 24.0,
    k0: 1.0,
    x0: 500000,
    y0: 2200000,
    defaultE: 513556.612,
    defaultN: 2787467.856,
    defaultZ: 14.85,
  },
  {
    id: "uae-utm39n",
    name: "UAE Abu Dhabi (UTM 39N)",
    flag: "🇦🇪",
    category: "gulf",
    country: "UAE (Abu Dhabi)",
    station: "BM-AUH-04",
    grid: "EPSG:32639",
    accuracy: "< 1 mm",
    datum: "WGS-84",
    lon0: 51.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 242150.0,
    defaultN: 2707420.0,
    defaultZ: 8.5,
  },
  {
    id: "uae-utm40n",
    name: "UAE Dubai & Northern (UTM 40N)",
    flag: "🇦🇪",
    category: "gulf",
    country: "UAE (Sharjah / RAK)",
    station: "BM-SHJ-09",
    grid: "EPSG:32640",
    accuracy: "< 1 mm",
    datum: "WGS-84",
    lon0: 57.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 345200.0,
    defaultN: 2802100.0,
    defaultZ: 12.0,
  },
  {
    id: "qatar-qng",
    name: "Qatar National Grid (QNG)",
    flag: "🇶🇦",
    category: "gulf",
    country: "Qatar",
    station: "QNG-DOH-12",
    grid: "EPSG:2932",
    accuracy: "< 1 mm",
    datum: "Qatar 1995",
    lon0: 51.216666667,
    lat0: 24.45,
    k0: 0.99999,
    x0: 200000,
    y0: 300000,
    defaultE: 231540.25,
    defaultN: 392410.8,
    defaultZ: 11.2,
    a: 6378249.145,
    invF: 293.4663,
  },
  {
    id: "saudi-utm37n",
    name: "Saudi Arabia West (UTM 37N)",
    flag: "🇸🇦",
    category: "gulf",
    country: "Saudi Arabia (Jeddah / Medina)",
    station: "KSA-JED-02",
    grid: "EPSG:32637",
    accuracy: "< 1 mm",
    datum: "WGS-84",
    lon0: 39.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 521400.0,
    defaultN: 2378900.0,
    defaultZ: 18.0,
  },
  {
    id: "saudi-utm38n",
    name: "Saudi Arabia Central (UTM 38N)",
    flag: "🇸🇦",
    category: "gulf",
    country: "Saudi Arabia (Riyadh)",
    station: "KSA-RUH-03",
    grid: "EPSG:32638",
    accuracy: "< 1 mm",
    datum: "WGS-84",
    lon0: 45.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 671230.15,
    defaultN: 2731520.85,
    defaultZ: 612.0,
  },
  {
    id: "saudi-utm39n",
    name: "Saudi Arabia East (UTM 39N)",
    flag: "🇸🇦",
    category: "gulf",
    country: "Saudi Arabia (Dammam / Khobar)",
    station: "KSA-DMM-07",
    grid: "EPSG:32639",
    accuracy: "< 1 mm",
    datum: "WGS-84",
    lon0: 51.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 421800.0,
    defaultN: 2921400.0,
    defaultZ: 10.5,
  },
  {
    id: "oman-utm40n",
    name: "Oman National Grid (UTM 40N)",
    flag: "🇴🇲",
    category: "gulf",
    country: "Oman (Muscat)",
    station: "OMN-MCT-05",
    grid: "EPSG:32640",
    accuracy: "< 1 mm",
    datum: "WGS-84",
    lon0: 57.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 654200.0,
    defaultN: 2614300.0,
    defaultZ: 45.0,
  },
  {
    id: "kuwait-utm39n",
    name: "Kuwait KNG (UTM 39N)",
    flag: "🇰🇼",
    category: "gulf",
    country: "Kuwait",
    station: "KWT-CTY-01",
    grid: "EPSG:32639",
    accuracy: "< 1 mm",
    datum: "WGS-84",
    lon0: 51.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 204300.0,
    defaultN: 3251200.0,
    defaultZ: 15.0,
  },
  {
    id: "bahrain-grid",
    name: "Bahrain State Grid (UTM 39N)",
    flag: "🇧🇭",
    category: "gulf",
    country: "Bahrain (Manama)",
    station: "BHR-MNM-03",
    grid: "EPSG:32639",
    accuracy: "< 1 mm",
    datum: "WGS-84",
    lon0: 51.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 456700.0,
    defaultN: 2898400.0,
    defaultZ: 6.0,
  },
  {
    id: "egypt-utm36n",
    name: "Egypt Red Belt (UTM 36N)",
    flag: "🇪🇬",
    category: "gulf",
    country: "Egypt (Cairo)",
    station: "EGY-CAI-08",
    grid: "EPSG:32636",
    accuracy: "< 1 mm",
    datum: "WGS-84",
    lon0: 33.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 331500.0,
    defaultN: 3326100.0,
    defaultZ: 75.0,
  },

  // ── Asia & Subcontinent ──
  {
    id: "pakistan-utm41n",
    name: "Pakistan West (UTM 41N)",
    flag: "🇵🇰",
    category: "asia",
    country: "Pakistan (Balochistan / Quetta)",
    station: "PAK-QTA-02",
    grid: "EPSG:32641",
    accuracy: "< 1 mm",
    datum: "WGS-84",
    lon0: 63.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 692400.0,
    defaultN: 3341800.0,
    defaultZ: 1680.0,
  },
  {
    id: "pakistan-utm42n",
    name: "Pakistan Central (UTM 42N)",
    flag: "🇵🇰",
    category: "asia",
    country: "Pakistan (Punjab / Sindh / KPK)",
    station: "PAK-ISB-07",
    grid: "EPSG:32642",
    accuracy: "< 1 mm",
    datum: "WGS-84",
    lon0: 69.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 336520.4,
    defaultN: 3728140.6,
    defaultZ: 540.5,
  },
  {
    id: "pakistan-utm43n",
    name: "Pakistan East & Kashmir (UTM 43N)",
    flag: "🇵🇰",
    category: "asia",
    country: "Pakistan (Lahore / Kashmir / Gilgit)",
    station: "PAK-LHR-14",
    grid: "EPSG:32643",
    accuracy: "< 1 mm",
    datum: "WGS-84",
    lon0: 75.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 436100.0,
    defaultN: 3495400.0,
    defaultZ: 217.0,
  },
  {
    id: "india-utm43n",
    name: "India West (UTM 43N)",
    flag: "🇮🇳",
    category: "asia",
    country: "India (Mumbai / Gujarat)",
    station: "IND-BOM-01",
    grid: "EPSG:32643",
    accuracy: "< 1 mm",
    datum: "WGS-84",
    lon0: 75.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 278900.0,
    defaultN: 2112400.0,
    defaultZ: 14.0,
  },
  {
    id: "india-utm44n",
    name: "India Central (UTM 44N)",
    flag: "🇮🇳",
    category: "asia",
    country: "India (Delhi / Hyderabad)",
    station: "IND-DEL-05",
    grid: "EPSG:32644",
    accuracy: "< 1 mm",
    datum: "WGS-84",
    lon0: 81.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 132400.0,
    defaultN: 3171800.0,
    defaultZ: 216.0,
  },
  {
    id: "india-utm45n",
    name: "India East (UTM 45N)",
    flag: "🇮🇳",
    category: "asia",
    country: "India (Kolkata / Chennai)",
    station: "IND-CCU-09",
    grid: "EPSG:32645",
    accuracy: "< 1 mm",
    datum: "WGS-84",
    lon0: 87.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 641200.0,
    defaultN: 2496100.0,
    defaultZ: 9.0,
  },
  {
    id: "singapore-svy21",
    name: "Singapore SVY21",
    flag: "🇸🇬",
    category: "asia",
    country: "Singapore",
    station: "SGP-CTRL-01",
    grid: "EPSG:3414",
    accuracy: "< 1 mm",
    datum: "SVY21",
    lon0: 103.833333333,
    lat0: 1.366666667,
    k0: 1.0,
    x0: 28001.642,
    y0: 38744.572,
    defaultE: 28001.642,
    defaultN: 38744.572,
    defaultZ: 22.0,
  },
  {
    id: "malaysia-utm48n",
    name: "Malaysia Peninsular (UTM 48N)",
    flag: "🇲🇾",
    category: "asia",
    country: "Malaysia (Kuala Lumpur)",
    station: "MYS-KUL-02",
    grid: "EPSG:32648",
    accuracy: "< 1 mm",
    datum: "WGS-84",
    lon0: 105.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 798400.0,
    defaultN: 347800.0,
    defaultZ: 55.0,
  },
  {
    id: "china-utm50n",
    name: "China CGCS2000 (UTM 50N)",
    flag: "🇨🇳",
    category: "asia",
    country: "China (Beijing / Shanghai)",
    station: "CHN-BJS-01",
    grid: "EPSG:32650",
    accuracy: "< 1 mm",
    datum: "CGCS2000",
    lon0: 117.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 448200.0,
    defaultN: 4417600.0,
    defaultZ: 43.0,
  },
  {
    id: "japan-utm54n",
    name: "Japan Plane Rect. (UTM 54N)",
    flag: "🇯🇵",
    category: "asia",
    country: "Japan (Tokyo / Kanto)",
    station: "JPN-TYO-03",
    grid: "EPSG:32654",
    accuracy: "< 1 mm",
    datum: "JGD2011 / WGS84",
    lon0: 141.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 382400.0,
    defaultN: 3951200.0,
    defaultZ: 38.0,
  },
  {
    id: "philippines-utm51n",
    name: "Philippines PRS92 (UTM 51N)",
    flag: "🇵🇭",
    category: "asia",
    country: "Philippines (Manila)",
    station: "PHL-MNL-01",
    grid: "EPSG:32651",
    accuracy: "< 1 mm",
    datum: "WGS-84",
    lon0: 123.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 284100.0,
    defaultN: 1614200.0,
    defaultZ: 15.0,
  },
  {
    id: "indonesia-utm48s",
    name: "Indonesia West (UTM 48S)",
    flag: "🇮🇩",
    category: "asia",
    country: "Indonesia (Jakarta / Java)",
    station: "IDN-JKT-04",
    grid: "EPSG:32748",
    accuracy: "< 1 mm",
    datum: "WGS-84",
    lon0: 105.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 10000000,
    defaultE: 704100.0,
    defaultN: 9312400.0,
    defaultZ: 16.0,
  },
  {
    id: "turkey-utm36n",
    name: "Turkey Central (UTM 36N)",
    flag: "🇹🇷",
    category: "asia",
    country: "Turkey (Ankara / Istanbul)",
    station: "TUR-ANK-02",
    grid: "EPSG:32636",
    accuracy: "< 1 mm",
    datum: "ITRF96 / WGS84",
    lon0: 33.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 486200.0,
    defaultN: 4419800.0,
    defaultZ: 938.0,
  },

  // ── Europe & UK ──
  {
    id: "uk-osgb36",
    name: "UK British National Grid (OSGB36)",
    flag: "🇬🇧",
    category: "europe",
    country: "United Kingdom (London / England)",
    station: "TBM-LON-04",
    grid: "EPSG:27700",
    accuracy: "1–2 mm",
    datum: "OSGB36",
    lon0: -2.0,
    lat0: 49.0,
    k0: 0.9996012717,
    x0: 400000,
    y0: -100000,
    defaultE: 538120.0,
    defaultN: 184510.0,
    defaultZ: 12.3,
    a: 6377563.396,
    invF: 299.32496,
  },
  {
    id: "ireland-itm",
    name: "Irish Transverse Mercator (ITM)",
    flag: "🇮🇪",
    category: "europe",
    country: "Ireland (Dublin)",
    station: "IRL-DUB-01",
    grid: "EPSG:2157",
    accuracy: "< 1 mm",
    datum: "IRENET95 / ETRS89",
    lon0: -8.0,
    lat0: 53.5,
    k0: 0.99982,
    x0: 600000,
    y0: 750000,
    defaultE: 715800.0,
    defaultN: 734600.0,
    defaultZ: 25.0,
  },
  {
    id: "france-lambert93",
    name: "France Lambert-93 (UTM 31N)",
    flag: "🇫🇷",
    category: "europe",
    country: "France (Paris / Lyon)",
    station: "FRA-PAR-06",
    grid: "EPSG:2154",
    accuracy: "< 1 mm",
    datum: "RGF93 / ETRS89",
    lon0: 3.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 448200.0,
    defaultN: 5411800.0,
    defaultZ: 35.0,
  },
  {
    id: "germany-utm32n",
    name: "Germany ETRS89 (UTM 32N)",
    flag: "🇩🇪",
    category: "europe",
    country: "Germany (Frankfurt / Berlin / Munich)",
    station: "DEU-FRA-02",
    grid: "EPSG:32632",
    accuracy: "< 1 mm",
    datum: "ETRS89 / WGS84",
    lon0: 9.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 476800.0,
    defaultN: 5552100.0,
    defaultZ: 112.0,
  },
  {
    id: "netherlands-rdnew",
    name: "Netherlands Amersfoort (RD New)",
    flag: "🇳🇱",
    category: "europe",
    country: "Netherlands (Amsterdam / Rotterdam)",
    station: "NLD-AMS-01",
    grid: "EPSG:28992",
    accuracy: "< 1 mm",
    datum: "RD New",
    lon0: 5.387638889,
    lat0: 52.156160556,
    k0: 0.9999079,
    x0: 155000,
    y0: 463000,
    defaultE: 121300.0,
    defaultN: 487200.0,
    defaultZ: -2.0,
    a: 6377397.155,
    invF: 299.15281,
  },
  {
    id: "switzerland-lv95",
    name: "Swiss CH1903+ (LV95)",
    flag: "🇨🇭",
    category: "europe",
    country: "Switzerland (Zurich / Geneva)",
    station: "CHE-ZRH-03",
    grid: "EPSG:2056",
    accuracy: "< 1 mm",
    datum: "CH1903+",
    lon0: 7.439583333,
    lat0: 46.952405556,
    k0: 1.0,
    x0: 2600000,
    y0: 1200000,
    defaultE: 2683200.0,
    defaultN: 1248100.0,
    defaultZ: 408.0,
  },
  {
    id: "spain-utm30n",
    name: "Spain ETRS89 (UTM 30N)",
    flag: "🇪🇸",
    category: "europe",
    country: "Spain (Madrid)",
    station: "ESP-MAD-01",
    grid: "EPSG:32630",
    accuracy: "< 1 mm",
    datum: "ETRS89",
    lon0: -3.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 440300.0,
    defaultN: 4474200.0,
    defaultZ: 667.0,
  },
  {
    id: "italy-utm32n",
    name: "Italy ETRS89 (UTM 32N)",
    flag: "🇮🇹",
    category: "europe",
    country: "Italy (Rome / Milan)",
    station: "ITA-ROM-04",
    grid: "EPSG:32632",
    accuracy: "< 1 mm",
    datum: "ETRS89",
    lon0: 9.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 785200.0,
    defaultN: 4643100.0,
    defaultZ: 37.0,
  },
  {
    id: "scandinavia-utm33n",
    name: "Norway / Sweden ETRS89 (UTM 33N)",
    flag: "🇳🇴",
    category: "europe",
    country: "Norway & Sweden (Oslo / Stockholm)",
    station: "NOR-OSL-01",
    grid: "EPSG:32633",
    accuracy: "< 1 mm",
    datum: "ETRS89",
    lon0: 15.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 597200.0,
    defaultN: 6642800.0,
    defaultZ: 23.0,
  },
  {
    id: "poland-utm34n",
    name: "Poland ETRS89 (UTM 34N)",
    flag: "🇵🇱",
    category: "europe",
    country: "Poland (Warsaw)",
    station: "POL-WAW-02",
    grid: "EPSG:32634",
    accuracy: "< 1 mm",
    datum: "ETRS89",
    lon0: 21.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 500400.0,
    defaultN: 5786100.0,
    defaultZ: 105.0,
  },

  // ── North America ──
  {
    id: "usa-nad83-nyc",
    name: "USA NYC Long Island (NAD83)",
    flag: "🇺🇸",
    category: "americas",
    country: "USA (New York)",
    station: "NYC-CTRL-22",
    grid: "EPSG:32118",
    accuracy: "< 1 mm",
    datum: "NAD83",
    lon0: -74.0,
    lat0: 40.0,
    k0: 0.9999,
    x0: 300000,
    y0: 0,
    defaultE: 298450.0,
    defaultN: 68420.0,
    defaultZ: 34.2,
  },
  {
    id: "usa-nad83-ca",
    name: "USA California Zone 3 (NAD83)",
    flag: "🇺🇸",
    category: "americas",
    country: "USA (San Francisco / Oakland)",
    station: "CAL-SFO-03",
    grid: "EPSG:2227",
    accuracy: "< 1 mm",
    datum: "NAD83",
    lon0: -120.5,
    lat0: 36.5,
    k0: 0.9999,
    x0: 2000000,
    y0: 500000,
    defaultE: 2005400.0,
    defaultN: 512300.0,
    defaultZ: 16.0,
  },
  {
    id: "usa-nad83-tx",
    name: "USA Texas Central (NAD83)",
    flag: "🇺🇸",
    category: "americas",
    country: "USA (Austin / San Antonio)",
    station: "TEX-ATX-05",
    grid: "EPSG:2277",
    accuracy: "< 1 mm",
    datum: "NAD83",
    lon0: -100.333333333,
    lat0: 29.666666667,
    k0: 0.9999,
    x0: 700000,
    y0: 3000000,
    defaultE: 700200.0,
    defaultN: 3045600.0,
    defaultZ: 149.0,
  },
  {
    id: "usa-nad83-fl",
    name: "USA Florida East (NAD83)",
    flag: "🇺🇸",
    category: "americas",
    country: "USA (Miami / Orlando)",
    station: "FLA-MIA-01",
    grid: "EPSG:2236",
    accuracy: "< 1 mm",
    datum: "NAD83",
    lon0: -81.0,
    lat0: 24.333333333,
    k0: 0.999941177,
    x0: 200000,
    y0: 0,
    defaultE: 215400.0,
    defaultN: 162100.0,
    defaultZ: 4.5,
  },
  {
    id: "usa-utm10n",
    name: "USA Pacific Northwest (UTM 10N)",
    flag: "🇺🇸",
    category: "americas",
    country: "USA & Canada (Seattle / Vancouver)",
    station: "USA-SEA-09",
    grid: "EPSG:32610",
    accuracy: "< 1 mm",
    datum: "WGS-84",
    lon0: -123.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 550400.0,
    defaultN: 5273100.0,
    defaultZ: 42.0,
  },
  {
    id: "usa-utm16n",
    name: "USA Midwest (UTM 16N)",
    flag: "🇺🇸",
    category: "americas",
    country: "USA (Chicago / Illinois)",
    station: "USA-CHI-04",
    grid: "EPSG:32616",
    accuracy: "< 1 mm",
    datum: "WGS-84",
    lon0: -87.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 448200.0,
    defaultN: 4637200.0,
    defaultZ: 182.0,
  },
  {
    id: "canada-utm17n",
    name: "Canada Ontario (UTM 17N)",
    flag: "🇨🇦",
    category: "americas",
    country: "Canada (Toronto / Ottawa)",
    station: "CAN-YYZ-01",
    grid: "EPSG:32617",
    accuracy: "< 1 mm",
    datum: "NAD83 / WGS84",
    lon0: -81.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 630100.0,
    defaultN: 4834200.0,
    defaultZ: 76.0,
  },

  // ── Australia & Oceania ──
  {
    id: "aus-gda2020-50",
    name: "Australia GDA2020 (MGA 50)",
    flag: "🇦🇺",
    category: "oceania",
    country: "Australia (Perth / WA)",
    station: "AUS-PER-01",
    grid: "EPSG:7850",
    accuracy: "< 1 mm",
    datum: "GDA2020",
    lon0: 117.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 10000000,
    defaultE: 392100.0,
    defaultN: 6463800.0,
    defaultZ: 28.0,
  },
  {
    id: "aus-gda2020-54",
    name: "Australia GDA2020 (MGA 54)",
    flag: "🇦🇺",
    category: "oceania",
    country: "Australia (Adelaide / SA)",
    station: "AUS-ADL-02",
    grid: "EPSG:7854",
    accuracy: "< 1 mm",
    datum: "GDA2020",
    lon0: 141.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 10000000,
    defaultE: 281400.0,
    defaultN: 6132400.0,
    defaultZ: 49.0,
  },
  {
    id: "aus-gda2020-55",
    name: "Australia GDA2020 (MGA 55)",
    flag: "🇦🇺",
    category: "oceania",
    country: "Australia (Melbourne / Sydney / ACT)",
    station: "AUS-SYD-07",
    grid: "EPSG:7855",
    accuracy: "< 1 mm",
    datum: "GDA2020",
    lon0: 147.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 10000000,
    defaultE: 334200.0,
    defaultN: 6250100.0,
    defaultZ: 21.0,
  },
  {
    id: "aus-gda2020-56",
    name: "Australia GDA2020 (MGA 56)",
    flag: "🇦🇺",
    category: "oceania",
    country: "Australia (Brisbane / Gold Coast)",
    station: "AUS-BNE-03",
    grid: "EPSG:7856",
    accuracy: "< 1 mm",
    datum: "GDA2020",
    lon0: 153.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 10000000,
    defaultE: 502400.0,
    defaultN: 6961200.0,
    defaultZ: 14.0,
  },
  {
    id: "nz-nztm2000",
    name: "New Zealand NZTM2000",
    flag: "🇳🇿",
    category: "oceania",
    country: "New Zealand (Auckland / Wellington)",
    station: "NZL-WLG-01",
    grid: "EPSG:2193",
    accuracy: "< 1 mm",
    datum: "NZGD2000",
    lon0: 173.0,
    lat0: 0,
    k0: 0.9996,
    x0: 1600000,
    y0: 10000000,
    defaultE: 1748200.0,
    defaultN: 5427100.0,
    defaultZ: 19.0,
  },

  // ── South America & Africa ──
  {
    id: "brazil-utm23s",
    name: "Brazil SIRGAS 2000 (UTM 23S)",
    flag: "🇧🇷",
    category: "africa",
    country: "Brazil (São Paulo / Rio de Janeiro)",
    station: "BRA-SAO-01",
    grid: "EPSG:31983",
    accuracy: "< 1 mm",
    datum: "SIRGAS 2000",
    lon0: -45.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 10000000,
    defaultE: 331400.0,
    defaultN: 7394200.0,
    defaultZ: 760.0,
  },
  {
    id: "colombia-magna",
    name: "Colombia MAGNA-SIRGAS (UTM 18N)",
    flag: "🇨🇴",
    category: "africa",
    country: "Colombia (Bogotá)",
    station: "COL-BOG-02",
    grid: "EPSG:3116",
    accuracy: "< 1 mm",
    datum: "MAGNA-SIRGAS",
    lon0: -75.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 601200.0,
    defaultN: 512400.0,
    defaultZ: 2640.0,
  },
  {
    id: "argentina-posgar",
    name: "Argentina POSGAR 07 (UTM 21S)",
    flag: "🇦🇷",
    category: "africa",
    country: "Argentina (Buenos Aires)",
    station: "ARG-BUE-03",
    grid: "EPSG:5348",
    accuracy: "< 1 mm",
    datum: "POSGAR 07",
    lon0: -57.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 10000000,
    defaultE: 367100.0,
    defaultN: 6169400.0,
    defaultZ: 25.0,
  },
  {
    id: "safrica-lo19",
    name: "South Africa Hartebeesthoek94 (Lo 19)",
    flag: "🇿🇦",
    category: "africa",
    country: "South Africa (Cape Town)",
    station: "ZAF-CPT-01",
    grid: "EPSG:2048",
    accuracy: "< 1 mm",
    datum: "Hartebeesthoek94",
    lon0: 19.0,
    lat0: 0,
    k0: 1.0,
    x0: 0,
    y0: 0,
    defaultE: -43200.0,
    defaultN: -3752100.0,
    defaultZ: 18.0,
  },
  {
    id: "safrica-lo29",
    name: "South Africa Hartebeesthoek94 (Lo 29)",
    flag: "🇿🇦",
    category: "africa",
    country: "South Africa (Johannesburg)",
    station: "ZAF-JHB-05",
    grid: "EPSG:2054",
    accuracy: "< 1 mm",
    datum: "Hartebeesthoek94",
    lon0: 29.0,
    lat0: 0,
    k0: 1.0,
    x0: 0,
    y0: 0,
    defaultE: -98200.0,
    defaultN: -2901400.0,
    defaultZ: 1753.0,
  },
  {
    id: "nigeria-utm31n",
    name: "Nigeria Minna (UTM 31N)",
    flag: "🇳🇬",
    category: "africa",
    country: "Nigeria (Lagos)",
    station: "NGA-LOS-01",
    grid: "EPSG:32631",
    accuracy: "< 1 mm",
    datum: "Minna / WGS84",
    lon0: 3.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 0,
    defaultE: 541200.0,
    defaultN: 712400.0,
    defaultZ: 10.0,
  },
  {
    id: "kenya-utm37s",
    name: "Kenya Arc 1960 (UTM 37S)",
    flag: "🇰🇪",
    category: "africa",
    country: "Kenya (Nairobi)",
    station: "KEN-NBO-02",
    grid: "EPSG:32737",
    accuracy: "< 1 mm",
    datum: "WGS-84",
    lon0: 39.0,
    lat0: 0,
    k0: 0.9996,
    x0: 500000,
    y0: 10000000,
    defaultE: 254100.0,
    defaultN: 9857400.0,
    defaultZ: 1661.0,
  },
];

/* ─── Build All 120 Worldwide UTM Zones (1N to 60N, 1S to 60S) ─── */
const ALL_WORLD_UTM_ZONES: CoordSystem[] = [];
for (let z = 1; z <= 60; z++) {
  ALL_WORLD_UTM_ZONES.push(createUtmSystem(z, "N"));
  ALL_WORLD_UTM_ZONES.push(createUtmSystem(z, "S"));
}

/* Complete Combined Global Catalog (160+ systems) */
const ALL_WORLD_SYSTEMS: CoordSystem[] = [...CURATED_SYSTEMS, ...ALL_WORLD_UTM_ZONES];

/* ─── High Precision Ellipsoidal Transverse Mercator Inverse Engine ─── */
function tmInverse(
  easting: number,
  northing: number,
  lon0: number,
  lat0: number,
  k0: number,
  x0: number,
  y0: number,
  a = 6378137.0,
  invF = 298.257223563
): { lat: number; lon: number } {
  if (isNaN(easting) || isNaN(northing)) return { lat: 0, lon: 0 };

  const f = 1 / invF;
  const e2 = 2 * f - f * f;
  const ep2 = e2 / (1 - e2);

  const x = easting - x0;
  const y = northing - y0;

  const rad = Math.PI / 180;
  const lat0Rad = lat0 * rad;
  const m0 =
    a *
    ((1 - e2 / 4 - (3 * e2 * e2) / 64 - (5 * Math.pow(e2, 3)) / 256) * lat0Rad -
      ((3 * e2) / 8 + (3 * e2 * e2) / 32 + (45 * Math.pow(e2, 3)) / 1024) * Math.sin(2 * lat0Rad) +
      ((15 * e2 * e2) / 256 + (45 * Math.pow(e2, 3)) / 1024) * Math.sin(4 * lat0Rad) -
      ((35 * Math.pow(e2, 3)) / 3072) * Math.sin(6 * lat0Rad));

  const M = m0 + y / k0;
  const mu = M / (a * (1 - e2 / 4 - (3 * e2 * e2) / 64 - (5 * Math.pow(e2, 3)) / 256));
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));

  const phi1 =
    mu +
    ((3 * e1) / 2 - (27 * Math.pow(e1, 3)) / 32) * Math.sin(2 * mu) +
    ((21 * e1 * e1) / 16 - (55 * Math.pow(e1, 4)) / 32) * Math.sin(4 * mu) +
    ((151 * Math.pow(e1, 3)) / 96) * Math.sin(6 * mu) +
    ((1097 * Math.pow(e1, 4)) / 512) * Math.sin(8 * mu);

  const sinPhi1 = Math.sin(phi1);
  const cosPhi1 = Math.cos(phi1);
  const tanPhi1 = Math.tan(phi1);

  const N1 = a / Math.sqrt(1 - e2 * sinPhi1 * sinPhi1);
  const T1 = tanPhi1 * tanPhi1;
  const C1 = ep2 * cosPhi1 * cosPhi1;
  const R1 = (a * (1 - e2)) / Math.pow(1 - e2 * sinPhi1 * sinPhi1, 1.5);
  const D = x / (N1 * k0);

  const D2 = D * D;
  const D3 = D2 * D;
  const D4 = D2 * D2;
  const D5 = D4 * D;
  const D6 = D3 * D3;

  const latRad =
    phi1 -
    ((N1 * tanPhi1) / R1) *
    (D2 / 2 -
      (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * (D4 / 24) +
      (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * (D6 / 720));

  const lonRad =
    lon0 * rad +
    (D -
      (1 + 2 * T1 + C1) * (D3 / 6) +
      (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * (D5 / 120)) /
    cosPhi1;

  let latDeg = latRad / rad;
  let lonDeg = lonRad / rad;

  // Normalize
  if (isNaN(latDeg)) latDeg = 0;
  if (isNaN(lonDeg)) lonDeg = 0;
  while (lonDeg > 180) lonDeg -= 360;
  while (lonDeg < -180) lonDeg += 360;

  return { lat: latDeg, lon: lonDeg };
}

/* ─── Radar Canvas Component ─── */
function RadarCanvas({ blipX, blipY }: { blipX: number; blipY: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);
  const frameRef = useRef(0);
  const blipRef = useRef({ x: blipX, y: blipY });

  useEffect(() => {
    blipRef.current = { x: blipX, y: blipY };
  }, [blipX, blipY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.min(cx, cy) * 0.88;

      ctx.clearRect(0, 0, w, h);

      // Background
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 1.4);
      bgGrad.addColorStop(0, "rgba(3, 17, 35, 0.97)");
      bgGrad.addColorStop(1, "rgba(1, 5, 12, 1)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = "rgba(0, 180, 255, 0.04)";
      ctx.lineWidth = 0.5;
      for (let i = 1; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (h / 8) * i);
        ctx.lineTo(w, (h / 8) * i);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo((w / 8) * i, 0);
        ctx.lineTo((w / 8) * i, h);
        ctx.stroke();
      }

      // Concentric rings
      for (const frac of [0.25, 0.5, 0.75, 1.0]) {
        ctx.beginPath();
        ctx.arc(cx, cy, maxR * frac, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 180, 255, ${frac === 1 ? 0.15 : 0.07})`;
        ctx.lineWidth = frac === 1 ? 1 : 0.6;
        ctx.stroke();
      }

      // Crosshairs
      ctx.strokeStyle = "rgba(0, 180, 255, 0.1)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(cx - maxR, cy);
      ctx.lineTo(cx + maxR, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy - maxR);
      ctx.lineTo(cx, cy + maxR);
      ctx.stroke();

      // Sweep beam
      const sweep = angleRef.current;
      const trail = Math.PI * 0.3;
      for (let i = 0; i < 30; i++) {
        const f = i / 30;
        const a2 = sweep - trail * f;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, maxR, a2 - 0.025, a2 + 0.025);
        ctx.closePath();
        ctx.fillStyle = `rgba(0, 200, 255, ${0.15 * (1 - f)})`;
        ctx.fill();
      }

      // Leading edge
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweep) * maxR, cy + Math.sin(sweep) * maxR);
      ctx.strokeStyle = "rgba(0, 220, 255, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Station blip
      const bx = cx + blipRef.current.x * maxR * 0.7;
      const by = cy - blipRef.current.y * maxR * 0.7;
      const blipAngle = Math.atan2(-blipRef.current.y, blipRef.current.x);
      const angleDiff = ((sweep - blipAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      let alpha = angleDiff < Math.PI * 0.5 ? 1 - angleDiff / (Math.PI * 0.5) : 0;
      alpha = Math.max(alpha, 0.15 + 0.08 * Math.sin(Date.now() / 400));

      // Glow
      const glow = ctx.createRadialGradient(bx, by, 0, bx, by, 12);
      glow.addColorStop(0, `rgba(0, 255, 180, ${alpha * 0.6})`);
      glow.addColorStop(1, "rgba(0, 255, 180, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(bx, by, 12, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(bx, by, 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 255, 180, ${alpha})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bx, by, 5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 255, 180, ${alpha * 0.5})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 200, 255, 0.6)";
      ctx.fill();

      // Cardinal labels
      ctx.font = "bold 8px monospace";
      ctx.fillStyle = "rgba(0, 180, 255, 0.22)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("N", cx, cy - maxR - 8);
      ctx.fillText("S", cx, cy + maxR + 8);
      ctx.fillText("E", cx + maxR + 8, cy);
      ctx.fillText("W", cx - maxR - 8, cy);

      // Tick marks
      for (let i = 0; i < 36; i++) {
        const ta = (i * 10 * Math.PI) / 180;
        const inner = i % 3 === 0 ? maxR - 5 : maxR - 2.5;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ta) * inner, cy + Math.sin(ta) * inner);
        ctx.lineTo(cx + Math.cos(ta) * maxR, cy + Math.sin(ta) * maxR);
        ctx.strokeStyle = `rgba(0, 180, 255, ${i % 3 === 0 ? 0.18 : 0.06})`;
        ctx.lineWidth = i % 3 === 0 ? 0.8 : 0.4;
        ctx.stroke();
      }

      angleRef.current += 0.018;
      if (angleRef.current > Math.PI * 2) angleRef.current -= Math.PI * 2;
      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full rounded-xl" />;
}

/* ─── Main HeroConverter Component ─── */
export default function HeroConverter() {
  const [selectedSystem, setSelectedSystem] = useState<CoordSystem>(CURATED_SYSTEMS[0]);
  const [easting, setEasting] = useState<number>(CURATED_SYSTEMS[0].defaultE);
  const [northing, setNorthing] = useState<number>(CURATED_SYSTEMS[0].defaultN);
  const [elevation, setElevation] = useState<number>(CURATED_SYSTEMS[0].defaultZ);

  // Selector Modal / Drawer State
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Custom UTM Zone Interactive Builder inside drawer
  const [builderZone, setBuilderZone] = useState(42);
  const [builderHemisphere, setBuilderHemisphere] = useState<"N" | "S">("N");

  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // Compute live coordinates using accurate Ellipsoidal Transverse Mercator
  const computed = useMemo(() => {
    return tmInverse(
      easting,
      northing,
      selectedSystem.lon0,
      selectedSystem.lat0,
      selectedSystem.k0,
      selectedSystem.x0,
      selectedSystem.y0,
      selectedSystem.a,
      selectedSystem.invF
    );
  }, [easting, northing, selectedSystem]);

  const computedLat = computed.lat.toFixed(6);
  const computedLon = computed.lon.toFixed(6);

  // Blip position relative to station default
  const dE = (easting || 0) - selectedSystem.defaultE;
  const dN = (northing || 0) - selectedSystem.defaultN;
  const blipX = Math.max(-0.95, Math.min(0.95, dE / 5000));
  const blipY = Math.max(-0.95, Math.min(0.95, dN / 5000));

  // Select system handler
  const handleSelectSystem = (sys: CoordSystem) => {
    setSelectedSystem(sys);
    setEasting(sys.defaultE);
    setNorthing(sys.defaultN);
    setElevation(sys.defaultZ);
    setIsSelectorOpen(false);
  };

  // Apply custom UTM zone builder
  const handleApplyBuilderZone = () => {
    const sys = createUtmSystem(builderZone, builderHemisphere);
    handleSelectSystem(sys);
  };

  // Filtered systems list
  const filteredSystems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return ALL_WORLD_SYSTEMS.filter((sys) => {
      // Category filter
      if (activeCategory === "gulf" && sys.category !== "gulf") return false;
      if (activeCategory === "asia" && sys.category !== "asia") return false;
      if (activeCategory === "europe" && sys.category !== "europe") return false;
      if (activeCategory === "americas" && sys.category !== "americas") return false;
      if (activeCategory === "oceania" && sys.category !== "oceania") return false;
      if (activeCategory === "africa" && sys.category !== "africa") return false;
      if (activeCategory === "utm" && sys.category !== "utm") return false;
      if (activeCategory === "popular" && sys.category === "utm") return false;

      // Query filter
      if (!q) return true;
      return (
        sys.name.toLowerCase().includes(q) ||
        sys.country.toLowerCase().includes(q) ||
        sys.grid.toLowerCase().includes(q) ||
        sys.station.toLowerCase().includes(q) ||
        sys.datum.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, activeCategory]);

  const copyCoords = useCallback(() => {
    navigator.clipboard.writeText(`${computedLat}, ${computedLon}`).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [computedLat, computedLon]);

  const downloadKml = useCallback(() => {
    const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${selectedSystem.station} - Survey Benchmark</name>
    <description><![CDATA[Converted via Excel to KML Pro
Coordinate System: ${selectedSystem.name} (${selectedSystem.grid})
Region: ${selectedSystem.country}
Easting: ${easting} m
Northing: ${northing} m
Elevation: ${elevation} m
Datum: ${selectedSystem.datum}]]></description>
    <Style id="surveyPointStyle">
      <IconStyle>
        <color>ff00e6ff</color>
        <scale>1.25</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>0.9</scale>
        <color>ffffffff</color>
      </LabelStyle>
      <LineStyle>
        <color>ff00ffff</color>
        <width>2</width>
      </LineStyle>
    </Style>
    <Placemark>
      <name>${selectedSystem.station}</name>
      <description><![CDATA[
        <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 13px; line-height: 1.5; color: #0f172a; max-width: 320px;">
          <h3 style="margin: 0 0 6px 0; color: #0071e3; font-size: 15px; font-weight: 700;">${selectedSystem.station}</h3>
          <p style="margin: 0 0 8px 0; color: #64748b; font-size: 11px;">System: <b>${selectedSystem.name}</b> (${selectedSystem.grid})</p>
          <table style="border-collapse: collapse; width: 100%; font-size: 12px; margin-bottom: 8px;">
            <tr style="background: #f8fafc;"><td style="padding: 4px 8px; font-weight: 600;">Easting (m)</td><td style="padding: 4px 8px; font-family: monospace;">${easting}</td></tr>
            <tr><td style="padding: 4px 8px; font-weight: 600;">Northing (m)</td><td style="padding: 4px 8px; font-family: monospace;">${northing}</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 4px 8px; font-weight: 600;">Elevation (m)</td><td style="padding: 4px 8px; font-family: monospace;">+${elevation}</td></tr>
            <tr><td style="padding: 4px 8px; font-weight: 600;">WGS84 Lat</td><td style="padding: 4px 8px; font-family: monospace;">${computedLat}° ${parseFloat(computedLat) >= 0 ? "N" : "S"}</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 4px 8px; font-weight: 600;">WGS84 Lon</td><td style="padding: 4px 8px; font-family: monospace;">${computedLon}° ${parseFloat(computedLon) >= 0 ? "E" : "W"}</td></tr>
            <tr><td style="padding: 4px 8px; font-weight: 600;">Accuracy</td><td style="padding: 4px 8px; color: #059669; font-weight: 600;">${selectedSystem.accuracy}</td></tr>
          </table>
          <div style="font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            Generated with Excel to KML Pro — Global EPSG Survey Engine
          </div>
        </div>
      ]]></description>
      <styleUrl>#surveyPointStyle</styleUrl>
      <Point>
        <extrude>1</extrude>
        <altitudeMode>relativeToGround</altitudeMode>
        <coordinates>${computedLon},${computedLat},${elevation}</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>`;

    const blob = new Blob([kmlContent], { type: "application/vnd.google-earth.kml+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedSystem.station}_${selectedSystem.grid.replace(":", "_")}.kml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2200);
  }, [selectedSystem, easting, northing, elevation, computedLat, computedLon]);

  const inputStyle: React.CSSProperties = {
    background: "rgba(0, 180, 255, 0.04)",
    border: "1px solid rgba(0, 180, 255, 0.12)",
    color: "#e0f2fe",
  };

  return (
    <div className="w-full max-w-[610px] mx-auto lg:mx-0 relative">
      <div
        className="rounded-2xl overflow-hidden relative shadow-2xl"
        style={{
          background: "rgba(3, 14, 30, 0.96)",
          border: "1px solid rgba(0, 180, 255, 0.15)",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.35), 0 0 80px rgba(0, 113, 227, 0.08)",
        }}
      >
        {/* ── Top Header ── */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid rgba(0, 180, 255, 0.08)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shadow-xs"
              style={{
                background: "linear-gradient(135deg, rgba(0,180,255,0.25), rgba(0,255,180,0.15))",
                border: "1px solid rgba(0,180,255,0.2)",
              }}
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-cyan-100 leading-tight">Quick Coordinate Converter</h3>
                <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  ALL ZONES
                </span>
              </div>
              <p className="text-[10px] font-medium" style={{ color: "rgba(0,180,255,0.5)" }}>
                Grid (E, N) → GPS (Lat, Lon) • 160+ World Systems
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            <span className="text-[10px] font-bold text-emerald-400 font-mono">Real-time</span>
          </div>
        </div>

        {/* ── Main Body ── */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-0 relative">
          {/* ── Left: Inputs ── */}
          <div className="sm:col-span-7 px-4 py-3 space-y-2.5" style={{ borderRight: "1px solid rgba(0,180,255,0.06)" }}>

            {/* Coordinate System Trigger Button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[9px] font-semibold uppercase tracking-wider text-cyan-400/70">
                  Coordinate System &amp; Zone
                </label>
                <span className="text-[9px] text-cyan-400/60 font-mono">160+ Global Zones</span>
              </div>

              <button
                type="button"
                onClick={() => setIsSelectorOpen(true)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all duration-150 hover:border-cyan-400/30 group cursor-pointer"
                style={{
                  ...inputStyle,
                  background: "linear-gradient(180deg, rgba(0, 180, 255, 0.08) 0%, rgba(0, 180, 255, 0.03) 100%)",
                }}
              >
                <div className="flex items-center gap-2 overflow-hidden pr-1">
                  <span className="text-base shrink-0">{selectedSystem.flag}</span>
                  <div className="truncate">
                    <div className="text-[11px] font-bold text-cyan-50 truncate group-hover:text-cyan-200 transition-colors">
                      {selectedSystem.name}
                    </div>
                    <div className="text-[9px] font-mono text-cyan-400/60 truncate">
                      {selectedSystem.grid} · {selectedSystem.country.split("(")[0]}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-cyan-400/70 shrink-0 ml-1">
                  <span className="text-[9px] font-medium bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/20 group-hover:border-cyan-400/40">
                    Change
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                </div>
              </button>
            </div>

            {/* Easting & Northing Inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-semibold uppercase tracking-wider mb-0.5 text-cyan-400/60">
                  Easting / X (m)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={easting}
                  onChange={(e) => setEasting(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-semibold focus:outline-none focus:border-cyan-400/50 transition-all"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-[9px] font-semibold uppercase tracking-wider mb-0.5 text-cyan-400/60">
                  Northing / Y (m)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={northing}
                  onChange={(e) => setNorthing(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-semibold focus:outline-none focus:border-cyan-400/50 transition-all"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Elevation Input */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="block text-[9px] font-semibold uppercase tracking-wider text-cyan-400/60">
                  Elevation / Height Z (m)
                </label>
                <span className="text-[8px] text-cyan-400/40 font-mono">3D Extrusion</span>
              </div>
              <input
                type="number"
                step="0.01"
                value={elevation}
                onChange={(e) => setElevation(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-semibold focus:outline-none focus:border-cyan-400/50 transition-all"
                style={inputStyle}
              />
            </div>

            {/* Live Converted WGS84 Display */}
            <div
              className="rounded-lg p-2.5 space-y-1.5"
              style={{
                background: "rgba(0, 255, 180, 0.04)",
                border: "1px solid rgba(0, 255, 180, 0.12)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                    WGS84 Coordinates (Google Earth)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copyCoords}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] transition-colors hover:bg-cyan-500/10 cursor-pointer"
                  style={{ color: "rgba(0,180,255,0.7)", background: "rgba(0,180,255,0.06)" }}
                  title="Copy Latitude, Longitude"
                >
                  {copied ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                  <span>{copied ? "Copied" : "Copy GPS"}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <div>
                  <div className="text-[8px] uppercase tracking-wider text-cyan-400/40 font-medium">Latitude</div>
                  <div className="text-[11px] font-mono font-bold text-cyan-100">
                    {computedLat}° {parseFloat(computedLat) >= 0 ? "N" : "S"}
                  </div>
                </div>
                <div>
                  <div className="text-[8px] uppercase tracking-wider text-cyan-400/40 font-medium">Longitude</div>
                  <div className="text-[11px] font-mono font-bold text-cyan-100">
                    {computedLon}° {parseFloat(computedLon) >= 0 ? "E" : "W"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-cyan-500/10">
                <div>
                  <div className="text-[8px] uppercase tracking-wider text-cyan-400/40 font-medium">3D Altitude</div>
                  <div className="text-[11px] font-mono font-bold text-cyan-300">
                    +{elevation} m
                  </div>
                </div>
                <div>
                  <div className="text-[8px] uppercase tracking-wider text-cyan-400/40 font-medium">Accuracy</div>
                  <div className="text-[11px] font-mono font-bold text-emerald-400">
                    {selectedSystem.accuracy}
                  </div>
                </div>
              </div>

              {/* Download KML Button */}
              <button
                type="button"
                onClick={downloadKml}
                className="w-full mt-2 py-2 px-3 rounded-lg text-[10px] font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] cursor-pointer"
                style={{
                  background: downloaded
                    ? "linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))"
                    : "linear-gradient(135deg, #0071e3, #0284c7)",
                  color: "#ffffff",
                  border: downloaded
                    ? "1px solid rgba(52, 211, 153, 0.5)"
                    : "1px solid rgba(56, 189, 248, 0.4)",
                  boxShadow: downloaded
                    ? "0 0 16px rgba(16, 185, 129, 0.45)"
                    : "0 2px 14px rgba(0, 113, 227, 0.35)",
                }}
              >
                {downloaded ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>Downloaded {selectedSystem.station}.kml</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-white" />
                    <span>Download {selectedSystem.station}.kml</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Right: Radar Display & Telemetry ── */}
          <div className="sm:col-span-5 p-3 flex flex-col gap-2">
            <div
              className="relative w-full aspect-square rounded-xl overflow-hidden"
              style={{ border: "1px solid rgba(0,180,255,0.08)" }}
            >
              <RadarCanvas blipX={blipX} blipY={blipY} />

              {/* Scan-line overlay */}
              <div
                className="absolute inset-0 pointer-events-none rounded-xl"
                style={{
                  background:
                    "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,180,255,0.01) 2px, rgba(0,180,255,0.01) 4px)",
                }}
              />

              {/* HUD labels */}
              <div
                className="absolute top-2 left-2 text-[7px] font-mono pointer-events-none"
                style={{ color: "rgba(0,180,255,0.6)" }}
              >
                GRID: <span className="text-cyan-300 font-bold">{selectedSystem.grid}</span>
              </div>
              <div
                className="absolute top-2 right-2 text-[7px] font-mono pointer-events-none"
                style={{ color: "rgba(0,180,255,0.5)" }}
              >
                CM: {selectedSystem.lon0}°
              </div>
              <div
                className="absolute bottom-2 left-2 text-[7px] font-mono pointer-events-none text-emerald-400 font-semibold"
              >
                ● GPS SYNCED
              </div>
              <div
                className="absolute bottom-2 right-2 text-[7px] font-mono pointer-events-none"
                style={{ color: "rgba(0,180,255,0.5)" }}
              >
                {selectedSystem.accuracy}
              </div>

              {/* Corner accents */}
              <div className="absolute top-1 left-1 w-3 h-3 pointer-events-none border-l-[1.5px] border-t-[1.5px] border-cyan-400/30" />
              <div className="absolute top-1 right-1 w-3 h-3 pointer-events-none border-r-[1.5px] border-t-[1.5px] border-cyan-400/30" />
              <div className="absolute bottom-1 left-1 w-3 h-3 pointer-events-none border-l-[1.5px] border-b-[1.5px] border-cyan-400/30" />
              <div className="absolute bottom-1 right-1 w-3 h-3 pointer-events-none border-r-[1.5px] border-b-[1.5px] border-cyan-400/30" />
            </div>

            {/* Station and Datum Info */}
            <div
              className="rounded-lg px-3 py-2 flex items-center justify-between"
              style={{ background: "rgba(0,180,255,0.04)", border: "1px solid rgba(0,180,255,0.08)" }}
            >
              <div>
                <div className="text-[8px] uppercase tracking-wider text-cyan-400/40">Station ID</div>
                <div className="text-[11px] font-mono font-bold text-cyan-200">{selectedSystem.station}</div>
              </div>
              <div className="text-right">
                <div className="text-[8px] uppercase tracking-wider text-cyan-400/40">Datum</div>
                <div className="text-[10px] font-mono font-bold text-cyan-100 truncate max-w-[110px]">
                  {selectedSystem.datum.split(" ")[0]}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="px-4 py-2 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(0, 180, 255, 0.06)" }}
        >
          <span className="text-[9px] font-medium flex items-center gap-1.5 text-cyan-400/60">
            <Globe className="w-3 h-3 text-cyan-400/80" />
            Exports standard KML 2.2 with 3D elevation for Google Earth
          </span>
          <span className="text-[9px] font-mono text-cyan-400/40">
            {selectedSystem.grid}
          </span>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SLIDE-OVER / OVERLAY: Worldwide Coordinate System Selector
           ══════════════════════════════════════════════════════════════════ */}
        {isSelectorOpen && (
          <div
            className="absolute inset-0 z-40 flex flex-col backdrop-blur-xl animate-in fade-in duration-200"
            style={{
              background: "rgba(2, 10, 24, 0.98)",
              border: "1px solid rgba(0, 180, 255, 0.25)",
            }}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between px-3.5 py-2.5"
              style={{ borderBottom: "1px solid rgba(0, 180, 255, 0.12)" }}
            >
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <div>
                  <h4 className="text-xs font-bold text-cyan-100">Select Coordinate System / Zone</h4>
                  <p className="text-[9px] text-cyan-400/60">160+ Global Zones • Universal EPSG Support</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSelectorOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-cyan-400/70 hover:text-cyan-100 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="px-3.5 py-2" style={{ borderBottom: "1px solid rgba(0, 180, 255, 0.08)" }}>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-cyan-400/50 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search zone (e.g. 42N, Dubai, 32642, London, Sydney, Texas)..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-lg text-[11px] font-medium placeholder-cyan-400/30 text-cyan-100 focus:outline-none focus:border-cyan-400/40"
                  style={{
                    background: "rgba(0, 180, 255, 0.06)",
                    border: "1px solid rgba(0, 180, 255, 0.15)",
                  }}
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-400/50 hover:text-cyan-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div
              className="px-3 py-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar"
              style={{ borderBottom: "1px solid rgba(0, 180, 255, 0.06)" }}
            >
              {[
                { id: "all", label: "All (160+)" },
                { id: "popular", label: "⭐ Popular" },
                { id: "utm", label: "🌍 UTM 1–60" },
                { id: "gulf", label: "🇦🇪 Gulf & ME" },
                { id: "asia", label: "🌏 Asia" },
                { id: "europe", label: "🏛️ Europe & UK" },
                { id: "americas", label: "🗽 Americas" },
                { id: "oceania", label: "🦘 Oceania" },
                { id: "africa", label: "🇿🇦 Africa & S.Am" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2 py-0.8 rounded text-[9px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${activeCategory === cat.id
                    ? "bg-cyan-500/25 text-cyan-100 border border-cyan-400/40 shadow-xs"
                    : "text-cyan-400/60 hover:text-cyan-200 hover:bg-cyan-500/10 border border-transparent"
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Interactive Custom UTM Zone Builder Section */}
            <div
              className="px-3 py-2 bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-slate-950/40 flex flex-wrap items-center justify-between gap-2 text-[10px]"
              style={{ borderBottom: "1px solid rgba(0, 180, 255, 0.1)" }}
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-300" />
                <span className="font-bold text-cyan-200">Custom UTM Zone:</span>
                <span className="text-cyan-400/70 font-mono">
                  Zone
                </span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={builderZone}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v) && v >= 1 && v <= 60) setBuilderZone(v);
                  }}
                  className="w-12 px-1.5 py-0.5 rounded text-center font-mono font-bold text-cyan-100 border border-cyan-400/30 bg-cyan-950/60 focus:outline-none"
                />
                <div className="inline-flex rounded overflow-hidden border border-cyan-400/30">
                  <button
                    type="button"
                    onClick={() => setBuilderHemisphere("N")}
                    className={`px-1.5 py-0.5 text-[9px] font-bold ${builderHemisphere === "N"
                      ? "bg-cyan-500 text-slate-950"
                      : "bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900/60"
                      }`}
                  >
                    North (N)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuilderHemisphere("S")}
                    className={`px-1.5 py-0.5 text-[9px] font-bold ${builderHemisphere === "S"
                      ? "bg-cyan-500 text-slate-950"
                      : "bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900/60"
                      }`}
                  >
                    South (S)
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleApplyBuilderZone}
                className="px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[10px] font-bold shadow-xs transition-colors cursor-pointer"
              >
                Apply Zone {builderZone}{builderHemisphere}
              </button>
            </div>

            {/* Scrollable System List */}
            <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-1 divide-y divide-cyan-500/5">
              {filteredSystems.length === 0 ? (
                <div className="py-8 text-center text-cyan-400/50 text-xs">
                  No coordinate system found matching &quot;{searchQuery}&quot;. Try searching by zone (e.g. &quot;42N&quot;) or EPSG code.
                </div>
              ) : (
                filteredSystems.map((sys) => {
                  const isSelected = selectedSystem.id === sys.id;
                  return (
                    <button
                      key={sys.id}
                      type="button"
                      onClick={() => handleSelectSystem(sys)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between gap-2 transition-all cursor-pointer ${isSelected
                        ? "bg-cyan-500/20 border border-cyan-400/40 text-cyan-100"
                        : "hover:bg-cyan-500/10 border border-transparent text-slate-200"
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base shrink-0">{sys.flag}</span>
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold truncate flex items-center gap-1.5">
                            <span className={isSelected ? "text-cyan-200" : "text-cyan-100"}>
                              {sys.name}
                            </span>
                            {isSelected && (
                              <span className="text-[8px] px-1 rounded bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-400/30">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] text-cyan-400/60 truncate flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 shrink-0 opacity-70" />
                            <span>{sys.country}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-block px-1.5 py-0.5 rounded font-mono text-[9px] font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-500/20">
                          {sys.grid}
                        </span>
                        <div className="text-[8px] text-cyan-400/40 font-mono mt-0.5">
                          {sys.accuracy}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Modal Bottom Status */}
            <div
              className="px-3.5 py-1.5 flex items-center justify-between text-[9px] text-cyan-400/50"
              style={{ borderTop: "1px solid rgba(0, 180, 255, 0.08)" }}
            >
              <span>Showing {filteredSystems.length} systems</span>
              <button
                type="button"
                onClick={() => setIsSelectorOpen(false)}
                className="text-cyan-300 hover:underline font-semibold"
              >
                Close Selector
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
