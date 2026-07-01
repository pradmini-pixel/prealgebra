import React from 'react'
import { useStore } from '../store.jsx'
import { MONTH_META, DAYS } from '../curriculum/curriculum.js'

export default function Badges({ onBack }) {
  const { state } = useStore()
  const done = Object.values(state.progress).filter((p) => p.completed).length
  const allDone = done >= DAYS.length
  const champion = allDone

  return (
    <div>
      <button className="btn ghost" style={{ width: 'auto' }} onClick={onBack}>← Map</button>
      <div className="card celebrate">
        <div className="big-emoji">🏅</div>
        <h2>Your Trophy Case</h2>
        <p className="muted">{state.badges.length} of {MONTH_META.length} monthly badges earned</p>
      </div>

      <div className="badge-grid">
        {MONTH_META.map((m) => {
          const earned = state.badges.includes(m.badge.id)
          return (
            <div key={m.n} className={`badge ${earned ? '' : 'locked'}`} style={earned ? { borderColor: m.badge.color } : {}}>
              <div className="b-emoji">{m.badge.emoji}</div>
              <div className="b-name">{m.badge.name}</div>
              <div className="muted" style={{ fontSize: 12 }}>{earned ? 'Earned!' : `Month ${m.n}`}</div>
            </div>
          )
        })}
      </div>

      <div className="card celebrate" style={{ marginTop: 16 }}>
        <div className="big-emoji">{champion ? '👑' : '🔒'}</div>
        <h2>{champion ? 'Math Quest Champion!' : 'Grand Champion Certificate'}</h2>
        {champion ? (
          <>
            <p>This certifies that <b>{state.student.name}</b> has completed all 180 days of the Pre-Algebra Quest and is ready for Algebra 1! 🎓</p>
            <p className="muted">Total XP: ⭐ {state.xp} · Best streak: 🔥 {state.bestStreak}</p>
            <button className="btn" onClick={() => window.print()}>🖨️ Print / Save Certificate</button>
          </>
        ) : (
          <p className="muted">Finish all 180 days to unlock your certificate and Algebra 1 preview.</p>
        )}
      </div>
    </div>
  )
}
