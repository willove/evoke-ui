<template>
  <div class="eb-chat-feedback">
    <div class="eb-chat-feedback__bar" role="group" :aria-label="labels.feedback.group">
      <button
        type="button"
        class="eb-chat-feedback__btn"
        :class="{ 'is-active': current === 'up' }"
        :aria-pressed="current === 'up'"
        :title="labels.feedback.up"
        :aria-label="labels.feedback.up"
        :disabled="disabled"
        @click="choose('up')"
      >
        <eb-icon :name="current === 'up' ? 'thumb-up-filled' : 'thumb-up'" />
      </button>
      <button
        type="button"
        class="eb-chat-feedback__btn"
        :class="{ 'is-active': current === 'down' }"
        :aria-pressed="current === 'down'"
        :title="labels.feedback.down"
        :aria-label="labels.feedback.down"
        :disabled="disabled"
        @click="choose('down')"
      >
        <eb-icon :name="current === 'down' ? 'thumb-down-filled' : 'thumb-down'" />
      </button>
    </div>

    <div v-if="thanks" class="eb-chat-feedback__thanks" role="status">
      {{ labels.feedback.title }}
    </div>

    <div v-else-if="panelOpen" class="eb-chat-feedback__panel">
      <p class="eb-chat-feedback__panel-title">{{ labels.feedback.downTitle }}</p>
      <div class="eb-chat-feedback__reasons" role="group" :aria-label="labels.feedback.downTitle">
        <button
          v-for="reason in resolvedReasons"
          :key="reason"
          type="button"
          class="eb-chat-feedback__reason"
          :class="{ 'is-active': selected.includes(reason) }"
          :aria-pressed="selected.includes(reason)"
          @click="toggleReason(reason)"
        >
          {{ reason }}
        </button>
      </div>
      <textarea
        v-if="showNote"
        v-model="note"
        class="eb-chat-feedback__note"
        :placeholder="labels.feedback.notePlaceholder"
        :aria-label="labels.feedback.notePlaceholder"
        rows="2"
      />
      <div class="eb-chat-feedback__panel-actions">
        <button type="button" class="eb-chat-feedback__act" @click="cancel">
          {{ labels.feedback.cancel }}
        </button>
        <button type="button" class="eb-chat-feedback__act eb-chat-feedback__act--primary" @click="submit">
          {{ labels.feedback.submit }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import EbIcon from "../icon/index.vue"
import { ref, computed, watch } from "vue";
import { chatLabels as labels } from "./labels";
const props = defineProps({
  /** 当前评价（v-model:value）：'up' | 'down' | null */
  value: { type: String, required: false, default: null },
  /** 结构化原因词汇表；不传用内置六项 */
  reasons: { type: Array, required: false, default: () => [] },
  showNote: { type: Boolean, required: false, default: true },
  disabled: { type: Boolean, required: false, default: false }
});
const emit = defineEmits(["update:value", "submit"]);
const inner = ref(props.value || null);
const panelOpen = ref(props.value === "down");
const selected = ref([]);
const note = ref("");
const thanks = ref(false);
const current = computed(() => props.value !== undefined && props.value !== null ? props.value : inner.value);
const resolvedReasons = computed(() => props.reasons.length ? props.reasons : labels.feedback.reasons);
watch(() => props.value, (val) => {
  inner.value = val || null;
  if (val === "down") panelOpen.value = true;
  if (!val) panelOpen.value = false;
});
function publish(val) {
  inner.value = val;
  emit("update:value", val);
}
function choose(which) {
  if (props.disabled) return;
  thanks.value = false;
  // 再点一次是取消评价；取消也要交出去，否则宿主存的 feedback 清不掉
  const next = current.value === which ? null : which;
  publish(next);
  if (next === "down") {
    panelOpen.value = true;
    return;
  }
  panelOpen.value = false;
  emit("submit", { value: next, reasons: [], note: "" });
  if (next === "up") thanks.value = true;
}
function toggleReason(reason) {
  selected.value = selected.value.includes(reason) ? selected.value.filter((r) => r !== reason) : [...selected.value, reason];
}
function submit() {
  emit("submit", { value: "down", reasons: [...selected.value], note: note.value.trim() });
  panelOpen.value = false;
  thanks.value = true;
}
function cancel() {
  panelOpen.value = false;
  selected.value = [];
  note.value = "";
  publish(null);
  emit("submit", { value: null, reasons: [], note: "" });
}

</script>

<style scoped>

.eb-chat-feedback {
  margin-top: var(--eb-space-1);
}

.eb-chat-feedback__bar {
  display: flex;
  align-items: center;
  gap: var(--eb-space-1);
}

.eb-chat-feedback__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: var(--eb-radius-md);
  background: transparent;
  color: var(--eb-text-color-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: background-color var(--eb-duration-fast) var(--eb-ease-out), color var(--eb-duration-fast) var(--eb-ease-out);
}

.eb-chat-feedback__btn:hover:not(:disabled) {
  background: var(--eb-fill-color);
  color: var(--eb-text-color-primary);
}

.eb-chat-feedback__btn.is-active {
  color: var(--eb-color-primary);
  background: var(--eb-color-primary-light-9);
}

.eb-chat-feedback__btn:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}

