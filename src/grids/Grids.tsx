import { useLayoutChange } from '../lib/state'

export type GridAlignment = 'stretch' | 'start' | 'center' | 'end'

interface GridBase {
  /** Fill (columns, rows) or line (baseline) colour */
  color?: string
  /** CSS selector of an element to lay the grid over; defaults to the viewport */
  target?: string
  /** Keep the grid's settings but don't draw it */
  hidden?: boolean
}

export interface TrackGrid extends GridBase {
  type: 'columns' | 'rows'
  count: number
  gutter?: number
  /** Space before the first and after the last track (stretch, start and end alignment) */
  margin?: number
  /** 'stretch' fills the space between margins; the others use a fixed track `size` */
  alignment?: GridAlignment
  /** Track width (columns) or height (rows) when not stretched */
  size?: number
}

export interface BaselineGrid extends GridBase {
  type: 'baseline'
  /** Distance between lines */
  size: number
  /** Distance from the top to the first line */
  offset?: number
}

export type GridConfig = TrackGrid | BaselineGrid

export const DEFAULT_TRACK_COLOR = 'rgb(255 0 0 / 0.1)'
export const DEFAULT_BASELINE_COLOR = 'rgb(255 0 0 / 0.12)'

function tracks(length: number, grid: TrackGrid) {
  const { count, gutter = 0, margin = 0, alignment = 'stretch' } = grid
  if (count < 1) return []

  const size =
    alignment === 'stretch' ? (length - 2 * margin - gutter * (count - 1)) / count : (grid.size ?? 80)
  const total = count * size + gutter * (count - 1)
  const start =
    alignment === 'center' ? (length - total) / 2 : alignment === 'end' ? length - margin - total : margin

  return Array.from({ length: count }, (_, index) => ({ start: start + index * (size + gutter), size }))
}

function bounds(target?: string) {
  const element = target ? document.querySelector(target) : null
  return element
    ? element.getBoundingClientRect()
    : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }
}

/** Figma-style layout grids: columns, rows and baseline, over the viewport or an element */
export function Grids({ grids }: { grids: GridConfig[] }) {
  useLayoutChange()

  return grids.map((grid, index) => {
    if (grid.hidden) return null
    const box = bounds(grid.target)
    const frame = {
      position: 'fixed' as const,
      zIndex: 2147483643,
      left: box.left,
      top: box.top,
      width: box.width,
      height: box.height,
      overflow: 'hidden',
      pointerEvents: 'none' as const,
    }

    if (grid.type === 'baseline') {
      const size = Math.max(grid.size, 2)
      return (
        <div
          key={index}
          style={{
            ...frame,
            backgroundImage: `repeating-linear-gradient(to bottom, ${grid.color ?? DEFAULT_BASELINE_COLOR} 0 1px, transparent 1px ${size}px)`,
            backgroundPositionY: grid.offset ?? 0,
          }}
        />
      )
    }

    const color = grid.color ?? DEFAULT_TRACK_COLOR
    const columns = grid.type === 'columns'
    return (
      <div key={index} style={frame}>
        {tracks(columns ? box.width : box.height, grid).map(({ start, size }, track) => (
          <div
            key={track}
            style={{
              position: 'absolute',
              background: color,
              ...(columns
                ? { left: start, width: size, top: 0, bottom: 0 }
                : { top: start, height: size, left: 0, right: 0 }),
            }}
          />
        ))}
      </div>
    )
  })
}
