# Row 栅格行

24 栅格系统的行容器（flex + wrap 实现），与 Col 搭配使用。`gutter` 通过 provide 下发给 Col，由 Col 生成左右内边距，Row 自身以等值负外边距补偿，保证首尾列与页面边缘对齐；行默认渲染为 `div`（`tag` 可更换）。单一 Row 内所有列的 span 总和超过 24 时会自动换行。

## 基础用法

`span` 相加等于 24 即占满一行；列数与 span 可自由组合（3 x 8、2 x 12 等）。

<DemoBlock>
<eb-row>
  <eb-col :span="8"><div style="background:#eef3ff;border-radius:4px;padding:16px;">span 8</div></eb-col>
  <eb-col :span="8"><div style="background:#dce6ff;border-radius:4px;padding:16px;">span 8</div></eb-col>
  <eb-col :span="8"><div style="background:#eef3ff;border-radius:4px;padding:16px;">span 8</div></eb-col>
</eb-row>
<div style="height:12px;"></div>
<eb-row>
  <eb-col :span="12"><div style="background:#dce6ff;border-radius:4px;padding:16px;">span 12</div></eb-col>
  <eb-col :span="12"><div style="background:#eef3ff;border-radius:4px;padding:16px;">span 12</div></eb-col>
</eb-row>
</DemoBlock>

## 栅格间隔

`gutter` 为列间距（px），Col 左右各取一半内边距，Row 用负外边距补偿；视觉上列内容之间的间隔即 gutter 值。

<DemoBlock>
<eb-row :gutter="16">
  <eb-col :span="6"><div style="background:#eef3ff;border-radius:4px;padding:16px;">span 6</div></eb-col>
  <eb-col :span="6"><div style="background:#dce6ff;border-radius:4px;padding:16px;">span 6</div></eb-col>
  <eb-col :span="6"><div style="background:#eef3ff;border-radius:4px;padding:16px;">span 6</div></eb-col>
  <eb-col :span="6"><div style="background:#dce6ff;border-radius:4px;padding:16px;">span 6</div></eb-col>
</eb-row>
</DemoBlock>

## 水平排列 justify

`justify` 控制主轴分布：start / end / center / space-around / space-between / space-evenly；列未占满 24 格时效果明显。

<DemoBlock>
<eb-row justify="center">
  <eb-col :span="4"><div style="background:#eef3ff;border-radius:4px;padding:12px;">center</div></eb-col>
  <eb-col :span="4"><div style="background:#dce6ff;border-radius:4px;padding:12px;">center</div></eb-col>
</eb-row>
<div style="height:12px;"></div>
<eb-row justify="space-between">
  <eb-col :span="4"><div style="background:#eef3ff;border-radius:4px;padding:12px;">space-between</div></eb-col>
  <eb-col :span="4"><div style="background:#dce6ff;border-radius:4px;padding:12px;">space-between</div></eb-col>
</eb-row>
<div style="height:12px;"></div>
<eb-row justify="end">
  <eb-col :span="4"><div style="background:#eef3ff;border-radius:4px;padding:12px;">end</div></eb-col>
  <eb-col :span="4"><div style="background:#dce6ff;border-radius:4px;padding:12px;">end</div></eb-col>
</eb-row>
</DemoBlock>

## 垂直对齐 align

`align` 控制交叉轴对齐：top / middle / bottom；同一行内列高度不一致时差异最明显。

<DemoBlock>
<eb-row align="middle" style="margin-bottom:12px;">
  <eb-col :span="6"><div style="background:#eef3ff;border-radius:4px;padding:12px;">middle</div></eb-col>
  <eb-col :span="6"><div style="background:#dce6ff;border-radius:4px;padding:28px 12px;">middle 较高</div></eb-col>
</eb-row>
<eb-row align="bottom">
  <eb-col :span="6"><div style="background:#eef3ff;border-radius:4px;padding:12px;">bottom</div></eb-col>
  <eb-col :span="6"><div style="background:#dce6ff;border-radius:4px;padding:28px 12px;">bottom 较高</div></eb-col>
</eb-row>
</DemoBlock>

## 组合场景：等距卡片列表

gutter 提供列间距，Col 内放置任意内容（这里用 EbCard），是最常见的后台仪表盘排版方式。

<DemoBlock>
<eb-row :gutter="16">
  <eb-col :span="8">
    <eb-card header="待办事项">
      <eb-tag type="warning">12 项待处理</eb-tag>
    </eb-card>
  </eb-col>
  <eb-col :span="8">
    <eb-card header="项目进度">
      <eb-tag type="success">按期推进</eb-tag>
    </eb-card>
  </eb-col>
  <eb-col :span="8">
    <eb-card header="成员动态">
      <eb-tag type="primary">3 人在线</eb-tag>
    </eb-card>
  </eb-col>
</eb-row>
</DemoBlock>

## API

<ApiTable title="Row Props" :rows="[
  { name: 'gutter', desc: '栅格间隔（px），通过 provide 下发 Col 生成左右内边距，自身以负外边距补偿', type: 'number', default: '0' },
  { name: 'justify', desc: '水平排列方式', type: 'start | end | center | space-around | space-between | space-evenly', default: 'start' },
  { name: 'align', desc: '垂直对齐方式', type: 'top | middle | bottom', default: 'top' },
  { name: 'tag', desc: '自定义元素标签', type: 'string', default: 'div' },
]" />

<ApiTable title="Row Slots" :rows="[
  { name: 'default', desc: '行内容，一般为 EbCol 列表', type: '—', default: '—' },
]" />
