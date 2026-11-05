# dsh.canvas@1 — Canvas document format

Canvas documents live in the session workspace:

```
<workspace>/canvas/<name>.canvas.json      document (pure JSON)
<workspace>/canvas/assets/<hash>.<ext>     image assets (png/jpeg/webp/gif)
<workspace>/canvas/fonts/<hash>.<woff2…>   uploaded font files
<workspace>/canvas/exports/                PNG/SVG exports written by the editor
<workspace>/canvas/FORMAT.md               this file (generated on first open)
```

`<name>` must match `^[a-z0-9][a-z0-9-_]{0,63}$`. The default document is `main`.
Coordinates are in logical pixels, `x`/`y` are relative to the parent, paint
order is array order (later siblings are on top). Unknown fields are preserved.

## Document

```json
{
  "format": "dsh.canvas",
  "version": 1,
  "id": "doc_xxx",
  "title": "主画布",
  "pages": [
    { "id": "page-1", "name": "Page 1", "background": null, "children": [] }
  ],
  "components": [],
  "variantSets": [],
  "styles": [],
  "fonts": [],
  "comments": [],
  "meta": { "createdAt": "ISO", "updatedAt": "ISO" }
}
```

Limits: 2000 nodes, 200 components, 500 styles, 1000 comments, 50 fonts,
depth 32, document 8 MiB, one image 20 MiB, one font 10 MiB.

`pages` is a Figma-style page list for forward compatibility. The v1 editor
shows a single page on a neutral workspace; page management and the page
background control are not exposed. `background` remains an optional,
export-time page color; when it is null the workspace and exports use the
Figma default (neutral).

## Nodes

Common fields: `id` (unique, `^[A-Za-z0-9_-]{1,64}$`), `type`, `name`, `x`,
`y`, `width`, `height`, `rotation` (degrees), `opacity` (0–1), `visible`,
`locked`, optional `layoutSizing` `{ "h": "fixed|hug|fill", "v": … }`.

| type | extra fields |
| --- | --- |
| `frame` | `fills`, `strokes`, `effects`, `cornerRadius`, `clip`, `layout`, `children` |
| `group` | `children` |
| `rect` | `fills`, `strokes`, `effects`, `cornerRadius` |
| `path` | `d`, `viewBox`, `fillRule`, `fills`, `strokes`, `effects` |
| `ellipse` | `fills`, `strokes`, `effects` |
| `line` | `strokes` (width = length, height = 0) |
| `text` | `text`, `font`, `align`, `verticalAlign`, `fills`, `effects`, `autoHeight` |
| `instance` | `componentId`, `variantProps`, `overrides`, optional `cornerRadius` override |

Style references: `fillStyleId`, `textStyleId`, `effectStyleId` override the
literal `fills` / `font`+`fills` / `effects` of the node.

### Text

```json
{
  "id": "title", "type": "text", "name": "Title",
  "x": 24, "y": 48, "width": 300, "height": 40,
  "text": "Welcome back",
  "font": { "family": "system-ui", "weight": 700, "style": "normal",
            "size": 30, "lineHeight": 1.2, "letterSpacing": -0.4 },
  "align": "left", "verticalAlign": "top",
  "fills": [{ "type": "solid", "color": "#F8FAFC" }],
  "autoHeight": true
}
```

Text wraps at `width`; `autoHeight: true` grows the box vertically.

## Auto-layout

A `frame` (or a component root) with `layout` lays out its direct `children`:

```json
"layout": {
  "direction": "vertical",
  "gap": 12,
  "padding": { "top": 16, "right": 16, "bottom": 16, "left": 16 },
  "alignPrimary": "start",
  "alignCounter": "stretch"
}
```

- `direction`: `horizontal` | `vertical`
- `alignPrimary`: `start` | `center` | `end` | `space-between`
- `alignCounter`: `start` | `center` | `end` | `stretch`
- Child `layoutSizing.h/v`: `fixed` (keep size), `hug` (shrink to content),
  `fill` (take remaining primary space / stretch on the counter axis).
