<template>
  <div
    ref="rootRef"
    class="eb-chat-approval"
    :class="{ 'is-answered': isAnswered, 'is-auto-focused': autoFocused }"
    role="group"
    :aria-label="labels.approval.waiting"
    :aria-busy="isAnswered ? 'true' : undefined"
    tabindex="0"
    @keydown="handleKeydown"
    @pointerdown="autoFocused = false"
  >
    <span class="eb-chat-approval__dot" aria-hidden="true" />
    <div class="eb-chat-approval__main">
      <p class="eb-chat-approval__headline">{{ headline }}</p>
      <div v-if="detailText" class="eb-chat-approval__detail">{{ detailText }}</div>
      <!-- 关联细节：宿主可塞被拦命令原文、差异片段等 -->
      <slot />
    </div>
    <div class="eb-chat-approval__actions">
      <button
        type="button"
        class="eb-chat-approval__btn"
        :disabled="isAnswered"
        @click="respond('rejected')"
      >
        {{ labels.approval.reject }}
      </button>
      <button
        type="button"
        class="eb-chat-approval__btn is-primary"
        :disabled="isAnswered"
        @click="respond('allowed-once')"
      >
        {{ labels.approval.allowOnce }}
      </button>
    </div>
    <span class="eb-chat-approval__announce" role="status" aria-live="polite" aria-atomic="true">
      {{ isAnswered ? answeredText : "" }}
    </span>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { isImeComposing } from "@wil-works/evoke-business-ui";
import { useChatLabels } from "./labels";

const labels = useChatLabels();
const props = defineProps({
  /** { id, toolName, reason?, detail?, status? }；status 取 pending / approved / rejected（宿主受控时给） */
  request: { type: Object, required: false, default: () => ({}) },
  /** 受控的已响应态；不传时组件自己记（点完立即禁用，等宿主的持久态覆盖） */
  answered: { type: Boolean, required: false, default: undefined }
});
const emit = defineEmits(["respond"]);

const rootRef = ref(null);
const localAnswered = ref(false);
/** 接管时自动聚焦面板；这一下的焦点环会看着像"被选中"，等用户真交互后再给 */
const autoFocused = ref(true);
/** 已响应：受控优先，其次本地点击，最后看宿主回写的 request.status */
const isAnswered = computed(() => {
  if (props.answered !== undefined) return props.answered;
  if (localAnswered.value) return true;
  const s = props.request?.status;
  return s === "approved" || s === "rejected";
});
/** 播报用：区分"已允许/已拒绝"（主机回写）与"已响应"（本地点击、持久态还没到） */
const resolvedStatus = computed(() => {
  const s = props.request?.status;
  if (s === "approved" || s === "rejected") return s;
  return localAnswered.value ? "answered" : "pending";
});

const headline = computed(() => {
  const reason = props.request?.reason;
  if (reason) return reason;
  const tool = props.request?.toolName || labels.tool.fallback;
  return labels.approval.escalation(tool);
});
const detailText = computed(() => props.request?.detail || "");
const answeredText = computed(() => {
  if (!isAnswered.value) return "";
  if (resolvedStatus.value === "rejected") return labels.approval.rejected;
  if (resolvedStatus.value === "approved") return labels.approval.allowed;
  return labels.approval.answered;
});

function respond(outcome) {
  if (isAnswered.value) return;
  localAnswered.value = true;
  emit("respond", outcome, props.request);
}

function handleKeydown(e) {
  autoFocused.value = false;
  // 组字中的 Enter 是上屏候选词，不是"允许"
  if (isImeComposing(e)) return;
  // 槽位里放了输入控件时，键位归控件；带修饰键的组合不抢
  const tag = e.target?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return;
  if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
  if (e.key === "Enter") {
    e.preventDefault();
    respond("allowed-once");
    return;
  }
  if (e.key === "Escape") {
    e.preventDefault();
    respond("rejected");
  }
}

// 接管输入区后焦点落在面板上，键位才生效（与 DSH 的 composer takeover 同义）
onMounted(() => rootRef.value?.focus?.());
</script>

<style scoped>
.eb-chat-approval {
  display: flex;
  align-items: flex-start;
  gap: var(--eb-space-2);
  margin: 0 var(--eb-space-2);
  padding: var(--eb-space-3);
  border: 1px solid var(--eb-color-warning-light-7);
  border-radius: var(--eb-radius-lg);
  background: var(--eb-color-warning-light-9);
}

.eb-chat-approval:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}

/* 接管瞬间的程序化聚焦不画环：否则看起来像"被选中"而不是"待你决定" */
.eb-chat-approval.is-auto-focused:focus-visible {
  outline: none;
}

.eb-chat-approval.is-answered {
  border-color: var(--eb-border-color-lighter);
  background: var(--eb-fill-color-light);
}

.eb-chat-approval__dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  margin-top: 6px;
  border-radius: 50%;
  background: var(--eb-color-warning);
}

.eb-chat-approval.is-answered .eb-chat-approval__dot {
  background: var(--eb-text-color-placeholder);
}

.eb-chat-approval__main {
  flex: 1;
  min-width: 0;
}

.eb-chat-approval__headline {
  margin: 0;
  font-size: var(--eb-font-size-sm);
  font-weight: var(--eb-font-weight-medium);
  color: var(--eb-text-color-primary);
}

.eb-chat-approval__detail {
  margin-top: var(--eb-space-1);
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: var(--eb-font-size-xs);
  line-height: 1.6;
  color: var(--eb-text-color-regular);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 120px;
  overflow: auto;
}

.eb-chat-approval__actions {
  display: flex;
  flex-shrink: 0;
  gap: var(--eb-space-2);
}

.eb-chat-approval__btn {
  padding: 4px var(--eb-space-3);
  border: 1px solid var(--eb-border-color-light);
  border-radius: var(--eb-radius-sm);
  background: var(--eb-bg-color-overlay);
  color: var(--eb-text-color-regular);
  font-family: inherit;
  font-size: var(--eb-font-size-sm);
  cursor: pointer;
  transition: border-color var(--eb-duration-fast) var(--eb-ease-out);
}

.eb-chat-approval__btn:hover:not(:disabled) {
  border-color: var(--eb-color-primary-light-5);
  color: var(--eb-color-primary);
}

.eb-chat-approval__btn.is-primary {
  border-color: var(--eb-color-primary);
  background: var(--eb-color-primary);
  color: #fff;
}

.eb-chat-approval__btn.is-primary:hover:not(:disabled) {
  border-color: var(--eb-color-primary-light-3);
  background: var(--eb-color-primary-light-3);
  color: #fff;
}

.eb-chat-approval__btn:disabled {
  cursor: default;
  opacity: 0.55;
}

.eb-chat-approval__btn:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}

.eb-chat-approval__announce {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>