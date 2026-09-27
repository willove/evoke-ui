# EtCommandPalette · 命令面板

底座命令面板的命令表适配器：条目来自注册表，快捷键平台符号化，最近使用可置顶。

```vue
<script setup>
import { ref } from 'vue'
const open = ref(false)
const ctx = { hasSelection: true }
</script>

<template>
  <et-command-palette
    v-model="open"
    :registry="registry"
    :ctx="ctx"
    recent-key="my-app-recent"
    hotkey="mod+k"
    @command="onCommand"
  />
</template>
```

## API

<CompApi id="command-palette" />

## 行为

- 条目由 `registry.list()` 生成：`label` = title、`hint` = desc、`hotkey` = 平台符号化 keys、`group` = group。
- 禁用命令不过滤：item 标 disabled 且 action 返回 false，面板保持打开（用户要看见为什么不可用）。
- 最近使用按「选中」记录，与是否自动执行无关；隐私模式下降级为不记录。
- 打开时刷新一次（拿最新 enabled 与最近使用序）。
- 暴露 `open()` / `close()`。

## 令牌与门禁

- 快捷键列走 `runtime/keys` 平台符号化，不手拼字符。
- 焦点陷阱 / Esc / 焦点归还与 EtDialog、EtBackstage 同一套 `runtime/focus/trap`。
- G3：状态只从 `registry.state` 读。
