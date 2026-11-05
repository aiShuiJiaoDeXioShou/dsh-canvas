// @ts-nocheck
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

import {
  DEFAULT_DEVICE,
  DEFAULT_PRESET,
  DEVICES,
  STYLE_PRESETS,
  getDevice,
  getPreset,
  listDevices,
  listPresets,
  resolveFoundation,
} from '../src/shared/foundation.js'
import { TEMPLATE_LIST, instantiateTemplate, listTemplates } from '../src/shared/templates.js'

test('foundation exposes iPhone 16 default and iPhone 15 legacy devices', () => {
  assert.equal(DEFAULT_DEVICE, 'iphone16')
  assert.equal(DEFAULT_PRESET, 'neutral')
  assert.deepEqual([getDevice('iphone16').width, getDevice('iphone16').height], [393, 852])
  assert.deepEqual([getDevice('iphone15').width, getDevice('iphone15').height], [390, 844])
  assert.equal(getDevice('unknown').id, 'iphone16')
  assert.equal(listDevices().length, 2)
})

test('foundation presets match the adapted Neutral/Minimal/Soft/Compact values', () => {
  assert.equal(getPreset('neutral').pageHorizontal, 16)
  assert.equal(getPreset('minimal').pageHorizontal, 20)
  assert.equal(getPreset('soft').cardRadius, 20)
  assert.equal(getPreset('compact').pageHorizontal, 12)
  assert.equal(getPreset('unknown').id, 'neutral')
  assert.deepEqual(Object.keys(STYLE_PRESETS), ['neutral', 'minimal', 'soft', 'compact'])
  assert.equal(listPresets().length, 4)
})

test('resolved foundation keeps system colors/type and applies preset geometry', () => {
  const resolved = resolveFoundation({ system: 'ios', device: 'iphone16', preset: 'soft' })
  assert.equal(resolved.system.id, 'ios')
  assert.equal(resolved.device.width, 393)
  assert.equal(resolved.preset.cardRadius, 20)
  assert.equal(resolved.spacing.pageHorizontal, 20)
  assert.equal(resolved.components.screenHeight, 852)
  assert.ok(resolved.colors.blue)
  assert.ok(resolved.type.body)
  assert.equal(resolved.radius.button, 16)
  assert.ok(Array.isArray(resolved.elevation))

  const compact = resolveFoundation({ system: 'material3', preset: 'compact' })
  assert.equal(compact.preset.elevation, 'none')
  assert.deepEqual(compact.elevation, [])
  assert.equal(compact.components.screenWidth, 393)
})

test('template metadata and instantiation default to iPhone 16 with legacy override', () => {
  assert.equal(TEMPLATE_LIST.find((entry) => entry.id === 'ios-screen').width, 393)
  assert.equal(listTemplates().find((entry) => entry.id === 'ios-screen').height, 852)
  assert.equal(listTemplates('iphone15').find((entry) => entry.id === 'ios-screen').height, 844)
  assert.equal(listTemplates('iphone15')[0].width, 390)

  const phone16 = instantiateTemplate('ios-screen')
  assert.equal(phone16.node.width, 393)
  assert.equal(phone16.node.height, 852)
  const phone15 = instantiateTemplate('ios-screen', { device: 'iphone15' })
  assert.equal(phone15.node.width, 390)
  assert.equal(phone15.node.height, 844)
  assert.equal(phone15.template.device, 'iphone15')
})

test('new page templates are device aware', () => {
  for (const id of ['ios-form-screen', 'ios-list-screen', 'ios-detail-screen']) {
    const { node, template } = instantiateTemplate(id, { device: 'iphone15' })
    assert.equal(node.width, 390)
    assert.equal(node.height, 844)
    assert.equal(template.id, id)
    assert.equal(template.category, 'page')
  }
  const status = instantiateTemplate('ios-status-bar', { device: 'iphone15' }).node
  assert.equal(status.width, 390)
  assert.equal(status.height, 54)
})

test('copied foundation base and presets are valid JSON', async () => {
  const base = JSON.parse(await readFile(new URL('../skills/canvas-ui-design/foundation/base.json', import.meta.url), 'utf8'))
  assert.equal(base.version, 1)
  assert.ok(base.colors.primary)
  for (const name of ['neutral', 'minimal', 'soft', 'compact']) {
    const preset = JSON.parse(await readFile(new URL(`../skills/canvas-ui-design/presets/${name}.json`, import.meta.url), 'utf8'))
    assert.equal(typeof preset, 'object')
  }
})
