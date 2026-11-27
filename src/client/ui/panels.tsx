/** Side panels: templates, components/variants, styles, fonts, comments. */

import * as React from 'react'
import { Button, Empty, Field, IconButton, Select } from './common.jsx'
import { TEMPLATE_LIST } from '../../shared/templates.js'
import { getDevice } from '../../shared/foundation.js'
import { Icon } from './icons.jsx'
import { variantChipLabel } from './variant-label.js'
import {
  COMPONENT_DRAG_MIME,
  STYLE_DRAG_MIME,
  TEMPLATE_DRAG_MIME,
  clearActiveCanvasDrag,
  getComponentPreview,
  getTemplatePreview,
  setActiveCanvasDrag,
} from './template-preview.js'

interface NameDialogOptions {
  title: string
  label?: string
  defaultValue?: string
  onSubmit: (name: string) => void
}

interface FillStop {
  position: number
  color: string
}

interface StyleFillValue {
  type?: string
  color?: string
  opacity?: number
  angle?: number
  center?: { x?: number; y?: number }
  radius?: number
  stops?: FillStop[]
}

interface StyleTextValue {
  font?: {
    family?: string
    weight?: number
    style?: string
    size?: number
    lineHeight?: number
    letterSpacing?: number
  }
  fills?: StyleFillValue[]
}

interface StyleEffectItem {
  type?: string
  visible?: boolean
  x?: number
  y?: number
  blur?: number
  spread?: number
  radius?: number
  color?: string
}

interface StyleEntry {
  id: string
  type: 'fill' | 'text' | 'effect'
  name: string
  value?: unknown
}

interface ComponentEntry {
  id: string
  name: string
  variantSetId?: string
  variantProps?: Record<string, string>
  root?: Record<string, unknown> & { id?: string; width?: number; height?: number; name?: string; children?: unknown[] }
}

