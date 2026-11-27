/** Layer tree. Selection is keyed by scene node key; instance internals are
 * read-only here (they are edited through the instance inspector). */

import * as React from 'react'
import { Icon } from './icons.jsx'
import { IconButton } from './common.jsx'
import { PageSwitcher } from './PageSwitcher.jsx'

const LAYER_DRAG_MIME = 'application/x-dshc-layer'

type DropPosition = 'before' | 'after' | 'inside'

interface DropTarget {
  key: string
  position: DropPosition
}

interface LayerNode {
  key: string
  id: string
  sourceId: string
  instanceId?: string | null
  isInstanceRoot?: boolean
  type: string
  name?: string
  visible?: boolean
  locked?: boolean
  editable?: boolean
  parent?: LayerNode | null
  children?: LayerNode[]
}

interface LayerStore {
  state: {
    selection: string[]
    primaryKey: string | null
    scene?: {
      roots?: LayerNode[]
      byKey?: Map<string, LayerNode>
    } | null
    componentMode?: { componentId: string } | null
    doc?: {
      pages?: Array<{ id: string; name: string; children?: unknown[] }>
    } | null
    pageId?: string | null
  }
  toggleSelection: (key: string) => void
  setSelection: (keys: string[], primaryKey?: string) => void
  setVisibility: (sourceId: string, visible: boolean) => void
  setLocked: (sourceId: string, locked: boolean) => void
  reorder: (kind: 'front' | 'back' | 'forward' | 'backward') => void
  moveLayer?: (sourceId: string, targetParentId: string | null, index: number) => boolean
}

export interface LayerPanelProps {
  store: LayerStore
  onRename?: (node: LayerNode) => void
  onRowContextMenu?: (event: React.MouseEvent<HTMLDivElement>, node: LayerNode) => void
}

interface RowProps {
  node: LayerNode
  depth: number
  parentId: string | null
  siblings: LayerNode[]
  realIndex: number
  store: LayerStore
  dragSourceId: string | null
  dropTarget: DropTarget | null
  onDragStartLayer: (sourceId: string) => void
  onDragEndLayer: () => void
  onDropTargetChange: (target: DropTarget | null) => void
  onRename?: (node: LayerNode) => void
  onRowContextMenu?: (event: React.MouseEvent<HTMLDivElement>, node: LayerNode) => void
}

const NODE_TYPE_ICONS: Record<string, string> = {
  frame: 'frame',
  group: 'group',
  text: 'text',
  instance: 'component',
  ellipse: 'ellipse',
  line: 'line',
  path: 'path',
  rect: 'rect',
}

function isContainerNode(node: LayerNode): boolean {
  return node.type === 'frame' || node.type === 'group'
}

function hasSelectedBelow(node: LayerNode, keys: ReadonlySet<string>): boolean {
  return (node.children ?? []).some((child) => keys.has(child.key) || hasSelectedBelow(child, keys))
}

function hasAncestorSourceId(node: LayerNode, sourceId: string): boolean {
  let cursor = node.parent ?? null
  while (cursor) {
    if (cursor.sourceId === sourceId) return true
    cursor = cursor.parent ?? null
  }
  return false
}

function computeDropPosition(
  event: React.DragEvent<HTMLDivElement>,
  node: LayerNode,
  isComponentRoot: boolean,
): DropPosition | null {
  const isContainer = isContainerNode(node)
  if (isComponentRoot) {
    return isContainer ? 'inside' : null
  }
  const rect = event.currentTarget.getBoundingClientRect()
  const ratio = rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0.5
  if (isContainer && ratio >= 0.25 && ratio <= 0.75) return 'inside'
  return ratio < 0.5 ? 'before' : 'after'
}

