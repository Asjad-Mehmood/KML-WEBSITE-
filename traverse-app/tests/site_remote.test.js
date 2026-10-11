// SiteRemote against a fake fetch: checks the website endpoints it calls and the error mapping (no network).
import { test } from 'node:test';
import assert from 'node:assert/strict';
globalThis.window = { APP_CONFIG: {} };
globalThis.location = { origin: 'https://www.exceltokml.com', pathname: '/traverse/app/' };
const { SiteRemote, AuthError } = await import('../src/backend.js');

function fakeFetch(replies) {
  const calls = [];
  globalThis.fetch = async (url, opt = {}) => {
    calls.push({ url, method: opt.method, body: opt.body ? JSON.parse(opt.body) : undefined, credentials: opt.credentials });
    const r = replies.shift() || { status: 200, body: {} };
    return { ok: r.status < 400, status: r.status, json: async () => r.body };
  };
  return calls;
}

test('session reads the website user', async () => {
  fakeFetch([{ status: 200, body: { user: { id: 'u1', email: 'A@B.com', name: 'Ali', organization: 'Co' } } }]);
  assert.deepEqual(await new SiteRemote().session(), { id: 'u1', email: 'a@b.com', name: 'Ali', company: 'Co' });
});

test('signed out is null', async () => {
  fakeFetch([{ status: 200, body: { user: null } }]);
  assert.equal(await new SiteRemote().session(), null);
});

test('sign in and sign up call the website auth endpoints with cookies', async () => {
  const calls = fakeFetch([{ status: 200, body: { user: { id: 'u1', email: 'a@b.com', name: 'Ali' } } }, { status: 200, body: { user: { id: 'u2', email: 'c@d.com', name: 'Sara' } } }]);
  const r = new SiteRemote();
  await r.signIn({ email: ' A@B.com ', password: 'secret12' });
  const up = await r.signUp({ email: 'c@d.com', password: 'secret12', name: 'Sara', company: 'Firm' });
  assert.equal(calls[0].url, '/api/auth/login'); assert.equal(calls[0].body.email, 'a@b.com'); assert.equal(calls[0].credentials, 'include');
  assert.equal(calls[1].url, '/api/auth/register'); assert.equal(calls[1].body.organization, 'Firm');
  assert.equal(up.needsConfirm, false); assert.equal(up.user.id, 'u2');
});

test('server errors become AuthError with the server message', async () => {
  fakeFetch([{ status: 401, body: { error: 'Invalid email or password.' } }]);
  await assert.rejects(new SiteRemote().signIn({ email: 'a@b.com', password: 'x' }), e => e instanceof AuthError && /Invalid email/.test(e.message));
});

test('admin accounts that need an emailed code are sent to the website', async () => {
  fakeFetch([{ status: 200, body: { otpRequired: true } }]);
  await assert.rejects(new SiteRemote().signIn({ email: 'a@b.com', password: 'x' }), /code sent by email/);
});

test('jobs and sharing use /api/traverse/jobs', async () => {
  const calls = fakeFetch([
    { status: 200, body: { jobs: [{ id: 'j1' }] } }, { status: 200, body: { jobs: [] } }, { status: 200, body: {} },
    { status: 200, body: {} }, { status: 200, body: { emails: ['x@y.com'] } }, { status: 200, body: {} }, { status: 200, body: {} },
  ]);
  const r = new SiteRemote(), u = { id: 'u1' };
  assert.deepEqual(await r.listOwn(u), [{ id: 'j1' }]);
  assert.deepEqual(await r.listShared(u), []);
  await r.upsert(u, { id: 'j-1234567', kind: 'traverse', name: 'T1', data: { a: 1 }, summary: { status: 'accepted' }, updated_at: '2026-10-11T00:00:00Z' });
  await r.remove(u, 'j-1234567');
  assert.deepEqual(await r.shares(u, 'j-1234567'), ['x@y.com']);
  await r.share(u, 'j-1234567', 'X@Y.com'); await r.unshare(u, 'j-1234567', 'x@y.com');
  assert.deepEqual(calls.map(c => c.method + ' ' + c.url), [
    'GET /api/traverse/jobs?scope=own', 'GET /api/traverse/jobs?scope=shared', 'PUT /api/traverse/jobs/j-1234567',
    'DELETE /api/traverse/jobs/j-1234567', 'GET /api/traverse/jobs/j-1234567/shares', 'POST /api/traverse/jobs/j-1234567/shares',
    'DELETE /api/traverse/jobs/j-1234567/shares?email=x%40y.com']);
  assert.equal(calls[2].body.name, 'T1'); assert.equal(calls[5].body.email, 'x@y.com');
});

test('offline gives a clear message', async () => {
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(new SiteRemote().session(), /Could not reach exceltokml.com/);
});
