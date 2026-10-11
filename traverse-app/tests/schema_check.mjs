// Checks supabase/schema.sql row-level security in a local Postgres (PGlite) with a minimal auth stub.
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
const db = new PGlite();
await db.exec(`
  create schema auth; create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('email', current_setting('request.jwt.claim.email', true)) $$;
  create role authenticated; grant usage on schema public, auth to authenticated; grant execute on all functions in schema auth to authenticated;
  insert into auth.users values ('11111111-1111-1111-1111-111111111111','ali@site.com'),('22222222-2222-2222-2222-222222222222','sara@site.com'),('33333333-3333-3333-3333-333333333333','omar@site.com');`);
await db.exec(fs.readFileSync('supabase/schema.sql', 'utf8'));
await db.exec(`grant select, insert, update, delete on public.jobs, public.job_shares to authenticated;`);
const as = async (id, email, sql) => { await db.exec(`reset role; set request.jwt.claim.sub = '${id}'; set request.jwt.claim.email = '${email}'; set role authenticated;`); return db.query(sql); };
const A = ['11111111-1111-1111-1111-111111111111', 'ali@site.com'], S = ['22222222-2222-2222-2222-222222222222', 'sara@site.com'], O = ['33333333-3333-3333-3333-333333333333', 'omar@site.com'];
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
await as(...A, `insert into public.jobs (id, owner, kind, name, data) values ('aaaaaaaa-0000-0000-0000-000000000001', auth.uid(), 'traverse', 'Ali loop', '{}')`);
ok((await as(...A, 'select * from public.jobs')).rows.length === 1, 'owner sees own job');
ok((await as(...S, 'select * from public.jobs')).rows.length === 0, 'others cannot see it');
let threw = false; try { await as(...S, `insert into public.jobs (id, owner, kind, name, data) values ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'level', 'fake', '{}')`); } catch { threw = true; }
ok(threw, 'cannot create a job as someone else');
threw = false; try { await as(...S, `insert into public.job_shares values ('aaaaaaaa-0000-0000-0000-000000000001', 'sara@site.com')`); } catch { threw = true; }
ok(threw, 'non-owner cannot share');
await as(...A, `insert into public.job_shares (job_id, email) values ('aaaaaaaa-0000-0000-0000-000000000001', 'sara@site.com')`);
ok((await as(...S, 'select name from public.jobs')).rows.length === 1, 'shared person can read the job');
ok((await as(...O, 'select name from public.jobs')).rows.length === 0, 'third person still cannot');
await as(...S, `update public.jobs set name = 'hacked'`);
ok((await as(...A, 'select name from public.jobs')).rows[0].name === 'Ali loop', 'shared person cannot change it');
await as(...S, `delete from public.jobs`);
ok((await as(...A, 'select * from public.jobs')).rows.length === 1, 'shared person cannot delete it');
ok((await as(...S, 'select * from public.job_shares')).rows.length === 1 && (await as(...O, 'select * from public.job_shares')).rows.length === 0, 'share rows visible only to owner and recipient');
await as(...A, `delete from public.job_shares where email = 'sara@site.com'`);
ok((await as(...S, 'select * from public.jobs')).rows.length === 0, 'unshare removes access');
console.log(fails ? `${fails} FAILED` : 'schema checks passed'); process.exit(fails ? 1 : 0);
