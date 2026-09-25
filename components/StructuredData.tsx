import React from "react";

export default function StructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://exceltokml.com";

  // 1. SoftwareApplication Schema (for rich snippet with star rating, price, and download)
  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Excel to KML Pro",
    operatingSystem: "Windows 10, Windows 11 (64-bit)",
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Geographic Information System (GIS)",
    description:
      "Precision survey benchmark converter. Convert Excel (.xlsx) and CSV coordinates into Google Earth 3D KML & KMZ with 6,864 EPSG world grids, local site calibration, and geotagged site inspection balloons. 100% offline and secure.",
    url: baseUrl,
    downloadUrl:
      "https://github.com/chaudaryyabdullah03-collab/kml-convertor/releases/latest/download/ExcelToKMLPro-Lite-Setup.exe",
    screenshot: `${baseUrl}/assets/hero_geospatial.jpg`,
    image: `${baseUrl}/assets/icon-512.png`,
    softwareVersion: "v3.5.5",
    fileSize: "3.14MB",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "348",
      reviewCount: "216",
      bestRating: "5",
      worstRating: "1",
    },
    author: {
      "@type": "Organization",
      name: "Excel to KML Pro Team",
      url: baseUrl,
    },
    featureList: [
      "Batch conversion of Excel and CSV coordinate tables to KML/KMZ",
      "6,864 National and Regional EPSG Coordinate Systems",
      "Helmert 2D Bursa-Wolf Transformation & Site Calibration",
      "Auto-detect Point ID, Easting, Northing, and Elevation",
      "Closed 3D boundary polygon creation with area & perimeter measurement",
      "3D elevation extrusions and altitude anchoring in Google Earth",
      "Geotagged site inspection photos embedded in KMZ balloons",
      "100% local processing with zero cloud data transmission",
    ],
  };

  // 2. WebSite Schema (with SearchAction)
  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Excel to KML Pro",
    url: baseUrl,
    description:
      "Convert survey spreadsheets into Google Earth 3D models with 6,864 EPSG coordinate grids.",
    inLanguage: "en-US",
    publisher: {
      "@type": "Organization",
      name: "Excel to KML Pro",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/assets/icon-512.png`,
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  // 3. FAQPage Schema (for Google search accordion rich snippet)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do I find my regional government map grid in Excel to KML Pro?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can search by country name (like Dubai, Qatar, Pakistan, Saudi Arabia, UK) or standard EPSG number (like EPSG:3997, EPSG:2932, EPSG:32642). If you use AutoCAD Civil 3D, you can type the same drawing zone code. The tool automatically handles the geodetic math so your survey points land in the exact real-world spot on Google Earth.",
        },
      },
      {
        "@type": "Question",
        name: "How does local site calibration work if my project has its own coordinate system?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "If your site uses a local total station grid (such as a 1000, 1000 base), enter 3 or more known government control benchmarks. The software calculates scale correction and True North rotation using Helmert 2D transformation, showing you exact millimeter differences on each mark before exporting to Google Earth.",
        },
      },
      {
        "@type": "Question",
        name: "Can I import raw survey data from total stations without headers?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Field data collectors from Leica, Trimble, Topcon, and Sokkia often export comma-separated numbers without column headers. The importer lets you verify which column is Point ID, Easting, Northing, and Elevation before processing.",
        },
      },
      {
        "@type": "Question",
        name: "Is there a limit on how many survey points I can convert at once?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. The desktop application handles 10,000+ points in under a second. You can paste large Excel sheets or drag in multi-megabyte CSV files containing entire highway traverses, cadastral boundary pegs, or topographic contour grids.",
        },
      },
      {
        "@type": "Question",
        name: "How do 3D elevations and height extrusions display in Google Earth?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can choose to place survey pins directly on ground terrain, or extrude vertical 3D lines rising from the ground up to your measured Z height. This makes slope changes, structure heights, and cut-and-fill depths clearly visible in 3D.",
        },
      },
      {
        "@type": "Question",
        name: "Can I connect points to draw boundary property lines and calculate land area?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. By grouping survey points with feature codes (like BOUNDARY, FENCE, or LOT), the software draws closed 3D polygon outlines in Google Earth and automatically calculates boundary perimeter length and total ground area in square metres and hectares.",
        },
      },
      {
        "@type": "Question",
        name: "Does Excel to KML Pro upload my survey coordinates or site photos to the internet?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. All coordinate parsing, geodetic math, and KML/KMZ packaging runs 100% locally on your PC. No coordinates, client project details, or site photos are ever sent to external cloud servers.",
        },
      },
      {
        "@type": "Question",
        name: "Why does Windows SmartScreen show an unrecognized app prompt on first run?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Windows SmartScreen routinely shows this safety prompt on newly released open-source software that doesn't purchase an expensive commercial code-signing certificate. Click 'More info' and then 'Run anyway'. You can also verify the official SHA-256 binary hash on GitHub.",
        },
      },
    ],
  };

  // 4. HowTo Schema (for Google search 'How to convert Excel to KML' rich snippet)
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Convert Excel and CSV Survey Coordinates into Google Earth KML",
    description:
      "A fast 3-step guide to converting survey spreadsheet coordinates into georeferenced 3D KML and KMZ files for Google Earth Pro.",
    totalTime: "PT1M",
    tool: [
      {
        "@type": "HowToTool",
        name: "Excel to KML Pro",
      },
      {
        "@type": "HowToTool",
        name: "Microsoft Excel or Google Sheets",
      },
      {
        "@type": "HowToTool",
        name: "Google Earth Pro or Google Earth Web",
      },
    ],
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Import Your Spreadsheet",
        text: "Paste rows directly from Excel or drag-and-drop raw CSV files. The software automatically identifies Point ID, Easting, Northing, and Elevation columns.",
        url: `${baseUrl}/#workflow`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Choose Your Coordinate Map Grid",
        text: "Select your country or EPSG coordinate system — such as Dubai DLTM (EPSG:3997), Qatar QNG (EPSG:2932), Pakistan UTM 42N (EPSG:32642), or UK National Grid (EPSG:27700). Geodetic datum transformations calculate automatically.",
        url: `${baseUrl}/#workflow`,
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Export 3D KML or KMZ Deliverable",
        text: "Generate clean 3D placemark files with vertical altitude extrusions and boundary polygons. Double-click to open immediately in Google Earth Pro.",
        url: `${baseUrl}/#download`,
      },
    ],
  };

  // 5. BreadcrumbList Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Web Converter",
        item: `${baseUrl}/app`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "FAQ & Geodetic Guide",
        item: `${baseUrl}/faq`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareApplicationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webSiteSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(howToSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
    </>
  );
}
