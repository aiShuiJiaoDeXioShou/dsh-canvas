/** Canvas viewport, DOM scene, selection overlays and direct manipulation. */

import * as React from 'react'
import { SceneView, primaryPaint } from './editor/render-dom.jsx'
import {
  centerOf,
  handlePoints,
  nodeQuad,
  pointInNode,
  rectsIntersect,
  rotateHandlePoint,
  screenPoint,
  toLocal,
  toPage,
  unionRects,
  worldPoint,
} from './editor/geometry.js'
import { deepFind } from './store.js'
import { hitTestScene } from './editor/hit-test.js'
import { ContextMenu } from './ui/common.jsx'
import { buildSelectionMenu } from './ui/selection-menu.js'

const P = 'dshc'
const HANDLE_SIZE = 8

function isTyping(target) {
  if (!target || !(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

function selectedKeys(store) {
  return new Set(store.state.selection)
}

function collectOverrides(store) {
  return store.state.doc?.comments ?? []
}

function findDocNode(store, sourceId) {
  const doc = store.state.doc
  if (!doc) return null
  for (const page of doc.pages) {
    const found = deepFind(page.children, sourceId)
    if (found) return found
  }
  for (const component of doc.components) {
    if (component.root.id === sourceId) return component.root
    const found = deepFind(component.root.children ?? [], sourceId)
    if (found) return found
  }
  return null
}

function applyMove(store, entries, dx, dy) {
  store.mutate(
    (doc) => {
      for (const entry of entries) {
        const node = findDocNode(store, entry.sourceId)
        if (!node) continue
        node.x = entry.x + dx
        node.y = entry.y + dy
      }
    },
    { commit: false },
  )
}

function snapForMove(store, entries, dx, dy, disable) {
  if (disable) return { dx, dy, guides: [] }
  const selected = new Set(entries.map((entry) => entry.sourceId))
  const moving = entries.map((entry) => ({
    x: entry.absX + dx,
    y: entry.absY + dy,
    width: entry.width,
    height: entry.height,
  }))
  const bounds = unionRects(moving)
  if (!bounds) return { dx, dy, guides: [] }
  const candidates = []
  const parents = new Set()
  for (const entry of entries) {
    const parent = entry.parent
    parents.add(parent?.key ?? 'root')
    const siblings = parent ? parent.children : store.state.scene.roots
    for (const sibling of siblings ?? []) {
      if (!selected.has(sibling.sourceId) && sibling.visible !== false) {
        candidates.push({ x: sibling.absX, y: sibling.absY, width: sibling.width, height: sibling.height })
      }
    }
    if (parent) candidates.push({ x: parent.absX, y: parent.absY, width: parent.width, height: parent.height })
  }
  const threshold = 6 / Math.max(0.02, store.state.viewport.zoom)
  const movingEdges = {
    x: [bounds.x, bounds.x + bounds.width / 2, bounds.x + bounds.width],
    y: [bounds.y, bounds.y + bounds.height / 2, bounds.y + bounds.height],
  }
  const best = { x: { diff: 0, position: null }, y: { diff: 0, position: null } }
  for (const candidate of candidates) {
    const edges = {
      x: [candidate.x, candidate.x + candidate.width / 2, candidate.x + candidate.width],
      y: [candidate.y, candidate.y + candidate.height / 2, candidate.y + candidate.height],
    }
    for (const axis of ['x', 'y']) {
      for (const edge of movingEdges[axis]) {
        for (const target of edges[axis]) {
          const diff = target - edge
          if (Math.abs(diff) > threshold) continue
          if (best[axis].position === null || Math.abs(diff) < Math.abs(best[axis].diff)) {
            best[axis] = { diff, position: target }
          }
        }
      }
    }
  }
  const guides = []
  if (best.x.position !== null) guides.push({ axis: 'x', value: best.x.position })
  if (best.y.position !== null) guides.push({ axis: 'y', value: best.y.position })
  return { dx: dx + best.x.diff, dy: dy + best.y.diff, guides }
}

function reorderInLayout(store, entry, world) {
  const parent = store.state.scene?.byKey.get(entry.layoutParent.key)
  if (!parent) return
  const horizontal = parent.layout?.direction === 'horizontal'
  const siblings = (parent.children ?? []).filter((child) => child.sourceId !== entry.sourceId)
  let index = siblings.length
  for (let position = 0; position < siblings.length; position += 1) {
    const child = siblings[position]
    const center = horizontal ? child.absX + child.width / 2 : child.absY + child.height / 2
    if ((horizontal ? world.x : world.y) < center) {
      index = position
      break
    }
  }
  store.mutate(
    (doc) => {
      const parentNode = findDocNode(store, parent.sourceId)
      if (!parentNode?.children) return
      const from = parentNode.children.findIndex((node) => node.id === entry.sourceId)
      if (from === -1) return
      const [node] = parentNode.children.splice(from, 1)
      const target = Math.min(index, parentNode.children.length)
      parentNode.children.splice(target, 0, node)
    },
    { commit: false },
  )
}

function parentAbsFor(store, node) {
  return node.parent ? { x: node.parent.absX, y: node.parent.absY } : { x: 0, y: 0 }
}

export function CanvasView({ store, version }) {
  const containerRef = React.useRef(null)
  const dragRef = React.useRef(null)
  const spaceRef = React.useRef(false)
  const frameRef = React.useRef(0)
  const pendingRef = React.useRef(null)
  const [editingValue, setEditingValue] = React.useState('')
  const [commentText, setCommentText] = React.useState('')
  const [openComment, setOpenComment] = React.useState(null)
  const [replyText, setReplyText] = React.useState('')
  const [hoverKey, setHoverKey] = React.useState(null)
  const [marquee, setMarquee] = React.useState(null)
  const [drawPreview, setDrawPreview] = React.useState(null)
  const [guides, setGuides] = React.useState([])
  const [spaceHeld, setSpaceHeld] = React.useState(false)
  const [contextMenu, setContextMenu] = React.useState(null)
  const [measurements, setMeasurements] = React.useState([])

  const state = store.state
  const viewport = state.viewport


  // Keep a stable callback surface for window listeners.
  const api = React.useRef({})
  api.current = { store, version }

  React.useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (!rect) return
      store.canvasSize = { width: rect.width, height: rect.height }
      store.emit()
    })
    observer.observe(element)
    store.canvasSize = { width: element.clientWidth, height: element.clientHeight }
    return () => observer.disconnect()
  }, [store])

  React.useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const onWheel = (event) => {
      event.preventDefault()
      const rect = element.getBoundingClientRect()
      const point = { x: event.clientX - rect.left, y: event.clientY - rect.top }
      if (event.ctrlKey || event.metaKey) {
        store.zoomAt(point, Math.exp(-event.deltaY * 0.0015))
      } else {
        const dx = event.shiftKey ? event.deltaY : event.deltaX
        const dy = event.shiftKey ? 0 : event.deltaY
        store.setViewport({ ...store.state.viewport, x: store.state.viewport.x - dx, y: store.state.viewport.y - dy })
      }
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    const onPaste = (event) => {
      // Only the canvas owns paste. Pasting an image into the chat composer
      // must not create a canvas node; require the event target and focus to
      // be inside this canvas tab.
      const root = containerRef.current?.closest?.('.dshc-root')
      const target = event.target
      if (!root || !(target instanceof Node) || !root.contains(target)) return
      const active = document.activeElement
      if (!(active === containerRef.current || containerRef.current?.contains(active))) return
      if (isTyping(target)) return
      const files = [...(event.clipboardData?.files ?? [])]
      if (!files.length) return
      event.preventDefault()
      for (const file of files) if (file.type.startsWith('image/')) store.uploadImageFile(file)
    }
    window.addEventListener('paste', onPaste)
    return () => {
      element.removeEventListener('wheel', onWheel)
      window.removeEventListener('paste', onPaste)
    }
  }, [store])

  React.useEffect(() => {
    if (!state.editingText) return
    setEditingValue(state.editingText.value ?? '')
  }, [state.editingText?.key])

  React.useEffect(() => {
    const onKeyDown = (event) => {
      const viewportElement = containerRef.current
      const insideViewport =
        viewportElement &&
        (document.activeElement === viewportElement || viewportElement.contains(document.activeElement))
      if (!insideViewport && !isTyping(event.target)) return
      if (event.key === ' ' && !isTyping(event.target)) {
        spaceRef.current = true
        setSpaceHeld(true)
        event.preventDefault()
        return
      }
      if (isTyping(event.target)) return
      const key = event.key.toLowerCase()
      const meta = event.metaKey || event.ctrlKey
      const active = api.current.store
      if (event.key === 'Escape') {
        if (active.state.crop) active.cancelCrop()
        else if (active.state.editingText) active.cancelTextEdit()
        else if (active.state.commentDraft) {
          active.state.commentDraft = null
          active.emit()
        } else if (active.state.enteredInstance) active.exitInstance()
        else active.clearSelection()
        return
      }
      if (event.shiftKey && !meta && event.code === 'KeyA') {
        event.preventDefault()
        const targets = active.selectedNodes().filter((node) => node.editable && (node.type === 'frame' || node.type === 'group'))
        for (const node of targets) {
          active.updateNode(node.sourceId, {
            layout: { direction: 'vertical', gap: 8, padding: { top: 12, right: 12, bottom: 12, left: 12 }, alignPrimary: 'start', alignCounter: 'start' },
          })
        }
        return
      }
      if (meta && event.altKey && key === 'k') {
        event.preventDefault()
        active.createComponentFromSelection()
        return
      }
      if (meta && (event.code === 'BracketRight' || event.code === 'BracketLeft')) {
        event.preventDefault()
        const right = event.code === 'BracketRight'
        const kind = right
          ? event.shiftKey ? 'front' : 'forward'
          : event.shiftKey ? 'back' : 'backward'
        active.reorder(kind)
        return
      }
      if (meta && event.shiftKey && key === 'l') {
        event.preventDefault()
        const nodes = active.selectedNodes()
        const lock = !(nodes.length > 0 && nodes.every((node) => node.sourceNode?.locked))
        for (const node of nodes) active.setLocked(node.sourceId, lock)
        return
      }
      if (meta && event.shiftKey && key === 'h') {
        event.preventDefault()
        const nodes = active.selectedNodes()
        const hidden = !(nodes.length > 0 && nodes.every((node) => node.sourceNode?.visible === false))
        for (const node of nodes) active.setVisibility(node.sourceId, hidden)
        return
      }
      if (!meta && event.shiftKey && (event.code === 'Digit1' || event.code === 'Digit2')) {
        event.preventDefault()
        if (event.code === 'Digit1') active.zoomToFit()
        else active.zoomToSelection()
        return
      }
      if (!meta && event.shiftKey && event.code === 'Digit0') {
        event.preventDefault()
        active.setViewport({ ...active.state.viewport, zoom: 1 })
        return
      }
      if (meta && key === 'z') {
        event.preventDefault()
        if (event.shiftKey) active.redo()
        else active.undo()
        return
      }
      if (meta && key === 'a') {
        event.preventDefault()
        const roots = active.state.scene?.roots ?? []
        active.setSelection(roots.map((node) => node.key))
        return
      }
      if (meta && key === 'c') {
        event.preventDefault()
        active.copySelection()
        return
      }
      if (meta && key === 'x') {
        event.preventDefault()
        active.copySelection()
        active.deleteSelection()
        return
      }
      if (meta && key === 'v') {
        event.preventDefault()
        active.paste()
        return
      }
      if (meta && key === 'd') {
        event.preventDefault()
        active.duplicateSelection()
        return
      }
      if (meta && key === 'g') {
        event.preventDefault()
        if (event.shiftKey) active.ungroupSelection()
        else active.groupSelection()
        return
      }
      if (meta && key === '0') {
        event.preventDefault()
        active.setViewport({ ...active.state.viewport, zoom: 1 })
        return
      }
      if (meta && (key === '=' || key === '+')) {
        event.preventDefault()
        const view = active.viewportSize()
        active.zoomAt({ x: view.width / 2, y: view.height / 2 }, 1.2)
        return
      }
      if (meta && key === '-') {
        event.preventDefault()
        const view = active.viewportSize()
        active.zoomAt({ x: view.width / 2, y: view.height / 2 }, 1 / 1.2)
        return
      }
      if (key === '1' && !meta) {
        active.zoomToFit()
        return
      }
      if (key === '2' && !meta) {
        active.zoomToSelection()
        return
      }
      if (key === 'delete' || key === 'backspace') {
        event.preventDefault()
        active.deleteSelection()
        return
      }
      if (key === 'enter') {
        const node = active.primaryNode()
        if (node && (node.type === 'frame' || node.type === 'group') && node.children?.length) {
          active.setSelection([node.children[0].key])
        }
        return
      }
      const arrow = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1] }[key]
      if (arrow) {
        event.preventDefault()
        const step = event.shiftKey ? 10 : 1
        const nodes = active.selectedNodes().filter((node) => node.editable)
        if (!nodes.length) return
        const entries = nodes.map((node) => ({
          sourceId: node.sourceId,
          x: node.sourceNode.x,
          y: node.sourceNode.y,
          absX: node.absX,
          absY: node.absY,
          width: node.width,
          height: node.height,
          parent: node.parent,
        }))
        applyMove(active, entries, arrow[0] * step, arrow[1] * step)
        active.commit()
        active.scheduleSave()
        return
      }
      const tools = { v: 'pointer', f: 'frame', r: 'rect', o: 'ellipse', l: 'line', t: 'text', h: 'hand', c: 'comment', i: 'image' }
      if (!meta && tools[key]) {
        active.setTool(tools[key])
        if (key === 'i') api.current.store.requestImagePick?.()
      }
    }
    const onKeyUp = (event) => {
      if (event.key === ' ') {
        spaceRef.current = false
        setSpaceHeld(false)
      }
      if (event.key === 'Alt') setMeasurements([])
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  const schedule = (fn) => {
    pendingRef.current = fn
    if (frameRef.current) return
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0
      const run = pendingRef.current
      pendingRef.current = null
      run?.()
    })
  }

  const localPoint = (event) => {
    const rect = containerRef.current.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  React.useEffect(() => {
    if (!contextMenu) return
    const close = (event) => {
      if (event.type === 'pointerdown' && event.target?.closest?.('.dshc-context-menu')) return
      setContextMenu(null)
    }
    const onKey = (event) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      setContextMenu(null)
    }
    window.addEventListener('pointerdown', close, true)
    window.addEventListener('wheel', close, { capture: true, passive: true })
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('pointerdown', close, true)
      window.removeEventListener('wheel', close, true)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [contextMenu])

  const onContextMenu = (event) => {
    event.preventDefault()
    if (!containerRef.current) return
    const point = localPoint(event)
    const world = worldPoint(viewport, point)
    const hit = hitTestScene(store.state.scene, world, { enteredInstance: store.state.enteredInstance })
    if (hit && !store.state.selection.includes(hit.key)) store.setSelection([hit.key])
    const rootRect = containerRef.current?.getBoundingClientRect?.()
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200
    const height = typeof window !== 'undefined' ? window.innerHeight : 800
    const maxY = Math.max(8, (rootRect?.bottom ?? height) - 460)
    setContextMenu({
      x: Math.min(Math.max(8, event.clientX), Math.max(8, width - 224)),
      y: Math.min(Math.max(8, event.clientY), maxY),
      fixed: true,
      world,
      hit: hit?.key ?? null,
    })
  }

  const buildMeasurements = (target) => {
    if (!target) return []
    // A 1–2px gap is usually a heading/label sitting against a card, not the
    // spacing the user is trying to inspect. Skip it and use the next object.
    const MIN_GAP = 4
    const box = {
      l: target.absX,
      t: target.absY,
      r: target.absX + target.width,
      b: target.absY + target.height,
    }
    const siblings = (target.parent?.children ?? store.state.scene?.roots ?? []).filter(
      (node) => node && node !== target && node.visible !== false,
    )
    let left = null
    let right = null
    let above = null
    let below = null
    for (const sibling of siblings) {
      const sb = {
        l: sibling.absX,
        t: sibling.absY,
        r: sibling.absX + sibling.width,
        b: sibling.absY + sibling.height,
      }
      const overlapY = Math.min(box.b, sb.b) - Math.max(box.t, sb.t)
      if (overlapY > 0) {
        const leftGap = box.l - sb.r
        const rightGap = sb.l - box.r
        if (leftGap >= MIN_GAP && (!left || sb.r > left.node.r)) left = { node: sb, gap: leftGap, cross: (Math.max(box.t, sb.t) + Math.min(box.b, sb.b)) / 2 }
        if (rightGap >= MIN_GAP && (!right || sb.l < right.node.l)) right = { node: sb, gap: rightGap, cross: (Math.max(box.t, sb.t) + Math.min(box.b, sb.b)) / 2 }
      }
      const overlapX = Math.min(box.r, sb.r) - Math.max(box.l, sb.l)
      if (overlapX > 0) {
        const aboveGap = box.t - sb.b
        const belowGap = sb.t - box.b
        if (aboveGap >= MIN_GAP && (!above || sb.b > above.node.b)) above = { node: sb, gap: aboveGap, cross: (Math.max(box.l, sb.l) + Math.min(box.r, sb.r)) / 2 }
        if (belowGap >= MIN_GAP && (!below || sb.t < below.node.t)) below = { node: sb, gap: belowGap, cross: (Math.max(box.l, sb.l) + Math.min(box.r, sb.r)) / 2 }
      }
    }
    const result = []
    const push = (axis, gap, cross, from, to) => {
      if (!(gap > 0)) return
      const a = screenPoint(viewport, { x: from, y: cross })
      const b = screenPoint(viewport, { x: to, y: cross })
      result.push({
        axis,
        x1: axis === 'h' ? a.x : cross === undefined ? a.x : a.x,
        y1: axis === 'h' ? a.y : a.y,
        x2: axis === 'h' ? b.x : b.x,
        y2: axis === 'h' ? b.y : b.y,
        label: String(Math.round(gap)),
      })
    }
    if (left) push('h', left.gap, left.cross, left.node.r, box.l)
    if (right) push('h', right.gap, right.cross, box.r, right.node.l)
    if (above) {
      const a = screenPoint(viewport, { x: above.cross, y: above.node.b })
      const b = screenPoint(viewport, { x: above.cross, y: box.t })
      result.push({ axis: 'v', x1: a.x, y1: a.y, x2: b.x, y2: b.y, label: String(Math.round(above.gap)) })
    }
    if (below) {
      const a = screenPoint(viewport, { x: below.cross, y: box.b })
      const b = screenPoint(viewport, { x: below.cross, y: below.node.t })
      result.push({ axis: 'v', x1: a.x, y1: a.y, x2: b.x, y2: b.y, label: String(Math.round(below.gap)) })
    }
    return result
  }

  const onPointerDown = (event) => {
    if (event.button === 2) return
    setMeasurements([])
    containerRef.current?.focus?.({ preventScroll: true })
    const target = event.target
    const point = localPoint(event)
    const world = worldPoint(viewport, point)
    store.canvasSize = { width: containerRef.current.clientWidth, height: containerRef.current.clientHeight }

    if (target.closest?.('[data-comment-pin]')) return
    if (state.editingText) {
      // Clicking outside the text overlay commits it.
      return
    }

    const handle = target.closest?.('[data-handle]')?.getAttribute('data-handle')
    if (handle) {
      event.preventDefault()
      startResize(handle, point, event.pointerId)
      return
    }

    const pan = event.button === 1 || spaceRef.current || state.tool === 'hand'
    if (pan) {
      event.preventDefault()
      dragRef.current = { mode: 'pan', startScreen: point, startViewport: { ...viewport } }
      containerRef.current.setPointerCapture?.(event.pointerId)
      return
    }

    if (state.crop) {
      const cropNode = store.findSceneNode(state.crop.key)
      if (cropNode && pointInNode(cropNode, world)) {
        dragRef.current = {
          mode: 'crop',
          start: world,
          startCrop: { ...state.crop.crop },
          node: cropNode,
        }
        containerRef.current.setPointerCapture?.(event.pointerId)
        return
      }
    }

    if (state.tool === 'comment') {
      const hit = hitTestScene(store.state.scene, world, { enteredInstance: store.state.enteredInstance })
      store.state.commentDraft = {
        x: world.x,
        y: world.y,
        nodeId: hit?.sourceId,
        screenX: point.x,
        screenY: point.y,
      }
      store.emit()
      return
    }

    if (['frame', 'rect', 'ellipse', 'line', 'text'].includes(state.tool)) {
      const hitParent = containerAt(store, world)
      const parent = hitParent?.type === 'instance' ? null : hitParent
      dragRef.current = {
        mode: 'draw',
        tool: state.tool,
        start: world,
        parent,
        startScreen: point,
      }
      setDrawPreview({ x: point.x, y: point.y, width: 0, height: 0 })
      containerRef.current.setPointerCapture?.(event.pointerId)
      return
    }

    const hit = hitTestScene(store.state.scene, world, { enteredInstance: store.state.enteredInstance })
    if (!hit) {
      dragRef.current = { mode: 'marquee', start: world, startScreen: point, container: containerAt(store, world) }
      setMarquee({ x: point.x, y: point.y, width: 0, height: 0 })
      if (!event.shiftKey) store.clearSelection()
      containerRef.current.setPointerCapture?.(event.pointerId)
      return
    }

    if (event.shiftKey) {
      store.toggleSelection(hit.key)
      return
    }
    if (!store.state.selection.includes(hit.key)) store.setSelection([hit.key])
    const nodes = store.selectedNodes().filter((node) => node.editable)
    if (!nodes.length) return
    const entries = nodes.map((node) => ({
      key: node.key,
      sourceId: node.sourceId,
      x: node.sourceNode.x,
      y: node.sourceNode.y,
      absX: node.absX,
      absY: node.absY,
      width: node.width,
      height: node.height,
      parent: node.parent,
      layoutParent: node.parent?.layout && node.parent.type !== 'instance' ? node.parent : null,
      node,
    }))
    dragRef.current = {
      mode: 'move',
      start: world,
      startScreen: point,
      entries,
      moved: false,
      alt: event.altKey,
      duplicated: false,
    }
    containerRef.current.setPointerCapture?.(event.pointerId)
  }

  const containerAt = (store, world) => {
    const hit = hitTestScene(store.state.scene, world, { enteredInstance: store.state.enteredInstance })
    if (!hit) return null
    let node = hit
    while (node) {
      if (node.type === 'frame' || node.type === 'instance') return node
      node = node.parent
    }
    return null
  }

  const startResize = (handle, point, pointerId) => {
    const node = store.primaryNode()
    if (!node || !node.editable) return
    if (handle === 'rotate') {
      const center = screenPoint(viewport, centerOf(node))
      dragRef.current = {
        mode: 'rotate',
        node,
        startAngle: Math.atan2(point.y - center.y, point.x - center.x),
        startRotation: node.rotation ?? 0,
      }
      containerRef.current.setPointerCapture?.(pointerId)
      return
    }
    dragRef.current = {
      mode: 'resize',
      handle,
      node,
      startWidth: node.width,
      startHeight: node.height,
      startAbsX: node.absX,
      startAbsY: node.absY,
      startX: node.sourceNode.x,
      startY: node.sourceNode.y,
      startRotation: node.rotation ?? 0,
      parentAbs: parentAbsFor(store, node),
    }
    containerRef.current.setPointerCapture?.(pointerId)
  }

  const onPointerMove = (event) => {
    const drag = dragRef.current
    const point = localPoint(event)
    const world = worldPoint(viewport, point)
    if (!drag) {
      const hit = hitTestScene(store.state.scene, world, { enteredInstance: store.state.enteredInstance })
      if ((hit?.key ?? null) !== hoverKey) setHoverKey(hit?.key ?? null)
      if (event.altKey && !state.editingText) {
        // Keep the selected layer as the measurement anchor: hit-testing a
        // nested child on every pointer move makes the guides jump between
        // child nodes. With no selection, fall back to the hovered node.
        setMeasurements(buildMeasurements(store.primaryNode() ?? hit))
      } else if (measurements.length) {
        setMeasurements([])
      }
      return
    }
    if (drag.mode === 'pan') {
      store.setViewport({
        ...drag.startViewport,
        x: drag.startViewport.x + (point.x - drag.startScreen.x),
        y: drag.startViewport.y + (point.y - drag.startScreen.y),
      })
      return
    }
    if (drag.mode === 'crop') {
      const dx = (world.x - drag.start.x) / drag.node.width
      const dy = (world.y - drag.start.y) / drag.node.height
      const crop = { ...drag.startCrop }
      crop.x = Math.min(1 - crop.width, Math.max(0, drag.startCrop.x - dx * crop.width))
      crop.y = Math.min(1 - crop.height, Math.max(0, drag.startCrop.y - dy * crop.height))
      store.updateCrop(crop)
      return
    }
    if (drag.mode === 'marquee') {
      const x = Math.min(drag.startScreen.x, point.x)
      const y = Math.min(drag.startScreen.y, point.y)
      setMarquee({ x, y, width: Math.abs(point.x - drag.startScreen.x), height: Math.abs(point.y - drag.startScreen.y) })
      return
    }
    if (drag.mode === 'draw') {
      const x = Math.min(drag.startScreen.x, point.x)
      const y = Math.min(drag.startScreen.y, point.y)
      setDrawPreview({ x, y, width: Math.abs(point.x - drag.startScreen.x), height: Math.abs(point.y - drag.startScreen.y) })
      return
    }
    if (drag.mode === 'move') {
      const rawDx = world.x - drag.start.x
      const rawDy = world.y - drag.start.y
      if (!drag.moved && Math.abs(rawDx) + Math.abs(rawDy) > 0.5) {
        drag.moved = true
        if (drag.alt) {
          store.duplicateSelection()
          drag.entries = store.selectedNodes().filter((node) => node.editable).map((node) => ({
            key: node.key,
            sourceId: node.sourceId,
            x: node.sourceNode.x,
            y: node.sourceNode.y,
            absX: node.absX,
            absY: node.absY,
            width: node.width,
            height: node.height,
            parent: node.parent,
            node,
          }))
          drag.duplicated = true
        }
      }
      if (drag.entries.length === 1 && drag.entries[0].layoutParent) {
        schedule(() => reorderInLayout(store, drag.entries[0], world))
        return
      }
      schedule(() => {
        const snap = snapForMove(store, drag.entries, rawDx, rawDy, drag.duplicated || event.altKey)
        applyMove(store, drag.entries, snap.dx, snap.dy)
        setGuides(snap.guides)
      })
      return
    }
    if (drag.mode === 'resize') {
      schedule(() => resizeTo(drag, world, event.shiftKey))
      return
    }
    if (drag.mode === 'rotate') {
      const center = screenPoint(store.state.viewport, centerOf(drag.node))
      const angle = Math.atan2(point.y - center.y, point.x - center.x)
      const delta = ((angle - drag.startAngle) * 180) / Math.PI
      store.mutate(
        (doc) => {
          const node = findDocNode(store, drag.node.sourceId)
          if (node) node.rotation = Math.round((drag.startRotation + delta) * 10) / 10
        },
        { commit: false },
      )
      return
    }
  }

  const resizeTo = (drag, world, preserveAspect) => {
    const node = drag.node
    const start = {
      ...node,
      absX: drag.startAbsX,
      absY: drag.startAbsY,
      width: drag.startWidth,
      height: drag.startHeight,
      rotation: drag.startRotation,
    }
    const local = toLocal(start, world)
    const handle = drag.handle
    let width = drag.startWidth
    let height = drag.startHeight
    let fixedLocal
    let anchorPage
    const right = drag.startAbsX + drag.startWidth
    const bottom = drag.startAbsY + drag.startHeight
    if (handle.includes('w')) width = Math.max(1, drag.startWidth - local.x)
    if (handle.includes('e')) width = Math.max(1, local.x)
    if (handle.includes('n')) height = Math.max(1, drag.startHeight - local.y)
    if (handle.includes('s')) height = Math.max(1, local.y)
    if (preserveAspect && handle.length === 2 && drag.startWidth > 0 && drag.startHeight > 0) {
      const ratio = drag.startWidth / drag.startHeight
      if (width / height > ratio) width = height * ratio
      else height = width / ratio
    }
    // Fixed corner/edge in the NEW local box and in page space.
    if (handle === 'nw') {
      fixedLocal = { x: width, y: height }
      anchorPage = toPage(start, { x: drag.startWidth, y: drag.startHeight })
    } else if (handle === 'ne') {
      fixedLocal = { x: 0, y: height }
      anchorPage = toPage(start, { x: 0, y: drag.startHeight })
    } else if (handle === 'sw') {
      fixedLocal = { x: width, y: 0 }
      anchorPage = toPage(start, { x: drag.startWidth, y: 0 })
    } else if (handle === 'se') {
      fixedLocal = { x: 0, y: 0 }
      anchorPage = toPage(start, { x: 0, y: 0 })
    } else if (handle === 'n') {
      fixedLocal = { x: width / 2, y: height }
      anchorPage = toPage(start, { x: drag.startWidth / 2, y: drag.startHeight })
    } else if (handle === 's') {
      fixedLocal = { x: width / 2, y: 0 }
      anchorPage = toPage(start, { x: drag.startWidth / 2, y: 0 })
    } else if (handle === 'w') {
      fixedLocal = { x: width, y: height / 2 }
      anchorPage = toPage(start, { x: drag.startWidth, y: drag.startHeight / 2 })
    } else {
      fixedLocal = { x: 0, y: height / 2 }
      anchorPage = toPage(start, { x: 0, y: drag.startHeight / 2 })
    }
    const angle = ((drag.startRotation ?? 0) * Math.PI) / 180
    const localCenter = { x: width / 2, y: height / 2 }
    const dx = localCenter.x - fixedLocal.x
    const dy = localCenter.y - fixedLocal.y
    const centerPage = {
      x: anchorPage.x + dx * Math.cos(angle) - dy * Math.sin(angle),
      y: anchorPage.y + dx * Math.sin(angle) + dy * Math.cos(angle),
    }
    const absX = centerPage.x - width / 2
    const absY = centerPage.y - height / 2
    store.mutate(
      (doc) => {
        const docNode = findDocNode(store, drag.node.sourceId)
        if (!docNode) return
        docNode.width = Math.round(width)
        docNode.height = Math.round(height)
        docNode.x = Math.round(absX - drag.parentAbs.x)
        docNode.y = Math.round(absY - drag.parentAbs.y)
      },
      { commit: false },
    )
  }

  const onPointerUp = (event) => {
    const drag = dragRef.current
    dragRef.current = null
    setGuides([])
    if (!drag) return
    if (drag.mode === 'marquee') {
      const end = localPoint(event)
      const x = Math.min(drag.startScreen.x, end.x)
      const y = Math.min(drag.startScreen.y, end.y)
      const width = Math.abs(end.x - drag.startScreen.x)
      const height = Math.abs(end.y - drag.startScreen.y)
      setMarquee(null)
      if (width > 3 || height > 3) {
        const start = worldPoint(viewport, { x, y })
        const worldRect = {
          x: start.x,
          y: start.y,
          width: width / viewport.zoom,
          height: height / viewport.zoom,
        }
        const pool = drag.container
          ? drag.container.children ?? []
          : store.state.scene?.roots ?? []
        const keys = pool.filter((node) => node.visible !== false && rectsIntersect(worldRect, {
          x: node.absX,
          y: node.absY,
          width: node.width,
          height: node.height,
        })).map((node) => node.key)
        store.setSelection(keys)
      };
      return
    }
    if (drag.mode === 'draw') {
      setDrawPreview(null)
      const end = localPoint(event)
      const startWorld = drag.start
      const endWorld = worldPoint(viewport, end)
      const signedWidth = endWorld.x - startWorld.x
      const signedHeight = endWorld.y - startWorld.y
      const width = Math.abs(signedWidth)
      const height = Math.abs(signedHeight)
      const parent = drag.parent
      const parentAbs = parent ? { x: parent.absX, y: parent.absY } : { x: 0, y: 0 }
      const tiny = width < 4 && height < 4
      const defaults = {
        frame: { width: 320, height: 480 },
        rect: { width: 120, height: 120 },
        ellipse: { width: 120, height: 120 },
        text: { width: 200, height: 28 },
        line: { width: 160, height: 0 },
      }[drag.tool]
      const finalWidth = tiny ? defaults.width : Math.max(2, width)
      const finalHeight = tiny ? defaults.height : Math.max(drag.tool === 'line' ? 0 : 2, height)
      let x = tiny ? startWorld.x : Math.min(startWorld.x, endWorld.x)
      let y = tiny ? startWorld.y : Math.min(startWorld.y, endWorld.y)
      let rotation = 0
      if (drag.tool === 'line' && !tiny) {
        const distance = Math.max(2, Math.hypot(signedWidth, signedHeight))
        x = (startWorld.x + endWorld.x) / 2 - distance / 2
        y = (startWorld.y + endWorld.y) / 2
        rotation = (Math.atan2(signedHeight, signedWidth) * 180) / Math.PI
      }
      const node = {
        type: drag.tool,
        name: drag.tool === 'text' ? 'Text' : drag.tool === 'frame' ? 'Frame' : drag.tool === 'rect' ? 'Rectangle' : drag.tool === 'ellipse' ? 'Ellipse' : 'Line',
        x: x - parentAbs.x,
        y: y - parentAbs.y,
        width: drag.tool === 'line' && !tiny ? Math.max(2, Math.hypot(signedWidth, signedHeight)) : finalWidth,
        height: drag.tool === 'line' ? 0 : finalHeight,
        rotation,
        opacity: 1,
        visible: true,
        locked: false,
      }
      if (drag.tool === 'frame') {
        Object.assign(node, { fills: [{ type: 'solid', color: '#FFFFFF' }], strokes: [], effects: [], cornerRadius: 0, clip: true, children: [] })
      } else if (drag.tool === 'rect' || drag.tool === 'ellipse') {
        Object.assign(node, { fills: [{ type: 'solid', color: '#D9D9D9' }], strokes: [], effects: [], cornerRadius: 0 })
      } else if (drag.tool === 'text') {
        Object.assign(node, {
          text: 'Text',
          font: { family: 'system-ui', weight: 400, style: 'normal', size: 16, lineHeight: 1.4, letterSpacing: 0 },
          align: 'left',
          verticalAlign: 'top',
          fills: [{ type: 'solid', color: '#111111' }],
          effects: [],
          autoHeight: true,
        })
      } else if (drag.tool === 'line') {
        Object.assign(node, { strokes: [{ color: '#111111', width: 1, align: 'center' }] })
      }
      const created = store.addNode(node, parent?.sourceId ?? null)
      if (created) {
        store.setTool('pointer')
        if (created.type === 'text') store.beginTextEdit(created.id)
      }
      return
    }
    if (drag.mode === 'crop') {
      store.commitCrop()
      return
    }
    if (drag.mode === 'move' || drag.mode === 'resize' || drag.mode === 'rotate') {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = 0
        const run = pendingRef.current
        pendingRef.current = null
        run?.()
      }
      store.commit()
      store.scheduleSave()
      store.queueSelectionPost()
    }
  }

  const onDoubleClick = (event) => {
    const point = localPoint(event)
    const world = worldPoint(viewport, point)
    const deep = hitTestScene(store.state.scene, world, { enteredInstance: store.state.enteredInstance, deep: true })
    if (!deep) return
    if (deep.type === 'text') {
      store.beginTextEdit(deep.key)
      return
    }
    if (deep.type === 'instance') {
      store.enterInstance(deep.key)
      return
    }
    if (deep.type === 'frame' || deep.type === 'group') {
      if (deep.children?.length) store.setSelection([deep.children[0].key])
      return
    }
    if (deep.instanceId && store.state.enteredInstance === deep.instanceId) {
      store.setSelection([deep.key])
      return
    }
  }

  const renderOverlay = () => {
    const selected = store.selectedNodes()
    const primary = store.primaryNode()
    const overlay = []
    for (const node of selected) {
      const points = nodeQuad(node).map((point) => screenPoint(viewport, point))
      overlay.push(
        React.createElement('polygon', {
          key: `outline-${node.key}`,
          points: points.map((point) => `${point.x},${point.y}`).join(' '),
          fill: 'none',
          stroke: 'var(--dshc-accent)',
          strokeWidth: 1,
        }),
      )
    }
    if (hoverKey && !state.selection.includes(hoverKey)) {
      const node = store.findSceneNode(hoverKey)
      if (node) {
        const points = nodeQuad(node).map((point) => screenPoint(viewport, point))
        overlay.push(
          React.createElement('polygon', {
            key: 'hover',
            points: points.map((point) => `${point.x},${point.y}`).join(' '),
            fill: 'none',
            stroke: 'var(--dshc-accent)',
            strokeWidth: 1,
            opacity: 0.55,
          }),
        )
      }
    }
    if (primary && selected.length === 1 && primary.editable && !state.crop) {
      const handles = handlePoints(primary, viewport)
      for (const [name, point] of Object.entries(handles)) {
        overlay.push(
          React.createElement('rect', {
            key: `handle-${name}`,
            x: point.x - HANDLE_SIZE / 2,
            y: point.y - HANDLE_SIZE / 2,
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
            fill: 'var(--dsw-alias-bg-base)',
            stroke: 'var(--dshc-accent)',
            strokeWidth: 1,
            style: { cursor: name === 'n' || name === 's' ? 'ns-resize' : name === 'e' || name === 'w' ? 'ew-resize' : name === 'nw' || name === 'se' ? 'nwse-resize' : 'nesw-resize' },
            'data-handle': name,
          }),
        )
      }
      const rotate = rotateHandlePoint(primary, viewport)
      const top = screenPoint(viewport, toPage(primary, { x: primary.width / 2, y: 0 }))
      overlay.push(
        React.createElement('line', { key: 'rotate-line', x1: top.x, y1: top.y, x2: rotate.x, y2: rotate.y, stroke: 'var(--dshc-accent)', strokeWidth: 1 }),
        React.createElement('circle', { key: 'rotate', cx: rotate.x, cy: rotate.y, r: 5, fill: 'var(--dsw-alias-bg-base)', stroke: 'var(--dshc-accent)', strokeWidth: 1, 'data-handle': 'rotate', style: { cursor: 'grab' } }),
      )
    }
    for (const guide of guides) {
      if (guide.axis === 'x') {
        const x = guide.value * viewport.zoom + viewport.x
        overlay.push(React.createElement('line', { key: `guide-${guide.value}`, x1: x, y1: 0, x2: x, y2: '100%', stroke: 'var(--dsw-alias-state-error-primary)', strokeWidth: 1, strokeDasharray: '4 4' }))
      } else {
        const y = guide.value * viewport.zoom + viewport.y
        overlay.push(React.createElement('line', { key: `guide-${guide.value}`, x1: 0, y1: y, x2: '100%', y2: y, stroke: 'var(--dsw-alias-state-error-primary)', strokeWidth: 1, strokeDasharray: '4 4' }))
      }
    }
    if (marquee) {
      overlay.push(React.createElement('rect', { key: 'marquee', x: marquee.x, y: marquee.y, width: marquee.width, height: marquee.height, fill: 'color-mix(in srgb, var(--dshc-accent) 10%, transparent)', stroke: 'var(--dshc-accent)', strokeWidth: 1, strokeDasharray: '4 3' }))
    }
    if (drawPreview) {
      overlay.push(React.createElement('rect', { key: 'draw', x: drawPreview.x, y: drawPreview.y, width: drawPreview.width, height: drawPreview.height, fill: 'none', stroke: 'var(--dshc-accent)', strokeWidth: 1, strokeDasharray: '4 3' }))
    }
    if (state.crop) {
      const node = store.findSceneNode(state.crop.key)
      if (node) {
        const crop = state.crop.crop
        const quad = [
          screenPoint(viewport, toPage(node, { x: crop.x * node.width, y: crop.y * node.height })),
          screenPoint(viewport, toPage(node, { x: (crop.x + crop.width) * node.width, y: crop.y * node.height })),
          screenPoint(viewport, toPage(node, { x: (crop.x + crop.width) * node.width, y: (crop.y + crop.height) * node.height })),
          screenPoint(viewport, toPage(node, { x: crop.x * node.width, y: (crop.y + crop.height) * node.height })),
        ]
        overlay.push(React.createElement('polygon', { key: 'crop', points: quad.map((point) => `${point.x},${point.y}`).join(' '), fill: 'none', stroke: 'var(--dshc-accent)', strokeWidth: 2 }))
      }
    }
    for (const [index, measure] of measurements.entries()) {
      const color = '#FF4D6D'
      overlay.push(
        React.createElement('line', {
          key: `measure-line-${index}`,
          x1: measure.x1,
          y1: measure.y1,
          x2: measure.x2,
          y2: measure.y2,
          stroke: color,
          strokeWidth: 1,
        }),
      )
      const tick = 4
      if (measure.axis === 'h') {
        overlay.push(
          React.createElement('line', { key: `measure-t1-${index}`, x1: measure.x1, y1: measure.y1 - tick, x2: measure.x1, y2: measure.y1 + tick, stroke: color, strokeWidth: 1 }),
          React.createElement('line', { key: `measure-t2-${index}`, x1: measure.x2, y1: measure.y2 - tick, x2: measure.x2, y2: measure.y2 + tick, stroke: color, strokeWidth: 1 }),
        )
      } else {
        overlay.push(
          React.createElement('line', { key: `measure-t1-${index}`, x1: measure.x1 - tick, y1: measure.y1, x2: measure.x1 + tick, y2: measure.y1, stroke: color, strokeWidth: 1 }),
          React.createElement('line', { key: `measure-t2-${index}`, x1: measure.x2 - tick, y1: measure.y2, x2: measure.x2 + tick, y2: measure.y2, stroke: color, strokeWidth: 1 }),
        )
      }
      const midX = (measure.x1 + measure.x2) / 2
      const midY = (measure.y1 + measure.y2) / 2
      const labelW = Math.max(20, measure.label.length * 6 + 8)
      const labelX = measure.axis === 'h' ? midX - labelW / 2 : midX + 6
      const labelY = measure.axis === 'h' ? midY - 13 : midY - 7
      overlay.push(
        React.createElement('rect', { key: `measure-bg-${index}`, x: labelX, y: labelY, width: labelW, height: 14, rx: 3, fill: color }),
        React.createElement('text', {
          key: `measure-text-${index}`,
          x: labelX + labelW / 2,
          y: labelY + 10,
          fill: '#FFFFFF',
          fontSize: 9,
          fontFamily: 'system-ui',
          textAnchor: 'middle',
        }, measure.label),
      )
    }
    return overlay
  }

  const editingNode = state.editingText ? store.findSceneNode(state.editingText.key) : null
  const comments = (state.doc?.comments ?? []).filter((comment) => comment.pageId === state.pageId)
  const visibleComments = state.showComments ? comments.filter((comment) => !comment.resolved) : []
  const primary = store.primaryNode()
  const paint = primary && primary.type === 'text' ? primaryPaint(primary) : { color: 'var(--dsw-alias-label-primary)' }
  const menuItems = contextMenu ? buildSelectionMenu(store) : []

  return React.createElement(
    'div',
    {
      ref: containerRef,
      className: `${P}-viewport`,
      'data-tool': state.tool,
      tabIndex: -1,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onPointerLeave: () => setMeasurements([]),
      onDoubleClick,
      onContextMenu,
      onDragOver: (event) => {
        if (event.dataTransfer?.types?.includes('Files')) event.preventDefault()
      },
      onDrop: (event) => {
        const files = [...(event.dataTransfer?.files ?? [])]
        if (!files.length) return
        event.preventDefault()
        for (const file of files) if (file.type.startsWith('image/')) store.uploadImageFile(file)
      },
      style: {
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        cursor:
          state.tool === 'hand' || spaceHeld
            ? 'grab'
            : state.tool === 'comment'
              ? 'crosshair'
              : state.tool === 'pointer'
                ? 'default'
                : 'crosshair',
        background: 'var(--dsw-alias-bg-base)',
        backgroundImage:
          'radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--dsw-alias-label-primary) 12%, transparent) 1px, transparent 0)',
        backgroundSize: '16px 16px',
        userSelect: 'none',
      },
    },
    React.createElement(
      'div',
      {
        className: `${P}-world`,
        style: {
          position: 'absolute',
          left: 0,
          top: 0,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
        },
      },
      React.createElement(SceneView, { scene: state.scene, store }),
    ),
    React.createElement(
      'svg',
      {
        className: `${P}-overlay`,
        style: { position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' },
      },
      renderOverlay(),
    ),
    (state.scene?.roots ?? [])
      .filter((node) => node.type === 'frame' && node.visible !== false)
      .map((node) =>
        React.createElement(FrameLabel, {
          key: `frame-label-${node.key}`,
          node,
          viewport,
          selected: state.selection.includes(node.key),
          onSelect: () => {
            store.setSelection([node.key])
            store.emit()
          },
        }),
      ),
    hoverKey &&
      !((state.scene?.roots ?? []).some((node) => node.key === hoverKey && node.type === 'frame')) &&
      React.createElement(HoverLabel, { node: store.findSceneNode(hoverKey), viewport, key: `hover-label-${hoverKey}` }),
    state.editingText &&
      editingNode &&
      React.createElement(TextEditor, {
        key: `edit-${editingNode.key}`,
        node: editingNode,
        viewport,
        value: editingValue,
        onChange: setEditingValue,
        onCommit: () => store.commitTextEdit(editingValue),
        onCancel: () => store.cancelTextEdit(),
      }),
    state.commentDraft &&
      React.createElement(CommentDraft, {
        draft: state.commentDraft,
        value: commentText,
        onChange: setCommentText,
        onCancel: () => {
          state.commentDraft = null
          setCommentText('')
          store.emit()
        },
        onSave: () => {
          store.addComment(commentText, { nodeId: state.commentDraft.nodeId, x: state.commentDraft.x, y: state.commentDraft.y })
          setCommentText('')
        },
      }),
    visibleComments.map((comment) =>
      React.createElement(
        'button',
        {
          key: comment.id,
          type: 'button',
          'data-comment-pin': comment.id,
          className: `${P}-comment-pin ${comment.author === 'ai' ? `${P}-comment-pin-ai` : ''}`,
          style: (() => {
            const point = store.commentPosition(comment)
            return { left: point.x, top: point.y }
          })(),
          onClick: (event) => {
            event.stopPropagation()
            setOpenComment(openComment === comment.id ? null : comment.id)
            const node = comment.nodeId ? store.findSceneNode(comment.nodeId) : null
            if (node) store.setSelection([node.key])
          },
          title: comment.body,
        },
        comment.replies?.length ? String(comment.replies.length + 1) : '1',
      ),
    ),
    openComment &&
      (() => {
        const comment = comments.find((entry) => entry.id === openComment)
        if (!comment) return null
        const point = store.commentPosition(comment)
        return React.createElement(CommentThread, {
          comment,
          position: point,
          replyText,
          onReplyChange: setReplyText,
          onReply: () => {
            store.replyComment(comment.id, replyText)
            setReplyText('')
          },
          onResolve: () => {
            store.resolveComment(comment.id, true)
            setOpenComment(null)
          },
          onDelete: () => {
            store.deleteComment(comment.id)
            setOpenComment(null)
          },
          onClose: () => setOpenComment(null),
        })
      })(),
    state.crop &&
      React.createElement(CropBar, {
        crop: state.crop.crop,
        onChange: (crop) => store.updateCrop(crop),
        onCommit: () => store.commitCrop(),
        onCancel: () => store.cancelCrop(),
      }),
    contextMenu &&
      React.createElement(ContextMenu, { x: contextMenu.x, y: contextMenu.y, fixed: contextMenu.fixed, items: menuItems, onClose: () => setContextMenu(null) }),
    !state.scene?.roots?.length &&
      React.createElement(
        'div',
        { className: `${P}-empty`, style: { pointerEvents: 'none' } },
        React.createElement('div', { className: `${P}-empty-title` }, '画布是空的'),
        React.createElement('div', { className: `${P}-empty-text` }, '用工具栏画一个 Frame，或点「让 AI 生成」'),
      ),
  )
}

