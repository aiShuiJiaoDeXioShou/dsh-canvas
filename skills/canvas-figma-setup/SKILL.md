---
name: canvas-figma-setup
description: 30 秒快速配置 Drafi × Figma 生态连接：按需分档（免 Token 剪贴板/插件、只读 REST、评论双向联动），安全引导获取 Figma Personal Access Token 而不泄露到聊天记录，写入系统 Keychain，并一站式配置 Figma Companion Plugin 与连通性验活。当用户说「帮我配一下 Figma」「怎么拿 Figma token」「连接 Figma」「同步 Figma 评论」或遇到 Figma 鉴权报错时使用。
whenToUse: 用户要首次接入 Figma、配置或续期 Figma Token、安装/配对 Drafi Companion Plugin，或排查 Figma 连接与权限问题时。
---

# Drafi × Figma 快速配置向导（30 秒零泄露接入）

本 Skill 帮助用户以最低门槛、最高安全标准打通 Drafi 与 Figma 生态。

## 安全红线（必须遵守）

- **严禁要求用户把 `figd_...` Token 直接发在聊天对话框里**（否则明文会进入对话记录与模型上下文）。
- 永远只读取脱敏状态（账号 handle、email、存储位置、权限模式、到期倒计时），绝不打印或复述明文 Token。
- 绝不索要 Figma 账号密码，也不尝试绕过登录或 2FA；只复用用户浏览器里已有的 Figma 登录态。

## 四步极速接入流程

### 第 1 步：自动体检（先查再问）

立即调用 `canvas_figma({ action: 'setup_status' })`，一次性确认：
1. 本机是否已有可用 Figma Token（`configured` / `valid` / `account` / `scopeMode` / `daysUntilExpiry`）；
2. 当前画布是否已绑定 Figma 文件、是否已有 Companion Plugin 本地配对；
3. 本机是否检测到 Figma Desktop 及 `figma-plugin/manifest.json` 与 `scripts/figma-setup.mjs` 绝对路径。

- 如果 Token 已有效且未临近过期（>7 天），直接告知已连接账号，跳过 Token 获取步骤，按需只补插件配对或开始同步。
- 如果 Token 将在 7 天内过期或已失效，直接进入第 3 步续期。

### 第 2 步：按需分档（不强迫不需要 Token 的用户）

先向用户说明三种零成本档位，并用 `ask_user_question`（不可用时用简短文字）让用户单选：

| 档位 | 适用场景 | 是否需要 Token |
| --- | --- | --- |
| **L0 免配置** | Figma `⌘C` → Drafi `⌘V` 粘贴图层、导入本地 `.fig` 文件 | **不需要** |
| **L1 伴生插件直连** | 原位双向 Pull/Push 画板（保留原 Figma URL/评论/透传属性） | **不需要**（本地回环配对码） |
| **L2 云端协作增强** | 通过 Figma URL 冷拉取画板、拉取/回复 Figma 团队评论、查版本历史 | **需要免费 PAT** |

如果用户只需 L0，直接演示 `⌘C` → `⌘V` 即可结束；如果只需 L1，直接跳到第 4 步。

### 第 3 步：零泄露快速配置 Figma Token（仅 L2 需要）

1. **一键直达设置页**：运行 `node "<setupScriptPath>" --open-settings` 为用户在默认浏览器打开 `https://www.figma.com/settings`（若无法自动打开，则给出该链接）。
2. **给出最小权限精确勾选表**（让用户照着点 3 下，不猜权限）：
   - 进入 **Security → Personal access tokens → Generate new token**；
   - Token 名称填 `drafi-local`，过期时间选 **90 days**；
   - **只读模式**（URL 导入 + 拉取评论/版本）：勾选 `Current user: Read-only`（`current_user:read`）+ `File content: Read-only` + `Comments: Read-only`；
   - **完整协作模式**（含 AI 改稿后自动回写 Figma 评论摘要）：额外勾选 `Comments: Write`；
   - **权限排查说明（Granular Token `/v1/me` HTTP 403）**：Figma 新版细粒度 PAT 若未勾选 `current_user:read`，调用 `GET /v1/me` 会返回 HTTP `403 (Invalid scope)`。Host 凭证探针与 `scripts/figma-setup.mjs` 会将其识别为「受限 scope 有效凭证（`valid: true`, `Figma (restricted scope)`）」而不会误判失效，文件读取/评论接口仍可正常使用；若想显示完整账号名/邮箱，或需要直接验活，建议补勾 `Current user: Read-only`。只有返回 HTTP `401` 才表示 Token 无效或已过期，需要重新生成。
   - 点击 **Generate token** 后点 **Copy this token**。
3. **二选一安全盲存（绝不贴进对话框）**：
   - **首选（Drafi 界面密码框）**：让用户在 Drafi 顶部工具栏打开 **Figma 同步** 弹窗 → 在「API Token」密码框内直接 `⌘V` 粘贴并点「验证并保存」（经回环同源 `POST /dsh-canvas/api/figma/auth/token` 验活后直接写入 macOS Keychain / `0600` 本地凭证库）。
   - **兜底（剪贴板盲读 · 一键完成）**：用户点完 Figma 的「Copy this token」后回复「已复制」，立即执行：
     ```bash
     node "<setupScriptPath>" --from-clipboard --scope <readonly|comments-write>
     ```
     脚本会自动校验 `figd_*` 格式、调用 `GET /v1/me` 验活、写入系统 Keychain（非 macOS 写 `~/.dsh/credentials/dsh-canvas-figma.json` `0600`）、**立即清空系统剪贴板**，并只返回脱敏 JSON（账号名、存储位置、到期时间）。

### 第 4 步：Companion Plugin 一键接入 & 端到端验活

如果用户需要双向原位 Push/Pull：
1. 调用 `canvas_figma({ action: 'pair_start' })` 签发一次性本地回环配对码（如 `A1B2-C3D4`）及回环地址；
2. 告诉用户 `figma-plugin/manifest.json` 绝对路径（可运行 `node "<setupScriptPath>" --plugin-path` 顺手复制到剪贴板），给出 3 步安装指引：
   - 打开 **Figma Desktop** → 菜单 **Plugins → Development → Import plugin from manifest...**
   - 按 `⌘⇧G` 粘贴 `manifest.json` 路径并确认；
   - 运行插件 **Drafi Companion** → 填入配对码点击 **Connect**。
3. **收口验活**：
   - 再次调用 `canvas_figma({ action: 'setup_status' })` 确认 Token 与/或插件已绿灯；
   - 如果用户手头有任意 Figma 文件 URL，可立即执行 `canvas_figma({ action: 'import_url', url, dryRun: true })` 验证目标文件可读，并汇报完整就绪状态与到期提醒日期。
