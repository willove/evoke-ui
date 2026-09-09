# LoadMore 加载更多

`EwLoadMore` 是列表尾部的加载状态条：idle（可点击 / 触底自动）→ loading（外部拉数据）
→ idle（还有数据）/ noMore（到底）/ error（失败点击重试）。状态由父级持有
（`v-model:status`），组件触发时置 `loading` 并发出 `load-more`，把「何时加载」交给组件、
「加载什么」留给业务。触底检测用 IntersectionObserver，根为最近的滚动祖先，页面滚动
容器与局部滚动区都适用。

## 基础用法

<DemoBlock title="点击与触底自动加载" description="点击状态条触发；autoLoad 开启时滚动到距底部 preload px 内自动触发。加载两页后转 noMore。">

<div style="max-width: 375px; margin: 0 auto; height: 320px; overflow-y: auto; border: 1px solid var(--ew-border-color-light); border-radius: var(--ew-radius-md); padding: 16px 16px 0;">
  <div v-for="i in items" :key="i" style="padding: 10px 0; border-bottom: 1px solid var(--ew-border-color-light); font-size: 14px; color: var(--ew-text-primary);">
    内容条目 #{{ i }}
  </div>
  <EwLoadMore v-model:status="status" :preload="40" @load-more="onLoad" />
</div>

```vue
<script setup>
import { ref } from 'vue'

const status = ref('idle')
const items = ref([1, 2, 3, 4, 5, 6])
let page = 1

async function onLoad() {
  const next = await fetchPage(++page)
  items.value.push(...next)
  status.value = next.length ? 'idle' : 'noMore' // 还有数据回 idle，到底转 noMore
}
</script>

<template>
  <div class="list">
    <Item v-for="i in items" :key="i" />
    <EwLoadMore v-model:status="status" :preload="40" @load-more="onLoad" />
  </div>
</template>
```

</DemoBlock>

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

## 失败重试

加载失败时父级把状态置 `error`，状态条转警示色，点击即重试（重新发出 `load-more`）。

<DemoBlock title="error → 点击重试" description="首击模拟失败转 error，再次点击重试成功转 noMore。">

<div style="max-width: 375px; margin: 0 auto; border: 1px solid var(--ew-border-color-light); border-radius: var(--ew-radius-md); padding: 16px 16px 0;">
  <div style="padding: 10px 0; font-size: 14px; color: var(--ew-text-primary);">内容条目 #1 ~ #6</div>
  <EwLoadMore :status="errStatus" @load-more="onErrLoad" @update:status="errStatus = $event" />
</div>

```vue
<EwLoadMore v-model:status="status" @load-more="onLoad" />
```

</DemoBlock>

## API

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| status | `'idle' \| 'loading' \| 'noMore' \| 'error'` | 'idle' | 列表状态（v-model:status），由父级持有 |
| auto-load | boolean | true | 触底自动加载（IntersectionObserver，根为最近滚动祖先） |
| preload | number | 0 | 触底提前量（px），距底部多远开始预加载 |
| disabled | boolean | false | 禁用触发 |
| loading-text | string | 加载中… | loading 态文案 |
| no-more-text | string | 没有更多了 | noMore 态文案 |
| error-text | string | 加载失败，点击重试 | error 态文案 |
| idle-text | string | 加载更多 | idle 态文案 |

### 事件

| 名称 | 参数 | 说明 |
| --- | --- | --- |
| load-more | — | 触发加载（点击/触底/重试），发出前组件已置 loading |
| update:status | (status) | v-model:status 同步 |

### 插槽

| 名称 | 参数 | 说明 |
| --- | --- | --- |
| default | { status } | 自定义状态条内容 |
| loading | — | 自定义加载指示 |
