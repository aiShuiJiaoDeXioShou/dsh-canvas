/** Property inspector for the current selection or page. */

import * as React from 'react'
import { Button, ColorInput, Field, IconButton, NumberInput, Section, Select, Toggle } from './common.jsx'
import { Icon } from './icons.jsx'
import { assetUrl } from '../api.js'

const SYSTEM_FONTS = ['system-ui', 'Inter', 'Helvetica Neue', 'Arial', 'Georgia', 'Times New Roman', 'Menlo', 'PingFang SC', 'Microsoft YaHei']

function useNode(store) {
  return store.primaryNode()
}

function Update(store, node, patch) {
  if (!node) return
  if (node.instanceId && node.instanceId !== node.key) {
    const allowed = {}
    if ('text' in patch) allowed.text = patch.text
    if ('fills' in patch) allowed.fills = patch.fills
    if ('visible' in patch) allowed.visible = patch.visible
    if (Object.keys(allowed).length) store.setOverride(node.instanceId, node.sourceId, allowed)
    return
  }
  store.updateNode(node.sourceId, patch)
}

function Row({ children, className = '' }) {
  return React.createElement('div', { className: `dshc-row ${className}` }, children)
}

export function Inspector({ store, onNameDialog }) {
  const node = useNode(store)
  const state = store.state
  const doc = state.doc

  if (!node) {
    return React.createElement(
      'div',
      { className: 'dshc-inspector' },
      React.createElement(Section, { title: '画布' },
        React.createElement(Button, { icon: 'sparkle', onClick: () => store.insertPrompt() }, '让 AI 生成 UI'),
        React.createElement(Button, { icon: 'upload', onClick: () => store.zoomToFit() }, '适应画布'),
      ),
    )
  }

  const isInstanceChild = node.instanceId && node.instanceId !== node.key
  const readOnly = isInstanceChild
  const canEdit = node.editable && !readOnly

  if (isInstanceChild) {
    return React.createElement(InstanceOverrideInspector, { store, node })
  }

  return React.createElement(
    'div',
    { className: 'dshc-inspector', 'data-node': node.sourceId },
    React.createElement(
      'div',
      { className: 'dshc-inspector-head' },
      React.createElement(Icon, { name: node.type === 'frame' ? 'frame' : node.type === 'text' ? 'text' : node.type === 'group' ? 'group' : node.type === 'instance' ? 'component' : node.type === 'ellipse' ? 'ellipse' : 'rect', size: 14 }),
      React.createElement('input', {
        className: 'dshc-name-input',
        defaultValue: node.name ?? '',
        key: `${node.sourceId}-name-${node.name}`,
        disabled: !canEdit,
        onBlur: (event) => {
          const value = event.target.value.trim()
          if (value && value !== node.name) store.renameNode(node.sourceId, value)
        },
        onKeyDown: (event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
        },
      }),
      React.createElement('span', { className: 'dshc-type-chip' }, node.type),
    ),

    state.selection.length > 1 &&
      React.createElement(Section, { title: `对齐 · ${state.selection.length} 个图层` },
        React.createElement('div', { className: 'dshc-align-grid' },
          ...[
            ['alignLeft', 'left', '左对齐'],
            ['alignCenterX', 'centerX', '水平居中'],
            ['alignRight', 'right', '右对齐'],
            ['alignTop', 'top', '顶对齐'],
            ['alignCenterY', 'centerY', '垂直居中'],
            ['alignBottom', 'bottom', '底对齐'],
          ].map(([icon, kind, title]) => React.createElement(IconButton, { key: kind, icon, title, onClick: () => store.align(kind) })),
          React.createElement(IconButton, { icon: 'distributeX', title: '水平分布', onClick: () => store.distribute('x') }),
          React.createElement(IconButton, { icon: 'distributeY', title: '垂直分布', onClick: () => store.distribute('y') }),
          React.createElement(IconButton, { icon: 'group', title: '成组 (⌘G)', onClick: () => store.groupSelection() }),
          React.createElement(IconButton, { icon: 'ungroup', title: '解组 (⇧⌘G)', onClick: () => store.ungroupSelection() }),
        ),
      ),

    React.createElement(Section, { title: '位置与尺寸' },
      React.createElement('div', { className: 'dshc-grid-2' },
        React.createElement(Field, { label: 'X' }, React.createElement(NumberInput, { value: round(node.sourceNode.x), disabled: !canEdit, onChange: (value) => Update(store, node, { x: value }) })),
        React.createElement(Field, { label: 'Y' }, React.createElement(NumberInput, { value: round(node.sourceNode.y), disabled: !canEdit, onChange: (value) => Update(store, node, { y: value }) })),
        React.createElement(Field, { label: '宽' }, React.createElement(NumberInput, { value: round(node.sourceNode.width), min: 0, disabled: !canEdit, onChange: (value) => Update(store, node, { width: value }) })),
        React.createElement(Field, { label: '高' }, React.createElement(NumberInput, { value: round(node.sourceNode.height), min: 0, disabled: !canEdit, onChange: (value) => Update(store, node, { height: value }) })),
        React.createElement(Field, { label: '旋转' }, React.createElement(NumberInput, { value: round(node.sourceNode.rotation), disabled: !canEdit, onChange: (value) => Update(store, node, { rotation: value }) })),
        React.createElement(Field, { label: '透明度' }, React.createElement(NumberInput, { value: round(node.sourceNode.opacity ?? 1), min: 0, max: 1, step: 0.05, disabled: !canEdit, onChange: (value) => Update(store, node, { opacity: value }) })),
      ),
      React.createElement(Row, null,
        React.createElement(IconButton, { icon: 'front', title: '置顶', onClick: () => store.reorder('front') }),
        React.createElement(IconButton, { icon: 'back', title: '置底', onClick: () => store.reorder('back') }),
        React.createElement(IconButton, { icon: 'trash', title: '删除', danger: true, onClick: () => store.deleteSelection() }),
      ),
    ),

    (node.type === 'frame' || node.type === 'instance') &&
      React.createElement(Section, { title: '自动布局', right: node.sourceNode.layout ? '已启用' : null },
        node.sourceNode.layout
          ? React.createElement(
              React.Fragment,
              null,
              React.createElement('div', { className: 'dshc-seg' },
                React.createElement(Button, { small: true, active: node.sourceNode.layout.direction === 'horizontal', onClick: () => setLayout(store, node, { direction: 'horizontal' }) }, '横向'),
                React.createElement(Button, { small: true, active: node.sourceNode.layout.direction === 'vertical', onClick: () => setLayout(store, node, { direction: 'vertical' }) }, '纵向'),
              ),
              React.createElement('div', { className: 'dshc-grid-2' },
                React.createElement(Field, { label: '间距' }, React.createElement(NumberInput, { value: node.sourceNode.layout.gap ?? 0, min: 0, onChange: (value) => setLayout(store, node, { gap: value }) })),
                React.createElement(Field, { label: '内边距' }, React.createElement(NumberInput, { value: node.sourceNode.layout.padding?.top ?? 0, min: 0, onChange: (value) => setLayout(store, node, { padding: { ...node.sourceNode.layout.padding, top: value, right: value, bottom: value, left: value } }) })),
                React.createElement(Field, { label: '主轴对齐' }, React.createElement(Select, {
                  value: node.sourceNode.layout.alignPrimary ?? 'start',
                  options: [{ value: 'start', label: '起始' }, { value: 'center', label: '居中' }, { value: 'end', label: '末尾' }, { value: 'space-between', label: '两端' }],
                  onChange: (value) => setLayout(store, node, { alignPrimary: value }),
                })),
                React.createElement(Field, { label: '交叉轴' }, React.createElement(Select, {
                  value: node.sourceNode.layout.alignCounter ?? 'start',
                  options: [{ value: 'start', label: '起始' }, { value: 'center', label: '居中' }, { value: 'end', label: '末尾' }, { value: 'stretch', label: '拉伸' }],
                  onChange: (value) => setLayout(store, node, { alignCounter: value }),
                })),
              ),
              React.createElement(Field, { label: '自身尺寸' },
                React.createElement(Select, {
                  value: node.sourceNode.layoutSizing?.v ?? 'fixed',
                  options: [{ value: 'fixed', label: '固定' }, { value: 'hug', label: '适应内容' }, { value: 'fill', label: '填充' }],
                  onChange: (value) => Update(store, node, { layoutSizing: { ...(node.sourceNode.layoutSizing ?? { h: 'fixed' }), v: value } }),
                }),
              ),
              React.createElement(Button, { small: true, icon: 'close', onClick: () => Update(store, node, { layout: null }) }, '移除自动布局'),
            )
          : React.createElement(Button, { small: true, icon: 'plus', onClick: () => setLayout(store, node, { direction: 'vertical', gap: 8, padding: { top: 12, right: 12, bottom: 12, left: 12 }, alignPrimary: 'start', alignCounter: 'start' }) }, '添加自动布局'),
      ),

    node.parent?.layout &&
      React.createElement(Section, { title: '布局子项' },
        React.createElement('div', { className: 'dshc-grid-2' },
          React.createElement(Field, { label: '水平' }, React.createElement(Select, {
            value: node.sourceNode.layoutSizing?.h ?? 'fixed',
            options: [{ value: 'fixed', label: '固定' }, { value: 'hug', label: '适应' }, { value: 'fill', label: '填充' }],
            onChange: (value) => Update(store, node, { layoutSizing: { ...(node.sourceNode.layoutSizing ?? { v: 'fixed' }), h: value } }),
          })),
          React.createElement(Field, { label: '垂直' }, React.createElement(Select, {
            value: node.sourceNode.layoutSizing?.v ?? 'fixed',
            options: [{ value: 'fixed', label: '固定' }, { value: 'hug', label: '适应' }, { value: 'fill', label: '填充' }],
            onChange: (value) => Update(store, node, { layoutSizing: { ...(node.sourceNode.layoutSizing ?? { h: 'fixed' }), v: value } }),
          })),
        ),
      ),

    node.type === 'text' &&
      React.createElement(Section, { title: '文本' },
        React.createElement('textarea', {
          className: 'dshc-textarea',
          value: node.sourceNode.text ?? '',
          onChange: (event) => Update(store, node, { text: event.target.value }),
          rows: 3,
          disabled: !canEdit,
        }),
        React.createElement('div', { className: 'dshc-grid-2' },
          React.createElement(Field, { label: '字体' }, React.createElement(Select, {
            value: node.sourceNode.font?.family ?? 'system-ui',
            options: [...new Set([...SYSTEM_FONTS, ...(doc.fonts ?? []).map((font) => font.family), node.sourceNode.font?.family].filter(Boolean))].map((family) => ({ value: family, label: family })),
            onChange: (family) => Update(store, node, { font: { ...(node.sourceNode.font ?? {}), family } }),
          })),
          React.createElement(Field, { label: '字重' }, React.createElement(Select, {
            value: String(node.sourceNode.font?.weight ?? 400),
            options: [100, 200, 300, 400, 500, 600, 700, 800, 900].map((weight) => ({ value: String(weight), label: String(weight) })),
            onChange: (weight) => Update(store, node, { font: { ...(node.sourceNode.font ?? {}), weight: Number(weight) } }),
          })),
          React.createElement(Field, { label: '字号' }, React.createElement(NumberInput, { value: round(node.sourceNode.font?.size ?? 14), min: 1, onChange: (value) => Update(store, node, { font: { ...(node.sourceNode.font ?? {}), size: value } }) })),
          React.createElement(Field, { label: '行高' }, React.createElement(NumberInput, { value: round(node.sourceNode.font?.lineHeight ?? 1.4), min: 0.5, step: 0.1, onChange: (value) => Update(store, node, { font: { ...(node.sourceNode.font ?? {}), lineHeight: value } }) })),
          React.createElement(Field, { label: '字距' }, React.createElement(NumberInput, { value: round(node.sourceNode.font?.letterSpacing ?? 0), step: 0.1, onChange: (value) => Update(store, node, { font: { ...(node.sourceNode.font ?? {}), letterSpacing: value } }) })),
          React.createElement(Field, { label: '对齐' }, React.createElement(Select, {
            value: node.sourceNode.align ?? 'left',
            options: [{ value: 'left', label: '左' }, { value: 'center', label: '中' }, { value: 'right', label: '右' }, { value: 'justify', label: '两端' }],
            onChange: (value) => Update(store, node, { align: value }),
          })),
        ),
        React.createElement(Row, null,
          React.createElement('span', { className: 'dshc-field-label' }, '自动高度'),
          React.createElement(Toggle, { value: node.sourceNode.autoHeight !== false, onChange: (value) => Update(store, node, { autoHeight: value }) }),
        ),
      ),

    !readOnly && ['frame', 'rect', 'ellipse', 'text'].includes(node.type) &&
      React.createElement(Section, { title: '填充' },
        (node.sourceNode.fills ?? []).map((fill, index) => React.createElement(FillEditor, {
          key: index,
          fill,
          index,
          store,
          node,
          onChange: (next) => {
            const fills = (node.sourceNode.fills ?? []).slice()
            fills[index] = next
            Update(store, node, { fills })
          },
          onRemove: () => {
            const fills = (node.sourceNode.fills ?? []).filter((_, entryIndex) => entryIndex !== index)
            Update(store, node, { fills })
          },
          onCrop: () => store.beginCrop(node.key, index),
        })),
        React.createElement('div', { className: 'dshc-row' },
          React.createElement(Button, { small: true, icon: 'plus', onClick: () => Update(store, node, { fills: [...(node.sourceNode.fills ?? []), { type: 'solid', color: '#D9D9D9' }] }) }, '纯色'),
          React.createElement(Button, { small: true, icon: 'plus', onClick: () => Update(store, node, { fills: [...(node.sourceNode.fills ?? []), { type: 'linear-gradient', angle: 180, stops: [{ position: 0, color: '#4D6BFE' }, { position: 1, color: '#8B9DFF' }] }] }) }, '渐变'),
        ),
      ),

    !readOnly && ['frame', 'rect', 'ellipse', 'line'].includes(node.type) &&
      React.createElement(Section, { title: '描边' },
        (node.sourceNode.strokes ?? []).map((stroke, index) => React.createElement(
          'div',
          { key: index, className: 'dshc-fill-row' },
          React.createElement(ColorInput, { value: stroke.color, onChange: (color) => {
            const strokes = (node.sourceNode.strokes ?? []).slice()
            strokes[index] = { ...stroke, color }
            Update(store, node, { strokes })
          } }),
          React.createElement(NumberInput, { value: stroke.width, min: 0, onChange: (width) => {
            const strokes = (node.sourceNode.strokes ?? []).slice()
            strokes[index] = { ...stroke, width }
            Update(store, node, { strokes })
          } }),
          React.createElement(IconButton, { icon: 'trash', title: '删除描边', size: 13, onClick: () => {
            const strokes = (node.sourceNode.strokes ?? []).filter((_, entryIndex) => entryIndex !== index)
            Update(store, node, { strokes })
          } }),
        )),
        React.createElement(Button, { small: true, icon: 'plus', onClick: () => Update(store, node, { strokes: [...(node.sourceNode.strokes ?? []), { color: '#94A3B8', width: 1, align: 'center' }] }) }, '添加描边'),
      ),

    !readOnly && React.createElement(Section, { title: '效果' },
      (node.sourceNode.effects ?? []).map((effect, index) => React.createElement(EffectEditor, {
        key: index,
        effect,
        onChange: (next) => {
          const effects = (node.sourceNode.effects ?? []).slice()
          effects[index] = next
          Update(store, node, { effects })
        },
        onRemove: () => Update(store, node, { effects: (node.sourceNode.effects ?? []).filter((_, entryIndex) => entryIndex !== index) }),
      })),
      React.createElement('div', { className: 'dshc-row' },
        React.createElement(Button, { small: true, icon: 'plus', onClick: () => Update(store, node, { effects: [...(node.sourceNode.effects ?? []), { type: 'drop-shadow', x: 0, y: 8, blur: 24, spread: 0, color: '#00000040' }] }) }, '投影'),
        React.createElement(Button, { small: true, icon: 'plus', onClick: () => Update(store, node, { effects: [...(node.sourceNode.effects ?? []), { type: 'inner-shadow', x: 0, y: 2, blur: 8, spread: 0, color: '#00000033' }] }) }, '内阴影'),
        React.createElement(Button, { small: true, icon: 'plus', onClick: () => Update(store, node, { effects: [...(node.sourceNode.effects ?? []), { type: 'layer-blur', radius: 4 }] }) }, '模糊'),
        React.createElement(Button, { small: true, icon: 'plus', onClick: () => Update(store, node, { effects: [...(node.sourceNode.effects ?? []), { type: 'background-blur', radius: 10 }] }) }, '背景模糊'),
      ),
    ),

    !readOnly && (node.type === 'frame' || node.type === 'rect' || node.type === 'ellipse' || node.type === 'instance') &&
      React.createElement(Section, { title: '外观' },
        React.createElement(Field, { label: '圆角' }, React.createElement(NumberInput, { value: round(node.type === 'instance' ? node.cornerRadius ?? node.sourceNode.cornerRadius ?? 0 : node.sourceNode.cornerRadius ?? 0), min: 0, onChange: (value) => Update(store, node, { cornerRadius: value }) })),
        node.type === 'frame' &&
          React.createElement(Row, null,
            React.createElement('span', { className: 'dshc-field-label' }, '裁剪内容'),
            React.createElement(Toggle, { value: node.sourceNode.clip !== false, onChange: (value) => Update(store, node, { clip: value }) }),
          ),
      ),

    node.type === 'instance' &&
      React.createElement(InstanceSection, { store, node, doc }),

    !isInstanceChild &&
      React.createElement(Section, { title: '样式' },
        React.createElement(ApplyStyleRow, { store, node, type: 'fill', label: '填充样式' }),
        node.type === 'text' && React.createElement(ApplyStyleRow, { store, node, type: 'text', label: '文本样式' }),
        React.createElement(ApplyStyleRow, { store, node, type: 'effect', label: '效果样式' }),
        React.createElement('div', { className: 'dshc-row' },
          React.createElement(Button, { small: true, onClick: () => onNameDialog?.({ title: '创建填充样式', label: '样式名称', defaultValue: node.name + ' fill', onSubmit: (name) => store.createStyle('fill', name) }) }, '从填充创建样式'),
          node.type === 'text' && React.createElement(Button, { small: true, onClick: () => onNameDialog?.({ title: '创建文本样式', label: '样式名称', defaultValue: node.name + ' text', onSubmit: (name) => store.createStyle('text', name) }) }, '创建文本样式'),
        ),
      ),

    node.type === 'frame' || node.type === 'group'
      ? React.createElement(Section, { title: '组件' },
          React.createElement(Button, { small: true, icon: 'component', onClick: () => onNameDialog?.({ title: '创建组件', label: '组件名称', defaultValue: node.name, onSubmit: (name) => store.createComponentFromSelection(name) }) }, '从选区创建组件'),
          node.type === 'group' && React.createElement(Button, { small: true, icon: 'ungroup', onClick: () => store.ungroupSelection() }, '解组'),
        )
      : null,

    node.type === 'instance' && React.createElement(InstanceOverrides, { store, node, doc }),

    React.createElement(Section, { title: '代码', defaultOpen: false },
      React.createElement('div', { className: 'dshc-row' },
        React.createElement(Button, { small: true, icon: 'copy', onClick: () => {
          const css = cssForNode(store, node)
          navigator.clipboard?.writeText(css)
          store.toast('已复制 CSS')
        } }, '复制 CSS'),
      ),
      React.createElement('pre', { className: 'dshc-code' }, cssForNode(store, node)),
    ),
  )
}

