<template>
  <div v-if="attachments && attachments.length" class="eb-chat-attachments">
    <div 
      v-for="file in attachments" 
      :key="file.id" 
      class="eb-chat-attachments__item"
      :class="`is-${file.status || 'ready'}`"
    >
      <div class="eb-chat-attachments__preview" v-if="file.preview || isImage(file.type)">
        <img :src="file.preview || file.url" :alt="file.name" loading="lazy" referrerpolicy="no-referrer" />
      </div>
      <div v-else class="eb-chat-attachments__icon" aria-hidden="true">
        <eb-icon name="document" />
      </div>
      <div class="eb-chat-attachments__info">
        <span class="eb-chat-attachments__name">{{ file.name }}</span>
        <span v-if="file.size" class="eb-chat-attachments__size">{{ formatFileSize(file.size) }}</span>
        <!-- 上传态由宿主回写附件对象驱动（组件不自己发请求）：uploading 走进度条，error 走红字 -->
        <span v-if="file.status === 'uploading'" class="eb-chat-attachments__bar" role="progressbar" :aria-valuenow="clampProgress(file.progress)" aria-valuemin="0" aria-valuemax="100">
          <span class="eb-chat-attachments__bar-fill" :style="{ width: `${clampProgress(file.progress)}%` }" />
        </span>
        <span v-else-if="file.status === 'error'" class="eb-chat-attachments__error">{{ file.error || labels.attachments.failed }}</span>
        <span v-else-if="file.status === 'done' && file.progress != null" class="eb-chat-attachments__done">{{ labels.attachments.done }}</span>
      </div>
      <button
        v-if="removable"
        class="eb-chat-attachments__remove"
        type="button"
        :title="labels.attachments.remove(file.name)"
        :aria-label="labels.attachments.remove(file.name)"
        @click="handleRemove(file)"
      >
        <eb-icon name="close" />
      </button>
    </div>
  </div>
</template>

<script setup>
import EbIcon from "../icon/index.vue"
import { formatFileSize } from "./utils";
import { chatLabels as labels } from "./labels";
const props = defineProps({
  attachments: { type: Array, required: false, default: () => [] },
  removable: { type: Boolean, required: false, default: false }
});
const emit = defineEmits(["remove"]);
function isImage(type) {
  // 附件数据来自宿主（LLM 结构不可控），type 缺失按非图片处理而非崩溃
  return typeof type === "string" && type.startsWith("image/");
}
function clampProgress(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

function handleRemove(file) {
  emit("remove", file);
}

</script>

<style scoped>

.eb-chat-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: var(--eb-space-2);
  margin-bottom: var(--eb-space-2);
}

.eb-chat-attachments__item {
  display: flex;
  align-items: center;
  gap: var(--eb-space-2);
  padding: var(--eb-space-2);
  background: var(--eb-fill-color-light);
  border-radius: var(--eb-radius-md);
  border: 1px solid var(--eb-border-color-light);
  max-width: 280px;
}

.eb-chat-attachments__preview {
  width: 40px;
  height: 40px;
  border-radius: var(--eb-radius-sm);
  overflow: hidden;
  flex-shrink: 0;
}

.eb-chat-attachments__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.eb-chat-attachments__icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--eb-fill-color);
  border-radius: var(--eb-radius-sm);
  color: var(--eb-color-info);
  font-size: 20px;
  flex-shrink: 0;
}

.eb-chat-attachments__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.eb-chat-attachments__name {
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.eb-chat-attachments__size {
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
}

.eb-chat-attachments__item.is-error {
  border-color: var(--eb-color-danger-light-7);
  background: var(--eb-color-danger-light-9);
}

.eb-chat-attachments__bar {
  display: block;
  width: 100%;
  height: 3px;
  margin-top: 3px;
  border-radius: 2px;
  background: var(--eb-fill-color-dark);
  overflow: hidden;
}

.eb-chat-attachments__bar-fill {
  display: block;
  height: 100%;
  border-radius: 2px;
  background: var(--eb-color-primary);
  transition: width var(--eb-duration-base) var(--eb-ease-out);
}

.eb-chat-attachments__error {
  font-size: var(--eb-font-size-xs);
  color: var(--eb-color-danger);
}

.eb-chat-attachments__done {
  font-size: var(--eb-font-size-xs);
  color: var(--eb-color-success);
}

.eb-chat-attachments__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  color: var(--eb-text-color-placeholder);
  transition: all var(--eb-duration-fast) var(--eb-ease-out);
  flex-shrink: 0;
  padding: 0;
}

.eb-chat-attachments__remove:hover {
  background: var(--eb-fill-color-dark);
  color: var(--eb-text-color-secondary);
}
</style>
