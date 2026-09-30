import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useId,
  useRef,
  useState,
} from 'react'
import { useLayoutChange, usePersistentState } from '../lib/state'
import { RULER_SIZE } from '../styles'
import { TargetPicker } from './TargetPicker'
import {
  DEFAULT_BASELINE_COLOR,
  DEFAULT_TRACK_COLOR,
  type GridAlignment,
  type GridConfig,
  type TrackGrid,
} from '../grids/Grids'

const icons = {
  lint: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="2.5" width="4" height="4" rx="0.75" />
      <rect x="9.5" y="9.5" width="4" height="4" rx="0.75" />
      <path d="M8 4.5h5.5M11.5 3v3M4.5 8v5.5M3 11.5h3" />
    </svg>
  ),
  eyedropper: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.2 2.7a1.9 1.9 0 012.7 2.7l-1.4 1.4.7.7-1.1 1.1-3.5-3.5 1.1-1.1.7.7z" />
      <path d="M8.1 5.5L3.2 10.4a1.3 1.3 0 00-.4.9v1.9h1.9a1.3 1.3 0 00.9-.4l4.9-4.9" />
    </svg>
  ),
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
  logo: (
    <svg viewBox="0 0 16 16" fill="none" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 2.5h11v3h-8v8h-3z" stroke="currentColor" />
      <path d="M5 2.5v1.3M7.5 2.5v1.3M10 2.5v1.3M2.5 8h1.3M2.5 10.5h1.3" stroke="currentColor" />
      <path d="M8.5 11.5h5M8.5 10v3M13.5 10v3" stroke="#f24822" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M4 4l8 8M12 4l-8 8" />
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
    <button type="button" className="ik-button" aria-label={label} title={label} aria-pressed={pressed} onClick={onClick}>
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
    <label className="ik-field">
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
    <div className="ik-color-row">
      <label className="ik-field">
        Color
        <span className="ik-color">
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
  picking,
  onTogglePick,
}: {
  grid: GridConfig
  onChange: (grid: GridConfig) => void
  onRemove: () => void
  /** Whether the eyedropper is picking this grid's target */
  picking: boolean
  onTogglePick: () => void
}) {
  const targetId = useId()
  const set = (patch: Partial<GridConfig>) => onChange({ ...grid, ...patch } as GridConfig)
  const changeType = (type: GridConfig['type']) =>
    onChange(
      type === 'baseline'
        ? { type, size: 8, color: grid.color, target: grid.target }
        : { ...newGrid(), type, color: grid.color, target: grid.target },
    )

  return (
    <div className="ik-grid-card" data-hidden={grid.hidden ? '' : undefined}>
      <div className="ik-grid-card-header">
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
          className="ik-icon-button"
          aria-label={grid.hidden ? 'Show grid' : 'Hide grid'}
          title={grid.hidden ? 'Show grid' : 'Hide grid'}
          aria-pressed={!grid.hidden}
          onClick={() => set({ hidden: !grid.hidden || undefined })}
        >
          {grid.hidden ? icons.eyeOff : icons.eye}
        </button>
        <button type="button" className="ik-text-button ik-text-button-quiet" onClick={onRemove}>
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
          <label className="ik-field">
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

      <div className="ik-field" style={{ gridColumn: '1 / -1' }}>
        <label htmlFor={targetId}>Target (CSS selector, empty for viewport)</label>
        <div className="ik-target-row">
          <input
            id={targetId}
            type="text"
            placeholder="viewport"
            value={grid.target ?? ''}
            onChange={(event) => set({ target: event.target.value || undefined })}
          />
          <button
            type="button"
            className="ik-icon-button ik-icon-button-field"
            aria-label={picking ? 'Cancel picking' : 'Pick target element'}
            title={picking ? 'Cancel (Esc)' : 'Pick an element on the page'}
            aria-pressed={picking}
            onClick={onTogglePick}
          >
            {icons.eyedropper}
          </button>
        </div>
        {picking && <span className="ik-hint">Click an element to use it · Esc to cancel</span>}
      </div>
    </div>
  )
}

