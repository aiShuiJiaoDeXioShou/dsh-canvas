// @ts-nocheck
/**
 * Built-in canvas templates. Each template is a self-contained Frame node tree
 * with literal values from the built-in design systems; instantiating one
 * regenerates every node id so it can be inserted into any document.
 *
 * Templates are device-aware: they default to iPhone 16 (393×852) and accept
 * iPhone 15 (390×844) for legacy documents.
 */

import { DESIGN_SYSTEMS } from './design-system.js'
import { DEFAULT_DEVICE, getDevice } from './foundation.js'

const IOS = DESIGN_SYSTEMS.ios
const C = IOS.colors

function type(name) {
  const token = IOS.type[name]
  return {
    family: 'system-ui',
    weight: token.weight,
    style: 'normal',
    size: token.size,
    lineHeight: Math.round((token.lineHeight / token.size) * 1000) / 1000,
    letterSpacing: token.letterSpacing,
  }
}

function text(id, name, x, y, width, value, style = 'body', color = C.label, extra = {}) {
  const font = type(style)
  return {
    id,
    type: 'text',
    name,
    x,
    y,
    width,
    height: Math.ceil(font.size * font.lineHeight),
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    text: value,
    font,
    align: extra.align ?? 'left',
    verticalAlign: extra.verticalAlign ?? 'top',
    fills: [{ type: 'solid', color }],
    effects: [],
    autoHeight: true,
  }
}

function rect(id, name, x, y, width, height, extra = {}) {
  return {
    id,
    type: 'rect',
    name,
    x,
    y,
    width,
    height,
    rotation: extra.rotation ?? 0,
    opacity: 1,
    visible: true,
    locked: false,
    cornerRadius: extra.cornerRadius ?? 0,
    fills: extra.fill ? [{ type: 'solid', color: extra.fill }] : [],
    strokes: extra.stroke ? [{ color: extra.stroke, width: extra.strokeWidth ?? 1, align: 'center' }] : [],
    effects: extra.effects ?? [],
  }
}

function ellipse(id, name, x, y, width, height, extra = {}) {
  return {
    id,
    type: 'ellipse',
    name,
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fills: extra.fill ? [{ type: 'solid', color: extra.fill }] : [],
    strokes: extra.stroke ? [{ color: extra.stroke, width: extra.strokeWidth ?? 1, align: 'center' }] : [],
    effects: [],
  }
}

function lineNode(id, name, x, y, length, extra = {}) {
  return {
    id,
    type: 'line',
    name,
    x,
    y,
    width: length,
    height: 0,
    rotation: extra.rotation ?? 0,
    opacity: 1,
    visible: true,
    locked: false,
    strokes: [{ color: extra.color ?? C.label, width: extra.width ?? 1, align: 'center' }],
  }
}

function frame(id, name, x, y, width, height, children, extra = {}) {
  return {
    id,
    type: 'frame',
    name,
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    clip: extra.clip ?? true,
    cornerRadius: extra.cornerRadius ?? 0,
    fills: extra.fill ? [{ type: 'solid', color: extra.fill }] : [],
    strokes: extra.stroke ? [{ color: extra.stroke, width: extra.strokeWidth ?? 1, align: 'center' }] : [],
    effects: extra.effects ?? [],
    children,
  }
}

/** Standard iPhone status bar, transparent, 54pt. */
function statusBar(idPrefix, tone, device) {
  const foreground = tone === 'light' ? '#FFFFFF' : C.label
  const secondary = tone === 'light' ? '#FFFFFFCC' : C.secondaryLabel
  const width = device.width
  const children = [
    text(`${idPrefix}-time`, 'Time', 27, 16, 56, '9:41', 'subheadline', foreground),
    rect(`${idPrefix}-island`, 'Dynamic Island', (width - 126) / 2, 11, 126, 37, { fill: C.label, cornerRadius: 19 }),
    text(`${idPrefix}-5g`, 'Network', width - 87, 17, 25, '5G', 'caption2', foreground),
    rect(`${idPrefix}-battery`, 'Battery', width - 56, 19, 25, 12, { stroke: secondary, strokeWidth: 1, cornerRadius: 3 }),
    rect(`${idPrefix}-battery-fill`, 'Battery level', width - 54, 21, 20, 8, { fill: foreground, cornerRadius: 2 }),
    rect(`${idPrefix}-battery-tip`, 'Battery tip', width - 30, 22, 2, 6, { fill: secondary, cornerRadius: 1 }),
  ]
  for (let index = 0; index < 4; index += 1) {
    const height = 4 + index * 2
    children.push(
      rect(`${idPrefix}-signal-${index}`, `Signal ${index + 1}`, width - 108 + index * 4, 33 - height, 3, height, {
        fill: foreground,
        cornerRadius: 1,
      }),
    )
  }
  return frame(`${idPrefix}-root`, 'Status Bar', 0, 0, width, device.statusBarHeight, children, { clip: false })
}

