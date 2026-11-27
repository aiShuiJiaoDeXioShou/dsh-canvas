/** Top toolbar: document/page switching, tools, history, zoom, AI and export. */

import * as React from 'react'
import { IconButton, Button, Modal } from './common.jsx'
import { Icon } from './icons.jsx'
import { FigmaSyncDialog } from './FigmaSyncDialog.jsx'

export function ZoomPercentage({ store }: { store: import('../store.js').CanvasStore }) {
  const percentage = React.useSyncExternalStore(store.subscribeViewport, store.getZoomPercentage)
  return <>{percentage}%</>
}

const TOOLS = [
  ['pointer', 'v', '移动/选择 (V)'],
  ['frame', 'f', 'Frame (F)'],
  ['rect', 'r', '矩形 (R)'],
  ['ellipse', 'o', '椭圆 (O)'],
  ['line', 'l', '直线 (L)'],
  ['connect', 'k', '交互连线 (K) · 连接按钮与目标界面，标明跳转流程'],
  ['text', 't', '文本 (T)'],
  ['image', 'i', '图片 (I)'],
  ['hand', 'h', '抓手 (H)'],
  ['comment', 'c', '评论 (C)'],
]

export function Toolbar({ store, onNewDoc, onRenameDoc, onDeleteDoc, onNeedName, inspectorOpen, onToggleInspector, connections }: any) {
  const state = store.state
  const [showExport, setShowExport] = React.useState(false)
  const [showFigmaSync, setShowFigmaSync] = React.useState(false)
  const [docsOpen, setDocsOpen] = React.useState(false)
  const docsRef = React.useRef(null)
  const fileRef = React.useRef(null)
  const svgRef = React.useRef(null)
  const packRef = React.useRef(null)

  React.useEffect(() => {
    if (!docsOpen) return
    const close = (event) => {
      if (!docsRef.current?.contains(event.target)) setDocsOpen(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') setDocsOpen(false)
    }
    window.addEventListener('pointerdown', close, true)
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('pointerdown', close, true)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [docsOpen])

  const docLabel = (entry) => entry.title && entry.title !== entry.name ? `${entry.title} · ${entry.name}` : entry.name
  const docs = state.docs.some((entry) => entry.name === state.name)
    ? state.docs
    : [{ name: state.name, title: state.name }, ...state.docs]
  const currentDoc = docs.find((entry) => entry.name === state.name) ?? docs[0]
  const currentLabel = currentDoc ? docLabel(currentDoc) : state.name
  const scene = state.scene
  const roots = scene?.roots ?? []
  const selectionCount = state.selection.length

  const chooseImage = () => {
    store.imageInsertPoint = null
    store.requestImagePick?.()
  }

  const onTool = (tool) => {
    if (tool === 'image') {
      chooseImage()
      return
    }
    store.setTool(tool)
  }

  return React.createElement(
    'div',
    { className: 'dshc-topbar' },
    React.createElement(
      'div',
      { className: 'dshc-topbar-row dshc-topbar-docs' },
      React.createElement(
        'div',
        { className: 'dshc-doc-picker', ref: docsRef },
        React.createElement(
          'button',
          {
            type: 'button',
            className: 'dshc-doc-trigger',
            title: '切换 / 重命名设计稿',
            onClick: () => setDocsOpen((open) => !open),
          },
          React.createElement('span', { className: 'dshc-doc-trigger-label' }, currentLabel),
          React.createElement(Icon, { name: 'chevronDown', size: 12 }),
        ),
        docsOpen && React.createElement(
          'div',
          { className: 'dshc-doc-menu' },
          docs.map((entry) => React.createElement(
            'div',
            {
              key: entry.name,
              className: `dshc-doc-row ${entry.name === state.name ? 'is-active' : ''}`,
            },
            React.createElement(
              'button',
              {
                type: 'button',
                className: 'dshc-doc-open',
                onClick: () => {
                  setDocsOpen(false)
                  store.loadDoc(entry.name)
                },
              },
              React.createElement(Icon, { name: 'check', size: 12, className: entry.name === state.name ? '' : 'dshc-doc-check-hidden' }),
              React.createElement('span', { className: 'dshc-doc-label' }, docLabel(entry)),
            ),
            React.createElement(IconButton, {
              icon: 'pencil',
              size: 12,
              title: `重命名 ${entry.name}`,
              onClick: () => {
                setDocsOpen(false)
                onRenameDoc?.(entry.name)
              },
            }),
          )),
          docs.length === 0 && React.createElement('div', { className: 'dshc-doc-empty' }, '还没有设计稿'),
        ),
      ),
      React.createElement(IconButton, { icon: 'plus', title: '新建设计稿', onClick: onNewDoc }),
      React.createElement(IconButton, { icon: 'path', title: '导入 SVG path', onClick: () => svgRef.current?.click() }),
      React.createElement(IconButton, { icon: 'pencil', title: '重命名设计稿', onClick: () => onRenameDoc?.(state.name) }),
      React.createElement(IconButton, { icon: 'trash', title: '删除设计稿', onClick: () => onDeleteDoc?.() }),
      React.createElement(IconButton, { icon: 'download', title: '导出 SVG / PNG', onClick: () => setShowExport(!showExport) }),
      React.createElement(Button, {
        small: true,
        icon: 'sparkle',
        className: 'dshc-figma-btn',
        title: 'Figma 导入 / 同步与快速配置',
        active: showFigmaSync,
        onClick: () => setShowFigmaSync(true),
      }, 'Figma'),
      React.createElement('span', { className: 'dshc-spacer' }),
      React.createElement(IconButton, { icon: 'undo', title: '撤销 (⌘Z)', onClick: () => store.undo(), disabled: !store.history.canUndo() }),
      React.createElement(IconButton, { icon: 'redo', title: '重做 (⇧⌘Z)', onClick: () => store.redo(), disabled: !store.history.canRedo() }),
    ),
    React.createElement(
      'div',
      { className: 'dshc-topbar-row dshc-topbar-tools' },
      React.createElement(
        'div',
        { className: 'dshc-tools-scroll' },
        ...TOOLS.map(([tool, key, title]) =>
          React.createElement(IconButton, {
            key: tool,
            icon: tool,
            title,
            active: state.tool === tool,
            onClick: () => onTool(tool),
          }),
        ),
        React.createElement('span', { className: 'dshc-divider' }),
        React.createElement(IconButton, { icon: 'comment', title: '显示/隐藏评论', active: state.showComments, onClick: () => {
          state.showComments = !state.showComments
          store.emit()
        } }),
        React.createElement(IconButton, { icon: 'zoomOut', title: '缩小', onClick: () => {
          const view = store.viewportSize()
          store.zoomAt({ x: view.width / 2, y: view.height / 2 }, 1 / 1.2)
        } }),
        React.createElement('button', { type: 'button', className: 'dshc-zoom-label', title: '重置到 100%', onClick: () => store.setViewport({ ...store.state.viewport, zoom: 1 }) }, <ZoomPercentage store={store} />),
        React.createElement(IconButton, { icon: 'zoomIn', title: '放大', onClick: () => {
          const view = store.viewportSize()
          store.zoomAt({ x: view.width / 2, y: view.height / 2 }, 1.2)
        } }),
        React.createElement(IconButton, {
          icon: 'fit',
          title: selectionCount ? '适应选区 (2)' : '适应画布 (1)',
          onClick: () => (selectionCount ? store.zoomToSelection() : store.zoomToFit()),
        }),
        connections?.hasConnections && React.createElement(Button, {
          small: true, icon: 'connect', active: connections.focused,
          disabled: !connections.enabled && !connections.focused,
          title: connections.focused
            ? '退出聚焦，恢复显示全部界面和连线'
            : connections.enabled
              ? '只显示与当前选中元素相关的跳转连线，淡化无关界面'
              : '先选中带交互连线的元素或界面后再聚焦',
          onClick: connections.toggle,
        }, connections.focused ? '退出聚焦' : '聚焦连线'),
      ),
      React.createElement(
        'span',
        { className: 'dshc-topbar-end' },
        React.createElement('span', { className: 'dshc-divider' }),
        React.createElement(IconButton, {
          icon: 'panelRight',
          title: inspectorOpen ? '收起属性面板' : '展开属性面板',
          active: Boolean(inspectorOpen),
          onClick: onToggleInspector,
        }),
      ),
    ),
    showExport &&
      React.createElement(
        Modal,
        {
          title: selectionCount ? `导出选区（${selectionCount} 个图层）` : '导出当前画布',
          width: 420,
          onClose: () => setShowExport(false),
        },
        React.createElement('div', { className: 'dshc-export-section' }, '图片'),
        React.createElement(
          'div',
          { className: 'dshc-export-grid' },
          React.createElement(Button, { icon: 'download', onClick: () => { setShowExport(false); store.exportSelection('svg') } }, 'SVG 矢量'),
          React.createElement(Button, { icon: 'download', onClick: () => { setShowExport(false); store.exportSelection('png') } }, 'PNG（2x）'),
        ),
        React.createElement('div', { className: 'dshc-export-section' }, '工程文件'),
        React.createElement(Button, { icon: 'download', onClick: () => { setShowExport(false); store.exportPack() } }, '导出 Drafi 包（含素材，可再导入）'),
        React.createElement(Button, { icon: 'upload', onClick: () => { setShowExport(false); packRef.current?.click() } }, '导入 Drafi 包'),
        React.createElement('div', { className: 'dshc-export-section' }, 'Figma 生态'),
        React.createElement(Button, { icon: 'sparkle', onClick: () => { setShowExport(false); setShowFigmaSync(true) } }, 'Figma 同步与快速配置…'),
      ),
    showFigmaSync && React.createElement(FigmaSyncDialog, { store, onClose: () => setShowFigmaSync(false) }),
    React.createElement('input', {
      ref: (element) => {
        fileRef.current = element
        store.imagePicker = element
      },
      type: 'file',
      accept: 'image/png,image/jpeg,image/webp,image/gif',
      style: { display: 'none' },
      onChange: (event) => {
        const file = event.target.files?.[0]
        if (file) store.uploadImageFile(file, store.imageInsertPoint ?? undefined)
        store.imageInsertPoint = null
        event.target.value = ''
      },
    }),
    React.createElement('input', {
      ref: packRef,
      type: 'file',
      accept: '.json,application/json',
      style: { display: 'none' },
      onChange: async (event) => {
        const file = event.target.files?.[0]
        if (file) await store.importPackFile(file)
        event.target.value = ''
      },
    }),
    React.createElement('input', {
      ref: svgRef,
      type: 'file',
      accept: '.svg,image/svg+xml',
      style: { display: 'none' },
      onChange: async (event) => {
        const file = event.target.files?.[0]
        if (file) store.importSvg(await file.text())
        event.target.value = ''
      },
    }),
  )
}
