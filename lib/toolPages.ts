// What each tool's landing page (/tools/<slug>) says about it. The tool itself is at
// /tools/<slug>/use; the worked example on each page is calculated in lib/toolExamples.ts.

export interface ToolPage {
  /** the short line under the heading */
  tagline: string;
  features: { title: string; text: string }[];
  steps: string[];
  audience: string[];
  faqs: { q: string; a: string }[];
}

export const TOOL_PAGES: Record<string, ToolPage> = {
  "coordinates-on-map": {
    tagline: "Point at any spot on Earth and get its exact coordinates — latitude and longitude, degrees-minutes-seconds and UTM — ready to copy or share.",
    features: [
      { title: "Click, search or locate", text: "Click the satellite map, search a place or address, type coordinates in any form, or use your phone's GPS with one button." },
      { title: "Every common format", text: "Decimal degrees, degrees-minutes-seconds and GPS-style degrees and decimal minutes, side by side." },
      { title: "UTM included", text: "The UTM zone, band, easting and northing and the EPSG code, with the zone shaded on the map." },
      { title: "Share it", text: "Open the point in Google Maps or Google Earth, or copy any value with one tap." },
    ],
    steps: [
      "Press Use the tool, then zoom in on the satellite map.",
      "Click the spot — or search a place, type coordinates, or press My location.",
      "Copy the coordinates you need, or open them in Google Maps to share.",
    ],
    audience: [
      "Surveyors checking where a control point or site is before going out",
      "Landowners and buyers sharing the exact location of a plot",
      "Anyone who needs to send an exact meeting point or delivery pin",
    ],
    faqs: [
      { q: "How accurate is My location?", a: "It is whatever your device reports. A phone outdoors with GPS is usually within 5–10 m and the accuracy is shown on the map as a circle; a laptop on Wi-Fi can be hundreds of metres off. It is not survey grade." },
      { q: "Which datum are the coordinates on?", a: "WGS 84 — the same as GPS, Google Maps and Google Earth. The UTM values are WGS 84 UTM (EPSG:326xx north, 327xx south)." },
      { q: "Is my location sent anywhere?", a: "No. The coordinates are worked out in your browser. Only a place search is sent to OpenStreetMap to find the place, and the map pictures come from the map provider." },
      { q: "Can I get coordinates for many points at once?", a: "Use the lat/long ↔ UTM or DMS converters for pasted lists, or the Excel to KML web app for a whole spreadsheet." },
    ],
  },
  "dms-to-decimal": {
    tagline: "Turn 25°11'35.1\"N into 25.193083 — and back — for one point or a whole column pasted from Excel.",
    features: [
      { title: "Both directions", text: "Type either form and get the other: decimal degrees, DMS and GPS-style degrees and decimal minutes." },
      { title: "Reads what you have", text: "25°11'35\"N, 25 11 35 N, N 25°11.585', 25d11m35s or plain decimals — with N, S, E, W or a minus sign." },
      { title: "Whole lists", text: "Paste up to 5,000 lines straight from Excel; lines it can't read are marked, not silently dropped." },
      { title: "Copy back out", text: "Copy the results as decimal or DMS columns, ready to paste back into a spreadsheet." },
    ],
    steps: [
      "Press Use the tool.",
      "Type a latitude and longitude — or switch to A list and paste a column from Excel.",
      "Copy the converted values.",
    ],
    audience: [
      "Surveyors and engineers mixing GPS readings with drawings",
      "GIS users cleaning coordinate columns before importing them",
      "Anyone with coordinates from a document that a map won't accept",
    ],
    faqs: [
      { q: "How do I convert DMS to decimal degrees by hand?", a: "Decimal degrees = degrees + minutes ÷ 60 + seconds ÷ 3600, negative for south and west. 25°11'35.1\"N = 25 + 11/60 + 35.1/3600 = 25.193083." },
      { q: "How many decimal places should I keep?", a: "Six decimal places of a degree is about 0.1 m on the ground, eight about a millimetre. Keep at least six for survey work." },
      { q: "Why does my map put the point in the wrong hemisphere?", a: "South latitudes and west longitudes must be negative in decimal degrees. The tool applies the S and W letters for you." },
      { q: "Can I do this inside Excel?", a: "Yes — the guide 'DMS to decimal degrees in Excel' has formulas for both separate columns and text values." },
    ],
  },
  "latlong-to-utm": {
    tagline: "Convert latitude and longitude to UTM easting, northing and zone on WGS 84 — or UTM back to latitude and longitude. The zone is worked out for you.",
    features: [
      { title: "Zone found automatically", text: "Including the Norway and Svalbard exceptions and the latitude band letter (40R, 43R, 56H…)." },
      { title: "Both directions", text: "Lat/long to UTM and UTM back to lat/long, with range checks that catch a wrong zone or hemisphere." },
      { title: "Lists", text: "Paste a list of points and get eastings and northings for all of them, with a warning when they span several zones." },
      { title: "Millimetre accurate", text: "Checked against the USGS formulas to under a millimetre at places around the world." },
    ],
    steps: [
      "Press Use the tool.",
      "Type a latitude and longitude (decimal or DMS) — or choose UTM → lat/long or A list.",
      "Copy the easting, northing and zone.",
    ],
    audience: [
      "Surveyors setting up a job on a UTM grid",
      "Engineers and contractors reading coordinates off drawings",
      "Drone and GIS operators moving between GPS and grid coordinates",
    ],
    faqs: [
      { q: "What is a UTM zone?", a: "UTM splits the world into 60 zones, each 6° of longitude wide, numbered east from 180°W. Each zone has its own grid with the central meridian at 500,000 m east." },
      { q: "Why do I need the hemisphere?", a: "Northings count up from 0 at the equator in the north and down from 10,000,000 m in the south, so the same numbers exist in both hemispheres." },
      { q: "Is this the same as my national grid?", a: "Only if your country uses WGS 84 UTM. Older grids on ED50, Nahrwan or Clarke 1880 can be hundreds of metres different — use the grid pages for those." },
      { q: "Can I convert into a neighbouring zone?", a: "Yes, for sites that straddle a zone boundary the tool can force the zone either side." },
    ],
  },
  "distance-bearing": {
    tagline: "The distance and bearing between two points — on the curved Earth from latitude and longitude, or on a flat grid from eastings and northings.",
    features: [
      { title: "True distance on the ellipsoid", text: "Vincenty's formulae on WGS 84, accurate to well under a millimetre at any distance." },
      { title: "Grid bearings too", text: "Grid distance, grid bearing, ΔE and ΔN from eastings and northings — with levels, the slope distance and gradient." },
      { title: "Go the other way", text: "From a start point, a bearing and a distance, find the point you reach." },
      { title: "Every unit", text: "Metres, kilometres, feet, miles and nautical miles; bearings in degrees-minutes-seconds and decimal, with the compass point." },
    ],
    steps: [
      "Press Use the tool.",
      "Choose latitude/longitude, grid, or point from bearing and distance.",
      "Type the two points (or start, bearing and distance) and read the answer.",
    ],
    audience: [
      "Surveyors checking a setup, a traverse leg or a setting-out distance",
      "Engineers measuring between control points on a drawing",
      "Pilots, sailors and hikers working out a course and distance",
    ],
    faqs: [
      { q: "Why are there two bearings?", a: "On the curved Earth a straight line's bearing changes along the way, so the tool gives the bearing setting off and the bearing arriving. On a flat grid they're the same." },
      { q: "What is the difference between a true bearing and a grid bearing?", a: "True bearings are measured from true north; grid bearings from grid north. The difference (grid convergence) grows away from the grid's central meridian." },
      { q: "Why doesn't the grid distance match the ground?", a: "A grid stretches distances slightly — up to about 0.04% on UTM. Use the latitude/longitude mode for true ground distances." },
      { q: "How accurate is it?", a: "It reproduces Vincenty's published Flinders Peak–Buninyong example exactly: 54,972.271 m at 306°52'05.37\"." },
    ],
  },
  "plot-area": {
    tagline: "Paste the corners of a plot and get its area in square metres, hectares, acres, kanal and marla — with the perimeter and a sketch to check the shape.",
    features: [
      { title: "Grid or GPS corners", text: "Eastings and northings from a survey, or latitude and longitude from a GPS or Google Maps." },
      { title: "Every land unit", text: "m², hectares, acres, square feet and yards, kanal, marla, feddan and dunam at once." },
      { title: "Ground-true from GPS", text: "Latitude/longitude plots are measured on their UTM zone with the zone's scale taken out, to match a ground survey." },
      { title: "Catches mistakes", text: "A north-up sketch of the plot, and a warning when corners are out of order and sides cross." },
    ],
    steps: [
      "Press Use the tool.",
      "Paste the corners in order round the plot — one per line, with point names if you like.",
      "Read the area in every unit and check the sketch.",
    ],
    audience: [
      "Landowners and buyers checking the area on a document or sale deed",
      "Surveyors and patwaris computing plot areas from a survey",
      "Architects and developers working out plot coverage",
    ],
    faqs: [
      { q: "How is the area calculated?", a: "With the shoelace (surveyor's) formula on the corner coordinates. For latitude/longitude the corners are put on the plot's UTM zone first and the zone's scale factor is removed." },
      { q: "Do the corners need to be in order?", a: "Yes — go round the plot clockwise or anticlockwise. If they aren't, sides cross and the area is wrong; the tool warns you and the sketch shows it." },
      { q: "How many marla in a kanal, and kanal in an acre?", a: "1 kanal = 20 marla, and with the standard 272.25 ft² marla, 8 kanal = 1 acre. Some housing societies use a 225 ft² marla instead." },
      { q: "Can I get the area of a curved boundary?", a: "Add enough corners along the curve; the more points, the closer the area." },
    ],
  },
  "slope-calculator": {
    tagline: "Work out a slope from rise and run or two levels, and convert between percent, degrees and 1 in N — for roads, drains, ramps and roofs.",
    features: [
      { title: "From what you measured", text: "Rise and run, or two levels and the distance between them." },
      { title: "Three ways to write it", text: "Percent grade, angle in degrees and 1 in N, always side by side." },
      { title: "Convert any one", text: "Type a percent, an angle or a 1 in N and get the other two." },
      { title: "Slope length", text: "The length along the slope, and whether it rises or falls." },
    ],
    steps: [
      "Press Use the tool.",
      "Type the rise and run, two levels and a distance, or a slope to convert.",
      "Read the slope as percent, degrees and 1 in N.",
    ],
    audience: [
      "Site engineers setting drain and pipe falls",
      "Builders and architects checking ramps and roofs",
      "Road and earthworks crews checking crossfall and batters",
    ],
    faqs: [
      { q: "How do I work out a slope percentage?", a: "Rise ÷ run × 100. A 1.5 m rise over 60 m is 2.5%." },
      { q: "How do I convert percent to degrees?", a: "Degrees = arctan(percent ÷ 100). 100% is 45°, 10% is about 5.71°." },
      { q: "What does 1 in 12 mean?", a: "One unit up for every 12 along — 8.33%, about 4.76°. It is a common maximum for wheelchair ramps." },
      { q: "What fall does a drain need?", a: "Often about 1 in 40 to 1 in 80 for a 100 mm foul drain, but always follow the code or specification for your job." },
    ],
  },
  "area-converter": {
    tagline: "Convert land and floor areas between m², ft², acres, hectares, kanal, marla, feddan, dunam, guntha and cents — type once, see every unit.",
    features: [
      { title: "Local land units", text: "Kanal and marla (Pakistan, Punjab), feddan (Egypt, Sudan), dunam (Levant, Iraq, Turkey), guntha and cent (India)." },
      { title: "Both marlas", text: "The standard 272.25 ft² marla and the 225 ft² marla many housing societies use." },
      { title: "Every unit at once", text: "Type a value once and see it in all 15 units, each with a copy button." },
      { title: "No guesswork", text: "Units whose size changes from region to region, like the bigha, are left out rather than given a wrong value." },
    ],
    steps: [
      "Press Use the tool.",
      "Type the area and choose its unit.",
      "Read it in every other unit, and copy the one you need.",
    ],
    audience: [
      "Landowners, buyers and agents comparing plot sizes",
      "Surveyors and patwaris converting land records",
      "Anyone reading an area in a unit they don't use",
    ],
    faqs: [
      { q: "How many square feet in a marla?", a: "The standard marla is 272.25 ft² (about 25.29 m²). Many housing societies use a 225 ft² marla — check which one your document means." },
      { q: "How many kanal in an acre?", a: "8 kanal, with the standard marla: 1 acre = 43,560 ft² = 8 × 5,445 ft²." },
      { q: "How big is a feddan?", a: "4,200.83 m² — about 1.04 acres." },
      { q: "Why isn't the bigha listed?", a: "A bigha is a different size in different states and districts, so any single value would be wrong in many places." },
    ],
  },
  "length-converter": {
    tagline: "Convert lengths between metres, feet, US survey feet, chains, links, rods, karam, gaz, miles and nautical miles — type once, see every unit.",
    features: [
      { title: "US survey foot", text: "Kept apart from the international foot — 2 parts per million matters on large state plane coordinates." },
      { title: "Old survey units", text: "Gunter's chain, link and rod from old deeds and plans." },
      { title: "Local units", text: "Karam and gaz from land records in Pakistan and Indian Punjab." },
      { title: "Every unit at once", text: "Type once and see all 15 units, each with a copy button." },
    ],
    steps: [
      "Press Use the tool.",
      "Type the length and choose its unit.",
      "Read it in every other unit, and copy the one you need.",
    ],
    audience: [
      "Surveyors reading old plans in chains and links",
      "Engineers working with US state plane coordinates",
      "Anyone converting land record measurements",
    ],
    faqs: [
      { q: "What is the difference between a foot and a US survey foot?", a: "The international foot is exactly 0.3048 m; the US survey foot is 1200/3937 m, about 2 parts per million longer — around 1 m on a 10-million-foot northing." },
      { q: "How long is a chain?", a: "Gunter's chain is 66 ft (20.1168 m), made of 100 links. 80 chains make a mile and 10 square chains an acre." },
      { q: "How long is a karam?", a: "5.5 ft (1.6764 m), as used in land records in Pakistan and Indian Punjab." },
      { q: "How long is a gaz?", a: "A yard, 0.9144 m, as used in South Asia today." },
    ],
  },
};