function navBar(device, title = 'Title') {
  return frame(
    'nav-root',
    'Navigation Bar',
    0,
    0,
    device.width,
    device.navBarHeight,
    [
      text('nav-back', 'Back', 10, 4, 26, '‹', 'title1', C.blue),
      text('nav-title', 'Title', (device.width - 120) / 2, 10, 120, title, 'headline', C.label, { align: 'center' }),
      text('nav-action', 'Action', device.width - 80, 10, 64, 'Done', 'body', C.blue, { align: 'right' }),
    ],
    { fill: C.surfaceElevated },
  )
}

function tabBar(device) {
  const labels = ['Home', 'Search', 'Favorites', 'Inbox', 'Profile']
  const height = device.tabBarTotalHeight
  const children = [lineNode('tab-top-line', 'Top separator', 0, 0, device.width, { color: C.separator, width: 1 })]
  labels.forEach((label, index) => {
    const center = ((index + 0.5) * device.width) / labels.length
    const selected = index === 0
    const color = selected ? C.blue : C.gray
    children.push(
      rect(`tab-icon-${index}`, `${label} icon`, center - 12, 10, 24, 24, { fill: color, cornerRadius: 6 }),
      text(`tab-label-${index}`, label, center - 32, 38, 64, label, 'caption2', color, { align: 'center' }),
    )
  })
  children.push(
    rect('home-indicator', 'Home Indicator', (device.width - device.homeIndicatorWidth) / 2, height - 11, device.homeIndicatorWidth, device.homeIndicatorHeight, {
      fill: C.label,
      cornerRadius: 3,
    }),
  )
  return frame('tab-root', 'Tab Bar', 0, 0, device.width, height, children, { fill: C.surfaceElevated, clip: true })
}

function listRowCard(device) {
  const rows = [
    { icon: C.blue, label: 'Wi-Fi', value: 'Home' },
    { icon: C.green, label: 'Bluetooth', value: 'On' },
    { icon: C.orange, label: 'Cellular', value: '5G' },
    { icon: C.gray, label: 'Personal Hotspot', value: 'Off' },
  ]
  const width = device.width - 32
  const children = []
  rows.forEach((row, index) => {
    const y = 12 + index * 44
    const right = width - 48
    children.push(
      rect(`row-${index}-icon`, `${row.label} icon`, 16, y, 32, 32, { fill: row.icon, cornerRadius: 8 }),
      rect(`row-${index}-glyph`, `${row.label} glyph`, 25, y + 9, 14, 14, { fill: '#FFFFFF', cornerRadius: 4 }),
      text(`row-${index}-label`, row.label, 60, y + 5, right - 60, row.label, 'body', C.label),
      text(`row-${index}-value`, `${row.label} value`, right - 62, y + 7, 62, row.value, 'subheadline', C.secondaryLabel, { align: 'right' }),
      text(`row-${index}-chevron`, 'Chevron', width - 26, y + 3, 16, '›', 'title3', C.tertiaryLabel, { align: 'center' }),
    )
    if (index < rows.length - 1) children.push(lineNode(`row-${index}-separator`, 'Separator', 60, y + 43, width - 76, { color: C.separator, width: 1 }))
  })
  return frame('settings-card', 'General Settings Card', 16, 238, width, 200, children, {
    fill: C.surface,
    cornerRadius: IOS.metrics.cardRadius,
    effects: IOS.elevation.card,
  })
}

