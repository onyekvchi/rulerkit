import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useRef,
  useState,
} from 'react'
import { useLayoutChange, usePersistentState } from '../lib/state'
import { RULER_SIZE } from '../styles'
import {
  DEFAULT_BASELINE_COLOR,
  DEFAULT_TRACK_COLOR,
  type GridAlignment,
  type GridConfig,
  type TrackGrid,
} from '../grids/Grids'

const icons = {
  eye: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8s-2.4 4.5-6.5 4.5S1.5 8 1.5 8z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  ),
  eyeOff: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.6 3.7A6.4 6.4 0 018 3.5c4.1 0 6.5 4.5 6.5 4.5a11 11 0 01-1.6 2.1M4.2 4.9A10.6 10.6 0 001.5 8s2.4 4.5 6.5 4.5a6.3 6.3 0 003.4-1" />
      <path d="M6.6 6.6a2 2 0 002.8 2.8M2 2l12 12" />
    </svg>
  ),
  grip: (
    <svg viewBox="0 0 6 16" fill="currentColor">
      <circle cx="1.5" cy="4.5" r="1" />
      <circle cx="4.5" cy="4.5" r="1" />
      <circle cx="1.5" cy="8" r="1" />
      <circle cx="4.5" cy="8" r="1" />
      <circle cx="1.5" cy="11.5" r="1" />
      <circle cx="4.5" cy="11.5" r="1" />
    </svg>
  ),
  measure: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round">
      <path d="M2.5 8h11M2.5 5.5v5M13.5 5.5v5M5 8l-1.5-1.5M5 8L3.5 9.5M11 8l1.5-1.5M11 8l1.5 1.5" />
    </svg>
  ),
  rulers: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round">
      <path d="M2.5 2.5h11v3.5h-7.5v7.5H2.5z" />
      <path d="M5 2.5V4M7.5 2.5V4M10 2.5V4M2.5 8.5H4M2.5 11H4" strokeLinecap="round" />
    </svg>
  ),
  grids: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25">
      <rect x="2.5" y="2.5" width="3" height="11" rx="0.5" />
      <rect x="6.5" y="2.5" width="3" height="11" rx="0.5" />
      <rect x="10.5" y="2.5" width="3" height="11" rx="0.5" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round">
      <path d="M2.5 4.5h6M11.5 4.5h2M2.5 11.5h2M7.5 11.5h6" />
      <circle cx="10" cy="4.5" r="1.5" />
      <circle cx="6" cy="11.5" r="1.5" />
    </svg>
  ),
}

function ToggleButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string
  pressed: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button type="button" className="rk-button" aria-label={label} title={label} aria-pressed={pressed} onClick={onClick}>
      {children}
    </button>
  )
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = Infinity,
}: {
  label: string
  value: number | undefined
  onChange: (value: number) => void
  min?: number
  max?: number
}) {
  return (
    <label className="rk-field">
      {label}
      <input
        type="number"
        min={min}
        max={Number.isFinite(max) ? max : undefined}
        value={value ?? 0}
        onChange={(event) => onChange(Math.min(max, Math.max(min, Number(event.target.value) || 0)))}
      />
    </label>
  )
}

/**
 * Splits any CSS colour into a hex colour (for <input type="color">, which has
 * no alpha) and an opacity, using the canvas to normalise the format.
 */
function parseColor(color: string) {
  const context = document.createElement('canvas').getContext('2d')
  if (!context) return { hex: '#ff0000', alpha: 1 }
  context.fillStyle = color
  // fillStyle reads back as '#rrggbb' when opaque, 'rgba(r, g, b, a)' otherwise
  const value = String(context.fillStyle)
  if (value.startsWith('#')) return { hex: value, alpha: 1 }
  const [r, g, b, a = 1] = value.match(/[\d.]+/g)?.map(Number) ?? [255, 0, 0, 1]
  const hex = `#${[r, g, b].map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`
  return { hex, alpha: a }
}

