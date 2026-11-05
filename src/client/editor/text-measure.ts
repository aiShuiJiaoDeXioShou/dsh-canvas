/**
 * dsh.canvas@1 — text measurement for the layout engine.
 *
 * `createTextMeasurer()` returns a `MeasureText` function:
 *
 *   MeasureText(request: {
 *     text: string,
 *     font: { family, weight, style, size, lineHeight, letterSpacing },
 *     maxWidth: number,
 *     autoHeight?: boolean,
 *   }) => { lines: { text, width }[], width, height }
 *
 * Browser: a canvas 2d `measureText` context. The bundle must stay usable in
 * Node (tests, exporter), so `document` is only ever reached through
 * `globalThis` and a missing canvas falls back to a deterministic per-character
 * approximation (CJK 1em, everything else 0.55em).
 *
 * Font loading: when `document.fonts` exists the measuring function invalidates
 * its cache on `loadingdone` / `loadingerror` and while `document.fonts.status`
 * is `'loading'`, so the upper layer can rebuild the scene after
 * `document.fonts.load(...)` and get fresh metrics.
 */

const DEFAULT_FONT = Object.freeze({
  family: 'system-ui',
  weight: 400,
  style: 'normal',
  size: 14,
  lineHeight: 1.4,
  letterSpacing: 0,
})

const MAX_CACHE_ENTRIES = 4000
const EPSILON = 1e-6
const WORD_JOINER = '\u2060'

/** CJK / full-width ranges that break per character instead of per word. */
const CJK_CHAR_RE =
  /[\u2E80-\u2FFF\u3000-\u303F\u3040-\u30FF\u3100-\u31FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFFEF\u{1F300}-\u{1FAFF}]/u

const GENERIC_FAMILIES = new Set([
  'system-ui',
  'ui-sans-serif',
  'ui-serif',
  'ui-monospace',
  'ui-rounded',
  'sans-serif',
  'serif',
  'monospace',
  'cursive',
  'fantasy',
  'math',
  'emoji',
  'fangsong',
  '-apple-system',
  'BlinkMacSystemFont',
  'Segoe UI',
])

/**
 * Create a `MeasureText` function. Safe to call in any environment.
 * Extra members on the returned function (not part of `MeasureText` itself):
 *   clearCache()  – drop cached metrics (call after fonts load)
 *   fontEpoch()   – increments every time the cache is invalidated
 *   fontsReady()  – Promise that resolves when `document.fonts` settled
 *   isCanvasBacked() – true when real canvas metrics are used
 */
