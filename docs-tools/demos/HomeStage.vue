<template>
  <!-- 首屏实物：一个真·工具区（命令表驱动，与消费方真实接线同构） -->
  <et-ribbon-bar
    v-model="active"
    :schema="SCHEMA"
    :registry="registry"
    :ctx="ctx"
    persist-key="docs-home-ribbon"
    @command="onCommand"
  />
</template>

<script setup>
import { computed, h, ref } from 'vue'
import { createCommandRegistry } from '@wil-works/evoke-tools-ui/runtime'

const registry = createCommandRegistry()
registry.register({ id: 'copy', title: '复制', desc: '复制所选', keys: 'mod+c', run: () => {} })
registry.register({ id: 'clear', title: '清除', desc: '清除格式', keys: '', run: () => {} })
registry.register({ id: 'bold', title: '加粗', desc: '加粗所选', keys: 'mod+b', run: () => {} })
registry.register({ id: 'italic', title: '倾斜', desc: '倾斜所选', keys: 'mod+i', run: () => {} })
registry.register({ id: 'font-size', title: '字号', desc: '正文字号', keys: '', run: () => {} })

const SCHEMA = [
  {
    key: 'home',
    type: 'tab',
    label: '开始',
    children: [
      {
        key: 'g-clipboard',
        type: 'group',
        label: '剪贴板',
        children: [
          { key: 'i-copy', type: 'item', command: 'copy', grid: { rowSpan: 2 } },
          { key: 'i-clear', type: 'item', command: 'clear', grid: { rowSpan: 2 } },
        ],
      },
      {
        key: 'g-font',
        type: 'group',
        label: '字体',
        children: [
          { key: 'i-bold', type: 'item', command: 'bold', grid: { rowSpan: 2 } },
          { key: 'i-italic', type: 'item', command: 'italic', grid: { rowSpan: 2 } },
          { key: 'i-font', type: 'select', command: 'font-size', width: 88 },
        ],
      },
    ],
  },
]

const active = ref('home')
const picked = ref('')
const ctx = computed(() => ({ hasSelection: picked.value === 'sel' }))
function onCommand(id) {
  picked.value = id
}
// render 用的空槽位（保持模板简洁）
const _ = h
</script>
