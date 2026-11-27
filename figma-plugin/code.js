/**
 * Drafi Companion Figma Plugin — Main Thread (`figma.*` Plugin API).
 *
 * Works on 100% free Figma Starter accounts (no paid seat / no Dev Mode required).
 * - Non-invasive identity binding via `node.setPluginData('dshId', id)`
 * - Exports selection or current page to `dsh.figma.ir@1`
 * - Applies `FigmaSyncPatch` (`in-place` with passthrough preservation, or `proposal-frame`)
 */

const PLUGIN_NS_KEY = 'dshId'

figma.showUI(__html__, { width: 340, height: 480, themeColors: true })

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0))
}

function round2(v) {
  const n = Math.round((Number(v) || 0) * 100) / 100
  return Object.is(n, -0) ? 0 : n
}

function rgbToHex(color, opacity = 1) {
  const r = Math.round(clamp01(color.r) * 255)
  const g = Math.round(clamp01(color.g) * 255)
  const b = Math.round(clamp01(color.b) * 255)
  const hex = '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')
  return { color: hex, opacity: round2(clamp01((color.a ?? 1) * opacity)) }
}

function hexToRgb(hex) {
  const clean = String(hex || '#000000').replace('#', '').trim()
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.padEnd(6, '0')
  return {
    r: parseInt(full.slice(0, 2), 16) / 255,
    g: parseInt(full.slice(2, 4), 16) / 255,
    b: parseInt(full.slice(4, 6), 16) / 255,
  }
}

function serializeFills(fills) {
  if (!Array.isArray(fills)) return undefined
  const out = []
  for (const p of fills) {
    if (!p || p.visible === false) continue
    const op = typeof p.opacity === 'number' ? p.opacity : 1
    if (p.type === 'SOLID') {
      const conv = rgbToHex(p.color, op)
      out.push(conv.opacity < 1 ? { type: 'solid', color: conv.color, opacity: conv.opacity } : { type: 'solid', color: conv.color })
    } else if (p.type === 'GRADIENT_LINEAR' || p.type === 'GRADIENT_RADIAL') {
      const stops = (p.gradientStops || []).map((s) => {
        const conv = rgbToHex(s.color, 1)
        return { position: round2(s.position), color: conv.color, ...(conv.opacity < 1 ? { opacity: conv.opacity } : {}) }
      })
      if (stops.length >= 2) {
        out.push({ type: p.type === 'GRADIENT_LINEAR' ? 'linear-gradient' : 'radial-gradient', angle: 180, stops })
      }
    } else if (p.type === 'IMAGE' && p.imageHash) {
      const mode = String(p.scaleMode || 'FILL').toLowerCase()
      out.push({ type: 'image', imageHash: p.imageHash, scaleMode: ['fill', 'fit', 'stretch', 'tile'].includes(mode) ? mode : 'fill' })
    }
  }
  return out.length ? out : undefined
}

function serializeLayout(node) {
  if (!('layoutMode' in node) || (node.layoutMode !== 'HORIZONTAL' && node.layoutMode !== 'VERTICAL')) return undefined
  const mapPrimary = (v) => (v === 'CENTER' ? 'center' : v === 'MAX' ? 'end' : v === 'SPACE_BETWEEN' ? 'space-between' : 'start')
  const mapCounter = (v) => (v === 'CENTER' ? 'center' : v === 'MAX' ? 'end' : 'start')
  return {
    direction: node.layoutMode === 'HORIZONTAL' ? 'horizontal' : 'vertical',
    gap: round2(node.itemSpacing || 0),
    padding: {
      top: round2(node.paddingTop || 0),
      right: round2(node.paddingRight || 0),
      bottom: round2(node.paddingBottom || 0),
      left: round2(node.paddingLeft || 0),
    },
    alignPrimary: mapPrimary(node.primaryAxisAlignItems),
    alignCounter: mapCounter(node.counterAxisAlignItems),
    ...(node.layoutWrap === 'WRAP' ? { wrap: true } : {}),
  }
}

