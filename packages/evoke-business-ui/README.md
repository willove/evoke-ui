# @wil-works/evoke-business-ui

面向中后台管理界面的 Vue 3 组件库：150+ 通用组件与 8 个业务场景组件（筛选表单 / 数据表格 / 状态标签 / 双行单元格 / 详情描述 / 导入导出面板 / 审计时间线 / 列设置），内置图标体系与暗色模式。图表能力由独立包 `@wil-works/evoke-charts` 提供，两库样式已打通主题适配。

[![npm](https://img.shields.io/npm/v/@wil-works/evoke-business-ui.svg)](https://www.npmjs.com/package/@wil-works/evoke-business-ui) · **在线文档**：[evoke-business-ui.wil-works.com](https://evoke-business-ui.wil-works.com)

## 安装

```bash
pnpm add @wil-works/evoke-business-ui
# 或 npm i / yarn add
```

## 使用

### 全量注册

```js
import { createApp } from 'vue'
import EvokeBusinessUI from '@wil-works/evoke-business-ui'
import '@wil-works/evoke-business-ui/styles'

const app = createApp(App)
app.use(EvokeBusinessUI)
app.mount('#app')
```

### 按需取用命令式 API

`EbMessage` / `EbNotify` / `EbMsgbox` 等可单独引入，不必整包注册：

```js
import { EbMessage } from '@wil-works/evoke-business-ui'

EbMessage.success('保存成功')
```

### 模板中直接使用

```vue
<template>
  <eb-button type="primary" icon="search">搜索</eb-button>
  <eb-input v-model="keyword" placeholder="请输入关键词" clearable />
  <eb-data-table title="订单列表" :columns="columns" :data="rows" :total="total" />
</template>
```

## 图标

内置 433 个常用单色图标（Remix 形状，`currentColor` 跟随文字色，覆盖商务/财务/品牌 Logo/开发/设备等类目）：

```vue
<eb-icon name="search" :size="16" />
<eb-icon name="wechat-pay" :size="20" />   <!-- 支付品牌：wechat-pay / alipay / mini-program… -->
<eb-icon name="file-excel" :size="20" />  <!-- 文件类型：xlsx / xls / excel 同一资源 -->
```

需要 Remix 全量 3229 个图标时按需预载（约 1.6MB，不进主包）：

```js
import { loadFullIcons } from '@wil-works/evoke-business-ui/full-icons'
loadFullIcons()
```

## 图表

图表组件来自独立包 `@wil-works/evoke-charts`，本库已内置依赖并以 `EbChart`（模板 `<eb-chart>`）注册，无需单独安装；图表样式需额外引入一行：

```js
import '@wil-works/evoke-charts/styles'
```

```vue
<eb-chart :options="options" :height="320" />
```

主题、暗色与运行时换肤自动跟随组件库，无需额外配置；完整图表类型与配置项见在线文档的图表分区。

## 主题与暗色

默认主色为商务蓝 `#175DFF`。在全局样式中覆盖变量即可换肤，`html.dark` 类名切换暗色模式：

```css
:root {
  --eb-color-primary: #175dff;         /* 主色 */
  --eb-color-primary-light-3: #5c89ff; /* hover 等状态色一并覆盖 */
}
```

## 运行环境

- Vue `^3.5`，现代浏览器（Chrome / Edge / Safari / Firefox 近两年版本）
- 桌面 Electron 与 `file://` 场景可直接运行：无 CDN 请求、无顶层 window/document 访问

## 文档

组件 API、在线示例与场景工程见在线文档站：[evoke-business-ui.wil-works.com](https://evoke-business-ui.wil-works.com)。

## License

MIT
