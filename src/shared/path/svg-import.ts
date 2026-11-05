import { parsePathData } from './parse.js'
import type { PathViewBox } from './types.js'

export interface ImportedPath {
  name: string
  d: string
  viewBox: PathViewBox
  width: number
  height: number
  fills: Array<{ type: 'solid'; color: string }>
  strokes: Array<{ color: string; width: number; align: 'center' }>
  fillRule: 'nonzero' | 'evenodd'
}

export interface SvgImportResult {
  paths: ImportedPath[]
  warnings: string[]
}

function attrs(text: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const match of text.matchAll(/([:\w-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) {
    result[match[1]!] = match[3] ?? match[4] ?? ''
  }
  return result
}

function viewBoxOfAttrs(values: Record<string, string>): PathViewBox | null {
  const parts = (values.viewBox ?? '').trim().split(/[\s,]+/).map(Number)
  if (parts.length !== 4 || parts.some((value) => !Number.isFinite(value)) || parts[2]! <= 0 || parts[3]! <= 0) return null
  return { x: parts[0]!, y: parts[1]!, width: parts[2]!, height: parts[3]! }
}

function shapePath(tag: string, values: Record<string, string>): string | null {
  const n = (name: string, fallback = 0) => {
    const value = Number(values[name])
    return Number.isFinite(value) ? value : fallback
  }
  if (tag === 'rect') {
    const x = n('x')
    const y = n('y')
    const w = n('width')
    const h = n('height')
    if (w <= 0 || h <= 0) return null
    return `M${x} ${y}h${w}v${h}h${-w}z`
  }
  if (tag === 'circle' || tag === 'ellipse') {
    const cx = n('cx')
    const cy = n('cy')
    const rx = tag === 'circle' ? n('r') : n('rx')
    const ry = tag === 'circle' ? n('r') : n('ry')
    if (rx <= 0 || ry <= 0) return null
    return `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0z`
  }
  if (tag === 'line') {
    return `M${n('x1')} ${n('y1')}L${n('x2')} ${n('y2')}`
  }
  if (tag === 'polyline' || tag === 'polygon') {
    const numbers = (values.points ?? '').trim().split(/[\s,]+/).map(Number).filter(Number.isFinite)
    if (numbers.length < 4) return null
    const pairs = []
    for (let i = 0; i + 1 < numbers.length; i += 2) pairs.push(`${numbers[i]} ${numbers[i + 1]}`)
    return `M${pairs.join('L')}${tag === 'polygon' ? 'Z' : ''}`
  }
  return null
}

/** Basic SVG path import: extracts <path> elements, ignores groups/transforms/text/images. */
export function importSvgPaths(source: string): SvgImportResult {
  const warnings: string[] = []
  const paths: ImportedPath[] = []
  const root = /<svg\b([^>]*)>/i.exec(source)
  const rootAttrs = root ? attrs(root[1] ?? '') : {}
  const rootViewBox = viewBoxOfAttrs(rootAttrs)
  if (/<text\b|<image\b|<filter\b|<mask\b|<clipPath\b/i.test(source)) {
    warnings.push('已跳过 text/image/filter/mask/clipPath')
  }
  if (/<g\b[^>]*\btransform\s*=/i.test(source) || /<path\b[^>]*\btransform\s*=/i.test(source)) {
    warnings.push('已跳过 transform（基础导入暂不展开分组变换）')
  }
  let index = 0
  for (const match of source.matchAll(/<(path|rect|circle|ellipse|line|polyline|polygon)\b([^>]*)\/?>/gi)) {
    index += 1
    const tag = match[1]!.toLowerCase()
    const values = attrs(match[2] ?? '')
    const d = tag === 'path' ? values.d : shapePath(tag, values)
    if (!d) {
      warnings.push(`第 ${index} 个 ${tag} 无法转换为 path，已跳过`)
      continue
    }
    let parsed
    try {
      parsed = parsePathData(d)
    } catch (error) {
      warnings.push(`第 ${index} 个 path 无法解析，已跳过：${error instanceof Error ? error.message : String(error)}`)
      continue
    }
    const viewBox = viewBoxOfAttrs(values) ?? {
      x: parsed.bounds.minX,
      y: parsed.bounds.minY,
      width: Math.max(1, parsed.bounds.maxX - parsed.bounds.minX),
      height: Math.max(1, parsed.bounds.maxY - parsed.bounds.minY),
    }
    const fill = values.fill && values.fill !== 'none' && /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(values.fill) ? values.fill : null
    const stroke = values.stroke && values.stroke !== 'none' && /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(values.stroke) ? values.stroke : null
    const strokeWidth = Number(values['stroke-width'])
    paths.push({
      name: values.id || `Path ${index}`,
      d,
      viewBox,
      width: rootViewBox?.width ?? viewBox.width,
      height: rootViewBox?.height ?? viewBox.height,
      fills: fill ? [{ type: 'solid', color: fill }] : [],
      strokes: stroke ? [{ color: stroke, width: Number.isFinite(strokeWidth) && strokeWidth > 0 ? strokeWidth : 1, align: 'center' }] : [],
      fillRule: values['fill-rule'] === 'evenodd' ? 'evenodd' : 'nonzero',
    })
  }
  if (!paths.length) warnings.push('没有找到可导入的 <path>')
  return { paths, warnings }
}
