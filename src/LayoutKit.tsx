import { useEffect, useState } from 'react'
import { Measure } from './measure/Measure'

// UI from other design tools that shouldn't be measured
const DEFAULT_IGNORE = [
  '.dialkit-root',
  '[data-agentation-root]',
  '[data-agentation-portal]',
  '[data-feedback-toolbar]',
  '[data-annotation-popup]',
  '[data-annotation-marker]',
].join(', ')

export interface LayoutKitProps {
  /** Colour of outlines, measurement lines and labels. Defaults to Figma's redline orange. */
  color?: string
  /** Extra selector for elements that can't be measured, e.g. your own dev tools */
  ignore?: string
  /** Render in production builds too. Defaults to false. */
  productionEnabled?: boolean
}

// Replaced by bundlers; declared here so the package doesn't need Node types
declare const process: { env?: { NODE_ENV?: string } }

const isProduction = () => typeof process !== 'undefined' && process.env?.NODE_ENV === 'production'

/**
 * Layout inspection overlay for your running app. Mount it once, anywhere in
 * your tree. Currently: Option-hover to measure (see README for all controls).
 */
export function LayoutKit({ color = '#f24822', ignore, productionEnabled = false }: LayoutKitProps) {
  // Client only: renders nothing on the server or before hydration
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted || (isProduction() && !productionEnabled)) return null

  return <Measure color={color} ignore={ignore ? `${DEFAULT_IGNORE}, ${ignore}` : DEFAULT_IGNORE} />
}
