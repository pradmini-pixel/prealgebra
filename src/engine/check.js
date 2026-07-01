// Answer checking. Understands the flags a Problem can carry:
//   numeric  — compare as numbers with a small tolerance
//   frac     — compare as reduced fractions ("2/4" matches "1/2")
//   choices  — multiple choice (exact, case-insensitive match)
//   default  — normalized text compare (spaces/case-insensitive)

import { gcd } from '../curriculum/rng.js'

const normalize = (s) => String(s).trim().toLowerCase().replace(/\s+/g, '').replace(/,$/, '')

const parseFrac = (s) => {
  const t = normalize(s).replace('÷', '/')
  if (t.includes('/')) {
    const [n, d] = t.split('/').map(Number)
    if (!isFinite(n) || !isFinite(d) || d === 0) return null
    const g = gcd(n, d)
    return `${n / g}/${d / g}`
  }
  const num = Number(t)
  if (!isFinite(num)) return null
  return `${num}/1`
}

export function checkAnswer(problem, raw) {
  if (raw == null) return false
  const given = String(raw)
  if (problem.frac) {
    const a = parseFrac(given)
    const b = parseFrac(problem.answer)
    return a != null && b != null && a === b
  }
  if (problem.numeric) {
    // Allow commas in typed big numbers ("3,400" === 3400) and small rounding slack.
    const g = Number(given.replace(/[, $]/g, ''))
    const a = Number(String(problem.answer).replace(/[, $]/g, ''))
    if (!isFinite(g) || !isFinite(a)) return false
    return Math.abs(g - a) < 0.02
  }
  // Ordering answers ("3,4,5") — normalize separators.
  const canon = (s) => normalize(s).replace(/[，、]/g, ',')
  return canon(given) === canon(problem.answer)
}
