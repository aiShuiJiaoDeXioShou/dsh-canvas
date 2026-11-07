/**
 * @local/dsh-canvas — browser half.
 *
 * Places the canvas in the right Sidebar's guide + tab strip (the position the
 * product screenshot points at). If that extension seat is unavailable, it
 * falls back to an expandable inline panel above the composer, using only the
 * catalogued public slot surface.
 */

import * as React from 'react'
import canvasIcon from '../../icon.png'

import { CanvasPanel, CanvasErrorBoundary } from './CanvasPanel.jsx'
import { reportDiag } from './api.js'
import { requestCanvasFocus } from './focus.js'
import { dismissCanvasSelection, onCanvasSelection, readCanvasSelection } from './selection-bridge.js'
import { canvasLinkRule } from './editor/canvas-link.js'

const ID = '@local/dsh-canvas'
const NS = 'dsh-canvas'

const zh = {
  'tab.title': 'Drafi',
  'guide.title': 'Drafi',
  'guide.description': 'AI 原生设计画布：可视化设计 UI 稿，选区插入对话，AI 可通过 canvas/*.canvas.json 生成与修改。',
  'dock.open': '打开 Drafi',
  'dock.close': '收起 Drafi',
}

const en = {
  'tab.title': 'Drafi',
  'guide.title': 'Drafi',
  'guide.description': 'An AI-native design canvas: design UI mockups, send selections to the composer, and let the AI edit canvas/*.canvas.json.',
  'dock.open': 'Open Drafi',
  'dock.close': 'Hide Drafi',
}

function CanvasGlyph({ size = 18 }) {
  return React.createElement('img', {
    src: canvasIcon,
    width: size,
    height: size,
    alt: '',
    'aria-hidden': true,
    draggable: false,
    style: { display: 'block', flexShrink: 0, objectFit: 'contain' },
  })
}

function CanvasBody(props) {
  return React.createElement(
    CanvasErrorBoundary,
    null,
    React.createElement(CanvasPanel, {
      sessionId: props.sessionId,
      inputActions: props.inputActions,
    }),
  )
}

function InlineDock(props) {
  const [open, setOpen] = React.useState(false)
  return React.createElement(
    'div',
    {
      style: {
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 10,
        background: 'var(--dsw-alias-bg-layer-1)',
        overflow: 'hidden',
        margin: '4px 0',
      },
      'data-dsh-canvas': 'dock',
    },
    React.createElement(
      'button',
      {
        type: 'button',
        onClick: () => setOpen((value) => !value),
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          padding: '7px 10px',
          border: 'none',
          background: 'transparent',
          color: 'var(--dsw-alias-label-primary)',
          cursor: 'pointer',
          font: 'inherit',
        },
      },
      React.createElement(CanvasGlyph, { size: 15 }),
      React.createElement('span', { style: { fontWeight: 600 } }, props.title ?? 'Drafi'),
      React.createElement('span', { style: { marginLeft: 'auto', color: 'var(--dsw-alias-label-secondary)', fontSize: 11 } }, open ? props.closeLabel : props.openLabel),
    ),
    open &&
      React.createElement(
        'div',
        { style: { height: '60vh', minHeight: 320, borderTop: '1px solid var(--dsw-alias-border-l1)' } },
        React.createElement(CanvasPanel, { sessionId: props.sessionId, inputActions: props.inputActions }),
      ),
  )
}

