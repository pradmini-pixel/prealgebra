// The 6-month Math Quest map, expanded into exactly 180 numbered days.
//
// Structure: 6 months. Each month = 4 weeks (7 days each = 28) + a 2-day
// "Boss Battle" (monthly review + badge) = 30 days. 6 × 30 = 180.
//
// Weekly rhythm follows the spec: days 1–5 introduce concepts (difficulty
// climbs across the week), days 6–7 are practice + a real-world puzzle.

// Each week lists 5 concept skills (one per day 1–5) plus a real-world puzzle theme.
const MONTHS = [
  {
    n: 1,
    title: 'Number Foundations',
    badge: { id: 'number-ninja', name: 'Number Ninja', emoji: '🥷', color: '#f59e0b' },
    weeks: [
      { title: 'Big Numbers & Place Value', skills: ['place-value', 'place-value', 'compare-order', 'compare-order', 'rounding'], puzzle: 'reading the population of world cities' },
      { title: 'Comparing & Rounding', skills: ['rounding', 'compare-order', 'place-value', 'rounding', 'compare-order'], puzzle: 'estimating a shopping trip total' },
      { title: 'Add, Subtract, Multiply, Divide', skills: ['add-sub', 'add-sub', 'mult-div', 'mult-div', 'add-sub'], puzzle: 'sharing snacks fairly among friends' },
      { title: 'Order of Operations', skills: ['mult-div', 'pemdas', 'pemdas', 'mult-div', 'pemdas'], puzzle: 'scoring a video-game combo' },
    ],
  },
  {
    n: 2,
    title: 'Fractions & Decimals',
    badge: { id: 'fraction-fighter', name: 'Fraction Fighter', emoji: '🍕', color: '#ef4444' },
    weeks: [
      { title: 'Meet Fractions', skills: ['fraction-intro', 'fraction-intro', 'equivalent-fractions', 'equivalent-fractions', 'compare-fractions'], puzzle: 'splitting a pizza between friends' },
      { title: 'Fraction Operations', skills: ['compare-fractions', 'add-sub-fractions', 'add-sub-fractions', 'add-sub-fractions', 'equivalent-fractions'], puzzle: 'combining recipe measurements' },
      { title: 'Decimals', skills: ['decimals-read', 'fraction-decimal', 'fraction-decimal', 'add-sub-decimals', 'add-sub-decimals'], puzzle: 'reading a store receipt' },
      { title: 'Decimal Operations', skills: ['add-sub-decimals', 'mult-div-decimals', 'mult-div-decimals', 'fraction-decimal', 'mult-div-decimals'], puzzle: 'finding the unit price of cereal' },
    ],
  },
  {
    n: 3,
    title: 'Ratios, Proportions & Percents',
    badge: { id: 'percent-pro', name: 'Percent Pro', emoji: '📊', color: '#10b981' },
    weeks: [
      { title: 'Ratios', skills: ['ratio-intro', 'ratio-intro', 'ratio-tables', 'equivalent-ratios', 'ratio-tables'], puzzle: 'mixing the perfect fruit punch' },
      { title: 'Proportions', skills: ['proportions', 'proportions', 'solve-proportion', 'solve-proportion', 'proportions'], puzzle: 'scaling a model rocket' },
      { title: 'Percents', skills: ['percent-convert', 'percent-of', 'percent-of', 'percent-convert', 'percent-of'], puzzle: 'figuring out a test score' },
      { title: 'Percents in Real Life', skills: ['percent-change', 'discount-tax', 'discount-tax', 'percent-change', 'discount-tax'], puzzle: 'shopping a big sale with tax' },
    ],
  },
  {
    n: 4,
    title: 'Intro to Algebra',
    badge: { id: 'equation-explorer', name: 'Equation Explorer', emoji: '🧭', color: '#6366f1' },
    weeks: [
      { title: 'Variables & Expressions', skills: ['variables-intro', 'write-expressions', 'write-expressions', 'evaluate-expressions', 'evaluate-expressions'], puzzle: 'writing a rule for saving allowance' },
      { title: 'Equations', skills: ['equation-intro', 'one-step', 'one-step', 'two-step', 'word-to-equation'], puzzle: 'solving a taxi-fare mystery' },
      { title: 'Inequalities', skills: ['inequalities-intro', 'solve-inequalities', 'graph-inequalities', 'solve-inequalities', 'graph-inequalities'], puzzle: 'a "must be at least this tall" ride rule' },
      { title: 'Patterns & Functions', skills: ['input-output', 'pattern-rules', 'functions-intro', 'pattern-rules', 'functions-intro'], puzzle: 'predicting a growing pattern of tiles' },
    ],
  },
  {
    n: 5,
    title: 'Geometry & Measurement',
    badge: { id: 'geometry-guardian', name: 'Geometry Guardian', emoji: '📐', color: '#0ea5e9' },
    weeks: [
      { title: 'Shapes & Angles', skills: ['geometry-basics', 'triangles-quads', 'perimeter-area', 'perimeter-area', 'triangles-quads'], puzzle: 'fencing a garden' },
      { title: 'Circles & Solids', skills: ['circles', 'circles', 'surface-volume', 'surface-volume', 'circles'], puzzle: 'sizing a pizza vs a box' },
      { title: 'The Coordinate Plane', skills: ['coordinate-plot', 'quadrants', 'graph-equations', 'graph-equations', 'coordinate-plot'], puzzle: 'a treasure map with coordinates' },
      { title: 'Measurement', skills: ['unit-conversion', 'time-distance', 'scale-maps', 'unit-conversion', 'time-distance'], puzzle: 'planning a road trip' },
    ],
  },
  {
    n: 6,
    title: 'Data, Statistics & Review',
    badge: { id: 'data-detective', name: 'Data Detective', emoji: '🔎', color: '#a855f7' },
    weeks: [
      { title: 'Data & Graphs', skills: ['mean-median-mode', 'mean-median-mode', 'graphs-reading', 'graphs-reading', 'mean-median-mode'], puzzle: 'analyzing your class\'s pet survey' },
      { title: 'Probability', skills: ['probability-basic', 'probability-basic', 'compound-events', 'tree-diagrams', 'tree-diagrams'], puzzle: 'the odds in a board game' },
      { title: 'Mixed Review', skills: ['review', 'review', 'review', 'review', 'review'], puzzle: 'an AoPS-style challenge round' },
      { title: 'Final Mastery', skills: ['review', 'review', 'review', 'review', 'review'], puzzle: 'the Grand Championship problem' },
    ],
  },
]

