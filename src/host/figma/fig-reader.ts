/**
 * Native Figma `.fig` & Figma clipboard Kiwi binary decoder.
 * Decodes both `.fig` ZIP containers (canvas.fig + images/*) and raw `fig-kiwi` streams
 * (used by Figma clipboard `<!--(figma)...-->` payloads).
 */

import * as zlib from 'node:zlib'
import { unzipSync } from 'fflate'

export type Props = Record<string, unknown>

export function asProps(value: unknown): Props {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return Object.create(null)
  return value as Props
}

export const maxTransportBytes = 256 * 1024 * 1024
const maxCanvasBytes = 96 * 1024 * 1024
const maxSchemaBytes = 4 * 1024 * 1024
const maxValueCount = 16_000_000
const utf8 = new TextDecoder('utf-8', { fatal: true })

class Cursor {
  private offset = 0
  private readonly floatBytes = new DataView(new ArrayBuffer(4))
  constructor(private readonly data: Uint8Array) {}

  get remaining() {
    return this.data.length - this.offset
  }

  take(length: number) {
    if (length < 0 || length > this.data.length - this.offset) throw new Error('Truncated Figma archive')
    const slice = this.data.subarray(this.offset, this.offset + length)
    this.offset += length
    return slice
  }

  byte() {
    return this.take(1)[0]
  }

  uint() {
    let value = 0
    for (let shift = 0; shift <= 28; shift += 7) {
      const byte = this.byte()
      value += (byte & 127) * 2 ** shift
      if (byte < 128 && value <= 0xffffffff) return value
    }
    throw new Error('Invalid Figma integer')
  }

  int() {
    const value = this.uint()
    return value & 1 ? -(value + 1) / 2 : value / 2
  }

  wide(signed: boolean) {
    let value = 0n
    for (let shift = 0n; shift <= 63n; shift += 7n) {
      const byte = this.byte()
      value |= BigInt(byte & 127) << shift
      if (byte < 128) return (signed ? (value >> 1n) ^ -(value & 1n) : value).toString()
    }
    throw new Error('Invalid Figma 64-bit integer')
  }

  float() {
    const first = this.byte()
    if (first === 0) return 0
    const bits = first | (this.byte() << 8) | (this.byte() << 16) | (this.byte() << 24)
    this.floatBytes.setUint32(0, (bits << 23) | (bits >>> 9))
    return this.floatBytes.getFloat32(0)
  }

  string() {
    const end = this.data.indexOf(0, this.offset)
    if (end < 0 || end - this.offset > 2_000_000) throw new Error('Invalid Figma string')
    const bytes = this.take(end - this.offset)
    this.byte()
    return utf8.decode(bytes)
  }

  segment(limit: number) {
    const word = this.take(4)
    const length = new DataView(word.buffer, word.byteOffset, word.byteLength).getUint32(0, true)
    const compressed = this.take(length)
    if (compressed[0] !== 0x28 || compressed[1] !== 0xb5 || compressed[2] !== 0x2f || compressed[3] !== 0xfd) {
      return zlib.inflateRawSync(compressed, { maxOutputLength: limit })
    }
    if (typeof zlib.zstdDecompressSync !== 'function') {
      throw new Error('This Figma copy requires a Host runtime with Zstandard support')
    }
    return zlib.zstdDecompressSync(compressed, { maxOutputLength: limit })
  }
}

type Field = { id: number; name: string; type: number; array: boolean }
type SchemaType = { name: string; kind: number; fields: Map<number, Field> }

function decodeSchema(schemaData: Uint8Array) {
  const cursor = new Cursor(schemaData)
  const count = cursor.uint()
  if (count < 1 || count > 12_000) throw new Error('Unsupported Figma schema size')
  const types: SchemaType[] = []
  for (let i = 0; i < count; i++) {
    const name = cursor.string()
    const kind = cursor.byte()
    const fieldCount = cursor.uint()
    if (kind > 2 || fieldCount > 30_000) throw new Error('Invalid Figma schema declaration')
    const fields = new Map<number, Field>()
    for (let j = 0; j < fieldCount; j++) {
      const fieldName = cursor.string()
      const type = cursor.int()
      const array = Boolean(cursor.byte())
      const id = cursor.uint()
      if (fields.has(id)) throw new Error('Duplicate Figma schema field')
      fields.set(id, { id, name: fieldName, type, array })
    }
    types.push({ name, kind, fields })
  }
  return types
}