function cssForNode(store, node) {
  if (!node) return ''
  const lines = []
  const push = (property, value) => {
    if (value == null || value === '' || value === 'none') return
    lines.push(`  ${property}: ${value};`)
  }
  if (node.type !== 'group') {
    push('width', `${round(node.width)}px`)
    push('height', `${round(node.height)}px`)
  }
  const fill = (node.fills ?? [])[0]
  if (node.type !== 'text') {
    if (fill?.type === 'solid' && fill.color) push('background', fill.color)
    if (fill?.type === 'linear-gradient' && Array.isArray(fill.stops)) {
      const stops = fill.stops.map((stop) => `${stop.color} ${Math.round(stop.position * 100)}%`).join(', ')
      push('background', `linear-gradient(${round(fill.angle ?? 180)}deg, ${stops})`)
    }
    if (fill?.type === 'radial-gradient' && Array.isArray(fill.stops)) {
      const stops = fill.stops.map((stop) => `${stop.color} ${Math.round(stop.position * 100)}%`).join(', ')
      push('background', `radial-gradient(circle, ${stops})`)
    }
    if (fill?.type === 'image' && fill.asset) push('background-image', `url("${assetUrl(store.sessionId, store.state.name, fill.asset)}")`)
  }
  if (node.cornerRadius) push('border-radius', `${round(node.cornerRadius)}px`)
  const stroke = (node.strokes ?? [])[0]
  if (stroke) push('border', `${round(stroke.width ?? 1)}px solid ${stroke.color ?? '#000000'}`)
  const shadows = []
  const filters = []
  for (const effect of node.effects ?? []) {
    if (effect.type === 'drop-shadow') shadows.push(`${round(effect.x ?? 0)}px ${round(effect.y ?? 0)}px ${round(effect.blur ?? 0)}px ${round(effect.spread ?? 0)}px ${effect.color ?? '#00000033'}`)
    if (effect.type === 'inner-shadow') shadows.push(`inset ${round(effect.x ?? 0)}px ${round(effect.y ?? 0)}px ${round(effect.blur ?? 0)}px ${round(effect.spread ?? 0)}px ${effect.color ?? '#00000033'}`)
    if (effect.type === 'layer-blur') filters.push(`blur(${round(effect.radius ?? 0)}px)`)
  }
  if (shadows.length) push('box-shadow', shadows.join(', '))
  if (filters.length) push('filter', filters.join(' '))
  if (node.type === 'text') {
    const font = node.font ?? {}
    push('font-family', `'${font.family ?? 'system-ui'}'`)
    push('font-size', `${round(font.size ?? 14)}px`)
    push('font-weight', `${font.weight ?? 400}`)
    push('line-height', `${Math.round((font.lineHeight ?? 1.4) * 100)}%`)
    push('letter-spacing', `${round(font.letterSpacing ?? 0)}px`)
    const color = fill?.type === 'solid' ? fill.color : null
    if (color) push('color', color)
    push('text-align', node.align === 'center' ? 'center' : node.align === 'right' ? 'right' : 'left')
  }
  const layout = node.layout
  if (layout && node.type === 'frame') {
    push('display', 'flex')
    push('flex-direction', layout.direction === 'horizontal' ? 'row' : 'column')
    if (layout.gap) push('gap', `${round(layout.gap)}px`)
    const padding = layout.padding
    if (padding) push('padding', `${round(padding.top ?? 0)}px ${round(padding.right ?? 0)}px ${round(padding.bottom ?? 0)}px ${round(padding.left ?? 0)}px`)
  }
  if (node.opacity != null && node.opacity < 1) push('opacity', String(node.opacity))
  if (!lines.length) return '/* 暂无可导出的 CSS 属性 */'
  return `/* ${node.type} · ${node.name ?? ''} */\n.${String(node.name || node.type).replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'node'} {\n${lines.join('\n')}\n}`
}

