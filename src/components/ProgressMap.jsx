import React from 'react'
import { useStore } from '../store.jsx'
import { DAYS, MONTH_META } from '../curriculum/curriculum.js'

export default function ProgressMap({ onPlay }) {
  const { state } = useStore()
  const { progress, currentDay, student } = state

  const byMonth = MONTH_META.map((m) => ({
    ...m,
    days: DAYS.filter((d) => d.month === m.n),
  }))

  const totalDone = Object.values(progress).filter((p) => p.completed).length

  return (
    <div>
      <div className="map-intro">
        <h1>Hi {student.name}! 🚀</h1>
        <p className="muted">Your 6-month Pre-Algebra adventure · {totalDone} / 180 days conquered</p>
        <button className="btn" style={{ maxWidth: 320, margin: '10px auto 0' }} onClick={() => onPlay(currentDay)}>
          {currentDay === 1 ? 'Start Day 1 ▶' : `Continue · Day ${currentDay} ▶`}
        </button>
      </div>

      {byMonth.map((m) => {
        const done = m.days.filter((d) => progress[d.day]?.completed).length
        const pct = Math.round((done / m.days.length) * 100)
        const earned = state.badges.includes(m.badge.id)
        return (
          <section key={m.n} className="month-island">
            <div className="month-emoji" style={{ filter: earned ? 'none' : done ? 'none' : 'grayscale(0.4)' }}>
              {m.badge.emoji}
            </div>
            <div className="month-body">
              <div className="month-title">Month {m.n}: {m.title}</div>
              <div className="muted" style={{ fontSize: 14 }}>
                {done} / {m.days.length} days {earned && `· ${m.badge.name} earned ✅`}
              </div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
              <div className="day-dots">
                {m.days.map((d) => {
                  const isDone = progress[d.day]?.completed
                  const isCurrent = d.day === currentDay
                  const locked = d.day > currentDay
                  const cls = ['day-dot']
                  if (d.type === 'boss') cls.push('boss')
                  if (isDone) cls.push('done')
                  else if (isCurrent) cls.push('current')
                  if (locked) cls.push('locked')
                  const label = d.type === 'boss' ? (d.awardsBadge ? '🏅' : '👾') : d.type === 'puzzle' ? '🧩' : (((d.day - 1) % 30) + 1)
                  return (
                    <button
                      key={d.day}
                      className={cls.join(' ')}
                      disabled={locked}
                      title={`Day ${d.day}: ${d.title || d.weekTitle}`}
                      onClick={() => !locked && onPlay(d.day)}
                    >
                      {isDone ? '✓' : label}
                    </button>
                  )
                })}
              </div>
            </div>
          </section>
        )
      })}
    </div>
  )
}