function GridPanel({
  grids,
  onChange,
  onReset,
  ignore,
}: {
  grids: GridConfig[]
  onChange: (grids: GridConfig[]) => void
  onReset: () => void
  ignore: string
}) {
  const [copied, setCopied] = useState(false)
  // Index of the grid whose target is being picked with the eyedropper
  const [picking, setPicking] = useState<number | null>(null)

  const updateGrid = (index: number, next: GridConfig) =>
    onChange(grids.map((current, i) => (i === index ? next : current)))

  const onPick = useCallback(
    (selector: string) => {
      if (picking === null) return
      onChange(grids.map((grid, i) => (i === picking ? { ...grid, target: selector } : grid)))
      setPicking(null)
    },
    [picking, grids, onChange],
  )
  const onCancelPick = useCallback(() => setPicking(null), [])

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
    <>
    {/* Rendered beside the panel: its backdrop-filter would trap fixed positioning */}
    {picking !== null && <TargetPicker ignore={ignore} onPick={onPick} onCancel={onCancelPick} />}
    <div
      className="ik-panel"
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
      <div className="ik-panel-header">
        Layout grids
        <button type="button" className="ik-text-button" onClick={() => onChange([...grids, newGrid()])}>
          Add
        </button>
      </div>
      {grids.map((grid, index) => (
        <GridCard
          key={index}
          grid={grid}
          onChange={(next) => updateGrid(index, next)}
          onRemove={() => {
            setPicking(null)
            onChange(grids.filter((_, i) => i !== index))
          }}
          picking={picking === index}
          onTogglePick={() => setPicking((current) => (current === index ? null : index))}
        />
      ))}
      <div className="ik-panel-footer">
        <button type="button" className="ik-text-button ik-text-button-quiet" onClick={onReset}>
          Reset
        </button>
        <button type="button" className="ik-text-button" onClick={copy}>
          {copied ? 'Copied' : 'Copy props'}
        </button>
      </div>
    </div>
    </>
  )
}

export interface ToolbarProps {
  measure: boolean
  rulers: boolean
  grids: boolean
  lint: boolean
  /** Off-scale spacings found by the lint, shown as a count */
  lintIssues: number
  onToggle: (tool: 'measure' | 'rulers' | 'grids' | 'lint') => void
  gridConfig: GridConfig[]
  onGridConfigChange: (grids: GridConfig[]) => void
  onGridConfigReset: () => void
  /** Selector for other tools' UI, which the target eyedropper skips */
  ignore: string
}

interface Point {
  x: number
  y: number
}

// Past this distance (px) a press on the toolbar becomes a drag, not a click
const DRAG_THRESHOLD = 4
// Space kept between the toolbar and the viewport edges (or the rulers)
const EDGE = 8

// The round button's size (36px button + 4px padding + 1px border each side).
// Positions are the circle's top-left: it stays put when the toolbar expands
// or collapses, and the pill always grows from it towards the middle.
const CIRCLE = 46

/** Keeps the circle inside the viewport, clear of the rulers when they're showing */
function clamp(point: Point, rulers: boolean): Point {
  const min = rulers ? RULER_SIZE + EDGE : EDGE
  return {
    x: Math.round(Math.min(Math.max(point.x, min), window.innerWidth - CIRCLE - EDGE)),
    y: Math.round(Math.min(Math.max(point.y, min), window.innerHeight - CIRCLE - EDGE)),
  }
}

/**
 * Lets the toolbar be dragged anywhere, from any part of it. Returns the
 * circle position to render (null keeps the default corner), whether a drag
 * is in progress, and handlers for the toolbar element.
 */
