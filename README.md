# Math Quest 🚀

A **6-month (180-day) Pre-Algebra adventure** built for a 10-year-old learner
(Advik). Duolingo-style daily quests, ~20–30 minutes each, following the topic
progression of AoPS *Pre-Algebra* (Rusczyk & Patrick), Beast Academy, and the
Khan Academy / Singapore Math pre-algebra sequence.

Runs entirely in the browser — **no backend, no login server, fully offline**
once loaded. All progress is saved locally.

---

## Quick start

```bash
npm install
npm run dev      # open the printed http://localhost:5173 URL
```

Build a static bundle (deployable to any static host, or openable offline):

```bash
npm run build    # outputs dist/
npm run preview  # serve the production build
```

Tech: **React 18 + Vite**. No other runtime dependencies.

---

## The 6-month curriculum

Each month ends with a 2-day **Boss Battle** that awards a badge, for 30 days ×
6 months = **exactly 180 days**.

| Month | Theme | Badge |
|------:|-------|-------|
| 1 | Number Foundations — place value, comparing, rounding, operations, PEMDAS | 🥷 Number Ninja |
| 2 | Fractions & Decimals | 🍕 Fraction Fighter |
| 3 | Ratios, Proportions & Percents | 📊 Percent Pro |
| 4 | Intro to Algebra — variables, equations, inequalities, patterns & functions | 🧭 Equation Explorer |
| 5 | Geometry & Measurement — shapes, circles, coordinate plane, units | 📐 Geometry Guardian |
| 6 | Data, Statistics, Probability & Final Review | 🔎 Data Detective |

Finishing all 180 days unlocks the printable **Math Quest Champion** certificate
and an Algebra 1 preview.

## The daily lesson (each of 180 days)

Every day walks through the five-part flow from the spec:

1. **Warm-up** — 2 quick mental-math questions.
2. **Concept lesson** — plain-English explanation, a visual, a step-by-step
   worked example, and a *"Why am I learning this?"* real-world hook.
3. **Guided practice** — 5 problems of increasing difficulty with instant
   feedback and full worked explanations.
4. **Daily challenge** — a real-world word problem for the week's theme, plus an
   optional bonus problem for advanced learners.
5. **Summary & streak** — one-sentence recap, XP earned, streak, and any new badge.

## Features implemented

- **Real, checkable content, not placeholders.** ~50 per-skill *problem
  generators* produce fresh, difficulty-scaled problems every session, so
  practice never runs out. A smoke test verifies 10,000+ generated problems are
  self-consistent (see below).
- **3-level hint system** (nudge → bigger hint → show the method), with hint
  usage tracked and gently reflected in XP.
- **Adaptive difficulty:** 3 wrong in a row eases off; 5 correct in a row bumps
  difficulty and unlocks a bonus challenge.
- **Gamification:** XP, daily streaks, monthly badges, and a visual 6-month
  progress map with day-by-day dots.
- **Parent/Tutor dashboard:** completion status, per-skill mastery
  (mastered / progressing / struggling), auto-detected weak areas with
  recommended **offline activities**, and a copy-ready weekly summary.
- **UX:** colorful game-like interface, large text, one idea per screen,
  **dark mode**, and a responsive layout for tablet and mobile.

## Project structure

```
src/
  curriculum/
    curriculum.js   # builds the 180-day schedule (6 months × 30 days)
    topics.js       # teaching content: explanation, "why", worked example
    generators.js   # ~50 problem generators, one per skill
    rng.js          # shared math/random helpers
  engine/
    check.js        # answer checking (numeric / fraction / multiple choice / text)
    progress.js     # XP, streaks, badges, adaptive difficulty, weak-area detection
    storage.js      # localStorage persistence (offline)
  components/
    ProgressMap.jsx ProblemCard.jsx Lesson.jsx Badges.jsx ParentDashboard.jsx
  store.jsx App.jsx main.jsx styles.css
```

## Verifying it works

The build is browser-driven and content-checked:

- `npm run build` — production build.
- A headless-browser walkthrough exercises warm-up → concept → practice →
  summary → next day, the map, the parent dashboard, and the badges view.
- A content smoke test generates 10,000+ problems across every skill and
  difficulty and confirms each answer passes its own checker.

## Optional: Claude-powered hints

The hint system works fully offline using the three authored hint levels per
problem. It is intentionally isolated in `ProblemCard.jsx` /
`curriculum/generators.js` so it can be upgraded to call the **Claude API** for
personalized, on-the-fly hints and explanations by adding a small backend
proxy (to keep the API key server-side). The offline hints remain the fallback.

## Success targets (after 6 months)

Solve multi-step word problems · set up and solve equations · work confidently
with fractions, decimals, and percents · understand basic geometry and the
coordinate plane · read and interpret data and graphs · tackle AoPS-style
challenge problems.
