<template>
  <div
    ref="rootRef"
    class="eb-chat-question"
    :class="{ 'is-done': isAnswered, 'is-auto-focused': autoFocused }"
    role="group"
    :aria-label="labels.question.waiting"
    :aria-busy="isAnswered ? 'true' : undefined"
    tabindex="0"
    @keydown="handleKeydown"
    @pointerdown="autoFocused = false"
  >
    <div class="eb-chat-question__head">
      <span class="eb-chat-question__badge">{{ current?.header || labels.question.badge(index + 1, items.length) }}</span>
      <span class="eb-chat-question__count">{{ countsText }}</span>
    </div>
    <p class="eb-chat-question__text">{{ current?.question }}</p>

    <div
      class="eb-chat-question__options"
      role="listbox"
      :aria-multiselectable="current?.multiSelect ? 'true' : undefined"
      :aria-label="current?.question"
    >
      <button
        v-for="opt in current?.options || []"
        :key="opt.key"
        type="button"
        role="option"
        class="eb-chat-question__option"
        :class="{ 'is-active': isSelected(opt.key) }"
        :aria-selected="isSelected(opt.key)"
        :disabled="isAnswered"
        @click="toggle(opt.key)"
      >
        <span class="eb-chat-question__marker" :class="{ 'is-on': isSelected(opt.key), 'is-multi': current?.multiSelect }" aria-hidden="true" />
        <span class="eb-chat-question__option-label">{{ opt.label }}</span>
        <span v-if="opt.recommended" class="eb-chat-question__recommended">{{ labels.question.recommended }}</span>
        <span v-if="opt.description" class="eb-chat-question__option-desc">{{ opt.description }}</span>
      </button>
    </div>

    <input
      v-if="current?.allowCustom !== false"
      v-model="customText"
      class="eb-chat-question__custom"
      type="text"
      :placeholder="labels.question.customPlaceholder"
      :disabled="isAnswered"
      :aria-label="labels.question.customPlaceholder"
      @keydown.stop="handleKeydown"
    />

    <div class="eb-chat-question__actions">
      <button type="button" class="eb-chat-question__btn" :disabled="isAnswered" @click="skip">
        {{ labels.question.skip }}
      </button>
      <button type="button" class="eb-chat-question__btn" :disabled="isAnswered" @click="cancel">
        {{ labels.question.cancel }}
      </button>
      <span class="eb-chat-question__spacer" />
      <button v-if="index > 0" type="button" class="eb-chat-question__btn" :disabled="isAnswered" @click="go(-1)">
        {{ labels.question.prev }}
      </button>
      <button
        type="button"
        class="eb-chat-question__btn is-primary"
        :disabled="isAnswered || !canAdvance"
        @click="advance"
      >
        {{ isLast ? labels.question.submit : labels.question.next }}
      </button>
    </div>

    <span class="eb-chat-question__announce" role="status" aria-live="polite" aria-atomic="true">
      {{ announceText }}
    </span>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { isImeComposing } from "@wil-works/evoke-business-ui";
import { useChatLabels } from "./labels";

const labels = useChatLabels();
const props = defineProps({
  /**
   * { id, status?, items: [{ id, question, header?, multiSelect?, allowCustom?, options: [{ key, label, recommended?, description? }] }] }
   * status 取 pending / answered / cancelled（宿主受控时给）
   */
  request: { type: Object, required: false, default: () => ({}) },
  /** 受控的已响应态；不传时组件自己记 */
  answered: { type: Boolean, required: false, default: undefined }
});
const emit = defineEmits(["respond"]);

const rootRef = ref(null);
const autoFocused = ref(true);
const localAnswered = ref(false);
/** 本地结论：'answered' | 'cancelled'，宿主持久态没到之前据此播报 */
const localStatus = ref("");
const index = ref(0);
const customText = ref("");
/** 每题一份草稿：{ [itemId]: { selected: string[], custom?: string, skipped?: boolean } } */
const draft = reactive({});

