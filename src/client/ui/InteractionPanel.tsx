import * as React from 'react'
import { assetUrl } from '../api.js'
import { NodeView } from '../editor/render-dom.jsx'
import type { InteractionScope, InteractionTarget } from '../../shared/interactions.js'
import type { InteractionLocation } from '../editor/interaction-navigation.js'
import { Button, IconButton, Select } from './common.jsx'
import { Icon } from './icons.jsx'

interface PreviewNode {
  width: number
  height: number
  absX: number
  absY: number
}

interface FlowSummaryEdge {
  id: string
  from: string
  to: string
  event: string
  fromName: string
  toName: string
  fromPageId: string
  toPageId: string
}

interface Props {
  scope: InteractionScope
  focused: boolean
  viewed: string
  allEdges?: FlowSummaryEdge[]
  store: any
  previewNode: (location: InteractionLocation) => PreviewNode | null
  activeEdge?: string
  onVisitStart: () => void
  onVisit: (target: InteractionTarget, key: string, edgeId?: string) => void
  onFocus: () => void
  onReturn: () => void
  onExit: () => void
}

function Preview({ target, store, previewNode }: Pick<Props, 'store' | 'previewNode'> & { target: InteractionTarget }) {
  if (target.previewAsset) {
    return <img src={assetUrl(store.sessionId, store.state.name, target.previewAsset)} alt="" loading="lazy" draggable={false} />
  }
  const node = previewNode(target)
  if (!node) return <Icon name="frame" size={20} />
  const scale = Math.min(1, 54 / Math.max(1, node.width), 74 / Math.max(1, node.height))
  return (
    <span className="dshc-interaction-mini" style={{ width: node.width * scale, height: node.height * scale }}>
      <span style={{ transform: `scale(${scale})` }}>
        <NodeView node={node} store={store} parentAbs={{ x: node.absX, y: node.absY }} />
      </span>
    </span>
  )
}

function collectDestinationCandidates(doc: any, excludeId: string | null) {
  const options: Array<{ value: string; label: string }> = []
  const pages = doc?.pages ?? []
  const multiPage = pages.length > 1
  for (const page of pages) {
    const pagePrefix = multiPage ? `[${page.name || page.id}] ` : ''
    for (const node of page.children ?? []) {
      if (!node || node.visible === false || node.id === excludeId) continue
      if (node.interaction || node.type === 'path' || node.type === 'line') continue
      if (node.type === 'frame' || node.type === 'group' || node.type === 'instance') {
        options.push({
          value: node.id,
          label: `${pagePrefix}${node.name || node.type}`,
        })
      }
    }
  }
  return options
}

function QuickConnectForm({ store, sourceNode }: { store: any; sourceNode: any }) {
  const candidates = React.useMemo(
    () => collectDestinationCandidates(store.state.doc, sourceNode?.sourceId ?? null),
    [store.state.doc, sourceNode?.sourceId],
  )
  const [targetId, setTargetId] = React.useState('')
  const [eventText, setEventText] = React.useState('点击跳转')

  React.useEffect(() => {
    if (candidates.length > 0 && !candidates.some((entry) => entry.value === targetId)) {
      setTargetId(candidates[0].value)
    }
  }, [candidates, targetId])

  if (!sourceNode || sourceNode.type === 'path' || sourceNode.type === 'line') return null
  if (candidates.length === 0) {
    return (
      <div className="dshc-help">
        当前只有一个界面；再放一个目标画板（Frame）后即可建立跳转连线。
      </div>
    )
  }

  const submit = () => {
    if (!targetId) return
    store.createInteraction?.(sourceNode.sourceId, targetId, eventText.trim() || '点击跳转')
  }

  return (
    <div className="dshc-interaction-form">
      <div className="dshc-interaction-form-title">
        从「{sourceNode.name || sourceNode.type}」添加跳转
      </div>
      <label className="dshc-field is-wide">
        <span className="dshc-field-label">跳转到目标界面</span>
        <Select value={targetId} options={candidates} onChange={setTargetId} />
      </label>
      <label className="dshc-field is-wide">
        <span className="dshc-field-label">触发事件（画布上会显示标签）</span>
        <input
          className="dshc-text-input"
          value={eventText}
          placeholder="例如：点击登录、打开设置"
          onChange={(event) => setEventText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              submit()
            }
          }}
        />
      </label>
      <Button small primary icon="connect" disabled={!targetId} onClick={submit}>
        添加跳转连线
      </Button>
    </div>
  )
}

