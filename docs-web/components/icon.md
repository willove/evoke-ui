# Icon 图标

形状源自 [Remix Icon](https://remixicon.com/)（Remix Icon License v1.0，免费商用），生成期静态快照，运行时零依赖。

- **核心集**：72 个语义命名图标（`search`、`close`、`arrow-right`…），随包内置、零加载
- **展示集**：900+ Remix 原生命名图标（`brush-line`…），`loadShowcaseIcons()` 按需加载（独立 chunk，不占主包体积）
- 需要全量 Remix Icon 时调大生成脚本的 `SHOWCASE_PER_CATEGORY` 重新生成，见下方[扩展到全量](#扩展到全量-remix-icon)

## 基础用法

<DemoBlock title="核心集" description="size 接受数字与任意 CSS 尺寸；color 独立覆写，缺省继承文字色。">

<div style="display:flex; align-items:center; gap:20px; font-size:15px;">
  <EvIcon name="search" :size="18" />
  <EvIcon name="arrow-right" :size="18" />
  <EvIcon name="close" :size="18" />
  <EvIcon name="check" :size="18" color="var(--ev-color-success)" />
  <EvIcon name="heart" :size="22" color="#e5484d" />
  <EvIcon name="star-fill" :size="22" color="#f97316" />
  <EvIcon name="github" :size="22" />
  <span style="display:inline-flex; align-items:center; gap:6px;">
    Continue <EvIcon name="arrow-up-right" :size="16" />
  </span>
</div>

```vue
<EvIcon name="search" :size="18" />
<EvIcon name="check" :size="18" color="var(--ev-color-success)" />
<EvIcon name="arrow-up-right" :size="16" />
```

</DemoBlock>

## 核心集一览

全部 72 个语义图标，名称即语义，覆盖官网组件的常用表达：

<DemoBlock title="内置核心集（72）" center>

<div class="icon-core-grid">
  <figure v-for="(paths, name) in coreIcons" :key="name" class="icon-core-cell">
    <EvIcon :name="name" :size="22" />
    <figcaption>{{ name }}</figcaption>
  </figure>
</div>

<style>
.icon-core-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 10px;
}
.icon-core-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 12px 4px;
  border: 1px solid var(--ev-border-color-light);
  border-radius: var(--ev-radius-sm);
  color: var(--ev-text-primary);
}
.icon-core-cell figcaption {
  font-size: 11px;
  color: var(--ev-text-secondary);
  word-break: break-all;
  text-align: center;
}
</style>

</DemoBlock>

## 展示集（Remix 原生命名）

展示集按 Remix 分类每类限量采样 24 对（line + fill 成对），共 900+ 图标，打包为独立 chunk。
[EvIconGrid](./icon-grid) 开箱即用整套展示集（搜索 / 分类 / 点击复制图标名），也可在
[全部图标](./icons) 页直接浏览。

```js
import { loadShowcaseIcons } from '@wil-works/evoke-ui'
loadShowcaseIcons() // 幂等；加载完成后全部 900+ 图标可同步渲染
```

<DemoBlock title="展示集加载后" description="文档站已预载展示集，下列 Remix 原生名直接可用。">

<div style="display:flex; align-items:center; gap:20px;">
  <EvIcon name="brush-line" :size="20" />
  <EvIcon name="camera-line" :size="20" />
  <EvIcon name="flashlight-line" :size="20" />
  <EvIcon name="compass-3-line" :size="20" />
  <EvIcon name="moon-line" :size="20" />
  <EvIcon name="chrome-fill" :size="20" color="#4c8bf5" />
</div>

```vue
<EvIcon name="brush-line" :size="20" />
<EvIcon name="compass-3-line" :size="20" />
```

</DemoBlock>

## 扩展到全量 Remix Icon

两级扩展路径，按需选择：

1. **运行时加载内置展示集**（零配置）：`loadShowcaseIcons()` 动态加载 900+ 采样图标，
   适合绝大多数官网场景；[EvIconGrid](./icon-grid) 内部已自动处理。
2. **生成期扩大采样乃至全量**：改包内 `scripts/generate-remix-icons.mjs` 的采样上限后重新生成——

```bash
# packages/evoke-ui/scripts/generate-remix-icons.mjs
const SHOWCASE_PER_CATEGORY = 24   // 调大，如 9999 即全量（约 3000+ 图标）

pnpm gen:icons:eui                 # 重新生成 showcase 路径数据
pnpm build:eui                     # 重建产物
```

::: warning 体积提示
展示集走独立 chunk 动态加载，主包体积不受影响；全量生成后 chunk 会显著变大，
建议仍按站点实际用到的分类采样。
:::

## 自定义图标

```js
import { registerIcons } from '@wil-works/evoke-ui'
import MyLogo from './MyLogo.vue'

registerIcons({ 'my-logo': MyLogo }) // 值可以是组件或 { viewBox, paths } 数据
```

## API

### EvIcon Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| name | 图标名（kebab-case）或图标组件 | string / Component | — |
| size | 尺寸 | number / string | `16` |
| color | 颜色 | string | 继承 |

### 注册表 API

| 方法 | 说明 | 签名 |
| --- | --- | --- |
| registerIcons | 注册自定义图标 | `(icons: Record<string, Component \| IconEntry>) => void` |
| getIconByName | 按名解析 | `(name: string) => Component \| undefined` |
| getIconNames | 枚举全部名称 | `() => string[]` |
| loadShowcaseIcons | 按需加载展示集 | `() => Promise<void>` |

<script setup>
import { evSvgPaths } from '../../packages/evoke-ui/src/components/icon/svg-paths'
const coreIcons = evSvgPaths
</script>
