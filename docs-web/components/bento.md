# Bento 图文组合分区

`EvBento` 是产品特性页的 Bento 卡片栅格：一张网格里混合大小卡片，每张卡图文组合——
标题、描述与产品图自动排版。卡片用 `span` 跨列、`rows` 跨行，`dense` 可自动回填空隙；
超出列数或窄屏时自动回落为整行，无需手工干预。

卡片默认无边框纯色面，`bordered` 可加边框；`tone` 提供 `soft` 淡底、`primary`
主色、`dark` 深色卡面。

## 基础用法

<DemoBlock title="图文卡片组合" description="跨列与常规卡混排：大卡讲主打特性，小卡补短信息；卡片内图文上下结构，图片自动圆角。">

<EvBento
  :columns="3"
  :items="[
    { eyebrow: '影像', title: '一亿像素主摄', desc: '暗光更纯净，细节经得起放大', image: '/images/glass-forest.jpg', span: 2 },
    { title: '全身只有 6.9mm', desc: '轻薄与坚固兼得' },
    { title: '两天一充', desc: '5000mAh 长续航', image: '/images/glass-ridge.jpg' },
    { title: '双频卫星通信', desc: '无信号也能报平安', tone: 'dark' },
    { eyebrow: '性能', title: '新一代 3nm 芯片', desc: '能效比再上一个大台阶', tone: 'primary', span: 2 },
  ]"
/>

```vue
<EvBento
  :columns="3"
  :items="[
    { eyebrow: '影像', title: '一亿像素主摄', image: '/a.jpg', span: 2 },
    { title: '全身只有 6.9mm', desc: '轻薄与坚固兼得' },
    { title: '双频卫星通信', tone: 'dark' },
  ]"
/>
```

</DemoBlock>

## 铺满图与整行卡

<DemoBlock title="fill 铺图卡与跨行" description="imagePos: 'fill' 让图片铺满整卡、文字叠于图上（配 dark 语气保证可读）；rows 跨行使同一张卡纵向占多格。">

<EvBento
  :columns="3"
  :items="[
    { eyebrow: '影像', title: '光学全焦段', desc: '从超广角到潜望长焦', image: '/images/glass-ridge.jpg', imagePos: 'fill', tone: 'dark', rows: 2 },
    { title: 'IP68 防尘防水', desc: '意外面前更从容', bordered: true },
    { title: '四色可选', desc: '山野绿 / 月岩灰 / 远峰蓝 / 曜石黑', tone: 'soft' },
    { title: '一声召唤，跨设备接力', desc: '手机、平板与电脑无缝流转', span: 2, tone: 'primary' },
  ]"
/>

```vue
<EvBento
  :columns="3"
  :items="[
    { title: '铺图卡', image: '/a.jpg', imagePos: 'fill', tone: 'dark', rows: 2 },
    { title: '跨列卡', span: 2, tone: 'primary' },
  ]"
/>
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| items | 卡片数据，见下 | array | `[]` |
| columns | 列数 | number | `3` |
| bordered | 卡片加边框 | boolean | `false` |
| dense | 自动回填跨列留下的空隙 | boolean | `false` |
| gap | 卡片间距 | number / string | `16` |

**items 字段**：

| 字段 | 说明 | 类型 |
| --- | --- | --- |
| eyebrow | 卡顶小眉题 | string |
| title / desc | 标题与描述 | string |
| image | 图片地址 | string |
| imagePos | 图位置：`bottom` / `top` / `fill`（整卡铺图，文字叠上） | string |
| span | 跨列数（超出列数自动回落为整行） | number |
| rows | 跨行数 | number |
| tone | 卡面：`plain` / `soft` / `primary` / `dark` | string |
| href | 卡片链接（渲染为整卡可点） | string |

### 插槽

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| item | 接管卡片内容 | `{ item, index }` |

### CSS 变量

| 变量 | 说明 |
| --- | --- |
| `--ev-bento-columns` | 列数 |
| `--ev-bento-gap` | 卡片间距 |
