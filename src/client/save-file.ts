/**
 * Save a file through the platform picker when the browser exposes one, and
 * fall back to a download link otherwise. Nothing is written to the workspace.
 */

/** @param {Blob|string} data @param {string} filename @param {string} mime */
export async function saveFile(data, filename, mime) {
  const blob = typeof data === 'string' ? new Blob([data], { type: mime }) : data
  const picker = globalThis.showSaveFilePicker
  if (typeof picker === 'function') {
    try {
      const handle = await picker({ suggestedName: filename })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return { saved: true, cancelled: false, method: 'picker', filename }
    } catch (error) {
      const cancelled = error instanceof Error && error.name === 'AbortError'
      if (cancelled) return { saved: false, cancelled: true, method: 'picker', filename }
      // Permission or policy failures fall through to a plain download.
    }
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
  return { saved: true, cancelled: false, method: 'download', filename }
}
