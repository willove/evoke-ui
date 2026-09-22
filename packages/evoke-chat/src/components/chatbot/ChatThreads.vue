<template>
  <div ref="menuRoot" class="eb-chat-threads" role="navigation" :aria-label="labels.threads.group">
    <div v-if="showCreate || searchable" class="eb-chat-threads__head">
      <button
        v-if="showCreate"
        type="button"
        class="eb-chat-threads__create"
        @click="emit('create')"
      >
        <eb-icon name="plus" :size="14" />
        <span>{{ labels.threads.newThread }}</span>
      </button>
      <div v-if="searchable" class="eb-chat-threads__search">
        <eb-icon name="search" :size="14" />
        <input
          v-model="keyword"
          type="search"
          class="eb-chat-threads__search-input"
          :placeholder="labels.threads.searchPlaceholder"
          :aria-label="labels.threads.searchPlaceholder"
        >
      </div>
    </div>

    <slot name="header" />

    <div v-if="!groups.length" class="eb-chat-threads__empty">
      <slot name="empty">
        <EbEmpty :description="keyword ? labels.threads.noResult : labels.threads.empty" />
      </slot>
    </div>

    <div v-else class="eb-chat-threads__scroll">
      <template v-for="group in groups" :key="group.key">
        <p v-if="group.label" class="eb-chat-threads__group">{{ group.label }}</p>
        <template v-for="entry in group.items" :key="entry.thread.id">
        <slot
          name="item"
          :thread="entry.thread"
          :index="entry.index"
          :isActive="entry.thread.id === active"
          :isStreaming="streaming.includes(entry.thread.id)"
          :itemProps="itemPropsFor(entry.thread)"
        >
          <div
            class="eb-chat-threads__item"
            :class="{ 'is-active': entry.thread.id === active }"
            :data-thread-id="entry.thread.id"
          >
            <input
              v-if="renamingId === entry.thread.id"
              ref="renameInputRef"
              v-model="renameText"
              class="eb-chat-threads__rename"
              :aria-label="labels.threads.renamePlaceholder"
              @keydown="onRenameKeydown"
              @blur="commitRename"
            >
            <button
              v-else
              type="button"
              class="eb-chat-threads__trigger"
              :aria-current="entry.thread.id === active ? 'true' : undefined"
              @click="emit('select', entry.thread.id)"
              @dblclick="renamable && startRename(entry.thread)"
            >
              <span class="eb-chat-threads__title">
                <eb-icon v-if="entry.thread.pinned" name="star" :size="12" />
                <span>{{ entry.thread.title || labels.threads.untitled }}</span>
              </span>
              <span class="eb-chat-threads__meta">
                <span v-if="streaming.includes(entry.thread.id)" class="eb-chat-threads__live" :title="labels.threads.streaming" />
                <span class="eb-chat-threads__time">{{ formatTime(entry.thread.updatedAt) }}</span>
                <span v-if="entry.thread.unread" class="eb-chat-threads__unread">{{ entry.thread.unread > 99 ? '99+' : entry.thread.unread }}</span>
              </span>
            </button>

            <button
              type="button"
              class="eb-chat-threads__more"
              :title="labels.threads.more"
              :aria-label="labels.threads.more"
              :aria-expanded="menuId === entry.thread.id ? 'true' : 'false'"
              @click.stop="toggleMenu(entry.thread.id)"
            >
              <eb-icon name="more" :size="14" />
            </button>

            <ul v-if="menuId === entry.thread.id" class="eb-chat-threads__menu" role="menu">
              <li v-if="renamable" role="none">
                <button type="button" role="menuitem" class="eb-chat-threads__menu-item" @click.stop="startRename(entry.thread)">
                  {{ labels.threads.renamed }}
                </button>
              </li>
              <li role="none">
                <button type="button" role="menuitem" class="eb-chat-threads__menu-item" @click.stop="pickPin(entry.thread)">
                  {{ entry.thread.pinned ? labels.threads.unpin : labels.threads.pin }}
                </button>
              </li>
              <li role="none">
                <button type="button" role="menuitem" class="eb-chat-threads__menu-item" @click.stop="pickArchive(entry.thread)">
                  {{ entry.thread.archived ? labels.threads.unarchive : labels.threads.archive }}
                </button>
              </li>
              <li v-if="removable" role="none">
                <button
                  type="button"
                  role="menuitem"
                  class="eb-chat-threads__menu-item eb-chat-threads__menu-item--danger"
                  @click.stop="pickRemove(entry.thread)"
                >
                  {{ labels.threads.remove }}
                </button>
              </li>
            </ul>
          </div>
        </slot>
        </template>
      </template>
    </div>

    <button
      v-if="archivedCount"
      type="button"
      class="eb-chat-threads__archived-toggle"
      :aria-expanded="showArchived ? 'true' : 'false'"
      @click="showArchived = !showArchived"
    >
      {{ showArchived ? labels.threads.hideArchived : `${labels.threads.showArchived}（${archivedCount}）` }}
    </button>

    <slot name="footer" />
  </div>
