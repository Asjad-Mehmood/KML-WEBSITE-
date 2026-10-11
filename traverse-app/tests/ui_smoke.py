"""End-to-end browser test of the website build (demo account mode)."""
import sys, subprocess, pathlib, threading, http.server, functools, socketserver, time
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests/out'; OUT.mkdir(exist_ok=True)
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
handler = functools.partial(Quiet, directory=str(ROOT / 'dist'))
srv = socketserver.TCPServer(('127.0.0.1', 0), handler); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
import os
URL = os.environ.get('APP_URL') or f'http://127.0.0.1:{port}/'
errs = []
def check(c, m):
    print(('ok   ' if c else 'FAIL ') + m)
    if not c: errs.append(m)
def pdftext(f): return subprocess.run(['pdftotext', '-layout', str(f), '-'], capture_output=True, text=True).stdout
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 1440, 'height': 950}, accept_downloads=True, color_scheme='light')
    pg = ctx.new_page(); cons = []
    pg.on('console', lambda m: cons.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text and 'fonts.g' not in m.text else None)
    pg.on('pageerror', lambda e: cons.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(3600)
    check(pg.is_visible('.hero') and 'Traverse and' in pg.inner_text('.hero'), 'landing page shows hero')
    check(pg.is_visible('#demo-banner'), 'demo banner shown without Supabase keys')
    check(len(pg.inner_text('#clock-time')) == 8, 'clock running: ' + pg.inner_text('#clock-time'))
    pg.screenshot(path=str(OUT / 'landing-light.png'))
    pg.click('#clock-btn'); check(pg.is_visible('#calendar') and pg.locator('.cal-grid .d.t').count() == 1, 'calendar opens with today marked')
    pg.click('#cal-next'); pg.click('body', position={'x': 5, 'y': 600}); check(pg.is_hidden('#calendar'), 'calendar closes')
    pg.goto(URL + '#/dashboard'); pg.wait_for_timeout(200)
    check('#/login' in pg.url, 'private page redirects to login')
    # register Ali
    pg.goto(URL + '#/register'); pg.wait_for_timeout(100)
    pg.fill('#reg-name', 'Ali Raza'); pg.fill('#reg-email', 'ali@site.com'); pg.fill('#reg-pass', 'short'); pg.fill('#reg-pass2', 'short'); pg.click('#register-submit')
    check('8 characters' in pg.inner_text('#register-msg'), 'short password refused')
    pg.fill('#reg-pass', 'Survey2026!'); pg.fill('#reg-pass2', 'Survey2026!'); pg.fill('#reg-company', 'Samsung C&T'); pg.click('#register-submit')
    pg.wait_for_timeout(250)
    check(pg.is_visible('#gold-flash'), 'gold flash shows after login')
    pg.screenshot(path=str(OUT / 'gold-flash.png'))
    pg.wait_for_timeout(2700)
    check(pg.is_hidden('#gold-flash'), 'gold flash ends')
    check('#/dashboard' in pg.url and 'Ali' in pg.inner_text('#dash-hello'), 'dashboard after register')
    check('No saved jobs yet' in pg.inner_text('#job-list'), 'empty dashboard state')
    # traverse: save the example as a job
    pg.click('[data-nav="traverse"]'); pg.wait_for_timeout(200)
    check('Accepted' in pg.inner_text('#t-result'), 'traverse tool works')
    pg.click('#report-details summary'); pg.fill('#t-jobname', 'Al Khor loop 1'); pg.fill('#i-project', 'Al Khor Expressway'); pg.click('#t-save'); pg.wait_for_timeout(300)
    check(pg.inner_text('#t-jobstate').startswith('Saved just now'), 'traverse job saved: ' + pg.inner_text('#t-jobstate'))
    with pg.expect_download() as d: pg.click('#t-pdf')
    d.value.save_as(OUT / 'traverse.pdf'); check('ACCEPTED' in pdftext(OUT / 'traverse.pdf') and 'Al Khor Expressway' in pdftext(OUT / 'traverse.pdf'), 'traverse PDF')
    pg.screenshot(path=str(OUT / 'traverse.png'), full_page=True)
    # level
    pg.click('[data-nav="level"]'); pg.wait_for_timeout(200)
    check('Accepted' in pg.inner_text('#l-result'), 'level tool works')
    pg.fill('#l-jobname', 'BM loop Block A'); pg.click('#l-save'); pg.wait_for_timeout(300)
    with pg.expect_download() as d: pg.click('#l-pdf')
    d.value.save_as(OUT / 'level.pdf'); check('LEVELLING REPORT' in pdftext(OUT / 'level.pdf'), 'level PDF')
    pg.screenshot(path=str(OUT / 'level.png'), full_page=True)
    # offline save then reconnect
    ctx.set_offline(True); pg.wait_for_timeout(200)
    pg.fill('#l-jobname', 'BM loop Block A (offline edit)'); pg.click('#l-save'); pg.wait_for_timeout(300)
    check('will upload when online' in pg.inner_text('#l-jobstate'), 'offline save kept on device: ' + pg.inner_text('#l-jobstate'))
    ctx.set_offline(False); pg.wait_for_timeout(800)
    check('Saved' in pg.inner_text('#l-jobstate') and 'upload' not in pg.inner_text('#l-jobstate'), 'synced when back online: ' + pg.inner_text('#l-jobstate'))
    # dashboard
    pg.click('[data-nav="dashboard"]'); pg.wait_for_timeout(300)
    check(pg.locator('.job').count() == 2, 'dashboard lists 2 jobs')
    check('Accepted' in pg.inner_text('#job-list'), 'status pill shown')
    pg.click('.filters [data-filter="level"]'); check(pg.locator('.job').count() == 1, 'filter works'); pg.click('.filters [data-filter="all"]')
    pg.fill('#job-search', 'loop 1'); pg.wait_for_timeout(50); check(pg.locator('.job').count() == 1, 'search works'); pg.fill('#job-search', '')
    # share traverse job with Sara
    pg.locator('.job', has_text='Al Khor loop 1').locator('[data-act="share"]').click(); pg.wait_for_timeout(200)
    pg.fill('#share-email', 'not-an-email'); pg.click('#share-form button'); check('valid email' in pg.inner_text('#share-msg'), 'share validates email')
    pg.fill('#share-email', 'Sara@Site.com'); pg.click('#share-form button'); pg.wait_for_timeout(300)
    check('sara@site.com' in pg.inner_text('#share-list'), 'shared with sara')
    pg.screenshot(path=str(OUT / 'share.png'))
    pg.click('#share-close')
    pg.locator('.job', has_text='Al Khor loop 1').locator('[data-act="dup"]').click(); pg.wait_for_timeout(200)
    check(pg.locator('.job').count() == 3, 'copy job')
    pg.locator('.job', has_text='(copy)').locator('[data-act="del"]').click(); pg.locator('.job.confirming [data-act="del-yes"]').click(); pg.wait_for_timeout(200)
    check(pg.locator('.job').count() == 2, 'delete job with confirm')
    pg.screenshot(path=str(OUT / 'dashboard.png'), full_page=True)
    # open saved job
    pg.locator('.job', has_text='Al Khor loop 1').locator('[data-act="open"]').click(); pg.wait_for_timeout(200)
    check('#/traverse' in pg.url and pg.input_value('#t-jobname') == 'Al Khor loop 1', 'open saved job')
    # simulator
    pg.click('[data-nav="simulator"]'); pg.wait_for_timeout(300)
    pg.select_option('#sim-speed', '4'); pg.click('#sim-run'); pg.wait_for_timeout(1500)
    pg.screenshot(path=str(OUT / 'simulator-running.png'))
    pg.wait_for_selector('#sim-send', timeout=20000)
    check(pg.locator('#sim-log tbody tr').count() >= 3, 'simulator field book filled')
    pg.screenshot(path=str(OUT / 'simulator.png'), full_page=True)
    pg.click('#sim-send'); pg.wait_for_timeout(300)
    check('#/traverse' in pg.url and ('Accepted' in pg.inner_text('#t-result') or 'Rejected' in pg.inner_text('#t-result')), 'simulator sends to traverse tool')
    # theme toggle
    pg.click('#theme-btn'); check(pg.evaluate("document.documentElement.dataset.theme") == 'dark', 'dark mode toggle')
    pg.goto(URL + '#/dashboard'); pg.wait_for_timeout(300); pg.screenshot(path=str(OUT / 'dashboard-dark.png'), full_page=True)
    pg.goto(URL + '#/'); pg.wait_for_timeout(3600); pg.screenshot(path=str(OUT / 'landing-dark.png'))
    pg.click('#theme-btn')
    # logout, Sara registers and sees the shared job
    pg.click('#avatar-btn'); pg.click('#logout-btn'); pg.wait_for_timeout(300)
    check(not pg.evaluate("document.body.classList.contains('authed')"), 'logged out')
    pg.goto(URL + '#/register'); pg.fill('#reg-name', 'Sara Khan'); pg.fill('#reg-email', 'sara@site.com'); pg.fill('#reg-pass', 'Level2026!'); pg.fill('#reg-pass2', 'Level2026!'); pg.click('#register-submit'); pg.wait_for_timeout(3000)
    check('Al Khor loop 1' in pg.inner_text('#shared-list'), 'Sara sees the shared job')
    pg.click('#shared-list [data-act="open-shared"]'); pg.wait_for_timeout(200)
    check(pg.input_value('#t-jobname') == 'Al Khor loop 1 (copy)', 'Sara opens a copy')
    pg.click('#avatar-btn'); pg.click('#logout-btn'); pg.wait_for_timeout(200)
    # login wrong / right
    pg.goto(URL + '#/login'); pg.fill('#login-email', 'ali@site.com'); pg.fill('#login-pass', 'wrong-pass'); pg.click('#login-submit'); pg.wait_for_timeout(600)
    check('not correct' in pg.inner_text('#login-msg'), 'wrong password refused')
    pg.screenshot(path=str(OUT / 'login.png'))
    pg.fill('#login-pass', 'Survey2026!'); pg.click('#login-submit'); pg.wait_for_timeout(3000)
    check(pg.locator('.job').count() == 2, 'Ali logs back in and sees his jobs')
    # phone
    ph = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2); pp = ph.new_page(); pp.goto(URL); pp.wait_for_timeout(3500)
    check(pp.evaluate('document.documentElement.scrollWidth') <= 390, 'landing fits phone width')
    pp.screenshot(path=str(OUT / 'phone-landing.png'), full_page=True)
    pp.goto(URL + '#/register'); pp.fill('#reg-name', 'Phone User'); pp.fill('#reg-email', 'p@site.com'); pp.fill('#reg-pass', 'Phone2026!'); pp.fill('#reg-pass2', 'Phone2026!'); pp.click('#register-submit'); pp.wait_for_timeout(3000)
    for r in ['dashboard', 'traverse', 'level', 'simulator']:
        pp.goto(URL + '#/' + r); pp.wait_for_timeout(300)
        check(pp.evaluate('document.documentElement.scrollWidth') <= 390, f'{r} fits phone width')
    pp.goto(URL + '#/traverse'); pp.wait_for_timeout(200); pp.screenshot(path=str(OUT / 'phone-traverse.png'), full_page=True)
    check(not cons, 'no console errors ' + '; '.join(cons))
    b.close()
print('FAILURES:', len(errs)); sys.exit(1 if errs else 0)
