# Canvas design system

The editor ships with a default design system so generated UI has a coherent
baseline when the user does not name one.

## Which system is used

| Situation | System |
| --- | --- |
| User names a system | Follow the user's system. |
| General / unspecified UI | **Material Design 3** (Google) |
| iOS / iPhone screen | **Apple Human Interface Guidelines** |
| Existing canvas | Follow the styles already in the document. |

Material Design 3 is the most widely adopted cross-platform system and has the
largest component/token vocabulary, so it is the **general default**. Apple HIG
is the platform baseline for iOS; the built-in iOS templates use its metrics
and colors.

### Common large-company systems

- Material Design 3 (Google) — cross-platform, most universal.
- Apple Human Interface Guidelines (Apple) — iOS/macOS platform baseline.
- Fluent 2 (Microsoft), Carbon (IBM), Spectrum (Adobe), Lightning (Salesforce).
- Polaris (Shopify), Primer (GitHub), Atlassian Design System, Base Web (Uber).
- Ant Design (Alibaba), Arco Design / Semi Design (ByteDance), TDesign
  (Tencent) — common in Chinese products.

## Foundation: devices and presets

`canvas_template action="foundation"` returns the resolved foundation: device,
style preset and the existing Material 3/iOS colors and typography.

Devices:

| id | size | notes |
| --- | --- | --- |
| `iphone16` | 393×852 | default for new mobile screens |
| `iphone15` | 390×844 | legacy/compatibility |

Presets (geometry/density only; colors and type stay on the design system):

| Preset | Page margin | Section gap | Card padding | Card / button radius | Shadow |
| --- | --- | --- | --- | --- | --- |
| **Neutral** (default) | 16 | 16 | 16 | 12 / 12 | light |
| Minimal | 20 | 24 | 16 | 8 / 8 | none |
| Soft | 20 | 20 | 20 | 20 / 16 | soft |
| Compact | 12 | 12 | 12 | 8 / 8 | none |

Source data: [skills/canvas-ui-design/foundation/base.json](skills/canvas-ui-design/foundation/base.json)
and [skills/canvas-ui-design/presets/](skills/canvas-ui-design/presets/).
Device metrics live in `lib/foundation.js`.

## Tokens

### Material Design 3 (general default)

Colors: primary `#6750A4`, onPrimary `#FFFFFF`, primaryContainer `#EADDFF`,
surface `#FEF7FF`, onSurface `#1D1B20`, surfaceVariant `#E7E0EC`,
onSurfaceVariant `#49454F`, outline `#79747E`, error `#B3261E`,
success `#146C2E`.

Type scale: display 57/64, headline 32/40, title 22/28, body 16/24, label
14/20 (use the `type` table in `lib/design-system.js` for the full scale).

Spacing: 4 / 8 / 12 / 16 / 24 / 32 / 48. Radius: 4 / 8 / 12 / 16 / 24 / 999.
Elevation: 0 1 3, 0 2 6, 0 4 12 with black at 10–14% alpha.

### Apple HIG (iOS)

Colors: blue `#007AFF`, green `#34C759`, red `#FF3B30`, orange `#FF9500`,
background `#F2F2F7`, surface `#FFFFFF`, label `#000000`,
secondaryLabel `#3C3C4399`, separator `#3C3C432E`, fill `#7878801F`.

Typography (SF-like): largeTitle 34/41 bold, title1 28/34 bold, title2 22/28
semibold, title3 20/25 semibold, headline 17/22 semibold, body 17/22, callout
16/21, subheadline 15/20, footnote 13/18, caption1 12/16, caption2 11/13.

Metrics: iPhone 16 393×852 default; status bar 54, navigation bar 44, tab bar 49
(83 with safe area), home indicator 134×5, margin 16, card radius 12.

## Templates

Built-in templates are self-contained Frame trees, listed by the Templates
panel and by the `canvas_template` tool:

| id | category | contents |
| --- | --- | --- |
| `ios-screen` | page | status bar, large title, search, settings cards, tab bar, home indicator |
| `ios-form-screen` | page | status bar, title, fields, primary CTA, home indicator |
| `ios-list-screen` | page | status bar, large title, search, list rows, tab bar |
| `ios-detail-screen` | page | status bar, nav bar, cover area, title/body, bottom CTA |
| `ios-status-bar` | system | standard 54pt status bar, transparent, dark icons |
| `ios-status-bar-light` | system | same with white icons for dark screens |
| `ios-nav-bar` | system | back, title, action |
| `ios-tab-bar` | system | five tabs + home indicator |

Templates default to iPhone 16 and accept `device: "iphone15"`. The built-in
templates are hand-authored approximations of HIG, not official Apple/Figma
assets. The Templates panel shows compact name/meta rows; descriptions live in
tooltips.

For production-standard kits, use the official [Apple Design
Resources](https://developer.apple.com/design/resources/), a [Figma Community
iOS UI kit](https://www.figma.com/community/ui-kits/iphone?resource_type=files&editor_type=figma)
or the [Material 3 Design
Kit](https://www.figma.com/community/file/1035203688168086460/material-3-design-kit).
Importing those files is not built in yet: `.fig` is proprietary and community
files need a Figma account. A Figma REST API importer
(https://developers.figma.com/docs/rest-api/file-endpoints/) is the realistic
path for editable conversion; check each file's license before reuse.

To make the tokens directly selectable, use `canvas_template` with
`action: "styles"` and `system: "material3" | "ios"` (or the Styles panel's
「内置规范」 buttons). It merges the system's fill/text/effect styles into the
document, and they appear in the Styles panel. Loading only adds presets; it
does not restyle existing layers automatically.

## Design skill, audit and image generation

- The plugin registers the `canvas-ui-design` runtime skill. It routes new UI
  generation, reference rebuilds, components, refactor and review to the
  adapted workflows under `skills/canvas-ui-design/`.
- `canvas_audit` runs deterministic checks (screenshot boundary, contrast,
  touch targets, clipping, zero-size, missing references, comments, empty
  frames) and reports skipped checks; it is not a substitute for visual review.
- `canvas_image probe/generate/import` resolves the image path:
  GPT/OpenAI model → native image generation; otherwise a local Codex CLI with
  `image_generation` → `codex exec`; otherwise the user imports an image.
- Foundation device selection lives in the Templates panel. AI UI generation,
  image generation and design audit are driven from chat/tools; export stays in
  the top toolbar, so the left rail stays focused on layers/components/templates.


## Agent rules

1. If the user names a design system, use that system's tokens instead of these.
2. If no system is named, use Material Design 3 for general UI and Apple HIG for iOS.
3. New mobile screens default to iPhone 16 393×852 and the Neutral preset;
   existing documents keep their current device/system.
4. Prefer built-in page templates and reuse component instances/styles already
   present over introducing a second visual language.
5. Run `canvas_audit` after generating/editing; fix real findings and state
   which checks were skipped or require manual visual review.