.eb-chat-feedback__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.eb-chat-feedback__thanks {
  margin-top: var(--eb-space-1);
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
}

.eb-chat-feedback__panel {
  margin-top: var(--eb-space-2);
  padding: var(--eb-space-3);
  border: 1px solid var(--eb-border-color-lighter);
  border-radius: var(--eb-radius-md);
  background: var(--eb-bg-color-overlay);
}

.eb-chat-feedback__panel-title {
  margin: 0 0 var(--eb-space-2);
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-primary);
  font-weight: var(--eb-font-weight-medium);
}

.eb-chat-feedback__reasons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--eb-space-2);
}

.eb-chat-feedback__reason {
  padding: 2px 10px;
  border: 1px solid var(--eb-border-color-light);
  border-radius: var(--eb-radius-sm);
  background: transparent;
  color: var(--eb-text-color-regular);
  font-size: var(--eb-font-size-xs);
  font-family: inherit;
  cursor: pointer;
  transition: border-color var(--eb-duration-fast) var(--eb-ease-out), color var(--eb-duration-fast) var(--eb-ease-out), background-color var(--eb-duration-fast) var(--eb-ease-out);
}

.eb-chat-feedback__reason:hover {
  border-color: var(--eb-color-primary-light-5);
  color: var(--eb-color-primary);
}

.eb-chat-feedback__reason.is-active {
  border-color: var(--eb-color-primary);
  color: var(--eb-color-primary);
  background: var(--eb-color-primary-light-9);
}

.eb-chat-feedback__reason:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}

.eb-chat-feedback__note {
  width: 100%;
  margin-top: var(--eb-space-2);
  padding: var(--eb-space-2);
  border: 1px solid var(--eb-border-color-light);
  border-radius: var(--eb-radius-sm);
  background: var(--eb-bg-color);
  color: var(--eb-text-color-primary);
  font-size: var(--eb-font-size-sm);
  font-family: inherit;
  line-height: 1.6;
  resize: vertical;
  box-sizing: border-box;
}

.eb-chat-feedback__note:focus-visible {
  outline: none;
  border-color: var(--eb-color-primary);
}

.eb-chat-feedback__panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--eb-space-2);
  margin-top: var(--eb-space-2);
}

.eb-chat-feedback__act {
  padding: var(--eb-space-1) var(--eb-space-3);
  border: 1px solid var(--eb-border-color-light);
  border-radius: var(--eb-radius-sm);
  background: transparent;
  color: var(--eb-text-color-regular);
  font-size: var(--eb-font-size-sm);
  font-family: inherit;
  cursor: pointer;
}

.eb-chat-feedback__act:hover {
  background: var(--eb-fill-color);
}

.eb-chat-feedback__act--primary {
  border-color: var(--eb-color-primary);
  background: var(--eb-color-primary);
  color: #fff;
}

.eb-chat-feedback__act--primary:hover {
  background: var(--eb-color-primary-dark-2);
}

.eb-chat-feedback__act:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}
</style>
