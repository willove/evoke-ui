<template>
  <div v-if="attachments && attachments.length" class="ev-chat-attachments">
    <div 
      v-for="file in attachments" 
      :key="file.id" 
      class="ev-chat-attachments__item"
    >
      <div class="ev-chat-attachments__preview" v-if="file.preview || isImage(file.type)">
        <img :src="file.preview || file.url" :alt="file.name" />
      </div>
      <div v-else class="ev-chat-attachments__icon">
        <ev-icon name="document" />
      </div>
      <div class="ev-chat-attachments__info">
        <span class="ev-chat-attachments__name">{{ file.name }}</span>
        <span v-if="file.size" class="ev-chat-attachments__size">{{ formatFileSize(file.size) }}</span>
      </div>
      <button v-if="removable" class="ev-chat-attachments__remove" @click="handleRemove(file)">
        <ev-icon name="close" />
      </button>
    </div>
  </div>
</template>

<script setup>
import EvIcon from "../icon/index.vue"
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
  return type.startsWith("image/");
}
function handleRemove(file) {
  emit("remove", file);
}

</script>

<style scoped>

.ev-chat-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ev-space-2);
  margin-bottom: var(--ev-space-2);
}

.ev-chat-attachments__item {
  display: flex;
  align-items: center;
  gap: var(--ev-space-2);
  padding: var(--ev-space-2);
  background: var(--ev-fill-color-light);
  border-radius: var(--ev-radius-md);
  border: 1px solid var(--ev-border-color-light);
  max-width: 280px;
}

.ev-chat-attachments__preview {
  width: 40px;
  height: 40px;
  border-radius: var(--ev-radius-sm);
  overflow: hidden;
  flex-shrink: 0;
}

.ev-chat-attachments__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ev-chat-attachments__icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ev-fill-color);
  border-radius: var(--ev-radius-sm);
  color: var(--ev-color-info);
  font-size: 20px;
  flex-shrink: 0;
}

.ev-chat-attachments__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.ev-chat-attachments__name {
  font-size: var(--ev-font-size-sm);
  color: var(--ev-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ev-chat-attachments__size {
  font-size: var(--ev-font-size-xs);
  color: var(--ev-text-color-placeholder);
}

.ev-chat-attachments__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  color: var(--ev-text-color-placeholder);
  transition: all var(--ev-duration-fast) var(--ev-ease-out);
  flex-shrink: 0;
  padding: 0;
}

.ev-chat-attachments__remove:hover {
  background: var(--ev-fill-color-dark);
  color: var(--ev-text-color-secondary);
}
</style>
