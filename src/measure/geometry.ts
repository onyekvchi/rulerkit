export interface Rect {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

export interface MeasureLine {
  x1: number
  y1: number
  x2: number
  y2: number
  /** Dashed extension to a target that doesn't line up with the measurement */
  guide?: boolean
}

export const contains = (outer: Rect, inner: Rect) =>
  inner.left >= outer.left &&
  inner.right <= outer.right &&
  inner.top >= outer.top &&
  inner.bottom <= outer.bottom

/** Distances from an inner box to each edge of the box that contains it */
export function insideLines(inner: Rect, outer: Rect): MeasureLine[] {
  const cx = inner.left + inner.width / 2
  const cy = inner.top + inner.height / 2
  return [
    { x1: outer.left, y1: cy, x2: inner.left, y2: cy },
    { x1: inner.right, y1: cy, x2: outer.right, y2: cy },
    { x1: cx, y1: outer.top, x2: cx, y2: inner.top },
    { x1: cx, y1: inner.bottom, x2: cx, y2: outer.bottom },
  ]
}

/**
 * Gaps between two boxes that don't contain each other. Each gap is drawn
 * through the middle of the overlap on the other axis, or from the source's
 * centre with a dashed guide to the target when they don't overlap.
 */
export function gapLines(a: Rect, b: Rect): MeasureLine[] {
  const lines: MeasureLine[] = []
  const overlapTop = Math.max(a.top, b.top)
  const overlapBottom = Math.min(a.bottom, b.bottom)
  const overlapLeft = Math.max(a.left, b.left)
  const overlapRight = Math.min(a.right, b.right)
  const y = overlapBottom > overlapTop ? (overlapTop + overlapBottom) / 2 : a.top + a.height / 2
  const x = overlapRight > overlapLeft ? (overlapLeft + overlapRight) / 2 : a.left + a.width / 2

  // `edge` is the target's edge the gap ends on, where the guide is drawn
  const horizontal = (from: number, to: number, edge: number) => {
    lines.push({ x1: from, y1: y, x2: to, y2: y })
    if (y < b.top || y > b.bottom) {
      lines.push({ x1: edge, y1: y, x2: edge, y2: y < b.top ? b.top : b.bottom, guide: true })
    }
  }
  const vertical = (from: number, to: number, edge: number) => {
    lines.push({ x1: x, y1: from, x2: x, y2: to })
    if (x < b.left || x > b.right) {
      lines.push({ x1: x, y1: edge, x2: x < b.left ? b.left : b.right, y2: edge, guide: true })
    }
  }

  if (b.left >= a.right) horizontal(a.right, b.left, b.left)
  else if (a.left >= b.right) horizontal(b.right, a.left, b.right)
  if (b.top >= a.bottom) vertical(a.bottom, b.top, b.top)
  else if (a.top >= b.bottom) vertical(b.bottom, a.top, b.bottom)
  return lines
}

/** Lines measuring `a` against `b`: inside distances if one contains the other, gaps otherwise */
export function measure(a: Rect, b: Rect): MeasureLine[] {
  if (contains(b, a)) return insideLines(a, b)
  if (contains(a, b)) return insideLines(b, a)
  return gapLines(a, b)
}

export const round = (n: number) => Math.round(n * 10) / 10
