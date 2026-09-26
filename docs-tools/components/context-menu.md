# EtContextMenu · 右键菜单

底座右键菜单的命令表包装：分区、子菜单、键盘漫游，状态与工具区同源。

```vue
<script setup>
import { ref } from 'vue'
const ctx = { hasSelection: true }
const schema = [
  { key: 'c-copy', type: 'item', command: 'copy' },
  { key: 'c-sep', type: 'separator' },
  { key: 'c-bold', type: 'item', command: 'bold' },
  { key: 'c-more', type: 'submenu', label: '更多', children: [
    { key: 'c-zoom', type: 'item', command: 'zoom-in' },
  ]},
]
</script>

<template>
  <et-context-menu :registry="registry" :schema="schema" :ctx="ctx" @command="onCommand">
    <main>画布（在此右键）</main>
  </et-context-menu>
</template>
```

## Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `registry` | Object | 必填 | 命令注册表 |
| `schema` | Array | `[]` | 菜单节点：`item`（绑 command）/ `separator` / `submenu`（label + 递归 children） |
| `ctx` | Object | `{}` | 推演 `enabled` 的上下文 |
| `disabled` | Boolean | `false` | 关闭本菜单 |

## Emits

| 名称 | 载荷 | 说明 |
| --- | --- | --- |
| `command` | id | 条目点击；跑不跑由消费方决定 |
| `visible-change` | boolean | 菜单开合 |

## Slots

| 名称 | 作用域 | 说明 |
| --- | --- | --- |
| 默认 | —— | 触发器区域（画布宿主） |

## 行为

- schema → 底座 items：`separator` 落在紧随其后的那一项上方（底座 `divided` 语义），前导与连续分隔折叠；`submenu` 递归映射为 `children`。
- 键盘漫游：方向键 / Home / End 移动激活项（跳过禁用）、Enter/Space 执行、ArrowRight 进子菜单、ArrowLeft 回退；执行或关闭后焦点归还触发器。
- Esc 收敛由底座 document 级监听负责，本包装不重复监听（避免双关）。
- 打开后焦点接入浮层根（必要时补 `tabindex="-1"`）。
- 暴露 `open(target, override)` / `close()`。

## 令牌与门禁

- G3：`disabled` 只从 `registry.state(command, ctx).enabled` 读，菜单不本地推演。
- G5：document 级 keydown 判 `isImeComposing`。
- 菜单密度走 `--et-menu-*`（全局底座浮层类上生效，见 [EtDropdown](dropdown.md)）。
