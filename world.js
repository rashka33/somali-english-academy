/* ============================================================================
   Magaalada Erayada 3D / Word Town 3D — a small open world for Play & Learn.
   A hand-written WebGL renderer (no engine, nothing to download): a town of
   named places she can walk or drive through, people to talk to, and errands
   that are English tasks. Conversations come from the curriculum's own
   role-plays (ROLEPLAYS); fetch words come from the picture dictionary.
   Called by games.js as window.gWorld(R, stage, kit) on the shared level law.
   ============================================================================ */
(function () {
  'use strict';
  var N = 5, B = 26, RW = 10, PITCH = B + RW, SIZE = N * PITCH + RW;
  var PLACES = [
    { k: 'home', en: 'home', so: 'guri', b: [0, 0], c: [0.85, 0.52, 0.36] }, { k: 'market', en: 'market', so: 'suuq', b: [2, 0], c: [0.91, 0.71, 0.3] },
    { k: 'school', en: 'school', so: 'dugsi', b: [4, 0], c: [0.36, 0.56, 0.78] }, { k: 'clinic', en: 'clinic', so: 'rug caafimaad', b: [1, 1], c: [0.93, 0.93, 0.9] },
    { k: 'pharmacy', en: 'pharmacy', so: 'farmashiye', b: [3, 1], c: [0.45, 0.72, 0.56] }, { k: 'bank', en: 'bank', so: 'bangi', b: [0, 2], c: [0.62, 0.6, 0.55] },
    { k: 'park', en: 'park', so: 'beer nasasho', b: [2, 2], c: null }, { k: 'postoffice', en: 'post office', so: 'boosto', b: [4, 2], c: [0.78, 0.36, 0.3] },
    { k: 'restaurant', en: 'restaurant', so: 'makhaayad', b: [1, 3], c: [0.86, 0.45, 0.5] }, { k: 'office', en: 'office', so: 'xafiis', b: [3, 3], c: [0.42, 0.5, 0.58] },
    { k: 'garage', en: 'garage', so: 'garaash', b: [0, 4], c: [0.5, 0.45, 0.4] }, { k: 'mosque', en: 'mosque', so: 'masaajid', b: [2, 4], c: [0.9, 0.87, 0.78] },
    { k: 'library', en: 'library', so: 'maktabad', b: [4, 4], c: [0.6, 0.45, 0.62] }, { k: 'busstation', en: 'bus station', so: 'boosteejada baska', b: [3, 0], c: [0.3, 0.55, 0.52] }
  ];
  var RP_AT = { grocery: 'market', directions: 'busstation', teacher: 'school', schooloffice: 'school', interview: 'office', supervisor: 'office', safety: 'office', doctor: 'clinic', hospital: 'clinic', bank: 'bank', postoffice: 'postoffice', drivethru: 'restaurant', mechanic: 'garage', pharmacy: 'pharmacy', landlord: 'home' };
  function place(k) { for (var i = 0; i < PLACES.length; i++) if (PLACES[i].k === k) return PLACES[i]; return PLACES[0]; }
  function blockX(i) { return i * PITCH + RW; }
  function door(p) { return { x: blockX(p.b[0]) + B / 2, z: blockX(p.b[1]) - 2.2 }; }

  /* ---------- tiny matrix kit ---------- */
  function persp(fov, asp, n, f) { var t = 1 / Math.tan(fov / 2); return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]; }
  function look(e, c) { var zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2], l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l; var xx = zz, xz = -zx, xl = Math.hypot(xx, xz) || 1; xx /= xl; xz /= xl; var yx = zy * xz, yy = zz * xx - zx * xz, yz = -zy * xx; return [xx, yx, zx, 0, 0, yy, zy, 0, xz, yz, zz, 0, -(xx * e[0] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1]; }
  function mul(a, b) { var o = new Array(16); for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]; return o; }

  /* ---------- geometry ---------- */
  function quad(o, a, b, c, d, col, s) { var r = col[0] * s, g = col[1] * s, bl = col[2] * s; [a, b, c, a, c, d].forEach(function (p) { o.push(p[0], p[1], p[2], r, g, bl); }); }
  function rbox(o, cx, cz, w, d, h, y0, ang, col) {
    var ca = Math.cos(ang), sa = Math.sin(ang), hw = w / 2, hd = d / 2, y1 = y0 + h;
    function P(lx, lz, y) { return [cx + lx * ca + lz * sa, y, cz - lx * sa + lz * ca]; }
    var a = P(-hw, -hd, y0), b = P(hw, -hd, y0), c = P(hw, hd, y0), e = P(-hw, hd, y0), A = P(-hw, -hd, y1), Bq = P(hw, -hd, y1), C = P(hw, hd, y1), E = P(-hw, hd, y1);
    quad(o, A, Bq, C, E, col, 1); quad(o, a, b, Bq, A, col, 0.86); quad(o, b, c, C, Bq, col, 0.72); quad(o, c, e, E, C, col, 0.62); quad(o, e, a, A, E, col, 0.78);
  }
  function flat(o, x0, z0, x1, z1, y, col) { quad(o, [x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], col, 1); }
  function tree(o, x, z, s) { rbox(o, x, z, 0.5 * s, 0.5 * s, 2.2 * s, 0, 0, [0.5, 0.36, 0.24]); rbox(o, x, z, 3.4 * s, 3.4 * s, 1.1 * s, 2.2 * s, 0.4, [0.3, 0.52, 0.28]); rbox(o, x, z, 2.2 * s, 2.2 * s, 0.9 * s, 3.2 * s, 0.9, [0.36, 0.6, 0.32]); }
  function seeded(n) { var a = n >>> 0; return function () { a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function buildTown(solids) {
    var o = [], r = seeded(7), i, j, k;
    flat(o, -60, -60, SIZE + 60, SIZE + 60, -0.02, [0.62, 0.74, 0.5]);
    for (i = 0; i <= N; i++) { var p = i * PITCH; flat(o, p, 0, p + RW, SIZE, 0, [0.24, 0.24, 0.23]); flat(o, 0, p, SIZE, p + RW, 0.005, [0.24, 0.24, 0.23]); for (k = 3; k < SIZE - 3; k += 6) { flat(o, p + RW / 2 - 0.15, k, p + RW / 2 + 0.15, k + 2.6, 0.02, [0.93, 0.9, 0.82]); flat(o, k, p + RW / 2 - 0.15, k + 2.6, p + RW / 2 + 0.15, 0.02, [0.93, 0.9, 0.82]); } }
    for (i = 0; i < N; i++) for (j = 0; j < N; j++) {
      var x0 = blockX(i), z0 = blockX(j), pl = null; PLACES.forEach(function (q) { if (q.b[0] === i && q.b[1] === j) pl = q; });
      rbox(o, x0 + B / 2, z0 + B / 2, B, B, 0.18, 0, 0, [0.84, 0.81, 0.74]);
      if (pl && pl.k === 'park') { flat(o, x0 + 2, z0 + 2, x0 + B - 2, z0 + B - 2, 0.2, [0.5, 0.7, 0.42]); for (k = 0; k < 9; k++) tree(o, x0 + 4 + r() * (B - 8), z0 + 4 + r() * (B - 8), 0.8 + r() * 0.5); rbox(o, x0 + B / 2, z0 + B / 2, 5, 5, 0.3, 0.2, 0, [0.4, 0.62, 0.72]); continue; }
      var bw = pl ? 17 : 10 + r() * 8, bd = pl ? 13 : 9 + r() * 8, bh = pl ? 7 + r() * 3 : 5 + r() * 12, cx = x0 + B / 2, cz = z0 + B / 2 + (pl ? 2 : 0), col = pl ? pl.c : [[0.8, 0.76, 0.68], [0.7, 0.62, 0.55], [0.6, 0.66, 0.68], [0.78, 0.66, 0.52], [0.66, 0.7, 0.62]][Math.floor(r() * 5)];
      rbox(o, cx, cz, bw, bd, bh, 0.18, 0, col); solids.push([cx - bw / 2, cz - bd / 2, cx + bw / 2, cz + bd / 2]);
      for (var fl = 2.2; fl < bh - 1; fl += 2.8) { rbox(o, cx, cz, bw + 0.08, bd * 0.86, 1.1, fl, 0, [0.36, 0.48, 0.55]); rbox(o, cx, cz, bw * 0.86, bd + 0.08, 1.1, fl, 0, [0.36, 0.48, 0.55]); }
      rbox(o, cx, cz, bw * 0.5, bd * 0.5, 0.7, 0.18 + bh, 0, [col[0] * 0.8, col[1] * 0.8, col[2] * 0.8]);
      if (pl) { rbox(o, cx, cz - bd / 2 - 0.05, 2.6, 0.2, 3, 0.18, 0, [0.25, 0.2, 0.16]); rbox(o, cx, cz - bd / 2 - 0.5, 8, 1.6, 0.25, 3.6, 0, [0.06, 0.49, 0.4]); if (pl.k === 'mosque') { rbox(o, cx + bw / 2 - 1.5, cz, 2, 2, bh + 7, 0.18, 0, pl.c); rbox(o, cx + bw / 2 - 1.5, cz, 1.2, 1.2, 1.6, bh + 7.18, 0.78, [0.91, 0.71, 0.3]); } }
      if (!pl || r() < 0.6) { tree(o, x0 + 2, z0 + 2, 0.7); tree(o, x0 + B - 2, z0 + B - 2, 0.75); }
      rbox(o, x0 + B - 1.2, z0 + 1.2, 0.18, 0.18, 4.2, 0.18, 0, [0.3, 0.3, 0.3]); rbox(o, x0 + B - 1.2, z0 + 0.7, 0.5, 1.1, 0.18, 4.3, 0, [0.95, 0.88, 0.6]);
    }
    return new Float32Array(o);
  }

  window.gWorld = function (R, stage, K) {
    var T = K.T, ic = K.ic, cv = document.createElement('canvas'), gl = null;
    stage.classList.add('gm-run3d', 'gm-town'); stage.innerHTML = '';
    try { gl = cv.getContext('webgl', { antialias: true, alpha: false }) || cv.getContext('experimental-webgl'); } catch (e) { }
    if (!gl) { stage.innerHTML = '<div class="card empty">' + ic('signal') + '<h2>' + T('Aaladdani ma taageerto adduunka 3D', 'This device cannot show the 3D world') + '</h2><p>' + T('Ciyaaraha kale si fiican ayay u shaqeeyaan.', 'The other games all work well.') + '</p></div>'; R.step = null; return; }
    stage.appendChild(cv);
    stage.insertAdjacentHTML('beforeend', '<div class="tw-labels" id="twLabels"></div><div class="tw-compass" id="twCompass"><i></i><b></b></div><div class="tw-stick" id="twStick"><i></i></div><div class="tw-acts"><button type="button" class="tw-btn" id="twTalk" hidden>' + ic('chat') + '<span>' + T('La hadal', 'Talk') + '</span></button><button type="button" class="tw-btn" id="twCar" hidden>' + ic('road') + '<span></span></button></div><div class="tw-say" id="twSay" hidden></div><div class="tw-dlg" id="twDlg" hidden></div>');
    var W = stage.clientWidth, H = stage.clientHeight, dpr = Math.min(1.5, window.devicePixelRatio || 1);
    cv.style.width = W + 'px'; cv.style.height = H + 'px'; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); gl.viewport(0, 0, cv.width, cv.height);
    function sh(t, s) { var x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); return x; }
    var pg = gl.createProgram(); gl.attachShader(pg, sh(gl.VERTEX_SHADER, 'attribute vec3 p;attribute vec3 c;uniform mat4 m;varying vec3 vc;varying float vd;void main(){gl_Position=m*vec4(p,1.0);vc=c;vd=gl_Position.w;}'));
    gl.attachShader(pg, sh(gl.FRAGMENT_SHADER, 'precision mediump float;varying vec3 vc;varying float vd;uniform vec3 fog;void main(){float f=smoothstep(55.0,170.0,vd);gl_FragColor=vec4(mix(vc,fog,f),1.0);}'));
    gl.linkProgram(pg); gl.useProgram(pg); gl.enable(gl.DEPTH_TEST);
    var aP = gl.getAttribLocation(pg, 'p'), aC = gl.getAttribLocation(pg, 'c'), uM = gl.getUniformLocation(pg, 'm'), uF = gl.getUniformLocation(pg, 'fog');
    var skies = [[0.82, 0.9, 0.93], [0.93, 0.87, 0.78], [0.8, 0.86, 0.95], [0.95, 0.84, 0.76], [0.84, 0.92, 0.88]], sky = skies[(R.c.L - 1) % skies.length];
    gl.uniform3f(uF, sky[0], sky[1], sky[2]); gl.clearColor(sky[0], sky[1], sky[2], 1);
    var solids = [], town = buildTown(solids), vbS = gl.createBuffer(), vbD = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbS); gl.bufferData(gl.ARRAY_BUFFER, town, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(aP); gl.enableVertexAttribArray(aC);
    function drawBuf(buf, n) { gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.vertexAttribPointer(aP, 3, gl.FLOAT, false, 24, 0); gl.vertexAttribPointer(aC, 3, gl.FLOAT, false, 24, 12); gl.drawArrays(gl.TRIANGLES, 0, n); }

    /* ---------- world state ---------- */
    var home = door(place('home')), me = { x: home.x, z: home.z - 1.2, a: Math.PI / 2, v: 0, car: false }, car = { x: home.x + 9, z: home.z - 4.2, a: Math.PI / 2, v: 0 }, camA = me.a, time = 0, hurt = 0;
    var keys = {}, joy = { x: 0, y: 0 }, npcs = [], peds = [], traffic = [], items = [], marker = null, task = null, tasksDone = 0, dlg = null, passenger = null, MVP = null;
    var lab = document.getElementById('twLabels'), cmp = document.getElementById('twCompass'), bTalk = document.getElementById('twTalk'), bCar = document.getElementById('twCar'), sayEl = document.getElementById('twSay'), dlgEl = document.getElementById('twDlg');
    var pedLines = []; try { for (var i = 0; i < 80 && i < LESSONS.length; i++) { var v = LESSONS[i].vocab && LESSONS[i].vocab[0]; if (v && v.exEn && v.exSo) pedLines.push([v.exEn, v.exSo]); } } catch (e) { }
    var skins = [[0.55, 0.38, 0.28], [0.44, 0.3, 0.22], [0.62, 0.45, 0.33]], cloths = [[0.06, 0.49, 0.4], [0.91, 0.71, 0.3], [0.78, 0.36, 0.3], [0.36, 0.56, 0.78], [0.6, 0.45, 0.62], [0.9, 0.9, 0.86]];
    for (i = 0; i < 9; i++) { var bi = Math.floor(K.rnd(0, N)), bj = Math.floor(K.rnd(0, N)); peds.push({ x: blockX(bi) + K.rnd(2, B - 2), z: blockX(bj) + (i % 2 ? 0.9 : B - 0.9), x0: blockX(bi) + 1.5, x1: blockX(bi) + B - 1.5, d: i % 2 ? 1 : -1, c: cloths[i % cloths.length], s: skins[i % 3], line: pedLines.length ? pedLines[Math.floor(K.rnd(0, pedLines.length))] : ['Hello!', 'Salaam!'], name: T('Qof', 'Neighbour') }); }
    var nT = Math.min(8, 1 + Math.floor(R.c.L / 2) + (R.c.hard ? 2 : R.c.med ? 1 : 0));
    for (i = 0; i < nT; i++) { var ri = 1 + (i % (N - 1)), horiz = i % 2 === 0; traffic.push({ horiz: horiz, line: ri * PITCH + RW / 2 + (i % 4 < 2 ? 2.4 : -2.4), s: K.rnd(10, SIZE - 10), dir: i % 4 < 2 ? 1 : -1, v: K.lerp(7, 13, Math.min(1, R.c.t)), c: cloths[(i + 2) % cloths.length] }); }

    /* ---------- tasks ---------- */
    function instr(en, so, pic) { document.getElementById('gmTarget').innerHTML = (pic || '<span class="gm-pic">' + ic(task && task.type === 'talk' ? 'chat' : task && task.type === 'fetch' ? 'search' : 'map') + '</span>') + '<span class="gm-tt"><span class="tw-en" lang="en">' + esc(en) + '</span><span class="tw-so" lang="so">' + esc(so) + '</span></span><button type="button" class="iconbtn" id="twHear" aria-label="' + T('Dhegeyso', 'Listen') + '">' + ic('speaker') + '</button>'; var h = document.getElementById('twHear'); if (h) h.onclick = function () { try { speak(en, true); } catch (e) { } }; try { speak(en); } catch (e) { } }
    function near(a, b, d) { return Math.hypot(a.x - b.x, a.z - b.z) < d; }
    function rpList() { var out = []; try { ROLEPLAYS.forEach(function (rp) { if (RP_AT[rp.id] && rp.turns && rp.turns.length) out.push(rp); }); } catch (e) { } return out; }
    function newTask() {
      npcs = []; items = []; marker = null; passenger = null; var L = R.c.L, kinds = L < 3 ? ['go', 'fetch', 'go'] : L < 6 ? ['go', 'talk', 'fetch', 'talk'] : ['talk', 'ride', 'fetch', 'talk', 'go'], type = kinds[tasksDone % kinds.length], rps = rpList();
      if (type === 'talk' && !rps.length) type = 'go';
      var here = PLACES.filter(function (p) { return !near(door(p), me, 30); }), p = here[Math.floor(K.rnd(0, here.length))] || PLACES[1];
      if (type === 'go') { task = { type: 'go', p: p, w: { en: p.en, so: p.so } }; marker = door(p); instr('Go to the ' + p.en + '.', 'Tag: ' + p.so + '.'); }
      else if (type === 'talk') { var rp = rps[Math.floor(K.rnd(0, rps.length))], at = place(RP_AT[rp.id]), d = door(at); task = { type: 'talk', rp: rp, p: at, w: { en: rp.npc.toLowerCase(), so: rp.npcSo.toLowerCase() } }; npcs.push({ x: d.x + 2.5, z: d.z + 0.6, c: [0.95, 0.95, 0.92], s: skins[1], name: rp.npc, task: true }); marker = d; instr('Talk to the ' + rp.npc.toLowerCase() + ' at the ' + at.en + '.', 'La hadal: ' + rp.npcSo + ' — ' + at.so + '.'); }
      else if (type === 'ride') { var a = p, others = PLACES.filter(function (q) { return q !== a && q.k !== 'park'; }), b = others[Math.floor(K.rnd(0, others.length))], da = door(a); task = { type: 'ride', a: a, b: b, stage: 0, w: { en: b.en, so: b.so } }; npcs.push({ x: da.x - 2.5, z: da.z + 0.4, c: cloths[1], s: skins[0], name: 'Faadumo', rider: true }); marker = da; instr('Pick up Faadumo at the ' + a.en + ', then drive her to the ' + b.en + '.', 'Faadumo ka soo qaad ' + a.so + ', kadibna gee ' + b.so + '.'); }
      else { var pool = R.pool.filter(function (e) { return visualFor(e.en); }), w = pool[Math.floor(K.rnd(0, pool.length))], ds = K.distract(w, R, 2), opts = K.shuf([w].concat(ds)), bx = Math.max(0, Math.min(N - 1, Math.floor((me.x - RW) / PITCH) + (Math.random() < 0.5 ? 1 : -1))), bz = Math.max(0, Math.min(N - 1, Math.floor((me.z - RW) / PITCH))); task = { type: 'fetch', w: w }; opts.forEach(function (o, n) { items.push({ x: blockX(bx) + 5 + n * 8, z: blockX(bz) - 1.6, w: o, ok: o === w }); }); marker = { x: blockX(bx) + 13, z: blockX(bz) - 1.6 }; instr('Find this word in the street and walk into it.', 'Erayga sawirkan ka raadi waddada oo ku dhex soco.', '<span class="gm-pic keep-emoji">' + visHTML(w.en) + '</span>'); document.querySelector('#gmTarget .tw-so').textContent = w.so + ' — ' + document.querySelector('#gmTarget .tw-so').textContent; }
    }
    function done(x, z) { tasksDone++; var p = proj(x, 2, z) || [W / 2, H / 2]; R.good(task.w, p[0], p[1]); if (!R.over) setTimeout(function () { if (!R.over) newTask(); }, 900); task = null; marker = null; }

    /* ---------- talking ---------- */
    function say(name, en, so) { sayEl.hidden = false; sayEl.innerHTML = '<b>' + esc(name) + '</b><span lang="en">' + esc(en) + '</span><small lang="so">' + esc(so) + '</small>'; try { speak(en); } catch (e) { } clearTimeout(say.t); say.t = setTimeout(function () { sayEl.hidden = true; }, 4200); }
    function openDlg() { var rp = task.rp, n = Math.min(rp.turns.length, R.c.L >= 6 ? 3 : 2); dlg = { rp: rp, i: 0, n: n, wait: false }; me.v = 0; car.v = 0; paintDlg(); }
    function paintDlg() {
      var t = dlg.rp.turns[dlg.i], opts = K.shuf(t.opts.slice()); dlgEl.hidden = false;
      dlgEl.innerHTML = '<p class="hero-eyebrow">' + esc(dlg.rp.npc) + ' · ' + (dlg.i + 1) + ' / ' + dlg.n + '</p><div class="cz-qrow"><p class="tw-line" lang="en">' + esc(t.n) + '</p><button type="button" class="iconbtn" id="twDHear" aria-label="' + T('Dhegeyso', 'Listen') + '">' + ic('speaker') + '</button></div><p class="tw-so" lang="so">' + esc(t.ns) + '</p><div class="opts">' + opts.map(function (o, k) { return '<button type="button" class="opt keep-emoji" lang="en" data-k="' + k + '">' + esc(o.e) + '</button>'; }).join('') + '</div><p class="tw-why" id="twWhy" lang="so"></p>';
      try { speak(t.n); } catch (e) { } document.getElementById('twDHear').onclick = function () { try { speak(t.n, true); } catch (e) { } };
      dlgEl.querySelectorAll('[data-k]').forEach(function (b) { b.onclick = function () {
        if (dlg.wait) return; dlg.wait = true; var o = opts[+b.dataset.k], right = null; opts.forEach(function (q) { if (q.c) right = q; });
        if (o.c) { b.classList.add('correct'); K.sfx('chime'); R.score += 5; R.hud(); document.getElementById('twWhy').textContent = o.s; try { speak(o.e); } catch (e) { } }
        else { b.classList.add('wrong'); dlgEl.querySelectorAll('[data-k]').forEach(function (x) { if (opts[+x.dataset.k].c) x.classList.add('correct'); }); document.getElementById('twWhy').textContent = o.w || (right ? right.s : ''); R.bad(right ? { en: right.e, so: right.s } : null); }
        if (R.over) return; setTimeout(function () { if (R.over) return; dlg.i++; dlg.wait = false; if (dlg.i >= dlg.n) { dlgEl.hidden = true; dlg = null; done(me.x, me.z); } else paintDlg(); }, o.c ? 1300 : 2600);
      }; });
    }

    /* ---------- controls ---------- */
    var stick = document.getElementById('twStick'), knob = stick.firstChild, sid = null;
    function sMove(e) { var r = stick.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), m = Math.hypot(dx, dy), lim = r.width / 2 - 14; if (m > lim) { dx *= lim / m; dy *= lim / m; } joy.x = dx / lim; joy.y = -dy / lim; knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; }
    stick.onpointerdown = function (e) { sid = e.pointerId; try { stick.setPointerCapture(sid); } catch (er) { } sMove(e); };
    stick.onpointermove = function (e) { if (e.pointerId === sid) sMove(e); };
    stick.onpointerup = stick.onpointercancel = function () { sid = null; joy.x = joy.y = 0; knob.style.transform = ''; };
    var kd = function (e) { keys[e.key] = true; if (e.key.indexOf('Arrow') === 0) e.preventDefault(); if (e.key === 'e' || e.key === 'Enter') { if (!bTalk.hidden) bTalk.click(); else if (!bCar.hidden) bCar.click(); } }, ku = function (e) { keys[e.key] = false; };
    addEventListener('keydown', kd); addEventListener('keyup', ku);
    bCar.onclick = function () { if (dlg) return; K.sfx('pop'); if (me.car) { me.car = false; me.x = car.x + Math.cos(car.a) * 2.6; me.z = car.z - Math.sin(car.a) * 2.6; me.a = car.a; car.v = 0; } else if (near(me, car, 7)) { me.car = true; } };
    bTalk.onclick = function () { if (dlg) return; var t = null; npcs.forEach(function (n) { if (n.task && near(me.car ? car : me, n, 6)) t = n; }); if (t && task && task.type === 'talk') { openDlg(); return; } var p = null; peds.forEach(function (q) { if (near(me.car ? car : me, q, 5)) p = q; }); if (p) { K.sfx('pop'); say(p.name, p.line[0], p.line[1]); } };

    /* ---------- simulation ---------- */
    function blocked(x, z, r) { if (x < 1 || z < 1 || x > SIZE - 1 || z > SIZE - 1) return true; for (var i = 0; i < solids.length; i++) { var s = solids[i]; if (x > s[0] - r && x < s[2] + r && z > s[1] - r && z < s[3] + r) return true; } return false; }
    function proj(x, y, z) { if (!MVP) return null; var m = MVP, w = m[3] * x + m[7] * y + m[11] * z + m[15]; if (w <= 0.1) return null; var px = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w, py = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w; return [(px * 0.5 + 0.5) * W, (1 - (py * 0.5 + 0.5)) * H, w]; }
    function step(dt) {
      time += dt; hurt = Math.max(0, hurt - dt);
      var ix = joy.x + (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0), iy = joy.y + (keys.ArrowUp || keys.w ? 1 : 0) - (keys.ArrowDown || keys.s ? 1 : 0); ix = Math.max(-1, Math.min(1, ix)); iy = Math.max(-1, Math.min(1, iy));
      if (dlg) { ix = iy = 0; }
      if (me.car) {
        car.v += iy * 16 * dt; car.v *= Math.pow(0.55, dt); car.v = Math.max(-6, Math.min(19, car.v)); if (Math.abs(iy) < 0.05) car.v *= Math.pow(0.3, dt);
        car.a -= ix * Math.max(-1, Math.min(1, car.v / 6)) * 1.9 * dt; var nx = car.x + Math.sin(car.a) * car.v * dt, nz = car.z + Math.cos(car.a) * car.v * dt;
        if (!blocked(nx, car.z, 1.7)) car.x = nx; else car.v *= -0.25; if (!blocked(car.x, nz, 1.7)) car.z = nz; else car.v *= -0.25; me.x = car.x; me.z = car.z; me.a = car.a;
      } else {
        me.a -= ix * 2.6 * dt; var sp = iy * (iy > 0 ? 6.5 : 3), fx = me.x + Math.sin(me.a) * sp * dt, fz = me.z + Math.cos(me.a) * sp * dt; me.v = sp;
        if (!blocked(fx, me.z, 0.7)) me.x = fx; if (!blocked(me.x, fz, 0.7)) me.z = fz;
      }
      peds.forEach(function (p) { p.x += p.d * 1.3 * dt; if (p.x > p.x1) p.d = -1; if (p.x < p.x0) p.d = 1; });
      traffic.forEach(function (t) { t.s += t.dir * t.v * dt; if (t.s > SIZE + 12) t.s = -12; if (t.s < -12) t.s = SIZE + 12; t.x = t.horiz ? t.s : t.line; t.z = t.horiz ? t.line : t.s; t.a = t.horiz ? (t.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (t.dir > 0 ? 0 : Math.PI); if (!hurt && !dlg && near(t, me, me.car ? 3 : 1.9)) { hurt = 2.5; R.bad(task ? task.w : null); car.v = -4; if (!me.car) { me.x -= Math.sin(me.a) * 2; me.z -= Math.cos(me.a) * 2; } } });
      if (R.over) return;
      var who = me.car ? car : me;
      if (task && !dlg) {
        if (task.type === 'go' && near(who, marker, me.car ? 5 : 3.2)) done(marker.x, marker.z);
        else if (task.type === 'ride') { if (task.stage === 0 && near(who, marker, 5)) { if (me.car) { task.stage = 1; passenger = npcs[0]; npcs = []; marker = door(task.b); K.sfx('tok'); say('Faadumo', 'Thank you. Please drive me to the ' + task.b.en + '.', 'Mahadsanid. Fadlan i gee ' + task.b.so + '.'); } else if (!sayEl.dataset.once || time - (+sayEl.dataset.once) > 6) { sayEl.dataset.once = time; say('Faadumo', 'Please come with the car.', 'Fadlan gaariga la kaalay.'); } } else if (task.stage === 1 && me.car && near(car, marker, 5)) { passenger = null; done(marker.x, marker.z); } }
        else if (task.type === 'fetch') items.slice().forEach(function (it) { if (near(who, it, me.car ? 2.6 : 1.8)) { items.splice(items.indexOf(it), 1); if (it.ok) done(it.x, it.z); else { K.sfx('thud'); R.bad(task.w); } } });
      }
    }

    /* ---------- render ---------- */
    function person(o, x, z, a, cloth, skin, bob) { rbox(o, x, z, 0.9, 0.6, 1.5, 0.15 + bob, a, cloth); rbox(o, x, z, 0.6, 0.6, 0.6, 1.7 + bob, a, skin); rbox(o, x, z, 0.72, 0.72, 0.22, 2.2 + bob, a, [cloth[0] * 0.7, cloth[1] * 0.7, cloth[2] * 0.7]); }
    function vehicle(o, x, z, a, col) { flat(o, x - 2.2, z - 2.2, x + 2.2, z + 2.2, 0.03, [0.16, 0.16, 0.15]); rbox(o, x, z, 2.2, 4.4, 0.9, 0.35, a, col); rbox(o, x - Math.sin(a) * 0.3, z - Math.cos(a) * 0.3, 1.9, 2.3, 0.8, 1.25, a, [0.24, 0.32, 0.38]); [[-1.1, 1.4], [1.1, 1.4], [-1.1, -1.4], [1.1, -1.4]].forEach(function (w) { var ca = Math.cos(a), sa = Math.sin(a); rbox(o, x + w[0] * ca + w[1] * sa, z - w[0] * sa + w[1] * ca, 0.4, 0.9, 0.7, 0, a, [0.1, 0.1, 0.1]); }); }
    function label(html, x, y, z, cls) { var p = proj(x, y, z); if (!p || p[2] > 95 || p[0] < -40 || p[0] > W + 40 || p[1] < -20 || p[1] > H) return ''; return '<span class="' + (cls || '') + '" style="left:' + p[0].toFixed(0) + 'px;top:' + p[1].toFixed(0) + 'px">' + html + '</span>'; }
    function render() {
      var who = me.car ? car : me, d = me.car ? 13 : 8.5, hgt = me.car ? 6.5 : 4.6, da = who.a - camA; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; camA += da * 0.08;
      var eye = [who.x - Math.sin(camA) * d, hgt, who.z - Math.cos(camA) * d]; MVP = mul(persp(1.05, W / H, 0.5, 400), look(eye, [who.x + Math.sin(camA) * 4, 1.6, who.z + Math.cos(camA) * 4]));
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.uniformMatrix4fv(uM, false, new Float32Array(MVP)); drawBuf(vbS, town.length / 6);
      var o = []; vehicle(o, car.x, car.z, car.a, [0.06, 0.49, 0.4]);
      if (!me.car) person(o, me.x, me.z, me.a, [0.06, 0.49, 0.4], skins[0], Math.abs(Math.sin(time * 9)) * 0.12 * Math.min(1, Math.abs(me.v) / 3));
      peds.forEach(function (p) { person(o, p.x, p.z, p.d > 0 ? Math.PI / 2 : -Math.PI / 2, p.c, p.s, Math.abs(Math.sin(time * 6 + p.x)) * 0.08); });
      npcs.forEach(function (n) { person(o, n.x, n.z, Math.atan2(who.x - n.x, who.z - n.z), n.c, n.s, 0); });
      traffic.forEach(function (t) { if (t.x != null) vehicle(o, t.x, t.z, t.a, t.c); });
      items.forEach(function (it) { rbox(o, it.x, it.z, 1.6, 1.6, 0.5, 0.2, time, [0.91, 0.71, 0.3]); });
      if (marker) { var pu = 2.4 + Math.sin(time * 4) * 0.4; rbox(o, marker.x, marker.z, pu, pu, 0.12, 0.2, time * 0.8, [0.91, 0.71, 0.3]); rbox(o, marker.x, marker.z, 0.35, 0.35, 7, 0.3, 0, [0.95, 0.8, 0.4]); }
      gl.bindBuffer(gl.ARRAY_BUFFER, vbD); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(o), gl.DYNAMIC_DRAW); drawBuf(vbD, o.length / 6);
      var h = ''; PLACES.forEach(function (p) { var c = door(p); if (Math.hypot(c.x - who.x, c.z - who.z) < 75) h += label('<b lang="en">' + p.en + '</b><i lang="so">' + p.so + '</i>', c.x, p.k === 'park' ? 3 : 5.2, c.z + (p.k === 'park' ? 10 : 2), 'tw-place'); });
      items.forEach(function (it) { h += label('<b lang="en">' + esc(it.w.en) + '</b>', it.x, 2.2, it.z, 'tw-item'); });
      npcs.forEach(function (n) { h += label(esc(n.name), n.x, 3, n.z, 'tw-npc'); });
      if (passenger) h += label('Faadumo', car.x, 3.2, car.z, 'tw-npc');
      lab.innerHTML = h;
      if (marker) { var ang = Math.atan2(marker.x - who.x, marker.z - who.z) - camA, dist = Math.hypot(marker.x - who.x, marker.z - who.z); cmp.hidden = false; cmp.firstChild.style.transform = 'rotate(' + (-ang) + 'rad)'; cmp.lastChild.textContent = Math.round(dist) + ' m'; } else cmp.hidden = true;
      var nearCar = !me.car && near(me, car, 7); bCar.hidden = !(me.car || nearCar) || !!dlg; bCar.lastChild.textContent = me.car ? T('Ka deg', 'Get out') : T('Kaxee', 'Drive');
      var talkable = false; if (!dlg) { npcs.forEach(function (n) { if (n.task && near(who, n, 6)) talkable = true; }); peds.forEach(function (q) { if (near(who, q, 5)) talkable = true; }); } bTalk.hidden = !talkable;
      stage.classList.toggle('tw-hurt', hurt > 2);
    }
    newTask();
    R.step = function (dt) { step(dt); if (!R.over) render(); };
    R.cleanup = function () { removeEventListener('keydown', kd); removeEventListener('keyup', ku); clearTimeout(say.t); try { var x = gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); } catch (e) { } };
    window.__TW = { me: me, car: car, task: function () { return task; }, marker: function () { return marker; }, items: function () { return items; }, npcs: function () { return npcs; }, tris: town.length / 18 };
  };
})();
