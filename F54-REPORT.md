# F54 report — Pilot: one learning journey (Home → Lesson 1 → complete → saved)

Built Nov 22, 2026 in `~/Projects/sea-f53`. **Not published and not pushed.** All commits are local. Nuur live-QAs, and the owner decides on publishing.

## Commits (local only)

| Commit | Stage |
|---|---|
| `55a3a3a` | 1: Lesson 1 opens on the letter |
| `f63bfe2` | 2: labelled audio controls in the lesson player |
| `db19dcb` | 3: tutor from Home and from inside the lesson |
| `3675670` | 4: one Continue card, one progress number on Home |
| `de7a45a` | 5: Library shows the current unit and the next lesson |
| `cdd8fa8` | QA: checks (a)–(e), string purity, suite expectation, after-screenshots |

Product files touched across all of F54 (`git diff 0c84ca8 HEAD --stat`, reports excluded):

| File | Change |
|---|---|
| `app/learn.js` | +45 / −15 |
| `academy-ui.js` | +24 / −38 |
| `academy.css` | +40 |
| `tests/ui.cjs` | 1 line |

## Results at a glance

| QA | Result |
|---|---|
| Existing Mac suite (`node --test tests/*.cjs`: UI + language purity) | **14 / 14 pass**, 0 fail |
| Every lesson opens (harness, 1–1000) | **1000 / 1000**, no page errors |
| (a) L1 first screen = letter + Listen before any intro | **PASS** |
| (b) Resume from Home in ≤2 taps | **PASS**: 1 tap |
| (c) Tutor reachable from Home and inside a lesson | **PASS** |
| (d) Profile change shows a saved confirmation and survives a refresh | **FAIL** (confirmation). The change does survive the refresh. See Deviations. |
| (e) Phone width + large text: keyboard and bottom nav never hide the primary lesson button | **PASS**: 20 checks, 0 failures |
| F54 string purity (no English F54 label in Somali UI, and the reverse) | **PASS** both ways |

Raw numbers: `reports/f54/f54_checks.json`. Script: `reports/f54/f54_checks.cjs` (run it against a Range-capable server on 127.0.0.1).

## Per item

### 1. Lesson 1 first interaction
- **What changed:**
  - Step 0 of Lesson 1 is now the lesson itself:
    - a large **A a**;
    - labelled **Listen** and **Slow** buttons;
    - the word row (apple picture, "apple", "tufaax", Listen);
    - the first simple activity: hear the word, tap the right picture of 3, with "Sax!"/"Wali maya" feedback.
  - The old step-0 objective card now sits in a collapsed **"About this lesson"** `<details>` below the activity. It can be opened, and it is never in front of the letter.
  - Every other lesson's step 0 is unchanged.
- **Content:** no new lesson facts. The letter comes from L1's first vocab word. The activity is L1's existing first exercise (`exercisesFor(l)[0]`). The intro is the existing objective HTML, unchanged.
- **Files:** `app/learn.js` (`l1FirstHTML`, `wireL1First`; step 0 branches on `l.n===1`) and `academy.css` (`.l1-*`, `.letter-hero`).
- **QA (a):**
  - step 0, letter "A a", Listen label "Dhegeyso";
  - 3 options;
  - intro after the letter and collapsed;
  - objective card not first;
  - activity completable unaided (tap apple → "Sax!").

### 2. Labelled audio controls (shared lesson player)
- **What changed:**
  - New `audioBtn(text, slow)` renders a pill button with an icon and a visible label: **Listen** (Dhegeyso) or **Slow** (Tartiib dhegeyso). It is at least 48 × 48 px.
  - When you tap it:
    - **loading** state: dashed border, spinner, `aria-busy`;
    - **playing** state: accent fill, animated wave;
    - back to idle when playback ends, and the Listen label then reads **Replay** (Mar kale).
  - All 18 icon-only `speakBtn(` calls in the lesson player (renderLesson + exerciseHTML) now use `audioBtn`. `listenBtnsHTML` shows a Listen + Slow pair.
- **Unchanged:** `speak()` and `lookupAudioClip` are not edited. State is read from the existing `speaking` class that `speak()` already sets, plus the player's own media/speech state, using a passive 80 ms poll. `speakBtn` is still used outside the lesson player (13 places: review etc.), as scoped.
- **Files:** `app/learn.js` (`audioBtn`, `audioPlaying`, `watchAudio`, `bindSpeak`) and `academy.css` (`.audio-btn`, `.audio-row`, `.spin`, `.is-loading`, `.is-playing`).
- **QA:** the full loading → playing → idle cycle was verified on the media route, with the label ending on "Mar kale". 1000/1000 lessons open.

### 3. Tutor access
- **What changed:**
  - **Home:** a second door under the Continue card: **Ask your tutor / Weydii macallinka**, with the existing disclaimer "Caawinta AI way qaldami kartaa." It calls the existing `window.__seaTutor()`.
  - **Lesson:** an **Ask your tutor** button next to "Leave lesson" at the top of the player. It opens the existing `#academyTutor` panel, scrolls it into view and focuses its text box.
  - No new tutor and no new AI calls. Hidden in guest mode, like the panel.
