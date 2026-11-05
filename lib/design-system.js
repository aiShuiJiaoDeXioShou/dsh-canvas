/**
 * Built-in design systems for dsh-canvas.
 *
 * The default when the user names no system is Material Design 3 (the most
 * widely adopted cross-platform system). iOS screens use Apple Human Interface
 * Guidelines conventions. The agent-facing summary lives in canvas/DESIGN.md.
 */

export const DEFAULT_DESIGN_SYSTEM = 'material3'

export const DESIGN_SYSTEMS = {
  material3: {
    id: 'material3',
    name: 'Material Design 3',
    source: 'Google',
    platform: 'cross-platform',
    description:
      'Google 的跨平台设计规范，组件与 token 覆盖最广，是最通用的一套。',
    colors: {
      primary: '#6750A4',
      onPrimary: '#FFFFFF',
      primaryContainer: '#EADDFF',
      onPrimaryContainer: '#21005D',
      secondary: '#625B71',
      onSecondary: '#FFFFFF',
      secondaryContainer: '#E8DEF8',
      onSecondaryContainer: '#1D192B',
      surface: '#FEF7FF',
      onSurface: '#1D1B20',
      surfaceVariant: '#E7E0EC',
      onSurfaceVariant: '#49454F',
      background: '#FEF7FF',
      outline: '#79747E',
      outlineVariant: '#CAC4D0',
      error: '#B3261E',
      onError: '#FFFFFF',
      success: '#146C2E',
      warning: '#7D5260',
    },
    type: {
      displayLarge: { size: 57, lineHeight: 64, weight: 400, letterSpacing: -0.25 },
      displayMedium: { size: 45, lineHeight: 52, weight: 400, letterSpacing: 0 },
      displaySmall: { size: 36, lineHeight: 44, weight: 400, letterSpacing: 0 },
      headlineLarge: { size: 32, lineHeight: 40, weight: 400, letterSpacing: 0 },
      headlineMedium: { size: 28, lineHeight: 36, weight: 400, letterSpacing: 0 },
      headlineSmall: { size: 24, lineHeight: 32, weight: 400, letterSpacing: 0 },
      titleLarge: { size: 22, lineHeight: 28, weight: 400, letterSpacing: 0 },
      titleMedium: { size: 16, lineHeight: 24, weight: 500, letterSpacing: 0.15 },
      titleSmall: { size: 14, lineHeight: 20, weight: 500, letterSpacing: 0.1 },
      bodyLarge: { size: 16, lineHeight: 24, weight: 400, letterSpacing: 0.5 },
      bodyMedium: { size: 14, lineHeight: 20, weight: 400, letterSpacing: 0.25 },
      bodySmall: { size: 12, lineHeight: 16, weight: 400, letterSpacing: 0.4 },
      labelLarge: { size: 14, lineHeight: 20, weight: 500, letterSpacing: 0.1 },
      labelMedium: { size: 12, lineHeight: 16, weight: 500, letterSpacing: 0.5 },
      labelSmall: { size: 11, lineHeight: 16, weight: 500, letterSpacing: 0.5 },
    },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 },
    radius: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, full: 999 },
    elevation: {
      level1: [{ type: 'drop-shadow', x: 0, y: 1, blur: 3, spread: 0, color: '#0000001A' }],
      level2: [{ type: 'drop-shadow', x: 0, y: 2, blur: 6, spread: 0, color: '#0000001F' }],
      level3: [{ type: 'drop-shadow', x: 0, y: 4, blur: 12, spread: 0, color: '#00000024' }],
    },
    components: {
      button: { height: 40, radius: 20, paddingX: 24, label: 'labelLarge' },
      card: { radius: 12, padding: 16, elevation: 'level1' },
      textField: { height: 56, radius: 4, paddingX: 16 },
    },
  },
  ios: {
    id: 'ios',
    name: 'Apple Human Interface Guidelines',
    source: 'Apple',
    platform: 'iOS',
    description:
      'Apple 的 iOS 平台规范，状态栏、导航栏、标签栏、安全区尺寸都按 iPhone 基准。',
    colors: {
      blue: '#007AFF',
      green: '#34C759',
      red: '#FF3B30',
      orange: '#FF9500',
      yellow: '#FFCC00',
      purple: '#AF52DE',
      teal: '#5AC8FA',
      gray: '#8E8E93',
      background: '#F2F2F7',
      surface: '#FFFFFF',
      surfaceElevated: '#FFFFFFF2',
      label: '#000000',
      secondaryLabel: '#3C3C4399',
      tertiaryLabel: '#3C3C434D',
      separator: '#3C3C432E',
      fill: '#7878801F',
      onBlue: '#FFFFFF',
    },
    type: {
      largeTitle: { size: 34, lineHeight: 41, weight: 700, letterSpacing: 0.37 },
      title1: { size: 28, lineHeight: 34, weight: 700, letterSpacing: 0.36 },
      title2: { size: 22, lineHeight: 28, weight: 600, letterSpacing: 0.35 },
      title3: { size: 20, lineHeight: 25, weight: 600, letterSpacing: 0.38 },
      headline: { size: 17, lineHeight: 22, weight: 600, letterSpacing: -0.41 },
      body: { size: 17, lineHeight: 22, weight: 400, letterSpacing: -0.41 },
      callout: { size: 16, lineHeight: 21, weight: 400, letterSpacing: -0.32 },
      subheadline: { size: 15, lineHeight: 20, weight: 400, letterSpacing: -0.24 },
      footnote: { size: 13, lineHeight: 18, weight: 400, letterSpacing: -0.08 },
      caption1: { size: 12, lineHeight: 16, weight: 400, letterSpacing: 0 },
      caption2: { size: 11, lineHeight: 13, weight: 400, letterSpacing: 0.07 },
    },
    metrics: {
      screenWidth: 393,
      screenHeight: 852,
      statusBarHeight: 54,
      navBarHeight: 44,
      tabBarHeight: 49,
      homeIndicatorWidth: 134,
      homeIndicatorHeight: 5,
      safeAreaBottom: 34,
      margin: 16,
      cardRadius: 12,
      controlHeight: 44,
    },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 32 },
    radius: { sm: 8, md: 10, card: 12, large: 16, full: 999 },
    elevation: {
      card: [{ type: 'drop-shadow', x: 0, y: 1, blur: 4, spread: 0, color: '#0000000F' }],
    },
    components: {
      statusBar: { height: 54 },
      navBar: { height: 44 },
      tabBar: { height: 49, totalWithHomeIndicator: 83 },
      button: { height: 50, radius: 12, paddingX: 20 },
    },
  },
}

