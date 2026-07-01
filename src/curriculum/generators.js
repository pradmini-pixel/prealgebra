// Problem generators, one per skill id used in the curriculum.
//
// Every generator is a function (difficulty 1..5) => Problem, where Problem is:
//   {
//     q:       string  — the question shown to the student
//     answer:  string  — the canonical correct answer
//     hints:   [nudge, biggerHint, method]  — 3 escalating hints
//     explain: string  — full step-by-step worked solution
//     choices?: string[]        — present => multiple choice
//     numeric?: boolean         — compare as numbers (tolerance) instead of text
//     frac?:    boolean         — compare as reduced fractions ("2/4" === "1/2")
//   }
//
// The engine (answer checking) lives in ../engine/check.js and understands
// these flags, so generators only have to describe the problem.

import { rint, pick, shuffle, coin, gcd, reduceFrac, clean, withDistractors } from './rng.js'

// ------------------------------------------------------------------ Month 1
// Number foundations: place value, comparing/ordering, rounding, operations, PEMDAS.

const placeValue = (d) => {
  const digits = 4 + d // 5..9 digit numbers
  let n = rint(10 ** (digits - 1), 10 ** digits - 1)
  const places = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'hundred thousands', 'millions', 'ten millions', 'hundred millions']
  const idx = rint(1, Math.min(digits - 1, places.length - 1))
  const s = String(n)
  const digit = s[s.length - 1 - idx]
  const value = Number(digit) * 10 ** idx
  return {
    q: `In the number ${n.toLocaleString()}, what is the VALUE of the digit in the ${places[idx]} place?`,
    answer: `${value}`,
    numeric: true,
    hints: [
      `Find the digit sitting in the ${places[idx]} place first.`,
      `That digit is ${digit}. Now multiply it by the place value.`,
      `Value = digit × place. ${digit} × ${(10 ** idx).toLocaleString()} = ?`,
    ],
    explain: `The ${places[idx]} place is worth ${(10 ** idx).toLocaleString()}. The digit there is ${digit}, so its value is ${digit} × ${(10 ** idx).toLocaleString()} = ${value.toLocaleString()}.`,
  }
}

const compareOrder = (d) => {
  const size = 3 + d
  const nums = Array.from({ length: 3 }, () => rint(10 ** (size - 1), 10 ** size - 1))
  const asc = coin()
  const sorted = [...nums].sort((a, b) => (asc ? a - b : b - a))
  return {
    q: `Put these numbers in ${asc ? 'ASCENDING (smallest first)' : 'DESCENDING (largest first)'} order. Type them separated by commas:\n${nums.map(n => n.toLocaleString()).join(',  ')}`,
    answer: sorted.join(','),
    hints: [
      'Compare the number of digits first — more digits means a bigger number.',
      'If they have the same number of digits, compare from the leftmost digit.',
      `Line them up and compare digit by digit from the left.`,
    ],
    explain: `${asc ? 'Smallest to largest' : 'Largest to smallest'}: ${sorted.map(n => n.toLocaleString()).join(', ')}.`,
  }
}

const rounding = (d) => {
  const size = 3 + d
  const n = rint(10 ** (size - 1), 10 ** size - 1)
  const powers = [10, 100, 1000, 10000]
  const p = powers[rint(0, Math.min(d, 3))]
  const names = { 10: 'nearest ten', 100: 'nearest hundred', 1000: 'nearest thousand', 10000: 'nearest ten-thousand' }
  const rounded = Math.round(n / p) * p
  return {
    q: `Round ${n.toLocaleString()} to the ${names[p]}.`,
    answer: `${rounded}`,
    numeric: true,
    hints: [
      `Look at the digit just to the RIGHT of the ${names[p].replace('nearest ', '')} place.`,
      `If that digit is 5 or more, round up; if it is 4 or less, round down.`,
      `Keep the ${names[p].replace('nearest ', '')} digit (rounding it up if needed) and turn everything after it into zeros.`,
    ],
    explain: `Looking at the digit right after the ${names[p].replace('nearest ', '')} place decides it. ${n.toLocaleString()} rounds to ${rounded.toLocaleString()}.`,
  }
}

const addSub = (d) => {
  const size = 2 + d
  const a = rint(10 ** (size - 1), 10 ** size)
  const b = rint(10 ** (size - 1), 10 ** size)
  const add = coin()
  const hi = Math.max(a, b), lo = Math.min(a, b)
  const ans = add ? a + b : hi - lo
  return {
    q: add ? `${a.toLocaleString()} + ${b.toLocaleString()} = ?` : `${hi.toLocaleString()} − ${lo.toLocaleString()} = ?`,
    answer: `${ans}`,
    numeric: true,
    hints: [
      'Line the numbers up by place value (ones under ones).',
      add ? 'Add each column from the right, carrying when a column passes 9.' : 'Subtract each column from the right, borrowing when the top digit is smaller.',
      add ? 'Do not forget to carry the 1 into the next column.' : 'Borrowing turns the next column down by 1 and adds 10 to the current one.',
    ],
    explain: add ? `${a.toLocaleString()} + ${b.toLocaleString()} = ${ans.toLocaleString()}.` : `${hi.toLocaleString()} − ${lo.toLocaleString()} = ${ans.toLocaleString()}.`,
  }
}

const multDiv = (d) => {
  const mult = coin()
  if (mult) {
    const a = rint(2 + d, 9 + d * 3)
    const b = rint(2 + d, 12 + d * 2)
    return {
      q: `${a} × ${b} = ?`,
      answer: `${a * b}`,
      numeric: true,
      hints: ['Break one factor into friendlier pieces.', `For example ${a} × ${b} = ${a} × ${b - (b % 10 || b)} + ...`, `Think of it as ${a} groups of ${b}.`],
      explain: `${a} × ${b} = ${a * b}.`,
    }
  }
  const b = rint(2 + d, 9 + d)
  const q = rint(2 + d, 12 + d * 2)
  const a = b * q
  return {
    q: `${a} ÷ ${b} = ?`,
    answer: `${q}`,
    numeric: true,
    hints: [`Ask: ${b} times WHAT gives ${a}?`, `Count up in ${b}s toward ${a}.`, `${a} ÷ ${b} means splitting ${a} into groups of ${b}.`],
    explain: `${a} ÷ ${b} = ${q}, because ${b} × ${q} = ${a}.`,
  }
}

