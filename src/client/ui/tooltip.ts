/**
 * Global hover labels for elements that carry a data-tip attribute.
 *
 * A single delegated listener draws one fixed-position tooltip on the body, so
 * labels are never clipped by the toolbar's scroll container.
 */

let tipElement = null
let listeners = 0

function ensureTip() {
  if (tipElement) return tipElement
  tipElement = document.createElement('div')
  tipElement.className = 'dshc-tooltip'
  tipElement.style.display = 'none'
  document.body.appendChild(tipElement)
  return tipElement
}

function hideTip() {
  if (tipElement) tipElement.style.display = 'none'
}

/** @returns {() => void} detach */
export function attachGlobalTooltips() {
  listeners += 1
  const onOver = (event) => {
    const target = event.target?.closest?.('[data-tip]')
    if (!target || !target.closest('.dshc-root')) {
      hideTip()
      return
    }
    const label = target.getAttribute('data-tip')
    if (!label) return
    const rect = target.getBoundingClientRect()
    const node = ensureTip()
    node.textContent = label
    node.style.display = 'block'
    node.style.left = `${Math.round(rect.left + rect.width / 2)}px`
    node.style.top = `${Math.round(rect.bottom + 7)}px`
  }
  const onOut = (event) => {
    if (event.target?.closest?.('[data-tip]')) hideTip()
  }
  document.addEventListener('pointerover', onOver, true)
  document.addEventListener('pointerout', onOut, true)
  document.addEventListener('pointerdown', hideTip, true)
  window.addEventListener('scroll', hideTip, true)
  return () => {
    listeners -= 1
    document.removeEventListener('pointerover', onOver, true)
    document.removeEventListener('pointerout', onOut, true)
    document.removeEventListener('pointerdown', hideTip, true)
    window.removeEventListener('scroll', hideTip, true)
    if (listeners <= 0) {
      tipElement?.remove()
      tipElement = null
      listeners = 0
    }
  }
}