function serializeNode(node, imageHashes) {
  const typeMap = {
    FRAME: 'frame',
    COMPONENT: 'frame',
    COMPONENT_SET: 'frame',
    INSTANCE: 'frame',
    SECTION: 'frame',
    GROUP: 'group',
    RECTANGLE: 'rect',
    ELLIPSE: 'ellipse',
    LINE: 'line',
    TEXT: 'text',
  }
  const type = typeMap[node.type] || 'frame'
  const dshId = node.getPluginData(PLUGIN_NS_KEY) || undefined
  const fills = 'fills' in node ? serializeFills(node.fills) : undefined
  if (fills) {
    for (const f of fills) {
      if (f.type === 'image' && f.imageHash) imageHashes.add(f.imageHash)
    }
  }
  const passthrough = {}
  if ('blendMode' in node && node.blendMode && node.blendMode !== 'PASS_THROUGH' && node.blendMode !== 'NORMAL') {
    passthrough.blendMode = node.blendMode
  }
  if ('reactions' in node && Array.isArray(node.reactions) && node.reactions.length > 0) {
    passthrough.reactions = node.reactions
  }
  if ('constraints' in node && node.constraints) {
    passthrough.constraints = node.constraints
  }

  const ir = {
    figmaId: node.id,
    ...(dshId ? { dshId } : {}),
    type,
    name: node.name,
    x: round2(node.x),
    y: round2(node.y),
    width: round2(node.width),
    height: round2(node.height),
    ...('rotation' in node && node.rotation ? { rotation: round2(node.rotation) } : {}),
    ...('opacity' in node && node.opacity < 1 ? { opacity: round2(node.opacity) } : {}),
    ...(node.visible === false ? { visible: false } : {}),
    ...(node.locked === true ? { locked: true } : {}),
    ...(type === 'frame' && 'clipsContent' in node ? { clip: node.clipsContent } : {}),
    ...('cornerRadius' in node && typeof node.cornerRadius === 'number' && node.cornerRadius > 0
      ? { cornerRadius: round2(node.cornerRadius) }
      : {}),
    ...('topLeftRadius' in node && node.cornerRadius === figma.mixed
      ? { cornerRadii: [round2(node.topLeftRadius), round2(node.topRightRadius), round2(node.bottomRightRadius), round2(node.bottomLeftRadius)] }
      : {}),
    ...(fills ? { fills } : {}),
    ...(serializeLayout(node) ? { layout: serializeLayout(node) } : {}),
    ...('layoutPositioning' in node && node.layoutPositioning === 'ABSOLUTE' ? { layoutPositioning: 'absolute' } : {}),
    ...(type === 'text'
      ? {
          text: node.characters,
          font: {
            family: node.fontName && node.fontName !== figma.mixed ? node.fontName.family : 'Inter',
            weight: 400,
            size: typeof node.fontSize === 'number' ? round2(node.fontSize) : 14,
            lineHeight: 1.4,
          },
        }
      : {}),
    ...(Object.keys(passthrough).length ? { passthrough } : {}),
  }

  if ('children' in node && (type === 'frame' || type === 'group')) {
    ir.children = node.children.map((child) => serializeNode(child, imageHashes))
  }
  return ir
}

async function exportScopeToIr(scope) {
  const imageHashes = new Set()
  const page = figma.currentPage
  const roots = scope === 'selection' && page.selection.length > 0 ? page.selection : page.children
  const ir = {
    format: 'dsh.figma.ir',
    version: 1,
    fileKey: figma.fileKey || 'local-figma',
    fileName: figma.root.name,
    readCompleteness: scope === 'selection' && page.selection.length > 0 ? 'partial' : 'complete',
    pages: [
      {
        figmaId: page.id,
        name: page.name,
        children: roots.map((node) => serializeNode(node, imageHashes)),
      },
    ],
  }
  const images = {}
  for (const hash of imageHashes) {
    try {
      const img = figma.getImageByHash(hash)
      if (img) {
        const bytes = await img.getBytesAsync()
        images[hash] = figma.base64Encode(bytes)
      }
    } catch {
      // ignore missing image hash
    }
  }
  return { ir, images }
}