const pemdas = (d) => {
  // Build an expression that actually exercises order of operations.
  const a = rint(2, 6 + d), b = rint(2, 6), c = rint(2, 5 + d), e = rint(1, 6)
  let q, ans
  if (d <= 2) { q = `${a} + ${b} × ${c}`; ans = a + b * c }
  else if (d === 3) { q = `(${a} + ${b}) × ${c}`; ans = (a + b) * c }
  else if (d === 4) { q = `${a} + ${b} × ${c} − ${e}`; ans = a + b * c - e }
  else { q = `${a}² + ${b} × ${c}`; ans = a * a + b * c }
  return {
    q: `Use order of operations (PEMDAS): ${q} = ?`,
    answer: `${ans}`,
    numeric: true,
    hints: [
      'PEMDAS: Parentheses, Exponents, Multiply/Divide, then Add/Subtract.',
      'Do multiplication and division BEFORE addition and subtraction.',
      `Work the highest-priority operation first, then rewrite the expression.`,
    ],
    explain: `Following PEMDAS, ${q} = ${ans}.`,
  }
}

// ------------------------------------------------------------------ Month 2
// Fractions & decimals.

const fractionIntro = (d) => {
  const den = rint(3, 4 + d)
  const num = rint(1, den - 1)
  return {
    q: `A pizza is cut into ${den} equal slices and you eat ${num}. What fraction of the pizza did you eat? (like ${num}/${den})`,
    answer: `${num}/${den}`,
    frac: true,
    hints: ['The bottom number (denominator) is the total equal parts.', 'The top number (numerator) is how many parts you took.', `Parts eaten over total parts = ${num}/${den}.`],
    explain: `${num} slices out of ${den} equal slices is the fraction ${num}/${den}.`,
  }
}

const equivFractions = (d) => {
  const den = rint(2, 5 + d)
  const num = rint(1, den - 1)
  const k = rint(2, 3 + d)
  const showNum = coin()
  if (showNum) {
    return {
      q: `Fill in the blank to make equivalent fractions: ${num}/${den} = ${num * k}/?`,
      answer: `${den * k}`,
      numeric: true,
      hints: [`The top went from ${num} to ${num * k}. What did you multiply by?`, `It was multiplied by ${k}.`, 'Multiply the bottom by the same number.'],
      explain: `${num} × ${k} = ${num * k}, so the bottom is also ×${k}: ${den} × ${k} = ${den * k}. Thus ${num}/${den} = ${num * k}/${den * k}.`,
    }
  }
  return {
    q: `Fill in the blank: ${num}/${den} = ?/${den * k}`,
    answer: `${num * k}`,
    numeric: true,
    hints: [`The bottom went from ${den} to ${den * k}. What did you multiply by?`, `It was multiplied by ${k}.`, 'Multiply the top by the same number.'],
    explain: `${den} × ${k} = ${den * k}, so ${num} × ${k} = ${num * k}. Thus ${num}/${den} = ${num * k}/${den * k}.`,
  }
}

const compareFractions = (d) => {
  let a, b, c, e
  do {
    a = rint(1, 5); b = rint(2, 6); c = rint(1, 5); e = rint(2, 6)
  } while (a / b === c / e)
  const sym = a / b > c / e ? '>' : '<'
  return {
    q: `Compare: ${a}/${b} ? ${c}/${e}   (answer with > or <)`,
    answer: sym,
    choices: ['>', '<'],
    hints: ['Give both fractions a common denominator.', `A common denominator is ${b * e}.`, `Rewrite as ${a * e}/${b * e} and ${c * b}/${b * e}, then compare the tops.`],
    explain: `Using denominator ${b * e}: ${a}/${b} = ${a * e}/${b * e} and ${c}/${e} = ${c * b}/${b * e}. Since ${a * e} ${sym} ${c * b}, we get ${a}/${b} ${sym} ${c}/${e}.`,
  }
}

const addSubFractions = (d) => {
  const like = d <= 2
  if (like) {
    const den = rint(3, 8)
    let a = rint(1, den - 1), b = rint(1, den - 1)
    const add = coin()
    const ansN = add ? a + b : Math.abs(a - b)
    return {
      q: `${Math.max(a, b)}/${den} ${add ? '+' : '−'} ${Math.min(a, b)}/${den} = ?  (like ${reduceFrac(ansN, den)})`,
      answer: reduceFrac(ansN, den),
      frac: true,
      hints: ['The denominators are the same, so keep the bottom.', add ? 'Add the tops.' : 'Subtract the tops.', 'Then reduce if the fraction can be simplified.'],
      explain: `Same denominator, so ${add ? 'add' : 'subtract'} the tops: ${ansN}/${den}, which reduces to ${reduceFrac(ansN, den)}.`,
    }
  }
  const b = rint(2, 5), e = rint(2, 6)
  const a = rint(1, b - 1), c = rint(1, e - 1)
  const add = coin()
  const lcd = (b * e) / gcd(b, e)
  const an = a * (lcd / b), cn = c * (lcd / e)
  const resN = add ? an + cn : Math.abs(an - cn)
  return {
    q: `${a}/${b} ${add ? '+' : '−'} ${c}/${e} = ?  (reduce your answer)`,
    answer: reduceFrac(resN, lcd),
    frac: true,
    hints: ['These have unlike denominators — find a common one.', `A common denominator is ${lcd}.`, `Rewrite both with ${lcd} on the bottom, then ${add ? 'add' : 'subtract'} the tops.`],
    explain: `Common denominator ${lcd}: ${a}/${b} = ${an}/${lcd}, ${c}/${e} = ${cn}/${lcd}. ${add ? 'Add' : 'Subtract'}: ${resN}/${lcd} = ${reduceFrac(resN, lcd)}.`,
  }
}

