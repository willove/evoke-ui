# Col 栅格列

24 栅格的列容器，须配合 Row 使用：`span` 控制占比（0 时整列隐藏），`offset` 左侧空列，`push` / `pull` 以相对定位微调视觉位置（源码顺序不变）；`xs` ~ `xl` 提供响应式配置。列会自动从 Row 注入 `gutter` 并生成左右内边距，无需单独设置。

## 基础用法

`span` 为列在 24 格中的占比：4 x 6 均分一行，16 + 8 为常见的两栏比例。

<DemoBlock>
<ev-row>
  <ev-col :span="6"><div style="background:#eef3ff;border-radius:4px;padding:16px;">span 6</div></ev-col>
  <ev-col :span="6"><div style="background:#dce6ff;border-radius:4px;padding:16px;">span 6</div></ev-col>
  <ev-col :span="6"><div style="background:#eef3ff;border-radius:4px;padding:16px;">span 6</div></ev-col>
  <ev-col :span="6"><div style="background:#dce6ff;border-radius:4px;padding:16px;">span 6</div></ev-col>
</ev-row>
<div style="height:12px;"></div>
<ev-row>
  <ev-col :span="16"><div style="background:#eef3ff;border-radius:4px;padding:16px;">span 16</div></ev-col>
  <ev-col :span="8"><div style="background:#dce6ff;border-radius:4px;padding:16px;">span 8</div></ev-col>
</ev-row>
</DemoBlock>

## 混合比例分栏

同一行内 span 可以任意组合：4 + 8 + 12、6 + 18 等；常用布局如「窄标签 + 宽内容」「窄侧栏 + 宽主区」。

<DemoBlock>
<ev-row>
  <ev-col :span="4"><div style="background:#eef3ff;border-radius:4px;padding:16px;">span 4</div></ev-col>
  <ev-col :span="8"><div style="background:#dce6ff;border-radius:4px;padding:16px;">span 8</div></ev-col>
  <ev-col :span="12"><div style="background:#eef3ff;border-radius:4px;padding:16px;">span 12</div></ev-col>
</ev-row>
<div style="height:12px;"></div>
<ev-row>
  <ev-col :span="6"><div style="background:#dce6ff;border-radius:4px;padding:16px;">span 6</div></ev-col>
  <ev-col :span="18"><div style="background:#eef3ff;border-radius:4px;padding:16px;">span 18</div></ev-col>
</ev-row>
</DemoBlock>

## 偏移 offset

`offset` 以左边距空出对应栅格数，常用于居中表单、错位排版；偏移会占用行内空间，同行的 span + offset 总和不应超过 24。

<DemoBlock>
<ev-row>
  <ev-col :span="8"><div style="background:#eef3ff;border-radius:4px;padding:16px;">span 8</div></ev-col>
  <ev-col :span="8" :offset="8"><div style="background:#dce6ff;border-radius:4px;padding:16px;">span 8 offset 8</div></ev-col>
</ev-row>
<div style="height:12px;"></div>
<ev-row>
  <ev-col :span="8" :offset="8"><div style="background:#eef3ff;border-radius:4px;padding:16px;">居中的一列</div></ev-col>
</ev-row>
</DemoBlock>

## 排序 push / pull

`push` / `pull` 基于 relative 定位移位，可交换两列的视觉顺序而保持 DOM 顺序不变（利于 SEO 与无障碍阅读顺序）。

<DemoBlock>
<ev-row>
  <ev-col :span="6" :push="6"><div style="background:#eef3ff;border-radius:4px;padding:16px;">push 6</div></ev-col>
  <ev-col :span="6" :pull="6"><div style="background:#dce6ff;border-radius:4px;padding:16px;">pull 6</div></ev-col>
</ev-row>
</DemoBlock>

## 隐藏列

`span` 为 0 时列被渲染为 `display: none`，可用于按条件留空的占位列（与 `v-if` 直接移除相比，保留占位便于条件切换）。

<DemoBlock>
<ev-row>
  <ev-col :span="0"><div style="background:#eef3ff;border-radius:4px;padding:16px;">span 0 不可见</div></ev-col>
  <ev-col :span="12"><div style="background:#dce6ff;border-radius:4px;padding:16px;">span 12</div></ev-col>
  <ev-col :span="12"><div style="background:#eef3ff;border-radius:4px;padding:16px;">span 12</div></ev-col>
</ev-row>
</DemoBlock>

## 响应式

`xs`（<768px）/ `sm`（≥768px）/ `md`（≥992px）/ `lg`（≥1200px）/ `xl`（≥1920px）接受数字或 `{ span, offset, push, pull }` 对象。注意：当前实现只生成 `ev-col-{bp}-*` 类名，断点媒体查询样式未内置，需在业务侧补充同名规则，例如：

```css
@media (min-width: 992px) {
  .ev-col-md-8 { width: 33.33333333%; }
  .ev-col-md-8.ev-col-offset-2 { margin-left: 16.66666667%; }
}
```

<DemoBlock>
<ev-row :gutter="12">
  <ev-col :xs="24" :md="8"><div style="background:#eef3ff;border-radius:4px;padding:16px;">xs 24 / md 8</div></ev-col>
  <ev-col :xs="24" :md="8"><div style="background:#dce6ff;border-radius:4px;padding:16px;">xs 24 / md 8</div></ev-col>
  <ev-col :xs="24" :md="{ span: 8 }"><div style="background:#eef3ff;border-radius:4px;padding:16px;">对象写法 span 8</div></ev-col>
</ev-row>
</DemoBlock>

## API

<ApiTable title="Col Props" :rows="[
  { name: 'span', desc: '占据的栅格数（0~24，0 时隐藏）', type: 'number', default: '24' },
  { name: 'offset', desc: '左侧偏移栅格数', type: 'number', default: '0' },
  { name: 'push', desc: '右移栅格数（relative left）', type: 'number', default: '0' },
  { name: 'pull', desc: '左移栅格数（relative right）', type: 'number', default: '0' },
  { name: 'xs / sm / md / lg / xl', desc: '响应式配置（数字或 { span, offset, push, pull } 对象），仅生成 ev-col-{bp}-* 类名，断点样式未内置需自行补充', type: 'number | object', default: '—' },
  { name: 'tag', desc: '自定义元素标签', type: 'string', default: 'div' },
]" />

<ApiTable title="Col Slots" :rows="[
  { name: 'default', desc: '列内容', type: '—', default: '—' },
]" />