</template>

<script setup>
import EbIcon from "@wil-works/evoke-business-ui/icon"
import EbEmpty from "@wil-works/evoke-business-ui/empty"
import { ref, computed, watch, nextTick, onBeforeUnmount } from "vue";
import { useClickOutside } from "@wil-works/evoke-business-ui";
import { useChatLabels } from "./labels";
const labels = useChatLabels();
const props = defineProps({
  /** [{ id, title, updatedAt, pinned?, archived?, unread? }] */
  threads: { type: Array, required: false, default: () => [] },
  /** 当前会话 id */
  active: { type: String, required: false, default: "" },
  /** 仍在生成中的会话 id 列表（显示活动标记） */
  streaming: { type: Array, required: false, default: () => [] },
  searchable: { type: Boolean, required: false, default: true },
  showCreate: { type: Boolean, required: false, default: true },
  /** 按时间分组（今天 / 昨天 / 近 7 天 / 更早）；搜索中与置顶段不分组 */
  groupByDate: { type: Boolean, required: false, default: true },
  renamable: { type: Boolean, required: false, default: true },
  removable: { type: Boolean, required: false, default: true }
});
const emit = defineEmits(["select", "create", "rename", "remove", "pin", "archive", "search"]);
const keyword = ref("");
const showArchived = ref(false);
const renamingId = ref("");
const renameText = ref("");
const renameInputRef = ref(null);
const menuId = ref("");
const menuRoot = ref(null);

watch(keyword, (val) => emit("search", val));

const archivedCount = computed(() => props.threads.filter((t) => t.archived).length);

/** 置顶在最前，其次按更新时间倒序；归档的等开关打开后再参与分组 */
const ordered = computed(() => {
  const pool = props.threads.filter((t) => (showArchived.value ? true : !t.archived));
  const byTime = (a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
  return [
    ...pool.filter((t) => t.pinned).sort(byTime),
    ...pool.filter((t) => !t.pinned).sort(byTime)
  ];
});

const matched = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return ordered.value;
  return ordered.value.filter((t) => String(t.title || "").toLowerCase().includes(kw));
});

function startOfDay(ts) {
  const d = new Date(ts ?? Date.now());
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** 分组：置顶单独一段，其余按天归并；组内顺序沿用 ordered */
const groups = computed(() => {
  const list = matched.value;
  if (!list.length) return [];
  const indexed = list.map((thread, index) => ({ thread, index }));
  if (!props.groupByDate || keyword.value.trim()) {
    return [{ key: "all", label: "", items: indexed }];
  }
  const today = startOfDay();
  const day = 864e5;
  const out = [];
  const pinned = indexed.filter((e) => e.thread.pinned);
  if (pinned.length) out.push({ key: "pinned", label: labels.threads.pinned, items: pinned });
  // 桶必须互斥：各自 filter 一遍会让同一条同时落进「昨天」「近 7 天」「更早」，
  // 列表里就出现三份。按优先级各归一个桶。
  const buckets = [
    { key: "today", label: labels.threads.today, match: (ts) => startOfDay(ts) >= today },
    { key: "yesterday", label: labels.threads.yesterday, match: (ts) => startOfDay(ts) === today - day },
    { key: "last7", label: labels.threads.last7, match: (ts) => startOfDay(ts) > today - 7 * day }
  ];
  const rest = indexed.filter((e) => !e.thread.pinned);
  const byKey = new Map();
  for (const entry of rest) {
    // 没有时间的项归到「更早」，避免凭空消失
    const ts = entry.thread.updatedAt ?? 0;
    const hit = buckets.find((b) => b.match(ts));
    const key = hit ? hit.key : "earlier";
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(entry);
  }
  for (const bucket of [...buckets, { key: "earlier", label: labels.threads.earlier }]) {
    const items = byKey.get(bucket.key);
    if (items?.length) out.push({ key: bucket.key, label: bucket.label, items });
  }
  return out;
});

/**
 * 逐项 props 束：与 ChatList 的 #message 同款约定——宿主用 v-bind 就能回落默认渲染
 */
function itemPropsFor(thread) {
  return {
    thread,
    isActive: thread.id === props.active,
    isStreaming: props.streaming.includes(thread.id)
  };
}

function formatTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString();
}

