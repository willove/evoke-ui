<template>
  <div class="ev-chat-sender">
    <div v-if="showAttachments && attachments.length" class="ev-chat-sender__attachments">
      <ChatAttachments 
        :attachments="attachments" 
        :removable="!disabled"
        @remove="handleRemoveAttachment"
      />
    </div>
    <div class="ev-chat-sender__input-wrapper">
      <div class="ev-chat-sender__toolbar">
        <button 
          v-if="allowAttachments"
          class="ev-chat-sender__tool-btn"
          title="添加附件"
          :disabled="disabled || attachments.length >= maxAttachments"
          @click="triggerFileUpload"
        >
          <ev-icon name="plus" />
        </button>
        <input 
          ref="fileInputRef"
          type="file"
          class="ev-chat-sender__file-input"
          :multiple="maxAttachments > 1"
          @change="handleFileSelect"
        />
        <slot name="toolbar" />
      </div>
      <div class="ev-chat-sender__textarea-wrapper">
        <textarea
          ref="textareaRef"
          v-model="inputValue"
          class="ev-chat-sender__textarea"
          :placeholder="placeholder"
          :disabled="disabled"
          rows="1"
          @keydown="handleKeydown"
          @input="handleInput"
        />
      </div>
      <div class="ev-chat-sender__actions">
        <span v-if="showWordCount && maxLength" class="ev-chat-sender__word-count">
          {{ inputValue.length }}/{{ maxLength }}
        </span>
        <button 
          class="ev-chat-sender__send-btn"
          :disabled="disabled || !canSend"
          @click="handleSend"
        >
          <ev-icon name="promotion" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import EvIcon from "../icon/index.vue"
import { ref, computed, watch, nextTick } from "vue";
import { generateId } from "./utils";
import ChatAttachments from "./ChatAttachments.vue";
import { getIconByNameSync } from "../icon/iconRegistry";
const props = defineProps({
  modelValue: { type: String, required: false, default: "" },
  placeholder: { type: String, required: false, default: "\u8F93\u5165\u6D88\u606F..." },
  disabled: { type: Boolean, required: false, default: false },
  loading: { type: Boolean, required: false, default: false },
  allowAttachments: { type: Boolean, required: false, default: true },
  maxAttachments: { type: Number, required: false, default: 5 },
  maxLength: { type: Number, required: false, default: 2e3 },
  showWordCount: { type: Boolean, required: false, default: false },
  minRows: { type: Number, required: false, default: 1 },
  maxRows: { type: Number, required: false, default: 6 },
  sendOnEnter: { type: Boolean, required: false, default: true }
});
const emit = defineEmits(["update:modelValue", "send", "attachment-add"]);
const Plus = getIconByNameSync("plus");
const Promotion = getIconByNameSync("promotion");
const textareaRef = ref();
const fileInputRef = ref();
const inputValue = ref(props.modelValue);
const attachments = ref([]);
const showAttachments = computed(() => props.allowAttachments);
const canSend = computed(() => {
  return inputValue.value.trim().length > 0 || attachments.value.length > 0;
});
watch(() => props.modelValue, (val) => {
  inputValue.value = val;
  nextTick(() => autoResize());
});
function handleInput() {
  emit("update:modelValue", inputValue.value);
  autoResize();
}
function autoResize() {
  if (!textareaRef.value) return;
  const textarea = textareaRef.value;
  const lineHeight = 24;
  const paddingY = 8;
  const singleLineHeight = lineHeight + paddingY;
  const maxHeight = props.maxRows * lineHeight + paddingY;
  textarea.style.height = "auto";
  const scrollHeight = textarea.scrollHeight;
  if (scrollHeight <= singleLineHeight + 2) {
    textarea.style.height = `${singleLineHeight}px`;
    textarea.style.overflowY = "hidden";
  } else {
    const newHeight = Math.min(scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY = newHeight >= maxHeight ? "auto" : "hidden";
  }
}
function handleKeydown(e) {
  if (e.key === "Enter" && !e.shiftKey && props.sendOnEnter) {
    e.preventDefault();
    handleSend();
  }
}
function handleSend() {
  if (!canSend.value || props.disabled) return;
  const content = inputValue.value.trim();
  const atts = [...attachments.value];
  inputValue.value = "";
  attachments.value = [];
  emit("update:modelValue", "");
  emit("send", content, atts);
  nextTick(() => {
    autoResize();
    textareaRef.value?.focus();
  });
}
function triggerFileUpload() {
  fileInputRef.value?.click();
}
function handleFileSelect(e) {
  const target = e.target;
  const files = target.files;
  if (!files) return;
  Array.from(files).forEach((file) => {
    if (attachments.value.length >= props.maxAttachments) return;
    const attachment = {
      id: generateId(),
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size
    };
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e2) => {
        attachment.preview = e2.target?.result;
        attachments.value.push(attachment);
      };
      reader.readAsDataURL(file);
    } else {
      attachments.value.push(attachment);
    }
    emit("attachment-add", file);
  });
  target.value = "";
}
function handleRemoveAttachment(file) {
  const index = attachments.value.findIndex((a) => a.id === file.id);
  if (index > -1) {
    attachments.value.splice(index, 1);
  }
}
defineExpose({
  focus: () => textareaRef.value?.focus(),
  blur: () => textareaRef.value?.blur(),
  reset: () => {
    inputValue.value = "";
    attachments.value = [];
  }
});
watch(() => props.loading, () => {
  if (!props.loading) {
    nextTick(() => {
      autoResize();
    });
  }
}, { immediate: true });