const decimalsRead = (d) => {
  const whole = rint(0, 10 ** d)
  const decimals = rint(1, Math.min(d, 3))
  const frac = rint(1, 10 ** decimals - 1)
  const num = Number(`${whole}.${String(frac).padStart(decimals, '0')}`)
  const placeNames = ['tenths', 'hundredths', 'thousandths']
  const askIdx = rint(0, decimals - 1)
  const digit = String(frac).padStart(decimals, '0')[askIdx]
  return {
    q: `In the number ${num}, which digit is in the ${placeNames[askIdx]} place?`,
    answer: `${digit}`,
    numeric: true,
    hints: ['The first digit after the decimal point is tenths.', 'Then hundredths, then thousandths.', `Count places to the right of the point to reach the ${placeNames[askIdx]} place.`],
    explain: `After the decimal point the places are tenths, hundredths, thousandths. The ${placeNames[askIdx]} digit of ${num} is ${digit}.`,
  }
}

const fracDecConvert = (d) => {
  const toDec = coin()
  if (toDec) {
    const dens = [2, 4, 5, 10, 20, 25]
    const den = pick(dens.slice(0, 3 + Math.min(d, 3)))
    const num = rint(1, den - 1)
    return {
      q: `Write ${num}/${den} as a decimal.`,
      answer: clean(num / den),
      numeric: true,
      hints: ['A fraction is just a division: top ÷ bottom.', `Compute ${num} ÷ ${den}.`, `Or make the denominator 10, 100, or 1000 first.`],
      explain: `${num}/${den} = ${num} ÷ ${den} = ${clean(num / den)}.`,
    }
  }
  const places = rint(1, Math.min(d, 2) + 1)
  const frac = rint(1, 10 ** places - 1)
  const dec = frac / 10 ** places
  return {
    q: `Write ${clean(dec)} as a fraction in lowest terms.`,
    answer: reduceFrac(frac, 10 ** places),
    frac: true,
    hints: [`Put the digits over 1 followed by zeros (${10 ** places}).`, `That gives ${frac}/${10 ** places}.`, 'Now reduce by the greatest common factor.'],
    explain: `${clean(dec)} = ${frac}/${10 ** places} = ${reduceFrac(frac, 10 ** places)} in lowest terms.`,
  }
}

const addSubDecimals = (d) => {
  const places = rint(1, Math.min(d, 2) + 1)
  const scale = 10 ** places
  const a = rint(scale, scale * (5 + d)) / scale
  const b = rint(1, scale * (3 + d)) / scale
  const add = coin()
  const hi = Math.max(a, b), lo = Math.min(a, b)
  const ans = add ? a + b : hi - lo
  return {
    q: `${add ? `${a} + ${b}` : `${hi} − ${lo}`} = ?`,
    answer: clean(ans),
    numeric: true,
    hints: ['Line up the decimal points, one under the other.', 'Fill empty spots with zeros so both have the same length.', add ? 'Add column by column, carrying as usual.' : 'Subtract column by column, borrowing as usual.'],
    explain: `Line up the decimal points: ${add ? `${a} + ${b}` : `${hi} − ${lo}`} = ${clean(ans)}.`,
  }
}

const multDivDecimals = (d) => {
  const mult = coin()
  if (mult) {
    const a = rint(11, 20 + d * 10) / 10
    const b = rint(2, 5 + d)
    return {
      q: `${a} × ${b} = ?`,
      answer: clean(a * b),
      numeric: true,
      hints: ['Ignore the decimal point and multiply as whole numbers.', 'Count how many decimal places are in the problem.', 'Put that many decimal places back into your answer.'],
      explain: `${a} × ${b} = ${clean(a * b)}. (Multiply as whole numbers, then place the decimal point so the answer has the same total decimal places.)`,
    }
  }
  const b = rint(2, 5 + d)
  const q = rint(11, 30 + d * 10) / 10
  const a = Number(clean(q * b))
  return {
    q: `${a} ÷ ${b} = ?`,
    answer: clean(a / b),
    numeric: true,
    hints: ['Divide as if there were no decimal point.', 'Bring the decimal point straight up into the answer.', `Check: your answer × ${b} should give ${a}.`],
    explain: `${a} ÷ ${b} = ${clean(a / b)}.`,
  }
}

// ------------------------------------------------------------------ Month 3
// Ratios, proportions, percents.

const ratioIntro = (d) => {
  const a = rint(2, 6 + d), b = rint(2, 6 + d)
  const items = pick([['red', 'blue'], ['dogs', 'cats'], ['apples', 'oranges'], ['boys', 'girls']])
  const g = gcd(a, b)
  return {
    q: `There are ${a} ${items[0]} and ${b} ${items[1]}. Write the ratio of ${items[0]} to ${items[1]} in simplest form (like ${a / g}:${b / g}).`,
    answer: `${a / g}:${b / g}`,
    hints: ['A ratio compares two amounts, written a:b.', `Start with ${a}:${b}.`, `Divide both parts by their greatest common factor (${g}).`],
    explain: `${a}:${b} both divide by ${g}, giving ${a / g}:${b / g}.`,
  }
}

const ratioTables = (d) => {
  const a = rint(1, 4), b = rint(2, 6)
  const k = rint(2, 4 + d)
  return {
    q: `A recipe uses ${a} cups of sugar for every ${b} cups of flour. How many cups of flour are needed for ${a * k} cups of sugar?`,
    answer: `${b * k}`,
    numeric: true,
    hints: ['Find how many times bigger the sugar amount got.', `${a} became ${a * k}, so it was multiplied by ${k}.`, 'Multiply the flour by the same number.'],
    explain: `Sugar was multiplied by ${k} (${a}→${a * k}), so flour is too: ${b} × ${k} = ${b * k} cups.`,
  }
}

const equivRatios = (d) => {
  const a = rint(2, 5), b = rint(2, 5), k = rint(2, 4 + d)
  return {
    q: `Which ratio is equivalent to ${a}:${b}?`,
    answer: `${a * k}:${b * k}`,
    choices: shuffle([`${a * k}:${b * k}`, `${a * k}:${b}`, `${a}:${b * k}`, `${a + k}:${b + k}`]),
    hints: ['Equivalent ratios multiply BOTH parts by the same number.', `Try multiplying both ${a} and ${b} by ${k}.`, `Adding the same number to both does NOT keep a ratio equivalent.`],
    explain: `Multiply both parts of ${a}:${b} by ${k} to get ${a * k}:${b * k}.`,
  }
}

