<template>
  <div v-if="visible && items.length" class="eb-chat-command" role="listbox" :aria-label="ariaLabel">
    <p v-if="title" class="eb-chat-command__title">{{ title }}</p>
    <ul class="eb-chat-command__list">
      <li
        v-for="(item, i) in items"
        :key="item.key ?? i"
        :ref="(el) => setItemRef(el, i)"
        class="eb-chat-command__item"
        :class="{ 'is-highlight': i === highlight }"
        role="option"
        :aria-selected="i === highlight"
        @mouseenter="emit('hover', i)"
        @mousedown.prevent="emit('select', i)"
      >
        <eb-icon v-if="item.icon" :name="item.icon" :size="14" class="eb-chat-command__icon" />
        <span class="eb-chat-command__label">{{ item.label }}</span>
        <span v-if="item.desc" class="eb-chat-command__desc">{{ item.desc }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed, watch, nextTick, ref } from "vue";
import EbIcon from "../icon/index.vue"
import { chatLabels as labels } from "./labels";
const props = defineProps({
  /** 候选项 [{ key, label, desc?, icon? }] */
  items: { type: Array, required: false, default: () => [] },
  /** 当前高亮项（受控，键盘由宿主经 useTriggerMenu 驱动） */
  highlight: { type: Number, required: false, default: 0 },
  visible: { type: Boolean, required: false, default: false },
  /** 顶部说明，如「命令」/「插入引用」 */
  title: { type: String, required: false, default: "" }
});
const emit = defineEmits(["select", "hover"]);

const itemEls = ref([]);
const ariaLabel = computed(() => props.title || labels.command.group);

function setItemRef(el, index) {
  if (el) itemEls.value[index] = el;
}

// 键盘移动高亮时把它滚进视野：列表最多 8 项，但小屏上仍会溢出
watch(
  () => props.highlight,
  (index) => {
    nextTick(() => {
      itemEls.value[index]?.scrollIntoView?.({ block: "nearest" });
    });
  }
);
// 候选项换了一批（查询词变了）就把 refs 清掉，避免指向已卸载的节点
watch(
  () => props.items,
  () => {
    itemEls.value = [];
  }
);
</script>

<style scoped>

.eb-chat-command {
  margin-bottom: var(--eb-space-1);
  padding: var(--eb-space-1) 0;
  border: 1px solid var(--eb-border-color-light);
  border-radius: var(--eb-radius-md);
  background: var(--eb-bg-color-overlay);
  box-shadow: var(--eb-shadow-2);
  max-height: 232px;
  overflow-y: auto;
}

.eb-chat-command__title {
  margin: 0;
  padding: var(--eb-space-1) var(--eb-space-3);
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
}

.eb-chat-command__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.eb-chat-command__item {
  display: flex;
  align-items: baseline;
  gap: var(--eb-space-2);
  padding: var(--eb-space-1) var(--eb-space-3);
  cursor: pointer;
}

.eb-chat-command__item.is-highlight {
  background: var(--eb-color-primary-light-9);
}

.eb-chat-command__icon {
  flex-shrink: 0;
  align-self: center;
  color: var(--eb-text-color-secondary);
}

.eb-chat-command__label {
  flex-shrink: 0;
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-primary);
}

.eb-chat-command__item.is-highlight .eb-chat-command__label {
  color: var(--eb-color-primary);
}

.eb-chat-command__desc {
  min-width: 0;
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
