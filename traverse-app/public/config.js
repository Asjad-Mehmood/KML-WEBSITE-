// Accounts: on exceltokml.com the app signs in with the website's own accounts, and jobs are
// kept in the website's database (see app/api/traverse/jobs). Opened anywhere else
// (a file on disk, another host) it runs in demo mode, with accounts kept in that browser.
window.APP_CONFIG = {
  backend: /(^|\.)exceltokml\.com$|\.vercel\.app$|^localhost$|^127\.0\.0\.1$/.test(location.hostname) && location.port !== '53817' ? 'site' : 'demo',
  apiBase: '',
  // The app's address is /traverse/app (no trailing slash), one level above sw.js, so the
  // worker is registered for that scope; the website allows it with Service-Worker-Allowed.
  swScope: location.pathname.startsWith('/traverse/app') ? '/traverse/app' : '',
};
