# Marquee 跑马灯

`EwMarquee` 让内容无限循环滚动，两种用法：**文本模式**（传入 `items`，商场 LED 风格大字横幅，
实心/描边交替）与**插槽模式**（任意自定义内容渲染两份无缝循环）。两端自动淡出，hover 暂停（可关）。

## 文本模式（商场大字横幅）

<DemoBlock title="大字 + 实心/描边交替 + 分隔符" description="alternate-outline 让奇偶词条交替使用实心与描边字；separator 挂主色分隔图标。">

<EwMarquee
  :items="['Evoke UI', '为官网而生', '轻与快', '开箱即用', 'SIMPLY DELIGHTFUL']"
  separator="star-fill"
  :duration="14000"
  text-size="44px"
/>

```vue
<EwMarquee
  :items="['Evoke UI', '为官网而生', '轻与快', '开箱即用']"
  separator="star-fill"
  alternate-outline
  :duration="14000"
  text-size="44px"
/>
```

</DemoBlock>

## 插槽模式

<DemoBlock title="任意内容循环" description="默认插槽渲染两份实现无缝循环；适合自定义卡片、品牌墙。">

<EwMarquee :duration="16000">
  <span v-for="w in ['轻盈排版', '留白呼吸感', '主题换肤', '滚动浮现', '数字滚动']" :key="w" class="mq-chip">{{ w }}</span>
</EwMarquee>

```vue
<EwMarquee :duration="16000">
  <span v-for="w in words" :key="w" class="chip">{{ w }}</span>
</EwMarquee>
```

</DemoBlock>

## 双向对流

<DemoBlock title="reverse + 高速" description="两行反向滚动组成对流横幅墙。">

<EwMarquee text-size="28px" :duration="10000" :items="['cumubase', 'Horizon', 'Fieldnote', 'Arcadia', 'Mono Studio']" :alternate-outline="false" />

<div style="height:12px" />

<EwMarquee text-size="28px" :duration="10000" reverse :items="['Somno', 'Papercup', 'Northwind', 'Bloom', 'Copper']" :alternate-outline="false" />

```vue
<EwMarquee text-size="28px" :items="brands" :duration="10000" :alternate-outline="false" />
<EwMarquee text-size="28px" :duration="10000" reverse :items="brands2" :alternate-outline="false" />
```

</DemoBlock>

<style>
.mq-chip {
  display: inline-flex;
  padding: 8px 18px;
  border: 1px solid var(--ew-border-color-light);
  border-radius: var(--ew-radius-full);
  background: var(--ew-bg-container);
  font-size: 13px;
  color: var(--ew-text-secondary);
  white-space: nowrap;
}
</style>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| items | 文本模式词条 `[string]`（无默认插槽时启用文本模式） | string[] | `[]` |
| alternate-outline | 文本模式奇偶项 实心/描边 交替 | boolean | `true` |
| separator | 词条间分隔图标名 | string | — |
| text-size | 大字字号（CSS 字号） | string | `clamp(32px, 5vw, 56px)` |
| duration | 单程滚动时长 ms（越小越快） | number | `24000` |
| reverse | 反向滚动 | boolean | `false` |
| pause-on-hover | 悬停暂停 | boolean | `true` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| default | 自定义循环内容（渲染两份；存在时不启用文本模式） |

### 样式钩子

| 变量 | 说明 |
| --- | --- |
| `--ew-marquee-text-size` | 文本模式字号（text-size 属性的同名底层） |
| `--ew-marquee-stroke` | 描边字颜色（默认 `--ew-text-secondary`） |

::: tip 无障碍
第二份循环内容带 `aria-hidden="true"`，读屏不会重复朗读；`prefers-reduced-motion` 下自动停止滚动。
:::
