import { PathDataError, type ParsedPath } from './types.js'

const COMMAND_RE = /[MmZzLlHhVvCcSsQqTtAa]/
const NUMBER_RE = /^[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/
const ALLOWED_RE = /^[MmZzLlHhVvCcSsQqTtAa0-9eE+.,\-\s]*$/

const ARITY: Record<string, number> = {
  M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0,
}

interface Token {
  command?: string
  value?: number
}

function tokenize(data: string): Token[] {
  if (!ALLOWED_RE.test(data)) throw new PathDataError('path data contains unsupported characters')
  const tokens: Token[] = []
  let index = 0
  while (index < data.length) {
    const char = data[index]!
    if (char === ' ' || char === '\n' || char === '\r' || char === '\t' || char === ',') {
      index += 1
      continue
    }
    if (COMMAND_RE.test(char)) {
      tokens.push({ command: char })
      index += 1
      continue
    }
    const rest = data.slice(index)
    const match = NUMBER_RE.exec(rest)
    if (!match) throw new PathDataError(`invalid path data near "${rest.slice(0, 12)}"`)
    const value = Number(match[0])
    if (!Number.isFinite(value)) throw new PathDataError('path data contains a non-finite number')
    tokens.push({ value })
    index += match[0].length
  }
  return tokens
}

/** Parse and validate SVG path data; computes a conservative bounds box. */
export function parsePathData(data: unknown): ParsedPath {
  if (typeof data !== 'string' || data.trim() === '') throw new PathDataError('path d must be a non-empty string')
  if (data.length > 100_000) throw new PathDataError('path d exceeds 100000 characters')
  const tokens = tokenize(data)
  if (!tokens.length) throw new PathDataError('path d is empty')

  let index = 0
  let command = ''
  let currentX = 0
  let currentY = 0
  let startX = 0
  let startY = 0
  let lastControlX: number | null = null
  let lastControlY: number | null = null
  let boundsMinX = Infinity
  let boundsMinY = Infinity
  let boundsMaxX = -Infinity
  let boundsMaxY = -Infinity
  let commands = 0

  const include = (x: number, y: number) => {
    boundsMinX = Math.min(boundsMinX, x)
    boundsMinY = Math.min(boundsMinY, y)
    boundsMaxX = Math.max(boundsMaxX, x)
    boundsMaxY = Math.max(boundsMaxY, y)
  }
  include(0, 0)

  const number = () => {
    const token = tokens[index]
    if (!token || token.value === undefined) throw new PathDataError(`path command ${command} is missing parameters`)
    index += 1
    return token.value
  }

  while (index < tokens.length) {
    const token = tokens[index]!
    if (token.command) {
      command = token.command
      index += 1
    } else if (!command) {
      throw new PathDataError('path data must begin with a command')
    }
    const upper = command.toUpperCase()
    const relative = command !== upper
    const arity = ARITY[upper]
    if (arity === undefined) throw new PathDataError(`unsupported path command ${command}`)
    if (arity === 0) {
      currentX = startX
      currentY = startY
      lastControlX = null
      lastControlY = null
      commands += 1
      continue
    }
    if (tokens[index]?.command) throw new PathDataError(`path command ${command} is missing parameters`)
    commands += 1

    const first = number()
    const x = relative ? currentX + first : first
    if (upper === 'H') {
      currentX = x
      include(currentX, currentY)
      lastControlX = null
      lastControlY = null
      continue
    }
    if (upper === 'V') {
      currentY = relative ? currentY + first : first
      include(currentX, currentY)
      lastControlX = null
      lastControlY = null
      continue
    }
    const y = relative ? currentY + number() : number()
    switch (upper) {
      case 'M':
        currentX = x
        currentY = y
        startX = x
        startY = y
        include(x, y)
        lastControlX = null
        lastControlY = null
        command = relative ? 'l' : 'L'
        break
      case 'L':
        currentX = x
        currentY = y
        include(x, y)
        lastControlX = null
        lastControlY = null
        break
      case 'C': {
        const c1x = x
        const c1y = y
        const c2x = relative ? currentX + number() : number()
        const c2y = relative ? currentY + number() : number()
        const ex = relative ? currentX + number() : number()
        const ey = relative ? currentY + number() : number()
        include(c1x, c1y); include(c2x, c2y); include(ex, ey)
        currentX = ex; currentY = ey
        lastControlX = c2x; lastControlY = c2y
        break
      }
      case 'S': {
        const c2x = x
        const c2y = y
        const ex = relative ? currentX + number() : number()
        const ey = relative ? currentY + number() : number()
        include(c2x, c2y); include(ex, ey)
        currentX = ex; currentY = ey
        lastControlX = c2x; lastControlY = c2y
        break
      }
      case 'Q': {
        const qx = x
        const qy = y
        const ex = relative ? currentX + number() : number()
        const ey = relative ? currentY + number() : number()
        include(qx, qy); include(ex, ey)
        currentX = ex; currentY = ey
        lastControlX = qx; lastControlY = qy
        break
      }
      case 'T': {
        const qx = x
        const qy = y
        include(qx, qy)
        currentX = qx; currentY = qy
        lastControlX = qx; lastControlY = qy
        break
      }
      case 'A': {
        const rx = x
        const ry = y
        const rotation = number()
        const largeArc = number()
        const sweep = number()
        const ex = relative ? currentX + number() : number()
        const ey = relative ? currentY + number() : number()
        if (rx < 0 || ry < 0) throw new PathDataError('path arc radius must be non-negative')
        if (largeArc !== 0 && largeArc !== 1) throw new PathDataError('path arc large-arc flag must be 0 or 1')
        if (sweep !== 0 && sweep !== 1) throw new PathDataError('path arc sweep flag must be 0 or 1')
        void rotation
        include(ex, ey)
        currentX = ex; currentY = ey
        lastControlX = null; lastControlY = null
        break
      }
      default:
        throw new PathDataError(`unsupported path command ${command}`)
    }
    void lastControlX
    void lastControlY
  }

  if (commands === 0) throw new PathDataError('path d has no commands')
  if (!Number.isFinite(boundsMinX)) throw new PathDataError('path d has no finite bounds')
  return { bounds: { minX: boundsMinX, minY: boundsMinY, maxX: boundsMaxX, maxY: boundsMaxY }, commands }
}
