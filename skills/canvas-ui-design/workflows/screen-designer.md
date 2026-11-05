# 页面与状态设计

读取页面范围、信息架构、Foundation/组件和参考材料，直接在画布生成原生节点。

## 选择起点

- 新移动页面：`canvas_template foundation` 获取当前设备/预设；用 `ios-form-screen`、`ios-list-screen`、`ios-detail-screen` 或 `ios-screen` 作为骨架，再用 `canvas_write`/`canvas_edit` 填真实内容。
- 简单局部页面：从现有 Frame/组件扩展，不重跑模板。
- 复杂页面/明显不同的状态：先确认或补齐参考；缺少参考时按 [参考落实](../references/reference-fidelity.md) 说明缺口，不足部分不要伪造。

## 页面结构

- 根 Frame 使用设备尺寸、圆角 0、完整不透明背景；不加手机外壳/圆角屏幕遮罩。
- 状态栏、导航栏、滚动内容、底部导航/操作、Home Indicator 分开；安全区只消费一次。
- 长内容用固定视口 + 自然高度内容/滚动表达，不把内容压缩进首屏。
- 同一主流程不混用设备规格；页面之间保持统一间距和命名。
- 文案以完成任务所需信息为主；不默认加副标题/口号/装饰性说明。

## 生成步骤

1. 用 `canvas_read` 确认当前页和已有组件。
2. 插入骨架后，用 `canvas_edit` 修改尺寸、布局、样式、文字和状态。
3. 重复元素抽成组件/实例；样式复用 styles，不逐节点重复硬编码颜色。
4. 有图片素材时接入 image fill，核对裁切和缩放。
5. 用 `canvas_audit` 检查，再实际查看画布/导出预览，修复截断、遮挡、溢出和明显风格偏差。

## 完成

本轮页面和适用状态完成、实际渲染核对后，交给 [设计审查](design-audit.md) 或 [开发交付](developer-handoff.md)。
