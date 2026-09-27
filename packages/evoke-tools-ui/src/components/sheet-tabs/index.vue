<template>
  <div ref="rootRef" class="et-sheettabs" role="tablist" :aria-label="label" @keydown="onRovingKeydown">
    <!--
      EtSheetTabs — 工作表标签条（office 层 · 底带）

      办公形态的"表页签"：贴在画布下沿，只露当前表与邻表，其余收进「更多」。
      与 EtTabStrip（工具区 tab 条）的区别是形态与语义：这里是**内容页签**（选中表 =
      换画布），不是命令 tab；所以没有下划线，用底边强调条 + 白底表示"当前页"。

      形态契约：高度 = --et-chrome-tabstrip-height，禁换行禁撑高。
      全部条目常驻 DOM（溢出的只收起不卸载）——溢出规划要实测宽，且可见集变化不重建
      条目，漫游焦点不会因重渲染丢失（与 EtTabStrip 同一套做法）。

      槽优先：nav（左侧滚动/导航位）· tab（自定义表签渲染）· actions（加号/全部表）。
    -->
    <div v-if="slots.nav" class="et-sheettabs__nav">
      <slot name="nav" />
    </div>

    <div class="et-sheettabs__list">
      <button
        v-for="(tab, index) in visibleTabs"
        :key="tab.id"
        :ref="(el) => setItemRef(el, tab)"
        type="button"
        role="tab"
        class="et-sheettabs__tab"
        :class="{
          'is-active': tab.id === modelValue,
          'is-collapsed': isCollapsed(tab),
          'is-disabled': !!tab.disabled,
        }"
        :tabindex="itemTabindex(tab, index)"
        :aria-selected="tab.id === modelValue"
        :aria-hidden="isCollapsed(tab) || undefined"
        :aria-disabled="tab.disabled || undefined"
        :title="tab.label"
        @click="onSelect(tab)"
        @keydown.enter.prevent="onSelect(tab)"
        @keydown.space.prevent="onSelect(tab)"
        @contextmenu="onContextMenu(tab, $event)"
      >
        <slot name="tab" :tab="tab" :active="tab.id === modelValue" :index="index">
          <span v-if="tab.color" class="et-sheettabs__dot" :style="{ background: tab.color }" aria-hidden="true" />
          <span class="et-sheettabs__label">{{ tab.label }}</span>
        </slot>
      </button>

      <!-- 溢出入口：无溢出时退出文档流但仍可量宽（position: absolute; visibility: hidden） -->
      <button
        ref="moreRef"
        type="button"
        class="et-sheettabs__more"
        :class="{ 'is-hidden': !hasOverflow }"
        :aria-label="overflowLabel"
        :aria-expanded="hasOverflow && moreOpen"
        :tabindex="hasOverflow ? 0 : -1"
        @click="moreOpen = !moreOpen"
      >
        <span class="et-sheettabs__more-label">{{ overflowLabel }}</span>
        <ul v-if="moreOpen && overflowTabs.length" class="et-sheettabs__overflow" role="menu">
          <li v-for="tab in overflowTabs" :key="tab.id">
            <button
              type="button"
              role="menuitem"
              class="et-sheettabs__overflow-item"
              :aria-current="tab.id === modelValue || undefined"
              @click="onOverflowSelect(tab)"
            >{{ tab.label }}</button>
          </li>
        </ul>
      </button>
    </div>

    <div class="et-sheettabs__actions">
      <slot name="actions">
        <button v-if="addable" type="button" class="et-sheettabs__add" :aria-label="addLabel" @click="emit('add')">
          <et-icon name="plus" size="14" />
        </button>
      </slot>
    </div>
  </div>
</template>

<script setup>
/**
 * EtSheetTabs — 工作表标签条（office 层）
 *
 * Props
 *   modelValue    当前表 id（v-model）
 *   tabs          表：{ id, label, color?, disabled?, hidden? }（hidden 整体不渲染）
 *   label         区域可访问名（默认「工作表标签」）
 *   overflowLabel 溢出入口文案（默认「更多」）
 *   addable       内置「加号」（actions 槽一旦提供即让位）
 *   addLabel      加号可访问名
 *
 * Emits
 *   update:modelValue / change(id)  选中表
 *   add                             请求新增表（内置加号触发；产品自接也行）
 *   context(tab, event)             右键表签：产品接右键菜单（不拦默认行为）
 *
 * 键盘：roving tabindex（左右 / Home / End），与 EtTabStrip、EtDocumentTabs 同一套漫游契约；
 * 组字期间不漫游（G5 输入法门）。溢出规划复用 EtTabStrip 的 planOverflow 纯函数，口径一致。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue'
import { useRovingTabindex } from '../../runtime/focus/roving'
import { planOverflow } from '../tab-strip/overflow.js'

defineOptions({ name: 'EtSheetTabs' })

const props = defineProps({
  /** 当前表 id（v-model） */
  modelValue: { type: String, default: '' },
  /** { id, label, color?, disabled?, hidden? }；hidden 整体不渲染 */
  tabs: { type: Array, required: true },
  /** 区域可访问名 */
  label: { type: String, default: '工作表标签' },
  /** 溢出入口文案 */
  overflowLabel: { type: String, default: '更多' },
  /** 内置「加号」（#actions 槽提供即让位） */
  addable: { type: Boolean, default: true },
  /** 加号可访问名 */
  addLabel: { type: String, default: '新增工作表' },
})

