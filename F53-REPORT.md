# F53 report — "One Design System"

Build folder: `~/Projects/sea-f53`, served at http://127.0.0.1:8778/ (server left running).
Base: live `sea-f52-lean`, fetched fresh and byte-identical to GitHub `main` (`79587dc`). Markers verified before editing: `INSTR_UP_TO=100`, `HINTS_UP_TO`, cache `sea-f52-lean`.
Nothing was committed or pushed to GitHub. Local git only.

| Stage | Commit | Result |
|---|---|---|
| baseline (live files) | `5eaaffe` | — |
| 1 file split | `3e61ca5` | done |
| 2 design system | `0533ee3` | done |
| 3 language & moments | `ef3045c` | done |
| 4 craft | `85f042c` | done |

Never touched: `audio/` and `audio/index.json` (0 diff lines), the service-worker cache name (still `sea-f52-lean`), lesson/exercise/question data, the hint button, `speak()` / `lookupAudioClip`, storage keys (no key removed or renamed).

## How it was checked (every stage)
- Full browser suite `tests/ui.cjs`: passes (expectations updated only where behaviour changed on purpose, listed below).
- Unit tests: `tests/placement.test.cjs` 6/6 (live had 2/6 — see Stage 1), `tests/dictionary.test.cjs` 7/7.
- All 1,000 lessons open; every section of 11 sample lessons renders; no page errors.
- Hint button shows a hint; the Somali instruction voice plays through the recorded-clip route (`media`); Citizenship, Forms, GED, Play load.
- Offline: service worker caches 35 files; reload with the network off loads the app with all 1,000 lessons and opens a lesson.
- 375 px and 390 px, light and dark: no horizontal overflow on ~30 screens. Desktop checked at 1440 px.

---

## Stage 1 — file split (done, `3e61ca5`)
Plumbing only. Verified **pixel-identical on 29 screens in light and dark** (same screenshots, same text) against the live build.

Files created / removed:
- `academy.html` 1,223,464 B → **8,735 B shell** (head, the existing body markup, script tags in the original order).
- New `app/` modules, in load order: `core.js` (helpers, voice playback), `lessons.js` (lesson data and builders), `learn.js` (state, views, lesson player, review, practice, profile), `speaking.js` (role-plays, sounds, flowcharts, dictionary), `academies.js` (Forms + GED), `extras.js` (later stages F–J), `init.js`, then the seven former inline scripts as `home-legacy.js`, `placement.js`, `design.js`, `daily-life.js`, `icons.js`, `watch.js`, `tap-word.js`.
- **One stylesheet:** `academy.css` = the 6 inline style blocks + `academy-ui.css` + `academy-theme.css`, concatenated in the original cascade order. Removed: `academy-ui.css`, `academy-theme.css`, `welcome.css` (unused since f52). `about.html` now uses `academy.css`.
- `sw.js` CORE list updated for the new/removed files (cache name untouched).

Dead layers removed (academy-ui.js replaces these outright): the legacy `renderHome`, `renderDict`, `renderOnboarding`, `lRenderHome` and 15 wrappers around them; then 23 function declarations that nothing references anywhere (checked as whole words across every shipped file): speakGreeting, skillMasteredCounts, vocabMastered, placementHTML, smartHomeHTML, visualHubHTML, wireVisualHub, notesHTML, wireNotes, renderFullDict, renderMindMaps, gedSetView, stageFHome, renderDictSearch, lJourneyHTML, lBindJourney, sndNoteHTML, epKey, isMasteredKey, fullMatches, dictHeroHTML, wireDictHero, dictEntryCard.

Developer comments ("Round 5", "sea-f12 diagnostics", stage tags) stripped from all shipped JS, CSS and HTML with a parser (cannot change meaning). Remaining `sea-f13…` strings are storage keys and must stay.

Could not split further safely: lesson data and the functions that build it stay together in `lessons.js` (252 KB); GED data stays inside `academies.js` (307 KB). Separating them needs a load-order refactor, not plumbing.

Test harness fixes: `tests/ui.cjs` was still the pre-f52 version on live (my f52 update was never published) — replaced with the f52 version. `tests/placement.test.cjs` read code from academy.html's inline scripts; it now reads the `app/` files in load order. It also failed 4/6 on live because a stub (`renderWatch`) was missing from its sandbox; added, now 6/6.

## Stage 2 — one design system (done, `0533ee3`)
- **Inline styles:** 452 → 28. Every static style became a token-based class (one spacing scale, one type scale). The 28 left are data-driven values only: progress-bar widths, map/scene positions, user-chosen avatar colours, two animation-timing variables.
- **Emoji → line icons:** 255 UI emoji in markup replaced at the source by the app's own icon set (`uiIcon`), 16 celebratory emoji dropped; a DOM pass maps any remaining UI emoji to the same icons instead of deleting them. The icon set moved to `core.js` and gained 30 drawn icons (waveform, cap, calculator, pen, people, puzzle, mail, calendar, clipboard, ID, alert, repeat, bulb, target, slow, chat, headphones, tools, chart, bell, save, pin, flask, camera, music, info, pause, down, grid and the Somali star).
- **One palette:** 98 hard-coded legacy colours mapped onto the tokens; the dark-navy Profile/Practice skin from an old build removed. That skin also caused a live bug — Practice-hub headings and the top-bar title were near-invisible (light text on paper) — fixed.
- **One radius (12 px), one shadow, one type scale:** 102 radii, 28 shadows (hard offset "3D" button shadows removed), 110 font sizes snapped to tokens.
- **Welcome:** headline 800 weight → designed scale (700 then 600 in Stage 4, `clamp(2.25rem, 8vw, 3.25rem)`), rounded-square icon tiles removed (plain line icons), desktop list no longer a card grid.
- **Concept direction:** journey-road Home (the 12 stages as a winding road, the Somali star marks where you are, current and next stops shown, "show all" opens the rest); waveform motif on every voice button; the lesson's spoken Somali instruction is now the centre of each exercise — a full-width voice bar with a waveform that moves only while the voice plays; Home's lesson card has a voice preview of the lesson's first sentence. The woven band stays as the identity thread.
- Practice hub tile grid and dark review bar rebuilt as plain list rows; form list emoji replaced.

## Stage 3 — one language, one moment, clear product (done, `ef3045c`)
- **SO/EN controls everything:** 460 "Somali / English" labels now show one language (`lng()`), plus 15 runtime label joins and the Academies tabs. The tool checked which half is Somali (11 labels were written English-first and were swapped into place) and skipped anything that is not a label: lesson content, "iPhone / iPad", sentences split by an icon. 10 slash lines remain on screen, all deliberate (see "Left as is").
- **One result screen:** the old "Waad gudubtay" card, the camel mascot with its quote, the XP pill, the gold sweep animation and my f52 "Waad dhammeysay" panel are merged into one screen — score (exercises, quiz, streak), the words learned with the English marked as the thing learned, one primary next step. Bottom bar hidden there so actions are not doubled.
- **XP:** removed from view (lesson result and Home). Kept: the streak. XP is still counted and explained in Profile → settings, nothing deleted.
- **Home = Continue, Review, the journey road.** Everything else moved to a new **More** page (new tab, replacing the Citizenship tab), grouped Lessons / Prepare / Practice / Help, each with an honest status: Full course (lessons, Real-life English, Citizenship), Practice only (Forms, practice studio, games), GED's own line, video count for Watch. AI tutor, coach plan/progress/speaking studio and daily tools remain in Profile (and the tutor in More).
- Desktop: Home and More get designed two-column layouts (Stage 4).

## Stage 4 — craft (done, `85f042c`)
- Loading skeleton instead of "Loading…" text; a load failure now says what happened and what to do, with a working Try again (the loader forgets a failed load).
- Empty Review: icon, "No words to review yet — finish Lesson N", and a button that opens that lesson.
- One entrance transition (180 ms fade/rise on screen change, off for reduced motion). Removed looping/bouncy motion: mascot blink/nod/sway/breathe, pulses, glows, shimmer, confetti, pop/bounce keyframes. Kept: the waveform while speaking, the grammar teaching animations, wrong-answer shake.
- Themed text selection, caret, focus ring, thin scrollbar; tabular numbers in counts; uppercase tracked labels → sentence case; weights capped at 600.
- Designed desktop: Home two columns (lesson + review left, journey road pinned right), More two columns; topbar widens with them.
- Content tells: lesson header no longer "Cashirka 1: English title" over a mixed "· English — Somali" line — now the title in one language with "Casharka 1 · stage" below; episode labels "Cashar N / Episode N" → "Muuqaal N" / "Episode N" (no longer reusing the word for lesson); Watch shelf no longer repeats each title in the other language; three trust pills → two; English exclamation marks removed from 19 interface strings; "Build: sea-f15" → "Last updated: 2026-11-20".
- Generic encouragement rewritten in plain, specific English (Somali pairs flagged below).
- **About page rebuilt** (`about.html`): owner's real story from the existing page, a Soomaali/English switch, how the voice was made (honest wording), last-updated date, a short "What's new". Reviewer credit and testimonials are hidden placeholder sections (see Placeholders). Linked from More → Help.

---

