// node reports/phase1/shots.cjs <outdir> [port] — Phase 1 screenshots (phone 390 px and wide 1280 px, 2x), returning learner.
const { chromium } = require('playwright'); const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const out = process.argv[2], port = process.argv[3] || '8778';
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const errs = [];
  async function page(w, h) {
    const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, reducedMotion: 'reduce', serviceWorkers: 'block' });
    await c.route(/cloudflareinsights|ytimg|youtube/, r => r.abort());
    const p = await c.newPage(); p.on('pageerror', e => errs.push(w + ': ' + e.message));
    await p.goto('http://127.0.0.1:' + port + '/academy.html'); await sleep(1600); await p.click('#welcomeStart'); await sleep(1000);
    // returning learner: name, 3 lessons done, 24 citizenship questions known
    await p.evaluate(() => { S.profile.name = 'Abdirashid Abi'; for (let i = 1; i <= 3; i++) S.completed['L' + i] = { score: 90, date: todayStr() };
      S.citizenship = { v: 1, edition: '2025', civ: { '2025': { known: Object.fromEntries(Array.from({ length: 24 }, (_, i) => [i + 1, 1])), seen: {}, mocks: [] } } }; save(); setNav('home'); render(); });
    await sleep(900); return [c, p];
  }
  const shot = async (p, n, full) => { await sleep(700); await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await p.screenshot({ path: out + '/' + n + '.png', fullPage: !!full }); };
  let [c, p] = await page(1280, 800); await shot(p, '1_home_wide'); await c.close();
  [c, p] = await page(390, 844);
  await shot(p, '1_home_phone'); await shot(p, '1_home_phone_full', true);
  await p.evaluate(() => window.__seaGo('cit')); await sleep(1500); await shot(p, '2_citizenship_phone'); await shot(p, '2_citizenship_phone_full', true);
  const start = await p.$('#czToday'); if (start) await start.click(); else await p.evaluate(() => window.openCitizenship('cards'));
  await sleep(900); await shot(p, '3_practice_question_phone');
  const show = await p.$('#czShow'); if (show) { await show.click(); await sleep(600); await shot(p, '3_practice_answer_phone'); }
  console.log(JSON.stringify({ out, errs })); await b.close();
})();