function FrameLabel({ node, viewport, selected, onSelect }) {
  const page = toPage(node, { x: 0, y: 0 })
  const point = screenPoint(viewport, page)
  return React.createElement(
    'div',
    {
      className: `${P}-frame-label ${selected ? 'is-selected' : ''}`,
      style: {
        position: 'absolute',
        left: point.x,
        top: point.y - 6,
        transform: 'translateY(-100%)',
        maxWidth: 220,
        padding: '1px 6px',
        borderRadius: 4,
        font: '500 11px/1.5 var(--dsw-font-family, system-ui, sans-serif)',
        background: selected ? 'var(--dshc-accent)' : 'var(--dsw-alias-label-primary)',
        color: selected ? '#FFFFFF' : 'var(--dsw-alias-bg-base)',
        opacity: selected ? 1 : 0.78,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        cursor: 'pointer',
        pointerEvents: 'auto',
        userSelect: 'none',
        zIndex: 9,
      },
      title: node.name,
      onPointerDown: (event) => {
        event.preventDefault()
        event.stopPropagation()
        onSelect?.()
      },
    },
    node.name || 'Frame',
  )
}

function HoverLabel({ node, viewport }) {
  if (!node) return null
  const point = screenPoint(viewport, { x: node.absX, y: node.absY - 18 / viewport.zoom })
  return React.createElement(
    'div',
    {
      className: `${P}-hover-label`,
      style: { position: 'absolute', left: point.x, top: point.y, pointerEvents: 'none' },
    },
    node.name,
  )
}

