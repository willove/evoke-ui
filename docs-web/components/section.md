# Section 区块

`EwSection` 定义官网的区块头：「大写眉题 + 细字重大标题 + 描述」。它统一了页面的区块节奏——
眉题小而安静（大写字距拉开），标题与 Hero 用同一套细字重展示体，长页面因此保持一致的节奏。

## 基础用法

<DemoBlock title="眉题 + 标题 + 描述 + 主体" description="眉题会自动转为大写并拉开字距，中文眉题保持字距效果。">

<EwSection eyebrow="功能" title="让团队的知识流动起来" description="从个人笔记到团队空间，一段话讲清楚这个区块要传达的价值。">
  <div style="color:var(--ew-text-secondary)">← 主体内容插槽</div>
</EwSection>

```vue
<EwSection eyebrow="功能" title="让团队的知识流动起来" description="…">
  <FeatureGrid :items="features" />
</EwSection>
```

</DemoBlock>

## 居中对齐

<DemoBlock title="center 形态" description="定价、FAQ 等需要聚焦的区块用居中形态。">

<EwSection eyebrow="pricing" title="选择适合你的方案" description="居中形态适合定价、FAQ 等区块。" align="center" />

```vue
<EwSection title="选择适合你的方案" align="center" />
```

</DemoBlock>

::: tip 区块节奏
组件自带 96px 的底部外边距形成呼吸感；需要压缩时用 `gap` 属性覆写。
所有区块内部建议再配合 [EwContainer](./container)（或内置容器的组件）对齐。
:::

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| eyebrow | 眉题（自动大写字距拉开） | string | — |
| title | 标题 | string | — |
| description | 描述 | string | — |
| align | 对齐 | `'left' \| 'center'` | `'left'` |
| gap | 底部留白 px（覆写默认节奏） | string / number | — |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| eyebrow | 眉题覆写 |
| title | 标题覆写 |
| description | 描述覆写 |
| default | 区块主体 |
