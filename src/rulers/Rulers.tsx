import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react'
import { isTyping, useLayoutChange } from '../lib/state'
import type { Guide } from '../measure/geometry'
import { round } from '../measure/geometry'
import { RULER_SIZE } from '../styles'

type Axis = 'x' | 'y'

/**
 * Tick marks every 10px, taller every 50px, numbered every 100px. `offset` is
 * how far the page is scrolled when numbering page coordinates, else 0.
 */
function RulerCanvas({ axis, length, offset: scrolled }: { axis: Axis; length: number; offset: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const dpr = window.devicePixelRatio || 1
    const [width, height] = axis === 'x' ? [length, RULER_SIZE] : [RULER_SIZE, length]
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    context.scale(dpr, dpr)
    context.font = '9px ui-sans-serif, system-ui, sans-serif'
    context.textBaseline = 'middle'
    const style = getComputedStyle(canvas)
    const tick = style.getPropertyValue('--ik-tick').trim() || 'rgb(255 255 255 / 0.2)'
    const text = style.getPropertyValue('--ik-tick-text').trim() || 'rgb(255 255 255 / 0.42)'

    // The ruler starts after the corner square; `value` is the coordinate being numbered
    for (let value = Math.ceil((RULER_SIZE + scrolled) / 10) * 10; value - scrolled <= length + RULER_SIZE; value += 10) {
      const p = value - scrolled
      const offset = p - RULER_SIZE
      const size = value % 100 === 0 ? RULER_SIZE : value % 50 === 0 ? 7 : 4
      context.fillStyle = tick
      if (axis === 'x') context.fillRect(offset, RULER_SIZE - size, 1, size)
      else context.fillRect(RULER_SIZE - size, offset, size, 1)

      if (value % 100 === 0) {
        context.fillStyle = text
        if (axis === 'x') {
          context.fillText(String(value), offset + 3, 7)
        } else {
          context.save()
          context.translate(7, offset + 3)
          context.rotate(-Math.PI / 2)
          context.textAlign = 'right'
          context.fillText(String(value), 0, 0)
          context.restore()
        }
      }
    }
  }, [axis, length, scrolled])

  return <canvas ref={ref} />
}

/** Highlights where the focused elements start and end on each ruler */
function Marks({ axis, rects, color, offset }: { axis: Axis; rects: DOMRect[]; color: string; offset: number }) {
  return rects.map((rect, index) => {
    const [start, end] = axis === 'x' ? [rect.left, rect.right] : [rect.top, rect.bottom]
    const band =
      axis === 'x'
        ? { left: start - RULER_SIZE, width: end - start, top: 0, bottom: 0 }
        : { top: start - RULER_SIZE, height: end - start, left: 0, right: 0 }
    const mark = (value: number, side: 'start' | 'end') => (
      <span
        className="ik-ruler-mark"
        style={{
          background: color,
          ...(axis === 'x'
            ? { top: 4, left: value - RULER_SIZE, transform: side === 'start' ? 'translateX(-100%)' : undefined }
            : {
                left: 1,
                top: value - RULER_SIZE,
                transform: `rotate(-90deg) translateX(${side === 'start' ? '0' : '-100%'})`,
                transformOrigin: 'left top',
              }),
        }}
      >
        {round(value + offset)}
      </span>
    )

    return (
      <span key={index}>
        <span className="ik-ruler-band" style={{ ...band, background: `color-mix(in srgb, ${color} 20%, transparent)` }} />
        {mark(start, 'start')}
        {mark(end, 'end')}
      </span>
    )
  })
}

export interface RulersProps {
  /** Elements in focus from measuring, marked on the rulers */
  focus: Element[]
  guides: Guide[]
  onGuidesChange: (update: (guides: Guide[]) => Guide[]) => void
  color: string
  guideColor: string
  /** Number the rulers in page coordinates, which follow scrolling */
  pageCoordinates: boolean
}

const newId = () => Math.random().toString(36).slice(2, 10)

/**
 * Rulers along the top and left of the viewport. Drag from a ruler to add a
 * guide; drag a guide back onto its ruler to remove it.
 */
export function Rulers({ focus, guides, onGuidesChange, color, guideColor, pageCoordinates }: RulersProps) {
  useLayoutChange()
  const scrollX = pageCoordinates ? Math.round(window.scrollX) : 0
  const scrollY = pageCoordinates ? Math.round(window.scrollY) : 0
  const [dragging, setDragging] = useState<Guide | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  const remove = (id: string) => onGuidesChange((current) => current.filter((guide) => guide.id !== id))

  // Delete or Backspace removes the guide under the pointer
  useEffect(() => {
    if (!hovered) return
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && !isTyping(event.target)) {
        event.preventDefault()
        remove(hovered)
        setHovered(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hovered])

  const startDrag = (event: ReactPointerEvent, axis: Axis, id = newId()) => {
    if (event.button !== 0) return
    event.preventDefault()
    const at = (e: { clientX: number; clientY: number }) => Math.round(axis === 'x' ? e.clientX : e.clientY)
    setDragging({ id, axis, position: at(event) })

    const onMove = (e: PointerEvent) => setDragging({ id, axis, position: at(e) })
    const onUp = (e: PointerEvent) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      const position = at(e)
      setDragging(null)
      onGuidesChange((current) => {
        const rest = current.filter((guide) => guide.id !== id)
        // Dropped back on the ruler: remove
        return position <= RULER_SIZE ? rest : [...rest, { id, axis, position }]
      })
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const shown = dragging ? [...guides.filter((guide) => guide.id !== dragging.id), dragging] : guides
  const rects = focus.filter((element) => element.isConnected).map((element) => element.getBoundingClientRect())

  return (
    <>
      {shown.map((guide) => (
        <div
          key={guide.id}
          className={`ik-guide ik-guide-${guide.axis}`}
          data-dragging={guide.id === dragging?.id ? '' : undefined}
          style={{
            ['--ik-guide' as string]: guideColor,
            ...(guide.axis === 'x' ? { left: guide.position } : { top: guide.position }),
          }}
          onPointerDown={(event) => startDrag(event, guide.axis, guide.id)}
          onPointerEnter={() => setHovered(guide.id)}
          onPointerLeave={() => setHovered((current) => (current === guide.id ? null : current))}
          onDoubleClick={() => remove(guide.id)}
        >
          <span className="ik-guide-label">{guide.position + (guide.axis === 'x' ? scrollX : scrollY)}</span>
        </div>
      ))}
      {/* Top ruler makes horizontal guides (y), left ruler vertical ones (x) */}
      <div className="ik-ruler ik-ruler-x" onPointerDown={(event) => startDrag(event, 'y')}>
        <RulerCanvas axis="x" length={window.innerWidth - RULER_SIZE} offset={scrollX} />
        <Marks axis="x" rects={rects} color={color} offset={scrollX} />
      </div>
      <div className="ik-ruler ik-ruler-y" onPointerDown={(event) => startDrag(event, 'x')}>
        <RulerCanvas axis="y" length={window.innerHeight - RULER_SIZE} offset={scrollY} />
        <Marks axis="y" rects={rects} color={color} offset={scrollY} />
      </div>
      <div className="ik-ruler-corner" />
    </>
  )
}
