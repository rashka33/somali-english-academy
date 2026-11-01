/* Minimal shell. Keep the existing curriculum, profiles and provider client authoritative. */
(function () {
  'use strict';
  var legacyRender = render, legacyProfile = renderProfile, legacyLesson = renderLesson, legacyWatch = renderWatch;
  var query = '', live = null, loading = false, request = null, sequence = 0, unit = null;
  var profilePage = '', profileId = null;
  var paths = {
    home: '<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7"/>',
    book: '<path d="M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1zm0 0v15"/>',
    user: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    speaker: '<path d="M11 4 5 9H2v6h3l6 5zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    progress: '<path d="M4 21V11m6 10V4m6 17V8m5 13H2"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/>',
    language: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
    moon: '<path d="M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10z"/>',
    settings: '<path d="m9 3 6 0 1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z"/><circle cx="12" cy="12" r="3"/>'
  };
  function icon(name) { return '<svg class="simple-icon" viewBox="0 0 24 24" aria-hidden="true">' + paths[name] + '</svg>'; }
  function english() { return S && S.profile && S.profile.ui === 'en'; }
  function t(so, en) { return english() ? en : so; }
  function title(lesson) { return english() ? lesson.titleEn : lesson.titleSo; }
  function saved() { return S && Array.isArray(S.dictionarySaved) ? S.dictionarySaved : []; }
  function isSaved(word) { return saved().some(function (e) { return norm(e.en) === norm(word); }); }
  function saveButton(word) {
    var selected = isSaved(word);
    return '<button type="button" class="simple-icon-button dict-save' + (selected ? ' selected' : '') + '" data-save-word="' + esc(word) + '" aria-pressed="' + selected + '" aria-label="' + esc(t(selected ? 'Ka saar kaydka' : 'Kaydi erayga', selected ? 'Unsave word' : 'Save word')) + '">' + icon('bookmark') + '</button>';
  }
  function listenButton(word) { return '<button type="button" class="simple-icon-button" data-speak="' + esc(word) + '" aria-label="' + t('Dhegeyso', 'Listen') + '">' + icon('speaker') + '</button>'; }
  function go(destination, panel) {
    if (destination === 'profile') profilePage = panel || '';
    setNav(destination); render();
    var heading = app.querySelector('h1'); if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  }
  function backButton(label) { return '<button type="button" class="simple-back" id="simpleBack">' + icon('back') + esc(label || t('Boggaaga', 'Profile')) + '</button>'; }
  function row(id, label, glyph, value) {
    return '<button type="button" class="simple-row" id="' + id + '">' + (glyph ? icon(glyph) : '') + '<span>' + esc(label) + '</span>' + (value ? '<small>' + esc(value) + '</small>' : '') + icon('chevron') + '</button>';
  }
  function shell() {
    document.documentElement.dataset.uiLanguage = english() ? 'en' : 'so';
    var header = document.querySelector('.topbar');
    if (!document.getElementById('simpleLanguage')) {
      header.innerHTML = '<div class="brand">Somali Academy</div><span id="xpPill" hidden></span><button type="button" class="simple-language" id="simpleLanguage"></button>';
      document.getElementById('simpleLanguage').onclick = function () { if (!S) return; S.profile.ui = english() ? 'so' : 'en'; save(); if (view === 'lesson') renderLesson(); else render(); };
    }
    var language = document.getElementById('simpleLanguage');
    language.textContent = english() ? 'EN' : 'SO'; language.setAttribute('aria-label', t('Switch to English', 'U beddel Soomaali'));
    var parent = view === 'dict' ? 'dict' : ['home', 'simpleLessons', 'path', 'lesson'].includes(view) ? 'home' : 'profile';
    var nav = document.getElementById('mainNav'); nav.setAttribute('aria-label', t('Bogagga waaweyn', 'Main navigation'));
    nav.innerHTML = [['home', t('Hoyga', 'Home'), 'home'], ['dict', t('Qaamuus', 'Dictionary'), 'book'], ['profile', t('Boggaaga', 'Profile'), 'user']].map(function (item) {
      return '<button type="button" data-view="' + item[0] + '"' + (parent === item[0] ? ' class="active" aria-current="page"' : '') + '>' + icon(item[2]) + '<span>' + item[1] + '</span></button>';
    }).join('');
    document.body.classList.toggle('simple-home', view === 'home');
  }
  function nextLesson() { var n = 1; while (n < LESSONS.length && S.completed['L' + n]) n++; return LESSONS[n - 1]; }
  renderHome = function () {
    var lesson = nextLesson(), count = todayLessonsCount(), goal = Math.max(1, Number(S.profile.goal) || 2);
    var complete = Object.keys(S.completed).length >= LESSONS.length;
    app.innerHTML = '<div class="simple-home-content"><h1>' + t('Diyaar ma u tahay casharka xiga?', 'Ready for your next lesson?') + '</h1><p class="simple-intro">' + t('Tababar yar, maalin kasta.', 'A little practice, every day.') + '</p>'
      + '<section class="simple-next"><p class="simple-lesson-number">' + t('Casharka ', 'Lesson ') + lesson.n + '</p><h2>' + esc(title(lesson)) + '</h2><button type="button" class="simple-primary" id="academyContinue">' + (complete ? t('Ku celceli cashirka', 'Review lesson') : t('Sii wad barashada', 'Continue learning')) + icon('arrow') + '</button>'
      + '<div class="simple-progress" role="progressbar" aria-label="' + t('Hadafka maanta', 'Daily goal') + '" aria-valuemin="0" aria-valuemax="' + goal + '" aria-valuenow="' + Math.min(count, goal) + '"><i style="width:' + Math.min(100, count / goal * 100) + '%"></i></div><p class="simple-progress-caption">' + (english() ? count + ' of ' + goal + ' lessons today' : count + ' ka mid ah ' + goal + ' cashar maanta') + '</p></section>'
      + row('academyAllLessons', t('Eeg casharrada', 'Browse lessons')) + '</div><p class="simple-device-note">' + t('Horumarkaagu wuxuu ku kaydsan yahay aaladdan.', 'Progress stays on this device.') + '</p>';
    document.getElementById('academyContinue').onclick = function () { openLesson(lesson.n); };
    document.getElementById('academyAllLessons').onclick = function () { unit = Math.floor((lesson.n - 1) / 10); go('simpleLessons'); };
  };
  function renderLessons() {
    var lesson = nextLesson(), first = (unit === null ? Math.floor((lesson.n - 1) / 10) : unit) * 10;
    app.innerHTML = backButton(t('Hoyga', 'Home')) + '<h1>' + t('Casharrada', 'Lessons') + '</h1><label for="academyUnit" class="simple-label">' + t('Dooro qayb', 'Choose a unit') + '</label><select id="academyUnit">' + LESSONS.filter(function (_, i) { return i % 10 === 0; }).map(function (l, i) {
      return '<option value="' + i + '"' + (i * 10 === first ? ' selected' : '') + '>' + (i + 1) + '. ' + esc(title(l)) + ' (' + l.n + '–' + Math.min(l.n + 9, LESSONS.length) + ')</option>';
    }).join('') + '</select><div class="simple-lesson-list">' + LESSONS.slice(first, first + 10).map(function (l) {
      var done = !!S.completed[l.id], unlocked = isUnlocked(l.n);
      return '<button type="button" class="simple-lesson" data-academy-lesson="' + l.n + '"' + (unlocked ? '' : ' disabled') + '><span class="simple-lesson-index">' + (done ? icon('check') : l.n) + '</span><span>' + esc(title(l)) + '</span>' + icon(unlocked ? 'chevron' : 'lock') + '</button>';
    }).join('') + '</div>';
    document.getElementById('simpleBack').onclick = function () { go('home'); };
    document.getElementById('academyUnit').onchange = function () { unit = Number(this.value); render(); document.getElementById('academyUnit').focus(); };
    app.querySelectorAll('[data-academy-lesson]').forEach(function (b) { b.onclick = function () { openLesson(+b.dataset.academyLesson); }; });
  }
  function localHits() {
    var q = norm(query); if (!q) return [];
    function rank(e) { return norm(e.en) === q || norm(e.so) === q ? 0 : norm(e.en).startsWith(q) || norm(e.so).startsWith(q) ? 1 : 2; }
    return dictUnified().filter(function (e) { return norm(e.en).includes(q) || norm(e.so).includes(q); }).sort(function (a, b) { return rank(a) - rank(b); });
  }
  function attribution(e) {
    var so = e.language === 'so', license = e.license || {};
    var url = (Array.isArray(e.sourceUrls) ? e.sourceUrls : []).map(AcademyDictionary.safeURL).find(Boolean) || (so ? 'https://en.wiktionary.org/' : 'https://dictionaryapi.dev/');
    return '<footer class="dictionary-attribution"><a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + (so ? 'Wiktionary' : 'Free Dictionary API') + '</a>' + (license.name ? ' · ' + (AcademyDictionary.safeURL(license.url) ? '<a href="' + esc(AcademyDictionary.safeURL(license.url)) + '" target="_blank" rel="noopener noreferrer">' + esc(license.name) + '</a>' : esc(license.name)) : '') + '</footer>';
  }
  function definitionHTML(e) {
    var so = e.language === 'so', local = !so && dictUnified().find(function (x) { return norm(x.en) === norm(e.word); });
    var phonetics = Array.isArray(e.phonetics) ? e.phonetics : [];
    var audio = phonetics.map(function (p) { return AcademyDictionary.safeURL(p.audio); }).find(Boolean);
    var phonetic = e.phonetic || (phonetics.find(function (p) { return p.text; }) || {}).text || '';
    var definitions = [];
    (e.meanings || []).filter(function (m) { return m && Array.isArray(m.definitions); }).forEach(function (m) { m.definitions.forEach(function (d) { if (d && typeof d.definition === 'string') definitions.push({ text: d.definition, example: d.example, part: m.partOfSpeech }); }); });
    var first = definitions[0]; if (!first) return '';
    return '<article class="live-entry"><div class="dictionary-entry-head"><div><h2 lang="' + (so ? 'so' : 'en') + '">' + esc(e.word) + '</h2>' + (phonetic ? '<p class="phonetic">' + esc(phonetic) + '</p>' : '') + '</div><div class="dictionary-actions">' + saveButton(e.word) + (so ? '' : audio ? '<button type="button" class="simple-icon-button" data-audio-url="' + esc(audio) + '" data-audio-word="' + esc(e.word) + '" aria-label="' + t('Dhegeyso', 'Listen') + '">' + icon('speaker') + '</button>' : listenButton(e.word)) + '</div></div>'
      + (local ? '<p class="dictionary-translation" lang="so">' + esc(local.so) + '</p>' : '') + (so ? '<p class="dictionary-language">Soomaali → English</p>' : '')
      + '<p class="dictionary-part">' + esc(first.part || '') + '</p><p class="dictionary-definition" lang="en">' + esc(first.text) + '</p>' + (first.example ? '<blockquote lang="en">' + esc(first.example) + '</blockquote>' : '')
      + (definitions.length > 1 ? '<details class="simple-details"><summary>' + t('Macnayaal kale', 'More meanings') + '</summary><ol>' + definitions.slice(1, 12).map(function (d) { return '<li lang="en">' + esc(d.text) + (d.example ? '<p class="muted">' + esc(d.example) + '</p>' : '') + '</li>'; }).join('') + '</ol></details>' : '') + attribution(e) + '</article>';
  }
  function courseHTML(entries) {
    return '<div class="dictionary-course-list">' + entries.slice(0, 8).map(function (e) {
      return '<div class="dictionary-course-row"><button type="button" class="dictionary-course-word" data-define="' + esc(e.en) + '"><strong lang="en">' + esc(e.en) + '</strong><span lang="so">' + esc(e.so) + '</span></button>' + listenButton(e.en) + saveButton(e.en) + '</div>';
    }).join('') + '</div>';
  }
  function paintDictionary() {
    var box = document.getElementById('dictionaryResults'); if (!box) return;
    var hits = localHits();
    if (!norm(query)) box.innerHTML = '';
    else if (loading) box.innerHTML = '<p class="dictionary-status" role="status">' + t('Raadin…', 'Looking up…') + '</p>';
    else if (live && live.status === 'success') {
      var primary = live.entries.find(function (e) { return e.language === 'so' && norm(e.word) === norm(query); }) || live.entries[0];
      box.innerHTML = (live.cached ? '<p class="dictionary-status" role="status">' + t('Qeexid kaydsan', 'Saved definition · offline') + '</p>' : '') + definitionHTML(primary)
        + (live.entries.length > 1 ? '<details class="simple-details"><summary>' + t('Natiijooyin kale', 'Other entries') + '</summary>' + live.entries.filter(function (e) { return e !== primary; }).slice(0, 3).map(definitionHTML).join('') + '</details>' : '')
        + (hits.length ? '<details class="simple-details"><summary>' + t('Erayada casharrada', 'Course matches') + '</summary>' + courseHTML(hits) + '</details>' : '');
    } else {
      var message = live ? live.status === 'not-found' ? t('Erayga lama helin. Hubi higgaadda.', 'Word not found. Check the spelling.') : t('Qaamuuska lama xiriiri karo. Isku day mar kale.', 'Unable to connect. Please try again.') : hits.length ? '' : t('Taabo Raadi si aad u hesho macnaha.', 'Tap Search to find the meaning.');
      box.innerHTML = (message ? '<p class="dictionary-status" role="status">' + message + '</p>' : '') + (live && live.status === 'unavailable' ? '<button type="button" class="simple-text-button" id="dictionaryRetry">' + t('Mar kale', 'Try again') + '</button>' : '') + courseHTML(hits);
    }
    wireWords(box); var retry = document.getElementById('dictionaryRetry'); if (retry) retry.onclick = searchLive;
  }
  function updateSaveButtons() {
    app.querySelectorAll('[data-save-word]').forEach(function (b) { var selected = isSaved(b.dataset.saveWord); b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', String(selected)); b.setAttribute('aria-label', t(selected ? 'Ka saar kaydka' : 'Kaydi erayga', selected ? 'Unsave word' : 'Save word')); });
  }
  function wireWords(root) {
    root.querySelectorAll('[data-define]').forEach(function (b) { b.onclick = function () { query = b.dataset.define; live = null; go('dict'); searchLive(); }; });
    root.querySelectorAll('[data-speak]').forEach(function (b) { b.onclick = function () { speak(b.dataset.speak, false, b); }; });
    root.querySelectorAll('[data-save-word]').forEach(function (b) { b.onclick = function () {
      var word = b.dataset.saveWord;
      if (isSaved(word)) S.dictionarySaved = saved().filter(function (e) { return norm(e.en) !== norm(word); });
      else { var local = dictUnified().find(function (e) { return norm(e.en) === norm(word); }); var definition = live && live.entries && live.entries.find(function (e) { return norm(e.word) === norm(word); }); S.dictionarySaved = saved().concat([{ en: word, so: local ? local.so : '', definition: definition || null }]); }
      save(); updateSaveButtons(); var status = document.getElementById('dictionarySaveStatus'); if (status) status.textContent = t('Kaydka waa la beddelay.', 'Saved words updated.'); if (view === 'profile' && profilePage === 'saved') renderProfile();
    }; });
    root.querySelectorAll('[data-audio-url]').forEach(function (b) { b.onclick = function () {
      try { if (window.__dictionaryAudio) window.__dictionaryAudio.pause(); stopRecorded(); var a = new Audio(b.dataset.audioUrl); window.__dictionaryAudio = a; a.play().catch(function () { speak(b.dataset.audioWord, false, b); }); }
      catch (_) { speak(b.dataset.audioWord, false, b); }
    }; });
  }
  async function searchLive() {
    var token = ++sequence; if (request) request.abort();
    var word = query.trim(); if (!word) { loading = false; live = null; paintDictionary(); return; }
    var match = dictUnified().find(function (e) { return norm(e.so) === norm(word); });
    loading = true; live = null; request = new AbortController(); paintDictionary();
    var results = await Promise.all([AcademyDictionary.lookup(match ? match.en : word, { signal: request.signal }), AcademyDictionary.lookupSomali(word, { signal: request.signal })]);
    if (token !== sequence) return;
    var success = results.filter(function (r) { return r.status === 'success'; });
    live = success.length ? { status: 'success', entries: success.flatMap(function (r) { return r.entries; }), cached: success.some(function (r) { return r.cached; }) } : { status: results.some(function (r) { return r.status === 'unavailable'; }) ? 'unavailable' : 'not-found', entries: [] };
    loading = false; if (view === 'dict') paintDictionary();
  }
  renderDict = function () {
    app.innerHTML = '<h1>' + t('Qaamuus', 'Dictionary') + '</h1><form id="dictionaryForm" class="dictionary-search" role="search"><label for="dictionaryQuery" class="sr-only">' + t('Eray Ingiriisi ama Soomaali', 'English or Somali word') + '</label>' + icon('search') + '<input type="search" id="dictionaryQuery" maxlength="100" autocomplete="off" placeholder="' + t('Ingiriisi ama Soomaali', 'English or Somali') + '" value="' + esc(query) + '"><button type="submit">' + t('Raadi', 'Search') + '</button></form><p id="dictionarySaveStatus" class="sr-only" role="status"></p><div id="dictionaryResults" aria-live="polite"></div>';
    document.getElementById('dictionaryForm').onsubmit = function (event) { event.preventDefault(); query = document.getElementById('dictionaryQuery').value.trim(); searchLive(); };
    document.getElementById('dictionaryQuery').oninput = function (event) { query = event.target.value; sequence++; if (request) request.abort(); loading = false; live = null; paintDictionary(); }; paintDictionary();
  };
  function setPreference(key, value) { S.profile[key] = value; save(); applyPrefs(); render(); }
  renderOnboarding = function () {
    app.innerHTML = '<div class="simple-welcome"><h1>' + t('Baro Ingiriisi, tallaabo tallaabo.', 'Learn English, one step at a time.') + '</h1><p class="simple-intro">' + t('Casharro fudud oo leh sharaxaad Soomaali ah.', 'Simple lessons with Somali guidance.') + '</p><form id="simpleStartForm"><label class="simple-label" for="simpleName">' + t('Magacaaga (ikhtiyaari)', 'Your name (optional)') + '</label><input type="text" id="simpleName" maxlength="50" autocomplete="given-name" value="' + esc(S.profile.name || '') + '"><button type="submit" class="simple-primary" id="simpleStart">' + t('Bilow barashada', 'Start learning') + icon('arrow') + '</button></form><p class="simple-device-note">' + t('Akoon looma baahna. Horumarku wuxuu ku kaydsan yahay aaladdan.', 'No account needed. Progress stays on this device.') + '</p></div>';
    document.getElementById('simpleStartForm').onsubmit = function (event) {
      event.preventDefault(); S.profile.name = document.getElementById('simpleName').value.trim(); S.profile.onboarded = true;
      var destination = pendingView || 'home'; pendingView = null;
      document.getElementById('simpleStart').disabled = true;
      save().then(function () { go(destination); });
    };
  };
  renderProfile = function () {
    var name = S.profile.name || t('Qofka barta', 'Learner');
    if (profilePage === 'advanced') { legacyProfile(); app.insertAdjacentHTML('afterbegin', backButton()); document.getElementById('simpleBack').onclick = function () { fProfScreen = null; profilePage = ''; render(); }; return; }
    if (profilePage) {
      app.innerHTML = backButton(); document.getElementById('simpleBack').onclick = function () { profilePage = ''; render(); };
      if (profilePage === 'saved') {
        app.insertAdjacentHTML('beforeend', '<h1>' + t('Erayada kaydsan', 'Saved words') + '</h1><p id="dictionarySaveStatus" class="sr-only" role="status"></p>' + (saved().length ? '<div class="saved-word-list">' + saved().map(function (e) {
          return '<article class="saved-word"><div class="dictionary-entry-head"><button type="button" class="dictionary-course-word" data-define="' + esc(e.en) + '"><strong>' + esc(e.en) + '</strong><span>' + esc(e.so || '') + '</span></button>' + saveButton(e.en) + '</div>' + (e.definition ? '<details class="simple-details"><summary>' + t('Macnaha', 'Definition') + '</summary>' + definitionHTML(e.definition) + '</details>' : '') + '</article>';
        }).join('') + '</div>' : '<p class="simple-intro">' + t('Taabo calaamadda kaydinta ee erayga qaamuuska.', 'Tap the bookmark beside a dictionary word to keep it here.') + '</p>')); wireWords(app);
      } else if (profilePage === 'language') {
        app.insertAdjacentHTML('beforeend', '<h1>' + t('Luqadda', 'Language') + '</h1><div class="simple-options">' + [['so', 'Soomaali'], ['en', 'English']].map(function (o) { return '<button type="button" data-language="' + o[0] + '" aria-pressed="' + (S.profile.ui === o[0]) + '">' + o[1] + (S.profile.ui === o[0] ? icon('check') : '') + '</button>'; }).join('') + '</div>');
        app.querySelectorAll('[data-language]').forEach(function (b) { b.onclick = function () { setPreference('ui', b.dataset.language); }; });
      } else if (profilePage === 'appearance') {
        app.insertAdjacentHTML('beforeend', '<h1>' + t('Muuqaalka', 'Appearance') + '</h1><div class="simple-options">' + [['system', t('Aaladda raac', 'Use device setting')], ['light', t('Iftiin', 'Light')], ['dark', t('Mugdi', 'Dark')]].map(function (o) { return '<button type="button" data-theme-option="' + o[0] + '" aria-pressed="' + (S.profile.theme === o[0]) + '">' + o[1] + (S.profile.theme === o[0] ? icon('check') : '') + '</button>'; }).join('') + '</div><label class="simple-toggle"><span>' + t('Qoraal weyn', 'Larger text') + '</span><input type="checkbox" id="simpleLargeText"' + (S.profile.largeText ? ' checked' : '') + '></label>');
        app.querySelectorAll('[data-theme-option]').forEach(function (b) { b.onclick = function () { setPreference('theme', b.dataset.themeOption); }; }); document.getElementById('simpleLargeText').onchange = function () { setPreference('largeText', this.checked); };
      } else if (profilePage === 'progress') {
        var done = Object.keys(S.completed).length;
        app.insertAdjacentHTML('beforeend', '<h1>' + t('Horumarkaaga', 'Your progress') + '</h1><div class="simple-progress-stat"><strong>' + done + '</strong><span>' + t('cashar oo dhammaaday', 'lessons completed') + '</span></div><div class="simple-progress"><i style="width:' + Math.min(100, done / LESSONS.length * 100) + '%"></i></div><p class="simple-intro">' + done + ' / ' + LESSONS.length + '</p>' + row('simpleDetailedProgress', t('Faahfaahin', 'View details'), 'progress')); document.getElementById('simpleDetailedProgress').onclick = lOpenProgressSheet;
      } else if (profilePage === 'tools') {
        app.insertAdjacentHTML('beforeend', '<h1>' + t('Tababar iyo muuqaal', 'Practice & videos') + '</h1>' + row('simpleReview', t('Ku celceli erayada', 'Review your words'), 'book') + row('simplePractice', t('Hadal iyo qoraal', 'Speaking & writing'), 'play') + row('simpleVideos', t('Casharro muuqaal ah', 'Video lessons'), 'play'));
        document.getElementById('simpleReview').onclick = function () { go('review'); }; document.getElementById('simplePractice').onclick = function () { go('practice'); }; document.getElementById('simpleVideos').onclick = function () { go('watch'); };
      }
      return;
    }
    app.innerHTML = '<h1>' + t('Boggaaga', 'Profile') + '</h1><div class="simple-person"><span class="simple-avatar">' + esc(name.charAt(0).toUpperCase()) + '</span><div><h2>' + esc(name) + '</h2><p>' + t('Wax ku baro xawaarahaaga.', 'Your learning, your pace.') + '</p></div></div><div class="simple-profile-rows">'
      + row('simpleProgress', t('Horumarkaaga', 'Your progress'), 'progress') + row('simpleSaved', t('Erayada kaydsan', 'Saved words'), 'bookmark') + row('simpleTools', t('Tababar iyo muuqaal', 'Practice & videos'), 'play') + row('simpleLanguageRow', t('Luqadda', 'Language'), 'language', english() ? 'English' : 'Soomaali')
      + row('simpleAppearance', t('Muuqaalka', 'Appearance'), 'moon', { light: t('Iftiin', 'Light'), dark: t('Mugdi', 'Dark'), system: t('Aalad', 'Device') }[S.profile.theme || 'system']) + row('simpleMore', t('Dejimo kale', 'More settings'), 'settings') + '</div><p class="simple-device-note">' + t('Horumarku wuxuu ku kaydsan yahay aaladdan.', 'Progress is stored on this device.') + '</p>';
    [['simpleProgress', 'progress'], ['simpleSaved', 'saved'], ['simpleTools', 'tools'], ['simpleLanguageRow', 'language'], ['simpleAppearance', 'appearance'], ['simpleMore', 'advanced']].forEach(function (r) { document.getElementById(r[0]).onclick = function () { if (r[1] === 'advanced') fProfScreen = null; profilePage = r[1]; render(); }; });
  };
  function legacyBack() {
    if (!document.getElementById('simpleLegacyBack')) { app.insertAdjacentHTML('afterbegin', '<button type="button" class="simple-back" id="simpleLegacyBack">' + icon('back') + t('Tababar iyo muuqaal', 'Practice & videos') + '</button>'); document.getElementById('simpleLegacyBack').onclick = function () { go('profile', 'tools'); }; }
  }
  renderWatch = function () { legacyWatch(); legacyBack(); };
  renderLesson = function () {
    legacyLesson(); shell();
    var back = document.getElementById('backPath'); if (back) back.textContent = t('Ka bax casharka', 'Leave lesson');
    var bottomBack = document.getElementById('lesBack'); if (bottomBack) bottomBack.textContent = t('Dib', 'Back');
    var bottomNext = document.getElementById('lesNext'); if (bottomNext) bottomNext.textContent = step === 10 ? t('Dhammee', 'Finish') : t('Sii wad', 'Continue');
    var related = typeof EPISODES !== 'undefined' ? EPISODES.filter(function (e) { return e.lesson && Math.floor((e.lesson - 1) / 10) === Math.floor((cur.n - 1) / 10); }) : [];
    if (step < 8 && !guestMode && !document.getElementById('simpleResources')) {
      app.insertAdjacentHTML('beforeend', '<details id="simpleResources" class="simple-details"><summary>' + t('Tababar dheeraad ah', 'Extra practice') + '</summary><button type="button" class="simple-text-button" id="simpleSpeakPractice">' + t('Ku celceli hadalka', 'Practise speaking') + '</button>' + related.map(function (e) { return '<button type="button" class="simple-text-button" data-related-video="' + esc(e.yt) + '">' + esc(english() ? e.titleEn : e.titleSo) + '</button>'; }).join('') + '</details>');
      document.getElementById('simpleSpeakPractice').onclick = function () { step = 4; renderLesson(); window.scrollTo(0, 0); };
      app.querySelectorAll('[data-related-video]').forEach(function (b) { b.onclick = function () { watchEp = b.dataset.relatedVideo; go('watch'); }; });
    }
  };
  render = function () {
    if (window.__dictionaryAudio) window.__dictionaryAudio.pause();
    if (view !== 'dict') { sequence++; if (request) request.abort(); loading = false; }
    if (ROOT && profileId !== ROOT.activeId) { profileId = ROOT.activeId; profilePage = ''; unit = null; }
    if (view === 'path') view = 'simpleLessons';
    var allowed = S && S.profile && S.profile.onboarded && !guestMode && !pickerPending && !pinGate;
    if (allowed && ['home', 'dict', 'profile', 'simpleLessons'].includes(view)) {
      applyPrefs(); document.body.classList.remove('inLesson', 'view-home', 'view-profile', 'view-practice');
      var lessonNav = document.getElementById('lesNav'); if (lessonNav) lessonNav.remove(); if (typeof hCloseSheet === 'function') hCloseSheet(); app.classList.remove('wide');
      if (view === 'home') renderHome(); else if (view === 'dict') renderDict(); else if (view === 'simpleLessons') renderLessons(); else renderProfile();
    } else { legacyRender(); if (allowed && ['watch', 'review', 'practice', 'acad'].includes(view)) legacyBack(); }
    if (S) shell();
  };
  document.getElementById('mainNav').addEventListener('click', function (event) {
    var button = event.target.closest('[data-view]'); if (!button) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (S && !S.profile.onboarded) pendingView = button.dataset.view;
    go(button.dataset.view);
  }, true);
  if (S && S.profile) render();
})();

// Public backend URL only. Never put a Gemini key here.
window.ACADEMY_TUTOR_URL = 'https://somali-academy-tutor.rashkaa33.workers.dev';

(function () {
  var original = renderLesson;
  renderLesson = function () {
    original();
    if (document.getElementById('academyTutor')) return;
    var en = S.profile.ui === 'en';
    var panel = document.createElement('details'); panel.id = 'academyTutor'; panel.className = 'simple-details';
    var summary = document.createElement('summary'); summary.textContent = en ? 'Help me understand' : 'Iga caawi fahamka'; panel.appendChild(summary);
    var note = document.createElement('p'); note.textContent = en ? 'AI help can make mistakes. Your question and lesson context are sent to Google. Do not include personal details.' : 'Caawinta AI way qaldami kartaa. Su’aasha iyo casharka waxaa loo diraa Google. Ha gelin xog gaar ah.'; panel.appendChild(note);
    var form = document.createElement('form');
    var input = document.createElement('textarea'); input.maxLength = 500; input.required = true; input.setAttribute('aria-label', en ? 'Your learning question' : 'Su’aashaada'); input.placeholder = en ? 'What would you like explained?' : 'Maxaad rabtaa in laguu sharaxo?'; form.appendChild(input);
    var button = document.createElement('button'); button.type = 'submit'; button.textContent = en ? 'Ask tutor' : 'Weydii macallinka'; form.appendChild(button);
    var output = document.createElement('p'); output.setAttribute('role', 'status'); output.style.whiteSpace = 'pre-wrap';
    form.onsubmit = async function (event) {
      event.preventDefault();
      if (!window.ACADEMY_TUTOR_URL) { output.textContent = en ? 'The tutor is awaiting secure setup.' : 'Macallinku wuxuu sugayaa habaynta amniga.'; return; }
      button.disabled = true; output.textContent = en ? 'Thinking…' : 'Waan ka fikirayaa…';
      try {
        var response = await fetch(window.ACADEMY_TUTOR_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: input.value, lesson: JSON.stringify(cur).slice(0, 2500), language: en ? 'en' : 'so' }), signal: AbortSignal.timeout(25000) });
        var data = await response.json(); if (!response.ok) throw new Error(); output.textContent = data.answer;
      } catch { output.textContent = en ? 'Tutor unavailable. Please try again later.' : 'Macallinka lama heli karo. Mar kale isku day.'; }
      finally { button.disabled = false; }
    };
    panel.appendChild(form); panel.appendChild(output); app.appendChild(panel);
  };
})();