export function createTextMeasurer() {
  /** @type {Map<string, {lines: {text: string, width: number}[], width: number, height: number}>} */
  const cache = new Map()
  let epoch = 0
  /** @type {CanvasRenderingContext2D | null} */
  let canvasContext = null
  let canvasTried = false
  const document = browserDocument()
  const fonts = document && document.fonts ? document.fonts : null
  let fontsStatus = fonts && typeof fonts.status === 'string' ? fonts.status : 'loaded'

  const invalidate = () => {
    cache.clear()
    epoch += 1
  }

  if (fonts) {
    try {
      if (typeof fonts.addEventListener === 'function') {
        fonts.addEventListener('loadingdone', invalidate)
        fonts.addEventListener('loadingerror', invalidate)
      } else if (fonts.ready && typeof fonts.ready.then === 'function') {
        fonts.ready.then(invalidate, () => undefined)
      }
    } catch {
      // Some embedded webviews expose a partial FontFaceSet; ignore.
    }
  }

  /** Detect a loading → loaded transition even before the event fires. */
  function checkFontStatus() {
    if (!fonts || typeof fonts.status !== 'string') return
    if (fonts.status === fontsStatus) return
    fontsStatus = fonts.status
    if (fontsStatus === 'loaded') invalidate()
  }

  function getContext() {
    if (canvasTried) return canvasContext
    canvasTried = true
    const doc = browserDocument()
    if (!doc) return null
    try {
      const canvas = doc.createElement('canvas')
      const context = canvas && typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null
      if (context && typeof context.measureText === 'function') canvasContext = context
    } catch {
      canvasContext = null
    }
    return canvasContext
  }

  /**
   * @param {{text?: string, font?: object, maxWidth?: number, autoHeight?: boolean}} request
   */
  function measure(request) {
    checkFontStatus()
    const text = request && typeof request.text === 'string' ? request.text : ''
    const font = normalizeFont(request && request.font)
    const rawMaxWidth = request ? request.maxWidth : Infinity
    const maxWidth = typeof rawMaxWidth === 'number' && rawMaxWidth > 0 ? rawMaxWidth : Infinity
    const key = `${font.family}|${font.weight}|${font.style}|${font.size}|${font.lineHeight}|${font.letterSpacing}|${maxWidth === Infinity ? 'inf' : maxWidth}|${text.length}|${text}`
    const cached = cache.get(key)
    if (cached) return cached
    const context = getContext()
    const result = context
      ? measureWithContext(context, text, font, maxWidth)
      : measureWithFallback(text, font, maxWidth)
    // Do not cache while webfonts are still loading: metrics would go stale.
    if (!fonts || fonts.status !== 'loading') {
      if (cache.size >= MAX_CACHE_ENTRIES) cache.clear()
      cache.set(key, result)
    }
    return result
  }

  measure.clearCache = invalidate
  measure.fontEpoch = () => epoch
  measure.fontsReady = () => (fonts && fonts.ready ? fonts.ready : Promise.resolve())
  measure.isCanvasBacked = () => Boolean(getContext())
  return measure
}

/** @param {unknown} value */
function normalizeFont(value) {
  const source = value && typeof value === 'object' ? value : {}
  return {
    family:
      typeof source.family === 'string' && source.family.trim() ? source.family.trim() : DEFAULT_FONT.family,
    weight: finiteOr(source.weight, DEFAULT_FONT.weight),
    style: source.style === 'italic' ? 'italic' : 'normal',
    size: positiveOr(source.size, DEFAULT_FONT.size),
    lineHeight: positiveOr(source.lineHeight, DEFAULT_FONT.lineHeight),
    letterSpacing: finiteOr(source.letterSpacing, DEFAULT_FONT.letterSpacing),
  }
}

