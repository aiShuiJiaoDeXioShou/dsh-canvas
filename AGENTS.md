# AGENTS.md

This repository is a DeepSeek Harness (DSH) plugin. The Host half runs inside the
DSH Node process; the Client half runs inside the DSH Web UI. The canvas document
format is `dsh.canvas@1` and is the shared contract between the UI, the Host, the
agent tools and the on-disk file.

## Commands

```bash
pnpm install
pnpm typecheck     # TS type checks (new path modules are strict)
pnpm build         # client/client.js + dist/host/main.js
pnpm test          # tsx --test tests/*.test.ts
pnpm check         # typecheck + build + test
```

Generated artifacts are committed so a clone can be installed without a build:
`client/client.js` and `dist/host/main.js`. Rebuild both after source changes.
Do not hand-edit generated files.

## Architecture

- `index.js` — thin DSH Host entry. It imports the built `dist/host/main.js`
  with a cache-busting revision so disable/enable reloads Host code.
- `src/shared/` — code used by both halves. No Node built-ins and no DOM APIs.
  - `format.ts` — document normalization/validation and the `dsh.canvas@1` model.
  - `ops.ts` — pure document mutations shared by tools and UI.
  - `path/` — strict SVG path parsing, bounds, viewBox and basic SVG import.
  - `audit.ts`, `design-system.ts`, `foundation.ts`, `templates.ts`.
- `src/host/` — Node-only code:
  - `main.ts` — `apply(ctx)`, HTTP routes, agent tools.
  - `image.ts` — GPT/Codex image capability and import.
  - `skills.ts` — registers the `canvas-ui-design` runtime skill from `skills/`.
- `src/client/` — browser code:
  - `index.tsx` — plugin/extension registration and composer/reference chip.
  - `CanvasPanel.tsx` / `CanvasView.tsx` — canvas shell and interactions.
  - `store.ts` — mutable source of truth for one canvas tab.
  - `editor/` — resolve/layout/render/hit-test/export/link helpers.
  - `ui/` — toolbar, layers, inspector, panels, icons and menu.
- `skills/canvas-ui-design/` — runtime skill body and workflows. The skill is
  read by the Host at runtime and registered through `ctx.get('skills')`.
- `schema/` — JSON schema; `FORMAT.md`/`DESIGN.md` are user-facing references.
- `tests/` — Node test runner tests, executed with `tsx`.

## Host/Client boundaries

- Client must not import `node:*` or `src/host/*`.
- Host must not import React, DOM or `src/client/*`.
- Both may import `src/shared/*`.
- React and `react/jsx-runtime` stay external in the client bundle; the DSH shell
  owns the single React instance. Never bundle React.
- Host code is bundled to `dist/host/main.js`; runtime file URLs such as
  `../../skills/` and `../../examples/` resolve from that bundle back to the
  package root. Keep resource URLs relative to the bundled file.
- The client bundle is wrapped as a DSH `__ModuleLoader__` factory by
  `build.mjs`; do not change that contract without checking DSH plugin loading.

## Document format rules

- `dsh.canvas@1` is backward compatible. Additive fields are allowed; do not
  remove or rename existing fields without a migration plan.
- Unknown fields are preserved for round-tripping. New fields must go through
  normalization and validation in `src/shared/format.ts`.
- All writes go through the store/ops/format path. Do not write files directly
  from the client.
- Node types: `frame`, `group`, `rect`, `ellipse`, `line`, `text`, `path`,
  `instance`.
- `path` nodes use `d`, `viewBox`, `fillRule`, `fills` and `strokes`. SVG path
  `d` is validated by `src/shared/path/parse.ts`; path image fills are rejected.
- Revision guards and conflict handling must be preserved: the editor flushes
  before rename/delete, Host writes check `baseRevision`, and SSE/polling keep
  open tabs in sync.

## TypeScript rules

- Prefer explicit types at module boundaries; use `unknown` + guards rather than
  unchecked casts. New modules (especially `src/shared/path/`) are type-checked
  under strict settings via `tsconfig.path.json`.
- A few large legacy modules still carry `// @ts-nocheck` from the JS → TS
  migration. Do not add new suppressions. When editing one, remove its
  suppression and fix the file; keep the rest of the code green.
- Use discriminated unions for document/scene nodes and avoid repeating long
  `node.type === ...` chains in new code. Add a type guard or lookup table.
- Keep functions small and pure where practical. Split a module before it grows
  past roughly 300–400 lines.
- No new UI framework, state library or Node dependency for Client code.

## Path / SVG rules

- Validate `d` and compute bounds through `src/shared/path/parse.ts`.
- `viewBox` is in path-local coordinates; renderers preserve local coordinates
  and use `preserveAspectRatio="none"` so resizing scales the path.
- The DOM renderer and SVG exporter must both support path nodes. PNG export
  goes through the SVG/DOM path.
- Hit testing for path nodes currently uses the node bounding box; transparent
  interior areas are a known limitation. Do not silently claim precise hit
  testing.
- SVG import is intentionally basic: `<path>` elements, solid fills/strokes.
  Unsupported content (text/image/filter/mask/clipPath/transforms) must produce
  warnings, not crash or inject HTML.
- No pen tool/bezier-anchor editing is included unless the task explicitly asks
  for it.

## Tests and release

- Add a unit test for every new pure function/format change; add a Host route or
  integration test when changing request contracts.
- Run the focused tests, then `pnpm check` before committing.
- Update README/FORMAT/DESIGN when behavior or format changes.
- Generated artifacts must be regenerated and committed in the same change.
- License: MIT. Keep the source attribution in
  `skills/canvas-ui-design/SOURCE.md`.
