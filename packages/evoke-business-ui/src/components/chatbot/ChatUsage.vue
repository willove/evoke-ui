<template>
  <span
    v-if="hasData"
    class="eb-chat-usage"
    :class="[`eb-chat-usage--${size}`, { 'is-bare': bare }]"
    :title="detailText"
  >
    <span class="eb-chat-usage__tokens">{{ tokensText }}</span>
    <template v-if="costText">
      <span class="eb-chat-usage__sep" aria-hidden="true">·</span>
      <span class="eb-chat-usage__cost">{{ costText }}</span>
    </template>
    <span class="eb-chat-usage__detail" role="status">{{ detailText }}</span>
  </span>
</template>

<script setup>
import { computed } from "vue";
import { chatLabels as labels } from "./labels";
const props = defineProps({
  /** 单条用量 { promptTokens?, completionTokens?, totalTokens?, cost?, currency? } */
  usage: { type: Object, required: false, default: null },
  /** 多条用量（按会话汇总时给这个） */
  items: { type: Array, required: false, default: null },
  /** compact 用于消息元信息行，default 用于独立展示 */
  size: { type: String, required: false, default: "compact" },
  /** 去掉底色，直接融进上下文（例如放在元信息行里） */
  bare: { type: Boolean, required: false, default: true }
});
const emit = defineEmits([]);

/** 一千 / 一百万 以上折算，保留一位小数；小于一千原样 */
function formatTokens(n) {
  const value = Number(n) || 0;
  if (value < 1000) return String(value);
  if (value < 1000000) return `${(value / 1000).toFixed(1)}k`;
  return `${(value / 1000000).toFixed(1)}M`;
}

/** 汇总多条：total 优先，缺失时用 prompt+completion 补；成本按币种累加 */
function sumUsage(list) {
  const acc = { promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0, currency: "" };
  let hasCost = false;
  for (const item of list || []) {
    if (!item) continue;
    const prompt = Number(item.promptTokens) || 0;
    const completion = Number(item.completionTokens) || 0;
    acc.promptTokens += prompt;
    acc.completionTokens += completion;
    acc.totalTokens += Number(item.totalTokens) || prompt + completion;
    if (typeof item.cost === "number") {
      hasCost = true;
      acc.cost += item.cost;
      // 币种取第一个出现的，混币种不做汇率换算——那是宿主的业务
      if (!acc.currency) acc.currency = item.currency || "";
    }
  }
  if (!hasCost) delete acc.cost;
  return acc;
}

const resolved = computed(() => (props.items ? sumUsage(props.items) : props.usage || null));
const hasData = computed(() => {
  const u = resolved.value;
  return !!u && (u.totalTokens > 0 || u.promptTokens > 0 || u.completionTokens > 0 || typeof u.cost === "number");
});
const total = computed(() => {
  const u = resolved.value;
  if (!u) return 0;
  return u.totalTokens || (Number(u.promptTokens) || 0) + (Number(u.completionTokens) || 0);
});
const tokensText = computed(() => labels.usage.tokens(formatTokens(total.value)));
const costText = computed(() => {
  const u = resolved.value;
  if (!u || typeof u.cost !== "number") return "";
  const amount = u.cost < 0.01 ? u.cost.toFixed(4) : u.cost.toFixed(2);
  return `${u.currency || ""}${amount}`.trim();
});
const detailText = computed(() => {
  const u = resolved.value;
  if (!u) return "";
  const parts = [labels.usage.prompt(formatTokens(Number(u.promptTokens) || 0))];
  parts.push(labels.usage.completion(formatTokens(Number(u.completionTokens) || 0)));
  const text = parts.join("，");
  return props.items ? labels.usage.summary(listLength.value, text) : text;
});
const listLength = computed(() => (props.items || []).filter(Boolean).length);

defineExpose({ sumUsage, formatTokens });
</script>

<style scoped>

.eb-chat-usage {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-variant-numeric: tabular-nums;
}

.eb-chat-usage:not(.is-bare) {
  padding: 1px var(--eb-space-2);
  border-radius: var(--eb-radius-sm);
  background: var(--eb-fill-color-light);
}

.eb-chat-usage--compact {
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
}

.eb-chat-usage--default {
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-secondary);
}

.eb-chat-usage__cost {
  color: var(--eb-text-color-secondary);
}

/* 明细交给读屏与悬浮提示：视觉上不占位，但信息不丢 */
.eb-chat-usage__detail {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
</style>
