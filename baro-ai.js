/* Baro AI — loaded only when the learner opens the AI academy. */
(function () {
  'use strict';
  var route = 'roadmap', lesson = 0, selected = '';
  var stages = [
    ['Bilow — Waa maxay AI?', 'Baro waxa AI yahay, waxa uu qaban karo, iyo meelaha uu ku khaldi karo.'],
    ['Si xirfad leh u la hadal AI-ga — prompting', 'Baro sida codsi cad loogu qoro AI-ga.'],
    ['AI-ga iyo shaqada', 'Baro sida AI-gu shaqada kuu fududayn karo.'],
    ['Wakiillada AI — agents iyo badbaado', 'Baro wakiillada AI iyo sida ammaan loogu isticmaalo.'],
    ['Vibe coding — sharax oo dhis', 'Sharax waxa aad rabto, dabadeedna AI la dhis.'],
    ['Daah-fur — dhis oo daabac website-kaagii ugu horreeyay + shahaado', 'Dhis, hubi, oo daabac website-kaaga ugu horreeya.']
  ];
  var lessons = [
    { title: 'Waa maxay AI?', body: '<p><strong>AI</strong> waa tiknoolajiyad kombiyuutarka ka caawisa inuu barto qaabab, fahmo codsiyo, oo soo jeediyo jawaabo. Ma aha qof, mana oga wax walba. Wuu khaldi karaa, sidaas darteed xogta muhiimka ah mar walba hubi.</p><p class="ai-english"><strong>English terms:</strong> AI = Artificial Intelligence. Pattern = qaab soo noqnoqda. Answer = jawaab.</p>' },
    { title: 'La kulan ChatGPT, Claude iyo Gemini', body: '<p><strong>ChatGPT, Claude iyo Gemini</strong> waa saddex ka mid ah aaladaha AI ee aad la sheekaysan karto. Waxaad weydiin kartaa su’aal, waxaad siin kartaa qoraal, ama waxaad ka codsan kartaa inuu fikrad kuu sharxo.</p><p>Mid kasta jawaabtiisu way kala duwanaan kartaa. Ha u qaadan jawaab kasta inay sax tahay; si deggan u akhri oo hubi.</p><p class="ai-english"><strong>English terms:</strong> AI assistant = kaaliye AI. AI chat = meel aad AI kula sheekaysato.</p>' },
    { title: 'Wadahadalkaaga ugu horreeya', body: '<p>La hadalka AI-gu wuxuu la mid yahay inaad qof caawinaya hawl u sharaxayso. U sheeg waxa aad rabto, cidda loogu talagalay, iyo sida aad rabto jawaabta.</p><p>Tusaale: <strong>“Iiga sharax AI-ga Af-Soomaali fudud, anigoo bilow ah. Saddex tusaale ii raaci.”</strong></p><p class="ai-english"><strong>English term:</strong> Conversation = wada hadal.</p>' },
    { title: 'Prompt-kaaga ugu horreeya', body: '<p><strong>Prompt</strong> waa codsiga ama tilmaanta aad AI-ga u qorto. Prompt wanaagsan waa mid cad. Af-Soomaali waad ku qori kartaa; Ingiriisi khasab ma aha.</p><p>Qaab fudud: <strong>Waxaan rabaa… / I want…</strong> + waxa aad u baahan tahay + sida aad rabto in loo soo bandhigo.</p><p class="ai-english"><strong>English terms:</strong> Prompt = codsi ama tilmaam. Clear = cad. Example = tusaale.</p>' },
    { title: 'Saddex prompt oo aad hadda tijaabin karto', body: '<p>Mid kasta nuqul ka qaado, kadibna ku dheji AI chat kasta.</p><div class="ai-prompt"><code>Iiga sharax AI-ga Af-Soomaali fudud. Saddex tusaale oo nolol maalmeed ah ii sheeg.</code><button type="button" class="simple-text-button" data-copy-prompt>Nuqul ka qaado / Copy</button></div><div class="ai-prompt"><code>Iga caawi inaan qoro farriin Ingiriisi ah oo aan shaqo ku codsanayo. Marka hore saddex su’aalood i weydii.</code><button type="button" class="simple-text-button" data-copy-prompt>Nuqul ka qaado / Copy</button></div><div class="ai-prompt"><code>Waxaan rabaa inaan barto 5 eray oo Ingiriisi ah maanta. Eray kasta macnihiisa Af-Soomaali iyo jumlad fudud ii qor.</code><button type="button" class="simple-text-button" data-copy-prompt>Nuqul ka qaado / Copy</button></div><p class="small muted" id="aiCopyStatus" role="status"></p>' },
    { title: 'Hubinta Marxaladda 1', body: '' }
  ];
  function T(so, en) { return S && S.profile && S.profile.ui === 'en' ? en : so; }
  function state() {
    if (!S.baroAI || typeof S.baroAI !== 'object') S.baroAI = { v: 1, lesson: 0, completed: {}, stage1Complete: false };
    if (!S.baroAI.completed || typeof S.baroAI.completed !== 'object') S.baroAI.completed = {};
    return S.baroAI;
  }
  function progress() { var b = state(), n = Object.keys(b.completed).length; return Math.min(6, n + (b.stage1Complete ? 1 : 0)); }
  function roadmap() {
    var b = state();
    app.innerHTML = '<p class="hero-eyebrow">Baro AI · AI Zero to Hero</p><h1>AI ku baro Af-Soomaali</h1><p class="simple-intro">Ka bilow waxa AI yahay, kuna soco ilaa aad website-kaaga ugu horreeya daabacayso. Marxaladda 1 ayaa hadda diyaar ah; inta kale way soo socotaa.</p><div class="ai-roadmap">' + stages.map(function (s, i) {
      var ready = i === 0;
      return '<button type="button" class="ai-stage' + (ready ? '' : ' is-coming') + '"' + (ready ? ' id="aiStage1"' : ' disabled') + '><span class="ai-stage-num">' + (i + 1) + '</span><span class="ai-stage-copy"><strong>' + s[0] + '</strong><small>' + s[1] + ' ' + (ready ? (b.stage1Complete ? 'Marxaladdan waad dhammeeysay.' : '6 cashar oo gaaban · bilow hadda') : 'Wali diyaar ma aha — dhawaan ayay imanaysaa.') + '</small></span><span class="ai-coming">' + (ready ? (b.stage1Complete ? 'Dhammaatay' : 'Fur') : 'Dhawaan') + '</span></button>';
    }).join('') + '</div>';
    document.getElementById('aiStage1').onclick = function () { lesson = Math.min(5, state().lesson || 0); route = 'lesson'; paint(); };
  }
  function markLesson() { var b = state(); b.completed['A' + (lesson + 1)] = { date: todayStr() }; b.lesson = Math.min(5, lesson + 1); return save(); }
  function wireCopy() {
    app.querySelectorAll('[data-copy-prompt]').forEach(function (button) { button.onclick = function () {
      var text = button.parentNode.querySelector('code').textContent, status = document.getElementById('aiCopyStatus');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { status.textContent = 'Waa la nuqulay. / Copied.'; }).catch(function () { status.textContent = 'Qoraalka kor ku yaal dooro oo nuqul ka qaado. / Select the text above to copy it.'; });
      else status.textContent = 'Qoraalka kor ku yaal dooro oo nuqul ka qaado. / Select the text above to copy it.';
    }; });
  }
  function quiz() {
    app.innerHTML = '<button type="button" class="simple-back" id="aiLessonBack">← Baro AI</button><div class="ai-progress"><p>Casharka 6 / 6</p><div class="simple-progress"><i style="width:100%"></i></div></div><section class="ai-lesson-card"><h1>Hubinta Marxaladda 1</h1><p><strong>AI waa maxay?</strong></p><div class="ai-options"><button type="button" data-ai-answer="wrong" aria-pressed="false">Qof wax walba yaqaan</button><button type="button" data-ai-answer="right" aria-pressed="false">Tiknoolajiyad barta qaabab oo ka jawaabta codsiyo</button><button type="button" data-ai-answer="wrong" aria-pressed="false">Mashiin aan waligiis khaldin</button></div><button type="button" class="simple-primary" id="aiCheck">Hubi jawaabta</button><div id="aiFeedback" role="status"></div></section>';
    document.getElementById('aiLessonBack').onclick = function () { route = 'roadmap'; paint(); };
    app.querySelectorAll('[data-ai-answer]').forEach(function (button) { button.onclick = function () { selected = button.dataset.aiAnswer; app.querySelectorAll('[data-ai-answer]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === button)); }); }; });
    document.getElementById('aiCheck').onclick = function () {
      var out = document.getElementById('aiFeedback'); if (!selected) { out.innerHTML = '<p class="feedback bad">Marka hore jawaab dooro.</p>'; return; }
      if (selected !== 'right') {
        mistakeAdd(S, { key: 'baro-ai:ai-meaning', q: 'What is AI?', qSo: 'AI waa maxay?', opts: ['A person who knows everything', 'Technology that learns patterns and responds to requests', 'A machine that is never wrong'], ans: 'Technology that learns patterns and responds to requests', why: 'AI waa tiknoolajiyad; qof ma aha, wuuna khaldi karaa.', type: 'mcq', wordEn: 'artificial intelligence', wordSo: 'caqli macmal ah' });
        save(); out.innerHTML = '<p class="feedback bad">Wali ma aha. AI qof ma aha, mararka qaarkoodna wuu khaldaa. Mar kale dooro.</p>'; return;
      }
      mistakeCorrect(S, 'baro-ai:ai-meaning', todayStr());
      markLesson().then(function () { out.innerHTML = '<p class="feedback good">Sax! AI waa tiknoolajiyad barta qaabab oo ka jawaabta codsiyo.</p><button type="button" class="simple-primary" id="aiFinish">Dhammee marxaladda</button>'; document.getElementById('aiFinish').onclick = finish; });
    };
  }
  function finish() {
    var b = state(); b.stage1Complete = true; b.lesson = 5;
    [['artificial intelligence', 'caqli macmal ah'], ['prompt', 'codsi ama tilmaam'], ['AI assistant', 'kaaliye AI']].forEach(function (w) { addSRS(w[0], w[1]); });
    save().then(function () { route = 'done'; paint(); });
  }
  function done() {
    app.innerHTML = '<section class="ai-lesson-card"><p class="hero-eyebrow">Baro AI · Marxaladda 1</p><h1>Marxaladda 1 waa dhammaatay</h1><p>Hadda waxaad garanaysaa waxa AI yahay, saddex aaladood oo AI ah, iyo sida prompt cad Af-Soomaali loogu qoro.</p><h2>Hubintaada gaaban</h2><ul class="ai-checklist"><li>Waan sharxi karaa waxa AI yahay.</li><li>Waan ogahay in AI-gu khaldi karo.</li><li>Waxaan qori karaa prompt cad oo Af-Soomaali ah.</li><li>Waxaan haystaa saddex prompt oo aan tijaabin karo.</li></ul><button type="button" class="simple-primary" id="aiBackRoadmap">Ku noqo qorshaha Baro AI</button></section>';
    document.getElementById('aiBackRoadmap').onclick = function () { route = 'roadmap'; paint(); };
  }
  function lessonView() {
    if (lesson === 5) { quiz(); return; }
    var l = lessons[lesson];
    app.innerHTML = '<button type="button" class="simple-back" id="aiLessonBack">← Baro AI</button><div class="ai-progress"><p>Casharka ' + (lesson + 1) + ' / 6</p><div class="simple-progress"><i style="width:' + Math.round((lesson + 1) / 6 * 100) + '%"></i></div></div><section class="ai-lesson-card"><h1>' + l.title + '</h1>' + l.body + '<button type="button" class="simple-primary" id="aiContinue">Sii wad</button></section>';
    document.getElementById('aiLessonBack').onclick = function () { route = 'roadmap'; paint(); };
    document.getElementById('aiContinue').onclick = function () { markLesson().then(function () { lesson++; paint(); }); };
    wireCopy();
  }
  function paint() { document.body.classList.add('view-ai'); if (route === 'lesson') lessonView(); else if (route === 'done') done(); else roadmap(); }
  window.renderBaroAI = paint;
  window.openBaroAI = function () { route = 'roadmap'; setNav('ai'); render(); };
  var oldHome = renderHome, oldProfile = renderProfile, oldRender = render;
  renderHome = function () {
    oldHome(); var box = app.querySelector('.simple-home-content'); if (!box || document.getElementById('homeBaroAI')) return;
    var b = document.createElement('button'); b.type = 'button'; b.id = 'homeBaroAI'; b.className = 'cz-home'; b.innerHTML = '<span class="cz-row-ic">✦</span><span class="cz-row-t"><b>Baro AI</b><small>' + (state().stage1Complete ? 'Marxaladda 1 waa dhammaatay · Stage 1 complete' : 'AI Zero to Hero — Af-Soomaali ku bilow') + '</small></span><span>›</span>'; b.onclick = window.openBaroAI;
    var anchor = document.getElementById('homeCit') || box.querySelector('.simple-next'); anchor.insertAdjacentElement('afterend', b);
  };
  renderProfile = function () {
    oldProfile(); var rows = app.querySelector('.simple-profile-rows'); if (!rows || document.getElementById('profileBaroAI')) return;
    var b = document.createElement('button'); b.type = 'button'; b.id = 'profileBaroAI'; b.className = 'simple-row'; b.innerHTML = '<span class="simple-icon" aria-hidden="true">✦</span><span>Baro AI</span><small>' + progress() + ' / 6</small><span>›</span>'; b.onclick = window.openBaroAI; rows.insertBefore(b, rows.children[1] || null);
  };
  render = function () { if (view !== 'ai') document.body.classList.remove('view-ai'); oldRender(); };
  if (S && S.profile && S.profile.onboarded) render();
})();
