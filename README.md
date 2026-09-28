# layoutkit

Figma-style layout inspection for your running app. Hold Option to see how far things are from each other, so you can tune spacing against the real page instead of guessing.

Measuring is available now. Rulers and layout grids are next.

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

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `color` | `string` | `'#f24822'` | Colour of outlines, lines and labels |
| `ignore` | `string` | — | Extra CSS selector for elements that can't be measured |
| `productionEnabled` | `boolean` | `false` | Render in production builds too |

## Development

```bash
npm install
npm run dev        # rebuild on change
npm run build
npm run typecheck
```

To try it in another project before publishing, install it from the folder (`npm install -D ../layoutkit`). If the app then reports an invalid hook call, dedupe React in the app's bundler (in Vite: `resolve: { dedupe: ['react', 'react-dom'] }`).

## Roadmap

- Rulers along the viewport edges, with draggable guides
- Layout grid overlays (columns, rows and baseline) with configurable count, gutter and margin

## License

MIT
