<template>
  <div
    v-if="resolved.length"
    class="eb-chat-suggestion"
    :class="[`eb-chat-suggestion--${layout}`]"
    role="group"
    :aria-label="labels.suggestion.group"
  >
    <button
      v-for="(s, i) in resolved"
      :key="i"
      type="button"
      class="eb-chat-suggestion__chip"
      :disabled="disabled"
      @click="pick(s)"
    >
      <eb-icon v-if="icon" :name="icon" :size="13" />
      <span>{{ s.text }}</span>
    </button>
  </div>
</template>

<script setup>
import EbIcon from "@wil-works/evoke-business-ui/icon"
import { computed } from "vue";
import { useChatLabels } from "./labels";
const labels = useChatLabels();
const props = defineProps({
  /** 建议项：string 或 { text, prompt? }；prompt 缺省用 text */
  items: { type: Array, required: false, default: () => [] },
  /** row 用于消息尾部追问，column 用于欢迎区示例问题 */
  layout: { type: String, required: false, default: "row" },
  /** 传图标名则每枚 chip 前置该图标；默认不带 */
  icon: { type: String, required: false, default: "" },
  disabled: { type: Boolean, required: false, default: false }
});
const emit = defineEmits(["pick"]);
const resolved = computed(() => props.items.map((item) => typeof item === "string" ? { text: item, prompt: item } : { prompt: item.prompt ?? item.text, ...item }));
function pick(s) {
  if (props.disabled) return;
  emit("pick", s);
}

</script>

<style scoped>

.eb-chat-suggestion {
  display: flex;
  gap: var(--eb-space-2);
  margin-top: var(--eb-space-2);
}

.eb-chat-suggestion--row {
  flex-wrap: wrap;
}

.eb-chat-suggestion--column {
  flex-direction: column;
  align-items: stretch;
}

.eb-chat-suggestion__chip {
  display: inline-flex;
  align-items: center;
  gap: var(--eb-space-1);
  max-width: 100%;
  padding: var(--eb-space-1) var(--eb-space-3);
  border: 1px solid var(--eb-border-color-light);
  border-radius: var(--eb-radius-lg);
  background: var(--eb-bg-color-overlay);
  color: var(--eb-text-color-regular);
  font-size: var(--eb-font-size-sm);
  font-family: inherit;
  line-height: 1.5;
  text-align: left;
  cursor: pointer;
  transition: border-color var(--eb-duration-fast) var(--eb-ease-out), color var(--eb-duration-fast) var(--eb-ease-out), background-color var(--eb-duration-fast) var(--eb-ease-out);
}

.eb-chat-suggestion__chip span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.eb-chat-suggestion--column .eb-chat-suggestion__chip span {
  white-space: normal;
}

.eb-chat-suggestion__chip:hover:not(:disabled) {
  border-color: var(--eb-color-primary-light-5);
  color: var(--eb-color-primary);
  background: var(--eb-color-primary-light-9);
}

.eb-chat-suggestion__chip:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}

.eb-chat-suggestion__chip:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
