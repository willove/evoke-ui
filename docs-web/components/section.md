# Section 区块

`EvSection` 定义官网的区块头：「大写眉题 + 细字重大标题 + 描述」。它统一了页面的区块节奏——
眉题小而安静（大写字距拉开），标题与 Hero 用同一套细字重展示体，长页面因此保持一致的节奏。

## 宽度与定宽档（先选宽度，再填内容）

区块宽度就是整页的栅格。四个档位与 [EvContainer](./container) 同一套表达式与
`--ev-container-width` 令牌，经 [EvConfigProvider](./config-provider) 可整站调整：

| 档位 | 宽度 | 用途 |
| --- | --- | --- |
| `narrow` | 920 | 聚焦型区块：定价、FAQ、引用、小团队 |
| `default` | 1152 | 标准内容区：特性、卡片网格、数据（**默认值**） |
| `wide` | 1360 | 宽幅展示：大图、宽表格 |
| `full` | 通栏 | 仅出血大件，见下方规则 2 |

<DemoBlock title="width 定宽居中" description="超过档位宽度后区块居中、不再撑到屏幕边缘；窄于档位宽度时自适应收缩。演示区列宽不足以触发档位，实际效果在整页使用时可见。">

```vue
<EvSection eyebrow="features" title="即时洞察" width="default">
  <FeatureGrid :items="features" />
</EvSection>

<!-- 档位：narrow 920 / default 1152 / wide 1360 / full 通栏（默认 default） -->
```

</DemoBlock>

::: warning 整页组装规则（硬规则，违反打回）
1. **默认定宽居中。** 不写 `width` 即 `default`——区块不撑满视口，标题与主体天然同边。
2. **通栏判据：主体是出血大件。** `width="full"` 仅用于主体宽度由内容撑开、设计意图就是出血的区块：跑马灯、整宽图表、分屏滚动场景、出血大图。没有这种子元素的标准区块（眉题 + 标题 + 描述 + 卡片/定价/FAQ），一律定宽。
3. **标题与主体共用同一个容器。** 区块的左右边界对整个区块**生效一次**：用 `width` 档，或自定义区块外包 [EvContainer](./container)。禁止只给主体内层 `div` 手写 `max-width`——那会让标题通栏、卡片居中，同一区块出现两条左边界。
4. **宽度只来自令牌档位。** 页面私写的像素 `max-width` 一律禁止，官方案例也不例外。比档位更窄的阅读测宽（如描述 560px）下沉到组件内部排版，不用第二个容器实现。
5. **要通栏的视觉、要收拢的内容，学 EvCta。** 外层色带/背景通栏，内层 `EvContainer` 收内容——而不是让内容本身通栏。

```vue
<!-- ✅ 标题与定价卡同边，宽度来自令牌 -->
<EvSection id="pricing" eyebrow="定价" title="按团队规模选择" width="narrow" align="center">
  <EvPricingCard v-for="p in plans" v-bind="p" :key="p.title" />
</EvSection>

<!-- ❌ 反例：标题通栏、卡片 960 居中 → 同一区块两条左边界 -->
<EvSection eyebrow="定价" title="按团队规模选择">
  <div class="pricing">          <!-- max-width: 960px; margin-inline: auto -->
    <EvPricingCard v-for="p in plans" v-bind="p" />
  </div>
</EvSection>

<!-- ✅ 通栏只给出血大件，且显式声明 -->
<EvSection width="full">
  <EvMarquee :items="items" />
</EvSection>
```
:::

## 基础用法

<DemoBlock title="眉题 + 标题 + 描述 + 主体" description="眉题会自动转为大写并拉开字距，中文眉题保持字距效果。未声明 width 时默认 default 档定宽居中。">

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

<DemoBlock title="center 形态" description="定价、FAQ 等需要聚焦的区块用居中形态；居中只改对齐，容器边界仍按 width 档生效。">

<EvSection eyebrow="pricing" title="选择适合你的方案" description="居中形态适合定价、FAQ 等区块。" align="center" />

```vue
<EvSection title="选择适合你的方案" align="center" />
```

</DemoBlock>

::: tip 区块节奏
组件自带 96px 的底部外边距形成呼吸感；需要压缩时用 `gap` 属性覆写。
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
| width | 定宽档：超过档位宽度后居中不再撑边，与 Container 共用 `--ev-container-width` 令牌 | `'narrow' \| 'default' \| 'wide' \| 'full'` | `'default'` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| eyebrow | 眉题覆写 |
| title | 标题覆写 |
| description | 描述覆写 |
| default | 区块主体 |
