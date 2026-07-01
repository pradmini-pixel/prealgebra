import React, { useState } from 'react'
import { checkAnswer } from '../engine/check.js'

const HINT_LABELS = ['Nudge', 'Bigger hint', 'Show the method']

// A single interactive problem: question, answer entry, 3-level hint system,
// instant feedback with the full worked explanation.
export default function ProblemCard({ problem, onNext, prompt = 'Your answer', kicker }) {
  const [value, setValue] = useState('')
  const [choice, setChoice] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [correct, setCorrect] = useState(false)
  const [hints, setHints] = useState(0)

  const isMC = Array.isArray(problem.choices)
  const hintList = problem.hints || []
  const canSubmit = isMC ? choice != null : value.trim() !== ''

  const submit = () => {
    if (submitted || !canSubmit) return
    const answer = isMC ? choice : value
    const ok = checkAnswer(problem, answer)
    setCorrect(ok)
    setSubmitted(true)
  }

  const next = () => onNext({ correct, hintsUsed: hints })

  return (
    <div className="card">
      {kicker && <div className="step-badge">{kicker}</div>}
      <div className="problem-q">{problem.q}</div>

      {isMC ? (
        <div className="choices">
          {problem.choices.map((c) => {
            const cls = ['choice-btn']
            if (!submitted && choice === c) cls.push('selected')
            if (submitted && c === problem.answer) cls.push('correct')
            if (submitted && choice === c && c !== problem.answer) cls.push('wrong')
            return (
              <button key={c} className={cls.join(' ')} disabled={submitted} onClick={() => setChoice(c)}>
                {c}
              </button>
            )
          })}
        </div>
      ) : (
        <input
          className="answer-input"
          value={value}
          disabled={submitted}
          placeholder={prompt}
          autoFocus
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      )}

      {/* Progressive hints (tracked so we can gently reward hint-free answers). */}
      {!submitted && hints > 0 && (
        <div>
          {hintList.slice(0, hints).map((h, i) => (
            <div key={i} className="hint-box">
              <span className="hint-level">💡 {HINT_LABELS[i]}</span>
              {h}
            </div>
          ))}
        </div>
      )}

      {submitted && (
        <div className={`feedback ${correct ? 'correct' : 'wrong'}`}>
          {correct ? '🎉 Correct! ' : `Not quite — the answer is ${problem.answer}. `}
          <div style={{ fontWeight: 500, marginTop: 6 }}>{problem.explain}</div>
        </div>
      )}

      <div className="btn-row" style={{ marginTop: 14 }}>
        {!submitted && hints < Math.min(3, hintList.length) && (
          <button className="btn ghost" onClick={() => setHints((h) => h + 1)}>
            💡 Hint ({hints}/{Math.min(3, hintList.length)})
          </button>
        )}
        {!submitted ? (
          <button className="btn" disabled={!canSubmit} onClick={submit}>Check ✓</button>
        ) : (
          <button className="btn success" onClick={next}>Continue →</button>
        )}
      </div>
    </div>
  )
}
