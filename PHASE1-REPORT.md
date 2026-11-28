# Phase 1 report: Learning home, Citizenship, Focused practice

Built Nov 28, 2026 on the f53 tree (`~/Projects/sea-f53`). **Not published and not pushed.** There is one local commit, `759d960`. `sw.js` is untouched, so the live service worker version has not been bumped.

## Status

| Item | Result |
|---|---|
| Screen 1: learning home | Built. Matches the reference layout at phone and wide widths. |
| Screen 2: citizenship home, as its own destination | Built. Jinsiyadda is now a top-level item in the bottom nav and the rail. |
| Screen 3: focused practice | Built. Five-question sessions, ratings save to the existing progress store. |
| Real-audio rule: no device voice on Phase 1 screens | **Done in code.** Every Listen control on the three screens plays only a registered clip. When a clip is missing, the button greys out and shows a note. It never falls back to the robot voice. |
| Real-audio rule: clip coverage for the citizenship bank | **Blocked. 0 of 867 lines have a clip.** The generator is written and tested apart from synthesis. It needs your permission to install and run Edge TTS. See "Blocked". |
| Existing test suite | **14 / 14 pass.** Expectations I updated are listed below. |
| Phase 1 acceptance checks (`reports/phase1/p1_checks.cjs`) | **84 / 84 pass** at 390 px and 1280 px, for a returning learner and a fresh one. |

## Screenshots

These are 2× captures of a returning learner: named "Abdirashid Abi", 3 lessons done, 24 citizenship questions known. All are in `reports/phase1/after/`; the pre-Phase-1 equivalents are in `before/`.

- `1_home_wide.png`: Screen 1 at 1280 px, with the rail.
- `1_home_phone.png` and `1_home_phone_full.png`: Screen 1 at 390 px.
- `2_citizenship_phone.png` and `2_citizenship_phone_full.png`: Screen 2.
- `3_practice_question_phone.png`: Screen 3 before the reveal.
- `3_practice_answer_phone.png`: Screen 3 after the reveal.

I also checked dark mode and large text at 360 px. There was no horizontal scroll; those captures were not kept.

## What was built

### Screen 1: Home (Hoyga)
- **Header:**
  - Greeting "Salaan, {first name}." from the profile, or "Salaan." when there is no name. Subline as in the brief.
  - Segmented SO | EN toggle, with the active side filled teal.
  - **AA** text-size control. It toggles the existing large-text setting and really scales the text: the greeting goes from 30 px to 33.75 px on phones (36 px to 40.5 px wide) and body text from 16 px to 18 px. It is a real button with `aria-pressed`.
  - On phones, a profile chip with the learner's initials sits in the header.
- **Navigation:**
  - Hoyga, Casharro, Jinsiyadda, Ku celceli, Qaamuus, Wax kale. It is a bottom bar on phones and a rail from 1024 px.
  - The active item gets a pale-teal pill.
  - On wide screens the profile chip sits at the bottom of the rail.
  - It fits at 320 px with no horizontal scroll (checked by the existing suite).
- **Hero card:** "Qorshaha maanta", "U diyaargarow jinsiyadda.", the 10-minute line and **Sii wad barashada →**. The button opens a focused practice on the learner's **next five unlearned questions**, read from the stored progress. With questions 1–24 known it starts at question 25; for a fresh learner it starts at question 1.
- **Safarkaaga** (your journey): Baro → Ku celceli → Is tijaabi, joined by a line. Each step opens its mode: practice, flashcards, mock test. The brief doesn't define when a step counts as done, so I used:
  - Baro is done at 50% of questions known;
  - Ku celceli is done at 90%;
  - Is tijaabi is done after a passed mock test.

  The first step not yet done is the current one.
- **Horumarkaaga** (your progress): a progress ring showing the count of known questions from the stored progress, with total 128, 100, or 20 in 65/20 mode. It updates after practice and after a refresh.
- **"Wax aad maanta baran karto"** (what you can learn today): a 2×2 grid with small drawn illustrations.
  - Ingiriisi opens the next English lesson.
  - Hadal & Dhegeysi opens Practice.
  - Foomamka opens Forms.
  - GED opens GED.

  Each section is unchanged inside.
