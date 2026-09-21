<template>
  <div class="eb-chat-plan">
    <button
      type="button"
      class="eb-chat-plan__header"
      :aria-expanded="String(open)"
      :aria-controls="panelId"
      @click="toggle"
    >
      <eb-icon :name="open ? 'arrow-down' : 'arrow-right'" :size="12" />
      <span class="eb-chat-plan__title">{{ plan?.title || labels.plan.group }}</span>
      <span class="eb-chat-plan__progress">{{ progressText }}</span>
      <span v-if="hasFailed" class="eb-chat-plan__failed">{{ labels.plan.status.error }}</span>
    </button>

    <div v-show="open" :id="panelId" class="eb-chat-plan__body">
      <p v-if="!steps.length" class="eb-chat-plan__empty">{{ labels.plan.empty }}</p>
      <ol v-else class="eb-chat-plan__steps">
        <li
          v-for="(step, i) in steps"
          :key="step.id ?? i"
          class="eb-chat-plan__step"
          :class="[`is-${step.status || 'pending'}`, { 'is-current': step.id === currentStepId }]"
        >
          <slot name="step" :step="step" :index="i" :isCurrent="step.id === currentStepId">
            <span class="eb-chat-plan__marker" aria-hidden="true">
              <eb-icon v-if="step.status === 'done'" name="check" :size="11" />
              <eb-icon v-else-if="step.status === 'error'" name="warning-filled" :size="11" />
              <span v-else-if="step.status === 'running'" class="eb-chat-plan__dot" />
              <span v-else-if="step.status === 'skipped'" class="eb-chat-plan__dash">–</span>
              <span v-else class="eb-chat-plan__ring" />
            </span>
            <button
              type="button"
              class="eb-chat-plan__trigger"
              @click="emit('step-click', step, i)"
            >
              <span class="eb-chat-plan__label">{{ step.label }}</span>
              <span v-if="step.detail" class="eb-chat-plan__detail">{{ step.detail }}</span>
            </button>
            <span class="eb-chat-plan__meta">
              <span class="eb-chat-plan__status">{{ statusText(step) }}</span>
              <span v-if="step.duration" class="eb-chat-plan__duration">{{ formatDuration(step.duration) }}</span>
            </span>
          </slot>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup>
import EbIcon from "../icon/index.vue"
import { ref, computed, watch } from "vue";
import { chatLabels as labels } from "./labels";
const props = defineProps({
  /** { title?, steps: [{ id, label, status, detail?, duration? }] } */
  plan: { type: Object, required: false, default: () => ({ steps: [] }) },
  /** 未显式指定时：有执行中的步骤就展开，全部结束回到折叠 */
  expanded: { type: Boolean, required: false, default: undefined }
});
const emit = defineEmits(["toggle", "step-click"]);
const steps = computed(() => props.plan?.steps || []);
const running = computed(() => steps.value.some((s) => s.status === "running"));
const currentStepId = computed(() => steps.value.find((s) => s.status === "running")?.id);
const doneCount = computed(() => steps.value.filter((s) => s.status === "done").length);
const hasFailed = computed(() => steps.value.some((s) => s.status === "error"));
const progressText = computed(() => labels.plan.progress(doneCount.value, steps.value.length));
const panelId = `eb-chat-plan-${Math.random().toString(36).slice(2, 9)}`;

const innerOpen = ref(props.expanded ?? true);
const open = computed(() => (props.expanded === undefined ? innerOpen.value : props.expanded));

// 执行中强制展开，结束后收起——与 ChatThinking 同一套「过程可见、完事让位」的约定
watch(
  () => running.value,
  (isRunning) => {
    if (props.expanded !== undefined) return;
    innerOpen.value = isRunning ? true : innerOpen.value;
  }
);

function toggle() {
  if (props.expanded !== undefined) {
    emit("toggle", props.plan, !props.expanded);
    return;
  }
  innerOpen.value = !innerOpen.value;
  emit("toggle", props.plan, innerOpen.value);
}
function statusText(step) {
  return labels.plan.status[step.status || "pending"] || step.status;
}
function formatDuration(ms) {
  if (ms < 1e3) return `${ms}ms`;
  return `${(ms / 1e3).toFixed(1)}s`;
}

