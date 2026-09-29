import { useCallback, useEffect, useState } from 'react'

const PREFIX = 'rulerkit:'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Storage unavailable (private mode, blocked); state still works for this session
  }
}

export function forget(key: string) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    // See save()
  }
}

type SetState<T> = (next: T | ((previous: T) => T)) => void

/**
 * useState that's saved to localStorage under `rulerkit:<key>`. Changing
 * `key` (e.g. per page) loads that key's value.
 */
export function usePersistentState<T>(key: string, fallback: T): [T, SetState<T>] {
  const [state, setState] = useState(() => ({ key, value: load(key, fallback) }))

  let { value } = state
  if (state.key !== key) {
    value = load(key, fallback)
    setState({ key, value })
  }

  const set: SetState<T> = useCallback((next) => {
    setState((previous) => {
      const value = typeof next === 'function' ? (next as (previous: T) => T)(previous.value) : next
      save(previous.key, value)
      return { key: previous.key, value }
    })
  }, [])

  return [value, set]
}

/** The current pathname, including client-side navigations in any router */
export function usePathname() {
  const [pathname, setPathname] = useState(() => location.pathname)
  useEffect(() => {
    const id = setInterval(() => setPathname(location.pathname), 250)
    return () => clearInterval(id)
  }, [])
  return pathname
}

/** Re-renders on scroll (anywhere on the page) and resize, for overlays that track layout */
export function useLayoutChange() {
  const [, rerender] = useState(0)
  useEffect(() => {
    const onChange = () => rerender((n) => n + 1)
    window.addEventListener('scroll', onChange, true)
    window.addEventListener('resize', onChange)
    return () => {
      window.removeEventListener('scroll', onChange, true)
      window.removeEventListener('resize', onChange)
    }
  }, [])
}

/** True when a keyboard shortcut should be left alone because the user is typing */
export const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