/** @param {unknown} value @param {number} fallback */
function finiteOr(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/** @param {unknown} value @param {number} fallback */
function positiveOr(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback
}

function browserDocument() {
  try {
    const global = typeof globalThis !== 'undefined' ? globalThis : undefined
    const document = global ? global.document : null
    return document && typeof document.createElement === 'function' ? document : null
  } catch {
    return null
  }
}

/**
 * @param {CanvasRenderingContext2D} context
 * @param {string} text
 * @param {ReturnType<typeof normalizeFont>} font
 * @param {number} maxWidth
 */
function measureWithContext(context, text, font, maxWidth) {
  try {
    context.font = cssFont(font)
  } catch {
    // Keep whatever font was set before; canvas metrics still work.
  }
  /** @param {string} value */
  const measureWidth = (value) => {
    try {
      const metrics = context.measureText(value)
      return metrics && Number.isFinite(metrics.width) ? metrics.width : 0
    } catch {
      return 0
    }
  }
  return wrapText(text, font, maxWidth, measureWidth)
}

/**
 * @param {string} text
 * @param {ReturnType<typeof normalizeFont>} font
 * @param {number} maxWidth
 */
function measureWithFallback(text, font, maxWidth) {
  /** @param {string} value */
  const measureWidth = (value) => {
    let width = 0
    for (const char of value) width += CJK_CHAR_RE.test(char) ? font.size : font.size * 0.55
    return width
  }
  return wrapText(text, font, maxWidth, measureWidth)
}

/** @param {ReturnType<typeof normalizeFont>} font */
function cssFont(font) {
  const style = font.style === 'italic' ? 'italic ' : ''
  const family = cssFamily(font.family)
  return `${style}${font.weight} ${font.size}px ${family}`
}

/** @param {string} family */
function cssFamily(family) {
  if (family.includes(',')) return family
  if (GENERIC_FAMILIES.has(family)) return family
  if (/^[A-Za-z][A-Za-z0-9_-]*$/.test(family)) return family
  return JSON.stringify(family)
}

/**
 * Greedy wrap. Breaks on whitespace and between CJK characters; a single token
 * wider than `maxWidth` is broken per character.
 *
 * @param {string} text
 * @param {ReturnType<typeof normalizeFont>} font
 * @param {number} maxWidth
 * @param {(value: string) => number} measureWidth
 */
function wrapText(text, font, maxWidth, measureWidth) {
  const letterSpacing = font.letterSpacing
  const lineHeightPx = font.size * font.lineHeight
  const wrap = Number.isFinite(maxWidth) && maxWidth > 0
  /** @param {string} value */
  const widthOf = (value) => measureWidth(value) + letterSpacing * codePointLength(value)
  /** @type {{text: string, width: number}[]} */
  const lines = []

  /** @param {string} rawLine */
  const emit = (rawLine) => {
    const trimmed = rawLine.replace(/[ \t\u00A0]+$/u, '')
    lines.push({ text: trimmed, width: Math.max(0, widthOf(trimmed)) })
  }

  const paragraphs = String(text).replace(/\r\n?/g, '\n').replace(/\t/g, '    ').split('\n')
  for (const paragraph of paragraphs) {
    /** @type {string[]} */
    let lineTokens = []
    let lineWidth = 0
    const flush = () => {
      emit(lineTokens.join(''))
      lineTokens = []
      lineWidth = 0
    }
    /** @param {string} token */
    const placeToken = (token) => {
      const tokenWidth = widthOf(token)
      if (!wrap) {
        lineTokens.push(token)
        lineWidth += tokenWidth
        return
      }
      if (lineWidth + tokenWidth <= maxWidth + EPSILON) {
        lineTokens.push(token)
        lineWidth += tokenWidth
        return
      }
      if (lineTokens.length > 0) {
        flush()
        placeToken(token)
        return
      }
      // Token alone does not fit: break it between characters.
      let buffer = ''
      let bufferWidth = 0
      for (const char of token) {
        const charWidth = widthOf(char)
        if (buffer && bufferWidth + charWidth > maxWidth + EPSILON) {
          emit(buffer)
          buffer = char
          bufferWidth = charWidth
        } else {
          buffer += char
          bufferWidth += charWidth
        }
      }
      if (buffer) {
        lineTokens.push(buffer)
        lineWidth = bufferWidth
      }
    }
    for (const token of tokenizeParagraph(paragraph)) {
      // Never start a wrapped line with whitespace.
      if (lineTokens.length === 0 && /^[ \t\u00A0]+$/u.test(token)) continue
      placeToken(token)
    }
    flush()
  }

  let width = 0
  for (const line of lines) width = Math.max(width, line.width)
  return {
    lines,
    width,
    height: lines.length * lineHeightPx,
  }
}

/** @param {string} paragraph @returns {string[]} */
function tokenizeParagraph(paragraph) {
  /** @type {string[]} */
  const tokens = []
  let word = ''
  for (const char of paragraph) {
    if (char === WORD_JOINER) continue
    if (CJK_CHAR_RE.test(char)) {
      if (word) {
        tokens.push(word)
        word = ''
      }
      tokens.push(char)
    } else if (char === ' ' || char === '\u00A0') {
      if (word) {
        tokens.push(word)
        word = ''
      }
      tokens.push(char)
    } else {
      word += char
    }
  }
  if (word) tokens.push(word)
  return tokens
}

/** @param {string} value */
function codePointLength(value) {
  let length = 0
  for (const _char of value) length += 1
  return length
}
