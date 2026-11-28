// Phase 1 acceptance checks -> reports/phase1/p1_checks.json
// CHROMIUM_PATH=... node reports/phase1/p1_checks.cjs [port]   (Range-capable static server on 127.0.0.1)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BASE = 'http://127.0.0.1:' + (process.argv[2] || '8778') + '/academy.html';
const R = {}, fails = [];
const ok = (id, cond, detail) => { R[id] = { pass: !!cond, detail }; if (!cond) fails.push(id); };

async function learner(b, vp, returning) {
  const c = await b.newContext({ viewport: vp, serviceWorkers: 'block' });
  await c.route(/cloudflareinsights|ytimg|youtube/, r => r.abort());
  const p = await c.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  // count every device-voice attempt
  await p.addInitScript(() => { window.__ttsCalls = 0; const s = window.speechSynthesis; if (s) { const o = s.speak.bind(s); s.speak = u => { window.__ttsCalls++; return o(u); }; } });
  await p.goto(BASE); await sleep(1500); await p.click('#welcomeStart'); await sleep(900);
  if (returning) await p.evaluate(() => { S.profile.name = 'Abdirashid Abi'; for (let i = 1; i <= 3; i++) S.completed['L' + i] = { score: 90, date: todayStr() };
    S.citizenship = { v: 1, edition: '2025', civ: { '2025': { known: Object.fromEntries(Array.from({ length: 24 }, (_, i) => [i + 1, 1])), seen: {}, mocks: [] } } }; return save(); });
  await p.reload(); await sleep(1500);
  await p.evaluate(() => { setNav('home'); render(); }); await sleep(300);
  return [c, p];
}
const home = p => p.evaluate(() => { window.__seaGo('home'); });
const txt = (p, s) => p.locator(s).first().innerText();
const small = p => p.evaluate(() => [...document.querySelectorAll('#app button, #app summary, .topbar button, #mainNav button')].filter(e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width && r.height && cs.visibility !== 'hidden' && !e.closest('details:not([open]) > :not(summary)'); })
  .map(e => { const r = e.getBoundingClientRect(); return { id: e.id || e.className || e.tagName, text: (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) }; }).filter(x => x.w < 44 || x.h < 44));

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const bank = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'civics-2025.json'), 'utf8')).questions;
  const bank08 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'civics-2008.json'), 'utf8')).questions;
  const allLines = [...bank, ...bank08].flatMap(x => [x.q, ...x.answers, x.explain_so]).filter(t => t && t.trim());
  const visible = (p, sel) => p.evaluate(sel => { const e = document.querySelector(sel); if (!e) return false; const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0; }, sel);
  for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
    const tag = vp.width + 'px';
    let [c, p] = await learner(b, vp, true);
    // Screen 1
    ok(tag + ' home.greeting', (await txt(p, '.p1-greet h1')) === 'Salaan, Abdirashid.', await txt(p, '.p1-greet h1'));
    ok(tag + ' home.ring', (await txt(p, '.p1-ring b')) === '24' && (await p.getAttribute('.p1-ring', 'aria-label')) === '24 / 128', await p.getAttribute('.p1-ring', 'aria-label'));
    ok(tag + ' home.journey', (await p.locator('.p1-steps .is-now').count()) === 1 && /Baro/.test(await txt(p, '.p1-steps .is-now')), await txt(p, '.p1-steps .is-now'));
    const navs = await p.locator('#mainNav button:visible').allInnerTexts();
    ok(tag + ' nav.destinations', ['Hoyga', 'Casharro', 'Jinsiyadda', 'Ku celceli', 'Qaamuus', 'Wax kale'].every((n, i) => navs[i] === n), navs);
    if (vp.width === 390) {
      // the real image pack, every photo/illustration decoded
      const imgs = await p.evaluate(async () => { const l = [...document.querySelectorAll('.p1-home .p1-art img')]; await Promise.all(l.map(i => i.decode().catch(() => {}))); return { n: l.length, svg: document.querySelectorAll('.p1-art svg').length, srcs: l.map(i => i.getAttribute('src')), ok: l.every(i => i.complete && i.naturalWidth > 0) }; });
      ok(tag + ' polish.images.home', imgs.n === 5 && !imgs.svg && imgs.ok && imgs.srcs.every(x => x.startsWith('phase1-images/')) && imgs.srcs[0].endsWith('hero-capitol.jpg') && imgs.srcs.slice(1).every(x => /card-.*\.webp$/.test(x)), imgs);
      // text-size control and profile chip are visibly different
      const look = await p.evaluate(() => ['#p1Size', '#p1Me'].map(s => { const cs = getComputedStyle(document.querySelector(s)); return { radius: cs.borderTopLeftRadius, bg: cs.backgroundColor, color: cs.color, w: cs.width }; }));
      ok(tag + ' polish.header.aaVsProfileDistinct', look[0].radius !== look[1].radius && look[0].bg !== look[1].bg && look[0].color !== look[1].color, look);
    }
    ok(tag + ' nav.profile', await p.locator('[data-view="profile"]:visible').count() === 1, vp.width < 1024 ? 'header chip' : 'rail chip');
    ok(tag + ' home.targets>=44', !(await small(p)).length, await small(p));
    const h1a = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.p1-greet h1')).fontSize)), pa = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.p1-greet p')).fontSize));
    await p.click('#p1Size'); await sleep(200);
    const h1b = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.p1-greet h1')).fontSize)), pb = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.p1-greet p')).fontSize));
    const scroll = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    ok(tag + ' aa.scales', h1b > h1a && pb > pa && (await p.getAttribute('#p1Size', 'aria-pressed')) === 'true' && scroll, { h1: [h1a, h1b], p: [pa, pb], noHorizontalScroll: scroll });
    await p.click('#p1Size'); await sleep(200);
    await p.click('[data-lang="en"]'); await sleep(200);
    ok(tag + ' lang.toggle', (await txt(p, '.p1-greet h1')) === 'Hello, Abdirashid.' && (await p.getAttribute('[data-lang="en"]', 'aria-pressed')) === 'true', await txt(p, '.p1-greet h1'));
    await p.click('[data-lang="so"]'); await sleep(200);
    for (const [id, want] of [['academyContinue', () => view === 'lesson' && cur.n === 4], ['p1Talk', () => view === 'practice'], ['p1Forms', () => view === 'acad' && acadTab === 'forms'], ['p1Ged', () => view === 'acad' && acadTab === 'ged'], ['p1Watch', () => view === 'watch'], ['p1Dict', () => view === 'dict']]) {
      await home(p); await sleep(250); await p.click('#' + id); await sleep(500);
      ok(tag + ' home.route.' + id, await p.evaluate(want), await p.evaluate(() => view));
    }
    await home(p); await sleep(250); await p.click('#p1Tutor'); await sleep(600);
    ok(tag + ' home.route.p1Tutor', await p.evaluate(() => view === 'lesson' && !!document.getElementById('academyTutor') && document.getElementById('academyTutor').open), await p.evaluate(() => view));
    // hero CTA -> focused practice on the next unlearned question (1-24 known -> 25)
    await home(p); await sleep(250); await p.click('#p1Today'); await sleep(1400);
    ok(tag + ' home.cta.resumes', await p.evaluate(() => view === 'cit' && !!document.querySelector('.p1-q') && document.querySelector('.p1-q').dataset.n === '25'), await p.evaluate(() => document.querySelector('.p1-q') && document.querySelector('.p1-q').dataset.n));
    // Screen 3
    ok(tag + ' practice.segments', (await p.locator('.p1-seg li').count()) === 5 && (await txt(p, '.p1-count')) === 'Su’aasha 1', await txt(p, '.p1-count'));
    const q = bank.find(x => x.n === 25);
    ok(tag + ' practice.question', (await txt(p, '.p1-qtext')) === q.q && (await txt(p, '.p1-cat')).toLowerCase() === 'nidaamka dowladda', await txt(p, '.p1-cat'));
    ok(tag + ' practice.answer.hidden', (await p.locator('.p1-answer').count()) === 0 && (await p.locator('#czShow').count()) === 1);
    ok(tag + ' practice.targets>=44', !(await small(p)).length, await small(p));
    // focus mode: no global header or nav during a session, only the session header
    ok(tag + ' polish.focus.noGlobalChrome', !(await visible(p, '.topbar')) && !(await visible(p, '#mainNav')) && await visible(p, '#czBack') && await visible(p, '.p1-count') && await visible(p, '.p1-seg'));
    const rv = await p.evaluate(() => { const cs = getComputedStyle(document.getElementById('czShow')); return { border: cs.borderTopStyle, bg: cs.backgroundColor }; });
    ok(tag + ' polish.reveal.solidCard', rv.border !== 'dashed' && rv.bg !== 'rgba(0, 0, 0, 0)', rv);
    // real-audio rule: every line of both banks has a registered clip, and no Listen control is greyed out
    await p.waitForFunction(() => _audioReg.loaded || _audioReg.failed, null, { timeout: 15000 });
    if (vp.width === 390) {
      const missing = await p.evaluate(lines => lines.filter(t => !lookupAudioClip(t)), allLines);
      ok('audio.allLinesRegistered', !missing.length, { lines: allLines.length, missing: missing.length, sample: missing.slice(0, 5) });
    }
    ok(tag + ' audio.question.noMissingState', (await p.locator('.p1-listen.is-missing, .p1-listen[aria-disabled="true"]').count()) === 0 && (await p.locator('.p1-listen-note').count()) === 0);
    await p.click('.p1-listen:not(.is-small)');
    const t0 = Date.now(); await p.waitForFunction(() => !!window.__audioRegistry.lastRoute, null, { timeout: 6000 }).catch(() => {});  // first play fetches a new bundle range
    R[tag + ' audio.questionClipPlays.ms'] = { pass: true, detail: Date.now() - t0 };
    ok(tag + ' audio.questionClipPlays', await p.evaluate(() => ['media', 'webaudio'].includes(window.__audioRegistry.lastRoute) && window.__audioRegistry.lastPlayed && window.__ttsCalls === 0), await p.evaluate(() => ({ route: window.__audioRegistry.lastRoute, tts: window.__ttsCalls })));
    await p.click('#czShow'); await sleep(300);
    const ans = await txt(p, '.p1-answer');
    ok(tag + ' audio.answer.noMissingState', (await p.locator('.p1-answer .p1-listen').count()) >= 2 && (await p.locator('.p1-listen.is-missing, .p1-listen[aria-disabled="true"], .p1-listen-note').count()) === 0);
    const played = [];
    for (const btn of await p.locator('.p1-answer .p1-listen').all()) { await p.evaluate(() => { window.__audioRegistry.lastPlayed = null; }); await btn.click(); await sleep(700); played.push(await p.evaluate(() => !!window.__audioRegistry.lastPlayed && ['media', 'webaudio'].includes(window.__audioRegistry.lastRoute))); }
    ok(tag + ' audio.answerClipsPlay', played.length && played.every(Boolean) && (await p.evaluate(() => window.__ttsCalls)) === 0, played);
    const know = await p.evaluate(() => { const b = document.getElementById('czKnow'); b.scrollIntoView({ block: 'end' }); const r = b.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.bottom - 4); return { bottom: Math.round(r.bottom), vh: innerHeight, hitsButton: !!hit && b.contains(hit) }; });
    ok(tag + ' polish.know.unobscured', know.hitsButton && know.bottom <= know.vh, know);
    ok(tag + ' practice.answer.verbatim', ans.includes(q.answers[0]) && ans.includes(q.explain_so) && /Jawaabta/i.test(ans), q.answers[0]);
    await p.click('#czKnow'); await sleep(300);
    ok(tag + ' practice.know.saves', await p.evaluate(() => S.citizenship.civ['2025'].known[25] === 1) && (await txt(p, '.p1-count')) === 'Su’aasha 2', await txt(p, '.p1-count'));
    await p.click('#czShow'); await sleep(200); await p.click('#czAgain'); await sleep(300);
    ok(tag + ' practice.stilllearning.keeps', await p.evaluate(() => !S.citizenship.civ['2025'].known[26]) && (await txt(p, '.p1-count')) === 'Su’aasha 3');
    await p.click('#czNext'); await sleep(200);
    ok(tag + ' practice.next.advances', (await txt(p, '.p1-count')) === 'Su’aasha 4' && await p.evaluate(() => !S.citizenship.civ['2025'].known[27]));
    for (let i = 0; i < 2; i++) { await p.click('#czShow'); await sleep(150); await p.click('#czKnow'); await sleep(250); }
    const done = await txt(p, '.p1-done');
    ok(tag + ' practice.completion', /Waad dhammaysay/.test(done) && (await txt(p, '.p1-done-num')) === '3 / 5', await txt(p, '.p1-done-num'));
    await p.click('#czDone'); await sleep(300);
    ok(tag + ' practice.back.toHub', !!(await p.locator('#czToday').count()));
    ok(tag + ' polish.focus.chromeRestored', await visible(p, '.topbar') && await visible(p, '#mainNav'));
    // Screen 2
    ok(tag + ' cit.order.practiceBeforeSettings', await p.evaluate(() => { const a = document.querySelector('.p1-today'), s = document.querySelector('.p1-set'); return !!(a && s && (a.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING)); }));
    ok(tag + ' cit.headline', (await txt(p, '.p1-cz-head h2')) === 'Maalintaada way soo socotaa.');
    ok(tag + ' cit.targets>=44', !(await small(p)).length, await small(p));
    await p.click('.p1-set-row:nth-child(1) summary'); await p.click('[data-ed="2008"]'); await sleep(900);
    ok(tag + ' cit.edition.keepsBehaviour', await p.evaluate(() => S.citizenship.edition === '2008') && /2008/.test(await txt(p, '.p1-set-row:nth-child(1) summary')));
    await p.click('.p1-set-row:nth-child(1) summary'); await p.click('[data-ed="2025"]'); await sleep(900);
    await p.click('.p1-set-row:nth-child(2) summary'); await p.fill('#czDate', '2027-03-01'); await p.click('#czDateSave'); await sleep(300);
    ok(tag + ' cit.date.keepsBehaviour', await p.evaluate(() => S.citizenship.testDate === '2027-03-01') && /maalmood/.test(await txt(p, '.p1-set-row:nth-child(2) summary')), await txt(p, '.p1-set-row:nth-child(2) summary'));
    for (const [go, sel] of [['cards', '.cz-card, .cz-done'], ['read', '#czBack'], ['write', '#czBack'], ['n400', '#czBack'], ['interview', '#czBack']]) {
      await p.click('[data-view="cit"]:visible'); await sleep(400); await p.click('.p1-parts [data-go="' + go + '"]'); await sleep(400);
      ok(tag + ' cit.part.' + go, await p.locator(sel).count() > 0 && !(await p.locator('.p1-parts').count()));
    }
    // returning learner after a refresh: progress persists and feeds Home
    await p.reload(); await sleep(1600); await p.evaluate(() => { setNav('home'); render(); }); await sleep(400);
    ok(tag + ' persist.ring.afterRefresh', (await txt(p, '.p1-ring b')) === '27', await txt(p, '.p1-ring b'));
    ok(tag + ' no.pageErrors', !p.errs.length, p.errs);
    await c.close();
  }
  // fresh learner, no name, no citizenship progress
  {
    const [c, p] = await learner(b, { width: 390, height: 844 }, false);
    ok('fresh home.greeting.noName', (await txt(p, '.p1-greet h1')) === 'Salaan.', await txt(p, '.p1-greet h1'));
    ok('fresh home.ring.zero', (await txt(p, '.p1-ring b')) === '0');
    await p.click('#p1Today'); await sleep(1400);
    ok('fresh home.cta.firstQuestion', await p.evaluate(() => document.querySelector('.p1-q') && document.querySelector('.p1-q').dataset.n === '1'));
    ok('fresh no.pageErrors', !p.errs.length, p.errs);
    await c.close();
  }
  // light lock (owner, Nov 28): welcome + the three Phase 1 screens stay light on a phone in dark mode; AA still scales
  {
    const c = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark', serviceWorkers: 'block' });
    await c.route(/cloudflareinsights|ytimg|youtube/, r => r.abort());
    const p = await c.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
    const look = () => p.evaluate(() => ({ theme: document.documentElement.dataset.theme, bg: getComputedStyle(document.body).backgroundColor }));
    const PAPER = 'rgb(250, 245, 236)';
    await p.goto(BASE); await sleep(1500);
    let l = await look(); ok('dark welcome.light', l.theme === 'light' && l.bg === PAPER && (await p.locator('#welcomeStart').count()) === 1, l);
    const wb = await p.evaluate(() => { const e = document.querySelector('.welcome-benefit'), cs = getComputedStyle(e); return { radius: cs.borderTopLeftRadius, bg: cs.backgroundColor }; });
    ok('welcome.p1Skin', wb.radius === '20px' && wb.bg === 'rgb(255, 255, 255)', wb);
    await p.click('#welcomeStart'); await sleep(900);
    await p.evaluate(() => { S.profile.name = 'Abdirashid Abi'; return save(); }); await p.reload(); await sleep(1500);
    await p.evaluate(() => { setNav('home'); render(); }); await sleep(300);
    l = await look(); ok('dark home.light', l.theme === 'light' && l.bg === PAPER, l);
    const a = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.p1-greet h1')).fontSize));
    await p.click('#p1Size'); await sleep(200);
    const z = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.p1-greet h1')).fontSize));
    l = await look(); ok('dark aa.scalesAndStaysLight', z > a && l.theme === 'light', { h1: [a, z], theme: l.theme });
    await p.click('#p1Size'); await sleep(200);
    await p.click('[data-view="cit"]:visible'); await sleep(1500);
    l = await look(); ok('dark cit.light', l.theme === 'light' && l.bg === PAPER && (await p.locator('#czToday').count()) === 1, l);
    await p.click('#czToday'); await sleep(800);
    l = await look(); ok('dark practice.light', l.theme === 'light' && l.bg === PAPER && (await p.locator('.p1-session').count()) === 1, l);
    await p.click('#czBack'); await sleep(300);
    await p.click('[data-view="dict"]:visible'); await sleep(600);
    l = await look(); ok('dark otherScreens.followDevice', l.theme === 'dark', l);
    ok('dark no.pageErrors', !p.errs.length, p.errs);
    await c.close();
  }
  fs.writeFileSync(path.join(__dirname, 'p1_checks.json'), JSON.stringify(R, null, 1));
  console.log(JSON.stringify({ checks: Object.keys(R).length, passed: Object.keys(R).length - fails.length, fails: fails.map(f => [f, R[f].detail]) }, null, 1));
  await b.close();
})();
