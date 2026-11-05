/** SVG path viewBox in local path coordinates. */
export interface PathViewBox {
  x: number
  y: number
  width: number
  height: number
}

export interface PathBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export type PathFillRule = 'nonzero' | 'evenodd'

export interface ParsedPath {
  bounds: PathBounds
  commands: number
}

export class PathDataError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PathDataError'
  }
}
