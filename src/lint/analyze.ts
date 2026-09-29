// Spacing lint: finds the gaps between neighbouring elements and the padding
// inside containers, and checks each against a spacing scale.

export interface LintOptions {
  /** Spacing should be a multiple of this. Defaults to 8. */
  base?: number
  /** Extra values that are fine even though they aren't multiples. Defaults to [4]. */
  allow?: number[]
}

export interface Box {
  left: number
  top: number
  width: number
  height: number
}

export interface Spacing {
  /** The band the spacing covers, in viewport px */
  band: Box
  /** Distance in px */
  value: number
  axis: 'x' | 'y'
  kind: 'gap' | 'padding'
  ok: boolean
  /** The nearest on-scale value, when `ok` is false */
  suggestion?: number
}

export interface LintResult {
  /** Boxes outlined as taking part in the lint */
  boxes: Box[]
  spacings: Spacing[]
  issues: number
}

// Skip anything below this: sub-pixel slivers and overlaps aren't spacing
const MIN_SPACING = 0.5
// Keep huge pages responsive
const MAX_ELEMENTS = 2000

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT', 'TEMPLATE', 'BR', 'WBR', 'HEAD', 'svg', 'SVG'])

export function checkValue(value: number, { base = 8, allow = [4] }: LintOptions) {
  const rounded = Math.round(value)
  // Fractional spacing (e.g. 15.5) is always worth a look
  const whole = Math.abs(value - rounded) < 0.25
  const ok = whole && (rounded % base === 0 || allow.includes(rounded))
  if (ok) return { ok: true }

  // Nearest value on the scale, preferring the larger on a tie
  const candidates = [Math.floor(value / base) * base, Math.ceil(value / base) * base, ...allow]
  const suggestion = candidates.reduce((best, candidate) =>
    Math.abs(candidate - value) < Math.abs(best - value) ||
    (Math.abs(candidate - value) === Math.abs(best - value) && candidate > best)
      ? candidate
      : best,
  )
  return { ok: false, suggestion }
}

function isVisible(element: Element, rect: DOMRect) {
  if (rect.width < 1 || rect.height < 1) return false
  const style = getComputedStyle(element)
  return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0
}

const intersectsViewport = (rect: DOMRect) =>
  rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth

/** Children that take part in layout: visible, in normal flow, not inline text runs */
function layoutChildren(element: Element, excluded: string) {
  const children: { element: Element; rect: DOMRect }[] = []
  for (const child of element.children) {
    if (SKIP_TAGS.has(child.tagName) || child.matches(excluded)) continue
    const style = getComputedStyle(child)
    if (style.position === 'absolute' || style.position === 'fixed') continue
    if (style.display === 'inline' || style.display === 'contents' || style.display === 'none') continue
    const rect = child.getBoundingClientRect()
    if (!isVisible(child, rect)) continue
    children.push({ element: child, rect })
  }
  return children
}

const box = (rect: DOMRect | Box): Box => ({ left: rect.left, top: rect.top, width: rect.width, height: rect.height })

/**
 * Scans the page for spacing. For every container: the padding between its
 * edges and its content, and the gaps between consecutive children that sit
 * beside or below each other.
 */
export function analyze(options: LintOptions, excluded: string): LintResult {
  const boxes: Box[] = []
  const spacings: Spacing[] = []
  const seen = new Set<Element>()

  const add = (band: Box, value: number, axis: 'x' | 'y', kind: Spacing['kind']) => {
    if (value < MIN_SPACING) return
    const result = checkValue(value, options)
    spacings.push({ band, value: Math.round(value * 10) / 10, axis, kind, ...result })
  }

  const containers = document.body.querySelectorAll('*')
  let count = 0
  for (const container of containers) {
    if (++count > MAX_ELEMENTS) break
    if (SKIP_TAGS.has(container.tagName) || container.closest(`svg, ${excluded}`)) continue
    const rect = container.getBoundingClientRect()
    if (!intersectsViewport(rect) || !isVisible(container, rect)) continue

    const children = layoutChildren(container, excluded)

    for (const { element, rect: childRect } of children) {
      if (!seen.has(element)) {
        seen.add(element)
        boxes.push(box(childRect))
      }
    }

    // Padding: the container's own CSS padding. Measuring edge-to-content
    // instead would pick up auto margins and centring, which aren't spacing
    // anyone set.
    const style = getComputedStyle(container)
    const px = (value: string) => parseFloat(value) || 0
    const border = { left: px(style.borderLeftWidth), top: px(style.borderTopWidth), right: px(style.borderRightWidth), bottom: px(style.borderBottomWidth) }
    const padding = { left: px(style.paddingLeft), top: px(style.paddingTop), right: px(style.paddingRight), bottom: px(style.paddingBottom) }
    const inner = {
      left: rect.left + border.left,
      top: rect.top + border.top,
      width: rect.width - border.left - border.right,
      height: rect.height - border.top - border.bottom,
    }
    // Leaf elements (e.g. a button with a text label) only count if they're padded boxes
    if (children.length === 0) {
      const padded = padding.left || padding.top || padding.right || padding.bottom
      if (!padded || style.display === 'inline') continue
      if (!seen.has(container)) {
        seen.add(container)
        boxes.push(box(rect))
      }
    }
    add({ left: inner.left, top: inner.top, width: padding.left, height: inner.height }, padding.left, 'x', 'padding')
    add({ left: inner.left + inner.width - padding.right, top: inner.top, width: padding.right, height: inner.height }, padding.right, 'x', 'padding')
    add({ left: inner.left, top: inner.top, width: inner.width, height: padding.top }, padding.top, 'y', 'padding')
    add({ left: inner.left, top: inner.top + inner.height - padding.bottom, width: inner.width, height: padding.bottom }, padding.bottom, 'y', 'padding')

    // space-between/around/evenly distributes leftover space: not a set value
    if (children.length < 2 || /space-/.test(style.justifyContent) || /space-/.test(style.alignContent)) continue

    // Gaps between consecutive children, stacked or side by side
    for (let i = 1; i < children.length; i++) {
      const a = children[i - 1].rect
      const b = children[i].rect
      if (b.top >= a.bottom - MIN_SPACING) {
        const left = Math.max(a.left, b.left)
        const width = Math.max(Math.min(a.right, b.right) - left, 8)
        add({ left, top: a.bottom, width, height: b.top - a.bottom }, b.top - a.bottom, 'y', 'gap')
      } else if (b.left >= a.right - MIN_SPACING) {
        const top = Math.max(a.top, b.top)
        const height = Math.max(Math.min(a.bottom, b.bottom) - top, 8)
        add({ left: a.right, top, width: b.left - a.right, height }, b.left - a.right, 'x', 'gap')
      }
    }
  }

  return { boxes, spacings, issues: spacings.filter((spacing) => !spacing.ok).length }
}