- **Bottom strip:** Muuqaallo • Qaamuus • Macallinka AI.

### Screen 2: Jinsiyadda
- **Header:** back chevron (phones only) and the title "Jinsiyadda".
- **Headline block:** "Maalintaada way soo socotaa." and "Aan maanta hal tallaabo qaadno.", with the Capitol drawing on the right.
- **Today's lesson:** a dark-teal "Casharka maanta" card showing "5 su'aalood · 10 daqiiqo" (or fewer if fewer remain) and a white **Bilow →** button. It resumes an unfinished session, otherwise it starts the next five.
- **Settings rows, under the practice card:**
  - **Nooca imtixaanka** shows 2025/2008. It opens the existing edition switch, the filing-date note and the 65/20 toggle.
  - **Taariikhda wareysiga** shows "Ku dar +" or the days left. It opens the existing date input, countdown and change control.

  Behaviour is unchanged: both are checked by saving 2008 and a date.
- **Qaybaha imtixaanka** (the parts of the test): Su'aalaha, Akhris, Qoraal and N-400, plus a wide pale-teal **Wareysi tijaabo ah** row. Each opens its existing mode.

### Screen 3: Focused practice
- **Top:** "← Jinsiyadda" and "Su'aasha {n}", with a progress bar of 5 segments (completed ones filled teal).
- **Question:** a teal capitals heading for the question's existing section, then the question in the largest type on the screen.
- **Listen bar:** pale teal, with a speaker and a waveform. Clip only.
- **Helper line:** "Marka hore cod dheer isku day."
- **Answer:** hidden behind a full-width "Muuji jawaabta" tap area. Revealing it shows a pale-teal card with:
  - **JAWAABTA**;
  - the first answer in large type;
  - the other accepted answers;
  - the Somali explanation, verbatim from the bank;
  - the existing "this answer can change" note where it applies;
  - a small Listen button on each answer and on the explanation, for the clips once they exist.
- **Ratings:**
  - **Waan aqaan ✓** saves the question as known (`S.citizenship.civ[ed].known[n] = 1`).
  - **Weli waan baranayaa** removes it from known and adds it to review, the same as the old flashcards.
  - Both move to the next question. **Xiga →** skips ahead without rating.
- **End of session:** "N / 5" marked Waan aqaan, then **Ku noqo Jinsiyadda**.
- **Flashcards:** the existing Su'aalaha flashcards also use the clip-only Listen bar now.

## The real-audio rule

- **Code: done.** The Phase 1 Listen controls call the recorded-clip player directly and never `speak()`. `speak()` itself is untouched; it is the function with the device fallback.
  - The checks wrap `speechSynthesis.speak` and confirm **0 calls**, both when a clip is missing and when one is registered.
  - With a test clip registered, playback goes through the existing recorded-audio route.
- **Clips: blocked.** The citizenship bank has **no clips today**. The dry run (`reports/phase1/clip-manifest.json`) lists 867 unique lines across both editions:

  | Kind | Lines |
  |---|---|
  | Questions | 193 |
  | Answers | 511 |
  | Somali explanations | 163 |

  Until they are generated, every Listen control on these screens shows the greyed-out "not ready" state.
- **Generator:** `tools/phase1_clips.py`.
  - Voices: English `en-US-AriaNeural`, Somali `so-SO-UbaxNeural`.
  - It writes new bundles `audio/bundle-11.mp3` onward, in the same format as the existing ones (mp3, 22.05 kHz, mono, 48 kb/s, 0.4 s gaps), in 150-clip bundles.
  - It registers each clip in `audio/index.json` in the shape the app already reads.
  - I tested the bundling and timing with test tones; synthesis itself has not run.

## Blocked, or costly because of the current code