</script>

<style scoped>

.eb-chat-plan {
  margin-top: var(--eb-space-2);
  border: 1px solid var(--eb-border-color-lighter);
  border-radius: var(--eb-radius-md);
  background: var(--eb-fill-color-lighter);
  overflow: hidden;
}

.eb-chat-plan__header {
  display: flex;
  align-items: center;
  gap: var(--eb-space-2);
  width: 100%;
  padding: var(--eb-space-2) var(--eb-space-3);
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: var(--eb-font-size-sm);
  text-align: left;
  cursor: pointer;
  transition: background-color var(--eb-duration-fast) var(--eb-ease-out);
}

.eb-chat-plan__header:hover {
  background: var(--eb-fill-color);
}

.eb-chat-plan__header:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: -2px;
}

.eb-chat-plan__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--eb-text-color-primary);
  font-weight: var(--eb-font-weight-medium);
}

.eb-chat-plan__progress {
  flex-shrink: 0;
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}

.eb-chat-plan__failed {
  flex-shrink: 0;
  font-size: var(--eb-font-size-xs);
  color: var(--eb-color-danger);
}

.eb-chat-plan__body {
  padding: 0 var(--eb-space-3) var(--eb-space-3);
  border-top: 1px solid var(--eb-border-color-lighter);
}

.eb-chat-plan__empty {
  margin: var(--eb-space-2) 0 0;
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-placeholder);
}

.eb-chat-plan__steps {
  margin: var(--eb-space-2) 0 0;
  padding: 0;
  list-style: none;
}

.eb-chat-plan__step {
  display: flex;
  align-items: flex-start;
  gap: var(--eb-space-2);
  padding: 3px 0 3px var(--eb-space-1);
  border-radius: var(--eb-radius-sm);
}

.eb-chat-plan__step.is-current {
  background: var(--eb-color-primary-light-9);
}

.eb-chat-plan__marker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  margin-top: 2px;
  flex-shrink: 0;
  color: var(--eb-text-color-placeholder);
  font-size: 11px;
}

.eb-chat-plan__step.is-done .eb-chat-plan__marker {
  color: var(--eb-color-success);
}

.eb-chat-plan__step.is-error .eb-chat-plan__marker {
  color: var(--eb-color-danger);
}

.eb-chat-plan__step.is-running .eb-chat-plan__marker {
  color: var(--eb-color-primary);
}

.eb-chat-plan__ring {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1.5px solid currentColor;
}

.eb-chat-plan__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  animation: eb-chat-plan-pulse 1.4s ease-in-out infinite;
}

@keyframes eb-chat-plan-pulse {
  0%, 100% { opacity: 0.35; transform: scale(0.85); }
  50% { opacity: 1; transform: scale(1); }
}

.eb-chat-plan__dash {
  line-height: 1;
}

.eb-chat-plan__trigger {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

.eb-chat-plan__trigger:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
  border-radius: var(--eb-radius-sm);
}

.eb-chat-plan__label {
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-regular);
  line-height: 1.5;
}

.eb-chat-plan__step.is-done .eb-chat-plan__label {
  color: var(--eb-text-color-secondary);
}

.eb-chat-plan__step.is-skipped .eb-chat-plan__label {
  color: var(--eb-text-color-placeholder);
  text-decoration: line-through;
}

.eb-chat-plan__detail {
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
  line-height: 1.5;
}

.eb-chat-plan__meta {
  display: flex;
  align-items: center;
  gap: var(--eb-space-2);
  flex-shrink: 0;
  padding-top: 1px;
}

.eb-chat-plan__status {
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
}

.eb-chat-plan__step.is-error .eb-chat-plan__status {
  color: var(--eb-color-danger);
}

.eb-chat-plan__duration {
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .eb-chat-plan__dot {
    animation: none;
  }
}
</style>
