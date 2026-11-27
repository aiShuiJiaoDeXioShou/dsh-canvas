/**
 * All-in-one Figma Ecosystem Sync & Quick Setup Dialog.
 *
 * Tabs:
 * 1. setup  — Zero-leak token setup (password box -> Keychain), Companion Plugin pairing code, channel status
 * 2. pull   — Import or 3-way Pull Diff from Figma URL or local `.fig` file (with per-node staging & conflict resolution)
 * 3. push   — Push Diff preview (`in-place` / `proposal-frame`), Figma comment sync, `.dshfig` lossless bundle
 */

import * as React from 'react'
import {
  clearFigmaAuthToken,
  createFigmaPairing,
  downloadDshFigBundle,
  fetchFigmaStatus,
  importFigmaUrl,
  requestFigmaPush,
  saveFigmaAuthToken,
  syncFigmaCommentsApi,
  uploadDshFigBundle,
  uploadFigmaFile,
  type FigmaDiffPlanView,
  type FigmaSetupStatusView,
} from '../api.js'
import { Button, Modal } from './common.jsx'

type Tab = 'setup' | 'pull' | 'push'

export function FigmaSyncDialog({
  store,
  initialTab = 'setup',
  onClose,
}: {
  store: any
  initialTab?: Tab
  onClose: () => void
}) {
  const [tab, setTab] = React.useState<Tab>(initialTab)
  const [status, setStatus] = React.useState<FigmaSetupStatusView | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)

  // Auth setup state (password box — never echoed or persisted in component history)
  const [tokenInput, setTokenInput] = React.useState('')
  const [scopeMode, setScopeMode] = React.useState<'readonly' | 'comments-write'>('readonly')
  const [pairingCode, setPairingCode] = React.useState<string | null>(null)

  // Pull state
  const [figmaUrl, setFigmaUrl] = React.useState('')
  const [pullMode, setPullMode] = React.useState<'import' | 'pull'>('import')
  const [diffPlan, setDiffPlan] = React.useState<FigmaDiffPlanView | null>(null)
  const [selectedIds, setSelectedIds] = React.useState<Record<string, boolean>>({})
  const [resolutions, setResolutions] = React.useState<Record<string, 'keep-drafi' | 'take-figma' | 'skip'>>({})
  const [pendingFigFile, setPendingFigFile] = React.useState<File | null>(null)

  // Push state
  const [pushMode, setPushMode] = React.useState<'in-place' | 'proposal-frame'>('in-place')
  const [pushPlan, setPushPlan] = React.useState<FigmaDiffPlanView | null>(null)

  const refreshStatus = React.useCallback(async () => {
    try {
      const s = await fetchFigmaStatus(store.sessionId, store.state.name)
      setStatus(s)
      if (s.binding?.fileUrl && !figmaUrl) setFigmaUrl(s.binding.fileUrl)
      if (s.binding) setPullMode('pull')
      if (s.channels?.companionPlugin?.pairingCode) setPairingCode(s.channels.companionPlugin.pairingCode)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [store.sessionId, store.state.name])

  React.useEffect(() => {
    refreshStatus()
  }, [refreshStatus])

  const initPlanSelection = (plan: FigmaDiffPlanView) => {
    const nextSel: Record<string, boolean> = {}
    for (const e of plan.entries) nextSel[e.dshId] = e.selected !== false
    setSelectedIds(nextSel)
    const nextRes: Record<string, 'keep-drafi' | 'take-figma' | 'skip'> = {}
    for (const c of plan.conflicts) nextRes[c.conflictKey] = 'take-figma'
    setResolutions(nextRes)
  }

  const onSaveToken = async () => {
    if (!tokenInput.trim()) return
    setLoading(true)
    setError(null)
    setNotice(null)
    try {
      const res = await saveFigmaAuthToken(tokenInput.trim(), scopeMode)
      setTokenInput('')
      setNotice(`已验活并安全保存至 ${res.source === 'keychain' ? 'macOS Keychain' : '本地 0600 凭证库'}（账号：${res.account?.handle ?? res.account?.email ?? 'Figma'}）`)
      await refreshStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const onClearToken = async () => {
    setLoading(true)
    setError(null)
    try {
      await clearFigmaAuthToken()
      setNotice('已清除本地 Figma Token')
      await refreshStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const onCreatePairing = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await createFigmaPairing(store.sessionId, store.state.name)
      setPairingCode(res.pairingCode)
      await navigator.clipboard?.writeText(res.pairingCode).catch(() => {})
      setNotice(`配对码 ${res.pairingCode} 已生成并复制到剪贴板，请在 Figma Drafi Companion 插件内粘贴连接。`)
      await refreshStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const onPreviewUrl = async () => {
    if (!figmaUrl.trim()) return
    setLoading(true)
    setError(null)
    setNotice(null)
    try {
      await store.flush?.()
      const res = await importFigmaUrl(store.sessionId, store.state.name, {
        url: figmaUrl.trim(),
        mode: pullMode,
        dryRun: true,
        baseRevision: store.state.revision,
      })
      if (res.plan) {
        setDiffPlan(res.plan)
        initPlanSelection(res.plan)
      } else {
        setDiffPlan(null)
        setNotice(`预览完成：共 ${res.nodes ?? 0} 个节点、${res.images ?? 0} 张图片，确认后即可导入。`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const onCommitPull = async () => {
    setLoading(true)
    setError(null)
    try {
      await store.flush?.()
      const chosen = Object.entries(selectedIds)
        .filter(([, v]) => v)
        .map(([k]) => k)
      if (pendingFigFile) {
        await uploadFigmaFile(store.sessionId, store.state.name, pendingFigFile, {
          mode: pullMode,
          dryRun: false,
          baseRevision: store.state.revision,
        })
      } else {
        await importFigmaUrl(store.sessionId, store.state.name, {
          url: figmaUrl.trim(),
          mode: pullMode,
          dryRun: false,
          baseRevision: store.state.revision,
          selectedIds: diffPlan ? chosen : undefined,
          resolutions: diffPlan ? resolutions : undefined,
        })
      }
      await store.reload?.()
      setDiffPlan(null)
      setPendingFigFile(null)
      setNotice('已成功同步到当前画布！')
      await refreshStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const onPickFigFile = async (file: File) => {
    setPendingFigFile(file)
    setLoading(true)
    setError(null)
    setNotice(null)
    try {
      await store.flush?.()
      const res = await uploadFigmaFile(store.sessionId, store.state.name, file, {
        mode: pullMode,
        dryRun: true,
        baseRevision: store.state.revision,
      })
      if (res.plan) {
        setDiffPlan(res.plan)
        initPlanSelection(res.plan)
      } else {
        setNotice(`已解析 ${file.name}（${res.nodes ?? 0} 个节点，${res.images ?? 0} 张图片），点击「确认写入」导入。`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const onPlanPush = async (commit: boolean) => {
    setLoading(true)
    setError(null)
    setNotice(null)
    try {
      await store.flush?.()
      const res = await requestFigmaPush(store.sessionId, store.state.name, {
        mode: pushMode,
        dryRun: !commit,
      })
      setPushPlan(res.plan)
      if (commit && res.patch) {
        if (res.queuedForPlugin) {
          setNotice(`Patch（${res.patch.operations.length} 项变更）已推送到 Companion Plugin 队列，请在 Figma 插件中点击「拉取并应用 Drafi Patch」。`)
        } else {
          const blob = new Blob([JSON.stringify(res.patch, null, 2)], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${store.state.name}.dshpatch.json`
          a.click()
          URL.revokeObjectURL(url)
          setNotice('未检测到在线配对插件，已下载离线 .dshpatch.json 供 Figma Companion 插件直接导入。')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const onSyncComments = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await syncFigmaCommentsApi(store.sessionId, store.state.name, figmaUrl.trim() || undefined)
      await store.reload?.()
      setNotice(`已同步 ${res.totalComments ?? 0} 条 Figma 评论（新增 ${res.imported ?? 0}、更新 ${res.updated ?? 0}）。`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const onExportBundle = async () => {
    setLoading(true)
    setError(null)
    try {
      await store.flush?.()
      const blob = await downloadDshFigBundle(store.sessionId, store.state.name)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${store.state.name}.dshfig`
      a.click()
      URL.revokeObjectURL(url)
      setNotice(`已导出便携无损包 ${store.state.name}.dshfig`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const onImportBundle = async (file: File) => {
    setLoading(true)
    setError(null)
    try {
      const res = await uploadDshFigBundle(store.sessionId, store.state.name, file)
      await store.reload?.()
      setNotice(`已导入 .dshfig（恢复 ${res.assetsRestored ?? 0} 个资源${res.hasSidecar ? ' + Figma 绑定' : ''}）`)
      await refreshStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Figma 生态同步与快速配置" width={540} onClose={onClose}>
      <div className="dshc-figma-tabs">
        <Button small active={tab === 'setup'} onClick={() => setTab('setup')}>快速配置</Button>
        <Button small active={tab === 'pull'} onClick={() => setTab('pull')}>从 Figma 导入</Button>
        <Button small active={tab === 'push'} onClick={() => setTab('push')}>导出到 Figma</Button>
      </div>

      {error && <div className="dshc-figma-banner is-error">{error}</div>}
      {notice && <div className="dshc-figma-banner is-ok">{notice}</div>}

      {tab === 'setup' && (
        <div className="dshc-figma-section">
          <div className="dshc-figma-card">
            <strong>L0 免配置（立即可用）</strong>
            <p className="dshc-muted">在 Figma 中 ⌘C 复制图层，回到 Drafi 画布直接 ⌘V 粘贴（自动解码与图片落盘）。</p>
          </div>

          <div className="dshc-figma-card">
            <strong>L1 Companion Plugin 本地直连（免 Token）</strong>
            <p className="dshc-muted">
              在 Figma Desktop → Plugins → Development → Import plugin from manifest 导入插件，使用下方配对码实现原位双向同步。
            </p>
            {status?.channels?.companionPlugin?.manifestPath && (
              <code className="dshc-figma-code">{status.channels.companionPlugin.manifestPath}</code>
            )}
            <div className="dshc-figma-row">
              <Button small primary disabled={loading} onClick={onCreatePairing}>
                {pairingCode ? `重新生成配对码（当前：${pairingCode}）` : '生成一次性配对码'}
              </Button>
            </div>
          </div>

          <div className="dshc-figma-card">
            <strong>L2 Figma REST Token（URL 导入 & 评论联动）</strong>
            {status?.auth?.configured && status.auth.valid ? (
              <div className="dshc-figma-auth-ok">
                <span>
                  已连接：{status.auth.account?.handle ?? status.auth.account?.email ?? 'Figma'}（{status.auth.source}，
                  {status.auth.daysUntilExpiry != null ? `剩余约 ${status.auth.daysUntilExpiry} 天` : '有效'}）
                </span>
                <Button small disabled={loading} onClick={onClearToken}>清除 Token</Button>
              </div>
            ) : (
              <p className="dshc-muted">
                仅在本地密码框中粘贴，绝不经过聊天记录。前往{' '}
                <a href="https://www.figma.com/settings" target="_blank" rel="noreferrer">figma.com/settings</a>
                {' '}→ Security → Personal access tokens 生成（勾 Current user / File content / Comments）。
              </p>
            )}
            <div className="dshc-figma-row">
              <input
                type="password"
                className="dshc-input"
                placeholder="粘贴 figd_... Token（仅存系统 Keychain）"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                autoComplete="off"
              />
              <select
                className="dshc-input"
                style={{ width: 120 }}
                value={scopeMode}
                onChange={(e) => setScopeMode(e.target.value as 'readonly' | 'comments-write')}
              >
                <option value="readonly">只读</option>
                <option value="comments-write">含评论回写</option>
              </select>
              <Button small primary disabled={loading || !tokenInput.trim()} onClick={onSaveToken}>验证并保存</Button>
            </div>
          </div>
        </div>
      )}

      {tab === 'pull' && (
        <div className="dshc-figma-section">
          <div className="dshc-figma-row">
            <input
              className="dshc-input"
              placeholder="粘贴 Figma 文件或画板 URL（支持 ?node-id=...）"
              value={figmaUrl}
              onChange={(e) => setFigmaUrl(e.target.value)}
            />
            <select
              className="dshc-input"
              style={{ width: 110 }}
              value={pullMode}
              onChange={(e) => setPullMode(e.target.value as 'import' | 'pull')}
            >
              <option value="import">冷导入</option>
              <option value="pull">三方 Pull</option>
            </select>
            <Button small primary disabled={loading || !figmaUrl.trim()} onClick={onPreviewUrl}>预览 Diff</Button>
          </div>

          <div className="dshc-figma-row">
            <label className="dshc-btn is-small">
              选择本地 .fig 文件
              <input
                type="file"
                accept=".fig"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onPickFigFile(file)
                  e.target.value = ''
                }}
              />
            </label>
            <Button small primary disabled={loading || (!figmaUrl.trim() && !pendingFigFile)} onClick={onCommitPull}>
              确认写入画布
            </Button>
          </div>

          {diffPlan && (
            <div className="dshc-figma-diff">
              <div className="dshc-muted">
                +{diffPlan.summary.added} 新增 · ~{diffPlan.summary.modified} 修改 · ⇄{diffPlan.summary.moved} 移动 · -{diffPlan.summary.deleted} 删除 · ⚠{diffPlan.summary.conflicts} 冲突
              </div>
              {diffPlan.entries.map((entry) => (
                <label key={entry.dshId} className="dshc-figma-diff-row">
                  <input
                    type="checkbox"
                    checked={selectedIds[entry.dshId] !== false}
                    onChange={(e) => setSelectedIds((prev) => ({ ...prev, [entry.dshId]: e.target.checked }))}
                  />
                  <span>[{entry.kind}] {entry.nodeName}</span>
                  <span className="dshc-muted">{entry.fields.map((f) => f.field).join(', ')}</span>
                </label>
              ))}
              {diffPlan.conflicts.map((c) => (
                <div key={c.conflictKey} className="dshc-figma-diff-row is-conflict">
                  <span>冲突：{c.nodeName} ({c.field})</span>
                  <select
                    value={resolutions[c.conflictKey] ?? 'take-figma'}
                    onChange={(e) =>
                      setResolutions((prev) => ({ ...prev, [c.conflictKey]: e.target.value as 'keep-drafi' | 'take-figma' | 'skip' }))
                    }
                  >
                    <option value="take-figma">采用 Figma</option>
                    <option value="keep-drafi">保留 Drafi</option>
                    <option value="skip">跳过</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'push' && (
        <div className="dshc-figma-section">
          <div className="dshc-figma-card">
            <strong>方式一：1 秒导出到 Figma（免插件，推荐）</strong>
            <p className="dshc-muted">
              直接复制当前选区（未选则复制整张画布）为可编辑矢量，切到 Figma 按 ⌘V 粘贴即可；或导出 SVG 文件直接拖入 Figma。
            </p>
            <div className="dshc-figma-row">
              <Button
                small
                primary
                disabled={loading}
                onClick={async () => {
                  const ok = await store.copyForFigma?.()
                  if (ok) setNotice('已复制到剪贴板：切到 Figma 按 ⌘V 即可粘贴为可编辑图层。')
                }}
              >
                复制到剪贴板（去 Figma 按 ⌘V）
              </Button>
              <Button
                small
                disabled={loading}
                onClick={() => store.exportSelection?.('svg')}
              >
                保存 SVG（拖进 Figma）
              </Button>
            </div>
          </div>

          <div className="dshc-figma-card">
            <strong>方式二：双向同步推回 Figma 文件（配合免费插件）</strong>
            <p className="dshc-muted">
              适合从 Figma 拉来改稿后推回原文件：先在「快速配置」生成配对码并导入 Companion 插件，再点下方推送（未连插件会自动下载 .dshpatch.json 离线包供插件导入）。
            </p>
            <div className="dshc-figma-row">
              <select
                className="dshc-input"
                value={pushMode}
                onChange={(e) => setPushMode(e.target.value as 'in-place' | 'proposal-frame')}
              >
                <option value="in-place">原位更新（保留原 URL / 评论 / 透传属性）</option>
                <option value="proposal-frame">新建 [Drafi Diff] 对比画板</option>
              </select>
              <Button small disabled={loading} onClick={() => onPlanPush(false)}>预览改动</Button>
              <Button small primary disabled={loading} onClick={() => onPlanPush(true)}>推送到 Figma</Button>
            </div>
            {pushPlan && (
              <div className="dshc-muted" style={{ marginTop: 6 }}>
                待推送：+{pushPlan.summary.added} 新增 · ~{pushPlan.summary.modified} 修改 · ⇄{pushPlan.summary.moved} 移动 · -{pushPlan.summary.deleted} 删除
              </div>
            )}
          </div>

          <div className="dshc-figma-card">
            <strong>团队评论联动</strong>
            <div className="dshc-figma-row">
              <Button small disabled={loading} onClick={onSyncComments}>拉取 Figma 评论到画布</Button>
            </div>
          </div>

          <div className="dshc-figma-card">
            <strong>便携无损包（.dshfig）</strong>
            <div className="dshc-figma-row">
              <Button small disabled={loading} onClick={onExportBundle}>导出 .dshfig（含绑定与原图）</Button>
              <label className="dshc-btn is-small">
                导入 .dshfig
                <input
                  type="file"
                  accept=".dshfig"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) onImportBundle(file)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