function accountCard(device) {
  const rows = [
    { icon: C.blue, label: 'Apple ID', value: 'name@icloud.com' },
    { icon: C.gray, label: 'Password & Security', value: '' },
  ]
  const width = device.width - 32
  const children = []
  rows.forEach((row, index) => {
    const y = 12 + index * 44
    children.push(
      rect(`account-${index}-icon`, `${row.label} icon`, 16, y, 32, 32, { fill: row.icon, cornerRadius: 8 }),
      text(`account-${index}-label`, row.label, 60, y + 5, width - 160, row.label, 'body', C.label),
      text(`account-${index}-value`, row.value, width - 138, y + 7, 92, row.value, 'footnote', C.secondaryLabel, { align: 'right' }),
      text(`account-${index}-chevron`, 'Chevron', width - 26, y + 3, 16, '›', 'title3', C.tertiaryLabel, { align: 'center' }),
    )
    if (index === 0) children.push(lineNode(`account-${index}-separator`, 'Separator', 60, y + 43, width - 76, { color: C.separator, width: 1 }))
  })
  return frame('account-card', 'Account Card', 16, 480, width, 100, children, {
    fill: C.surface,
    cornerRadius: IOS.metrics.cardRadius,
    effects: IOS.elevation.card,
  })
}

function buildIosScreen(device) {
  const width = device.width
  const status = statusBar('screen-status', 'dark', device)
  const tabs = tabBar(device)
  tabs.y = device.height - device.tabBarTotalHeight
  const search = frame(
    'search-field',
    'Search Field',
    16,
    154,
    width - 32,
    36,
    [
      ellipse('search-icon', 'Search glyph', 12, 11, 13, 13, { stroke: C.secondaryLabel, strokeWidth: 1.5 }),
      lineNode('search-icon-handle', 'Search handle', 22, 23, 6, { color: C.secondaryLabel, width: 1.5, rotation: 45 }),
      text('search-placeholder', 'Placeholder', 32, 8, 220, 'Search settings', 'subheadline', C.secondaryLabel),
    ],
    { fill: C.fill, cornerRadius: 10 },
  )
  return frame(
    'screen-root',
    'iOS Screen',
    0,
    0,
    width,
    device.height,
    [
      status,
      text('screen-title', 'Large Title', 16, 72, width - 50, 'Settings', 'largeTitle', C.label),
      text('screen-subtitle', 'Subtitle', 16, 124, width - 50, 'Manage your account and app preferences', 'subheadline', C.secondaryLabel),
      search,
      text('section-general', 'Section Label', 16, 212, 200, 'GENERAL', 'caption1', C.secondaryLabel),
      listRowCard(device),
      text('section-account', 'Section Label', 16, 454, 200, 'ACCOUNT', 'caption1', C.secondaryLabel),
      accountCard(device),
      tabs,
    ],
    { fill: C.background, clip: true },
  )
}

function field(device, id, name, y, label, placeholder) {
  const width = device.width - 32
  return frame(id, name, 16, y, width, 68, [
    text(`${id}-label`, `${name} label`, 0, 0, width, label, 'caption1', C.secondaryLabel),
    rect(`${id}-box`, `${name} box`, 0, 20, width, 48, { fill: C.fill, cornerRadius: 10 }),
    text(`${id}-placeholder`, `${name} placeholder`, 14, 34, width - 28, placeholder, 'body', C.secondaryLabel),
  ], { clip: false })
}

function primaryButton(device, id, y, label) {
  const width = device.width - 32
  return frame(id, 'Primary Button', 16, y, width, 52, [
    rect(`${id}-bg`, 'Button background', 0, 0, width, 52, { fill: C.blue, cornerRadius: 12 }),
    text(`${id}-label`, 'Button label', 0, 16, width, label, 'body', C.onBlue, { align: 'center' }),
  ], { clip: false })
}

function buildFormScreen(device) {
  const width = device.width
  const height = device.height
  return frame(
    'form-root',
    'iOS Form Screen',
    0,
    0,
    width,
    height,
    [
      statusBar('form-status', 'dark', device),
      text('form-title', 'Title', 16, 80, width - 32, 'Create account', 'largeTitle', C.label),
      text('form-subtitle', 'Subtitle', 16, 130, width - 32, 'Start by adding your details.', 'subheadline', C.secondaryLabel),
      field(device, 'form-name', 'Name', 180, 'NAME', 'Your name'),
      field(device, 'form-email', 'Email', 260, 'EMAIL', 'you@example.com'),
      field(device, 'form-password', 'Password', 340, 'PASSWORD', 'At least 8 characters'),
      primaryButton(device, 'form-cta', height - 158, 'Continue'),
      text('form-footnote', 'Footnote', 16, height - 94, width - 32, 'By continuing you agree to the terms.', 'caption1', C.secondaryLabel, { align: 'center' }),
      rect('form-home', 'Home Indicator', (width - device.homeIndicatorWidth) / 2, height - 18, device.homeIndicatorWidth, device.homeIndicatorHeight, { fill: C.label, cornerRadius: 3 }),
    ],
    { fill: C.background, clip: true },
  )
}

