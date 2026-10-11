// Accounts and saved jobs.
// - SupabaseRemote: real accounts on your website (email + password), jobs in Postgres with row-level security.
// - DemoRemote: used only when config.js has no Supabase keys; same behaviour, stored in this browser.
// - JobStore: per-user cache on the device, so the app works offline and syncs when back online.

const LS = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
};
export const storage = LS;
export const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }));
export const normEmail = e => String(e || '').trim().toLowerCase();
export const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim());
const siteUrl = () => (window.APP_CONFIG && window.APP_CONFIG.siteUrl) || (location.origin + location.pathname);
const isOnline = () => typeof navigator === 'undefined' || navigator.onLine !== false;

export class AuthError extends Error { constructor(msg, code) { super(msg); this.code = code; } }

// ---------------------------------------------------------------- Supabase
export class SupabaseRemote {
  constructor(createClient, url, key) {
    this.kind = 'supabase';
    this.sb = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'sx.sb.auth' } });
  }
  static userFrom(u) { return u && { id: u.id, email: normEmail(u.email), name: (u.user_metadata && u.user_metadata.full_name) || '', company: (u.user_metadata && u.user_metadata.company) || '' }; }
  async session() { const { data } = await this.sb.auth.getSession(); return data.session ? SupabaseRemote.userFrom(data.session.user) : null; }
  onAuth(fn) { this.sb.auth.onAuthStateChange((ev, s) => fn(ev, s ? SupabaseRemote.userFrom(s.user) : null)); }
  async signUp({ email, password, name, company }) {
    const { data, error } = await this.sb.auth.signUp({ email: normEmail(email), password, options: { data: { full_name: name, company }, emailRedirectTo: siteUrl() } });
    if (error) throw new AuthError(error.message, error.status);
    // Supabase returns a user with no identities when the email is already registered
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) throw new AuthError('This email is already registered. Log in instead.', 'exists');
    return { user: data.session ? SupabaseRemote.userFrom(data.session.user) : null, needsConfirm: !data.session };
  }
  async signIn({ email, password }) {
    const { data, error } = await this.sb.auth.signInWithPassword({ email: normEmail(email), password });
    if (error) throw new AuthError(/confirm/i.test(error.message) ? 'Please confirm your email first. Check your inbox for the link.' : /invalid/i.test(error.message) ? 'Email or password is not correct.' : error.message, error.status);
    return SupabaseRemote.userFrom(data.user);
  }
  async signOut() { await this.sb.auth.signOut(); }
  async resetPassword(email) { const { error } = await this.sb.auth.resetPasswordForEmail(normEmail(email), { redirectTo: siteUrl() }); if (error) throw new AuthError(error.message); }
  async setPassword(password) { const { error } = await this.sb.auth.updateUser({ password }); if (error) throw new AuthError(error.message); }
  async listOwn(user) { const { data, error } = await this.sb.from('jobs').select('*').eq('owner', user.id); if (error) throw error; return data; }
  async listShared(user) { const { data, error } = await this.sb.from('jobs').select('*').neq('owner', user.id); if (error) throw error; return data; }
  async upsert(user, job) {
    const row = { id: job.id, owner: user.id, owner_email: user.email, owner_name: user.name, kind: job.kind, name: job.name, data: job.data, summary: job.summary, updated_at: job.updated_at };
    const { error } = await this.sb.from('jobs').upsert(row); if (error) throw error;
  }
  async remove(user, id) { const { error } = await this.sb.from('jobs').delete().eq('id', id); if (error) throw error; }
  async shares(user, id) { const { data, error } = await this.sb.from('job_shares').select('email').eq('job_id', id); if (error) throw error; return data.map(r => r.email); }
  async share(user, id, email) { const { error } = await this.sb.from('job_shares').insert({ job_id: id, email: normEmail(email) }); if (error && !/duplicate/i.test(error.message)) throw error; }
  async unshare(user, id, email) { const { error } = await this.sb.from('job_shares').delete().match({ job_id: id, email: normEmail(email) }); if (error) throw error; }
}

