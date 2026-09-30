// Styles for inspectkit's own UI, injected by <InspectKit /> so there's no CSS
// file to import. Every class is prefixed with ik- to stay out of the app's way.
export const RULER_SIZE = 20

export const css = `
[data-inspectkit] {
  --ik-bg: rgb(22 22 24 / 0.94);
  --ik-border: rgb(255 255 255 / 0.08);
  --ik-text: rgb(255 255 255 / 0.9);
  --ik-muted: rgb(255 255 255 / 0.5);
  --ik-field: rgb(255 255 255 / 0.06);
  --ik-tick: rgb(255 255 255 / 0.2);
  --ik-tick-text: rgb(255 255 255 / 0.42);
  --ik-accent: #0d99ff;
  font: 500 11px/1.4 ui-sans-serif, system-ui, sans-serif;
  font-variant-numeric: tabular-nums;
  color: var(--ik-text);
  -webkit-font-smoothing: antialiased;
}
[data-inspectkit] *, [data-inspectkit] *::before, [data-inspectkit] *::after { box-sizing: border-box; }

.ik-ruler { position: fixed; z-index: 2147483645; background: var(--ik-bg); cursor: default; touch-action: none; }
.ik-ruler-x { top: 0; left: ${RULER_SIZE}px; right: 0; height: ${RULER_SIZE}px; border-bottom: 1px solid var(--ik-border); cursor: row-resize; }
.ik-ruler-y { top: ${RULER_SIZE}px; left: 0; bottom: 0; width: ${RULER_SIZE}px; border-right: 1px solid var(--ik-border); cursor: col-resize; }
.ik-ruler-corner { position: fixed; z-index: 2147483645; top: 0; left: 0; width: ${RULER_SIZE}px; height: ${RULER_SIZE}px; background: var(--ik-bg); border-right: 1px solid var(--ik-border); border-bottom: 1px solid var(--ik-border); }
.ik-ruler canvas { position: absolute; inset: 0; pointer-events: none; }
.ik-ruler-x canvas { mask-image: linear-gradient(to right, transparent, #000 32px, #000 calc(100% - 32px), transparent); }
.ik-ruler-y canvas { mask-image: linear-gradient(to bottom, transparent, #000 32px, #000 calc(100% - 32px), transparent); }
.ik-ruler-band { position: absolute; pointer-events: none; }
.ik-ruler-mark { position: absolute; padding: 1px 3px; border-radius: 3px; color: white; font-size: 9px; line-height: 12px; white-space: nowrap; pointer-events: none; }

.ik-guide { position: fixed; z-index: 2147483644; touch-action: none; }
.ik-guide-x { top: 0; bottom: 0; width: 7px; margin-left: -3px; cursor: col-resize; }
.ik-guide-y { left: 0; right: 0; height: 7px; margin-top: -3px; cursor: row-resize; }
.ik-guide::before { content: ''; position: absolute; background: var(--ik-guide); }
.ik-guide-x::before { top: 0; bottom: 0; left: 3px; width: 1px; }
.ik-guide-y::before { left: 0; right: 0; top: 3px; height: 1px; }
.ik-guide-label { position: absolute; display: none; padding: 1px 4px; border-radius: 3px; background: var(--ik-guide); color: white; font-size: 10px; white-space: nowrap; }
.ik-guide-x .ik-guide-label { top: ${RULER_SIZE + 6}px; left: 8px; }
.ik-guide-y .ik-guide-label { left: ${RULER_SIZE + 6}px; top: 8px; }
.ik-guide:hover .ik-guide-label, .ik-guide[data-dragging] .ik-guide-label { display: block; }

.ik-dock { position: fixed; z-index: 2147483647; left: 16px; bottom: 16px; transition: left 150ms ease-out; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
.ik-dock[data-rulers]:not([data-moved]) { left: ${RULER_SIZE + 12}px; }
.ik-dock { user-select: none; -webkit-user-select: none; }
.ik-dock[data-moved] { transition: none; }
.ik-dock[data-dragging], .ik-dock[data-dragging] * { cursor: grabbing !important; }
.ik-toolbar { display: flex; align-items: center; padding: 4px; border-radius: 999px; cursor: grab; touch-action: none; background: var(--ik-bg); border: 1px solid var(--ik-border); box-shadow: 0 8px 24px rgb(0 0 0 / 0.3), 0 1px 2px rgb(0 0 0 / 0.2); backdrop-filter: blur(12px); }
.ik-toolbar[data-side='right'] { flex-direction: row-reverse; }
.ik-fab { position: relative; display: grid; place-items: center; flex-shrink: 0; width: 36px; height: 36px; padding: 0; border: 0; border-radius: 999px; background: transparent; color: var(--ik-text); cursor: inherit; transition: background-color 120ms; }
.ik-fab:hover { background: var(--ik-field); }
.ik-fab svg { width: 18px; height: 18px; }
.ik-button { position: relative; }
.ik-count { position: absolute; top: -2px; right: -3px; min-width: 15px; height: 15px; padding: 0 4px; border-radius: 999px; background: #e5484d; color: white; font-size: 9.5px; line-height: 15px; font-weight: 600; text-align: center; box-shadow: 0 0 0 2px rgb(22 22 24); pointer-events: none; }
.ik-fab-count { top: 0; right: 0; }
/* Spacing lint overlay */
.ik-lint { position: fixed; inset: 0; z-index: 2147483642; pointer-events: none; }
/* Lint: green for on-scale spacing, red for off-scale */
.ik-lint-box { position: fixed; outline: 1px dashed rgb(48 164 108 / 0.4); outline-offset: -0.5px; }
.ik-lint-band { position: fixed; display: grid; place-items: center; background: rgb(48 164 108 / 0.16); }
.ik-lint-band[data-off] { background: repeating-linear-gradient(45deg, rgb(229 72 77 / 0.22) 0 1px, rgb(229 72 77 / 0.06) 1px 6px); outline: 1px solid rgb(229 72 77 / 0.4); outline-offset: -0.5px; z-index: 1; }
.ik-lint-label { padding: 1px 4px; border-radius: 3px; background: rgb(48 164 108 / 0.9); color: white; font-size: 9.5px; line-height: 13px; font-weight: 600; white-space: nowrap; }
.ik-lint-band[data-off] .ik-lint-label { background: #e5484d; font-size: 10.5px; box-shadow: 0 1px 3px rgb(0 0 0 / 0.3); }
.ik-lint-label span { opacity: 0.85; font-weight: 500; }
.ik-fab-dot { position: absolute; top: 6px; right: 6px; width: 6px; height: 6px; border-radius: 50%; background: var(--ik-accent); box-shadow: 0 0 0 2px rgb(22 22 24); }
.ik-tools { display: grid; grid-template-columns: 0fr; opacity: 0; transition: grid-template-columns 260ms cubic-bezier(0.23, 1, 0.32, 1), opacity 160ms ease-out; }
.ik-toolbar[data-expanded] .ik-tools { grid-template-columns: 1fr; opacity: 1; }
.ik-tools-inner { display: flex; align-items: center; gap: 2px; min-width: 0; overflow: hidden; }
.ik-divider { flex-shrink: 0; width: 1px; height: 18px; margin: 0 6px; background: var(--ik-border); order: -1; }
.ik-toolbar[data-side='right'] .ik-divider { order: 99; }
.ik-toolbar .ik-button { width: 32px; height: 32px; border-radius: 999px; flex-shrink: 0; }
/* The tools row clips its overflow (for the expand animation), so focus rings sit inside the buttons */
.ik-toolbar .ik-button:focus-visible, .ik-fab:focus-visible { outline: 2px solid var(--ik-accent); outline-offset: -2px; }
@media (prefers-reduced-motion: reduce) { .ik-tools, .ik-dock { transition: none; } }
.ik-button { display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 8px; background: transparent; color: var(--ik-muted); cursor: pointer; }
.ik-button:hover { color: var(--ik-text); background: var(--ik-field); }
.ik-button[aria-pressed='true'] { color: var(--ik-text); background: rgb(13 153 255 / 0.22); }
.ik-button:focus-visible, .ik-panel :focus-visible { outline: 2px solid var(--ik-accent); outline-offset: 1px; }
.ik-button svg { width: 16px; height: 16px; }

.ik-panel { width: 288px; max-height: min(480px, var(--ik-panel-max, calc(100vh - 96px))); overflow: auto; padding: 12px; border-radius: 12px; background: var(--ik-bg); border: 1px solid var(--ik-border); box-shadow: 0 8px 24px rgb(0 0 0 / 0.3); backdrop-filter: blur(12px); }
.ik-panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; font-size: 12px; }
.ik-grid-card { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; padding: 8px; margin-bottom: 8px; border-radius: 8px; border: 1px solid var(--ik-border); }
.ik-grid-card-header { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.ik-grid-card-header select { flex: 1; }
.ik-grid-card[data-hidden] > :not(.ik-grid-card-header) { opacity: 0.4; }
.ik-icon-button { display: grid; place-items: center; flex-shrink: 0; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 6px; background: transparent; color: var(--ik-muted); cursor: pointer; }
.ik-icon-button:hover { color: var(--ik-text); background: var(--ik-field); }
.ik-icon-button[aria-pressed='true'] { color: var(--ik-text); }
.ik-icon-button svg { width: 14px; height: 14px; }
.ik-icon-button-field { background: var(--ik-field); }
.ik-icon-button[aria-pressed='true'].ik-icon-button-field { background: rgb(13 153 255 / 0.22); color: var(--ik-text); }
.ik-target-row { display: flex; gap: 4px; }
.ik-target-row input { flex: 1; min-width: 0; }
.ik-hint { color: var(--ik-accent); }
.ik-picker { position: fixed; inset: 0; z-index: 2147483646; pointer-events: none; }
.ik-picker-box { position: fixed; outline: 1.5px solid var(--ik-accent); background: rgb(13 153 255 / 0.08); }
.ik-picker-label { position: fixed; display: flex; gap: 6px; padding: 3px 6px; border-radius: 4px; background: var(--ik-accent); color: white; font: 500 11px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace; white-space: nowrap; }
.ik-picker-label span { opacity: 0.75; }
.ik-field { display: flex; flex-direction: column; gap: 3px; color: var(--ik-muted); }
.ik-field input, .ik-field select, .ik-grid-card-header select { width: 100%; height: 24px; padding: 0 6px; border: 1px solid transparent; border-radius: 6px; background: var(--ik-field); color: var(--ik-text); font: inherit; }
.ik-field input:focus, .ik-field select:focus { border-color: var(--ik-accent); outline: none; }
.ik-color-row { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
.ik-color { display: flex; align-items: center; gap: 6px; height: 24px; padding: 0 6px 0 3px; border-radius: 6px; background: var(--ik-field); color: var(--ik-text); }
.ik-color input[type='color'] { width: 18px; height: 18px; padding: 0; border: 0; border-radius: 4px; background: none; cursor: pointer; }
.ik-color input[type='color']::-webkit-color-swatch-wrapper { padding: 0; }
.ik-color input[type='color']::-webkit-color-swatch { border: 0; border-radius: 4px; box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.15); }
.ik-color input[type='color']::-moz-color-swatch { border: 0; border-radius: 4px; }
.ik-text-button { height: 24px; padding: 0 8px; border: 0; border-radius: 6px; background: var(--ik-field); color: var(--ik-text); font: inherit; cursor: pointer; }
.ik-text-button:hover { background: rgb(255 255 255 / 0.1); }
.ik-text-button-quiet { background: transparent; color: var(--ik-muted); }
.ik-panel-footer { display: flex; gap: 6px; margin-top: 4px; }
.ik-panel-footer .ik-text-button:first-child { margin-right: auto; }
`