function toColor(hex: string, alpha: number) {
  const [r, g, b] = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16))
  return `rgb(${r} ${g} ${b} / ${Math.round(alpha * 100) / 100})`
}

function ColorField({ color, onChange }: { color: string; onChange: (color: string) => void }) {
  const { hex, alpha } = parseColor(color)

  return (
    <div className="rk-color-row">
      <label className="rk-field">
        Color
        <span className="rk-color">
          <input
            type="color"
            aria-label="Grid color"
            value={hex}
            onChange={(event) => onChange(toColor(event.target.value, alpha))}
          />
          <span>{hex.toUpperCase()}</span>
        </span>
      </label>
      <NumberField
        label="Opacity %"
        value={Math.round(alpha * 100)}
        max={100}
        onChange={(percent) => onChange(toColor(hex, percent / 100))}
      />
    </div>
  )
}

const newGrid = (): TrackGrid => ({ type: 'columns', count: 12, gutter: 24, margin: 64, alignment: 'stretch' })

function GridCard({
  grid,
  onChange,
  onRemove,
}: {
  grid: GridConfig
  onChange: (grid: GridConfig) => void
  onRemove: () => void
}) {
  const set = (patch: Partial<GridConfig>) => onChange({ ...grid, ...patch } as GridConfig)
  const changeType = (type: GridConfig['type']) =>
    onChange(
      type === 'baseline'
        ? { type, size: 8, color: grid.color, target: grid.target }
        : { ...newGrid(), type, color: grid.color, target: grid.target },
    )

  return (
    <div className="rk-grid-card" data-hidden={grid.hidden ? '' : undefined}>
      <div className="rk-grid-card-header">
        <select
          aria-label="Grid type"
          value={grid.type}
          onChange={(event) => changeType(event.target.value as GridConfig['type'])}
        >
          <option value="columns">Columns</option>
          <option value="rows">Rows</option>
          <option value="baseline">Baseline</option>
        </select>
        <button
          type="button"
          className="rk-icon-button"
          aria-label={grid.hidden ? 'Show grid' : 'Hide grid'}
          title={grid.hidden ? 'Show grid' : 'Hide grid'}
          aria-pressed={!grid.hidden}
          onClick={() => set({ hidden: !grid.hidden || undefined })}
        >
          {grid.hidden ? icons.eyeOff : icons.eye}
        </button>
        <button type="button" className="rk-text-button rk-text-button-quiet" onClick={onRemove}>
          Remove
        </button>
      </div>

      {grid.type === 'baseline' ? (
        <>
          <NumberField label="Size" value={grid.size} min={2} onChange={(size) => set({ size })} />
          <NumberField label="Offset" value={grid.offset} onChange={(offset) => set({ offset })} />
        </>
      ) : (
        <>
          <NumberField label="Count" value={grid.count} min={1} onChange={(count) => set({ count })} />
          <NumberField label="Gutter" value={grid.gutter} onChange={(gutter) => set({ gutter })} />
          <label className="rk-field">
            Alignment
            <select
              value={grid.alignment ?? 'stretch'}
              onChange={(event) => set({ alignment: event.target.value as GridAlignment })}
            >
              <option value="stretch">Stretch</option>
              <option value="start">Start</option>
              <option value="center">Center</option>
              <option value="end">End</option>
            </select>
          </label>
          {grid.alignment !== 'center' && (
            <NumberField label="Margin" value={grid.margin} onChange={(margin) => set({ margin })} />
          )}
          {(grid.alignment ?? 'stretch') !== 'stretch' && (
            <NumberField label={grid.type === 'columns' ? 'Width' : 'Height'} value={grid.size ?? 80} min={1} onChange={(size) => set({ size })} />
          )}
        </>
      )}

      <ColorField
        color={grid.color ?? (grid.type === 'baseline' ? DEFAULT_BASELINE_COLOR : DEFAULT_TRACK_COLOR)}
        onChange={(color) => set({ color })}
      />

      <label className="rk-field" style={{ gridColumn: '1 / -1' }}>
        Target (CSS selector, empty for viewport)
        <input
          type="text"
          placeholder="viewport"
          value={grid.target ?? ''}
          onChange={(event) => set({ target: event.target.value || undefined })}
        />
      </label>
    </div>
  )
}

