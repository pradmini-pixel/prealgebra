// Small random helpers shared by the problem generators.
// Difficulty is always an integer 1..5 (1 = gentle, 5 = stretch).

export const rint = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
export const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
export const coin = () => Math.random() < 0.5

// Greatest common divisor — used all over the fraction/ratio generators.
export const gcd = (a, b) => {
  a = Math.abs(a); b = Math.abs(b)
  while (b) { [a, b] = [b, a % b] }
  return a || 1
}

// Reduce a fraction to lowest terms, returned as "n/d" (or a whole number string).
export const reduceFrac = (n, d) => {
  const g = gcd(n, d)
  n /= g; d /= g
  if (d === 1) return `${n}`
  return `${n}/${d}`
}

// Round to a fixed number of decimals without floating-point fuzz ("0.30" -> "0.3").
export const clean = (x, places = 4) => {
  const r = Number(x.toFixed(places))
  return `${r}`
}

// Build a multiple-choice option set: correct answer + plausible distractors.
export const withDistractors = (correct, distractors) => {
  const set = new Set([String(correct)])
  const opts = [String(correct)]
  for (const d of distractors) {
    const s = String(d)
    if (!set.has(s)) { set.add(s); opts.push(s) }
    if (opts.length >= 4) break
  }
  return shuffle(opts)
}