1. **Edge TTS generation (blocked).** The Edge TTS package isn't installed here, and fetching and running it with `uvx` was denied by this session's permission check, so I didn't retry it. To finish, you can install it yourself (`pip install edge-tts`), or tell me to and approve the install. Then run:
   ```
   FFMPEG=~/node/bin/ffmpeg FFPROBE=~/node/bin/ffprobe python3 tools/phase1_clips.py
   ```
   That run adds roughly 5–7 bundle files (about 1 hour of audio in total, roughly 20–25 MB). It needs to be re-checked before publishing.
2. **Other citizenship modes still use the device voice.** "Dhegeyso oo garo", "Dhegeyso adigoo mashquul ah", the mock test and the interview call `speechSynthesis` or `speak()` directly. They aren't among the three Phase 1 screens, so I left them. Once the clips exist, the same clip-only player can be applied to them.
3. **No Capitol photo.** Downloading a photo needs your approval and a licence check. I used a drawn illustration in the reference style; the brief's fallback allows this. Swapping in a photo later only changes the `capitol` entry in `window.__p1Art`.
4. **Screen 2's phone nav.** The brief gives it as "Hoyga, Baro, Ku celceli, Akunka", which conflicts with Screen 1's six-item nav and the "Jinsiyadda becomes top-level" fix. I kept one consistent nav everywhere. A different nav inside one section would also hide Qaamuus and Wax kale there. "Akunka" is not used; see the Zamzam list.
5. **The F54 journey road is off Home.** Screen 1's top-to-bottom list replaces it with Safarkaaga. The road's code is still in the file but no longer shown. This reverses the F54 rule to keep the road, so please confirm.
6. **One Somali explanation field.** The bank stores the explanation and note together in one `explain_so` string, for example "…boqorna ma jiro. Saddexda jawaabood mid ka mid ah ayaa kugu filan." To keep it verbatim I show the whole string and did not split out a separate grey note. The separate note appears only for the bank's "answer can change" questions.
7. **Profile on phones.** Six destinations leave no room for Profile in the bottom bar, so it moved to a header chip. The rail keeps it at the bottom, as in the reference.
8. **The extra citizenship modes stay reachable.** The brief's Screen 2 has no place for learn-by-topic, the mock test, results, the listening modes, family mode, my answers and the wall. To avoid removing working features, they sit in a folded "Siyaabo kale oo aad ku baran karto" section below the grid.
9. **Home illustrations are drawn.** The brief allowed this for the hero; the four tile illustrations are drawn in the same style.

## FOR ZAMZAM CHECK: Somali strings

**New drafts (not final):**

| Somali | English | Where |
|---|---|---|
| Codka su'aashan weli lama diyaarin. | The recording for this question is not ready yet. | Listen bar with no clip |
| Waad dhammaysay casharka maanta. | You finished today's lesson. | End of session |
| su'aalood ayaad u calaamadisay "Waan aqaan". | questions marked "I know it". | End of session |
| Xiriirro degdeg ah | Quick links | Screen-reader label on the Home strip |

**Brief and reference wording to confirm:**
- **"QORSHAHA MAANTA".** The brief says "QORSHAGA"; I used the reference's "Qorshaha" as the likely typo fix.
- **"Horumarkaaga".** The brief has "Horumar kaaga"; the reference and the app's existing string are one word.
- **"Weli waan baranayaa".** This is the brief's spelling; the old flashcards say "Wali waan baranayaa".
- **"Akunka"** is in the brief's Screen 2 nav. It is unused here and looks like a misspelling, so please check before it is ever used.

**From the brief or reference (owner-approved, used as given):**
- Salaan / Tallaabo yar maanta. Kalsooni badan berri.
- U diyaargarow jinsiyadda. / 10 daqiiqo. Hal tallaabo oo kuu dhow.
- Safarkaaga, Baro, Ku celceli, Is tijaabi, su'aalood oo aad baratay
- Wax aad maanta baran karto, and the four tile titles and subtitles
- Muuqaallo, Maalintaada way soo socotaa., Aan maanta hal tallaabo qaadno.
- Casharka maanta, 5 su'aalood · 10 daqiiqo, Bilow
- Nooca imtixaanka, Taariikhda wareysiga, Ku dar +
- Qaybaha imtixaanka, Su'aalaha, Akhris, Qoraal, Wareysi tijaabo ah
- Su'aasha, Dhegeyso, Marka hore cod dheer isku day.
- JAWAABTA, Waan aqaan, Xiga