function InstanceOverrideInspector({ store, node }) {
  const patch = (value) => store.setOverride(node.instanceId, node.sourceId, value)
  const reset = () => store.mutate((docValue) => {
    const instance = deepFindNode(docValue, node.instanceId)
    if (instance?.overrides) delete instance.overrides[node.sourceId]
  })
  const solid = (node.fills ?? []).find((fill) => fill.type === 'solid')
  return React.createElement(
    'div',
    { className: 'dshc-inspector' },
    React.createElement(
      'div',
      { className: 'dshc-inspector-head' },
      React.createElement(Icon, { name: 'component', size: 14 }),
      React.createElement('span', { className: 'dshc-instance-title' }, node.name),
      React.createElement('span', { className: 'dshc-type-chip' }, '覆盖'),
    ),
    React.createElement(
      Section,
      { title: '实例覆盖' },
      React.createElement('div', { className: 'dshc-help' }, `实例 ${node.instanceId} · 源节点 ${node.sourceId}`),
      node.type === 'text' &&
        React.createElement('textarea', {
          className: 'dshc-textarea',
          value: node.sourceNode.text ?? '',
          rows: 3,
          onChange: (event) => patch({ text: event.target.value }),
        }),
      solid &&
        React.createElement(Field, { label: '填充颜色', wide: true },
          React.createElement(ColorInput, {
            value: solid.color,
            onChange: (color) => {
              const fills = (node.fills ?? []).map((fill, index) => (index === 0 ? { ...fill, color } : fill))
              patch({ fills })
            },
          }),
        ),
      React.createElement(Row, null,
        React.createElement('span', { className: 'dshc-field-label' }, '可见'),
        React.createElement(Toggle, { value: node.visible !== false, onChange: (visible) => patch({ visible }) }),
      ),
      React.createElement('div', { className: 'dshc-row' },
        React.createElement(Button, { small: true, icon: 'reset', onClick: reset }, '重置此节点覆盖'),
        React.createElement(Button, { small: true, icon: 'ungroup', onClick: () => store.exitInstance() }, '退出实例'),
        React.createElement(Button, { small: true, icon: 'trash', onClick: () => store.detachInstance(node.instanceId) }, '分离'),
      ),
    ),
  )
}

