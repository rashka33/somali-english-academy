/* ============================================================================
   Ciyaar oo Baro / Play & Learn — six games, ten levels each.
   Words come only from the curriculum's picture dictionary (DICT_ENTRIES).
   Missed words join the existing review deck (addSRS). XP uses the existing
   best-score rule (awardBestXP), so a level pays once per improvement.
   State is the optional S.games key; lessons and all other progress untouched.
   Sound is synthesised with WebAudio (no files); spoken words use speak().
   ============================================================================ */
(function () {
  'use strict';
  if (typeof UI_ICONS === 'object') {
    UI_ICONS.game = '<rect x="2" y="7" width="20" height="11" rx="5.5"/><path d="M7.5 11v3M6 12.5h3M15.5 11.5h.01M18 13.5h.01"/>';
    UI_ICONS.heart = '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>';
    UI_ICONS.mute = '<path d="M11 4 5 9H2v6h3l6 5zM16 9l5 6m0-6-5 6"/>';
    UI_ICONS.snake = '<path d="M4 18c3 0 3-4 6-4s3 4 6 4 4-3 4-6-2-6-5-6-4 2-4 4"/>';
    UI_ICONS.basket = '<path d="M3 10h18l-2 10H5zM8 10l4-6 4 6"/>';
    UI_ICONS.ladder = '<path d="M8 3v18M16 3v18M8 7h8M8 12h8M8 17h8"/>';
    UI_ICONS.slice = '<path d="M4 20 20 4M14 4h6v6"/>';
    UI_ICONS.road = '<path d="M8 21 10 3M16 21 14 3M12 6v2m0 4v2m0 4v2"/>';
    UI_ICONS.coin = '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"/>';
  }
  function T(so, en) { return S && S.profile && S.profile.ui === 'en' ? en : so; }
  function ic(n) { return uiIcon(n); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function shuf(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function cssv(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#0e7c66'; }
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var GAMES = [
    { id: 'snake', so: 'Maska Erayada', en: 'Word Snake', ic: 'snake', tip: ['Xarfaha si isku xigta u cun si aad erayga u dhisto.', 'Eat the letters in order to spell the word.'] },
    { id: 'catch', so: 'Qabo Erayga', en: 'Word Catch', ic: 'basket', tip: ['Dambiisha dhaqaaji oo qabo erayga sawirka u dhigma.', 'Move the basket and catch the word that matches the picture.'] },
    { id: 'ladder', so: 'Jaranjarada', en: 'The Ladder', ic: 'ladder', tip: ['Kor u fuul. Dhibcahaaga kaydi ka hor intaadan simbiriirixan.', 'Climb up. Bank your points before you slip.'] },
    { id: 'match', so: 'Isku Aadi', en: 'Memory Match', ic: 'cards', tip: ['Raadi labada kaar ee is leh.', 'Find the two cards that belong together.'] },
    { id: 'duel', so: 'Tartanka Degdegga', en: 'Duel Dash', ic: 'flag', tip: ['Geel ka hor gaar xariiqda dhammaadka.', 'Reach the finish line before Geel does.'] },
    { id: 'slice', so: 'Jar Erayga', en: 'Word Slice', ic: 'slice', tip: ['Fartaada ku jar erayga saxda ah. Kuwa khaldan ha taaban.', 'Swipe through the correct word. Do not touch the wrong ones.'] },
    { id: 'run', so: 'Magaalada Erayada 3D', en: 'Word Town 3D', ic: 'road', tip: ['Magaalo 3D ah dhex soco ama gaari ku kaxee. Dadka la hadal, hawlahana Ingiriisi ku dhammee.', 'Walk or drive through a 3D town. Talk to people and finish your errands in English.'] }
  ];
  var PLACES = [['Guriga', 'Home'], ['Dugsiga', 'School'], ['Suuqa', 'Market'], ['Maktabadda', 'Library'], ['Beerta', 'Park'], ['Xafiiska', 'Office'], ['Magaalada', 'City'], ['Garoonka', 'Airport'], ['Jaamacadda', 'University'], ['Buurta sare', 'Summit']];
  var P = { route: 'home', game: null, R: null };
  function gz() {
    var g = S.games; if (!g || typeof g !== 'object') g = S.games = { v: 1 };
    if (typeof g.sound !== 'boolean') g.sound = true; g.diff = g.diff || {}; g.lv = g.lv || {};
    GAMES.forEach(function (x) { var l = g.lv[x.id] = g.lv[x.id] || {}; l.u = Math.max(1, Math.min(10, l.u || 1)); l.s = l.s || {}; });
    return g;
  }
  function gdef(id) { return GAMES.filter(function (x) { return x.id === id; })[0]; }
  function diffOf(id) { var d = gz().diff[id]; return d === 'hard' || d === 'medium' ? d : 'easy'; }
  function gameXP(st) { var b = st && st.stageF && st.stageF.best || {}, n = 0; Object.keys(b).forEach(function (x) { if (x.indexOf('game:') === 0) n += b[x] || 0; }); return n; }
  function starsOf(id) { var s = gz().lv[id].s, n = 0; Object.keys(s).forEach(function (k) { n += s[k]; }); return n; }

  /* ---------------- sound: WebAudio, nothing to download ---------------- */
  var AC = null, master = null, musicOn = false, musicT = 0, musicStep = 0, musicTimer = null, noiseBuf = null;
  function ac() {
    if (!S || !gz().sound) return null;
    if (!AC) { var A = window.AudioContext || window.webkitAudioContext; if (!A) return null; try { AC = new A(); } catch (e) { return null; } master = AC.createGain(); master.gain.value = 0.55; master.connect(AC.destination); }
    if (AC.state === 'suspended') { try { AC.resume(); } catch (e) { } }
    return AC;
  }
  function tone(f, t0, d, type, vol, to) {
    var o = AC.createOscillator(), g = AC.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0); if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + d);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.25, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + d + 0.03);
  }
  function hiss(t0, d, vol, f0, f1) {
    if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate * 0.4, AC.sampleRate); var ch = noiseBuf.getChannelData(0); for (var i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; }
    var s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = noiseBuf; f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t0 + d);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d); s.connect(f); f.connect(g); g.connect(master); s.start(t0); s.stop(t0 + d + 0.02);
  }
  var SFX = {
    blip: function (t) { tone(660, t, 0.09, 'triangle', 0.22, 990); },                                   /* snake eats a right letter */
    tok: function (t) { tone(190, t, 0.12, 'sine', 0.5, 95); hiss(t, 0.05, 0.12, 900, 400); },           /* soft wooden catch */
    chime: function (t) { tone(880, t, 0.28, 'sine', 0.2); tone(1318.5, t + 0.07, 0.36, 'sine', 0.18); }, /* correct */
    thud: function (t) { tone(120, t, 0.26, 'sine', 0.32, 62); },                                         /* gentle miss, never a buzzer */
    pop: function (t) { tone(420, t, 0.07, 'sine', 0.18, 760); },                                         /* card flip, star */
    shwick: function (t) { hiss(t, 0.14, 0.4, 1400, 7000); tone(1600, t, 0.06, 'sine', 0.06, 3200); },    /* slice */
    coins: function (t) { [1568, 2093, 2637, 3136, 2637, 3520].forEach(function (f, i) { tone(f, t + i * 0.055, 0.16, 'triangle', 0.13); }); hiss(t + 0.1, 0.3, 0.05, 6000, 9000); },
    fanfare: function (t) { [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { tone(f, t + i * 0.13, 0.3, 'triangle', 0.22); }); tone(1318.5, t + 0.56, 0.6, 'sine', 0.2); tone(1046.5, t + 0.56, 0.6, 'triangle', 0.14); },
    combo: function (t) { tone(988, t, 0.1, 'triangle', 0.18); tone(1480, t + 0.07, 0.16, 'triangle', 0.18); },
    slow: function (t) { tone(330, t, 0.5, 'sine', 0.12, 165); }
  };
  function sfx(n) { var c = ac(); if (!c) return; try { SFX[n](c.currentTime); } catch (e) { } }
  var TUNE = [0, 4, 7, 9, 7, 4, 2, 4, 0, 4, 7, 12, 9, 7, 4, 2];
  function musicTick() {
    if (!musicOn || !AC) return;
    while (musicT < AC.currentTime + 0.3) {
      var n = TUNE[musicStep % TUNE.length], f = 261.63 * Math.pow(2, n / 12);
      tone(f * 2, musicT, 0.22, 'triangle', 0.035); if (musicStep % 4 === 0) tone(f / 2, musicT, 0.5, 'sine', 0.05);
      musicT += 0.27; musicStep++;
    }
  }
  function startMusic() { if (musicOn) return; var c = ac(); if (!c) return; musicOn = true; musicT = c.currentTime + 0.05; musicTimer = setInterval(musicTick, 120); }
  function stopMusic() { musicOn = false; clearInterval(musicTimer); }
  function sayWord(en, wait) { setTimeout(function () { try { speak(en); } catch (e) { } }, wait || 320); }
  function soundBtn() { var on = gz().sound; return '<button type="button" class="gm-sound' + (on ? ' on' : '') + '" id="gmSound" aria-pressed="' + on + '">' + ic(on ? 'speaker' : 'mute') + '<span>' + (on ? T('Codka: shidan', 'Sound: on') : T('Codka: damsan', 'Sound: off')) + '</span></button>'; }
  function wireSound(after) { var b = document.getElementById('gmSound'); if (b) b.onclick = function () { var g = gz(); g.sound = !g.sound; save(); if (!g.sound) stopMusic(); else sfx('pop'); after(); }; }

  /* ---------------- juice: one light particle canvas ---------------- */
  var fxC = null, fxX = null, parts = [], fxRaf = 0;
  function fxInit() { if (fxC) return; fxC = document.createElement('canvas'); fxC.className = 'gm-fx'; document.body.appendChild(fxC); fxX = fxC.getContext('2d'); var z = function () { fxC.width = innerWidth; fxC.height = innerHeight; }; z(); addEventListener('resize', z); }
  function kick() {
    if (fxRaf) return; var last = performance.now();
    fxRaf = requestAnimationFrame(function f(ts) {
      var dt = Math.min(0.05, (ts - last) / 1000); last = ts; fxX.clearRect(0, 0, fxC.width, fxC.height);
      parts = parts.filter(function (p) {
        p.t += dt; if (p.t > p.life) return false; p.vy += p.g * dt; p.x += (p.vx + (p.sw ? Math.sin(p.t * 5 + p.rot) * 60 : 0)) * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        fxX.globalAlpha = Math.max(0, 1 - p.t / p.life); fxX.fillStyle = p.c; fxX.save(); fxX.translate(p.x, p.y); fxX.rotate(p.rot);
        if (p.sq) fxX.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); else { fxX.beginPath(); fxX.arc(0, 0, p.s / 2, 0, 6.3); fxX.fill(); } fxX.restore(); return true;
      });
      fxX.globalAlpha = 1; if (parts.length) fxRaf = requestAnimationFrame(f); else fxRaf = 0;
    });
  }
  function burst(x, y, colors, n, sp) { fxInit(); if (calm) n = Math.ceil(n / 3); sp = sp || 260; for (var i = 0; i < n; i++) parts.push({ x: x, y: y, vx: rnd(-1, 1) * sp, vy: rnd(-1.3, 0.3) * sp, g: 900, life: rnd(0.45, 0.9), t: 0, c: colors[i % colors.length], s: rnd(4, 9), rot: rnd(0, 6), vr: rnd(-8, 8) }); kick(); }
  function confetti() { fxInit(); if (calm) return; var cs = [cssv('--accent'), cssv('--gold'), '#e4572e', cssv('--ink'), '#58a4b0']; for (var i = 0; i < 120; i++) parts.push({ x: rnd(0, innerWidth), y: rnd(-innerHeight * 0.4, -10), vx: rnd(-40, 40), vy: rnd(140, 380), g: 160, life: rnd(2, 3.4), t: 0, c: cs[i % cs.length], s: rnd(8, 14), rot: rnd(0, 6), vr: rnd(-6, 6), sq: 1, sw: 1 }); kick(); }

  /* ---------------- the level law (same for every game) ---------------- */
  function law(L, diff) {
    var hard = diff === 'hard', med = diff === 'medium', t = (L - 1) / 9;
    return { L: L, hard: hard, med: med, t: Math.min(1.15, t + (hard ? 0.22 : med ? 0.11 : 0)), lives: Math.max(1, (L <= 3 ? 4 : L <= 8 ? 3 : 2) - (hard ? 1 : 0)), maxLen: Math.min(11, 4 + Math.floor(L * 0.7)), lessons: 25 * L, opts: L <= 2 ? 2 : L <= 6 ? 3 : 4 };
  }
  var NEED = { snake: function (L) { return 2 + Math.floor(L / 3); }, catch: function (L) { return 4 + Math.floor(L / 2); }, ladder: function (L) { return 5 + Math.floor(L / 2); }, match: function (L) { return [3, 4, 4, 5, 6, 6, 7, 8, 8, 10][L - 1]; }, duel: function (L) { return 6 + Math.floor(L / 2); }, slice: function (L) { return 6 + L; }, run: function (L) { return 3 + Math.floor(L / 2); } };
  function wordPool(c) {
    var ok = function (e) { return /^[a-z]+$/i.test(e.en) && e.en.length >= 2; };
    var p = DICT_ENTRIES.filter(function (e) { return ok(e) && e.en.length <= c.maxLen && e.lesson <= c.lessons; });
    if (p.length < 14) p = DICT_ENTRIES.filter(function (e) { return ok(e) && e.en.length <= c.maxLen + 2; });
    return p;
  }
  function distract(w, R, n) {
    var c = shuf(R.pool.filter(function (e) { return e.en !== w.en; }));
    if (R.c.L >= 5) { var sc = function (e) { return (e.en[0] === w.en[0] ? 2 : 0) + (e.theme === w.theme ? 1 : 0) + (Math.abs(e.en.length - w.en.length) <= 1 ? 1 : 0); }; c.sort(function (a, b) { return sc(b) - sc(a); }); c = shuf(c.slice(0, Math.max(n + 2, 6))); }
    return c.slice(0, n);
  }

  /* ---------------- round engine ---------------- */
  function stopGame() { var R = P.R; if (!R) return; R.over = true; cancelAnimationFrame(R.raf); if (R.cleanup) { try { R.cleanup(); } catch (e) { } } clearTimeout(R.slowT); P.R = null; document.body.classList.remove('gm-playing', 'gm-last'); }
  function play(id, L) {
    stopGame(); stopMusic(); var g = gz(), diff = diffOf(id), c = law(L, diff), def = gdef(id);
    var R = P.R = { id: id, c: c, pool: wordPool(c), lives: c.lives, lives0: c.lives, score: 0, combo: 0, best: 0, need: NEED[id](L), got: 0, missed: {}, won: [], ts: 1, over: false };
    P.route = 'play'; document.body.classList.add('gm-playing');
    app.innerHTML = '<div class="gm" data-game="' + id + '"><div class="gm-hud"><button type="button" class="iconbtn" id="gmQuit" aria-label="' + T('Ka bax', 'Quit') + '">' + ic('close') + '</button><div class="gm-lv"><b>' + T('Heer ', 'Level ') + L + '</b><span>' + T(def.so, def.en) + (c.hard ? ' · ' + T('Adag', 'Hard') : c.med ? ' · ' + T('Dhexe', 'Medium') : '') + '</span></div><div class="gm-lives" id="gmLives" aria-label="' + T('Nolosha', 'Lives') + '"></div><div class="gm-score"><b id="gmScore">0</b><span id="gmCombo"></span></div><button type="button" class="iconbtn" id="gmMute" aria-label="' + T('Codka', 'Sound') + '">' + ic(g.sound ? 'speaker' : 'mute') + '</button></div><div class="gm-prog"><i id="gmProg"></i></div><div class="gm-target" id="gmTarget"></div><div class="gm-stage" id="gmStage"></div><div class="gm-toast" id="gmToast" aria-live="polite"></div></div>';
    var stage = document.getElementById('gmStage');
    R.hud = function () {
      var h = ''; for (var i = 0; i < R.lives0; i++) h += '<span class="' + (i < R.lives ? 'on' : '') + '">' + ic('heart') + '</span>';
      document.getElementById('gmLives').innerHTML = h; document.getElementById('gmScore').textContent = R.score;
      var m = Math.min(3, Math.max(1, R.combo)); var cb = document.getElementById('gmCombo'); cb.textContent = m > 1 ? '×' + m : ''; cb.className = m > 1 ? 'on' : '';
      document.getElementById('gmProg').style.width = Math.min(100, R.got / R.need * 100) + '%';
    };
    R.setTarget = function (w, extra) { document.getElementById('gmTarget').innerHTML = '<span class="gm-pic keep-emoji">' + (visualFor(w.en) ? visHTML(w.en) : '') + '</span><span class="gm-tt"><span class="gm-tso" lang="so">' + esc(w.so) + '</span>' + (extra || '') + '</span>'; };
    R.at = function (x, y) { var r = stage.getBoundingClientRect(); return [r.left + x, r.top + y]; };
    R.toast = function (w, tag) { var t = document.getElementById('gmToast'); if (!t) return; t.innerHTML = '<div class="gm-word"><b lang="en">' + esc(w.en) + '</b><span lang="so">' + esc(w.so) + '</span>' + (tag ? '<em>' + tag + '</em>' : '') + '</div>'; };
    R.good = function (w, x, y, bonus) {
      if (R.over) return; R.combo++; R.best = Math.max(R.best, R.combo); var m = Math.min(3, R.combo); R.score += 10 * m + (bonus ? 20 : 0); R.got++; if (R.won.indexOf(w) < 0) R.won.push(w);
      sfx(bonus ? 'combo' : m > 1 ? 'combo' : 'chime'); var p = R.at(x, y); burst(p[0], p[1], [cssv('--gold'), cssv('--accent'), '#ffffff'], 14 + m * 6);
      R.toast(w, bonus ? '×2 Combo!' : m > 1 ? '×' + m : ''); sayWord(w.en); R.hud();
      if (R.got >= R.need) finish(true);
    };
    R.soft = function () { R.combo = 0; sfx('thud'); R.hud(); };
    R.bad = function (w) {
      if (R.over) return; R.combo = 0; R.lives--; if (w) R.missed[w.en] = w; sfx('thud');
      var el = document.querySelector('.gm'); if (el && !calm) { el.classList.remove('gm-shake'); void el.offsetWidth; el.classList.add('gm-shake'); }
      if (w) R.toast(w, T('Kani waa kii saxda ahaa', 'This was the right one')); R.hud();
      if (R.lives <= 0) { finish(false); return; }
      if (R.lives === 1) { document.body.classList.add('gm-last'); sfx('slow'); R.ts = 0.5; clearTimeout(R.slowT); R.slowT = setTimeout(function () { R.ts = 0.82; }, 2200); }
    };
    R.fail = function () { if (!R.over) finish(false); };
    document.getElementById('gmQuit').onclick = function () { stopGame(); P.route = 'levels'; paint(); };
    document.getElementById('gmMute').onclick = function () { g.sound = !g.sound; save(); this.innerHTML = ic(g.sound ? 'speaker' : 'mute'); };
    R.hud(); ({ snake: gSnake, catch: gCatch, ladder: gLadder, match: gMatch, duel: gDuel, slice: gSlice, run: function (r, st) { window.gWorld(r, st, { T: T, ic: ic, sfx: sfx, burst: burst, shuf: shuf, rnd: rnd, lerp: lerp, distract: distract, cssv: cssv }); } })[id](R, stage);
    var last = performance.now();
    R.raf = requestAnimationFrame(function f(ts) { if (R.over) return; var dt = Math.min(0.05, (ts - last) / 1000) * R.ts; last = ts; if (R.step) R.step(dt); R.raf = requestAnimationFrame(f); });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function finish(win) {
    var R = P.R; if (!R || R.over) return; R.over = true; cancelAnimationFrame(R.raf); if (R.cleanup) { try { R.cleanup(); } catch (e) { } } clearTimeout(R.slowT);
    document.body.classList.remove('gm-last');
    var g = gz(), lv = g.lv[R.id], L = R.c.L, lost = R.lives0 - R.lives, stars = win ? (lost === 0 ? 3 : lost === 1 ? 2 : 1) : 0, opened = false, xp = 0;
    Object.keys(R.missed).forEach(function (k) { try { addSRS(R.missed[k].en, R.missed[k].so); } catch (e) { } });
    if (win) { if (stars > (lv.s[L] || 0)) lv.s[L] = stars; if (L < 10 && lv.u < L + 1) { lv.u = L + 1; opened = true; } try { xp = awardBestXP('game:' + R.id + ':' + L + (R.c.hard ? ':h' : R.c.med ? ':m' : ''), stars * (R.c.hard ? 6 : R.c.med ? 5 : 4)); } catch (e) { } }
    quest('game'); save();
    setTimeout(function () { if (P.R !== R) return; result(R, win, stars, opened, xp); }, win ? 650 : 900);
  }
  function result(R, win, stars, opened, xp) {
    document.body.classList.remove('gm-playing'); var def = gdef(R.id), L = R.c.L, words = R.won.concat(Object.keys(R.missed).map(function (k) { return R.missed[k]; }).filter(function (w) { return R.won.indexOf(w) < 0; })).slice(0, 8), star = words[0];
    var h = '<div class="gm-result' + (win ? ' win' : '') + '"><p class="hero-eyebrow">' + T(def.so, def.en) + ' · ' + T('Heer ', 'Level ') + L + '</p><div class="gm-stars" aria-label="' + stars + ' / 3">' + [1, 2, 3].map(function (i) { return '<span class="' + (i <= stars ? 'on' : '') + '" style="--d:' + (i * 0.22) + 's">' + ic('star') + '</span>'; }).join('') + '</div>'
      + '<h1>' + (win ? (L === 10 ? T('Buurta sare ayaad gaartay!', 'You reached the summit!') : T('Heer ' + L + ' waa dhammaaday!', 'Level ' + L + ' complete!')) : T('Wax yar baa kaa dhimmanaa', 'So close')) + '</h1>'
      + '<p class="simple-intro">' + (win ? T('Dhibco: ', 'Score: ') + R.score + (R.best > 1 ? ' · ' + T('isku xigxig: ', 'best streak: ') + R.best : '') + (xp ? ' · +' + xp + ' XP' : '') : T('Qof kasta wuu simbiriirixdaa. Erayadii kaa dhacay kaararkaaga ayaan ku darnay — mar kale isku day.', 'Everyone slips. We added the words you missed to your review cards — have another go.')) + '</p>'
      + (star && win ? '<div class="gm-hero-word"><span class="gm-pic keep-emoji">' + (visualFor(star.en) ? visHTML(star.en) : '') + '</span><b lang="en">' + esc(star.en) + '</b><span lang="so">' + esc(star.so) + '</span></div>' : '')
      + (opened ? '<div class="gm-unlock">' + ic('sparkle') + '<div><b>' + T('Heer ' + (L + 1) + ' waa furmay', 'Level ' + (L + 1) + ' unlocked') + '</b><span>' + T(PLACES[L][0], PLACES[L][1]) + '</span></div></div>' : '')
      + '<div class="gm-two">' + (win && L < 10 ? '<button type="button" class="btn gm-glow" id="gmNext">' + T('Heer ', 'Level ') + (L + 1) + ic('arrow') + '</button>' : '<button type="button" class="btn gm-glow" id="gmRetry">' + T('Mar kale', 'Try again') + '</button>') + '<button type="button" class="btn secondary" id="gmHome">' + T('Ciyaaraha', 'All games') + '</button></div>'
      + (words.length ? '<h2 class="cz-h">' + T('Erayadii wareeggan', 'Words from this round') + '</h2><ul class="gm-words">' + words.map(function (w) { return '<li' + (R.missed[w.en] ? ' class="miss"' : '') + '><span><b lang="en">' + esc(w.en) + '</b><small lang="so">' + esc(w.so) + (R.missed[w.en] ? ' · ' + T('dib-u-eegis', 'review') : '') + '</small></span>' + speakBtn(w.en) + '</li>'; }).join('') + '</ul>' : '') + '</div>';
    app.innerHTML = h; bindSpeak(app); window.scrollTo({ top: 0, behavior: 'instant' });
    if (win) { sfx('fanfare'); confetti(); [1, 2, 3].forEach(function (i) { if (i <= stars) setTimeout(function () { sfx('pop'); }, 200 + i * 220); }); if (star) sayWord(star.en, 1500); }
    var id = R.id; P.R = null;
    var n = document.getElementById('gmNext'); if (n) n.onclick = function () { play(id, L + 1); };
    var r = document.getElementById('gmRetry'); if (r) r.onclick = function () { play(id, L); };
    document.getElementById('gmHome').onclick = function () { P.route = 'home'; paint(); };
  }

  /* ---------------- 1. Word Snake ---------------- */
  function gSnake(R, stage) {
    var cols = 9, rows = 10, dpr = Math.min(2, window.devicePixelRatio || 1), cell = 40, cv = document.createElement('canvas'), x = cv.getContext('2d');
    stage.innerHTML = ''; stage.classList.add('gm-snake'); stage.appendChild(cv);
    stage.insertAdjacentHTML('beforeend', '<div class="gm-pad"><button type="button" data-d="0,-1" aria-label="Up" style="grid-area:u">' + ic('chevron') + '</button><button type="button" data-d="-1,0" aria-label="Left" style="grid-area:l">' + ic('chevron') + '</button><button type="button" data-d="1,0" aria-label="Right" style="grid-area:r">' + ic('chevron') + '</button><button type="button" data-d="0,1" aria-label="Down" style="grid-area:d">' + ic('chevron') + '</button></div>');
    cell = Math.floor(Math.min(stage.clientWidth, 440) / cols); cv.style.width = cell * cols + 'px'; cv.style.height = cell * rows + 'px'; cv.width = cell * cols * dpr; cv.height = cell * rows * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
    var snake, dir, queue = [], letters = [], words = shuf(R.pool).slice(0, R.need + 3), wi = 0, word, idx = 0, acc = 0, tick = lerp(0.36, 0.17, Math.min(1, R.c.t)), col = { a: cssv('--accent'), g: cssv('--gold'), s: cssv('--soft'), i: cssv('--ink'), p: cssv('--surface'), l: cssv('--line') };
    function reset() { snake = [{ x: 4, y: 6 }, { x: 3, y: 6 }, { x: 2, y: 6 }]; dir = { x: 1, y: 0 }; queue = []; }
    function free() { for (var n = 0; n < 200; n++) { var c = { x: Math.floor(rnd(0, cols)), y: Math.floor(rnd(0, rows)) }; var near = Math.abs(c.x - snake[0].x) + Math.abs(c.y - snake[0].y) < 3; if (!near && !snake.some(function (s) { return s.x === c.x && s.y === c.y; }) && !letters.some(function (l) { return l.x === c.x && l.y === c.y; })) return c; } return { x: 0, y: 0 }; }
    function lay() { letters = []; var need = word.en[idx].toLowerCase(), k = 1 + Math.floor(R.c.L / 3) + (R.c.hard ? 1 : 0), abc = 'abcdefghijklmnoprstuwy'; var c = free(); letters.push({ x: c.x, y: c.y, ch: need, ok: true }); for (var i = 0; i < k; i++) { var ch; do { ch = abc[Math.floor(rnd(0, abc.length))]; } while (ch === need); c = free(); letters.push({ x: c.x, y: c.y, ch: ch, ok: false }); } }
    function spell() { return '<span class="gm-spell" lang="en">' + word.en.split('').map(function (ch, i) { return '<i class="' + (i < idx ? 'on' : i === idx ? 'now' : '') + '">' + (i < idx ? esc(ch) : '') + '</i>'; }).join('') + '</span>'; }
    function nextWord() { word = words[wi++ % words.length]; idx = 0; R.setTarget(word, spell()); lay(); }
    function draw() {
      x.clearRect(0, 0, cell * cols, cell * rows); x.fillStyle = col.s; for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) if ((i + j) % 2 === 0) x.fillRect(i * cell, j * cell, cell, cell);
      letters.forEach(function (l) { var cx = l.x * cell + cell / 2, cy = l.y * cell + cell / 2; x.beginPath(); x.arc(cx, cy, cell * 0.42, 0, 6.3); x.fillStyle = col.p; x.fill(); x.lineWidth = 2; x.strokeStyle = (l.ok && R.c.L <= 2 && !R.c.hard) ? col.g : col.l; x.stroke(); x.fillStyle = col.i; x.font = '700 ' + Math.round(cell * 0.5) + 'px Inter,system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(l.ch, cx, cy + 1); });
      for (var s = snake.length - 1; s >= 0; s--) { var p = snake[s], r = cell * 0.44; x.fillStyle = col.a; x.globalAlpha = s === 0 ? 1 : 0.78; x.beginPath(); if (x.roundRect) x.roundRect(p.x * cell + cell / 2 - r, p.y * cell + cell / 2 - r, r * 2, r * 2, r * 0.6); else x.rect(p.x * cell + cell / 2 - r, p.y * cell + cell / 2 - r, r * 2, r * 2); x.fill(); }
      x.globalAlpha = 1; var h = snake[0], hx = h.x * cell + cell / 2, hy = h.y * cell + cell / 2; x.fillStyle = '#fff'; [-1, 1].forEach(function (k) { x.beginPath(); x.arc(hx + dir.x * cell * 0.14 + (dir.y ? k * cell * 0.16 : 0), hy + dir.y * cell * 0.14 + (dir.x ? k * cell * 0.16 : 0), cell * 0.07, 0, 6.3); x.fill(); });
    }
    function move() {
      if (queue.length) { var d = queue.shift(); if (d.x !== -dir.x || d.y !== -dir.y) dir = d; }
      var hd = { x: (snake[0].x + dir.x + cols) % cols, y: (snake[0].y + dir.y + rows) % rows };
      if (R.c.hard && R.c.L >= 5 && snake.some(function (s) { return s.x === hd.x && s.y === hd.y; })) { R.bad(word); if (!R.over) { reset(); lay(); } return; }
      snake.unshift(hd); var li = -1; letters.forEach(function (l, i) { if (l.x === hd.x && l.y === hd.y) li = i; });
      if (li < 0) { snake.pop(); return; }
      if (letters[li].ok) {
        idx++; sfx('blip'); var p = R.at(hd.x * cell + cell / 2, hd.y * cell + cell / 2); burst(p[0], p[1], [col.g, col.a], 8, 160);
        if (idx >= word.en.length) { R.good(word, hd.x * cell + cell / 2, hd.y * cell + cell / 2); if (!R.over) { snake.length = Math.min(snake.length, 5); nextWord(); } } else { R.setTarget(word, spell()); lay(); }
      } else { snake.pop(); R.bad(word); if (!R.over) lay(); }
    }
    function turn(dx, dy) { if (queue.length < 2) queue.push({ x: dx, y: dy }); }
    stage.querySelectorAll('[data-d]').forEach(function (b) { b.onclick = function () { var d = b.dataset.d.split(','); turn(+d[0], +d[1]); }; });
    var o = null; cv.onpointerdown = function (e) { o = [e.clientX, e.clientY]; };
    cv.onpointermove = function (e) { if (!o) return; var dx = e.clientX - o[0], dy = e.clientY - o[1]; if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return; if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0); else turn(0, dy > 0 ? 1 : -1); o = [e.clientX, e.clientY]; };
    cv.onpointerup = cv.onpointercancel = function () { o = null; };
    var key = function (e) { var m = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key]; if (m) { e.preventDefault(); turn(m[0], m[1]); } }; addEventListener('keydown', key);
    reset(); nextWord(); draw();
    R.step = function (dt) { acc += dt; var moved = false; while (acc >= tick && !R.over) { acc -= tick; move(); moved = true; } if (moved && !R.over) draw(); };
    R.cleanup = function () { removeEventListener('keydown', key); };
  }

  /* ---------------- 2. Word Catch ---------------- */
  function gCatch(R, stage) {
    stage.classList.add('gm-catch'); stage.innerHTML = '<div class="gm-far" id="gmFar"></div><div class="gm-near" id="gmNear"></div><div class="gm-basket" id="gmBasket"><svg viewBox="0 0 104 56" aria-hidden="true"><path d="M6 14h92l-10 36a6 6 0 0 1-6 4H22a6 6 0 0 1-6-4z" fill="var(--gold)"/><path d="M6 14h92" stroke="var(--gold-ink)" stroke-width="5" stroke-linecap="round"/><path d="M30 18l4 32M52 18v32M74 18l-4 32" stroke="var(--gold-ink)" stroke-width="2" opacity=".5"/></svg></div>';
    var bk = document.getElementById('gmBasket'), W = stage.clientWidth, H = stage.clientHeight, bx = W / 2, items = [], spawnT = 0.5, since = 2, words = shuf(R.pool), wi = 0, target, speed = lerp(75, 185, Math.min(1, R.c.t)), gap = lerp(1.6, 0.8, Math.min(1, R.c.t));
    var far = document.getElementById('gmFar'), nearL = document.getElementById('gmNear');
    function place() { bx = Math.max(52, Math.min(W - 52, bx)); bk.style.transform = 'translate3d(' + (bx - 52) + 'px,0,0)'; var off = bx - W / 2; far.style.transform = 'translate3d(' + (-off * 0.05) + 'px,0,0)'; nearL.style.transform = 'translate3d(' + (-off * 0.14) + 'px,0,0)'; }
    function next() { target = words[wi++ % words.length]; R.setTarget(target); items.forEach(function (it) { it.ok = it.w.en === target.en; }); since = 2; }
    function spawn() { var ok = since >= 2 || Math.random() < 0.4; since = ok ? 0 : since + 1; var w = ok ? target : distract(target, R, 1)[0]; var el = document.createElement('div'); el.className = 'gm-fall'; el.lang = 'en'; el.textContent = w.en; stage.appendChild(el); var wd = el.offsetWidth; items.push({ el: el, w: w, ok: ok, x: rnd(6, Math.max(8, W - wd - 6)), y: -44, wd: wd, v: speed * rnd(0.85, 1.15) }); }
    function drop(it) { it.el.remove(); items.splice(items.indexOf(it), 1); }
    var mv = function (e) { var r = stage.getBoundingClientRect(); bx = e.clientX - r.left; place(); };
    stage.onpointerdown = function (e) { mv(e); stage.onpointermove = mv; }; stage.onpointerup = stage.onpointercancel = function () { stage.onpointermove = null; };
    var key = function (e) { if (e.key === 'ArrowLeft') { bx -= 44; place(); } else if (e.key === 'ArrowRight') { bx += 44; place(); } }; addEventListener('keydown', key);
    place(); next();
    R.step = function (dt) {
      spawnT -= dt; if (spawnT <= 0 && items.length < 6) { spawn(); spawnT = gap * rnd(0.8, 1.2); }
      items.slice().forEach(function (it) {
        it.y += it.v * dt; it.el.style.transform = 'translate3d(' + it.x + 'px,' + it.y + 'px,0)';
        if (it.y + 38 >= H - 58 && it.y < H - 30 && it.x + it.wd > bx - 50 && it.x < bx + 50) {
          var ok = it.ok; drop(it); bk.classList.remove('wig'); void bk.offsetWidth; bk.classList.add('wig');
          if (ok) { sfx('tok'); R.good(target, bx, H - 66); if (!R.over) next(); } else R.bad(target);
        } else if (it.y > H + 10) { var was = it.ok; drop(it); if (was && R.c.hard) R.bad(target); }
      });
    };
    R.cleanup = function () { removeEventListener('keydown', key); };
  }

  /* ---------------- 3. The Ladder ---------------- */
  function gLadder(R, stage) {
    stage.classList.add('gm-ladder'); if (R.c.hard) { R.lives = R.lives0 = 1; R.hud(); } var life = { half: true, slow: true }; var rung = 0, safe = 0, pot = 0, words = shuf(R.pool), wi = 0, cur, lock = false, tMax = R.c.hard ? lerp(9, 5, Math.min(1, R.c.t)) : 0, tLeft = 0;
    function q() {
      cur = words[wi++ % words.length]; lock = false; tLeft = tMax; R.setTarget(cur); var opts = shuf([cur].concat(distract(cur, R, R.c.opts - 1))), rs = '';
      for (var i = R.need; i >= 1; i--) rs += '<li class="' + (i <= rung ? 'on' : '') + (i === safe ? ' safe' : '') + (i === rung + 1 ? ' next' : '') + '"><span>' + (i === R.need ? ic('star') : i) + '</span></li>';
      stage.innerHTML = '<ol class="gm-rungs" aria-label="' + T('Jaranjarada', 'Ladder') + '">' + rs + '</ol><div class="gm-ladq">' + (tMax ? '<div class="gm-timer"><i id="gmTime"></i></div>' : '') + '<p class="gm-pot">' + T('Aan la kaydin', 'Not banked yet') + ' <b>' + pot + '</b></p><div class="opts">' + opts.map(function (o) { return '<button type="button" class="opt keep-emoji" lang="en" data-w="' + esc(o.en) + '">' + esc(o.en) + '</button>'; }).join('') + '</div><button type="button" class="btn secondary gm-bank" id="gmBank"' + (rung > safe ? '' : ' disabled') + '>' + ic('coin') + T('Kaydi dhibcahayga', 'Bank my points') + '</button><div class="gm-life"><button type="button" class="chipbtn" id="gmHalf"' + (life.half && opts.length >= 3 ? '' : ' disabled') + '>' + T('Ka saar laba khalad', 'Remove two wrong') + '</button><button type="button" class="chipbtn" id="gmSlow"' + (life.slow ? '' : ' disabled') + '>' + ic('speaker') + T('Tartiib ii akhri', 'Say it slowly') + '</button></div><p class="small muted">' + (R.c.hard ? T('Heerka Adag: hal khalad ayaa fuulitaanka soo afjaraya. ', 'Hard: one wrong step ends the climb. ') : '') + T('Kaydintu waxay ilaalinaysaa meesha aad joogto, laakiin isku-xigxigga ×2 / ×3 ayay dib u bilaabaysaa.', 'Banking protects where you stand, but restarts your ×2 / ×3 streak.') + '</p></div>';
      stage.querySelectorAll('[data-w]').forEach(function (b) { b.onclick = function () { answer(b); }; });
      document.getElementById('gmHalf').onclick = function () { if (!life.half || lock) return; life.half = false; this.disabled = true; sfx('pop'); var n = 0; stage.querySelectorAll('[data-w]').forEach(function (o) { if (o.dataset.w !== cur.en && n < 2) { o.disabled = true; o.classList.add('gone'); n++; } }); };
      document.getElementById('gmSlow').onclick = function () { if (!life.slow || lock) return; life.slow = false; this.disabled = true; try { speak(cur.en, true); } catch (e) { } };
      document.getElementById('gmBank').onclick = function () { if (lock || rung <= safe) return; safe = rung; pot = 0; R.combo = 0; sfx('coins'); var r = this.getBoundingClientRect(); burst(r.left + r.width / 2, r.top, [cssv('--gold'), '#fff3c4'], 22, 220); R.hud(); q(); };
    }
    function wrong(b) { lock = true; if (b) b.classList.add('wrong'); stage.querySelectorAll('[data-w]').forEach(function (o) { if (o.dataset.w === cur.en) o.classList.add('correct'); }); R.score = Math.max(0, R.score - pot); pot = 0; rung = safe; R.got = rung; R.bad(cur); if (!R.over) setTimeout(function () { if (!R.over) q(); }, 1100); }
    function answer(b) {
      if (lock) return; lock = true;
      if (b.dataset.w === cur.en) { b.classList.add('correct'); var before = R.score, r = b.getBoundingClientRect(), s = stage.getBoundingClientRect(); rung++; if (rung >= R.need) R.got = R.need - 1; else R.got = rung - 1; R.good(cur, r.left - s.left + r.width / 2, r.top - s.top); pot += R.score - before; if (!R.over) setTimeout(function () { if (!R.over) q(); }, 700); }
      else wrong(b);
    }
    q(); R.step = function (dt) { if (!tMax || lock) return; tLeft -= dt; var el = document.getElementById('gmTime'); if (el) el.style.width = Math.max(0, tLeft / tMax * 100) + '%'; if (tLeft <= 0) wrong(null); };
  }

  /* ---------------- 4. Memory Match ---------------- */
  function gMatch(R, stage) {
    stage.classList.add('gm-match'); var n = R.need, ws = shuf(R.pool.filter(function (e) { return visualFor(e.en); })).slice(0, n), text = R.c.L >= 6, cards = [], open = [], busy = false, back = R.c.hard ? 650 : 1050;
    ws.forEach(function (w) { cards.push({ w: w, k: 'a' }); cards.push({ w: w, k: 'b' }); }); cards = shuf(cards);
    stage.style.setProperty('--cols', cards.length <= 8 ? (cards.length <= 6 ? 3 : 4) : 4);
    stage.innerHTML = cards.map(function (c, i) { return '<button type="button" class="gm-mc" data-i="' + i + '" aria-label="' + T('Kaar', 'Card') + ' ' + (i + 1) + '"><span class="gm-mc-in"><span class="gm-mc-b">' + ic('sparkle') + '</span><span class="gm-mc-f keep-emoji"' + (c.k === 'b' ? ' lang="en"' : '') + '>' + (c.k === 'b' ? '<b>' + esc(c.w.en) + '</b>' : text ? '<span lang="so">' + esc(c.w.so) + '</span>' : visHTML(c.w.en)) + '</span></span></button>'; }).join('');
    R.setTarget(ws[0], ''); document.getElementById('gmTarget').innerHTML = '<span class="gm-tt"><span class="gm-tso">' + T(text ? 'Isku aadi erayga Soomaaliga iyo kan Ingiriisiga' : 'Isku aadi sawirka iyo erayga Ingiriisiga', text ? 'Match the Somali word to the English word' : 'Match the picture to the English word') + '</span></span>';
    var els = stage.querySelectorAll('.gm-mc');
    function flip(i, on) { els[i].classList.toggle('open', on); }
    function tap(i) {
      var c = cards[i]; if (busy || c.open || c.done || R.over) return; c.open = true; flip(i, true); sfx('pop'); if (c.k === 'b') sayWord(c.w.en, 120); open.push(i);
      if (open.length < 2) return; busy = true; var a = open[0], b = open[1], A = cards[a], B = cards[b]; open = [];
      if (A.w === B.w) { setTimeout(function () { A.done = B.done = true; els[a].classList.add('done'); els[b].classList.add('done'); var r = els[b].getBoundingClientRect(), s = stage.getBoundingClientRect(); busy = false; R.good(A.w, r.left - s.left + r.width / 2, r.top - s.top + r.height / 2); }, 320); }
      else { var knew = A.seen && B.seen; A.seen = B.seen = true; setTimeout(function () { A.open = B.open = false; flip(a, false); flip(b, false); busy = false; if (knew) R.bad(B.k === 'b' ? B.w : A.w); else R.soft(); }, back); }
    }
    els.forEach(function (el) { el.onclick = function () { tap(+el.dataset.i); }; });
    if (!R.c.hard && R.c.L <= 4) { busy = true; els.forEach(function (el) { el.classList.add('open'); }); setTimeout(function () { els.forEach(function (el) { el.classList.remove('open'); }); busy = false; }, 1700); }
  }

  /* ---------------- 5. Duel Dash ---------------- */
  function gDuel(R, stage) {
    stage.classList.add('gm-duel'); var me = 0, rv = 0, pace = lerp(5.4, 2.6, Math.min(1, R.c.t)) * (R.c.hard ? 0.85 : 1), words = shuf(R.pool), wi = 0, cur, lock = false, nOpt = R.c.L <= 4 ? 2 : 3, init = ((S.profile.name || 'A').charAt(0) || 'A').toUpperCase();
    stage.innerHTML = '<div class="gm-track"><div class="gm-lane"><span class="gm-run me" id="gmMe">' + esc(init) + '</span></div><div class="gm-lane"><span class="gm-run rv" id="gmRv" title="Geel">G</span></div><span class="gm-finish" aria-hidden="true"></span></div><p class="small muted gm-vs">' + T('Adiga iyo Geel — yaa hor gaari doona?', 'You and Geel — who gets there first?') + '</p><div class="opts" id="gmOpts"></div>';
    var eMe = document.getElementById('gmMe'), eRv = document.getElementById('gmRv'), box = document.getElementById('gmOpts');
    function pos() { eMe.style.left = 'calc(' + Math.min(1, me / R.need) * 100 + '% - ' + Math.min(1, me / R.need) * 44 + 'px)'; eRv.style.left = 'calc(' + Math.min(1, rv / R.need) * 100 + '% - ' + Math.min(1, rv / R.need) * 44 + 'px)'; }
    function q() { cur = words[wi++ % words.length]; lock = false; R.setTarget(cur); box.innerHTML = shuf([cur].concat(distract(cur, R, nOpt - 1))).map(function (o) { return '<button type="button" class="opt keep-emoji" lang="en" data-w="' + esc(o.en) + '">' + esc(o.en) + '</button>'; }).join(''); box.querySelectorAll('[data-w]').forEach(function (b) { b.onclick = function () { ans(b); }; }); }
    function ans(b) {
      if (lock || R.over) return; lock = true;
      if (b.dataset.w === cur.en) { b.classList.add('correct'); me++; pos(); var r = eMe.getBoundingClientRect(), s = stage.getBoundingClientRect(); eMe.classList.remove('hop'); void eMe.offsetWidth; eMe.classList.add('hop'); R.good(cur, r.left - s.left + 22, r.top - s.top); if (!R.over) setTimeout(function () { if (!R.over) q(); }, 420); }
      else { b.classList.add('wrong'); box.querySelectorAll('[data-w]').forEach(function (o) { if (o.dataset.w === cur.en) o.classList.add('correct'); }); rv += 0.35; R.bad(cur); if (!R.over) setTimeout(function () { if (!R.over) q(); }, 1000); }
    }
    pos(); q();
    R.step = function (dt) { var near = R.need - rv < 1.2 && R.need - me <= 2; rv += dt / pace * (near ? 0.5 : 1); stage.classList.toggle('near', near); pos(); if (rv >= R.need) { R.toast(cur, T('Geel ayaa hor gaaray', 'Geel got there first')); R.missed[cur.en] = cur; R.fail(); } };
  }

  /* ---------------- 6. Word Slice ---------------- */
  function gSlice(R, stage) {
    stage.classList.add('gm-slice'); var dpr = Math.min(2, window.devicePixelRatio || 1), cv = document.createElement('canvas'), x = cv.getContext('2d'), W = stage.clientWidth, H = stage.clientHeight; stage.innerHTML = ''; stage.appendChild(cv);
    cv.style.width = W + 'px'; cv.style.height = H + 'px'; cv.width = W * dpr; cv.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
    var items = [], trail = [], waveT = 0.6, since = 1, words = shuf(R.pool), wi = 0, target, per = 0, hits = 0, down = false, sp = lerp(0.74, 1.2, Math.min(1, R.c.t)), g = H * 1.25 * sp * sp, gap = lerp(1.9, 0.95, Math.min(1, R.c.t)), fruit = ['#e4572e', '#f2a541', '#7fb069', '#d96c9f', '#58a4b0', '#c8553d'], ink = cssv('--ink'), paper = '#fffdf8', bombLook = !R.c.hard && R.c.L <= 5;
    function next() { target = words[wi++ % words.length]; per = 0; R.setTarget(target); items.forEach(function (it) { it.ok = it.w.en === target.en; it.bomb = !it.ok && bombLook; }); since = 1; }
    function toss() {
      var k = Math.min(4, 1 + Math.floor(R.c.L / 3) + (R.c.hard ? 1 : 0)), n = Math.max(1, Math.round(rnd(Math.max(1, k - 1), k))), dz = distract(target, R, n);
      for (var i = 0; i < n; i++) { var ok = i === 0 ? (since >= 1 || Math.random() < 0.65) : Math.random() < (R.c.L >= 4 ? 0.3 : 0.12); var w = ok ? target : dz[i % dz.length]; var px = rnd(0.14, 0.86) * W; items.push({ w: w, ok: ok, bomb: !ok && bombLook, x: px, y: H + 40, vx: (W / 2 - px) / rnd(1.6, 2.6) + rnd(-20, 20), vy: -Math.sqrt(2 * g * H * rnd(0.6, 0.8)), r: 34, rot: rnd(0, 6), vr: rnd(-2, 2), c: fruit[Math.floor(rnd(0, fruit.length))] }); }
      since = items.some(function (it) { return it.ok; }) ? 0 : since + 1;
    }
    function drawItem(it) {
      x.save(); x.translate(it.x, it.y); x.save(); x.rotate(it.rot);
      if (it.bomb) { x.fillStyle = '#2b2a27'; x.beginPath(); x.arc(0, 0, it.r, 0, 6.3); x.fill(); x.strokeStyle = '#8b867c'; x.lineWidth = 3; x.beginPath(); x.moveTo(it.r * 0.5, -it.r * 0.8); x.quadraticCurveTo(it.r * 0.9, -it.r * 1.3, it.r * 1.1, -it.r * 1.05); x.stroke(); x.fillStyle = '#e9b44c'; x.beginPath(); x.arc(it.r * 1.1, -it.r * 1.05, 4, 0, 6.3); x.fill(); }
      else { x.fillStyle = it.c; x.beginPath(); x.arc(0, 0, it.r, 0, 6.3); x.fill(); x.fillStyle = 'rgba(255,255,255,.28)'; x.beginPath(); x.arc(-it.r * 0.3, -it.r * 0.35, it.r * 0.3, 0, 6.3); x.fill(); x.fillStyle = '#3f7d3a'; x.beginPath(); x.ellipse(it.r * 0.25, -it.r * 0.98, 9, 4.5, -0.6, 0, 6.3); x.fill(); }
      x.restore(); x.font = '700 16px Inter,system-ui,sans-serif'; var tw = x.measureText(it.w.en).width + 16; x.fillStyle = paper; x.beginPath(); if (x.roundRect) x.roundRect(-tw / 2, -13, tw, 26, 8); else x.rect(-tw / 2, -13, tw, 26); x.fill(); x.fillStyle = ink; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(it.w.en, 0, 1); x.restore();
    }
    function cut(it) {
      items.splice(items.indexOf(it), 1); var p = R.at(it.x, it.y);
      if (it.ok) { sfx('shwick'); hits++; per++; burst(p[0], p[1], [it.c, '#fff', it.c], 20, 320); R.good(target, it.x, it.y, hits >= 2); if (!R.over && per >= 2) next(); }
      else { burst(p[0], p[1], ['#2b2a27', '#8b867c', '#e9b44c'], 18, 300); R.bad(target); }
    }
    function seg(a, b) { items.slice().forEach(function (it) { var dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((it.x - a.x) * dx + (it.y - a.y) * dy) / l2)), qx = a.x + t * dx - it.x, qy = a.y + t * dy - it.y; if (qx * qx + qy * qy < it.r * it.r && !R.over) cut(it); }); }
    function pt(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }; }
    cv.onpointerdown = function (e) { down = true; hits = 0; trail = [pt(e)]; try { cv.setPointerCapture(e.pointerId); } catch (er) { } };
    cv.onpointermove = function (e) { if (!down) return; var p = pt(e), a = trail[trail.length - 1]; trail.push(p); if (trail.length > 14) trail.shift(); if (a) seg(a, p); };
    cv.onpointerup = cv.onpointercancel = function () { down = false; };
    next();
    R.step = function (dt) {
      waveT -= dt; if (waveT <= 0 && items.length < 7) { toss(); waveT = gap * rnd(0.85, 1.15); }
      x.clearRect(0, 0, W, H);
      items.slice().forEach(function (it) { it.vy += g * dt; it.x += it.vx * dt; it.y += it.vy * dt; it.rot += it.vr * dt; if (it.y > H + 70 && it.vy > 0) { items.splice(items.indexOf(it), 1); if (it.ok && R.c.hard) R.bad(target); return; } drawItem(it); });
      var now = performance.now(); trail = trail.filter(function (p) { return now - p.t < 180; });
      if (trail.length > 1) { x.lineCap = 'round'; x.lineJoin = 'round'; for (var i = 1; i < trail.length; i++) { x.strokeStyle = 'rgba(233,180,76,' + (i / trail.length) + ')'; x.lineWidth = 2 + 6 * i / trail.length; x.beginPath(); x.moveTo(trail[i - 1].x, trail[i - 1].y); x.lineTo(trail[i].x, trail[i].y); x.stroke(); } }
    };
  }



  /* ---------------- daily quests: one game, one review, one new word set ---------------- */
  function qz() { var g = gz(), t = todayStr(); if (!g.q || g.q.d !== t) g.q = { d: t }; return g.q; }
  function quest(k) { if (!S) return; var q = qz(); if (!q[k]) { q[k] = 1; } }
  function questState() { var q = qz(), noDue = false; try { noDue = dueCards().length === 0; } catch (e) { } var r = !!q.review || noDue; return { game: !!q.game, review: r, reviewFree: !q.review && noDue, words: !!q.words, n: (q.game ? 1 : 0) + (r ? 1 : 0) + (q.words ? 1 : 0), chest: !!q.chest }; }
  if (typeof srsApplyGrade === 'function') { var gradeWas = srsApplyGrade; srsApplyGrade = function (c, g) { var r = gradeWas(c, g); try { quest('review'); } catch (e) { } return r; }; }
  function nextLessonN() { var n = 1; while (n < LESSONS.length && S.completed['L' + n]) n++; return n; }
  function dayWord() { var d = Math.floor(Date.now() / 86400000), p = DICT_ENTRIES.filter(function (e) { return /^[a-z]+$/i.test(e.en); }); return p[d % p.length]; }
  function questHTML() {
    var s = questState(), g = gz();
    function row(done, so, en, sub, act, lab) { return '<li class="' + (done ? 'done' : '') + '"><span class="gm-qc">' + (done ? ic('check') : '') + '</span><span class="gm-qt"><b>' + T(so, en) + '</b><small>' + sub + '</small></span>' + (done ? '' : '<button type="button" class="btn secondary" data-quest="' + act + '">' + lab + '</button>') + '</li>'; }
    return '<section class="gm-quest" aria-label="' + T('Hawlaha maanta', 'Today’s quests') + '"><div class="journey-head"><h2>' + T('Hawlaha maanta', 'Today’s quests') + '</h2><span>' + s.n + ' / 3</span></div><ul>'
      + row(s.game, 'Hal ciyaar ciyaar', 'Play one game', T('Ciyaar kasta, heer kasta', 'Any game, any level'), 'game', T('Ciyaar', 'Play'))
      + row(s.review, 'Hal dib-u-eegis samee', 'Do one review', s.reviewFree ? T('Maanta kaarar ku sugaya ma jiraan', 'No cards are waiting today') : T('Kaararkaaga dib u eeg', 'Review your cards'), 'review', T('Dib u eeg', 'Review'))
      + row(s.words, 'Baro shan eray oo cusub', 'Learn five new words', T('Erayada casharkaaga xiga', 'Words from your next lesson'), 'words', T('Baro', 'Learn'))
      + '</ul><div class="gm-chest' + (s.n === 3 ? ' ready' : '') + (s.chest ? ' open' : '') + '"><span class="gm-chest-ic">' + ic(s.chest ? 'award' : 'lock') + '</span><span class="gm-qt"><b>' + (s.chest ? T('Khasnadda maanta waa la furay', 'Today’s treasure is opened') : T('Khasnadda', 'The treasure stop')) + '</b><small>' + (s.chest ? T('Khasnadaha aad furtay: ', 'Treasures opened: ') + (g.treasures || 0) : s.n === 3 ? T('Saddexdii waad dhammaysay!', 'All three are done!') : T('Saddexda hawlood dhammee si ay u furanto', 'Finish all three to open it')) + '</small></span>' + (s.n === 3 && !s.chest ? '<button type="button" class="btn gm-glow" id="gmChest">' + T('Fur', 'Open') + '</button>' : '') + '</div></section>';
  }
  function wireQuests() {
    app.querySelectorAll('[data-quest]').forEach(function (b) { b.onclick = function () { var a = b.dataset.quest; if (a === 'review') { setNav('review'); render(); } else if (a === 'words') { P.route = 'words'; P.ws = 0; paint(); window.scrollTo({ top: 0, behavior: 'instant' }); } else { var l = app.querySelector('.gm-list'); if (l) l.scrollIntoView({ block: 'start' }); } }; });
    var c = document.getElementById('gmChest'); if (c) c.onclick = function () {
      var q = qz(), g = gz(), w = dayWord(); q.chest = 1; g.treasures = (g.treasures || 0) + 1; save(); sfx('coins'); setTimeout(function () { sfx('fanfare'); }, 350); confetti();
      app.innerHTML = '<div class="gm-result win"><p class="hero-eyebrow">' + T('Khasnadda maanta', 'Today’s treasure') + '</p><div class="gm-chest-big">' + ic('award') + '</div><h1>' + T('Saddexdii hawlood waa dhammaadeen!', 'All three quests done!') + '</h1><p class="simple-intro">' + T('Maalin kasta wax yar — sidaas ayaa luqad lagu bartaa. Khasnaddaada maanta waa eray:', 'A little every day — that is how a language is learned. Today’s treasure is a word:') + '</p><div class="gm-hero-word"><span class="gm-pic keep-emoji">' + (visualFor(w.en) ? visHTML(w.en) : '') + '</span><b lang="en">' + esc(w.en) + '</b><span lang="so">' + esc(w.so) + '</span></div><div class="gm-two"><button type="button" class="btn" id="gmHome">' + T('Ku noqo ciyaaraha', 'Back to the games') + '</button><button type="button" class="btn secondary" id="gmSave">' + ic('plus') + T('Ku dar kaararkayga', 'Add to my cards') + '</button></div></div>';
      sayWord(w.en, 1400); document.getElementById('gmHome').onclick = function () { P.route = 'home'; paint(); }; document.getElementById('gmSave').onclick = function () { try { addSRS(w.en, w.so); save(); } catch (e) { } this.disabled = true; };
    };
  }
  function wordSet() {
    var L = LESSONS[nextLessonN() - 1], ws = (L.vocab || []).slice(0, 5), i = P.ws || 0;
    if (i >= ws.length) { quest('words'); save(); sfx('chime'); P.route = 'home'; paint(); return; }
    var w = ws[i];
    app.innerHTML = '<div class="gmh"><button type="button" class="simple-back" id="gmBack">' + ic('back') + T('Ciyaaraha', 'All games') + '</button><p class="hero-eyebrow">' + T('Erayada cusub', 'New words') + ' · ' + (i + 1) + ' / ' + ws.length + '</p><h1>' + T('Shan eray oo casharkaaga xiga ah', 'Five words from your next lesson') + '</h1><article class="cz-card gm-ws"><span class="gm-pic keep-emoji">' + (visualFor(w.en) ? visHTML(w.en) : '') + '</span><div class="cz-qrow"><h2 class="cz-q" lang="en">' + esc(w.en) + '</h2>' + speakBtn(w.en) + '</div><p class="gm-ws-so" lang="so">' + esc(w.so) + '</p>' + (w.exEn ? '<p class="cz-so"><span lang="en">' + esc(w.exEn) + '</span><br><span class="muted" lang="so">' + esc(w.exSo || '') + '</span></p>' : '') + '<button type="button" class="btn cz-wide" id="gmWsNext">' + (i === ws.length - 1 ? T('Dhammee', 'Finish') : T('Xiga', 'Next')) + ic('arrow') + '</button></article><p class="small muted">' + T('Casharka ', 'Lesson ') + L.n + ': ' + esc(T(L.titleSo, L.titleEn)) + '</p></div>';
    bindSpeak(app); sayWord(w.en, 250); document.getElementById('gmBack').onclick = function () { P.route = 'home'; paint(); }; document.getElementById('gmWsNext').onclick = function () { P.ws = i + 1; paint(); };
  }

  /* ---------------- Duel Dash: the rivalry engine ---------------- */
  var DD = { E: { len: 5, les: 60, opts: 3, so: 'Xad fudud', en: 'Easy' }, M: { len: 7, les: 150, opts: 3, so: 'Dhexe', en: 'Medium' }, H: { len: 11, les: 250, opts: 4, so: 'Adag', en: 'Hard' } };
  function rng(seed) { var a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function duelPool(d) { var c = DD[d]; return DICT_ENTRIES.filter(function (e) { return /^[a-z]+$/i.test(e.en) && e.en.length >= 2 && e.en.length <= c.len && e.lesson <= c.les; }).sort(function (a, b) { return a.en < b.en ? -1 : a.en > b.en ? 1 : 0; }); }
  function duelQs(seed, d) { var r = rng(seed), p = duelPool(d), qs = [], n = DD[d].opts; for (var i = 0; i < 45; i++) { var w = p[Math.floor(r() * p.length)], o = [w], guard = 0; while (o.length < n && guard++ < 200) { var x = p[Math.floor(r() * p.length)]; if (o.indexOf(x) < 0 && x.so !== w.so) o.push(x); } for (var a = o.length - 1; a > 0; a--) { var b = Math.floor(r() * (a + 1)), t = o[a]; o[a] = o[b]; o[b] = t; } qs.push({ w: w, o: o }); } return qs; }
  function sum36(body, d) { var s = body + '|' + duelPool(d).length, n = 7; for (var i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) % 36; return n.toString(36).toUpperCase(); }
  function mintCode(seed, d, score) { var body = seed.toString(36).toUpperCase() + '-' + d + '-' + score.toString(36).toUpperCase(); return body + '-' + sum36(body, d); }
  function readCode(str) { var m = /^\s*([0-9A-Z]{1,7})-([EMH])-([0-9A-Z]{1,4})-([0-9A-Z])\s*$/.exec(String(str || '').toUpperCase()); if (!m) return null; var body = m[1] + '-' + m[2] + '-' + m[3]; if (sum36(body, m[2]) !== m[4]) return null; return { seed: parseInt(m[1], 36), d: m[2], score: parseInt(m[3], 36) }; }
  function newSeed() { return 1 + Math.floor(Math.random() * 60466175); }
  function diffSeg(cur) { return '<div class="cz-seg gm-diff" role="group" aria-label="' + T('Adkaanta', 'Difficulty') + '">' + ['E', 'M', 'H'].map(function (d) { return '<button type="button" data-dd="' + d + '" aria-pressed="' + (cur === d) + '"><b>' + T(DD[d].so, DD[d].en) + '</b></button>'; }).join('') + '</div>'; }
  function duelRound(cfg, done) {
    stopGame(); stopMusic(); P.route = 'round'; document.body.classList.add('gm-playing');
    var qs = duelQs(cfg.seed, cfg.d), i = 0, score = 0, right = 0, combo = 0, best = 0, total = (window.__GM && window.__GM.duelSecs) || 60, left = total, lock = false, over = false, raf = 0, last = performance.now(), missed = {};
    app.innerHTML = '<div class="gm gm-dr"><div class="gm-hud"><button type="button" class="iconbtn" id="gmQuit" aria-label="' + T('Ka bax', 'Quit') + '">' + ic('close') + '</button><div class="gm-lv"><b>' + esc(cfg.title) + '</b><span>' + esc(cfg.sub || '') + '</span></div><div class="gm-score"><b id="gmScore">0</b><span id="gmCombo"></span></div></div><div class="gm-clock"><div class="gm-clock-bar"><i id="gmClock"></i></div><b id="gmSecs">' + total + '</b>' + (cfg.beat != null ? '<em>' + T('Ka badi ', 'Beat ') + cfg.beat + '</em>' : '') + '</div><div class="gm-target" id="gmTarget"></div><div class="opts" id="gmOpts"></div><div class="gm-toast" id="gmToast" aria-live="polite"></div></div>';
    var box = document.getElementById('gmOpts');
    function q() { var x = qs[i % qs.length]; lock = false; document.getElementById('gmTarget').innerHTML = '<span class="gm-pic keep-emoji">' + (visualFor(x.w.en) ? visHTML(x.w.en) : '') + '</span><span class="gm-tt"><span class="gm-tso" lang="so">' + esc(x.w.so) + '</span></span>'; box.innerHTML = x.o.map(function (o) { return '<button type="button" class="opt keep-emoji" lang="en" data-w="' + esc(o.en) + '">' + esc(o.en) + '</button>'; }).join(''); box.querySelectorAll('[data-w]').forEach(function (b) { b.onclick = function () { ans(b, x); }; }); }
    function hud() { document.getElementById('gmScore').textContent = score; var m = Math.min(3, Math.max(1, combo)), c = document.getElementById('gmCombo'); c.textContent = m > 1 ? '×' + m : ''; c.className = m > 1 ? 'on' : ''; }
    function ans(b, x) {
      if (lock || over) return; lock = true;
      if (b.dataset.w === x.w.en) { combo++; best = Math.max(best, combo); right++; score += 10 * Math.min(3, combo); b.classList.add('correct'); sfx(combo > 1 ? 'combo' : 'chime'); var r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, [cssv('--gold'), cssv('--accent'), '#fff'], 12); document.getElementById('gmToast').innerHTML = '<div class="gm-word"><b lang="en">' + esc(x.w.en) + '</b><span lang="so">' + esc(x.w.so) + '</span></div>'; hud(); i++; setTimeout(function () { if (!over) q(); }, 240); }
      else { combo = 0; missed[x.w.en] = x.w; b.classList.add('wrong'); box.querySelectorAll('[data-w]').forEach(function (o) { if (o.dataset.w === x.w.en) o.classList.add('correct'); }); sfx('thud'); hud(); i++; setTimeout(function () { if (!over) q(); }, 800); }
    }
    function end(quit) {
      if (over) return; over = true; cancelAnimationFrame(raf); document.body.classList.remove('gm-playing'); if (quit) { cfg.quit(); return; }
      var xp = 0; if (cfg.owner) { Object.keys(missed).forEach(function (m) { try { addSRS(missed[m].en, missed[m].so); } catch (e) { } }); quest('game'); try { xp = awardBestXP('game:duel:round:' + cfg.d, Math.min(30, right)); } catch (e) { } save(); }
      sfx('fanfare'); done({ score: score, right: right, best: best, xp: xp });
    }
    document.getElementById('gmQuit').onclick = function () { end(true); };
    q(); raf = requestAnimationFrame(function f(ts) { if (over) return; var dt = Math.min(0.1, (ts - last) / 1000); last = ts; left -= dt; document.getElementById('gmClock').style.width = Math.max(0, left / total * 100) + '%'; document.getElementById('gmSecs').textContent = Math.max(0, Math.ceil(left)); if (left <= 10) document.querySelector('.gm-clock').classList.add('low'); if (left <= 0) { end(false); return; } raf = requestAnimationFrame(f); });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  /* (a) pass-and-play: two players, one phone, the same questions each round */
  function passPlay() {
    var pp = P.pp = P.pp || { stage: 'setup', names: [(S.profile.name || '').split(' ')[0] || T('Ciyaartoy 1', 'Player 1'), T('Ciyaartoy 2', 'Player 2')], d: 'E', rounds: 1 };
    var h = '<div class="gmh"><button type="button" class="simple-back" id="gmBack">' + ic('back') + T('Tartanka Degdegga', 'Duel Dash') + '</button>';
    if (pp.stage === 'setup') {
      h += '<h1>' + T('Laba ciyaartoy, hal taleefan', 'Two players, one phone') + '</h1><p class="simple-intro">' + T('Hooyo iyo gabadheed, awoowe iyo wiilka uu awoowga u yahay. Midkiin kasta wuxuu helayaa 60 ilbiriqsi iyo isla su’aalihii.', 'Mother and daughter, grandfather and grandchild. Each of you gets 60 seconds and the very same questions.') + '</p><form id="gmPP" class="cz-form"><label class="simple-label" for="gmN0">' + T('Ciyaartoyga 1aad', 'Player 1') + '</label><input type="text" id="gmN0" maxlength="14" value="' + esc(pp.names[0]) + '"><label class="simple-label" for="gmN1">' + T('Ciyaartoyga 2aad', 'Player 2') + '</label><input type="text" id="gmN1" maxlength="14" value="' + esc(pp.names[1]) + '"><p class="simple-label">' + T('Adkaanta', 'Difficulty') + '</p>' + diffSeg(pp.d) + '<p class="simple-label">' + T('Imisa wareeg?', 'How many rounds?') + '</p><div class="cz-seg gm-diff">' + [1, 2, 3].map(function (n) { return '<button type="button" data-rounds="' + n + '" aria-pressed="' + (pp.rounds === n) + '"><b>' + n + '</b></button>'; }).join('') + '</div><button type="submit" class="btn cz-wide">' + T('Bilow tartanka', 'Start the duel') + ic('arrow') + '</button></form>';
    } else if (pp.stage === 'hand') {
      var who = pp.order[pp.turn], other = 1 - who, second = pp.turn % 2 === 1;
      h += '<div class="gm-hand"><p class="hero-eyebrow">' + T('Wareegga ', 'Round ') + (pp.r + 1) + ' / ' + pp.rounds + '</p><div class="gm-run me big">' + esc(pp.names[who].charAt(0).toUpperCase()) + '</div><h1>' + T('Taleefanka u dhiib ', 'Hand the phone to ') + esc(pp.names[who]) + '</h1><p class="simple-intro">' + (second ? esc(pp.names[other]) + T(': ', ' scored ') + pp.rs[other] + T(' dhibcood. Isla su’aalihii ayaad helaysaa — ka badi!', '. You get the same questions — beat it!') : T('60 ilbiriqsi. Sawirka eeg, erayga saxda ah taabo.', '60 seconds. Look at the picture, tap the right word.')) + '</p><div class="gm-tot"><span>' + esc(pp.names[0]) + ' <b>' + pp.tot[0] + '</b></span><span>' + esc(pp.names[1]) + ' <b>' + pp.tot[1] + '</b></span></div><button type="button" class="btn cz-wide gm-glow" id="gmGo">' + T('Waan diyaarsanahay', 'I am ready') + '</button></div>';
    } else {
      var w = pp.tot[0] === pp.tot[1] ? -1 : pp.tot[0] > pp.tot[1] ? 0 : 1;
      h += '<div class="gm-result win"><p class="hero-eyebrow">' + T('Tartanku wuu dhammaaday', 'The duel is over') + '</p><div class="gm-chest-big">' + ic('award') + '</div><h1>' + (w < 0 ? T('Barbaro! Labadiinuba waad guulaysateen.', 'A tie! You both win.') : esc(pp.names[w]) + T(' ayaa guulaystay!', ' wins!')) + '</h1><div class="gm-tot big"><span class="' + (w === 0 ? 'win' : '') + '">' + esc(pp.names[0]) + ' <b>' + pp.tot[0] + '</b></span><span class="' + (w === 1 ? 'win' : '') + '">' + esc(pp.names[1]) + ' <b>' + pp.tot[1] + '</b></span></div><p class="simple-intro">' + T('Labadiinuba Ingiriisi ayaad baranayseen — taasi waa guusha dhabta ah.', 'You were both learning English — that is the real win.') + '</p><div class="gm-two"><button type="button" class="btn gm-glow" id="gmRematch">' + T('Mar kale', 'Rematch') + '</button><button type="button" class="btn secondary" id="gmHome">' + T('Ciyaaraha', 'All games') + '</button></div></div>';
    }
    app.innerHTML = h + '</div>';
    document.getElementById('gmBack').onclick = function () { P.pp = null; P.game = 'duel'; P.route = 'levels'; paint(); };
    if (pp.stage === 'setup') {
      app.querySelectorAll('[data-dd]').forEach(function (b) { b.onclick = function () { pp.d = b.dataset.dd; keep(); paint(); }; }); app.querySelectorAll('[data-rounds]').forEach(function (b) { b.onclick = function () { pp.rounds = +b.dataset.rounds; keep(); paint(); }; });
      function keep() { pp.names = [document.getElementById('gmN0').value.trim() || pp.names[0], document.getElementById('gmN1').value.trim() || pp.names[1]]; }
      document.getElementById('gmPP').onsubmit = function (e) { e.preventDefault(); keep(); pp.seeds = []; for (var i = 0; i < pp.rounds; i++) pp.seeds.push(newSeed()); pp.r = 0; pp.turn = 0; pp.tot = [0, 0]; pp.rs = [0, 0]; pp.order = [0, 1]; pp.stage = 'hand'; ac(); paint(); };
    } else if (pp.stage === 'hand') {
      document.getElementById('gmGo').onclick = function () {
        var who = pp.order[pp.turn], second = pp.turn % 2 === 1;
        duelRound({ seed: pp.seeds[pp.r], d: pp.d, title: pp.names[who], sub: T('Wareegga ', 'Round ') + (pp.r + 1), beat: second ? pp.rs[1 - who] : null, owner: who === 0, quit: function () { P.pp = null; P.game = 'duel'; P.route = 'levels'; paint(); } }, function (res) {
          pp.rs[who] = res.score; pp.tot[who] += res.score; pp.turn++;
          if (pp.turn % 2 === 0) { pp.r++; pp.rs = [0, 0]; pp.order = pp.r % 2 ? [1, 0] : [0, 1]; pp.turn = 0; if (pp.r >= pp.rounds) { pp.stage = 'done'; P.route = 'pp'; paint(); confetti(); return; } }
          P.route = 'pp'; paint();
        });
      };
    } else { document.getElementById('gmRematch').onclick = function () { pp.stage = 'setup'; paint(); }; document.getElementById('gmHome').onclick = function () { P.pp = null; P.route = 'home'; paint(); }; }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  /* (b) challenge by code: the code carries the seed (the exact questions) and the score to beat */
  function shareText(code, score) { var url = location.origin + location.pathname + '?duel=' + code + '&n=' + encodeURIComponent((S.profile.name || '').split(' ')[0].slice(0, 14)); return { url: url, text: 'Somali English Academy — Duel Dash: waxaan helay ' + score + ' dhibcood. Ma iga badin kartaa? / I scored ' + score + '. Can you beat me? ' + url + ' (koodh / code: ' + code + ')' }; }
  function challenge() {
    var ch = P.ch = P.ch || { stage: 'menu', d: 'E' }, h = '<div class="gmh"><button type="button" class="simple-back" id="gmBack">' + ic('back') + T('Tartanka Degdegga', 'Duel Dash') + '</button>';
    if (ch.stage === 'menu') {
      h += '<h1>' + T('Loollan koodh ah', 'Challenge by code') + '</h1><p class="simple-intro">' + T('Wareeggaaga ciyaar, koodhka WhatsApp ugu dir qof aad jeceshahay. Isagu wuxuu ciyaarayaa isla su’aalihii, wuxuuna isku dayayaa inuu kaa badiyo.', 'Play your round, then send the code by WhatsApp to someone you love. They play the very same questions and try to beat you.') + '</p><div class="cz-card"><h2>' + T('Bilow loollan cusub', 'Start a new challenge') + '</h2>' + diffSeg(ch.d) + '<button type="button" class="btn cz-wide" id="gmChGo">' + T('Ciyaar wareeggayga', 'Play my round') + ic('arrow') + '</button></div><div class="cz-card" style="margin-top:var(--s-4)"><h2>' + T('Koodh ma lagu soo diray?', 'Did someone send you a code?') + '</h2><form id="gmChForm"><label class="simple-label" for="gmChCode">' + T('Halkan ku qor koodhka', 'Type the code here') + '</label><input type="text" id="gmChCode" class="cz-input" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="7K2QF-E-3W-9" value="' + esc(ch.typed || '') + '"><p class="small" role="status" id="gmChErr"></p><button type="submit" class="btn secondary cz-wide">' + T('Ciyaar loollankan', 'Play this challenge') + '</button></form></div><p class="cz-source">' + T('Tani waa loollan daacad ah oo aan internet toos ah u baahnayn: koodhku wuxuu sidaa su’aalaha iyo dhibcaha oo keliya.', 'This is an honest challenge with no live connection: the code only carries the questions and the score.') + '</p>';
    } else if (ch.stage === 'incoming') {
      h += '<div class="gm-hand"><p class="hero-eyebrow">' + T('Loollan ayaa kuu yimid', 'A challenge has arrived') + ' · ' + T(DD[ch.d].so, DD[ch.d].en) + '</p><div class="gm-chest-big">' + ic('flag') + '</div><h1>' + (ch.from ? esc(ch.from) + T(': ', ' scored ') : T('Dhibcaha laga badinayo: ', 'Score to beat: ')) + ch.beat + (ch.from ? T(' dhibcood', '') : '') + '</h1><p class="simple-intro">' + T('Isla su’aalihii ayaad helaysaa, 60 ilbiriqsi. Ka badi!', 'You get the very same questions and 60 seconds. Beat it!') + '</p><button type="button" class="btn cz-wide gm-glow" id="gmChPlay">' + T('Waan diyaarsanahay', 'I am ready') + '</button></div>';
    } else {
      var res = ch.res, beat = ch.beat, won = beat == null ? null : res.score > beat ? 1 : res.score === beat ? 0 : -1, code = mintCode(ch.seed, ch.d, res.score), sh = shareText(code, res.score);
      h += '<div class="gm-result' + (won !== -1 ? ' win' : '') + '"><p class="hero-eyebrow">' + T('Tartanka Degdegga', 'Duel Dash') + ' · ' + T(DD[ch.d].so, DD[ch.d].en) + '</p><div class="cz-seal ok" style="margin:var(--s-3) 0"><svg viewBox="0 0 120 120"><circle class="cz-seal-bg" cx="60" cy="60" r="52"/><circle class="cz-seal-fg" cx="60" cy="60" r="52" stroke-dasharray="326.7" stroke-dashoffset="0"/></svg><div><b>' + res.score + '</b><small>' + res.right + ' ' + T('sax', 'correct') + '</small></div></div><h1>' + (won === null ? T('Wareeggaagu waa diyaar', 'Your round is ready') : won === 1 ? T('Waad ka badisay!', 'You beat it!') : won === 0 ? T('Barbaro!', 'A tie!') : T('Wax yar baa kaa dhimmanaa', 'So close')) + '</h1><p class="simple-intro">' + (won === null ? T('Koodhkan u dir qof, ha isku dayo inuu kaa badiyo.', 'Send this code to someone and let them try to beat you.') : T('Dhibcihii laga badinayay: ', 'The score to beat was ') + beat + '. ' + T('Hadda koodhkaaga u celi.', 'Now send your own code back.')) + (res.xp ? ' +' + res.xp + ' XP' : '') + '</p><div class="gm-code" aria-label="' + T('Koodhka loollanka', 'Challenge code') + '"><b id="gmCode">' + code + '</b></div><div class="gm-two"><a class="btn" id="gmWa" href="https://wa.me/?text=' + encodeURIComponent(sh.text) + '" target="_blank" rel="noopener noreferrer">' + T('U dir WhatsApp', 'Send by WhatsApp') + '</a><button type="button" class="btn secondary" id="gmCopy">' + T('Koobiyee', 'Copy') + '</button></div><p class="small muted" role="status" id="gmCopyOk"></p><button type="button" class="simple-text-button" id="gmChAgain">' + T('Loollan kale', 'Another challenge') + '</button></div>';
    }
    app.innerHTML = h + '</div>';
    document.getElementById('gmBack').onclick = function () { P.ch = null; P.game = 'duel'; P.route = 'levels'; paint(); };
    function run(beat) { ac(); duelRound({ seed: ch.seed, d: ch.d, title: T('Tartanka Degdegga', 'Duel Dash'), sub: T(DD[ch.d].so, DD[ch.d].en), beat: beat, owner: true, quit: function () { ch.stage = 'menu'; P.route = 'ch'; paint(); } }, function (res) { ch.res = res; ch.beat = beat; ch.stage = 'done'; P.route = 'ch'; paint(); if (beat == null || res.score >= beat) confetti(); }); }
    if (ch.stage === 'menu') {
      app.querySelectorAll('[data-dd]').forEach(function (b) { b.onclick = function () { ch.d = b.dataset.dd; ch.typed = document.getElementById('gmChCode').value; paint(); }; });
      document.getElementById('gmChGo').onclick = function () { ch.seed = newSeed(); ch.from = null; run(null); };
      document.getElementById('gmChForm').onsubmit = function (e) { e.preventDefault(); var c = readCode(document.getElementById('gmChCode').value); if (!c) { document.getElementById('gmChErr').textContent = T('Koodhkan ma shaqaynayo. Hubi xarfaha, ama weydii qofka inuu mar kale kuu soo diro.', 'This code does not work. Check the letters, or ask the sender to share it again.'); return; } ch.seed = c.seed; ch.d = c.d; ch.beat = c.score; ch.from = null; ch.stage = 'incoming'; paint(); };
    } else if (ch.stage === 'incoming') document.getElementById('gmChPlay').onclick = function () { run(ch.beat); };
    else {
      var c2 = document.getElementById('gmCode').textContent, s2 = shareText(c2, ch.res.score);
      document.getElementById('gmWa').onclick = function (e) { if (navigator.share) { e.preventDefault(); navigator.share({ text: s2.text }).catch(function () { }); } };
      document.getElementById('gmCopy').onclick = function () { var ok = function () { document.getElementById('gmCopyOk').textContent = T('Waa la koobiyeeyay.', 'Copied.'); }; try { navigator.clipboard.writeText(s2.text).then(ok, function () { }); } catch (e) { } };
      document.getElementById('gmChAgain').onclick = function () { P.ch = null; paint(); };
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  var incoming = null; try { var sp = new URLSearchParams(location.search); if (sp.get('duel')) { incoming = { code: sp.get('duel'), from: (sp.get('n') || '').slice(0, 14) }; history.replaceState(null, '', location.pathname); } } catch (e) { }
  function openIncoming() { if (!incoming || !S || !S.profile || !S.profile.onboarded) return false; var c = readCode(incoming.code), from = incoming.from; incoming = null; P.ch = c ? { stage: 'incoming', seed: c.seed, d: c.d, beat: c.score, from: from } : { stage: 'menu', d: 'E', typed: '' }; P.route = 'ch'; view = 'play'; return true; }
  /* (c) the family leaderboard: the profiles on this phone, ranked by game XP */
  function board() {
    var rows = Object.keys(ROOT.profiles).map(function (id) { var p = ROOT.profiles[id], st = 0; if (p.games && p.games.lv) Object.keys(p.games.lv).forEach(function (g) { var s = p.games.lv[g].s || {}; Object.keys(s).forEach(function (n) { st += s[n]; }); }); return { id: id, name: (p.profile && p.profile.name) || T('Ciyaartoy', 'Player'), color: (p.profile && p.profile.avatarColor) || cssv('--accent'), xp: gameXP(p), stars: st }; }).sort(function (a, b) { return b.xp - a.xp || b.stars - a.stars; });
    app.innerHTML = '<div class="gmh"><button type="button" class="simple-back" id="gmBack">' + ic('back') + T('Tartanka Degdegga', 'Duel Dash') + '</button><h1>' + T('Shaxda qoyska', 'Family leaderboard') + '</h1><p class="simple-intro">' + T('Qof kasta oo taleefankan boggiisa ku leh, waxaa lagu kala saaray XP-ga ciyaaraha.', 'Everyone with a profile on this phone, ranked by game XP.') + '</p><ol class="gm-board">' + rows.map(function (r, i) { return '<li class="' + (r.id === ROOT.activeId ? 'me' : '') + (i === 0 && r.xp > 0 ? ' top' : '') + '"><span class="gm-rank">' + (i + 1) + '</span><span class="gm-av" style="background:' + esc(r.color) + '">' + esc(r.name.charAt(0).toUpperCase()) + '</span><span class="gm-qt"><b>' + esc(r.name) + '</b><small>' + ic('star') + ' ' + r.stars + '</small></span><span class="gm-bxp"><b>' + r.xp + '</b><small>XP</small></span></li>'; }).join('') + '</ol>' + (rows.length < 2 ? '<div class="card empty">' + ic('user') + '<h2>' + T('Shaxdu waxay u baahan tahay tartame', 'A table needs a rival') + '</h2><p>' + T('Ku dar xubin kale oo qoyska ah: Boggaaga → Dejimo kale → Beddel ama ku dar ardey. Taleefankan ilaa afar bog ayuu qaadaa.', 'Add another family member: Profile → More settings → switch or add a learner. This phone holds up to four profiles.') + '</p></div>' : '') + '</div>';
    document.getElementById('gmBack').onclick = function () { P.game = 'duel'; P.route = 'levels'; paint(); };
  }

  /* ---------------- games home, journey map, level ladder ---------------- */
  function home() {
    var g = gz(), total = 0, reach = 10; GAMES.forEach(function (x) { total += starsOf(x.id); reach = Math.min(reach, g.lv[x.id].u); });
    var h = '<div class="gmh"><p class="hero-eyebrow">' + ic('game') + T('Ciyaar oo baro', 'Play and learn') + '</p><h1>' + T('Ciyaar. Qosol. Baro.', 'Play. Laugh. Learn.') + '</h1><p class="simple-intro">' + T('Toddobo ciyaarood, toban heer midkiiba. Eray kasta oo aad ku guulaysato waad maqlaysaa oo waad arkaysaa.', 'Seven games, ten levels each. You hear and see every word you win.') + '</p>' + soundBtn() + questHTML()
      + '<section class="gm-map" aria-label="' + T('Khariidadda safarka', 'Journey map') + '"><div class="journey-head"><h2>' + T('Khariidadda safarkaaga', 'Your journey map') + '</h2><span>' + ic('star') + ' ' + total + ' / ' + GAMES.length * 30 + '</span></div><ol>' + PLACES.map(function (p, i) {
        var here = GAMES.filter(function (x) { return g.lv[x.id].u === i + 1; }), passed = GAMES.filter(function (x) { return g.lv[x.id].u > i + 1 || (i === 9 && g.lv[x.id].s[10]); }).length;
        return '<li class="' + (passed === GAMES.length ? 'done' : here.length ? 'here' : '') + (i + 1 === reach && passed < GAMES.length ? ' glow' : '') + '"><span class="gm-stop">' + (passed === GAMES.length ? ic('check') : i + 1) + '</span><span class="gm-place"><b>' + T(p[0], p[1]) + '</b><small>' + T('Heer ', 'Level ') + (i + 1) + '</small></span><span class="gm-here">' + here.map(function (x) { return '<i title="' + esc(T(x.so, x.en)) + '">' + ic(x.ic) + '</i>'; }).join('') + '</span></li>';
      }).join('') + '</ol></section><h2 class="cz-h">' + T('Ciyaaraha', 'The games') + '</h2><div class="gm-list">'
      + GAMES.map(function (x) { var l = g.lv[x.id]; return '<button type="button" class="gm-tile" data-game="' + x.id + '"><span class="gm-tile-ic">' + ic(x.ic) + '</span><span class="gm-tile-t"><b>' + T(x.so, x.en) + '</b><small>' + T(x.tip[0], x.tip[1]) + '</small><span class="gm-dots" aria-hidden="true">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (n) { return '<i class="' + (l.s[n] ? 'on' : n === l.u ? 'next' : '') + '"></i>'; }).join('') + '</span></span><span class="gm-tile-lv"><b>' + l.u + '</b><small>' + T('Heer', 'Level') + '</small></span></button>'; }).join('') + '</div></div>';
    app.innerHTML = h; wireSound(paint); wireQuests();
    app.querySelectorAll('[data-game]').forEach(function (b) { b.onclick = function () { P.game = b.dataset.game; P.route = 'levels'; sfx('pop'); paint(); window.scrollTo({ top: 0, behavior: 'instant' }); }; });
    if (g.sound) startMusic();
  }
  function levels() {
    stopMusic(); var g = gz(), def = gdef(P.game), l = g.lv[def.id], d = diffOf(def.id);
    app.innerHTML = '<div class="gmh"><button type="button" class="simple-back" id="gmBack">' + ic('back') + T('Ciyaaraha', 'All games') + '</button><p class="hero-eyebrow">' + ic(def.ic) + T(def.en, def.so) + '</p><h1>' + T(def.so, def.en) + '</h1><p class="simple-intro">' + T(def.tip[0], def.tip[1]) + '</p>'
      + (def.id === 'duel' ? '<div class="gm-modes"><button type="button" class="gm-tile" data-mode="pp"><span class="gm-tile-ic">' + ic('user') + '</span><span class="gm-tile-t"><b>' + T('Laba ciyaartoy, hal taleefan', 'Two players, one phone') + '</b><small>' + T('Hooyo iyo gabadh, awoowe iyo carruur', 'Mother and daughter, elder and grandchild') + '</small></span>' + ic('chevron') + '</button><button type="button" class="gm-tile" data-mode="ch"><span class="gm-tile-ic">' + ic('chat') + '</span><span class="gm-tile-t"><b>' + T('Loollan koodh ah', 'Challenge by code') + '</b><small>' + T('Ciyaar, kadibna WhatsApp ugu dir', 'Play, then send it by WhatsApp') + '</small></span>' + ic('chevron') + '</button><button type="button" class="gm-tile" data-mode="board"><span class="gm-tile-ic">' + ic('award') + '</span><span class="gm-tile-t"><b>' + T('Shaxda qoyska', 'Family leaderboard') + '</b><small>' + T('Yaa ugu XP badan gurigan?', 'Who has the most XP in this house?') + '</small></span>' + ic('chevron') + '</button></div><h2 class="cz-h">' + T('Tababar: Geel la tartan', 'Practice: race Geel') + '</h2>' : '') + '<div class="cz-seg gm-diff" role="group" aria-label="' + T('Adkaanta', 'Difficulty') + '">' + [['easy', 'Xad fudud', 'Easy'], ['medium', 'Dhexe', 'Medium'], ['hard', 'Adag', 'Hard']].map(function (x) { return '<button type="button" data-diff="' + x[0] + '" aria-pressed="' + (d === x[0]) + '"><b>' + T(x[1], x[2]) + '</b></button>'; }).join('') + '</div>'
      + '<ol class="gm-levels">' + PLACES.map(function (p, i) { var n = i + 1, open = n <= l.u, st = l.s[n] || 0; return '<li><button type="button" class="gm-level' + (n === l.u && !st ? ' gm-glow next' : '') + (st ? ' done' : '') + '" data-l="' + n + '"' + (open ? '' : ' disabled') + '><span class="gm-level-n">' + (open ? n : ic('lock')) + '</span><span class="gm-level-t"><b>' + T('Heer ', 'Level ') + n + ' · ' + T(p[0], p[1]) + '</b><small>' + (open ? (st ? T('Mar kale ciyaar si aad xiddigo badan u hesho', 'Play again for more stars') : T('Diyaar', 'Ready')) : T('Dhammee heerka ka horreeya', 'Finish the level before')) + '</small></span><span class="gm-level-s" aria-label="' + st + ' / 3">' + [1, 2, 3].map(function (k) { return '<i class="' + (k <= st ? 'on' : '') + '">' + ic('star') + '</i>'; }).join('') + '</span></button></li>'; }).join('') + '</ol></div>';
    document.getElementById('gmBack').onclick = function () { P.route = 'home'; paint(); };
    app.querySelectorAll('[data-diff]').forEach(function (b) { b.onclick = function () { g.diff[def.id] = b.dataset.diff; save(); sfx('pop'); paint(); }; });
    app.querySelectorAll('[data-l]').forEach(function (b) { b.onclick = function () { ac(); play(def.id, +b.dataset.l); }; });
    app.querySelectorAll('[data-mode]').forEach(function (b) { b.onclick = function () { sfx('pop'); P.route = b.dataset.mode; P.pp = null; P.ch = null; paint(); window.scrollTo({ top: 0, behavior: 'instant' }); }; });
  }
  function paint() { document.body.classList.add('view-play'); if (P.route === 'levels' && P.game) levels(); else if (P.route === 'play' && P.R) { /* a running round paints itself */ } else if (P.route === 'round') { /* a duel round paints itself */ } else if (P.route === 'pp') passPlay(); else if (P.route === 'ch') challenge(); else if (P.route === 'board') board(); else if (P.route === 'words') wordSet(); else { P.route = 'home'; home(); } }
  window.renderPlay = function () { if (P.route === 'play' && !P.R) P.route = 'home'; paint(); };
  window.openPlay = function (route) { P.route = route || 'home'; setNav('play'); render(); };
  window.__GM = { mintCode: mintCode, readCode: readCode, duelQs: duelQs, gameXP: gameXP, play: play, P: P, law: law, NEED: NEED, GAMES: GAMES, sfxNames: Object.keys(SFX) };
  var prev = render, homeWas = renderHome;
  render = function () { openIncoming(); if (view !== 'play') { stopGame(); stopMusic(); document.body.classList.remove('view-play', 'gm-playing'); if (P.route === 'play' || P.route === 'round') P.route = 'home'; } prev(); };
  /* today's quests, echoed on the app Home */
  renderHome = function () {
    homeWas(); var box = app.querySelector('.simple-home-content'); if (!box || document.getElementById('homeQuest') || !S || !S.profile) return;
    var s = questState(), b = document.createElement('button'); b.type = 'button'; b.id = 'homeQuest'; b.className = 'gm-homeq' + (s.n === 3 ? ' done' : '');
    b.innerHTML = '<span class="cz-row-ic">' + ic(s.n === 3 ? 'award' : 'game') + '</span><span class="cz-row-t"><b>' + T('Hawlaha maanta', 'Today’s quests') + ' · ' + s.n + ' / 3</b><small>' + (s.n === 3 ? (s.chest ? T('Khasnadda maanta waa la furay. Berri kuwo cusub!', 'Today’s treasure is opened. New ones tomorrow!') : T('Khasnaddu way ku sugaysaa — soo fur!', 'The treasure is waiting — come and open it!')) : T('Hal ciyaar · hal dib-u-eegis · shan eray oo cusub', 'One game · one review · five new words')) + '</small><span class="gm-q3" aria-hidden="true"><i class="' + (s.game ? 'on' : '') + '"></i><i class="' + (s.review ? 'on' : '') + '"></i><i class="' + (s.words ? 'on' : '') + '"></i></span></span>' + ic('chevron');
    b.onclick = function () { window.openPlay('home'); };
    var anchor = document.getElementById('homeCit') || document.getElementById('homeWatchNext') || box.querySelector('.simple-next'); if (anchor) anchor.insertAdjacentElement('afterend', b); else box.appendChild(b);
  };
  document.addEventListener('visibilitychange', function () { if (document.hidden) stopMusic(); });
  if (S && S.profile && S.profile.onboarded) render();
})();
