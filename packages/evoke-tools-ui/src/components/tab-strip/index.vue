<template>
  <div ref="rootRef" class="et-tabstrip" role="tablist" @keydown="onKeydown">
    <!--
      全部条目常驻 DOM（溢出的只收起、不卸载）：两个原因
      ① 溢出规划要的是"每个条目的实测宽"，卸载后就量不到了；
      ② 可见集只随容器宽度变化，条目不重建 → 漫游焦点不会因重渲染丢失。
    -->
    <div
      v-for="tab in tabs"
      :key="tab.id"
      :ref="(el) => setItemRef(el, tab)"
      class="et-tabstrip__item"
      :class="{
        'is-active': isActive(tab),
        'is-collapsed': isCollapsed(tab),
        'is-disabled': !!tab.disabled,
      }"
      role="tab"
      :aria-selected="isActive(tab)"
      :aria-label="tab.label"
      :aria-hidden="isCollapsed(tab) || undefined"
      :aria-disabled="tab.disabled || undefined"
      :tabindex="itemTabindex(tab)"
      @click="onItemClick(tab)"
      @keydown.enter.prevent="onItemClick(tab)"
      @keydown.space.prevent="onItemClick(tab)"
      @contextmenu="onItemContextMenu(tab, $event)"
    >
      <span class="et-tabstrip__label">{{ tab.label }}</span>
      <!-- 关闭钮 tabindex=-1：不占 Tab 序列（整组只留一个 tab 位给漫游），
           键盘关闭走 Delete（见 onKeydown）；aria-label 满足 G4 -->
      <button
        v-if="tab.closable"
        class="et-tabstrip__close"
        type="button"
        :aria-label="`关闭 ${tab.label}`"
        tabindex="-1"
        @click.stop="onItemClose(tab)"
        @keydown.enter.stop
        @keydown.space.stop
        @keydown.delete.stop
      >
        <et-icon name="close" :size="CLOSE_ICON_SIZE" />
      </button>
    </div>

    <!-- 溢出入口：无溢出时退出文档流但保留可测宽度（规划要知道它占多宽）。
         底座 EbDropdown 的槽位：#trigger = 触发内容（默认子内容会顶掉触发器），
         #dropdown = 浮层里的菜单（默认子内容会被直接渲进根节点、不弹层） -->
    <div ref="moreRef" class="et-tabstrip__more" :class="{ 'is-hidden': !hasOverflow }">
      <eb-dropdown trigger="click" placement="bottom-end" @command="onOverflowCommand">
        <template #trigger>
          <span class="et-tabstrip__more-label">{{ overflowLabel }}</span>
          <span class="et-tabstrip__more-badge">{{ overflowTabs.length }}</span>
        </template>
        <template #dropdown>
          <eb-dropdown-menu>
            <eb-dropdown-item
              v-for="tab in overflowTabs"
              :key="tab.id"
              :command="tab.id"
              :label="tab.label"
              :disabled="tab.disabled"
            />
          </eb-dropdown-menu>
        </template>
      </eb-dropdown>
    </div>
  </div>
</template>

<script>
// 溢出计算契约与组件同文件导出（L1 可单测面）：测试与消费方都从 index.vue 取，
// 避免"算法在 overflow.js、契约认知在 index.vue"两处漂移
export { planOverflow } from './overflow.js'
</script>

<script setup>
/**
 * EtTabStrip — 下划线式 tab 条（纯文字，对齐 Excel/WPS；tools-ui 计划 05 §四 + 04 §六）
 *
 * 与 EbTabs 的分界：这里没有 pane 语义 —— 不渲染 tabpanel、不发 content 切换事件，
 * 只表达"哪个视图被选中"（激活态由消费方自己渲染）。ARIA 因此只有
 * tablist / tab / aria-selected 三件，条目本身是普通焦点元素而非原生 button
 * （关闭钮是真正的 button，嵌在条目里）。
 *
 * 键盘：整组一个 tab 位（roving tabindex，runtime/focus/roving.js）；左右 / Home / End
 * 移动激活项并把焦点落到对应 DOM；Delete 关闭当前可关闭条目（关闭钮不进 Tab 序列）。
 *
 * 溢出：ResizeObserver 盯容器宽度，条目实测总宽（含间距与「更多」入口）放不下时，
 * 尾部条目收进「更多」下拉；观察器在卸载时断开（06 §四 内存预算）。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import EbDropdown from '@wil-works/evoke-business-ui/dropdown'
import EbDropdownItem from '@wil-works/evoke-business-ui/dropdown-item'
import EbDropdownMenu from '@wil-works/evoke-business-ui/dropdown-menu'
import { isImeComposing } from '@wil-works/evoke-business-ui'
import EtIcon from '../../icons/icon.vue'
import { useRovingTabindex } from '../../runtime/focus/roving'
import { planOverflow } from './overflow.js'

defineOptions({ name: 'EtTabStrip' })

const props = defineProps({
  /** 激活 tab 的 id */
  modelValue: { type: String, default: '' },
  /** 条目：{ id, label, closable?, disabled? }（M0 不用图标） */
  tabs: { type: Array, required: true },
  /** 窄屏溢出入口文案 */
  overflowLabel: { type: String, default: '更多' },
})

const emit = defineEmits(['update:modelValue', 'change', 'close', 'context'])

/** 关闭钮图标档：xs（14，密集行内档）——尺寸同样只引用令牌 */
const CLOSE_ICON_SIZE = 'var(--et-icon-xs)'

const rootRef = ref(null)
const moreRef = ref(null)

/**
 * 溢出规划结果（条目下标划分）；null = 尚未测量。
 * 未测量按"全部可见"渲染：SSR / 首帧不能把所有条目都藏起来（visibility 一走，
 * 无 JS 环境下整条 tab 条就是空的），测量在 onMounted 完成，浏览器首帧前已落定。
 */
