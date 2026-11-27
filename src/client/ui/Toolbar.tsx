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
  const [showImport, setShowImport] = React.useState(false)
  const [showExport, setShowExport] = React.useState(false)
  const [figmaTab, setFigmaTab] = React.useState<'setup' | 'pull' | 'push' | null>(null)
  const [docsOpen, setDocsOpen] = React.useState(false)
  const docsRef = React.useRef(null)
  const fileRef = React.useRef(null)
  const svgRef = React.useRef(null)
  const packRef = React.useRef(null)
  const dshFigRef = React.useRef(null)

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
      React.createElement(IconButton, { icon: 'pencil', title: '重命名设计稿', onClick: () => onRenameDoc?.(state.name) }),
      React.createElement(IconButton, { icon: 'trash', title: '删除设计稿', onClick: () => onDeleteDoc?.() }),
      React.createElement('span', { className: 'dshc-divider' }),
      React.createElement(Button, {
        small: true,
        icon: 'upload',
        className: 'dshc-io-btn',
        title: '导入图片、SVG、Figma 或工程包',
        active: showImport,
        onClick: () => { setShowExport(false); setShowImport(!showImport) },
      }, '导入'),
      React.createElement(Button, {
        small: true,
        icon: 'download',
        className: 'dshc-io-btn',
        title: '导出到 Figma、PNG/SVG 或工程包',
        active: showExport,
        onClick: () => { setShowImport(false); setShowExport(!showExport) },
      }, '导出'),
      React.createElement(Button, {
        small: true,
        icon: 'sparkle',
        className: 'dshc-figma-btn',
        title: 'Figma 双向同步与快速配置',
        active: Boolean(figmaTab),
        onClick: () => setFigmaTab('setup'),
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
    showImport &&
      React.createElement(
        Modal,
        {
          title: '导入到当前设计稿',
          width: 460,
          onClose: () => setShowImport(false),
        },
        React.createElement('div', { className: 'dshc-export-section' }, '从 Figma 导入'),
        React.createElement(
          'button',
          {
            type: 'button',
            className: 'dshc-io-card dshc-io-card-primary',
            onClick: () => { setShowImport(false); setFigmaTab('pull') },
          },
          React.createElement(Icon, { name: 'sparkle', size: 16 }),
          React.createElement(
            'span',
            { className: 'dshc-io-card-body' },
            React.createElement('span', { className: 'dshc-io-card-title' }, '从 Figma URL 或本地 .fig 文件导入'),
            React.createElement('span', { className: 'dshc-io-card-desc' }, '支持三方 Diff 增量拉取；也可以在 Figma 按 ⌘C 后回画布直接 ⌘V 粘贴'),
          ),
        ),
        React.createElement('div', { className: 'dshc-export-section' }, '插入素材到画布'),
        React.createElement(
          'div',
          { className: 'dshc-io-grid' },
          React.createElement(
            'button',
            {
              type: 'button',
              className: 'dshc-io-card',
              onClick: () => { setShowImport(false); chooseImage() },
            },
            React.createElement(Icon, { name: 'image', size: 15 }),
            React.createElement(
              'span',
              { className: 'dshc-io-card-body' },
              React.createElement('span', { className: 'dshc-io-card-title' }, '导入图片'),
              React.createElement('span', { className: 'dshc-io-card-desc' }, 'PNG / JPG / WebP / GIF'),
            ),
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              className: 'dshc-io-card',
              onClick: () => { setShowImport(false); svgRef.current?.click() },
            },
            React.createElement(Icon, { name: 'path', size: 15 }),
            React.createElement(
              'span',
              { className: 'dshc-io-card-body' },
              React.createElement('span', { className: 'dshc-io-card-title' }, '导入 SVG 矢量'),
              React.createElement('span', { className: 'dshc-io-card-desc' }, '.svg 转为可编辑 Path'),
            ),
          ),
        ),
        React.createElement('div', { className: 'dshc-export-section' }, '恢复工程包'),
        React.createElement(
          'div',
          { className: 'dshc-io-grid' },
          React.createElement(
            'button',
            {
              type: 'button',
              className: 'dshc-io-card',
              onClick: () => { setShowImport(false); packRef.current?.click() },
            },
            React.createElement(Icon, { name: 'upload', size: 15 }),
            React.createElement(
              'span',
              { className: 'dshc-io-card-body' },
              React.createElement('span', { className: 'dshc-io-card-title' }, 'Drafi 工程包'),
              React.createElement('span', { className: 'dshc-io-card-desc' }, '.drafi.json（含素材字体）'),
            ),
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              className: 'dshc-io-card',
              onClick: () => { setShowImport(false); dshFigRef.current?.click() },
            },
            React.createElement(Icon, { name: 'upload', size: 15 }),
            React.createElement(
              'span',
              { className: 'dshc-io-card-body' },
              React.createElement('span', { className: 'dshc-io-card-title' }, '无损便携包'),
              React.createElement('span', { className: 'dshc-io-card-desc' }, '.dshfig（含 Figma 绑定）'),
            ),
          ),
        ),
        React.createElement('div', { className: 'dshc-io-tip' }, '提示：也可直接把本地图片或 .svg 文件拖进画布任意位置。'),
      ),
    showExport &&
      React.createElement(
        Modal,
        {
          title: selectionCount
            ? `导出选区（${selectionCount} 个图层）`
            : `导出当前画布 · ${state.doc?.pages?.find((p) => p.id === state.pageId)?.name ?? '画布 1'}`,
          width: 460,
          onClose: () => setShowExport(false),
        },
        React.createElement('div', { className: 'dshc-export-section' }, '导出到 Figma（推荐）'),
        React.createElement(
          'button',
          {
            type: 'button',
            className: 'dshc-io-card dshc-io-card-primary',
            onClick: () => { setShowExport(false); void store.copyForFigma() },
          },
          React.createElement(Icon, { name: 'copy', size: 16 }),
          React.createElement(
            'span',
            { className: 'dshc-io-card-body' },
            React.createElement('span', { className: 'dshc-io-card-title' }, '复制到 Figma（免插件 · 直接 ⌘V 粘贴）'),
            React.createElement('span', { className: 'dshc-io-card-desc' }, '复制为可编辑矢量到剪贴板，切到 Figma 画布按 ⌘V 即可落稿'),
          ),
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            className: 'dshc-io-card',
            onClick: () => { setShowExport(false); setFigmaTab('push') },
          },
          React.createElement(Icon, { name: 'sparkle', size: 15 }),
          React.createElement(
            'span',
            { className: 'dshc-io-card-body' },
            React.createElement('span', { className: 'dshc-io-card-title' }, '推送到 Figma 文件（原位更新 / 双向同步）…'),
            React.createElement('span', { className: 'dshc-io-card-desc' }, '配合免费 Companion 插件推送 Diff 或导出离线补丁包，适合多次往返改稿'),
          ),
        ),
        React.createElement('div', { className: 'dshc-export-section' }, '导出图片 / 矢量文件'),
        React.createElement(
          'div',
          { className: 'dshc-io-grid' },
          React.createElement(
            'button',
            {
              type: 'button',
              className: 'dshc-io-card',
              onClick: () => { setShowExport(false); store.exportSelection('png') },
            },
            React.createElement(Icon, { name: 'download', size: 15 }),
            React.createElement(
              'span',
              { className: 'dshc-io-card-body' },
              React.createElement('span', { className: 'dshc-io-card-title' }, 'PNG 高清图（2x）'),
              React.createElement('span', { className: 'dshc-io-card-desc' }, '适合分享、评审与配图'),
            ),
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              className: 'dshc-io-card',
              onClick: () => { setShowExport(false); store.exportSelection('svg') },
            },
            React.createElement(Icon, { name: 'download', size: 15 }),
            React.createElement(
              'span',
              { className: 'dshc-io-card-body' },
              React.createElement('span', { className: 'dshc-io-card-title' }, 'SVG 矢量文件'),
              React.createElement('span', { className: 'dshc-io-card-desc' }, '可直接拖进 Figma / Sketch'),
            ),
          ),
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            className: 'dshc-io-card',
            onClick: () => { setShowExport(false); store.copySelectionImage() },
          },
          React.createElement(Icon, { name: 'image', size: 15 }),
          React.createElement(
            'span',
            { className: 'dshc-io-card-body' },
            React.createElement('span', { className: 'dshc-io-card-title' }, '复制 PNG 渲染图片（⇧⌘C）'),
            React.createElement('span', { className: 'dshc-io-card-desc' }, '直接粘贴发到聊天或文档'),
          ),
        ),
        React.createElement('div', { className: 'dshc-export-section' }, '导出工程包（可重新导入）'),
        React.createElement(
          'div',
          { className: 'dshc-io-grid' },
          React.createElement(
            'button',
            {
              type: 'button',
              className: 'dshc-io-card',
              onClick: () => { setShowExport(false); store.exportPack() },
            },
            React.createElement(Icon, { name: 'download', size: 15 }),
            React.createElement(
              'span',
              { className: 'dshc-io-card-body' },
              React.createElement('span', { className: 'dshc-io-card-title' }, 'Drafi 工程包'),
              React.createElement('span', { className: 'dshc-io-card-desc' }, '.drafi.json（含全部素材）'),
            ),
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              className: 'dshc-io-card',
              onClick: () => { setShowExport(false); void store.exportDshFig() },
            },
            React.createElement(Icon, { name: 'download', size: 15 }),
            React.createElement(
              'span',
              { className: 'dshc-io-card-body' },
              React.createElement('span', { className: 'dshc-io-card-title' }, '无损便携包'),
              React.createElement('span', { className: 'dshc-io-card-desc' }, '.dshfig（含 Figma 绑定）'),
            ),
          ),
        ),
      ),
    figmaTab && React.createElement(FigmaSyncDialog, { store, initialTab: figmaTab, onClose: () => setFigmaTab(null) }),
    React.createElement('input', {
      ref: dshFigRef,
      type: 'file',
      accept: '.dshfig',
      style: { display: 'none' },
      onChange: async (event) => {
        const file = event.target.files?.[0]
        if (file) await store.importDshFigFile(file)
        event.target.value = ''
      },
    }),
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