- **Files:** `academy-ui.js` (Home door, `chat` icon, `#lesTutor`) and `academy.css` (`.les-top`, `.les-tutor`).
- **QA (c):**
  - Home door visible; from Home, the tutor opens with the text box focused.
  - From inside a lesson, the panel opens with the text box focused.
  - The in-lesson button is at y = 84–136 px, well above the bottom bar (top at 762 px), and does not overlap lesson content.

### 4. Home: one Continue card, one progress number
- **What changed:**
  - The hero card is now the single Continue card. It shows:
    - the stage name;
    - "Continue where you left off — Lesson N" with the lesson title;
    - one **Continue learning** button.
  - The competing stats (progress ring, stage count, daily-goal bar and caption, streak/stars "vitals" row) are replaced by **one** progress bar: **"N / 1,000 cashir" / "N of 1,000 lessons"**.
  - The journey road is untouched, and its own header count is kept as it was.
- **Files:** `academy-ui.js` (renderHome hero, layout; removed `doneToday`/`vitals`) and `academy.css` (`.one-progress`).
- **QA (b):** a returning learner with Lesson 1 done lands on Home. One tap on Continue opens Lesson 2.

### 5. Library: next lesson obvious
- **What changed:**
  - The unit picker marks the learner's unit with "· current".
  - Above the current unit's list is a **"Your current unit"** marker, and the list gets a soft outline.
  - The next lesson gets a filled accent row, an arrow, `aria-current="step"`, and a **"Next · Lesson N"** badge.
  - Units and lock logic are unchanged.
- **Files:** `academy-ui.js` (renderLessons) and `academy.css` (`.unit-here`, `.is-current-unit`, `.is-next`, `.next-badge`).

## Test-suite expectation updated (one)

- `tests/ui.cjs:81`: the Home door list expectation changed from `['Review your words']` to `['Review your words','Ask your tutor']`. This was forced by item 3 (the tutor door on Home). No other expectation changed.

## Screenshots (390 × 844, 2×)

`reports/f54/before/` (pre-F54) and `reports/f54/after/`:

1. `1_welcome.png`
2. `2_home.png`
3. `3_lesson1_first_screen.png`
4. `4_lesson_player_mid_activity.png`
5. `5_library.png`

## FOR ZAMZAM CHECK — new Somali UI strings (drafts, not final)

| Draft Somali | English | Where |
|---|---|---|
| Ku saabsan casharkan | About this lesson | L1 collapsed intro |
| Tartiib dhegeyso | Slow | Slow audio button. Fixes the existing typo "Tartiiib dhegeyso"; the wording is otherwise the existing one. |
| Mar kale | Replay | Listen button after playback. "Mar kale" already exists (as "Again / Try again"); it is new in this role. |
| hadda | current | Unit picker suffix ("… · hadda") |
| Qaybtaada hadda | Your current unit | Library marker |
| {N} / 1,000 cashir | N of 1,000 lessons | Home progress label ("cashir" as used in the existing "1,000 cashir oo …") |
| Xiga · Casharka {N} | Next · Lesson N | Library next-lesson badge ("Casharka" already exists; "Xiga" in this combination is new) |

**Reused existing approved strings:**
- Dhegeyso
- Weydii macallinka
- Caawinta AI way qaldami kartaa.
- Sax!
- Wali maya
- Ka bax casharka
- Sii wad barashada

## Fences

These were verified with `git diff 0c84ca8 HEAD`:
- `audio/` and `audio/index.json`: untouched.
- Lesson data, hint data, storage keys, IndexedDB/SRS: untouched. No new storage writes in the diff.
- Profile, placement/Test mode, GED, Forms, dictionary: untouched.
- Palette and fonts: no new colours or fonts. All new CSS uses the existing tokens.
- Local server bound to 127.0.0.1 only. Long runs used `caffeinate`.

## Deviations and why

1. **Check (d) fails on the confirmation.** Changing the Profile name does persist across a refresh ("Ayaan F54" after reload), but no "saved" confirmation appears. The Profile page is a hard fence in this mission, so I measured it and did not fix it. Adding the confirmation is a one-line Profile change; it needs the owner to lift the fence.
2. **The L1 warm-up reuses the lesson's first exercise.** It runs as unscored practice at step 0, so the same picture-listen question appears again in the scored practice later in the lesson. This keeps "no new lesson facts"; the trade-off is one repeated question.
3. **The Home daily-goal bar, the "done for today" state and the streak/stars row were removed from the card** to reach one progress number, as item 4 asks. The streak data is still stored; it just isn't shown on Home now. The journey road and its own count are unchanged.
4. **Local test server.** Python's `http.server` has no HTTP Range support, so locally the audio bundles played from the wrong offset and never ended. That would make any audio-state QA against it misleading. I ran QA on a small Range-capable server on 127.0.0.1:8778. The live host already supports Range.
5. **Language QA.** Nuur's 38-check language QA isn't in this repo. The repo's own purity tests pass, and I added an F54 string-purity check on top (both directions, Somali UI and English UI).
6. **Known leftover text.** One existing lesson note (step 3) still says to tap the wave icon. The control now carries a label next to the wave, so the instruction still works, but its wording predates F54. Lesson text is fenced, so I left it.
7. **QA bug found and fixed along the way.** A comment I added to the check script broke it for one run. I spotted it, fixed it, and all numbers above are from the corrected run.

## Stop

F54 Part 1 is complete. Nothing is published and nothing is pushed. Astra's review (Part 2) and Nuur's live QA are next, per the brief.
