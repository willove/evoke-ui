# EtRibbonBar · 工具区主体

tab 条 + 控件行的工具区门面：真折叠、分量降级、溢出「更多」、上下文 tab，状态只读 `registry.state()`。

```vue
<script setup>
import { ref } from 'vue'
const activeTab = ref('home')
const collapsed = ref(false)
const ctx = { hasSelection: true }
</script>

<template>
  <et-ribbon-bar
    v-model="activeTab"
    v-model:collapsed="collapsed"
    :schema="schema"
    :registry="registry"
    :ctx="ctx"
    persist-key="my-app-ribbon"
    @command="onCommand"
  />
</template>
```

<script setup>
import HomeStage from '../demos/HomeStage.vue'
const ribbonSource = `<et-ribbon-bar
  v-model="activeTab"
  :schema="DEMO_RIBBON_SCHEMA"
  :registry="demoRegistry"
  :ctx="ctx"
  persist-key="my-app-ribbon"
  @command="onCommand"
/>`
</script>

<DemoBlock :code="ribbonSource">
  <HomeStage />
</DemoBlock>

## API

<CompApi id="ribbon-bar" />

## 行为

- 折叠快捷键 `Ctrl+F1` / `⌥⌘R`（Win 上 `Ctrl+Alt+R`）+ 双击 tab 条；折叠后工具区主体高度归零，命令经 peek 浮层仍可达。
- 分量降档 `FULL → SMALL → GROUP_DROPDOWN`（`RIBBON_SCALE_TIERS`）；全部最小档仍放不下，组收进行尾「更多」。控件行禁换行。
- 上下文 tab 条件满足才进条，条件消失即退场。
- 未注册的命令不渲染（悬空引用在 schema 期就该被发现）。
- `select` 条目宽度取 schema 的 `width`（px 数字或 CSS 串）。
- 暴露 `measure()`。
- 同目录导出辅件 `EtOverflowMenu`：props `groups` / `registry` / `ctx` / `label`，emits `command`；被收进的组按组分区呈现，disabled 同样来自 `registry.state`。

## 令牌与门禁

- `--et-chrome-toolarea-height` / `--et-chrome-toolarea-collapsed` / `--et-chrome-top-budget`（calc 派生，改分量预算自动跟随）。
- G3：命令状态单点实现，本件不做任何本地推演。
- G5：全局 keydown 判 `isImeComposing`。
- G7：折叠/溢出在三档宽度下不换行、不撑高（视觉断言双锁）。
