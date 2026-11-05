/** Side panels: components/variants, styles, fonts, comments. */

import * as React from 'react'
import { Button, Empty, Field, IconButton, NumberInput, Select } from './common.jsx'
import { TEMPLATE_LIST } from '../../../lib/templates.js'
import { getDevice } from '../../../lib/foundation.js'
import { Icon } from './icons.jsx'

export function TemplatesPanel({ store }) {
  const device = getDevice(store.state.foundation?.device)
  const groups = [
    ['页面', TEMPLATE_LIST.filter((entry) => entry.category === 'page')],
    ['系统栏', TEMPLATE_LIST.filter((entry) => entry.category !== 'page')],
  ]
  return React.createElement(
    'div',
    { className: 'dshc-panel' },
    React.createElement('div', { className: 'dshc-panel-title' }, '模板', React.createElement('span', { className: 'dshc-panel-count' }, TEMPLATE_LIST.length)),
    React.createElement('div', { className: 'dshc-row dshc-template-device' },
      React.createElement('span', { className: 'dshc-field-label' }, '设备'),
      React.createElement(Select, {
        value: device.id,
        options: [
          { value: 'iphone16', label: 'iPhone 16 · 393×852' },
          { value: 'iphone15', label: 'iPhone 15 · 390×844' },
        ],
        onChange: (id) => store.setFoundation({ device: id }),
      }),
    ),
    groups.map(([label, entries]) =>
      React.createElement(
        'div',
        { key: label, className: 'dshc-panel-group' },
        React.createElement('div', { className: 'dshc-panel-subtitle' }, label),
        React.createElement(
          'div',
          { className: 'dshc-template-list' },
          entries.map((template) =>
            React.createElement(
              'div',
              { key: template.id, className: 'dshc-template-row', title: template.description },
              React.createElement(
                'div',
                { className: 'dshc-template-info' },
                React.createElement('div', { className: 'dshc-template-name' }, template.name),
                React.createElement(
                  'div',
                  { className: 'dshc-template-meta' },
                  `${template.system} · ${device.width}×${template.category === 'page' ? device.height : template.height}`,
                ),
              ),
              React.createElement(IconButton, {
                icon: 'plus',
                title: `插入${template.name}`,
                size: 16,
                onClick: () => store.insertTemplate(template.id),
              }),
            ),
          ),
        ),
      ),
    ),
  )
}

function usageCount(store, predicate) {
  let total = 0
  const scan = (node) => {
    if (predicate(node)) total += 1
    for (const child of node.children ?? []) scan(child)
  }
  for (const page of store.state.doc?.pages ?? []) page.children.forEach(scan)
  for (const component of store.state.doc?.components ?? []) scan(component.root)
  return total
}

