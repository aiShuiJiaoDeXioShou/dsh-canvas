---
name: canvas-ui-design
description: 在 dsh-canvas 中做 UI/UX 设计：需求澄清、信息架构、设计系统、页面与组件生成、参考还原、改稿、设计审查、图片素材和开发交付。当用户要设计/生成/修改画布里的 App 或网页界面、组件、设计规范或进行设计审查时使用。不用于纯 Flutter 代码实现或 Figma 文件交付。
whenToUse: 用户要在 dsh-canvas 画布中直接生成 UI、补页面/状态、建组件、套设计规范、按参考图还原、改稿、审查设计或做设计交付时。
---

# Canvas UI/UX 设计

这是 dsh-canvas 的统一 UI 设计入口。用户只要设计结果，不需要先描述技能名；按本文件路由到对应 workflow。

## 先澄清再制作

先读 `canvas_read` 返回的文档、当前选区、已有页面和 `canvas/DESIGN.md`。只有在目标用户、核心任务、页面范围、已有设计系统或参考保留/修改范围不明确时才追问；每轮只问一个核心问题或 2–3 个相关问题，复用已有决定，不重复提问。

需要用户选择的场景优先用 `ask_user_question`；工具不可用时直接用文字追问并停止本轮制作。不要用行业惯例或默认值代替产品范围的决定。

## 默认基线

- 新移动页面：iPhone 16，393×852；iOS 状态栏与适用的底部栏；Home Indicator。
- 风格预设：Neutral（默认）、Minimal、Soft、Compact；由 `canvas_template` 的 foundation 数据提供。
- 已有文档、已有设计系统或用户指定品牌优先，不重置现有视觉。
- 颜色和字体沿用现有 Material 3 / iOS HIG token；Foundation 只覆盖设备、密度、圆角、阴影和预设。
- 正式页面 Frame 圆角为 0，背景完整铺满；卡片/按钮内部圆角不受影响。
- 简单矢量图标可使用 `path` 节点或基础 SVG `<path>` 导入；复杂插画/需要钢笔编辑的矢量使用图片素材或要求用户提供源文件，不伪造完整矢量编辑能力。

## 直接生成 UI（主路径）

1. `canvas_read` 读取目标文档/选区；如果是新文档，确认或创建 canvas 文档。
2. 用 `canvas_template` 的 `foundation` action 获取设备、预设和 token；用户已有页面时沿用现有设备和规范。
3. 用 `canvas_template` 插入页面骨架（`ios-form-screen` / `ios-list-screen` / `ios-detail-screen` / `ios-screen`）或系统栏模板；也可以从空白 Frame 开始。
4. 用 `canvas_write` / `canvas_edit` 写真实内容、组件、样式、自动布局和状态；优先复用已有 component/style，避免逐页重复发明颜色和尺寸。
5. 需要图片时按下方「图片与素材」处理；文字、按钮、表单、动态数据必须使用原生节点，不能烘焙进图片。
6. 用 `canvas_audit` 检查，再按 findings 修正；最后用实际渲染/导出预览核对。
7. 交付时说明改了什么、哪些状态已覆盖、哪些未验证；不要把结构检查通过说成视觉审查通过。

简单页面直接生成；复杂页面、多业务区块或参考图复刻任务先读 `references/reference-fidelity.md`，必要时补齐参考或先做页面计划，但不要用流程文档代替实际生成。

## 图片与素材

先调用 `canvas_image probe`：

- `recommended: "native"` 且当前工具列表有原生图片生成工具：直接让模型生成图片，再用 `canvas_image import` 导入 `canvas/assets/`。
- `recommended: "codex"`：调用 `canvas_image generate`，由 Host 受控调用本机 Codex CLI 的 `image_generation` 生成并导入。
- 都不可用：请用户提供图片；可以用现有图片素材、用户上传或 `canvas_image import` 导入。不要用色块/简笔画冒充需要细节的插画、头像、封面或照片。
- 图片只承担独立素材角色；页面结构、文字和交互仍用原生节点。不要在 prompt 中放置敏感数据。

## 设计规范与预设

- 读取现有 `canvas/DESIGN.md`、文档 styles、components 和字体。
- 新项目/明确要建规范时：以 Neutral 为起点，按用户需要覆盖 Minimal/Soft/Compact；设备尺寸、间距、圆角、阴影来自 `references/foundation.md`。
- 用户指定规范时优先用户；参考图只作为局部覆盖，不未经授权重排布局。
- 大规模规范交付可用 `canvas_template` 的 `styles` action 加样式库；不自动改已有图层。

## 工作流路由

| 任务 | 读取 |
| --- | --- |
| 新 App/新页面、只有需求 | `workflows/requirements.md` → `workflows/information-architecture.md` → `workflows/screen-designer.md` |
| 生成/补组件 | `workflows/component-builder.md` |
| 建规范/换主题/套预设 | `workflows/design-system.md`，样式覆盖用 `workflows/style-adaptation.md` |
| 按参考图还原 | `references/reference-fidelity.md` → `workflows/assets.md` → 页面 |
| 局部改稿/回归 | `workflows/design-refactor.md` |
| 设计审查 | `workflows/design-audit.md`（默认只读） |
| 图片、图标、插画素材 | `workflows/assets.md` + `canvas_image` |
| 开发交付 | `workflows/developer-handoff.md` |

这些是内部路由，不是每次必须走完的阶段。局部小改直接使用现有上下文。

## 工具

- `canvas_read` / `canvas_write` / `canvas_edit` / `canvas_comment`：读、写、改、评论。
- `canvas_template`：`list` / `insert` / `styles` / `foundation`；页面骨架与设计基础。
- `canvas_audit`：确定性设计检查（边界、对比度、触控、裁切、引用）。
- `canvas_image`：`probe` / `generate` / `import`。
- 图片和字体的实际落盘位置遵循 `canvas/assets/`、`canvas/fonts/`；不要输出插件源码目录。

## 手动操作入口

Templates 面板提供设备选择（iPhone 16 / iPhone 15）和模板插入；AI 生成、生图和设计审查由本 Skill 与 canvas 工具完成，导出在顶部工具栏。不要依赖已移除的「设计」面板。

## 边界

- 不交付 Figma/Sketch 文件，不做 .fig 解析；SVG 只支持基础 `<path>` 导入，不承诺完整矢量还原。
- 不生成 Flutter/GetX 代码或 ThemeData；交付是设计文档、token、SVG/PNG 和说明。
- 不做真机/模拟器验收；静态设计稿可以审查，但不冒充运行验收。
- 不伪造 Image Gen 结果；无能力时明确要求用户提供素材。

## 交付

按 `references/delivery.md`：说明实际页面/节点、预览、关键设计决定、参考保留项、未完成项和未验证行为。必要时在 `canvas/design/` 写 brief、manifest、report，但不要为简单修改制造审批表。设计源仍是 `canvas/*.canvas.json`。
