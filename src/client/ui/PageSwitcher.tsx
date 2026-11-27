/** Lightweight multi-canvas (doc.pages[]) switcher with inline rename for the top of the Layers panel. */

import * as React from 'react'
import { IconButton } from './common.jsx'

export function PageSwitcher({ store }: { store: any }) {
  const pages: Array<{ id: string; name: string; children?: unknown[] }> = store.state.doc?.pages ?? []
  const activeId = store.state.pageId ?? pages[0]?.id ?? ''
  const activePage = pages.find((page) => page.id === activeId) ?? pages[0]
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setEditing(false)
  }, [activeId])

  React.useEffect(() => {
    if (!editing) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [editing])

  if (pages.length === 0) return null

  const startRename = () => {
    if (!activePage) return
    setDraft(activePage.name || '')
    setEditing(true)
  }

  const commitRename = () => {
    setEditing(false)
    if (!activePage) return
    const trimmed = draft.trim()
    if (trimmed && trimmed !== activePage.name) {
      store.renamePage?.(activePage.id, trimmed)
    }
  }

  const onDuplicatePage = () => {
    if (!activePage) return
    store.duplicatePage?.(activePage.id)
  }

  const onDeletePage = () => {
    if (!activePage || pages.length <= 1) return
    const hasChildren = (activePage.children?.length ?? 0) > 0
    if (
      hasChildren &&
      typeof window !== 'undefined' &&
      !window.confirm(`删除画布「${activePage.name || activePage.id}」？此操作不可撤销。`)
    ) {
      return
    }
    store.deletePage?.(activePage.id)
  }

  return (
    <div className="dshc-page-switcher" aria-label="画布切换">
      {editing ? (
        <>
          <input
            ref={inputRef}
            className="dshc-page-input"
            aria-label="画布名称"
            value={draft}
            maxLength={120}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitRename}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                commitRename()
              } else if (event.key === 'Escape') {
                event.preventDefault()
                setEditing(false)
              }
            }}
          />
          <IconButton
            icon="check"
            title="确认重命名"
            onMouseDown={(event: React.MouseEvent) => event.preventDefault()}
            onClick={commitRename}
          />
        </>
      ) : (
        <>
          <select
            className="dshc-page-select"
            aria-label="当前画布"
            value={activeId}
            onChange={(event) => store.setPage(event.target.value)}
          >
            {pages.map((page) => (
              <option key={page.id} value={page.id}>
                {page.name || page.id}
              </option>
            ))}
          </select>
          <IconButton
            icon="pencil"
            title="重命名画布"
            onClick={startRename}
          />
          <IconButton
            icon="copy"
            title="复制当前画布"
            onClick={onDuplicatePage}
          />
          <IconButton
            icon="plus"
            title="新建画布"
            onClick={() => store.addPage?.(`画布 ${pages.length + 1}`)}
          />
          <IconButton
            icon="trash"
            danger
            title={pages.length <= 1 ? '至少保留一个画布' : '删除当前画布'}
            disabled={pages.length <= 1}
            onClick={onDeletePage}
          />
        </>
      )}
    </div>
  )
}
