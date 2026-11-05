/** Hit testing over the resolved scene. Pure; shared by CanvasView and tests. */

import { pointInNode } from './geometry.js'

function hitDeep(node, point) {
  if (!node || node.visible === false || node.locked) return null
  if (node.type === 'group') {
    for (const child of [...(node.children ?? [])].reverse()) {
      const hit = hitDeep(child, point)
      if (hit) return hit
    }
    return null
  }
  if (!pointInNode(node, point)) return null
  for (const child of [...(node.children ?? [])].reverse()) {
    const hit = hitDeep(child, point)
    if (hit) return hit
  }
  return node
}

/**
 * Deepest hit then bubble groups and instances according to the entered
 * instance. `deep` returns the raw leaf (used by double-click to enter).
 * @param {any} scene
 * @param {{x:number,y:number}} point
 * @param {{enteredInstance?: string|null, deep?: boolean}} [options]
 */
export function hitTestScene(scene, point, options = {}) {
  if (!scene) return null
  let deepest = null
  for (const node of [...(scene.roots ?? [])].reverse()) {
    deepest = hitDeep(node, point)
    if (deepest) break
  }
  if (!deepest) return null
  if (options.deep) return deepest
  const entered = options.enteredInstance ?? null
  let current = deepest
  while (current.parent) {
    const parent = current.parent
    if (parent.type === 'group') {
      current = parent
      continue
    }
    if (parent.type === 'instance' && parent.key !== entered) {
      current = parent
      continue
    }
    break
  }
  return current
}
