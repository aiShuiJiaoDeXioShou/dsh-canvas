# 设计系统

先读取画布现有 styles、components、字体和 `canvas/DESIGN.md`；已有项目保持原体系，局部修改不重新套预设。

## 新项目

1. 选择设备：默认 iPhone 16 393×852；旧项目/指定机型沿用其尺寸。
2. 选择 Foundation 预设：Neutral（默认）/ Minimal / Soft / Compact。设备、页边距、section gap、card padding、圆角、阴影见 [Foundation](../references/foundation.md) 和 `foundation/base.json` + `presets/`。
3. 颜色和字体沿用现有 Material 3 / iOS HIG 语义角色；不要因为换预设就改无关状态色。
4. 需要本地样式库时，用 `canvas_template` 的 `styles` action 或画布「样式」面板加载；加载只增加样式，不自动改现有图层。
5. 组件契约：Button（Primary/Secondary/Outline/Text，small/medium/large，default/pressed/focused/disabled/loading）、Input（label/value/help/error/focus/disabled）、Card/List、Nav、Dialog/Sheet。只建本轮需要的组合。

## 已有项目

读取实际 styles/components/components 的变体和使用情况；优先复用，不复制第二套组件库。用户明确要求换风格时才按 [风格适配](style-adaptation.md) 做局部覆盖。

## Token 使用

`canvas_template action="foundation"` 返回设备、预设和解析后的 token。页面和组件消费同一份最终 token；不要在每页重新发明颜色和尺寸。需要交付 token 时把结果写入 `canvas/design/resolved-tokens.json`，并注明来源与覆盖项。

## 完成

规范确定后，组件和页面都按它生成；用实际画布渲染核对，不只检查数值。
