import { useCallback, useEffect, useRef, useState } from 'react'
import { type GridConfig, Grids } from './grids/Grids'
import { forget, isTyping, usePathname, usePersistentState } from './lib/state'
import type { LintOptions } from './lint/analyze'
import { Lint } from './lint/Lint'
import type { Guide } from './measure/geometry'
import { Measure } from './measure/Measure'
import { Rulers } from './rulers/Rulers'
import { css } from './styles'
import { Toolbar } from './toolbar/Toolbar'

// UI from other design tools that shouldn't be measured
const DEFAULT_IGNORE = [
  '.dialkit-root',
  '[data-agentation-root]',
  '[data-agentation-portal]',
  '[data-feedback-toolbar]',
  '[data-annotation-popup]',
  '[data-annotation-marker]',
].join(', ')

const NO_GRIDS: GridConfig[] = []
const NO_GUIDES: Guide[] = []
const DEFAULT_LINT: LintOptions = { base: 8, allow: [4] }

export interface RulerKitProps {
  /** Colour of outlines, measurement lines, labels and ruler marks. Defaults to Figma's redline orange. */
  color?: string
  /** Colour of ruler guides. Defaults to Figma's guide blue. */
  guideColor?: string
  /** Layout grids to show with Shift + G. Edits made in the grid panel override these until reset. */
  grids?: GridConfig[]
  /** Extra selector for elements that can't be measured, e.g. your own dev tools */
  ignore?: string
  /**
   * Spacing lint (Shift + L): spacing should be a multiple of `base`, plus any
   * `allow` values. Defaults to { base: 8, allow: [4] }.
   */
  lint?: LintOptions
  /** Show the floating toolbar. Shortcuts work either way. Defaults to true. */
  toolbar?: boolean
  /**
   * Which tools are on for a first-time visitor, e.g. `{ rulers: true }`.
   * After that, the visitor's own toggles are remembered.
   */
  defaultTools?: Partial<RulerKitTools>
  /** Control which tools are on from your own UI. Pair with `onToolsChange`. */
  tools?: Partial<RulerKitTools>
  /** Called whenever a tool is switched on or off, from the toolbar, a shortcut or your UI */
  onToolsChange?: (tools: RulerKitTools) => void
  /** Number the rulers in page coordinates, which follow scrolling, instead of viewport ones. Defaults to false. */
  pageCoordinates?: boolean
  /** Render in production builds too. Defaults to false. */
  productionEnabled?: boolean
}

// Replaced by bundlers; declared here so the package doesn't need Node types
declare const process: { env?: { NODE_ENV?: string } }

const isProduction = () => typeof process !== 'undefined' && process.env?.NODE_ENV === 'production'

export interface RulerKitTools {
  /** Whether holding Option measures */
  measure: boolean
  rulers: boolean
  grids: boolean
  lint: boolean
}
type Tools = RulerKitTools

const DEFAULT_TOOLS: Tools = { measure: true, rulers: false, grids: false, lint: false }

type KitProps = Required<Pick<RulerKitProps, 'color' | 'guideColor' | 'grids' | 'ignore' | 'toolbar' | 'lint'>> &
  Pick<RulerKitProps, 'defaultTools' | 'tools' | 'onToolsChange' | 'pageCoordinates'>

