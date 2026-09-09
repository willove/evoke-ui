<template>
  <div class="ev-chat-content" :class="{ 'is-bordered': bordered }" :style="contentStyle">
    <div v-if="$slots.header" class="ev-chat-content__header">
      <slot name="header" />
    </div>
    <slot />
    <div v-if="$slots.footer" class="ev-chat-content__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
const props = defineProps({
  height: { type: [String, Number], required: false, default: "100%" },
  width: { type: [String, Number], required: false, default: "100%" },
  bordered: { type: Boolean, required: false, default: false }
});
const contentStyle = computed(() => {
  const style = {};
  if (props.height) {
    style.height = typeof props.height === "number" ? `${props.height}px` : props.height;
  }
  if (props.width) {
    style.width = typeof props.width === "number" ? `${props.width}px` : props.width;
  }
  return style;
});

</script>

<style scoped>

.ev-chat-content {
  display: flex;
  flex-direction: column;
  background: var(--ev-bg-color);
  border-radius: var(--ev-radius-xl);
  overflow: hidden;
}

.ev-chat-content.is-bordered {
  border: 1px solid var(--ev-border-color);
}

.ev-chat-content__header {
  flex-shrink: 0;
}

.ev-chat-content.is-bordered .ev-chat-content__header {
  border-bottom: 1px solid var(--ev-border-color-lighter);
}

.ev-chat-content__footer {
  flex-shrink: 0;
  padding: var(--ev-space-4);
  background: transparent;
}

.ev-chat-content.is-bordered .ev-chat-content__footer {
  border-top: 1px solid var(--ev-border-color-lighter);
  background: var(--ev-bg-color-page);
}
</style>
