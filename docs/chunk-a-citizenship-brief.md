CHUNK A — CITIZENSHIP ACADEMY for the Somali English Academy app. Work in the same file/repo as the current build (outputs/somali-english-academy.html on this Mac; publish as index.html in GitHub repo rashka33/somali-english-academy). First confirm the current build state (Phase 1 + 2 changes present). Preserve everything: lesson IDs/order, unlock chain, thresholds, XP/streak, placement test, SRS, IndexedDB shape, profiles/PIN, export/import compatibility, and the Phase 1/2 design system — build this section WITH the app's design tokens, fonts and icon set so it looks native, not bolted on.

ADD a new top-level section: "Citizenship / Jinsiyadda" — a complete US naturalization test academy for Somali speakers. The support language is SOMALI ONLY. All test content comes from OFFICIAL USCIS study materials (public domain) — verify every list against uscis.gov at build time and note the source + date in your report.

1) CIVICS — TWO EDITIONS, clearly labelled:
- PRIMARY: the 2025 civics test (128 study questions; for applications filed on or after Oct 20, 2025). All 128 questions with the official answers, each with a plain Somali explanation. Study modes: flashcards, learn-by-topic groups, and a MOCK TEST in the real 2025 format (20 questions drawn from the 128, pass = 12 correct — verify the current rule on USCIS).
- ALSO INCLUDE: the 2008 civics test (100 questions) for learners who filed earlier, same study modes, mock test in its format (10 asked, pass 6 — verify).
- Answers that change (current president, senators, representatives, governor) must be marked "check the current answer" in-app and use the official generic phrasing USCIS accepts.

2) READING: the official USCIS reading vocabulary list — practice sentences built only from that list, shown large, with tap-to-hear (device speech) and Somali meaning per word; a test mode mirroring the real reading test (read a sentence aloud correctly).

3) WRITING: the official USCIS writing vocabulary list — dictation practice (hear the word/sentence, write it), test mode mirroring the real writing test.

4) THE APPLICATION — YES/NO QUESTIONS: the N-400's yes/no questions as interview practice. Present each question the way an officer asks it, with: the plain-Somali meaning of every hard word in it, why USCIS asks it, and guidance to answer TRUTHFULLY about your own history. This is study help, NOT legal advice — put that disclaimer (Somali + English) at the section start and never tell a learner which box to tick for their own case.

5) MOCK INTERVIEW: a full simulated run — greeting/oath, personal/application questions, civics, reading, writing — ending with a score report (per part: pass/needs practice) saved to the learner's profile like other progress.

6) PROGRESS: citizenship progress (per edition, per part) shown on the learner's profile and Home like existing progress; reuse the existing SRS deck for missed civics questions.

7) DEDICATION PAGE (About): add "Built for Zamzam — and for every Somali mother, father and elder who started again in a new language." in the app's About/footer area, bilingual, in the Phase 2 design language.

Verify at a phone viewport, commit and push, and report: what you verified on USCIS (with dates), what you built per numbered item, and push confirmation.