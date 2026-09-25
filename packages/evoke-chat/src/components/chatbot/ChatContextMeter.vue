<template>
  <eb-popover
    v-if="visible"
    trigger="click"
    placement="top"
    :width="240"
  >
    <button
      type="button"
      class="eb-chat-context"
      :class="toneClass"
      :aria-label="labels.context.aria(percent)"
      :title="labels.context.aria(percent)"
    >
      <svg class="eb-chat-context__ring" viewBox="0 0 16 16" aria-hidden="true">
        <circle class="eb-chat-context__track" cx="8" cy="8" r="6.5" />
        <circle
          class="eb-chat-context__arc"
          cx="8"
          cy="8"
          r="6.5"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashOffset"
        />
      </svg>
      <span class="eb-chat-context__percent">{{ percent }}%</span>
    </button>

    <template #content>
      <div class="eb-chat-context__panel">
        <p class="eb-chat-context__panel-title">
          {{ labels.context.used }} <span class="eb-chat-context__panel-value">~{{ format(used) }} / {{ format(capacity) }}</span>
        </p>
        <div v-if="segments.length" class="eb-chat-context__bar" aria-hidden="true">
          <span
            v-for="seg in segments"
            :key="seg.key"
            class="eb-chat-context__bar-seg"
            :class="`is-${seg.key}`"
            :style="{ width: `${seg.width}%` }"
          />
        </div>
        <ul v-if="segments.length" class="eb-chat-context__legend">
          <li v-for="seg in segments" :key="seg.key" class="eb-chat-context__legend-row">
            <span class="eb-chat-context__swatch" :class="`is-${seg.key}`" aria-hidden="true" />
            <span class="eb-chat-context__legend-label">{{ labels.context[seg.key] }}</span>
            <span class="eb-chat-context__legend-value">{{ format(seg.value) }}</span>
          </li>
        </ul>
      </div>
    </template>
  </eb-popover>
</template>

<script setup>
import { computed } from "vue";
import EbPopover from "@wil-works/evoke-business-ui/popover";
import { useChatLabels } from "./labels";

const labels = useChatLabels();
const props = defineProps({
  /** 已用 token（压力值/预估值） */
  used: { type: Number, required: false, default: 0 },
  /** 上下文窗口容量（token） */
  capacity: { type: Number, required: false, default: 0 },
  /** 三段构成：{ system?, tools?, messages? }（都是 token 数，缺的段不画） */
  breakdown: { type: Object, required: false, default: null }
});

const RADIUS = 6.5;
const circumference = computed(() => +(2 * Math.PI * RADIUS).toFixed(2));
const percent = computed(() => {
  if (!props.capacity || props.capacity <= 0) return 0;
  return Math.min(100, Math.round((props.used / props.capacity) * 100));
});
const dashOffset = computed(() => +(circumference.value * (1 - percent.value / 100)).toFixed(2));
/** 两侧缺一就不出现：拿不到窗口容量时画个环只会误导 */
const visible = computed(() => props.used > 0 && props.capacity > 0);
const toneClass = computed(() => {
  if (percent.value >= 90) return "is-danger";
  if (percent.value >= 75) return "is-warn";
  return "";
});

const SEGMENT_KEYS = ["system", "tools", "messages"];
const segments = computed(() => {
  const source = props.breakdown || {};
  const total = SEGMENT_KEYS.reduce((sum, key) => sum + (Number(source[key]) || 0), 0);
  if (!total) return [];
  return SEGMENT_KEYS
    .filter((key) => Number(source[key]) > 0)
    .map((key) => ({ key, value: Number(source[key]), width: (Number(source[key]) / total) * 100 }));
});

/** 一千 / 一百万以上折算，保留一位小数 */
function format(value) {
  const n = Number(value) || 0;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return String(n);
}
</script>

<style scoped>
.eb-chat-context {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px 2px 4px;
  border: 1px solid var(--eb-border-color-lighter);
  border-radius: 999px;
  background: var(--eb-fill-color-blank);
  color: var(--eb-text-color-secondary);
  font-family: inherit;
  font-size: var(--eb-font-size-xs);
  font-variant-numeric: tabular-nums;
  cursor: pointer;
}

.eb-chat-context:hover {
  border-color: var(--eb-color-primary-light-5);
  color: var(--eb-color-primary);
}

.eb-chat-context:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}

.eb-chat-context__ring {
  width: 16px;
  height: 16px;
  transform: rotate(-90deg);
}

.eb-chat-context__track {
  fill: none;
  stroke: var(--eb-fill-color);
  stroke-width: 2.5;
}

.eb-chat-context__arc {
  fill: none;
  stroke: var(--eb-color-primary);
  stroke-width: 2.5;
  stroke-linecap: round;
  transition: stroke-dashoffset var(--eb-duration-fast) var(--eb-ease-out);
}

.eb-chat-context.is-warn .eb-chat-context__arc {
  stroke: var(--eb-color-warning);
}

.eb-chat-context.is-danger .eb-chat-context__arc {
  stroke: var(--eb-color-danger);
}

.eb-chat-context.is-warn,
.eb-chat-context.is-danger {
  color: var(--eb-text-color-regular);
}

.eb-chat-context__panel {
  display: flex;
  flex-direction: column;
  gap: var(--eb-space-2);
}

.eb-chat-context__panel-title {
  margin: 0;
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-primary);
}

.eb-chat-context__panel-value {
  color: var(--eb-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

.eb-chat-context__bar {
  display: flex;
  height: 6px;
  overflow: hidden;
  border-radius: 3px;
  background: var(--eb-fill-color);
}

.eb-chat-context__bar-seg.is-system,
.eb-chat-context__swatch.is-system {
  background: var(--eb-color-primary);
}

.eb-chat-context__bar-seg.is-tools,
.eb-chat-context__swatch.is-tools {
  background: var(--eb-color-info);
}

.eb-chat-context__bar-seg.is-messages,
.eb-chat-context__swatch.is-messages {
  background: var(--eb-color-success);
}

.eb-chat-context__legend {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.eb-chat-context__legend-row {
  display: flex;
  align-items: center;
  gap: var(--eb-space-2);
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-regular);
}

.eb-chat-context__swatch {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

.eb-chat-context__legend-value {
  margin-left: auto;
  color: var(--eb-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .eb-chat-context__arc {
    transition: none;
  }
}
</style>