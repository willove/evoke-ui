<template>
  <!-- 文档标签：脏标记 aria 双通道 + closable=false 无关闭钮 + 溢出列表 -->
  <div class="doc-stage">
    <et-document-tabs v-model="active" :documents="docs" @close="onClose" />
    <p class="doc-stage__note">激活：<code>{{ active }}</code></p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const active = ref('a')
const docs = [
  { id: 'a', title: '一季度', dirty: true },
  { id: 'b', title: '二季度' },
  { id: 'notes', title: '备注', closable: false },
]
function onClose(id) {
  active.value = 'a'
}
</script>

<style scoped>
.doc-stage { display: flex; flex-direction: column; gap: 8px; }
.doc-stage__note { margin: 0; font-size: 12px; color: var(--eb-text-color-secondary); }
</style>
