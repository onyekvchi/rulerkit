import { type ReactNode, useEffect, useRef, useState } from 'react'
import { type Guide, guideLines, measure, type MeasureLine, type Rect, round } from './geometry'

const LABEL_FONT = '500 11px/1 ui-sans-serif, system-ui, sans-serif'
// How close (px) the pointer must be to a guide to measure against it
const GUIDE_SNAP = 3

export interface MeasureProps {
  /** Colour of outlines, lines and labels */
  color: string
  /** Selector for elements that can't be measured (inspectkit's own UI is always excluded) */
  ignore: string
  /** Visible guides; with an element selected, Option-hovering a guide measures to it */
  guides: Guide[]
  /** Called with the elements in focus (hovered, selected, pinned) so rulers can mark them */
  onFocusChange: (elements: Element[]) => void
}

interface Selection {
  /** The Option-clicked element */
  selected: Element | null
  /** A second, Option + Shift-clicked element measured against `selected` */
  pinned: Element | null
}

const EMPTY: Selection = { selected: null, pinned: null }

function Box({ rect, color, dashed }: { rect: Rect; color: string; dashed?: boolean }) {
  return (
    <div
      style={{
        position: 'fixed',
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        outline: `1px ${dashed ? 'dashed' : 'solid'} ${color}`,
      }}
    />
  )
}

function Label({
  x,
  y,
  color,
  below,
  children,
}: {
  x: number
  y: number
  color: string
  below?: boolean
  children: ReactNode
}) {
  return (
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y,
        transform: below ? 'translate(-50%, 6px)' : 'translate(6px, -50%)',
        padding: '3px 5px',
        borderRadius: 4,
        background: color,
        color: 'white',
        font: LABEL_FONT,
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </div>
  )
}

function Line({ line, color }: { line: MeasureLine; color: string }) {
  const { x1, y1, x2, y2, guide } = line
  const horizontal = y1 === y2
  const length = horizontal ? Math.abs(x2 - x1) : Math.abs(y2 - y1)
  if (length < 0.5) return null

  const left = Math.min(x1, x2)
  const top = Math.min(y1, y2)
  const border = `1px ${guide ? 'dashed' : 'solid'} ${color}`

  return (
    <>
      <div
        style={{
          position: 'fixed',
          left: horizontal ? left : left - 0.5,
          top: horizontal ? top - 0.5 : top,
          width: horizontal ? length : 0,
          height: horizontal ? 0 : length,
          [horizontal ? 'borderTop' : 'borderLeft']: border,
        }}
      />
      {!guide && (
        <Label
          x={horizontal ? left + length / 2 : left}
          y={horizontal ? top : top + length / 2}
          color={color}
          below={horizontal}
        >
          {round(length)}
        </Label>
      )}
    </>
  )
}

function SizeLabel({ rect, color }: { rect: Rect; color: string }) {
  return (
    <Label x={rect.left + rect.width / 2} y={rect.bottom} color={color} below>
      {round(rect.width)} × {round(rect.height)}
    </Label>
  )
}

/**
 * Figma-style distance measuring.
 *
 * Hold Option (Alt):
 *   - hover an element to see its size and its distance to its parent
 *   - ↑ / ↓ to step the hovered element out to its parent / back in
 *   - click to select it, then hover anything else to measure between the two
 *     (hovering an ancestor of the selection measures the inside distances)
 *   - Shift-click a second element to pin it: the first stays selected and the
 *     measurement between the two stays on screen after Option is released
 *   - with an element selected, hover a guide to measure to it
 * Esc clears the selection.
 */
