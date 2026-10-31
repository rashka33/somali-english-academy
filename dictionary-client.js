/* Live English dictionary. No keys, accounts, or learner data are sent. */
(function (root) {
  'use strict';
  var key = 'sea-dictionary-cache-v1';
  var memory = {};
  function safeURL(value) {
    try { var u = new URL(value); return u.protocol === 'https:' ? u.href : ''; }
    catch (_) { return ''; }
  }
  function valid(entries) {
    return Array.isArray(entries) && entries.length > 0 && entries.every(function (e) {
      return e && typeof e.word === 'string' && Array.isArray(e.meanings) && e.meanings.some(function (m) {
        return m && Array.isArray(m.definitions) && m.definitions.some(function (d) { return d && typeof d.definition === 'string'; });
      });
    });
  }
  function readCache() {
    try {
      var parsed = JSON.parse(root.localStorage.getItem(key) || '{}');
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch (_) {}
    return memory;
  }
  function store(word, entries) {
    var cache = readCache();
    cache[word] = { entries: entries, time: Date.now() };
    var words = Object.keys(cache).sort(function (a, b) { return cache[b].time - cache[a].time; }).slice(0, 80);
    memory = {};
    words.forEach(function (w) { memory[w] = cache[w]; });
    try { root.localStorage.setItem(key, JSON.stringify(memory)); } catch (_) {}
  }
  function plain(value) {
    return String(value || '').replace(/<[^>]*>/g, '').replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g, function (s) {
      return { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&nbsp;': ' ' }[s];
    });
  }
  async function lookup(query, options, language) {
    var word = String(query || '').trim().toLowerCase();
    if (!word || word.length > 100) return { status: 'invalid', entries: [] };
    var cacheKey = language === 'so' ? 'so:' + word : word;
    var cache = readCache()[cacheKey];
    var controller = new AbortController();
    var signal = options && options.signal;
    function cancel() { controller.abort(); }
    if (signal) { if (signal.aborted) cancel(); else signal.addEventListener('abort', cancel, { once: true }); }
    var timer = setTimeout(cancel, 9000);
    try {
      var url = language === 'so' ? 'https://en.wiktionary.org/api/rest_v1/page/definition/' + encodeURIComponent(word) : 'https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(word);
      var response = await root.fetch(url, { signal: controller.signal });
      if (!response.ok) {
        if (response.status === 404) return { status: 'not-found', entries: [] };
        throw new Error('Dictionary unavailable');
      }
      var entries = await response.json();
      if (language === 'so') {
        if (!entries || typeof entries !== 'object' || Array.isArray(entries)) throw new Error('Invalid Somali response');
        if (!Array.isArray(entries.so) || !entries.so.length) return { status: 'not-found', entries: [] };
        entries = [{ word: word, language: 'so', phonetics: [], meanings: entries.so.map(function (m) {
          return { partOfSpeech: m.partOfSpeech, definitions: (Array.isArray(m.definitions) ? m.definitions : []).filter(function (d) { return d && typeof d.definition === 'string'; }).map(function (d) {
            return { definition: plain(d.definition), example: Array.isArray(d.examples) && d.examples.length ? plain(d.examples[0]) : '' };
          }) };
        }), sourceUrls: ['https://en.wiktionary.org/wiki/' + encodeURIComponent(word) + '#Somali'], license: { name: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/' } }];
      }
      if (!valid(entries)) throw new Error('Invalid dictionary response');
      store(cacheKey, entries);
      return { status: 'success', entries: entries, cached: false };
    } catch (_) {
      if (signal && signal.aborted) return { status: 'cancelled', entries: [] };
      if (cache && valid(cache.entries)) return { status: 'success', entries: cache.entries, cached: true };
      return { status: 'unavailable', entries: [] };
    } finally {
      clearTimeout(timer);
      if (signal) signal.removeEventListener('abort', cancel);
    }
  }
  root.AcademyDictionary = { lookup: lookup, lookupSomali: function (query, options) { return lookup(query, options, 'so'); }, safeURL: safeURL };
})(window);
