// The free tools at /tools/<slug>. Each page file lives in app/tools/<slug>/.
export type ToolGroup = "Coordinates" | "Measure" | "Survey calculations" | "Convert units";

export interface Tool {
  slug: string;
  /** the name in lists and headings */
  name: string;
  /** the page title (search results) */
  title: string;
  description: string;
  group: ToolGroup;
}

export const TOOL_GROUPS: ToolGroup[] = ["Coordinates", "Measure", "Survey calculations", "Convert units"];

export const TOOLS: Tool[] = [
  {
    slug: "coordinates-on-map",
    name: "Coordinates on a map",
    title: "Find Coordinates on a Map: Latitude, Longitude and UTM",
    description:
      "Click the map, search a place or use your location to get its latitude and longitude, degrees-minutes-seconds, UTM zone and easting/northing, with a Google Maps link.",
    group: "Coordinates",
  },
  {
    slug: "dms-to-decimal",
    name: "DMS ↔ decimal degrees",
    title: "DMS to Decimal Degrees Converter (and Back)",
    description:
      "Convert degrees, minutes and seconds such as 25°11'35\"N to decimal degrees and back — one value or a whole list pasted from Excel.",
    group: "Coordinates",
  },
  {
    slug: "latlong-to-utm",
    name: "Lat/long ↔ UTM",
    title: "Lat Long to UTM Converter (and UTM to Lat Long)",
    description:
      "Convert latitude and longitude to UTM easting, northing and zone on WGS 84, or UTM back to latitude and longitude. The zone is worked out for you.",
    group: "Coordinates",
  },
  {
    slug: "distance-bearing",
    name: "Distance and bearing",
    title: "Distance and Bearing Calculator Between Two Points",
    description:
      "The distance and bearing between two points from latitude and longitude on the WGS 84 ellipsoid, or from eastings and northings on a grid — plus the point at a given bearing and distance.",
    group: "Measure",
  },
  {
    slug: "plot-area",
    name: "Plot area from coordinates",
    title: "Plot Area Calculator from Corner Coordinates",
    description:
      "Paste the corners of a plot as eastings and northings or latitude and longitude and get its area in m², hectares, acres, kanal and marla, with the perimeter.",
    group: "Measure",
  },
  {
    slug: "slope-calculator",
    name: "Slope and gradient",
    title: "Slope Calculator: Percent, Degrees and 1 in N",
    description:
      "Work out a slope from rise and run, or convert between percent grade, degrees and 1 in N — for roads, drains, ramps and roofs.",
    group: "Measure",
  },
  {
    slug: "traverse-adjustment",
    name: "Traverse and level adjustment",
    title: "Traverse Adjustment Calculator: Bowditch, Transit and Least Squares",
    description:
      "Adjust a closed loop or link traverse by Bowditch, Transit or least squares, and close a level run by rise and fall or height of instrument — with misclosures, precision, adjusted coordinates and a printable report.",
    group: "Survey calculations",
  },
  {
    slug: "horizontal-curve",
    name: "Horizontal curve",
    title: "Horizontal Curve Calculator: Tangent Length, Chainages and Setting Out",
    description:
      "Work out a road curve from its radius and deflection angle: tangent length, curve length, long chord, external and mid-ordinate, the TC and CT chainages, and a setting-out table of deflection angles and chords.",
    group: "Survey calculations",
  },
  {
    slug: "area-converter",
    name: "Land area units",
    title: "Land Area Converter: Acre, Hectare, Kanal, Marla, m², ft²",
    description:
      "Convert land and floor areas between square metres, square feet, acres, hectares, kanal, marla, feddan, dunam, guntha and cents.",
    group: "Convert units",
  },
  {
    slug: "length-converter",
    name: "Length units",
    title: "Length Converter for Surveyors: Feet, US Survey Feet, Chains, Metres",
    description:
      "Convert lengths between metres, feet, US survey feet, yards, miles, nautical miles, chains, links, rods, karam and gaz.",
    group: "Convert units",
  },
];

export const toolBySlug = (slug: string) => TOOLS.find((t) => t.slug === slug);
