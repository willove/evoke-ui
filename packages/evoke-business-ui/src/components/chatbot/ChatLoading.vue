<template>
  <div class="ev-chat-loading">
    <div class="ev-chat-loading__dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
    <span v-if="text" class="ev-chat-loading__text">{{ text }}</span>
  </div>
</template>

<script setup>
const props = defineProps({
  text: { type: String, required: false, default: "" }
});

</script>

<style scoped>

.ev-chat-loading {
  display: inline-flex;
  align-items: center;
  gap: var(--ev-space-2);
  padding: var(--ev-space-2) var(--ev-space-3);
}

.ev-chat-loading__dots {
  display: inline-flex;
  gap: 4px;
}

.ev-chat-loading__dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ev-color-primary);
  animation: ev-chat-loading-bounce 1.4s ease-in-out infinite;
}

.ev-chat-loading__dots span:nth-child(1) {
  animation-delay: 0s;
}

.ev-chat-loading__dots span:nth-child(2) {
  animation-delay: 0.16s;
}

.ev-chat-loading__dots span:nth-child(3) {
  animation-delay: 0.32s;
}

@keyframes ev-chat-loading-bounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.ev-chat-loading__text {
  font-size: var(--ev-font-size-sm);
  color: var(--ev-text-color-secondary);
}
</style>
