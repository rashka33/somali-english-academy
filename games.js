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
    { id: 'slice', so: 'Jar Erayga', en: 'Word Slice', ic: 'slice', tip: ['Fartaada ku jar erayga saxda ah. Kuwa khaldan ha taaban.', 'Swipe through the correct word. Do not touch the wrong ones.'] }
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
  function diffOf(id) { return gz().diff[id] === 'hard' ? 'hard' : 'easy'; }
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
    var hard = diff === 'hard', t = (L - 1) / 9;
    return { L: L, hard: hard, t: Math.min(1.15, t + (hard ? 0.22 : 0)), lives: Math.max(1, (L <= 3 ? 4 : L <= 8 ? 3 : 2) - (hard ? 1 : 0)), maxLen: Math.min(11, 4 + Math.floor(L * 0.7)), lessons: 25 * L, opts: L <= 2 ? 2 : L <= 6 ? 3 : 4 };
  }
  var NEED = { snake: function (L) { return 2 + Math.floor(L / 3); }, catch: function (L) { return 4 + Math.floor(L / 2); }, ladder: function (L) { return 5 + Math.floor(L / 2); }, match: function (L) { return [3, 4, 4, 5, 6, 6, 7, 8, 8, 10][L - 1]; }, duel: function (L) { return 6 + Math.floor(L / 2); }, slice: function (L) { return 6 + L; } };
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
    app.innerHTML = '<div class="gm" data-game="' + id + '"><div class="gm-hud"><button type="button" class="iconbtn" id="gmQuit" aria-label="' + T('Ka bax', 'Quit') + '">' + ic('close') + '</button><div class="gm-lv"><b>' + T('Heer ', 'Level ') + L + '</b><span>' + T(def.so, def.en) + (c.hard ? ' · ' + T('Adag', 'Hard') : '') + '</span></div><div class="gm-lives" id="gmLives" aria-label="' + T('Nolosha', 'Lives') + '"></div><div class="gm-score"><b id="gmScore">0</b><span id="gmCombo"></span></div><button type="button" class="iconbtn" id="gmMute" aria-label="' + T('Codka', 'Sound') + '">' + ic(g.sound ? 'speaker' : 'mute') + '</button></div><div class="gm-prog"><i id="gmProg"></i></div><div class="gm-target" id="gmTarget"></div><div class="gm-stage" id="gmStage"></div><div class="gm-toast" id="gmToast" aria-live="polite"></div></div>';
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
    R.hud(); ({ snake: gSnake, catch: gCatch, ladder: gLadder, match: gMatch, duel: gDuel, slice: gSlice })[id](R, stage);
    var last = performance.now();
    R.raf = requestAnimationFrame(function f(ts) { if (R.over) return; var dt = Math.min(0.05, (ts - last) / 1000) * R.ts; last = ts; if (R.step) R.step(dt); R.raf = requestAnimationFrame(f); });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function finish(win) {
    var R = P.R; if (!R || R.over) return; R.over = true; cancelAnimationFrame(R.raf); if (R.cleanup) { try { R.cleanup(); } catch (e) { } } clearTimeout(R.slowT);
    document.body.classList.remove('gm-last');
    var g = gz(), lv = g.lv[R.id], L = R.c.L, lost = R.lives0 - R.lives, stars = win ? (lost === 0 ? 3 : lost === 1 ? 2 : 1) : 0, opened = false, xp = 0;
    Object.keys(R.missed).forEach(function (k) { try { addSRS(R.missed[k].en, R.missed[k].so); } catch (e) { } });
    if (win) { if (stars > (lv.s[L] || 0)) lv.s[L] = stars; if (L < 10 && lv.u < L + 1) { lv.u = L + 1; opened = true; } try { xp = awardBestXP('game:' + R.id + ':' + L + (R.c.hard ? ':h' : ''), stars * (R.c.hard ? 6 : 4)); } catch (e) { } }
    save();
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
    stage.classList.add('gm-catch'); stage.innerHTML = '<div class="gm-basket" id="gmBasket"><svg viewBox="0 0 104 56" aria-hidden="true"><path d="M6 14h92l-10 36a6 6 0 0 1-6 4H22a6 6 0 0 1-6-4z" fill="var(--gold)"/><path d="M6 14h92" stroke="var(--gold-ink)" stroke-width="5" stroke-linecap="round"/><path d="M30 18l4 32M52 18v32M74 18l-4 32" stroke="var(--gold-ink)" stroke-width="2" opacity=".5"/></svg></div>';
    var bk = document.getElementById('gmBasket'), W = stage.clientWidth, H = stage.clientHeight, bx = W / 2, items = [], spawnT = 0.5, since = 2, words = shuf(R.pool), wi = 0, target, speed = lerp(75, 185, Math.min(1, R.c.t)), gap = lerp(1.6, 0.8, Math.min(1, R.c.t));
    function place() { bx = Math.max(52, Math.min(W - 52, bx)); bk.style.transform = 'translate3d(' + (bx - 52) + 'px,0,0)'; }
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
    stage.classList.add('gm-ladder'); var rung = 0, safe = 0, pot = 0, words = shuf(R.pool), wi = 0, cur, lock = false, tMax = R.c.hard ? lerp(9, 5, Math.min(1, R.c.t)) : 0, tLeft = 0;
    function q() {
      cur = words[wi++ % words.length]; lock = false; tLeft = tMax; R.setTarget(cur); var opts = shuf([cur].concat(distract(cur, R, R.c.opts - 1))), rs = '';
      for (var i = R.need; i >= 1; i--) rs += '<li class="' + (i <= rung ? 'on' : '') + (i === safe ? ' safe' : '') + (i === rung + 1 ? ' next' : '') + '"><span>' + (i === R.need ? ic('star') : i) + '</span></li>';
      stage.innerHTML = '<ol class="gm-rungs" aria-label="' + T('Jaranjarada', 'Ladder') + '">' + rs + '</ol><div class="gm-ladq">' + (tMax ? '<div class="gm-timer"><i id="gmTime"></i></div>' : '') + '<p class="gm-pot">' + T('Aan la kaydin', 'Not banked yet') + ' <b>' + pot + '</b></p><div class="opts">' + opts.map(function (o) { return '<button type="button" class="opt keep-emoji" lang="en" data-w="' + esc(o.en) + '">' + esc(o.en) + '</button>'; }).join('') + '</div><button type="button" class="btn secondary gm-bank" id="gmBank"' + (rung > safe ? '' : ' disabled') + '>' + ic('coin') + T('Kaydi dhibcahayga', 'Bank my points') + '</button><p class="small muted">' + T('Kaydintu waxay ilaalinaysaa meesha aad joogto, laakiin isku-xigxigga ×2 / ×3 ayay dib u bilaabaysaa.', 'Banking protects where you stand, but restarts your ×2 / ×3 streak.') + '</p></div>';
      stage.querySelectorAll('[data-w]').forEach(function (b) { b.onclick = function () { answer(b); }; });
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

  /* ---------------- games home, journey map, level ladder ---------------- */
  function home() {
    var g = gz(), total = 0, reach = 10; GAMES.forEach(function (x) { total += starsOf(x.id); reach = Math.min(reach, g.lv[x.id].u); });
    var h = '<div class="gmh"><p class="hero-eyebrow">' + ic('game') + T('Ciyaar oo baro', 'Play and learn') + '</p><h1>' + T('Ciyaar. Qosol. Baro.', 'Play. Laugh. Learn.') + '</h1><p class="simple-intro">' + T('Lix ciyaarood, toban heer midkiiba. Eray kasta oo aad ku guulaysato waad maqlaysaa oo waad arkaysaa.', 'Six games, ten levels each. You hear and see every word you win.') + '</p>' + soundBtn()
      + '<section class="gm-map" aria-label="' + T('Khariidadda safarka', 'Journey map') + '"><div class="journey-head"><h2>' + T('Khariidadda safarkaaga', 'Your journey map') + '</h2><span>' + ic('star') + ' ' + total + ' / 180</span></div><ol>' + PLACES.map(function (p, i) {
        var here = GAMES.filter(function (x) { return g.lv[x.id].u === i + 1; }), passed = GAMES.filter(function (x) { return g.lv[x.id].u > i + 1 || (i === 9 && g.lv[x.id].s[10]); }).length;
        return '<li class="' + (passed === GAMES.length ? 'done' : here.length ? 'here' : '') + (i + 1 === reach && passed < GAMES.length ? ' glow' : '') + '"><span class="gm-stop">' + (passed === GAMES.length ? ic('check') : i + 1) + '</span><span class="gm-place"><b>' + T(p[0], p[1]) + '</b><small>' + T('Heer ', 'Level ') + (i + 1) + '</small></span><span class="gm-here">' + here.map(function (x) { return '<i title="' + esc(T(x.so, x.en)) + '">' + ic(x.ic) + '</i>'; }).join('') + '</span></li>';
      }).join('') + '</ol></section><h2 class="cz-h">' + T('Ciyaaraha', 'The games') + '</h2><div class="gm-list">'
      + GAMES.map(function (x) { var l = g.lv[x.id]; return '<button type="button" class="gm-tile" data-game="' + x.id + '"><span class="gm-tile-ic">' + ic(x.ic) + '</span><span class="gm-tile-t"><b>' + T(x.so, x.en) + '</b><small>' + T(x.tip[0], x.tip[1]) + '</small><span class="gm-dots" aria-hidden="true">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (n) { return '<i class="' + (l.s[n] ? 'on' : n === l.u ? 'next' : '') + '"></i>'; }).join('') + '</span></span><span class="gm-tile-lv"><b>' + l.u + '</b><small>' + T('Heer', 'Level') + '</small></span></button>'; }).join('') + '</div></div>';
    app.innerHTML = h; wireSound(paint);
    app.querySelectorAll('[data-game]').forEach(function (b) { b.onclick = function () { P.game = b.dataset.game; P.route = 'levels'; sfx('pop'); paint(); window.scrollTo({ top: 0, behavior: 'instant' }); }; });
    if (g.sound) startMusic();
  }
  function levels() {
    stopMusic(); var g = gz(), def = gdef(P.game), l = g.lv[def.id], d = diffOf(def.id);
    app.innerHTML = '<div class="gmh"><button type="button" class="simple-back" id="gmBack">' + ic('back') + T('Ciyaaraha', 'All games') + '</button><p class="hero-eyebrow">' + ic(def.ic) + T(def.en, def.so) + '</p><h1>' + T(def.so, def.en) + '</h1><p class="simple-intro">' + T(def.tip[0], def.tip[1]) + '</p>'
      + '<div class="cz-seg gm-diff" role="group" aria-label="' + T('Adkaanta', 'Difficulty') + '"><button type="button" data-diff="easy" aria-pressed="' + (d === 'easy') + '"><b>' + T('Fudud', 'Easy') + '</b><span>' + T('Tartiib oo naxariis leh', 'Slow and forgiving') + '</span></button><button type="button" data-diff="hard" aria-pressed="' + (d === 'hard') + '"><b>' + T('Adag', 'Hard') + '</b><span>' + T('Degdeg, nolol yar, XP badan', 'Fast, fewer lives, more XP') + '</span></button></div>'
      + '<ol class="gm-levels">' + PLACES.map(function (p, i) { var n = i + 1, open = n <= l.u, st = l.s[n] || 0; return '<li><button type="button" class="gm-level' + (n === l.u && !st ? ' gm-glow next' : '') + (st ? ' done' : '') + '" data-l="' + n + '"' + (open ? '' : ' disabled') + '><span class="gm-level-n">' + (open ? n : ic('lock')) + '</span><span class="gm-level-t"><b>' + T('Heer ', 'Level ') + n + ' · ' + T(p[0], p[1]) + '</b><small>' + (open ? (st ? T('Mar kale ciyaar si aad xiddigo badan u hesho', 'Play again for more stars') : T('Diyaar', 'Ready')) : T('Dhammee heerka ka horreeya', 'Finish the level before')) + '</small></span><span class="gm-level-s" aria-label="' + st + ' / 3">' + [1, 2, 3].map(function (k) { return '<i class="' + (k <= st ? 'on' : '') + '">' + ic('star') + '</i>'; }).join('') + '</span></button></li>'; }).join('') + '</ol></div>';
    document.getElementById('gmBack').onclick = function () { P.route = 'home'; paint(); };
    app.querySelectorAll('[data-diff]').forEach(function (b) { b.onclick = function () { g.diff[def.id] = b.dataset.diff; save(); sfx('pop'); paint(); }; });
    app.querySelectorAll('[data-l]').forEach(function (b) { b.onclick = function () { ac(); play(def.id, +b.dataset.l); }; });
  }
  function paint() { document.body.classList.add('view-play'); if (P.route === 'levels' && P.game) levels(); else if (P.route === 'play' && P.R) { /* a running round paints itself */ } else { P.route = 'home'; home(); } }
  window.renderPlay = function () { if (P.route === 'play' && !P.R) P.route = 'home'; paint(); };
  window.__GM = { play: play, P: P, law: law, NEED: NEED, GAMES: GAMES, sfxNames: Object.keys(SFX) };
  var prev = render;
  render = function () { if (view !== 'play') { stopGame(); stopMusic(); document.body.classList.remove('view-play'); if (P.route === 'play') P.route = 'home'; } prev(); };
  document.addEventListener('visibilitychange', function () { if (document.hidden) stopMusic(); });
  if (S && S.profile && S.profile.onboarded) render();
})();