function setLayout(store, node, patch) {
  const current = node.sourceNode.layout ?? {
    direction: 'vertical',
    gap: 0,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    alignPrimary: 'start',
    alignCounter: 'start',
  }
  const next = {
    ...current,
    ...patch,
    padding: { ...(current.padding ?? {}), ...(patch.padding ?? {}) },
  }
  store.updateNode(node.sourceId, { layout: next })
}

function round(value) {
  return Math.round((Number(value) || 0) * 100) / 100
}

function countNodes(nodes) {
  return nodes.reduce((total, node) => total + 1 + countNodes(node.children ?? []), 0)
}

function FillEditor({ fill, onChange, onRemove, onCrop, store, node, index }) {
  const type = fill.type
  const fileRef = React.useRef(null)
  return React.createElement(
    'div',
    { className: 'dshc-fill-editor' },
    React.createElement(
      'div',
      { className: 'dshc-fill-row' },
      React.createElement(Select, {
        value: type,
        options: [
          { value: 'solid', label: '纯色' },
          { value: 'linear-gradient', label: '线性渐变' },
          { value: 'radial-gradient', label: '径向渐变' },
          { value: 'image', label: '图片' },
        ],
        onChange: (nextType) => {
          if (nextType === 'solid') onChange({ type: 'solid', color: '#D9D9D9', opacity: 1 })
          else if (nextType === 'linear-gradient') onChange({ type: 'linear-gradient', angle: 180, stops: [{ position: 0, color: '#4D6BFE' }, { position: 1, color: '#8B9DFF' }] })
          else if (nextType === 'radial-gradient') onChange({ type: 'radial-gradient', center: { x: 0.5, y: 0.5 }, radius: 0.7, stops: [{ position: 0, color: '#FFFFFF' }, { position: 1, color: '#00000000' }] })
          else onChange({ type: 'image', asset: fill.asset ?? 'assets/missing.png', fit: 'cover' })
        },
      }),
      React.createElement(IconButton, { icon: 'trash', title: '删除填充', size: 13, onClick: onRemove }),
    ),
    type === 'solid' &&
      React.createElement('div', { className: 'dshc-fill-row' },
        React.createElement(ColorInput, { value: fill.color, onChange: (color) => onChange({ ...fill, color }) }),
        React.createElement(NumberInput, { value: round(fill.opacity ?? 1), min: 0, max: 1, step: 0.05, onChange: (opacity) => onChange({ ...fill, opacity }) }),
      ),
    (type === 'linear-gradient' || type === 'radial-gradient') &&
      React.createElement(
        React.Fragment,
        null,
        type === 'linear-gradient'
          ? React.createElement(Field, { label: '角度' }, React.createElement(NumberInput, { value: round(fill.angle ?? 180), onChange: (angle) => onChange({ ...fill, angle }) }))
          : null,
        (fill.stops ?? []).map((stop, index) => React.createElement(
          'div',
          { key: index, className: 'dshc-stop-row' },
          React.createElement(ColorInput, { value: stop.color, onChange: (color) => {
            const stops = fill.stops.slice()
            stops[index] = { ...stop, color }
            onChange({ ...fill, stops })
          } }),
          React.createElement(NumberInput, { value: round(stop.position), min: 0, max: 1, step: 0.05, onChange: (position) => {
            const stops = fill.stops.slice()
            stops[index] = { ...stop, position }
            onChange({ ...fill, stops })
          } }),
          React.createElement(IconButton, {
            icon: 'close',
            title: '删除停止点',
            size: 12,
            onClick: () => {
              if ((fill.stops ?? []).length <= 2) return
              onChange({ ...fill, stops: fill.stops.filter((_, entryIndex) => entryIndex !== index) })
            },
          }),
        )),
        React.createElement(Button, { small: true, icon: 'plus', onClick: () => onChange({ ...fill, stops: [...(fill.stops ?? []), { position: 0.5, color: '#FFFFFF' }] }) }, '添加停止点'),
      ),
    type === 'image' &&
      React.createElement(
        React.Fragment,
        null,
        React.createElement('div', { className: 'dshc-fill-row' },
          React.createElement('span', { className: 'dshc-muted' }, fill.asset ?? '无图片'),
          React.createElement(Select, {
            value: fill.fit ?? 'cover',
            options: [{ value: 'cover', label: '覆盖' }, { value: 'contain', label: '包含' }, { value: 'fill', label: '拉伸' }],
            onChange: (fit) => onChange({ ...fill, fit }),
          }),
          React.createElement(Button, { small: true, onClick: onCrop }, '裁剪'),
        ),
        React.createElement(
          'div',
          { className: 'dshc-fill-row' },
          React.createElement('input', {
            ref: fileRef,
            type: 'file',
            accept: 'image/png,image/jpeg,image/webp,image/gif',
            style: { display: 'none' },
            onChange: (event) => {
              const file = event.target.files?.[0]
              if (file && store && node) store.uploadFillImage(node.sourceId, index, file)
              event.target.value = ''
            },
          }),
          React.createElement(Button, { small: true, icon: 'upload', onClick: () => fileRef.current?.click() }, '上传图片填充'),
        ),
      ),
  )
}

