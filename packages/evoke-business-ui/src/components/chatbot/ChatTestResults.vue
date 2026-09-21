<template>
  <div v-if="cases.length || hasSummary" class="eb-chat-test-results">
    <div class="eb-chat-test-results__summary" role="status">
      <span v-for="stat in stats" :key="stat.key" class="eb-chat-test-results__stat" :class="`is-${stat.key}`">
        <span class="eb-chat-test-results__dot" aria-hidden="true" />
        <span>{{ stat.label }}</span>
      </span>
      <span v-if="durationText" class="eb-chat-test-results__duration">{{ durationText }}</span>
      <button
        v-if="failedCases.length"
        type="button"
        class="eb-chat-test-results__toggle"
        :aria-expanded="String(showPassed)"
        @click="showPassed = !showPassed"
      >
        {{ showPassed ? labels.tests.onlyFailed : labels.tests.hidePassed }}
      </button>
    </div>

    <ul class="eb-chat-test-results__list">
      <li
        v-for="(item, i) in visibleCases"
        :key="item.name + i"
        class="eb-chat-test-results__case"
        :class="`is-${statusOf(item)}`"
      >
        <button type="button" class="eb-chat-test-results__head" @click="toggleCase(i)">
          <span class="eb-chat-test-results__marker" aria-hidden="true">
            <eb-icon :name="iconOf(item)" :size="11" />
          </span>
          <span class="eb-chat-test-results__name">{{ item.name }}</span>
          <span v-if="item.suite" class="eb-chat-test-results__suite">{{ item.suite }}</span>
          <span v-if="item.duration" class="eb-chat-test-results__case-duration">{{ formatDuration(item.duration) }}</span>
        </button>

        <div v-if="isOpen(i) && (item.message || item.stack)" class="eb-chat-test-results__detail">
          <p v-if="item.message" class="eb-chat-test-results__message">{{ item.message }}</p>
          <ChatStackTrace
            v-if="item.stack"
            :stack="item.stack"
            @frame-click="(frame) => emit('frame-click', frame, item)"
          />
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import EbIcon from "../icon/index.vue"
import ChatStackTrace from "./ChatStackTrace.vue";
import { chatLabels as labels } from "./labels";
const props = defineProps({
  /** { summary: { passed, failed, skipped, duration }, cases: [{ name, suite?, status, duration?, message?, stack? }] } */
  results: { type: Object, required: false, default: () => ({}) },
  /** 直接给 cases（summary 由组件按状态数出来） */
  cases: { type: Array, required: false, default: null },
  /** 失败项展开后是否也展开其 stack */
  expandStacks: { type: Boolean, required: false, default: false }
});
const emit = defineEmits(["case-click", "frame-click"]);

const openCases = ref(new Set());
const showPassed = ref(true);

const cases = computed(() => props.cases || props.results?.cases || []);
const failedCases = computed(() => cases.value.filter((c) => statusOf(c) === "failed"));

/** summary 优先用宿主给的：跳过数这类信息组件自己数不出来 */
const counted = computed(() => {
  const acc = { passed: 0, failed: 0, skipped: 0, duration: 0 };
  for (const item of cases.value) {
    const status = statusOf(item);
    if (status === "passed") acc.passed += 1;
    else if (status === "failed") acc.failed += 1;
    else acc.skipped += 1;
    acc.duration += Number(item.duration) || 0;
  }
  return acc;
});
const summary = computed(() => ({ ...counted.value, ...(props.results?.summary || {}) }));
const hasSummary = computed(() => cases.value.length > 0);

const stats = computed(() => [
  { key: "passed", label: labels.tests.passed(summary.value.passed) },
  { key: "failed", label: labels.tests.failed(summary.value.failed) },
  ...(summary.value.skipped ? [{ key: "skipped", label: labels.tests.skipped(summary.value.skipped) }] : []),
]);
const durationText = computed(() => (summary.value.duration ? formatDuration(summary.value.duration) : ""));

/** 有失败时默认只显示失败项：一屏里最该看见的是红的那几条 */
const visibleCases = computed(() => {
  if (showPassed.value || !failedCases.value.length) return cases.value;
  return failedCases.value;
});

// 换了一批结果就重置展开态与过滤，否则上一条的展开会串到这一条
watch(
  () => props.results,
  () => {
    showPassed.value = true;
    seedOpen();
  },
  { immediate: true }
);

