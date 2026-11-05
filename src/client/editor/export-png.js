/** Rasterise an exported SVG through an <img> and a canvas. */

export function svgToPng(svg, scale = 2) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const image = new Image()
    image.onload = () => {
      try {
        const width = Math.max(1, Math.round((image.naturalWidth || 1) * scale))
        const height = Math.max(1, Math.round((image.naturalHeight || 1) * scale))
        if (width * height > 64_000_000) throw new Error('导出尺寸过大')
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const context = canvas.getContext('2d')
        context.scale(scale, scale)
        context.drawImage(image, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      } catch (error) {
        reject(error)
      } finally {
        URL.revokeObjectURL(url)
      }
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('SVG 栅格化失败'))
    }
    image.src = url
  })
}
