<template>
  <div class="eb-chat-content" :class="{ 'is-bordered': bordered }" :style="contentStyle">
    <div v-if="$slots.header" class="eb-chat-content__header">
      <slot name="header" />
    </div>
    <slot />
    <div v-if="$slots.footer" class="eb-chat-content__footer">
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

.eb-chat-content {
  display: flex;
  flex-direction: column;
  background: var(--eb-bg-color);
  border-radius: var(--eb-radius-xl);
  overflow: hidden;
}

.eb-chat-content.is-bordered {
  border: 1px solid var(--eb-border-color);
}

.eb-chat-content__header {
  flex-shrink: 0;
}

.eb-chat-content.is-bordered .eb-chat-content__header {
  border-bottom: 1px solid var(--eb-border-color-lighter);
}

.eb-chat-content__footer {
  flex-shrink: 0;
  padding: var(--eb-space-4);
  background: transparent;
}

.eb-chat-content.is-bordered .eb-chat-content__footer {
  border-top: 1px solid var(--eb-border-color-lighter);
  background: var(--eb-bg-color-page);
}
</style>