function TextEditor({ node, viewport, value, onChange, onCommit, onCancel }) {
  const ref = React.useRef(null)
  React.useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])
  const left = node.absX * viewport.zoom + viewport.x
  const top = node.absY * viewport.zoom + viewport.y
  const width = Math.max(24, node.width * viewport.zoom)
  const height = Math.max(20, node.height * viewport.zoom)
  const paint = primaryPaint(node)
  return React.createElement(
    'textarea',
    {
      ref,
      className: `${P}-text-editor`,
      value,
      onChange: (event) => onChange(event.target.value),
      onPointerDown: (event) => event.stopPropagation(),
      onBlur: onCommit,
      onKeyDown: (event) => {
        event.stopPropagation()
        if (event.key === 'Escape') {
          event.preventDefault()
          onCancel()
        } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
          event.preventDefault()
          onCommit()
        }
      },
      style: {
        position: 'absolute',
        left,
        top,
        width,
        height,
        padding: 0,
        margin: 0,
        border: '1px solid var(--dshc-accent)',
        outline: 'none',
        resize: 'none',
        overflow: 'hidden',
        background: 'color-mix(in srgb, var(--dsw-alias-bg-overlay) 88%, transparent)',
        color: paint.color === 'transparent' ? 'var(--dsw-alias-label-primary)' : paint.color,
        fontFamily: `"${node.font?.family ?? 'system-ui'}", system-ui, sans-serif`,
        fontWeight: node.font?.weight ?? 400,
        fontStyle: node.font?.style ?? 'normal',
        fontSize: `${(node.font?.size ?? 14) * viewport.zoom}px`,
        lineHeight: String(node.font?.lineHeight ?? 1.4),
        letterSpacing: `${(node.font?.letterSpacing ?? 0) * viewport.zoom}px`,
        textAlign: node.align ?? 'left',
        zIndex: 20,
        borderRadius: 2,
      },
    },
  )
}