const proportions = (d) => {
  const a = rint(2, 6), b = rint(2, 6), k = rint(2, 5 + d)
  const x = b * k
  return {
    q: `Solve the proportion for x:   ${a}/${b} = ${a * k}/x`,
    answer: `${x}`,
    numeric: true,
    hints: ['Cross-multiply: multiply diagonally across the equals sign.', `${a} · x = ${b} · ${a * k}.`, `So x = ${b} × ${a * k} ÷ ${a}.`],
    explain: `Cross-multiplying: ${a}·x = ${b}·${a * k} = ${b * a * k}. Divide by ${a}: x = ${x}.`,
  }
}

const solveProportion = (d) => {
  const scale = rint(2, 6)
  const realPerModel = rint(2, 8 + d)
  const model = rint(2, 6)
  return {
    q: `On a map, ${1} cm represents ${realPerModel} km. How many km apart are two towns that are ${model} cm apart on the map?`,
    answer: `${realPerModel * model}`,
    numeric: true,
    hints: ['Set up a proportion: cm/km = cm/km.', `1/${realPerModel} = ${model}/x.`, `Cross-multiply: x = ${realPerModel} × ${model}.`],
    explain: `Each cm is ${realPerModel} km, so ${model} cm = ${realPerModel} × ${model} = ${realPerModel * model} km.`,
  }
}

const percentOf = (d) => {
  const pctChoices = d <= 2 ? [10, 25, 50, 20] : [5, 15, 30, 40, 60, 75]
  const pct = pick(pctChoices)
  const base = rint(2, 20) * (d <= 2 ? 10 : 4)
  const ans = (pct / 100) * base
  return {
    q: `What is ${pct}% of ${base}?`,
    answer: clean(ans),
    numeric: true,
    hints: ['"Percent" means "out of 100" — turn it into a decimal.', `${pct}% = ${pct / 100}.`, `Multiply: ${pct / 100} × ${base}.`],
    explain: `${pct}% = ${pct / 100}. So ${pct}% of ${base} = ${pct / 100} × ${base} = ${clean(ans)}.`,
  }
}

const percentConvert = (d) => {
  const mode = rint(0, 2)
  if (mode === 0) {
    const pct = pick([5, 10, 12, 20, 25, 40, 60, 75])
    return { q: `Write ${pct}% as a decimal.`, answer: clean(pct / 100), numeric: true, hints: ['Percent means out of 100.', 'Divide by 100.', 'Move the decimal point two places left.'], explain: `${pct}% = ${pct}/100 = ${clean(pct / 100)}.` }
  }
  if (mode === 1) {
    const dec = rint(1, 95) / 100
    return { q: `Write ${clean(dec)} as a percent.`, answer: `${clean(dec * 100)}`, numeric: true, hints: ['To make a percent, compare to 100.', 'Multiply by 100.', 'Move the decimal point two places right.'], explain: `${clean(dec)} × 100 = ${clean(dec * 100)}%.` }
  }
  const dens = [2, 4, 5, 10, 20]
  const den = pick(dens)
  const num = rint(1, den - 1)
  return { q: `Write ${num}/${den} as a percent.`, answer: `${clean((num / den) * 100)}`, numeric: true, hints: ['First make the fraction a decimal (top ÷ bottom).', `${num} ÷ ${den} = ${clean(num / den)}.`, 'Then multiply by 100.'], explain: `${num}/${den} = ${clean(num / den)} = ${clean((num / den) * 100)}%.` }
}

const percentChange = (d) => {
  const base = rint(2, 20) * 10
  const pct = pick([10, 20, 25, 50])
  const inc = coin()
  const ans = inc ? base + (pct / 100) * base : base - (pct / 100) * base
  return {
    q: `A price of $${base} ${inc ? 'increases' : 'decreases'} by ${pct}%. What is the new price?`,
    answer: clean(ans),
    numeric: true,
    hints: [`First find ${pct}% of $${base}.`, `${pct}% of ${base} = ${(pct / 100) * base}.`, inc ? 'Add that to the original price.' : 'Subtract that from the original price.'],
    explain: `${pct}% of $${base} is $${(pct / 100) * base}. ${inc ? 'Adding' : 'Subtracting'} gives $${clean(ans)}.`,
  }
}

const discountTax = (d) => {
  const base = rint(2, 20) * 10
  const pct = pick([5, 8, 10, 15, 20])
  const tax = coin()
  const ans = tax ? base + (pct / 100) * base : base - (pct / 100) * base
  return {
    q: tax
      ? `A game costs $${base}. Sales tax is ${pct}%. What is the total cost?`
      : `A $${base} jacket is ${pct}% off. What is the sale price?`,
    answer: clean(ans),
    numeric: true,
    hints: [`Find ${pct}% of $${base} first.`, `That is $${(pct / 100) * base}.`, tax ? 'Add the tax to the price.' : 'Subtract the discount from the price.'],
    explain: `${pct}% of $${base} = $${(pct / 100) * base}. ${tax ? 'Total = price + tax' : 'Sale price = price − discount'} = $${clean(ans)}.`,
  }
}

// ------------------------------------------------------------------ Month 4
// Intro to algebra: variables, expressions, equations, inequalities, patterns.

const variablesIntro = (d) => {
  const per = rint(2, 9)
  const item = pick(['pencils', 'stickers', 'marbles', 'cards'])
  return {
    q: `Each box holds ${per} ${item}. If there are b boxes, which expression gives the total number of ${item}?`,
    answer: `${per}b`,
    choices: shuffle([`${per}b`, `${per}+b`, `b/${per}`, `b−${per}`]),
    hints: ['A variable is a letter that stands for an unknown number.', 'Total = (per box) × (number of boxes).', `That is ${per} times b.`],
    explain: `${per} per box × b boxes = ${per}b. Multiplication (not addition) combines them.`,
  }
}

