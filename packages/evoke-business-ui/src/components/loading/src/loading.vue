<template>
  <Transition name="ev-loading-fade">
    <div
      v-if="visible"
      class="ev-loading-mask ev-loading-mask"
      :class="{ 'is-fullscreen': fullscreen }"
      :style="{ zIndex, backgroundColor: background }"
      role="status"
      :aria-label="text || 'loading'"
    >
      <div class="ev-loading-spinner">
        <svg class="circular" viewBox="0 0 50 50" aria-hidden="true">
          <circle class="path" cx="25" cy="25" r="20" fill="none" />
        </svg>
        <p v-if="text" class="ev-loading-text">{{ text }}</p>
      </div>
    </div>
  </Transition>
</template>

<script setup>
/**
 * EvLoading 视图 — 加载遮罩（service/指令共用）
 */
import { ref } from 'vue'

defineOptions({ name: 'EvLoadingView' })

const props = defineProps({
  fullscreen: { type: Boolean, default: false },
  text: { type: String, default: '' },
  background: { type: String, default: undefined },
  zIndex: { type: Number, default: undefined },
})

const visible = ref(true)

defineExpose({
  setVisible: (v) => {
    visible.value = !!v
  },
})
</script>

<style src="./style.css"></style>
