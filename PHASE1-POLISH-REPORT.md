# Phase 1 polish: audio clips + Nuur's visual QA fixes

Nov 28, 2026 · pilot on `~/Projects/sea-f53` · **not published, not pushed**, `sw.js` untouched (no version bump).

## Result

| Check | Before | Now |
|---|---|---|
| Citizenship lines with a real clip (2025 + 2008 banks) | 0 / 867 | **867 / 867** |
| Greyed-out "not ready" Listen controls in practice | every one | **none** |
| `p1_checks.cjs` | 84 / 84 | **101 / 101** (17 new checks) |
| Test suite (`node --test tests/*.cjs`) | 14 / 14 | **14 / 14** |
| Device-voice (speechSynthesis) calls on Phase 1 screens | 0 | **0** |

## Job 1: audio clips

- I installed `edge-tts` 7.3.1 with `pip install --user edge-tts` and ran `tools/phase1_clips.py` unchanged. It finished cleanly (exit 0) in about 20 minutes.
- **Voices:** English uses `en-US-AriaNeural` for every question and answer. Somali uses `so-SO-UbaxNeural` for every explanation.
- **Output:** 867 unique lines (193 questions, 511 answers, 163 Somali explanations) in six new bundles, `audio/bundle-11.mp3` to `bundle-16.mp3`. That is 150 clips per bundle, 117 in the last, about 22 MB in total.
- **Format:** the same as the existing bundles: mp3, 22.05 kHz, mono, 48 kb/s, with 0.4 s gaps.
- **Registry:** each clip is registered in `audio/index.json` as `[bundle, start, duration]`. The ten existing bundles and their clips are untouched.
- **How I checked it:**
  - In every bundle, the last clip's end matches the file length to within the trailing 0.4 s gap, so the offsets line up.
  - I measured the volume of randomly sampled clips, and each one contains speech (mean about −22 dB).
  - `--dry-run` now reports `missing: 0`.
  - In the browser, `audio.allLinesRegistered` looks up all 1,143 bank lines (867 unique) and finds a clip for every one.
  - On both screen sizes, the question clip and every answer and explanation clip play through the media route.
- **A bug the re-run turned up:**
  - **What happened:** on the phone pass, the first tap on Dhegeyso fell back to the **device voice**. The shared player gives the media element 1.2 s to start, then Web Audio another 1.2 s, then hands over to the device voice. A cold bundle sought deep into its file (question 25 sits at 485 s) took about 1.1 to 1.2 s, right on that limit.
  - **The fix:** a strict mode in `app/core.js`. `playRecorded(text, clip, slow, btn, strict)` gives media 5 s and Web Audio 8 s to start, and never calls the device voice.
  - **Scope:** only the Phase 1 Listen controls (`wireClips` in `citizenship.js`) pass `strict`. Every other `speak()` caller in the app behaves exactly as before.
  - **Proof:** I delayed the bundle by 2.5 s on purpose. The old path went to `route: "tts"` with one device-voice call. Strict mode played the clip, `route: "media"`, with zero device-voice calls.

## Job 2: Nuur's visual QA fixes

1. **Real image pack.**
   - `__p1Art` (`academy-ui.js`) no longer draws SVGs. It serves `hero-capitol.jpg` for the Home hero and the Jinsiyadda header, and the four `card-*.webp` files for the learn-today cards.
   - The photos are cropped with `object-fit: cover`.
   - **Phone-sized copies:** the originals in `phase1-images/` are untouched. Phone-sized copies are in `phase1-images/web/`: the hero at 960 px (104 KB) and the cards at 480 px (6 to 9 KB each, against about 100 KB for the 1920 px originals).
   - **Removed:** about 30 lines of hand-drawn SVG.
2. **Practice is a focus screen.**
   - During a session the global header (SO/EN, AA, profile) and the bottom nav or rail are hidden. Only the session header is left: ← Jinsiyadda, Su’aasha n and the progress segments.
   - This works through a `body.p1-focus` class that both `paint()` (citizenship) and `shell()` set from the DOM. It is on only while `.p1-session` is on screen.
   - The completion screen's "Ku noqo" button and ← Jinsiyadda both bring the header and nav back.
