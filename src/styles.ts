// Styles for rulerkit's own UI, injected by <RulerKit /> so there's no CSS
// file to import. Every class is prefixed with rk- to stay out of the app's way.
export const RULER_SIZE = 20

export const css = `
[data-rulerkit] {
  --rk-bg: rgb(22 22 24 / 0.94);
  --rk-border: rgb(255 255 255 / 0.08);
  --rk-text: rgb(255 255 255 / 0.9);
  --rk-muted: rgb(255 255 255 / 0.5);
  --rk-field: rgb(255 255 255 / 0.06);
  --rk-tick: rgb(255 255 255 / 0.2);
  --rk-tick-text: rgb(255 255 255 / 0.42);
  --rk-hatch: rgb(255 255 255 / 0.07);
  --rk-accent: #0d99ff;
  font: 500 11px/1.4 ui-sans-serif, system-ui, sans-serif;
  font-variant-numeric: tabular-nums;
  color: var(--rk-text);
  -webkit-font-smoothing: antialiased;
}
[data-rulerkit] *, [data-rulerkit] *::before, [data-rulerkit] *::after { box-sizing: border-box; }

.rk-ruler { position: fixed; z-index: 2147483645; background: var(--rk-bg); cursor: default; touch-action: none; }
.rk-ruler-x { top: 0; left: ${RULER_SIZE}px; right: 0; height: ${RULER_SIZE}px; border-bottom: 1px solid var(--rk-border); cursor: row-resize; }
.rk-ruler-y { top: ${RULER_SIZE}px; left: 0; bottom: 0; width: ${RULER_SIZE}px; border-right: 1px solid var(--rk-border); cursor: col-resize; }
.rk-ruler-corner { position: fixed; z-index: 2147483645; top: 0; left: 0; width: ${RULER_SIZE}px; height: ${RULER_SIZE}px; background: var(--rk-bg); border-right: 1px solid var(--rk-border); border-bottom: 1px solid var(--rk-border); }
.rk-ruler canvas { position: absolute; inset: 0; pointer-events: none; }
.rk-ruler-x canvas { mask-image: linear-gradient(to right, transparent, #000 32px, #000 calc(100% - 32px), transparent); }
.rk-ruler-y canvas { mask-image: linear-gradient(to bottom, transparent, #000 32px, #000 calc(100% - 32px), transparent); }
.rk-hatch { position: fixed; z-index: 2147483644; top: ${RULER_SIZE}px; bottom: 0; pointer-events: none; background: repeating-linear-gradient(135deg, var(--rk-hatch) 0 1px, transparent 1px 7px); }
.rk-ruler-band { position: absolute; pointer-events: none; }
.rk-ruler-mark { position: absolute; padding: 1px 3px; border-radius: 3px; color: white; font-size: 9px; line-height: 12px; white-space: nowrap; pointer-events: none; }

.rk-guide { position: fixed; z-index: 2147483644; touch-action: none; }
.rk-guide-x { top: 0; bottom: 0; width: 7px; margin-left: -3px; cursor: col-resize; }
.rk-guide-y { left: 0; right: 0; height: 7px; margin-top: -3px; cursor: row-resize; }
.rk-guide::before { content: ''; position: absolute; background: var(--rk-guide); }
.rk-guide-x::before { top: 0; bottom: 0; left: 3px; width: 1px; }
.rk-guide-y::before { left: 0; right: 0; top: 3px; height: 1px; }
.rk-guide-label { position: absolute; display: none; padding: 1px 4px; border-radius: 3px; background: var(--rk-guide); color: white; font-size: 10px; white-space: nowrap; }
.rk-guide-x .rk-guide-label { top: ${RULER_SIZE + 6}px; left: 8px; }
.rk-guide-y .rk-guide-label { left: ${RULER_SIZE + 6}px; top: 8px; }
.rk-guide:hover .rk-guide-label, .rk-guide[data-dragging] .rk-guide-label { display: block; }

.rk-dock { position: fixed; z-index: 2147483647; left: 16px; bottom: 16px; transition: left 150ms ease-out; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
.rk-dock[data-rulers]:not([data-moved]) { left: ${RULER_SIZE + 12}px; }
.rk-dock { user-select: none; -webkit-user-select: none; }
.rk-dock[data-moved] { transition: none; }
.rk-dock[data-dragging], .rk-dock[data-dragging] * { cursor: grabbing !important; }
.rk-toolbar { display: flex; align-items: center; padding: 4px; border-radius: 999px; cursor: grab; touch-action: none; background: var(--rk-bg); border: 1px solid var(--rk-border); box-shadow: 0 8px 24px rgb(0 0 0 / 0.3), 0 1px 2px rgb(0 0 0 / 0.2); backdrop-filter: blur(12px); }
.rk-toolbar[data-side='right'] { flex-direction: row-reverse; }
.rk-fab { position: relative; display: grid; place-items: center; flex-shrink: 0; width: 36px; height: 36px; padding: 0; border: 0; border-radius: 999px; background: transparent; color: var(--rk-text); cursor: inherit; transition: background-color 120ms; }
.rk-fab:hover { background: var(--rk-field); }
.rk-fab svg { width: 18px; height: 18px; }
.rk-button { position: relative; }
.rk-count { position: absolute; top: -2px; right: -3px; min-width: 15px; height: 15px; padding: 0 4px; border-radius: 999px; background: #e5484d; color: white; font-size: 9.5px; line-height: 15px; font-weight: 600; text-align: center; box-shadow: 0 0 0 2px rgb(22 22 24); pointer-events: none; }
.rk-fab-count { top: 0; right: 0; }
/* Spacing lint overlay */
.rk-lint { position: fixed; inset: 0; z-index: 2147483642; pointer-events: none; }
/* Lint: green for on-scale spacing, red for off-scale */
.rk-lint-box { position: fixed; outline: 1px dashed rgb(48 164 108 / 0.4); outline-offset: -0.5px; }
.rk-lint-band { position: fixed; display: grid; place-items: center; background: rgb(48 164 108 / 0.16); }
.rk-lint-band[data-off] { background: repeating-linear-gradient(45deg, rgb(229 72 77 / 0.22) 0 1px, rgb(229 72 77 / 0.06) 1px 6px); outline: 1px solid rgb(229 72 77 / 0.4); outline-offset: -0.5px; z-index: 1; }
.rk-lint-label { padding: 1px 4px; border-radius: 3px; background: rgb(48 164 108 / 0.9); color: white; font-size: 9.5px; line-height: 13px; font-weight: 600; white-space: nowrap; }
.rk-lint-band[data-off] .rk-lint-label { background: #e5484d; font-size: 10.5px; box-shadow: 0 1px 3px rgb(0 0 0 / 0.3); }
.rk-lint-label span { opacity: 0.85; font-weight: 500; }
.rk-fab-dot { position: absolute; top: 6px; right: 6px; width: 6px; height: 6px; border-radius: 50%; background: var(--rk-accent); box-shadow: 0 0 0 2px rgb(22 22 24); }
.rk-tools { display: grid; grid-template-columns: 0fr; opacity: 0; transition: grid-template-columns 260ms cubic-bezier(0.23, 1, 0.32, 1), opacity 160ms ease-out; }
.rk-toolbar[data-expanded] .rk-tools { grid-template-columns: 1fr; opacity: 1; }
.rk-tools-inner { display: flex; align-items: center; gap: 2px; min-width: 0; overflow: hidden; }
.rk-divider { flex-shrink: 0; width: 1px; height: 18px; margin: 0 6px; background: var(--rk-border); order: -1; }
.rk-toolbar[data-side='right'] .rk-divider { order: 99; }
.rk-toolbar .rk-button { width: 32px; height: 32px; border-radius: 999px; flex-shrink: 0; }
/* The tools row clips its overflow (for the expand animation), so focus rings sit inside the buttons */
.rk-toolbar .rk-button:focus-visible, .rk-fab:focus-visible { outline: 2px solid var(--rk-accent); outline-offset: -2px; }
@media (prefers-reduced-motion: reduce) { .rk-tools, .rk-dock { transition: none; } }
.rk-button { display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 8px; background: transparent; color: var(--rk-muted); cursor: pointer; }
.rk-button:hover { color: var(--rk-text); background: var(--rk-field); }
.rk-button[aria-pressed='true'] { color: var(--rk-text); background: rgb(13 153 255 / 0.22); }
.rk-button:focus-visible, .rk-panel :focus-visible { outline: 2px solid var(--rk-accent); outline-offset: 1px; }
.rk-button svg { width: 16px; height: 16px; }

.rk-panel { width: 288px; max-height: min(480px, var(--rk-panel-max, calc(100vh - 96px))); overflow: auto; padding: 12px; border-radius: 12px; background: var(--rk-bg); border: 1px solid var(--rk-border); box-shadow: 0 8px 24px rgb(0 0 0 / 0.3); backdrop-filter: blur(12px); }
.rk-panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; font-size: 12px; }
.rk-grid-card { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; padding: 8px; margin-bottom: 8px; border-radius: 8px; border: 1px solid var(--rk-border); }
.rk-grid-card-header { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.rk-grid-card-header select { flex: 1; }
.rk-grid-card[data-hidden] > :not(.rk-grid-card-header) { opacity: 0.4; }
.rk-icon-button { display: grid; place-items: center; flex-shrink: 0; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 6px; background: transparent; color: var(--rk-muted); cursor: pointer; }
.rk-icon-button:hover { color: var(--rk-text); background: var(--rk-field); }
.rk-icon-button[aria-pressed='true'] { color: var(--rk-text); }
.rk-icon-button svg { width: 14px; height: 14px; }
.rk-icon-button-field { background: var(--rk-field); }
.rk-icon-button[aria-pressed='true'].rk-icon-button-field { background: rgb(13 153 255 / 0.22); color: var(--rk-text); }
.rk-target-row { display: flex; gap: 4px; }
.rk-target-row input { flex: 1; min-width: 0; }
.rk-hint { color: var(--rk-accent); }
.rk-picker { position: fixed; inset: 0; z-index: 2147483646; pointer-events: none; }
.rk-picker-box { position: fixed; outline: 1.5px solid var(--rk-accent); background: rgb(13 153 255 / 0.08); }
.rk-picker-label { position: fixed; display: flex; gap: 6px; padding: 3px 6px; border-radius: 4px; background: var(--rk-accent); color: white; font: 500 11px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace; white-space: nowrap; }
.rk-picker-label span { opacity: 0.75; }
.rk-field { display: flex; flex-direction: column; gap: 3px; color: var(--rk-muted); }
.rk-field input, .rk-field select, .rk-grid-card-header select { width: 100%; height: 24px; padding: 0 6px; border: 1px solid transparent; border-radius: 6px; background: var(--rk-field); color: var(--rk-text); font: inherit; }
.rk-field input:focus, .rk-field select:focus { border-color: var(--rk-accent); outline: none; }
.rk-color-row { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
.rk-color { display: flex; align-items: center; gap: 6px; height: 24px; padding: 0 6px 0 3px; border-radius: 6px; background: var(--rk-field); color: var(--rk-text); }
.rk-color input[type='color'] { width: 18px; height: 18px; padding: 0; border: 0; border-radius: 4px; background: none; cursor: pointer; }
.rk-color input[type='color']::-webkit-color-swatch-wrapper { padding: 0; }
.rk-color input[type='color']::-webkit-color-swatch { border: 0; border-radius: 4px; box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.15); }
.rk-color input[type='color']::-moz-color-swatch { border: 0; border-radius: 4px; }
.rk-text-button { height: 24px; padding: 0 8px; border: 0; border-radius: 6px; background: var(--rk-field); color: var(--rk-text); font: inherit; cursor: pointer; }
.rk-text-button:hover { background: rgb(255 255 255 / 0.1); }
.rk-text-button-quiet { background: transparent; color: var(--rk-muted); }
.rk-panel-footer { display: flex; gap: 6px; margin-top: 4px; }
.rk-panel-footer .rk-text-button:first-child { margin-right: auto; }
`
