# 企业级能力：数据流与指令

面向中后台业务的一组提效工具：`useTable` 列表数据流、`v-copy`、`v-infinite-scroll`、`useClipboard`、`useFullscreen`。

## useTable — 列表页数据流

分页 + 筛选 + 请求状态 + 竞态保护（快速翻页/连续搜索不串数据）：

```js
import { useTable } from '@wil-works/evoke-business-ui'

const {
  data, total, loading, error,   // 响应式状态
  params, pagination,            // 筛选与分页（响应式）
  search, refresh, reset, run,   // 动作
} = useTable(fetchOrders, {
  defaultParams: { status: 1 },
  // pagination: false,           // 非分页场景
})

// fetchOrders({ ...params, page, pageSize }) 约定返回 { list, total } 或数组
search({ keyword: 'x' })   // 合并筛选并回到第 1 页
refresh()                  // 增删改后以当前参数重跑
reset()                    // 恢复 defaultParams + 回到第 1 页
```

翻页/修改页容量后自动重新请求；`loading` 可直接绑定 `<eb-spin>` 或 DataTable 的 loading 态。

## v-copy — 点击复制

```vue
<span v-copy>{{ orderNo }}</span>                 <!-- 复制元素文本 -->
<span v-copy="orderNo">{{ orderNo }}</span>       <!-- 复制指定值 -->
<span v-copy="{ value, feedback: false }">…</span> <!-- 关闭消息反馈 -->
```

内部经 `useClipboard`：Clipboard API 优先，`execCommand` 兜底（file:// / 旧 WebView 可用）。

## v-infinite-scroll — 无限滚动

```vue
<div v-infinite-scroll="{ load: loadMore, distance: 80, disabled: finished }" style="height: 400px; overflow: auto">
  <div v-for="item in list" :key="item.id">…</div>
</div>
```

距底部 `distance` px 触发 `load`；同一次触底只发一次（加载完成后允许下一次）。

## useClipboard / useFullscreen

```js
import { useClipboard, useFullscreen } from '@wil-works/evoke-business-ui'

const { copied, copy } = useClipboard({ timeout: 1500 })
await copy('hello')               // copied 1.5s 后自动复位

const { isFullscreen, toggle } = useFullscreen(elRef)
toggle()                          // 缺省作用于 documentElement
```

## usePermission / setPermissions

见 [Auth 权限](/components/auth)。`setPrimaryColor` / `setDensity` 运行时换肤见[主题与暗色模式](/guide/theming)。

## setRipple — 全局关闭激活涟漪

输入类组件（输入框 / 选择器 / 级联 / 日期时间 / 树选择 / 数字输入等）聚焦时会播放实体色影涟漪。三档关闭入口，按需选用：

```js
import { setRipple, getRipple } from '@wil-works/evoke-business-ui'

setRipple(false)   // 全局关闭（可放应用初始化处）
setRipple(true)    // 恢复
getRipple()        // 读取当前状态
```

更细的粒度：

- **单个组件**：`:ripple="false"`（Input / Select / Cascader / DatePicker / TimePicker / TimeSelect / InputNumber / TreeSelect / Textarea / AutoComplete 均支持）；
- **批量**：`<eb-form :ripple="false">` 一次关闭表单内全部输入组件；
- **全局**：`setRipple(false)`，等价于在 `html` 上设置 `data-eb-ripple="off"`。