function CommentDraft({ draft, value, onChange, onCancel, onSave }) {
  return React.createElement(
    'div',
    {
      className: `${P}-comment-popover`,
      style: { left: Math.max(8, draft.screenX), top: Math.max(8, draft.screenY) },
      onPointerDown: (event) => event.stopPropagation(),
    },
    React.createElement('div', { className: `${P}-comment-title` }, '添加评论'),
    React.createElement('textarea', {
      autoFocus: true,
      value,
      onChange: (event) => onChange(event.target.value),
      placeholder: '写下设计反馈…',
      className: `${P}-comment-input`,
      rows: 3,
    }),
    React.createElement(
      'div',
      { className: `${P}-comment-actions` },
      React.createElement('button', { type: 'button', onClick: onCancel, className: `${P}-btn` }, '取消'),
      React.createElement('button', { type: 'button', onClick: onSave, className: `${P}-btn ${P}-btn-primary`, disabled: !value.trim() }, '评论'),
    ),
  )
}

function CommentThread({ comment, position, replyText, onReplyChange, onReply, onResolve, onDelete, onClose }) {
  return React.createElement(
    'div',
    {
      className: `${P}-comment-popover`,
      style: { left: Math.max(8, position.x + 14), top: Math.max(8, position.y - 8) },
      onPointerDown: (event) => event.stopPropagation(),
    },
    React.createElement('div', { className: `${P}-comment-title` }, comment.resolved ? '已解决评论' : '评论'),
    React.createElement('div', { className: `${P}-comment-author` }, comment.author === 'ai' ? 'AI' : '你'),
    React.createElement('div', { className: `${P}-comment-body` }, comment.body),
    (comment.replies ?? []).map((reply) =>
      React.createElement(
        'div',
        { key: reply.id, className: `${P}-comment-reply` },
        React.createElement('b', null, reply.author === 'ai' ? 'AI' : '你'),
        React.createElement('span', null, reply.body),
      ),
    ),
    !comment.resolved &&
      React.createElement(
        'div',
        null,
        React.createElement('textarea', {
          value: replyText,
          onChange: (event) => onReplyChange(event.target.value),
          placeholder: '回复…',
          className: `${P}-comment-input`,
          rows: 2,
        }),
        React.createElement(
          'div',
          { className: `${P}-comment-actions` },
          React.createElement('button', { type: 'button', className: `${P}-btn`, onClick: onClose }, '关闭'),
          React.createElement('button', { type: 'button', className: `${P}-btn`, onClick: onDelete }, '删除'),
          React.createElement('button', { type: 'button', className: `${P}-btn`, onClick: onResolve }, '解决'),
          React.createElement('button', { type: 'button', className: `${P}-btn ${P}-btn-primary`, onClick: onReply, disabled: !replyText.trim() }, '回复'),
        ),
      ),
  )
}

