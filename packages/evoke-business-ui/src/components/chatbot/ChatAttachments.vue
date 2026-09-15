<template>
  <div v-if="attachments && attachments.length" class="eb-chat-attachments">
    <div 
      v-for="file in attachments" 
      :key="file.id" 
      class="eb-chat-attachments__item"
    >
      <div class="eb-chat-attachments__preview" v-if="file.preview || isImage(file.type)">
        <img :src="file.preview || file.url" :alt="file.name" />
      </div>
      <div v-else class="eb-chat-attachments__icon">
        <eb-icon name="document" />
      </div>
      <div class="eb-chat-attachments__info">
        <span class="eb-chat-attachments__name">{{ file.name }}</span>
        <span v-if="file.size" class="eb-chat-attachments__size">{{ formatFileSize(file.size) }}</span>
      </div>
      <button v-if="removable" class="eb-chat-attachments__remove" @click="handleRemove(file)">
        <eb-icon name="close" />
      </button>
    </div>
  </div>
</template>

<script setup>
import EbIcon from "../icon/index.vue"
import { formatFileSize } from "./utils";
import { getIconByNameSync } from "../icon/iconRegistry";
const props = defineProps({
  attachments: { type: Array, required: false, default: () => [] },
  removable: { type: Boolean, required: false, default: false }
});
const emit = defineEmits(["remove"]);
const Document = getIconByNameSync("document");
const Close = getIconByNameSync("close");
function isImage(type) {
  // 附件数据来自宿主（LLM 结构不可控），type 缺失按非图片处理而非崩溃
  return typeof type === "string" && type.startsWith("image/");
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
