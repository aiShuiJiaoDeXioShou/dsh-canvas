# 开发交付

按 [交付](../references/delivery.md) 提供实际页面/节点、版本、预览、关键交互与适配说明。多页任务沿用 `canvas/design/manifest.json`。

## 交付内容

| 内容 | 说明 |
| --- | --- |
| `canvas/*.canvas.json` | 设计源，标明文档名/revision |
| 页面/Frame 节点 | 选定的页面和状态，不只给整页截图 |
| SVG/PNG 导出 | 用画布导出功能生成，保存到 `canvas/exports/`；标明直角完整截图边界 |
| resolved tokens | 需要规范交付时保存 `canvas/design/resolved-tokens.json` |
| 设计说明 | `canvas/design/brief.md`、`report.md`、素材清单 |
| 未完成项 | 未覆盖状态、未验证交互、替代素材和限制 |

## 约束

- 不生成 Flutter/GetX 代码或 `ThemeData`；需要代码实现时由用户进入工程侧，设计侧只交设计依据。
- 不导出 Figma/Sketch 文件，不做整页 SVG 矢量回流。
- 导出前检查根 Frame 四角为 0、背景完整、无设备外壳/透明圆角混入。
- 设计审查通过不等于运行验收；真实交互/设备行为未验证时明确标注。
- 已有工程时更新其 README 的设计资产段；没有工程时把交付文件放在画布工作区。

## 完成

交付实际成果和必要说明，不另造审批表或空报告。
