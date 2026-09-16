# Section 区块

`EvSection` 定义官网的区块头：「大写眉题 + 细字重大标题 + 描述」。它统一了页面的区块节奏——
眉题小而安静（大写字距拉开），标题与 Hero 用同一套细字重展示体，长页面因此保持一致的节奏。

## 基础用法

<DemoBlock title="眉题 + 标题 + 描述 + 主体" description="眉题会自动转为大写并拉开字距，中文眉题保持字距效果。">

<EvSection eyebrow="功能" title="让团队的知识流动起来" description="从个人笔记到团队空间，一段话讲清楚这个区块要传达的价值。">
  <div style="color:var(--ev-text-secondary)">← 主体内容插槽</div>
</EvSection>

```vue
<EvSection eyebrow="功能" title="让团队的知识流动起来" description="…">
  <FeatureGrid :items="features" />
</EvSection>
```

</DemoBlock>

## 居中对齐

<DemoBlock title="center 形态" description="定价、FAQ 等需要聚焦的区块用居中形态。">

<EvSection eyebrow="pricing" title="选择适合你的方案" description="居中形态适合定价、FAQ 等区块。" align="center" />

```vue
<EvSection title="选择适合你的方案" align="center" />
```

</DemoBlock>

## 定宽档

<DemoBlock title="width 定宽居中" description="整页视口下超过档位宽度后区块居中、不再撑到屏幕边缘；窄于档位宽度时自适应收缩。演示区列宽不足以触发档位，实际效果在整页使用时可见。">

```vue
<EvSection eyebrow="features" title="即时洞察" width="default">
  <FeatureGrid :items="features" />
</EvSection>

<!-- 档位：narrow 920 / default 1152 / wide 1360 / full 通栏（默认） -->
```

</DemoBlock>

::: tip 区块节奏
组件自带 96px 的底部外边距形成呼吸感；需要压缩时用 `gap` 属性覆写。
整页使用时建议给区块声明 `width` 定宽档（与 [EvContainer](./container) 同一套档位与令牌）；
不声明时区块通栏，也可继续外包 EvContainer 对齐。
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
| glass | 磨砂玻璃质感；缺省跟随全局（ConfigProvider glass） | boolean | — |
| blur | 磨砂强度（px），内联覆盖 `--ev-glass-blur` | string / number | — |
| saturate | 磨砂饱和度（倍数），内联覆盖 `--ev-glass-saturate` | string / number | — |
| tint | 磨砂底色浓度（%），内联覆盖 `--ev-glass-bg` | string / number | — |
| snap | 滚动吸附：滚近时轻吸到视口顶（proximity，可打断）；页面有吸附区块即自动启用 | boolean | `false` |
| width | 定宽档：超过档位宽度后居中不再撑边，与 Container 共用 `--ev-container-width` 令牌 | `'narrow' \| 'default' \| 'wide' \| 'full'` | `'full'` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| eyebrow | 眉题覆写 |
| title | 标题覆写 |
| description | 描述覆写 |
| default | 区块主体 |
