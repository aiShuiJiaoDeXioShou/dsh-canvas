/** Small, host-styled controls shared by the canvas panels. */

import * as React from 'react'
import { Icon } from './icons.jsx'

export function Button({ icon, children, active, primary, danger, small, title, onClick, disabled, className = '' }) {
  return React.createElement(
    'button',
    {
      type: 'button',
      title,
      disabled,
      onClick,
      className: `dshc-btn ${active ? 'is-active' : ''} ${primary ? 'is-primary' : ''} ${danger ? 'is-danger' : ''} ${small ? 'is-small' : ''} ${className}`,
    },
    icon ? React.createElement(Icon, { name: icon, size: small ? 14 : 15 }) : null,
    children ? React.createElement('span', null, children) : null,
  )
}

export function IconButton({ icon, title, active, onClick, size = 20, danger }) {
  return React.createElement(
    'button',
    {
      type: 'button',
      title,
      'aria-label': title,
      onClick,
      className: `dshc-icon-btn ${active ? 'is-active' : ''} ${danger ? 'is-danger' : ''}`,
    },
    React.createElement(Icon, { name: icon, size }),
  )
}

export function ContextMenu({ x, y, items, onClose, fixed = false }) {
  const ref = React.useRef(null)
  React.useEffect(() => {
    ref.current?.querySelector('button:not(:disabled)')?.focus?.({ preventScroll: true })
  }, [x, y])
  return React.createElement(
    'div',
    {
      ref,
      role: 'menu',
      className: 'dshc-context-menu',
      style: { left: x, top: y, position: fixed ? 'fixed' : 'absolute' },
      onPointerDown: (event) => event.stopPropagation(),
      onContextMenu: (event) => event.preventDefault(),
    },
    items.map((item, index) => {
      if (item.separator) return React.createElement('div', { key: `sep-${index}`, className: 'dshc-context-sep' })
      if (item.heading) return React.createElement('div', { key: `head-${index}`, className: 'dshc-context-heading' }, item.heading)
      return React.createElement(
        'button',
        {
          key: `${item.label}-${index}`,
          type: 'button',
          role: 'menuitem',
          disabled: item.disabled,
          className: `dshc-context-item ${item.danger ? 'is-danger' : ''}`,
          onClick: () => {
            item.action?.()
            onClose?.()
          },
        },
        item.icon ? React.createElement(Icon, { name: item.icon, size: 14 }) : null,
        React.createElement('span', { className: 'dshc-context-label' }, item.label),
        item.shortcut ? React.createElement('span', { className: 'dshc-context-shortcut' }, item.shortcut) : null,
      )
    }),
  )
}

export function Section({ title, children, right, defaultOpen = true }) {
  const [open, setOpen] = React.useState(defaultOpen)
  return React.createElement(
    'div',
    { className: 'dshc-section' },
    React.createElement(
      'button',
      { type: 'button', className: 'dshc-section-head', onClick: () => setOpen(!open) },
      React.createElement(Icon, { name: open ? 'chevronDown' : 'chevronRight', size: 12 }),
      React.createElement('span', null, title),
      right ? React.createElement('span', { className: 'dshc-section-right' }, right) : null,
    ),
    open ? React.createElement('div', { className: 'dshc-section-body' }, children) : null,
  )
}

export function Field({ label, children, wide }) {
  return React.createElement(
    'label',
    { className: `dshc-field ${wide ? 'is-wide' : ''}` },
    React.createElement('span', { className: 'dshc-field-label' }, label),
    children,
  )
}

/** Number input that commits on blur/Enter, so typing does not spam history. */
export function NumberInput({ value, onChange, min, max, step = 1, disabled, suffix }) {
  const [text, setText] = React.useState(String(value ?? 0))
  React.useEffect(() => setText(String(value ?? 0)), [value])
  const commit = () => {
    const next = Number(text)
    if (Number.isFinite(next)) {
      const bounded = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, next))
      onChange(bounded)
      setText(String(bounded))
    } else setText(String(value ?? 0))
  }
  return React.createElement(
    'span',
    { className: 'dshc-number' },
    React.createElement('input', {
      type: 'number',
      value: text,
      step,
      min,
      max,
      disabled,
      onChange: (event) => setText(event.target.value),
      onBlur: commit,
      onKeyDown: (event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          commit()
          event.currentTarget.blur()
        }
      },
    }),
    suffix ? React.createElement('span', { className: 'dshc-number-suffix' }, suffix) : null,
  )
}

