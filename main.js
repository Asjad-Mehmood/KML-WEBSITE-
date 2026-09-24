/* ==========================================================================
   EXCEL TO KML PRO - INTERACTIVE LOGIC & PLAYGROUND
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavScroll();
  initTabs();
  initFaqAccordion();
  initPlayground();
  initCopyButtons();
  initSampleCsvDownload();
  initScrollReveal();
});

/* --------------------------------------------------------------------------
   Navigation & Scroll Effects
   -------------------------------------------------------------------------- */
function initNavScroll() {
  const nav = document.getElementById('siteNav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });

  const mobileBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');
  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.toggle('show-mobile');
    });

    // Close when clicking any nav link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('show-mobile');
      });
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !mobileBtn.contains(e.target)) {
        navLinks.classList.remove('show-mobile');
      }
    });
  }
}

/* --------------------------------------------------------------------------
   Interactive Tab Switching in Showcase
   -------------------------------------------------------------------------- */
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tab');
      
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
}

/* --------------------------------------------------------------------------
   FAQ Accordion
   -------------------------------------------------------------------------- */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (!questionBtn) return;

    questionBtn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Close all other items
      faqItems.forEach(otherItem => otherItem.classList.remove('active'));

      // Toggle current
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}

/* --------------------------------------------------------------------------
   Interactive Coordinate Playground & Live KML Generator
   -------------------------------------------------------------------------- */
const PRESETS = {
  dubai: {
    name: 'Dubai Marina — DLTM (EPSG:3997)',
    station: 'BM-DUB-01',
    easting: 513556.612,
    northing: 2787467.856,
    elev: 14.85,
    code: 'BENCHMARK',
    lat: 25.193248,
    lon: 55.467835,
    grid: 'EPSG:3997 (Dubai DLTM)',
    accuracy: '< 1m (Direct WGS84 Datum)',
    shift: 'dx: 0.00m, dy: 0.00m'
  },
  london: {
    name: 'London Olympic Park — OSGB36 (EPSG:27700)',
    station: 'TBM-LON-04',
    easting: 538120.000,
    northing: 184510.000,
    elev: 12.30,
    code: 'CORNER-PEG',
    lat: 51.543210,
    lon: -0.012540,
    grid: 'EPSG:27700 (British National Grid)',
    accuracy: '1 to 2m (OSTN15 / 7-Param Shift)',
    shift: 'dx: -48.4m, dy: +12.1m'
  },
  nyc: {
    name: 'New York Central Park — NAD83 (EPSG:32118)',
    station: 'NYC-CTRL-22',
    easting: 298450.000,
    northing: 68420.000,
    elev: 34.20,
    code: 'MONUMENT',
    lat: 40.782865,
    lon: -73.965355,
    grid: 'EPSG:32118 (SPCS NY Long Island)',
    accuracy: '< 1m (NAD83 to WGS84 aligned)',
    shift: 'dx: +0.02m, dy: +0.01m'
  },
  utm40: {
    name: 'Middle East Hub — UTM Zone 40N (EPSG:32640)',
    station: 'UTM-PT-88',
    easting: 350000.000,
    northing: 2790000.000,
    elev: 28.50,
    code: 'BOUNDARY',
    lat: 25.215420,
    lon: 53.512050,
    grid: 'EPSG:32640 (UTM Zone 40 North)',
    accuracy: '< 1m (WGS84 Ellipsoid)',
    shift: 'dx: 0.00m, dy: 0.00m'
  }
};

let currentPresetKey = 'dubai';

