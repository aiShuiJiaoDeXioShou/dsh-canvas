# Source and adaptation notes

This UI design skill suite is adapted from the user's **BD Flutter Dev** plugin
(`blockdancez/bd-flutter-dev`, source commit `bdde2d5`, v0.6.22). The repository
is user-owned, so the workflow structure, foundation data, presets and style
contract are reused directly where they apply.

Adapted for dsh-canvas:

- Figma tools/pages → `canvas_read` / `canvas_write` / `canvas_edit` / `canvas_template`;
- Image Gen host skill → `canvas_image` capability chain (GPT native / local
  Codex CLI `image_generation` / user import);
- Visualize → DSH `ask_user_question` or direct clarification;
- Flutter/GetX implementation → canvas design handoff (tokens, exports, spec);
- SVG vector import / Figma file fallback → not included;
- default iPhone 16 393×852; iPhone 15 390×844 remains available.

The package retains the original workflow intent and rules; tool-specific parts
are rewritten for dsh-canvas and the DSH Host/Client architecture.