export const DESIGN_SYSTEM_IDS = Object.keys(DESIGN_SYSTEMS)

/** @param {string} [id] */
export function getDesignSystem(id = DEFAULT_DESIGN_SYSTEM) {
  return DESIGN_SYSTEMS[id] ?? DESIGN_SYSTEMS[DEFAULT_DESIGN_SYSTEM]
}

/** Short prompt text shared by Host tools and the client's "generate" prompt. */
export const DESIGN_SYSTEM_PROMPT = [
  'If the user does not name a design system, use the built-in design system documented in canvas/DESIGN.md:',
  'Material Design 3 tokens for general UI, and Apple Human Interface Guidelines for iOS screens.',
  'For a mobile/iOS screen, start from the foundation (iPhone 16 393×852 by default; iPhone 15 optional) and a page template, then customize it.',
].join(' ')

function styleSlug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function styleId(systemId, type, name) {
  return `ds_${systemId}_${type}_${styleSlug(name)}`.slice(0, 64)
}

/**
 * Build a Figma-like local style library from a system's tokens. The styles
 * can be merged into a document and applied from the editor's Styles panel.
 * @param {string} [id]
 */
export function designSystemStyles(id = DEFAULT_DESIGN_SYSTEM) {
  const system = getDesignSystem(id)
  const styles = []
  const colorNames =
    system.id === 'material3'
      ? {
          primary: 'Primary',
          onPrimary: 'On Primary',
          primaryContainer: 'Primary Container',
          surface: 'Surface',
          onSurface: 'On Surface',
          surfaceVariant: 'Surface Variant',
          onSurfaceVariant: 'On Surface Variant',
          outline: 'Outline',
          error: 'Error',
          success: 'Success',
        }
      : {
          blue: 'Blue',
          green: 'Green',
          red: 'Red',
          orange: 'Orange',
          gray: 'Gray',
          background: 'Background',
          surface: 'Surface',
          label: 'Label',
          secondaryLabel: 'Secondary Label',
          separator: 'Separator',
        }
  for (const [key, label] of Object.entries(colorNames)) {
    const color = system.colors[key]
    if (!color) continue
    styles.push({
      id: styleId(system.id, 'fill', label),
      type: 'fill',
      name: `${system.id === 'material3' ? 'M3' : 'iOS'}/Color/${label}`,
      value: { type: 'solid', color },
    })
  }
  const textColor = system.id === 'material3' ? system.colors.onSurface : system.colors.label
  for (const [key, token] of Object.entries(system.type)) {
    const name = key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase()).trim()
    styles.push({
      id: styleId(system.id, 'text', name),
      type: 'text',
      name: `${system.id === 'material3' ? 'M3' : 'iOS'}/Type/${name}`,
      value: {
        font: {
          family: 'system-ui',
          weight: token.weight,
          style: 'normal',
          size: token.size,
          lineHeight: Math.round((token.lineHeight / token.size) * 1000) / 1000,
          letterSpacing: token.letterSpacing,
        },
        fills: [{ type: 'solid', color: textColor }],
      },
    })
  }
  for (const [key, effects] of Object.entries(system.elevation)) {
    styles.push({
      id: styleId(system.id, 'effect', key),
      type: 'effect',
      name: `${system.id === 'material3' ? 'M3' : 'iOS'}/Elevation/${key}`,
      value: structuredClone(effects),
    })
  }
  return styles
}
