// Professional Traverse and Level Adjustment Software — app shell.
import { SiteRemote, DemoRemote, JobStore, deviceUser, storage, validEmail, normEmail, AuthError } from './backend.js';
import { initTools, openJob, newJob, loadTraverseData, refreshJobStates, recompute } from './tools.js';
import { initSimulator, stopSim } from './simulator.js';
import { $, $$, esc, toast, relTime } from './util.js';

const CFG = window.APP_CONFIG || {};
// On exceltokml.com the app uses the website's own accounts; anywhere else it runs in demo mode.
const remote = CFG.backend === 'site' ? new SiteRemote(CFG.apiBase || '') : new DemoRemote();
let user = null, store = null, recovery = false;
// what the admin allows (Admin → Settings → Traverse & Level); read at sign-in
let allow = { enabled: true, sharing: true, keepFiles: true, message: '' };

// ---------------------------------------------------------------- theme
function currentTheme() { const t = document.documentElement.getAttribute('data-theme'); if (t) return t; return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
function setTheme(t) { document.documentElement.setAttribute('data-theme', t); storage.set('sx.theme', t); themeLabel(); }
function themeLabel() { const dark = currentTheme() === 'dark'; $('#theme-btn').setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode'); $('meta[name="theme-color"]').setAttribute('content', dark ? '#0a1424' : '#0b1a2e'); }

// ---------------------------------------------------------------- clock + calendar
let calMonth = null;
function tickClock() {
  const d = new Date();
  $('#clock-time').textContent = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  $('#clock-date').textContent = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
function drawCalendar() {
  const now = new Date(), y = calMonth.getFullYear(), m = calMonth.getMonth();
  $('#cal-title').textContent = calMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const first = new Date(y, m, 1), startDow = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate(), prevDays = new Date(y, m, 0).getDate();
  let h = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => `<span class="dow">${d}</span>`).join('');
  for (let i = 0; i < 42; i++) {
    const n = i - startDow + 1, inMonth = n >= 1 && n <= days, day = inMonth ? n : n < 1 ? prevDays + n : n - days;
    const isToday = inMonth && y === now.getFullYear() && m === now.getMonth() && n === now.getDate();
    const dow = i % 7, weekend = dow === 4 || dow === 5;   // Friday and Saturday
    h += `<span class="d${inMonth ? '' : ' o'}${isToday ? ' t' : ''}${weekend && inMonth && !isToday ? ' w' : ''}">${day}</span>`;
  }
  $('#cal-grid').innerHTML = h;
}
function toggleCalendar(open) {
  const c = $('#calendar'); const show = open ?? c.hidden;
  if (show) { calMonth = new Date(); calMonth.setDate(1); drawCalendar(); }
  c.hidden = !show; $('#clock-btn').setAttribute('aria-expanded', String(show));
}

// ---------------------------------------------------------------- routing
const PRIVATE = ['dashboard', 'traverse', 'level', 'simulator'];
// Opened as an installed app (the Windows program adds ?app=1; an installed web app runs
// standalone): no front page. Straight to log in, or to the dashboard when already signed in.
const APP_MODE = /[?&]app=1(&|$)/.test(location.search) || matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
function route() {
  const h = location.hash;
  if (/access_token|error_description|type=recovery/.test(h)) return;          // Supabase link being processed
  let r = (h.replace(/^#\/?/, '').split('?')[0] || '').toLowerCase();
  if (recovery && r !== 'newpass') { location.hash = '#/newpass'; return; }
  // no front page: signed out, everything goes to log in (or register / reset); signed in, to the dashboard
  if (!r || r === 'landing') r = user ? 'dashboard' : 'login';
  if (PRIVATE.includes(r) && !user) { storage.set('sx.after', r); location.hash = '#/login'; return; }
  if (['login', 'register'].includes(r) && user) { location.hash = '#/dashboard'; return; }
  const view = user && !allow.enabled && PRIVATE.includes(r) ? 'closed' : r === 'traverse' || r === 'level' ? 'tools' : r;
  if (view === 'closed') $('#closed-msg').textContent = allow.message || 'Please try again later.';
  if (!$(`[data-view="${view}"]`)) { location.hash = user ? '#/dashboard' : '#/login'; return; }
  $$('.view').forEach(v => (v.hidden = v.dataset.view !== view));
  $$('[data-nav]').forEach(a => a.toggleAttribute('aria-current', a.dataset.nav === r) || a.removeAttribute('aria-current'));
  $$('[data-nav]').forEach(a => { if (a.dataset.nav === r) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  if (view === 'tools') { $$('.panel').forEach(p => (p.hidden = p.dataset.panel !== r)); recompute(r); refreshJobStates(); }
  if (view !== 'simulator') stopSim(); else initSimulator(sendToTraverse, logActivity);
  if (view === 'dashboard') renderDashboard();
  document.title = { login: 'Log in · Traverse & Level', register: 'Register · Traverse & Level', dashboard: 'Dashboard · Traverse & Level', tools: (r === 'level' ? 'Levelling' : 'Traverse') + ' · Traverse & Level', simulator: 'Simulator · Traverse & Level' }[view] || 'Traverse & Level';
  window.scrollTo(0, 0);
  ['#calendar', '#user-menu'].forEach(s => ($(s).hidden = true));
}
/** Record what the user did in the website's activity log (signed in only; queued while offline). */
const logActivity = entry => { if (user) remote.log(entry); };
const WHERE = APP_MODE ? (/[?&]app=1(&|$)/.test(location.search) ? 'Windows program' : 'Installed app') : 'Web browser';
function sendToTraverse(trav, name) { loadTraverseData(trav, name); location.hash = '#/traverse'; toast('Simulated traverse loaded. Choose the method and save it as a job.'); }

// ---------------------------------------------------------------- auth
function initials(u) { const s = (u.name || u.email || '?').trim(); const p = s.split(/\s+/); return ((p[0] || '')[0] + ((p[1] || '')[0] || '')).toUpperCase() || '?'; }
function setUser(u, { celebrate = false } = {}) {
  user = u;
  document.body.classList.toggle('authed', !!u);
  if (u) {
    deviceUser.set(u);
    store = new JobStore(remote, u);
    store.onChange = () => { refreshJobStates(); if (!$('[data-view="dashboard"]').hidden) renderDashboard(); };
    $('#avatar-initials').textContent = initials(u);
    $('#menu-name').textContent = u.name || 'Surveyor';
    $('#menu-email').textContent = u.email;
    initTools(u, { store: () => store, log: logActivity, keep: (n, d, m) => { if (allow.keepFiles && remote.keepFile) remote.keepFile(n, d, m); }, onSaved: () => { if (!$('[data-view="dashboard"]').hidden) renderDashboard(); } });
    // once per sitting: the app was opened, and where (Windows program, installed app or browser)
    if (sessionStorage.getItem('tl.opened') !== u.id) {
      try { sessionStorage.setItem('tl.opened', u.id); } catch (e) { /* private mode */ }
      logActivity({ action: 'tl_open', title: `Opened Traverse & Level (${WHERE})`, details: navigator.onLine ? '' : 'Opened offline' });
    } else if (remote.flushLog) remote.flushLog();
    applyAllow();
    store.sync().then(() => { refreshJobStates(); if (!$('[data-view="dashboard"]').hidden) renderDashboard(); }).catch(() => {});
    if (celebrate) goldFlash();
  } else { store = null; }
  netState();
}
/** Read what the admin allows, then show or hide what depends on it. */
async function applyAllow() {
  if (!remote.config) return;
  const was = allow.enabled;
  allow = { ...allow, ...(await remote.config()) };
  document.body.classList.toggle('no-share', !allow.sharing);
  if (was !== allow.enabled || !allow.enabled) route();
}
function goldFlash() {
  const f = $('#gold-flash'); f.hidden = false;
  const brand = $('.brand'); brand.classList.add('shine', 'glow');
  $$('.avatar, .appnav a[aria-current]').forEach(e => e.classList.add('shine'));
  setTimeout(() => { f.hidden = true; brand.classList.remove('glow'); $$('.shine').forEach(e => e.classList.remove('shine')); }, 2600);
}
function msg(id, text, ok = false) { const el = $(id); el.textContent = text || ''; el.classList.toggle('ok', ok); }
function busy(form, on) { $$(`#${form} button[type=submit]`).forEach(b => { b.disabled = on; b.dataset.label ??= b.textContent; b.textContent = on ? 'Please wait…' : b.dataset.label; }); }
function afterLogin() { const to = storage.get('sx.after'); storage.set('sx.after', null); location.hash = '#/' + (to || 'dashboard'); }

async function onLogin(e) {
  e.preventDefault(); msg('#login-msg', '');
  const email = $('#login-email').value, password = $('#login-pass').value;
  if (!validEmail(email)) return msg('#login-msg', 'Enter a valid email address.');
  if (!password) return msg('#login-msg', 'Enter your password.');
  if (remote.kind !== 'demo' && !navigator.onLine) return msg('#login-msg', 'You are offline. Log in once while connected; after that the app opens offline on this device.');
  busy('login-form', true);
  try { const u = await remote.signIn({ email, password }); $('#login-pass').value = ''; setUser(u, { celebrate: true }); afterLogin(); }
  catch (err) { msg('#login-msg', err instanceof AuthError ? err.message : 'Could not log in: ' + err.message); }
  finally { busy('login-form', false); }
}
async function onRegister(e) {
  e.preventDefault(); msg('#register-msg', '');
  const name = $('#reg-name').value.trim(), company = $('#reg-company').value.trim(), email = $('#reg-email').value, p1 = $('#reg-pass').value, p2 = $('#reg-pass2').value;
  if (name.length < 2) return msg('#register-msg', 'Enter your full name.');
  if (!validEmail(email)) return msg('#register-msg', 'Enter a valid email address.');
  if (p1.length < 8) return msg('#register-msg', 'Password must be at least 8 characters.');
  if (p1 !== p2) return msg('#register-msg', 'The two passwords do not match.');
  if (remote.kind !== 'demo' && !navigator.onLine) return msg('#register-msg', 'You are offline. Registration needs an internet connection.');
  busy('register-form', true);
  try {
    const r = await remote.signUp({ email, password: p1, name, company });
    $('#reg-pass').value = $('#reg-pass2').value = '';
    if (r.needsConfirm) { msg('#register-msg', `Account created. We sent a confirmation link to ${normEmail(email)}. Open it, then log in.`, true); return; }
    setUser(r.user, { celebrate: true }); toast(`Welcome, ${name.split(' ')[0]}! Your account is ready.`); afterLogin();
  } catch (err) { msg('#register-msg', err instanceof AuthError ? err.message : 'Could not register: ' + err.message); }
  finally { busy('register-form', false); }
}
async function onReset(e) {
  e.preventDefault(); msg('#reset-msg', '');
  const email = $('#reset-email').value; if (!validEmail(email)) return msg('#reset-msg', 'Enter a valid email address.');
  try { await remote.resetPassword(email); msg('#reset-msg', 'If this email is registered, a reset link is on its way. Check your inbox.', true); }
  catch (err) { msg('#reset-msg', err.message); }
}
async function onNewPass(e) {
  e.preventDefault();
  const p = $('#np-pass').value; if (p.length < 8) return msg('#newpass-msg', 'Password must be at least 8 characters.');
  try { await remote.setPassword(p); recovery = false; msg('#newpass-msg', 'Password saved.', true); const u = await remote.session(); if (u) setUser(u, { celebrate: true }); setTimeout(() => (location.hash = '#/dashboard'), 700); }
  catch (err) { msg('#newpass-msg', err.message); }
}
async function logout() {
  try { if (store) await store.sync(); } catch (e) { /* keep local copy */ }
  if (store && store.pending()) { toast('Some changes are not uploaded yet. Connect to the internet and log in again to upload them.'); }
  try { await remote.signOut(); } catch (e) { /* offline: local sign-out still applies */ }
  deviceUser.clear(); setUser(null); location.hash = '#/login';
}

// ---------------------------------------------------------------- sign in with a code (browser)
let codeTimer = 0, codeRun = 0;
function codeView(on) { $('#login-form').hidden = on; $('#code-card').hidden = !on; if (!on) { clearTimeout(codeTimer); codeRun++; } }
async function startCode() {
  if (!remote.startCode) return msg('#login-msg', 'Not available in demo mode.');
  if (!navigator.onLine) return msg('#login-msg', 'You are offline. Signing in needs an internet connection.');
  codeView(true); msg('#code-msg', 'Getting a code…', true); $('#code-value').textContent = '····-····';
  const run = ++codeRun;
  let c;
  try { c = await remote.startCode(WHERE === 'Web browser' ? 'Traverse & Level' : `Traverse & Level (${WHERE})`); }
  catch (err) { msg('#code-msg', err.message); return; }
  if (run !== codeRun) return;
  const origin = location.origin.includes('localhost') ? location.origin : 'https://www.exceltokml.com';
  const link = `${origin}/link?code=${c.code.replace('-', '')}`;
  $('#code-value').textContent = c.code; $('#code-url').textContent = `${origin.replace(/^https?:\/\/(www\.)?/, '')}/link`; $('#code-copy').dataset.link = link;
  msg('#code-msg', 'Waiting for you to confirm the code in the browser…', true);
  const until = Date.now() + (c.expiresIn || 600) * 1000;
  const tick = async () => {
    if (run !== codeRun) return;
    if (Date.now() > until) { msg('#code-msg', 'The code expired. Press Back, then try again for a new one.'); return; }
    try {
      const r = await remote.pollCode(c.poll);
      if (run !== codeRun) return;
      if (r.user) { codeView(false); setUser(r.user, { celebrate: true }); afterLogin(); return; }
      if (r.state === 'expired') { msg('#code-msg', 'The code expired. Press Back, then try again for a new one.'); return; }
    } catch (err) { /* a network blip: keep trying */ }
    codeTimer = setTimeout(tick, 3000);
  };
  codeTimer = setTimeout(tick, 3000);
}

// ---------------------------------------------------------------- dashboard
const ICON = {
  traverse: '<svg viewBox="0 0 24 24"><path d="M3 19 L8 7 L15 9 L21 17"/><circle cx="8" cy="7" r="1.6"/><circle cx="15" cy="9" r="1.6"/></svg>',
  level: '<svg viewBox="0 0 24 24"><path d="M3 18 H21"/><path d="M7 18 V9 M12 18 V6 M17 18 V11"/></svg>',
};
const STATUS = { accepted: 'Accepted', rejected: 'Rejected', open: 'Open', incomplete: 'Incomplete' };
let filter = 'all', confirmDel = null, shareFor = null;
function figure(j) {
  const s = j.summary || {};
  if (j.kind === 'traverse') return s.status === 'accepted' || s.status === 'rejected' ? `1 : ${(s.ratio || 0).toLocaleString('en-US')}<br>${s.linear} mm` : s.points ? `${s.points} pts` : '';
  return s.mis != null ? `${s.mis} mm<br>± ${s.allow} mm` : s.rows ? `${s.rows} rows` : '';
}
function renderDashboard() {
  if (!user || !store) return;
  const jobs = store.list(), shared = store.shared();
  const first = (user.name || '').split(/\s+/)[0];
  const hr = new Date().getHours();
  $('#dash-hello').textContent = `${hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening'}${first ? ', ' + first : ''}`;
  $('#dash-date').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const pend = store.pending();
  $('#dash-sync').textContent = remote.kind === 'demo' ? 'Demo mode: jobs are kept in this browser.' : pend ? `${pend} change${pend === 1 ? '' : 's'} waiting to upload${navigator.onLine ? '…' : ' (you are offline)'}` : store.lastSync ? `All jobs saved to your account · synced ${relTime(store.lastSync)}` : 'Jobs are saved to your account.';
  const tr = jobs.filter(j => j.kind === 'traverse'), lv = jobs.filter(j => j.kind === 'level');
  const checked = jobs.filter(j => ['accepted', 'rejected'].includes(j.summary?.status)), acc = checked.filter(j => j.summary.status === 'accepted').length;
  $('#kpis').innerHTML = [
    ['Saved jobs', jobs.length, 'traverses and level runs', 'gold'], ['Traverses', tr.length, `${tr.filter(j => j.summary?.status === 'accepted').length} accepted`], ['Level runs', lv.length, `${lv.filter(j => j.summary?.status === 'accepted').length} accepted`],
    ['Pass rate', checked.length ? Math.round(100 * acc / checked.length) + '%' : '–', `${checked.length} checked jobs`], ['Shared with me', shared.length, 'from your team'],
  ].map(([k, v, s, c]) => `<div class="kpi ${c || ''}"><span>${k}</span><b>${v}</b><small>${s}</small></div>`).join('');
  const q = ($('#job-search').value || '').toLowerCase();
  const list = jobs.filter(j => (filter === 'all' || j.kind === filter) && (!q || (j.name + ' ' + (j.summary?.project || '')).toLowerCase().includes(q)));
  $('#job-list').innerHTML = list.length ? list.map(j => {
    const s = j.summary || {}, conf = confirmDel === j.id;
    return `<div class="job${conf ? ' confirming' : ''}" data-id="${j.id}">
      <div class="kind" title="${j.kind === 'traverse' ? 'Traverse' : 'Level run'}">${ICON[j.kind]}</div>
      <div class="meta"><b>${esc(j.name)}<span class="pill ${s.status || 'incomplete'}">${STATUS[s.status] || 'Incomplete'}</span>${j.dirty ? '<span class="pill sync">Not uploaded</span>' : ''}</b>
        <span>${j.kind === 'traverse' ? 'Traverse' : 'Level run'}${s.project ? ' · ' + esc(s.project) : ''} · ${relTime(j.updated_at)}</span></div>
      <div class="fig">${figure(j)}</div>
      <div class="acts">${conf
        ? `<span>Delete this job?</span><button class="btn danger" data-act="del-yes">Delete</button><button class="btn ghost" data-act="del-no">Cancel</button>`
        : `<button class="btn" data-act="open">Open</button><button class="btn ghost" data-act="share">Share</button><button class="btn ghost" data-act="dup">Copy</button><button class="btn ghost" data-act="del" aria-label="Delete ${esc(j.name)}">Delete</button>`}</div></div>`;
  }).join('') : `<div class="empty-state"><svg><use href="#rose"/></svg><b>${jobs.length ? 'No jobs match' : 'No saved jobs yet'}</b>${jobs.length ? 'Try another filter or search.' : 'Open the Traverse or Levelling tool, enter your data and press <b>Save</b>. The job appears here.'}</div>`;
  $('#shared-list').innerHTML = shared.length ? shared.map(j => `<div class="mini" data-sid="${j.id}"><b>${esc(j.name)} <span class="pill ${j.summary?.status || 'incomplete'}">${STATUS[j.summary?.status] || 'Incomplete'}</span></b><span>${j.kind === 'traverse' ? 'Traverse' : 'Level run'} · from ${esc(j.owner_name || j.owner_email || 'a colleague')} · ${relTime(j.updated_at)}</span><button class="btn ghost" data-act="open-shared">Open a copy</button></div>`).join('')
    : `<p class="hint">Nothing yet. When a colleague shares a job with <b>${esc(user.email)}</b>, it appears here.</p>`;
  // activity: jobs saved per day over the last 7 days
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (6 - i)); return d; });
  const counts = days.map(d => jobs.filter(j => { const t = new Date(j.updated_at); return t >= d && t < new Date(d.getTime() + 864e5); }).length);
  const max = Math.max(1, ...counts);
  $('#activity').innerHTML = days.map((d, i) => `<div class="bar-row"><span>${d.toLocaleDateString('en-GB', { weekday: 'short' })}</span><i style="width:${(100 * counts[i]) / max}%"></i><em>${counts[i]}</em></div>`).join('') + '<p class="hint" style="margin:6px 0 0">Jobs saved or edited per day, last 7 days.</p>';
}
async function openShare(id) {
  shareFor = id; const j = store.get(id);
  $('#share-job').textContent = j ? j.name : ''; msg('#share-msg', ''); $('#share-email').value = '';
  $('#share-modal').hidden = false; $('#share-email').focus();
  await drawShares();
}
async function drawShares() {
  const ul = $('#share-list');
  if (!navigator.onLine && remote.kind !== 'demo') { ul.innerHTML = '<li><span>Connect to the internet to see and change sharing.</span></li>'; return; }
  try {
    const j = store.get(shareFor); if (j && j.dirty) await store.sync();
    const list = await remote.shares(user, shareFor);
    ul.innerHTML = list.length ? list.map(e => `<li><span>${esc(e)}</span><button class="btn ghost" data-unshare="${esc(e)}">Remove</button></li>`).join('') : '<li><span>Not shared with anyone yet.</span></li>';
  } catch (e) { ul.innerHTML = `<li><span>Could not load sharing: ${esc(e.message)}</span></li>`; }
}
async function onShare(e) {
  e.preventDefault();
  const email = $('#share-email').value;
  if (!validEmail(email)) return msg('#share-msg', 'Enter a valid email address.');
  if (normEmail(email) === user.email) return msg('#share-msg', 'That is your own email.');
  if (!navigator.onLine && remote.kind !== 'demo') return msg('#share-msg', 'You are offline. Sharing needs an internet connection.');
  try { await store.sync(); await remote.share(user, shareFor, email); $('#share-email').value = ''; msg('#share-msg', `Shared with ${normEmail(email)}.`, true); await drawShares(); }
  catch (err) { msg('#share-msg', 'Could not share: ' + err.message); }
}

// ---------------------------------------------------------------- network state
function netState() {
  const el = $('#net-state'); if (!el) return;
  const on = navigator.onLine !== false;
  el.textContent = remote.kind === 'demo' ? 'Demo mode' : on ? 'Online · saved to your account' : 'Offline · saving on this device';
  el.classList.toggle('off', !on);
}

// ---------------------------------------------------------------- start
function bind() {
  window.addEventListener('hashchange', route);
  $('#theme-btn').addEventListener('click', () => setTheme(currentTheme() === 'dark' ? 'light' : 'dark'));
  $('#clock-btn').addEventListener('click', e => { e.stopPropagation(); toggleCalendar(); });
  $('#cal-prev').addEventListener('click', e => { e.stopPropagation(); calMonth.setMonth(calMonth.getMonth() - 1); drawCalendar(); });
  $('#cal-next').addEventListener('click', e => { e.stopPropagation(); calMonth.setMonth(calMonth.getMonth() + 1); drawCalendar(); });
  $('#cal-today').addEventListener('click', e => { e.stopPropagation(); calMonth = new Date(); calMonth.setDate(1); drawCalendar(); });
  $('#calendar').addEventListener('click', e => e.stopPropagation());
  $('#avatar-btn').addEventListener('click', e => { e.stopPropagation(); const m = $('#user-menu'); m.hidden = !m.hidden; $('#avatar-btn').setAttribute('aria-expanded', String(!m.hidden)); });
  document.addEventListener('click', () => { toggleCalendar(false); $('#user-menu').hidden = true; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { toggleCalendar(false); $('#user-menu').hidden = true; $('#share-modal').hidden = true; } });
  $('#logout-btn').addEventListener('click', logout);
  $('#closed-retry').addEventListener('click', async () => { await applyAllow(); if (allow.enabled) { location.hash = '#/dashboard'; route(); toast('Traverse & Level is open again.'); } else toast('Still closed.'); });
  $('#login-form').addEventListener('submit', onLogin);
  $('#code-start').addEventListener('click', startCode);
  $('#code-cancel').addEventListener('click', () => { codeView(false); msg('#login-msg', ''); });
  $('#code-copy').addEventListener('click', async e => {
    const link = e.currentTarget.dataset.link; if (!link) return;
    try { await navigator.clipboard.writeText(link); toast('Link copied. Paste it in your browser.'); } catch (err) { toast(link); }
  });
  $('#register-form').addEventListener('submit', onRegister);
  $('#reset-form').addEventListener('submit', onReset);
  $('#newpass-form').addEventListener('submit', onNewPass);
  $('#share-form').addEventListener('submit', onShare);
  $('#share-close').addEventListener('click', () => { $('#share-modal').hidden = true; });
  $('#share-modal').addEventListener('click', e => { if (e.target.id === 'share-modal') $('#share-modal').hidden = true; });
  $('#share-list').addEventListener('click', async e => {
    const b = e.target.closest('[data-unshare]'); if (!b) return;
    try { await remote.unshare(user, shareFor, b.dataset.unshare); await drawShares(); } catch (err) { msg('#share-msg', 'Could not remove: ' + err.message); }
  });
  $$('.filters button').forEach(b => b.addEventListener('click', () => { filter = b.dataset.filter; $$('.filters button').forEach(x => x.setAttribute('aria-selected', String(x === b))); renderDashboard(); }));
  $('#job-search').addEventListener('input', renderDashboard);
  $$('[data-new]').forEach(a => a.addEventListener('click', () => newJob(a.dataset.new)));
  $('#job-list').addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const id = b.closest('.job').dataset.id, j = store.get(id); if (!j) return;
    switch (b.dataset.act) {
      case 'open': location.hash = '#/' + openJob(j); break;
      case 'share': openShare(id); break;
      case 'dup': { const c = store.save({ kind: j.kind, name: j.name + ' (copy)', data: j.data, summary: j.summary }); toast(`Copied as "${c.name}".`); renderDashboard(); break; }
      case 'del': confirmDel = id; renderDashboard(); break;
      case 'del-no': confirmDel = null; renderDashboard(); break;
      case 'del-yes': confirmDel = null; store.remove(id); toast(`Deleted "${j.name}".`); renderDashboard(); break;
    }
  });
  $('#shared-list').addEventListener('click', e => {
    const b = e.target.closest('[data-act="open-shared"]'); if (!b) return;
    const j = store.shared().find(x => x.id === b.closest('.mini').dataset.sid); if (!j) return;
    location.hash = '#/' + openJob(j, true); toast('Opened a copy. Press Save to keep it in your own jobs.');
  });
  window.addEventListener('online', () => { netState(); if (user && remote.flushLog) remote.flushLog(); if (store) store.sync().then(() => { refreshJobStates(); if (!$('[data-view="dashboard"]').hidden) renderDashboard(); toast('Back online. Your jobs are synced.'); }).catch(() => {}); });
  window.addEventListener('offline', () => { netState(); toast('You are offline. You can keep working; jobs are saved on this device.'); });
  if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', themeLabel);
}

async function start() {
  bind(); themeLabel(); tickClock(); setInterval(tickClock, 1000);

  $('#demo-banner').hidden = remote.kind !== 'demo';
  if (remote.kind !== 'demo') {
    remote.onAuth((ev, u) => {
      if (ev === 'PASSWORD_RECOVERY') { recovery = true; location.hash = '#/newpass'; }
      if (ev === 'SIGNED_IN' && u && !user) { setUser(u, { celebrate: true }); if (/access_token/.test(location.hash) || !location.hash) location.hash = '#/dashboard'; }
      if (ev === 'SIGNED_OUT' && user && navigator.onLine) { deviceUser.clear(); setUser(null); location.hash = '#/login'; }
    });
  }
  // who is logged in on this device: a live session, or (offline) the last user who logged in here
  let u = null;
  try { u = await remote.session(); } catch (e) { u = null; }
  if (!u && remote.kind !== 'demo' && !navigator.onLine) u = deviceUser.get();
  if (u) setUser(u);
  if (/access_token|type=recovery/.test(location.hash)) setTimeout(() => { if (!recovery) location.hash = user ? '#/dashboard' : '#/login'; }, 1500);
  route();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js', CFG.swScope ? { scope: CFG.swScope } : undefined).catch(() => {});
}
start();
