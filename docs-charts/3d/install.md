# 安装与引入

## 安装

三维能力是 `@wil-works/evoke-charts` 的子入口，安装主包即可：

```bash
npm install @wil-works/evoke-charts
# 或
pnpm add @wil-works/evoke-charts
```

唯一 peer 依赖为 Vue 3.5+，无任何第三方运行时依赖。二维与三维是同一包的两个子入口，
按需引入各自的模块即可，只用二维的消费方不会引入三维代码。

## 全量引入

全局注册 `<EvChart3d>` 组件并加载样式：

```js
import { createApp } from 'vue'
import Charts3d from '@wil-works/evoke-charts/3d'
import '@wil-works/evoke-charts/styles'
import App from './App.vue'

createApp(App).use(Charts3d).mount('#app')
```

## 按需引入

不装插件、在单文件里直接引组件也可以：

```vue
<template>
  <EvChart3d :options="options" :height="360" />
</template>

<script setup>
import { EvChart3d } from '@wil-works/evoke-charts/3d'
import '@wil-works/evoke-charts/styles'

const options = {
  type: 'bar3d',
  labels: ['一月', '二月', '三月'],
  series: [{ name: '销量', data: [120, 200, 150] }],
}
</script>
```

## 与二维图表并排

子入口 `@wil-works/evoke-charts/3d` 与主入口 `@wil-works/evoke-charts` 可同时引入：
两者读取同一套 `--ev-color-series-*` 系列色令牌与同名内置色系（同 id 同色值），
二维图与三维图并排时系列色一致，换主题、切暗色同步跟随。

## Server-Side Rendering

模块顶层不访问 DOM，Nuxt / Vite SSR 环境可直接引入；画布在客户端挂载后开始绘制。

## 下一步

- 按数据形态挑图型：[总览与选型](/3d/)
- 拖拽、缩放、事件：[相机与交互](/3d/camera)
- 换主题与暗色：[主题接入](/3d/theme)
