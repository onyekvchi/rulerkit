import { useCallback, useEffect, useState } from 'react'
import { type GridConfig, Grids } from './grids/Grids'
import { forget, isTyping, usePathname, usePersistentState } from './lib/state'
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

export interface LayoutKitProps {
  /** Colour of outlines, measurement lines, labels and ruler marks. Defaults to Figma's redline orange. */
  color?: string
  /** Colour of ruler guides. Defaults to Figma's guide blue. */
  guideColor?: string
  /** Layout grids to show with Ctrl + G. Edits made in the grid panel override these until reset. */
  grids?: GridConfig[]
  /** Extra selector for elements that can't be measured, e.g. your own dev tools */
  ignore?: string
  /** Show the floating toolbar. Shortcuts work either way. Defaults to true. */
  toolbar?: boolean
  /** Render in production builds too. Defaults to false. */
  productionEnabled?: boolean
}

// Replaced by bundlers; declared here so the package doesn't need Node types
declare const process: { env?: { NODE_ENV?: string } }

const isProduction = () => typeof process !== 'undefined' && process.env?.NODE_ENV === 'production'

interface Tools {
  measure: boolean
  rulers: boolean
  grids: boolean
}

function Kit({
  color,
  guideColor,
  grids: gridsProp,
  ignore,
  toolbar,
}: Required<Omit<LayoutKitProps, 'productionEnabled'>>) {
  const [tools, setTools] = usePersistentState<Tools>('tools', { measure: true, rulers: false, grids: false })
  const [gridConfig, setGridConfig] = usePersistentState<GridConfig[] | null>('grids', null)
  const pathname = usePathname()
  const [guides, setGuides] = usePersistentState<Guide[]>(`guides:${pathname}`, NO_GUIDES)
  const [focus, setFocus] = useState<Element[]>([])
  const onFocusChange = useCallback((elements: Element[]) => setFocus(elements), [])

  const toggle = useCallback(
    (tool: keyof Tools) => setTools((current) => ({ ...current, [tool]: !current[tool] })),
    [setTools],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target) || event.metaKey) return
      if (event.code === 'KeyR' && event.shiftKey && !event.ctrlKey && !event.altKey) {
        toggle('rulers')
      } else if (event.code === 'KeyG' && event.ctrlKey && !event.shiftKey && !event.altKey) {
        event.preventDefault()
        toggle('grids')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggle])

  const activeGrids = gridConfig ?? gridsProp

  return (
    <div data-layoutkit="">
      <style>{css}</style>
      {tools.grids && <Grids grids={activeGrids} />}
      {tools.rulers && (
        <Rulers
          focus={focus}
          guides={guides}
          onGuidesChange={setGuides}
          color={color}
          guideColor={guideColor}
        />
      )}
      {tools.measure && (
        <Measure
          color={color}
          ignore={ignore ? `${DEFAULT_IGNORE}, ${ignore}` : DEFAULT_IGNORE}
          guides={tools.rulers ? guides : NO_GUIDES}
          onFocusChange={onFocusChange}
        />
      )}
      {toolbar && (
        <Toolbar
          {...tools}
          onToggle={toggle}
          gridConfig={activeGrids}
          onGridConfigChange={setGridConfig}
          onGridConfigReset={() => {
            forget('grids')
            setGridConfig(null)
          }}
        />
      )}
    </div>
  )
}

/**
 * Layout inspection for your running app: Option-hover measuring, rulers with
 * guides (Shift + R) and layout grids (Ctrl + G). Mount it once, anywhere in
 * your tree.
 */
export function LayoutKit({
  color = '#f24822',
  guideColor = '#0d99ff',
  grids = NO_GRIDS,
  ignore = '',
  toolbar = true,
  productionEnabled = false,
}: LayoutKitProps) {
  // Client only: renders nothing on the server or before hydration
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted || (isProduction() && !productionEnabled)) return null

  return <Kit color={color} guideColor={guideColor} grids={grids} ignore={ignore} toolbar={toolbar} />
}
