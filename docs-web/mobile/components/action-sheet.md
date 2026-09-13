# ActionSheet 动作面板

`EvActionSheet` 是移动端「更多操作」的标准形态：底部滑入的纵向动作列表 + 取消栏，
替代 hover 类菜单在触屏上的缺位。动作项支持副标题、警示色与禁用；破坏性动作用
`color` 标红并排在最末。遮罩点击 / ESC / 取消栏均可关闭，`before-close` 统一拦截。

## 基础用法

<DemoBlock title="对象操作菜单" description="点击「更多操作」从底部滑入；点选动作即关闭并回调 select，取消栏回调 cancel。演示壳内需 append-to-body=false，真机保持默认。">

<MobileStage title="文章详情">
  <div class="mb-page">
    <div class="mb-card mb-card--pad">
      <div class="mb-card__title">Clean Navy 设计语言解读</div>
      <div class="mb-card__label" style="margin-top: 4px;">发布于 09-01 · 设计栏目</div>
    </div>
    <button
      style="align-self: stretch; padding: 10px; border: 1px solid var(--ev-border-color); border-radius: var(--ev-radius-md); background: var(--ev-bg-container); color: var(--ev-text-primary); font-size: 14px; cursor: pointer;"
      @click="sheetOpen = true"
    >
      更多操作
    </button>
  </div>
  <ev-action-sheet
    v-model="sheetOpen"
    title="文章操作"
    :actions="actions"
    :append-to-body="false" :lock-scroll="false"
    @select="onSelect"
    @cancel="onCancel"
  />
</MobileStage>

```vue
<script setup>
import { ref } from 'vue'

const visible = ref(false)
const actions = [
  { name: '分享文章' },
  { name: '编辑', subname: '进入全屏编辑器' },
  { name: '删除', color: 'var(--ev-color-danger)' },
]

function onSelect(action, index) {
  console.log('选中', index, action.name)
}
</script>

<template>
  <EvButton @click="visible = true">更多操作</EvButton>
  <EvActionSheet
    v-model="visible"
    title="文章操作"
    :actions="actions"
    @select="onSelect"
  />
</template>
```

</DemoBlock>

<script setup>
import { ref } from 'vue'

const sheetOpen = ref(false)
const shareOpen = ref(false)
const actions = [
  { name: '分享文章' },
  { name: '编辑文章', subname: '进入全屏编辑器' },
  { name: '删除文章', color: 'var(--ev-color-danger)' },
  { name: '暂不可用', disabled: true },
]
function onSelect(action) {
  // 演示环境仅展示回调
}
function onCancel() {}
</script>

## 隐藏取消栏

`cancel-text` 传空串隐藏取消栏，适合「选择后必须决策」的场景（如分享目标选择）。

<DemoBlock title="无取消栏 + 标题插槽" description="title 插槽自定义头部，cancel-text 置空。">

<MobileStage>
  <div class="mb-page">
    <button
      style="align-self: stretch; padding: 10px; border: 1px solid var(--ev-border-color); border-radius: var(--ev-radius-md); background: var(--ev-bg-container); color: var(--ev-text-primary); font-size: 14px; cursor: pointer;"
      @click="shareOpen = true"
    >
      分享到…
    </button>
  </div>
  <ev-action-sheet v-model="shareOpen" :cancel-text="''" :append-to-body="false" :lock-scroll="false">
    <template #title>
      <span style="font-weight: 600; color: var(--ev-text-primary);">分享到</span>
    </template>
    <div style="display: flex; flex-direction: column;">
      <button v-for="t in ['微信好友', '朋友圈', '复制链接']" :key="t" type="button" style="padding: 14px; border: none; background: var(--ev-bg-container); color: var(--ev-text-primary); font-size: 15px; cursor: pointer;" @click="shareOpen = false">{{ t }}</button>
    </div>
  </ev-action-sheet>
</MobileStage>

```vue
<EvActionSheet v-model="visible" cancel-text="">
  <template #title>
    <span>分享到</span>
  </template>
  <ShareTargetList @pick="visible = false" />
</EvActionSheet>
```

</DemoBlock>

## API

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| modelValue | boolean | false | 显隐（v-model） |
| actions | `{ name, subname?, color?, disabled? }[]` | [] | 动作列表；color 自定义文字色（破坏性动作用警示色），disabled 禁用 |
| title | string | '' | 顶部标题，空且无插槽时不渲染 |
| cancel-text | string | 取消 | 取消栏文案，空串隐藏 |
| round | boolean | true | 顶部大圆角 |
| close-on-click-action | boolean | true | 点选动作后关闭 |
| close-on-click-modal | boolean | true | 点击遮罩关闭 |
| close-on-press-escape | boolean | true | ESC 关闭 |
| append-to-body | boolean | true | Teleport 到 body；嵌套滚动容器/演示壳内置 false |
| lock-scroll | boolean | true | 打开期间锁定页面滚动 |
| before-close | (done) => void | — | 关闭前拦截，不调用 done 则阻止 |
| glass | boolean | — | 磨砂玻璃面板；缺省跟随全局（ConfigProvider glass） |
| blur | number / string | — | 磨砂强度（px），内联覆盖 `--ev-glass-blur` |

### 事件

| 名称 | 参数 | 说明 |
| --- | --- | --- |
| select | (action, index) | 点选动作（禁用项不触发） |
| cancel | — | 点击取消栏 |
| open / opened / close / closed | — | 显隐流转 |

### 插槽

| 名称 | 参数 | 说明 |
| --- | --- | --- |
| default | — | 自定义面板内容（替换动作列表）；列表块不做水平内缩，内容需自带内边距（建议左右 ≥12px，底部留出圆角空间） |
| title | — | 自定义标题 |