function toggleMenu(id) {
  menuId.value = menuId.value === id ? "" : id;
}

const { stop: stopOutside } = useClickOutside([menuRoot], () => {
  menuId.value = "";
});
onBeforeUnmount(stopOutside);

function startRename(thread) {
  menuId.value = "";
  renamingId.value = thread.id;
  renameText.value = thread.title || "";
  nextTick(() => renameInputRef.value?.focus?.());
}

function commitRename() {
  if (!renamingId.value) return;
  const id = renamingId.value;
  const title = renameText.value.trim();
  renamingId.value = "";
  // 空标题视为放弃修改，避免把会话改成一个没有名字的条目
  if (title) emit("rename", id, title);
}

function onRenameKeydown(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    commitRename();
  } else if (e.key === "Escape") {
    e.preventDefault();
    renamingId.value = "";
  }
}

function pickPin(thread) {
  menuId.value = "";
  emit("pin", thread.id, !thread.pinned);
}

function pickArchive(thread) {
  menuId.value = "";
  emit("archive", thread.id, !thread.archived);
}

function pickRemove(thread) {
  menuId.value = "";
  emit("remove", thread.id);
}

</script>

<style scoped>

.eb-chat-threads {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  background: var(--eb-bg-color);
}

.eb-chat-threads__head {
  display: flex;
  flex-direction: column;
  gap: var(--eb-space-2);
  padding: var(--eb-space-3);
  flex-shrink: 0;
}

.eb-chat-threads__create {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--eb-space-1);
  width: 100%;
  padding: var(--eb-space-2);
  border: 1px solid var(--eb-border-color-light);
  border-radius: var(--eb-radius-md);
  background: var(--eb-bg-color-overlay);
  color: var(--eb-text-color-primary);
  font-size: var(--eb-font-size-sm);
  font-family: inherit;
  cursor: pointer;
  transition: border-color var(--eb-duration-fast) var(--eb-ease-out), color var(--eb-duration-fast) var(--eb-ease-out);
}

.eb-chat-threads__create:hover {
  border-color: var(--eb-color-primary-light-5);
  color: var(--eb-color-primary);
}

.eb-chat-threads__create:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}

.eb-chat-threads__search {
  display: flex;
  align-items: center;
  gap: var(--eb-space-1);
  padding: 0 var(--eb-space-2);
  border: 1px solid var(--eb-border-color-light);
  border-radius: var(--eb-radius-md);
  background: var(--eb-fill-color-lighter);
  color: var(--eb-text-color-placeholder);
}

.eb-chat-threads__search:focus-within {
  border-color: var(--eb-color-primary);
}

.eb-chat-threads__search-input {
  flex: 1;
  min-width: 0;
  padding: var(--eb-space-1) 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--eb-text-color-primary);
  font-size: var(--eb-font-size-sm);
  font-family: inherit;
}

.eb-chat-threads__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 var(--eb-space-2) var(--eb-space-2);
}

.eb-chat-threads__group {
  margin: var(--eb-space-3) var(--eb-space-2) var(--eb-space-1);
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
}

