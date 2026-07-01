import React, { useState } from 'react'
import { useStore } from '../store.jsx'
import { DAYS } from '../curriculum/curriculum.js'
import { TOPICS } from '../curriculum/topics.js'
import { masteryLevel, weakSkills } from '../engine/progress.js'

const skillName = (id) => TOPICS[id]?.title || id

// Offline activity ideas so a parent/tutor can reinforce a weak topic.
const OFFLINE_IDEAS = {
  'place-value': 'Read big numbers off cereal boxes and mail together.',
  'rounding': 'Estimate the grocery bill before checkout.',
  'add-sub': 'Play “make 100” with two dice and mental addition.',
  'mult-div': 'Practice times-tables with flash cards for 5 minutes.',
  'pemdas': 'Write a fun expression and race to solve it correctly.',
  'fraction-intro': 'Cut a pizza or sandwich and name the fractions.',
  'add-sub-fractions': 'Halve or double a recipe together.',
  'fraction-decimal': 'Compare price-per-100g labels at the store.',
  'add-sub-decimals': 'Add up a real receipt by hand.',
  'ratio-intro': 'Mix juice concentrate using its ratio.',
  'proportions': 'Scale a Lego or model build using proportions.',
  'percent-of': 'Calculate the tip at a restaurant.',
  'discount-tax': 'Find the real sale price on flyers.',
  'one-step': 'Play “guess my number” with a simple rule.',
  'two-step': 'Turn allowance-saving into an equation.',
  'perimeter-area': 'Measure a room’s perimeter and area with a tape.',
  'circles': 'Measure the distance around a plate with string.',
  'coordinate-plot': 'Play Battleship — it’s all coordinates!',
  'unit-conversion': 'Convert a recipe from cups to millilitres.',
  'mean-median-mode': 'Find the average of everyone’s ages at dinner.',
  'probability-basic': 'Predict dice rolls and tally the results.',
}

export default function ParentDashboard({ onBack }) {
  const { state, hardReset, setName } = useStore()
  const [tab, setTab] = useState('overview')

  const done = Object.values(state.progress).filter((p) => p.completed).length
  const totals = Object.values(state.progress).reduce(
    (a, p) => ({ correct: a.correct + (p.correct || 0), total: a.total + (p.total || 0) }),
    { correct: 0, total: 0 }
  )
  const acc = totals.total ? Math.round((totals.correct / totals.total) * 100) : 0
  const skillEntries = Object.entries(state.skills)
  const mastered = skillEntries.filter(([, s]) => masteryLevel(s) === 'mastered')
  const struggling = skillEntries.filter(([, s]) => masteryLevel(s) === 'struggling')
  const weak = weakSkills(state)

  // Recent 7 days for the "daily completion status" view.
  const recent = DAYS.filter((d) => state.progress[d.day]?.completed)
    .slice(-7)
    .map((d) => ({ day: d.day, ...state.progress[d.day] }))

  return (
    <div>
      <button className="btn ghost" style={{ width: 'auto' }} onClick={onBack}>← Map</button>
      <h1>Parent Dashboard</h1>

      <div className="tabbar">
        {['overview', 'skills', 'coach'].map((t) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t === 'overview' ? 'Overview' : t === 'skills' ? 'Skills' : 'Coach Tips'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="kpi-row">
            <div className="kpi"><div className="num">{done}</div><div className="label">of 180 days</div></div>
            <div className="kpi"><div className="num">{acc}%</div><div className="label">accuracy</div></div>
            <div className="kpi"><div className="num">🔥 {state.streak}</div><div className="label">day streak</div></div>
          </div>
          <div className="kpi-row">
            <div className="kpi"><div className="num">⭐ {state.xp}</div><div className="label">total XP</div></div>
            <div className="kpi"><div className="num">{mastered.length}</div><div className="label">skills mastered</div></div>
            <div className="kpi"><div className="num">{state.badges.length}</div><div className="label">badges</div></div>
          </div>

          <div className="card">
            <h2>Recent Activity</h2>
            {recent.length === 0 ? (
              <p className="muted">No completed days yet. Encourage {state.student.name} to start Day 1!</p>
            ) : (
              <ul className="list">
                {recent.map((r) => (
                  <li key={r.day}>
                    <b>Day {r.day}</b> · {r.correct}/{r.total} correct · +{r.xp} XP
                    <span className="muted" style={{ float: 'right' }}>{r.date}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {tab === 'skills' && (
        <div className="card">
          <h2>Topics Mastered vs. Struggling</h2>
          {skillEntries.length === 0 && <p className="muted">Skill data appears after a few days of practice.</p>}
          {skillEntries
            .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))
            .map(([id, s]) => {
              const lvl = masteryLevel(s)
              return (
                <div key={id} className="skill-row">
                  <span className="name">{skillName(id)}</span>
                  <span className="muted" style={{ fontSize: 13 }}>{s.correct}/{s.total}</span>
                  <span className={`pill ${lvl}`}>{lvl}</span>
                </div>
              )
            })}
        </div>
      )}

      {tab === 'coach' && (
        <>
          <div className="card">
            <h2>This Week's Summary</h2>
            <p>
              {state.student.name} has completed <b>{done} days</b> with <b>{acc}% accuracy</b> and a
              {' '}<b>{state.streak}-day streak</b>. {mastered.length > 0 && `Strong on ${mastered.slice(0, 3).map(([id]) => skillName(id)).join(', ')}. `}
              {struggling.length > 0 ? `Could use extra help with ${struggling.slice(0, 3).map(([id]) => skillName(id)).join(', ')}.` : 'No struggling topics right now — great work!'}
            </p>
            <p className="muted" style={{ fontSize: 14 }}>💡 Tip: this text is ready to copy into a weekly email update.</p>
          </div>

          <div className="card">
            <h2>Recommended Offline Activities</h2>
            {weak.length === 0 ? (
              <p className="muted">No weak areas detected yet — keep up the daily quests!</p>
            ) : (
              <ul className="list">
                {weak.map((id) => (
                  <li key={id}><b>{skillName(id)}:</b> {OFFLINE_IDEAS[id] || 'Practice a few extra problems together.'}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h2>Settings</h2>
            <label className="muted" style={{ fontSize: 14 }}>Student name</label>
            <input className="answer-input" style={{ textAlign: 'left', marginTop: 6 }} value={state.student.name}
              onChange={(e) => setName(e.target.value)} />
            <button className="btn ghost" style={{ marginTop: 12, color: 'var(--danger)' }}
              onClick={() => { if (confirm('Reset ALL progress? This cannot be undone.')) hardReset() }}>
              Reset all progress
            </button>
          </div>
        </>
      )}
    </div>
  )
}
