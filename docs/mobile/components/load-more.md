# LoadMore 加载更多

列表尾部的加载状态条：idle（可点击 / 触底自动）→ loading（外部拉数据）→ idle（还有
数据）/ noMore（到底）/ error（失败点击重试）。状态由父级持有（`v-model:status`），
组件触发时置 `loading` 并发出 `load-more`——「何时加载」交给组件，「加载什么」留给
业务。触底检测用 IntersectionObserver，根为最近的滚动祖先，页面滚动容器与局部滚动区
都适用；替代移动端没有意义的页码器（见[移动端 · 页面导航](/mobile/navigation)）。

## 基础用法

点击状态条触发（`auto-load` 开启时滚动距底部 `preload` px 内也会自动触发）。加载两页
后转 noMore 收束。

<DemoBlock>
<div style="max-width: 375px; margin: 0 auto; height: 300px; overflow-y: auto; border: 1px solid var(--ev-border-color-lighter); border-radius: 12px; padding: 12px 16px 0; box-sizing: border-box;">
  <div v-for="i in items" :key="i" style="padding: 10px 0; border-bottom: 1px solid var(--ev-border-color-lighter); font-size: 14px; color: var(--ev-text-color-regular);">内容条目 #{{ i }}</div>
  <ev-load-more v-model:status="status" :preload="40" @load-more="onLoad" />
</div>
</DemoBlock>

```html
<div class="list">
  <Item v-for="i in items" :key="i" />
  <ev-load-more v-model:status="status" :preload="40" @load-more="onLoad" />
</div>
```

```js
async function onLoad() {
  const next = await fetchPage(++page)
  items.value.push(...next)
  status.value = next.length ? 'idle' : 'noMore' // 还有数据回 idle，到底转 noMore
}
```

## 失败重试

加载失败时父级把状态置 `error`，状态条转警示色，点击即重试（重新发出 `load-more`）。

<DemoBlock>
<ev-load-more :status="errStatus" style="max-width: 375px; margin: 0 auto;" @load-more="onErrLoad" @update:status="errStatus = $event" />
</DemoBlock>

## API

<ApiTable title="LoadMore Props" :rows="[
  { name: 'status', desc: '列表状态（v-model:status），由父级持有', type: `'idle' | 'loading' | 'noMore' | 'error'`, default: `'idle'` },
  { name: 'auto-load', desc: '触底自动加载（IntersectionObserver，根为最近滚动祖先）', type: 'boolean', default: 'true' },
  { name: 'preload', desc: '触底提前量（px），距底部多远开始预加载', type: 'number', default: '0' },
  { name: 'disabled', desc: '禁用触发', type: 'boolean', default: 'false' },
  { name: 'loading-text / no-more-text', desc: '加载中 / 到底文案', type: 'string', default: '加载中… / 没有更多了' },
  { name: 'error-text / idle-text', desc: '失败重试 / 待加载文案', type: 'string', default: '加载失败，点击重试 / 加载更多' },
]" />

<ApiTable title="LoadMore Events" :rows="[
  { name: 'load-more', desc: '触发加载（点击/触底/重试），发出前组件已置 loading', type: '—', default: '—' },
  { name: 'update:status', desc: 'v-model:status 同步', type: '(status) => void', default: '—' },
]" />

<ApiTable title="LoadMore Slots" :rows="[
  { name: 'default', desc: '自定义状态条内容', type: '{ status }', default: '状态文案' },
  { name: 'loading', desc: '自定义加载指示', type: '—', default: '旋转 spinner' },
]" />

<script setup>
import { ref } from 'vue'

const status = ref('idle')
const items = ref([1, 2, 3, 4, 5, 6])
let page = 1
const errStatus = ref('error')
let retried = false
function onLoad() {
  setTimeout(() => {
    page += 1
    const start = items.value.length
    for (let i = 1; i <= 6; i++) items.value.push(start + i)
    if (page >= 3) status.value = 'noMore'
    else status.value = 'idle'
  }, 1000)
}
function onErrLoad() {
  setTimeout(() => {
    if (!retried) {
      retried = true
      errStatus.value = 'error'
    } else {
      errStatus.value = 'noMore'
    }
  }, 800)
}
</script>
