/** DOM renderer for the resolved scene. The scene pipeline computes absolute
 * geometry, text lines and resolved styles; this file only paints. */

import * as React from 'react'
import { assetUrl } from '../api.js'

const P = 'dshc'

function clamp01(value) {
  return Math.min(1, Math.max(0, Number(value) || 0))
}

function solidCss(fill) {
  const color = fill.color ?? '#000000'
  if (fill.opacity == null || fill.opacity >= 1) return color
  const alpha = Math.round(clamp01(fill.opacity) * 255).toString(16).padStart(2, '0')
  return color.length === 7 ? `${color}${alpha}` : color
}

export function fillCss(fill) {
  if (!fill) return 'transparent'
  if (fill.type === 'solid') return solidCss(fill)
  const stops = (fill.stops ?? [])
    .map((stop) => `${stop.color} ${(clamp01(stop.position) * 100).toFixed(2)}%`)
    .join(', ')
  if (fill.type === 'linear-gradient') return `linear-gradient(${Number(fill.angle) || 0}deg, ${stops})`
  if (fill.type === 'radial-gradient') {
    const x = clamp01(fill.center?.x ?? 0.5) * 100
    const y = clamp01(fill.center?.y ?? 0.5) * 100
    const radius = Math.max(0.01, clamp01(fill.radius ?? 0.7)) * 100
    return `radial-gradient(circle ${radius}% at ${x}% ${y}%, ${stops})`
  }
  return 'transparent'
}

export function primaryPaint(node) {
  const fill = node.fills?.find((entry) => entry.type === 'solid') ?? node.fills?.[0]
  if (!fill) return { color: 'transparent', gradient: null }
  if (fill.type === 'solid') return { color: solidCss(fill), gradient: null }
  return { color: 'transparent', gradient: fillCss(fill) }
}

function shadowAndFilter(node) {
  const shadows = []
  let filter = ''
  let backdrop = ''
  for (const effect of node.effects ?? []) {
    if (effect.visible === false) continue
    if (effect.type === 'drop-shadow') {
      shadows.push(`${effect.x ?? 0}px ${effect.y ?? 0}px ${effect.blur ?? 0}px ${effect.spread ?? 0}px ${effect.color ?? '#00000040'}`)
    } else if (effect.type === 'inner-shadow') {
      shadows.push(`inset ${effect.x ?? 0}px ${effect.y ?? 0}px ${effect.blur ?? 0}px ${effect.spread ?? 0}px ${effect.color ?? '#00000040'}`)
    } else if (effect.type === 'layer-blur') {
      filter += ` blur(${effect.radius ?? 0}px)`
    } else if (effect.type === 'background-blur') {
      backdrop += ` blur(${effect.radius ?? 0}px)`
    }
  }
  for (const stroke of node.strokes ?? []) {
    const width = Number(stroke.width) || 1
    const color = stroke.color ?? '#000000'
    shadows.push(`${stroke.align === 'outside' ? '' : 'inset '}0 0 0 ${width}px ${color}`)
  }
  return {
    boxShadow: shadows.length ? shadows.join(', ') : undefined,
    filter: filter.trim() ? filter.trim() : undefined,
    backdropFilter: backdrop.trim() ? backdrop.trim() : undefined,
    WebkitBackdropFilter: backdrop.trim() ? backdrop.trim() : undefined,
  }
}

function rounded(node) {
  const radius = node.cornerRadius ?? 0
  if (node.type === 'ellipse') return '50%'
  return radius ? `${radius}px` : undefined
}