function Row({
  node,
  depth,
  parentId,
  siblings,
  realIndex,
  store,
  dragSourceId,
  dropTarget,
  onDragStartLayer,
  onDragEndLayer,
  onDropTargetChange,
  onRename,
  onRowContextMenu,
}: RowProps) {
  const selected = store.state.selection.includes(node.key)
  const primary = store.state.primaryKey === node.key
  const [open, setOpen] = React.useState(false)
  const children = node.children ?? []
  const hasChildren = children.length > 0

  React.useEffect(() => {
    const keys = new Set(store.state.selection)
    if (keys.has(node.key) || hasSelectedBelow(node, keys)) setOpen(true)
  }, [store.state.selection, node])

  const isComponentRoot = Boolean(store.state.componentMode && depth === 0)
  const canDrag = Boolean(node.editable && !node.instanceId && !isComponentRoot)
  const isHidden = node.visible === false
  const isLocked = Boolean(node.locked)
  const dropPosition = dropTarget?.key === node.key ? dropTarget.position : null
  const typeIcon = NODE_TYPE_ICONS[node.type] ?? 'rect'

  const canAcceptDrop = (sourceId: string | null): boolean => {
    if (!node.editable) return false
    if (sourceId && (sourceId === node.sourceId || hasAncestorSourceId(node, sourceId))) return false
    if (isComponentRoot && !isContainerNode(node)) return false
    return true
  }

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null
    if (target?.closest?.('button')) {
      event.preventDefault()
      return
    }
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData(LAYER_DRAG_MIME, node.sourceId)
    event.dataTransfer.setData('text/plain', node.name || node.type)
    onDragStartLayer(node.sourceId)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    const hasLayerPayload = Boolean(dragSourceId) || Array.from(event.dataTransfer.types ?? []).includes(LAYER_DRAG_MIME)
    if (!hasLayerPayload) return
    if (!canAcceptDrop(dragSourceId)) {
      if (dropPosition) onDropTargetChange(null)
      return
    }
    const position = computeDropPosition(event, node, isComponentRoot)
    if (!position) {
      if (dropPosition) onDropTargetChange(null)
      return
    }
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    if (dropTarget?.key !== node.key || dropTarget.position !== position) {
      onDropTargetChange({ key: node.key, position })
    }
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (dropPosition && !event.currentTarget.contains(event.relatedTarget as Node | null)) {
      onDropTargetChange(null)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    const sourceId = event.dataTransfer.getData(LAYER_DRAG_MIME) || dragSourceId
    onDropTargetChange(null)
    onDragEndLayer()
    if (!sourceId || !canAcceptDrop(sourceId)) return

    const rect = event.currentTarget.getBoundingClientRect()
    const position = rect.height > 0 ? computeDropPosition(event, node, isComponentRoot) : dropPosition
    if (!position) return

    event.preventDefault()
    event.stopPropagation()

    if (position === 'inside') {
      const moved = store.moveLayer?.(sourceId, node.sourceId, children.length)
      if (moved) setOpen(true)
      return
    }

    // Visual rows are reversed (higher array index is visually higher).
    // 'before' (visually above target) inserts at realIndex + 1; 'after' (visually below) inserts at realIndex.
    // Because store.moveLayer removes source from its owner list before splicing into target,
    // same-parent moves where sourceIndex < insertIndex shift the target slot down by 1.
    let insertIndex = position === 'before' ? realIndex + 1 : realIndex
    const sourceIndex = siblings.findIndex((entry) => entry.sourceId === sourceId)
    if (sourceIndex !== -1) {
      if (sourceIndex < insertIndex) insertIndex -= 1
      if (insertIndex === sourceIndex) return
    }
    store.moveLayer?.(sourceId, parentId, insertIndex)
  }

  const rowClassName = [
    'dshc-layer-row',
    selected ? 'is-selected' : '',
    primary ? 'is-primary' : '',
    isHidden ? 'is-hidden' : '',
    isLocked ? 'is-locked' : '',
    dropPosition === 'before' ? 'is-drop-before' : '',
    dropPosition === 'after' ? 'is-drop-after' : '',
    dropPosition === 'inside' ? 'is-drop-inside' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <div
        className={rowClassName}
        style={{ paddingLeft: 6 + depth * 14 }}
        draggable={canDrag || undefined}
        onDragStart={canDrag ? handleDragStart : undefined}
        onDragEnd={canDrag ? onDragEndLayer : undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={(event) => {
          if (event.shiftKey) store.toggleSelection(node.key)
          else store.setSelection([node.key])
        }}
        onDoubleClick={() => onRename?.(node)}
        onContextMenu={(event) => {
          event.preventDefault()
          event.stopPropagation()
          if (!selected) store.setSelection([node.key])
          onRowContextMenu?.(event, node)
        }}
        title={`${node.name || node.type} · ${node.type}`}
      >
        {hasChildren ? (
          <button
            type="button"
            className="dshc-layer-caret"
            onClick={(event) => {
              event.stopPropagation()
              setOpen(!open)
            }}
          >
            <Icon name={open ? 'chevronDown' : 'chevronRight'} size={11} />
          </button>
        ) : (
          <span className="dshc-layer-caret" />
        )}
        <Icon name={typeIcon} size={14} />
        <span className="dshc-layer-name">{node.name || node.type}</span>
        {(isHidden || isLocked) && (
          <span className="dshc-layer-status">
            {isHidden ? <Icon name="eyeOff" size={12} /> : null}
            {isLocked ? <Icon name="lock" size={12} /> : null}
          </span>
        )}
        {node.editable && (
          <span className="dshc-layer-actions">
            <IconButton
              icon={isHidden ? 'eyeOff' : 'eye'}
              title={isHidden ? '显示' : '隐藏'}
              size={14}
              onClick={(event: React.MouseEvent) => {
                event.stopPropagation()
                store.setVisibility(node.sourceId, isHidden)
              }}
            />
            <IconButton
              icon={isLocked ? 'lock' : 'unlock'}
              title={isLocked ? '解锁' : '锁定'}
              size={14}
              onClick={(event: React.MouseEvent) => {
                event.stopPropagation()
                store.setLocked(node.sourceId, !isLocked)
              }}
            />
            <IconButton
              icon="front"
              title="上移"
              size={14}
              onClick={(event: React.MouseEvent) => {
                event.stopPropagation()
                store.setSelection([node.key])
                store.reorder('forward')
              }}
            />
            <IconButton
              icon="back"
              title="下移"
              size={14}
              onClick={(event: React.MouseEvent) => {
                event.stopPropagation()
                store.setSelection([node.key])
                store.reorder('backward')
              }}
            />
          </span>
        )}
      </div>
      {hasChildren && open
        ? children
            .map((child, childIndex) => ({ child, childIndex }))
            .reverse()
            .map(({ child, childIndex }) => (
              <Row
                key={child.key}
                node={child}
                depth={depth + 1}
                parentId={node.sourceId}
                siblings={children}
                realIndex={childIndex}
                store={store}
                dragSourceId={dragSourceId}
                dropTarget={dropTarget}
                onDragStartLayer={onDragStartLayer}
                onDragEndLayer={onDragEndLayer}
                onDropTargetChange={onDropTargetChange}
                onRename={onRename}
                onRowContextMenu={onRowContextMenu}
              />
            ))
        : null}
    </>
  )
}

export function LayerPanel({ store, onRename, onRowContextMenu }: LayerPanelProps) {
  const scene = store.state.scene
  const roots = scene?.roots ?? []
  const [dragSourceId, setDragSourceId] = React.useState<string | null>(null)
  const [dropTarget, setDropTarget] = React.useState<DropTarget | null>(null)

  const handleDragStartLayer = React.useCallback((sourceId: string) => {
    setDragSourceId(sourceId)
    setDropTarget(null)
  }, [])

  const handleDragEndLayer = React.useCallback(() => {
    setDragSourceId(null)
    setDropTarget(null)
  }, [])

  return (
    <div className="dshc-layer-panel">
      <PageSwitcher store={store} />
      <div className="dshc-panel-title">
        <span>图层</span>
        <span className="dshc-panel-count">{roots.length ? `${count(roots)}` : ''}</span>
      </div>
      {roots.length ? (
        roots
          .map((node, realIndex) => ({ node, realIndex }))
          .reverse()
          .map(({ node, realIndex }) => (
            <Row
              key={node.key}
              node={node}
              depth={0}
              parentId={null}
              siblings={roots}
              realIndex={realIndex}
              store={store}
              dragSourceId={dragSourceId}
              dropTarget={dropTarget}
              onDragStartLayer={handleDragStartLayer}
              onDragEndLayer={handleDragEndLayer}
              onDropTargetChange={setDropTarget}
              onRename={onRename}
              onRowContextMenu={onRowContextMenu}
            />
          ))
      ) : (
        <div className="dshc-panel-empty">画布为空</div>
      )}
    </div>
  )
}

function count(nodes: LayerNode[]): number {
  let total = 0
  for (const node of nodes) {
    total += 1
    if (node.children?.length) total += count(node.children)
  }
  return total
}