function EffectEditor({ effect, onChange, onRemove }) {
  return React.createElement(
    'div',
    { className: 'dshc-effect-editor' },
    React.createElement(
      'div',
      { className: 'dshc-fill-row' },
      React.createElement(Select, {
        value: effect.type,
        options: [
          { value: 'drop-shadow', label: '投影' },
          { value: 'inner-shadow', label: '内阴影' },
          { value: 'layer-blur', label: '图层模糊' },
          { value: 'background-blur', label: '背景模糊' },
        ],
        onChange: (type) => {
          if (type === 'layer-blur' || type === 'background-blur') onChange({ type, radius: effect.radius ?? 6 })
          else onChange({ type, x: effect.x ?? 0, y: effect.y ?? 8, blur: effect.blur ?? 24, spread: effect.spread ?? 0, color: effect.color ?? '#00000040' })
        },
      }),
      React.createElement(IconButton, { icon: 'trash', title: '删除效果', size: 13, onClick: onRemove }),
    ),
    effect.type === 'layer-blur' || effect.type === 'background-blur'
      ? React.createElement(Field, { label: '半径' }, React.createElement(NumberInput, { value: round(effect.radius ?? 0), min: 0, onChange: (radius) => onChange({ ...effect, radius }) }))
      : React.createElement(
          'div',
          { className: 'dshc-grid-2' },
          React.createElement(Field, { label: 'X' }, React.createElement(NumberInput, { value: round(effect.x ?? 0), onChange: (x) => onChange({ ...effect, x }) })),
          React.createElement(Field, { label: 'Y' }, React.createElement(NumberInput, { value: round(effect.y ?? 0), onChange: (y) => onChange({ ...effect, y }) })),
          React.createElement(Field, { label: '模糊' }, React.createElement(NumberInput, { value: round(effect.blur ?? 0), min: 0, onChange: (blur) => onChange({ ...effect, blur }) })),
          React.createElement(Field, { label: '扩散' }, React.createElement(NumberInput, { value: round(effect.spread ?? 0), onChange: (spread) => onChange({ ...effect, spread }) })),
          React.createElement(Field, { label: '颜色', wide: true }, React.createElement(ColorInput, { value: effect.color ?? '#00000040', onChange: (color) => onChange({ ...effect, color }) })),
        ),
  )
}