const writeExpressions = (d) => {
  const templates = [
    () => { const n = rint(2, 9); return { q: `Write an expression: "${n} more than a number x".`, answer: `x+${n}`, alt: [`${n}+x`] } },
    () => { const n = rint(2, 9); return { q: `Write an expression: "a number n decreased by ${n}".`, answer: `n−${n}` } },
    () => { const n = rint(2, 9); return { q: `Write an expression: "${n} times a number y".`, answer: `${n}y`, alt: [`${n}*y`] } },
    () => { const n = rint(2, 9); return { q: `Write an expression: "the quotient of a number k and ${n}".`, answer: `k/${n}` } },
  ]
  const t = pick(templates)()
  return {
    q: t.q,
    answer: t.answer,
    hints: ['Translate the words into math symbols one piece at a time.', '"more than"/"increased" = +, "less than"/"decreased" = −, "times" = ×, "quotient" = ÷.', `Use the variable exactly as named.`],
    explain: `The phrase translates to ${t.answer}.`,
  }
}

const evalExpressions = (d) => {
  const a = rint(2, 6 + d), b = rint(1, 9), x = rint(2, 6 + d)
  const mode = rint(0, 2)
  let q, ans
  if (mode === 0) { q = `Evaluate ${a}x + ${b} when x = ${x}`; ans = a * x + b }
  else if (mode === 1) { q = `Evaluate ${a}x − ${b} when x = ${x}`; ans = a * x - b }
  else { q = `Evaluate ${a}(x + ${b}) when x = ${x}`; ans = a * (x + b) }
  return {
    q,
    answer: `${ans}`,
    numeric: true,
    hints: ['Replace the variable with its value (use parentheses).', `Substitute x = ${x}.`, 'Then follow order of operations to simplify.'],
    explain: `Substituting x = ${x}: ${q.replace('Evaluate ', '').replace(` when x = ${x}`, '')} = ${ans}.`,
  }
}

const equationIntro = (d) => {
  const a = rint(2, 9), x = rint(2, 9)
  const b = a + x
  return {
    q: `Is x = ${x} a solution to the equation x + ${a} = ${b}?  (yes or no)`,
    answer: 'yes',
    choices: ['yes', 'no'],
    hints: ['A solution makes both sides equal.', `Put ${x} in for x.`, `Check: ${x} + ${a} should equal ${b}.`],
    explain: `${x} + ${a} = ${b}, which is exactly the right side, so yes.`,
  }
}

const oneStep = (d) => {
  const op = rint(0, 3)
  const x = rint(2, 6 + d * 2)
  let q, ans = x
  if (op === 0) { const b = rint(2, 9 + d); q = `Solve: x + ${b} = ${x + b}` }
  else if (op === 1) { const b = rint(1, x); q = `Solve: x − ${b} = ${x - b}` }
  else if (op === 2) { const b = rint(2, 6); q = `Solve: ${b}x = ${b * x}` }
  else { const b = rint(2, 6); q = `Solve: x / ${b} = ${x}`; ans = x * b }
  const finalAns = op === 3 ? ans : x
  return {
    q,
    answer: `${finalAns}`,
    numeric: true,
    hints: ['Get x alone by doing the OPPOSITE operation to both sides.', 'Whatever you do to one side, do to the other.', 'Addition undoes subtraction; multiplication undoes division.'],
    explain: `Undo the operation on both sides to isolate x. x = ${finalAns}.`,
  }
}

const twoStep = (d) => {
  const a = rint(2, 6), x = rint(2, 6 + d), b = rint(1, 9)
  const add = coin()
  const rhs = add ? a * x + b : a * x - b
  return {
    q: `Solve: ${a}x ${add ? '+' : '−'} ${b} = ${rhs}`,
    answer: `${x}`,
    numeric: true,
    hints: [`First undo the ${add ? '+' : '−'} ${b} on both sides.`, `That leaves ${a}x = ${add ? rhs - b : rhs + b}.`, `Then divide both sides by ${a}.`],
    explain: `${add ? 'Subtract' : 'Add'} ${b}: ${a}x = ${a * x}. Divide by ${a}: x = ${x}.`,
  }
}

const wordToEquation = (d) => {
  const per = rint(2, 6), extra = rint(1, 9), x = rint(2, 8)
  const total = per * x + extra
  return {
    q: `A taxi charges $${extra} to start plus $${per} per mile. The ride cost $${total}. How many miles (m) was the ride?`,
    answer: `${x}`,
    numeric: true,
    hints: [`Write the equation: ${per}m + ${extra} = ${total}.`, `Subtract ${extra} from both sides.`, `Then divide by ${per}.`],
    explain: `${per}m + ${extra} = ${total} → ${per}m = ${per * x} → m = ${x} miles.`,
  }
}

const inequalitiesIntro = (d) => {
  const a = rint(1, 20), b = rint(1, 20)
  const sym = a > b ? '>' : a < b ? '<' : '='
  return {
    q: `Fill in the symbol: ${a} ? ${b}   (use >, <, or =)`,
    answer: sym,
    choices: ['>', '<', '='],
    hints: ['> means greater than, < means less than.', 'The open mouth faces the bigger number.', `Compare ${a} and ${b}.`],
    explain: `${a} ${sym} ${b}.`,
  }
}

const solveInequalities = (d) => {
  const a = rint(1, 9 + d), x = rint(2, 8)
  const rhs = x + a
  return {
    q: `Solve for x:  x + ${a} < ${rhs + 1}.  Give the LARGEST whole number x can be.`,
    answer: `${x}`,
    numeric: true,
    hints: [`Subtract ${a} from both sides.`, `That gives x < ${rhs + 1 - a}.`, 'The largest whole number less than that is one below it.'],
    explain: `x + ${a} < ${rhs + 1} → x < ${rhs + 1 - a}. The largest whole number is ${x}.`,
  }
}

const graphInequalities = (d) => {
  const x = rint(1, 9)
  const strict = coin()
  return {
    q: `On a number line graphing x ${strict ? '>' : '≥'} ${x}, should the circle at ${x} be OPEN or CLOSED?`,
    answer: strict ? 'open' : 'closed',
    choices: ['open', 'closed'],
    hints: ['An open circle means the number is NOT included.', 'A closed (filled) circle means the number IS included.', `> and < use open; ≥ and ≤ use closed.`],
    explain: `${strict ? '>' : '≥'} means ${x} is ${strict ? 'not included → open' : 'included → closed'} circle.`,
  }
}