function buildListScreen(device) {
  const width = device.width
  const height = device.height
  const tabs = tabBar(device)
  tabs.y = height - device.tabBarTotalHeight
  const rows = [
    ['A', 'Alex Morgan', 'Design review · 2m'],
    ['M', 'Mia Chen', 'Shared a file · 18m'],
    ['S', 'Sam Rivera', 'Lunch tomorrow? · 1h'],
    ['J', 'Jordan Lee', 'Quarterly plan · 3h'],
    ['T', 'Taylor Kim', 'Voice note · Yesterday'],
    ['N', 'Noah Patel', 'Deployment complete · Yesterday'],
  ]
  const cards = rows.map(([initial, name, preview], index) => {
    const y = 226 + index * 72
    return frame(`list-row-${index}`, `List Row ${index + 1}`, 16, y, width - 32, 64, [
      ellipse(`list-avatar-${index}`, 'Avatar', 0, 8, 48, 48, { fill: C.fill }),
      text(`list-initial-${index}`, 'Avatar initial', 0, 18, 48, initial, 'title2', C.secondaryLabel, { align: 'center' }),
      text(`list-name-${index}`, 'Name', 64, 8, width - 140, name, 'headline', C.label),
      text(`list-preview-${index}`, 'Preview', 64, 32, width - 140, preview, 'subheadline', C.secondaryLabel),
      text(`list-chevron-${index}`, 'Chevron', width - 80, 20, 16, '›', 'title3', C.tertiaryLabel, { align: 'center' }),
    ], { clip: false })
  })
  return frame(
    'list-root',
    'iOS List Screen',
    0,
    0,
    width,
    height,
    [
      statusBar('list-status', 'dark', device),
      text('list-title', 'Title', 16, 72, width - 32, 'Inbox', 'largeTitle', C.label),
      text('list-subtitle', 'Subtitle', 16, 120, width - 32, '6 conversations', 'subheadline', C.secondaryLabel),
      frame('list-search', 'Search Field', 16, 154, width - 32, 36, [
        ellipse('list-search-icon', 'Search glyph', 12, 11, 13, 13, { stroke: C.secondaryLabel, strokeWidth: 1.5 }),
        text('list-search-placeholder', 'Placeholder', 32, 8, 220, 'Search', 'subheadline', C.secondaryLabel),
      ], { fill: C.fill, cornerRadius: 10 }),
      ...cards,
      tabs,
    ],
    { fill: C.background, clip: true },
  )
}

function buildDetailScreen(device) {
  const width = device.width
  const height = device.height
  const nav = navBar(device, 'Details')
  return frame(
    'detail-root',
    'iOS Detail Screen',
    0,
    0,
    width,
    height,
    [
      statusBar('detail-status', 'dark', device),
      nav,
      rect('detail-hero', 'Cover image', 0, 98, width, 240, { fill: C.fill }),
      text('detail-hero-label', 'Cover label', 16, 200, width - 32, 'Cover image', 'headline', C.secondaryLabel, { align: 'center' }),
      text('detail-title', 'Title', 16, 360, width - 32, 'A calmer way to start the day', 'title1', C.label),
      text('detail-body', 'Body', 16, 404, width - 32, 'A short description of the story, collection or product. Replace this copy with real content.', 'body', C.secondaryLabel),
      text('detail-meta', 'Meta', 16, 478, width - 32, '5 min read · Today', 'caption1', C.secondaryLabel),
      primaryButton(device, 'detail-cta', height - 158, 'Read story'),
      rect('detail-home', 'Home Indicator', (width - device.homeIndicatorWidth) / 2, height - 18, device.homeIndicatorWidth, device.homeIndicatorHeight, { fill: C.label, cornerRadius: 3 }),
    ],
    { fill: C.background, clip: true },
  )
}

function buildIosStatusBar(device) {
  return statusBar('tpl-status', 'dark', device)
}

function buildIosStatusBarLight(device) {
  return statusBar('tpl-status-light', 'light', device)
}

function buildIosNavBar(device) {
  return navBar(device)
}

function buildIosTabBar(device) {
  return tabBar(device)
}