function decodeMessage(data: Uint8Array, types: SchemaType[]) {
  const cursor = new Cursor(data)
  let budget = maxValueCount
  const root = types.findIndex((type) => type.name === 'Message')
  function read(typeId: number, depth: number): unknown {
    if (--budget < 0 || depth > 100) throw new Error('Figma archive exceeds decode limits')
    switch (typeId) {
      case -1: return Boolean(cursor.byte())
      case -2: return cursor.byte()
      case -3: return cursor.int()
      case -4: return cursor.uint()
      case -5: return cursor.float()
      case -6: return cursor.string()
      case -7: return cursor.wide(true)
      case -8: return cursor.wide(false)
    }
    const type = types[typeId]
    if (!type) throw new Error('Unknown Figma schema type')
    if (type.kind === 0) return type.fields.get(cursor.uint())?.name ?? 'UNKNOWN'
    const output: Props = Object.create(null)
    function fieldValue(field: Field) {
      if (!field.array) return read(field.type, depth + 1)
      const length = cursor.uint()
      if (field.type === -2) return cursor.take(length)
      if (length > budget || length > 1_000_000) throw new Error('Figma array exceeds decode limits')
      return Array.from({ length }, () => read(field.type, depth + 1))
    }
    if (type.kind === 1) {
      for (const field of type.fields.values()) output[field.name] = fieldValue(field)
      return output
    }
    for (let id = cursor.uint(); id !== 0; id = cursor.uint()) {
      const field = type.fields.get(id)
      if (!field) throw new Error('Figma archive references an undeclared field')
      output[field.name] = fieldValue(field)
    }
    return output
  }
  if (root < 0) throw new Error('Missing Figma document message')
  return asProps(read(root, 0))
}

export type NativeFigma = {
  schemaVersion: number
  nodes: Props[]
  images: Map<string, Uint8Array>
  blobs?: Uint8Array[]
}

export function readNativeFig(bytes: Uint8Array): NativeFigma {
  if (bytes.length > maxTransportBytes) throw new Error('Figma transport exceeds 256 MiB')
  let canvas = bytes
  const images = new Map<string, Uint8Array>()
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    let total = 0
    const names = new Set<string>()
    const files = unzipSync(bytes, {
      filter: (entry) => {
        const wanted = entry.name === 'canvas.fig' || /^images\/[a-f\d]{40}(?:\.(?:png|jpe?g|gif|webp))?$/i.test(entry.name)
        if (!wanted) return false
        if (names.has(entry.name) || entry.originalSize > maxCanvasBytes || (total += entry.originalSize) > maxTransportBytes) {
          throw new Error('Figma ZIP exceeds archive limits or contains duplicate members')
        }
        names.add(entry.name)
        return true
      },
    })
    canvas = files['canvas.fig']
    if (!canvas) throw new Error('Missing canvas.fig in archive')
    for (const [name, image] of Object.entries(files)) {
      if (!name.startsWith('images/')) continue
      images.set(name.slice(7, 47).toLowerCase(), image)
    }
  }
  const cursor = new Cursor(canvas)
  const magic = utf8.decode(cursor.take(8))
  if (magic !== 'fig-kiwi' && magic !== 'fig-jam.') throw new Error('Not a native Figma Design copy')
  const version = cursor.take(4)
  const schemaVersion = new DataView(version.buffer, version.byteOffset, version.byteLength).getUint32(0, true)
  if (schemaVersion < 15) throw new Error('Unsupported Figma schema version')
  const schema = decodeSchema(cursor.segment(maxSchemaBytes))
  const message = decodeMessage(cursor.segment(maxCanvasBytes), schema)
  if (!Array.isArray(message.nodeChanges)) throw new Error('Figma archive has no node tree')
  const blobs = Array.isArray(message.blobs)
    ? message.blobs
        .map((b) => (b && typeof b === 'object' && 'bytes' in b && b.bytes instanceof Uint8Array ? b.bytes : null))
        .filter((b): b is Uint8Array => b !== null)
    : undefined
  return { schemaVersion, nodes: message.nodeChanges.map(asProps), images, blobs }
}

export function figmaId(value: unknown): string | undefined {
  if (!value) return undefined
  const guid = asProps(value)
  if (typeof guid.sessionID !== 'number' || typeof guid.localID !== 'number') return undefined
  return `${guid.sessionID}:${guid.localID}`
}
