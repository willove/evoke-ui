<template>
  <!-- 轻提示：role=status + aria-live，自动关定时器随卸载清理 -->
  <div class="toast-stage">
    <eb-button v-for="t in types" :key="t" size="small" @click="show(t)">{{ t }}</eb-button>
    <et-toast v-model="visible" :message="message" :type="kind" :duration="2400" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
const types = ['info', 'success', 'warn', 'error']
const visible = ref(false)
const message = ref('')
const kind = ref('info')
function show(t) {
  kind.value = t
  message.value = `这是 ${t} 提示`
  visible.value = true
}
</script>