export function InteractionPanel({
  scope,
  focused,
  viewed,
  allEdges = [],
  store,
  previewNode,
  onVisit,
  activeEdge,
  onVisitStart,
  onFocus,
  onReturn,
  onExit,
}: Props) {
  const panel = React.useRef<HTMLElement>(null)
  const [nearby, setNearby] = React.useState<Set<string> | null>(null)
  const [editingEdgeId, setEditingEdgeId] = React.useState<string | null>(null)
  const [editingText, setEditingText] = React.useState('')
  const [showAddForm, setShowAddForm] = React.useState(false)

  const primary = store.primaryNode?.() ?? null
  const isConnectMode = store.state.tool === 'connect'

  React.useLayoutEffect(() => {
    const root = panel.current
    if (!root || typeof IntersectionObserver === 'undefined') return
    setNearby(new Set())
    const observer = new IntersectionObserver(entries => {
      setNearby(previous => {
        const next = new Set(previous)
        for (const entry of entries) {
          const key = (entry.target as HTMLElement).dataset.previewKey
          if (!key) continue
          if (entry.isIntersecting) next.add(key)
          else next.delete(key)
        }
        return next
      })
    }, { root, rootMargin: '120px 0px' })
    for (const card of root.querySelectorAll('[data-preview-key]')) observer.observe(card)
    return () => observer.disconnect()
  }, [scope.targets])

  const commitEdgeEdit = (edgeId: string) => {
    const trimmed = editingText.trim()
    setEditingEdgeId(null)
    if (trimmed) store.updateInteractionEvent?.(edgeId, trimmed)
  }

  return (
    <section ref={panel} className="dshc-interaction-panel" aria-label="交互流程">
      {scope.edges.length > 0 ? (
        <>
          <div className="dshc-interaction-anchor">
            <span>{focused ? '聚焦对象' : '当前选中'}</span>
            <strong title={scope.name}>{scope.name}</strong>
            {scope.placements.length > 1 && <span>共 {scope.placements.length} 处 · {scope.edges.length} 条跳转</span>}
            <div className="dshc-interaction-actions">
              {focused ? (
                <>
                  <Button small onClick={onReturn}>返回起点</Button>
                  {viewed && activeEdge && <Button small onClick={onVisitStart}>看连线起点</Button>}
                  <Button small onClick={onExit}>退出聚焦</Button>
                </>
              ) : (
                <Button small icon="connect" onClick={onFocus}>聚焦连线</Button>
              )}
              <Button
                small
                active={isConnectMode}
                icon="connect"
                title="在画布上拖出连线标注界面跳转"
                onClick={() => store.setTool(isConnectMode ? 'pointer' : 'connect')}
              >
                {isConnectMode ? '退出画线' : '画连线'}
              </Button>
              {primary && (
                <Button small active={showAddForm} icon="plus" onClick={() => setShowAddForm((open) => !open)}>
                  添加跳转
                </Button>
              )}
            </div>
          </div>
          {showAddForm && primary && <QuickConnectForm store={store} sourceNode={primary} />}
          {scope.targets.length ? scope.targets.map(target => (
            <div
              key={target.key}
              data-preview-key={target.key}
              className={`dshc-interaction-card ${viewed === target.key ? 'is-viewed' : ''}`}
              aria-current={viewed === target.key ? 'location' : undefined}
            >
              <button type="button" className="dshc-preview-link" aria-label={`定位 ${target.name}`}
                onClick={() => onVisit(target, target.key)} />
              <span className="dshc-interaction-thumb" aria-hidden="true">
                {(nearby?.has(target.key) || typeof IntersectionObserver === 'undefined') &&
                  <Preview target={target} store={store} previewNode={previewNode} />}
              </span>
              <span className="dshc-interaction-detail">
                <strong>{target.name}</strong>
                <span className="dshc-interaction-meta">
                  <span>界面跳转</span>
                  <span className="dshc-interaction-type">交互</span>
                </span>
                <span className="dshc-interaction-event-heading">触发事件</span>
                {target.events.map(event => (
                  <div key={event.edgeId + event.direction} className="dshc-interaction-event-row">
                    {editingEdgeId === event.edgeId ? (
                      <input
                        className="dshc-text-input"
                        autoFocus
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onBlur={() => commitEdgeEdit(event.edgeId)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            commitEdgeEdit(event.edgeId)
                          } else if (e.key === 'Escape') {
                            e.preventDefault()
                            setEditingEdgeId(null)
                          }
                        }}
                      />
                    ) : (
                      <>
                        <button
                          type="button"
                          className="dshc-interaction-event"
                          aria-pressed={activeEdge === event.edgeId}
                          onClick={() => onVisit(target, target.key, event.edgeId)}
                        >
                          <span>{event.direction === 'outgoing' ? '跳转至' : '来自'}</span>
                          {event.text}
                        </button>
                        <span className="dshc-interaction-event-ops">
                          <IconButton
                            icon="pencil"
                            size={11}
                            title="修改触发事件文案"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation()
                              setEditingEdgeId(event.edgeId)
                              setEditingText(event.text)
                            }}
                          />
                          <IconButton
                            icon="trash"
                            size={11}
                            danger
                            title="删除这条跳转连线"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation()
                              store.deleteInteraction?.(event.edgeId)
                            }}
                          />
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </span>
              <Icon name="chevronRight" size={13} />
            </div>
          )) : <p className="dshc-interaction-empty">暂无其他关联界面</p>}
        </>
      ) : (
        <div className="dshc-interaction-intro">
          <div className="dshc-interaction-intro-head">
            <Icon name="connect" size={16} />
            <strong>界面跳转连线</strong>
          </div>
          <p className="dshc-help">
            用带箭头的连线串联按钮与目标界面，直观标明「点击哪里 → 跳到哪一页」，点击连线卡片可快速跳转核对，也方便 AI 理解整个页面流转。
          </p>
          <div className="dshc-interaction-tips">
            <div>1. 点下方「开始画连线 (K)」，直接从一个按钮或界面拖向目标界面；</div>
            <div>2. 或选中任意元素，拖它右侧的蓝色小圆点连向目标界面。</div>
          </div>
          <Button
            small
            primary={!isConnectMode}
            active={isConnectMode}
            icon="connect"
            onClick={() => store.setTool(isConnectMode ? 'pointer' : 'connect')}
          >
            {isConnectMode ? '退出连线模式 (Esc)' : '开始画连线 (K)'}
          </Button>
          {primary && <QuickConnectForm store={store} sourceNode={primary} />}
          {allEdges.length > 0 && (
            <div className="dshc-interaction-all-list">
              <div className="dshc-panel-subtitle">本稿全部跳转（{allEdges.length}）</div>
              {allEdges.map((edge) => (
                <div key={edge.id} className="dshc-interaction-all-row">
                  <button
                    type="button"
                    className="dshc-interaction-all-jump"
                    title={`定位：${edge.fromName} → ${edge.toName}`}
                    onClick={() => store.focusNode?.({ page: edge.fromPageId, node: edge.from })}
                  >
                    <span className="dshc-interaction-all-route">{`${edge.fromName} → ${edge.toName}`}</span>
                    <span className="dshc-muted">{edge.event}</span>
                  </button>
                  <IconButton
                    icon="trash"
                    size={12}
                    danger
                    title="删除连线"
                    onClick={() => store.deleteInteraction?.(edge.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
