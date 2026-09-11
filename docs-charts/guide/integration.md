# ev-chart 与 eb-chart

同一个图表引擎，两个组件名：`@wil-works/evoke-charts` 对外提供 `EvChart`（模板写 `<ev-chart>`），evoke-business-ui 依赖本包并把它以 `EbChart`（模板写 `<eb-chart>`）再次提供。两者指向同一份实现，`options`、事件与实例方法完全一致，本站文档对两个名字同时适用。

## 差异对照

| | 独立使用（本包） | evoke-business-ui 内 |
| --- | --- | --- |
| 组件名 | `EvChart` / `<ev-chart>` | `EbChart` / `<eb-chart>` |
| 安装 | `pnpm add @wil-works/evoke-charts` | 无需安装，随组件库自带 |
| 样式引入 | `import '@wil-works/evoke-charts/styles'` | 组件库样式已内置，无需单独引 |
| 主题来源 | 读取宿主 `--ev-*` 令牌，缺失回落内置色板 | 组件库的 `--eb-*` 令牌已映射到 `--ev-*`，图表自动跟随 |
| 暗色与换肤 | `html.dark` 令牌重映射即跟随 | 跟随组件库暗色与运行时换肤（换肤时派发 `ev-theme-change`） |
| 配置与用法 | 见本站各图表类型页 | 完全一致 |

## 独立使用

不带组件库、只要图表（轻量看板、嵌入已有系统等）：

```js
import { createApp } from 'vue'
import EvokeCharts from '@wil-works/evoke-charts'
import '@wil-works/evoke-charts/styles'

const app = createApp(App)
app.use(EvokeCharts) // 全局注册 <ev-chart />
```

```vue
<ev-chart :options="options" :height="320" />
```

主题定制通过覆盖 `--ev-*` 令牌完成，见[主题接入](/guide/theme)。

## 在 evoke-business-ui 中

组件库已注册 `<eb-chart>`，直接在模板里用：

```vue
<eb-chart :options="options" :height="320" />
```

组件库依赖本包，安装 `@wil-works/evoke-business-ui` 即一并可用；图表的主题、暗色与换肤跟随组件库，无需任何配置。组件库的完整能力见 [Business UI 文档站](https://evoke-business-ui.wil-works.com)。

## 怎么选

- 项目里已有 evoke-business-ui：用 `<eb-chart>`，主题跟随零配置；
- 不想引入整套组件库：用本包的 `<ev-chart>`，按[主题接入](/guide/theme)定义令牌（或什么都不做，走内置色板）；
- 两套库同项目共存：都指向同一引擎，写法按宿主组件名的习惯来即可。
