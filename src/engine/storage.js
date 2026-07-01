// Local persistence for Math Quest. Everything lives in the browser via
// localStorage so the app works fully offline — no backend or login server.
// A single JSON blob keeps the student's whole journey.

const KEY = 'mathquest.state.v1'

export const todayStr = () => new Date().toISOString().slice(0, 10)

const defaultState = () => ({
  student: { name: 'Advik', createdAt: todayStr() },
  currentDay: 1,             // next day to play
  xp: 0,
  streak: 0,
  bestStreak: 0,
  lastActiveDate: null,      // ISO date of last completed day
  badges: [],                // earned badge ids
  darkMode: false,
  // Per-day records: { [dayNum]: { completed, xp, correct, total, hintsUsed, date } }
  progress: {},
  // Per-skill mastery: { [skillId]: { correct, total } }
  skills: {},
  settings: { sound: true },
})

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    return { ...defaultState(), ...JSON.parse(raw) }
  } catch {
    return defaultState()
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage full or unavailable — app still works for the session */
  }
}

export function resetState() {
  localStorage.removeItem(KEY)
  return defaultState()
}
