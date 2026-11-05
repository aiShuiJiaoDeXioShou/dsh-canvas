# AI 修改交互设计

> 目标：让用户把「画布上选中的图层」和「图层上的评论/TODO」作为同一份上下文交给 AI，AI 按评论逐条修改，而不是每次重新描述需求。

## 1. 核心概念

- **Canvas Context（画布上下文）**：一次发送给 AI 的图层集合 + 评论集合 + 可选文字指令。
- **TODO Comment（任务评论）**：带有 `kind: "todo"` 的评论，表示一个待处理修改项；普通评论仍是 note。
- **Context Bar（输入框上方的上下文条）**：展示当前选中的图层和评论，允许增删、定位、清空。

## 2. 顶部上下文条

替换当前单个「在画布中定位：平静 mood ×」chip：

```
[▣ 3 个图层 · 平静 mood 等 ▾]  [✎ 2 条 TODO ▾]  [清空]
```

### 图层 chip

- 显示数量与主图层名；
- 点开 popover：
  - 每行：图层名、定位、移除；
  - 支持多选/取消；
  - 顶部「全选当前页面」「清空」。
- 画布中多选（Shift / 框选）时自动同步；
- 选中多个时只生成一个合并 chip，避免挤满输入框。

### TODO chip

- 只展示未完成评论（`resolved=false`）；
- 点开 popover：
  - 按图层分组；
  - 每行：评论摘要、所在图层、状态、定位、勾选；
  - 「全选未完成」「仅当前选区」。
- 勾选评论时，自动把评论所在图层加入图层集合；取消评论不自动移除图层（避免误删用户手动选中的图层）。
- 没有 TODO 时 chip 不显示。

## 3. 评论作为 TODO

扩展现有 comment：

```json
{
  "id": "c1",
  "pageId": "page-1",
  "nodeId": "mood-happy",
  "body": "把心情颜色再暖一点",
  "kind": "todo",
  "status": "open",
  "resolved": false,
  "author": "user",
  "replyCount": 0
}
```

状态：

- `open`：待处理；
- `in_progress`：AI 已接单/已回复处理中；
- `review`：AI 已改完，等待用户确认；
- `blocked`：AI 无法完成（缺素材/冲突）；
- `resolved`：用户确认完成。

兼容：旧评论没有 `kind/status` 时按 note + `resolved` 推断；
`resolved=true` 等同于 done。

入口：

- 右键菜单：「添加评论」「添加 TODO」；
- 评论工具 `C` 仍可创建普通评论；
- 评论面板增加「TODO / 全部」筛选；
- 图层列表/TODO 徽标显示未完成数量；
- `canvas_comment`：支持 `kind/status`；默认 AI 只能 `reply`，不能把评论标记为 resolved（除非用户明确要求）。

## 4. 发送协议

上下文条发送时生成一条可点击的合并链接：

```
[画布上下文：3 个图层 + 2 条 TODO](dsh-canvas://main?nodes=n1,n2,n3&comments=c1,c2)
```

（当前只有单节点链接；需要扩展 canvas link 解析器支持 `nodes` / `comments`。）

可读文本保留摘要，方便人看：

```
画布上下文
- 图层：平静 mood、开心 mood、Mood Picker
- TODO：
  c1 @mood-happy：把心情颜色再暖一点
  c2 @mood-picker：选中的心情环再明显一点
```

如果用户额外输入了指令，放在链接之后；没有指令时，默认指令是：

> 按选中的 TODO 逐条修改这些图层；完成后回复每条 TODO 的处理结果，不要自动关闭评论。

## 5. AI 修改流程

1. `canvas_read`：读取文档、`selection.nodes`、`selection.comments`；如果链接只带 id，先解析出对应图层与评论。
2. 生成内部 TODO 清单；
3. 对每条 TODO：
   - 定位节点；
   - 执行最小改动（`canvas_edit` / `canvas_write`）；
   - `canvas_comment reply` 回复：改了什么、关联节点、需要用户确认的点；
   - 默认把 status 置为 `review`，不自动 resolved；
   - 无法完成则 `blocked` 并说明原因。
4. 全部改完运行 `canvas_audit`，报告结构问题；
5. 最终回复按 TODO 列表逐项汇报：完成/审核中/阻塞。

### 评论回复与关闭规则

- AI 自动回复评论，但评论是否关闭由用户决定；
- 用户明确说「处理完就关闭/标记完成」时，AI 才可 `resolved=true`；
- 用户手动点「完成」才最终 resolved；
- 任何 AI 修改都保留画布 undo/redo 历史；评论状态变更也可在评论面板撤销。

## 6. 输入框与画布选区同步

- 画布多选 → 顶部 chip 更新；
- 顶部 chip 删除某图层 → 画布选区同步；
- 点击 chip 行 → 画布定位并选中该图层；
- 发送后 chip 保留直到用户清空，方便连续追问；
- 切换画布文档时清空或按文档恢复上下文（MVP：清空并提示）。

## 7. 边界

- 评论在 AI 读取后被用户修改：评论 `updatedAt`/revision 不一致时，AI 先重新读取，不覆盖用户改动；
- 画布并发修改：沿用 revision guard，冲突时先提示用户；
- 评论只挂在单个图层；MVP 不给评论做多目标，多选图层分别评论即可；
- 选中评论绑定图层时，若图层已删除，chip 显示失效并提供移除；
- 不自动把普通 note 当 TODO，避免 AI 把沟通备注当任务。

## 8. 实施顺序

### MVP

1. 多选上下文：顶部合并 chip + 合并 canvas link；
2. `canvas_read` selection 返回 nodes/comments；
3. 评论增加 `kind/status`；
4. 评论面板/右键增加 TODO 入口和「插入到对话」；
5. 发送 protocol 与 AI 处理评论回复；
6. 不自动 resolved。

### Phase 2

- TODO 列表视图（按状态/图层分组）；
- 批量选择评论插入；
- AI 自动生成计划并等待确认；
- 评论状态筛选与徽标；
- 用户配置「AI 完成后自动标记 review/resolved」。

## 9. 验收

- 画布多选 3 个图层，顶部显示 1 个「3 个图层」chip，而不是 3 个独立 chip；
- 勾选 2 条 TODO，发送后 AI 能读到指定节点 + 指定评论，不会误改其他图层；
- AI 修改后逐条回复评论，评论状态为 review，不自动关闭；
- 用户点完成才 resolved；
- 冲突/失效节点有明确提示。
