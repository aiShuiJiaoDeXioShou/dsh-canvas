// @ts-nocheck
/** The canvas tab body: store wiring, chrome, panels and dialogs. */

import * as React from 'react'
import { CanvasStore } from './store.js'
import { reportDiag } from './api.js'
import { consumePendingFocus, onCanvasFocus } from './focus.js'
import { CanvasView } from './CanvasView.jsx'
import { Toolbar } from './ui/Toolbar.jsx'
import { LayerPanel } from './ui/LayerPanel.jsx'
import { Inspector } from './ui/Inspector.jsx'
import { ComponentsPanel, StylesPanel, FontsPanel, CommentsPanel, TemplatesPanel } from './ui/panels.jsx'
import { Icon } from './ui/icons.jsx'
import { Button, ContextMenu, IconButton, NameDialog, Select } from './ui/common.jsx'
import { buildSelectionMenu } from './ui/selection-menu.js'
import cssText from './styles.css'

const RAIL = [
  ['layers', 'layers', '图层'],
  ['components', 'component', '组件'],
  ['templates', 'template', '模板'],
  ['styles', 'styles', '样式'],
  ['fonts', 'fonts', '字体'],
  ['comments', 'comment', '评论'],
]

export class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[dsh-canvas] panel crashed', error)
    reportDiag({ phase: 'panel-crash', message: String(error?.message ?? error), stack: String(error?.stack ?? ''), componentStack: String(info?.componentStack ?? '') })
  }

  render() {
    if (this.state.error) {
      return React.createElement(
        'div',
        { className: 'dshc-root dshc-crashed' },
        React.createElement('div', { className: 'dshc-crash-title' }, '画布面板出错了'),
        React.createElement('pre', { className: 'dshc-crash-message' }, String(this.state.error?.message ?? this.state.error)),
        React.createElement(
          'button',
          {
            type: 'button',
            className: 'dshc-btn is-primary',
            onClick: () => this.setState({ error: null }),
          },
          '重试',
        ),
      )
    }
    return this.props.children
  }
}