const items = computed(() => props.request?.items || []);
const current = computed(() => items.value[index.value] || null);
const isLast = computed(() => index.value >= items.value.length - 1);
const isAnswered = computed(() => {
  if (props.answered !== undefined) return props.answered;
  if (localAnswered.value) return true;
  return props.request?.status === "answered" || props.request?.status === "cancelled";
});
const answeredCount = computed(() => items.value.filter((it) => draft[it.id]?.selected?.length || draft[it.id]?.custom).length);
const countsText = computed(() => (isAnswered.value ? labels.question.done : labels.question.answered(answeredCount.value, items.value.length)));
const announceText = computed(() => {
  if (!isAnswered.value) return "";
  const status = props.request?.status === "cancelled" || props.request?.status === "answered"
    ? props.request.status
    : localStatus.value;
  return status === "cancelled" ? labels.question.cancelled : labels.question.done;
});
const canAdvance = computed(() => {
  const d = draft[current.value?.id];
  if (d?.selected?.length || d?.skipped) return true;
  if (String(d?.custom || "").trim()) return true;
  // 输入框里已经打了字也算作答（草稿还没 commit）
  return current.value?.allowCustom !== false && !!customText.value.trim();
});

function ensureDraft(id) {
  if (!id) return { selected: [] };
  if (!draft[id]) draft[id] = { selected: [] };
  return draft[id];
}
function isSelected(key) {
  return !!ensureDraft(current.value?.id).selected?.includes(key);
}
function toggle(key) {
  if (isAnswered.value) return;
  autoFocused.value = false;
  const d = ensureDraft(current.value?.id);
  if (current.value?.multiSelect) {
    d.selected = d.selected.includes(key) ? d.selected.filter((k) => k !== key) : [...d.selected, key];
  } else {
    d.selected = d.selected.includes(key) ? [] : [key];
  }
}
function commitCustom() {
  const d = ensureDraft(current.value?.id);
  const text = customText.value.trim();
  if (text) d.custom = text;
  return text;
}
function go(step) {
  if (isAnswered.value) return;
  commitCustom();
  const next = index.value + step;
  if (next < 0 || next >= items.value.length) return;
  index.value = next;
  customText.value = draft[items.value[next].id]?.custom || "";
}
function advance() {
  if (isAnswered.value || !canAdvance.value) return;
  commitCustom();
  if (!isLast.value) {
    go(1);
    return;
  }
  respond("answered");
}
function skip() {
  if (isAnswered.value) return;
  const d = ensureDraft(current.value?.id);
  d.skipped = true;
  d.selected = [];
  if (isLast.value) respond("answered");
  else go(1);
}
function cancel() {
  if (isAnswered.value) return;
  respond("cancelled");
}
function payload() {
  return items.value.map((it) => {
    const d = draft[it.id] || {};
    return {
      id: it.id,
      question: it.question,
      selected: d.selected || [],
      custom: d.custom || "",
      skipped: !!d.skipped,
    };
  });
}
function respond(status) {
  localAnswered.value = true;
  localStatus.value = status;
  emit("respond", { status, answers: status === "answered" ? payload() : [] }, props.request);
}

function handleKeydown(e) {
  autoFocused.value = false;
  if (isImeComposing(e)) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === "Enter") {
    e.preventDefault();
    if (isAnswered.value) return;
    // 输入框里的 Enter 先当作填写，再决定能否前进
    commitCustom();
    if (canAdvance.value) advance();
    return;
  }
  if (e.key === "Escape") {
    e.preventDefault();
    cancel();
  }
}

// 接管输入区后焦点落在面板上，键位才生效（与审批一致）
onMounted(() => rootRef.value?.focus?.());
</script>

<style scoped>
.eb-chat-question {
  display: flex;
  flex-direction: column;
  gap: var(--eb-space-2);
  margin: 0 var(--eb-space-2);
  padding: var(--eb-space-3);
  border: 1px solid var(--eb-border-color-light);
  border-radius: var(--eb-radius-lg);
  background: var(--eb-bg-color-overlay);
}

.eb-chat-question:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}

.eb-chat-question.is-auto-focused:focus-visible {
  outline: none;
}

