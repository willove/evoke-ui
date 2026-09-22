# 快速开始

## 安装

```bash
pnpm add @wil-works/evoke-business-ui
```

AI 对话 / Agent 能力（对话窗口、消息体、卡片、工具调用、沙箱预览）在**同族的独立包**里，按需单独安装——不装它就不会把 `marked` / `highlight.js` 带进依赖树：

```bash
pnpm add @wil-works/evoke-chat
```

## 引入

完整引入（注册全部组件与命令式 API）：

```js
import { createApp } from 'vue'
import EvokeBusinessUI from '@wil-works/evoke-business-ui'
import '@wil-works/evoke-business-ui/styles'

const app = createApp(App)
app.use(EvokeBusinessUI)
```

用到对话家族时，再叠一层（它 peer 依赖本库，样式与设计令牌都来自本库）：

```js
import EvokeChat from '@wil-works/evoke-chat'
import '@wil-works/evoke-chat/styles'

app.use(EvokeChat)
```

## 使用示例

```vue
<template>
  <eb-search-filter :fields="fields" v-model="query" @search="onSearch" />
  <eb-data-table :columns="columns" :data="rows" :total="total" title="订单列表" />
</template>
```

## 下一步

- 想自定义主题色或接入暗色模式，见[主题与暗色模式](/guide/theming)
- 浏览[组件总览](/components/search-filter)查看全部组件的 API 与示例

::: tip 姊妹库推荐
做官网、落地页或营销页？推荐同族的 [Evoke UI](https://evoke-ui.wil-works.com) —— Clean Navy 设计语言的 Vue3 官网组件库，61 个组件、明暗双主题与运行时换色，包名 [`@wil-works/evoke-ui`](https://www.npmjs.com/package/@wil-works/evoke-ui)。
:::
