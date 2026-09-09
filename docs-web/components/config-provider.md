# ConfigProvider 主题配置

`EwConfigProvider` 把整站的**颜色 / 圆角 / 间距 / 容器宽**收敛为四个 props。配置变化时
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

## 与组合式 API 配合

运行时动态切换（如「设置」面板）用 `useThemeConfig`：

```js
import { useThemeConfig } from '@wil-works/evoke-ui'

const { setPrimary, setRadius, setSpace, setContainer, reset } = useThemeConfig()
setPrimary('#0FA968') // 淡色阶自动生成
setRadius('round')
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

### 插槽

| 插槽 | 说明 |
| --- | --- |
| default | 受主题影响的内容 |
