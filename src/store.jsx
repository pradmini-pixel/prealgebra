import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { loadState, saveState, resetState } from './engine/storage.js'
import { completeDay } from './engine/progress.js'

const StoreCtx = createContext(null)

export function StoreProvider({ children }) {
  const [state, setState] = useState(loadState)

  // Persist on every change.
  useEffect(() => { saveState(state) }, [state])

  // Reflect dark mode onto the document so CSS variables flip.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.darkMode ? 'dark' : 'light')
  }, [state.darkMode])

  const finishDay = useCallback((day, result) => {
    let outcome
    setState((s) => {
      const r = completeDay(s, day, result)
      outcome = r
      return r.state
    })
    return outcome
  }, [])

  const toggleDark = useCallback(() => setState((s) => ({ ...s, darkMode: !s.darkMode })), [])
  const setName = useCallback((name) => setState((s) => ({ ...s, student: { ...s.student, name } })), [])
  const hardReset = useCallback(() => setState(resetState()), [])

  return (
    <StoreCtx.Provider value={{ state, finishDay, toggleDark, setName, hardReset }}>
      {children}
    </StoreCtx.Provider>
  )
}

export const useStore = () => {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
