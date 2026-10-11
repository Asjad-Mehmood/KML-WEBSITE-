// SupabaseRemote against a fake client: checks the calls and error mapping (no network).
import { test } from 'node:test';
import assert from 'node:assert/strict';
globalThis.window = { APP_CONFIG: { siteUrl: 'https://traverse.example.com/' } };
globalThis.location = { origin: 'http://127.0.0.1:53817', pathname: '/' };
const { SupabaseRemote } = await import('../src/backend.js');

function fake(over = {}) {
  const calls = [];
  const q = table => {
    const b = { table, ops: [] };
    const chain = new Proxy(b, { get: (t, k) => k === 'then' ? (res => res(over[table] || { data: [], error: null })) : (...a) => { calls.push([table, k, ...a]); return chain; } });
    return chain;
  };
  const auth = {
    signUp: async a => { calls.push(['signUp', a]); return over.signUp || { data: { user: { id: 'u1', email: a.email, identities: [{}], user_metadata: a.options.data }, session: null }, error: null }; },
    signInWithPassword: async a => { calls.push(['signIn', a]); return over.signIn || { data: { user: { id: 'u1', email: 'ALI@site.com', user_metadata: { full_name: 'Ali' } } }, error: null }; },
    getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => {}, signOut: async () => {},
    resetPasswordForEmail: async (e, o) => { calls.push(['reset', e, o]); return { error: null }; }, updateUser: async () => ({ error: null }),
  };
  return { client: () => ({ auth, from: q }), calls };
}
test('sign-up asks for email confirmation and uses the website address in the link', async () => {
  const f = fake(); const r = new SupabaseRemote(f.client, 'u', 'k');
  const out = await r.signUp({ email: ' Ali@Site.com ', password: 'x'.repeat(8), name: 'Ali', company: 'C' });
  assert.equal(out.needsConfirm, true);
  assert.equal(f.calls[0][1].email, 'ali@site.com');
  assert.equal(f.calls[0][1].options.emailRedirectTo, 'https://traverse.example.com/');
});
test('already registered email is reported', async () => {
  const f = fake({ signUp: { data: { user: { id: 'u', identities: [] }, session: null }, error: null } });
  await assert.rejects(new SupabaseRemote(f.client, 'u', 'k').signUp({ email: 'a@b.co', password: '12345678', name: 'A' }), /already registered/);
});
test('login maps errors to plain messages and normalises the user', async () => {
  let f = fake({ signIn: { data: {}, error: { message: 'Invalid login credentials', status: 400 } } });
  await assert.rejects(new SupabaseRemote(f.client, 'u', 'k').signIn({ email: 'a@b.co', password: 'x' }), /not correct/);
  f = fake({ signIn: { data: {}, error: { message: 'Email not confirmed', status: 400 } } });
  await assert.rejects(new SupabaseRemote(f.client, 'u', 'k').signIn({ email: 'a@b.co', password: 'x' }), /confirm your email/);
  f = fake(); const u = await new SupabaseRemote(f.client, 'u', 'k').signIn({ email: 'a@b.co', password: 'x' });
  assert.deepEqual(u, { id: 'u1', email: 'ali@site.com', name: 'Ali', company: '' });
});
test('jobs and shares hit the right tables', async () => {
  const f = fake(); const r = new SupabaseRemote(f.client, 'u', 'k'); const user = { id: 'u1', email: 'ali@site.com', name: 'Ali' };
  await r.upsert(user, { id: 'j1', kind: 'traverse', name: 'N', data: {}, summary: {}, updated_at: 't' });
  await r.listOwn(user); await r.listShared(user); await r.share(user, 'j1', 'Sara@Site.com'); await r.unshare(user, 'j1', 'sara@site.com'); await r.remove(user, 'j1');
  const t = f.calls.map(c => c[0] + '.' + c[1]);
  assert.deepEqual(t, ['jobs.upsert', 'jobs.select', 'jobs.eq', 'jobs.select', 'jobs.neq', 'job_shares.insert', 'job_shares.delete', 'job_shares.match', 'jobs.delete', 'jobs.eq']);
  assert.equal(f.calls[0][2].owner, 'u1');
  assert.equal(f.calls[5][2].email, 'sara@site.com');
});