const inputOutput = (d) => {
  const m = rint(2, 5 + d), b = rint(0, 9)
  const inp = rint(2, 9)
  return {
    q: `A rule multiplies the input by ${m} then adds ${b}. What is the output when the input is ${inp}?`,
    answer: `${m * inp + b}`,
    numeric: true,
    hints: ['Apply the rule step by step.', `First ${inp} × ${m} = ${m * inp}.`, `Then add ${b}.`],
    explain: `${inp} × ${m} + ${b} = ${m * inp + b}.`,
  }
}

const patternRules = (d) => {
  const start = rint(1, 6), step = rint(2, 5 + d)
  const seq = [start, start + step, start + 2 * step, start + 3 * step]
  return {
    q: `What comes next in the pattern:  ${seq.join(', ')}, __ ?`,
    answer: `${start + 4 * step}`,
    numeric: true,
    hints: ['Find how much the numbers change each step.', `Each term goes up by ${step}.`, `Add ${step} to the last term.`],
    explain: `The pattern adds ${step} each time, so next is ${seq[3]} + ${step} = ${start + 4 * step}.`,
  }
}

const functionsIntro = (d) => {
  const m = rint(2, 5), b = rint(1, 6)
  const pts = [1, 2, 3].map(x => m * x + b)
  return {
    q: `A function follows the rule f(x) = ${m}x + ${b}. What is f(${4})?`,
    answer: `${m * 4 + b}`,
    numeric: true,
    hints: ['f(4) means "put 4 in for x".', `Compute ${m} × 4 + ${b}.`, 'A function gives exactly one output for each input.'],
    explain: `f(4) = ${m}·4 + ${b} = ${m * 4 + b}.`,
  }
}

// ------------------------------------------------------------------ Month 5
// Geometry & measurement.

const geometryBasics = (d) => {
  const items = [
    { q: 'An angle that measures exactly 90° is called a ___ angle.', a: 'right' },
    { q: 'An angle smaller than 90° is called an ___ angle.', a: 'acute' },
    { q: 'An angle between 90° and 180° is called an ___ angle.', a: 'obtuse' },
    { q: 'Two lines that never meet and stay the same distance apart are ___.', a: 'parallel' },
  ]
  const it = pick(items)
  return {
    q: it.q,
    answer: it.a,
    choices: shuffle(['right', 'acute', 'obtuse', 'parallel']),
    hints: ['Think about the size or relationship being described.', 'Right = 90°, acute = small, obtuse = wide.', 'Parallel lines run side by side forever.'],
    explain: `Answer: ${it.a}.`,
  }
}

const trianglesQuads = (d) => {
  const items = [
    { q: 'A triangle with all three sides equal is ___.', a: 'equilateral' },
    { q: 'A triangle with exactly two equal sides is ___.', a: 'isosceles' },
    { q: 'A 4-sided shape with all right angles and all equal sides is a ___.', a: 'square' },
    { q: 'A 4-sided shape with two pairs of parallel sides (opposite sides equal) is a ___.', a: 'rectangle' },
  ]
  const it = pick(items)
  return {
    q: it.q,
    answer: it.a,
    choices: shuffle(['equilateral', 'isosceles', 'square', 'rectangle']),
    hints: ['Count equal sides and check the angles.', 'Equilateral = all equal, isosceles = two equal.', 'Square has equal sides; rectangle has right angles.'],
    explain: `Answer: ${it.a}.`,
  }
}

const perimeterArea = (d) => {
  const w = rint(3, 8 + d), h = rint(3, 8 + d)
  const wantArea = coin()
  return {
    q: wantArea
      ? `A rectangle is ${w} cm wide and ${h} cm tall. What is its AREA (cm²)?`
      : `A rectangle is ${w} cm wide and ${h} cm tall. What is its PERIMETER (cm)?`,
    answer: wantArea ? `${w * h}` : `${2 * (w + h)}`,
    numeric: true,
    hints: [wantArea ? 'Area of a rectangle = length × width.' : 'Perimeter is the distance all the way around.', wantArea ? `Multiply ${w} × ${h}.` : `Add all four sides: ${w} + ${h} + ${w} + ${h}.`, wantArea ? 'Area is measured in square units.' : 'Or use 2 × (width + height).'],
    explain: wantArea ? `Area = ${w} × ${h} = ${w * h} cm².` : `Perimeter = 2 × (${w} + ${h}) = ${2 * (w + h)} cm.`,
  }
}

const circles = (d) => {
  const r = rint(2, 7 + d)
  const mode = rint(0, 2)
  if (mode === 0) return { q: `A circle has radius ${r}. What is its diameter?`, answer: `${2 * r}`, numeric: true, hints: ['Diameter goes all the way across through the center.', 'Diameter = 2 × radius.', `2 × ${r} = ?`], explain: `Diameter = 2 × ${r} = ${2 * r}.` }
  if (mode === 1) return { q: `A circle has radius ${r}. Find the circumference. Use π ≈ 3.14 and round to 2 decimals.`, answer: clean(2 * 3.14 * r, 2), numeric: true, hints: ['Circumference = 2 × π × radius.', `Use π ≈ 3.14.`, `Compute 2 × 3.14 × ${r}.`], explain: `C = 2πr ≈ 2 × 3.14 × ${r} = ${clean(2 * 3.14 * r, 2)}.` }
  return { q: `A circle has radius ${r}. Find the area. Use π ≈ 3.14 and round to 2 decimals.`, answer: clean(3.14 * r * r, 2), numeric: true, hints: ['Area = π × radius × radius.', `Use π ≈ 3.14.`, `Compute 3.14 × ${r} × ${r}.`], explain: `A = πr² ≈ 3.14 × ${r}² = ${clean(3.14 * r * r, 2)}.` }
}

const surfaceVolume = (d) => {
  const s = rint(2, 6 + d)
  const wantVol = coin()
  return {
    q: wantVol
      ? `A cube has edges of ${s} cm. What is its VOLUME (cm³)?`
      : `A cube has edges of ${s} cm. What is its total SURFACE AREA (cm²)?`,
    answer: wantVol ? `${s ** 3}` : `${6 * s * s}`,
    numeric: true,
    hints: [wantVol ? 'Volume of a cube = edge × edge × edge.' : 'A cube has 6 identical square faces.', wantVol ? `Compute ${s} × ${s} × ${s}.` : `Each face has area ${s} × ${s} = ${s * s}.`, wantVol ? 'Volume uses cubic units.' : 'Multiply one face area by 6.'],
    explain: wantVol ? `Volume = ${s}³ = ${s ** 3} cm³.` : `Surface area = 6 × ${s}² = ${6 * s * s} cm².`,
  }
}

