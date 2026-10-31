/* Focused interface upgrade; the existing curriculum and profile store remain authoritative. */
(function () {
  'use strict';
  var query = '', tab = 'results', limit = 12, sequence = 0, request = null;
  var liveResult = null, liveWord = '', liveQuery = '', loading = false;
  var browseAll = false, browseUnit = null;
  var icons = {
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
    arrow: '<path d="m9 5 7 7-7 7"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    speaker: '<path d="M11 4 5 9H2v6h3l6 5zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    book: '<path d="M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1zm0 0v15"/>'
  };
  function icon(name) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + icons[name] + '</svg>'; }
  function saved() { return S && Array.isArray(S.dictionarySaved) ? S.dictionarySaved : []; }
  function isSaved(word) { return saved().some(function (e) { return norm(e.en) === norm(word); }); }
  function saveButton(word) {
    var yes = isSaved(word);
    return '<button type="button" class="dict-save' + (yes ? ' selected' : '') + '" data-save-word="' + esc(word) + '" aria-pressed="' + yes + '" aria-label="' + (yes ? 'Ka saar / Unsave ' : 'Kaydi / Save ') + esc(word) + '">' + icon('bookmark') + '</button>';
  }
  function localHits() {
    var q = norm(query);
    if (!q) return [];
    return dictUnified().filter(function (e) { return norm(e.en).includes(q) || norm(e.so).includes(q); }).sort(function (a, b) {
      function rank(e) { return norm(e.en) === q || norm(e.so) === q ? 0 : norm(e.en).startsWith(q) || norm(e.so).startsWith(q) ? 1 : 2; }
      return rank(a) - rank(b);
    });
  }
  function entryHTML(e, index) {
    var somali = e.definition && e.definition.language === 'so';
    return '<article class="dictionary-entry"><div class="dictionary-entry-head"><div><h3 lang="' + (somali ? 'so' : 'en') + '">' + esc(e.en) + '</h3><p class="dictionary-translation" lang="so">' + esc(e.so || '') + '</p></div><div class="dictionary-actions">' + (somali ? '' : speakBtn(e.en)) + saveButton(e.en) + '</div></div>'
      + (e.exEn ? '<blockquote><p lang="en">' + esc(e.exEn) + '</p>' + (e.exSo ? '<p class="muted" lang="so">' + esc(e.exSo) + '</p>' : '') + '</blockquote>' : '')
      + (e.definition ? '<p>' + esc((((e.definition.meanings || [])[0] || {}).definitions || [])[0]?.definition || '') + '</p>' : '')
      + '<div class="dictionary-entry-footer"><span>' + (e.definition ? 'Eray kaydsan / Saved word' : 'Eray cashir / Course word') + '</span><button class="text-button" type="button" data-define="' + esc(e.en) + '">Qeexid / Definition ' + icon('arrow') + '</button></div></article>';
  }
  function liveHTML() {
    if (loading) return '<div class="dictionary-notice" role="status">Raadin… / Looking up “' + esc(liveWord) + '”…</div>';
    if (!liveResult) return '';
    if (liveResult.status !== 'success') {
      if (liveResult.status === 'cancelled') return '';
      var missing = liveResult.status === 'not-found';
      return '<div class="dictionary-notice" role="status"><strong>' + (missing ? 'Qeexid lama helin / No live definition found' : 'Qaamuuska lama xiriiri karo / Dictionary unavailable') + '</strong><p>' + (missing ? 'Hubi higgaadda ama isku day eray kale. / Check the spelling or try another word. Dictionary coverage varies.' : 'Hubi internetka oo mar kale isku day. Erayada casharradu wali waa diyaar. / Check your connection and try again. Course words are still available.') + '</p><button class="btn secondary" type="button" id="dictionaryRetry">Mar kale / Try again</button></div>';
    }
    return '<section class="live-definitions" aria-label="Live dictionary definitions">' + (liveResult.cached ? '<p class="dictionary-notice">Kaydsan / Showing a previously downloaded definition.</p>' : '') + liveResult.entries.slice(0, 6).map(function (e) {
      var somali = e.language === 'so';
      var local = !somali && dictUnified().find(function (x) { return norm(x.en) === norm(e.word); });
      var phonetics = Array.isArray(e.phonetics) ? e.phonetics : [];
      var audio = phonetics.map(function (p) { return AcademyDictionary.safeURL(p.audio); }).find(Boolean);
      var phonetic = e.phonetic || ((phonetics.find(function (p) { return p.text; }) || {}).text) || '';
      var sources = (Array.isArray(e.sourceUrls) ? e.sourceUrls : []).filter(function (u) { return AcademyDictionary.safeURL(u); });
      var license = e.license && typeof e.license.name === 'string' ? e.license : null;
      return '<article class="dictionary-entry live-entry"><div class="dictionary-entry-head"><div><span class="dictionary-source-tag">' + (somali ? 'Soomaali → English · Wiktionary' : 'English dictionary') + '</span><h3 lang="' + (somali ? 'so' : 'en') + '">' + esc(e.word) + '</h3><p class="phonetic">' + esc(phonetic) + '</p></div><div class="dictionary-actions">' + (somali ? '' : audio ? '<button class="iconbtn" type="button" data-audio-url="' + esc(audio) + '" data-audio-word="' + esc(e.word) + '" aria-label="Dhegeyso / Listen to ' + esc(e.word) + '">' + icon('speaker') + '</button>' : speakBtn(e.word)) + saveButton(e.word) + '</div></div>'
        + (local ? '<p class="dictionary-translation" lang="so">' + esc(local.so) + '<span class="dictionary-small-label">Soomaali · Course vocabulary</span></p>' : '<p class="small muted">Qeexid Ingiriisi ah / English definition</p>')
        + e.meanings.slice(0, 4).filter(function (m) { return m && Array.isArray(m.definitions); }).map(function (m) {
          return '<section class="dictionary-meaning"><h4>' + esc(m.partOfSpeech || 'Meaning') + '</h4><ol>' + m.definitions.filter(function (d) { return d && typeof d.definition === 'string'; }).slice(0, 3).map(function (d) {
            return '<li><span lang="en">' + esc(d.definition) + '</span>' + (d.example ? '<blockquote lang="en">' + esc(d.example) + '</blockquote>' : '') + '</li>';
          }).join('') + '</ol></section>';
        }).join('')
        + '<footer class="dictionary-attribution">Source: <a href="' + (somali ? 'https://en.wiktionary.org/' : 'https://dictionaryapi.dev/') + '" target="_blank" rel="noopener noreferrer">' + (somali ? 'Wiktionary' : 'Free Dictionary API') + '</a>'
        + sources.slice(0, 2).map(function (u) { return ' · <a href="' + esc(AcademyDictionary.safeURL(u)) + '" target="_blank" rel="noopener noreferrer">Original entry</a>'; }).join('')
        + (license ? ' · ' + (AcademyDictionary.safeURL(license.url) ? '<a href="' + esc(AcademyDictionary.safeURL(license.url)) + '" target="_blank" rel="noopener noreferrer">' + esc(license.name) + '</a>' : esc(license.name)) : '') + '</footer></article>';
    }).join('') + '</section>';
  }
  function updateSaveButtons() {
    app.querySelectorAll('[data-save-word]').forEach(function (b) {
      var yes = isSaved(b.dataset.saveWord);
      b.classList.toggle('selected', yes); b.setAttribute('aria-pressed', String(yes));
      b.setAttribute('aria-label', (yes ? 'Ka saar / Unsave ' : 'Kaydi / Save ') + b.dataset.saveWord);
    });
  }
  function wireResults() {
    bindSpeak(app);
    app.querySelectorAll('[data-define]').forEach(function (b) { b.addEventListener('click', function () {
      query = b.dataset.define;
      var input = document.getElementById('dictionaryQuery'); if (input) input.value = query;
      searchLive(query);
      var target = document.getElementById('dictionaryLive'); if (target) target.scrollIntoView({ block: 'start' });
    }); });
    app.querySelectorAll('[data-save-word]').forEach(function (b) { b.addEventListener('click', function () {
      if (!S) return;
      var word = b.dataset.saveWord;
      if (isSaved(word)) S.dictionarySaved = saved().filter(function (e) { return norm(e.en) !== norm(word); });
      else {
        var local = dictUnified().find(function (e) { return norm(e.en) === norm(word); });
        var entries = liveResult && liveResult.entries || [];
        var definition = entries.find(function (e) { return norm(e.word) === norm(word); });
        S.dictionarySaved = saved().concat([{ en: word, so: local ? local.so : '', exEn: local && local.exEn || '', exSo: local && local.exSo || '', definition: definition || null }]);
      }
      save(); updateSaveButtons();
      var status = document.getElementById('dictionarySaveStatus');
      if (status) status.textContent = isSaved(word) ? 'Waa la kaydiyay / Saved: ' + word : 'Waa laga saaray / Removed: ' + word;
      if (tab === 'saved') paintResults();
    }); });
    app.querySelectorAll('[data-audio-url]').forEach(function (b) { b.addEventListener('click', function () {
      try {
        if (window.__dictionaryAudio) window.__dictionaryAudio.pause();
        stopRecorded();
        var audio = new Audio(b.dataset.audioUrl); window.__dictionaryAudio = audio;
        audio.play().catch(function () { speak(b.dataset.audioWord, false, b); });
      } catch (_) { speak(b.dataset.audioWord, false, b); }
    }); });
    var more = document.getElementById('dictionaryMore'); if (more) more.onclick = function () { limit += 12; paintResults(); };
    var retry = document.getElementById('dictionaryRetry'); if (retry) retry.onclick = function () { searchLive(liveWord); };
    app.querySelectorAll('[data-suggest]').forEach(function (b) { b.onclick = function () { query = b.dataset.suggest; document.getElementById('dictionaryQuery').value = query; searchLive(query); }; });
  }
  function paintResults() {
    var box = document.getElementById('dictionaryResults'); if (!box) return;
    if (tab === 'saved') {
      var list = saved().filter(function (e) { return !norm(query) || norm(e.en).includes(norm(query)) || norm(e.so).includes(norm(query)); });
      box.innerHTML = '<h2 class="dictionary-section-title">Erayadaada / Your words <span>' + list.length + '</span></h2>' + (list.length ? list.slice(0, limit).map(entryHTML).join('') + (list.length > limit ? '<button type="button" class="btn secondary" id="dictionaryMore">Muuji kuwo kale / Show more</button>' : '') : '<div class="dictionary-empty">' + icon('bookmark') + '<h3>Erayada halkan ku kaydi / Keep your words here</h3><p>Taabo calaamadda kaydinta eray kasta. / Tap the bookmark beside a word to save it.</p></div>');
    } else if (!norm(query)) {
      box.innerHTML = '<div class="dictionary-empty">' + icon('book') + '<h2>Eray cusub, maalin kasta.</h2><p>A new word, every day.</p><p class="muted">Raadi Ingiriisi ama Soomaali. / Search English or Somali course words.</p><div class="dictionary-suggestions">' + ['hello', 'family', 'work', 'water'].map(function (w) { return '<button type="button" class="chipbtn" data-suggest="' + w + '">' + w + '</button>'; }).join('') + '</div></div>';
    } else {
      var hits = localHits();
      box.innerHTML = '<div id="dictionaryLive" aria-live="polite" aria-busy="' + loading + '">' + (liveQuery === norm(query) ? liveHTML() : '') + '</div>'
        + '<h2 class="dictionary-section-title">Casharrada / Course matches <span>' + hits.length + '</span></h2>'
        + (hits.length ? hits.slice(0, limit).map(entryHTML).join('') : '<p class="dictionary-notice">Eraygan kuma jiro casharrada. Taabo Raadi si aad u hesho qeexid Ingiriisi ah. / No course matches. Tap Search for a live English definition.</p>')
        + (hits.length > limit ? '<button type="button" class="btn secondary" id="dictionaryMore">Muuji kuwo kale / Show more</button>' : '');
    }
    wireResults();
  }
  async function searchLive(word) {
    var token = ++sequence;
    if (request) request.abort();
    var q = String(word || query).trim(); if (!q) return;
    // Resolve exact Somali course matches to their English headword. Never guess a translation.
    var match = dictUnified().find(function (e) { return norm(e.so) === norm(q); });
    liveWord = match ? match.en : q;
    liveQuery = norm(query); liveResult = null; loading = true; tab = 'results';
    app.querySelectorAll('[data-dictionary-tab]').forEach(function (b) { var active = b.dataset.dictionaryTab === tab; b.classList.toggle('selected', active); b.setAttribute('aria-pressed', String(active)); });
    request = new AbortController();
    paintResults();
    var results = await Promise.all([
      AcademyDictionary.lookup(liveWord, { signal: request.signal }),
      AcademyDictionary.lookupSomali(q, { signal: request.signal })
    ]);
    var successful = results.filter(function (r) { return r.status === 'success'; });
    var result = successful.length ? { status: 'success', entries: successful.flatMap(function (r) { return r.entries; }), cached: successful.some(function (r) { return r.cached; }) } : { status: results.some(function (r) { return r.status === 'unavailable'; }) ? 'unavailable' : 'not-found', entries: [] };
    if (token !== sequence) return;
    loading = false; liveResult = result;
    if (view === 'dict' && tab === 'results') paintResults();
  }
  renderDict = function () {
    app.classList.add('academy-dictionary');
    app.innerHTML = '<header class="dictionary-heading"><h1>Qaamuus<span>Dictionary</span></h1><p>Erayga raadi. Macnaha faham. / Find a word. Understand it.</p></header>'
      + '<form id="dictionaryForm" class="dictionary-search" role="search"><label class="sr-only" for="dictionaryQuery">Raadi eray / Search English or Somali course words</label><div class="dictionary-input-wrap">' + icon('search') + '<input id="dictionaryQuery" type="search" maxlength="100" autocomplete="off" placeholder="Ingiriisi ama Soomaali / English or Somali" value="' + esc(query) + '"></div><button class="btn" type="submit">Raadi<span lang="en">Search</span></button></form>'
      + '<p class="dictionary-help">Qaamuus toos ah: Soomaali iyo Ingiriisi. / Live Somali and English entries, with meanings in English. Somali translations also available for course words.</p>'
      + '<div class="dictionary-tabs" aria-label="Dictionary views"><button type="button" data-dictionary-tab="results" class="' + (tab === 'results' ? 'selected' : '') + '" aria-pressed="' + (tab === 'results') + '">Natiijo / Results</button><button type="button" data-dictionary-tab="saved" class="' + (tab === 'saved' ? 'selected' : '') + '" aria-pressed="' + (tab === 'saved') + '">' + icon('bookmark') + 'Kaydsan / Saved</button></div>'
      + '<p id="dictionarySaveStatus" class="sr-only" role="status"></p><div id="dictionaryResults"></div>';
    document.getElementById('dictionaryForm').onsubmit = function (event) { event.preventDefault(); query = document.getElementById('dictionaryQuery').value.trim(); limit = 12; searchLive(query); };
    document.getElementById('dictionaryQuery').oninput = function (event) {
      query = event.target.value; limit = 12;
      // Typing stays local; live lookup is an explicit Search action.
      sequence++; if (request) request.abort(); loading = false; liveResult = null; paintResults();
    };
    app.querySelectorAll('[data-dictionary-tab]').forEach(function (b) { b.onclick = function () { tab = b.dataset.dictionaryTab; limit = 12; renderDict(); }; });
    paintResults();
  };
  // Use the learner's actual next lesson, placement and unlock rules.
  renderHome = function () {
    var next = 1;
    while (next < LESSONS.length && S.completed['L' + next]) next++;
    var lesson = LESSONS[next - 1] || LESSONS[0];
    var count = todayLessonsCount(), goal = S.profile.goal || 2;
    var pct = Math.min(100, Math.round(count / goal * 100));
    var first = browseUnit === null ? Math.floor((next - 1) / 10) * 10 : browseUnit * 10;
    var unit = LESSONS.slice(first, first + 10);
    app.innerHTML = '<header class="academy-welcome"><div><h1>Maalin wanaagsan' + (S.profile.name ? ', ' + esc(S.profile.name) : '') + '</h1><p>Good day. Let’s keep learning.</p></div><button type="button" class="iconbtn" id="academyGreeting" aria-label="Dhegeyso / Listen to greeting">' + icon('speaker') + '</button></header>'
      + '<section class="academy-continue"><p>Cashar ' + lesson.n + ' / Lesson ' + lesson.n + '</p><h2>' + esc(lesson.titleSo) + '</h2><p lang="en">' + esc(lesson.titleEn) + '</p><button type="button" class="btn" id="academyContinue">Sii wad / Continue ' + icon('arrow') + '</button></section>'
      + '<section class="academy-daily" aria-label="Daily progress"><div><h2>Hadafka maanta <span>Daily goal</span></h2><strong>' + count + ' / ' + goal + '</strong></div><div class="progress" role="progressbar" aria-label="Daily lesson goal" aria-valuemin="0" aria-valuemax="' + goal + '" aria-valuenow="' + Math.min(goal, count) + '"><i style="width:' + pct + '%"></i></div><p>' + S.streak + ' maalmood xiriir / day streak <span>' + S.xp + ' XP</span></p></section>'
      + '<div class="academy-section-heading"><h2>Casharrada <span>Lessons ' + (first + 1) + '–' + (first + unit.length) + '</span></h2><button class="text-button" type="button" id="academyAllLessons">Dhammaan / All ' + icon('arrow') + '</button></div>'
      + (browseAll ? '<label for="academyUnit" class="sr-only">Dooro casharro / Choose lessons</label><select id="academyUnit">' + LESSONS.filter(function (_, i) { return i % 10 === 0; }).map(function (l, i) { return '<option value="' + i + '"' + (i * 10 === first ? ' selected' : '') + '>Casharrada / Lessons ' + l.n + '–' + Math.min(l.n + 9, LESSONS.length) + ' · ' + esc(l.titleEn) + '</option>'; }).join('') + '</select>' : '')
      + '<div class="academy-lesson-list">' + unit.map(function (l) {
        var done = !!S.completed[l.id], unlocked = isUnlocked(l.n), current = l.n === next;
        return '<button type="button" class="academy-lesson' + (current ? ' current' : '') + '" data-academy-lesson="' + l.n + '"' + (!unlocked ? ' disabled' : '') + '><span class="academy-lesson-number' + (done ? ' complete' : '') + '">' + (done ? icon('check') : l.n) + '</span><span class="academy-lesson-title"><strong>' + esc(l.titleSo) + '</strong><span lang="en">' + esc(l.titleEn) + '</span></span>' + icon(done ? 'check' : unlocked ? 'arrow' : 'lock') + '</button>';
      }).join('') + '</div><button type="button" class="academy-dictionary-shortcut" id="academyDictionary">' + icon('book') + '<span><strong>Eray ma raadineysaa?</strong><span>Looking for a word? Open the dictionary.</span></span>' + icon('arrow') + '</button>';
    document.getElementById('academyContinue').onclick = function () { openLesson(lesson.n); };
    document.getElementById('academyGreeting').onclick = function () { speakGreeting(this); };
    document.getElementById('academyAllLessons').onclick = function () { browseAll = !browseAll; render(); if (browseAll) document.getElementById('academyUnit').focus(); };
    var unitSelect = document.getElementById('academyUnit');
    if (unitSelect) unitSelect.onchange = function () { browseUnit = Number(this.value); render(); document.getElementById('academyUnit').focus(); };
    document.getElementById('academyDictionary').onclick = function () { setNav('dict'); render(); };
    app.querySelectorAll('[data-academy-lesson]').forEach(function (b) { b.onclick = function () { openLesson(+b.dataset.academyLesson); }; });
  };
  // Leave no dictionary-only styling or playback attached to other screens.
  var previousRender = render;
  render = function () {
    app.classList.remove('academy-dictionary');
    if (view !== 'dict') { sequence++; if (request) request.abort(); loading = false; }
    if (window.__dictionaryAudio) window.__dictionaryAudio.pause();
    previousRender();
    document.querySelectorAll('#mainNav [data-view]').forEach(function (b) {
      var active = b.dataset.view === view;
      if (active) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
  };
  if (S && S.profile) render();
})();