function GridPanel({
  grids,
  onChange,
  onReset,
}: {
  grids: GridConfig[]
  onChange: (grids: GridConfig[]) => void
  onReset: () => void
}) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`grids={${JSON.stringify(grids, null, 2)}}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked; nothing to copy to
    }
  }

  return (
    <div
      className="rk-panel"
      role="dialog"
      aria-label="Layout grids"
      // Shortcuts pause while a field has focus; Esc or Enter leaves the field
      onKeyDown={(event) => {
        const field = event.target
        if ((event.key === 'Escape' || event.key === 'Enter') && field instanceof HTMLInputElement) {
          field.blur()
        }
      }}
    >
      <div className="rk-panel-header">
        Layout grids
        <button type="button" className="rk-text-button" onClick={() => onChange([...grids, newGrid()])}>
          Add
        </button>
      </div>
      {grids.map((grid, index) => (
        <GridCard
          key={index}
          grid={grid}
          onChange={(next) => onChange(grids.map((current, i) => (i === index ? next : current)))}
          onRemove={() => onChange(grids.filter((_, i) => i !== index))}
        />
      ))}
      <div className="rk-panel-footer">
        <button type="button" className="rk-text-button rk-text-button-quiet" onClick={onReset}>
          Reset
        </button>
        <button type="button" className="rk-text-button" onClick={copy}>
          {copied ? 'Copied' : 'Copy props'}
        </button>
      </div>
    </div>
  )
}

export interface ToolbarProps {
  measure: boolean
  rulers: boolean
  grids: boolean
  onToggle: (tool: 'measure' | 'rulers' | 'grids') => void
  gridConfig: GridConfig[]
  onGridConfigChange: (grids: GridConfig[]) => void
  onGridConfigReset: () => void
}

interface Point {
  x: number
  y: number
}

// Past this distance (px) a press on the toolbar becomes a drag, not a click
const DRAG_THRESHOLD = 4
// Space kept between the toolbar and the viewport edges (or the rulers)
const EDGE = 8

/**
 * Keeps the toolbar's top-left corner inside the viewport, clear of the
 * rulers when they're showing.
 */
function clamp(point: Point, size: { width: number; height: number }, rulers: boolean): Point {
  const min = rulers ? RULER_SIZE + EDGE : EDGE
  return {
    x: Math.round(Math.min(Math.max(point.x, min), window.innerWidth - size.width - EDGE)),
    y: Math.round(Math.min(Math.max(point.y, min), window.innerHeight - size.height - EDGE)),
  }
}

/**
 * Lets the toolbar be dragged anywhere, from any part of it. Returns the
 * position to render (null keeps the default corner), whether a drag is in
 * progress, and handlers for the toolbar element.
 */
function useDraggable(rulers: boolean) {
  const [saved, setSaved] = usePersistentState<Point | null>('position', null)
  const [live, setLive] = useState<Point | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const size = useRef({ width: 150, height: 38 })
  // Set when a press turned into a drag, so the click that ends it is ignored
  const dragged = useRef(false)
  useLayoutChange()

  const onPointerDown = (event: ReactPointerEvent) => {
    const toolbar = ref.current
    if (event.button !== 0 || !toolbar) return
    const rect = toolbar.getBoundingClientRect()
    size.current = { width: rect.width, height: rect.height }
    const start = { x: event.clientX, y: event.clientY }
    let last: Point | null = null
    dragged.current = false

    const onMove = (move: PointerEvent) => {
      const dx = move.clientX - start.x
      const dy = move.clientY - start.y
      if (!dragged.current && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      dragged.current = true
      last = clamp({ x: rect.left + dx, y: rect.top + dy }, size.current, rulers)
      setLive(last)
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      // Persist once at the end rather than on every move
      if (last) setSaved(last)
      setLive(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  const onClickCapture = (event: ReactMouseEvent) => {
    if (!dragged.current) return
    dragged.current = false
    event.preventDefault()
    event.stopPropagation()
  }

  const current = live ?? saved
  return {
    ref,
    // Re-clamped every render so a resized window or the rulers appearing can't strand it
    position: current && clamp(current, size.current, rulers),
    dragging: live !== null,
    reset: () => setSaved(null),
    onPointerDown,
    onClickCapture,
  }
}

export function Toolbar({
  measure,
  rulers,
  grids,
  onToggle,
  gridConfig,
  onGridConfigChange,
  onGridConfigReset,
}: ToolbarProps) {
  const [panelOpen, setPanelOpen] = useState(false)
  const drag = useDraggable(rulers)
  const { position } = drag

  // Anchor the dock at the toolbar's corner nearest the viewport edge, so the
  // grid panel opens towards the middle of the screen and stays on it
  const dockStyle: CSSProperties = {}
  let panelBelow = false
  if (position) {
    const { width, height } = drag.ref.current?.getBoundingClientRect() ?? { width: 150, height: 38 }
    panelBelow = position.y + height / 2 < window.innerHeight / 2
    const alignRight = position.x + width / 2 > window.innerWidth / 2
    dockStyle.left = alignRight ? 'auto' : position.x
    dockStyle.right = alignRight ? window.innerWidth - position.x - width : 'auto'
    dockStyle.top = panelBelow ? position.y : 'auto'
    dockStyle.bottom = panelBelow ? 'auto' : window.innerHeight - position.y - height
    dockStyle.flexDirection = panelBelow ? 'column-reverse' : 'column'
    dockStyle.alignItems = alignRight ? 'flex-end' : 'flex-start'
    // The panel can only be as tall as the space on the side it opens towards
    const space = panelBelow ? window.innerHeight - position.y - height : position.y
    ;(dockStyle as Record<string, string | number>)['--rk-panel-max'] = `${Math.max(space - 8 - EDGE, 160)}px`
  }

  return (
    <div
      className="rk-dock"
      data-rulerkit=""
      data-rulers={rulers ? '' : undefined}
      data-moved={position ? '' : undefined}
      data-dragging={drag.dragging ? '' : undefined}
      style={dockStyle}
    >
      {panelOpen && <GridPanel grids={gridConfig} onChange={onGridConfigChange} onReset={onGridConfigReset} />}
      <div
        ref={drag.ref}
        className="rk-toolbar"
        role="toolbar"
        aria-label="rulerkit"
        onPointerDown={drag.onPointerDown}
        onClickCapture={drag.onClickCapture}
      >
        <span
          className="rk-grip"
          title="Drag to move · double-click to reset"
          aria-hidden="true"
          onDoubleClick={drag.reset}
        >
          {icons.grip}
        </span>
        <ToggleButton label="Measure (hold Option)" pressed={measure} onClick={() => onToggle('measure')}>
          {icons.measure}
        </ToggleButton>
        <ToggleButton label="Rulers (Shift R)" pressed={rulers} onClick={() => onToggle('rulers')}>
          {icons.rulers}
        </ToggleButton>
        <ToggleButton label="Layout grids (Shift G)" pressed={grids} onClick={() => onToggle('grids')}>
          {icons.grids}
        </ToggleButton>
        <ToggleButton label="Grid settings" pressed={panelOpen} onClick={() => setPanelOpen((open) => !open)}>
          {icons.settings}
        </ToggleButton>
      </div>
    </div>
  )
}
