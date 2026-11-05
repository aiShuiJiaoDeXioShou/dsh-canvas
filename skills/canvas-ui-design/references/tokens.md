# Token 协议与 Foundation 数据

Canvas 不依赖 Python 运行时；Host 端 `src/shared/foundation.ts` 负责解析设备/预设，`canvas_template` 的 `foundation` action 返回最终数据。

## 数据源

- `foundation/base.json`：完整基础字段（颜色、字体、间距、圆角、阴影、动效、断点、可用性初值）。
- `presets/neutral.json` 等：仅保存差异。
- 设备尺寸由 `src/shared/foundation.ts` 的 DEVICES 提供；iPhone 16 393×852 为默认，iPhone 15 390×844 兼容。
- 颜色和字体沿用现有 M3/iOS 设计系统；Foundation 预设只覆盖页边距、section gap、card padding、圆角、阴影等几何/密度字段。

## 合并顺序

新项目：基础基础 → 显式选择的 preset → 参考覆盖 → 用户覆盖。

已有项目：现有设计系统/Token → 仅在用户明确要求时切 preset → 参考 → 用户。没有要求时保留现有视觉，不自动套 Neutral。

## 使用

通过 `canvas_template` 的 `foundation` action 获取：

```json
{ "device": "iphone16", "preset": "neutral", "resolved": { ... } }
```

页面和组件消费同一份最终 token。需要持久化时写入 `canvas/design/resolved-tokens.json`，并记录来源与覆盖项。

## 检查

- 设备尺寸、状态栏/导航/底栏/Home Indicator 是否一致；
- 页面边距、圆角、阴影是否符合预设；
- 颜色/字体语义角色是否来自现有设计系统；
- 正文/大文本对比度、触控目标、安全区是否满足可用性；
- 数值检查不能代替实际画布渲染核对；真实交互仍要标注未验证。