3. **"Waan aqaan ✓" no longer clipped.** With the fixed nav gone from the session, nothing overlaps the button. The session also gets `padding-bottom: calc(40px + env(safe-area-inset-bottom))`. A check scrolls the button to the bottom edge and confirms that the point under its centre is the button itself.
4. **AA and the profile chip look different.**
   - The text-size control is now a 48 px outlined **rounded square** with a small A and a large A on a transparent background.
   - The profile chip is a **solid teal circle** with white initials.
   - A check asserts that their shape, fill and text colour all differ.
5. **"Muuji jawaabta" is a solid card.** The dashed empty box is replaced by a solid pale-teal card with the shared shadow, a teal eye icon and the label. The text is unchanged.

## Screenshots: `reports/phase1/polish/`

These are the same seven shots as before, from the same returning learner (24 questions known, at 390 px and 1280 px):

- `1_home_wide.png` and `1_home_phone.png`: the Capitol photo in the hero, and AA clearly separate from the teal profile circle.
- `1_home_phone_full.png`: the four illustrated cards. The nav bar showing mid-page is just how Playwright draws a fixed bar in a full-page capture; on a real screen it sits at the bottom.
- `2_citizenship_phone.png` and `_full.png`: the Capitol photo in the header.
- `3_practice_question_phone.png`: no global header or nav, a live teal Dhegeyso bar with no "not ready" note, and the solid reveal card.
- `3_practice_answer_phone.png`: live clip buttons on the answer and the Somali explanation, and "Waan aqaan ✓" fully visible.

## New checks in `reports/phase1/p1_checks.cjs`

- **Removed:** the temporary "missing clip shows a note" check, and the fake registered clip it injected.
- **Added:** `audio.allLinesRegistered`, plus these at each width:
  - `audio.question.noMissingState`, `audio.questionClipPlays`
  - `audio.answer.noMissingState`, `audio.answerClipsPlay`
  - `polish.focus.noGlobalChrome`, `polish.focus.chromeRestored`
  - `polish.reveal.solidCard`, `polish.know.unobscured`
- **Phone only:** `polish.images.home` and `polish.header.aaVsProfileDistinct`.
- The first clip's start time is now recorded (`audio.questionClipPlays.ms`) instead of being hidden behind a fixed sleep.

## Diff summary (from the previous commit, 06efe91)

```
 academy-ui.js                     |   37 +-     image pack replaces drawn SVGs; p1-focus toggle in shell()
 academy.css                       |   19 +-     photo crop, AA square / teal profile, solid reveal card, focus mode, session padding
 app/core.js                       |   11 +-     strict playRecorded (longer start window, no device voice)
 citizenship.js                    |    7 +-     reveal card markup, p1-focus toggle in paint(), strict clip playback
 audio/index.json                  |    2 +-     867 new clip entries + 6 bundle paths (one-line file)
 reports/phase1/clip-manifest.json |    rewritten  now reports missing: 0
 reports/phase1/p1_checks.cjs      |   40 +-     audio + polish checks
 reports/phase1/p1_checks.json     |  regenerated 101/101
 new: audio/bundle-11..16.mp3 (≈22 MB), phase1-images/web/ (5 files, 140 KB), reports/phase1/polish/ (7 PNGs), this report
```

`phase1-images/` (Nuur’s originals, README and the `web/` copies) is committed so that the build’s image paths resolve. `PHASE1-BRIEF.md` and `PHASE1-REFERENCE.jpg` stay untracked, as before.

## Still open

- **Capitol photo licence:** Nuur's README says to check the Wikimedia Commons licence page before any public publish, or to swap in a public-domain Architect of the Capitol photo.
- **Listen check:** a person should listen to a sample of the Somali Ubax clips. The checks prove that each clip exists, is aligned and has sound, not that it is pronounced well.
- **Download size:** the six new bundles add about 22 MB. It's fetched only by range as learners tap Listen, but it counts if the service worker ever pre-caches `audio/`.
- **Unchanged from the first report:** removing the journey road (an F54 rule), the Screen 2 nav ("Akunka"), Zamzam's string check, Nuur's live QA, and the owner's publish decision.
