# rulerkit

Figma-style layout inspection for your running app: measure distances between elements, pull guides out of rulers, and lay columns, rows and baseline grids over the page. Tune spacing against the real page instead of guessing.

## Install

```bash
npm install -D rulerkit
```

## Usage

Mount `<RulerKit />` once, anywhere in your React tree:

```jsx
import { RulerKit } from 'rulerkit'

export default function App() {
  return (
    <>
      <YourApp />
      <RulerKit />
    </>
  )
}
```

It renders nothing on the server and nothing in production builds unless you pass `productionEnabled`.

A round button in the bottom-left corner opens the toolbar, which switches measuring, rulers and grids on and off and opens the grid settings; the shortcuts below work whether it's open or not. A blue dot on the closed button means rulers or grids are on. Drag it anywhere, open or closed; it expands towards the middle of the screen. Its position, whether it's open, and which tools are on are remembered between reloads.

It sits alongside [DialKit](https://github.com/joshpuckett/dialkit) and [Agentation](https://agentation.com): their panels and toolbars are ignored when measuring.

## Measuring

With **Measure** switched on in the toolbar (the default), hold **Option** (Alt) the whole time:

| Action | Result |
| --- | --- |
| Hover an element | Its size, plus its distance to each edge of its parent (outlined dashed) |
| **↑** / **↓** | Step the hovered element out to its parent / back in |
| **Click** | Select the element, then hover anything else to measure the gap between them |
| Hover an ancestor of the selection | Inside distances to all four edges |
| **Shift-click** a second element | Pin it: the first stays selected and the measurement stays on screen after you release Option |
| Shift-click the pinned element | Unpin it |

**Esc** clears the selection. Option-clicking a link selects it instead of following it.

Measurements track scrolling and resizing, so you can leave a pinned measurement up while you tweak values (for example with DialKit) and watch it update.

Values are rounded to one decimal place, so sub-pixel layout shows up (e.g. `15.5`). Boxes are the elements' border boxes, not the tight bounds of their text.

## Rulers and guides

**Shift + R** toggles rulers along the top and left of the viewport. Numbers are viewport pixels.

- The element you're hovering or have selected is marked on both rulers, with its start and end positions.
- **Drag from a ruler** to add a guide: the top ruler makes horizontal guides, the left ruler vertical ones.
- **Drag a guide** to move it; drop it back on its ruler to remove it. Hover a guide to see its position.
- With an element selected, **Option-hover a guide** to measure the distance to it.

Guides are saved per page (by pathname) and stay fixed to the viewport, so they're for checking alignment rather than marking a spot in a long scrolling page.

## Layout grids

**Shift + G** (or Figma's **Ctrl + G**) toggles layout grids. Define them with the `grids` prop; several can be stacked, like Figma's layout grids:

```jsx
<RulerKit
  grids={[
    { type: 'columns', count: 12, gutter: 24, margin: 64 },
    { type: 'baseline', size: 8 },
  ]}
/>
```

| Type | Options |
| --- | --- |
| `columns` / `rows` | `count`, `gutter`, `margin`, `alignment` (`'stretch'`, `'start'`, `'center'`, `'end'`), `size` (track width or height when not stretched) |
| `baseline` | `size` (line spacing), `offset` (first line) |

Every grid also takes `color`, `target` (a CSS selector of an element to lay the grid over instead of the viewport, e.g. `'main'`) and `hidden` (keep the grid's settings but don't draw it).

The **grid settings** button in the toolbar opens a panel to edit grids live, including each grid's colour and opacity. The eye button on each grid hides or shows it without removing it. The eyedropper next to **Target** lets you click an element on the page to lay the grid over it; rulerkit writes a stable selector for you (an id, a test attribute or a unique tag where possible, never utility classes). Edits are saved in the browser and override the prop until you press **Reset**. **Copy props** copies the current grids as a `grids={...}` prop to paste back into your code.

## Spacing lint

**Shift + L** (or the lint button in the toolbar) shows how the page is spaced. Every item gets a thin outline, and the gaps between neighbouring items and each container's padding are filled in with their values.

Spacing on your scale is shaded green, without numbers. Anything off it gets a striped red band with its value and a suggestion, like `14 → 16`, so only the problems have text to read. The toolbar button (and the closed round button) shows how many there are.

By default spacing should be a multiple of 8, with 4 also allowed. Set your own scale with the `lint` prop:

```jsx
<RulerKit lint={{ base: 4 }} />
<RulerKit lint={{ base: 8, allow: [4, 12] }} />
```

It measures element boxes as the browser lays them out, so each flag points at a gap, margin or padding set in your CSS. Padding comes from each container's CSS padding, and gaps created by `justify-content: space-between` (or `around`/`evenly`) are skipped, since nobody set those by hand. It covers the visible part of the page and re-scans as you scroll, resize or change styles.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `color` | `string` | `'#f24822'` | Colour of measurement outlines, lines, labels and ruler marks |
| `guideColor` | `string` | `'#0d99ff'` | Colour of guides |
| `grids` | `GridConfig[]` | `[]` | Layout grids shown with Shift + G |
| `lint` | `{ base?: number; allow?: number[] }` | `{ base: 8, allow: [4] }` | Spacing scale for the lint |
| `ignore` | `string` | — | Extra CSS selector for elements that can't be measured |
| `toolbar` | `boolean` | `true` | Show the floating toolbar |
| `defaultTools` | `Partial<RulerKitTools>` | — | Tools on for a first-time visitor, e.g. `{ rulers: true }`; their own toggles are remembered after that |
| `tools` | `Partial<RulerKitTools>` | — | Control which tools are on from your own UI |
| `onToolsChange` | `(tools) => void` | — | Called when a tool is switched on or off, from the toolbar, a shortcut or your UI |
| `pageCoordinates` | `boolean` | `false` | Number the rulers in page coordinates, which follow scrolling, instead of viewport ones |
| `productionEnabled` | `boolean` | `false` | Render in production builds too |

## Driving it from your own UI

`tools` and `onToolsChange` let a page switch tools on and off and show their state, for example a docs page with its own buttons:

```jsx
const [tools, setTools] = useState({ measure: true, rulers: true, grids: false, lint: false })

<button onClick={() => setTools({ ...tools, grids: !tools.grids })}>Grids</button>
<RulerKit tools={tools} onToolsChange={setTools} />
```

The round button carries a `data-rulerkit-button` attribute, so you can point at it (say, with an onboarding hint).

## Shortcuts

| Keys | Action |
| --- | --- |
| Hold **Option** | Measure (when switched on in the toolbar) |
| **Shift + R** | Toggle rulers |
| **Shift + G** or **Ctrl + G** | Toggle layout grids |
| **Shift + L** | Toggle the spacing lint |
| **Esc** | Clear the measurement selection |

Shortcuts are ignored while you're typing in a field. In the grid panel, press **Esc** or **Enter** to leave a field and use them again.

## Development

```bash
npm install
npm run dev        # rebuild on change
npm run build
npm run typecheck
```

To try it in another project before publishing, install it from the folder (`npm install -D ../rulerkit`). If the app then reports an invalid hook call, dedupe React in the app's bundler (in Vite: `resolve: { dedupe: ['react', 'react-dom'] }`).

## License

MIT