function CanvasReferenceChip({ node, raw, interactive, openCanvas }) {
  const data = node?.data ?? {}
  const activate = () => {
    if (!interactive || typeof openCanvas !== 'function') return
    openCanvas(data)
  }
  return React.createElement(
    'span',
    {
      role: interactive ? 'button' : undefined,
      tabIndex: interactive ? 0 : undefined,
      title: raw ?? data.label ?? '画布',
      onClick: activate,
      onKeyDown: (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          activate()
        }
      },
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        margin: '0 2px',
        padding: '1px 6px',
        borderRadius: 5,
        border: '1px solid var(--dsw-alias-border-l1)',
        background: 'color-mix(in srgb, #4D6BFE 10%, transparent)',
        color: 'var(--dsw-alias-label-primary)',
        fontSize: '0.94em',
        lineHeight: 1.5,
        verticalAlign: 'baseline',
        cursor: interactive ? 'pointer' : 'default',
      },
    },
    React.createElement(CanvasGlyph, { size: 13 }),
    React.createElement('span', null, data.label ?? '画布'),
  )
}

function registerCanvasTextReference(navCtx, nav) {
  navCtx.inject(['uiConversation'], (convCtx) => {
    convCtx.effect(() => convCtx.uiConversation.userText.register(canvasLinkRule), 'dsh-canvas: user text rule')
    try {
      convCtx.effect(
        () =>
          convCtx.slots.inject('conversation.user.text.node', () =>
            convCtx.slots.register(
              {
                name: 'conversation.user.text.node',
                key: 'dsh-canvas',
                priority: 120,
                inject: (sessionId) => ({
                  openCanvas: (data) => {
                    try {
                      nav.openTab('canvas')
                    } catch (error) {
                      console.warn('[dsh-canvas] openTab from reference failed', error)
                    }
                    requestCanvasFocus({ ...data, sessionId })
                  },
                }),
              },
              CanvasReferenceChip,
            ),
          ),
        'dsh-canvas: user text chip',
      )
    } catch (error) {
      console.warn('[dsh-canvas] could not register the in-chat canvas link renderer', error)
      reportDiag({ phase: 'user-text-chip-failed', message: String(error instanceof Error ? error.message : error) })
    }
  })
}

function CanvasSelectionDock({ sessionId, nav }) {
  const [selection, setSelection] = React.useState(() => readCanvasSelection(sessionId))
  React.useEffect(() => {
    setSelection(readCanvasSelection(sessionId))
    return onCanvasSelection(() => setSelection(readCanvasSelection(sessionId)))
  }, [sessionId])
  if (!selection) return null
  const locate = () => {
    try {
      nav.openTab('canvas')
    } catch (error) {
      console.warn('[dsh-canvas] openTab from selection dock failed', error)
    }
    requestCanvasFocus({ ...selection, sessionId })
  }
  // The dock is a full-width row above the composer card, so the chip needs the
  // same centred width as an official dock item to line up with the input box.
  const clearance = 'var(--dsh-composer-side-clearance, 16px)'
  const inset = 'var(--dsh-composer-dock-inset, 8px)'
  const cardWidth = 'var(--dsh-composer-card-max-width, 780px)'
  return React.createElement(
    'div',
    {
      style: {
        boxSizing: 'border-box',
        display: 'flex',
        justifyContent: 'flex-start',
        width: `calc(100% - ${clearance} * 2 - ${inset} * 2)`,
        maxWidth: `calc(${cardWidth} - ${inset} * 2)`,
        margin: '0 auto',
        padding: `0 ${inset}`,
        flex: 'none',
      },
    },
    React.createElement(
      'div',
      {
        style: {
          display: 'inline-flex',
          minWidth: 0,
          alignItems: 'center',
          gap: 6,
          maxWidth: '100%',
          padding: '2px 8px',
          border: '1px solid color-mix(in srgb, #4D6BFE 16%, transparent)',
          borderRadius: 999,
          background: 'color-mix(in srgb, #4D6BFE 7%, transparent)',
          color: 'var(--dsw-alias-label-primary)',
          font: '12px/1.5 var(--dsw-font-family, system-ui, sans-serif)',
        },
      },
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: locate,
          title: '打开画布并定位到该节点',
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            minWidth: 0,
            padding: 0,
            border: 'none',
            background: 'transparent',
            color: '#4D6BFE',
            cursor: 'pointer',
            font: 'inherit',
          },
        },
        React.createElement(CanvasGlyph, { size: 14 }),
        React.createElement(
          'span',
          { style: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
          `在画布中定位：${selection.label}`,
        ),
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          title: '关闭',
          'aria-label': '关闭',
          onClick: () => dismissCanvasSelection(sessionId),
          style: { border: 'none', background: 'transparent', color: 'var(--dsw-alias-label-secondary)', cursor: 'pointer', font: 'inherit' },
        },
        '×',
      ),
    ),
  )
}

