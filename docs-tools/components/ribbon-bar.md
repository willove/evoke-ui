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

## Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `schema` | Array | `[]` | tab 节点树：`{ key, type: 'tab', label, children: [group] }` |
| `registry` | Object | `null` | 命令注册表，状态唯一来源 |
| `modelValue` | String | `''` | 激活 tab 的 key；缺省落到首个常驻 tab |
| `collapsed` | Boolean | `false` | 真折叠态（受控可选；内部 toggle 经 `update:collapsed` 回写） |
| `contextTabs` | Array | `[]` | `{ id, label, when(ctx) }`，声明式唤出 |
| `ctx` | Object | `{}` | 选区/焦点上下文，喂给 `registry.state` |
| `persistKey` | String | `''` | 非空即按产品持久化折叠态 |
| `overflowLabel` | String | `'更多'` | 窄屏溢出入口文案 |
| `peek` | Boolean | `true` | 折叠后 hover/focus tab 条时浮层临时展开 |

## Emits

| 名称 | 载荷 | 说明 |
| --- | --- | --- |
| `update:modelValue` | key | 激活 tab 变化 |
| `update:collapsed` | boolean | 折叠态回写 |
| `change` | key | tab 切换 |
| `command` | id | 命令请求；跑不跑由消费方决定（`registry.run`） |

## Slots

| 名称 | 作用域 | 说明 |
| --- | --- | --- |
| —— | —— | 无（条目由 schema 渲染） |

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
