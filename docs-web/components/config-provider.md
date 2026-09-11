# ConfigProvider 主题配置

`EwConfigProvider` 把整站的**颜色 / 圆角 / 间距 / 容器宽 / 磨砂**收敛为五个 props。配置变化时
对应的 `--ew-*` 令牌被写入 `:root`（或包裹元素），全库组件经令牌取值，即时生效；
主色淡色阶（light-3…9 / dark-2 / rgb 游标）由主色自动生成，明暗双主题自动兼容。

## 全局换肤

<DemoBlock title="紫色 × 圆润 × 宽松" description="下方演示区通过 global: false 局部生效，体验整站配置请用 [主题定制器](/guide/customizer)。">

<EwConfigProvider primary="#7C5CFC" radius="round" space="loose" :global="false">
  <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
    <EwButton pill>主按钮</EwButton>
    <EwButton variant="soft">Soft</EwButton>
    <EwTag tone="primary">标签</EwTag>
  </div>
  <EwCard tone="cream" sticker style="margin-top:16px; max-width:360px;">
    <p style="font-size:13px;">卡片圆角、内边距与主色跟随上方配置。</p>
  </EwCard>
</EwConfigProvider>

```vue
<EwConfigProvider primary="#7C5CFC" radius="round" space="loose" container="wide">
  <SiteHome />
</EwConfigProvider>
```

</DemoBlock>

## 全局磨砂

`glass` 打开后，容器类组件（Card / Section / Footer / Navbar / ArticleCard / PricingCard / ProfileCard）
默认呈现玻璃质感：半透明底色 + `backdrop-filter` 模糊，上下叠加时透出下层内容；
组件级 `glass` prop 可单独强制开或关（三态）。浏览器不支持 `backdrop-filter` 时自动回落实底。

<DemoBlock title="全局磨砂 + 叠层" description="开关写入 html 属性全站生效，离开页面自动还原；渐变底上的玻璃卡透出彼此的边缘。">

<EwConfigProvider glass :global="false">
  <div style="background:linear-gradient(135deg, #6fb1ff, #a678ff 55%, #ff9ac3); border-radius:14px; padding:24px; display:grid; gap:14px;">
    <EwCard>
      <p style="font-weight:600;">玻璃卡 A</p>
      <p style="font-size:13px;">跟随全局 glass，半透明底 + 背景模糊。</p>
    </EwCard>
    <EwCard style="margin-left:36px;">
      <p style="font-weight:600;">玻璃卡 B（错位叠放）</p>
      <p style="font-size:13px;">单张卡传 :glass="false" 可退回实底。</p>
    </EwCard>
  </div>
</EwConfigProvider>

```vue
<EwConfigProvider glass>
  <SiteHome />
</EwConfigProvider>
```

</DemoBlock>

## 与组合式 API 配合

运行时动态切换（如「设置」面板）用 `useThemeConfig`：

```js
import { useThemeConfig } from '@wil-works/evoke-ui'

const { setPrimary, setRadius, setSpace, setContainer, setGlass, reset } = useThemeConfig()
setPrimary('#0FA968') // 淡色阶自动生成
setRadius('round')
setGlass(true)       // 全局磨砂
reset()               // 恢复默认
```

::: info 预设
`EW_COLOR_PRESETS` / `EW_RADIUS_PRESETS` / `EW_SPACE_PRESETS` / `EW_CONTAINER_PRESETS`
从包根导出，可直接生成定制器选项。完整交互见 [主题定制器](/guide/customizer)。
:::

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| primary | 主色（hex），淡色阶自动生成 | string | — |
| radius | 圆角档 | `'sharp' \| 'soft' \| 'default' \| 'round'` | `'default'` |
| space | 间距档 | `'compact' \| 'default' \| 'loose'` | `'default'` |
| container | 容器宽档 | `'narrow' \| 'default' \| 'wide' \| 'full'` | `'default'` |
| global | 写入 `:root` 全局生效；false 时作用于包裹元素 | boolean | `true` |
| glass | 全局磨砂，作用于 `html[data-ew-glass]`；容器组件级 glass prop 可单独覆盖 | boolean | `false` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| default | 受主题影响的内容 |
