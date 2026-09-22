<template>
  <div v-if="resolved.length" class="eb-chat-sources">
    <button
      v-if="collapsible"
      type="button"
      class="eb-chat-sources__toggle"
      :aria-expanded="String(open)"
      :aria-controls="listId"
      :title="open ? labels.sources.close : labels.sources.open"
      @click="open = !open"
    >
      <eb-icon :name="open ? 'arrow-down' : 'arrow-right'" :size="12" />
      <span>{{ labels.sources.toggle(resolved.length) }}</span>
    </button>
    <p v-else class="eb-chat-sources__heading">{{ labels.sources.toggle(resolved.length) }}</p>
    <ol v-show="!collapsible || open" :id="listId" ref="listRef" class="eb-chat-sources__list">
      <li
        v-for="(item, i) in resolved"
        :key="item.id ?? i"
        :data-ref-id="item.id ?? i + 1"
        class="eb-chat-sources__item"
        :class="{ 'is-highlighted': highlighted === String(item.id ?? i + 1) }"
      >
        <button
          type="button"
          class="eb-chat-sources__card"
          :title="item.url || item.title"
          @click="emit('item-click', item, i)"
        >
          <span class="eb-chat-sources__index">{{ item.index ?? i + 1 }}</span>
          <img
            v-if="item.favicon"
            class="eb-chat-sources__favicon"
            :src="item.favicon"
            alt=""
            loading="lazy"
            referrerpolicy="no-referrer"
          />
          <span class="eb-chat-sources__text">
            <span class="eb-chat-sources__title">{{ item.title || item.url || item.source }}</span>
            <span v-if="item.source || domain(item.url)" class="eb-chat-sources__meta">{{ item.source || domain(item.url) }}</span>
            <span v-if="item.snippet" class="eb-chat-sources__snippet">{{ item.snippet }}</span>
          </span>
        </button>
      </li>
    </ol>
  </div>
</template>

<script setup>
import EbIcon from "@wil-works/evoke-business-ui/icon"
import { ref, computed } from "vue";
import { useChatLabels } from "./labels";
const labels = useChatLabels();
const props = defineProps({
  /** 来源列表 [{ id?, index?, title, url?, source?, snippet?, favicon? }] */
  items: { type: Array, required: false, default: () => [] },
  /** 折叠头部；关掉就是常驻列表 */
  collapsible: { type: Boolean, required: false, default: true },
  defaultOpen: { type: Boolean, required: false, default: true }
});
const emit = defineEmits(["item-click"]);
const open = ref(props.defaultOpen);
const highlighted = ref(null);
const listRef = ref(null);
const listId = `eb-chat-sources-${Math.random().toString(36).slice(2, 9)}`;
const resolved = computed(() => props.items.map((item, i) => item && typeof item === "object" ? item : { title: String(item), id: String(i + 1) }));
function domain(url) {
  if (!url || typeof url !== "string") return "";
  // 只取主机名展示：整段 URL 太长且常带追踪参数
  const matched = /^[a-z][a-z0-9+.-]*:(?:\/\/)?([^/?#]+)/i.exec(url);
  return matched ? matched[1] : "";
}
/** 行内上标点击时联动：展开列表、标记并滚到对应卡片 */
function highlight(id) {
  if (id === null || id === undefined) {
    highlighted.value = null;
    return;
  }
  const key = String(id);
  open.value = true;
  highlighted.value = key;
  // 高亮时现查 DOM：攒元素引用数组会在 items 变化时留下脱离文档的节点。
  // 用遍历比对而非属性选择器，免得宿主给的 id 里带引号就得处理转义
  const nodes = listRef.value ? [...listRef.value.querySelectorAll("[data-ref-id]")] : [];
  const target = nodes.find((el) => el.dataset.refId === key);
  target?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
}
defineExpose({ highlight });

</script>

<style scoped>

.eb-chat-sources {
  margin-top: var(--eb-space-2);
}

.eb-chat-sources__toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--eb-space-1);
  padding: 2px var(--eb-space-2) 2px 0;
  border: none;
  background: transparent;
  color: var(--eb-text-color-secondary);
  font-size: var(--eb-font-size-sm);
  font-family: inherit;
  cursor: pointer;
}

.eb-chat-sources__toggle:hover {
  color: var(--eb-text-color-primary);
}

.eb-chat-sources__toggle:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
  border-radius: var(--eb-radius-sm);
}

.eb-chat-sources__heading {
  margin: 0 0 var(--eb-space-1);
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-secondary);
}

.eb-chat-sources__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--eb-space-2);
  margin: var(--eb-space-2) 0 0;
  padding: 0;
  list-style: none;
  counter-reset: none;
}

.eb-chat-sources__item {
  position: relative;
  padding-left: 0;
  margin: 0;
  max-width: 280px;
  flex: 0 1 auto;
}

.eb-chat-sources__item::before {
  content: none;
}

.eb-chat-sources__card {
  display: flex;
  align-items: flex-start;
  gap: var(--eb-space-2);
  width: 100%;
  padding: var(--eb-space-2);
  border: 1px solid var(--eb-border-color-light);
  border-radius: var(--eb-radius-md);
  background: var(--eb-bg-color-overlay);
  text-align: left;
  font-family: inherit;
  cursor: pointer;
  transition: border-color var(--eb-duration-fast) var(--eb-ease-out), box-shadow var(--eb-duration-fast) var(--eb-ease-out);
}

.eb-chat-sources__card:hover {
  border-color: var(--eb-color-primary-light-5);
}

.eb-chat-sources__card:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}

.eb-chat-sources__item.is-highlighted .eb-chat-sources__card {
  border-color: var(--eb-color-primary);
  box-shadow: 0 0 0 2px var(--eb-color-primary-light-8);
}

.eb-chat-sources__index {
  flex-shrink: 0;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background: var(--eb-fill-color);
  color: var(--eb-text-color-secondary);
  font-size: var(--eb-font-size-xs);
  line-height: 18px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.eb-chat-sources__favicon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-top: 1px;
  border-radius: 3px;
  object-fit: contain;
}

.eb-chat-sources__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 1px;
}

.eb-chat-sources__title {
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-primary);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.eb-chat-sources__meta {
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
}

.eb-chat-sources__snippet {
  margin-top: var(--eb-space-1);
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
