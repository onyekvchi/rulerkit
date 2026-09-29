import { type ReactNode, useState } from 'react'
import {
  DEFAULT_BASELINE_COLOR,
  DEFAULT_TRACK_COLOR,
  type GridAlignment,
  type GridConfig,
  type TrackGrid,
} from '../grids/Grids'

const icons = {
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
    <button type="button" className="lk-button" aria-label={label} title={label} aria-pressed={pressed} onClick={onClick}>
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
    <label className="lk-field">
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
    <div className="lk-color-row">
      <label className="lk-field">
        Color
        <span className="lk-color">
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
    <div className="lk-grid-card">
      <div className="lk-grid-card-header">
        <select
          aria-label="Grid type"
          value={grid.type}
          onChange={(event) => changeType(event.target.value as GridConfig['type'])}
        >
          <option value="columns">Columns</option>
          <option value="rows">Rows</option>
          <option value="baseline">Baseline</option>
        </select>
        <button type="button" className="lk-text-button lk-text-button-quiet" onClick={onRemove}>
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
          <label className="lk-field">
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

      <label className="lk-field" style={{ gridColumn: '1 / -1' }}>
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
      className="lk-panel"
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
      <div className="lk-panel-header">
        Layout grids
        <button type="button" className="lk-text-button" onClick={() => onChange([...grids, newGrid()])}>
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
      <div className="lk-panel-footer">
        <button type="button" className="lk-text-button lk-text-button-quiet" onClick={onReset}>
          Reset
        </button>
        <button type="button" className="lk-text-button" onClick={copy}>
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

  return (
    <div className="lk-dock" data-layoutkit="" data-rulers={rulers ? '' : undefined}>
      {panelOpen && <GridPanel grids={gridConfig} onChange={onGridConfigChange} onReset={onGridConfigReset} />}
      <div className="lk-toolbar" role="toolbar" aria-label="layoutkit">
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