.eb-chat-question.is-done {
  background: var(--eb-fill-color-light);
}

.eb-chat-question__head {
  display: flex;
  align-items: center;
  gap: var(--eb-space-2);
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-secondary);
}

.eb-chat-question__badge {
  font-weight: var(--eb-font-weight-medium);
  color: var(--eb-text-color-regular);
}

.eb-chat-question__count {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
}

.eb-chat-question__text {
  margin: 0;
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-primary);
}

.eb-chat-question__options {
  display: flex;
  flex-direction: column;
  gap: var(--eb-space-1);
}

.eb-chat-question__option {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--eb-space-2);
  padding: var(--eb-space-2) var(--eb-space-3);
  border: 1px solid var(--eb-border-color-lighter);
  border-radius: var(--eb-radius-md);
  background: var(--eb-fill-color-blank);
  color: var(--eb-text-color-regular);
  font-family: inherit;
  font-size: var(--eb-font-size-sm);
  text-align: left;
  cursor: pointer;
}

.eb-chat-question__option:hover:not(:disabled) {
  border-color: var(--eb-color-primary-light-5);
}

.eb-chat-question__option.is-active {
  border-color: var(--eb-color-primary);
  background: var(--eb-color-primary-light-9);
  color: var(--eb-color-primary);
}

.eb-chat-question__option:disabled {
  cursor: default;
  opacity: 0.6;
}

.eb-chat-question__option:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}

/* 单选画圈、多选画方：一眼分清"选项"与"输入框"，也标出已选 */
.eb-chat-question__marker {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  border: 1px solid var(--eb-border-color-light);
  border-radius: 50%;
  background: var(--eb-fill-color-blank);
}

.eb-chat-question__marker.is-multi {
  border-radius: var(--eb-radius-sm);
}

.eb-chat-question__option.is-active .eb-chat-question__marker {
  border-color: var(--eb-color-primary);
  background: var(--eb-color-primary);
  box-shadow: inset 0 0 0 2px var(--eb-fill-color-blank);
}

.eb-chat-question__recommended {
  padding: 0 6px;
  border-radius: var(--eb-radius-sm);
  background: var(--eb-color-primary-light-9);
  color: var(--eb-color-primary);
  font-size: var(--eb-font-size-xs);
}

.eb-chat-question__option-desc {
  flex-basis: 100%;
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
}

.eb-chat-question__custom {
  padding: var(--eb-space-2) var(--eb-space-3);
  border: 1px solid var(--eb-border-color-lighter);
  border-radius: var(--eb-radius-md);
  background: var(--eb-fill-color-blank);
  color: var(--eb-text-color-regular);
  font-family: inherit;
  font-size: var(--eb-font-size-sm);
}

.eb-chat-question__custom:focus-visible {
  outline: none;
  border-color: var(--eb-color-primary);
}

.eb-chat-question__actions {
  display: flex;
  align-items: center;
  gap: var(--eb-space-2);
}

.eb-chat-question__spacer {
  flex: 1;
}

.eb-chat-question__btn {
  padding: 4px var(--eb-space-3);
  border: 1px solid var(--eb-border-color-light);
  border-radius: var(--eb-radius-sm);
  background: var(--eb-bg-color-overlay);
  color: var(--eb-text-color-regular);
  font-family: inherit;
  font-size: var(--eb-font-size-sm);
  cursor: pointer;
}

.eb-chat-question__btn:hover:not(:disabled) {
  border-color: var(--eb-color-primary-light-5);
  color: var(--eb-color-primary);
}

.eb-chat-question__btn.is-primary {
  border-color: var(--eb-color-primary);
  background: var(--eb-color-primary);
  color: #fff;
}

.eb-chat-question__btn.is-primary:hover:not(:disabled) {
  background: var(--eb-color-primary-light-3);
  border-color: var(--eb-color-primary-light-3);
  color: #fff;
}

.eb-chat-question__btn:disabled {
  cursor: default;
  opacity: 0.55;
}

.eb-chat-question__btn:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}

.eb-chat-question__announce {
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