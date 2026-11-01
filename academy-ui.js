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
/* Discoverable learning tools without adding more navigation destinations. */
(function () {
  var home = renderHome, profile = renderProfile;
  function en() { return S.profile.ui === 'en'; }
  function tools() {
    var box = document.createElement('details'); box.className = 'simple-details';
    box.innerHTML = '<summary>' + (en() ? 'Daily practice & learning tools' : 'Tababar maalinle ah') + '</summary>';
    function action(label, fn) { var b = document.createElement('button'); b.className = 'simple-text-button'; b.textContent = label; b.onclick = fn; box.appendChild(b); }
    action(en() ? 'Find my level · Placement test' : 'Ogow heerkayga · Imtixaan', function () { plBegin('profile'); });
    action(en() ? 'Ask the AI tutor' : 'Weydii macallinka AI', function () {
      var n = 1; while (n < LESSONS.length && S.completed['L' + n]) n++;
      openLesson(n);
      var panel = document.getElementById('academyTutor');
      if (panel) { panel.open = true; panel.scrollIntoView({ behavior: 'smooth', block: 'center' }); panel.querySelector('textarea').focus(); }
    });
    action(en() ? 'Review words due today' : 'Ku celceli erayada maanta', function () { setNav('review'); render(); });
    var day = Math.floor(Date.now() / 86400000), words = LESSONS[Math.min(LESSONS.length - 1, Math.floor(day / 7) % LESSONS.length)].vocab;
    var word = words[day % words.length];
    var p = document.createElement('p'); p.textContent = (en() ? 'Word of the day: ' : 'Erayga maanta: ') + word.en + ' — ' + word.so; box.appendChild(p);
    action(en() ? 'Listen to this word' : 'Dhageyso erayga', function () { speak(word.en); });
    var tips = ['Say three sentences about your day aloud. Repeat them tomorrow.', 'Listen to a short sentence, pause, then repeat with the same rhythm.', 'Practise asking someone to repeat: Could you say that again, please?', 'Use a new word in your own sentence before saving it.', 'Describe something near you in English for one minute.', 'Practise a conversation twice: once as each speaker.', 'Review yesterday’s mistakes before starting a new lesson.'];
    var tip = document.createElement('p'); tip.textContent = 'English practice: ' + tips[day % tips.length]; box.appendChild(tip);
    return box;
  }
  renderHome = function () { home(); var target = app.querySelector('.simple-home-content'); if(target) target.appendChild(tools()); };
  renderProfile = function () { profile(); if(app.querySelector('.simple-profile-rows')) app.appendChild(tools()); };
  if (S && S.profile && S.profile.onboarded) render();
})();
(function () {
  // Authored practical conversation lessons supplement the 1,000-lesson course.
  var lessons = [
    ['Ask for clarification','Someone speaks too quickly. Ask them politely to repeat.','Could you say that again, please?','Could you ___ that again, please?','say'],
    ['Book a medical appointment','Call a clinic and ask for an appointment.','I would like to book an appointment.','I would like to ___ an appointment.','book'],
    ['Explain a symptom','Tell a nurse when your headache began.','I have had a headache since yesterday.','I have had a headache ___ yesterday.','since'],
    ['Ask about a bus route','Check whether a bus stops at the hospital.','Does this bus stop at the hospital?','___ this bus stop at the hospital?','Does'],
    ['Return a damaged item','Explain that a new purchase does not work.','I bought this yesterday, but it does not work.','I bought this yesterday, ___ it does not work.','but'],
    ['Request a repair','Tell your landlord about a leaking tap.','Could you arrange a repair for the leaking tap?','Could you ___ a repair for the leaking tap?','arrange'],
    ['Reschedule an interview','Ask to change an interview time politely.','Would it be possible to reschedule my interview?','Would it be ___ to reschedule my interview?','possible'],
    ['Introduce your experience','Describe how long you have worked in a shop.','I have worked in retail for two years.','I have worked in retail ___ two years.','for'],
    ['Ask about a school meeting','Ask a teacher when you can discuss progress.','When would be a good time to discuss my child’s progress?','When would be a good time to ___ my child’s progress?','discuss'],
    ['Check understanding at work','Confirm a deadline before starting a task.','Just to confirm, you need this by Friday, correct?','Just to ___, you need this by Friday, correct?','confirm'],
    ['Disagree respectfully','Explain a different opinion in a meeting.','I see your point, but I have a different view.','I see your ___, but I have a different view.','point'],
    ['Make a social invitation','Invite a neighbour for tea on Saturday.','Would you like to come over for tea on Saturday?','Would you ___ to come over for tea on Saturday?','like']
  ];
  function showList() {
    app.innerHTML = '<button class="simple-back" id="commBack">← Home</button><h1>Real-life English</h1><p>100 cashar wada hadal ah oo leh tarjumaad Soomaali. Dhegeyso, ka jawaab, dabadeed labada door ku tababar. Natiijadu waxay ku kaydsan tahay aaladdan. / 100 practical conversations with Somali translations.</p>';
    document.getElementById('commBack').onclick = function () { setNav('home'); render(); };
    lessons.forEach(function (l,i) {
      var b=document.createElement('button');b.className='simple-row';b.textContent=(i+1)+'. '+l[0]+' — '+conversationTitlesSo[i]+(S.communication&&S.communication[i]?' ✓':'');b.onclick=function(){showLesson(i)};app.appendChild(b);
    });
  }
  var conversations = [
    ['A: The meeting is in room fourteen at half past nine.','B: Could you say that again, please?','A: Of course. Room fourteen, at nine thirty.','B: Did you say fourteen or forty?','A: Fourteen. It is on the first floor.','B: Thank you. Should I bring anything?','A: Please bring your notebook.','B: Great. I will be there at nine thirty.'],
    ['A: Good morning. How can I help?','B: I would like to book an appointment.','A: Is tomorrow morning suitable?','B: Yes. What times are available?','A: We have ten o’clock or eleven thirty.','B: Ten o’clock would be better, please.','A: Please arrive ten minutes early.','B: Thank you. I will arrive at nine fifty.'],
    ['A: What seems to be the problem?','B: I have had a headache since yesterday.','A: Is it constant, or does it come and go?','B: It comes and goes, but it is worse today.','A: Have you noticed anything else?','B: I also feel tired.','A: Thank you. I will let the clinician know.','B: Could you tell me where I should wait?'],
    ['A: Excuse me. Does this bus stop at the hospital?','B: Yes, but you need the stop after the library.','A: How long does the journey take?','B: About twenty minutes in normal traffic.','A: Can I pay by card?','B: Yes. Tap your card here.','A: Could you let me know when we arrive?','B: Certainly. Take a seat, please.'],
    ['A: Hello. How can I help you today?','B: I bought this yesterday, but it does not work.','A: I am sorry about that. Do you have the receipt?','B: Yes. Here it is.','A: Would you prefer a replacement or a refund?','B: A replacement, please, if you have one.','A: We do. Let me check that it works first.','B: Thank you. I appreciate your help.'],
    ['A: Hello. I am calling about a problem in my flat.','B: What has happened?','A: Could you arrange a repair for the leaking tap?','B: Which room is it in?','A: The kitchen. It has been leaking since Monday.','B: A plumber can come tomorrow afternoon.','A: Could they call before arriving?','B: Yes. I will add that to the request.'],
    ['A: Thank you for inviting me to an interview.','B: You are welcome. We look forward to meeting you.','A: Would it be possible to reschedule my interview?','B: What time would suit you?','A: I am available on Thursday afternoon.','B: We have a space at two o’clock.','A: That would be excellent. Thank you.','B: I will email the updated details today.'],
    ['A: Could you tell me about your experience?','B: I have worked in retail for two years.','A: What were your main responsibilities?','B: I helped customers and organised stock.','A: Can you give an example of helping a customer?','B: I found an alternative when an item was unavailable.','A: How did the customer respond?','B: They thanked me and bought the alternative.'],
    ['A: Hello. I would like to speak with the teacher.','B: Certainly. What would you like to discuss?','A: When would be a good time to discuss my child’s progress?','B: Would Tuesday after school work for you?','A: Yes. Should I bring anything?','B: Please bring any questions you want to ask.','A: I would like to talk about reading at home.','B: That is helpful. We can make a plan together.'],
    ['A: Could you prepare the customer report?','B: Just to confirm, you need this by Friday, correct?','A: Yes, before our afternoon meeting.','B: Should I include last month’s figures?','A: Yes, and a short comparison with this month.','B: I will send you a draft on Thursday.','A: Good. That gives us time to review it.','B: Please let me know if the requirements change.'],
    ['A: I think we should finish the whole project this week.','B: I see your point, but I have a different view.','A: What concerns you?','B: We need more time to test the results.','A: What would you suggest?','B: Finish the first part now and test it next week.','A: That sounds reasonable. Let us adjust the plan.','B: Thank you for considering my suggestion.'],
    ['A: Hello! How has your week been?','B: Busy, but good. How about yours?','A: Good, thank you. Would you like to come over for tea on Saturday?','B: That sounds lovely. What time?','A: Would three o’clock suit you?','B: Yes. Should I bring anything?','A: Just yourself. I will make some snacks.','B: Thank you. I look forward to it.']
  ];
  var extraConversations = [
  {
    "title": "Order a coffee",
    "phrase": "Could I have a small coffee, please?",
    "prompt": "Could I have a small coffee, ___?",
    "answer": "please",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Could I have a small coffee, please?",
      "B: Of course. Would you like milk?",
      "A: Yes, a little milk, please.",
      "B: That will be three pounds.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Ask about food allergies",
    "phrase": "Does this dish contain peanuts?",
    "prompt": "Does this dish contain ___?",
    "answer": "peanuts",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Does this dish contain peanuts?",
      "B: Let me check with the kitchen.",
      "A: Thank you. I have a peanut allergy.",
      "B: Please wait before ordering until we confirm the ingredients.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Reserve a restaurant table",
    "phrase": "Could I reserve a table for four?",
    "prompt": "Could I reserve a ___ for four?",
    "answer": "table",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Could I reserve a table for four?",
      "B: Certainly. What time would you like?",
      "A: Seven o’clock on Friday, please.",
      "B: We have a table available then.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Ask for the bill",
    "phrase": "Could we have the bill, please?",
    "prompt": "Could we have the bill, ___?",
    "answer": "please",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Could we have the bill, please?",
      "B: Certainly. Would you like to pay together?",
      "A: Could we pay separately?",
      "B: Yes. I can split the bill.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Report an incorrect order",
    "phrase": "I ordered soup, but this is a salad.",
    "prompt": "I ordered soup, but this is a ___.",
    "answer": "salad",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: I ordered soup, but this is a salad.",
      "B: I am sorry. Let me check your order.",
      "A: Thank you. Could you bring the soup instead?",
      "B: Of course. I will replace it.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Buy groceries",
    "phrase": "Where can I find the rice?",
    "prompt": "___ can I find the rice?",
    "answer": "Where",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Where can I find the rice?",
      "B: It is in aisle five, beside the pasta.",
      "A: Is there a smaller bag?",
      "B: Yes, on the bottom shelf.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Compare prices",
    "phrase": "Is this price for one item or two?",
    "prompt": "Is this ___ for one item or two?",
    "answer": "price",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Is this price for one item or two?",
      "B: It is the price for two.",
      "A: Can I buy just one?",
      "B: Yes, but the discount only applies to two.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Ask for another size",
    "phrase": "Do you have this jacket in a larger size?",
    "prompt": "Do you have this jacket in a ___ size?",
    "answer": "larger",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Do you have this jacket in a larger size?",
      "B: I will check the stockroom.",
      "A: Thank you. Could I try it on?",
      "B: Certainly. The changing rooms are over there.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Exchange clothing",
    "phrase": "Could I exchange this shirt for a smaller size?",
    "prompt": "Could I exchange this shirt for a ___ size?",
    "answer": "smaller",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Could I exchange this shirt for a smaller size?",
      "B: Do you have your receipt?",
      "A: Yes. The tags are still attached too.",
      "B: Thank you. Let us find the right size.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Ask for a shopping bag",
    "phrase": "Could I have a bag, please?",
    "prompt": "Could I have a bag, ___?",
    "answer": "please",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Could I have a bag, please?",
      "B: Would you like a reusable one?",
      "A: Yes. How much is it?",
      "B: It costs one pound.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Ask for directions",
    "phrase": "How do I get to the library from here?",
    "prompt": "How do I get to the ___ from here?",
    "answer": "library",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: How do I get to the library from here?",
      "B: Go straight and turn left at the lights.",
      "A: Is it within walking distance?",
      "B: Yes, it takes about ten minutes.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Buy a train ticket",
    "phrase": "I would like a return ticket to York.",
    "prompt": "I would like a return ___ to York.",
    "answer": "ticket",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: I would like a return ticket to York.",
      "B: When would you like to travel?",
      "A: This morning, returning tomorrow.",
      "B: Let me check the available fares.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Find a platform",
    "phrase": "Which platform does the Bristol train leave from?",
    "prompt": "Which platform does the Bristol train ___ from?",
    "answer": "leave",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Which platform does the Bristol train leave from?",
      "B: It is currently listed on platform six.",
      "A: Has the departure time changed?",
      "B: Please check the board for the latest update.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Ask about a delayed train",
    "phrase": "Do you know why the train is delayed?",
    "prompt": "Do you know why the train is ___?",
    "answer": "delayed",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Do you know why the train is delayed?",
      "B: There is a signalling problem.",
      "A: Is another service available?",
      "B: There is a bus replacement outside the station.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Book a taxi",
    "phrase": "Could I book a taxi for six tomorrow morning?",
    "prompt": "Could I book a taxi for six tomorrow ___?",
    "answer": "morning",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Could I book a taxi for six tomorrow morning?",
      "B: Certainly. Where should we collect you?",
      "A: Outside the main entrance of the hotel.",
      "B: Please give me the hotel address.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Confirm a destination",
    "phrase": "Could you take me to the central station?",
    "prompt": "Could you take me to the central ___?",
    "answer": "station",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Could you take me to the central station?",
      "B: Certainly. Which entrance do you need?",
      "A: The entrance near the ticket office, please.",
      "B: I will drop you beside it.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Check in at a hotel",
    "phrase": "I have a reservation under the name Ali.",
    "prompt": "I have a reservation ___ the name Ali.",
    "answer": "under",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: I have a reservation under the name Ali.",
      "B: Welcome. May I see your booking confirmation?",
      "A: Here it is. Is breakfast included?",
      "B: Let me check the details of your booking.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Ask about hotel facilities",
    "phrase": "What time does breakfast start?",
    "prompt": "What time does breakfast ___?",
    "answer": "start",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: What time does breakfast start?",
      "B: It starts at seven in the dining room.",
      "A: Is there a place to leave my luggage?",
      "B: Yes, we have a luggage room beside reception.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Report a noisy room",
    "phrase": "There is a lot of noise outside my room.",
    "prompt": "There is a lot of noise ___ my room.",
    "answer": "outside",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: There is a lot of noise outside my room.",
      "B: I am sorry. When did it begin?",
      "A: About an hour ago. Could you help?",
      "B: I will investigate and check whether another room is available.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Check out of a hotel",
    "phrase": "I would like to check out, please.",
    "prompt": "I would like to check out, ___.",
    "answer": "please",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: I would like to check out, please.",
      "B: Certainly. What is your room number?",
      "A: Room two hundred and ten.",
      "B: Thank you. Let me prepare your final bill.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Check in for a flight",
    "phrase": "Where can I check in for the morning flight?",
    "prompt": "Where can I check in for the morning ___?",
    "answer": "flight",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Where can I check in for the morning flight?",
      "B: Please use the desks at the far end.",
      "A: Can I check this bag in here?",
      "B: The airline staff at those desks can help you.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Ask about cabin luggage",
    "phrase": "Is this bag small enough for the cabin?",
    "prompt": "Is this bag small enough for the ___?",
    "answer": "cabin",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Is this bag small enough for the cabin?",
      "B: We need to check its dimensions and your ticket allowance.",
      "A: Where can I measure it?",
      "B: Please use the luggage frame beside the desk.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Find a departure gate",
    "phrase": "Where can I find gate twenty-two?",
    "prompt": "Where can I find gate ___-two?",
    "answer": "twenty",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Where can I find gate twenty-two?",
      "B: Follow the signs past security.",
      "A: Is it a long walk?",
      "B: Allow about fifteen minutes and check the departure board.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Report missing luggage",
    "phrase": "My suitcase has not arrived.",
    "prompt": "My suitcase has not ___.",
    "answer": "arrived",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: My suitcase has not arrived.",
      "B: Please show me your baggage receipt.",
      "A: Here it is. The suitcase is blue.",
      "B: Thank you. We will start a missing-bag report.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Ask for airport assistance",
    "phrase": "Could someone help me reach my gate?",
    "prompt": "Could someone help me ___ my gate?",
    "answer": "reach",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Could someone help me reach my gate?",
      "B: Certainly. What kind of assistance do you need?",
      "A: I have difficulty walking long distances.",
      "B: Let me contact the assistance team.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Register at a clinic",
    "phrase": "I would like to register as a patient.",
    "prompt": "I would like to register as a ___.",
    "answer": "patient",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: I would like to register as a patient.",
      "B: Please complete this registration form.",
      "A: Could you explain this section?",
      "B: It asks for your current contact details.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Ask about a prescription",
    "phrase": "Is my prescription ready to collect?",
    "prompt": "Is my prescription ready to ___?",
    "answer": "collect",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Is my prescription ready to collect?",
      "B: Let me check with the pharmacist.",
      "A: Do I need to bring anything?",
      "B: Please bring the information requested by the pharmacy.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Describe a sore throat",
    "phrase": "My throat hurts when I swallow.",
    "prompt": "My throat hurts when I ___.",
    "answer": "swallow",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: My throat hurts when I swallow.",
      "B: How long has it been bothering you?",
      "A: Since Monday. I would like to speak to a clinician.",
      "B: I will help you arrange an assessment.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Ask about medicine instructions",
    "phrase": "Could you explain the instructions on this label?",
    "prompt": "Could you explain the instructions on this ___?",
    "answer": "label",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Could you explain the instructions on this label?",
      "B: The pharmacist can go through them with you.",
      "A: Thank you. I do not want to misunderstand the dose.",
      "B: Please wait here while I call the pharmacist.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Book a dental appointment",
    "phrase": "I would like an appointment with a dentist.",
    "prompt": "I would like an appointment with a ___.",
    "answer": "dentist",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: I would like an appointment with a dentist.",
      "B: Is this a routine check-up?",
      "A: No. One of my teeth has been hurting.",
      "B: Let me check the available appointments.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Change a clinic appointment",
    "phrase": "Could I change my appointment to another day?",
    "prompt": "Could I change my appointment to ___ day?",
    "answer": "another",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Could I change my appointment to another day?",
      "B: Certainly. Which day would suit you?",
      "A: Wednesday afternoon, if possible.",
      "B: I will check the schedule.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Ask for an interpreter",
    "phrase": "Could I have a Somali interpreter for my appointment?",
    "prompt": "Could I have a Somali interpreter for my ___?",
    "answer": "appointment",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Could I have a Somali interpreter for my appointment?",
      "B: I will check what support is available.",
      "A: Thank you. I want to understand everything clearly.",
      "B: We will explain the arrangements before the appointment.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Call about an emergency",
    "phrase": "Please send an ambulance. Someone has collapsed.",
    "prompt": "Please send an ambulance. Someone has ___.",
    "answer": "collapsed",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Please send an ambulance. Someone has collapsed.",
      "B: Tell me the exact location.",
      "A: We are at the main entrance of Central Library.",
      "B: Stay on the line and follow the call handler’s instructions.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Describe a lost phone",
    "phrase": "I think I left my phone on the bus.",
    "prompt": "I think I left my ___ on the bus.",
    "answer": "phone",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: I think I left my phone on the bus.",
      "B: What time were you travelling?",
      "A: Around four this afternoon on route ten.",
      "B: Please complete a lost-property report.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Report a stolen wallet",
    "phrase": "I would like to report a stolen wallet.",
    "prompt": "I would like to report a stolen ___.",
    "answer": "wallet",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: I would like to report a stolen wallet.",
      "B: Where did you last have it?",
      "A: At the station about an hour ago.",
      "B: I will explain how to make a report.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Ask for help in a shop",
    "phrase": "Could you help me reach that item?",
    "prompt": "Could you help me ___ that item?",
    "answer": "reach",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Could you help me reach that item?",
      "B: Of course. Is it the blue box?",
      "A: Yes, the one on the top shelf.",
      "B: Here you are.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "View a rental property",
    "phrase": "Could I arrange a viewing of the flat?",
    "prompt": "Could I arrange a ___ of the flat?",
    "answer": "viewing",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Could I arrange a viewing of the flat?",
      "B: Are you available on Saturday?",
      "A: Yes. Is the rent inclusive of bills?",
      "B: No. I can send you a breakdown before the viewing.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Ask about a tenancy",
    "phrase": "How long is the rental agreement?",
    "prompt": "How long is the rental ___?",
    "answer": "agreement",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: How long is the rental agreement?",
      "B: The proposed term is twelve months.",
      "A: Could I read the terms before deciding?",
      "B: Certainly. I will send you a copy.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Report a heating problem",
    "phrase": "The heating in my flat is not working.",
    "prompt": "The heating in my flat is not ___.",
    "answer": "working",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: The heating in my flat is not working.",
      "B: Is it affecting every room?",
      "A: Yes. I noticed it this morning.",
      "B: I will arrange for someone to investigate.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Arrange a delivery",
    "phrase": "Could you deliver the furniture on Friday?",
    "prompt": "Could you deliver the furniture on ___?",
    "answer": "Friday",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Could you deliver the furniture on Friday?",
      "B: We have an afternoon delivery slot.",
      "A: Will someone call before arriving?",
      "B: Yes. The driver will contact you.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Ask a neighbour to reduce noise",
    "phrase": "Could you turn the music down a little, please?",
    "prompt": "Could you turn the music down a little, ___?",
    "answer": "please",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Could you turn the music down a little, please?",
      "B: I am sorry. I did not realise it was loud.",
      "A: Thank you. I have an early start tomorrow.",
      "B: Of course. I will lower it now.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Introduce yourself to a neighbour",
    "phrase": "Hello, I have just moved in next door.",
    "prompt": "Hello, I have just ___ in next door.",
    "answer": "moved",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Hello, I have just moved in next door.",
      "B: Welcome to the building.",
      "A: My name is Amina. It is nice to meet you.",
      "B: Nice to meet you too. I am Sam.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Arrange internet installation",
    "phrase": "I would like to arrange an internet installation.",
    "prompt": "I would like to arrange an internet ___.",
    "answer": "installation",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: I would like to arrange an internet installation.",
      "B: What date would suit you?",
      "A: Next Tuesday, if there is a morning slot.",
      "B: Let me check engineer availability.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Ask about an electricity bill",
    "phrase": "Could you explain why this bill is higher?",
    "prompt": "Could you explain why this bill is ___?",
    "answer": "higher",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Could you explain why this bill is higher?",
      "B: Let us compare the meter readings.",
      "A: I have a recent reading here.",
      "B: Thank you. That will help us check it.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Open a bank account",
    "phrase": "I would like information about opening an account.",
    "prompt": "I would like information about opening an ___.",
    "answer": "account",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: I would like information about opening an account.",
      "B: We can explain the available options.",
      "A: What documents would I need?",
      "B: The requirements depend on the account. Here is the checklist.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Ask about a bank charge",
    "phrase": "Could you explain this charge on my statement?",
    "prompt": "Could you explain this charge on my ___?",
    "answer": "statement",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Could you explain this charge on my statement?",
      "B: Please tell me the date and description.",
      "A: It appears beside yesterday’s payment.",
      "B: I will check what the charge relates to.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Report a missing bank card",
    "phrase": "I cannot find my bank card.",
    "prompt": "I ___ find my bank card.",
    "answer": "cannot",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: I cannot find my bank card.",
      "B: We can explain how to freeze or report it.",
      "A: Can I freeze it while I look for it?",
      "B: Please use the bank’s official app or contact channel.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Ask about a transfer",
    "phrase": "How long will this transfer take?",
    "prompt": "How long will this ___ take?",
    "answer": "transfer",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: How long will this transfer take?",
      "B: It depends on the destination and transfer type.",
      "A: Can I check the fee before confirming?",
      "B: Yes. Review the quoted fee and details first.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Make a budget appointment",
    "phrase": "Could I speak to someone about managing my budget?",
    "prompt": "Could I speak to someone about managing my ___?",
    "answer": "budget",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Could I speak to someone about managing my budget?",
      "B: We have an adviser available next week.",
      "A: Is there anything I should prepare?",
      "B: Bring a list of your income and regular expenses.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Ask about a job vacancy",
    "phrase": "Are you currently hiring staff?",
    "prompt": "Are you currently hiring ___?",
    "answer": "staff",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Are you currently hiring staff?",
      "B: Yes. Our vacancies are listed online.",
      "A: Can I apply for a part-time role?",
      "B: Yes. Check the hours in each job description.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Ask about working hours",
    "phrase": "What hours does this role involve?",
    "prompt": "What hours does this role ___?",
    "answer": "involve",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: What hours does this role involve?",
      "B: It includes some evening shifts.",
      "A: How far in advance is the schedule shared?",
      "B: Usually two weeks before the shifts begin.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Confirm an interview location",
    "phrase": "Could you confirm where the interview will take place?",
    "prompt": "Could you confirm where the interview will take ___?",
    "answer": "place",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Could you confirm where the interview will take place?",
      "B: It is at our city-centre office.",
      "A: Should I ask for anyone at reception?",
      "B: Please ask for the recruitment team.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Explain availability",
    "phrase": "I am available to start in two weeks.",
    "prompt": "I am available to start in two ___.",
    "answer": "weeks",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: I am available to start in two weeks.",
      "B: Would you be able to work weekends?",
      "A: I can work Saturdays, but not Sundays.",
      "B: Thank you for explaining your availability.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Ask for training at work",
    "phrase": "Could someone show me how to use this system?",
    "prompt": "Could someone show me how to use this ___?",
    "answer": "system",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Could someone show me how to use this system?",
      "B: Yes. I can arrange a training session.",
      "A: Could I take notes during the session?",
      "B: Of course. You can also ask questions afterwards.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Ask a colleague for help",
    "phrase": "Could you help me check this document?",
    "prompt": "Could you help me check this ___?",
    "answer": "document",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Could you help me check this document?",
      "B: Certainly. Which part concerns you?",
      "A: I want to make sure the totals are correct.",
      "B: Let us go through them together.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Report a mistake at work",
    "phrase": "I noticed an error in the report I sent.",
    "prompt": "I noticed an error in the ___ I sent.",
    "answer": "report",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: I noticed an error in the report I sent.",
      "B: Thank you for telling me.",
      "A: I have corrected it. May I send the updated version?",
      "B: Yes. Please explain what changed.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Request time off",
    "phrase": "Could I request a day off next month?",
    "prompt": "Could I request a day off next ___?",
    "answer": "month",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Could I request a day off next month?",
      "B: Which date do you have in mind?",
      "A: The fifteenth, if cover is available.",
      "B: Please submit the request so we can review it.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Call in sick",
    "phrase": "I am unwell and cannot come to work today.",
    "prompt": "I am unwell and cannot come to work ___.",
    "answer": "today",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: I am unwell and cannot come to work today.",
      "B: Thank you for letting me know.",
      "A: Is there a reporting procedure I should follow?",
      "B: Yes. I will explain our absence process.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Give a project update",
    "phrase": "The first part of the project is complete.",
    "prompt": "The first part of the project is ___.",
    "answer": "complete",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: The first part of the project is complete.",
      "B: What is still outstanding?",
      "A: We need to check the figures and write the summary.",
      "B: Please let me know if the deadline is at risk.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Ask for feedback",
    "phrase": "Could you give me some feedback on my presentation?",
    "prompt": "Could you give me some feedback on my ___?",
    "answer": "presentation",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Could you give me some feedback on my presentation?",
      "B: Your examples were clear.",
      "A: What could I improve next time?",
      "B: Try slowing down when you explain the main figures.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Respond to feedback",
    "phrase": "Thank you for pointing that out.",
    "prompt": "Thank you for ___ that out.",
    "answer": "pointing",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Thank you for pointing that out.",
      "B: Would you like to discuss the changes?",
      "A: Yes. Could we review one example together?",
      "B: Certainly. Let us start with the introduction.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Suggest an improvement",
    "phrase": "Could we try a simpler way to record requests?",
    "prompt": "Could we try a simpler way to record ___?",
    "answer": "requests",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Could we try a simpler way to record requests?",
      "B: What do you suggest?",
      "A: One shared form might reduce duplicated work.",
      "B: Let us test it with a small group first.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Negotiate a deadline",
    "phrase": "Would it be possible to extend the deadline?",
    "prompt": "Would it be possible to extend the ___?",
    "answer": "deadline",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Would it be possible to extend the deadline?",
      "B: What extra time would you need?",
      "A: Two days would allow us to check the work properly.",
      "B: Let us discuss which parts are most urgent.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Hand over a task",
    "phrase": "I have finished the checks and saved the notes.",
    "prompt": "I have finished the checks and saved the ___.",
    "answer": "notes",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: I have finished the checks and saved the notes.",
      "B: Is there anything I should follow up?",
      "A: Please confirm the delivery time with the supplier.",
      "B: I will do that this afternoon.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Introduce yourself in class",
    "phrase": "Hello, I am new to this class.",
    "prompt": "Hello, I am new to this ___.",
    "answer": "class",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Hello, I am new to this class.",
      "B: Welcome. What is your name?",
      "A: My name is Hassan. I am here to improve my English.",
      "B: Nice to meet you. Please take a seat.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Ask a teacher a question",
    "phrase": "Could you explain the difference between these words?",
    "prompt": "Could you explain the difference between these ___?",
    "answer": "words",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Could you explain the difference between these words?",
      "B: Certainly. Which words do you mean?",
      "A: Borrow and lend. I keep mixing them up.",
      "B: Let us look at who gives and who receives the item.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Ask for extra study materials",
    "phrase": "Do you have any extra listening exercises?",
    "prompt": "Do you have any extra listening ___?",
    "answer": "exercises",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Do you have any extra listening exercises?",
      "B: Yes. There are some in the learning portal.",
      "A: Which ones would suit my level?",
      "B: Start with the short everyday conversations.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Join a library",
    "phrase": "I would like to join the library.",
    "prompt": "I would like to join the ___.",
    "answer": "library",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: I would like to join the library.",
      "B: You can register at this desk.",
      "A: Can I borrow books straight away?",
      "B: We will explain the borrowing rules after registration.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Ask about a course",
    "phrase": "Could you tell me about the evening English course?",
    "prompt": "Could you tell me about the evening English ___?",
    "answer": "course",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Could you tell me about the evening English course?",
      "B: It meets twice a week.",
      "A: Is there a level assessment before joining?",
      "B: Yes. That helps us recommend a suitable class.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Discuss homework",
    "phrase": "I found the last question difficult.",
    "prompt": "I found the last question ___.",
    "answer": "difficult",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: I found the last question difficult.",
      "B: Which part did you find confusing?",
      "A: I understood the words but not the instructions.",
      "B: Let us read the instructions together.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Arrange a study session",
    "phrase": "Would you like to practise English together?",
    "prompt": "Would you like to practise English ___?",
    "answer": "together",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Would you like to practise English together?",
      "B: Yes. When are you free?",
      "A: Could we meet at the library on Wednesday?",
      "B: That works for me. Shall we practise speaking?",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Ask about a school absence",
    "phrase": "How should I report my child’s absence?",
    "prompt": "How should I report my child’s ___?",
    "answer": "absence",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: How should I report my child’s absence?",
      "B: Please contact the school office.",
      "A: Should I call each day they are absent?",
      "B: The office can explain the school’s procedure.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Discuss a child’s learning",
    "phrase": "How can I help with reading at home?",
    "prompt": "How can I help with ___ at home?",
    "answer": "reading",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: How can I help with reading at home?",
      "B: Short, regular practice can help.",
      "A: Could you suggest a suitable book?",
      "B: Yes. Let us choose one at an appropriate level.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Make a new friend",
    "phrase": "Is this your first time at the group?",
    "prompt": "Is this your first time at the ___?",
    "answer": "group",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Is this your first time at the group?",
      "B: Yes. I moved here recently.",
      "A: What do you enjoy doing in your free time?",
      "B: I like walking and cooking. How about you?",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Accept an invitation",
    "phrase": "Thank you for inviting me. I would love to come.",
    "prompt": "Thank you for inviting me. I ___ love to come.",
    "answer": "would",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Thank you for inviting me. I would love to come.",
      "B: Wonderful. We are starting at six.",
      "A: Is there anything I can bring?",
      "B: A small snack to share would be lovely.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Decline an invitation politely",
    "phrase": "Thank you, but I cannot make it on Friday.",
    "prompt": "Thank you, but I cannot make it on ___.",
    "answer": "Friday",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Thank you, but I cannot make it on Friday.",
      "B: No problem. Perhaps another time.",
      "A: I would like that. Are you free next week?",
      "B: Let us check our calendars.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Apologise for being late",
    "phrase": "I am sorry I am late. My bus was delayed.",
    "prompt": "I am sorry I am late. My bus was ___.",
    "answer": "delayed",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: I am sorry I am late. My bus was delayed.",
      "B: Thank you for letting me know.",
      "A: Have I missed anything important?",
      "B: Only the introduction. I can summarise it for you.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Make plans with a friend",
    "phrase": "Shall we go for a walk this weekend?",
    "prompt": "Shall we go for a walk this ___?",
    "answer": "weekend",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Shall we go for a walk this weekend?",
      "B: That sounds good. Which day?",
      "A: Would Sunday morning work for you?",
      "B: Yes. Let us meet at the park entrance.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Talk about hobbies",
    "phrase": "What do you enjoy doing after work?",
    "prompt": "What do you enjoy doing ___ work?",
    "answer": "after",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: What do you enjoy doing after work?",
      "B: I usually play football or read.",
      "A: How often do you play football?",
      "B: Once a week with some friends.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Talk about the weather",
    "phrase": "Do you think it will rain this afternoon?",
    "prompt": "Do you think it will rain this ___?",
    "answer": "afternoon",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Do you think it will rain this afternoon?",
      "B: The forecast says there may be showers.",
      "A: Shall we choose somewhere indoors instead?",
      "B: Good idea. We could visit the museum.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Describe your daily routine",
    "phrase": "What does a typical morning look like for you?",
    "prompt": "What does a typical ___ look like for you?",
    "answer": "morning",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: What does a typical morning look like for you?",
      "B: I get up early and prepare breakfast.",
      "A: Do you travel far to work?",
      "B: No. It is a short bus journey.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Tell a story about yesterday",
    "phrase": "What did you do yesterday?",
    "prompt": "What did you do ___?",
    "answer": "yesterday",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: What did you do yesterday?",
      "B: I visited a friend and helped with a garden.",
      "A: Did you enjoy it?",
      "B: Yes. We finished the work and had lunch together.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Talk about future plans",
    "phrase": "What are you hoping to do next year?",
    "prompt": "What are you ___ to do next year?",
    "answer": "hoping",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: What are you hoping to do next year?",
      "B: I would like to take a training course.",
      "A: Have you chosen a subject yet?",
      "B: I am interested in healthcare, but I am still exploring.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Explain a preference",
    "phrase": "Would you rather meet online or in person?",
    "prompt": "Would you rather meet online or in ___?",
    "answer": "person",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Would you rather meet online or in person?",
      "B: I would prefer to meet in person.",
      "A: Is there a particular reason?",
      "B: I find it easier to follow the conversation.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Check a misunderstanding",
    "phrase": "I thought we agreed to meet on Thursday.",
    "prompt": "I thought we agreed to meet on ___.",
    "answer": "Thursday",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: I thought we agreed to meet on Thursday.",
      "B: I meant Tuesday. I am sorry for the confusion.",
      "A: Could we confirm the date in a message?",
      "B: Yes. I will send the details now.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Leave a voicemail",
    "phrase": "Hello, this is Amina calling about our appointment.",
    "prompt": "Hello, this is Amina calling about our ___.",
    "answer": "appointment",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Hello, this is Amina calling about our appointment.",
      "B: Please leave a message after the tone.",
      "A: Could you call me back to confirm the time? Thank you.",
      "B: Your message has been recorded.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "End a conversation politely",
    "phrase": "It has been lovely talking to you.",
    "prompt": "It has been lovely ___ to you.",
    "answer": "talking",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: It has been lovely talking to you.",
      "B: I have enjoyed it too.",
      "A: I need to go now, but I hope we can talk again soon.",
      "B: Of course. Have a good afternoon.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  },
  {
    "title": "Ask for accessibility information",
    "phrase": "Is there a step-free entrance to the building?",
    "prompt": "Is there a step-free entrance to the ___?",
    "answer": "building",
    "dialogue": [
      "A: Hello. Could we talk for a moment?",
      "B: Of course. How can I help?",
      "A: Is there a step-free entrance to the building?",
      "B: Yes. It is on the east side.",
      "A: Could you tell me how to reach it from here?",
      "B: Follow this path and turn right beside the main sign.",
      "A: Thank you for your time.",
      "B: You are welcome."
    ]
  }
];
  extraConversations.forEach(function(item){lessons.push([item.title,"Practise: "+item.title.toLowerCase()+".",item.phrase,item.prompt,item.answer]);conversations.push(item.dialogue)});
  var conversationTitlesSo = ["Codso in hadalka lagu celiyo", "Ballanso ballan caafimaad", "Sharax calaamad xanuun", "Weydii jidka baska", "Celi alaab cilladaysan", "Dalbo dayactir", "Beddel waqtiga waraysiga", "Sharax waayo-aragnimadaada", "Weydii kulan dugsi", "Xaqiiji fahamka shaqada", "Si xushmad leh u diid fikrad", "Samee martiqaad", "Dalbo qaxwo", "Weydii xasaasiyadda cuntada", "Ballanso miis makhaayad", "Dalbo biilka", "Sheeg dalab cunto oo khaldan", "Iibso raashin", "Isbarbar dhig qiimaha", "Weydii cabbir kale", "Beddel dhar", "Dalbo bac wax lagu qaato", "Weydii jidka", "Iibso tigidh tareen", "Raadi barxadda tareenka", "Weydii tareen daahay", "Ballanso tagsi", "Xaqiiji meesha aad u socoto", "Iska diiwaangeli hudheel", "Weydii adeegyada hudheelka", "Sheeg buuq qolka ka baxsan", "Ka bax hudheel", "Iska diiwaangeli duulimaad", "Weydii boorsada diyaaradda lala galo", "Raadi albaabka duulimaadka", "Sheeg boorso maqan", "Dalbo caawimo garoonka", "Iska diiwaangeli xarun caafimaad", "Weydii daawo laguu qoray", "Sharax cune xanuun", "Weydii tilmaamaha daawada", "Ballanso dhakhtar ilko", "Beddel ballan caafimaad", "Dalbo turjubaan", "Wac gurmad", "Sharax telefoon lumay", "Sheeg boorso lacag oo la xaday", "Dalbo caawimo dukaan", "Daawo guri kiro ah", "Weydii heshiis kiro", "Sheeg cilad kululaynta", "Qabanqaabi alaab keenis", "Deriska ka codso buuq yarayn", "Is bar deris", "Qabanqaabi internet rakibid", "Weydii biilka korontada", "Furo akoon bangi", "Weydii khidmad bangi", "Sheeg kaar bangi maqan", "Weydii lacag wareejin", "Ballanso talo miisaaniyadeed", "Weydii shaqo bannaan", "Weydii saacadaha shaqada", "Xaqiiji goobta waraysiga", "Sharax waqtiga aad shaqayn karto", "Dalbo tababar shaqo", "Shaqaale kale ka dalbo caawimo", "Sheeg khalad shaqo", "Dalbo fasax", "Sheeg inaad xanuunsan tahay", "Ka warbixi mashruuc", "Dalbo jawaab celin", "Ka jawaab talo", "Soo jeedi hagaajin", "Ka wada hadal waqtiga kama dambaysta ah", "Wareeji hawl shaqo", "Isku bar fasal", "Macallin su’aal weydii", "Dalbo agab waxbarasho", "Ku biir maktabad", "Weydii koorso", "Ka hadal shaqada guriga", "Qabanqaabi waxbarasho wadajir ah", "Weydii maqnaansho dugsi", "Ka hadal waxbarashada ilmaha", "Baro saaxiib cusub", "Aqbal martiqaad", "Si edeb leh u diid martiqaad", "Ka raalli geli daahid", "Qorshee kulan saaxiib", "Ka hadal hiwaayadaha", "Ka hadal cimilada", "Sharax hawl maalmeedkaaga", "Ka sheekee shalay", "Ka hadal qorshayaasha mustaqbalka", "Sharax doorashadaada", "Sax isfaham la’aan", "Reeb farriin cod ah", "Si edeb leh u soo afjar hadal", "Weydii marin sahlan"];
  var conversationsSo = [["Kulanku wuxuu ka dhacayaa qolka afar iyo tobnaad sagaalka iyo badh.", "Mar kale ma dhihi kartaa, fadlan?", "Dabcan. Qolka afar iyo tobnaad, sagaalka iyo badh.", "Ma afar iyo toban ayaad tidhi mise afartan?", "Afar iyo toban. Wuxuu ku yaallaa dabaqa koowaad.", "Mahadsanid. Wax ma inaan soo qaataa?", "Fadlan keen buuggaaga qoraalka.", "Wanaagsan. Sagaalka iyo badh ayaan imanayaa."], ["Subax wanaagsan. Sideen kuu caawin karaa?", "Waxaan rabaa inaan ballan qabsado.", "Berri subax ma kuu habboon tahay?", "Haa. Waqtiyadee ayaa bannaan?", "Waxaan haynaa tobanka ama kow iyo tobanka iyo badh.", "Tobanka ayaa ii fiican, fadlan.", "Fadlan imow toban daqiiqo ka hor.", "Mahadsanid. Sagaalka iyo konton daqiiqo ayaan imanayaa."], ["Maxaa ku haya?", "Madax xanuun ayaa i hayay tan iyo shalay.", "Ma joogto ayuu yahay mise marna wuu tagaa marna wuu yimaadaa?", "Marna wuu tagaa marna wuu yimaadaa, laakiin maanta ayuu ka sii daran yahay.", "Wax kale ma aragtay?", "Daalna waan dareemayaa.", "Mahadsanid. Waxaan ogeysiinayaa xirfadlaha caafimaadka.", "Ma ii sheegi kartaa meesha aan ku sugo?"], ["Iga raalli noqo. Baskani isbitaalka ma istaagaa?", "Haa, laakiin waxaad u baahan tahay joogsiga maktabadda ka dambeeya.", "Intee ayuu safarku qaadanayaa?", "Qiyaastii labaatan daqiiqo marka waddadu caadi tahay.", "Kaar ma ku bixin karaa?", "Haa. Kaarkaaga halkan saar.", "Ma i ogeysiin kartaa markaan gaarno?", "Dabcan. Fadlan fariiso."], ["Salaan. Sideen maanta kuu caawin karaa?", "Shalay ayaan tan iibsaday, laakiin ma shaqaynayso.", "Waan ka xumahay. Rasiidka ma haysaa?", "Haa. Waa kan.", "Ma doorbidaysaa mid beddel ah mise lacag celin?", "Mid beddel ah, fadlan, haddii aad haysaan.", "Waan haynaa. Aan marka hore hubiyo inay shaqaynayso.", "Mahadsanid. Waan ku faraxsanahay caawimadaada."], ["Salaan. Waxaan ka soo wacayaa dhibaato gurigayga ka jirta.", "Maxaa dhacay?", "Ma qabanqaabin kartaa dayactirka qasabadda daadanaysa?", "Qolkee ayay ku taallaa?", "Jikada. Waxay daadanaysay tan iyo Isniintii.", "Tuubiste ayaa iman kara berri galab.", "Ma soo wici karaa ka hor imaatinka?", "Haa. Codsiga ayaan ku darayaa arrintaas."], ["Waad ku mahadsan tahay inaad igu casuuntay waraysi.", "Adaa mudan. Waxaan rajaynaynaa inaan kula kulanno.", "Ma suurtagal baa inaan beddelo waqtiga waraysigayga?", "Waqtigee ayaa kuu habboon?", "Khamiista galabtii ayaan diyaar ahay.", "Waxaan haynaa waqti labada duhurnimo.", "Taasi aad bay u fiican tahay. Mahadsanid.", "Faahfaahinta cusub iimayl ayaan maanta ku soo dirayaa."], ["Ma iiga warrami kartaa waayo-aragnimadaada?", "Waxaan iibka tafaariiqda ka shaqaynayay laba sano.", "Maxay ahaayeen masuuliyadahaaga ugu waaweyn?", "Macaamiisha ayaan caawin jiray, alaabtana waan habayn jiray.", "Ma bixin kartaa tusaale aad macmiil caawisay?", "Waxaan helay shay kale markii kii la rabay la waayay.", "Sidee ayuu macmiilku uga falceliyay?", "Wuu ii mahadceliyay, shaygii kalena wuu iibsaday."], ["Salaan. Waxaan rabaa inaan macallinka la hadlo.", "Dabcan. Maxaad rabtaa inaad ka hadasho?", "Goormay habboon tahay inaan ka hadalno horumarka ilmahayga?", "Talaadada dugsiga kaddib ma kuu habboon tahay?", "Haa. Wax ma inaan soo qaataa?", "Fadlan keen su’aalaha aad rabto inaad weydiiso.", "Waxaan rabaa inaan ka hadlo akhriska guriga.", "Taasi waa waxtar. Qorshe ayaan wada samayn karnaa."], ["Ma diyaarin kartaa warbixinta macaamiisha?", "Si aan u xaqiijiyo, waxaad tan u baahan tahay Jimcaha, sax?", "Haa, ka hor kulankeenna galabnimo.", "Tirooyinkii bishii hore ma ku daraa?", "Haa, iyo isbarbardhig kooban oo bishan ah.", "Qoraal hordhac ah ayaan Khamiista kuu soo dirayaa.", "Wanaagsan. Taasi waxay na siinaysaa waqti aan ku eegno.", "Fadlan ii sheeg haddii shuruuduhu isbeddelaan."], ["Waxaan u malaynayaa inaan mashruuca oo dhan toddobaadkan dhammayno.", "Waan fahmay fikraddaada, laakiin aragti kale ayaan qabaa.", "Maxaa ku walaacinaya?", "Waxaan u baahanahay waqti dheeraad ah oo aan natiijooyinka ku tijaabino.", "Maxaad soo jeedin lahayd?", "Qaybta koowaad hadda dhammee, toddobaadka soo socdana tijaabi.", "Taasi waa macquul. Aan qorshaha hagaajinno.", "Waad ku mahadsan tahay inaad tixgelisay soo jeedintayda."], ["Salaan! Sidee ayuu toddobaadkaagu ahaa?", "Mashquul, laakiin fiican. Kaaguna?", "Fiican, mahadsanid. Ma rabtaa inaad Sabtida shaah noo timaaddo?", "Waa fikrad fiican. Saacad intee ah?", "Saddexda galabnimo ma kuu habboon tahay?", "Haa. Wax ma inaan keenaa?", "Adiga oo keliya kaalay. Waxaan samaynayaa cunto fudud.", "Mahadsanid. Waan sugayaa kulanka."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Ma heli karaa qaxwo yar, fadlan?", "Dabcan. Caano ma rabtaa?", "Haa, caano yar, fadlan.", "Qiimuhu waa saddex giniga Ingiriiska ah.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Cuntadan laws ma ku jiraa?", "Aan jikada ka hubiyo.", "Mahadsanid. Xasaasiyad laws ayaan qabaa.", "Fadlan sug inta aan ka xaqiijinayno waxyaabaha ku jira.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Ma ballansan karaa miis afar qof ah?", "Dabcan. Saacad intee ah ayaad rabtaa?", "Jimcaha toddobada fiidnimo, fadlan.", "Waqtigaas miis ayaa bannaan.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Ma heli karnaa biilka, fadlan?", "Dabcan. Ma wada bixinaysaan?", "Ma kala bixin karnaa?", "Haa. Biilka waan kala qaybin karaa.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Maraq ayaan dalbaday, laakiin tani waa saladh.", "Waan ka xumahay. Aan dalabkaaga hubiyo.", "Mahadsanid. Maraqii ma ii keeni kartaa beddelkeeda?", "Dabcan. Waan kuu beddelayaa.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Xaggee bariiska ka heli karaa?", "Wuxuu yaallaa marinka shanaad, baastada agteeda.", "Bac ka yar ma jirtaa?", "Haa, khaanadda hoose ayay saaran tahay.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Qiimahani hal shay miyuu yahay mise laba?", "Waa qiimaha laba shay.", "Hal keliya ma iibsan karaa?", "Haa, laakiin qiimo dhimistu laba shay oo keliya ayay khusaysaa.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Jaakaddan cabbir ka weyn ma haysaan?", "Bakhaarka ayaan ka hubinayaa.", "Mahadsanid. Ma tijaabin karaa?", "Dabcan. Qolalka dharka lagu tijaabiyo halkaas ayay ku yaallaan.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Shaadhkan mid ka yar ma ku beddelan karaa?", "Rasiidka ma haysaa?", "Haa. Summadihiina weli way ku dheggan yihiin.", "Mahadsanid. Aan kuu raadinno cabbirka saxda ah.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Bac ma heli karaa, fadlan?", "Mid dib loo isticmaali karo ma rabtaa?", "Haa. Waa imisa?", "Waa hal giniga Ingiriiska ah.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Sideen halkan uga tagaa maktabadda?", "Toos u soco, dabadeed bidix uga leexo nalalka waddada.", "Lug ma lagu tegi karaa?", "Haa, waxay qaadanaysaa qiyaastii toban daqiiqo.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Waxaan rabaa tigidh tegid iyo soo noqosho ah oo York ah.", "Goormaad rabtaa inaad safarto?", "Saaka, anigoo berri soo noqonaya.", "Aan hubiyo qiimayaasha la heli karo.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Barxad noocee ah ayuu tareenka Bristol ka baxayaa?", "Hadda waxaa lagu qoray barxadda lixaad.", "Waqtigii bixitaanku ma isbeddelay?", "Fadlan shaashadda ka eeg xogta ugu dambaysa.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Ma ogtahay sababta tareenku u daahay?", "Cillad ayaa ka jirta nidaamka calaamadaha tareenka.", "Adeeg kale ma jiraa?", "Bas beddel ah ayaa yaalla saldhigga bannaankiisa.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Ma ballansan karaa tagsi lixda subaxnimo ee berri?", "Dabcan. Xaggee lagaa qaadayaa?", "Albaabka weyn ee hudheelka hortiisa.", "Fadlan ii sheeg cinwaanka hudheelka.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Ma i geyn kartaa saldhigga dhexe?", "Dabcan. Albaabkee ayaad u baahan tahay?", "Albaabka u dhow xafiiska tigidhada, fadlan.", "Agtiisa ayaan kugu dejinayaa.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Waxaan haystaa ballan ku qoran magaca Cali.", "Soo dhowow. Ma arki karaa xaqiijinta ballanta?", "Waa tan. Quraacdu ma ku jirtaa?", "Aan hubiyo faahfaahinta ballantaada.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Goormay quraacdu bilaabataa?", "Toddobada ayay ka bilaabataa qolka cuntada.", "Meel aan boorsooyinkayga dhigo ma jirtaa?", "Haa, qol boorsooyin ayaa yaalla soo dhoweynta agteeda.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Qolkayga bannaankiisa buuq badan ayaa jira.", "Waan ka xumahay. Goormuu bilaabmay?", "Qiyaastii saacad ka hor. Ma i caawin kartaa?", "Waan baarayaa, waxaanan hubinayaa qol kale inuu bannaan yahay.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Waxaan rabaa inaan iska baxo, fadlan.", "Dabcan. Waa maxay lambarka qolkaagu?", "Qolka laba boqol iyo tobnaad.", "Mahadsanid. Aan diyaariyo biilkaaga ugu dambeeya.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Xaggee ayaan isaga diiwaangelin karaa duulimaadka subaxda?", "Fadlan isticmaal miisaska dhinaca fog.", "Boorsadan halkan ma ku wareejin karaa?", "Shaqaalaha shirkadda duulimaadka ee miisaskaas jooga ayaa ku caawin kara.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Boorsadani ma ku yar tahay in diyaaradda gudaha lala galo?", "Waa inaan hubinno cabbirkeeda iyo inta tigidhkaagu oggol yahay.", "Xaggee ayaan ku cabbiri karaa?", "Fadlan isticmaal qaabka cabbirka boorsooyinka ee miiska agtiisa yaalla.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Xaggee ayaan ka helaa albaabka laba iyo labaatanaad?", "Raac calaamadaha markaad ka gudubto baaritaanka amniga.", "Socod dheer ma yahay?", "U qorshee qiyaastii shan iyo toban daqiiqo, shaashadda bixitaankana hubi.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Shandaddaydii ma iman.", "Fadlan i tus rasiidka boorsadaada.", "Waa kan. Shandaddu waa buluug.", "Mahadsanid. Waxaan bilaabaynaa warbixin boorso maqan.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Qof ma iga caawin karaa inaan gaaro albaabka duulimaadkayga?", "Dabcan. Caawimo noocee ah ayaad u baahan tahay?", "Socodka dheer ayaa igu adag.", "Aan la xiriiro kooxda caawimada.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Waxaan rabaa inaan bukaan ahaan isu diiwaangeliyo.", "Fadlan buuxi foomkan diiwaangelinta.", "Qaybtan ma ii sharixi kartaa?", "Waxay ku weydiinaysaa xogtaada xiriirka ee hadda.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Daawadii la ii qoray diyaar ma tahay inaan qaato?", "Aan farmashiistaha ka hubiyo.", "Wax ma inaan soo qaataa?", "Fadlan keen macluumaadka farmashiyuhu kaa codsaday.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Cunaha ayaa i xanuunaya markaan wax liqo.", "Intee ayuu ku hayay?", "Tan iyo Isniintii. Waxaan rabaa inaan la hadlo xirfadle caafimaad.", "Waxaan kaa caawinayaa inaad hesho qiimayn caafimaad.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Tilmaamaha summaddan ku qoran ma ii sharixi kartaa?", "Farmashiistaha ayaa kula dul mari kara.", "Mahadsanid. Ma rabo inaan si khaldan u fahmo qiyaasta.", "Fadlan halkan sug inta aan farmashiistaha u yeerayo.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Waxaan rabaa ballan dhakhtar ilko.", "Ma baaritaan caadi ah baa?", "Maya. Mid ka mid ah ilkahayga ayaa i xanuunayay.", "Aan hubiyo ballamaha bannaan.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Ballantayda ma u beddeli karaa maalin kale?", "Dabcan. Maalintee ayaa kuu habboon?", "Arbacada galabtii, haddii ay suurtagal tahay.", "Jadwalka ayaan hubinayaa.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Ma heli karaa turjubaan Soomaali ah ballantayda?", "Waxaan hubinayaa caawimada la heli karo.", "Mahadsanid. Waxaan rabaa inaan wax walba si cad u fahmo.", "Waxaan sharixi doonnaa qabanqaabada ka hor ballanta.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Fadlan soo dira ambalaas. Qof ayaa dhacay.", "Ii sheeg goobta saxda ah.", "Waxaan joognaa albaabka weyn ee Maktabadda Dhexe.", "Khadka ku jir oo raac tilmaamaha qofka wicitaanka qaabilaya.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Waxaan u malaynayaa inaan telefoonkayga baska uga tagay.", "Goormaad safaraysay?", "Qiyaastii afartii galabnimo, baska jidka tobnaad.", "Fadlan buuxi warbixinta alaab luntay.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Waxaan rabaa inaan soo sheego boorso lacag oo la xaday.", "Xaggee ayaad markii ugu dambaysay ku haysatay?", "Saldhigga, qiyaastii saacad ka hor.", "Waxaan kuu sharixi doonaa sida warbixin loo gudbiyo.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Ma iga caawin kartaa inaan gaaro shaygaas?", "Dabcan. Sanduuqa buluugga ah miyaa?", "Haa, kan khaanadda ugu sarraysa saaran.", "Waa kan.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Ma qabanqaabin karaa inaan guriga soo daawado?", "Sabtida ma diyaar baad tahay?", "Haa. Kiradu ma ku jiraan biilashu?", "Maya. Faahfaahinta kharashka ayaan kuu soo diri karaa ka hor daawashada.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Intee ayuu heshiiska kiradu soconayaa?", "Muddada la soo jeediyay waa laba iyo toban bilood.", "Shuruudaha ma akhrin karaa ka hor inta aan go’aansan?", "Dabcan. Nuqul ayaan kuu soo dirayaa.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Kululaynta gurigaygu ma shaqaynayso.", "Qol kasta ma saamaysay?", "Haa. Saaka ayaan arkay.", "Waxaan qabanqaabinayaa qof baaritaan sameeya.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Jimcaha ma keeni kartaan alaabta guriga?", "Waxaan haynaa waqti keenis galabnimo.", "Qof ma soo wici doonaa ka hor imaatinka?", "Haa. Darawalka ayaa kula soo xiriiri doona.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Muusigga wax yar ma hoos u dhigi kartaa, fadlan?", "Waan ka xumahay. Ma aanan ogayn inuu dheeraa.", "Mahadsanid. Berri aroor hore ayaan shaqo leeyahay.", "Dabcan. Hadda ayaan hoos u dhigayaa.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Salaan, waxaan hadda u soo guuray guriga ku xiga.", "Ku soo dhowow dhismaha.", "Magacaygu waa Aamina. Waan ku faraxsanahay inaan ku barto.", "Aniguna waan ku faraxsanahay. Waxaan ahay Sam.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Waxaan rabaa inaan qabanqaabiyo internet rakibid.", "Taariikhdee ayaa kuu habboon?", "Talaadada soo socota, haddii waqti subaxnimo jiro.", "Aan hubiyo jadwalka farsamayaqaanka.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Ma ii sharixi kartaa sababta biilkani u kordhay?", "Aan isbarbar dhigno akhrisyada mitirka.", "Halkan waxaan ku hayaa akhris dhowaan ah.", "Mahadsanid. Taasi waxay naga caawinaysaa hubinta.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Waxaan rabaa xog ku saabsan furashada akoon.", "Waxaan kuu sharixi karnaa xulashooyinka jira.", "Dukumiinti noocee ah ayaan u baahanahay?", "Shuruuduhu waxay ku xiran yihiin akoonka. Waa kan liiska loo baahan yahay.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Khidmaddan warbixinta akoonkayga ku qoran ma ii sharixi kartaa?", "Fadlan ii sheeg taariikhda iyo faahfaahinta.", "Waxay ku qoran tahay lacag bixintii shalay agteeda.", "Waxaan hubinayaa waxa khidmaddani ku saabsan tahay.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Ma heli karo kaarkayga bangiga.", "Waxaan kuu sharixi karnaa sida loo hakiyo ama loo soo sheego.", "Ma hakin karaa inta aan raadinayo?", "Fadlan isticmaal barnaamijka rasmiga ah ama xiriirka rasmiga ah ee bangiga.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Intee ayay lacag wareejintani qaadanaysaa?", "Waxay ku xiran tahay meesha loo dirayo iyo nooca wareejinta.", "Khidmadda ma hubin karaa ka hor xaqiijinta?", "Haa. Marka hore eeg khidmadda iyo faahfaahinta lagu siiyay.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Qof ma kala hadli karaa maaraynta miisaaniyaddayda?", "La-taliye ayaa diyaar ah toddobaadka soo socda.", "Wax ma inaan diyaariyaa?", "Keen liiska dakhligaaga iyo kharashyadaada joogtada ah.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Hadda shaqaale ma qaadanaysaan?", "Haa. Shaqooyinka bannaan waxay ku qoran yihiin internetka.", "Shaqo saacado kooban ah ma codsan karaa?", "Haa. Saacadaha ka eeg faahfaahinta shaqo kasta.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Shaqadani saacado noocee ah ayay leedahay?", "Waxaa ku jira shaqooyin fiidnimo qaarkood.", "Intee ka hor ayaa jadwalka la wadaagaa?", "Badanaa laba toddobaad ka hor inta aan shaqooyinku bilaabmin.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Ma xaqiijin kartaa meesha waraysigu ka dhacayo?", "Wuxuu ka dhacayaa xafiiskayaga bartamaha magaalada.", "Qof gaar ah ma inaan ka weydiiyo soo dhoweynta?", "Fadlan weydii kooxda shaqaalaysiinta.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Waxaan diyaar u ahay inaan bilaabo laba toddobaad gudahood.", "Dhammaadka toddobaadka ma shaqayn kartaa?", "Sabtiyada waan shaqayn karaa, laakiin Axadaha ma shaqayn karo.", "Waad ku mahadsan tahay inaad sharaxday waqtiga aad diyaar tahay.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Qof ma i tusi karaa sida nidaamkan loo isticmaalo?", "Haa. Tababar ayaan kuu qabanqaabin karaa.", "Qoraallo ma qaadan karaa inta tababarku socdo?", "Dabcan. Su’aalana waad weydiin kartaa kaddib.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Ma iga caawin kartaa inaan dukumiintigan hubiyo?", "Dabcan. Qaybtee ayaa ku walaacinaysa?", "Waxaan rabaa inaan hubiyo in wadartu sax tahay.", "Aan wada hubinno.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Waxaan arkay khalad ku jira warbixintii aan diray.", "Waad ku mahadsan tahay inaad ii sheegtay.", "Waan saxay. Nuqulka cusub ma diri karaa?", "Haa. Fadlan sharax waxa isbeddelay.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Ma codsan karaa maalin fasax ah bisha soo socota?", "Taariikhdee ayaad ka fikiraysaa?", "Shan iyo tobanka, haddii qof ii sii shaqayn karo.", "Fadlan codsiga gudbi si aan u eegno.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Waan xanuunsanahay, shaqadana maanta iman kari maayo.", "Waad ku mahadsan tahay inaad na ogeysiisay.", "Ma jirtaa hab warbixineed aan raaco?", "Haa. Waxaan kuu sharixi doonaa habka maqnaanshaha.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Qaybta koowaad ee mashruuca waa dhammaatay.", "Maxaa weli harsan?", "Waa inaan hubinno tirooyinka oo aan qorno soo koobidda.", "Fadlan ii sheeg haddii waqtiga kama dambaysta ahi khatar ku jiro.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Ma i siin kartaa jawaab celin ku saabsan bandhiggayga?", "Tusaalooyinkaagu way caddaayeen.", "Maxaan hagaajin karaa marka xigta?", "Isku day inaad gaabiso markaad sharxayso tirooyinka muhiimka ah.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Waad ku mahadsan tahay inaad arrintaas tilmaantay.", "Ma rabtaa inaan ka hadalno isbeddellada?", "Haa. Hal tusaale ma wada eegi karnaa?", "Dabcan. Aan ka bilowno hordhaca.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Ma tijaabin karnaa hab ka fudud oo codsiyada loo diiwaangeliyo?", "Maxaad soo jeedinaysaa?", "Hal foom oo wadajir ah ayaa yarayn kara shaqada la isku celiyo.", "Aan marka hore koox yar ku tijaabinno.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Ma suurtagal baa in waqtiga kama dambaysta ah la kordhiyo?", "Waqti dheeraad ah intee le’eg ayaad u baahan tahay?", "Laba maalmood ayaa noo saamaxaysa inaan shaqada si fiican u hubinno.", "Aan ka wada hadalno qaybaha ugu degdegga badan.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Hubintii waan dhammeeyay, qoraalladiina waan kaydiyay.", "Wax ma jiraan aan dabagal ku sameeyo?", "Fadlan alaab-qeybiyaha ka xaqiiji waqtiga keenista.", "Galabta ayaan samaynayaa.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Salaan, fasalkan waan ku cusubahay.", "Soo dhowow. Magacaa?", "Magacaygu waa Xasan. Waxaan u imid inaan Ingiriisigayga hagaajiyo.", "Waan ku faraxsanahay inaan ku barto. Fadlan fariiso.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Farqiga erayadan u dhexeeya ma ii sharixi kartaa?", "Dabcan. Erayadee ayaad ula jeeddaa?", "Borrow iyo lend. Mar walba waan isku khaldaa.", "Aan eegno qofka shayga bixinaya iyo qofka qaadanaya.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Layliyo dhegeysi oo dheeraad ah ma haysaan?", "Haa. Qaar ayaa ku jira bogga waxbarashada.", "Kuwee ayaa heerkayga ku habboon?", "Ka bilow wada sheekaysiyada maalinlaha ah ee gaagaaban.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Waxaan rabaa inaan ku biiro maktabadda.", "Miiskan ayaad iska diiwaangelin kartaa.", "Isla markiiba buugaag ma amaahan karaa?", "Xeerarka amaahashada ayaan sharixi doonnaa diiwaangelinta kaddib.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Ma iiga warrami kartaa koorsada Ingiriisiga fiidkii?", "Waxay kulantaa laba jeer toddobaadkii.", "Ma jiraa qiimayn heer ka hor ku biirista?", "Haa. Taasi waxay naga caawinaysaa inaan kugula talinno fasal ku habboon.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Su’aashii ugu dambaysay way igu adkaatay.", "Qaybtee ayaa ku wareerisay?", "Erayada waan fahmay, laakiin tilmaamaha ma fahmin.", "Aan wada akhrinno tilmaamaha.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Ma rabtaa inaan wada baranno Ingiriisiga?", "Haa. Goormaad firaaqo leedahay?", "Arbacada maktabadda ma ku kulmi karnaa?", "Waa ii habboon tahay. Hadalka ma ku celcelinnaa?", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Sideen u soo sheegaa maqnaanshaha ilmahayga?", "Fadlan la xiriir xafiiska dugsiga.", "Maalin kasta oo uu maqan yahay ma inaan wacaa?", "Xafiiska ayaa sharixi kara habka dugsiga.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Sideen guriga uga caawin karaa akhriska?", "Tababar gaaban oo joogto ah ayaa caawin kara.", "Buug ku habboon ma soo jeedin kartaa?", "Haa. Aan dooranno mid heerkiisa ku habboon.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Ma markii kuugu horraysay baa kooxdan?", "Haa. Dhowaan ayaan halkan u soo guuray.", "Maxaad jeceshahay inaad samayso waqtiga firaaqada?", "Waxaan jeclahay socodka iyo cunto karinta. Adiguna?", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Waad ku mahadsan tahay martiqaadka. Waan jeclaan lahaa inaan imaado.", "Wanaagsan. Lixda ayaan bilaabaynaa.", "Wax ma inaan keenaa?", "Cunto fudud oo la wadaago ayaa fiicnaan lahayd.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Mahadsanid, laakiin Jimcaha ma iman karo.", "Dhib ma leh. Mar kale ayaa laga yaabaa.", "Waan jeclaan lahaa. Toddobaadka soo socda firaaqo ma leedahay?", "Aan jadwalladeenna hubinno.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Waan ka xumahay inaan daahay. Baskaygii ayaa dib u dhacay.", "Waad ku mahadsan tahay inaad na ogeysiisay.", "Wax muhiim ah ma iga tageen?", "Hordhaca oo keliya. Waan kuu soo koobi karaa.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Dhammaadka toddobaadkan socod ma aadnaa?", "Waa fikrad fiican. Maalintee?", "Axadda subaxdii ma kuu habboon tahay?", "Haa. Aan ku kulanno albaabka beerta.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Maxaad jeceshahay inaad samayso shaqada kaddib?", "Badanaa kubbad ayaan ciyaaraa ama wax ayaan akhriyaa.", "Intee jeer ayaad kubbad ciyaartaa?", "Toddobaadkii hal mar ayaan saaxiibbo la ciyaaraa.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Ma u malaynaysaa inuu roob da’ayo galabta?", "Saadaashu waxay sheegaysaa in roobab gaagaaban dhici karaan.", "Meel gudaha ah ma doorannaa beddelkeeda?", "Fikrad fiican. Matxafka ayaan booqan karnaa.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Subaxdaada caadiga ahi sidee bay u ekaataa?", "Aroor hore ayaan kacaa oo quraac diyaariyaa.", "Shaqada ma safar dheer ayaad u gashaa?", "Maya. Waa safar bas oo gaaban.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Maxaad samaysay shalay?", "Saaxiib ayaan booqday, beertiisana waan ka caawiyay.", "Ma ku raaxaysatay?", "Haa. Shaqadii waan dhammeennay, qadana waan wada cunnay.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Maxaad rajaynaysaa inaad samayso sannadka soo socda?", "Waxaan rabaa inaan qaato koorso tababar.", "Ma dooratay maaddo weli?", "Daryeelka caafimaadka ayaan xiiseeyaa, laakiin weli waan baarayaa.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Ma doorbidaysaa inaan internetka ku kulanno mise fool ka fool?", "Waxaan doorbidayaa inaan fool ka fool u kulanno.", "Sabab gaar ah ma jirtaa?", "Waxaan u arkaa inay ii fududahay inaan hadalka la socdo.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Waxaan moodayay inaan ku heshiinnay inaan Khamiista kulanno.", "Waxaan ula jeeday Talaadada. Waan ka xumahay jahawareerka.", "Taariikhda farriin ma ku xaqiijin karnaa?", "Haa. Faahfaahinta hadda ayaan dirayaa.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Salaan, waa Aamina oo ka soo wacaysa ballanteenna.", "Fadlan farriin reeb codka digniinta kaddib.", "Ma i soo wici kartaa si aad waqtiga u xaqiijiso? Mahadsanid.", "Farriintaada waa la duubay.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Aad ayaan ugu faraxsanahay inaan kula sheekaysto.", "Aniguna waan ku raaxaystay.", "Hadda waa inaan tagaa, laakiin waxaan rajaynayaa inaan mar kale wada hadalno.", "Dabcan. Galab wanaagsan.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."], ["Salaan. Wax yar ma wada hadli karnaa?", "Dabcan. Sideen kuu caawin karaa?", "Dhismaha ma leeyahay albaab aan jaranjaro lahayn?", "Haa. Wuxuu ku yaallaa dhinaca bari.", "Ma ii sheegi kartaa sida aan halkan uga gaaro?", "Raac jidkan, dabadeed midig uga leexo calaamadda weyn agteeda.", "Waad ku mahadsan tahay waqtigaaga.", "Adaa mudan."]];
  function showLesson(i) {
    var l=lessons[i], answers=[], question=0;
    function frame(label) {
      app.innerHTML='<button class="simple-back" id="commBack">← Casharrada / Real-life English</button><p>Casharka / Lesson '+(i+1)+' of '+lessons.length+' · '+label+'</p><h1>'+esc(l[0])+'</h1><p lang="so" class="conversation-translation">'+esc(conversationTitlesSo[i])+'</p>';
      document.getElementById('commBack').onclick=showList;
      window.scrollTo(0,0);
    }
    function button(id,label,fn){var b=document.createElement('button');b.id=id;b.className='simple-primary';b.textContent=label;b.onclick=fn;app.appendChild(b)}
    function study(){
      frame('Wadahadal / Conversation');
      app.insertAdjacentHTML('beforeend','<p lang="so">Akhri oo dhegeyso wada hadalka. Faham macnaha Soomaaliga, dabadeed ku celi Ingiriisiga. Markaad diyaar tahay, bilow imtixaanka.</p><p>'+esc(l[1])+'</p><div id="commDialogue">'+conversations[i].map(function(line,lineIndex){return '<p lang="en">'+esc(line)+'</p><p lang="so" class="conversation-translation">'+esc(conversationsSo[i][lineIndex])+'</p><div class="conversation-audio"><button type="button" class="simple-text-button" data-speak="'+esc(line.slice(3))+'" aria-label="Listen to line '+(conversations[i].indexOf(line)+1)+'">🔊 Listen</button><button type="button" class="simple-text-button" data-speak="'+esc(line.slice(3))+'" data-slow="1" aria-label="Listen slowly to line '+(conversations[i].indexOf(line)+1)+'">Slow listen</button></div>'}).join('')+'</div>');
      bindSpeak(document.getElementById('commDialogue'));
      button('commListen','Dhegeyso wada hadalka / Listen to conversation',function(){speak(conversations[i].map(function(line){return line.slice(3)}).join(' '))});
      button('commListenSlow','Si tartiib ah u dhegeyso / Listen slowly',function(){speak(conversations[i].map(function(line){return line.slice(3)}).join(' '),true)});
      button('commStartTest','Bilow imtixaanka / Start test →',function(){if(window.speechSynthesis)window.speechSynthesis.cancel();answers=[];question=0;quiz()});
      if(i>0)button('commPrevious','← Casharkii hore / Previous lesson',function(){showLesson(i-1)});
    }
    function quiz(){
      frame('Imtixaan / Test · '+(question+1)+' of 2');
      var prompt=question===0?'Buuxi erayga maqan adigoo Ingiriisi ku qoraya / Complete: '+l[3]:'Maxaad Ingiriisi ku odhan lahayd xaaladdan? / What would you say? '+conversationTitlesSo[i];
      app.insertAdjacentHTML('beforeend','<p>'+esc(prompt)+'</p><form id="commForm"><label for="commAnswer">Jawaabtaada oo Ingiriisi ah / Your answer in English</label><input id="commAnswer" required autocomplete="off" maxlength="250"><button class="simple-primary">'+(question===0?'Su’aasha xigta / Next question →':'Eeg natiijada / See results →')+'</button></form>');
      document.getElementById('commForm').onsubmit=function(e){e.preventDefault();answers[question]=document.getElementById('commAnswer').value.trim();if(question===0){question++;quiz()}else results()};
      button('commTestBack','← '+(question?'Su’aashii hore / Previous question':'Dib u eeg wada hadalka (imtixaanku dib ayuu u bilaabmaa) / Review conversation'),function(){if(question){question--;quiz()}else study()});
      document.getElementById('commAnswer').value=answers[question]||'';
    }
    async function results(){
      var correct=norm(answers[0])===norm(l[4]);
      S.communication=S.communication||{};
      var previous=S.communication[i]||{};
      S.communication[i]={date:todayStr(),correct:correct||!!previous.correct,lastCorrect:correct,response:answers[1],attempts:(previous.attempts||0)+1};
      try{await save()}catch(e){frame('Natiijada / Results');app.insertAdjacentHTML('beforeend','<p role="status">Could not save your result. Please retry.</p>');button('commRetrySave','Retry saving',results);return}
      frame('Natiijada / Results');
      app.insertAdjacentHTML('beforeend','<p id="commFeedback" role="status">'+(correct?'Sax! Waa la kaydiyay. / Correct. Saved!':'Waa la kaydiyay. Dib u eeg erayga maqan oo isku day mar kale. / Saved. Review the missing word below and try again.')+'</p><p>Erayga aad qortay / Your missing word: '+esc(answers[0])+'</p><p>Erayga saxda ah / Correct word: <strong>'+esc(l[4])+'</strong></p><p>Jawaabtaada / Your reply: '+esc(answers[1])+'</p><p>Jawaab tusaale ah / Example reply: '+esc(l[2])+'</p><p lang="so">'+esc(conversationsSo[i][conversations[i].findIndex(function(line){return line.slice(3)===l[2]})])+'</p><p lang="so">Jawaabtaada furan si toos ah looma qiimaynayo. Jawaabo kale oo edeb leh ayaa sax noqon kara. Lammaane kula tababar, doorarkana kala beddel. Ku dhawaaqista si toos ah looma qiimaynayo.</p><p>Your free reply is practice, not automatically graded. Other polite replies may also be correct.</p><h2>Speaking challenge</h2><p>Practise the conversation with a partner, taking both roles. Then say your own reply without reading. Pronunciation is not automatically graded.</p>');
      button('commNext',i<lessons.length-1?'Casharka xiga / Next lesson →':'Dhammee · Ku noqo casharrada / Finish',function(){if(i<lessons.length-1)showLesson(i+1);else showList()});
      button('commRetry','← Dib u eeg oo isku day mar kale / Review & retry',study);
    }
    study();
  }
  var home=renderHome,profile=renderProfile;
  function add(){var rows=app.querySelector('.simple-home-content')||app.querySelector('.simple-profile-rows');if(!rows)return;var tutor=document.createElement('button');tutor.id='homeAiTutor';tutor.className='simple-row';tutor.textContent=S.profile.ui==='en'?'AI Tutor · Ask a question':'Macallinka AI · AI Tutor';tutor.onclick=function(){var n=1;while(n<LESSONS.length&&S.completed['L'+n])n++;openLesson(n);var panel=document.getElementById('academyTutor');if(panel){panel.open=true;panel.scrollIntoView({block:'center'});panel.querySelector('textarea').focus()}};rows.insertBefore(tutor,rows.querySelector('.simple-next')||rows.firstChild);var b=document.createElement('button');b.className='simple-row';b.id='communicationLessons';b.textContent='Real-life English · 100 conversation lessons';b.onclick=showList;rows.appendChild(b)}
  renderHome=function(){home();add()};renderProfile=function(){profile();add()};
  if(S&&S.profile&&S.profile.onboarded)render();
})();
/* Personal plan and deliberate speaking practice. Progress remains profile-local. */
(function () {
  var oldHome=renderHome,oldProfile=renderProfile,oldLesson=renderLesson;
  var recorder=null,stream=null,recordingUrl=null,recordTimer=null;
  function tr(so,en){return S.profile.ui==='en'?en:so}
  function make(tag,cls,text){var el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el}
  function action(parent,id,text,fn,primary){var b=make('button',primary?'simple-primary':'simple-row',text);b.type='button';b.id=id;b.onclick=fn;parent.appendChild(b);return b}
  function completed(){return Object.values(S.completed||{}).filter(function(v){return !v.placed}).length}
  function placed(){return Object.values(S.completed||{}).filter(function(v){return v.placed}).length}
  function plan(){return S.learningPlan||{goal:'daily',minutes:10}}
  var goals=[['daily','Nolosha maalinlaha ah','Daily life','greeting|shopping|home|food'],['work','Shaqo iyo waraysiyo','Work & interviews','work|interview|job|meeting'],['study','Waxbarasho','Study & school','school|study|academic|reading'],['travel','Safar','Travel','travel|bus|hotel|airport']];
  function goal(){return goals.find(function(g){return g[0]===plan().goal})||goals[0]}
  function recommendation(){var pattern=new RegExp(goal()[3],'i');return LESSONS.find(function(l){return !S.completed[l.id]&&isUnlocked(l.n)&&pattern.test(l.titleEn)})}
  function goHome(){setNav('home');render();window.scrollTo(0,0)}
  function panel(title){app.innerHTML='';action(app,'coachBack',tr('← Hoyga','← Home'),goHome);app.appendChild(make('h1','',title));window.scrollTo(0,0)}
  function editPlan(){
    panel(tr('Qorshahaaga waxbarashada','Your learning plan'));
    app.appendChild(make('p','simple-intro',tr('Dooro sababta aad Ingiriisiga u baranayso iyo waqtiga aad maalin kasta heli karto.','Choose why you are learning English and a daily time that suits you.')));
    var form=make('form','coach-plan');
    var label=make('label','simple-label',tr('Hadafkaaga','Your goal'));label.htmlFor='coachGoal';form.appendChild(label);
    var select=make('select');select.id='coachGoal';goals.forEach(function(g){var o=make('option','',tr(g[1],g[2]));o.value=g[0];select.appendChild(o)});select.value=plan().goal;form.appendChild(select);
    label=make('label','simple-label',tr('Daqiiqado maalintii','Minutes per day'));label.htmlFor='coachMinutes';form.appendChild(label);
    var minutes=make('select');minutes.id='coachMinutes';[5,10,15,20].forEach(function(n){var o=make('option','',n+' '+tr('daqiiqo','minutes'));o.value=n;minutes.appendChild(o)});minutes.value=plan().minutes;form.appendChild(minutes);
    var saveButton=make('button','simple-primary',tr('Kaydi qorshaha','Save my plan'));saveButton.type='submit';form.appendChild(saveButton);
    var status=make('p');status.setAttribute('role','status');form.appendChild(status);
    form.onsubmit=async function(e){e.preventDefault();S.learningPlan={goal:select.value,minutes:Number(minutes.value)};saveButton.disabled=true;try{await save();goHome()}catch(err){status.textContent=tr('Kaydintu way fashilantay. Mar kale isku day.','Could not save. Please try again.');saveButton.disabled=false}};
    app.appendChild(form);action(app,'coachPlacement',tr('Heerkayga ogow · Imtixaanka meelaynta','Find my level · Placement test'),function(){plBegin('profile')});
  }
  function progress(){
    panel(tr('Horumarkaaga dhabta ah','Your learning progress'));
    var rows=[[completed(),tr('cashar oo aad dhammaysay','lessons completed by you')],[placed(),tr('cashar oo meelayntu kaa dhaaftay','lessons skipped through placement')],[Object.values(S.communication||{}).filter(function(v){return v.correct}).length,tr('layli wada hadal oo eraygiisa saxday','conversation gap-fill activities answered correctly')],[(S.dictionarySaved||[]).length,tr('eray oo aad kaydsatay','saved dictionary words')]];
    rows.forEach(function(r){var item=make('div','coach-stat');item.appendChild(make('strong','',String(r[0])));item.appendChild(make('span','',r[1]));app.appendChild(item)});
    app.appendChild(make('p','simple-intro',tr('Tirooyinkani ma caddeeyaan heerka hadalkaaga. Ku tababar dhegeysi, hadal, akhris iyo qoraal.','These counts do not certify speaking ability. Practise listening, speaking, reading and writing.')));
    app.appendChild(make('p','simple-device-note',tr('Horumarkaagu wuxuu ku kaydsan yahay biraawsarkan iyo aaladdan. Boggaaga → Dejimo kale → Kaydi ama soo celi horumarka si aad nuqul u hesho. Weli ma jiro akoon isku xira aaladaha.','Progress is saved in this browser on this device. Use Profile → More settings → Save or Restore Progress for a backup. Cross-device accounts are not available yet.')));
    action(app,'coachReview',tr('Ku celceli erayada u baahan dib u eegis','Review words that are due'),function(){setNav('review');render()});
  }
  function stopTracks(){if(stream){stream.getTracks().forEach(function(t){t.stop()});stream=null}clearTimeout(recordTimer)}
  function cleanup(){if(recorder&&recorder.state!=='inactive')recorder.stop();stopTracks();if(recordingUrl){URL.revokeObjectURL(recordingUrl);recordingUrl=null}}
  function speaking(){
    panel(tr('Tababarka hadalka','Speaking studio'));
    app.appendChild(make('p','simple-intro',tr('Dhegeyso, ku celi, dabadeed codkaaga dib u dhegeyso. Duubistu kuma baxdo aaladdan, mana aha qiimayn ku dhawaaqis.','Listen, repeat, then replay your voice. Recordings stay on this device and are not pronunciation scores.')));
    var phrases=['Could you say that again, please?','I would like to book an appointment.','Could you help me understand this?'];
    var translations=['Mar kale ma dhihi kartaa, fadlan?','Waxaan rabaa inaan ballan qabsado.','Ma iga caawin kartaa inaan tan fahmo?'];
    phrases.forEach(function(text,i){var p=make('section','coach-phrase');p.appendChild(make('p','',text));p.appendChild(make('p','conversation-translation',translations[i]));action(p,'coachListen'+i,tr('Dhegeyso si tartiib ah','Listen slowly'),function(){speak(text,true)});app.appendChild(p)});
    var controls=make('section','coach-recorder');var status=make('p');status.setAttribute('role','status');
    var record=action(controls,'coachRecord',tr('🎙 Duub codkaaga','🎙 Record your voice'),async function(){
      record.disabled=true;
      try{
        if(!navigator.mediaDevices||!window.MediaRecorder)throw new Error('unsupported');
        stream=await navigator.mediaDevices.getUserMedia({audio:true});
        if(!controls.isConnected){stopTracks();return}
        if(recordingUrl){URL.revokeObjectURL(recordingUrl);recordingUrl=null}audio.removeAttribute('src');
        var chunks=[];recorder=new MediaRecorder(stream);recorder.ondataavailable=function(e){if(e.data.size)chunks.push(e.data)};
        recorder.onstop=function(){stopTracks();if(controls.isConnected){recordingUrl=URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType}));audio.src=recordingUrl;audio.hidden=false;record.disabled=false;stop.disabled=true;status.textContent=tr('Dib u dhegeyso codkaaga oo tusaalaha la barbar dhig.','Replay your voice and compare it with the example.')}};
        recorder.start();stop.disabled=false;status.textContent=tr('Duubis ayaa socota · ugu badnaan 60 ilbiriqsi.','Recording · maximum 60 seconds.');recordTimer=setTimeout(function(){if(recorder.state!=='inactive')recorder.stop()},60000);
      }catch(e){stopTracks();record.disabled=false;status.textContent=tr('Makarafoon lama heli karo. Oggolow makarafoonka ama ku tababar adigoo cod dheer ku hadlaya.','Microphone unavailable. Allow microphone access or practise aloud without recording.')}
    },true);
    var stop=action(controls,'coachStop',tr('■ Jooji duubista','■ Stop recording'),function(){if(recorder&&recorder.state!=='inactive')recorder.stop()});stop.disabled=true;
    var audio=make('audio');audio.controls=true;audio.hidden=true;audio.setAttribute('aria-label',tr('Codkaaga duuban','Your recording'));controls.appendChild(audio);controls.appendChild(status);app.appendChild(controls);
  }
  // Stop recording when leaving the studio, including primary navigation.
  new MutationObserver(function(){if(!document.getElementById('coachRecord'))cleanup()}).observe(app,{childList:true});
  window.addEventListener('pagehide',cleanup);
  function enhance(){
    var home=app.querySelector('.simple-home-content');if(!home)return;
    var subtitle=home.querySelector('.simple-intro');if(subtitle)subtitle.textContent=tr(goal()[1],goal()[2])+' · '+plan().minutes+' '+tr('daqiiqo maalintii','minutes a day');
    var section=make('section','coach-today');var d=completed(),milestone=Math.floor(d/10)*10;
    section.appendChild(make('h2','',tr('Tallaabadaada maanta','Your practice today')));
    section.appendChild(make('p','',tr('Hal cashar baro, erayadii hore ku celi, dabadeed hal daqiiqo cod dheer ku hadal.','Learn one lesson, review earlier words, then speak aloud for one minute.')));
    action(section,'coachSpeaking',tr('Ku tababar hadalka','Practise speaking'),speaking);
    action(section,'coachPlan',tr('Hagaaji qorshahayga','Adjust my learning plan'),editPlan);
    action(section,'coachProgress',tr('Eeg horumarkayga','See my progress'),progress);
    if(milestone>0)section.appendChild(make('p','coach-milestone',tr('Waad dadaashay! Waxaad dhammaysay '+d+' cashar.','Well done! You have completed '+d+' lessons.')));
    var recommended=recommendation();if(recommended)action(section,'coachRecommended',tr('Hadafkaaga ku habboon: ','For your goal: ')+(S.profile.ui==='en'?recommended.titleEn:recommended.titleSo),function(){openLesson(recommended.n)});
    home.appendChild(section);
  }
  renderHome=function(){oldHome();enhance()};
  renderProfile=function(){oldProfile();var rows=app.querySelector('.simple-profile-rows');if(rows){action(rows,'profileCoachPlan',tr('Qorshahayga waxbarashada','My learning plan'),editPlan);action(rows,'profileCoachProgress',tr('Waxaan bartay','What I have practised'),progress);action(rows,'profileCoachSpeaking',tr('Tababarka hadalka','Speaking studio'),speaking)}};
  if(S&&S.profile&&S.profile.onboarded)render();
})();
