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

    <!-- 动作用库内 EbButton（type 取值同源），尺寸取 small 以贴合卡片底部 -->
    <div class="eb-chat-confirmation__actions">
      <eb-button
        v-for="action in actions"
        :key="action.key"
        class="eb-chat-confirmation__btn"
        :class="{ 'is-chosen': action.key === confirmation?.responseKey }"
        :type="action.type || 'default'"
        :icon="actionIcon(action)"
        size="small"
        :disabled="!pending"
        @click="emit('respond', confirmation, action.key)"
      >
        <span>{{ action.label }}</span>
      </eb-button>
    </div>

    <p class="eb-chat-confirmation__foot">
      <template v-if="pending">{{ labels.confirmation.hint }}</template>
      <template v-else-if="chosenLabel">{{ labels.confirmation.responded(chosenLabel) }}</template>
    </p>
  </div>
</template>

<script setup>
import EbIcon from "@wil-works/evoke-business-ui/icon"
import EbButton from "@wil-works/evoke-business-ui/button"
import { computed } from "vue";
import { useChatLabels } from "./labels";
const labels = useChatLabels();
const props = defineProps({
  /** { id, title, description?, actions: [{ key, label, type?, icon?, status? }], status, responseKey?, respondedAt? } */
  confirmation: { type: Object, required: false, default: () => ({}) }
});
const emit = defineEmits(["respond"]);
const status = computed(() => props.confirmation?.status || "pending");
const pending = computed(() => status.value === "pending");
const actions = computed(() => props.confirmation?.actions || []);
const statusText = computed(() => labels.confirmation.status[status.value] || status.value);
/**
 * 动作图标：动作自己给 `icon` 就用它（库内图标名）；
 * 响应后那颗挑中的换成对勾——「选了哪个」比「这颗是什么动作」更该被看见
 */
function actionIcon(action) {
  const chosen = action.key === props.confirmation?.responseKey && !pending.value;
  if (chosen) return "check";
  return action.icon || undefined;
}
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

/* 按钮外观交给 EbButton（尺寸 small）；这里只管排布与「已选中」标记 */
.eb-chat-confirmation__actions .eb-chat-confirmation__btn.is-chosen {
  border-color: var(--eb-color-primary);
  color: var(--eb-color-primary);
}

.eb-chat-confirmation__actions .eb-chat-confirmation__btn.is-chosen.eb-button {
  background: var(--eb-color-primary-light-9);
}

.eb-chat-confirmation__foot {
  margin: var(--eb-space-2) 0 0;
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
}
</style>