</script>

<style scoped>

.ev-chat-sender {
  background: var(--ev-bg-color-overlay);
  border: 1px solid var(--ev-border-color);
  border-radius: var(--ev-radius-xl);
  transition: border-color var(--ev-duration-base) var(--ev-ease-out),
              box-shadow var(--ev-duration-base) var(--ev-ease-out);
}

.ev-chat-sender:focus-within {
  border-color: var(--ev-color-primary);
  box-shadow: 0 0 0 3px var(--ev-color-primary-light-8);
}

.ev-chat-sender__attachments {
  padding: var(--ev-space-3) var(--ev-space-4) 0;
}

.ev-chat-sender__input-wrapper {
  padding: var(--ev-space-2) var(--ev-space-3);
}

.ev-chat-sender__toolbar {
  display: flex;
  align-items: center;
  gap: var(--ev-space-1);
  padding-bottom: var(--ev-space-1);
}

.ev-chat-sender__tool-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: var(--ev-radius-md);
  cursor: pointer;
  color: var(--ev-text-color-secondary);
  transition: all var(--ev-duration-fast) var(--ev-ease-out);
  padding: 0;
}

.ev-chat-sender__tool-btn:hover:not(:disabled) {
  background: var(--ev-fill-color);
  color: var(--ev-color-primary);
}

.ev-chat-sender__tool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ev-chat-sender__file-input {
  display: none;
}

.ev-chat-sender__textarea-wrapper {
  position: relative;
}

.ev-chat-sender__textarea {
  width: 100%;
  border: none;
  background: transparent;
  resize: none;
  outline: none;
  font-size: var(--ev-font-size-base);
  line-height: 24px;
  color: var(--ev-text-color-primary);
  font-family: inherit;
  padding: 4px var(--ev-space-1);
  min-height: 32px;
  height: 32px;
  max-height: 152px;
  overflow-y: hidden;
  box-sizing: border-box;
  transition: height 0.1s ease;
}

.ev-chat-sender__textarea::placeholder {
  color: var(--ev-text-color-placeholder);
}

.ev-chat-sender__textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ev-chat-sender__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--ev-space-2);
  padding-top: var(--ev-space-1);
}

.ev-chat-sender__word-count {
  font-size: var(--ev-font-size-xs);
  color: var(--ev-text-color-placeholder);
}

.ev-chat-sender__send-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: var(--ev-color-primary);
  border-radius: var(--ev-radius-lg);
  cursor: pointer;
  color: white;
  transition: all var(--ev-duration-fast) var(--ev-ease-out);
  padding: 0;
}

.ev-chat-sender__send-btn:hover:not(:disabled) {
  background: var(--ev-color-primary-dark-2);
  transform: scale(1.02);
}

.ev-chat-sender__send-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.ev-chat-sender__send-btn:disabled {
  background: var(--ev-fill-color-dark);
  color: var(--ev-text-color-placeholder);
  cursor: not-allowed;
}
</style>
