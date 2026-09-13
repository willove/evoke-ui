# ComparisonTable 对比表

`EvComparisonTable` 展示多档位/多产品间的差异，一套组件两种用法：**定价档位对照**
（定价区标配，列头是档位名 + 价格注释）与**产品方案 compare**（列头带产品图、配色点、
徽标、一句话与价格，特性按分组陈列）。

内部以 CSS Grid 实现（非 `<table>`）：无斑马纹、无悬浮变色，`featured` 高亮列不受
任何交互态干扰；默认无边框的现代形态（行分隔线 + 组标题分节），`bordered` 可切换
网格边框。表格整体居中呈现，单元格 `true` 对勾、`false` 破折号、字符串直出、
**字符串数组多行**；窄容器自动横向滚动，不会撑破页面。

## 基础用法

<DemoBlock title="三档对比" description="基础用法：列头档位名 + 价格注释，featured 列突出主推档位。">

<EvComparisonTable
  :columns="[
    { label: '免费版' },
    { label: '专业版', note: '¥12/月', featured: true },
    { label: '团队版', note: '¥28/月' },
  ]"
  :rows="[
    { label: '基础编辑器', values: [true, true, true] },
    { label: '离线同步', values: [false, true, true] },
    { label: '存储空间', values: ['2 GB', '100 GB', '1 TB'] },
    { label: '权限管理', values: [false, false, true] },
  ]"
/>

```vue
<EvComparisonTable
  :columns="[{ label: '免费版' }, { label: '专业版', featured: true }]"
  :rows="[{ label: '离线同步', values: [false, true] }]"
/>
```

</DemoBlock>

## 产品方案 compare

<DemoBlock title="三款机型对比" description="compare 形态：列头自上而下为产品图、配色点、徽标、名称、一句话与价格；特性按分组陈列，无该特性的格子显示破折号，数组值渲染为多行文本。">

<EvComparisonTable
  :columns="[
    { label: 'Aurora Air', tagline: '轻装上阵，随身携带', price: '¥6,999', priceNote: '起', colors: ['#d8dde6', '#2c3b55'] },
    { label: 'Aurora Pro', tagline: '主力机型，性能全面', price: '¥8,999', priceNote: '起', badge: '新款', colors: ['#8a96c8', '#e6e8ef', '#1c2431'], href: '#pro' },
    { label: 'Aurora Ultra', tagline: '把性能做到顶', price: '¥12,999', priceNote: '起', colors: ['#3c4a63'] },
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
<EvComparisonTable
  :columns="[
    { label: 'Aurora Pro', tagline: '主力机型', badge: '新款', price: '¥8,999', priceNote: '起' },
  ]"
  :groups="[
    { title: '显示屏', rows: [{ label: '高刷新率', values: [true] }] },
  ]"
/>
```

</DemoBlock>

## 带边框形态

<DemoBlock title="bordered 网格边框" description="信息密度高的长表可以加网格边框划分单元格，阅读视线更稳；默认的无边框形态更适合官网展示。">

<EvComparisonTable
  bordered
  :columns="[
    { label: '云桌面 标准版', note: '¥29/人/月' },
    { label: '云桌面 专业版', note: '¥59/人/月' },
  ]"
  :rows="[
    { label: '共享桌面', values: [true, true] },
    { label: '协同批注', values: [false, true] },
    { label: '水印管控', values: [false, true] },
  ]"
/>

```vue
<EvComparisonTable bordered :columns="…" :rows="…" />
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| columns | 产品/档位列，见下 | array | `[]` |
| rows | 平铺行（简单对照） | array | `[]` |
| groups | 分组行（compare 形态）：`{ title, rows }` | array | `[]` |
| feature-head | 首列表头文案 | string | `功能` |
| bordered | 网格边框形态 | boolean | `false` |

**columns 字段**：

| 字段 | 说明 | 类型 |
| --- | --- | --- |
| label | 名称（可挂 `href` 链接） | string |
| note | 次要说明（价格周期等） | string |
| featured | 整列淡主色底突出 | boolean |
| image | 产品图 | string |
| colors | 配色点色值数组 | string[] |
| badge | 徽标（新款 / 推荐） | string |
| tagline | 一句话描述 | string |
| price / priceNote | 价格与说明 | string |

**rows 字段**：`label` / `description` / `values`；`values[j]` 与 columns 对齐——
`true` 对勾、`false` 破折号、字符串直出、字符串数组多行。`groups` 中的行同构。

### 插槽

| 插槽 | 说明 |
| --- | --- |
| feature-head | 首列表头覆写 |

窄屏或窄容器下表格自动横向滚动，列宽按产品数撑最小宽度，不会挤压换行。
