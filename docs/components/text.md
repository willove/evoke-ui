# Text 文本

基础文本排版组件：`type` 提供语义配色，`size` 控制字号，`truncated` 单行省略，`tag` 可指定渲染的 HTML 标签（默认 span）。渲染为 `inline-flex`（`truncated` 时变为 `inline-block`），可与图标等行内元素混排。

## 基础用法

`type` 决定文字颜色：default 常规色（默认）、primary / success / warning / danger 对应语义色、info 为次要灰；`error` 是 danger 的别名。

<DemoBlock>
  <eb-space direction="vertical" size="small">
    <eb-space size="small">
      <eb-text>默认文本</eb-text>
      <eb-text type="primary">主要文本</eb-text>
      <eb-text type="success">成功文本</eb-text>
      <eb-text type="warning">警告文本</eb-text>
      <eb-text type="danger">危险文本</eb-text>
      <eb-text type="info">次要文本</eb-text>
    </eb-space>
    <eb-text type="error">error 等同于 danger</eb-text>
  </eb-space>
</DemoBlock>

## 尺寸

`size` 提供 large / default / small 三档字号，常与标题、正文、辅助说明的层级搭配。

<DemoBlock>
  <eb-space direction="vertical" size="small">
    <eb-text size="large">大号文本</eb-text>
    <eb-text>默认文本</eb-text>
    <eb-text size="small">小号文本</eb-text>
  </eb-space>
</DemoBlock>

## 单行截断

`truncated` 开启后超出容器宽度自动省略（overflow + ellipsis）；需配合固定宽度或受父容器约束使用，可再加 `title` 属性让悬浮可见全文。

<DemoBlock>
  <div style="max-width:280px;">
    <eb-text truncated title="悬浮可见完整内容" style="width:100%;">超过容器宽度时自动单行省略的超长文本示例</eb-text>
    <eb-text truncated style="width:200px;display:block;">固定 200px 宽度的另一条长文本，同样会省略</eb-text>
  </div>
</DemoBlock>

## 自定义标签

`tag` 更换渲染元素：块级排版用 div / p，表单标注用 label 等；语义不变，仅影响 DOM 结构与默认样式。

<DemoBlock>
  <div>
    <eb-text tag="div" size="large">div 渲染的块级标题</eb-text>
    <eb-text tag="p" type="info">p 渲染的段落，独占一行，适合正文排版。</eb-text>
    <eb-text tag="label" style="margin-bottom:4px;">label 渲染的表单标注</eb-text>
    <eb-input model-value="静态展示" style="width:220px;" />
  </div>
</DemoBlock>

## 与图标混排

eb-text 渲染为 inline-flex 且 `align-items: center`，内部可与 eb-icon 等行内元素直接混排，图标颜色自动跟随文字色。

<DemoBlock>
  <eb-space direction="vertical" size="small">
    <eb-text type="success"><eb-icon name="circle-check" /> 校验通过，可以提交</eb-text>
    <eb-text type="warning"><eb-icon name="warning" /> 存在 2 项待确认的变更</eb-text>
    <eb-text type="info"><eb-icon name="info-filled" /> 该配置对所有环境生效</eb-text>
  </eb-space>
</DemoBlock>

## 组合场景：详情描述排版

size 层级 + 语义色 + truncated 组合出紧凑的详情区块；与 Divider、Tag、Space 搭配即可覆盖大部分信息展示需求。

<DemoBlock>
  <eb-space direction="vertical" size="small" style="max-width:420px;">
    <eb-space alignment="baseline" size="small">
      <eb-text tag="div" size="large">订单 A-1001</eb-text>
      <eb-tag type="success">已支付</eb-tag>
    </eb-space>
    <eb-divider />
    <eb-space size="large">
      <eb-text type="info">下单人</eb-text>
      <eb-text>张三（销售部）</eb-text>
      <eb-text type="info">金额</eb-text>
      <eb-text type="danger">9900.00</eb-text>
    </eb-space>
    <eb-text truncated title="备注全文" style="width:100%;">备注：客户要求本周内完成部署并安排一次线上培训。</eb-text>
  </eb-space>
</DemoBlock>

## API

<ApiTable title="Text Props" :rows="[
  { name: 'type', desc: '语义色（error 等同 danger）', type: 'primary | success | warning | info | danger | error | default', default: 'default' },
  { name: 'size', desc: '字号', type: 'large | default | small', default: 'default' },
  { name: 'truncated', desc: '单行截断省略（渲染为 inline-block 并限制最大宽度 100%）', type: 'boolean', default: 'false' },
  { name: 'tag', desc: '渲染的 HTML 标签', type: 'string', default: 'span' },
]" />

<ApiTable title="Text Slots" :rows="[
  { name: 'default', desc: '文本内容', type: '—', default: '—' },
]" />
