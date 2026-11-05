// @ts-nocheck
/**
 * dsh.canvas@1 — document mutations shared by the Host tools and the browser.
 *
 * The browser edits a mutable document and bumps a render version; the Host
 * clones before applying an agent patch so a failed validation never leaves a
 * half-written document. All shape rules live in format.js.
 */

import {
  CanvasError,
  findNodeInDoc,
  findNodeInTree,
  firstPage,
  isPlainObject,
  newId,
  normalizeDoc,
} from './format.js'

/** @param {any} doc */
export function cloneDoc(doc) {
  return structuredClone(doc)
}

/** @param {any} doc @param {string} pageId */
export function pageOf(doc, pageId) {
  return (doc.pages ?? []).find((page) => page.id === pageId) ?? null
}

/** @param {any} doc @param {string} id */
export function locate(doc, id) {
  const page = (doc.pages ?? []).find((entry) => entry.id === id)
  if (page) return { kind: 'page', page, parent: null, index: -1 }
  const component = (doc.components ?? []).find((entry) => entry.id === id)
  if (component) return { kind: 'component', component, page: null, parent: null, index: -1 }
  let result = null
  if (page?.children) {
    for (let index = 0; index < page.children.length; index += 1) {
      const found = findNodeInTree(page.children[index], id)
      if (found) {
        result = { kind: 'page-node', page, ...(found.parent ? found : { parent: null, index }) }
        // findNodeInTree returns the true parent and index for nested nodes.
        result = { kind: 'page-node', page, ...found }
        break
      }
    }
  }
  if (result) return result
  for (const component of doc.components ?? []) {
    const found = findNodeInTree(component.root, id)
    if (found) return { kind: 'component-node', component, page: null, ...found }
  }
  return null
}

/** @param {any} node */
function ensureIds(node) {
  if (!isPlainObject(node)) return node
  if (!node.id) node.id = newId(node.type === 'instance' ? 'i' : 'n')
  if (Array.isArray(node.children)) node.children.forEach((child) => ensureIds(child))
  return node
}

/**
 * Resolve an insert container.
 * @param {any} doc
 * @param {string|null|undefined} parent
 * @param {string|undefined} pageId
 */
function container(doc, parent, pageId) {
  const page = pageId ? pageOf(doc, pageId) : firstPage(doc)
  if (!page) throw new CanvasError('$.pages', 'document has no pages')
  if (parent == null || parent === page.id) return { children: page.children, owner: page, kind: 'page' }
  const found = findNodeInDoc(doc, parent)
  if (!found) throw new CanvasError('$', `unknown parent "${parent}"`)
  if (!Array.isArray(found.node.children)) {
    if (found.node.type === 'frame' || found.node.type === 'group') found.node.children = []
    else throw new CanvasError('$', `node "${parent}" cannot contain children`)
  }
  return { children: found.node.children, owner: found.node, kind: 'node' }
}

/** @param {any[]} children @param {any} node @param {number|undefined} index */
function insert(children, node, index) {
  if (index == null || index < 0 || index >= children.length) children.push(node)
  else children.splice(index, 0, node)
}

/** @param {any} doc @param {string} id */
function removeFromOwner(doc, id) {
  const found = findNodeInDoc(doc, id)
  if (!found) throw new CanvasError('$', `unknown node "${id}"`)
  if (found.parent) {
    const index = found.parent.children.findIndex((child) => child.id === id)
    if (index === -1) throw new CanvasError('$', `node "${id}" is not in its parent`)
    found.parent.children.splice(index, 1)
  } else if (found.component) {
    throw new CanvasError('$', 'component roots cannot be removed with a node op')
  } else if (found.page) {
    const index = found.page.children.findIndex((child) => child.id === id)
    found.page.children.splice(index, 1)
  }
  return found
}

/**
 * Shallow patch with a few structured merges. Undefined values are ignored;
 * `null` deletes optional fields.
 * @param {any} node
 * @param {Record<string, any>} patch
 */