interface VariantSetEntry {
  id: string
  name: string
  properties: Array<{ name: string; values: string[] }>
  componentIds: string[]
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function clamp01(value: unknown): number {
  return clamp(Number(value) || 0, 0, 1)
}

function formatSolidCss(fill: StyleFillValue): string {
  const color = fill.color ?? '#000000'
  if (fill.opacity == null || fill.opacity >= 1) return color
  const alpha = Math.round(clamp01(fill.opacity) * 255)
    .toString(16)
    .padStart(2, '0')
  return color.length === 7 ? `${color}${alpha}` : color
}

function formatGradientStops(stops: FillStop[] | undefined): string {
  return (stops ?? [])
    .map((stop) => `${stop.color} ${(clamp01(stop.position) * 100).toFixed(1)}%`)
    .join(', ')
}

function describeFillStyle(value: unknown): { swatchStyle: React.CSSProperties | undefined; meta: string } {
  const fill = value && typeof value === 'object' ? (value as StyleFillValue) : null
  if (!fill) return { swatchStyle: undefined, meta: '填充' }

  if (fill.type === 'solid') {
    const color = (fill.color ?? '#000000').toUpperCase()
    const opacitySuffix = fill.opacity != null && fill.opacity < 1 ? ` · ${Math.round(clamp01(fill.opacity) * 100)}%` : ''
    return {
      swatchStyle: { background: formatSolidCss(fill) },
      meta: `${color}${opacitySuffix}`,
    }
  }

  if (fill.type === 'linear-gradient') {
    const angle = Number.isFinite(Number(fill.angle)) ? Number(fill.angle) : 180
    const stops = formatGradientStops(fill.stops)
    return {
      swatchStyle: stops ? { background: `linear-gradient(${angle}deg, ${stops})` } : undefined,
      meta: `线性渐变 ${Math.round(angle)}°`,
    }
  }

  if (fill.type === 'radial-gradient') {
    const cx = clamp01(fill.center?.x ?? 0.5) * 100
    const cy = clamp01(fill.center?.y ?? 0.5) * 100
    const radius = Math.max(1, clamp01(fill.radius ?? 0.7) * 100)
    const stops = formatGradientStops(fill.stops)
    return {
      swatchStyle: stops ? { background: `radial-gradient(circle ${radius}% at ${cx}% ${cy}%, ${stops})` } : undefined,
      meta: '径向渐变',
    }
  }

  if (fill.type === 'image') {
    return { swatchStyle: undefined, meta: '图片填充' }
  }

  return { swatchStyle: undefined, meta: '填充' }
}

function describeTextStyle(value: unknown): { swatchStyle: React.CSSProperties; meta: string } {
  const textValue = value && typeof value === 'object' ? (value as StyleTextValue) : null
  const font = textValue?.font ?? {}
  const family = font.family || 'system-ui'
  const size = Number.isFinite(Number(font.size)) ? Number(font.size) : 14
  const weight = Number.isFinite(Number(font.weight)) ? Number(font.weight) : 400
  const italic = font.style === 'italic'
  return {
    swatchStyle: {
      fontFamily: family,
      fontWeight: weight,
      fontStyle: italic ? 'italic' : 'normal',
    },
    meta: `${family} · ${size}px/${weight}`,
  }
}

const EFFECT_TYPE_LABELS: Record<string, string> = {
  'drop-shadow': '投影',
  'inner-shadow': '内阴影',
  'layer-blur': '模糊',
  'background-blur': '背景模糊',
}

function describeEffectStyle(value: unknown): { swatchStyle: React.CSSProperties | undefined; meta: string } {
  const raw = Array.isArray(value) ? (value as StyleEffectItem[]) : []
  const effects = raw.filter((item) => item && item.visible !== false)
  if (effects.length === 0) {
    return { swatchStyle: undefined, meta: '无效果' }
  }

  const shadows: string[] = []
  let hasLayerBlur = false
  let hasBackdropBlur = false
  let maxLayerBlur = 0
  let maxBackdropBlur = 0

  for (const effect of effects) {
    if (effect.type === 'drop-shadow' || effect.type === 'inner-shadow') {
      const inset = effect.type === 'inner-shadow' ? 'inset ' : ''
      const x = clamp(Number(effect.x) || 0, -3, 3)
      const y = clamp(Number(effect.y) || 0, -3, 3)
      const blur = clamp(Number(effect.blur) || 0, 1, 7)
      const spread = clamp(Number(effect.spread) || 0, -2, 2)
      shadows.push(`${inset}${x}px ${y}px ${blur}px ${spread}px ${effect.color ?? '#00000040'}`)
    } else if (effect.type === 'layer-blur') {
      hasLayerBlur = true
      maxLayerBlur = Math.max(maxLayerBlur, Number(effect.radius ?? effect.blur) || 4)
    } else if (effect.type === 'background-blur') {
      hasBackdropBlur = true
      maxBackdropBlur = Math.max(maxBackdropBlur, Number(effect.radius ?? effect.blur) || 8)
    }
  }

  const swatchStyle: React.CSSProperties = {}
  if (shadows.length) swatchStyle.boxShadow = shadows.join(', ')
  if (hasBackdropBlur) {
    const px = clamp(maxBackdropBlur / 4, 1.5, 4)
    swatchStyle.backdropFilter = `blur(${px}px)`
    swatchStyle.WebkitBackdropFilter = `blur(${px}px)`
    swatchStyle.background = 'linear-gradient(135deg, rgba(255,255,255,0.68), rgba(148,163,184,0.34))'
  }
  if (hasLayerBlur) {
    const px = clamp(maxLayerBlur / 6, 0.7, 2)
    swatchStyle.filter = `blur(${px}px)`
  }

  let meta: string
  if (effects.length === 1) {
    const first = effects[0]
    const label = EFFECT_TYPE_LABELS[first.type ?? ''] ?? '效果'
    if (first.type === 'layer-blur' || first.type === 'background-blur') {
      meta = `${label} · ${Math.round(Number(first.radius ?? first.blur) || 0)}px`
    } else {
      meta = `${label} · ${Math.round(Number(first.blur) || 0)}px`
    }
  } else {
    const labels = [...new Set(effects.map((entry) => EFFECT_TYPE_LABELS[entry.type ?? ''] ?? '效果'))]
    meta = `${effects.length} 项 · ${labels.join('/')}`
  }

  return { swatchStyle, meta }
}

function inferVariantSetName(components: ComponentEntry[], ids: string[]): string {
  const names = ids
    .map((id) => components.find((entry) => entry.id === id)?.name?.trim() ?? '')
    .filter(Boolean)
  if (names.length < 2) return 'Variant Set'

  // Prefer shared slash-delimited prefix (e.g. "Button/Primary" + "Button/Hover" -> "Button")
  const slashParts = names.map((name) => name.split('/').map((part) => part.trim()).filter(Boolean))
  if (slashParts.every((parts) => parts.length >= 2)) {
    const common: string[] = []
    const minLen = Math.min(...slashParts.map((parts) => parts.length)) - 1
    for (let i = 0; i < minLen; i += 1) {
      const candidate = slashParts[0][i]
      if (slashParts.every((parts) => parts[i] === candidate)) common.push(candidate)
      else break
    }
    if (common.length > 0) return common.join('/')
  }

  // Fallback: shared whitespace prefix
  const wordParts = names.map((name) => name.split(/\s+/).filter(Boolean))
  if (wordParts.every((parts) => parts.length >= 2)) {
    const common: string[] = []
    const minLen = Math.min(...wordParts.map((parts) => parts.length)) - 1
    for (let i = 0; i < minLen; i += 1) {
      const candidate = wordParts[0][i]
      if (wordParts.every((parts) => parts[i] === candidate)) common.push(candidate)
      else break
    }
    if (common.length > 0) return common.join(' ')
  }

  return 'Variant Set'
}

function findNodeNameInTree(nodes: any[] | undefined, targetId: string): string | null {
  for (const node of nodes ?? []) {
    if (!node) continue
    if (node.id === targetId) return node.name || node.type || null
    const found = findNodeNameInTree(node.children, targetId)
    if (found) return found
  }
  return null
}

function resolveCommentTargetLabel(store: any, doc: any, nodeId?: string | null): string {
  if (!nodeId) return '画布'
  const sceneNode = store.state.scene?.byKey?.get?.(nodeId)
  if (sceneNode) return sceneNode.name || sceneNode.type || '未命名图层'
  for (const page of doc?.pages ?? []) {
    const found = findNodeNameInTree(page.children, nodeId)
    if (found) return found
  }
  for (const component of doc?.components ?? []) {
    if (component.root?.id === nodeId) return component.root.name || component.name || '组件'
    const found = findNodeNameInTree(component.root?.children, nodeId)
    if (found) return found
  }
  return '已移除图层'
}

function TemplateCard({ template, device, store }: { template: any; device: any; store: any }) {
  const preview = React.useMemo(() => getTemplatePreview(template.id, device.id), [template.id, device.id])
  const isPage = template.category === 'page'
  const dims = `${preview.width}×${preview.height}`
  return (
    <div
      className={`dshc-template-card ${isPage ? 'is-page' : 'is-bar'}`}
      draggable
      title={`${template.description}（拖入画布指定位置，或点 + 插入）`}
      onDragStart={(event: React.DragEvent) => {
        event.dataTransfer.effectAllowed = 'copy'
        event.dataTransfer.setData(TEMPLATE_DRAG_MIME, template.id)
        event.dataTransfer.setData('text/plain', template.name)
        setActiveCanvasDrag({
          kind: 'template',
          id: template.id,
          name: template.name,
          width: preview.width,
          height: preview.height,
        })
      }}
      onDragEnd={() => {
        clearActiveCanvasDrag()
      }}
    >
      <div className={`dshc-template-thumb ${isPage ? 'is-page' : 'is-bar'}`}>
        <img src={preview.dataUri} alt={template.name} draggable={false} />
      </div>
      <div className="dshc-template-foot">
        <div className="dshc-template-info">
          <div className="dshc-template-name">{template.name}</div>
          <div className="dshc-template-meta">{dims}</div>
        </div>
        <IconButton
          icon="plus"
          title={`插入${template.name}`}
          size={14}
          onClick={(event: React.MouseEvent) => {
            event.stopPropagation()
            store.insertTemplate(template.id)
          }}
        />
      </div>
    </div>
  )
}

export function TemplatesPanel({ store }: { store: any }) {
  const device = getDevice(store.state.foundation?.device)
  const groups: Array<[string, string, typeof TEMPLATE_LIST]> = [
    ['页面', 'page', TEMPLATE_LIST.filter((entry) => entry.category === 'page')],
    ['系统栏', 'bar', TEMPLATE_LIST.filter((entry) => entry.category !== 'page')],
  ]
  return (
    <div className="dshc-panel">
      <div className="dshc-panel-title">
        模板
        <span className="dshc-panel-count">{TEMPLATE_LIST.length}</span>
      </div>
      <div className="dshc-row dshc-template-device">
        <span className="dshc-field-label">设备</span>
        <Select
          value={device.id}
          options={[
            { value: 'iphone16', label: 'iPhone 16 · 393×852' },
            { value: 'iphone15', label: 'iPhone 15 · 390×844' },
          ]}
          onChange={(id: string) => store.setFoundation({ device: id })}
        />
      </div>
      <div className="dshc-help dshc-pad">拖拽缩略图卡片到画布任意位置，或点击 + 插入。</div>
      {groups.map(([label, kind, entries]) => (
        <div key={label} className="dshc-panel-group">
          <div className="dshc-panel-subtitle">{label}</div>
          <div className={`dshc-template-grid is-${kind}`}>
            {entries.map((template) => (
              <TemplateCard key={template.id} template={template} device={device} store={store} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function usageCount(store: any, predicate: (node: any) => boolean): number {
  let total = 0
  const scan = (node: any) => {
    if (!node) return
    if (predicate(node)) total += 1
    for (const child of node.children ?? []) scan(child)
  }
  for (const page of store.state.doc?.pages ?? []) page.children.forEach(scan)
  for (const component of store.state.doc?.components ?? []) scan(component.root)
  return total
}

function VariantSetCard({
  set,
  doc,
  store,
  componentById,
}: {
  set: VariantSetEntry
  doc: any
  store: any
  componentById: Map<string, ComponentEntry>
}) {
  const members = (set.componentIds ?? [])
    .map((id) => componentById.get(id))
    .filter((entry): entry is ComponentEntry => Boolean(entry))
  const [activeId, setActiveId] = React.useState<string>(() => members[0]?.id ?? '')
  const activeComponent = members.find((entry) => entry.id === activeId) ?? members[0] ?? null
  if (!activeComponent) return null

  const preview = getComponentPreview(doc, activeComponent)
  const activeLabel = variantChipLabel(set, activeComponent)

  const startComponentDrag = (event: React.DragEvent, component: ComponentEntry) => {
    const compPreview = component.id === activeComponent.id ? preview : getComponentPreview(doc, component)
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData(COMPONENT_DRAG_MIME, component.id)
    event.dataTransfer.setData('text/plain', component.name)
    setActiveCanvasDrag({
      kind: 'component',
      id: component.id,
      name: component.name,
      width: compPreview.width,
      height: compPreview.height,
    })
  }

  return (
    <div
      className="dshc-set-card"
      draggable
      title={`${set.name} · ${activeLabel}（点选下方变体切换预览，拖拽到画布放置，或点 + 插入）`}
      onDragStart={(event: React.DragEvent) => {
        const target = event.target as HTMLElement | null
        if (target?.closest?.('input, button')) {
          event.preventDefault()
          return
        }
        startComponentDrag(event, activeComponent)
      }}
      onDragEnd={() => clearActiveCanvasDrag()}
    >
      <div
        className="dshc-component-thumb"
        onDoubleClick={() => store.editComponent(activeComponent.id)}
      >
        <img src={preview.dataUri} alt={activeComponent.name} draggable={false} />
      </div>
      <div className="dshc-set-body">
        <div className="dshc-set-header">
          <div
            className="dshc-template-info"
            onDoubleClick={() => store.editComponent(activeComponent.id)}
          >
            <div className="dshc-set-name" title={set.name}>
              {set.name}
            </div>
            <div className="dshc-template-meta" title={`${activeLabel} · ${preview.width}×${preview.height}`}>
              {`${activeLabel} · ${preview.width}×${preview.height}`}
            </div>
          </div>
          <IconButton
            icon="plus"
            title={`插入 ${activeLabel} 实例`}
            size={13}
            onClick={(event: React.MouseEvent) => {
              event.stopPropagation()
              store.insertInstance(activeComponent.id)
            }}
          />
          <IconButton
            icon="text"
            title={`编辑 ${activeLabel} 主组件`}
            size={13}
            onClick={(event: React.MouseEvent) => {
              event.stopPropagation()
              store.editComponent(activeComponent.id)
            }}
          />
        </div>
        <div className="dshc-set-variants">
          {members.map((component) => {
            const isActive = component.id === activeComponent.id
            const label = variantChipLabel(set, component)
            return (
              <button
                key={component.id}
                type="button"
                className={`dshc-variant-chip ${isActive ? 'is-active' : ''}`}
                aria-pressed={isActive}
                draggable
                title={`${component.name}（点击切换预览，拖入画布放置）`}
                onDragStart={(event: React.DragEvent) => {
                  event.stopPropagation()
                  setActiveId(component.id)
                  startComponentDrag(event, component)
                }}
                onDragEnd={(event: React.DragEvent) => {
                  event.stopPropagation()
                  clearActiveCanvasDrag()
                }}
                onClick={(event: React.MouseEvent) => {
                  event.stopPropagation()
                  setActiveId(component.id)
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function ComponentsPanel({ store, onNeedName }: { store: any; onNeedName?: (opts: NameDialogOptions) => void }) {
  const doc = store.state.doc
  const [checked, setChecked] = React.useState<string[]>([])
  const [query, setQuery] = React.useState('')
  const [showAllMasters, setShowAllMasters] = React.useState(false)
  if (!doc) return null

  const components: ComponentEntry[] = doc.components ?? []
  const sets: VariantSetEntry[] = doc.variantSets ?? []
  const selectionNode = store.primaryNode()
  const canCreate = Boolean(selectionNode && (selectionNode.type === 'frame' || selectionNode.type === 'group') && selectionNode.editable)

  const componentById = new Map(components.map((entry) => [entry.id, entry]))
  const validChecked = checked.filter((id) => componentById.has(id))
  const needle = query.trim().toLowerCase()
  const showSearch = components.length + sets.length >= 4

  const variantMemberIds = new Set(sets.flatMap((set) => set.componentIds ?? []))
  const variantMemberCount = components.filter((entry) => variantMemberIds.has(entry.id)).length

  const filteredSets = needle
    ? sets.filter(
        (set) =>
          set.name.toLowerCase().includes(needle) ||
          (set.componentIds ?? []).some((id) => componentById.get(id)?.name?.toLowerCase().includes(needle)),
      )
    : sets

  const filteredComponents = needle
    ? components.filter((entry) => entry.name.toLowerCase().includes(needle))
    : components

  const standaloneComponents = filteredComponents.filter((entry) => !variantMemberIds.has(entry.id))
  const displayedComponents = showAllMasters ? filteredComponents : standaloneComponents

  const handleMergeVariants = () => {
    if (validChecked.length < 2) return
    const defaultValue = inferVariantSetName(components, validChecked)
    if (onNeedName) {
      onNeedName({
        title: '合并为变体集',
        label: '变体集名称',
        defaultValue,
        onSubmit: (name) => {
          store.createVariantSet(validChecked, name)
          setChecked([])
        },
      })
    } else {
      store.createVariantSet(validChecked, defaultValue)
      setChecked([])
    }
  }

  return (
    <div className="dshc-panel">
      <div className="dshc-panel-title">
        组件
        <span className="dshc-panel-count">{components.length}</span>
      </div>
      <div className="dshc-panel-actions">
        <Button
          small
          icon="component"
          disabled={!canCreate}
          title={canCreate ? '从当前选中容器创建主组件' : '选中一个 Frame 或 Group 后可创建组件'}
          onClick={() =>
            onNeedName?.({
              title: '创建组件',
              label: '组件名称',
              defaultValue: selectionNode?.name ?? 'Component',
              onSubmit: (name) => store.createComponentFromSelection(name),
            })
          }
        >
          从选区创建
        </Button>
        <Button
          small
          icon="layers"
          disabled={validChecked.length < 2}
          title={validChecked.length >= 2 ? '将勾选的组件合并为变体集' : '勾选至少 2 个组件以合并为变体集'}
          onClick={handleMergeVariants}
        >
          合并为变体
        </Button>
      </div>
      {showSearch && (
        <input
          type="search"
          className="dshc-search-input"
          placeholder="搜索组件或变体集…"
          aria-label="搜索组件"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      )}
      {filteredSets.length > 0 && (
        <div className="dshc-panel-group">
          <div className="dshc-panel-subtitle">变体集</div>
          {filteredSets.map((set) => (
            <VariantSetCard
              key={set.id}
              set={set}
              doc={doc}
              store={store}
              componentById={componentById}
            />
          ))}
        </div>
      )}
      <div className="dshc-panel-group">
        <div className="dshc-panel-subtitle">{showAllMasters ? '全部主组件' : '组件'}</div>
        {components.length === 0 ? (
          <Empty icon="component" title="还没有组件" text="选中一个 Frame，点“从选区创建”。" />
        ) : needle && filteredSets.length === 0 && displayedComponents.length === 0 ? (
          <div className="dshc-muted dshc-pad">无匹配组件</div>
        ) : (
          displayedComponents.map((component) => {
            const preview = getComponentPreview(doc, component)
            return (
              <div
                key={component.id}
                className="dshc-component-card"
                draggable
                title={`${component.name}（拖入画布或点击 + 插入，双击编辑主组件）`}
                onDragStart={(event: React.DragEvent) => {
                  const target = event.target as HTMLElement | null
                  if (target?.closest?.('input, button')) {
                    event.preventDefault()
                    return
                  }
                  event.dataTransfer.effectAllowed = 'copy'
                  event.dataTransfer.setData(COMPONENT_DRAG_MIME, component.id)
                  event.dataTransfer.setData('text/plain', component.name)
                  setActiveCanvasDrag({
                    kind: 'component',
                    id: component.id,
                    name: component.name,
                    width: preview.width,
                    height: preview.height,
                  })
                }}
                onDragEnd={() => clearActiveCanvasDrag()}
              >
                <div
                  className="dshc-component-thumb"
                  onDoubleClick={() => store.editComponent(component.id)}
                >
                  <img src={preview.dataUri} alt={component.name} draggable={false} />
                </div>
                <div className="dshc-component-bar">
                  <input
                    type="checkbox"
                    draggable={false}
                    checked={validChecked.includes(component.id)}
                    onChange={(event) =>
                      setChecked(
                        event.target.checked
                          ? [...validChecked, component.id]
                          : validChecked.filter((id) => id !== component.id),
                      )
                    }
                  />
                  <div
                    className="dshc-template-info"
                    onDoubleClick={() => store.editComponent(component.id)}
                  >
                    <div className="dshc-template-name" title={component.name}>
                      {component.name}
                    </div>
                    <div className="dshc-template-meta">{`${preview.width}×${preview.height}`}</div>
                  </div>
                  <IconButton
                    icon="plus"
                    title="插入实例"
                    size={13}
                    onClick={() => store.insertInstance(component.id)}
                  />
                  <IconButton
                    icon="text"
                    title="编辑主组件"
                    size={13}
                    onClick={() => store.editComponent(component.id)}
                  />
                  <IconButton
                    icon="trash"
                    title="删除组件"
                    size={13}
                    danger
                    onClick={() => {
                      const used = store.state.scene
                        ? usageCount(
                            store,
                            (node) =>
                              node.type === 'instance' &&
                              (node.componentId === component.id || node.sourceNode?.componentId === component.id),
                          )
                        : 0
                      if (used) {
                        store.toast(`有 ${used} 个实例在使用，无法删除`)
                        return
                      }
                      setChecked((prev) => prev.filter((id) => id !== component.id))
                      store.mutate((docValue: any) => {
                        docValue.components = docValue.components.filter((entry: any) => entry.id !== component.id)
                        docValue.variantSets = docValue.variantSets.filter(
                          (set: any) => !set.componentIds.includes(component.id),
                        )
                      })
                    }}
                  />
                </div>
              </div>
            )
          })
        )}
        {variantMemberCount > 0 && (
          <button
            type="button"
            className="dshc-collapse-toggle"
            onClick={() => setShowAllMasters(!showAllMasters)}
          >
            <Icon name={showAllMasters ? 'chevronDown' : 'chevronRight'} size={12} />
            <span>
              {showAllMasters ? '收起变体主组件' : `显示全部主组件（含 ${variantMemberCount} 个变体）`}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}

export function StylesPanel({ store, onNeedName }: { store: any; onNeedName?: (opts: NameDialogOptions) => void }) {
  const doc = store.state.doc
  const [query, setQuery] = React.useState('')
  if (!doc) return null

  const allStyles: StyleEntry[] = doc.styles ?? []
  const needle = query.trim().toLowerCase()
  const filteredStyles = needle
    ? allStyles.filter((style) => style.name.toLowerCase().includes(needle))
    : allStyles

  const groups: Array<['fill' | 'text' | 'effect', string]> = [
    ['fill', '填充'],
    ['text', '文本'],
    ['effect', '效果'],
  ]

  return (
    <div className="dshc-panel">
      <div className="dshc-panel-title">
        样式库
        <span className="dshc-panel-count">{allStyles.length}</span>
      </div>
      <div className="dshc-panel-group">
        <div className="dshc-panel-subtitle">内置规范</div>
        <div className="dshc-panel-actions">
          <Button
            small
            icon="styles"
            title="加载 Material 3 的填充/文本/效果样式到当前文档"
            onClick={() => store.loadDesignSystem('material3')}
          >
            Material 3
          </Button>
          <Button
            small
            icon="styles"
            title="加载 iOS HIG 的填充/文本/效果样式到当前文档"
            onClick={() => store.loadDesignSystem('ios')}
          >
            iOS HIG
          </Button>
        </div>
        <div className="dshc-help">加入下方样式库，点击应用或直接拖到画布图层；不会自动修改现有图层。</div>
      </div>
      <div className="dshc-panel-actions">
        <Button
          small
          icon="plus"
          onClick={() =>
            onNeedName?.({
              title: '创建填充样式',
              label: '样式名称',
              defaultValue: 'Brand/Primary',
              onSubmit: (name) => store.createStyle('fill', name),
            })
          }
        >
          填充
        </Button>
        <Button
          small
          icon="plus"
          onClick={() =>
            onNeedName?.({
              title: '创建文本样式',
              label: '样式名称',
              defaultValue: 'Text/Body',
              onSubmit: (name) => store.createStyle('text', name),
            })
          }
        >
          文本
        </Button>
        <Button
          small
          icon="plus"
          onClick={() =>
            onNeedName?.({
              title: '创建效果样式',
              label: '样式名称',
              defaultValue: 'Shadow/Card',
              onSubmit: (name) => store.createStyle('effect', name),
            })
          }
        >
          效果
        </Button>
      </div>
      {allStyles.length >= 6 && (
        <input
          type="search"
          className="dshc-search-input"
          placeholder="搜索样式…"
          aria-label="搜索样式"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      )}
      {needle && filteredStyles.length === 0 ? (
        <div className="dshc-muted dshc-pad">无匹配样式</div>
      ) : (
        groups.map(([type, label]) => {
          const items = filteredStyles.filter((style) => style.type === type)
          if (needle && items.length === 0) return null
          return (
            <div key={type} className="dshc-panel-group">
              <div className="dshc-panel-subtitle">{label}</div>
              {items.length === 0 ? (
                <div className="dshc-muted dshc-pad">暂无样式</div>
              ) : (
                items.map((style) => {
                  const usage = usageCount(
                    store,
                    (node) =>
                      (type === 'fill' && node.fillStyleId === style.id) ||
                      (type === 'text' && node.textStyleId === style.id) ||
                      (type === 'effect' && node.effectStyleId === style.id),
                  )
                  const descriptor =
                    type === 'fill'
                      ? describeFillStyle(style.value)
                      : type === 'text'
                        ? describeTextStyle(style.value)
                        : describeEffectStyle(style.value)
                  return (
                    <div
                      key={style.id}
                      className="dshc-list-row dshc-style-row"
                      draggable
                      title={`${style.name}（点击应用到选区，或拖到画布图层上）`}
                      onClick={() => store.applyStyle(style.id)}
                      onDragStart={(event: React.DragEvent) => {
                        const target = event.target as HTMLElement | null
                        if (target?.closest?.('button, input')) {
                          event.preventDefault()
                          return
                        }
                        event.dataTransfer.effectAllowed = 'copy'
                        event.dataTransfer.setData(STYLE_DRAG_MIME, style.id)
                        event.dataTransfer.setData('text/plain', style.name)
                        setActiveCanvasDrag({
                          kind: 'style',
                          id: style.id,
                          name: style.name,
                          styleType: style.type,
                        })
                      }}
                      onDragEnd={() => clearActiveCanvasDrag()}
                    >
                      <span className={`dshc-style-swatch is-${type}`} style={descriptor.swatchStyle}>
                        {type === 'text' ? 'Aa' : null}
                      </span>
                      <div className="dshc-template-info">
                        <span className="dshc-list-name" title={style.name}>
                          {style.name}
                        </span>
                        <span className="dshc-style-meta">{descriptor.meta}</span>
                      </div>
                      <span className="dshc-muted">{`${usage}`}</span>
                      <IconButton
                        icon="pencil"
                        title="重命名样式"
                        size={13}
                        onClick={(event: React.MouseEvent) => {
                          event.stopPropagation()
                          onNeedName?.({
                            title: '重命名样式',
                            label: '样式名称',
                            defaultValue: style.name,
                            onSubmit: (name) => store.renameStyle?.(style.id, name),
                          })
                        }}
                      />
                      <IconButton
                        icon="check"
                        title="应用到选区"
                        size={13}
                        onClick={(event: React.MouseEvent) => {
                          event.stopPropagation()
                          store.applyStyle(style.id)
                        }}
                      />
                      <IconButton
                        icon="ungroup"
                        title="解绑引用"
                        size={13}
                        onClick={(event: React.MouseEvent) => {
                          event.stopPropagation()
                          store.detachStyle(style.id)
                        }}
                      />
                      <IconButton
                        icon="trash"
                        title="删除样式"
                        size={13}
                        danger
                        onClick={(event: React.MouseEvent) => {
                          event.stopPropagation()
                          store.deleteStyle(style.id)
                        }}
                      />
                    </div>
                  )
                })
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

export function FontsPanel({ store }: { store: any; onNeedName?: (opts: NameDialogOptions) => void }) {
  const doc = store.state.doc
  const [family, setFamily] = React.useState('')
  const [weight, setWeight] = React.useState('400')
  const [style, setStyle] = React.useState('normal')
  const [file, setFile] = React.useState<File | null>(null)
  const [busy, setBusy] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)
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

  return (
    <div className="dshc-panel">
      <div className="dshc-panel-title">
        字体
        <span className="dshc-panel-count">{doc.fonts?.length ?? 0}</span>
      </div>
      <div className="dshc-panel-group">
        <div className="dshc-panel-subtitle">上传字体</div>
        <Field label="字体文件" wide>
          <input
            ref={fileRef}
            type="file"
            accept=".woff2,.woff,.ttf,.otf"
            onChange={(event) => {
              const next = event.target.files?.[0] ?? null
              setFile(next)
              if (next && !family) {
                setFamily(next.name.replace(/\.[^.]+$/, '').replace(/[-_](Regular|Medium|SemiBold|Bold|Light|Italic)$/i, ''))
              }
            }}
          />
        </Field>
        <Field label="家族名" wide>
          <input className="dshc-text-input" value={family} onChange={(event) => setFamily(event.target.value)} />
        </Field>
        <div className="dshc-grid-2">
          <Field label="字重">
            <Select
              value={weight}
              options={[100, 200, 300, 400, 500, 600, 700, 800, 900].map((value) => ({
                value: String(value),
                label: String(value),
              }))}
              onChange={setWeight}
            />
          </Field>
          <Field label="样式">
            <Select
              value={style}
              options={[
                { value: 'normal', label: '常规' },
                { value: 'italic', label: '斜体' },
              ]}
              onChange={setStyle}
            />
          </Field>
        </div>
        <Button small primary icon="upload" disabled={busy || !file || !family.trim()} onClick={upload}>
          {busy ? '上传中…' : '上传并登记'}
        </Button>
        <div className="dshc-help">文件保存到 .dsh-canvas/fonts/，客户端 @font-face 加载；不做服务端转换或子集化。</div>
      </div>
      <div className="dshc-panel-group">
        <div className="dshc-panel-subtitle">已上传</div>
        {(doc.fonts ?? []).length === 0 ? (
          <div className="dshc-muted dshc-pad">还没有自定义字体；系统字体可直接使用。</div>
        ) : (
          (doc.fonts ?? []).map((font: any) => (
            <div key={font.id} className="dshc-list-row">
              <Icon name="fonts" size={13} />
              <span className="dshc-list-name">{font.family}</span>
              <span className="dshc-muted">{`${font.weight} ${font.style}`}</span>
              <IconButton icon="trash" title="删除字体" size={13} danger onClick={() => store.removeFont(font.id)} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function CommentsPanel({ store }: { store: any }) {
  const doc = store.state.doc
  const [showResolved, setShowResolved] = React.useState(false)
  const [replyText, setReplyText] = React.useState('')
  const [replyId, setReplyId] = React.useState<string | null>(null)
  if (!doc) return null

  const comments = (doc.comments ?? []).filter(
    (comment: any) => comment.pageId === store.state.pageId && (showResolved || !comment.resolved),
  )

  return (
    <div className="dshc-panel">
      <div className="dshc-panel-title">
        评论
        <span className="dshc-panel-count">{comments.length}</span>
      </div>
      <div className="dshc-panel-actions">
        <Button small icon="comment" onClick={() => store.setTool('comment')}>
          添加评论
        </Button>
        <Button small active={showResolved} onClick={() => setShowResolved(!showResolved)}>
          已解决
        </Button>
      </div>
      {comments.length === 0 ? (
        <Empty icon="comment" title="没有评论" text="用评论工具点画布，或选中元素后添加。" />
      ) : (
        comments.map((comment: any) => {
          const targetLabel = resolveCommentTargetLabel(store, doc, comment.nodeId)
          return (
            <div key={comment.id} className={`dshc-comment-card ${comment.resolved ? 'is-resolved' : ''}`}>
              <div className="dshc-comment-card-head">
                <span className="dshc-comment-author">
                  {comment.figmaAuthor ? comment.figmaAuthor : comment.author === 'ai' ? 'AI' : '你'}
                </span>
                {comment.source === 'figma' ? <span className="dshc-comment-badge">来自 Figma</span> : null}
                {comment.anchorState === 'unanchored-needs-relocate' ? (
                  <span className="dshc-comment-badge is-warn">待定位</span>
                ) : null}
                <span className="dshc-muted" title={comment.nodeId ? `${targetLabel} (${comment.nodeId})` : '画布'}>
                  {targetLabel}
                </span>
                {comment.resolved ? <span className="dshc-muted">已解决</span> : null}
              </div>
              <div className="dshc-comment-card-body">{comment.body}</div>
              {(comment.replies ?? []).map((reply: any) => (
                <div key={reply.id} className="dshc-comment-card-reply">
                  <b>{reply.author === 'ai' ? 'AI' : '你'}</b>
                  {reply.body}
                </div>
              ))}
              {replyId === comment.id && (
                <div>
                  <textarea
                    className="dshc-comment-input"
                    rows={2}
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    placeholder="回复…"
                  />
                  <div className="dshc-row">
                    <Button
                      small
                      onClick={() => {
                        store.replyComment(comment.id, replyText)
                        setReplyText('')
                        setReplyId(null)
                      }}
                    >
                      发送
                    </Button>
                    <Button
                      small
                      onClick={() => {
                        setReplyId(null)
                        setReplyText('')
                      }}
                    >
                      取消
                    </Button>
                  </div>
                </div>
              )}
              <div className="dshc-comment-card-actions">
                <Button small onClick={() => store.focusComment?.(comment)}>
                  定位
                </Button>
                <Button
                  small
                  onClick={() => {
                    setReplyId(replyId === comment.id ? null : comment.id)
                    setReplyText('')
                  }}
                >
                  回复
                </Button>
                <Button small onClick={() => store.resolveComment(comment.id, !comment.resolved)}>
                  {comment.resolved ? '重开' : '解决'}
                </Button>
                <Button small danger onClick={() => store.deleteComment(comment.id)}>
                  删除
                </Button>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