const BUILDERS = {
  'ios-screen': buildIosScreen,
  'ios-form-screen': buildFormScreen,
  'ios-list-screen': buildListScreen,
  'ios-detail-screen': buildDetailScreen,
  'ios-status-bar': buildIosStatusBar,
  'ios-status-bar-light': buildIosStatusBarLight,
  'ios-nav-bar': buildIosNavBar,
  'ios-tab-bar': buildIosTabBar,
}

const DEFAULT_SIZE = getDevice(DEFAULT_DEVICE)

export const TEMPLATE_LIST = [
  { id: 'ios-screen', name: 'iOS 屏幕', description: 'iPhone 16 393×852：状态栏 + 灵动岛、大标题、搜索、设置卡片、标签栏、Home Indicator', system: 'iOS HIG', category: 'page', width: DEFAULT_SIZE.width, height: DEFAULT_SIZE.height, deviceAware: true },
  { id: 'ios-form-screen', name: 'iOS 表单页', description: 'iPhone 16 393×852：状态栏、大标题、输入字段、主按钮、Home Indicator', system: 'iOS HIG', category: 'page', width: DEFAULT_SIZE.width, height: DEFAULT_SIZE.height, deviceAware: true },
  { id: 'ios-list-screen', name: 'iOS 列表页', description: 'iPhone 16 393×852：状态栏、大标题、搜索、列表行、标签栏', system: 'iOS HIG', category: 'page', width: DEFAULT_SIZE.width, height: DEFAULT_SIZE.height, deviceAware: true },
  { id: 'ios-detail-screen', name: 'iOS 详情页', description: 'iPhone 16 393×852：状态栏、导航栏、封面区、标题正文、底部按钮', system: 'iOS HIG', category: 'page', width: DEFAULT_SIZE.width, height: DEFAULT_SIZE.height, deviceAware: true },
  { id: 'ios-status-bar', name: 'iOS 状态栏', description: '标准 390/393×54 状态栏：时间、灵动岛、信号、5G、电量（透明背景，深色图标）', system: 'iOS HIG', category: 'system', width: DEFAULT_SIZE.width, height: DEFAULT_SIZE.statusBarHeight, deviceAware: true },
  { id: 'ios-status-bar-light', name: 'iOS 状态栏（深色页面）', description: '标准状态栏的浅色图标版本，用于深色背景（透明背景）', system: 'iOS HIG', category: 'system', width: DEFAULT_SIZE.width, height: DEFAULT_SIZE.statusBarHeight, deviceAware: true },
  { id: 'ios-nav-bar', name: 'iOS 导航栏', description: 'iOS 导航栏：返回、标题、右侧动作', system: 'iOS HIG', category: 'system', width: DEFAULT_SIZE.width, height: DEFAULT_SIZE.navBarHeight, deviceAware: true },
  { id: 'ios-tab-bar', name: 'iOS 标签栏', description: 'iOS 标签栏：5 个 Tab + Home Indicator', system: 'iOS HIG', category: 'system', width: DEFAULT_SIZE.width, height: DEFAULT_SIZE.tabBarTotalHeight, deviceAware: true },
]

/**
 * Build one template with fresh ids.
 * @param {string} id
 * @param {{ device?: 'iphone16'|'iphone15' }} [options]
 * @returns {{ node: any, template: any }}
 */
export function instantiateTemplate(id, options = {}) {
  const template = TEMPLATE_LIST.find((entry) => entry.id === id)
  const builder = BUILDERS[id]
  if (!template || !builder) throw new Error(`unknown canvas template "${id}"`)
  const device = getDevice(options.device)
  const node = builder(device)
  const prefix = `tpl_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  let counter = 0
  const remap = (current) => {
    current.id = `${prefix}_${(++counter).toString(36)}`
    if (Array.isArray(current.children)) current.children.forEach(remap)
    return current
  }
  remap(node)
  node.name = template.name
  node.rotation = 0
  return {
    node,
    template: {
      ...template,
      width: node.width,
      height: node.height,
      device: device.id,
    },
  }
}

/** @param {string} [deviceId] */
export function listTemplates(deviceId = DEFAULT_DEVICE) {
  const device = getDevice(deviceId)
  return TEMPLATE_LIST.map((entry) => ({
    ...entry,
    width: device.width,
    height: entry.category === 'page' ? device.height : entry.height,
    device: device.id,
  }))
}