function CropBar({ crop, onChange, onCommit, onCancel }) {
  return React.createElement(
    'div',
    { className: `${P}-crop-bar`, onPointerDown: (event) => event.stopPropagation() },
    React.createElement('span', null, '裁剪'),
    React.createElement('label', null, 'X', React.createElement('input', { type: 'number', step: 0.01, min: 0, max: 1, value: round(crop.x), onChange: (event) => onChange({ ...crop, x: clampUnit(event.target.value) }) })),
    React.createElement('label', null, 'Y', React.createElement('input', { type: 'number', step: 0.01, min: 0, max: 1, value: round(crop.y), onChange: (event) => onChange({ ...crop, y: clampUnit(event.target.value) }) })),
    React.createElement('label', null, '宽', React.createElement('input', { type: 'number', step: 0.01, min: 0.05, max: 1, value: round(crop.width), onChange: (event) => onChange({ ...crop, width: clampUnit(event.target.value, 0.05, 1) }) })),
    React.createElement('label', null, '高', React.createElement('input', { type: 'number', step: 0.01, min: 0.05, max: 1, value: round(crop.height), onChange: (event) => onChange({ ...crop, height: clampUnit(event.target.value, 0.05, 1) }) })),
    React.createElement('button', { type: 'button', className: `${P}-btn`, onClick: onCancel }, '取消'),
    React.createElement('button', { type: 'button', className: `${P}-btn ${P}-btn-primary`, onClick: onCommit }, '完成'),
  )
}

function round(value) {
  return Math.round((Number(value) || 0) * 100) / 100
}

function clampUnit(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, Number(value) || 0))
}

export { findDocNode, parentAbsFor, selectedKeys, collectOverrides }
