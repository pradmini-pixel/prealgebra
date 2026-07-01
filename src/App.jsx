import React, { useState } from 'react'
import { StoreProvider, useStore } from './store.jsx'
import ProgressMap from './components/ProgressMap.jsx'
import Lesson from './components/Lesson.jsx'
import Badges from './components/Badges.jsx'
import ParentDashboard from './components/ParentDashboard.jsx'

function Shell() {
  const { state, toggleDark } = useStore()
  // view: { name: 'map' | 'lesson' | 'badges' | 'parent', day?: number }
  const [view, setView] = useState({ name: 'map' })

  const go = (name, extra = {}) => setView({ name, ...extra })

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo" onClick={() => go('map')} style={{ cursor: 'pointer' }}>
          Math Quest <span>🚀</span>
        </div>
        <span className="stat-chip" title="XP points">⭐ {state.xp}</span>
        <span className="stat-chip" title="Day streak">🔥 {state.streak}</span>
        <button className="icon-btn" title="Toggle dark mode" onClick={toggleDark}>
          {state.darkMode ? '☀️' : '🌙'}
        </button>
      </header>

      <main className="content">
        {view.name === 'map' && <ProgressMap onPlay={(day) => go('lesson', { day })} onOpen={go} />}
        {view.name === 'lesson' && (
          <Lesson key={view.day} dayNum={view.day} onExit={() => go('map')} onNext={(d) => go('lesson', { day: d })} />
        )}
        {view.name === 'badges' && <Badges onBack={() => go('map')} />}
        {view.name === 'parent' && <ParentDashboard onBack={() => go('map')} />}
      </main>

      {view.name === 'map' && (
        <div className="content" style={{ paddingTop: 0 }}>
          <div className="btn-row">
            <button className="btn secondary" onClick={() => go('badges')}>🏅 Badges</button>
            <button className="btn secondary" onClick={() => go('parent')}>👨‍👩‍👧 Parent</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
