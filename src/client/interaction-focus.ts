import * as React from 'react'
import { buildInteractionIndex, interactionPresentation, interactionScope } from '../shared/interactions.js'
import { buildScene } from './editor/resolve.js'
import { layoutScene } from './editor/layout.js'
import { revealInteractionNode } from './editor/interaction-navigation.js'
import { onInteractionViewRequest, replyInteractionView } from './api.js'
import type { InteractionLocation } from './editor/interaction-navigation.js'

interface FocusLocation extends InteractionLocation {
  document: string
  ids: string[]
}

export function useInteractionFocus(store, viewport: React.RefObject<HTMLElement>) {
  const state = store.state
  const documentKey = state.name + '/' + (state.doc?.id ?? '')
  const [focus, setFocus] = React.useState<FocusLocation | null>(null)
  const [tab, setTab] = React.useState<'properties' | 'interactions'>('properties')
  const [activeEdge, setActiveEdge] = React.useState<string | undefined>()
  const [viewed, setViewed] = React.useState('')
  const [destination, setDestination] = React.useState<InteractionLocation | null>(null)
  const index = React.useMemo(() => buildInteractionIndex(state.doc), [state.doc, state.scene])
  const selection = state.componentMode ? [] : state.selection
  const selectionScope = React.useMemo(() => interactionScope(index, selection), [index, selection])
  const active = !state.componentMode && focus?.document === documentKey ? focus : null
  const focusedScope = React.useMemo(() => active ? interactionScope(index, active.ids) : null, [index, active])
  const scope = focusedScope?.edges.length ? focusedScope : selectionScope
  const focused = Boolean(focusedScope?.edges.length)
  const presentation = React.useMemo(
    () => focusedScope?.edges.length ? interactionPresentation(index, focusedScope, destination ? activeEdge : undefined) : null,
    [index, focusedScope, activeEdge, destination],
  )
  const selectedSignature = documentKey + '/' + state.pageId + '/' + selection.join(',')
  const lastSelection = React.useRef('')
  const animation = React.useRef<{ id: number; complete: (applied: boolean) => void } | null>(null)

  function cancelNavigation() {
    if (!animation.current) return
    window.cancelAnimationFrame(animation.current.id)
    animation.current.complete(false)
    animation.current = null
  }

  React.useEffect(() => {
    if (focus && (!active || !focusedScope?.edges.length)) {
      setFocus(null)
      setActiveEdge(undefined)
      setDestination(null)
      setViewed('')
    }
  }, [focus, active, focusedScope])

  React.useEffect(() => {
    if (focused || lastSelection.current === selectedSignature) return
    lastSelection.current = selectedSignature
    setActiveEdge(undefined)
    setViewed('')
    setDestination(null)
    if (selectionScope.edges.length) {
      setTab('interactions')
      if (!state.inspectorOpen) store.set({ inspectorOpen: true })
    }
  }, [selectedSignature, focused, selectionScope.edges.length, state.inspectorOpen, store])

  React.useEffect(() => {
    if (!destination) return
    const timer = window.setTimeout(() => setDestination(null), 1300)
    return () => window.clearTimeout(timer)
  }, [destination])

  React.useEffect(() => cancelNavigation, [])

  function goTo(location: InteractionLocation, targetKey = '', edgeId?: string, frameEdge = false) {
    cancelNavigation()
    return new Promise<boolean>(complete => {
      const id = window.requestAnimationFrame(() => {
        animation.current = null
        const element = viewport.current
        if (element) store.canvasSize = { width: element.clientWidth, height: element.clientHeight }
        const edge = edgeId && scope.edges.find(item => item.id === edgeId)
        const context = frameEdge && edge ? [edge.from, edge.to, edge.id, ...(edge.labelId ? [edge.labelId] : [])] : []
        const applied = revealInteractionNode(store, location, context)
        if (applied) {
          setActiveEdge(edgeId)
          setViewed(targetKey)
          setDestination({ ...location })
        }
        complete(applied)
      })
      animation.current = { id, complete }
    })
  }

  function exit() {
    cancelNavigation()
    lastSelection.current = documentKey + '/' + state.pageId + '/' + state.selection.join(',')
    setFocus(null)
    setActiveEdge(undefined)
    setViewed('')
    setDestination(null)
  }

  function focusLinks(ids: string[], anchorId: string) {
    const node = index.nodes.get(anchorId)
    if (!node) return Promise.resolve(false)
    const location = { id: anchorId, pageId: node.pageId }
    setFocus({ ...location, document: documentKey, ids: [...ids] })
    setTab('interactions')
    if (!state.inspectorOpen) store.set({ inspectorOpen: true })
    return goTo(location)
  }

  function toggle() {
    if (focused) {
      exit()
      return
    }
    if (selectionScope.edges.length) void focusLinks(selection, selectionScope.anchorId)
  }

  function viewState() {
    const target = scope.targets.find(item => item.key === viewed)
    return {
      pageId: state.pageId,
      selectedNodeIds: [...state.selection],
      activeConnectionId: activeEdge ?? null,
      placementIds: scope.placements,
      focus: active && focused ? { nodeId: active.id, nodeIds: active.ids, pageId: active.pageId } : null,
      viewed: target ? { nodeId: target.id, pageId: target.pageId } : null,
      visibleConnectionIds: index.edges.filter(edge => !presentation?.hidden.has(edge.id)).map(edge => edge.id),
    }
  }

  const commands = React.useRef({ viewState, execute: null as ((action: string, nodeId?: string) => Promise<string | null>) | null })
  commands.current = {
    viewState,
    async execute(action, nodeId) {
      if (state.componentMode || !state.ready) return 'not-in-design-view'
      if (action === 'status') return null
      if (action === 'clear') {
        exit()
        return null
      }
      if (action === 'focus') {
        const ids = nodeId ? [nodeId] : selection
        const requested = interactionScope(index, ids)
        if (!requested.anchorId || !requested.edges.length) return 'no-related-connections'
        return await focusLinks(ids, requested.anchorId) ? null : 'navigation-cancelled'
      }
      if (action === 'return') {
        if (!active || !focused) return 'no-focus'
        return await goTo(active) ? null : 'navigation-cancelled'
      }
      if (action === 'reveal') {
        const byWire = scope.targets.find(item => item.events.some(event => event.edgeId === nodeId))
        if (byWire) return await goTo(byWire, byWire.key, nodeId, true) ? null : 'navigation-cancelled'
        const target = scope.targets.find(item => item.id === nodeId)
        if (!target) return 'target-not-related'
        return await goTo(target, target.key, target.events[0]?.edgeId) ? null : 'navigation-cancelled'
      }
      return 'unknown-action'
    },
  }

  React.useEffect(() => onInteractionViewRequest(({ sessionId, name, event }) => {
    if (sessionId !== store.sessionId || name !== store.state.name) return
    void (async () => {
      const error = await commands.current.execute(event.action, event.nodeId)
      // Let React commit the view and the sidebar before reporting their state.
      await new Promise<void>(resolve => window.requestAnimationFrame(() => resolve()))
      const result = error ? { ok: false, error } : { ok: true, ...commands.current.viewState() }
      await replyInteractionView(sessionId, event.requestId, result)
    })().catch(error => console.warn('[dsh-canvas] interaction view request failed', error))
  }), [store])

  const previewScenes = React.useMemo(() => new Map<string, ReturnType<typeof buildScene>>(), [state.doc, state.scene])
  function previewNode(location: InteractionLocation) {
    if (location.pageId === state.pageId) return store.findSceneNode(location.id)
    let scene = previewScenes.get(location.pageId)
    if (!scene) {
      scene = buildScene(state.doc, { pageId: location.pageId, measureText: store.measure })
      layoutScene(scene)
      previewScenes.set(location.pageId, scene)
    }
    return scene.byKey.get(location.id)
  }

  return {
    tab, setTab, scope, focused, presentation, enabled: selectionScope.edges.length > 0,
    hasConnections: index.edges.length > 0 && !state.componentMode,
    totalEdges: index.edges.length,
    allEdges: index.edges.map((edge) => {
      const fromNode = index.nodes.get(edge.from)
      const toNode = index.nodes.get(edge.to)
      return {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        event: edge.event,
        fromName: fromNode?.name ?? edge.from,
        toName: toNode?.name ?? edge.to,
        fromPageId: fromNode?.pageId ?? state.pageId,
        toPageId: toNode?.pageId ?? state.pageId,
      }
    }),
    available: !state.componentMode, toggle, goTo, exit, viewed, previewNode,
    returnToFocus: () => { if (active) goTo(active) },
    visit: (target, key, edgeId?: string) => goTo(target, key, edgeId ?? target.events[0]?.edgeId, !!edgeId),
    activeEdge,
    visitStart: () => {
      const edge = scope.edges.find(item => item.id === activeEdge)
      const start = edge && index.nodes.get(edge.from)
      if (start) void goTo(start, viewed, activeEdge)
    },
    destination: destination?.pageId === state.pageId ? destination.id : null,
  }
}
