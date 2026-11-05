/** Minimal icon set for the canvas chrome. Stroke icons use currentColor. */

import * as React from 'react'

const paths = {
  pointer: 'M4 4l7.07 17 2.51-7.39L21 11.07 4 4z',
  hand: 'M8 11V5.5a1.5 1.5 0 0 1 3 0V10m0 1V4.5a1.5 1.5 0 0 1 3 0V11m0 0V6.5a1.5 1.5 0 0 1 3 0V12m0 0V8.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-2.2a6 6 0 0 1-4.8-2.4L5 15.5a1.6 1.6 0 0 1 2.4-2.1L9 15',
  frame: 'M7 3v18M17 3v18M3 7h18M3 17h18',
  rect: 'M6 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
  ellipse: 'M12 4c4.4 0 8 3.6 8 8s-3.6 8-8 8-8-3.6-8-8 3.6-8 8-8z',
  line: 'M4 20L20 4',
  path: 'M4 18C8 4 14 4 20 16M4 18l3 2M20 16l-2 3',
  text: 'M5 5h14M12 5v13M8 18h8',
  image: 'M6 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM4 15l4.5-4.5L13 15l3-3 4 4M15.5 8.5h.01',
  comment: 'M6 5h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3V6a1 1 0 0 1 1-1z',
  layers: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5',
  panelLeft: 'M6 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM9 5v14',
  panelRight: 'M6 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM15 5v14',
  component: 'M12 3l9 9-9 9-9-9 9-9zM12 8l4 4-4 4-4-4 4-4z',
  styles: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z',
  fonts: 'M5 20L12 4l7 16M8 14h8',
  undo: 'M9 7H5V3M5 7a8 8 0 1 1-1 9',
  redo: 'M15 7h4V3M19 7a8 8 0 1 0 1 9',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  eyeOff: 'M3 3l18 18M10.6 6.3A10 10 0 0 1 12 6c6.5 0 10 7 10 7a17 17 0 0 1-3 4M6.2 6.2C3.5 8.2 2 12 2 12s3.5 7 10 7a10 10 0 0 0 4-.8',
  lock: 'M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3',
  unlock: 'M6 11h12v10H6zM8 11V8a4 4 0 0 1 7.3-2.2',
  chevronDown: 'M6 9l6 6 6-6',
  chevronRight: 'M9 6l6 6-6 6',
  alignLeft: 'M4 4v16M8 7h11v4H8zM8 15h7v4H8z',
  alignCenterX: 'M12 3v18M6 7h12v4H6zM8 15h8v4H8z',
  alignRight: 'M20 4v16M5 7h11v4H5zM9 15h7v4H9z',
  alignTop: 'M4 4h16M7 8h4v11H7zM15 8h4v7h-4z',
  alignCenterY: 'M3 12h18M7 6h4v12H7zM15 8h4v8h-4z',
  alignBottom: 'M4 20h16M7 5h4v11H7zM15 9h4v7h-4z',
  distributeX: 'M3 4v16M21 4v16M9 7h6v10H9z',
  distributeY: 'M4 3h16M4 21h16M7 9h10v6H7z',
  group: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  ungroup: 'M4 4h6v6H4zM14 14h6v6h-6zM15 4h5v5M4 15v5h5',
  front: 'M4 8h10v10H4zM10 4h10v10',
  back: 'M10 10h10v10H10zM4 4h10v10',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M4 12l5 5L20 6',
  upload: 'M12 16V4M7 9l5-5 5 5M4 17v3h16v-3',
  download: 'M12 4v12M7 11l5 5 5-5M4 20h16',
  copy: 'M9 8h11v11H9zM6 5h11v3M6 5v11h3',
  send: 'M4 12l16-8-6 16-2.5-6.5L4 12z',
  pencil: 'M4 20h4L20 8l-4-4L4 16v4zM14 6l4 4',
  zoomIn: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM16 16l5 5M8 11h6M11 8v6',
  zoomOut: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM16 16l5 5M8 11h6',
  fit: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  reset: 'M4 10a8 8 0 1 1 2.3 6.3M4 4v6h6',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  sliders: 'M4 7h16M4 12h16M4 17h16M9 5v4M15 10v4M7 15v4',
  template: 'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM4 9h16M9 9v10',
  play: 'M7 4l13 8-13 8V4z',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z',
  eyeSmall: 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
}

export function Icon({ name, size = 16, style, className }: any) {
  const path = paths[name]
  if (!path) return null
  const filled = name === 'pointer'
  return React.createElement(
    'svg',
    {
      viewBox: '0 0 24 24',
      width: size,
      height: size,
      fill: filled ? 'currentColor' : 'none',
      stroke: filled ? 'none' : 'currentColor',
      strokeWidth: filled ? 0 : 1.5,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': true,
      style,
      className,
    },
    React.createElement('path', { d: path }),
  )
}

export const ICON_NAMES = Object.keys(paths)