// Skills seen up to and including a given month — used to scope review days.
const skillsThroughMonth = (monthIdx) => {
  const set = new Set()
  for (let m = 0; m <= monthIdx; m++) {
    for (const w of MONTHS[m].weeks) for (const s of w.skills) if (s !== 'review') set.add(s)
  }
  return [...set]
}

// Build the flat 180-day list.
function buildDays() {
  const days = []
  let dayNum = 0
  MONTHS.forEach((month, mIdx) => {
    const priorSkills = skillsThroughMonth(mIdx)
    month.weeks.forEach((week, wIdx) => {
      for (let dOfWeek = 0; dOfWeek < 7; dOfWeek++) {
        dayNum++
        const weekLabel = `Month ${month.n} · Week ${wIdx + 1}`
        if (dOfWeek < 5) {
          // Concept day: difficulty climbs 1→5 across the week (roughly).
          const skill = week.skills[dOfWeek]
          const difficulty = Math.min(5, 2 + Math.floor(dOfWeek / 1.5))
          days.push({
            day: dayNum, month: month.n, week: wIdx + 1, weekTitle: week.title, weekLabel,
            type: skill === 'review' ? 'review' : 'concept',
            skill: skill === 'review' ? null : skill,
            reviewPool: skill === 'review' ? priorSkills : null,
            difficulty, puzzle: week.puzzle,
            title: skill === 'review' ? `${week.title} — Challenge ${dOfWeek + 1}` : null,
          })
        } else if (dOfWeek === 5) {
          // Practice day: mixed practice from the week's skills.
          const pool = [...new Set(week.skills.filter((s) => s !== 'review'))]
          days.push({
            day: dayNum, month: month.n, week: wIdx + 1, weekTitle: week.title, weekLabel,
            type: 'practice', skill: null,
            reviewPool: pool.length ? pool : priorSkills,
            difficulty: 3, puzzle: week.puzzle, title: `${week.title} — Practice`,
          })
        } else {
          // Puzzle day: a real-world challenge built on the week's skills.
          const pool = [...new Set(week.skills.filter((s) => s !== 'review'))]
          days.push({
            day: dayNum, month: month.n, week: wIdx + 1, weekTitle: week.title, weekLabel,
            type: 'puzzle', skill: null,
            reviewPool: pool.length ? pool : priorSkills,
            difficulty: 4, puzzle: week.puzzle, title: `Real-World Puzzle: ${week.puzzle}`,
          })
        }
      }
    })
    // Two boss-battle days close the month: a scaled review + the badge.
    for (let b = 0; b < 2; b++) {
      dayNum++
      days.push({
        day: dayNum, month: month.n, week: 5, weekTitle: 'Boss Battle', weekLabel: `Month ${month.n} · Boss Battle`,
        type: 'boss', skill: null, reviewPool: priorSkills,
        difficulty: 4 + b, puzzle: `the ${month.title} boss challenge`,
        title: b === 0 ? `Boss Battle: ${month.title}` : `Badge Quest: earn the ${month.badge.name}!`,
        awardsBadge: b === 1 ? month.badge : null,
      })
    }
  })
  return days
}

export const DAYS = buildDays()
export const MONTH_META = MONTHS.map((m) => ({ n: m.n, title: m.title, badge: m.badge }))
export const TOTAL_DAYS = DAYS.length // 180

export const getDay = (n) => DAYS.find((d) => d.day === n) || DAYS[0]
