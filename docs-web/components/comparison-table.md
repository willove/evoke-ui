# ComparisonTable 对比表

`EvComparisonTable` 展示多档位间的功能差异，是定价区的标配补充：定价卡讲亮点，对比表讲全量。
单元格接受布尔与文本——`true` 渲染主色对勾，`false` 渲染安静破折号，字符串直出；
`featured` 列整列淡主色底以突出主推档位。

## 基础用法

<DemoBlock title="三档对比" description="窄容器自动横向滚动，min-width 保证移动端可读。">

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

## 功能说明

<DemoBlock title="行描述" description="功能项可带二级说明，帮助访客理解术语。">

<EvComparisonTable
  :columns="[{ label: '免费版' }, { label: '专业版', featured: true }]"
  :rows="[
    { label: '版本历史', description: '保留文档的历史版本并可随时回滚', values: [false, true] },
    { label: '优先支持', description: '工单 24 小时内响应', values: [false, true] },
  ]"
/>

```vue
<EvComparisonTable
  :rows="[{ label: '版本历史', description: '保留文档历史版本', values: [false, true] }]"
/>
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| columns | 列定义 `[{ label, note?, featured? }]` | array | `[]` |
| rows | 行定义 `[{ label, description?, values: (boolean\|string)[] }]`，values 顺序对应 columns | array | `[]` |
| feature-head | 功能列表头文案 | string | `'功能'` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| feature-head | 功能列表头覆写 |