export function ComponentsPanel({ store, onNeedName }) {
  const doc = store.state.doc
  const [checked, setChecked] = React.useState([])
  if (!doc) return null
  const components = doc.components ?? []
  const sets = doc.variantSets ?? []
  const selectionNode = store.primaryNode()
  const canCreate = selectionNode && (selectionNode.type === 'frame' || selectionNode.type === 'group') && selectionNode.editable
  return React.createElement(
    'div',
    { className: 'dshc-panel' },
    React.createElement('div', { className: 'dshc-panel-title' }, '组件', React.createElement('span', { className: 'dshc-panel-count' }, components.length)),
    React.createElement(
      'div',
      { className: 'dshc-panel-actions' },
      React.createElement(Button, {
        small: true,
        icon: 'component',
        disabled: !canCreate,
        onClick: () => onNeedName?.({ title: '创建组件', label: '组件名称', defaultValue: selectionNode?.name ?? 'Component', onSubmit: (name) => store.createComponentFromSelection(name) }),
      }, '从选区创建'),
      React.createElement(Button, {
        small: true,
        icon: 'layers',
        disabled: checked.length < 2,
        onClick: () => store.createVariantSet(checked),
      }, '合并为变体'),
    ),
    sets.length > 0 &&
      React.createElement(
        'div',
        { className: 'dshc-panel-group' },
        React.createElement('div', { className: 'dshc-panel-subtitle' }, '变体集'),
        sets.map((set) =>
          React.createElement(
            'div',
            { key: set.id, className: 'dshc-set-card' },
            React.createElement('div', { className: 'dshc-set-name' }, set.name),
            set.properties.map((property) => React.createElement('div', { key: property.name, className: 'dshc-muted' }, `${property.name}: ${property.values.join(' / ')}`)),
            React.createElement(
              'div',
              { className: 'dshc-set-variants' },
              set.componentIds.map((componentId) => {
                const component = components.find((entry) => entry.id === componentId)
                if (!component) return null
                return React.createElement(
                  'button',
                  { key: componentId, type: 'button', className: 'dshc-variant-chip', onClick: () => store.insertInstance(componentId) },
                  component.variantProps?.State ?? component.name,
                )
              }),
            ),
          ),
        ),
      ),
    React.createElement(
      'div',
      { className: 'dshc-panel-group' },
      React.createElement('div', { className: 'dshc-panel-subtitle' }, '组件'),
      components.length === 0
        ? React.createElement(Empty, { icon: 'component', title: '还没有组件', text: '选中一个 Frame，点“从选区创建”。' })
        : components.map((component) =>
            React.createElement(
              'div',
              { key: component.id, className: 'dshc-list-row' },
              React.createElement('input', {
                type: 'checkbox',
                checked: checked.includes(component.id),
                onChange: (event) => setChecked(event.target.checked ? [...checked, component.id] : checked.filter((id) => id !== component.id)),
              }),
              React.createElement(Icon, { name: 'component', size: 13 }),
              React.createElement('span', { className: 'dshc-list-name' }, component.name),
              React.createElement(IconButton, { icon: 'plus', title: '插入实例', size: 13, onClick: () => store.insertInstance(component.id) }),
              React.createElement(IconButton, { icon: 'text', title: '编辑主组件', size: 13, onClick: () => store.editComponent(component.id) }),
              React.createElement(IconButton, {
                icon: 'trash',
                title: '删除组件',
                size: 13,
                danger: true,
                onClick: () => {
                  const used = store.state.scene ? usageCount(store, (node) => node.type === 'instance' && node.sourceNode?.componentId === component.id) : 0
                  if (used) {
                    store.toast(`有 ${used} 个实例在使用，无法删除`)
                    return
                  }
                  store.mutate((docValue) => {
                    docValue.components = docValue.components.filter((entry) => entry.id !== component.id)
                    docValue.variantSets = docValue.variantSets.filter((set) => !set.componentIds.includes(component.id))
                  })
                },
              }),
            ),
          ),
    ),
  )
}

export function StylesPanel({ store, onNeedName }) {
  const doc = store.state.doc
  if (!doc) return null
  const groups = [
    ['fill', '填充'],
    ['text', '文本'],
    ['effect', '效果'],
  ]
  return React.createElement(
    'div',
    { className: 'dshc-panel' },
    React.createElement('div', { className: 'dshc-panel-title' }, '样式库', React.createElement('span', { className: 'dshc-panel-count' }, doc.styles?.length ?? 0)),
    React.createElement(
      'div',
      { className: 'dshc-panel-group' },
      React.createElement('div', { className: 'dshc-panel-subtitle' }, '内置规范'),
      React.createElement(
        'div',
        { className: 'dshc-panel-actions' },
        React.createElement(Button, { small: true, icon: 'styles', title: '加载 Material 3 的填充/文本/效果样式到当前文档', onClick: () => store.loadDesignSystem('material3') }, 'Material 3'),
        React.createElement(Button, { small: true, icon: 'styles', title: '加载 iOS HIG 的填充/文本/效果样式到当前文档', onClick: () => store.loadDesignSystem('ios') }, 'iOS HIG'),
      ),
      React.createElement('div', { className: 'dshc-help' }, '加入下方样式库，可应用到图层；不会自动修改现有图层。'),
    ),
    React.createElement(
      'div',
      { className: 'dshc-panel-actions' },
      React.createElement(Button, { small: true, icon: 'plus', onClick: () => onNeedName?.({ title: '创建填充样式', label: '样式名称', defaultValue: 'Brand/Primary', onSubmit: (name) => store.createStyle('fill', name) }) }, '填充'),
      React.createElement(Button, { small: true, icon: 'plus', onClick: () => onNeedName?.({ title: '创建文本样式', label: '样式名称', defaultValue: 'Text/Body', onSubmit: (name) => store.createStyle('text', name) }) }, '文本'),
      React.createElement(Button, { small: true, icon: 'plus', onClick: () => onNeedName?.({ title: '创建效果样式', label: '样式名称', defaultValue: 'Shadow/Card', onSubmit: (name) => store.createStyle('effect', name) }) }, '效果'),
    ),
    groups.map(([type, label]) =>
      React.createElement(
        'div',
        { key: type, className: 'dshc-panel-group' },
        React.createElement('div', { className: 'dshc-panel-subtitle' }, label),
        (doc.styles ?? []).filter((style) => style.type === type).length === 0
          ? React.createElement('div', { className: 'dshc-muted dshc-pad' }, '暂无样式')
          : (doc.styles ?? []).filter((style) => style.type === type).map((style) => {
              const usage = usageCount(store, (node) =>
                (type === 'fill' && node.fillStyleId === style.id) ||
                (type === 'text' && node.textStyleId === style.id) ||
                (type === 'effect' && node.effectStyleId === style.id),
              )
              return React.createElement(
                'div',
                { key: style.id, className: 'dshc-list-row' },
                React.createElement('span', { className: `dshc-style-dot dshc-style-${type}` }),
                React.createElement('span', { className: 'dshc-list-name' }, style.name),
                React.createElement('span', { className: 'dshc-muted' }, `${usage}`),
                React.createElement(IconButton, { icon: 'check', title: '应用到选区', size: 13, onClick: () => store.applyStyle(style.id) }),
                React.createElement(IconButton, { icon: 'ungroup', title: '解绑引用', size: 13, onClick: () => store.detachStyle(style.id) }),
                React.createElement(IconButton, { icon: 'trash', title: '删除样式', size: 13, danger: true, onClick: () => store.deleteStyle(style.id) }),
              )
            }),
      ),
    ),
  )
}

