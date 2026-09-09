# PullRefresh 下拉刷新

触屏下拉刷新手势：内容区顶部下拉 → 释放越过阈值触发 `refresh`，`v-model` 同步加载中
状态，加载完成后置 `false` 自动展示成功态并收回。滚动容器不在顶部时不拦截手势（页面
可正常上滚）；超过触发距离后 1/3 阻尼跟手，形成「越拉越紧」的手感。状态机：
normal → pulling → loosing → loading → success → normal，全程由 `change` 事件广播。

## 基础用法

<DemoBlock>
<MobileStage title="工作台">
  <ev-pull-refresh v-model="refreshing" @refresh="onRefresh" style="min-height: 100%;">
    <div class="mb-page">
      <div v-for="n in items" :key="n" class="mb-card mb-card--pad">
        <div class="mb-card__title">内容条目 #{{ n }}</div>
        <div class="mb-card__label" style="margin-top: 4px;">触屏设备在滚动区顶部下拉释放即可触发</div>
      </div>
    </div>
  </ev-pull-refresh>
</MobileStage>
</DemoBlock>

```html
<ev-pull-refresh v-model="refreshing" @refresh="onRefresh">
  <NewsList :items="items" />
</ev-pull-refresh>
```

```js
async function onRefresh() {
  await reloadFirstScreen()
  refreshing.value = false // 置 false 后自动展示「刷新成功」并收回
}
```

要点：

- **手势边界**：滚动容器 `scrollTop > 0` 时下拉不生效（让位给页面滚动）；`touchmove` 以
  非被动模式监听，仅在可下拉时 `preventDefault` 阻断浏览器原生下拉。
- **状态闭环**：`refresh` 触发时组件已置 loading；业务加载完成把 `modelValue` 置 `false`，
  成功态停留 `success-duration` 后自动收回，无需手动清理。

## 自定义头部

`#head` 插槽替换默认提示（参数 `{ status, distance }`），可完全自定义动画；四段文案
也可按需覆盖。

<DemoBlock>
<MobileStage>
  <ev-pull-refresh v-model="refreshing2" :head-height="60" @refresh="onRefresh2" style="min-height: 100%;">
    <template #head="{ status }">
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 13px; color: var(--ev-text-color-secondary);">
        {{ status === 'loosing' ? '松开手，为你更新' : status === 'loading' ? '正在更新…' : status === 'success' ? '已是最新' : '下拉更新内容' }}
      </div>
    </template>
    <div class="mb-page">
      <div class="mb-card mb-card--pad">
        <div class="mb-card__title">自定义头部演示</div>
      </div>
    </div>
  </ev-pull-refresh>
</MobileStage>
</DemoBlock>

## API

<ApiTable title="PullRefresh Props" :rows="[
  { name: 'v-model', desc: '刷新中状态；业务加载完成置 false 触发成功态收回', type: 'boolean', default: 'false' },
  { name: 'disabled', desc: '禁用下拉手势', type: 'boolean', default: 'false' },
  { name: 'head-height', desc: '触发刷新的下拉距离（px），同时是头部高度', type: 'number', default: '50' },
  { name: 'success-duration', desc: '成功态停留时长（ms），0 直接收回', type: 'number', default: '500' },
  { name: 'animation-duration', desc: '收回/展开动画时长（ms）', type: 'number', default: '300' },
  { name: 'pulling-text / loosing-text', desc: '未到阈值 / 越过阈值的提示文案', type: 'string', default: '下拉刷新 / 释放刷新' },
  { name: 'loading-text / success-text', desc: '加载中 / 完成后的提示文案', type: 'string', default: '加载中… / 刷新成功' },
]" />

<ApiTable title="PullRefresh Events" :rows="[
  { name: 'refresh', desc: '释放越过阈值时触发，组件已进入 loading', type: '—', default: '—' },
  { name: 'change', desc: '状态流转广播', type: '(status, oldStatus) => void', default: '—' },
  { name: 'update:modelValue', desc: 'v-model 同步', type: '(boolean) => void', default: '—' },
]" />

<ApiTable title="PullRefresh Slots" :rows="[
  { name: 'default', desc: '滚动内容', type: '—', default: '—' },
  { name: 'head', desc: '自定义头部', type: '{ status, distance }', default: '默认提示' },
]" />

<script setup>
import { ref } from 'vue'

const refreshing = ref(false)
const refreshing2 = ref(false)
const items = ref([1, 2, 3, 4, 5, 6, 7, 8])
function onRefresh() {
  setTimeout(() => {
    refreshing.value = false
  }, 1200)
}
function onRefresh2() {
  setTimeout(() => {
    refreshing2.value = false
  }, 1200)
}
</script>