async function applyField(node, field, value) {
  if (field === 'name' && typeof value === 'string') node.name = value
  else if (field === 'x' && typeof value === 'number') node.x = value
  else if (field === 'y' && typeof value === 'number') node.y = value
  else if ((field === 'width' || field === 'height') && 'resize' in node) {
    const w = field === 'width' ? Math.max(0.01, Number(value)) : node.width
    const h = field === 'height' ? Math.max(0.01, Number(value)) : node.height
    node.resize(w, h)
  } else if (field === 'opacity' && 'opacity' in node && typeof value === 'number') node.opacity = clamp01(value)
  else if (field === 'visible' && typeof value === 'boolean') node.visible = value
  else if (field === 'cornerRadius' && 'cornerRadius' in node && typeof value === 'number') node.cornerRadius = Math.max(0, value)
  else if (field === 'fills' && 'fills' in node && Array.isArray(value)) {
    const nextFills = []
    for (const f of value) {
      if (f.type === 'solid') {
        nextFills.push({ type: 'SOLID', color: hexToRgb(f.color), opacity: clamp01(f.opacity ?? 1) })
      }
    }
    if (nextFills.length) node.fills = nextFills
  } else if (field === 'text' && node.type === 'TEXT' && typeof value === 'string') {
    const fontName = node.fontName !== figma.mixed ? node.fontName : { family: 'Inter', style: 'Regular' }
    await figma.loadFontAsync(fontName)
    node.characters = value
  }
}

async function applySyncPatch(patch) {
  const appliedDshIds = []
  const createdNodeIds = {}
  const rejected = []
  const isProposal = patch.mode === 'proposal-frame'
  const proposalClones = new Map()

  for (const op of patch.operations || []) {
    try {
      if (op.op === 'update' || op.op === 'move') {
        let target = op.figmaNodeId ? await figma.getNodeByIdAsync(op.figmaNodeId) : null
        if (!target) {
          rejected.push({ dshId: op.dshId, reason: 'target-not-found' })
          continue
        }
        if (isProposal) {
          // Clone the top-level root frame once and apply edits on the clone
          let root = target
          while (root.parent && root.parent.type !== 'PAGE') root = root.parent
          if (!proposalClones.has(root.id) && 'clone' in root) {
            const cloned = root.clone()
            cloned.name = `${root.name} [Drafi Diff]`
            cloned.x = root.x + root.width + 80
            proposalClones.set(root.id, cloned)
          }
          const cloneRoot = proposalClones.get(root.id)
          if (cloneRoot) {
            target = cloneRoot.id === target.id ? cloneRoot : cloneRoot.findOne((n) => n.name === target.name) || target
          }
        }
        if ('setPluginData' in target) target.setPluginData(PLUGIN_NS_KEY, op.dshId)
        for (const [field, value] of Object.entries(op.fields || {})) {
          await applyField(target, field, value)
        }
        appliedDshIds.push(op.dshId)
      } else if (op.op === 'create' && op.node) {
        const parent = op.parentFigmaNodeId ? await figma.getNodeByIdAsync(op.parentFigmaNodeId) : figma.currentPage
        let created
        if (op.node.type === 'text') {
          created = figma.createText()
          await figma.loadFontAsync({ family: 'Inter', style: 'Regular' })
          created.characters = op.node.text || ''
        } else if (op.node.type === 'ellipse') {
          created = figma.createEllipse()
        } else if (op.node.type === 'rect') {
          created = figma.createRectangle()
        } else {
          created = figma.createFrame()
        }
        created.name = op.node.name || op.node.type
        created.x = op.node.x || 0
        created.y = op.node.y || 0
        if ('resize' in created) created.resize(Math.max(1, op.node.width || 100), Math.max(1, op.node.height || 100))
        if (op.node.fills) await applyField(created, 'fills', op.node.fills)
        created.setPluginData(PLUGIN_NS_KEY, op.dshId)
        if (parent && 'appendChild' in parent) parent.appendChild(created)
        createdNodeIds[op.dshId] = created.id
        appliedDshIds.push(op.dshId)
      } else if (op.op === 'delete' && !isProposal && op.figmaNodeId) {
        const target = await figma.getNodeByIdAsync(op.figmaNodeId)
        if (target && 'remove' in target) target.remove()
        appliedDshIds.push(op.dshId)
      }
    } catch (error) {
      rejected.push({ dshId: op.dshId, reason: String(error && error.message ? error.message : error) })
    }
  }

  return {
    planId: patch.planId,
    appliedDshIds,
    createdNodeIds,
    rejected,
  }
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'export-ir') {
    const data = await exportScopeToIr(msg.scope || 'selection')
    figma.ui.postMessage({ type: 'ir-exported', requestId: msg.requestId, ...data })
  } else if (msg.type === 'apply-patch') {
    const ack = await applySyncPatch(msg.patch)
    figma.ui.postMessage({ type: 'patch-applied', requestId: msg.requestId, ack })
  }
}
