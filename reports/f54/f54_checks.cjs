// F54 acceptance checks (a)-(e) + language purity of the F54 strings.
// CHROMIUM_PATH=... node reports/f54/f54_checks.cjs [port]   -> reports/f54/f54_checks.json
// Needs a local server with HTTP Range support on 127.0.0.1 (audio seeks into the clip bundles).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BASE = 'http://127.0.0.1:' + (process.argv[2] || '8778') + '/academy.html';

async function fresh(b, opts = {}) {
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', ...opts });
  await c.route(/cloudflareinsights|ytimg|youtube/, r => r.abort());
  const p = await c.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  return [c, p];
}

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const R = {};

  // (a) Lesson 1 first screen: a letter + Listen before any intro
  {
    const [c, p] = await fresh(b);
    await p.goto(BASE); await sleep(1500); await p.click('#welcomeStart'); await sleep(1000);
    R.a = await p.evaluate(() => {
      const card = document.querySelector('#app .card'), letter = card && card.querySelector('.letter-hero');
      const listen = card && [...card.querySelectorAll('.audio-btn')].find(b => /Dhegeyso|Listen/.test(b.innerText));
      const about = card && card.querySelector('.l1-about');
      const before = el => el && letter && (letter.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
      return { step, lesson: cur.n, letter: letter && letter.innerText.replace(/\s+/g, ' '), listen_label: listen && listen.innerText,
        activity_options: card ? card.querySelectorAll('[data-l1opt]').length : 0,
        intro_after_letter_and_collapsed: !!(about && before(about) && !about.open), objective_card_shown_first: !!(card && card.querySelector('h2') && /Hadafka|Objective/.test(card.querySelector('h2').innerText)) };
    });
    await p.click('[data-l1opt="apple"]'); R.a.first_activity_completable = /Sax|Correct/.test(await p.locator('#l1Fb').innerText());
    R.a.pass = R.a.step === 0 && !!R.a.letter && !!R.a.listen_label && R.a.activity_options === 3 && R.a.intro_after_letter_and_collapsed && !R.a.objective_card_shown_first && R.a.first_activity_completable;
    R.a.errors = p.errs; await c.close();
  }

  // (b) resume from Home in <= 2 taps (returning learner who finished Lesson 1)
  {
    const [c, p] = await fresh(b);
    await p.goto(BASE); await sleep(1500); await p.click('#welcomeStart'); await sleep(900);
    await p.evaluate(() => { S.completed.L1 = { score: 90, date: todayStr() }; return save(); });
    await p.reload(); await sleep(1600);
    const landed = await p.evaluate(() => view);
    let taps = 0;
    await p.click('#academyContinue'); taps++; await sleep(700);
    const after = await p.evaluate(() => ({ view, lesson: cur && cur.n }));
    R.b = { landed_on: landed, taps, opened: after, pass: landed === 'home' && after.view === 'lesson' && after.lesson === 2 && taps <= 2, errors: p.errs };
    await c.close();
  }

  // (c) tutor reachable from Home and from inside a lesson
  {
    const [c, p] = await fresh(b);
    await p.goto(BASE); await sleep(1500); await p.click('#welcomeStart'); await sleep(900);
    await p.evaluate(() => { setNav('home'); render(); }); await sleep(400);
    const homeVisible = await p.locator('#homeTutor').isVisible();
    await p.click('#homeTutor'); await sleep(800);
    const fromHome = await p.evaluate(() => ({ view, open: !!(document.getElementById('academyTutor') || {}).open, focus: document.activeElement.tagName }));
    await p.evaluate(() => { step = 3; renderLesson(); scrollTo(0, 0); }); await sleep(300);
    const btn = await p.locator('#lesTutor').boundingBox();
    const barTop = await p.evaluate(() => { const n = document.getElementById('lesNav'); return n ? n.getBoundingClientRect().top : 9999; });
    await p.click('#lesTutor'); await sleep(800);
    const fromLesson = await p.evaluate(() => ({ open: document.getElementById('academyTutor').open, focus: document.activeElement.tagName }));
    R.c = { home_entry_visible: homeVisible, from_home: fromHome, lesson_button: { y: Math.round(btn.y), bottom: Math.round(btn.y + btn.height), bottom_bar_top: Math.round(barTop) }, from_lesson: fromLesson };
    R.c.pass = homeVisible && fromHome.open && fromHome.focus === 'TEXTAREA' && fromLesson.open && fromLesson.focus === 'TEXTAREA' && btn.y + btn.height < barTop;
    R.c.errors = p.errs; await c.close();
  }

  // (d) a Profile change shows a saved confirmation and survives a refresh (Profile itself is fenced: measured, not changed)
  {
    const [c, p] = await fresh(b);
    await p.goto(BASE); await sleep(1500); await p.click('#welcomeStart'); await sleep(900);
    await p.evaluate(() => { setNav('profile'); render(); }); await sleep(400);
    await p.click('#simpleEditName'); await p.fill('#simpleCurrentName', 'Ayaan F54'); await p.click('#simpleNameForm button[type="submit"]');
    const seen = [];
    for (let i = 0; i < 12; i++) { seen.push(await p.evaluate(() => document.body.innerText)); await sleep(150); }
    const confirmation = seen.some(t => /kaydi|Saved|saved/i.test(t) && /(Waad kaydisay|Saved\.|La kaydiyay|saved)/i.test(t));
    await p.reload(); await sleep(1600);
    const persisted = await p.evaluate(() => S.profile.name);
    R.d = { saved_confirmation_shown: confirmation, name_after_refresh: persisted, survives_refresh: persisted === 'Ayaan F54',
            pass: confirmation && persisted === 'Ayaan F54', note: 'Profile is a hard fence in F54 (untouched); this check is measured only.', errors: p.errs };
    await c.close();
  }

  // (e) phone width + large text: the keyboard and the bottom nav never hide the primary lesson button
  {
    const rows = [];
    for (const vp of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) {
      const [c, p] = await fresh(b, { viewport: vp });
      await p.goto(BASE); await sleep(1500); await p.click('#welcomeStart'); await sleep(900);
      await p.evaluate(() => { S.profile.largeText = true; applyPrefs(); save(); });
      for (let s = 0; s <= 9; s++) {
        await p.evaluate(s => { step = s; exIdx = 0; phase = 'ex'; renderLesson(); scrollTo(0, 0); }, s); await sleep(250);
        const hasInput = await p.evaluate(() => !!document.querySelector('#app input[type=text], #app textarea:not(#academyTutor textarea)'));
        const probe = async label => p.evaluate(label => {
          const btn = document.getElementById('lesNext') || document.querySelector('#lesNav .btn:last-child');
          if (!btn) return { label, primary: null };
          const r = btn.getBoundingClientRect(), vh = window.visualViewport ? visualViewport.height : innerHeight;
          const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          const nav = document.getElementById('mainNav'), navShown = nav && getComputedStyle(nav).display !== 'none' && nav.getBoundingClientRect().height > 0;
          return { label, primary: btn.id || btn.className, in_view: r.top >= 0 && r.bottom <= vh + 0.5, on_top: !!top && (top === btn || btn.contains(top)),
                   bottom_nav_shown: !!navShown, rect: [Math.round(r.top), Math.round(r.bottom)], vh: Math.round(vh) };
        }, label);
        const base = await probe('no keyboard');
        let kb = null;
        if (hasInput) {
          await p.focus('#app input[type=text], #app textarea');
          await p.setViewportSize({ width: vp.width, height: vp.height - 336 });  // iPhone keyboard height
          await sleep(300); kb = await probe('keyboard open');
          await p.setViewportSize(vp); await sleep(150);
        }
        rows.push({ viewport: vp.width + 'x' + vp.height, step: s, ...base, keyboard: kb });
      }
      await c.close();
    }
    const bad = rows.filter(r => r.primary && (!r.in_view || !r.on_top || r.bottom_nav_shown || (r.keyboard && (!r.keyboard.in_view || !r.keyboard.on_top))));
    R.e = { checks: rows.length, with_keyboard: rows.filter(r => r.keyboard).length, failures: bad, pass: bad.length === 0 };
  }

  // language purity of everything F54 added, in both UI languages
  {
    const EN = ['Listen', 'Slow', 'Replay', 'Ask your tutor', 'About this lesson', 'Your current unit', 'current', 'of 1,000 lessons', 'Next ·'];
    const SO = ['Dhegeyso', 'Tartiib dhegeyso', 'Mar kale', 'Weydii macallinka', 'Ku saabsan casharkan', 'Qaybtaada hadda', 'hadda', '1,000 cashir', 'Xiga ·'];
    const out = {};
    for (const ui of ['so', 'en']) {
      const [c, p] = await fresh(b);
      await p.goto(BASE); await sleep(1500); await p.click('#welcomeStart'); await sleep(900);
      await p.evaluate(ui => { S.profile.ui = ui; save(); }, ui);
      const texts = [];
      for (let s = 0; s <= 10; s++) { await p.evaluate(s => { step = s; exIdx = 0; phase = 'ex'; renderLesson(); }, s); await sleep(150); texts.push(await p.evaluate(() => [...document.querySelectorAll('#app button:not(.wword):not([data-w]), #app summary, #app .unit-here, #app .one-progress-label, #app .next-badge')].map(e => e.innerText).join(' | '))); }  // tappable lesson words (.wword) are learned English content, not interface labels
      await p.evaluate(() => { S.completed.L1 = { score: 90 }; setNav('home'); render(); }); await sleep(300); texts.push(await p.evaluate(() => document.getElementById('app').innerText));
      await p.evaluate(() => { setNav('simpleLessons'); render(); }); await sleep(300); texts.push(await p.evaluate(() => document.getElementById('app').innerText));
      const all = texts.join('\n');
      const wrong = (ui === 'so' ? EN : SO).filter(w => new RegExp('(^|[^A-Za-z])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^A-Za-z]|$)').test(all));
      out[ui] = { other_language_f54_labels_found: wrong };
      await c.close();
    }
    R.purity = { ...out, pass: !out.so.other_language_f54_labels_found.length && !out.en.other_language_f54_labels_found.length };
  }

  fs.writeFileSync(path.join(__dirname, 'f54_checks.json'), JSON.stringify(R, null, 1));
  console.log(JSON.stringify({ a: R.a.pass, b: R.b.pass, c: R.c.pass, d: R.d.pass, d_detail: { confirmation: R.d.saved_confirmation_shown, survives_refresh: R.d.survives_refresh }, e: R.e.pass, e_failures: R.e.failures.length, e_checks: R.e.checks, purity: R.purity }, null, 1));
  await b.close();
})();
