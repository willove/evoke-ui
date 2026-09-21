<template>
  <div
    class="eb-chat-sender"
    :class="{ 'is-dragover': dragOver }"
    :aria-busy="loading ? 'true' : void 0"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragEnter"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <div v-if="dragOver" class="eb-chat-sender__drop-hint" aria-hidden="true">{{ labels.sender.dropHint }}</div>
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
          :title="labels.sender.attach"
          :aria-label="labels.sender.attach"
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
          :accept="accept || undefined"
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
          @paste="onPaste"
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
          :title="isStopping ? labels.sender.stop : labels.sender.send"
          :aria-label="isStopping ? labels.sender.stop : labels.sender.send"
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
import { generateId, validateAttachment, filesFromDataTransfer } from "./utils";
import ChatAttachments from "./ChatAttachments.vue";
import { isImeComposing } from "../../utils/events";
import { chatLabels as labels } from "./labels";
const props = defineProps({
  modelValue: { type: String, required: false, default: "" },
  placeholder: { type: String, required: false, default: labels.sender.placeholder },
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
  stoppable: { type: Boolean, required: false, default: false },
  /** 允许的附件类型（.ext / mime/* / mime/type，逗号分隔）；空为不限 */
  accept: { type: String, required: false, default: "" },
  /** 单个附件字节上限，0 为不限 */
  maxFileSize: { type: Number, required: false, default: 0 },
  /** 允许拖拽与粘贴投递 */
  allowDrop: { type: Boolean, required: false, default: true },
  /** 生成中允许继续发出（宿主交给引擎即自动排队）；关掉则生成中拦下 */
  queueable: { type: Boolean, required: false, default: false }
});
const emit = defineEmits(["update:modelValue", "send", "stop", "attachment-add", "attachment-reject"]);
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
  return !canSend.value || (props.loading && !props.queueable);
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
    // 生成中：可排队时照常发出（引擎会入队），否则既不并发投递也不触中断
    if (props.loading && !props.queueable) return;
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
  if (props.disabled || !canSend.value) return;
  if (props.loading && !props.queueable) return;
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
let dragDepth = 0;
const dragOver = ref(false);
function onDragEnter() {
  if (!props.allowDrop || props.disabled) return;
  dragDepth += 1;
  dragOver.value = true;
}
function onDragLeave() {
  if (!props.allowDrop) return;
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) dragOver.value = false;
}
function onDrop(e) {
  dragDepth = 0;
  dragOver.value = false;
  if (!props.allowDrop || props.disabled) return;
  addFiles(e.dataTransfer?.files);
}
function onPaste(e) {
  if (!props.allowDrop || props.disabled) return;
  const files = filesFromDataTransfer(e.clipboardData);
  // 有文件才拦下默认行为，纯文本粘贴照常进输入框
  if (files.length) {
    e.preventDefault();
    addFiles(files);
  }
}
function addFiles(files) {
  if (!files?.length) return;
  Array.from(files).forEach((file) => {
    if (attachments.value.length >= props.maxAttachments) {
      emit("attachment-reject", file, "limit");
      return;
    }
    const reason = validateAttachment(file, { accept: props.accept, maxFileSize: props.maxFileSize });
    if (reason) {
      emit("attachment-reject", file, reason);
      return;
    }
    const attachment = {
      id: generateId(),
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      status: "ready"
    };
    attachments.value.push(attachment);
    // 同上：给宿主数组里的响应式代理，回写 status / progress 才会驱动更新
    emit("attachment-add", file, attachments.value[attachments.value.length - 1]);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e2) => {
        // 按 id 回填：期间可能已被移除，直接改闭包对象会写进已脱离的附件
        const target = attachments.value.find((a) => a.id === attachment.id);
        if (target) target.preview = e2.target?.result;
      };
      reader.readAsDataURL(file);
    }
  });
}
function handleFileSelect(e) {
  addFiles(e.target.files);
  e.target.value = "";
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

/* 拖拽投放态：整块给一圈虚线，比只改边框色更能说明「可以丢这里」 */
.eb-chat-sender {
  position: relative;
}

.eb-chat-sender.is-dragover {
  border-style: dashed;
  border-color: var(--eb-color-primary);
  background: var(--eb-color-primary-light-9);
}

.eb-chat-sender__drop-hint {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
  background: var(--eb-color-primary-light-9);
  color: var(--eb-color-primary);
  font-size: var(--eb-font-size-sm);
  font-weight: var(--eb-font-weight-medium);
  pointer-events: none;
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
