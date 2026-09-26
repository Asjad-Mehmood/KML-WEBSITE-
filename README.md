# Excel to KML Pro — Web Portal & Geospatial Suite

Official modern web application, interactive coordinate converter, and gated download portal for **Excel to KML Pro** (v3.6.2).

Built with **Next.js 16 (App Router & Turbopack)**, **Tailwind CSS v4 (Apple/Linear-grade White Theme)**, **Prisma ORM**, and **Neon PostgreSQL**.

---

## 🚀 Key Capabilities

- **Modular White Theme UI:** Precision geospatial aesthetics with interactive coordinate presets, radar sweeps, and live download telemetry.
- **Surveyor Authentication & Gated Downloads:** Registered surveyors can download the Windows installer (`.exe`), sample CSV datasets, and test `.kml` files.
- **Embedded Web Application (`/app`):** Run the complete 4MB standalone cadastral converter directly in your browser with full offline projection math, 6,864 EPSG grids, and KMZ photo balloons.
- **Neon PostgreSQL & Prisma Integration:** Ready for Neon cloud database storage with automatic offline fallback so builds never fail.
- **100% Air-Gapped Math:** Client-side geodetic transformations and instantaneous KML/KMZ packaging with zero server egress of survey coordinates.

---

## 🛠️ Project Structure

```
├── kmlconverter/                 # Modern Next.js application
│   ├── app/                      # App router pages & API routes
│   │   ├── page.tsx              # White-theme modular landing page
│   │   ├── app/page.tsx          # Full-screen embedded standalone converter
│   │   ├── login/page.tsx        # Surveyor login portal
│   │   ├── register/page.tsx     # Surveyor registration portal
│   │   └── api/                  # REST endpoints (auth, session, gated downloads, stats)
│   ├── components/               # Modular UI components
│   │   ├── Navbar.tsx            # Sticky navigation with surveyor user badge
│   │   ├── Hero.tsx              # Clean hero with live radar sweep & quick action
│   │   ├── Showcase.tsx          # Interactive coordinate playground with live KML export
│   │   ├── MetricsRibbon.tsx     # Live user and conversion counters
│   │   ├── DownloadHub.tsx       # Gated download cards with auth checks
│   │   ├── Features.tsx          # 6 enterprise grid and calibration pillars
│   │   ├── Workflow.tsx          # 4-step survey processing sequence
│   │   ├── SpecsTable.tsx        # Technical system comparison matrix
│   │   ├── Faq.tsx               # Interactive cadastral surveyor FAQ
│   │   └── AuthModal.tsx         # Instant inline login/register modal
│   ├── context/
│   │   └── AuthContext.tsx       # Surveyor authentication state & session hooks
│   ├── lib/
│   │   ├── db.ts                 # Database layer (Neon PostgreSQL + local fallback)
│   │   └── prisma.ts             # Prisma client connection
│   ├── prisma/
│   │   └── schema.prisma         # Prisma schema for Neon PostgreSQL
│   └── public/                   # Static assets, icons, and app.html
```

---

## 💻 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional for Neon DB)
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Add your Neon connection string:
```env
DATABASE_URL="postgresql://surveyor_owner:YOUR_PASSWORD@ep-sample-pooler.us-east-2.aws.neon.tech/surveyor_db?sslmode=require"
```
*(If no `DATABASE_URL` is provided, the app automatically runs seamlessly using the built-in local store).*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 📜 License
Copyright © 2026 Asjad Mehmood. All rights reserved. This code is private and may not be copied,
changed or redistributed without written permission.