.eb-chat-threads__item {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: var(--eb-radius-md);
  transition: background-color var(--eb-duration-fast) var(--eb-ease-out);
}

.eb-chat-threads__item:hover {
  background: var(--eb-fill-color-light);
}

.eb-chat-threads__item.is-active {
  background: var(--eb-color-primary-light-9);
}

.eb-chat-threads__trigger {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: var(--eb-space-2) var(--eb-space-2);
  border: none;
  background: transparent;
  color: inherit;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

.eb-chat-threads__trigger:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: -2px;
  border-radius: var(--eb-radius-md);
}

.eb-chat-threads__title {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.eb-chat-threads__item.is-active .eb-chat-threads__title {
  color: var(--eb-color-primary);
  font-weight: var(--eb-font-weight-medium);
}

.eb-chat-threads__meta {
  display: flex;
  align-items: center;
  gap: var(--eb-space-1);
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
}

.eb-chat-threads__live {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--eb-color-primary);
  animation: eb-chat-threads-pulse 1.4s ease-in-out infinite;
}

@keyframes eb-chat-threads-pulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1); }
}

.eb-chat-threads__unread {
  min-width: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--eb-color-danger);
  color: #fff;
  font-size: 10px;
  line-height: 16px;
  text-align: center;
}

.eb-chat-threads__more {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-right: var(--eb-space-1);
  padding: 0;
  border: none;
  border-radius: var(--eb-radius-sm);
  background: transparent;
  color: var(--eb-text-color-secondary);
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--eb-duration-fast) var(--eb-ease-out);
}

.eb-chat-threads__item:hover .eb-chat-threads__more,
.eb-chat-threads__more:focus-visible,
.eb-chat-threads__more[aria-expanded="true"] {
  opacity: 1;
}

.eb-chat-threads__more:hover {
  background: var(--eb-fill-color);
  color: var(--eb-text-color-primary);
}

.eb-chat-threads__menu {
  position: absolute;
  top: 100%;
  right: var(--eb-space-1);
  z-index: 10;
  min-width: 132px;
  margin: 0;
  padding: var(--eb-space-1);
  list-style: none;
  border: 1px solid var(--eb-border-color-lighter);
  border-radius: var(--eb-radius-md);
  background: var(--eb-bg-color-overlay);
  box-shadow: var(--eb-shadow-2);
}

.eb-chat-threads__menu-item {
  display: block;
  width: 100%;
  padding: var(--eb-space-1) var(--eb-space-2);
  border: none;
  border-radius: var(--eb-radius-sm);
  background: transparent;
  color: var(--eb-text-color-regular);
  font-size: var(--eb-font-size-sm);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

.eb-chat-threads__menu-item:hover {
  background: var(--eb-fill-color-light);
  color: var(--eb-text-color-primary);
}

.eb-chat-threads__menu-item--danger {
  color: var(--eb-color-danger);
}

.eb-chat-threads__menu-item:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: -2px;
}

.eb-chat-threads__rename {
  flex: 1;
  min-width: 0;
  margin: var(--eb-space-1) var(--eb-space-2);
  padding: 3px var(--eb-space-2);
  border: 1px solid var(--eb-color-primary);
  border-radius: var(--eb-radius-sm);
  background: var(--eb-bg-color-overlay);
  color: var(--eb-text-color-primary);
  font-size: var(--eb-font-size-sm);
  font-family: inherit;
}

.eb-chat-threads__rename:focus-visible {
  outline: none;
}

.eb-chat-threads__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
}

.eb-chat-threads__archived-toggle {
  flex-shrink: 0;
  margin: 0 var(--eb-space-3) var(--eb-space-2);
  padding: var(--eb-space-1) 0;
  border: none;
  background: transparent;
  color: var(--eb-text-color-secondary);
  font-size: var(--eb-font-size-xs);
  font-family: inherit;
  cursor: pointer;
  text-align: left;
}

.eb-chat-threads__archived-toggle:hover {
  color: var(--eb-color-primary);
}

@media (prefers-reduced-motion: reduce) {
  .eb-chat-threads__live {
    animation: none;
  }
}
</style>