function Kit({
  color,
  guideColor,
  grids: gridsProp,
  ignore,
  toolbar,
  lint,
  defaultTools,
  tools: toolsProp,
  onToolsChange,
  pageCoordinates,
}: KitProps) {
  // Controlled when `tools` is passed; otherwise saved in the browser, starting from defaultTools
  const [storedTools, setStoredTools] = usePersistentState<Partial<Tools>>('tools', { ...DEFAULT_TOOLS, ...defaultTools })
  const controlled = toolsProp !== undefined
  const tools: Tools = { ...DEFAULT_TOOLS, ...(controlled ? toolsProp : storedTools) }
  const [gridConfig, setGridConfig] = usePersistentState<GridConfig[] | null>('grids', null)
  const pathname = usePathname()
  const [guides, setGuides] = usePersistentState<Guide[]>(`guides:${pathname}`, NO_GUIDES)
  const [focus, setFocus] = useState<Element[]>([])
  const onFocusChange = useCallback((elements: Element[]) => setFocus(elements), [])
  const [lintIssues, setLintIssues] = useState(0)

  // Latest tools and callback for toggle, which keyboard handlers hold on to
  const latest = useRef({ tools, controlled, onToolsChange })
  latest.current = { tools, controlled, onToolsChange }
  const toggle = useCallback(
    (tool: keyof Tools) => {
      const { tools: current, controlled: isControlled, onToolsChange: notify } = latest.current
      const next = { ...current, [tool]: !current[tool] }
      if (!isControlled) setStoredTools(next)
      notify?.(next)
    },
    [setStoredTools],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target) || event.metaKey) return
      const shift = event.shiftKey && !event.ctrlKey && !event.altKey
      if (event.code === 'KeyR' && shift) {
        toggle('rulers')
      } else if (event.code === 'KeyL' && shift) {
        toggle('lint')
      } else if (event.code === 'KeyG' && (shift || (event.ctrlKey && !event.shiftKey && !event.altKey))) {
        // Shift + G pairs with Shift + R; Ctrl + G matches Figma
        event.preventDefault()
        toggle('grids')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggle])

  const activeGrids = gridConfig ?? gridsProp
  const ignoreSelector = ignore ? `${DEFAULT_IGNORE}, ${ignore}` : DEFAULT_IGNORE

  return (
    <div data-rulerkit="">
      <style>{css}</style>
      {tools.grids && <Grids grids={activeGrids} />}
      {tools.lint && <Lint options={lint} excluded={`[data-rulerkit], ${ignoreSelector}`} onIssues={setLintIssues} />}
      {tools.rulers && (
        <Rulers
          focus={focus}
          guides={guides}
          onGuidesChange={setGuides}
          color={color}
          guideColor={guideColor}
          pageCoordinates={pageCoordinates ?? false}
        />
      )}
      {tools.measure && (
        <Measure
          color={color}
          ignore={ignoreSelector}
          guides={tools.rulers ? guides : NO_GUIDES}
          onFocusChange={onFocusChange}
        />
      )}
      {toolbar && (
        <Toolbar
          measure={tools.measure}
          rulers={tools.rulers}
          grids={tools.grids}
          lint={tools.lint}
          lintIssues={lintIssues}
          onToggle={toggle}
          gridConfig={activeGrids}
          onGridConfigChange={setGridConfig}
          onGridConfigReset={() => {
            forget('grids')
            setGridConfig(null)
          }}
          ignore={ignoreSelector}
        />
      )}
    </div>
  )
}

/**
 * Layout inspection for your running app: Option-hover measuring, rulers with
 * guides (Shift + R), layout grids (Shift + G) and a spacing lint (Shift + L). Mount it once, anywhere in
 * your tree.
 */
export function RulerKit({
  color = '#f24822',
  guideColor = '#0d99ff',
  grids = NO_GRIDS,
  ignore = '',
  toolbar = true,
  lint = DEFAULT_LINT,
  defaultTools,
  tools,
  onToolsChange,
  pageCoordinates,
  productionEnabled = false,
}: RulerKitProps) {
  // Client only: renders nothing on the server or before hydration
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted || (isProduction() && !productionEnabled)) return null

  return (
    <Kit
      color={color}
      guideColor={guideColor}
      grids={grids}
      ignore={ignore}
      toolbar={toolbar}
      lint={lint}
      defaultTools={defaultTools}
      tools={tools}
      onToolsChange={onToolsChange}
      pageCoordinates={pageCoordinates}
    />
  )
}