const overflowPlan = ref(null)

/** 条目元素登记表（id → DOM）：量宽度用、漫游聚焦用 */
const itemEls = new Map()
function setItemRef(el, tab) {
  if (el) itemEls.set(tab.id, el)
  else itemEls.delete(tab.id)
}

const visibleTabs = computed(() =>
  overflowPlan.value
    ? overflowPlan.value.visible.map((i) => props.tabs[i]).filter(Boolean)
    : props.tabs,
)
const overflowTabs = computed(() =>
  overflowPlan.value ? overflowPlan.value.overflow.map((i) => props.tabs[i]).filter(Boolean) : [],
)

const hasOverflow = computed(() => overflowTabs.value.length > 0)

const visibleIndexById = computed(() => new Map(visibleTabs.value.map((tab, i) => [tab.id, i])))
const isCollapsed = (tab) => !visibleIndexById.value.has(tab.id)
const isActive = (tab) => tab.id === props.modelValue

/** 漫游激活下标：激活条目被收进溢出列表时，入口落在首个可见条目 */
const activeVisibleIndex = computed(() => {
  const index = visibleTabs.value.findIndex((tab) => tab.id === props.modelValue)
  return index >= 0 ? index : 0
})

function itemTabindex(tab) {
  const index = visibleIndexById.value.get(tab.id)
  return index === undefined ? -1 : tabindex(index)
}

// ─── 键盘漫游（左右 / Home / End）──
const { tabindex, onKeydown: onRovingKeydown } = useRovingTabindex({
  count: computed(() => visibleTabs.value.length),
  active: activeVisibleIndex,
  orientation: 'horizontal',
  onMove: (target) => {
    const current = activeVisibleIndex.value
    const index = resolveRovingTarget(current, target)
    if (index >= 0) selectTab(visibleTabs.value[index])
  },
})

/** 漫游落点：禁用条目不可选中，沿移动方向继续找最近可用条目 */
function resolveRovingTarget(current, target) {
  const tabs = visibleTabs.value
  if (!tabs[target] || !tabs[target].disabled) return target
  const step = target > current ? 1 : -1
  for (let i = target + step; i >= 0 && i < tabs.length; i += step) {
    if (!tabs[i].disabled) return i
  }
  return -1 // 该方向没有可用条目：原地不动
}

function onKeydown(e) {
  // Delete 关闭当前条目（关闭钮 tabindex=-1，键盘用户靠它）；组字期不判命令
  if (e.key === 'Delete' && !isImeComposing(e)) {
    const active = props.tabs.find((tab) => tab.id === props.modelValue)
    if (active?.closable && !active.disabled) {
      e.preventDefault()
      emit('close', active.id)
      return
    }
  }
  onRovingKeydown(e)
}

// ─── 交互 ───
function selectTab(tab) {
  if (!tab || tab.disabled) return
  focusItem(tab.id)
  if (tab.id === props.modelValue) return
  emit('update:modelValue', tab.id)
  emit('change', tab.id)
}

/** 焦点落到条目 DOM：漫游要求焦点跟着激活项走（nextTick 等渲染稳定） */
function focusItem(id) {
  nextTick(() => itemEls.get(id)?.focus())
}

function onItemClick(tab) {
  selectTab(tab)
}

function onItemClose(tab) {
  emit('close', tab.id)
}

/** 右键 / 上下文 tab：声明式唤出钩子（M1 的 EtContextMenu 消费），不拦默认行为 */
function onItemContextMenu(tab, event) {
  emit('context', tab.id, event)
}

/** 溢出菜单点条目 = 切到该 tab（选中态不随可见集走） */
function onOverflowCommand(id) {
  selectTab(props.tabs.find((tab) => tab.id === id))
}

// ─── 溢出测量 ───
function readGap() {
  const root = rootRef.value
  if (!root || typeof getComputedStyle !== 'function') return 0
  const value = parseFloat(getComputedStyle(root).columnGap)
  return Number.isFinite(value) ? value : 0
}

function measure() {
  const root = rootRef.value
  if (!root) return
  const next = planOverflow(
    props.tabs.map((tab) => itemEls.get(tab.id)?.offsetWidth ?? 0),
    root.clientWidth,
    { gap: readGap(), moreWidth: moreRef.value?.offsetWidth ?? 0 },
  )
  // 规划没变就不改状态：重渲染会改条目排布，进而在观察器里绕圈
  const key = (plan) => `${plan.visible.join(',')}|${plan.overflow.join(',')}`
  if (!overflowPlan.value || key(next) !== key(overflowPlan.value)) overflowPlan.value = next
}

// 条目文案 / 可关闭性 / 入口文案变化都会改实测宽，重新规划。
// 等一拍再量：新增条目要等 DOM 落下后才量得到它的宽（否则按 0 宽规划）
const tabsSignature = computed(() =>
  props.tabs
    .map((tab) => `${tab.id}|${tab.label}|${tab.closable ? 1 : 0}|${tab.disabled ? 1 : 0}`)
    .join(';'),
)

watch([tabsSignature, () => props.overflowLabel], async () => {
  await nextTick()
  measure()
})

let resizeObserver = null

onMounted(() => {
  measure()
  // 容器宽度变化才重算（条目自身宽变化由上面的签名 watch 覆盖）。
  // typeof 守卫与底座组件一致：jsdom / SSR 没有 ResizeObserver，不代表浏览器没有
  if (typeof ResizeObserver === 'function' && rootRef.value) {
    resizeObserver = new ResizeObserver(() => measure())
    resizeObserver.observe(rootRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

defineExpose({ measure })
</script>

<style src="./style.css"></style>
