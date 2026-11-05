/** Snapshot undo/redo. Documents are small JSON trees, so full snapshots are
 * simpler and safer than a command log; drags commit once on pointer-up. */

export interface History extends Record<string, any> {}

export class History {
  constructor(limit = 100) {
    this.limit = limit
    this.entries = []
    this.index = -1
  }

  reset(doc) {
    this.entries = [JSON.stringify(doc)]
    this.index = 0
  }

  /** Record the current document after a committed change. */
  commit(doc) {
    const snapshot = JSON.stringify(doc)
    if (this.index >= 0 && this.entries[this.index] === snapshot) return false
    this.entries = this.entries.slice(0, this.index + 1)
    this.entries.push(snapshot)
    if (this.entries.length > this.limit) this.entries.shift()
    this.index = this.entries.length - 1
    return true
  }

  canUndo() {
    return this.index > 0
  }

  canRedo() {
    return this.index >= 0 && this.index < this.entries.length - 1
  }

  undo() {
    if (!this.canUndo()) return null
    this.index -= 1
    return JSON.parse(this.entries[this.index])
  }

  redo() {
    if (!this.canRedo()) return null
    this.index += 1
    return JSON.parse(this.entries[this.index])
  }

  /** Replace the current entry, e.g. after an external refresh. */
  replaceCurrent(doc) {
    if (this.index < 0) {
      this.reset(doc)
      return
    }
    this.entries[this.index] = JSON.stringify(doc)
  }
}
