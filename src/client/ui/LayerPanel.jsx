/** Layer tree. Selection is keyed by scene node key; instance internals are
 * hidden here (they are edited through the instance inspector). */

import * as React from 'react'
import { Icon } from './icons.jsx'
import { IconButton } from './common.jsx'

function hasSelectedBelow(node, keys) {
  return (node.children ?? []).some((child) => keys.has(child.key) || hasSelectedBelow(child, keys))
}

function Row({ node, depth, store, onRename, onRowContextMenu }) {
  const selected = store.state.selection.includes(node.key)
  const primary = store.state.primaryKey === node.key
  const [open, setOpen] = React.useState(false)
  const hasChildren = node.children?.length > 0
  React.useEffect(() => {
    const keys = new Set(store.state.selection)
    if (keys.has(node.key) || hasSelectedBelow(node, keys)) setOpen(true)
  }, [store.state.selection, node])
  const typeIcon = node.type === 'frame' ? 'frame' : node.type === 'group' ? 'group' : node.type === 'text' ? 'text' : node.type === 'instance' ? 'component' : node.type === 'ellipse' ? 'ellipse' : node.type === 'line' ? 'line' : 'rect'
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'div',
      {
        className: `dshc-layer-row ${selected ? 'is-selected' : ''} ${primary ? 'is-primary' : ''}`,
        style: { paddingLeft: 6 + depth * 14 },
        onClick: (event) => {
          if (event.shiftKey) store.toggleSelection(node.key)
          else store.setSelection([node.key])
        },
        onDoubleClick: () => onRename?.(node),
        onContextMenu: (event) => {
          event.preventDefault()
          event.stopPropagation()
          if (!selected) store.setSelection([node.key])
          onRowContextMenu?.(event, node)
        },
        title: `${node.name} · ${node.type}`,
      },
      hasChildren
        ? React.createElement(
            'button',
            {
              type: 'button',
              className: 'dshc-layer-caret',
              onClick: (event) => {
                event.stopPropagation()
                setOpen(!open)
              },
            },
            React.createElement(Icon, { name: open ? 'chevronDown' : 'chevronRight', size: 11 }),
          )
        : React.createElement('span', { className: 'dshc-layer-caret' }),
      React.createElement(Icon, { name: typeIcon, size: 14 }),
      React.createElement('span', { className: 'dshc-layer-name' }, node.name || node.type),
      node.editable &&
        React.createElement(
          'span',
          { className: 'dshc-layer-actions' },
          React.createElement(IconButton, {
            icon: node.visible === false ? 'eyeOff' : 'eye',
            title: node.visible === false ? '显示' : '隐藏',
            size: 14,
            onClick: (event) => {
              event.stopPropagation()
              store.setVisibility(node.sourceId, node.visible === false)
            },
          }),
          React.createElement(IconButton, {
            icon: node.locked ? 'lock' : 'unlock',
            title: node.locked ? '解锁' : '锁定',
            size: 14,
            onClick: (event) => {
              event.stopPropagation()
              store.setLocked(node.sourceId, !node.locked)
            },
          }),
          React.createElement(IconButton, {
            icon: 'front',
            title: '上移',
            size: 14,
            onClick: (event) => {
              event.stopPropagation()
              store.setSelection([node.key])
              store.reorder('forward')
            },
          }),
          React.createElement(IconButton, {
            icon: 'back',
            title: '下移',
            size: 14,
            onClick: (event) => {
              event.stopPropagation()
              store.setSelection([node.key])
              store.reorder('backward')
            },
          }),
        ),
    ),
    hasChildren && open
      ? node.children.map((child) => React.createElement(Row, { key: child.key, node: child, depth: depth + 1, store, onRename, onRowContextMenu }))
      : null,
  )
}

export function LayerPanel({ store, onRename, onRowContextMenu }) {
  const scene = store.state.scene
  const roots = scene?.roots ?? []
  return React.createElement(
    'div',
    { className: 'dshc-layer-panel' },
    React.createElement(
      'div',
      { className: 'dshc-panel-title' },
      React.createElement('span', null, '图层'),
      React.createElement('span', { className: 'dshc-panel-count' }, roots.length ? `${count(roots)}` : ''),
    ),
    roots.length
      ? roots.slice().reverse().map((node) => React.createElement(Row, { key: node.key, node, depth: 0, store, onRename, onRowContextMenu }))
      : React.createElement('div', { className: 'dshc-panel-empty' }, '画布为空'),
  )
}

function count(nodes) {
  let total = 0
  for (const node of nodes) {
    total += 1
    if (node.children) total += count(node.children)
  }
  return total
}
