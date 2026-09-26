// Landing pages for popular survey grids: /convert/<slug>.
// presetId must match a curated system in components/HeroConverter.tsx so the
// converter on the page opens on that grid. Text is written per grid; keep it
// factual (check city longitudes against zone limits before adding places).

export interface GridPage {
  slug: string;
  presetId: string;
  code: number;
  /** Short name used in titles: "Dubai DLTM" */
  name: string;
  /** Other names people search for */
  aka: string[];
  region: "Middle East" | "South Asia" | "Europe" | "Asia-Pacific" | "Americas" | "Africa";
  about: string;
  usedFor: string;
  tip?: string;
}

const utm = (
  zone: number,
  presetId: string,
  region: GridPage["region"],
  usedFor: string,
  tip?: string
): GridPage => {
  const lo = zone * 6 - 186;
  const hi = lo + 6;
  const deg = (v: number) => `${Math.abs(v)}°${v >= 0 ? "E" : "W"}`;
  return {
    slug: `utm-zone-${zone}n`,
    presetId,
    code: 32600 + zone,
    name: `UTM Zone ${zone}N`,
    aka: [`UTM ${zone}N`, `WGS 84 / UTM zone ${zone}N`, `EPSG ${32600 + zone}`],
    region,
    about: `UTM zone ${zone}N covers longitudes ${deg(lo)} to ${deg(hi)} in the northern hemisphere, with its central meridian at ${deg(lo + 3)}. On the WGS 84 datum it needs no datum shift, so eastings and northings convert straight to the latitude and longitude Google Earth uses.`,
    usedFor,
    tip:
      tip ??
      `Pick the zone by longitude, not by country: a project near ${deg(hi)} may belong in the next zone. Points outside the zone are flagged after conversion.`,
  };
};