function initPlayground() {
  const presetBtns = document.querySelectorAll('.preset-btn');
  const stationInput = document.getElementById('playStation');
  const eastingInput = document.getElementById('playEasting');
  const northingInput = document.getElementById('playNorthing');
  const elevInput = document.getElementById('playElev');
  const codeInput = document.getElementById('playCode');
  const sysSelect = document.getElementById('playSys');

  const outLat = document.getElementById('outLat');
  const outLon = document.getElementById('outLon');
  const outGrid = document.getElementById('outGrid');
  const outAccuracy = document.getElementById('outAccuracy');
  const outShift = document.getElementById('outShift');
  const radarPoint = document.getElementById('radarPoint');
  const downloadKmlBtn = document.getElementById('btnDownloadKml');

  function updateFieldsFromPreset(key) {
    const data = PRESETS[key];
    if (!data) return;
    currentPresetKey = key;

    if (stationInput) stationInput.value = data.station;
    if (eastingInput) eastingInput.value = data.easting;
    if (northingInput) northingInput.value = data.northing;
    if (elevInput) elevInput.value = data.elev;
    if (codeInput) codeInput.value = data.code;
    if (sysSelect) sysSelect.value = key;

    calculateConversion();
  }

  function calculateConversion() {
    const e = parseFloat(eastingInput?.value) || 0;
    const n = parseFloat(northingInput?.value) || 0;
    const preset = PRESETS[currentPresetKey] || PRESETS.dubai;

    // Slight delta adjustment if user edits numbers
    const dE = e - preset.easting;
    const dN = n - preset.northing;

    // Approximate conversion delta in degrees (1 deg lat ~ 111,000m, 1 deg lon ~ 100,000m)
    const computedLat = (preset.lat + (dN / 111320)).toFixed(6);
    const computedLon = (preset.lon + (dE / (111320 * Math.cos(preset.lat * Math.PI / 180)))).toFixed(6);

    if (outLat) outLat.textContent = `${computedLat}° N`;
    if (outLon) outLon.textContent = `${computedLon}° ${parseFloat(computedLon) >= 0 ? 'E' : 'W'}`;
    if (outGrid) outGrid.textContent = preset.grid;
    if (outAccuracy) outAccuracy.textContent = preset.accuracy;
    if (outShift) outShift.textContent = preset.shift;

    // Adjust radar point slightly based on delta
    if (radarPoint) {
      const offsetX = Math.max(-40, Math.min(40, dE / 20));
      const offsetY = Math.max(-40, Math.min(40, -dN / 20));
      radarPoint.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
    }
  }

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const key = btn.getAttribute('data-preset');
      updateFieldsFromPreset(key);
    });
  });

  [eastingInput, northingInput, elevInput, codeInput, stationInput].forEach(inp => {
    if (inp) inp.addEventListener('input', calculateConversion);
  });

  if (sysSelect) {
    sysSelect.addEventListener('change', (e) => {
      const selected = e.target.value;
      presetBtns.forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-preset') === selected);
      });
      updateFieldsFromPreset(selected);
    });
  }

  // Trigger initial
  updateFieldsFromPreset('dubai');

  // Handle Download KML button
  if (downloadKmlBtn) {
    downloadKmlBtn.addEventListener('click', () => {
      generateAndDownloadKml();
    });
  }
}

/* --------------------------------------------------------------------------
   Live Client-Side KML File Generation
   -------------------------------------------------------------------------- */
