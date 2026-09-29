import { useEffect, useState } from 'react'

// Attributes teams add for tests and tooling; stable, so good selector hooks
const HOOK_ATTRIBUTES = ['data-testid', 'data-test', 'data-qa', 'data-cy', 'data-component']

const isUnique = (selector: string) => {
  try {
    return document.querySelectorAll(selector).length === 1
  } catch {
    return false
  }
}

/**
 * A short, stable CSS selector that matches only `element`. Prefers an id, a
 * test attribute, or a tag that's unique on the page, then falls back to a
 * tag/nth-of-type path. Classes are skipped: utility classes make brittle
 * selectors.
 */
export function selectorFor(element: Element): string {
  if (element.id && isUnique(`#${CSS.escape(element.id)}`)) return `#${CSS.escape(element.id)}`

  for (const attribute of HOOK_ATTRIBUTES) {
    const value = element.getAttribute(attribute)
    const selector = value && `[${attribute}="${CSS.escape(value)}"]`
    if (selector && isUnique(selector)) return selector
  }

  const tag = element.tagName.toLowerCase()
  if (isUnique(tag)) return tag

  const parts: string[] = []
  let node: Element | null = element
  while (node && node !== document.documentElement) {
    if (node !== element && node.id && isUnique(`#${CSS.escape(node.id)}`)) {
      parts.unshift(`#${CSS.escape(node.id)}`)
      break
    }
    let part = node.tagName.toLowerCase()
    const parent: Element | null = node.parentElement
    if (parent) {
      const siblings = [...parent.children].filter((child) => child.tagName === node!.tagName)
      if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`
    }
    parts.unshift(part)
    const selector = parts.join(' > ')
    if (isUnique(selector)) return selector
    node = parent
  }
  return parts.join(' > ')
}

interface Hovered {
  rect: DOMRect
  selector: string
}

/**
 * Eyedropper for grid targets: highlights the element under the pointer and
 * picks it on click. rulerkit's own UI keeps working (so the panel's button
 * can cancel), and the page doesn't receive the picking click.
 */
export function TargetPicker({
  ignore,
  onPick,
  onCancel,
}: {
  ignore: string
  onPick: (selector: string) => void
  onCancel: () => void
}) {
  const [hovered, setHovered] = useState<Hovered | null>(null)

  useEffect(() => {
    const excluded = `[data-rulerkit], ${ignore}`
    const pickable = (target: EventTarget | null) =>
      target instanceof Element && target !== document.documentElement && target !== document.body && !target.closest(excluded)
        ? target
        : null

    const onMove = (event: PointerEvent) => {
      const element = pickable(document.elementFromPoint(event.clientX, event.clientY))
      setHovered(element ? { rect: element.getBoundingClientRect(), selector: selectorFor(element) } : null)
    }
    // Swallow the whole press on the page so links and handlers don't fire
    const swallow = (event: Event) => {
      if (!pickable(event.target)) return
      event.preventDefault()
      event.stopPropagation()
    }
    const onClick = (event: MouseEvent) => {
      const element = pickable(event.target)
      if (!element) return
      event.preventDefault()
      event.stopPropagation()
      onPick(selectorFor(element))
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }

    const root = document.documentElement
    const previousCursor = root.style.cursor
    root.style.cursor = 'crosshair'
    window.addEventListener('pointermove', onMove, true)
    window.addEventListener('pointerdown', swallow, true)
    window.addEventListener('mousedown', swallow, true)
    window.addEventListener('click', onClick, true)
    window.addEventListener('keydown', onKeyDown, true)
    return () => {
      root.style.cursor = previousCursor
      window.removeEventListener('pointermove', onMove, true)
      window.removeEventListener('pointerdown', swallow, true)
      window.removeEventListener('mousedown', swallow, true)
      window.removeEventListener('click', onClick, true)
      window.removeEventListener('keydown', onKeyDown, true)
    }
  }, [ignore, onPick, onCancel])

  if (!hovered) return null
  const { rect, selector } = hovered

  return (
    <div className="rk-picker" aria-hidden="true">
      <div
        className="rk-picker-box"
        style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
      />
      <div
        className="rk-picker-label"
        style={{ left: rect.left, top: rect.top > 28 ? rect.top - 24 : rect.bottom + 4 }}
      >
        {selector}
        <span>
          {Math.round(rect.width)} × {Math.round(rect.height)}
        </span>
      </div>
    </div>
  )
}