const emit = defineEmits([
  'update:modelValue',
  /** 当前表切换；载荷 = 表 id（选中表 = 换画布，这是与 EtTabStrip 的语义分界） */
  'change',
  /** 加号被按下——新表怎么建、叫什么归产品 */
  'add',
  /** 表页签被右键；载荷 = (表对象, 原生 MouseEvent)，菜单内容由产品给 */
  'context',
])

const slots = useSlots()
const rootRef = ref(null)
const moreRef = ref(null)
const moreOpen = ref(false)

/** 条目元素表（测量用；与渲染顺序解耦） */
const itemEls = new Map()
function setItemRef(el, tab) {
  if (el) itemEls.set(tab.id, el)
  else itemEls.delete(tab.id)
}

/** 渲染与漫游共用同一份条目（hidden 整体不渲染），顺序 = 产品给的顺序 */
const items = computed(() => props.tabs.filter((t) => !t.hidden))
const visibleTabs = items

const overflowPlan = ref({ visible: [], overflow: [] })
const hasOverflow = computed(() => overflowPlan.value.overflow.length > 0)
const overflowTabs = computed(() => overflowPlan.value.overflow.map((i) => items.value[i]))
const isCollapsed = (tab) => {
  const i = items.value.indexOf(tab)
  return i >= 0 && overflowPlan.value.overflow.includes(i)
}

const { tabindex, onKeydown: onRovingKeydown } = useRovingTabindex({
  count: computed(() => items.value.length),
  active: computed(() => Math.max(0, items.value.findIndex((t) => t.id === props.modelValue))),
  orientation: 'horizontal',
  onMove: (i) => onSelect(items.value[i]),
})

/** roving 只给可见条目一个 Tab 停靠点；收起的不占 Tab 序列 */
function itemTabindex(tab, index) {
  if (tab.disabled || isCollapsed(tab)) return -1
  return tabindex(items.value.indexOf(tab) >= 0 ? items.value.indexOf(tab) : index)
}

function onSelect(tab) {
  if (!tab || tab.disabled) return
  moreOpen.value = false
  emit('update:modelValue', tab.id)
  emit('change', tab.id)
}

function onOverflowSelect(tab) {
  onSelect(tab)
}

function onContextMenu(tab, event) {
  emit('context', tab, event)
}

// ─── 溢出测量（与 EtTabStrip 同源）───
function readGap() {
  const root = rootRef.value
  if (!root || typeof getComputedStyle !== 'function') return 0
  const value = Number.parseFloat(getComputedStyle(root).columnGap)
  return Number.isFinite(value) ? value : 0
}

function measure() {
  const root = rootRef.value
  if (!root) return
  const next = planOverflow(
    items.value.map((tab) => itemEls.get(tab.id)?.offsetWidth ?? 0),
    root.clientWidth,
    { gap: readGap(), moreWidth: moreRef.value?.offsetWidth ?? 0 },
  )
  // 规划没变就不改状态：重渲染会改条目排布，进而在观察器里绕圈
  const key = (plan) => `${plan.visible.join(',')}|${plan.overflow.join(',')}`
  if (key(next) !== key(overflowPlan.value)) overflowPlan.value = next
}

/** 表数 / 文案 / 可点性变化都改实测宽，等一拍再量 */
const tabsSignature = computed(() =>
  items.value.map((t) => `${t.id}|${t.label}|${t.disabled ? 1 : 0}|${t.color ?? ''}`).join(';'),
)

watch([tabsSignature, () => props.overflowLabel], async () => {
  await nextTick()
  measure()
})

let resizeObserver = null

onMounted(() => {
  measure()
  // typeof 守卫与底座组件一致：jsdom / SSR 没有 ResizeObserver，不代表浏览器没有
  if (typeof ResizeObserver === 'function' && rootRef.value) {
    resizeObserver = new ResizeObserver(() => measure())
    resizeObserver.observe(rootRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  itemEls.clear()
})
</script>

<style src="./style.css"></style>