- Auto-layout frames themselves can be `hug` or `fill` inside a parent.
- Positions of auto-layout children are computed; `x`/`y` are ignored there.
- No wrap/grid, min/max, or absolute-position children in v1.

## Fills

`fills` is an array, painted bottom to top, max 8.

```json
[
  { "type": "solid", "color": "#2563EB", "opacity": 1 },
  { "type": "linear-gradient", "angle": 135,
    "stops": [{ "position": 0, "color": "#2563EB" }, { "position": 1, "color": "#7C3AED" }] },
  { "type": "radial-gradient", "center": { "x": 0.5, "y": 0.5 }, "radius": 0.7,
    "stops": [{ "position": 0, "color": "#FFFFFF" }, { "position": 1, "color": "#00000000" }] },
  { "type": "image", "asset": "assets/abc.png", "fit": "cover",
    "crop": { "x": 0, "y": 0, "width": 1, "height": 1 } }
]
```

- `angle` is degrees clockwise from the bottom→top direction.
- `crop` is normalized (0–1) and must stay inside the image.
- Image assets are uploaded by the editor and served from `canvas/assets/`.

## Effects

`effects` array, max 8:

```json
[
  { "type": "drop-shadow", "x": 0, "y": 8, "blur": 24, "spread": 0, "color": "#00000026", "visible": true },
  { "type": "inner-shadow", "x": 0, "y": 2, "blur": 8, "spread": 0, "color": "#00000033" },
  { "type": "layer-blur", "radius": 6 },
  { "type": "background-blur", "radius": 12 }
]
```

Background blur is exact on screen (`backdrop-filter`) and approximated in SVG
and PNG export (blurred backdrop copy).

## Styles

```json
"styles": [
  { "id": "style-brand", "type": "fill", "name": "Brand/Primary",
    "value": { "type": "solid", "color": "#2563EB" } },
  { "id": "style-heading", "type": "text", "name": "Text/Heading",
    "value": { "font": { "size": 30, "weight": 700 },
               "fills": [{ "type": "solid", "color": "#0F172A" }] } },
  { "id": "style-card-shadow", "type": "effect", "name": "Shadow/Card",
    "value": [{ "type": "drop-shadow", "x": 0, "y": 18, "blur": 40, "spread": -8, "color": "#02061766" }] }
]
```

A fill style value is one `Fill`; a text style value is `{ font, fills }`; an
effect style value is an `Effect[]`. Editing a style updates every referencing
node when the document is rendered.

## Path nodes

`path` uses SVG path data in `d`, with a local `viewBox`:

```json
{
  "id": "icon-star",
  "type": "path",
  "name": "Star",
  "x": 0,
  "y": 0,
  "width": 24,
  "height": 24,
  "d": "M12 2l3 7 7 .5-5.5 4.5 2 7-6.5-4-6.5 4 2-7L2 9.5 9 9z",
  "viewBox": { "x": 0, "y": 0, "width": 24, "height": 24 },
  "fillRule": "nonzero",
  "fills": [{ "type": "solid", "color": "#111111" }],
  "strokes": [],
  "effects": []
}
```

- `d` is required; supported commands are `M/L/H/V/C/S/Q/T/A/Z`, absolute and relative.
- `viewBox` is optional; if omitted it is derived from the path bounds.
- `fillRule` is `nonzero` or `evenodd`.
- Path supports solid/gradient fills and strokes; image fills are rejected.
- Path nodes have no children, corner radius or clip. Selection uses the node
  bounding box; transparent interiors are not precisely hit-tested yet.
- Basic SVG `<path>` import is available in the toolbar; transforms/text/filters
  are skipped with a warning.

## Components, variants and instances

