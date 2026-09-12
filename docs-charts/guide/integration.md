# 内嵌于组件库

EvChart 是独立的图表引擎；evoke-business-ui 默认内嵌本引擎，并以 `EbChart`（模板 `<eb-chart>`）的组件名再次提供——这只是同一个 EvChart 的业务侧注册名（语法糖），配置、事件与实例方法完全一致，本站文档对两个名字同时适用。

## 在 business-ui 中使用

组件库已依赖本包，无需安装与单独配置：

```vue
<eb-chart :options="options" :height="320" />
```

- 主题、暗色与运行时换肤自动跟随组件库（换肤时广播重绘），无需任何图表侧配置；
- 图表能力与文档以本站为全集权威：全部图表类型、配置项与交互能力的说明都在这里，组件库文档中的图表示例是本站内容的子集呈现。

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

## 对宿主保持中立

图表引擎对所有宿主一视同仁：不为任何组件库做特殊配置。组件库或站点需要个性化时，走通用扩展接口——槽位令牌、`options.padding` / `theme` / `animation`、`applySeriesPalette` 配色方案工具（见[主题接入](/guide/theme)与[设计规范](/guide/design)）。
