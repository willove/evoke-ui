# Space 间距

间距组件：基于 CSS gap 为子元素插入统一间隔，避免逐个写 margin。默认插槽的子节点会被平铺并各自包裹为独立 item（跳过注释与空白文本节点，Fragment 也会展开），因此 v-for 生成的元素同样生效。容器默认 `inline-flex`，`fill` 时变为块级 flex。

## 基础用法

相邻按钮之间自动插入默认间距（small = 8px）。

<DemoBlock>
<eb-space>
  <eb-button>按钮一</eb-button>
  <eb-button>按钮二</eb-button>
  <eb-button>按钮三</eb-button>
</eb-space>
</DemoBlock>

## 间距尺寸

`size` 支持枚举（small = 8px / default = 12px / large = 16px）、数字（px）与 `[水平, 垂直]` 数组，可精确控制两个方向的不同间距。

<DemoBlock>
<eb-space size="small" style="margin-right:24px;">
  <eb-button>small 8px</eb-button>
  <eb-button>small 8px</eb-button>
</eb-space>
<eb-space size="default" style="margin-right:24px;">
  <eb-button>default 12px</eb-button>
  <eb-button>default 12px</eb-button>
</eb-space>
<eb-space size="large" style="margin-right:24px;">
  <eb-button>large 16px</eb-button>
  <eb-button>large 16px</eb-button>
</eb-space>
<eb-space :size="28" style="margin-right:24px;">
  <eb-button>数字 28px</eb-button>
  <eb-button>数字 28px</eb-button>
</eb-space>
<eb-space :size="[32, 8]">
  <eb-tag>水平 32px</eb-tag>
  <eb-tag>水平 32px</eb-tag>
  <eb-tag>水平 32px</eb-tag>
</eb-space>
</DemoBlock>

## 垂直排列

`direction` 为 vertical 时改为纵向排布，适合表单行、列表项之间的间隔。

<DemoBlock>
<eb-space direction="vertical" size="large">
  <eb-button>第一行</eb-button>
  <eb-button>第二行</eb-button>
  <eb-button>第三行</eb-button>
</eb-space>
</DemoBlock>

## 自动换行

`wrap` 开启 flex 换行，子项数量多或宽度不定时（如标签组、筛选条件）避免溢出。

<DemoBlock>
<eb-space wrap size="default" style="max-width:340px;">
  <eb-tag v-for="word in ['全部', '进行中', '已完结', '已归档', '草稿', '回收站', '已逾期']" :key="word" type="primary">{{ word }}</eb-tag>
</eb-space>
</DemoBlock>

## 对齐方式

`alignment` 设置交叉轴对齐：start / end / center / baseline；行内混排图标、文本、按钮等不同高度元素时用于统一基线。

<DemoBlock>
<eb-space alignment="center" size="default" style="margin-bottom:12px;">
  <eb-avatar size="36">W</eb-avatar>
  <eb-text>垂直居中对齐的文本</eb-text>
  <eb-tag type="success">在线</eb-tag>
</eb-space>
<eb-space alignment="baseline" size="default">
  <eb-text size="large">大号标题</eb-text>
  <eb-text size="small">与基线对齐的小字说明</eb-text>
</eb-space>
</DemoBlock>

## 撑满容器

`fill` 让每个子项 `flex: 1` 平分剩余空间（容器变为块级 flex），适合按钮组、分段操作条铺满整行。

<DemoBlock>
<eb-space fill style="width:360px;">
  <eb-button style="width:100%;">左</eb-button>
  <eb-button style="width:100%;">中</eb-button>
  <eb-button style="width:100%;">右</eb-button>
</eb-space>
</DemoBlock>

## API

<ApiTable title="Space Props" :rows="[
  { name: 'size', desc: '间距大小：枚举 small（8px）/ default（12px）/ large（16px），数字 px，或 [水平, 垂直] 数组', type: 'number | string | array', default: 'small' },
  { name: 'direction', desc: '排列方向', type: 'horizontal | vertical', default: 'horizontal' },
  { name: 'wrap', desc: '开启换行（flex-wrap）', type: 'boolean', default: 'false' },
  { name: 'alignment', desc: '交叉轴对齐方式，不设置则由 CSS 默认决定', type: 'start | end | center | baseline', default: '—' },
  { name: 'fill', desc: '子项 flex 撑满剩余空间（容器由 inline-flex 变为 flex）', type: 'boolean', default: 'false' },
]" />

<ApiTable title="Space Slots" :rows="[
  { name: 'default', desc: '子内容，Fragment 会平铺后逐个包裹为 item（跳过注释与空白文本）；spacer 分隔符尚未支持', type: '—', default: '—' },
]" />
