# Divider 分割线

区隔内容的分割线，渲染为 `role="separator"` 的 div，支持水平 / 垂直方向与 solid / dashed / dotted / double / none 五种线型。水平方向提供默认插槽时，文案以绝对定位浮于线上（背景色遮线），上下留白由组件自带（`margin: 16px 0`）。

## 基础用法

默认居中插入文案；`content-position` 可切换 left / center / right。不提供默认插槽时渲染为纯线。

<DemoBlock>
<ev-divider>基础分割线</ev-divider>
<ev-divider content-position="left">左侧文案</ev-divider>
<ev-divider content-position="right">右侧文案</ev-divider>
<ev-divider />
</DemoBlock>

## 纯分割线分节内容

不带文案的水平线常用于段落、表单分组之间的视觉分隔。

<DemoBlock>
<ev-text>第一段说明文字：填写基础信息后继续往下滚动。</ev-text>
<ev-divider />
<ev-text>第二段说明文字：这里的分割线不携带文案。</ev-text>
</DemoBlock>

## 线型

`border-style` 支持 solid（默认）/ dashed / dotted / double / none（none 隐藏线条，仅保留文案，可当纯标题用）。

<DemoBlock>
<ev-divider border-style="dashed">虚线分割</ev-divider>
<ev-divider border-style="dotted">点线分割</ev-divider>
<ev-divider border-style="double">双线分割</ev-divider>
</DemoBlock>

## 垂直分割线

`direction` 为 vertical 时渲染 1px 竖线（高度 1em、垂直居中），常用于按钮组、工具条中的行内分隔。

<DemoBlock>
<div style="display:flex;align-items:center;">
  <ev-button size="small">上一页</ev-button>
  <ev-divider direction="vertical" />
  <ev-button size="small">下一页</ev-button>
  <ev-divider direction="vertical" />
  <ev-button size="small">刷新</ev-button>
</div>
</DemoBlock>

## 垂直分割线的线型

垂直方向同样支持 dashed / dotted 线型，与行内元素混排时保持对齐。

<DemoBlock>
<div style="display:flex;align-items:center;">
  <ev-text>列表</ev-text>
  <ev-divider direction="vertical" />
  <ev-text>看板</ev-text>
  <ev-divider direction="vertical" border-style="dashed" />
  <ev-text>日历</ev-text>
  <ev-divider direction="vertical" border-style="dotted" />
  <ev-text>更多</ev-text>
</div>
</DemoBlock>

## 组合场景：设置表单分组

左侧文案分割线 + 垂直分割线组合出常见的设置页结构：分区标题、字段行内分隔。

<DemoBlock>
<ev-divider content-position="left">基础设置</ev-divider>
<ev-space direction="vertical" size="default" style="margin-bottom:8px;">
  <ev-space size="default"><ev-text style="width:72px;">系统名称</ev-text><ev-input model-value="运营后台" style="width:220px;" /></ev-space>
  <ev-space size="default"><ev-text style="width:72px;">负责人</ev-text><ev-input model-value="张三" style="width:220px;" /></ev-space>
</ev-space>
<ev-divider content-position="left" border-style="dashed">通知设置</ev-divider>
<ev-space size="default">
  <ev-switch :model-value="true" />
  <ev-text>邮件通知</ev-text>
  <ev-divider direction="vertical" />
  <ev-switch :model-value="false" />
  <ev-text>短信通知</ev-text>
</ev-space>
</DemoBlock>

## 使用提示

- 水平分割线自带上下 `margin: 16px 0`，文案区域以 `--ev-bg-color` 背景遮线，放在非纯背景容器上时请同步调整该背景。
- 文案是否渲染取决于是否有默认插槽（`v-if` 的插槽判定），传空字符串不等于无插槽，请直接不写插槽内容。
- 垂直分割线高度为 1em 并垂直居中，外层容器建议 `display: flex; align-items: center`。

## API

<ApiTable title="Divider Props" :rows="[
  { name: 'direction', desc: '分割线方向', type: 'horizontal | vertical', default: 'horizontal' },
  { name: 'border-style', desc: '线型，none 时隐藏线条仅保留文案', type: 'solid | dashed | dotted | double | none', default: 'solid' },
  { name: 'content-position', desc: '文案位置，仅水平方向且有默认插槽内容时生效', type: 'left | center | right', default: 'center' },
]" />

<ApiTable title="Divider Slots" :rows="[
  { name: 'default', desc: '自定义文案，仅 direction 为 horizontal 时渲染（无插槽时为纯线）', type: '—', default: '—' },
]" />
