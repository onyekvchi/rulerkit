import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react'
import { useLayoutChange } from '../lib/state'
import type { Guide } from '../measure/geometry'
import { round } from '../measure/geometry'
import { RULER_SIZE } from '../styles'

const TICK = 'rgb(255 255 255 / 0.28)'
const TEXT = 'rgb(255 255 255 / 0.55)'

type Axis = 'x' | 'y'

/** Tick marks every 10px, taller every 50px, numbered every 100px */
function RulerCanvas({ axis, length }: { axis: Axis; length: number }) {
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

    // The ruler starts after the corner square, but numbers are viewport coordinates
    for (let p = Math.ceil(RULER_SIZE / 10) * 10; p <= length + RULER_SIZE; p += 10) {
      const offset = p - RULER_SIZE
      const size = p % 100 === 0 ? RULER_SIZE : p % 50 === 0 ? 7 : 4
      context.fillStyle = TICK
      if (axis === 'x') context.fillRect(offset, RULER_SIZE - size, 1, size)
      else context.fillRect(RULER_SIZE - size, offset, size, 1)

      if (p % 100 === 0) {
        context.fillStyle = TEXT
        if (axis === 'x') {
          context.fillText(String(p), offset + 3, 7)
        } else {
          context.save()
          context.translate(7, offset + 3)
          context.rotate(-Math.PI / 2)
          context.textAlign = 'right'
          context.fillText(String(p), 0, 0)
          context.restore()
        }
      }
    }
  }, [axis, length])

  return <canvas ref={ref} />
}

/** Highlights where the focused elements start and end on each ruler */
function Marks({ axis, rects, color }: { axis: Axis; rects: DOMRect[]; color: string }) {
  return rects.map((rect, index) => {
    const [start, end] = axis === 'x' ? [rect.left, rect.right] : [rect.top, rect.bottom]
    const band =
      axis === 'x'
        ? { left: start - RULER_SIZE, width: end - start, top: 0, bottom: 0 }
        : { top: start - RULER_SIZE, height: end - start, left: 0, right: 0 }
    const mark = (value: number, side: 'start' | 'end') => (
      <span
        className="lk-ruler-mark"
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
        {round(value)}
      </span>
    )

    return (
      <span key={index}>
        <span className="lk-ruler-band" style={{ ...band, background: `color-mix(in srgb, ${color} 20%, transparent)` }} />
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
}

const newId = () => Math.random().toString(36).slice(2, 10)

/**
 * Rulers along the top and left of the viewport. Drag from a ruler to add a
 * guide; drag a guide back onto its ruler to remove it.
 */
export function Rulers({ focus, guides, onGuidesChange, color, guideColor }: RulersProps) {
  useLayoutChange()
  const [dragging, setDragging] = useState<Guide | null>(null)

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
          className={`lk-guide lk-guide-${guide.axis}`}
          data-dragging={guide.id === dragging?.id ? '' : undefined}
          style={{
            ['--lk-guide' as string]: guideColor,
            ...(guide.axis === 'x' ? { left: guide.position } : { top: guide.position }),
          }}
          onPointerDown={(event) => startDrag(event, guide.axis, guide.id)}
        >
          <span className="lk-guide-label">{guide.position}</span>
        </div>
      ))}
      {/* Top ruler makes horizontal guides (y), left ruler vertical ones (x) */}
      <div className="lk-ruler lk-ruler-x" onPointerDown={(event) => startDrag(event, 'y')}>
        <RulerCanvas axis="x" length={window.innerWidth - RULER_SIZE} />
        <Marks axis="x" rects={rects} color={color} />
      </div>
      <div className="lk-ruler lk-ruler-y" onPointerDown={(event) => startDrag(event, 'x')}>
        <RulerCanvas axis="y" length={window.innerHeight - RULER_SIZE} />
        <Marks axis="y" rects={rects} color={color} />
      </div>
      <div className="lk-ruler-corner" />
    </>
  )
}
