// @ts-nocheck
/**
 * Design foundation for dsh-canvas: device metrics and density/style presets.
 * Colors and typography stay on the existing Material 3 / iOS HIG systems.
 */

import { DESIGN_SYSTEMS } from './design-system.js'

export const DEVICES = {
  iphone16: {
    id: 'iphone16',
    name: 'iPhone 16',
    width: 393,
    height: 852,
    statusBarHeight: 54,
    navBarHeight: 44,
    tabBarHeight: 49,
    tabBarTotalHeight: 83,
    homeIndicatorWidth: 134,
    homeIndicatorHeight: 5,
    safeAreaBottom: 34,
    margin: 16,
  },
  iphone15: {
    id: 'iphone15',
    name: 'iPhone 15',
    width: 390,
    height: 844,
    statusBarHeight: 54,
    navBarHeight: 44,
    tabBarHeight: 49,
    tabBarTotalHeight: 83,
    homeIndicatorWidth: 134,
    homeIndicatorHeight: 5,
    safeAreaBottom: 34,
    margin: 16,
  },
}

export const STYLE_PRESETS = {
  neutral: {
    id: 'neutral',
    name: 'Neutral',
    pageHorizontal: 16,
    sectionGap: 16,
    cardPadding: 16,
    cardRadius: 12,
    buttonRadius: 12,
    elevation: 'soft',
    description: '默认：克制留白、轻阴影、12 圆角',
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    pageHorizontal: 20,
    sectionGap: 24,
    cardPadding: 16,
    cardRadius: 8,
    buttonRadius: 8,
    elevation: 'none',
    description: '更大留白、无阴影、8 圆角',
  },
  soft: {
    id: 'soft',
    name: 'Soft',
    pageHorizontal: 20,
    sectionGap: 20,
    cardPadding: 20,
    cardRadius: 20,
    buttonRadius: 16,
    elevation: 'soft',
    description: '柔和留白、20/16 圆角、柔和阴影',
  },
  compact: {
    id: 'compact',
    name: 'Compact',
    pageHorizontal: 12,
    sectionGap: 12,
    cardPadding: 12,
    cardRadius: 8,
    buttonRadius: 8,
    elevation: 'none',
    description: '紧凑间距、8 圆角、无阴影',
  },
}

export const DEVICE_IDS = Object.keys(DEVICES)
export const PRESET_IDS = Object.keys(STYLE_PRESETS)
export const DEFAULT_DEVICE = 'iphone16'
export const DEFAULT_PRESET = 'neutral'

export function getDevice(id = DEFAULT_DEVICE) {
  return DEVICES[id] ?? DEVICES[DEFAULT_DEVICE]
}

export function getPreset(id = DEFAULT_PRESET) {
  return STYLE_PRESETS[id] ?? STYLE_PRESETS[DEFAULT_PRESET]
}

export function listDevices() {
  return Object.values(DEVICES).map((device) => ({ ...device }))
}

export function listPresets() {
  return Object.values(STYLE_PRESETS).map((preset) => ({ ...preset }))
}

/**
 * Resolve the foundation for a system/device/preset combination.
 * @param {{ system?: string, device?: string, preset?: string }} [options]
 */
export function resolveFoundation(options = {}) {
  const system = DESIGN_SYSTEMS[options.system] ?? DESIGN_SYSTEMS.ios
  const device = getDevice(options.device)
  const preset = getPreset(options.preset)
  const elevation = preset.elevation === 'none'
    ? []
    : system.elevation?.card ?? system.elevation?.level1 ?? []
  return {
    system: { id: system.id, name: system.name, source: system.source },
    device: { ...device },
    preset: { ...preset },
    colors: { ...system.colors },
    type: structuredClone(system.type),
    spacing: {
      scale: [4, 8, 12, 16, 20, 24, 32, 40, 48],
      pageHorizontal: preset.pageHorizontal,
      sectionGap: preset.sectionGap,
      cardPadding: preset.cardPadding,
    },
    radius: {
      card: preset.cardRadius,
      button: preset.buttonRadius,
    },
    elevation: structuredClone(elevation),
    components: {
      screenWidth: device.width,
      screenHeight: device.height,
      statusBarHeight: device.statusBarHeight,
      navBarHeight: device.navBarHeight,
      tabBarHeight: device.tabBarHeight,
      tabBarTotalHeight: device.tabBarTotalHeight,
      homeIndicatorWidth: device.homeIndicatorWidth,
      homeIndicatorHeight: device.homeIndicatorHeight,
      margin: preset.pageHorizontal,
    },
  }
}

export const FOUNDATION_PROMPT = [
  'Foundation: for new mobile screens default to iPhone 16 393×852 and the Neutral preset;',
  'iPhone 15 390×844 is available for legacy documents. Presets are Neutral/Minimal/Soft/Compact and',
  'control page margins, section gaps, card padding, radii and shadow density only; keep the existing',
  'Material 3 / iOS HIG colors and typography. Get resolved tokens from canvas_template action "foundation".',
].join(' ')