function generateAndDownloadKml() {
  const station = document.getElementById('playStation')?.value || 'BM-01';
  const easting = document.getElementById('playEasting')?.value || '500000';
  const northing = document.getElementById('playNorthing')?.value || '2700000';
  const elev = document.getElementById('playElev')?.value || '0.00';
  const code = document.getElementById('playCode')?.value || 'BENCHMARK';
  const latStr = document.getElementById('outLat')?.textContent?.replace(/[^0-9.-]/g, '') || '25.193248';
  const lonStr = document.getElementById('outLon')?.textContent?.replace(/[^0-9.-]/g, '') || '55.467835';
  const grid = document.getElementById('outGrid')?.textContent || 'EPSG:3997';

  const nowIso = new Date().toISOString().split('T')[0];

  const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2">
  <Document id="ExcelToKMLPro_Export">
    <name>Survey Benchmark — ${station}</name>
    <description>Generated by Excel to KML Pro (v3.5.1) - Survey Grade Benchmark Converter</description>
    <Style id="benchmarkPin">
      <IconStyle>
        <scale>1.2</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/shapes/target.png</href>
        </Icon>
        <hotSpot x="32" y="32" xunits="pixels" yunits="pixels"/>
      </IconStyle>
      <BalloonStyle>
        <bgColor>ff1a150c</bgColor>
        <textColor>ffffffff</textColor>
        <text><![CDATA[
          <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif; min-width:240px; padding:10px; background:#0B1F2A; color:#ffffff; border-radius:6px;">
            <div style="border-bottom:2px solid #FFD100; padding-bottom:6px; margin-bottom:8px;">
              <h2 style="margin:0; font-size:18px; color:#FFD100;">$[name]</h2>
              <span style="font-size:11px; color:#88A5B2;">Code: <strong>${code}</strong></span>
            </div>
            <table style="width:100%; font-size:12px; border-collapse:collapse; line-height:1.7;">
              <tr><td style="color:#88A5B2;">Easting (X):</td><td style="font-family:monospace; font-weight:bold;">${easting} m</td></tr>
              <tr><td style="color:#88A5B2;">Northing (Y):</td><td style="font-family:monospace; font-weight:bold;">${northing} m</td></tr>
              <tr><td style="color:#88A5B2;">Elevation (Z):</td><td style="font-family:monospace; font-weight:bold; color:#38BDF8;">${elev} m</td></tr>
              <tr><td style="color:#88A5B2;">Grid System:</td><td style="font-family:monospace;">${grid}</td></tr>
              <tr><td style="color:#88A5B2;">Survey Date:</td><td>${nowIso}</td></tr>
            </table>
            <div style="margin-top:10px; padding-top:6px; border-top:1px solid #1E3D4F; font-size:10px; color:#6B8A99;">
              Converted with Excel to KML Pro &bull; 100% Offline
            </div>
          </div>
        ]]></text>
      </BalloonStyle>
    </Style>
    <Placemark>
      <name>${station}</name>
      <styleUrl>#benchmarkPin</styleUrl>
      <description>Point Code: ${code} | Survey Elevation: ${elev}m</description>
      <Point>
        <extrude>1</extrude>
        <altitudeMode>relativeToGround</altitudeMode>
        <coordinates>${lonStr},${latStr},${elev}</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>`;

  const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${station}_benchmark.kml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`✅ Generated & downloaded ${station}_benchmark.kml`);
}

/* --------------------------------------------------------------------------
   Sample CSV Dataset Generator
   -------------------------------------------------------------------------- */
function initSampleCsvDownload() {
  const sampleBtn = document.getElementById('btnDownloadSampleCsv');
  if (!sampleBtn) return;

  sampleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const csvContent = `STATION,EASTING,NORTHING,ELEVATION,CODE,REMARKS
TBM-01,513556.612,2787467.856,14.85,BENCHMARK,Concrete Pillar on Site Boundary
TBM-02,513642.180,2787510.320,15.22,BENCHMARK,Brass Pin in Rock Outcrop
CORNER-NW,513490.100,2787590.450,14.10,BOUNDARY,Perimeter Fence Post NW
CORNER-NE,513720.500,2787610.200,15.40,BOUNDARY,Perimeter Fence Post NE
CORNER-SE,513745.300,2787400.800,16.05,BOUNDARY,Perimeter Fence Post SE
CORNER-SW,513510.800,2787380.150,14.50,BOUNDARY,Perimeter Fence Post SW
TREE-01,513580.400,2787490.000,14.90,TREE,Heritage Date Palm #1
TREE-02,513610.200,2787475.600,15.05,TREE,Heritage Date Palm #2
BLDG-C1,513560.000,2787440.000,15.10,STRUCTURE,Building Column Corner A
BLDG-C2,513620.000,2787440.000,15.15,STRUCTURE,Building Column Corner B
`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Survey_Sample_Coordinates_DLTM.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`📁 Downloaded Survey_Sample_Coordinates_DLTM.csv`);
  });
}

/* --------------------------------------------------------------------------
   Copy Hash / Text to Clipboard
   -------------------------------------------------------------------------- */
function initCopyButtons() {
  const copyHashBtn = document.getElementById('btnCopyHash');
  if (copyHashBtn) {
    copyHashBtn.addEventListener('click', () => {
      const codeEl = document.getElementById('sha256Text');
      if (codeEl) {
        navigator.clipboard.writeText(codeEl.textContent.trim()).then(() => {
          showToast('📋 SHA-256 hash copied to clipboard');
        });
      }
    });
  }
}

/* --------------------------------------------------------------------------
   Toast Notification System
   -------------------------------------------------------------------------- */
function showToast(text) {
  let toast = document.getElementById('siteToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'siteToast';
    toast.className = 'toast-msg';
    document.body.appendChild(toast);
  }

  toast.innerHTML = text;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

/* --------------------------------------------------------------------------
   Scroll Reveal Animations
   -------------------------------------------------------------------------- */
function initScrollReveal() {
  const elements = document.querySelectorAll('.feature-card, .workflow-card, .stat-item, .alt-card, .specs-table-wrapper, .faq-item');
  elements.forEach(el => el.classList.add('reveal-item'));

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -30px 0px'
    });

    elements.forEach(el => observer.observe(el));
  } else {
    elements.forEach(el => el.classList.add('in-view'));
  }
}