export function patchNodeFields(node, patch) {
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue
    if (key === 'id' || key === 'type') continue
    if (value === null) {
      delete node[key]
      continue
    }
    if (key === 'font' && isPlainObject(value)) node.font = { ...(node.font ?? {}), ...value }
    else if (key === 'layout' && isPlainObject(value)) {
      node.layout = {
        ...(node.layout ?? {}),
        ...value,
        padding: { ...(node.layout?.padding ?? {}), ...(isPlainObject(value.padding) ? value.padding : {}) },
      }
    } else if (key === 'layoutSizing' && isPlainObject(value)) {
      node.layoutSizing = { ...(node.layoutSizing ?? {}), ...value }
    } else if (key === 'overrides' && isPlainObject(value)) {
      node.overrides = { ...(node.overrides ?? {}), ...value }
    } else if (key === 'crop' && isPlainObject(value)) {
      node.crop = { ...(node.crop ?? {}), ...value }
    } else node[key] = value
  }
  return node
}

/** @param {any} doc @param {string} nodeId @param {Record<string, any>} patch */
export function updateNode(doc, nodeId, patch) {
  const found = findNodeInDoc(doc, nodeId)
  if (!found) throw new CanvasError('$', `unknown node "${nodeId}"`)
  patchNodeFields(found.node, patch)
  return found.node
}

/** @param {any} doc @param {string} nodeId */
export function getNode(doc, nodeId) {
  return findNodeInDoc(doc, nodeId)?.node ?? null
}

/** @param {any} doc @param {string} nodeId */
export function parentOf(doc, nodeId) {
  return findNodeInDoc(doc, nodeId)?.parent ?? null
}

/**
 * Apply a list of agent edits in place, then validate the whole document.
 * Throws CanvasError with the offending op index on failure.
 * @param {any} doc
 * @param {any[]} ops
 * @param {{pageId?: string}} [options]
 */
export function applyOps(doc, ops, options = {}) {
  if (!Array.isArray(ops)) throw new CanvasError('$.ops', 'expected an array of operations')
  if (ops.length > 500) throw new CanvasError('$.ops', 'at most 500 operations per call')
  const changed = []
  ops.forEach((op, index) => {
    const path = `$.ops[${index}]`
    if (!isPlainObject(op)) throw new CanvasError(path, 'expected an operation object')
    try {
      switch (op.op) {
        case 'add': {
          const target = container(doc, op.parent ?? null, op.pageId ?? options.pageId)
          const node = ensureIds(structuredClone(op.node))
          insert(target.children, node, op.index)
          changed.push(node.id)
          break
        }
        case 'update': {
          if (typeof op.id !== 'string') throw new CanvasError(`${path}.id`, 'expected a node id')
          updateNode(doc, op.id, op.patch ?? {})
          changed.push(op.id)
          break
        }
        case 'remove': {
          if (typeof op.id !== 'string') throw new CanvasError(`${path}.id`, 'expected a node id')
          removeFromOwner(doc, op.id)
          changed.push(op.id)
          break
        }
        case 'move': {
          if (typeof op.id !== 'string') throw new CanvasError(`${path}.id`, 'expected a node id')
          const found = findNodeInDoc(doc, op.id)
          if (!found) throw new CanvasError(`${path}.id`, `unknown node "${op.id}"`)
          const node = structuredClone(found.node)
          removeFromOwner(doc, op.id)
          const target = container(doc, op.parent ?? null, op.pageId ?? options.pageId)
          insert(target.children, node, op.index)
          changed.push(op.id)
          break
        }
        case 'set': {
          if (!['styles', 'components', 'variantSets', 'fonts'].includes(op.key)) {
            throw new CanvasError(`${path}.key`, 'expected styles, components, variantSets or fonts')
          }
          doc[op.key] = structuredClone(op.value ?? [])
          break
        }
        case 'comment.add': {
          addComment(doc, {
            pageId: op.pageId ?? options.pageId,
            nodeId: op.nodeId,
            x: op.x,
            y: op.y,
            body: op.body,
            author: op.author,
          })
          break
        }
        case 'comment.reply': {
          replyComment(doc, op.commentId, op.body, op.author)
          break
        }
        case 'comment.resolve': {
          resolveComment(doc, op.commentId, op.resolved !== false)
          break
        }
        case 'comment.remove': {
          removeComment(doc, op.commentId)
          break
        }
        default:
          throw new CanvasError(`${path}.op`, `unknown operation "${String(op.op)}"`)
      }
    } catch (error) {
      if (error instanceof CanvasError) throw new CanvasError(path, error.message.replace(/^\$:\s*/, ''), error.code)
      throw error
    }
  })
  return changed
}