```json
"components": [
  { "id": "cmp-button", "name": "Button/Primary",
    "variantSetId": "vs-button", "variantProps": { "State": "Default" },
    "root": { "id": "cmp-button-root", "type": "frame", "x": 0, "y": 0,
              "width": 286, "height": 48, "children": [ /* ... */ ] } }
],
"variantSets": [
  { "id": "vs-button", "name": "Button",
    "properties": [{ "name": "State", "values": ["Default", "Hover"] }],
    "componentIds": ["cmp-button", "cmp-button-hover"] }
]
```

An instance on a page:

```json
{
  "id": "btn-instance", "type": "instance", "name": "Primary button",
  "x": 20, "y": 222, "width": 286, "height": 48,
  "componentId": "cmp-button",
  "variantProps": { "State": "Hover" },
  "overrides": { "btn-label": { "text": "Sign in" } }
}
```

- `overrides` keys are node ids inside the component root; allowed patches:
  `text` (text nodes only), `fills` (frame/rect/ellipse/text), `visible`.
- The instance root can be resized and given `layoutSizing`. It inherits the component root's `cornerRadius`; an instance-level `cornerRadius` overrides it without detaching.
- Switching `componentId` / `variantProps` swaps the variant.
- Components are edited in the editor's component mode; updates reach all
  instances. Nested instances are supported; cycles are rejected.

## Fonts

```json
"fonts": [
  { "id": "font-inter", "family": "Inter", "weight": 600, "style": "normal",
    "asset": "fonts/abc123.woff2", "sourceName": "Inter-SemiBold.woff2" }
]
```

`family` is used by `text.font.family`; weight/style select the face. The
editor registers `@font-face` from `canvas/fonts/...` and waits for
`document.fonts.load` before measuring. Exports embed the used font files.
No server-side conversion or subsetting is performed.

## Comments (single-user, threaded)

```json
"comments": [
  { "id": "c1", "pageId": "page-1", "nodeId": "btn-instance",
    "x": 0.5, "y": 0.5, "body": "按钮再高一点", "author": "user",
    "createdAt": "ISO", "resolved": false,
    "replies": [{ "id": "c1r1", "author": "ai", "body": "已调整", "createdAt": "ISO" }] }
]
```

`nodeId` pins the thread to a node; otherwise `x`/`y` are normalized page
coordinates. `author` is `user` or `ai`. There is no realtime collaboration.

## Edit operations (canvas_edit / UI internals)

```json
{ "ops": [
  { "op": "add", "parent": "frame-login", "index": 0, "node": { "id": "title", "type": "text", "text": "Hi" } },
  { "op": "update", "id": "title", "patch": { "x": 24, "fills": [{ "type": "solid", "color": "#111111" }] } },
  { "op": "move", "id": "title", "parent": "frame-login", "index": 2 },
  { "op": "remove", "id": "old-node" },
  { "op": "set", "key": "styles", "value": [ /* full style list */ ] },
  { "op": "comment.add", "body": "Looks good", "nodeId": "btn-instance" },
  { "op": "comment.reply", "commentId": "c1", "body": "Fixed" },
  { "op": "comment.resolve", "commentId": "c1", "resolved": true }
] }
```

- `parent` may be a page id or a frame/group node id; omit it to append to the
  active page.
- New nodes without ids get generated ids.
- The whole document is normalized and validated after each batch; an invalid
  batch is rejected without changing the file.
- Pass `baseRevision` from `canvas_read` to avoid overwriting newer edits.

## Templates and design system

Built-in templates and the default design system are documented in
`canvas/DESIGN.md` (`DESIGN.md` in this package). Use the `canvas_template`
tool (or the editor's Templates panel) to insert the iOS screen, status bar,
navigation bar or tab bar, then edit the result with `canvas_edit`.

## Validation

Writes are rejected with a JSON-pointer-like path (`$.pages[0].children[2].width`)
when a value is malformed. Unknown node types are not accepted by writers; the
editor renders unknown future types as placeholders after reading.
