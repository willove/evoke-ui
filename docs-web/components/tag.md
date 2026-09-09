# Tag 标签

`EwTag` 是胶囊形态的轻量标签，用来给内容打上状态、版本、促销等信息。它是官网里「最小的强调单元」：
默认 soft 淡底不抢戏，`lime` / `orange` 两个促销色调专门为定价与活动场景准备。

## 基础用法

<DemoBlock title="语义色调" description="neutral / primary / success / warning / danger / info 覆盖常规状态表达。">

<div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
  <EwTag>默认</EwTag>
  <EwTag tone="primary">开源</EwTag>
  <EwTag tone="success">稳定版</EwTag>
  <EwTag tone="warning">公测中</EwTag>
  <EwTag tone="danger">即将下线</EwTag>
  <EwTag tone="info">说明</EwTag>
</div>

```vue
<EwTag tone="primary">开源</EwTag>
<EwTag tone="success">稳定版</EwTag>
<EwTag tone="warning">公测中</EwTag>
```

</DemoBlock>

## 促销色调

<DemoBlock title="lime / orange" description="lime 黄绿实底在浅色页面与深色定价卡上都有足够对比，适合「立减」「最受欢迎」；orange 适合促销注记。">

<div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
  <EwTag tone="lime">立减 50%</EwTag>
  <EwTag tone="lime">最受欢迎</EwTag>
  <EwTag tone="orange">限时优惠</EwTag>
  <EwTag tone="orange">新用户专享</EwTag>
</div>

```vue
<EwTag tone="lime">立减 50%</EwTag>
<EwTag tone="orange">限时优惠</EwTag>
```

</DemoBlock>

## 三种形态与进阶

<DemoBlock title="variant / size / icon / closable">

<div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
  <EwTag variant="soft" tone="primary">Soft</EwTag>
  <EwTag variant="solid" tone="primary">Solid</EwTag>
  <EwTag variant="outline" tone="primary">Outline</EwTag>
  <EwTag size="small">small</EwTag>
  <EwTag tone="primary" icon="star">精选</EwTag>
  <EwTag tone="neutral" closable>可关闭</EwTag>
</div>

```vue
<EwTag variant="solid" tone="primary">Solid</EwTag>
<EwTag tone="primary" icon="star">精选</EwTag>
<EwTag tone="neutral" closable @close="onClose" />
```

</DemoBlock>

::: tip 与 EwBadge 的分工
`EwTag` 是独立存在的文本标签；附在图标按钮角上的数字/圆点用 [EwBadge](./badge)。
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
