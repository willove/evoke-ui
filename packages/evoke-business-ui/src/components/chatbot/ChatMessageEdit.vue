<template>
  <div class="eb-chat-message-edit">
    <textarea
      ref="textareaRef"
      v-model="text"
      class="eb-chat-message-edit__textarea"
      :placeholder="placeholder"
      :aria-label="placeholder"
      :maxlength="maxlengthAttr"
      rows="2"
      @keydown="handleKeydown"
      @input="autoResize"
    />
    <div class="eb-chat-message-edit__actions">
      <button type="button" class="eb-chat-message-edit__act" @click="emit('cancel')">
        {{ labels.edit.cancel }}
      </button>
      <button
        type="button"
        class="eb-chat-message-edit__act eb-chat-message-edit__act--primary"
        :disabled="!canSave"
        @click="save"
      >
        {{ labels.edit.save }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { isImeComposing } from "../../utils/events";
import { chatLabels as labels } from "./labels";
const props = defineProps({
  modelValue: { type: String, required: false, default: "" },
  placeholder: { type: String, required: false, default: labels.edit.placeholder },
  maxLength: { type: Number, required: false, default: 0 },
  sendOnEnter: { type: Boolean, required: false, default: true }
});
const emit = defineEmits(["save", "cancel"]);
const textareaRef = ref();
const text = ref(props.modelValue || "");
const canSave = computed(() => text.value.trim().length > 0);
const maxlengthAttr = computed(() => props.maxLength > 0 ? props.maxLength : void 0);
function autoResize() {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${Math.min(Math.max(el.scrollHeight, 44), 200)}px`;
}
function save() {
  if (!canSave.value) return;
  emit("save", text.value.trim());
}
function handleKeydown(e) {
  if (isImeComposing(e)) return;
  if (e.key === "Escape") {
    e.preventDefault();
    emit("cancel");
    return;
  }
  if (e.key === "Enter" && !e.shiftKey && props.sendOnEnter) {
    e.preventDefault();
    save();
  }
}
onMounted(() => {
  nextTick(() => {
    textareaRef.value?.focus();
    autoResize();
  });
});

</script>

<style scoped>

.eb-chat-message-edit {
  width: 100%;
  padding: var(--eb-space-2) var(--eb-space-3);
  border: 1px solid var(--eb-color-primary);
  border-radius: var(--eb-radius-lg);
  background: var(--eb-bg-color-overlay);
  box-sizing: border-box;
}

.eb-chat-message-edit__textarea {
  display: block;
  width: 100%;
  min-height: 44px;
  max-height: 200px;
  padding: 0;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  color: var(--eb-text-color-primary);
  font-size: var(--eb-font-size-base);
  font-family: inherit;
  line-height: var(--eb-line-height-loose);
  box-sizing: border-box;
}

.eb-chat-message-edit__textarea::placeholder {
  color: var(--eb-text-color-placeholder);
}

.eb-chat-message-edit__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--eb-space-2);
  margin-top: var(--eb-space-2);
}

.eb-chat-message-edit__act {
  padding: var(--eb-space-1) var(--eb-space-3);
  border: 1px solid var(--eb-border-color-light);
  border-radius: var(--eb-radius-sm);
  background: transparent;
  color: var(--eb-text-color-regular);
  font-size: var(--eb-font-size-sm);
  font-family: inherit;
  cursor: pointer;
}

.eb-chat-message-edit__act:hover {
  background: var(--eb-fill-color);
}

.eb-chat-message-edit__act--primary {
  border-color: var(--eb-color-primary);
  background: var(--eb-color-primary);
  color: #fff;
}

.eb-chat-message-edit__act--primary:hover {
  background: var(--eb-color-primary-dark-2);
}

.eb-chat-message-edit__act:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.eb-chat-message-edit__act:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}
</style>