export function FontsPanel({ store, onNeedName }) {
  const doc = store.state.doc
  const [family, setFamily] = React.useState('')
  const [weight, setWeight] = React.useState('400')
  const [style, setStyle] = React.useState('normal')
  const [file, setFile] = React.useState(null)
  const [busy, setBusy] = React.useState(false)
  const fileRef = React.useRef(null)
  if (!doc) return null

  const upload = async () => {
    if (!file || !family.trim()) {
      store.toast('选择字体文件并填写家族名')
      return
    }
    setBusy(true)
    await store.uploadFontFile(file, family.trim(), Number(weight), style)
    setBusy(false)
    setFamily('')
    setFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return React.createElement(
    'div',
    { className: 'dshc-panel' },
    React.createElement('div', { className: 'dshc-panel-title' }, '字体', React.createElement('span', { className: 'dshc-panel-count' }, doc.fonts?.length ?? 0)),
    React.createElement(
      'div',
      { className: 'dshc-panel-group' },
      React.createElement('div', { className: 'dshc-panel-subtitle' }, '上传字体'),
      React.createElement(Field, { label: '字体文件', wide: true },
        React.createElement('input', {
          ref: fileRef,
          type: 'file',
          accept: '.woff2,.woff,.ttf,.otf',
          onChange: (event) => {
            const next = event.target.files?.[0] ?? null
            setFile(next)
            if (next && !family) setFamily(next.name.replace(/\.[^.]+$/, '').replace(/[-_](Regular|Medium|SemiBold|Bold|Light|Italic)$/i, ''))
          },
        }),
      ),
      React.createElement(Field, { label: '家族名', wide: true },
        React.createElement('input', { className: 'dshc-text-input', value: family, onChange: (event) => setFamily(event.target.value) }),
      ),
      React.createElement('div', { className: 'dshc-grid-2' },
        React.createElement(Field, { label: '字重' }, React.createElement(Select, {
          value: weight,
          options: [100, 200, 300, 400, 500, 600, 700, 800, 900].map((value) => ({ value: String(value), label: String(value) })),
          onChange: setWeight,
        })),
        React.createElement(Field, { label: '样式' }, React.createElement(Select, {
          value: style,
          options: [{ value: 'normal', label: '常规' }, { value: 'italic', label: '斜体' }],
          onChange: setStyle,
        })),
      ),
      React.createElement(Button, { small: true, primary: true, icon: 'upload', disabled: busy || !file || !family.trim(), onClick: upload }, busy ? '上传中…' : '上传并登记'),
      React.createElement('div', { className: 'dshc-help' }, '文件保存到 canvas/fonts/，客户端 @font-face 加载；不做服务端转换或子集化。'),
    ),
    React.createElement(
      'div',
      { className: 'dshc-panel-group' },
      React.createElement('div', { className: 'dshc-panel-subtitle' }, '已上传'),
      (doc.fonts ?? []).length === 0
        ? React.createElement('div', { className: 'dshc-muted dshc-pad' }, '还没有自定义字体；系统字体可直接使用。')
        : (doc.fonts ?? []).map((font) =>
            React.createElement(
              'div',
              { key: font.id, className: 'dshc-list-row' },
              React.createElement(Icon, { name: 'fonts', size: 13 }),
              React.createElement('span', { className: 'dshc-list-name' }, font.family),
              React.createElement('span', { className: 'dshc-muted' }, `${font.weight} ${font.style}`),
              React.createElement(IconButton, {
                icon: 'trash',
                title: '删除字体',
                size: 13,
                danger: true,
                onClick: () => store.removeFont(font.id),
              }),
            ),
          ),
    ),
  )
}

export function CommentsPanel({ store }) {
  const doc = store.state.doc
  const [showResolved, setShowResolved] = React.useState(false)
  const [replyText, setReplyText] = React.useState('')
  const [replyId, setReplyId] = React.useState(null)
  if (!doc) return null
  const comments = (doc.comments ?? []).filter((comment) => comment.pageId === store.state.pageId && (showResolved || !comment.resolved))
  return React.createElement(
    'div',
    { className: 'dshc-panel' },
    React.createElement('div', { className: 'dshc-panel-title' }, '评论', React.createElement('span', { className: 'dshc-panel-count' }, comments.length)),
    React.createElement(
      'div',
      { className: 'dshc-panel-actions' },
      React.createElement(Button, { small: true, icon: 'comment', onClick: () => store.setTool('comment') }, '添加评论'),
      React.createElement(Button, { small: true, active: showResolved, onClick: () => setShowResolved(!showResolved) }, '已解决'),
    ),
    comments.length === 0
      ? React.createElement(Empty, { icon: 'comment', title: '没有评论', text: '用评论工具点画布，或选中元素后添加。' })
      : comments.map((comment) =>
          React.createElement(
            'div',
            { key: comment.id, className: `dshc-comment-card ${comment.resolved ? 'is-resolved' : ''}` },
            React.createElement(
              'div',
              { className: 'dshc-comment-card-head' },
              React.createElement('span', { className: 'dshc-comment-author' }, comment.author === 'ai' ? 'AI' : '你'),
              React.createElement('span', { className: 'dshc-muted' }, comment.nodeId ? `@${comment.nodeId}` : '页面'),
              comment.resolved ? React.createElement('span', { className: 'dshc-muted' }, '已解决') : null,
            ),
            React.createElement('div', { className: 'dshc-comment-card-body' }, comment.body),
            (comment.replies ?? []).map((reply) =>
              React.createElement(
                'div',
                { key: reply.id, className: 'dshc-comment-card-reply' },
                React.createElement('b', null, reply.author === 'ai' ? 'AI' : '你'),
                reply.body,
              ),
            ),
            replyId === comment.id &&
              React.createElement(
                'div',
                null,
                React.createElement('textarea', {
                  className: 'dshc-comment-input',
                  rows: 2,
                  value: replyText,
                  onChange: (event) => setReplyText(event.target.value),
                  placeholder: '回复…',
                }),
                React.createElement(
                  'div',
                  { className: 'dshc-row' },
                  React.createElement(Button, { small: true, onClick: () => { store.replyComment(comment.id, replyText); setReplyText(''); setReplyId(null) } }, '发送'),
                  React.createElement(Button, { small: true, onClick: () => { setReplyId(null); setReplyText('') } }, '取消'),
                ),
              ),
            React.createElement(
              'div',
              { className: 'dshc-comment-card-actions' },
              React.createElement(Button, { small: true, onClick: () => {
                if (comment.nodeId) {
                  const node = store.findSceneNode(comment.nodeId)
                  if (node) {
                    store.setSelection([node.key])
                    store.zoomToSelection()
                  }
                }
              } }, '定位'),
              React.createElement(Button, { small: true, onClick: () => { setReplyId(replyId === comment.id ? null : comment.id); setReplyText('') } }, '回复'),
              React.createElement(Button, { small: true, onClick: () => store.resolveComment(comment.id, !comment.resolved) }, comment.resolved ? '重开' : '解决'),
              React.createElement(Button, { small: true, danger: true, onClick: () => store.deleteComment(comment.id) }, '删除'),
            ),
          ),
        ),
  )
}
