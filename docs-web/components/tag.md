# Tag 标签

`EvTag` 是胶囊形态的轻量标签，用来给内容打上状态、版本、促销等信息。它是官网里「最小的强调单元」：
默认 soft 淡底不抢戏，`lime` / `orange` 两个促销色调专门为定价与活动场景准备。

## 基础用法

<DemoBlock title="语义色调" description="neutral / primary / success / warning / danger / info 覆盖常规状态表达。">

<div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
  <EvTag>默认</EvTag>
  <EvTag tone="primary">开源</EvTag>
  <EvTag tone="success">稳定版</EvTag>
  <EvTag tone="warning">公测中</EvTag>
  <EvTag tone="danger">即将下线</EvTag>
  <EvTag tone="info">说明</EvTag>
</div>

```vue
<EvTag tone="primary">开源</EvTag>
<EvTag tone="success">稳定版</EvTag>
<EvTag tone="warning">公测中</EvTag>
```

</DemoBlock>

## 促销色调

<DemoBlock title="lime / orange" description="lime 黄绿实底在浅色页面与深色定价卡上都有足够对比，适合「立减」「最受欢迎」；orange 适合促销注记。">

<div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
  <EvTag tone="lime">立减 50%</EvTag>
  <EvTag tone="lime">最受欢迎</EvTag>
  <EvTag tone="orange">限时优惠</EvTag>
  <EvTag tone="orange">新用户专享</EvTag>
</div>

```vue
<EvTag tone="lime">立减 50%</EvTag>
<EvTag tone="orange">限时优惠</EvTag>
```

</DemoBlock>

## 三种形态与进阶

<DemoBlock title="variant / size / icon / closable">

<div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
  <EvTag variant="soft" tone="primary">Soft</EvTag>
  <EvTag variant="solid" tone="primary">Solid</EvTag>
  <EvTag variant="outline" tone="primary">Outline</EvTag>
  <EvTag size="small">small</EvTag>
  <EvTag tone="primary" icon="star">精选</EvTag>
  <EvTag tone="neutral" closable>可关闭</EvTag>
</div>

```vue
<EvTag variant="solid" tone="primary">Solid</EvTag>
<EvTag tone="primary" icon="star">精选</EvTag>
<EvTag tone="neutral" closable @close="onClose" />
```

</DemoBlock>

::: tip 与 EvBadge 的分工
`EvTag` 是独立存在的文本标签；附在图标按钮角上的数字/圆点用 [EvBadge](./badge)。
:::

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| tone | 色调 | `'neutral' \| 'primary' \| 'success' \| 'warning' \| 'danger' \| 'info' \| 'lime' \| 'orange'` | `'neutral'` |
| variant | 形态 | `'soft' \| 'solid' \| 'outline'` | `'soft'` |
| size | 尺寸 | `'small' \| 'default' \| 'large'` | `'default'` |
| icon | 图标名 | string | — |
| closable | 可关闭 | boolean | `false` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| default | 标签内容 |

### 事件

| 事件 | 说明 |
| --- | --- |
| close | 点击关闭钮时派发 |