const coordinatePlot = (d) => {
  const x = rint(-5, 5), y = rint(-5, 5)
  return {
    q: `Which way do you move to plot the point (${x}, ${y}) from the origin? Give the quadrant number (1–4), or 'axis' if it lies on an axis.`,
    answer: (x === 0 || y === 0) ? 'axis' : (x > 0 ? (y > 0 ? '1' : '4') : (y > 0 ? '2' : '3')),
    hints: ['The first number is x (left/right), the second is y (up/down).', 'Quadrant 1 is top-right, then count counter-clockwise.', 'A zero coordinate means the point sits on an axis.'],
    explain: `(${x}, ${y}) → ${(x === 0 || y === 0) ? 'on an axis' : `Quadrant ${x > 0 ? (y > 0 ? 1 : 4) : (y > 0 ? 2 : 3)}`}.`,
  }
}

const quadrants = (d) => {
  const q = rint(1, 4)
  const signs = { 1: '(+, +)', 2: '(−, +)', 3: '(−, −)', 4: '(+, −)' }
  return {
    q: `In Quadrant ${q}, what are the signs of (x, y)?`,
    answer: signs[q],
    choices: shuffle(['(+, +)', '(−, +)', '(−, −)', '(+, −)']),
    hints: ['Start at Quadrant 1 (top-right, both positive).', 'Move counter-clockwise around the origin.', 'x is positive on the right, y is positive on top.'],
    explain: `Quadrant ${q} has signs ${signs[q]}.`,
  }
}

const graphEquations = (d) => {
  const m = rint(1, 4), b = rint(0, 5), x = rint(1, 5)
  return {
    q: `For the line y = ${m}x + ${b}, what is y when x = ${x}?`,
    answer: `${m * x + b}`,
    numeric: true,
    hints: ['Substitute the x value into the equation.', `Compute ${m} × ${x} + ${b}.`, 'That (x, y) pair is a point on the line.'],
    explain: `y = ${m}·${x} + ${b} = ${m * x + b}. The point (${x}, ${m * x + b}) is on the line.`,
  }
}

const unitConversion = (d) => {
  const conv = pick([
    { q: (n) => `Convert ${n} meters to centimeters.`, f: (n) => n * 100 },
    { q: (n) => `Convert ${n} kilometers to meters.`, f: (n) => n * 1000 },
    { q: (n) => `Convert ${n} feet to inches.`, f: (n) => n * 12 },
    { q: (n) => `Convert ${n} minutes to seconds.`, f: (n) => n * 60 },
  ])
  const n = rint(2, 9 + d)
  return {
    q: conv.q(n),
    answer: `${conv.f(n)}`,
    numeric: true,
    hints: ['Find the conversion factor between the two units.', 'To go to a smaller unit, you MULTIPLY.', 'Line up units so the ones you don\'t want cancel.'],
    explain: `${conv.q(n)} = ${conv.f(n)}.`,
  }
}

const timeDistance = (d) => {
  const speed = rint(2, 9) * 10
  const time = rint(2, 6)
  return {
    q: `A car travels at ${speed} km/h for ${time} hours. How far does it go (km)?`,
    answer: `${speed * time}`,
    numeric: true,
    hints: ['Distance = speed × time.', `Multiply ${speed} × ${time}.`, 'Check the units: km/h × h = km.'],
    explain: `Distance = ${speed} × ${time} = ${speed * time} km.`,
  }
}

const scaleMaps = (d) => {
  const scale = rint(2, 9) * 10
  const mapCm = rint(2, 8)
  return {
    q: `A map scale says 1 cm = ${scale} m. Two points are ${mapCm} cm apart on the map. What is the real distance (m)?`,
    answer: `${scale * mapCm}`,
    numeric: true,
    hints: ['Each map centimeter stands for a fixed real distance.', `1 cm = ${scale} m.`, `Multiply ${mapCm} × ${scale}.`],
    explain: `${mapCm} cm × ${scale} m/cm = ${scale * mapCm} m.`,
  }
}

// ------------------------------------------------------------------ Month 6
// Data, statistics, probability.

const meanMedianMode = (d) => {
  const count = 5
  const data = Array.from({ length: count }, () => rint(1, 9 + d * 2))
  const stat = pick(['mean', 'median', 'range'])
  const sorted = [...data].sort((a, b) => a - b)
  let ans
  if (stat === 'mean') ans = clean(data.reduce((s, x) => s + x, 0) / count)
  else if (stat === 'median') ans = `${sorted[2]}`
  else ans = `${sorted[count - 1] - sorted[0]}`
  return {
    q: `For the data ${data.join(', ')}, find the ${stat.toUpperCase()}.`,
    answer: ans,
    numeric: true,
    hints: [
      stat === 'mean' ? 'Mean = add them all, then divide by how many there are.' : stat === 'median' ? 'Median = the middle value AFTER sorting.' : 'Range = biggest − smallest.',
      stat === 'mean' ? `Sum = ${data.reduce((s, x) => s + x, 0)}.` : `Sorted: ${sorted.join(', ')}.`,
      stat === 'mean' ? 'Divide the sum by 5.' : stat === 'median' ? 'Pick the 3rd value in the sorted list.' : 'Subtract smallest from largest.',
    ],
    explain: stat === 'mean'
      ? `Mean = (${data.join('+')}) ÷ 5 = ${ans}.`
      : stat === 'median'
        ? `Sorted: ${sorted.join(', ')}. Middle value = ${ans}.`
        : `Range = ${sorted[count - 1]} − ${sorted[0]} = ${ans}.`,
  }
}

