import { useEffect, useState } from 'react'
import { analyze, type LintOptions, type LintResult } from './analyze'

// Re-scan periodically as well as on scroll and resize, so layout changes
// (animations, content loading, edits in DialKit) show up
const RESCAN_MS = 500

const EMPTY: LintResult = { boxes: [], spacings: [], issues: 0 }

/**
 * Spacing lint overlay: outlines each item, fills the gaps and padding
 * between them, and marks any value that isn't on the spacing scale.
 */
export function Lint({
  options,
  excluded,
  onIssues,
}: {
  options: LintOptions
  excluded: string
  onIssues: (count: number) => void
}) {
  const [result, setResult] = useState<LintResult>(EMPTY)
  const { base = 8, allow = [4] } = options
  // Compared by value so a new array from the parent doesn't restart scanning
  const allowKey = allow.join(',')

  useEffect(() => {
    let frame = 0
    const scan = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = analyze({ base, allow: allowKey ? allowKey.split(',').map(Number) : [] }, excluded)
        setResult(next)
        onIssues(next.issues)
      })
    }
    scan()
    const id = setInterval(scan, RESCAN_MS)
    window.addEventListener('scroll', scan, true)
    window.addEventListener('resize', scan)
    return () => {
      cancelAnimationFrame(frame)
      clearInterval(id)
      window.removeEventListener('scroll', scan, true)
      window.removeEventListener('resize', scan)
      onIssues(0)
    }
  }, [base, allowKey, excluded, onIssues])

  return (
    <div className="rk-lint" aria-hidden="true">
      {result.boxes.map((box, index) => (
        <span key={`b${index}`} className="rk-lint-box" style={box} />
      ))}
      {result.spacings.map((spacing, index) => (
        <span
          key={`s${index}`}
          className="rk-lint-band"
          data-off={spacing.ok ? undefined : ''}
          data-axis={spacing.axis}
          style={spacing.band}
        >
          {/* Only broken spacing gets a number; on-scale bands are just shaded */}
          {!spacing.ok && (
            <span className="rk-lint-label">
              {spacing.value}
              {spacing.suggestion !== undefined && <span> → {spacing.suggestion}</span>}
            </span>
          )}
        </span>
      ))}
    </div>
  )
}
