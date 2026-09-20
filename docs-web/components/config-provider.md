# ConfigProvider 主题配置

`EvConfigProvider` 把整站的**颜色 / 圆角 / 间距 / 容器宽 / 磨砂**收敛为五个 props。配置变化时
对应的 `--ev-*` 令牌被写入 `:root`（或包裹元素），全库组件经令牌取值，即时生效；
主色淡色阶（light-3…9 / dark-2 / rgb 游标）由主色自动生成，明暗双主题自动兼容。
global 模式下组件卸载时会把写入过的 `:root` 令牌还原，不留全局残留。

## 全局换肤

<DemoBlock title="紫色 × 圆润 × 宽松" description="下方演示区通过 global: false 局部生效，体验整站配置请用 [主题定制器](/guide/customizer)。">

<EvConfigProvider primary="#7C5CFC" radius="round" space="loose" :global="false">
  <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
    <EvButton pill>主按钮</EvButton>
    <EvButton variant="soft">Soft</EvButton>
    <EvTag tone="primary">标签</EvTag>
  </div>
  <EvCard tone="cream" sticker style="margin-top:16px; max-width:360px;">
    <p style="font-size:13px;">卡片圆角、内边距与主色跟随上方配置。</p>
  </EvCard>
</EvConfigProvider>

```vue
<EvConfigProvider primary="#7C5CFC" radius="round" space="loose" container="wide">
  <SiteHome />
</EvConfigProvider>
```

</DemoBlock>

## 全局磨砂

`glass` 打开后，容器与浮层类组件默认呈现玻璃质感：半透明底 + `backdrop-filter` 模糊，
配发丝描边与顶缘高光，上下叠加时透出下层内容。运行时切换用
[useThemeConfig](#与组合式-api-配合) 的 `setGlass`。

组件级三态 `glass`、`blur` 强度调节、覆盖组件清单与磨砂令牌，见
**[磨砂玻璃](/guide/glass)** 一章。

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
`EV_COLOR_PRESETS` / `EV_RADIUS_PRESETS` / `EV_SPACE_PRESETS` / `EV_CONTAINER_PRESETS`
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
| glass | 磨砂开关：global 时写 `html[data-ev-glass]` 全站生效（Teleport 弹层命中）；global:false 时写在包裹元素上作局部作用域（Teleport 弹层不覆盖，请用组件级 glass prop） | boolean | `false` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| default | 受主题影响的内容 |