export const GRID_PAGES: GridPage[] = [
  {
    slug: "dubai-dltm",
    presetId: "dubai-dltm",
    code: 3997,
    name: "Dubai DLTM",
    aka: ["Dubai Local Transverse Mercator", "DLTM", "EPSG 3997"],
    region: "Middle East",
    about:
      "Dubai Local Transverse Mercator (DLTM) is the grid used by Dubai Municipality and most Dubai developers and contractors for site surveys, setting-out and land records. It is defined directly on WGS 84, so converting DLTM eastings and northings for Google Earth needs no datum shift — only the projection.",
    usedFor: "Dubai emirate: site surveys, setting-out, affection plans and as-built records.",
    tip: "Older Dubai drawings may use a pre-DLTM local grid. If points land a few hundred metres away, check which grid the drawing was issued in.",
  },
  {
    slug: "qatar-national-grid",
    presetId: "qatar-qng",
    code: 2932,
    name: "Qatar National Grid (QNG)",
    aka: ["QNG", "QND95", "Qatar National Datum 1995", "EPSG 2932"],
    region: "Middle East",
    about:
      "The Qatar National Grid is Qatar's official survey grid, based on the Qatar National Datum 1995 (QND95) and the International 1924 ellipsoid. Because its datum is not WGS 84, a published seven-parameter transformation is applied on the way to Google Earth.",
    usedFor: "Qatar: cadastral surveys, utilities, infrastructure and building permits.",
    tip: "The published shift is good to about a metre or two. For work that must match the ground more closely, calibrate on known QNG control points.",
  },
  utm(36, "egypt-utm36n", "Middle East", "Egypt east of 30°E including Cairo, Israel, Jordan, Lebanon, western Syria, central Turkey and Sudan."),
  utm(37, "saudi-utm37n", "Middle East", "Western Saudi Arabia (Jeddah, Makkah, Madinah, Tabuk), Syria, western Iraq, eastern Turkey and Ethiopia."),
  utm(38, "saudi-utm38n", "Middle East", "Central Saudi Arabia including Riyadh, Kuwait, most of Iraq including Baghdad, western Yemen including Sana'a, Armenia and Georgia."),
  utm(39, "uae-utm39n", "Middle East", "Eastern Saudi Arabia (Dammam, Al Khobar, Jubail), Bahrain, Qatar, the western UAE (Al Dhafra, Ruwais) and much of Iran including Tehran."),
  utm(40, "uae-utm40n", "Middle East", "Abu Dhabi city, Dubai, Sharjah and the northern emirates, Oman including Muscat, and eastern Iran."),
  utm(41, "pakistan-utm41n", "South Asia", "Western Balochistan (Gwadar, Turbat), western Afghanistan (Herat, Kandahar), eastern Turkmenistan and eastern Iran."),
  utm(42, "pakistan-utm42n", "South Asia", "Karachi, Hyderabad, Sukkur, Quetta, Multan and Peshawar, eastern Afghanistan including Kabul, Uzbekistan and the west of Gujarat."),
  utm(43, "pakistan-utm43n", "South Asia", "Lahore, Islamabad, Rawalpindi, Faisalabad and Kashmir; in India, Mumbai, Delhi, Ahmedabad and Bangalore."),
  utm(44, "india-utm44n", "South Asia", "Central India (Nagpur, Hyderabad, Chennai, Lucknow), Sri Lanka and western Nepal."),
  utm(45, "india-utm45n", "South Asia", "Eastern India (Kolkata, Patna, Bhubaneswar), Kathmandu and eastern Nepal, and western Bhutan including Thimphu."),
  {
    slug: "british-national-grid",
    presetId: "uk-osgb36",
    code: 27700,
    name: "British National Grid (OSGB36)",
    aka: ["OS National Grid", "OSGB36", "OSGB 1936", "EPSG 27700"],
    region: "Europe",
    about:
      "The British National Grid is the Ordnance Survey grid used across Great Britain, on the OSGB36 datum and the Airy 1830 ellipsoid. The converter uses the published seven-parameter (Helmert) shift to WGS 84, which is good to about 2 m. The official OSTN15 grid transformation, which is more exact, is not bundled.",
    usedFor: "England, Scotland and Wales: OS mapping, planning drawings, topographic and utility surveys.",
    tip: "For centimetre-level agreement with OS mapping, use OSTN15 or calibrate on local control points.",
  },
  {
    slug: "irish-transverse-mercator",
    presetId: "ireland-itm",
    code: 2157,
    name: "Irish Transverse Mercator (ITM)",
    aka: ["ITM", "IRENET95", "EPSG 2157"],
    region: "Europe",
    about:
      "Irish Transverse Mercator is the national grid for Ireland and Northern Ireland, on the IRENET95 datum (the Irish realisation of ETRS89). It replaced the older Irish Grid for new mapping and is treated as WGS 84 for Google Earth work.",
    usedFor: "Ireland and Northern Ireland: national mapping, planning and engineering surveys.",
    tip: "Drawings on the older Irish Grid (EPSG 29902) need that system instead. Their numbers are much smaller: about 400 km less in easting and 500 km less in northing than ITM.",
  },
  {
    slug: "france-lambert-93",
    presetId: "france-lambert93",
    code: 2154,
    name: "France Lambert-93",
    aka: ["Lambert 93", "RGF93", "EPSG 2154"],
    region: "Europe",
    about:
      "Lambert-93 is the official projection for mainland France, a Lambert conformal conic on the RGF93 datum (the French realisation of ETRS89) with standard parallels at 44°N and 49°N. RGF93 is treated as WGS 84 for Google Earth work.",
    usedFor: "Mainland France and Corsica: cadastre, topographic surveys and public works.",
  },
  {
    slug: "netherlands-rd-new",
    presetId: "netherlands-rdnew",
    code: 28992,
    name: "Netherlands RD New (Amersfoort)",
    aka: ["Rijksdriehoeksmeting", "RD New", "Amersfoort", "EPSG 28992"],
    region: "Europe",
    about:
      "RD New (Rijksdriehoeksmeting) is the Dutch national grid, an oblique stereographic projection centred on Amersfoort on the Bessel 1841 ellipsoid. A published seven-parameter shift takes it to WGS 84.",
    usedFor: "The Netherlands: cadastre (Kadaster), municipal and engineering surveys.",
    tip: "The official RDNAPTRANS™ transformation is more exact than the seven-parameter shift; calibrate on known RD points for sub-metre work.",
  },
  {
    slug: "switzerland-lv95",
    presetId: "switzerland-lv95",
    code: 2056,
    name: "Switzerland LV95 (CH1903+)",
    aka: ["LV95", "CH1903+", "Swiss grid", "EPSG 2056"],
    region: "Europe",
    about:
      "LV95 is the Swiss national grid on the CH1903+ datum, an oblique Mercator projection centred near Bern. Coordinates are easy to recognise: eastings start with 2 and northings with 1 (for example 2 600 000 / 1 200 000 at the origin).",
    usedFor: "Switzerland and Liechtenstein: official surveying and mapping.",
    tip: "Coordinates without the leading 2 and 1 are on the older LV03 grid (EPSG 21781).",
  },
  {
    slug: "singapore-svy21",
    presetId: "singapore-svy21",
    code: 3414,
    name: "Singapore SVY21",
    aka: ["SVY21", "Singapore TM", "EPSG 3414"],
    region: "Asia-Pacific",
    about:
      "SVY21 is Singapore's national coordinate system, a Transverse Mercator projection on the SVY21 datum, which is aligned with WGS 84. It is the reference for Singapore Land Authority cadastral and engineering surveys.",
    usedFor: "Singapore: cadastral, construction and utility surveys.",
  },
  {
    slug: "new-zealand-nztm2000",
    presetId: "nz-nztm2000",
    code: 2193,
    name: "New Zealand NZTM2000",
    aka: ["NZTM", "NZGD2000", "EPSG 2193"],
    region: "Asia-Pacific",
    about:
      "New Zealand Transverse Mercator 2000 is the national projection for mainland New Zealand on the NZGD2000 datum, used by LINZ for topographic mapping and national datasets. NZGD2000 is treated as WGS 84 for Google Earth work.",
    usedFor: "Mainland New Zealand: topographic mapping, GIS and engineering surveys.",
    tip: "Cadastral surveys often use the local meridional circuits (such as Mount Eden 2000) rather than NZTM.",
  },
  {
    slug: "australia-mga-zone-55",
    presetId: "aus-gda2020-55",
    code: 7855,
    name: "Australia MGA Zone 55 (GDA2020)",
    aka: ["MGA2020 zone 55", "GDA2020 / MGA zone 55", "EPSG 7855"],
    region: "Asia-Pacific",
    about:
      "Map Grid of Australia zone 55 covers 144°E to 150°E on the GDA2020 datum, a UTM-based grid in the southern hemisphere. GDA2020 is aligned with WGS 84 closely enough for Google Earth work.",
    usedFor: "Melbourne and most of Victoria, Canberra, Tasmania including Hobart, and western New South Wales.",
    tip: "Older data is often on GDA94 (EPSG 28355); it differs from GDA2020 by about 1.8 m.",
  },
  {
    slug: "australia-mga-zone-56",
    presetId: "aus-gda2020-56",
    code: 7856,
    name: "Australia MGA Zone 56 (GDA2020)",
    aka: ["MGA2020 zone 56", "GDA2020 / MGA zone 56", "EPSG 7856"],
    region: "Asia-Pacific",
    about:
      "Map Grid of Australia zone 56 covers 150°E to 156°E on the GDA2020 datum, a UTM-based grid in the southern hemisphere. GDA2020 is aligned with WGS 84 closely enough for Google Earth work.",
    usedFor: "Sydney, Newcastle and eastern New South Wales, and Brisbane and the Gold Coast in Queensland.",
    tip: "Older data is often on GDA94 (EPSG 28356); it differs from GDA2020 by about 1.8 m.",
  },
  {
    slug: "brazil-sirgas-2000-utm-23s",
    presetId: "brazil-utm23s",
    code: 31983,
    name: "SIRGAS 2000 / UTM Zone 23S",
    aka: ["SIRGAS 2000 UTM 23S", "EPSG 31983"],
    region: "Americas",
    about:
      "SIRGAS 2000 / UTM zone 23S covers 48°W to 42°W in the southern hemisphere on Brazil's official SIRGAS 2000 datum, which is treated as WGS 84 for Google Earth work.",
    usedFor: "São Paulo, Rio de Janeiro, Belo Horizonte and Brasília.",
    tip: "Older Brazilian data may be on SAD69 or Córrego Alegre, which differ from SIRGAS 2000 by tens of metres.",
  },
  {
    slug: "california-state-plane-zone-3",
    presetId: "usa-nad83-ca",
    code: 2227,
    name: "California State Plane Zone 3 (US ft)",
    aka: ["CA State Plane Zone III", "NAD83 California zone 3 ftUS", "EPSG 2227"],
    region: "Americas",
    about:
      "California State Plane Coordinate System zone 3 is a Lambert conformal conic grid on NAD83, in US survey feet. NAD83 is treated as WGS 84 here, which is good to about a metre or two.",
    usedFor: "The San Francisco Bay Area (San Francisco, Oakland, San José) and the central coast and Sierra counties of zone 3.",
    tip: "Check the units: the same zone also exists in metres (EPSG 26943). Feet entered as metres put points hundreds of kilometres away.",
  },
  {
    slug: "texas-central-state-plane",
    presetId: "usa-nad83-tx",
    code: 2277,
    name: "Texas Central State Plane (US ft)",
    aka: ["Texas Central zone 4203", "NAD83 Texas Central ftUS", "EPSG 2277"],
    region: "Americas",
    about:
      "Texas Central (zone 4203) is a Lambert conformal conic State Plane grid on NAD83, in US survey feet. NAD83 is treated as WGS 84 here, which is good to about a metre or two.",
    usedFor: "Central Texas including Austin and Waco.",
    tip: "Houston is in the South Central zone (EPSG 2278) and Dallas–Fort Worth in North Central (EPSG 2276).",
  },
  {
    slug: "new-york-long-island-state-plane",
    presetId: "usa-nad83-nyc",
    code: 32118,
    name: "New York Long Island State Plane (m)",
    aka: ["NY Long Island zone 3104", "NAD83 New York Long Island", "EPSG 32118"],
    region: "Americas",
    about:
      "New York Long Island (zone 3104) is a Lambert conformal conic State Plane grid on NAD83. This page uses the metre version; NAD83 is treated as WGS 84 here, which is good to about a metre or two.",
    usedFor: "New York City's five boroughs and Long Island.",
    tip: "Most New York City work is in US survey feet (EPSG 2263). If your numbers are about 3.28 times larger than expected, pick EPSG 2263 in the grid list.",
  },
];

// A Lo19 (South Africa) page waits on the web/Windows apps handling the Lo grids' west/south axes
export const GRID_REGIONS: GridPage["region"][] = ["Middle East", "South Asia", "Europe", "Asia-Pacific", "Americas", "Africa"];

export const gridBySlug = (slug: string) => GRID_PAGES.find((g) => g.slug === slug);
