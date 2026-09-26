# 快速开始

装包、挂插件、把 EtProvider 写在根上，工具界面就能跑。

## 安装

peer 是 `vue` 与 `@wil-works/evoke-business-ui`（底座，提供 reset 与 `--eb-*` 令牌）：

```bash
pnpm add @wil-works/evoke-tools-ui @wil-works/evoke-business-ui vue
```

## 全量引入

```js
import { createApp } from 'vue'
import EvokeToolsUI from '@wil-works/evoke-tools-ui'
import '@wil-works/evoke-tools-ui/styles'
import '@wil-works/evoke-business-ui/styles'
import App from './App.vue'

createApp(App).use(EvokeToolsUI).mount('#app')
```

`app.use(EvokeToolsUI)` 注册全部 `Et*` 组件：分层 32 件（L1 12 / L2 6 / L3 7 / L4 7）+ 辅件 `EtSplitterPanel`，共 33 个组件入口；另有图标机制 `EtIcon`。

## 按需引入

子路径按组件粒度导出，样式随入口一起进产物：

```vue
<script setup>
import { EtToolButton } from '@wil-works/evoke-tools-ui/tool-button'
</script>

<template>
  <et-tool-button icon="copy" label="复制" size="small" tip="复制" @click="copied = true" />
</template>
```

运行时契约走 `./runtime`，图标机制走 `./icons`，两条入口不随组件树打包：

```js
import { createCommandRegistry } from '@wil-works/evoke-tools-ui/runtime'
import { registerDomainIcons } from '@wil-works/evoke-tools-ui/icons'
```

## 密度写在根上

密度是根级属性（`<html data-density>`），由 EtProvider 写入，不是组件 prop。卸载时还原挂载前的外部值；嵌套 EtProvider 以最后挂载者为准：

```vue
<template>
  <et-provider :density="density">
    <app />
  </et-provider>
</template>

<script setup>
import { ref } from 'vue'
const density = ref('default') // compact / default / relaxed
</script>
```

运行时切档即时生效，不需要刷新页面。三档度量见[设计规范](design.md#三档密度)，令牌表不在这页重复。

## 最小可跑片段

一个 EtProvider 加一个工具钮，拷贝即可运行：

```vue
<template>
  <et-provider>
    <et-tool-button icon="copy" label="复制" size="small" tip="复制" @click="copied = true" />
  </et-provider>
</template>

<script setup>
import { ref } from 'vue'
const copied = ref(false)
</script>
```

`label` 同时是 small 钮的可访问名（G4）；`tip` 给字符串时 ScreenTip 只显示名称。

## 下一站

- [命令驱动](commands.md)：命令表与 `registry.state()` 的单一来源。
- [工作台布局](workbench.md)：布局树、停靠与持久化。
- [键盘优先](keyboard.md)：键位解析、roving tabindex 与浮层焦点契约。
- [主题与画布桥](theme.md)：`--ot-*` 调色板与暗色联动。
- [配方：日志分析器](recipe-log-analyzer.md)：一个非办公工具的完整装配。