**Reused existing strings:**
- Casharro, Qaamuus, Wax kale, Jinsiyadda, Hoyga, Boggaaga
- Luqadda, Qoraal weyn
- Muuji jawaabta, Ku noqo Jinsiyadda
- Every hub, settings and folded-mode string carried over from the old hub

## Test expectations updated (`tests/ui.cjs`, all forced by the brief)

| Line | Change | Why |
|---|---|---|
| 64, 158 | The "Continue learning" text is now checked on the Home hero button `#p1Today` instead of `#academyContinue`. | `#academyContinue` is now the Ingiriisi tile, which still opens the next lesson, so the lesson-resume tests still pass through it. |
| 78, 156 | Nav labels are now the six destinations plus the profile chip, in English and Somali. | New navigation. |
| 81 | "Home doors are Review + Ask your tutor" became "Home has the four learn-today cards" plus "the tutor is one tap from Home (`#p1Tutor`)". | F54's tutor access is kept. |
| 82 | "Road marks where the learner is" became "Safarkaaga marks the current step". | The road is replaced on Home. |
| 160 | The 320 px no-horizontal-scroll loop now also covers Casharro, Jinsiyadda and Qaamuus. It clicks whichever Profile button is visible. | Profile moved to the header on phones. |
| 8 occurrences | `#mainNav [data-view="profile"]` became `[data-view="profile"]:visible`. | Same reason. |

## Fixes found during QA
- **Tutor entry point.** `window.__seaTutor` and `window.__seaComm` were created only when an older Home layer drew its rows, so without those rows the tutor link did nothing. They are now defined when the script loads; the existing suite caught this.
- **Nav tap inside Jinsiyadda.** Tapping Jinsiyadda in the nav from inside a citizenship sub-mode stayed in that mode. It now always lands on the Jinsiyadda home, and an unfinished practice session is kept.
- **Bottom-nav labels.** The labels clipped at 360 px with large text; they are now capped to the screen width.

## Diff summary

`git diff 613aed7 759d960 --stat`, report files excluded:

| File | Lines | What changed |
|---|---|---|
| `academy-ui.js` | +102 / −25 | Drawn illustrations (`window.__p1Art`); new header and six-item nav in `shell()`; Phase 1 `renderHome` (the older Home add-ons keyed on `.simple-home-content` no longer fire); `__seaTutor`/`__seaComm` defined at load; nav tap on Jinsiyadda resets to its home. |
| `citizenship.js` | +92 / −28 | New hub; `session` route (start, answer card, ratings, completion); clip-only `listenBar` and `wireClips`; `changesHTML` split out of `answersHTML` so both views share it; `window.__czSummary` for Home; route hand-off from Home. Storage keys unchanged. |
| `academy.css` | +184 | One scoped Phase 1 block. It uses the existing tokens, teal `#0E7C66` / deep `#0A5C4C` / paper `#FAF5EC`, 20 px radius, `rem` type so AA scales, and works in dark mode. |
| `tests/ui.cjs` | 14 lines | The expectations listed above. |
| `tools/phase1_clips.py` | +103 | New. The clip generator, with a dry run. |

New QA files, all in `reports/phase1/`:
- `p1_checks.cjs` and `p1_checks.json`
- `shots.cjs`
- `clip-manifest.json`
- the screenshots in `before/` and `after/`

Untouched:
- lesson data, both question banks and all Somali explanations;
- storage keys, the IndexedDB and spaced-review logic;
- `audio/`, `sw.js`, the Profile page, placement, GED/Forms internals and the dictionary.

## Stop
Nothing is published or pushed. Next steps:
1. Approve the Edge TTS run, then re-run `p1_checks.cjs`. With clips in place, every Listen control should play a clip and the greyed-out "not ready" state should disappear.
2. Nuur live-QAs the pilot.
3. The owner decides on publishing.