function statusOf(item) {
  const status = item?.status;
  if (!status) {
    // 没给状态不猜：既不宣称通过也不宣称失败
    return "skipped";
  }
  if (status === "pass" || status === "passed" || status === "ok") return "passed";
  if (status === "skip" || status === "skipped" || status === "todo") return "skipped";
  // 报了状态但认不出：按失败呈现，漏报失败比虚报通过安全
  return "failed";
}
function iconOf(item) {
  const status = statusOf(item);
  if (status === "passed") return "check";
  if (status === "skipped") return "minus";
  return "close";
}
function isOpen(index) {
  return openCases.value.has(index);
}
/** expandStacks 只铺初始态：失败项默认展开，但用户点一下必须能收起来 */
function seedOpen() {
  if (!props.expandStacks) {
    openCases.value = new Set();
    return;
  }
  const next = new Set();
  visibleCases.value.forEach((item, i) => {
    if (statusOf(item) === "failed") next.add(i);
  });
  openCases.value = next;
}
function toggleCase(index) {
  const next = new Set(openCases.value);
  if (next.has(index)) next.delete(index);
  else next.add(index);
  openCases.value = next;
  emit("case-click", visibleCases.value[index]);
}
function formatDuration(ms) {
  const value = Number(ms) || 0;
  if (value < 1000) return `${value}ms`;
  return `${(value / 1000).toFixed(2)}s`;
}
</script>

<style scoped>

.eb-chat-test-results {
  margin-top: var(--eb-space-2);
  border: 1px solid var(--eb-border-color-lighter);
  border-radius: var(--eb-radius-md);
  overflow: hidden;
  background: var(--eb-fill-color-light);
}

.eb-chat-test-results__summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--eb-space-3);
  padding: var(--eb-space-2) var(--eb-space-3);
  background: var(--eb-fill-color);
  border-bottom: 1px solid var(--eb-border-color-lighter);
  font-size: var(--eb-font-size-sm);
}

.eb-chat-test-results__stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--eb-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

.eb-chat-test-results__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.eb-chat-test-results__stat.is-passed {
  color: var(--eb-color-success);
}

.eb-chat-test-results__stat.is-failed {
  color: var(--eb-color-danger);
}

.eb-chat-test-results__stat.is-skipped {
  color: var(--eb-text-color-placeholder);
}

.eb-chat-test-results__duration {
  margin-left: auto;
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}

.eb-chat-test-results__toggle {
  padding: 0 4px;
  border: none;
  background: transparent;
  color: var(--eb-color-primary);
  font-size: var(--eb-font-size-xs);
  font-family: inherit;
  cursor: pointer;
}

.eb-chat-test-results__toggle:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}

.eb-chat-test-results__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.eb-chat-test-results__case + .eb-chat-test-results__case {
  border-top: 1px solid var(--eb-border-color-lighter);
}

.eb-chat-test-results__head {
  display: flex;
  align-items: center;
  gap: var(--eb-space-2);
  width: 100%;
  padding: var(--eb-space-1) var(--eb-space-3);
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: var(--eb-font-size-sm);
  text-align: left;
  cursor: pointer;
}

.eb-chat-test-results__head:hover {
  background: var(--eb-fill-color);
}

.eb-chat-test-results__head:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: -2px;
}

.eb-chat-test-results__marker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  flex-shrink: 0;
  color: var(--eb-color-success);
}

.eb-chat-test-results__case.is-failed .eb-chat-test-results__marker {
  color: var(--eb-color-danger);
}

.eb-chat-test-results__case.is-skipped .eb-chat-test-results__marker {
  color: var(--eb-text-color-placeholder);
}

.eb-chat-test-results__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--eb-text-color-regular);
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: var(--eb-font-size-xs);
}

.eb-chat-test-results__case.is-skipped .eb-chat-test-results__name {
  color: var(--eb-text-color-placeholder);
}

.eb-chat-test-results__suite,
.eb-chat-test-results__case-duration {
  flex-shrink: 0;
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}

.eb-chat-test-results__detail {
  padding: 0 var(--eb-space-3) var(--eb-space-2) calc(var(--eb-space-3) + 22px);
}

.eb-chat-test-results__message {
  margin: 0 0 var(--eb-space-1);
  font-size: var(--eb-font-size-xs);
  line-height: 1.6;
  color: var(--eb-color-danger);
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
