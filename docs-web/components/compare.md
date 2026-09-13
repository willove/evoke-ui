# Compare 方案对比

`EvCompare` 是产品方案对比表：列是产品，列头带产品图、配色点、徽标、名称、一句话与价格；
行按特性分组，单元格支持对勾、破折号、文本与多行文本。参考 compare 页语言，
产品线的差异在一屏内讲完。

默认无边框（组间与表头细分隔线），`bordered` 可切换为网格边框形态。

## 基础用法

<DemoBlock title="三款机型对比" description="列头自上而下：产品图、配色点、徽标、名称、一句话与价格；特性按分组陈列，无该特性的格子显示破折号。">

<EvCompare
  :products="[
    { name: 'Aurora Air', tagline: '轻装上阵，随身携带', price: '¥6,999', priceNote: '起', colors: ['#d8dde6', '#2c3b55'] },
    { name: 'Aurora Pro', tagline: '主力机型，性能全面', price: '¥8,999', priceNote: '起', badge: '新款', colors: ['#8a96c8', '#e6e8ef', '#1c2431'], href: '#pro' },
    { name: 'Aurora Ultra', tagline: '把性能做到顶', price: '¥12,999', priceNote: '起', colors: ['#3c4a63'] },
  ]"
  :groups="[
    {
      title: '显示屏',
      rows: [
        { label: '尺寸', values: ['13.6 英寸', '14.2 英寸', '16.2 英寸'] },
        { label: '高刷新率', values: [false, true, true] },
        { label: '原彩显示', values: [true, true, true] },
      ],
    },
    {
      title: '续航与充电',
      rows: [
        { label: '视频播放', values: [['15 小时', '节能模式最长 18 小时'], '17 小时', '21 小时'], note: '实验室数据' },
        { label: '快充', values: ['30W', '96W', '140W'] },
      ],
    },
  ]"
/>

```vue
<EvCompare
  :products="[
    { name: 'Aurora Air', price: '¥6,999', priceNote: '起', colors: ['#d8dde6', '#2c3b55'] },
    { name: 'Aurora Pro', price: '¥8,999', priceNote: '起', badge: '新款', href: '#pro' },
    { name: 'Aurora Ultra', price: '¥12,999', priceNote: '起' },
  ]"
  :groups="[
    {
      title: '显示屏',
      rows: [{ label: '高刷新率', values: [false, true, true] }],
    },
  ]"
/>
```

</DemoBlock>

## 带边框形态

<DemoBlock title="bordered 网格边框" description="信息密度高的长表用边框划分单元格，阅读视线更稳；默认的无边框形态更适合短表。">

<EvCompare
  bordered
  :products="[
    { name: '云桌面 标准版', price: '¥29', priceNote: '/人/月' },
    { name: '云桌面 专业版', price: '¥59', priceNote: '/人/月', badge: '推荐' },
  ]"
  :groups="[
    {
      title: '协作能力',
      rows: [
        { label: '共享桌面', values: [true, true] },
        { label: '协同批注', values: [false, true] },
        { label: '专属加速线路', values: [false, true] },
      ],
    },
    {
      title: '安全保障',
      rows: [
        { label: '传输加密', values: [true, true] },
        { label: '水印管控', values: [false, true] },
      ],
    },
  ]"
/>

```vue
<EvCompare bordered :products="…" :groups="…" />
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| products | 产品列：`name` / `tagline` / `price` / `priceNote` / `badge` / `image` / `colors`（配色点色值数组）/ `href` | array | `[]` |
| groups | 特性分组：`{ title, rows }`，行含 `label` / `note` / `values` | array | `[]` |
| bordered | 网格边框形态 | boolean | `false` |

`values` 的取值语义与 [ComparisonTable](/components/comparison-table) 一致：
`true` 渲染主色对勾，`false` 或空渲染破折号，字符串直出，**字符串数组渲染为多行文本**
（适合一格讲多层信息）。

### 插槽

| 插槽 | 说明 |
| --- | --- |
| lead | 表头首格（默认空），可放「型号 / 规格对比」等引导词 |

窄屏下表格自动横向滚动，列宽按产品数撑最小宽度，不会挤压换行。