export const name = 'dsh-canvas'

export const inject = ['slots', 'locale']

export function apply(ctx) {
  reportDiag({ phase: 'client-apply', href: typeof location === 'undefined' ? null : location.href })
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      reportDiag({ phase: 'window-error', message: String(event.message ?? ''), stack: String(event.error?.stack ?? '') })
    })
    window.addEventListener('unhandledrejection', (event) => {
      reportDiag({ phase: 'unhandled-rejection', message: String(event.reason?.message ?? event.reason ?? '') })
    })
  }
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-canvas: locale')
  const t = ctx.locale.bind(NS)

  const registerTab = (tabs, hostCtx) => {
    hostCtx.effect(
      () =>
        tabs.register({
          id: ID,
          kind: 'canvas',
          priority: 'extension',
          title: () => t('tab.title'),
          guide: [
            {
              id: 'canvas',
              order: 30,
              title: () => t('guide.title'),
              description: () => t('guide.description'),
              icon: CanvasGlyph,
            },
          ],
          keepMounted: true,
        }),
      'dsh-canvas: tab type',
    )
    hostCtx.effect(
      () =>
        hostCtx.slots.inject('sidebar.right.pane.tab', () =>
          hostCtx.slots.register({ name: 'sidebar.right.pane.tab', key: ID, locale: NS }, CanvasBody),
        ),
      'dsh-canvas: tab body',
    )
    hostCtx.inject(['sidebarRight'], (navCtx) => {
      const nav = navCtx.sidebarRight
      if (!nav || typeof nav.openTab !== 'function') return
      registerCanvasTextReference(navCtx, nav)
      navCtx.effect(
        () =>
          navCtx.slots.inject('conversation.input.dock', () =>
            navCtx.slots.register(
              { name: 'conversation.input.dock', id: 'dsh-canvas-selection', order: 55, locale: NS },
              (props) => React.createElement(CanvasSelectionDock, { sessionId: props.sessionId, nav }),
            ),
          ),
        'dsh-canvas: selection dock',
      )
    })
  }

  const registerDock = () => {
    let dispose = null
    ctx.effect(() => {
      dispose = ctx.slots.inject('conversation.input.dock', () =>
        ctx.slots.register(
          { name: 'conversation.input.dock', id: 'dsh-canvas-dock', order: 45, locale: NS },
          (props) =>
            React.createElement(InlineDock, {
              sessionId: props.sessionId,
              inputActions: props.inputActions,
              openLabel: t('dock.open'),
              closeLabel: t('dock.close'),
              title: t('tab.title'),
            }),
        ),
      )
      return () => {
        dispose?.()
        dispose = null
      }
    }, 'dsh-canvas: inline dock')
    return () => {
      dispose?.()
      dispose = null
    }
  }

  // The right-sidebar registry is a package service, not one of the catalogued
  // plugin services. At a fresh page boot this plugin can activate before the
  // sidebar package, so wait for the service instead of sampling ctx.get once.
  const tabsNow = ctx.get('sidebarRightTabs')
  if (tabsNow && typeof tabsNow.register === 'function') {
    registerTab(tabsNow, ctx)
    return
  }

  const disposeDock = registerDock()
  ctx.inject(['sidebarRightTabs'], (serviceCtx) => {
    disposeDock()
    const tabs = serviceCtx.sidebarRightTabs
    if (!tabs || typeof tabs.register !== 'function') return
    registerTab(tabs, serviceCtx)
  })
}
