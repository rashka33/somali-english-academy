# Somali English Academy

Static, installable English-learning app with Somali guidance. Serve this folder over HTTP; no build step is required. Core lessons and dictionary need no API key. The optional AI tutor uses a private Gemini backend; see tutor-worker/README.md.

## Dictionary and interface upgrade

- English entries: [Free Dictionary API](https://dictionaryapi.dev/), with pronunciation audio where provided, definitions, examples, source links and returned license attribution.
- Somali entries: [Wiktionary REST definitions](https://en.wiktionary.org/api/rest_v1/page/definition/biyo), using only the `so` language section and linking to the original entry under CC BY-SA 4.0. Meanings are in English; Somali pronunciation is not synthesized using an English voice.
- The existing English/Somali course vocabulary remains searchable offline. Exact Somali course matches can open the corresponding English headword alongside the Somali live lookup.
- Search is explicit: typing filters local vocabulary; submitting Search contacts the dictionary services. These requests include the searched word, not the learner profile.
- Up to 80 successful lookups across both providers are cached on the device. Saved words belong to the existing learner profile and are included in its normal export/import. Storage availability and provider coverage vary.
- Clear result, loading, not-found and unavailable states; cancellable requests with a nine-second timeout per provider.
- A simpler home screen shows the next lesson, daily goal, a ten-lesson list, a unit picker covering the curriculum, and a dictionary shortcut. Existing curriculum, unlock rules and learner state are preserved.
- Shared colors and controls honor the learner's light/dark and large-text preferences. New application files are included in the offline shell.

The UI concept was adapted to the real curriculum and existing header controls: no new logo or notifications feature, actual provider attribution instead of the illustrative concept's Cambridge label, bilingual control labels, and a sidebar on desktop.

## Run locally

```sh
python -m http.server 8000
```

Open `http://localhost:8000`. Production service workers require HTTPS (localhost is supported for development).

## Verification

Node 22+:

```sh
node --test --test-isolation=none tests/dictionary.test.cjs
```

With Playwright and Chromium installed in your development environment:

```sh
node tests/ui.cjs
```

Set `CHROMIUM_PATH` if using a system Chromium. The browser test serves the app on an ephemeral localhost port, seeds a test learner, and replaces external dictionary requests with deterministic fixtures; no personal data or production learner state is modified. It checks English and Somali results, offline fallback, saved words across reload, missing words, provider errors, navigation, dark mode, and a narrow viewport with large text. Screenshots go to `/tmp`, outside the repository. This does not replace checking live provider availability or audio on a physical phone.

## Publish

Publish all application files together, including `academy-ui.css`, `academy-ui.js`, `dictionary-client.js`, and the updated `sw.js`. The service-worker cache version must change when publishing a new build. Existing progress remains in the original `zamzam-academy` IndexedDB database.

## Minimal interface

Three destinations: Home, Dictionary, Profile. Home offers Continue learning and a separate lesson browser. Settings, saved words and detailed progress live in Profile. First-run setup asks only an optional name. UI language can be Somali or English; learning content remains bilingual. The optional lesson tutor sends only lesson context and an explicit question to the configured backend. AI responses may be inaccurate.

## Daily and conversation practice

Home and Profile offer a compact learning-tools section: placement test, AI tutor shortcut, due-word review, a rotating daily vocabulary word, and seven practical study tips. One hundred real-life conversation lessons supplement the 1,000 core lessons (1,100 total lesson activities). Each adds a model phrase, audio, gap-fill feedback and an ungraded speaking challenge. Correct answers persist in the learner's `communication` state; they do not inflate core course mastery or certify speaking fluency. Storage is local to the device, not a cloud account.

Conversation lessons now separate an eight-turn study dialogue, a two-question test and a results screen. Study text and listening controls are removed from the test DOM. Results reveal the example only after submission, save attempts, and offer Next lesson and Review controls. Free replies are not automatically graded. AI Tutor has an always-visible shortcut on Home and Profile.
