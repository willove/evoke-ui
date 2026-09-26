<template>
  <span
    v-if="hasData"
    class="eb-chat-usage"
    :class="[`eb-chat-usage--${size}`, { 'is-bare': bare }]"
    :title="detailText"
  >
    <!-- 有明细才做成可点胶囊：一行摘要常驻，明细阶梯披露（触屏与键盘都能拿到）；
         无明细时保持纯读数，不做假的可点控件 -->
    <eb-popover v-if="rows.length" trigger="click" placement="top" :width="200">
      <button type="button" class="eb-chat-usage__trigger" :aria-label="labels.usage.disclosure">
        <eb-icon name="data-line" :size="14" aria-hidden="true" />
        <span class="eb-chat-usage__tokens">{{ tokensText }}</span>
        <template v-if="costText">
          <span class="eb-chat-usage__sep" aria-hidden="true">·</span>
          <span class="eb-chat-usage__cost">{{ costText }}</span>
        </template>
      </button>

      <template #content>
        <ul class="eb-chat-usage__rows">
          <li v-for="row in rows" :key="row.key" class="eb-chat-usage__row">
            <span class="eb-chat-usage__row-label">{{ row.label }}</span>
            <span class="eb-chat-usage__row-value">{{ row.value }}</span>
          </li>
        </ul>
      </template>
    </eb-popover>

    <template v-else>
      <span class="eb-chat-usage__tokens">{{ tokensText }}</span>
      <span v-if="costText" class="eb-chat-usage__sep" aria-hidden="true">·</span>
      <span v-if="costText" class="eb-chat-usage__cost">{{ costText }}</span>
    </template>
    <span class="eb-chat-usage__detail" role="status">{{ detailText }}</span>
  </span>
</template>

<script setup>
import { computed } from "vue";
import EbIcon from "@wil-works/evoke-business-ui/icon";
import EbPopover from "@wil-works/evoke-business-ui/popover";
import { useChatLabels } from "./labels";
const labels = useChatLabels();
const props = defineProps({
  /** 单条用量 { promptTokens?, completionTokens?, totalTokens?, cost?, currency? } */
  usage: { type: Object, required: false, default: null },
  /** 多条用量（按会话汇总时给这个） */
  items: { type: Array, required: false, default: null },
  /** compact 用于消息元信息行，default 用于独立展示 */
  size: { type: String, required: false, default: "compact" },
  /** 去掉底色，直接融进上下文（例如放在元信息行里） */
  bare: { type: Boolean, required: false, default: true },
  /** 关掉阶梯披露，只留一行摘要 */
  disclosure: { type: Boolean, required: false, default: true }
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
const fmtToken = (n) => formatTokens(Number(n) || 0);

/**
 * 明细行：**为 0 的分项不渲染**（assistant-ui / AI Elements 同口径），
 * 成本只在宿主给了 cost 时出现——多数宿主没有价目表，常驻会显示假数字。
 */
const rows = computed(() => {
  if (!props.disclosure) return [];
  const u = resolved.value;
  if (!u) return [];
  const out = []
  // 注意：格式化后的 '0' 是字符串真值——按「数值为 0 就不渲染」判，而不是按真假
  const push = (key, label, value) => {
    const text = String(value ?? '').trim()
    if (!text || text === '0') return
    out.push({ key, label, value: text })
  }
  push('input', labels.usage.input, fmtToken(u.promptTokens))
  push('output', labels.usage.output, fmtToken(u.completionTokens))
  push('cacheRead', labels.usage.cacheRead, u.cacheReadTokens ? fmtToken(u.cacheReadTokens) : '')
  push('cacheWrite', labels.usage.cacheWrite, u.cacheWriteTokens ? fmtToken(u.cacheWriteTokens) : '')
  push('reasoning', labels.usage.reasoning, u.reasoningTokens ? fmtToken(u.reasoningTokens) : '')
  push('ttft', labels.usage.ttft, u.ttftMs ? `${(Number(u.ttftMs) / 1000).toFixed(2)}s` : '')
  push('speed', labels.usage.speed, u.tokensPerSecond ? `${Number(u.tokensPerSecond).toFixed(1)} tok/s` : '')
  push('cost', labels.usage.cost, costText.value)
  return out;
});

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
.eb-chat-usage__trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
}

.eb-chat-usage__trigger:hover {
  color: var(--eb-color-primary);
}

.eb-chat-usage__trigger:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
  border-radius: var(--eb-radius-sm);
}

.eb-chat-usage__rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: var(--eb-font-size-xs);
}

.eb-chat-usage__row {
  display: flex;
  align-items: center;
  gap: var(--eb-space-2);
}

.eb-chat-usage__row-label {
  color: var(--eb-text-color-secondary);
}

.eb-chat-usage__row-value {
  margin-left: auto;
  color: var(--eb-text-color-primary);
  font-variant-numeric: tabular-nums;
}
</style>