export function CanvasPanel({ sessionId, inputActions }: any) {
  const storeRef = React.useRef(null)
  if (!storeRef.current || storeRef.current.sessionId !== sessionId) {
    storeRef.current = new CanvasStore({ sessionId, inputActions })
  }
  const store = storeRef.current
  store.inputActions = inputActions
  React.useSyncExternalStore(store.subscribe, store.getVersion)
  const [nameDialog, setNameDialog] = React.useState(null)
  const [layerMenu, setLayerMenu] = React.useState(null)
  const state = store.state

  React.useEffect(() => {
    reportDiag({ phase: 'panel-mount', sessionId, width: store.canvasSize?.width ?? null })
    store.mount()
    const applyFocus = (request) => {
      if (!request) return
      if (request.sessionId && sessionId && request.sessionId !== sessionId) return
      store.focusNode(request).catch((error) => console.warn('[dsh-canvas] focus failed', error))
    }
    const pending = consumePendingFocus(sessionId)
    if (pending) applyFocus(pending)
    const offFocus = onCanvasFocus((request) => {
      if (request.sessionId && sessionId && request.sessionId !== sessionId) return
      consumePendingFocus(sessionId)
      applyFocus(request)
    })
    return () => {
      offFocus()
      reportDiag({ phase: 'panel-unmount', sessionId })
      store.unmount()
    }
  }, [store])

  React.useEffect(() => {
    if (!layerMenu) return
    const close = (event) => {
      if (event.type === 'pointerdown' && event.target?.closest?.('.dshc-context-menu')) return
      setLayerMenu(null)
    }
    const onKey = (event) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      setLayerMenu(null)
    }
    window.addEventListener('pointerdown', close, true)
    window.addEventListener('wheel', close, { capture: true, passive: true })
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('pointerdown', close, true)
      window.removeEventListener('wheel', close, true)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [layerMenu])

  const onNeedName = (options) => setNameDialog(options)
  const openLayerMenu = (event, node) => {
    if (!store.state.selection.includes(node.key)) store.setSelection([node.key])
    setLayerMenu({
      x: Math.min(Math.max(8, event.clientX), Math.max(8, (window.innerWidth ?? 1200) - 240)),
      y: Math.min(Math.max(8, event.clientY), Math.max(8, (window.innerHeight ?? 800) - 440)),
      node,
    })
  }
  const panel = store.state.panel
  const comments = (state.doc?.comments ?? []).filter((comment) => !comment.resolved && comment.pageId === state.pageId)

  if (state.loading || !state.ready) {
    return React.createElement(
      'div',
      { className: 'dshc-root dshc-loading' },
      React.createElement('style', null, cssText),
      state.error
        ? React.createElement(
            React.Fragment,
            null,
            React.createElement('div', { className: 'dshc-crash-title' }, '无法打开画布'),
            React.createElement('pre', { className: 'dshc-crash-message' }, state.error),
            React.createElement('button', { type: 'button', className: 'dshc-btn is-primary', onClick: () => store.bootstrap() }, '重试'),
          )
        : React.createElement(
            React.Fragment,
            null,
            React.createElement('div', { className: 'dshc-spinner' }),
            React.createElement('div', { className: 'dshc-muted' }, '正在打开画布…'),
          ),
    )
  }

  const component = state.componentMode ? state.doc.components.find((entry) => entry.id === state.componentMode.componentId) : null

  return React.createElement(
    'div',
    { className: 'dshc-root' },
    React.createElement('style', null, cssText),
    React.createElement(Toolbar, {
      store,
      onNewDoc: () => onNeedName({
        title: '新建画布',
        label: '文档名（小写 slug）',
        defaultValue: `canvas-${(state.docs?.length ?? 0) + 1}`,
        onSubmit: (name) => store.createDoc(name),
      }),
      onNeedName,
      onRenameDoc: (from = store.state.name) => onNeedName({
        title: '重命名画布',
        label: '文档名（小写 slug）',
        defaultValue: from,
        onSubmit: (name) => store.renameDoc(name, from),
      }),
      onDeleteDoc: () => {
        if (typeof window !== 'undefined' && !window.confirm(`删除画布「${store.state.name}」？此操作不可撤销。`)) return
        store.deleteDoc()
      },
    }),
    component &&
      React.createElement(
        'div',
        { className: 'dshc-banner' },
        React.createElement(Icon, { name: 'component', size: 14 }),
        React.createElement('span', null, `正在编辑组件：${component.name}`),
        React.createElement(Button, { small: true, onClick: () => store.exitComponentMode() }, '返回画布'),
      ),
    state.conflict &&
      React.createElement(
        'div',
        { className: 'dshc-conflict' },
        React.createElement('span', null, state.conflict.message ?? '画布在别处被修改了'),
        React.createElement(Button, { small: true, onClick: () => store.resolveConflict(true) }, '加载最新'),
        React.createElement(Button, { small: true, onClick: () => store.resolveConflict(false) }, '保留本地并覆盖'),
      ),
    React.createElement(
      'div',
      { className: 'dshc-body' },
      React.createElement(
        'div',
        { className: 'dshc-rail' },
        RAIL.map(([id, icon, title]) =>
          React.createElement(
            'div',
            { key: id, className: 'dshc-rail-item' },
            React.createElement(IconButton, {
              icon,
              title,
              size: 22,
              active: panel === id,
              onClick: () => store.setPanel(panel === id ? null : id),
            }),
            id === 'comments' && comments.length
              ? React.createElement('span', { className: 'dshc-badge' }, comments.length > 9 ? '9+' : comments.length)
              : null,
          ),
        ),
        React.createElement('span', { className: 'dshc-spacer' }),
        React.createElement(IconButton, {
          icon: 'sliders',
          size: 22,
          title: state.inspectorOpen ? '收起属性' : '展开属性',
          active: state.inspectorOpen,
          onClick: () => {
            state.inspectorOpen = !state.inspectorOpen
            store.emit()
          },
        }),
      ),
      panel &&
        React.createElement(
          'div',
          { className: 'dshc-panel-wrap' },
          panel === 'layers' && React.createElement(LayerPanel, {
            store,
            onRename: (node) => onNeedName({
              title: '重命名图层',
              label: '名称',
              defaultValue: node.name,
              onSubmit: (name) => store.renameNode(node.sourceId, name),
            }),
            onRowContextMenu: openLayerMenu,
          }),
          panel === 'components' && React.createElement(ComponentsPanel, { store, onNeedName }),
          panel === 'templates' && React.createElement(TemplatesPanel, { store }),
          panel === 'styles' && React.createElement(StylesPanel, { store, onNeedName }),
          panel === 'fonts' && React.createElement(FontsPanel, { store, onNeedName }),
          panel === 'comments' && React.createElement(CommentsPanel, { store }),
        ),
      React.createElement(
        'div',
        { className: 'dshc-canvas-wrap' },
        React.createElement(CanvasView, { store }),
      ),
      state.inspectorOpen &&
        React.createElement(Inspector, { store, onNameDialog: onNeedName }),
    ),
    React.createElement(
      'div',
      { className: 'dshc-statusbar' },
      React.createElement(
        'span',
        { className: 'dshc-status-selection' },
        state.selection.length
          ? `已选 ${state.selection.length} 个 · ${store.primaryNode()?.name ?? ''}`
          : '未选择 · 画布',
      ),
      React.createElement('span', { className: 'dshc-spacer' }),
      state.sceneIssues?.length
        ? React.createElement('span', { className: 'dshc-status-warn', title: state.sceneIssues.join('\n') }, `${state.sceneIssues.length} 个警告`)
        : null,
      React.createElement('span', { className: 'dshc-muted' }, state.dirty ? '未保存' : state.saving ? '保存中…' : '已保存'),
      React.createElement('span', { className: 'dshc-muted' }, `${Math.round(state.viewport.zoom * 100)}%`),
      React.createElement(Button, { small: true, primary: state.selection.length > 0, onClick: () => store.insertSelectionToComposer(), disabled: !state.selection.length }, '插入到对话'),
      React.createElement(Button, { small: true, icon: 'sparkle', onClick: () => store.insertPrompt() }, '让 AI 生成'),
    ),
    state.notice &&
      React.createElement(
        'div',
        { className: `dshc-toast ${state.notice.kind === 'error' ? 'is-error' : ''}` },
        state.notice.text,
      ),
    layerMenu &&
      React.createElement(ContextMenu, {
        fixed: true,
        x: layerMenu.x,
        y: layerMenu.y,
        items: [
          {
            label: '重命名',
            icon: 'text',
            action: () => {
              const node = layerMenu.node
              if (!node) return
              onNeedName({
                title: '重命名图层',
                label: '名称',
                defaultValue: node.name,
                onSubmit: (name) => store.renameNode(node.sourceId, name),
              })
            },
          },
          { label: '在画布中定位', icon: 'fit', action: () => store.zoomToSelection() },
          { separator: true },
          ...buildSelectionMenu(store),
        ],
        onClose: () => setLayerMenu(null),
      }),
    nameDialog &&
      React.createElement(NameDialog, {
        title: nameDialog.title,
        label: nameDialog.label,
        defaultValue: nameDialog.defaultValue,
        onCancel: () => setNameDialog(null),
        onSubmit: (value) => {
          setNameDialog(null)
          nameDialog.onSubmit?.(value)
        },
      }),
  )
}

export { Select }
