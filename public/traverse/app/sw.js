// Offline support: keeps the app files on the device so it opens without internet after the first visit.
const CACHE = 'tl-app-mx0gxunu';
const CORE = ['./', './index.html', './styles.css', './app.js', './config.js', './vendor/pdf.js', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.hostname.endsWith('supabase.co') || url.hostname.endsWith('supabase.in')) return;   // account data: always live
  if (url.origin === location.origin && url.pathname.startsWith('/api/')) return;            // website accounts and jobs: always live
  if (url.origin === location.origin) {
    // app files: network first (fresh after an update), cache when offline
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r; })
      .catch(() => caches.match(req).then(m => m || caches.match('./index.html'))));
    return;
  }
});