function useDraggable(rulers: boolean) {
  const [saved, setSaved] = usePersistentState<Point | null>('position', null)
  const [live, setLive] = useState<Point | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  // Set when a press turned into a drag, so the click that ends it is ignored
  const dragged = useRef(false)
  useLayoutChange()

  const onPointerDown = (event: ReactPointerEvent) => {
    const toolbar = ref.current
    if (event.button !== 0 || !toolbar) return
    const rect = toolbar.getBoundingClientRect()
    // The circle is at the pill's right end when it opens leftwards
    const circle = { x: toolbar.dataset.side === 'right' ? rect.right - CIRCLE : rect.left, y: rect.top }
    const start = { x: event.clientX, y: event.clientY }
    let last: Point | null = null
    dragged.current = false

    const onMove = (move: PointerEvent) => {
      const dx = move.clientX - start.x
      const dy = move.clientY - start.y
      if (!dragged.current && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      dragged.current = true
      last = clamp({ x: circle.x + dx, y: circle.y + dy }, rulers)
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
    position: current && clamp(current, rulers),
    dragging: live !== null,
    onPointerDown,
    onClickCapture,
  }
}

export function Toolbar({
  measure,
  rulers,
  grids,
  lint,
  lintIssues,
  onToggle,
  gridConfig,
  onGridConfigChange,
  onGridConfigReset,
  ignore,
}: ToolbarProps) {
  const [panelOpen, setPanelOpen] = useState(false)
  // Collapsed to a round button by default, like DialKit and Agentation
  const [expanded, setExpanded] = usePersistentState('expanded', false)
  const drag = useDraggable(rulers)
  const { position } = drag

  // Pin the dock to the circle on the side nearest the viewport edge, so the
  // toolbar expands and the grid panel opens towards the middle of the screen
  const dockStyle: CSSProperties = {}
  let panelBelow = false
  let alignRight = false
  if (position) {
    panelBelow = position.y + CIRCLE / 2 < window.innerHeight / 2
    alignRight = position.x + CIRCLE / 2 > window.innerWidth / 2
    dockStyle.left = alignRight ? 'auto' : position.x
    dockStyle.right = alignRight ? window.innerWidth - position.x - CIRCLE : 'auto'
    dockStyle.top = panelBelow ? position.y : 'auto'
    dockStyle.bottom = panelBelow ? 'auto' : window.innerHeight - position.y - CIRCLE
    dockStyle.flexDirection = panelBelow ? 'column-reverse' : 'column'
    dockStyle.alignItems = alignRight ? 'flex-end' : 'flex-start'
    // The panel can only be as tall as the space on the side it opens towards
    const space = panelBelow ? window.innerHeight - position.y - CIRCLE : position.y
    ;(dockStyle as Record<string, string | number>)['--ik-panel-max'] = `${Math.max(space - 8 - EDGE, 160)}px`
  }

  const toggleExpanded = () => {
    if (expanded) setPanelOpen(false)
    setExpanded(!expanded)
  }

  return (
    <div
      className="ik-dock"
      data-inspectkit=""
      data-rulers={rulers ? '' : undefined}
      data-moved={position ? '' : undefined}
      data-dragging={drag.dragging ? '' : undefined}
      style={dockStyle}
    >
      {expanded && panelOpen && (
        <GridPanel grids={gridConfig} onChange={onGridConfigChange} onReset={onGridConfigReset} ignore={ignore} />
      )}
      <div
        ref={drag.ref}
        className="ik-toolbar"
        role="toolbar"
        aria-label="inspectkit"
        data-expanded={expanded ? '' : undefined}
        data-side={alignRight ? 'right' : 'left'}
        onPointerDown={drag.onPointerDown}
        onClickCapture={drag.onClickCapture}
      >
        <button
          type="button"
          className="ik-fab"
          // Stable hook for pages that point at the button (e.g. an onboarding hint)
          data-inspectkit-button=""
          aria-expanded={expanded}
          aria-label={expanded ? 'Close inspectkit' : 'Open inspectkit'}
          title={expanded ? 'Close' : 'inspectkit · drag to move'}
          onClick={toggleExpanded}
        >
          {expanded ? icons.close : icons.logo}
          {!expanded && lint && lintIssues > 0 ? (
            <span className="ik-count ik-fab-count" aria-hidden="true">
              {lintIssues}
            </span>
          ) : (
            !expanded && (rulers || grids || lint) && <span className="ik-fab-dot" aria-hidden="true" />
          )}
        </button>
        {/* Width animates from 0 via grid-template-columns; inert while collapsed */}
        <div className="ik-tools" inert={!expanded}>
          <div className="ik-tools-inner">
            <span className="ik-divider" aria-hidden="true" />
            <ToggleButton label="Measure (hold Option)" pressed={measure} onClick={() => onToggle('measure')}>
              {icons.measure}
            </ToggleButton>
            <ToggleButton label="Rulers (Shift R)" pressed={rulers} onClick={() => onToggle('rulers')}>
              {icons.rulers}
            </ToggleButton>
            <ToggleButton label="Layout grids (Shift G)" pressed={grids} onClick={() => onToggle('grids')}>
              {icons.grids}
            </ToggleButton>
            <ToggleButton
              label={
                lint && lintIssues > 0
                  ? `Spacing lint (Shift L), ${lintIssues} ${lintIssues === 1 ? 'issue' : 'issues'}`
                  : 'Spacing lint (Shift L)'
              }
              pressed={lint}
              onClick={() => onToggle('lint')}
            >
              {icons.lint}
              {lint && lintIssues > 0 && (
                <span className="ik-count" aria-hidden="true">
                  {lintIssues > 99 ? '99+' : lintIssues}
                </span>
              )}
            </ToggleButton>
            <ToggleButton label="Grid settings" pressed={panelOpen} onClick={() => setPanelOpen((open) => !open)}>
              {icons.settings}
            </ToggleButton>
          </div>
        </div>
      </div>
    </div>
  )
}
