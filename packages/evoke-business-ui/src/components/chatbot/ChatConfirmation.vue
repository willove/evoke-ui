<template>
  <div
    class="eb-chat-confirmation"
    :class="`is-${status}`"
    role="group"
    :aria-label="labels.confirmation.group"
    aria-live="polite"
  >
    <div class="eb-chat-confirmation__head">
      <span class="eb-chat-confirmation__icon" aria-hidden="true">
        <eb-icon :name="statusIcon" :size="14" />
      </span>
      <div class="eb-chat-confirmation__heading">
        <p class="eb-chat-confirmation__title">{{ confirmation?.title || labels.confirmation.title }}</p>
        <p v-if="confirmation?.description" class="eb-chat-confirmation__desc">{{ confirmation.description }}</p>
      </div>
      <span class="eb-chat-confirmation__badge">{{ statusText }}</span>
    </div>

    <div class="eb-chat-confirmation__actions">
      <button
        v-for="action in actions"
        :key="action.key"
        type="button"
        class="eb-chat-confirmation__btn"
        :class="[`is-${action.type || 'default'}`, { 'is-chosen': action.key === confirmation?.responseKey }]"
        :disabled="!pending"
        @click="emit('respond', confirmation, action.key)"
      >
        <eb-icon v-if="action.key === confirmation?.responseKey && !pending" name="check" :size="12" />
        <span>{{ action.label }}</span>
      </button>
    </div>

    <p class="eb-chat-confirmation__foot">
      <template v-if="pending">{{ labels.confirmation.hint }}</template>
      <template v-else-if="chosenLabel">{{ labels.confirmation.responded(chosenLabel) }}</template>
    </p>
  </div>
</template>

<script setup>
import EbIcon from "../icon/index.vue"
import { computed } from "vue";
import { chatLabels as labels } from "./labels";
const props = defineProps({
  /** { id, title, description?, actions: [{ key, label, type? }], status, responseKey?, respondedAt? } */
  confirmation: { type: Object, required: false, default: () => ({}) }
});
const emit = defineEmits(["respond"]);
const status = computed(() => props.confirmation?.status || "pending");
const pending = computed(() => status.value === "pending");
const actions = computed(() => props.confirmation?.actions || []);
const statusText = computed(() => labels.confirmation.status[status.value] || status.value);
const chosenLabel = computed(() => {
  const key = props.confirmation?.responseKey;
  if (!key) return "";
  return actions.value.find((a) => a.key === key)?.label || key;
});
const statusIcon = computed(() => {
  switch (status.value) {
    case "approved":
      return "check";
    case "rejected":
      return "close";
    case "expired":
      return "time";
    default:
      return "question-answer";
  }
});

</script>

<style scoped>

.eb-chat-confirmation {
  margin-top: var(--eb-space-2);
  padding: var(--eb-space-3);
  border: 1px solid var(--eb-color-warning-light-7);
  border-radius: var(--eb-radius-md);
  background: var(--eb-color-warning-light-9);
}

/* 已批准 / 已拒绝 / 已超时都退成中性底：结论已定，不该再用警示色抢注意力 */
.eb-chat-confirmation.is-approved {
  border-color: var(--eb-color-success-light-7);
  background: var(--eb-color-success-light-9);
}

.eb-chat-confirmation.is-rejected,
.eb-chat-confirmation.is-expired {
  border-color: var(--eb-border-color-lighter);
  background: var(--eb-fill-color-lighter);
}

.eb-chat-confirmation__head {
  display: flex;
  align-items: flex-start;
  gap: var(--eb-space-2);
}

.eb-chat-confirmation__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: 50%;
  color: var(--eb-color-warning);
}

.eb-chat-confirmation.is-approved .eb-chat-confirmation__icon {
  color: var(--eb-color-success);
}

.eb-chat-confirmation.is-rejected .eb-chat-confirmation__icon {
  color: var(--eb-color-danger);
}

.eb-chat-confirmation.is-expired .eb-chat-confirmation__icon {
  color: var(--eb-text-color-placeholder);
}

.eb-chat-confirmation__heading {
  flex: 1;
  min-width: 0;
}

.eb-chat-confirmation__title {
  margin: 0;
  font-size: var(--eb-font-size-sm);
  font-weight: var(--eb-font-weight-medium);
  color: var(--eb-text-color-primary);
  line-height: 1.5;
}

.eb-chat-confirmation__desc {
  margin: var(--eb-space-1) 0 0;
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-secondary);
  line-height: 1.6;
  word-break: break-word;
}

.eb-chat-confirmation__badge {
  flex-shrink: 0;
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-secondary);
}

.eb-chat-confirmation__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--eb-space-2);
  margin-top: var(--eb-space-3);
}

.eb-chat-confirmation__btn {
  display: inline-flex;
  align-items: center;
  gap: var(--eb-space-1);
  padding: var(--eb-space-1) var(--eb-space-4);
  border: 1px solid var(--eb-border-color);
  border-radius: var(--eb-radius-md);
  background: var(--eb-bg-color-overlay);
  color: var(--eb-text-color-regular);
  font-size: var(--eb-font-size-sm);
  font-family: inherit;
  cursor: pointer;
  transition: background-color var(--eb-duration-fast) var(--eb-ease-out), border-color var(--eb-duration-fast) var(--eb-ease-out), color var(--eb-duration-fast) var(--eb-ease-out);
}

.eb-chat-confirmation__btn:hover:not(:disabled) {
  border-color: var(--eb-color-primary-light-5);
  color: var(--eb-color-primary);
}

/* type 取值与 EbButton 一致（default/primary/success/warning/info/danger/text） */
.eb-chat-confirmation__btn.is-primary {
  border-color: var(--eb-color-primary);
  background: var(--eb-color-primary);
  color: #fff;
}

.eb-chat-confirmation__btn.is-primary:hover:not(:disabled) {
  background: var(--eb-color-primary-dark-2);
  color: #fff;
}

.eb-chat-confirmation__btn.is-danger {
  border-color: var(--eb-color-danger);
  background: var(--eb-color-danger);
  color: #fff;
}

.eb-chat-confirmation__btn.is-success {
  border-color: var(--eb-color-success);
  background: var(--eb-color-success);
  color: #fff;
}

.eb-chat-confirmation__btn.is-warning {
  border-color: var(--eb-color-warning);
  background: var(--eb-color-warning);
  color: #fff;
}

.eb-chat-confirmation__btn.is-info {
  border-color: var(--eb-color-info);
  background: var(--eb-color-info);
  color: #fff;
}

.eb-chat-confirmation__btn.is-text {
  border-color: transparent;
  background: transparent;
}

.eb-chat-confirmation__btn:disabled {
  cursor: default;
  opacity: 0.55;
}

/* 已响应的那个按钮保持满对比，让「选了哪个」一眼可辨 */
.eb-chat-confirmation__btn.is-chosen:disabled {
  opacity: 1;
}

.eb-chat-confirmation__btn:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}

.eb-chat-confirmation__foot {
  margin: var(--eb-space-2) 0 0;
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
}
</style>