// ---------------------------------------------------------------- Excel to KML website accounts
// On exceltokml.com the app is served from the same site, so the website's sign-in cookie
// carries the session and jobs are kept in the website's database (/api/traverse/jobs).
export class SiteRemote {
  constructor(api = '') { this.kind = 'site'; this.api = api; }
  static userFrom(u) { return u && { id: u.id, email: normEmail(u.email), name: u.name || '', company: u.organization || '' }; }
  async call(method, path, body) {
    let r;
    try {
      r = await fetch(this.api + path, {
        method, credentials: 'include', cache: 'no-store',
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) { throw new AuthError('Could not reach exceltokml.com. Check your connection and try again.', 'network'); }
    let j = {};
    try { j = await r.json(); } catch (e) { /* empty reply */ }
    if (!r.ok) throw new AuthError(j.error || `The server answered ${r.status}.`, r.status);
    return j;
  }
  async session() { const j = await this.call('GET', '/api/auth/me'); return SiteRemote.userFrom(j.user); }
  onAuth() { /* the website has no push events; the session is read at start */ }
  async signUp({ email, password, name, company }) {
    const j = await this.call('POST', '/api/auth/register', { name, email: normEmail(email), password, organization: company || undefined });
    return { user: SiteRemote.userFrom(j.user), needsConfirm: false };
  }
  async signIn({ email, password }) {
    const j = await this.call('POST', '/api/auth/login', { email: normEmail(email), password });
    if (j.otpRequired) throw new AuthError('This account signs in with a code sent by email. Log in on exceltokml.com first, then open the app again.', 'otp');
    return SiteRemote.userFrom(j.user);
  }
  async signOut() { await this.call('POST', '/api/auth/logout'); }
  async resetPassword(email) { await this.call('POST', '/api/auth/forgot-password', { email: normEmail(email) }); }
  async setPassword() { throw new AuthError('Change your password from your account page on exceltokml.com.'); }
  async listOwn() { return (await this.call('GET', '/api/traverse/jobs?scope=own')).jobs || []; }
  async listShared() { return (await this.call('GET', '/api/traverse/jobs?scope=shared')).jobs || []; }
  async upsert(user, job) {
    await this.call('PUT', '/api/traverse/jobs/' + encodeURIComponent(job.id), { kind: job.kind, name: job.name, data: job.data, summary: job.summary, updated_at: job.updated_at });
  }
  async remove(user, id) { await this.call('DELETE', '/api/traverse/jobs/' + encodeURIComponent(id)); }
  async shares(user, id) { return (await this.call('GET', '/api/traverse/jobs/' + encodeURIComponent(id) + '/shares')).emails || []; }
  async share(user, id, email) { await this.call('POST', '/api/traverse/jobs/' + encodeURIComponent(id) + '/shares', { email: normEmail(email) }); }
  async unshare(user, id, email) { await this.call('DELETE', '/api/traverse/jobs/' + encodeURIComponent(id) + '/shares?email=' + encodeURIComponent(normEmail(email))); }
}

// ---------------------------------------------------------------- Demo (this browser only)
async function hash(password, salt) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 120000, hash: 'SHA-256' }, key, 256);
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
}
export class DemoRemote {
  constructor() { this.kind = 'demo'; this.key = 'sx.demo.db'; this.listeners = []; }
  db() { return LS.get(this.key, { users: [], jobs: [], shares: [] }); }
  put(db) { LS.set(this.key, db); }
  async session() { const id = LS.get('sx.demo.session'); const u = id && this.db().users.find(x => x.id === id); return u ? this.pub(u) : null; }
  pub(u) { return { id: u.id, email: u.email, name: u.name, company: u.company }; }
  onAuth(fn) { this.listeners.push(fn); }
  async signUp({ email, password, name, company }) {
    const db = this.db(), e = normEmail(email);
    if (db.users.some(u => u.email === e)) throw new AuthError('This email is already registered. Log in instead.', 'exists');
    const salt = uuid();
    const u = { id: uuid(), email: e, name, company, salt, hash: await hash(password, salt), created_at: new Date().toISOString() };
    db.users.push(u); this.put(db); LS.set('sx.demo.session', u.id);
    return { user: this.pub(u), needsConfirm: false };
  }
  async signIn({ email, password }) {
    const u = this.db().users.find(x => x.email === normEmail(email));
    if (!u || (await hash(password, u.salt)) !== u.hash) throw new AuthError('Email or password is not correct.');
    LS.set('sx.demo.session', u.id); return this.pub(u);
  }
  async signOut() { LS.del('sx.demo.session'); }
  async resetPassword() { throw new AuthError('Password reset by email needs the online account service (Supabase). In demo mode, register again with a new email.'); }
  async setPassword() { throw new AuthError('Not available in demo mode.'); }
  async listOwn(user) { return this.db().jobs.filter(j => j.owner === user.id); }
  async listShared(user) { const db = this.db(); const ids = new Set(db.shares.filter(s => s.email === user.email).map(s => s.job_id)); return db.jobs.filter(j => ids.has(j.id) && j.owner !== user.id); }
  async upsert(user, job) {
    const db = this.db(); const i = db.jobs.findIndex(j => j.id === job.id);
    if (i >= 0 && db.jobs[i].owner !== user.id) throw new Error('Not your job.');
    const row = { id: job.id, owner: user.id, owner_email: user.email, owner_name: user.name, kind: job.kind, name: job.name, data: job.data, summary: job.summary, updated_at: job.updated_at, created_at: i >= 0 ? db.jobs[i].created_at : new Date().toISOString() };
    if (i >= 0) db.jobs[i] = row; else db.jobs.push(row); this.put(db);
  }
  async remove(user, id) { const db = this.db(); db.jobs = db.jobs.filter(j => !(j.id === id && j.owner === user.id)); db.shares = db.shares.filter(s => s.job_id !== id); this.put(db); }
  async shares(user, id) { return this.db().shares.filter(s => s.job_id === id).map(s => s.email); }
  async share(user, id, email) { const db = this.db(); const e = normEmail(email); if (!db.shares.some(s => s.job_id === id && s.email === e)) db.shares.push({ job_id: id, email: e }); this.put(db); }
  async unshare(user, id, email) { const db = this.db(); db.shares = db.shares.filter(s => !(s.job_id === id && s.email === normEmail(email))); this.put(db); }
}

