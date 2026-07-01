import React, { useMemo, useRef, useState } from 'react'
import { useStore } from '../store.jsx'
import { getDay, TOTAL_DAYS } from '../curriculum/curriculum.js'
import { TOPICS, REVIEW_TOPIC } from '../curriculum/topics.js'
import { generate, reviewProblem, warmUpProblem } from '../curriculum/generators.js'
import { nextDifficulty } from '../engine/progress.js'
import ProblemCard from './ProblemCard.jsx'

const GUIDED_COUNT = 5

// Generate one problem for this day at a difficulty, tagging its skill id.
function genForDay(day, difficulty) {
  if (day.type === 'concept' && day.skill) {
    return { ...generate(day.skill, difficulty), skillId: day.skill }
  }
  const p = reviewProblem(day.reviewPool || ['add-sub'], difficulty)
  return { ...generate(p.skillId, difficulty), skillId: p.skillId }
}

// ---- Phase 1: Warm-up (2 quick mental-math questions) ----
function WarmUp({ onDone }) {
  const problems = useMemo(
    () => [0, 1].map(() => ({ ...warmUpProblem(), hints: ['Estimate first.', 'Break it into tens and ones.'], explain: 'Nice mental math!' })),
    []
  )
  const [i, setI] = useState(0)
  const [correct, setCorrect] = useState(0)
  return (
    <div>
      <div className="progress-pips">
        {problems.map((_, k) => <div key={k} className={`pip ${k < i ? 'done' : k === i ? 'active' : ''}`} />)}
      </div>
      <ProblemCard
        key={i}
        kicker={`🧠 Warm-up ${i + 1} of ${problems.length}`}
        problem={problems[i]}
        onNext={({ correct: ok }) => {
          const c = correct + (ok ? 1 : 0)
          if (i + 1 < problems.length) { setCorrect(c); setI(i + 1) }
          else onDone({ correct: c })
        }}
      />
    </div>
  )
}

// ---- Phase 2: Concept lesson ----
function ConceptLesson({ day, onDone }) {
  const topic = day.type === 'concept' && day.skill ? TOPICS[day.skill] : REVIEW_TOPIC
  return (
    <div className="card">
      <div className="step-badge">📖 Concept Lesson</div>
      <h2>{topic.title}</h2>
      <p>{topic.concept}</p>
      {topic.visual && <div className="visual-box">{topic.visual}</div>}

      <h3 style={{ marginBottom: 4 }}>Worked Example</h3>
      <p style={{ fontWeight: 800, margin: '4px 0 8px' }}>{topic.example.problem}</p>
      {topic.example.steps.map((s, i) => (
        <div key={i} className="worked-step"><div className="num">{i + 1}</div><div>{s}</div></div>
      ))}

      <div className="why-box"><b>Why am I learning this?</b><br />{topic.why}</div>
      <button className="btn" onClick={onDone}>I've got it — let's practice! ✏️</button>
    </div>
  )
}

// ---- Phases 3 & 4: Guided practice + Daily challenge (+ adaptive bonus) ----
function Practice({ day, onDone }) {
  const [problem, setProblem] = useState(() => genForDay(day, Math.max(1, day.difficulty - 1)))
  const [stage, setStage] = useState('guided')  // 'guided' | 'challenge' | 'bonus'
  const [idx, setIdx] = useState(0)
  const [diff, setDiff] = useState(Math.max(1, day.difficulty - 1))
  const [banner, setBanner] = useState(null)
  const streak = useRef({ right: 0, wrong: 0 })
  const results = useRef({ correct: 0, total: 0, hintsUsed: 0, challengeCorrect: false, bonusEarned: false, bySkill: {} })
  const bonusUnlocked = useRef(false)

  const record = (skillId, ok) => {
    const s = results.current.bySkill[skillId] || { correct: 0, total: 0 }
    s.total += 1; if (ok) s.correct += 1
    results.current.bySkill[skillId] = s
  }

  const handle = ({ correct: ok, hintsUsed }) => {
    const r = results.current
    r.total += 1; r.hintsUsed += hintsUsed
    if (ok) r.correct += 1
    record(problem.skillId, ok)

    if (stage === 'challenge') { r.challengeCorrect = ok; return goAfterChallenge() }
    if (stage === 'bonus') { r.bonusEarned = ok; return onDone({ ...r }) }

    // Guided stage — apply adaptive difficulty.
    streak.current.right = ok ? streak.current.right + 1 : 0
    streak.current.wrong = ok ? 0 : streak.current.wrong + 1
    const adj = nextDifficulty(diff, streak.current)
    if (adj.message) { setBanner(adj.message); setTimeout(() => setBanner(null), 2600) }
    if (adj.reset === 'wrong') streak.current.wrong = 0
    if (adj.reset === 'right') streak.current.right = 0
    if (adj.unlockBonus) bonusUnlocked.current = true
    setDiff(adj.difficulty)

    const nextIdx = idx + 1
    if (nextIdx < GUIDED_COUNT) {
      setIdx(nextIdx)
      setProblem(genForDay(day, adj.difficulty))
    } else {
      // Move to the daily challenge (harder, real-world flavored).
      setStage('challenge')
      setProblem(genForDay(day, Math.min(5, day.difficulty + 1)))
    }
  }

  const goAfterChallenge = () => {
    if (bonusUnlocked.current) {
      setStage('bonus')
      setProblem(genForDay(day, 5))
    } else {
      onDone({ ...results.current })
    }
  }

  const kicker =
    stage === 'guided' ? `✏️ Guided Practice ${idx + 1} of ${GUIDED_COUNT}`
      : stage === 'challenge' ? `🧩 Daily Challenge — ${day.puzzle}`
        : '🔥 Bonus Challenge (advanced!)'

  return (
    <div>
      {stage === 'guided' && (
        <div className="progress-pips">
          {Array.from({ length: GUIDED_COUNT }).map((_, k) => (
            <div key={k} className={`pip ${k < idx ? 'done' : k === idx ? 'active' : ''}`} />
          ))}
        </div>
      )}
      {banner && <div className="adaptive-banner">{banner}</div>}
      <ProblemCard key={`${stage}-${idx}`} kicker={kicker} problem={problem} onNext={handle} />
    </div>
  )
}

