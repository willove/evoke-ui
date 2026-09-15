# CommandPalette 命令面板

⌘K 风格的命令面板：关键词过滤（名称 + 关键词 + 分组）、分组渲染、↑↓/Enter/Esc 全键盘操作。适合中后台的全局快捷入口与动作搜索。

## 基础用法

面板由 `v-model` 控制开关；动作执行后自动关闭，`action` 返回 `false` 可保持面板打开（如需二次确认的场景）：

<DemoBlock>
  <eb-button type="primary" @click="open = true">打开命令面板（Ctrl/⌘ + K）</eb-button>
  <eb-text v-if="lastRun" size="small" type="info" style="margin-top:8px;display:block">最近执行：{{ lastRun }}</eb-text>
  <eb-command-palette v-model="open" :commands="commands" />
</DemoBlock>

## 快捷键唤起

页面级接入通常配合全局快捷键，注意在卸载时移除监听：

```vue
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const open = ref(false)
const onKeydown = (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    open.value = !open.value
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <eb-command-palette v-model="open" :commands="commands" />
</template>
```

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const open = ref(false)
const lastRun = ref('')
const commands = [
  { id: 'new-order', label: '新建订单', icon: 'file-add', group: '操作', hotkey: '⌘N', keywords: ['create', '下单'], action: () => (lastRun.value = '新建订单') },
  { id: 'search', label: '搜索客户', icon: 'search', group: '操作', keywords: ['customer'], action: () => (lastRun.value = '搜索客户') },
  { id: 'theme', label: '切换明暗主题', icon: 'sunny', group: '设置', hint: '跟随系统', action: () => (lastRun.value = '切换主题') },
  {
    id: 'danger',
    label: '清空回收站',
    icon: 'inbox',
    group: '设置',
    action: () => {
      lastRun.value = '清空回收站（面板保持打开）'
      return false
    },
  },
]

const onKeydown = (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    open.value = !open.value
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<ApiTable title="CommandPalette Props" :rows="[
  { name: 'modelValue', desc: '面板开关（v-model）', type: 'boolean', default: 'false' },
  { name: 'commands', desc: '命令清单，项结构见下表', type: 'array', default: '[]' },
  { name: 'placeholder', desc: '搜索框占位文案', type: 'string', default: '输入命令或搜索…' },
]" />

<ApiTable title="Command 项结构" :rows="[
  { name: 'id', desc: '命令唯一标识', type: 'string | number', default: '—' },
  { name: 'label', desc: '命令名称（参与过滤）', type: 'string', default: '—' },
  { name: 'icon', desc: '图标名', type: 'string', default: '—' },
  { name: 'group', desc: '分组名（相邻同组合并展示，缺省为「命令」）', type: 'string', default: '—' },
  { name: 'hotkey', desc: '右侧快捷键标记（仅展示）', type: 'string', default: '—' },
  { name: 'hint', desc: '次级说明文案', type: 'string', default: '—' },
  { name: 'keywords', desc: '补充搜索关键词', type: 'string[]', default: '[]' },
  { name: 'action', desc: '执行函数；返回 false 时执行后不关闭面板', type: '() => any', default: '—' },
]" />

<ApiTable title="CommandPalette Exposes" :rows="[
  { name: 'open', desc: '打开面板', type: '() => void', default: '—' },
  { name: 'close', desc: '关闭面板', type: '() => void', default: '—' },
]" />