const graphsReading = (d) => {
  const cats = ['Mon', 'Tue', 'Wed', 'Thu']
  const vals = cats.map(() => rint(2, 9 + d))
  const maxIdx = vals.indexOf(Math.max(...vals))
  const total = vals.reduce((s, x) => s + x, 0)
  const ask = coin()
  return {
    q: `A bar graph shows books read: ${cats.map((c, i) => `${c}=${vals[i]}`).join(', ')}. ${ask ? 'Which day had the MOST books?' : 'What is the TOTAL books read?'}`,
    answer: ask ? cats[maxIdx] : `${total}`,
    numeric: !ask,
    choices: ask ? shuffle([...cats]) : undefined,
    hints: [ask ? 'Look for the tallest bar.' : 'Add every bar\'s value together.', ask ? 'Compare the four values.' : `Add ${vals.join(' + ')}.`, ask ? `The largest value is ${Math.max(...vals)}.` : 'Sum them carefully.'],
    explain: ask ? `${cats[maxIdx]} had the most (${vals[maxIdx]}).` : `Total = ${vals.join(' + ')} = ${total}.`,
  }
}

const probabilityBasic = (d) => {
  const total = rint(4, 6 + d)
  const fav = rint(1, total - 1)
  return {
    q: `A bag has ${total} marbles; ${fav} are red. What is the probability of drawing a red marble? (as a reduced fraction)`,
    answer: reduceFrac(fav, total),
    frac: true,
    hints: ['Probability = favorable outcomes ÷ total outcomes.', `That is ${fav}/${total}.`, 'Reduce the fraction if you can.'],
    explain: `P(red) = ${fav}/${total} = ${reduceFrac(fav, total)}.`,
  }
}

const compoundEvents = (d) => {
  return {
    q: `You flip a coin AND roll a 6-sided die. How many total possible outcomes are there?`,
    answer: '12',
    numeric: true,
    hints: ['Count the outcomes for each event separately.', 'Coin: 2 outcomes. Die: 6 outcomes.', 'Multiply them (the counting principle).'],
    explain: `2 (coin) × 6 (die) = 12 total outcomes.`,
  }
}

const treeDiagrams = (d) => {
  const a = rint(2, 4), b = rint(2, 4)
  const outfits = pick([['shirts', 'pants'], ['flavors', 'cones'], ['tops', 'hats']])
  return {
    q: `You choose 1 of ${a} ${outfits[0]} and 1 of ${b} ${outfits[1]}. How many different combinations are possible?`,
    answer: `${a * b}`,
    numeric: true,
    hints: ['A tree diagram branches once per choice.', `Each of the ${a} ${outfits[0]} pairs with each of the ${b} ${outfits[1]}.`, `Multiply ${a} × ${b}.`],
    explain: `${a} × ${b} = ${a * b} combinations.`,
  }
}

// ------------------------------------------------------------------ Registry
// Maps every skill id used in the curriculum to its generator.

export const GENERATORS = {
  'place-value': placeValue,
  'compare-order': compareOrder,
  'rounding': rounding,
  'add-sub': addSub,
  'mult-div': multDiv,
  'pemdas': pemdas,
  'fraction-intro': fractionIntro,
  'equivalent-fractions': equivFractions,
  'compare-fractions': compareFractions,
  'add-sub-fractions': addSubFractions,
  'decimals-read': decimalsRead,
  'fraction-decimal': fracDecConvert,
  'add-sub-decimals': addSubDecimals,
  'mult-div-decimals': multDivDecimals,
  'ratio-intro': ratioIntro,
  'ratio-tables': ratioTables,
  'equivalent-ratios': equivRatios,
  'proportions': proportions,
  'solve-proportion': solveProportion,
  'percent-of': percentOf,
  'percent-convert': percentConvert,
  'percent-change': percentChange,
  'discount-tax': discountTax,
  'variables-intro': variablesIntro,
  'write-expressions': writeExpressions,
  'evaluate-expressions': evalExpressions,
  'equation-intro': equationIntro,
  'one-step': oneStep,
  'two-step': twoStep,
  'word-to-equation': wordToEquation,
  'inequalities-intro': inequalitiesIntro,
  'solve-inequalities': solveInequalities,
  'graph-inequalities': graphInequalities,
  'input-output': inputOutput,
  'pattern-rules': patternRules,
  'functions-intro': functionsIntro,
  'geometry-basics': geometryBasics,
  'triangles-quads': trianglesQuads,
  'perimeter-area': perimeterArea,
  'circles': circles,
  'surface-volume': surfaceVolume,
  'coordinate-plot': coordinatePlot,
  'quadrants': quadrants,
  'graph-equations': graphEquations,
  'unit-conversion': unitConversion,
  'time-distance': timeDistance,
  'scale-maps': scaleMaps,
  'mean-median-mode': meanMedianMode,
  'graphs-reading': graphsReading,
  'probability-basic': probabilityBasic,
  'compound-events': compoundEvents,
  'tree-diagrams': treeDiagrams,
}

// A generic warm-up: two quick mental-math questions, independent of the topic.
export const warmUpProblem = () => {
  const kind = rint(0, 3)
  if (kind === 0) { const a = rint(6, 19), b = rint(6, 19); return { q: `${a} + ${b}`, answer: `${a + b}`, numeric: true } }
  if (kind === 1) { const a = rint(11, 30), b = rint(2, 10); return { q: `${a} − ${b}`, answer: `${a - b}`, numeric: true } }
  if (kind === 2) { const a = rint(2, 9), b = rint(2, 9); return { q: `${a} × ${b}`, answer: `${a * b}`, numeric: true } }
  const b = rint(2, 9), q = rint(2, 9); return { q: `${b * q} ÷ ${b}`, answer: `${q}`, numeric: true }
}

// A "review" day pulls from a set of previously seen skills.
export const reviewProblem = (skillIds, difficulty) => {
  const id = pick(skillIds.filter((s) => GENERATORS[s])) || 'add-sub'
  return { ...GENERATORS[id](difficulty), skillId: id }
}

// Generate one problem for a skill id at a difficulty (falls back gracefully).
export const generate = (skillId, difficulty = 2) => {
  const g = GENERATORS[skillId]
  if (!g) return { ...warmUpProblem(), hints: ['Take your time.', 'Break it into steps.', 'Estimate first, then compute.'], explain: 'Compute carefully.' }
  const p = g(Math.max(1, Math.min(5, difficulty)))
  return { hints: p.hints || ['Take your time.', 'Break it into steps.', 'Check your work.'], explain: p.explain || '', ...p }
}
