// Styles for layoutkit's own UI, injected by <LayoutKit /> so there's no CSS
// file to import. Every class is prefixed with lk- to stay out of the app's way.
export const RULER_SIZE = 20

export const css = `
[data-layoutkit] {
  --lk-bg: rgb(22 22 24 / 0.94);
  --lk-border: rgb(255 255 255 / 0.08);
  --lk-text: rgb(255 255 255 / 0.9);
  --lk-muted: rgb(255 255 255 / 0.5);
  --lk-field: rgb(255 255 255 / 0.06);
  --lk-accent: #0d99ff;
  font: 500 11px/1.4 ui-sans-serif, system-ui, sans-serif;
  font-variant-numeric: tabular-nums;
  color: var(--lk-text);
  -webkit-font-smoothing: antialiased;
}
[data-layoutkit] *, [data-layoutkit] *::before, [data-layoutkit] *::after { box-sizing: border-box; }

.lk-ruler { position: fixed; z-index: 2147483645; background: var(--lk-bg); cursor: default; touch-action: none; }
.lk-ruler-x { top: 0; left: ${RULER_SIZE}px; right: 0; height: ${RULER_SIZE}px; border-bottom: 1px solid var(--lk-border); cursor: row-resize; }
.lk-ruler-y { top: ${RULER_SIZE}px; left: 0; bottom: 0; width: ${RULER_SIZE}px; border-right: 1px solid var(--lk-border); cursor: col-resize; }
.lk-ruler-corner { position: fixed; z-index: 2147483645; top: 0; left: 0; width: ${RULER_SIZE}px; height: ${RULER_SIZE}px; background: var(--lk-bg); border-right: 1px solid var(--lk-border); border-bottom: 1px solid var(--lk-border); }
.lk-ruler canvas { position: absolute; inset: 0; pointer-events: none; }
.lk-ruler-band { position: absolute; pointer-events: none; }
.lk-ruler-mark { position: absolute; padding: 1px 3px; border-radius: 3px; color: white; font-size: 9px; line-height: 12px; white-space: nowrap; pointer-events: none; }

.lk-guide { position: fixed; z-index: 2147483644; touch-action: none; }
.lk-guide-x { top: 0; bottom: 0; width: 7px; margin-left: -3px; cursor: col-resize; }
.lk-guide-y { left: 0; right: 0; height: 7px; margin-top: -3px; cursor: row-resize; }
.lk-guide::before { content: ''; position: absolute; background: var(--lk-guide); }
.lk-guide-x::before { top: 0; bottom: 0; left: 3px; width: 1px; }
.lk-guide-y::before { left: 0; right: 0; top: 3px; height: 1px; }
.lk-guide-label { position: absolute; display: none; padding: 1px 4px; border-radius: 3px; background: var(--lk-guide); color: white; font-size: 10px; white-space: nowrap; }
.lk-guide-x .lk-guide-label { top: ${RULER_SIZE + 6}px; left: 8px; }
.lk-guide-y .lk-guide-label { left: ${RULER_SIZE + 6}px; top: 8px; }
.lk-guide:hover .lk-guide-label, .lk-guide[data-dragging] .lk-guide-label { display: block; }

.lk-dock { position: fixed; z-index: 2147483647; left: 16px; bottom: 16px; transition: left 150ms ease-out; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
.lk-dock[data-rulers] { left: ${RULER_SIZE + 12}px; }
.lk-toolbar { display: flex; gap: 2px; padding: 4px; border-radius: 12px; background: var(--lk-bg); border: 1px solid var(--lk-border); box-shadow: 0 8px 24px rgb(0 0 0 / 0.3); backdrop-filter: blur(12px); }
.lk-button { display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 8px; background: transparent; color: var(--lk-muted); cursor: pointer; }
.lk-button:hover { color: var(--lk-text); background: var(--lk-field); }
.lk-button[aria-pressed='true'] { color: var(--lk-text); background: rgb(13 153 255 / 0.22); }
.lk-button:focus-visible, .lk-panel :focus-visible { outline: 2px solid var(--lk-accent); outline-offset: 1px; }
.lk-button svg { width: 16px; height: 16px; }

.lk-panel { width: 288px; max-height: min(480px, calc(100vh - 96px)); overflow: auto; padding: 12px; border-radius: 12px; background: var(--lk-bg); border: 1px solid var(--lk-border); box-shadow: 0 8px 24px rgb(0 0 0 / 0.3); backdrop-filter: blur(12px); }
.lk-panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; font-size: 12px; }
.lk-grid-card { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; padding: 8px; margin-bottom: 8px; border-radius: 8px; border: 1px solid var(--lk-border); }
.lk-grid-card-header { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.lk-field { display: flex; flex-direction: column; gap: 3px; color: var(--lk-muted); }
.lk-field input, .lk-field select, .lk-grid-card-header select { width: 100%; height: 24px; padding: 0 6px; border: 1px solid transparent; border-radius: 6px; background: var(--lk-field); color: var(--lk-text); font: inherit; }
.lk-field input:focus, .lk-field select:focus { border-color: var(--lk-accent); outline: none; }
.lk-color-row { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
.lk-color { display: flex; align-items: center; gap: 6px; height: 24px; padding: 0 6px 0 3px; border-radius: 6px; background: var(--lk-field); color: var(--lk-text); }
.lk-color input[type='color'] { width: 18px; height: 18px; padding: 0; border: 0; border-radius: 4px; background: none; cursor: pointer; }
.lk-color input[type='color']::-webkit-color-swatch-wrapper { padding: 0; }
.lk-color input[type='color']::-webkit-color-swatch { border: 0; border-radius: 4px; box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.15); }
.lk-color input[type='color']::-moz-color-swatch { border: 0; border-radius: 4px; }
.lk-text-button { height: 24px; padding: 0 8px; border: 0; border-radius: 6px; background: var(--lk-field); color: var(--lk-text); font: inherit; cursor: pointer; }
.lk-text-button:hover { background: rgb(255 255 255 / 0.1); }
.lk-text-button-quiet { background: transparent; color: var(--lk-muted); }
.lk-panel-footer { display: flex; gap: 6px; margin-top: 4px; }
.lk-panel-footer .lk-text-button:first-child { margin-right: auto; }
`
