<template>
  <div class="eb-chat-sender" :aria-busy="loading ? 'true' : void 0">
    <div v-if="showAttachments && attachments.length" class="eb-chat-sender__attachments">
      <ChatAttachments 
        :attachments="attachments" 
        :removable="!disabled"
        @remove="handleRemoveAttachment"
      />
    </div>
    <div class="eb-chat-sender__input-wrapper">
      <div
        v-if="allowAttachments || $slots.toolbar"
        class="eb-chat-sender__toolbar"
      >
        <button 
          v-if="allowAttachments"
          class="eb-chat-sender__tool-btn"
          type="button"
          :title="attachLabel"
          :aria-label="attachLabel"
          :disabled="disabled || attachments.length >= maxAttachments"
          @click="triggerFileUpload"
        >
          <eb-icon name="plus" />
        </button>
        <input 
          ref="fileInputRef"
          type="file"
          class="eb-chat-sender__file-input"
          :multiple="maxAttachments > 1"
          @change="handleFileSelect"
        />
        <slot name="toolbar" />
      </div>
      <div class="eb-chat-sender__textarea-wrapper">
        <textarea
          ref="textareaRef"
          v-model="inputValue"
          class="eb-chat-sender__textarea"
          :placeholder="placeholder"
          :disabled="disabled"
          :maxlength="maxlengthAttr"
          rows="1"
          :aria-label="placeholder"
          @keydown="handleKeydown"
          @input="handleInput"
        />
      </div>
      <div class="eb-chat-sender__actions">
        <span v-if="showWordCount && maxLength" class="eb-chat-sender__word-count">
          {{ inputValue.length }}/{{ maxLength }}
        </span>
        <button 
          class="eb-chat-sender__send-btn"
          :class="{ 'is-stop': isStopping }"
          type="button"
          :title="isStopping ? stopLabel : sendLabel"
          :aria-label="isStopping ? stopLabel : sendLabel"
          :disabled="sendBtnDisabled"
          @click="handleSendClick"
        >
          <eb-icon :name="isStopping ? 'stop' : 'promotion'" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import EbIcon from "../icon/index.vue"
import { ref, computed, watch, nextTick } from "vue";
import { generateId } from "./utils";
import ChatAttachments from "./ChatAttachments.vue";
import { isImeComposing } from "../../utils/events";
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
  sendOnEnter: { type: Boolean, required: false, default: true },
  /** loading 时发送钮切换为停止钮（emit stop）；与 EbAiPromptBox 同名同义 */
  stoppable: { type: Boolean, required: false, default: false }
});
const emit = defineEmits(["update:modelValue", "send", "stop", "attachment-add"]);
const Plus = getIconByNameSync("plus");
const Promotion = getIconByNameSync("promotion");
const attachLabel = "\u6DFB\u52A0\u9644\u4EF6";
const sendLabel = "\u53D1\u9001";
const stopLabel = "\u505C\u6B62\u751F\u6210";
const textareaRef = ref();
const fileInputRef = ref();
const inputValue = ref(props.modelValue);
const attachments = ref([]);
const showAttachments = computed(() => props.allowAttachments);
const isStopping = computed(() => props.loading && props.stoppable);
const canSend = computed(() => {
  return inputValue.value.trim().length > 0 || attachments.value.length > 0;
});
// maxLength=0/未传视为不限长，否则真正绑到 textarea（此前只展示字数、不约束）
const maxlengthAttr = computed(() => props.maxLength > 0 ? props.maxLength : void 0);
const sendBtnDisabled = computed(() => {
  if (props.disabled) return true;
  if (isStopping.value) return false;
  return !canSend.value || props.loading;
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
  // 输入法组字中的 Enter 是「上屏候选词」，不是发送
  if (isImeComposing(e)) return;
  if (e.key === "Enter" && !e.shiftKey && props.sendOnEnter) {
    e.preventDefault();
    // 生成中：Enter 既不并发投递也不触中断（中断只走停止钮点击）
    if (props.loading) return;
    handleSend();
  }
}
function handleSendClick() {
  if (isStopping.value) {
    emit("stop");
    return;
  }
  handleSend();
}
function handleSend() {
  if (props.disabled || props.loading || !canSend.value) return;
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

.eb-chat-sender {
  background: var(--eb-bg-color-overlay);
  border: 1px solid var(--eb-border-color);
  border-radius: var(--eb-radius-xl);
  transition: border-color var(--eb-duration-base) var(--eb-ease-out),
              box-shadow var(--eb-duration-base) var(--eb-ease-out);
}

.eb-chat-sender:focus-within {
  border-color: var(--eb-color-primary);
  box-shadow: 0 0 0 3px var(--eb-color-primary-light-8);
}

.eb-chat-sender__attachments {
  padding: var(--eb-space-3) var(--eb-space-4) 0;
}

.eb-chat-sender__input-wrapper {
  padding: var(--eb-space-2) var(--eb-space-3);
}

.eb-chat-sender__toolbar {
  display: flex;
  align-items: center;
  gap: var(--eb-space-1);
  padding-bottom: var(--eb-space-1);
}

.eb-chat-sender__tool-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: var(--eb-radius-md);
  cursor: pointer;
  color: var(--eb-text-color-secondary);
  transition: all var(--eb-duration-fast) var(--eb-ease-out);
  padding: 0;
}

.eb-chat-sender__tool-btn:hover:not(:disabled) {
  background: var(--eb-fill-color);
  color: var(--eb-color-primary);
}

.eb-chat-sender__tool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.eb-chat-sender__file-input {
  display: none;
}

.eb-chat-sender__textarea-wrapper {
  position: relative;
}

.eb-chat-sender__textarea {
  width: 100%;
  border: none;
  background: transparent;
  resize: none;
  outline: none;
  font-size: var(--eb-font-size-base);
  line-height: 24px;
  color: var(--eb-text-color-primary);
  font-family: inherit;
  padding: 4px var(--eb-space-1);
  min-height: 32px;
  height: 32px;
  max-height: 152px;
  overflow-y: hidden;
  box-sizing: border-box;
  transition: height 0.1s ease;
}

.eb-chat-sender__textarea::placeholder {
  color: var(--eb-text-color-placeholder);
}

.eb-chat-sender__textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.eb-chat-sender__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--eb-space-2);
  padding-top: var(--eb-space-1);
}

.eb-chat-sender__word-count {
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
}

.eb-chat-sender__send-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: var(--eb-color-primary);
  border-radius: var(--eb-radius-lg);
  cursor: pointer;
  color: white;
  transition: all var(--eb-duration-fast) var(--eb-ease-out);
  padding: 0;
}

.eb-chat-sender__send-btn:hover:not(:disabled) {
  background: var(--eb-color-primary-dark-2);
  transform: scale(1.02);
}

.eb-chat-sender__send-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.eb-chat-sender__send-btn:disabled {
  background: var(--eb-fill-color-dark);
  color: var(--eb-text-color-placeholder);
  cursor: not-allowed;
}

/* 生成中：同一颗钮变停止态 */
.eb-chat-sender__send-btn.is-stop {
  background: var(--eb-text-color-primary);
}

.eb-chat-sender__send-btn.is-stop:hover:not(:disabled) {
  background: var(--eb-text-color-regular);
}
</style>