function ApplyStyleRow({ store, node, type, label }) {
  const styles = (store.state.doc.styles ?? []).filter((style) => style.type === type)
  const key = type === 'fill' ? 'fillStyleId' : type === 'text' ? 'textStyleId' : 'effectStyleId'
  const appliedId = node.sourceNode?.[key] ?? ''
  const applied = appliedId ? styles.find((style) => style.id === appliedId) ?? (store.state.doc.styles ?? []).find((style) => style.id === appliedId) : null
  const options = [
    { value: '', label: appliedId ? '移除样式' : styles.length ? '应用样式…' : '暂无样式' },
    ...styles.map((style) => ({ value: style.id, label: style.name })),
  ]
  if (appliedId && !options.some((option) => option.value === appliedId) && applied) {
    options.push({ value: appliedId, label: applied.name })
  }
  return React.createElement(Field, { label, wide: true },
    React.createElement(Select, {
      value: appliedId,
      disabled: !styles.length && !appliedId,
      options,
      onChange: (styleId) => {
        if (!styleId) {
          store.updateNode(node.sourceId, { [key]: null })
          return
        }
        store.setSelection([node.key])
        store.applyStyle(styleId)
      },
    }),
  )
}

function InstanceSection({ store, node, doc }) {
  const component = doc.components.find((entry) => entry.id === node.sourceNode.componentId)
  const set = component?.variantSetId ? doc.variantSets.find((entry) => entry.id === component.variantSetId) : null
  return React.createElement(
    Section,
    { title: '实例' },
    React.createElement('div', { className: 'dshc-stat-line' }, `主组件：${component?.name ?? node.sourceNode.componentId}`),
    set &&
      set.properties.map((property) =>
        React.createElement(Field, { key: property.name, label: property.name, wide: true },
          React.createElement(Select, {
            value: node.sourceNode.variantProps?.[property.name] ?? property.values[0],
            options: property.values.map((value) => ({ value, label: value })),
            onChange: (value) => store.setVariant(node.sourceId, property.name, value),
          }),
        ),
      ),
    React.createElement(Field, { label: '换组件', wide: true },
      React.createElement(Select, {
        value: node.sourceNode.componentId,
        options: doc.components.map((entry) => ({ value: entry.id, label: entry.name })),
        onChange: (componentId) => store.swapComponent(node.sourceId, componentId),
      }),
    ),
    React.createElement('div', { className: 'dshc-row' },
      React.createElement(Button, { small: true, icon: 'component', onClick: () => component && store.editComponent(component.id) }, '编辑主组件'),
      React.createElement(Button, { small: true, icon: 'ungroup', onClick: () => store.enterInstance(node.key) }, '进入实例'),
      React.createElement(Button, { small: true, icon: 'ungroup', onClick: () => store.detachInstance(node.sourceId) }, '分离'),
    ),
  )
}

