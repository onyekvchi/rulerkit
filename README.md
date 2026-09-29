# layoutkit

Figma-style layout inspection for your running app: measure distances between elements, pull guides out of rulers, and lay columns, rows and baseline grids over the page. Tune spacing against the real page instead of guessing.

## Install

```bash
npm install -D layoutkit
```

## Usage

Mount `<LayoutKit />` once, anywhere in your React tree:

```jsx
import { LayoutKit } from 'layoutkit'

export default function App() {
  return (
    <>
      <YourApp />
      <LayoutKit />
    </>
  )
}
```

It renders nothing on the server and nothing in production builds unless you pass `productionEnabled`.

A small toolbar in the bottom-left corner toggles each tool; the shortcuts below work too. Which tools are on is remembered between reloads.

It sits alongside [DialKit](https://github.com/joshpuckett/dialkit) and [Agentation](https://agentation.com): their panels and toolbars are ignored when measuring.

## Measuring

Hold **Option** (Alt) the whole time:

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

**Ctrl + G** toggles layout grids. Define them with the `grids` prop; several can be stacked, like Figma's layout grids:

```jsx
<LayoutKit
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

Every grid also takes `color` and `target`, a CSS selector of an element to lay the grid over instead of the viewport (e.g. `'main'`).

The **grid settings** button in the toolbar opens a panel to edit grids live, including each grid's colour and opacity. Edits are saved in the browser and override the prop until you press **Reset**. **Copy props** copies the current grids as a `grids={...}` prop to paste back into your code.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `color` | `string` | `'#f24822'` | Colour of measurement outlines, lines, labels and ruler marks |
| `guideColor` | `string` | `'#0d99ff'` | Colour of guides |
| `grids` | `GridConfig[]` | `[]` | Layout grids shown with Ctrl + G |
| `ignore` | `string` | — | Extra CSS selector for elements that can't be measured |
| `toolbar` | `boolean` | `true` | Show the floating toolbar |
| `productionEnabled` | `boolean` | `false` | Render in production builds too |

## Shortcuts

| Keys | Action |
| --- | --- |
| Hold **Option** | Measure |
| **Shift + R** | Toggle rulers |
| **Ctrl + G** | Toggle layout grids |
| **Esc** | Clear the measurement selection |

Shortcuts are ignored while you're typing in a field. In the grid panel, press **Esc** or **Enter** to leave a field and use them again.

## Development

```bash
npm install
npm run dev        # rebuild on change
npm run build
npm run typecheck
```

To try it in another project before publishing, install it from the folder (`npm install -D ../layoutkit`). If the app then reports an invalid hook call, dedupe React in the app's bundler (in Vite: `resolve: { dedupe: ['react', 'react-dom'] }`).

## License

MIT
