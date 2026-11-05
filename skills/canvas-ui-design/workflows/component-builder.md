# 组件构建

读取现有 components、variant sets、styles 和本轮页面需求；优先复用已有实例。

## 创建什么

只创建本轮需要的 Button、Input、Card/List、导航、Dialog/Sheet 等。不要预建全量控件库，也不要为每个页面复制一套同名组件。

- Button：variant（primary/secondary/outline/text）× size（small/medium/large）× state（default/pressed/focused/disabled/loading）。按实际用途保留需要的组合。
- Input：label、value、help/error、focus、disabled；错误状态不能只靠颜色。
- Card/List：内容层级清楚，可操作项有明确交互反馈。
- Dialog/Sheet：定义关闭、取消、确认和危险操作。
- 图标：用 frame/rect/ellipse/line/text 组合；复杂插画/照片用图片素材，不伪造 SVG 路径。

## 用 canvas 组件

1. 选中可用 Frame 后用 `canvas_edit` 的组件能力或画布 UI 创建组件；保留一个母版。
2. 页面使用 instance，不重复创建同构 Frame。
3. 组件变体用 variant props 表达，实例只覆盖内容/颜色/可见性，不复制结构。
4. 需要图标/图片时按 [素材](assets.md) 处理；图标本体与外层触控容器分开。

## 核对

- 母版本身独立可用，不依赖页面被拉宽；
- 用真实文案和较长标签检查换行、内边距、图标位置；
- 触控目标至少 44×44（iOS）；
- 共享组件修改先确认引用范围，局部页面用局部覆盖；
- 实例的宽高、padding、状态实际渲染要检查，不能只看节点存在。

## 完成

本轮页面所需的组件母版/实例稳定后，进入 [页面设计](screen-designer.md)。
