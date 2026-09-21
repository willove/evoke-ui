<template>
  <Teleport to="body">
    <Transition name="eb-cp">
      <div v-if="modelValue" class="eb-command-palette" @click.self="close">
        <div class="eb-command-palette__panel" role="dialog" aria-modal="true" aria-label="命令面板">
          <div class="eb-command-palette__search">
            <eb-icon name="search" :size="16" class="eb-command-palette__search-icon" />
            <input
              ref="inputRef"
              v-model="query"
              class="eb-command-palette__input"
              type="text"
              :placeholder="placeholder"
              autocomplete="off"
              spellcheck="false"
              @keydown="onKeydown"
            >
            <kbd class="eb-command-palette__kbd">esc</kbd>
          </div>

          <div ref="listRef" class="eb-command-palette__list" role="listbox">
            <template v-for="group in grouped" :key="group.name">
              <div class="eb-command-palette__group-label">{{ group.name }}</div>
              <button
                v-for="item in group.items"
                :key="item.id"
                type="button"
                class="eb-command-palette__item"
                :class="{ 'is-active': item.__index === activeIndex }"
                role="option"
                :aria-selected="item.__index === activeIndex"
                :data-index="item.__index"
                @mouseenter="activeIndex = item.__index"
                @click="run(item)"
              >
                <span class="eb-command-palette__item-icon">
                  <eb-icon v-if="item.icon" :name="item.icon" :size="15" />
                  <eb-icon v-else name="pointer" :size="15" />
                </span>
                <span class="eb-command-palette__item-label">{{ item.label }}</span>
                <span v-if="item.hint" class="eb-command-palette__item-hint">{{ item.hint }}</span>
                <kbd v-if="item.hotkey" class="eb-command-palette__kbd eb-command-palette__kbd--item">{{ item.hotkey }}</kbd>
              </button>
            </template>
            <div v-if="!flat.length" class="eb-command-palette__empty">
              <eb-icon name="search" :size="16" />
              <span>没有匹配「{{ query }}」的命令</span>
            </div>
          </div>

          <div class="eb-command-palette__footer">
            <span><kbd class="eb-command-palette__kbd">↑</kbd><kbd class="eb-command-palette__kbd">↓</kbd> 选择</span>
            <span><kbd class="eb-command-palette__kbd">↵</kbd> 执行</span>
            <span><kbd class="eb-command-palette__kbd">esc</kbd> 关闭</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * EbCommandPalette — 命令面板
 * ⌘K 唤起 · 过滤（label+keywords+group 包含匹配）· 分组渲染 · 键盘导航（↑↓/Enter/Esc）；
 * action 返回 false 阻止关闭；打开时锁定 body 滚动。
 * 动效以 CSS 过渡（eb-cp）实现。
 */
import { ref, computed, watch, nextTick } from 'vue'
import EbIcon from '../icon/index.vue'
import { useLockScroll } from '../../composables/useLockScroll'
import { isImeComposing } from '../../utils/events'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  commands: { type: Array, default: () => [] },
  placeholder: { type: String, default: '输入命令或搜索…' },
})

const emit = defineEmits(['update:modelValue'])

const query = ref('')
const activeIndex = ref(0)
const inputRef = ref(null)
const listRef = ref(null)
// 计数式滚动锁：与 dialog 等叠加时不提前解锁
const { lock, unlock } = useLockScroll()

// 过滤：label + keywords + group 不区分大小写包含匹配
const flat = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.commands.map((c, i) => ({ ...c, __index: i }))
  return props.commands
    .filter((c) => {
      const hay = [c.label, ...(c.keywords ?? []), c.group ?? ''].join(' ').toLowerCase()
      return hay.includes(q)
    })
    .map((c, i) => ({ ...c, __index: i }))
})

// 分组渲染（相邻同组合并，保持 commands 顺序）
const grouped = computed(() => {
  const groups = []
  for (const item of flat.value) {
    const name = item.group ?? '命令'
    let g = groups[groups.length - 1]
    if (!g || g.name !== name) {
      g = { name, items: [] }
      groups.push(g)
    }
    g.items.push(item)
  }
  return groups
})

watch(flat, () => {
  activeIndex.value = 0
})

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      query.value = ''
      activeIndex.value = 0
      await nextTick()
      inputRef.value?.focus()
      lock()
    } else {
      unlock()
    }
  },
)

function close() {
  emit('update:modelValue', false)
}

async function run(item) {
  const ret = await item.action()
  if (ret !== false) close()
}

function scrollActiveIntoView() {
  nextTick(() => {
    const el = listRef.value?.querySelector(`[data-index="${activeIndex.value}"]`)
    // jsdom 等环境无 scrollIntoView
    el?.scrollIntoView?.({ block: 'nearest' })
  })
}

function onKeydown(e) {
  // 组字中的 Enter 是上屏候选词，不是执行命令
  if (isImeComposing(e)) return
  const n = flat.value.length
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (n) activeIndex.value = (activeIndex.value + 1) % n
    scrollActiveIntoView()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (n) activeIndex.value = (activeIndex.value - 1 + n) % n
    scrollActiveIntoView()
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const item = flat.value[activeIndex.value]
    if (item) run(item)
  } else if (e.key === 'Escape') {
    e.preventDefault()
    close()
  }
}

defineExpose({ open: () => emit('update:modelValue', true), close })
</script>

<style src="./style.css"></style>