function ImageFill({ fill, sessionId, docName }) {
  const crop = fill.crop ?? { x: 0, y: 0, width: 1, height: 1 }
  const url = assetUrl(sessionId, docName, fill.asset)
  const width = 100 / Math.max(0.01, crop.width)
  const height = 100 / Math.max(0.01, crop.height)
  return React.createElement(
    'div',
    {
      className: `${P}-fill`,
      style: { position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit' },
    },
    React.createElement('img', {
      src: url,
      alt: '',
      draggable: false,
      style: {
        position: 'absolute',
        left: `${(-crop.x / Math.max(0.01, crop.width)) * 100}%`,
        top: `${(-crop.y / Math.max(0.01, crop.height)) * 100}%`,
        width: `${width}%`,
        height: `${height}%`,
        maxWidth: 'none',
        objectFit: fill.fit === 'contain' ? 'contain' : fill.fit === 'fill' ? 'fill' : 'cover',
        borderRadius: 'inherit',
      },
    }),
  )
}

function FillLayers({ node, store }) {
  if (!node.fills?.length) return null
  return node.fills.map((fill, index) => {
    if (fill.type === 'image') {
      return React.createElement(ImageFill, {
        key: `fill-${index}`,
        fill,
        sessionId: store.sessionId,
        docName: store.state.name,
      })
    }
    return React.createElement('div', {
      key: `fill-${index}`,
      className: `${P}-fill`,
      style: {
        position: 'absolute',
        inset: 0,
        background: fillCss(fill),
        borderRadius: 'inherit',
        pointerEvents: 'none',
      },
    })
  })
}

export const NodeView = React.memo(function NodeView({ node, store, parentAbs }) {
  if (!node || node.visible === false) return null
  const left = node.absX - (parentAbs?.x ?? 0)
  const top = node.absY - (parentAbs?.y ?? 0)
  const effects = shadowAndFilter(node)
  const editing = store.state.editingText?.key === node.key
  const baseStyle = {
    position: 'absolute',
    left: `${left}px`,
    top: `${top}px`,
    width: `${node.width}px`,
    height: `${node.height}px`,
    transform: node.rotation ? `rotate(${node.rotation}deg)` : undefined,
    transformOrigin: 'center',
    opacity: node.opacity == null ? 1 : node.opacity,
    borderRadius: rounded(node),
    boxSizing: 'border-box',
    ...effects,
  }

  if (node.type === 'group') {
    return React.createElement(
      'div',
      { className: `${P}-node ${P}-group`, 'data-node-key': node.key, style: { ...baseStyle, pointerEvents: 'none' } },
      (node.children ?? []).map((child) =>
        React.createElement(NodeView, {
          key: child.key,
          node: child,
          store,
          parentAbs: { x: node.absX, y: node.absY },
        }),
      ),
    )
  }

  if (node.type === 'text') {
    const paint = primaryPaint(node)
    const lines = node.lines ?? []
    const lineHeight = (node.font?.size ?? 14) * (node.font?.lineHeight ?? 1.4)
    const contentHeight = lines.length * lineHeight
    const vertical = node.verticalAlign ?? 'top'
    const offset = vertical === 'center' ? (node.height - contentHeight) / 2 : vertical === 'bottom' ? node.height - contentHeight : 0
    const fontStyle = {
      fontFamily: `"${node.font?.family ?? 'system-ui'}", system-ui, sans-serif`,
      fontWeight: node.font?.weight ?? 400,
      fontStyle: node.font?.style ?? 'normal',
      fontSize: `${node.font?.size ?? 14}px`,
      lineHeight: `${lineHeight}px`,
      letterSpacing: `${node.font?.letterSpacing ?? 0}px`,
      textAlign: node.align ?? 'left',
      color: paint.color,
      backgroundImage: paint.gradient ?? undefined,
      WebkitBackgroundClip: paint.gradient ? 'text' : undefined,
      backgroundClip: paint.gradient ? 'text' : undefined,
    }
    return React.createElement(
      'div',
      {
        className: `${P}-node ${P}-text`,
        'data-node-key': node.key,
        style: { ...baseStyle, overflow: node.effects?.length ? 'visible' : 'hidden' },
      },
      React.createElement(FillLayers, { node: { ...node, fills: node.fills?.filter((fill) => fill.type !== 'solid') ?? [] }, store }),
      !editing &&
        React.createElement(
          'div',
          {
            className: `${P}-text-lines`,
            style: {
              position: 'absolute',
              left: 0,
              top: `${offset}px`,
              width: '100%',
              height: `${contentHeight}px`,
              pointerEvents: 'none',
              ...fontStyle,
            },
          },
          lines.length
            ? lines.map((line, index) =>
                React.createElement(
                  'div',
                  { key: index, style: { whiteSpace: 'pre', height: `${lineHeight}px`, overflow: 'hidden' } },
                  line.text || ' ',
                ),
              )
            : React.createElement('div', { style: { whiteSpace: 'pre' } }, node.text ? String(node.text).split('\n')[0] : ' '),
        ),
      editing &&
        React.createElement('div', {
          style: {
            position: 'absolute',
            inset: 0,
            border: '1px solid var(--dshc-accent)',
            borderRadius: 2,
            pointerEvents: 'none',
          },
        }),
    )
  }

  const children = (node.children ?? []).map((child) =>
    React.createElement(NodeView, {
      key: child.key,
      node: child,
      store,
      parentAbs: { x: node.absX, y: node.absY },
    }),
  )

  return React.createElement(
    'div',
    {
      className: `${P}-node ${P}-${node.type}`,
      'data-node-key': node.key,
      style: { ...baseStyle, overflow: node.clip ? 'hidden' : undefined },
    },
    React.createElement(FillLayers, { node, store }),
    children,
  )
})

export function SceneView({ scene, store }) {
  if (!scene) return null
  return React.createElement(
    React.Fragment,
    null,
    (scene.roots ?? []).map((node) => React.createElement(NodeView, { key: node.key, node, store, parentAbs: { x: 0, y: 0 } })),
  )
}