/** @param {any} doc */
export function normalizeInPlace(doc) {
  return normalizeDoc(doc)
}

/** @param {any} doc @param {{pageId?: string, nodeId?: string, x?: number, y?: number, body?: string, author?: string}} input */
export function addComment(doc, input) {
  const page = input.pageId ? pageOf(doc, input.pageId) : firstPage(doc)
  if (!page) throw new CanvasError('$.comments', 'document has no pages')
  if (typeof input.body !== 'string' || !input.body.trim()) throw new CanvasError('$.comments.body', 'comment body is required')
  if (input.nodeId != null && !findNodeInDoc(doc, input.nodeId)) {
    throw new CanvasError('$.comments.nodeId', `unknown node "${input.nodeId}"`)
  }
  const comment = {
    id: newId('c'),
    pageId: page.id,
    body: input.body,
    author: input.author === 'ai' ? 'ai' : 'user',
    createdAt: new Date().toISOString(),
    resolved: false,
    replies: [],
  }
  if (input.nodeId != null) comment.nodeId = input.nodeId
  if (input.x != null) comment.x = input.x
  if (input.y != null) comment.y = input.y
  doc.comments = Array.isArray(doc.comments) ? doc.comments : []
  doc.comments.push(comment)
  return comment
}

/** @param {any} doc @param {string} commentId @param {string} body @param {string} [author] */
export function replyComment(doc, commentId, body, author) {
  const comment = (doc.comments ?? []).find((entry) => entry.id === commentId)
  if (!comment) throw new CanvasError('$.comments', `unknown comment "${commentId}"`)
  if (typeof body !== 'string' || !body.trim()) throw new CanvasError('$.comments.body', 'reply body is required')
  const reply = {
    id: newId('r'),
    body,
    author: author === 'ai' ? 'ai' : 'user',
    createdAt: new Date().toISOString(),
  }
  comment.replies.push(reply)
  return reply
}

/** @param {any} doc @param {string} commentId @param {boolean} resolved */
export function resolveComment(doc, commentId, resolved = true) {
  const comment = (doc.comments ?? []).find((entry) => entry.id === commentId)
  if (!comment) throw new CanvasError('$.comments', `unknown comment "${commentId}"`)
  comment.resolved = resolved
  return comment
}

/** @param {any} doc @param {string} commentId */
export function removeComment(doc, commentId) {
  const index = (doc.comments ?? []).findIndex((entry) => entry.id === commentId)
  if (index === -1) throw new CanvasError('$.comments', `unknown comment "${commentId}"`)
  doc.comments.splice(index, 1)
}

/** @param {any} doc @param {string} pageId */
export function addPage(doc, name = 'New page') {
  const page = { id: newId('page'), name, background: null, children: [] }
  doc.pages.push(page)
  return page
}

/** @param {any} doc @param {string} pageId */
export function removePage(doc, pageId) {
  if (doc.pages.length <= 1) throw new CanvasError('$.pages', 'cannot remove the last page')
  const index = doc.pages.findIndex((page) => page.id === pageId)
  if (index === -1) throw new CanvasError('$.pages', `unknown page "${pageId}"`)
  doc.pages.splice(index, 1)
  doc.comments = (doc.comments ?? []).filter((comment) => comment.pageId !== pageId)
}

/**
 * Deep-clone a node tree for detaching an instance or duplicating content.
 * @param {any} node
 * @param {(sourceId: string) => string} [mapId]
 */
export function cloneTree(node, mapId = (sourceId) => newId('n')) {
  const clone = structuredClone(node)
  const remap = (current) => {
    current.id = mapId(current.id)
    if (Array.isArray(current.children)) current.children.forEach(remap)
    return current
  }
  return remap(clone)
}