## Strings changed — hand-written (old → new)
English rewrites (Somali paired string kept, flagged):
- "Today we learn words and sentences you can use in real life. Listen first, then say them out loud. Do not worry about mistakes — mistakes help you learn." → "This lesson teaches words and sentences for everyday use. Listen to each one, then say it out loud. Anything you get wrong goes to your review list." (Somali and English no longer shown together.)
- "You got it on another try — well done!" → "Correct on another try."
- Feedback praise: "Excellent!" → "Correct." · "You got it!" → "That is right." · "Great work!" → "Correct answer." · "You are learning!" → "Right — that word is in your review list now." · "Keep going, you can do it!" → "Correct. On to the next one."
- Greetings: "Welcome! One small step today." → "Welcome back. Your next lesson is open." · "Hello! Your lesson is waiting for you." → "Hello. Pick up where you stopped." · "Good day! New words are waiting for you." → "Good day. Your next lesson has new words."
- "Try again — you can do it! The answer is not shown yet." → "Not yet. Try again — the answer stays hidden until you find it."
- "I am proud of you!" → "You passed this lesson."
- Citizenship: "You are on your way. A little every day." → "You know some answers. Study a few new cards each day." · "You are close. Keep going!" → "You know most answers. Review the cards you missed." · "You are ready. Be proud of yourself." → "You know 90% or more. Practise the interview next."
- "Well done! You have completed N lessons." → "You have completed N lessons."
- "A little practice, every day." → "Short lessons, saved on this device." · "Your learning, your pace." → "Progress saves on this device."
- "This section could not load. Please try again." → "This section did not load." + "It needs an internet connection the first time. Check your connection, then try again." + button "Try again".
- "Real-life English · 100 conversation lessons" → SO "100 cashar wada hadal ah" / EN "Real-life English · 100 conversation lessons"; its page title "Real-life English" → SO "100 cashar wada hadal ah"; "← Home" → "← Wax kale / More"; "Casharka / Lesson N of M" → "Casharka N ka mid ah M" / "Lesson N of M".
- Review: "Wali kaarar ma jiraan…" + "Tag Jidka" → title "Wali kaarar ma jiraan" / "No words to review yet", text / "Finish Lesson N and its words will appear here for review.", button "Bilow Casharka N" / "Start Lesson N" (opens that lesson). Nothing-due and due-count lines given English versions.
- Lesson result: see Stage 3; English "You passed!" → "You passed", "Finish & go Home ✓" → "Dhammee & tag Hoyga" / "Finish and go home", "Try again".
- Lesson header: "Cashirka N: <English title>" + "<Somali title> · <stage EN — stage SO>" → "<title in current language>" + "Casharka N · <stage in current language>".
- Video labels: "Cashar N / Episode N" → "Muuqaal N" / "Episode N"; "Nolosha Maalinlaha N / Daily Life N" → one language.
- Welcome trust pills: "Bilaash" + "Akoon looma baahna" + "Horumarku aaladdaada ayuu ku kaydsan yahay" → "Bilaash · akoon looma baahna" + "Horumarku aaladdaada ayuu ku kaydsan yahay".
- Profile settings: "Build: sea-f15" → "La cusboonaysiiyay / Last updated: 2026-11-20".
- Navigation: tabs "Hoyga, Ku celceli, Jinsiyadda, Boggaaga" → "Hoyga, Ku celceli, Wax kale, Boggaaga" (EN: Home, Review, More, Profile).
- Home: section and rows from f52 removed from Home (now on More); new link "Wax kale: jinsiyadda, foomamka, GED, muuqaallo, ciyaar" / "More: citizenship, forms, GED, videos, games"; journey heading "Safarkaaga · 12 marxaladood" → "Safarkaaga" / "Your journey", toggle "Muuji dhammaan 12-ka marxaladood" / "Show all 12 stages" and "Muuji wax yar" / "Show less".
- More page (all new): title "Wax kale" / "More"; groups "Casharro", "Diyaargarow", "Tababar", "Caawimaad" (Lessons, Prepare, Practice, Help); rows and subtitles in the list of new strings below; status chips "Koorso buuxda" / "Full course", "Tababar keliya" / "Practice only", "N muuqaal" / "N videos".
- Watch shelf: GED subtitle "GED · <other-language title>" → "GED Xisaab · cashar muuqaal ah" / "GED Math · video lesson"; English picks now show their lesson range instead of the title again.
- 19 English interface strings lost a trailing "!" (e.g. "Correct!", "You passed!", "Time is up!").
- `about.html`: rebuilt (content reused from the existing page; new headings and sections listed under the review queue).

