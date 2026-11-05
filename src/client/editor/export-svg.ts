// @ts-nocheck
/**
 * SVG exporter. Builds a standalone SVG from the resolved scene tree (the same
 * absolute geometry the DOM renderer paints), then PNG rasterisation reuses it.
 */

const FONT_FORMAT = { woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype' }

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(value) {
  return escapeXml(value).replace(/'/g, '&#39;')
}

function solid(fill) {
  if (!fill || fill.type !== 'solid') return 'none'
  return fill.color ?? '#000000'
}

function gradientDef(fill, id) {
  if (fill.type === 'linear-gradient') {
    const stops = (fill.stops ?? []).map((stop) => `<stop offset="${stop.position}" stop-color="${stop.color}"/>`).join('')
    const angle = ((Number(fill.angle) || 0) * Math.PI) / 180
    const x1 = 0.5 - Math.cos(angle) / 2
    const y1 = 0.5 - Math.sin(angle) / 2
    const x2 = 0.5 + Math.cos(angle) / 2
    const y2 = 0.5 + Math.sin(angle) / 2
    return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops}</linearGradient>`
  }
  const stops = (fill.stops ?? []).map((stop) => `<stop offset="${stop.position}" stop-color="${stop.color}"/>`).join('')
  return `<radialGradient id="${id}" cx="${fill.center?.x ?? 0.5}" cy="${fill.center?.y ?? 0.5}" r="${fill.radius ?? 0.7}">${stops}</radialGradient>`
}

function paint(fill, defs, key) {
  if (!fill) return 'none'
  if (fill.type === 'solid') return solid(fill)
  if (fill.type === 'linear-gradient' || fill.type === 'radial-gradient') {
    const id = `grad-${key}`
    defs.push(gradientDef(fill, id))
    return `url(#${id})`
  }
  return 'none'
}

function strokeProps(stroke) {
  if (!stroke) return ''
  return ` stroke="${stroke.color ?? '#000000'}" stroke-width="${stroke.width ?? 1}"`
}

function effectFilter(effects, defs, key) {
  const visible = (effects ?? []).filter((effect) => effect.visible !== false)
  if (!visible.length) return ''
  const id = `fx-${key}`
  const parts = []
  let blur = 0
  for (const effect of visible) {
    if (effect.type === 'layer-blur') blur += Number(effect.radius) || 0
    if (effect.type === 'drop-shadow') {
      parts.push(`<feDropShadow dx="${effect.x ?? 0}" dy="${effect.y ?? 0}" stdDeviation="${(Number(effect.blur) || 0) / 2}" flood-color="${effect.color ?? '#00000040'}"/>`)
    }
  }
  if (blur > 0) parts.unshift(`<feGaussianBlur stdDeviation="${blur / 2}"/>`)
  if (!parts.length) return ''
  defs.push(`<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">${parts.join('')}</filter>`)
  return ` filter="url(#${id})"`
}

function roundRect(attrs) {
  return `<rect ${attrs}/>`
}

function renderNode(node, context, parentAbs) {
  if (!node || node.visible === false) return ''
  const { defs, assets, keyPrefix, clip } = context
  const left = node.absX - (parentAbs?.x ?? 0)
  const top = node.absY - (parentAbs?.y ?? 0)
  const transform = `translate(${left} ${top})${node.rotation ? ` rotate(${node.rotation} ${node.width / 2} ${node.height / 2})` : ''}`
  const key = `${keyPrefix}-${node.key}`
  const filter = effectFilter(node.effects, defs, key)
  const opacity = node.opacity == null ? 1 : node.opacity

  if (node.type === 'group') {
    return `<g transform="${transform}" opacity="${opacity}">${(node.children ?? []).map((child) => renderNode(child, context, { x: node.absX, y: node.absY })).join('')}</g>`
  }

  const clipId = `clip-${key}`
  let clipAttr = ''
  if (node.clip && node.children?.length) {
    const radius = node.type === 'ellipse' ? Math.min(node.width, node.height) / 2 : node.cornerRadius ?? 0
    defs.push(`<clipPath id="${clipId}"><rect width="${node.width}" height="${node.height}" rx="${radius}" ry="${radius}"/></clipPath>`)
    clipAttr = ` clip-path="url(#${clipId})"`
  }

  const parts = []
  const radius = node.type === 'ellipse' ? Math.min(node.width, node.height) / 2 : node.cornerRadius ?? 0

  if (node.type === 'path') {
    const parts = []
    for (const fill of node.fills ?? []) {
      const paintValue = paint(fill, defs, `${key}-${parts.length}`)
      const fillRule = node.fillRule === 'evenodd' ? 'evenodd' : 'nonzero'
      parts.push(`<path d="${escapeAttr(node.d ?? '')}" fill="${paintValue}" fill-rule="${fillRule}"/>`)
    }
    for (const stroke of node.strokes ?? []) {
      parts.push(`<path d="${escapeAttr(node.d ?? '')}" fill="none"${strokeProps(stroke)} stroke-linejoin="round"/>`)
    }
    return `<g transform="${transform}" opacity="${opacity}"${filter}>${parts.join('')}</g>`
  }

  if (node.type === 'text') {
    const font = node.font ?? {}
    const lineHeight = (font.size ?? 14) * (font.lineHeight ?? 1.4)
    const lines = node.lines ?? []
    const color = solid(node.fills?.[0]) 
    const align = node.align ?? 'left'
    const anchor = align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start'
    const x = align === 'center' ? node.width / 2 : align === 'right' ? node.width : 0
    const contentHeight = lines.length * lineHeight
    const offset = node.verticalAlign === 'center' ? (node.height - contentHeight) / 2 : node.verticalAlign === 'bottom' ? node.height - contentHeight : 0
    const spans = lines.length
      ? lines
          .map(
            (line, index) =>
              `<text x="${x}" y="${offset + lineHeight * (index + 0.8)}" font-family="${escapeAttr(`'${font.family ?? 'system-ui'}'`)}" font-size="${font.size ?? 14}" font-weight="${font.weight ?? 400}" font-style="${font.style ?? 'normal'}" letter-spacing="${font.letterSpacing ?? 0}" fill="${color === 'none' ? 'transparent' : color}" text-anchor="${anchor}" xml:space="preserve">${escapeXml(line.text || ' ')}</text>`,
          )
          .join('')
      : ''
    parts.push(`<g transform="${transform}" opacity="${opacity}"${filter}>${spans}</g>`)
    return parts.join('')
  }

  const common = `x="0" y="0" width="${node.width}" height="${node.height}"`
  for (const fill of node.fills ?? []) {
    if (fill.type === 'image') {
      const href = assets.get(fill.asset)
      if (!href) continue
      const crop = fill.crop
      if (crop) {
        const cropId = `crop-${key}`
        defs.push(`<clipPath id="${cropId}"><rect width="${node.width}" height="${node.height}" rx="${radius}" ry="${radius}"/></clipPath>`)
        parts.push(`<image href="${escapeAttr(href)}" x="${-crop.x * node.width / crop.width}" y="${-crop.y * node.height / crop.height}" width="${node.width / crop.width}" height="${node.height / crop.height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${cropId})"/>`)
      } else {
        parts.push(`<image href="${escapeAttr(href)}" ${common} preserveAspectRatio="xMidYMid slice"${radius ? ` rx="${radius}"` : ''}/>`)
      }
      continue
    }
    const fillPaint = paint(fill, defs, `${key}-${parts.length}`)
    if (node.type === 'ellipse') {
      parts.push(`<ellipse cx="${node.width / 2}" cy="${node.height / 2}" rx="${node.width / 2}" ry="${node.height / 2}" fill="${fillPaint}"/>`)
    } else if (node.type === 'line') {
      parts.push(`<line x1="0" y1="0" x2="${node.width}" y2="0"${strokeProps(node.strokes?.[0])}/>`)
    } else {
      parts.push(roundRect(`width="${node.width}" height="${node.height}" rx="${radius}" ry="${radius}" fill="${fillPaint}"`))
    }
  }

  if (node.type === 'line') {
    const stroke = node.strokes?.[0]
    parts.push(`<line x1="0" y1="0" x2="${node.width}" y2="0" stroke="${stroke?.color ?? '#111111'}" stroke-width="${stroke?.width ?? 1}"/>`)
  }

  if ((node.strokes ?? []).length && node.type !== 'line') {
    for (const stroke of node.strokes) {
      const strokePaint = stroke.color ?? '#000000'
      if (node.type === 'ellipse') {
        parts.push(`<ellipse cx="${node.width / 2}" cy="${node.height / 2}" rx="${Math.max(0, node.width / 2 - (stroke.width ?? 1) / 2)}" ry="${Math.max(0, node.height / 2 - (stroke.width ?? 1) / 2)}" fill="none" stroke="${strokePaint}" stroke-width="${stroke.width ?? 1}"/>`)
      } else {
        parts.push(roundRect(`width="${node.width}" height="${node.height}" rx="${radius}" ry="${radius}" fill="none" stroke="${strokePaint}" stroke-width="${stroke.width ?? 1}"`))
      }
    }
  }

  if ((node.children ?? []).length) {
    const children = node.children.map((child) => renderNode(child, context, { x: node.absX, y: node.absY })).join('')
    parts.push(`<g${clipAttr}>${children}</g>`)
  }

  return `<g transform="${transform}" opacity="${opacity}"${filter} data-node="${escapeAttr(node.key)}">${parts.join('')}</g>`
}

function collectAssets(node, out) {
  for (const fill of node.fills ?? []) if (fill.type === 'image' && fill.asset) out.add(fill.asset)
  for (const child of node.children ?? []) collectAssets(child, out)
}

function collectFonts(node, out) {
  if (node.type === 'text' && node.font?.family) out.add(`${node.font.family}::${node.font.weight ?? 400}::${node.font.style ?? 'normal'}`)
  for (const child of node.children ?? []) collectFonts(child, out)
}

/**
 * @param {any} scene
 * @param {{
 *   nodeKeys?: string[],
 *   background?: string|null,
 *   resolveAsset?: (asset: string) => Promise<string>,
 *   resolveFont?: (font: any) => Promise<string>,
 *   fonts?: any[],
 * }} options
 */
export async function buildSvg(scene, options = {}) {
  const roots = (scene?.roots ?? []).filter((node) => (options.nodeKeys ? options.nodeKeys.includes(node.key) : true))
  const selected = options.nodeKeys?.length ? (scene?.byKey ? options.nodeKeys.map((key) => scene.byKey.get(key)).filter(Boolean) : roots) : roots
  const nodes = selected.length ? selected : roots
  const assets = new Map()
  const assetSet = new Set()
  const fontSet = new Set()
  for (const node of nodes) {
    collectAssets(node, assetSet)
    collectFonts(node, fontSet)
  }
  if (options.resolveAsset) {
    for (const asset of assetSet) {
      try {
        assets.set(asset, await options.resolveAsset(asset))
      } catch {
        // omit a missing asset
      }
    }
  }

  const defs = []
  const fontCss = []
  for (const key of fontSet) {
    const [family, weight, style] = key.split('::')
    const font = (options.fonts ?? []).find((entry) => entry.family === family && String(entry.weight) === weight && (entry.style ?? 'normal') === style)
    if (!font || !options.resolveFont) continue
    try {
      const data = await options.resolveFont(font)
      const ext = font.asset.split('.').pop().toLowerCase()
      fontCss.push(`@font-face{font-family:'${family.replace(/'/g, "\\'")}';src:url('${data}') format('${FONT_FORMAT[ext] ?? 'truetype'}');font-weight:${weight};font-style:${style};}`)
    } catch {
      // fall back to a system font
    }
  }

  const minX = Math.min(...nodes.map((node) => node.absX))
  const minY = Math.min(...nodes.map((node) => node.absY))
  const maxX = Math.max(...nodes.map((node) => node.absX + node.width))
  const maxY = Math.max(...nodes.map((node) => node.absY + node.height))
  const width = Math.max(1, maxX - minX)
  const height = Math.max(1, maxY - minY)
  const context = { defs, assets, keyPrefix: 'n', clip: true }
  const body = nodes
    .map((node) => {
      const copy = { ...node, absX: node.absX - minX, absY: node.absY - minY }
      return renderNode(copy, context, { x: 0, y: 0 })
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs>${defs.join('')}</defs>
${fontCss.length ? `<style>${fontCss.join('')}</style>` : ''}
${options.background ? `<rect width="${width}" height="${height}" fill="${options.background}"/>` : ''}
${body}
</svg>`
}