export function ColorInput({ value, onChange, allowAlpha = true }) {
  const normalized = normalizeColor(value)
  return React.createElement(
    'span',
    { className: 'dshc-color' },
    React.createElement('input', {
      type: 'color',
      value: normalized.slice(0, 7),
      onChange: (event) => {
        const alpha = normalized.length === 9 ? normalized.slice(7) : ''
        onChange(`${event.target.value.toUpperCase()}${alpha}`)
      },
    }),
    React.createElement('input', {
      className: 'dshc-color-text',
      value: normalized,
      spellCheck: false,
      onChange: (event) => {
        const next = event.target.value.trim().toUpperCase()
        if (/^#([0-9A-F]{6}|[0-9A-F]{8})$/.test(next)) onChange(next)
      },
      onBlur: (event) => {
        if (!/^#([0-9A-F]{6}|[0-9A-F]{8})$/.test(event.target.value.trim().toUpperCase())) {
          event.target.value = normalized
        }
      },
    }),
  )
}

function normalizeColor(value) {
  if (typeof value === 'string' && /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value)) return value.toUpperCase()
  return '#000000'
}

export function Select({ value, onChange, options, disabled, title }) {
  return React.createElement(
    'select',
    {
      className: 'dshc-select',
      value,
      disabled,
      title,
      onChange: (event) => onChange(event.target.value),
    },
    options.map((option) =>
      React.createElement('option', { key: option.value, value: option.value }, option.label),
    ),
  )
}

export function Toggle({ value, onChange, label }) {
  return React.createElement(
    'button',
    {
      type: 'button',
      role: 'switch',
      'aria-checked': Boolean(value),
      className: `dshc-toggle ${value ? 'is-on' : ''}`,
      onClick: () => onChange(!value),
      title: label,
    },
    React.createElement('span', { className: 'dshc-toggle-dot' }),
  )
}

export function Modal({ title, children, onClose, footer, width = 360 }) {
  return React.createElement(
    'div',
    { className: 'dshc-modal-backdrop', onPointerDown: (event) => event.stopPropagation() },
    React.createElement(
      'div',
      { className: 'dshc-modal', style: { width } },
      React.createElement(
        'div',
        { className: 'dshc-modal-head' },
        React.createElement('span', null, title),
        React.createElement(IconButton, { icon: 'close', title: '关闭', onClick: onClose }),
      ),
      React.createElement('div', { className: 'dshc-modal-body' }, children),
      footer ? React.createElement('div', { className: 'dshc-modal-foot' }, footer) : null,
    ),
  )
}

export function NameDialog({ title, label, defaultValue, onCancel, onSubmit }) {
  const [value, setValue] = React.useState(defaultValue ?? '')
  const submit = () => {
    if (!value.trim()) return
    onSubmit(value.trim())
  }
  return React.createElement(
    Modal,
    {
      title,
      onClose: onCancel,
      footer: React.createElement(
        React.Fragment,
        null,
        React.createElement(Button, { onClick: onCancel }, '取消'),
        React.createElement(Button, { primary: true, onClick: submit, disabled: !value.trim() }, '确定'),
      ),
    },
    React.createElement(
      'label',
      { className: 'dshc-dialog-field' },
      React.createElement('span', null, label ?? '名称'),
      React.createElement('input', {
        autoFocus: true,
        value,
        onChange: (event) => setValue(event.target.value),
        onKeyDown: (event) => {
          if (event.key === 'Enter') submit()
          if (event.key === 'Escape') onCancel()
        },
      }),
    ),
  )
}

export function Empty({ icon, title, text, action }) {
  return React.createElement(
    'div',
    { className: 'dshc-empty-panel' },
    React.createElement(Icon, { name: icon, size: 26 }),
    React.createElement('div', { className: 'dshc-empty-panel-title' }, title),
    text ? React.createElement('div', { className: 'dshc-empty-panel-text' }, text) : null,
    action ?? null,
  )
}