## Somali review queue (for the owner's native-Somali track)
**New Somali I had to coin for new elements** (please correct the phrasing):
- Nav / More: "Wax kale", "Diyaargarow", "Caawimaad", "Koorso buuxda", "Tababar keliya", "N muuqaal", "Wada hadallo dhab ah oo leh tarjumaad Soomaali", "Tababar hadal iyo qoraal", "Doorka-ciyaar iyo tababarro gaagaaban", "Ingiriisi iyo Soomaali, erayo cod leh", "Yaa sameeyay iyo sababta", "Ku saabsan" (as a row label)
- Home: "Wax kale: jinsiyadda, foomamka, GED, muuqaallo, ciyaar", "Muuji dhammaan 12-ka marxaladood", "Muuji wax yar"
- Titles: "100 cashar wada hadal ah" used as the Somali title for Real-life English (taken from the existing intro sentence)
- Labels: "Muuqaal N" (video episode), "GED Xisaab · cashar muuqaal ah", "Bilow Casharka N", "Casharka N ka mid ah M", "La cusboonaysiiyay", "Bilaash · akoon looma baahna" (two existing pills joined)
- Lesson: "Taabo taayirrada siday u kala horreeyaan." (split out of a mixed sentence)
- About page: "Waxaa sameeyay Abdirashid Abdullahi Abi, Salt Lake City, Utah.", "Waa maxay Somali English Academy?", "Yaa sameeyay?", "Yaa loogu talagalay?", "Su’aalo", "Ma bilaash baa?", "Ma ku shaqeeyaa internet la’aan?", "Ma ka caawiyaa imtixaanka jinsiyadda?", "Maxay kaga duwan tahay Duolingo?", "Waxa cusub", "La cusboonaysiiyay"; heading "Cod Soomaali ah — af-Soomaali, waa la hubiyay" (owner's suggested wording)
- **English-only, needs a Somali version:** About → "How the voice was made" paragraph; About → "What's new" list (both currently shown in English in both modes).

**Somali generic encouragement — English pair rewritten, Somali untouched, please review:** "Waad saxday isku-day kale — shaqo wacan!", "Aad baad u fiican tahay!", "Sax, waad heshay!", "Shaqo wacan!", "Waad sii baranaysaa!", "Sii wad, waad awooddaa!", "Ku soo dhawoow! Maanta hal tallaabo oo yar.", "Salaam! Cashirkaaga waa ku sugayaa.", "Maalin wanaagsan! Erayo cusub baa ku sugaya.", "Isku day mar kale — waad awooddaa!", "Aad baan kuugu faanayaa!", "Si fiican ayaad u socotaa. Maalin kasta wax yar.", "Waad ku dhowdahay. Sii wad!", "Waad diyaarsan tahay. Ku faan naftaada.", "Waad dadaashay! Waxaad dhammaysay N cashar.", "Tababar yar, maalin kasta.", "Wax ku baro xawaarahaaga.", the lesson intro ending "Khaladaadku ha ku welwelin — khaladku wuu ku baraa."

**Somali strings that still end in "!"** (left as written): e.g. "Waad gudubtay!", "Ku dhawaaday!", "Sax!" — the English pairs no longer use "!".

## Placeholders left
- `about.html`: `<section hidden data-placeholder="reviewer-credit">` — names of the Somali speakers who checked the voice and lessons. Hidden, not shown to visitors. Never publish invented names.
- `about.html`: `<section hidden data-placeholder="testimonials">` — real learner quotes with permission only. Hidden.
- About → "How the voice was made" states the content "was checked by Somali speakers" (the wording the mission specified). Please confirm before publishing.

## Tests changed (`tests/ui.cjs`), each to current intended behaviour
Five welcome doors and their order; Bilow opens a saved Lesson 1; placement skip lands on "Continue learning"; nav = Home, Review, More, Profile; Baro AI tested on `baro-ai.html`; Home doors = Review only, journey road marks the current stage; More shows GED's honest line and status chips; Dictionary/Play/Watch/Lessons/Real-life English reached via More; AI tutor via More and Profile; coach plan/progress/speaking studio via Profile; empty Dictionary search shows next-lesson words; two trust pills; no XP and no slash label on Home. `tests/placement.test.cjs`: reads `app/` modules; sandbox stub added.

## Left as is, and why
- **Picture emoji inside lessons** (picture dictionary, exercise pictures — `VIS_EMOJI`) are lesson content, not UI icons, so they stayed. They are now the most visible "AI" tell left; a single illustrated picture set would fix it.
- 10 slash lines on screen: form names where "/" means "or" ("electric / water"), Forms list names shown in English (the English form name is the thing to recognise), the dialogue speaker label "Teacher / Macallin" (lesson data). About 30 bilingual sentences that run across an icon or a number were skipped by the tool to avoid breaking them; they are in Forms/GED/placement detail text.
- GED subject names show in English (official names) with the Somali name under them.
- `academy.css` is one file but still layered internally (≈186 KB); a full rewrite was out of scope.
- `lessons.js` and `academies.js` keep data and logic together (see Stage 1).
- Detector scores (Jev Slop Detector, LandingBoost) cannot be measured until the build is live; not run.

---

## Appendix — the 460 slash labels converted (old → shown now)
Each old label "A / B" now shows only the Somali half in SO mode and only the English half in EN mode.

| File | Old label | SO shows | EN shows |
|---|---|---|---|
| academy-ui.js | Casharrada / Lessons | Casharrada | Lessons |
| academy-ui.js | Casharrada / Real-life English | Casharrada | Real-life English |
| academy-ui.js | Casharro muuqaal ah / Video lessons | Casharro muuqaal ah | Video lessons |
| academy-ui.js | Dhammee / Finish | Dhammee | Finish |
| academy-ui.js | Dib / Back | Dib | Back |
| academy-ui.js | Exercises / Layliyo | Layliyo | Exercises |
| academy-ui.js | Foomamka / Forms | Foomamka | Forms |
| academy-ui.js | Horumarkaaga / Your progress | Horumarkaaga | Your progress |
| academy-ui.js | Hoyga / Home | Hoyga | Home |
| academy-ui.js | Ingiriisi ama Soomaali / English or Somali | Ingiriisi ama Soomaali | English or Somali |
| academy-ui.js | Jinsiyadda / Citizenship | Jinsiyadda | Citizenship |
| academy-ui.js | Ku saabsan / About | Ku saabsan | About |
| academy-ui.js | Magacaaga / Your name | Magacaaga | Your name |
| academy-ui.js | daqiiqo maalintii / minutes a day | daqiiqo maalintii | minutes a day |
| app/academies.js | App-ku ma qiimeeyo maqaalkaaga — ma aha dhibic rasmi ah. Liiskan isku hubi. / The app does not grade your essay — this is not an official score. Check yourself with this rubric. | App-ku ma qiimeeyo maqaalkaaga — ma aha dhibic rasmi ah. Liiskan isku hubi. | The app does not grade your essay — this is not an official score. Check yourself with this rubric. |
| app/academies.js | Badhamadan taabo marka aad shay hubiso — waxay ku kaydsan yihiin boggaaga. / Tap a button when you have checked that item — saved in your profile. | Badhamadan taabo marka aad shay hubiso — waxay ku kaydsan yihiin boggaaga. | Tap a button when you have checked that item — saved in your profile. |
| app/academies.js | Baro kaararka / Study flashcards | Baro kaararka | Study flashcards |
| app/academies.js | Bilow hubinta bilowga / Start the diagnostic | Bilow hubinta bilowga | Start the diagnostic |
| app/academies.js | Bilow imtixaanka tababar / Start the practice exam | Bilow imtixaanka tababar | Start the practice exam |
| app/academies.js | Bilow imtixaanka tijaabada / Start the mock exam | Bilow imtixaanka tijaabada | Start the mock exam |
| app/academies.js | Bilow tababarka / Start practice | Bilow tababarka | Start practice |
| app/academies.js | Calaamadee in la dhammeeyay / Mark as done | Calaamadee in la dhammeeyay | Mark as done |
| app/academies.js | Cashirro / Lessons: | Cashirro | Lessons: |
| app/academies.js | Cashirro yaryar / Mini-lessons | Cashirro yaryar | Mini-lessons |
| app/academies.js | Cusub / New | Cusub | New |
| app/academies.js | Dhammaan qiimayaasha aad u baahantahay halkan bay ku qoran yihiin. / Every value you need is written here. | Dhammaan qiimayaasha aad u baahantahay halkan bay ku qoran yihiin. | Every value you need is written here. |
| app/academies.js | Dhammee oo arag natiijada / Finish and see results | Dhammee oo arag natiijada | Finish and see results |
| app/academies.js | Dherer tababar — wuu ka gaaban yahay imtixaanka dhabta ah. / Practice length — shorter than the real test. | Dherer tababar — wuu ka gaaban yahay imtixaanka dhabta ah. | Practice length — shorter than the real test. |
| app/academies.js | Dib-u-eegis / Review your answers | Dib-u-eegis | Review your answers |
| app/academies.js | Dib-u-hubin / Mastery re-check due | Dib-u-hubin | Mastery re-check due |
| app/academies.js | Dugsiga Foomamka / Forms Academy | Dugsiga Foomamka | Forms Academy |
| app/academies.js | Dugsiga GED / GED Academy | Dugsiga GED | GED Academy |
| app/academies.js | Dugsiyo / Academies | Dugsiyo | Academies |
| app/academies.js | Foom kasta wuxuu leeyahay qof khayaali ah oo kaadh tuusaale ah ku qoran. Qiimayaasha saxda ah kaadhka ka guuri goobaha saxda ah — goob kastaa waxay leedahay sharax Soomaali ah. / Each form has a fictional person on a sample card. Copy the right values into the right fields — every field has a Somali explanation. | Foom kasta wuxuu leeyahay qof khayaali ah oo kaadh tuusaale ah ku qoran. Qiimayaasha saxda ah kaadhka ka guuri goobaha saxda ah — goob kastaa waxay leedahay sharax Soomaali ah. | Each form has a fictional person on a sample card. Copy the right values into the right fields — every field has a Somali explanation. |
| app/academies.js | Foomam / Forms | Foomam | Forms |
| app/academies.js | Foomku waa buuxaa oo sax yahay! / The form is complete and correct | Foomku waa buuxaa oo sax yahay! | The form is complete and correct |
| app/academies.js | Fur / Open | Fur | Open |
| app/academies.js | Fur / Open → | Fur | Open → |
| app/academies.js | Goobaha khaldan kor bay ku muuqdaan sababtooda — sax oo mar kale hubi. Khaladaadku waxay aadeen safkaaga khaladaadka. / Wrong fields show their reason above — fix them and check again. Mistakes joined your mistake queue. | Goobaha khaldan kor bay ku muuqdaan sababtooda — sax oo mar kale hubi. Khaladaadku waxay aadeen safkaaga khaladaadka. | Wrong fields show their reason above — fix them and check again. Mistakes joined your mistake queue. |
| app/academies.js | Hubi fahamkaaga / Check your understanding | Hubi fahamkaaga | Check your understanding |
| app/academies.js | Hubi foomkayga / Check my form | Hubi foomkayga | Check my form |
| app/academies.js | Hubinta bilowga / Diagnostic | Hubinta bilowga | Diagnostic |
| app/academies.js | Hubinta bilowga / Diagnostic: | Hubinta bilowga | Diagnostic: |
| app/academies.js | Imtixaan tababar / Practice exam | Imtixaan tababar | Practice exam |
| app/academies.js | Imtixaan tababar / Timed practice exam | Imtixaan tababar | Timed practice exam |
| app/academies.js | Imtixaan tababar oo waqti leh / Timed practice exam | Imtixaan tababar oo waqti leh | Timed practice exam |
| app/academies.js | Imtixaan tijaabo / Mock exam | Imtixaan tijaabo | Mock exam |
| app/academies.js | Imtixaankii ugu dambeeyay / Latest: | Imtixaankii ugu dambeeyay | Latest: |
| app/academies.js | Imtixaanno tababar / Practice exams: | Imtixaanno tababar | Practice exams: |
| app/academies.js | Jawaabahaagu way kaydsamaan markaad socoto — waad bixi kartaa oo waad soo noqon kartaa, saacadduna way socotaa. / Your answers are saved as you go — you can leave and come back, and the timer keeps running. | Jawaabahaagu way kaydsamaan markaad socoto — waad bixi kartaa oo waad soo noqon kartaa, saacadduna way socotaa. | Your answers are saved as you go — you can leave and come back, and the timer keeps running. |
| app/academies.js | Jawaabahaagu way kaydsan yihiin — waad sii wadi kartaa. / Your answers are saved — you can resume. | Jawaabahaagu way kaydsan yihiin — waad sii wadi kartaa. | Your answers are saved — you can resume. |
| app/academies.js | Jawaabta saxda ah / Correct answer: | Jawaabta saxda ah | Correct answer: |
| app/academies.js | Jawaabtaadu / Your answer: | Jawaabtaadu | Your answer: |
| app/academies.js | Kaadhka tuusaalaha / Sample card | Kaadhka tuusaalaha | Sample card |
| app/academies.js | Kaar / Card | Kaar | Card |
| app/academies.js | Kaarar ma jiraan / No flashcards yet | Kaarar ma jiraan | No flashcards yet |
| app/academies.js | Kaararka xasuusta / Flashcards | Kaararka xasuusta | Flashcards |
| app/academies.js | La dhammeeyay / Done | La dhammeeyay | Done |
| app/academies.js | La dhammeeyay — mar kale akhri / Done — read again | La dhammeeyay — mar kale akhri | Done — read again |
| app/academies.js | La xaqiijiyay / Mastered | La xaqiijiyay | Mastered |
| app/academies.js | Maqaalkaaga halkan ku qor / Write your essay here | Maqaalkaaga halkan ku qor | Write your essay here |
| app/academies.js | Mar kale / Go again | Mar kale | Go again |
| app/academies.js | Mar kale samee / Retake | Mar kale samee | Retake |
| app/academies.js | Meesha ugu liita / Your weakest area so far: | Meesha ugu liita | Your weakest area so far: |
| app/academies.js | Qof khayaali ah — ma aha qof dhab ah. / Fictional person — not a real person. | Qof khayaali ah — ma aha qof dhab ah. | Fictional person — not a real person. |
| app/academies.js | Sax! / Correct | Sax! | Correct |
| app/academies.js | Sii wad / Continue | Sii wad | Continue |
| app/academies.js | Sii wad / Resume | Sii wad | Resume |
| app/academies.js | Taabo si aad u aragto jawaabta / Tap to see the answer | Taabo si aad u aragto jawaabta | Tap to see the answer |
| app/academies.js | Tababar / Practice | Tababar | Practice |
| app/academies.js | Tababar GED oo aan rasmi ahayn: hubin bilow, cashirro yaryar oo Soomaali ku sharaxan, iyo imtixaan tababar oo waqti leh — afar mawduuc. App-kani GED ma bixiyo, dhibic rasmi ah ma saadaaliyo, gudubna ma ballanqaado. / Unofficial GED practice: a diagnostic, Somali-explained mini-lessons, and a timed practice exam in four subjects. This app does not award a GED, does not predict an official score, and does not guarantee passing. | Tababar GED oo aan rasmi ahayn: hubin bilow, cashirro yaryar oo Soomaali ku sharaxan, iyo imtixaan tababar oo waqti leh — afar mawduuc. App-kani GED ma bixiyo, dhibic rasmi ah ma saadaaliyo, gudubna ma ballanqaado. | Unofficial GED practice: a diagnostic, Somali-explained mini-lessons, and a timed practice exam in four subjects. This app does not award a GED, does not predict an official score, and does not guarantee passing. |
| app/academies.js | Tababar aan dhammaan / Unfinished practice | Tababar aan dhammaan | Unfinished practice |
| app/academies.js | Tababar cashir / Lesson practice | Tababar cashir | Lesson practice |
| app/academies.js | Tallaabada xigta / Next step: | Tallaabada xigta | Next step: |
| app/academies.js | Tijaabadii ugu dambeysay / Latest mock: | Tijaabadii ugu dambeysay | Latest mock: |
| app/academies.js | Tirtir / Discard | Tirtir | Discard |
| app/academies.js | Tudaca akhriska / Reading passage | Tudaca akhriska | Reading passage |
| app/academies.js | Tusaalooyin la xalliyay / Worked examples | Tusaalooyin la xalliyay | Worked examples |
| app/academies.js | Ugu fiican / Best: | Ugu fiican | Best: |
| app/academies.js | Waa dhammaatay / Finished | Waa dhammaatay | Finished |
| app/academies.js | Waa dhammaatay! / Finished | Waa dhammaatay! | Finished |
| app/academies.js | Waad dhamaysay wareegtan / Round complete | Waad dhamaysay wareegtan | Round complete |
| app/academies.js | Waan aqaan / I know this | Waan aqaan | I know this |
| app/academies.js | Wali diyaarsanaan ma muuqato — marka hore hubinta bilowga samee. / No readiness yet — take the diagnostic first. | Wali diyaarsanaan ma muuqato — marka hore hubinta bilowga samee. | No readiness yet — take the diagnostic first. |
| app/academies.js | Wali lama samayn. / Not taken yet. | Wali lama samayn. | Not taken yet. |
| app/academies.js | Wali waan baranayaa / Still learning | Wali waan baranayaa | Still learning |
| app/academies.js | Waxay ku salaysan tahay jawaabahaagii hore — meesha ugu liita ayaa ugu horreysa. / Based on your answers so far — your weakest area is listed first. | Waxay ku salaysan tahay jawaabahaagii hore — meesha ugu liita ayaa ugu horreysa. | Based on your answers so far — your weakest area is listed first. |
| app/academies.js | Xooggaaga / Where you stand | Xooggaaga | Where you stand |
| app/academies.js | goob / fields | goob | fields |
| app/academies.js | goob oo sax ah / fields correct. | goob oo sax ah | fields correct. |
| app/academies.js | — Dooro / Choose — | — Dooro | Choose — |
| app/academies.js | ← Dib / Back | ← Dib | Back |
| app/academies.js | ← Dugsiga GED / GED Academy | ← Dugsiga GED | GED Academy |
| app/academies.js | ← Foomamka / Forms | ← Foomamka | Forms |
| app/academies.js | ⏰ Waqtigu wuu dhammaaday! / Time is up | ⏰ Waqtigu wuu dhammaaday! | Time is up |
| app/academies.js | ⏱️ Waqtiga hadhay / Time left: | ⏱️ Waqtiga hadhay | Time left: |
| app/academies.js | 📦 Sanduuq / Box | 📦 Sanduuq | Box |
| app/academies.js | 🔴 Tababarka sii wad / Keep practising | 🔴 Tababarka sii wad | Keep practising |
| app/academies.js | 🟡 Waad ku dhawdahay / Close | 🟡 Waad ku dhawdahay | Close |
| app/academies.js | 🟢 Heerka u diyaarsanaanta u eg / Likely-ready range | 🟢 Heerka u diyaarsanaanta u eg | Likely-ready range |
| app/design.js | 1,000 cashir / lessons | 1,000 cashir | lessons |
| app/design.js | Aaladda & Caawimaad / Device & Help | Aaladda & Caawimaad | Device & Help |
| app/design.js | Adiga / You | Adiga | You |
| app/design.js | Arag / View | Arag | View |
| app/design.js | Asalka akhriskaaga / Reading background | Asalka akhriskaaga | Reading background |
| app/design.js | Beddel / Switch | Beddel | Switch |
| app/design.js | Codka aad doorbidayso / Preferred voice | Codka aad doorbidayso | Preferred voice |
| app/design.js | Codka jawaabaha / Answer sounds | Codka jawaabaha | Answer sounds |
| app/design.js | Dadka wax barta aaladdan / Learners on this device | Dadka wax barta aaladdan | Learners on this device |
| app/design.js | Dhaqdhaqaaqa / Motion | Dhaqdhaqaaqa | Motion |
| app/design.js | Dhibcaha / Score: | Dhibcaha | Score: |
| app/design.js | Dookhyada / Preferences | Dookhyada | Preferences |
| app/design.js | Fadlan qor waxa khaldan. / Please write what is wrong. | Fadlan qor waxa khaldan. | Please write what is wrong. |
| app/design.js | Faylku wuxuu ka kooban yahay / This file contains: | Faylku wuxuu ka kooban yahay | This file contains: |
| app/design.js | Foomamka nolosha / Real-life forms | Foomamka nolosha | Real-life forms |
| app/design.js | Haa, beddel horumarkayga / Yes, replace my progress | Haa, beddel horumarkayga | Yes, replace my progress |
| app/design.js | Hadafka ugu weyn / Main goal | Hadafka ugu weyn | Main goal |
| app/design.js | Hubi inaad tirtirto? Taabo mar kale / Confirm delete? Tap again | Hubi inaad tirtirto? Taabo mar kale | Confirm delete? Tap again |
| app/design.js | Isbeddel kastaa isla markiiba wuu kaydsamaa. / Every change saves right away. | Isbeddel kastaa isla markiiba wuu kaydsamaa. | Every change saves right away. |
| app/design.js | JSON sax ah ma aha. Faylka horumarka ee saxda ah dheji. / That is not valid JSON. Paste the correct progress file. | JSON sax ah ma aha. Faylka horumarka ee saxda ah dheji. | That is not valid JSON. Paste the correct progress file. |
| app/design.js | Kaydi / Save | Kaydi | Save |
| app/design.js | Kaydi warbixinta / Save report | Kaydi warbixinta | Save report |
| app/design.js | Ku dar / Add | Ku dar | Add |
| app/design.js | Ku dar / Add learner | Ku dar | Add learner |
| app/design.js | Ku dar barte kale / Add a learner | Ku dar barte kale | Add a learner |
| app/design.js | Lambarka cashirka / Lesson number | Lambarka cashirka | Lesson number |
| app/design.js | Magaca / Name | Magaca | Name |
| app/design.js | Mar kale qaado / Take the test again | Mar kale qaado | Take the test again |
| app/design.js | Maxaa khaldan? / What is wrong? | Maxaa khaldan? | What is wrong? |
| app/design.js | Maya, dib u noqo / No, go back | Maya, dib u noqo | No, go back |
| app/design.js | Meelayntaadii / Your placement: waxaad ka bilowday | Meelayntaadii | Your placement: waxaad ka bilowday |
| app/design.js | Midabka astaanta / Avatar color | Midabka astaanta | Avatar color |
| app/design.js | Muuqaalka / Theme | Muuqaalka | Theme |
| app/design.js | Nooca manhajka / Curriculum: | Nooca manhajka | Curriculum: |
| app/design.js | Nuqul garee / Copy | Nuqul garee | Copy |
| app/design.js | Qoraal / Forms | Qoraal | Forms |
| app/design.js | Qoraal weyn / Large text | Qoraal weyn | Large text |
| app/design.js | Qorshee jumlo / Plan a sentence | Qorshee jumlo | Plan a sentence |
| app/design.js | Shahaado dhamaystir oo ka timid Somali English Academy — ma aha shahaado la aqoonsan yahay, mana aha GED. / A certificate of completion from Somali English Academy — not an accredited credential and not a GED. | Shahaado dhamaystir oo ka timid Somali English Academy — ma aha shahaado la aqoonsan yahay, mana aha GED. | A certificate of completion from Somali English Academy — not an accredited credential and not a GED. |
| app/design.js | Soo celi / Import | Soo celi | Import |
| app/design.js | Soo sheeg khalad ku jira cashir / Report a mistake in a lesson | Soo sheeg khalad ku jira cashir | Report a mistake in a lesson |
| app/design.js | Soo-celintu ma shaqayn. / The restore did not work. | Soo-celintu ma shaqayn. | The restore did not work. |
| app/design.js | Tababar aan rasmi ahayn / Unofficial practice | Tababar aan rasmi ahayn | Unofficial practice |
| app/design.js | Tirtir / Delete | Tirtir | Delete |
| app/design.js | Ugu badnaan 4 qof oo barta ayaa gaadhay. / The 4-learner limit is reached. | Ugu badnaan 4 qof oo barta ayaa gaadhay. | The 4-learner limit is reached. |
| app/design.js | Ugu badnaan 4 qof oo barta hal aalad. / Up to 4 learners on one device. | Ugu badnaan 4 qof oo barta hal aalad. | Up to 4 learners on one device. |
| app/design.js | Waad kaydisay. / Saved. | Waad kaydisay. | Saved. |
| app/design.js | Waad kaydisay. Mahadsanid! / Saved. Thank you | Waad kaydisay. Mahadsanid! | Saved. Thank you |
| app/design.js | Wali shahaado ma haysatid. Marxalad dhammee si aad u hesho taada koowaad. / No certificates yet. Complete a stage to earn your first one. | Wali shahaado ma haysatid. Marxalad dhammee si aad u hesho taada koowaad. | No certificates yet. Complete a stage to earn your first one. |
| app/design.js | Waqtiga barashada maalintii / Daily study time | Waqtiga barashada maalintii | Daily study time |
| app/design.js | Waxbarashadayda / My Learning | Waxbarashadayda | My Learning |
| app/design.js | Xawaaraha codka / Voice speed | Xawaaraha codka | Voice speed |
| app/design.js | cashir / lessons | cashir | lessons |
| app/design.js | cashir oo la dhammeeyay / completed lessons | cashir oo la dhammeeyay | completed lessons |
| app/extras.js | -ka hore / showing first | -ka hore | showing first |
| app/extras.js | App-kan hadda shaashadda hore ayuu ka furmaa. / This app already opens from your home screen. | App-kan hadda shaashadda hore ayuu ka furmaa. | This app already opens from your home screen. |
| app/extras.js | Barnaamijka erayada / Word roadmap | Barnaamijka erayada | Word roadmap |
| app/extras.js | Beddel PIN-ka / Change PIN | Beddel PIN-ka | Change PIN |
| app/extras.js | Bog PIN leh ma jiro halkan. / No profile here has a PIN. | Bog PIN leh ma jiro halkan. | No profile here has a PIN. |
| app/extras.js | Casharro muuqaal ah oo leh jilayaal isku mid ah — Ayaan, Faadumo iyo Mr. Daniel — Soomaali iyo Ingiriisi. Kaadh taabo si aad u daawato. / Video lessons with the same cast — Ayaan, Faadumo and Mr. Daniel — in Somali and English. Tap a card to watch. | Casharro muuqaal ah oo leh jilayaal isku mid ah — Ayaan, Faadumo iyo Mr. Daniel — Soomaali iyo Ingiriisi. Kaadh taabo si aad u daawato. | Video lessons with the same cast — Ayaan, Faadumo and Mr. Daniel — in Somali and English. Tap a card to watch. |
| app/extras.js | Codka &amp; dhaqdhaqaaqa / Sound &amp; motion | Codka &amp; dhaqdhaqaaqa | Sound &amp; motion |
| app/extras.js | Codka / Sound on or off | Codka | Sound on or off |
| app/extras.js | Codka jawaabaha / Answer sounds: | Codka jawaabaha | Answer sounds: |
| app/extras.js | Codku waa qoraallo cod oo diirran oo aaladdaadu samayso — faylal cod ah ma jiraan. / The sounds are warm notes your device makes itself — there are no audio files. | Codku waa qoraallo cod oo diirran oo aaladdaadu samayso — faylal cod ah ma jiraan. | The sounds are warm notes your device makes itself — there are no audio files. |
| app/extras.js | Daawo / Watch | Daawo | Watch |
| app/extras.js | Dansan / Off | Dansan | Off |
| app/extras.js | Dansi codka / Turn sound off | Dansi codka | Turn sound off |
| app/extras.js | Deji PIN ilaalin / Set a PIN lock | Deji PIN ilaalin | Set a PIN lock |
| app/extras.js | Dhaqdhaqaaqa yaree / Reduce motion: | Dhaqdhaqaaqa yaree | Reduce motion: |
| app/extras.js | Dhibcaha XP / How XP works | Dhibcaha XP | How XP works |
| app/extras.js | Erayada cashirrada / Lesson word entries: | Erayada cashirrada | Lesson word entries: |
| app/extras.js | Ereyada aad hadda dhihi karto / Words you can now say | Ereyada aad hadda dhihi karto | Words you can now say |
| app/extras.js | Hadafka maanta / Today's goal | Hadafka maanta | Today's goal |
| app/extras.js | Hubinta laba-luqadood / Bilingual audit: | Hubinta laba-luqadood | Bilingual audit: |
| app/extras.js | Jidkaaga waxbarasho / Your learning path | Jidkaaga waxbarasho | Your learning path |
| app/extras.js | Ka noqo / Cancel | Ka noqo | Cancel |
| app/extras.js | Ka saar PIN-ka / Remove PIN | Ka saar PIN-ka | Remove PIN |
| app/extras.js | Kaydka Ereyada / Word Bank: | Kaydka Ereyada | Word Bank: |
| app/extras.js | Ku dar shaashadda hore / Add to home screen | Ku dar shaashadda hore | Add to home screen |
| app/extras.js | Ku dhawaaday — mar kale ayaan wada eegi doonnaa. / So close — we will look again together. | Ku dhawaaday — mar kale ayaan wada eegi doonnaa. | So close — we will look again together. |
| app/extras.js | Ku saabsan / About — Launch Notes | Ku saabsan | About — Launch Notes |
| app/extras.js | Lambarka / Digit | Lambarka | Digit |
| app/extras.js | Liis / List | Liis | List |
| app/extras.js | Ma illowday PIN-ka? / Forgot PIN? | Ma illowday PIN-ka? | Forgot PIN? |
| app/extras.js | Maalin nasasho ayaa la isticmaalay — taxanahaagu waa badbaado. / Rest day used — your streak is safe. | Maalin nasasho ayaa la isticmaalay — taxanahaagu waa badbaado. | Rest day used — your streak is safe. |
| app/extras.js | Maalmood xiriir / day streak | Maalmood xiriir | day streak |
| app/extras.js | Maanta / Today: | Maanta | Today: |
| app/extras.js | Maanta waad dhamaysay / Done for today | Maanta waad dhamaysay | Done for today |
| app/extras.js | Meesha xigta / Next place → | Meesha xigta | Next place → |
| app/extras.js | Muuqaalladu waxay u baahan yihiin internet / Videos need internet | Muuqaalladu waxay u baahan yihiin internet | Videos need internet |
| app/extras.js | Nooca / Version: | Nooca | Version: |
| app/extras.js | PIN waa la beddelay. / PIN changed. | PIN waa la beddelay. | PIN changed. |
| app/extras.js | PIN waa la kaydiyay. / PIN saved. | PIN waa la kaydiyay. | PIN saved. |
| app/extras.js | PIN waa la saaray. / PIN removed. | PIN waa la saaray. | PIN removed. |
| app/extras.js | Raadi eray / Search a word | Raadi eray | Search a word |
| app/extras.js | Safarkaagu wuxuu maraa meelo badan — suuqa, kiliinikada, dugsiga… Cashir kasta waa tallaabo. / Your journey passes many places — the market, the clinic, the school… Every lesson is a step. | Safarkaagu wuxuu maraa meelo badan — suuqa, kiliinikada, dugsiga… Cashir kasta waa tallaabo. | Your journey passes many places — the market, the clinic, the school… Every lesson is a step. |
| app/extras.js | Sameeyay / Developed by | Sameeyay | Developed by |
| app/extras.js | Shid codka / Turn sound on | Shid codka | Turn sound on |
| app/extras.js | Shidan / On | Shidan | On |
| app/extras.js | Soo celi dhaqdhaqaaqa / Restore motion | Soo celi dhaqdhaqaaqa | Restore motion |
| app/extras.js | Tababar: fur door-ka-ciyaarka / Practise: open the role-play → | Tababar: fur door-ka-ciyaarka | Practise: open the role-play → |
| app/extras.js | Tirtir / Delete digit | Tirtir | Delete digit |
| app/extras.js | Tirtir bogga iyo horumarka / Delete profile and progress | Tirtir bogga iyo horumarka | Delete profile and progress |
| app/extras.js | Toddobaadkan / This week | Toddobaadkan | This week |
| app/extras.js | Waayahay / OK | Waayahay | OK |
| app/extras.js | Waxaad baran doontaa / What you will learn | Waxaad baran doontaa | What you will learn |
| app/extras.js | Waxay la socotaa / Pairs with: | Waxay la socotaa | Pairs with: |
| app/extras.js | Xaddidaadyo daacad ah / Honest limits | Xaddidaadyo daacad ah | Honest limits |
| app/extras.js | Xiriirkaaga / Your streak: | Xiriirkaaga | Your streak: |
| app/extras.js | Xiriirrani waa dibadda app-ka — adiga ayaa dooranaya inaad furto. / These links leave the app — you choose whether to open them. | Xiriirrani waa dibadda app-ka — adiga ayaa dooranaya inaad furto. | These links leave the app — you choose whether to open them. |
| app/extras.js | Yaree dhaqdhaqaaqa / Reduce motion | Yaree dhaqdhaqaaqa | Reduce motion |
| app/extras.js | eray / words | eray | words |
| app/extras.js | faraq / gaps: | faraq | gaps: |
| app/extras.js | la dhammeeyay / done | la dhammeeyay | done |
| app/extras.js | maalmood / days | maalmood | days |
| app/extras.js | the home-screen app keeps its own saved progress on this device. Use Profile export / import to move your progress between the browser and the home-screen app. | the home-screen app keeps its own saved progress on this device. Use Profile export | import to move your progress between the browser and the home-screen app. |
| app/extras.js | — Geli PIN-kaaga 4-ta lambar / Enter your 4-digit PIN | — Geli PIN-kaaga 4-ta lambar | Enter your 4-digit PIN |
| app/extras.js | — app-kan kuma jiraan, lamana iska dhigo inay jiraan. / An AI tutor and animated videos are | — app-kan kuma jiraan, lamana iska dhigo inay jiraan. | An AI tutor and animated videos are |
| app/extras.js | — ma aha dhibic GED oo dhab ah, mana ballanqaado gudbid. / GED practice is | — ma aha dhibic GED oo dhab ah, mana ballanqaado gudbid. | GED practice is |
| app/extras.js | ← Liiska / Back to list | ← Liiska | Back to list |
| app/extras.js | ← Meeshii hore / Previous place | ← Meeshii hore | Previous place |
| app/extras.js | 🗺️ Safar / Journey | 🗺️ Safar | Journey |
| app/home-legacy.js | Dib-u-eegis / Review | Dib-u-eegis | Review |
| app/home-legacy.js | Horumarkayga / My progress | Horumarkayga | My progress |
| app/home-legacy.js | Maalmood xiriir / Day streak | Maalmood xiriir | Day streak |
| app/home-legacy.js | kaar oo sugaya / cards due | kaar oo sugaya | cards due |
| app/home-legacy.js | khalad oo furan / open mistakes | khalad oo furan | open mistakes |
| app/learn.js | -aad — sidaas ayaa wax loo bartaa! / You got it on try | -aad — sidaas ayaa wax loo bartaa! | You got it on try |
| app/learn.js | Aasaaska / Foundation | Aasaaska | Foundation |
| app/learn.js | Afar meelood ka dooro: Yaa? Maxuu samaynaysaa? Xaggee? Goormee? Kadib jumladda oo dhamaystiran akhri oo qor. / Choose in four places: Who? Does what? Where? When? Then read and write the full sentence. | Afar meelood ka dooro: Yaa? Maxuu samaynaysaa? Xaggee? Goormee? Kadib jumladda oo dhamaystiran akhri oo qor. | Choose in four places: Who? Does what? Where? When? Then read and write the full sentence. |
| app/learn.js | Akadeemiyada Ingiriisiga Soomaaliyeed — oo leh matoorka caqliga leh: guul 2-maalmood ah, safka khaladaadka, iyo tallaabada xigta ee kugu habboon. / Curriculum v2 with the smart engine: two-day mastery, mistake queue, and your adaptive next step. | Akadeemiyada Ingiriisiga Soomaaliyeed — oo leh matoorka caqliga leh: guul 2-maalmood ah, safka khaladaadka, iyo tallaabada xigta ee kugu habboon. | Curriculum v2 with the smart engine: two-day mastery, mistake queue, and your adaptive next step. |
| app/learn.js | Akadeemiyadda oo dhan / Full Academy | Akadeemiyadda oo dhan | Full Academy |
| app/learn.js | Akhris / Reading | Akhris | Reading |
| app/learn.js | Akhris: Wadahadal / Reading dialogue | Akhris: Wadahadal | Reading dialogue |
| app/learn.js | Bilow hagaajinta / Start fixing | Bilow hagaajinta | Start fixing |
| app/learn.js | Bilow hubinta / Start the quiz → | Bilow hubinta | Start the quiz → |
| app/learn.js | Boggaaga / Profile | Boggaaga | Profile |
| app/learn.js | Caadi / Normal | Caadi | Normal |
| app/learn.js | Daacadnimo / Honest label: | Daacadnimo | Honest label: |
| app/learn.js | Dhaqdhaqaaqyo yaryar / Micro-animations | Dhaqdhaqaaqyo yaryar | Micro-animations |
| app/learn.js | Dhegeysi / Listening | Dhegeysi | Listening |
| app/learn.js | Dhegeyso / Listen | Dhegeyso | Listen |
| app/learn.js | Dhegeyso erayga, kadib taabo sawirka saxda ah. / Listen to the word, then tap the correct picture. | Dhegeyso erayga, kadib taabo sawirka saxda ah. | Listen to the word, then tap the correct picture. |
| app/learn.js | Dhegeyso jumladda, kadib qor waxaad maqashay. / Listen to the sentence, then type what you hear. | Dhegeyso jumladda, kadib qor waxaad maqashay. | Listen to the sentence, then type what you hear. |
| app/learn.js | Dhegeyso, cod dheer ku dheh 3 jeer, kadib taabo badhanka hoose. / Listen, say it aloud 3 times, then tap below. | Dhegeyso, cod dheer ku dheh 3 jeer, kadib taabo badhanka hoose. | Listen, say it aloud 3 times, then tap below. |
| app/learn.js | Dhismaha jumladda / Sentence builder | Dhismaha jumladda | Sentence builder |
| app/learn.js | Dib-u-eegis hagitaan leh / Guided review | Dib-u-eegis hagitaan leh | Guided review |
| app/learn.js | Dugsiga Akhriska / Reading Academy | Dugsiga Akhriska | Reading Academy |
| app/learn.js | English content fields / Goobaha nuxurka Ingiriisiga: | Goobaha nuxurka Ingiriisiga: | English content fields |
| app/learn.js | Eray taabo si aad u aragto sawirkiisa iyo macnihiisa / Tap a word to see its picture and meaning | Eray taabo si aad u aragto sawirkiisa iyo macnihiisa | Tap a word to see its picture and meaning |
| app/learn.js | Erayada muhiimka ah / Key words | Erayada muhiimka ah | Key words |
| app/learn.js | Eraygan Af-Soomaali ku qor / Write this word in Somali: | Eraygan Af-Soomaali ku qor | Write this word in Somali: |
| app/learn.js | Eraygan Ingiriisi ku qor / Write this in English: | Eraygan Ingiriisi ku qor | Write this in English: |
| app/learn.js | Eraygan wali qaamuuska sawirka kuma jiro. / This word is not in the picture dictionary yet. | Eraygan wali qaamuuska sawirka kuma jiro. | This word is not in the picture dictionary yet. |
| app/learn.js | Erayo cusub / New words | Erayo cusub | New words |
| app/learn.js | Exercises checked / Layliyo la hubiyay: | Layliyo la hubiyay: | Exercises checked |
| app/learn.js | Gaps / Nusqaamo: | Nusqaamo: | Gaps |
| app/learn.js | Gunno maalmeed +10 XP / Daily bonus +10 XP | Gunno maalmeed +10 XP | Daily bonus +10 XP |
| app/learn.js | Gym-ka Dhegeysiga / Listening gym | Gym-ka Dhegeysiga | Listening gym |
| app/learn.js | Habka erayada: Soomaali iyo Ingiriisi / Word order: Somali and English | Habka erayada: Soomaali iyo Ingiriisi | Word order: Somali and English |
| app/learn.js | Hadafka / Goal: | Hadafka | Goal: |
| app/learn.js | Hadafka / Objective | Hadafka | Objective |
| app/learn.js | Hadal / Speaking | Hadal | Speaking |
| app/learn.js | Hadal oo hubi erayada / Speak &amp; check words | Hadal oo hubi erayada | Speak &amp; check words |
| app/learn.js | Heerka 1: Sawir + eray / Stage 1: Picture + word | Heerka 1: Sawir + eray | Stage 1: Picture + word |
| app/learn.js | Heerka 2: Eray + sawir yar / Stage 2: Word + small picture | Heerka 2: Eray + sawir yar | Stage 2: Word + small picture |
| app/learn.js | Heerka 3: Eray oo keliya / Stage 3: Word only | Heerka 3: Eray oo keliya | Stage 3: Word only |
| app/learn.js | Hordhac / Introduction — | Hordhac | Introduction — |
| app/learn.js | Horumarka marxaladdan / Stage progress: | Horumarka marxaladdan | Stage progress: |
| app/learn.js | Horumarkaaga / Your progress data | Horumarkaaga | Your progress data |
| app/learn.js | Hubi / Check | Hubi | Check |
| app/learn.js | Hubi / Check my writing | Hubi | Check my writing |
| app/learn.js | Hubi inaad tirtirto xogtaada? Taabo mar kale / Confirm delete? Tap again | Hubi inaad tirtirto xogtaada? Taabo mar kale | Confirm delete? Tap again |
| app/learn.js | Hubi inaad tirtirto? Taabo mar kale / Sure? Tap again | Hubi inaad tirtirto? Taabo mar kale | Sure? Tap again |
| app/learn.js | Hubi qoraalkayga / Check my writing | Hubi qoraalkayga | Check my writing |
| app/learn.js | Hubin / Quiz | Hubin | Quiz |
| app/learn.js | Hubinta Laba-luqadood / Bilingual coverage check | Hubinta Laba-luqadood | Bilingual coverage check |
| app/learn.js | Hubinta fahamka / Comprehension check | Hubinta fahamka | Comprehension check |
| app/learn.js | Iftiin / Light | Iftiin | Light |
| app/learn.js | Ingiriisi ku dheh / Say it in English | Ingiriisi ku dheh | Say it in English |
| app/learn.js | Istuudiyaha Hadalka / Speaking studio | Istuudiyaha Hadalka | Speaking studio |
| app/learn.js | Jawaabtan dib ayaad ugu soo noqon doontaa Dib-u-eegistaada. / You will meet this answer again in your Review. | Jawaabtan dib ayaad ugu soo noqon doontaa Dib-u-eegistaada. | You will meet this answer again in your Review. |
| app/learn.js | Jooji / Pause | Jooji | Pause |
| app/learn.js | Jumladda halkan ku qor / Type the sentence here | Jumladda halkan ku qor | Type the sentence here |
| app/learn.js | Jumladdaada / Your sentence: | Jumladdaada | Your sentence: |
| app/learn.js | Ka bax qaabka martida / Exit guest mode | Ka bax qaabka martida | Exit guest mode |
| app/learn.js | Khadka waqtiga / Tense timeline | Khadka waqtiga | Tense timeline |
| app/learn.js | Khaladkani safka khaladaadka wuu ku jiraa si aad u tababarato. / This is in your mistake queue to practise. | Khaladkani safka khaladaadka wuu ku jiraa si aad u tababarato. | This is in your mistake queue to practise. |
| app/learn.js | Ku saabsan &amp; Hubinta nuxurka / About &amp; content validation | Ku saabsan &amp; Hubinta nuxurka | About &amp; content validation |
| app/learn.js | Ku soo dhawoow! Gunnadan waa XP oo keliya, ma aha lacag ama abaalmarin shay ah. / Welcome! This bonus is XP only, not money or prizes. | Ku soo dhawoow! Gunnadan waa XP oo keliya, ma aha lacag ama abaalmarin shay ah. | Welcome! This bonus is XP only, not money or prizes. |
| app/learn.js | Layliyada / Exercises | Layliyada | Exercises |
| app/learn.js | Ma aqaan / Again | Ma aqaan | Again |
| app/learn.js | Ma saxna — isku day mar kale! / Not quite — try again | Ma saxna — isku day mar kale! | Not quite — try again |
| app/learn.js | Ma saxna. Sawirka saxda ah waa kan: / Not quite. The correct picture is: | Ma saxna. Sawirka saxda ah waa kan: | Not quite. The correct picture is: |
| app/learn.js | Madow / Dark | Madow | Dark |
| app/learn.js | Mar kale / Once more | Mar kale | Once more |
| app/learn.js | Mar kale ciyaar / Replay | Mar kale ciyaar | Replay |
| app/learn.js | Meelayn / Placed | Meelayn | Placed |
| app/learn.js | Muuji jawaabta / Show the answer | Muuji jawaabta | Show the answer |
| app/learn.js | Muuji jumladda / Show the sentence | Muuji jumladda | Show the sentence |
| app/learn.js | Muuji sawirka / Show picture | Muuji sawirka | Show picture |
| app/learn.js | Naxwaha / Grammar recap | Naxwaha | Grammar recap |
| app/learn.js | Naxwe / Grammar in context | Naxwe | Grammar in context |
| app/learn.js | Nidaamka aaladda / System | Nidaamka aaladda | System |
| app/learn.js | Nooca manhajka / Curriculum version | Nooca manhajka | Curriculum version |
| app/learn.js | PIN baa ku xiran / PIN locked | PIN baa ku xiran | PIN locked |
| app/learn.js | Qaabka martida / Guest mode | Qaabka martida | Guest mode |
| app/learn.js | Qaamuuska mawduucan fur / Open this theme in the dictionary | Qaamuuska mawduucan fur | Open this theme in the dictionary |
| app/learn.js | Qiimeynta Ugu Dambeysa &amp; Qalin-jabinta / Final Assessment &amp; Graduation | Qiimeynta Ugu Dambeysa &amp; Qalin-jabinta | Final Assessment &amp; Graduation |
| app/learn.js | Qof kasta oo barta wuxuu leeyahay horumar gooni ah aaladdan. / Each learner has their own progress on this device. | Qof kasta oo barta wuxuu leeyahay horumar gooni ah aaladdan. | Each learner has their own progress on this device. |
| app/learn.js | Qoraal / Writing | Qoraal | Writing |
| app/learn.js | Qorshee jumladdaada / Plan your sentence | Qorshee jumladdaada | Plan your sentence |
| app/learn.js | Sawirka eeg — erayga saxda ah dooro. / Look at the picture — choose the correct word. | Sawirka eeg — erayga saxda ah dooro. | Look at the picture — choose the correct word. |
| app/learn.js | Sawirka saxda ah / Correct picture: | Sawirka saxda ah | Correct picture: |
| app/learn.js | Sawirku waa isla midka qaamuuska, kaararka iyo hubinta. / The picture is the same one used in the dictionary, flashcards and quizzes. | Sawirku waa isla midka qaamuuska, kaararka iyo hubinta. | The picture is the same one used in the dictionary, flashcards and quizzes. |
| app/learn.js | Sawirku waa kaalmo — wuu yaraadaa markaad barato. Aqoonsiga sawirku uma xisaabna guusha laba-maalmood. / The picture is scaffolding that fades as you learn. Picture recognition does not count toward two-day mastery. | Sawirku waa kaalmo — wuu yaraadaa markaad barato. Aqoonsiga sawirku uma xisaabna guusha laba-maalmood. | The picture is scaffolding that fades as you learn. Picture recognition does not count toward two-day mastery. |
| app/learn.js | Sax khaladaadkayga / Fix my mistakes | Sax khaladaadkayga | Fix my mistakes |
| app/learn.js | Sax! Jumladda waa dhamaystiran tahay. / Correct! The sentence is complete. | Sax! Jumladda waa dhamaystiran tahay. | Correct! The sentence is complete. |
| app/learn.js | Say it out loud / Cod dheer ku dheh: | Cod dheer ku dheh: | Say it out loud |
| app/learn.js | Shahaadadan waxaa la siiyay / This certificate is presented to | Shahaadadan waxaa la siiyay | This certificate is presented to |
| app/learn.js | Shahaado / Certificate | Shahaado | Certificate |
| app/learn.js | Shahaadooyin / Certificates | Shahaadooyin | Certificates |
| app/learn.js | Sii wad / Continue → | Sii wad | Continue → |
| app/learn.js | Somali-filled fields / Goobaha Soomaaliga la buuxiyay: | Goobaha Soomaaliga la buuxiyay: | Somali-filled fields |
| app/learn.js | Soomaali ku dheh / Say it in Somali | Soomaali ku dheh | Say it in Somali |
| app/learn.js | Taabo erayada sawirka ee goobta / Tap the picture words in the scene | Taabo erayada sawirka ee goobta | Tap the picture words in the scene |
| app/learn.js | Taariikh / Date: | Taariikh | Date: |
| app/learn.js | Tababar / Practice hub | Tababar | Practice hub |
| app/learn.js | Tababaraha Qoraalka / Writing coach | Tababaraha Qoraalka | Writing coach |
| app/learn.js | Tababarka dhismaha jumladda / Sentence-builder free practice | Tababarka dhismaha jumladda | Sentence-builder free practice |
| app/learn.js | Tag Hoyga / Go to Home | Tag Hoyga | Go to Home |
| app/learn.js | Tartii / Slow | Tartii | Slow |
| app/learn.js | Tartiiib dhegeyso / Listen slowly | Tartiiib dhegeyso | Listen slowly |
| app/learn.js | Tilmaan / Hint | Tilmaan | Hint |
| app/learn.js | Tirtir / Clear | Tirtir | Clear |
| app/learn.js | Tirtir dhammaan horumarka / Reset all | Tirtir dhammaan horumarka | Reset all |
| app/learn.js | Tirtir xogtayda / Delete my data | Tirtir xogtayda | Delete my data |
| app/learn.js | Tusaalooyin / Examples: | Tusaalooyin | Examples: |
| app/learn.js | Vocabulary / Erayo | Erayo | Vocabulary |
| app/learn.js | Waan aqaanaa / I know it | Waan aqaanaa | I know it |
| app/learn.js | Waan fahmay, sii wad / I understand, continue → | Waan fahmay, sii wad | I understand, continue → |
| app/learn.js | Waan gartay / Good | Waan gartay | Good |
| app/learn.js | Wali kululayn ma diyaar aha — cashir dhammee marka hore. / No warm-up yet — finish a lesson first. | Wali kululayn ma diyaar aha — cashir dhammee marka hore. | No warm-up yet — finish a lesson first. |
| app/learn.js | Wali maya / Not yet | Wali maya | Not yet |
| app/learn.js | Wali sax ma aha. Taayirrada khaldan taabo si aad u soo ceshado, kadib mar kale isku day. / Not yet. Tap a placed tile to take it back, then try again. | Wali sax ma aha. Taayirrada khaldan taabo si aad u soo ceshado, kadib mar kale isku day. | Not yet. Tap a placed tile to take it back, then try again. |
| app/learn.js | Xaddidaadyo daacad ah / Honest limitations: Horumarku wuxuu ku kaydsan yahay | Xaddidaadyo daacad ah | Honest limitations: Horumarku wuxuu ku kaydsan yahay |
| app/learn.js | Xarfaha Soomaaliga u eg laakiin Ingiriisiga si kale u dhawaaqa / Letters that look Somali but sound different in English | Xarfaha Soomaaliga u eg laakiin Ingiriisiga si kale u dhawaaqa | Letters that look Somali but sound different in English |
| app/learn.js | Xirfadaha la muujiyay / Skills demonstrated: | Xirfadaha la muujiyay | Skills demonstrated: |
| app/learn.js | Yaa wax baranaya? / Who is learning? | Yaa wax baranaya? | Who is learning? |
| app/learn.js | Zero English-only content fields / Ma jiraan goobo Ingiriisi-keliya ah. | Ma jiraan goobo Ingiriisi-keliya ah. | Zero English-only content fields |
| app/learn.js | daqiiqo / min maalintii | daqiiqo | min maalintii |
| app/learn.js | daqiiqo / minutes | daqiiqo | minutes |
| app/learn.js | sax / correct | sax | correct |
| app/learn.js | si guul leh u dhamaystiray / for successfully completing | si guul leh u dhamaystiray | for successfully completing |
| app/learn.js | ugu dabiicisan / most natural | ugu dabiicisan | most natural |
| app/learn.js | — boggan waa u diyaar daabacaadda. / Use your browser menu → | — boggan waa u diyaar daabacaadda. | Use your browser menu → |
| app/learn.js | — sawirkee baa sax ah? / Which picture is correct? | — sawirkee baa sax ah? | Which picture is correct? |
| app/learn.js | — waxay baxaan marka si sax ah looga jawaabo 2 maalmood oo kala duwan. / They clear when answered correctly on 2 different days. | — waxay baxaan marka si sax ah looga jawaabo 2 maalmood oo kala duwan. | They clear when answered correctly on 2 different days. |
| app/learn.js | ← Boggaaga / Profile | ← Boggaaga | Profile |
| app/learn.js | ← Hoyga / Home | ← Hoyga | Home |
| app/learn.js | ← Jidka / Path | ← Jidka | Path |
| app/learn.js | ← Tudacyada / Passages | ← Tudacyada | Passages |
| app/learn.js | ↻ Isku day mar kale / Try again | ↻ Isku day mar kale | Try again |
| app/learn.js | ⚽ Horgaleeyeyaasha: kubbad iyo sanduuq / Prepositions: ball and box | ⚽ Horgaleeyeyaasha: kubbad iyo sanduuq | Prepositions: ball and box |
| app/learn.js | ✅ Khaladkani safka wuu ka baxay! / This mistake is cleared | ✅ Khaladkani safka wuu ka baxay! | This mistake is cleared |
| app/learn.js | 🏙️ Sahanka goobaha / Scene Explorer | 🏙️ Sahanka goobaha | Scene Explorer |
| app/learn.js | 👤 Yaa? / Who? | 👤 Yaa? | Who? |
| app/learn.js | 💡 Tilmaan kale / More hint | 💡 Tilmaan kale | More hint |
| app/learn.js | 📍 Xaggee? / Where? | 📍 Xaggee? | Where? |
| app/learn.js | 🕐 Goormee? / When? | 🕐 Goormee? | When? |
| app/placement.js | Bilow imtixaanka / Start the placement test | Bilow imtixaanka | Start the placement test |
| app/placement.js | Casharka 1 ka bilow / Start from Lesson 1 instead | Casharka 1 ka bilow | Start from Lesson 1 instead |
| app/placement.js | Dhammaan waad saxday! / You got them all | Dhammaan waad saxday! | You got them all |
| app/placement.js | Dhammee / Finish ✓ | Dhammee | Finish ✓ |
| app/placement.js | Dhibcahaaga / Your score: | Dhibcahaaga | Your score: |
| app/placement.js | Halkaas ka bilow / Start there | Halkaas ka bilow | Start there |
| app/placement.js | Heerkaaga / Your level: | Heerkaaga | Your level: |
| app/placement.js | Imtixaanka meelaynta / Placement test | Imtixaanka meelaynta | Placement test |
| app/placement.js | Imtixaankii wuu dhammaaday! / The test is done | Imtixaankii wuu dhammaaday! | The test is done |
| app/placement.js | Jawaabo labaad / Second try: | Jawaabo labaad | Second try: |
| app/placement.js | Jawaabta saxda ah halkan lama muujinayo — waa qiimeyn, ma aha cashir. / The correct answer is not shown here — this is an assessment, not a lesson. | Jawaabta saxda ah halkan lama muujinayo — waa qiimeyn, ma aha cashir. | The correct answer is not shown here — this is an assessment, not a lesson. |
| app/placement.js | Kuwa aad khaladay / The ones you missed | Kuwa aad khaladay | The ones you missed |
| app/placement.js | Kuwani waxay ku jiraan safka Dib-u-eegistaada — halkaas ayaad ku saxaysaa. / These are queued in your Review — you can fix them there. | Kuwani waxay ku jiraan safka Dib-u-eegistaada — halkaas ayaad ku saxaysaa. | These are queued in your Review — you can fix them there. |
| app/placement.js | Natiijada hubinta / Quiz result | Natiijada hubinta | Quiz result |
| app/placement.js | Natiijada layliga / Exercise result | Natiijada layliga | Exercise result |
| app/placement.js | Sii wad / Next → | Sii wad | Next → |
| app/placement.js | Sii wad hubinta / Continue to the quiz → | Sii wad hubinta | Continue to the quiz → |
| app/placement.js | Tag Dib-u-eegista / Go to Review | Tag Dib-u-eegista | Go to Review |
| app/placement.js | Waan fahmay / Got it | Waan fahmay | Got it |
| app/placement.js | Waxaad ka bilaabaysaa bilowga — tallaabo tallaabo. / You start at the very beginning — step by step. | Waxaad ka bilaabaysaa bilowga — tallaabo tallaabo. | You start at the very beginning — step by step. |
| app/speaking.js | Afkaaga sawir ku baro: booska afka, dhegeysi, kadib dheh. Hubintu waa isbarbardhig erayo — ma aha dhibic dhawaaq. / Learn sounds visually: mouth position, listening, then saying. The check is word-matching — not a pronunciation score. | Afkaaga sawir ku baro: booska afka, dhegeysi, kadib dheh. Hubintu waa isbarbardhig erayo — ma aha dhibic dhawaaq. | Learn sounds visually: mouth position, listening, then saying. The check is word-matching — not a pronunciation score. |
| app/speaking.js | Bilow / Start | Bilow | Start |
| app/speaking.js | Dhegeyso / Hear it | Dhegeyso | Hear it |
| app/speaking.js | Dheh / Say it | Dheh | Say it |
| app/speaking.js | Dheh oo hubi erayada / Speak &amp; check words | Dheh oo hubi erayada | Speak &amp; check words |
| app/speaking.js | Doorka-ciyaar / Role-plays | Doorka-ciyaar | Role-plays |
| app/speaking.js | Dooro jawaabtaada — ama khadka saxda ah dheh / Choose your reply — or say the correct line: | Dooro jawaabtaada — ama khadka saxda ah dheh | Choose your reply — or say the correct line: |
| app/speaking.js | Haa / Yes | Haa | Yes |
| app/speaking.js | Hubin isbarbardhig erayo — ma aha dhibic dhawaaq. / Word-matching check — not a pronunciation score. | Hubin isbarbardhig erayo — ma aha dhibic dhawaaq. | Word-matching check — not a pronunciation score. |
| app/speaking.js | Istuudiyaha Dhawaaqyada / Sounds studio | Istuudiyaha Dhawaaqyada | Sounds studio |
| app/speaking.js | Jaantusyada / Flowcharts | Jaantusyada | Flowcharts |
| app/speaking.js | Jaantusyada naxwaha &amp; Khariidadaha / Grammar charts &amp; mind maps | Jaantusyada naxwaha &amp; Khariidadaha | Grammar charts &amp; mind maps |
| app/speaking.js | Jaantusyada oo dhan / All charts | Jaantusyada oo dhan | All charts |
| app/speaking.js | Jawaabta saxda ah / Correct reply: | Jawaabta saxda ah | Correct reply: |
| app/speaking.js | Khariidadaha / Mind maps | Khariidadaha | Mind maps |
| app/speaking.js | Khariidadaha maskaxda / Mind maps | Khariidadaha maskaxda | Mind maps |
| app/speaking.js | La bilaabay / Started | La bilaabay | Started |
| app/speaking.js | La dhammeeyay / Finished | La dhammeeyay | Finished |
| app/speaking.js | La dhammeeyay! / Finished | La dhammeeyay! | Finished |
| app/speaking.js | Mar kale / Again | Mar kale | Again |
| app/speaking.js | Mar kale / Start again | Mar kale | Start again |
| app/speaking.js | Mar kale isku day, eray kasta si cad u dheh. / Try again, say each word clearly. | Mar kale isku day, eray kasta si cad u dheh. | Try again, say each word clearly. |
| app/speaking.js | Marka hore dhegeyso, kadib khadku wuu muuqdaa. / Listen first, then the line appears. | Marka hore dhegeyso, kadib khadku wuu muuqdaa. | Listen first, then the line appears. |
| app/speaking.js | Maya / No | Maya | No |
| app/speaking.js | Mikrofoonku ma shaqeyn. / The microphone did not work. | Mikrofoonku ma shaqeyn. | The microphone did not work. |
| app/speaking.js | Mikrofoonku ma shaqeyn. Dhegeyso oo ku celceli cod dheer. / The microphone did not work. Listen and repeat aloud. | Mikrofoonku ma shaqeyn. Dhegeyso oo ku celceli cod dheer. | The microphone did not work. Listen and repeat aloud. |
| app/speaking.js | Muuji khadka / Show the line | Muuji khadka | Show the line |
| app/speaking.js | Qaamuuska sawirka / Picture dictionary | Qaamuuska sawirka | Picture dictionary |
| app/speaking.js | Tababar wadahadal oo qoraal diyaar ah — ma aha macallin AI ah, mana aha wadahadal xor ah. / Scripted conversation practice — not an AI tutor, not free conversation. | Tababar wadahadal oo qoraal diyaar ah — ma aha macallin AI ah, mana aha wadahadal xor ah. | Scripted conversation practice — not an AI tutor, not free conversation. |
| app/speaking.js | Tababar wadahadal oo qoraal diyaar ah — ma aha macallin AI ah, mana aha wadahadal xor ah. Dhegeyso marka hore, kadib dooro jawaabta ama khadka dheh. Khaladku wuxuu aadaa safkaaga khaladaadka. / Scripted conversation practice — not an AI tutor, not free conversation. Listen first, then choose a reply or say the line. Mistakes join your mistake queue. | Tababar wadahadal oo qoraal diyaar ah — ma aha macallin AI ah, mana aha wadahadal xor ah. Dhegeyso marka hore, kadib dooro jawaabta ama khadka dheh. Khaladku wuxuu aadaa safkaaga khaladaadka. | Scripted conversation practice — not an AI tutor, not free conversation. Listen first, then choose a reply or say the line. Mistakes join your mistake queue. |
| app/speaking.js | Wali la bilaabin / Not started | Wali la bilaabin | Not started |
| app/speaking.js | Waxaad tidhi / You said: | Waxaad tidhi | You said: |
| app/speaking.js | Xeerka / The rule: | Xeerka | The rule: |
| app/speaking.js | eray / words. | eray | words. |
| app/speaking.js | khad / lines | khad | lines |
| app/speaking.js | ← Jaantusyada / Flowcharts | ← Jaantusyada | Flowcharts |
| app/speaking.js | ← Tababar / Practice | ← Tababar | Practice |
| app/speaking.js | ⚠️ Browser-kani aqoonsiga hadalka ma taageero. Dhegeyso oo cod dheer ku celceli — taasi waa tababar dhab ah. / Speech check is not supported here — listen and repeat aloud instead. | ⚠️ Browser-kani aqoonsiga hadalka ma taageero. Dhegeyso oo cod dheer ku celceli — taasi waa tababar dhab ah. | Speech check is not supported here — listen and repeat aloud instead. |
| app/speaking.js | 🎉 Dhammaan waa sax! / All matched | 🎉 Dhammaan waa sax! | All matched |
| app/speaking.js | 🎙️ Dhegeysanayaa... hadda dheh. / Listening... speak now. | 🎙️ Dhegeysanayaa... hadda dheh. | Listening... speak now. |
| app/speaking.js | 👄 Booska afka / Mouth position | 👄 Booska afka | Mouth position |
| app/speaking.js | 🔴 Wali isku mid ma aha / Not matched yet | 🔴 Wali isku mid ma aha | Not matched yet |
| app/speaking.js | 🟡 Waad ku dhawaatay — mar kale isku day / Close — try again | 🟡 Waad ku dhawaatay — mar kale isku day | Close — try again |
| app/speaking.js | 🟢 Waa isku mid / Matched | 🟢 Waa isku mid | Matched |
| app/speaking.js | 🧱 Qaybaha codka / Syllable blocks | 🧱 Qaybaha codka | Syllable blocks |
| app/watch.js | Cusub / Newest | Cusub | Newest |
| app/watch.js | Eray kasta oo Ingiriisi ah taabo si aad u aragto macnihiisa Soomaali, kadibna kaydi dib-u-eegistaada. / Tap any English word to see its Somali meaning, then save it to your review deck. | Eray kasta oo Ingiriisi ah taabo si aad u aragto macnihiisa Soomaali, kadibna kaydi dib-u-eegistaada. | Tap any English word to see its Somali meaning, then save it to your review deck. |
| app/watch.js | Eraygan wali qaamuuska kuma jiro. / This word is not in the dictionary yet. | Eraygan wali qaamuuska kuma jiro. | This word is not in the dictionary yet. |
| app/watch.js | Isku day eray kale, ama nadiifi raadinta. / Try another word, or clear the search. | Isku day eray kale, ama nadiifi raadinta. | Try another word, or clear the search. |
| app/watch.js | Kaararkaaga ayuu ku jiraa / In your review deck | Kaararkaaga ayuu ku jiraa | In your review deck |
| app/watch.js | Kanaalka YouTube ee akadeemiyadda / The academy’s YouTube channel | Kanaalka YouTube ee akadeemiyadda | The academy’s YouTube channel |
| app/watch.js | Kanaalka fur / Open channel | Kanaalka fur | Open channel |
| app/watch.js | Kaydi dib-u-eegis / Save to review | Kaydi dib-u-eegis | Save to review |
| app/watch.js | Liiska / Back to list | Liiska | Back to list |
| app/watch.js | Macnaha Soomaaliga / Somali meaning | Macnaha Soomaaliga | Somali meaning |
| app/watch.js | Muuqaal kasta oo cusub oo kanaalka la geliyo halkan ayuu si toos ah uga soo baxaa. Liiska ka dooro muuqaal. / Every new channel video appears here automatically. Pick a video from the list inside the player. | Muuqaal kasta oo cusub oo kanaalka la geliyo halkan ayuu si toos ah uga soo baxaa. Liiska ka dooro muuqaal. | Every new channel video appears here automatically. Pick a video from the list inside the player. |
| app/watch.js | Muuqaallada cusub ee kanaalka — internet ayay u baahan yihiin. / The channel’s newest uploads — needs internet. | Muuqaallada cusub ee kanaalka — internet ayay u baahan yihiin. | The channel’s newest uploads — needs internet. |
| app/watch.js | Muuqaalladii ugu dambeeyay / Latest videos | Muuqaalladii ugu dambeeyay | Latest videos |
| app/watch.js | Nadiifi raadinta / Clear search | Nadiifi raadinta | Clear search |
| app/watch.js | Natiijo lama helin / No episodes found | Natiijo lama helin | No episodes found |
| app/watch.js | Raadi cashar muuqaal ah / Search episodes | Raadi cashar muuqaal ah | Search episodes |
| app/watch.js | Taabo si aad u daawato / Tap to load | Taabo si aad u daawato | Tap to load |
| app/watch.js | Tababar: fur door-ka-ciyaarka / Practise the role-play | Tababar: fur door-ka-ciyaarka | Practise the role-play |
| app/watch.js | Waa la kaydiyay — kaararka dib-u-eegista / Saved to your review deck | Waa la kaydiyay — kaararka dib-u-eegista | Saved to your review deck |
| app/watch.js | cashar / episodes | cashar | episodes |
| citizenship.js | Akhriska / Reading | Akhriska | Reading |
| citizenship.js | Dhammaan / All | Dhammaan | All |
| citizenship.js | Horumarka / Progress | Horumarka | Progress |
| citizenship.js | Maanta / Today | Maanta | Today |
| citizenship.js | Qoraalka / Writing | Qoraalka | Writing |

## Stage 5 — Language purity (completed by Nuur, 2026-11-21)

Nuur's QA failure (7/8) fixed directly after the stage sat unstarted overnight. Rule applied: interface chrome follows the UI toggle via the existing `lng(so,en)` helper; English remains only as learned content. Spoken Somali untouched — no string fed to `speak()` was changed (the Somali prompt voice-lead in exercises renders the identical `ex.qSo` string, only repositioned).

### Strings changed (before → after)
1. Lesson nav indicator (app/placement.js): "Qayb X / 11" + "Section X of 11" stacked → `lng('Qayb X / 11','Section X of 11')`, one line, follows the toggle.
2. Step bar (learn.js): STEPS pairs "Objective / Hadafka" rendered whole → picked by UI language.
3. Guest banner: "Horumarka lama kaydinayo… / Progress is not saved…" → lng pair.
4. Step 0 + Step 1 objective: English objective printed above the Somali → single objective in the UI language (immersion still shows English).
5. Step 0 pass-requirements paragraph: Somali + full English translation appended → lng pair.
6. Step 0 lesson-1000 box: Somali body + English span → lng pair.
7. Step 3: intro line and slow-button note ("… / Slow button: tap…") → lng pairs.
8. Step 4: "Waan ku dhawaaqay ✓ I said it aloud" button, the no-microphone help paragraph (Somali only), and the self-mark success message → lng pairs (English help text authored to match the Somali).
9. Step 6: "Qor jumlo run ah… — Write a true sentence using this word." → lng pair.
10. Guided-review paragraph: Somali + " / " + English → lng pair.
11. Result screen: "Waad gudubtay! You passed!", Somali-only score labels and pass/fail paragraphs, "QALIN-JABIN! GRADUATION!" banner → lng pairs (English versions authored to match).
12. Lesson nav buttons: "Xiga → Next", "← Dib", "Dhammee & tag Hoyga", "Mar kale isku day" → lng pairs.
13. Listening helper (listenBtnsHTML): "Jumlada/eryagu waa X eray… / The sentence has X words…" → lng pair.
14. Exercise pill: hardcoded "Layli 1 / Exercise 1" / "Hubin 1 / Quiz 1" (always "1") → `lng('Layli','Exercise')` / `lng('Hubin','Quiz')` + the real exercise index.
15. Exercise prompts (lesson player + drill renderer): English prompt first, Somali below → in Somali UI the Somali prompt leads (voice-lead preserved for lessons ≤100) and the English prompt follows as the content line; English UI unchanged.
16. Free-text placeholder "Halkan ku qor / Type here" (×3) and the speak-button aria-label → lng pairs.
17. Home "next for you" card (nextForYou): bilingual buttons ("Start review / Bilow dib-u-eegista" etc.) and the weakest-skill label ("Speaking / Hadal" embedded in both sentences) → lng picks.
18. Reading-check feedback: "Sababta / Why: …" → lng pair.
19. Speaking studio (app/speaking.js): syllable legend and the word-matching note → lng pairs.

### Sweep results
Grepped the lesson player, drill renderer, placement nav, speaking studio and home card for `" / "` chrome joins and English-first prompts. All visible instances fixed except three FLAGGED items:
- `hintFor()` hint strings carry "Tilmaan / Hint:" prefixes and Somali-only bodies — left untouched on purpose: the 130 hint strings are in Zamzam's review queue, and changing them now would collide with her pass.
- The completion certificate is intentionally bilingual (a printed document carrying both academy names and the honest-label in both languages).
- Mouth-diagram badges in the speaking studio (`l[0] / l[1]`) are diagram content labels, left as-is.

### Test results
- Project suite: see the stage-5 commit run (`node --test tests/*.cjs` on the Mac).
- Nuur's independent language QA (Playwright, both UI languages, Lesson 1 steps 0–10 + nav + exercise pill + placeholder): 38/38 PASS — no English chrome in Somali UI, no Somali chrome in English UI, exactly one result panel, no page errors.