// ---------------------------------------------------------------- device cache + sync
export class JobStore {
  constructor(remote, user) { this.remote = remote; this.user = user; this.key = `sx.jobs.${user.id}`; this.skey = `sx.shared.${user.id}`; this.syncing = null; this.lastSync = LS.get(`sx.lastsync.${user.id}`); }
  all() { return LS.get(this.key, {}); }
  write(m) { LS.set(this.key, m); }
  list() { return Object.values(this.all()).filter(j => !j.deleted).sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || '')); }
  shared() { return LS.get(this.skey, []); }
  get(id) { const j = this.all()[id]; return j && !j.deleted ? j : null; }
  pending() { return Object.values(this.all()).filter(j => j.dirty).length; }
  save(job) {
    const m = this.all();
    const j = { ...job, id: job.id || uuid(), updated_at: new Date().toISOString(), dirty: true, deleted: false };
    m[j.id] = { ...(m[j.id] || {}), ...j }; this.write(m);
    this.sync().catch(() => {});
    return j;
  }
  remove(id) { const m = this.all(); if (!m[id]) return; m[id] = { ...m[id], deleted: true, dirty: true, updated_at: new Date().toISOString() }; this.write(m); this.sync().catch(() => {}); }
  /** Push local changes, then pull the server copy. Safe to call often; offline it does nothing. */
  sync() {
    if (this.syncing) return this.syncing;
    if (!isOnline()) return Promise.resolve(false);
    this.syncing = (async () => {
      try {
        let m = this.all();
        for (const j of Object.values(m)) {
          if (!j.dirty) continue;
          if (j.deleted) { await this.remote.remove(this.user, j.id); delete m[j.id]; }
          else { await this.remote.upsert(this.user, j); m[j.id] = { ...j, dirty: false, synced: true }; }
          this.write(m);
        }
        const remote = await this.remote.listOwn(this.user);
        m = this.all();
        const seen = new Set();
        for (const r of remote) {
          seen.add(r.id);
          const l = m[r.id];
          if (!l || (!l.dirty && (r.updated_at || '') >= (l.updated_at || ''))) m[r.id] = { id: r.id, kind: r.kind, name: r.name, data: r.data, summary: r.summary, updated_at: r.updated_at, dirty: false, synced: true };
        }
        for (const id of Object.keys(m)) if (!seen.has(id) && m[id].synced && !m[id].dirty) delete m[id];   // deleted on another device
        this.write(m);
        const sh = await this.remote.listShared(this.user);
        LS.set(this.skey, sh.map(r => ({ id: r.id, kind: r.kind, name: r.name, data: r.data, summary: r.summary, updated_at: r.updated_at, owner_email: r.owner_email, owner_name: r.owner_name })));
        this.lastSync = new Date().toISOString(); LS.set(`sx.lastsync.${this.user.id}`, this.lastSync);
        if (this.onChange) try { this.onChange(); } catch (e) { /* ignore */ }
        return true;
      } finally { this.syncing = null; }
    })();
    return this.syncing;
  }
}

/** Remember who logged in on this device, so the app opens offline after the first online login. */
export const deviceUser = {
  get() { return LS.get('sx.user'); },
  set(u) { LS.set('sx.user', { ...u, at: new Date().toISOString() }); },
  clear() { LS.del('sx.user'); },
};
