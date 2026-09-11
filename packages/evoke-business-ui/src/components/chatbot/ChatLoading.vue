<template>
  <div class="eb-chat-loading">
    <div class="eb-chat-loading__dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
    <span v-if="text" class="eb-chat-loading__text">{{ text }}</span>
  </div>
</template>

<script setup>
const props = defineProps({
  text: { type: String, required: false, default: "" }
});

</script>

<style scoped>

.eb-chat-loading {
  display: inline-flex;
  align-items: center;
  gap: var(--eb-space-2);
  padding: var(--eb-space-2) var(--eb-space-3);
}

.eb-chat-loading__dots {
  display: inline-flex;
  gap: 4px;
}

.eb-chat-loading__dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--eb-color-primary);
  animation: eb-chat-loading-bounce 1.4s ease-in-out infinite;
}

.eb-chat-loading__dots span:nth-child(1) {
  animation-delay: 0s;
}

.eb-chat-loading__dots span:nth-child(2) {
  animation-delay: 0.16s;
}

.eb-chat-loading__dots span:nth-child(3) {
  animation-delay: 0.32s;
}

@keyframes eb-chat-loading-bounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.eb-chat-loading__text {
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-secondary);
}
</style>