export function Measure({ color, ignore, guides, onFocusChange }: MeasureProps) {
  const [active, setActive] = useState(false)
  const [selection, setSelection] = useState<Selection>(EMPTY)
  const { selected, pinned } = selection
  const [picked, setPicked] = useState<Element | null>(null)
  const [pickedGuide, setPickedGuide] = useState<Guide | null>(null)
  const [lift, setLift] = useState(0)
  const [, rerender] = useState(0)
  const pointer = useRef({ x: -1, y: -1 })
  // The hovered element after ↑/↓ steps, for the pointerdown handler
  const target = useRef<Element | null>(null)
  const guidesRef = useRef(guides)
  guidesRef.current = guides

  useEffect(() => {
    const excluded = `[data-inspectkit], ${ignore}`
    const elementAtPointer = () => {
      const element = document.elementFromPoint(pointer.current.x, pointer.current.y)
      return element && element !== document.documentElement && !element.closest(excluded) ? element : null
    }
    const pick = () => {
      const { x, y } = pointer.current
      const guide = guidesRef.current.find(
        ({ axis, position }) => Math.abs((axis === 'x' ? x : y) - position) <= GUIDE_SNAP,
      )
      setPickedGuide(guide ?? null)
      const element = guide ? null : elementAtPointer()
      setPicked((previous) => {
        if (previous !== element) setLift(0)
        return element
      })
    }

    const onPointerMove = (event: PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY }
      if (event.altKey) pick()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Alt') {
        setActive(true)
        pick()
      } else if (event.key === 'Escape') {
        setSelection(EMPTY)
      } else if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        event.preventDefault()
        setLift((value) => Math.max(0, value + (event.key === 'ArrowUp' ? 1 : -1)))
      }
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Alt') setActive(false)
    }
    const onBlur = () => setActive(false)
    // Option-click would otherwise follow or download links
    const onClick = (event: MouseEvent) => {
      if (!event.altKey || !elementAtPointer()) return
      event.preventDefault()
      event.stopPropagation()
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!event.altKey || !elementAtPointer()) return
      event.preventDefault()
      const element = target.current
      if (!element) return
      setSelection(({ selected, pinned }) => {
        // Shift pins (or unpins) a second element, keeping the first selected
        if (event.shiftKey && selected && element !== selected) {
          return { selected, pinned: pinned === element ? null : element }
        }
        return selected === element ? EMPTY : { selected: element, pinned: null }
      })
    }
    const onLayoutChange = () => rerender((n) => n + 1)

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('click', onClick, true)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    window.addEventListener('scroll', onLayoutChange, true)
    window.addEventListener('resize', onLayoutChange)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('click', onClick, true)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('scroll', onLayoutChange, true)
      window.removeEventListener('resize', onLayoutChange)
    }
  }, [ignore])

  // Apply ↑/↓ steps to the element under the pointer
  let hovered = picked
  for (let i = 0; i < lift && hovered?.parentElement && hovered.parentElement !== document.body; i++) {
    hovered = hovered.parentElement
  }

  useEffect(() => {
    target.current = active ? hovered : null
  })

  const focusedHover = active ? hovered : null
  useEffect(() => {
    onFocusChange([selected, pinned, focusedHover].filter((element): element is Element => Boolean(element)))
  }, [selected, pinned, focusedHover, onFocusChange])

  // Drop elements that left the page (e.g. after navigating)
  if (selected && !selected.isConnected) setSelection(EMPTY)
  else if (pinned && !pinned.isConnected) setSelection({ selected, pinned: null })
  if (!active && !selected) return null

  const selectedRect = selected?.getBoundingClientRect()
  const pinnedRect = pinned?.getBoundingClientRect()
  const hoveredRect = active ? hovered?.getBoundingClientRect() : undefined
  const parent = !selected && hovered?.parentElement !== document.body ? hovered?.parentElement : null
  const parentRect = active && parent ? parent.getBoundingClientRect() : undefined

  let lines: MeasureLine[] = []
  if (selectedRect && pinnedRect) lines = measure(selectedRect, pinnedRect)
  else if (selectedRect && active && pickedGuide) lines = guideLines(selectedRect, pickedGuide)
  else if (selectedRect && hoveredRect && hovered !== selected) lines = measure(selectedRect, hoveredRect)
  else if (hoveredRect && parentRect) lines = measure(hoveredRect, parentRect)

  return (
    <div
      data-inspectkit=""
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 2147483646, pointerEvents: 'none' }}
    >
      {parentRect && <Box rect={parentRect} color={color} dashed />}
      {selectedRect && <Box rect={selectedRect} color={color} />}
      {pinnedRect && <Box rect={pinnedRect} color={color} />}
      {hoveredRect && hovered !== selected && hovered !== pinned && (
        <Box rect={hoveredRect} color={color} dashed={Boolean(selected)} />
      )}
      {lines.map((line, index) => (
        <Line key={index} line={line} color={color} />
      ))}
      {/* Size of the element in focus: the hovered one, or the selection on its own */}
      {!selected && hoveredRect && <SizeLabel rect={hoveredRect} color={color} />}
      {selectedRect && !pinnedRect && !(active && pickedGuide) && (!hoveredRect || hovered === selected) && (
        <SizeLabel rect={selectedRect} color={color} />
      )}
    </div>
  )
}
