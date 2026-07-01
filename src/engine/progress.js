// Pure helpers that evolve the saved state: XP, streaks, badges, skill mastery,
// adaptive difficulty, and weak-area detection for auto-generated review.

import { todayStr } from './storage.js'

const oneDayBefore = (iso) => {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

// XP awarded for a finished day, given the run's results.
export function computeDayXp({ correct, challengeCorrect, hintsUsed, bonusEarned }) {
  let xp = correct * 10
  xp += challengeCorrect ? 25 : 0
  xp += bonusEarned ? 30 : 0        // adaptive bonus challenge cleared
  xp -= hintsUsed * 2               // gentle nudge to try first
  xp += 25                          // daily completion reward
  return Math.max(10, xp)
}

// Fold a completed day into the state. Returns { state, newBadges, streakUp }.
export function completeDay(state, day, result) {
  const next = structuredClone(state)
  const today = todayStr()
  const xp = computeDayXp(result)

  // Streak: only advances once per calendar day.
  let streakUp = false
  if (next.lastActiveDate !== today) {
    if (next.lastActiveDate && oneDayBefore(today) === next.lastActiveDate) {
      next.streak += 1
    } else {
      next.streak = 1
    }
    streakUp = true
    next.lastActiveDate = today
  }
  next.bestStreak = Math.max(next.bestStreak, next.streak)

  next.xp += xp

  // Record the day (best result is kept if replayed).
  const prev = next.progress[day.day]
  const record = { completed: true, xp, correct: result.correct, total: result.total, hintsUsed: result.hintsUsed, date: today, skill: day.skill }
  if (!prev || xp > prev.xp) next.progress[day.day] = record
  else next.progress[day.day] = { ...prev, completed: true }

  // Advance the "next day" pointer if this was the current frontier.
  if (day.day >= next.currentDay) next.currentDay = Math.min(180, day.day + 1)

  // Merge per-skill mastery counts.
  for (const [skill, r] of Object.entries(result.bySkill || {})) {
    const s = next.skills[skill] || { correct: 0, total: 0 }
    s.correct += r.correct; s.total += r.total
    next.skills[skill] = s
  }

  // Award the month badge if this day grants one.
  const newBadges = []
  if (day.awardsBadge && !next.badges.includes(day.awardsBadge.id)) {
    next.badges.push(day.awardsBadge.id)
    newBadges.push(day.awardsBadge)
  }

  return { state: next, newBadges, streakUp, xpEarned: xp }
}

// Adaptive difficulty: 3 wrong in a row eases off; 5 right in a row unlocks a bonus.
export function nextDifficulty(current, streak) {
  if (streak.wrong >= 3) return { difficulty: Math.max(1, current - 1), reset: 'wrong', message: "Let's try a gentler one 💪" }
  if (streak.right >= 5) return { difficulty: Math.min(5, current + 1), reset: 'right', unlockBonus: true, message: 'On fire! Bonus challenge unlocked 🔥' }
  return { difficulty: current }
}

// Skills the student is struggling with (for weekly auto-review).
export function weakSkills(state, limit = 5) {
  return Object.entries(state.skills)
    .filter(([, s]) => s.total >= 3 && s.correct / s.total < 0.6)
    .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
    .slice(0, limit)
    .map(([id]) => id)
}

// Mastery bucket for the parent view.
export function masteryLevel(s) {
  if (!s || s.total < 3) return 'new'
  const r = s.correct / s.total
  if (r >= 0.85) return 'mastered'
  if (r >= 0.6) return 'progressing'
  return 'struggling'
}