function InstanceOverrides({ store, node, doc }) {
  const overrides = node.sourceNode.overrides ?? {}
  const count = Object.keys(overrides).length
  return React.createElement(
    Section,
    { title: '实例覆盖', right: count ? `${count}` : null },
    count
      ? React.createElement(
          'div',
          null,
          Object.entries(overrides).map(([sourceId, patch]) =>
            React.createElement(
              'div',
              { key: sourceId, className: 'dshc-override-row' },
              React.createElement('span', { className: 'dshc-muted' }, sourceId),
              React.createElement(Button, {
                small: true,
                onClick: () => {
                  store.mutate((docValue) => {
                    const instance = deepFindNode(docValue, node.sourceId)
                    if (instance?.overrides) delete instance.overrides[sourceId]
                  })
                },
              }, '重置'),
            ),
          ),
        )
      : React.createElement('div', { className: 'dshc-help' }, '双击进入实例，修改文本/填充/显隐后生成覆盖。'),
    React.createElement(Button, { small: true, icon: 'reset', onClick: () => store.mutate((docValue) => {
      const instance = deepFindNode(docValue, node.sourceId)
      if (instance) instance.overrides = {}
    }) }, '重置全部覆盖'),
  )
}

function deepFindNode(doc, id) {
  for (const page of doc.pages ?? []) {
    const found = findIn(page.children, id)
    if (found) return found
  }
  for (const component of doc.components ?? []) {
    if (component.root.id === id) return component.root
    const found = findIn(component.root.children ?? [], id)
    if (found) return found
  }
  return null
}

function findIn(nodes, id) {
  for (const node of nodes ?? []) {
    if (node.id === id) return node
    const found = findIn(node.children, id)
    if (found) return found
  }
  return null
}