// ---- Phase 5: Summary & streak ----
function Summary({ day, results, outcome, onExit, onNext }) {
  const topic = day.type === 'concept' && day.skill ? TOPICS[day.skill] : REVIEW_TOPIC
  const recap = topic.concept.split('.')[0] + '.'
  const acc = results.total ? Math.round((results.correct / results.total) * 100) : 100
  const hasNext = day.day < TOTAL_DAYS
  return (
    <div className="card celebrate">
      <div className="big-emoji">{acc >= 80 ? '🌟' : acc >= 50 ? '💪' : '🌱'}</div>
      <h2>Day {day.day} complete!</h2>
      <div className="xp-pop">+{outcome.xpEarned} XP</div>
      <p className="muted">You got {results.correct} of {results.total} correct ({acc}%).</p>

      {outcome.streakUp && <p style={{ fontWeight: 800 }}>🔥 Streak: {outcome.state.streak} day{outcome.state.streak !== 1 ? 's' : ''}!</p>}

      {outcome.newBadges.map((b) => (
        <div key={b.id} className="feedback correct" style={{ fontSize: 20 }}>
          🏅 New badge unlocked: <b>{b.emoji} {b.name}</b>!
        </div>
      ))}

      <div className="why-box" style={{ textAlign: 'left' }}>
        <b>Key idea today:</b><br />{recap}
      </div>

      <div className="btn-row">
        <button className="btn secondary" onClick={onExit}>Back to Map</button>
        {hasNext && <button className="btn" onClick={() => onNext(day.day + 1)}>Next Day →</button>}
      </div>
    </div>
  )
}

export default function Lesson({ dayNum, onExit, onNext }) {
  const { finishDay } = useStore()
  const day = getDay(dayNum)
  const [phase, setPhase] = useState('warmup')
  const [warm, setWarm] = useState({ correct: 0 })
  const [results, setResults] = useState(null)
  const [outcome, setOutcome] = useState(null)

  const finish = (practiceResults) => {
    // Fold warm-up into the totals so it counts toward XP and accuracy.
    const merged = {
      ...practiceResults,
      correct: practiceResults.correct + warm.correct,
      total: practiceResults.total + 2,
    }
    const o = finishDay(day, merged)
    setResults(merged)
    setOutcome(o)
    setPhase('summary')
  }

  return (
    <div>
      <div className="btn-row" style={{ marginBottom: 12 }}>
        <button className="btn ghost" style={{ width: 'auto' }} onClick={onExit}>← Map</button>
        <div style={{ flex: 1, textAlign: 'right', fontWeight: 800 }} className="muted">
          {day.weekLabel} · Day {((day.day - 1) % 30) + 1}
        </div>
      </div>

      {phase === 'warmup' && <WarmUp onDone={(w) => { setWarm(w); setPhase('concept') }} />}
      {phase === 'concept' && <ConceptLesson day={day} onDone={() => setPhase('practice')} />}
      {phase === 'practice' && <Practice day={day} onDone={finish} />}
      {phase === 'summary' && results && (
        <Summary day={day} results={results} outcome={outcome} onExit={onExit} onNext={onNext} />
      )}
    </div>
  )
}
