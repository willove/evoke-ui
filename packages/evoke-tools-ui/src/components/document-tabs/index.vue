<template>
  <div ref="rootRef" class="et-doctabs" role="tablist" @keydown="onKeydown">
    <!--
      多文档标签条（tools-ui 计划 05 §四 L3 / M2 交付物 3）。

      与 EtTabStrip 的关系：契约同源（tabs → 条目的同一套交互），但条目里要渲染
      脏标记（CSS 圆点 + aria-label），而 EtTabStrip 的标签是纯文字 prop ——  markup
      进不了它的条目。所以本件按同一套契约自建 DOM：溢出规划复用 tab-strip 的
      planOverflow 纯函数、键盘漫游复用 runtime/focus 的 roving、「更多」下拉复用
      底座 EbDropdown 结构，度量令牌与 EtTabStrip 逐项共用（同槽位视觉一致）。

      全部条目常驻 DOM（溢出的只收起、不卸载）：规划要的是实测宽；可见集只随容器
      宽度变化，条目不重建 → 漫游焦点不丢。
    -->
      <div
      v-for="doc in documents"
      :key="doc.id"
      :ref="(el) => setItemRef(el, doc)"
      class="et-doctabs__item"
      :class="{
        'is-active': isActive(doc),
        'is-collapsed': isCollapsed(doc),
        'is-dirty': !!doc.dirty,
      }"
      role="tab"
      :aria-selected="isActive(doc)"
      :aria-label="ariaLabel(doc)"
      :aria-hidden="isCollapsed(doc) || undefined"
      :tabindex="itemTabindex(doc)"
      @click="onItemClick(doc, $event)"
      @keydown.enter.prevent="onItemClick(doc)"
      @keydown.space.prevent="onItemClick(doc)"
      @contextmenu="onItemContextMenu(doc, $event)"
    >
      <span class="et-doctabs__label">{{ doc.title }}</span>
      <!-- 脏标记：CSS 圆点（不吃行高），读屏名补"未保存"（G4） -->
      <span v-if="doc.dirty" class="et-doctabs__dirty" role="img" aria-label="未保存" />
      <!--
        关闭确认：默认不弹（消费方自己弹——关闭是产品语义，组件不预判）。
        confirmClose + confirmText 双条件才用底座 EbPopconfirm 包一层。
      -->
      <eb-popconfirm
        v-if="confirmClose && confirmText && isClosable(doc)"
        class="et-doctabs__confirm"
        :title="confirmText"
        placement="top"
        @confirm="emitClose(doc)"
      >
        <button
          class="et-doctabs__close"
          type="button"
          :aria-label="`关闭 ${doc.title}`"
          tabindex="-1"
          @keydown.enter.stop
          @keydown.space.stop
          @keydown.delete.stop
        >
          <et-icon name="close" :size="CLOSE_ICON_SIZE" />
        </button>
      </eb-popconfirm>
      <button
        v-else-if="isClosable(doc)"
        class="et-doctabs__close"
        type="button"
        :aria-label="`关闭 ${doc.title}`"
        tabindex="-1"
        @click.stop="emitClose(doc)"
        @keydown.enter.stop
        @keydown.space.stop
        @keydown.delete.stop
      >
        <et-icon name="close" :size="CLOSE_ICON_SIZE" />
      </button>
    </div>

    <!-- 溢出入口：无溢出时退出文档流但保留可测宽度（规划要知道它占多宽） -->
    <div ref="moreRef" class="et-doctabs__more" :class="{ 'is-hidden': !hasOverflow }">
      <eb-dropdown trigger="click" placement="bottom-end" @command="onOverflowCommand">
        <template #trigger>
          <span class="et-doctabs__more-label">{{ overflowLabel }}</span>
          <span class="et-doctabs__more-badge">{{ overflowDocuments.length }}</span>
        </template>
        <template #dropdown>
          <eb-dropdown-menu>
            <eb-dropdown-item v-for="doc in overflowDocuments" :key="doc.id" :command="doc.id">
              <span class="et-doctabs__more-title">{{ doc.title }}</span>
              <span v-if="doc.dirty" class="et-doctabs__dirty" role="img" aria-label="未保存" />
            </eb-dropdown-item>
          </eb-dropdown-menu>
        </template>
      </eb-dropdown>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import EbDropdown from '@wil-works/evoke-business-ui/dropdown'
import EbDropdownItem from '@wil-works/evoke-business-ui/dropdown-item'
import EbDropdownMenu from '@wil-works/evoke-business-ui/dropdown-menu'
import EbPopconfirm from '@wil-works/evoke-business-ui/popconfirm'
import EtIcon from '../../icons/icon.vue'
import { useRovingTabindex } from '../../runtime/focus/roving'
import { planOverflow } from '../tab-strip/overflow.js'

defineOptions({ name: 'EtDocumentTabs' })

const props = defineProps({
  /** 激活文档的 id */
  modelValue: { type: String, default: '' },
  /** 文档表：{ id, title, dirty?, closable? }（closable 缺省视为可关闭） */
  documents: { type: Array, default: () => [] },
  /** 窄屏溢出入口文案 */
  overflowLabel: { type: String, default: '更多' },
  /** 关闭前弹确认（仅在同时给了 confirmText 时生效） */
  confirmClose: { type: Boolean, default: false },
  /** 关闭确认文案（EbPopconfirm 的 title） */
  confirmText: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'change', 'close', 'context'])

/** 关闭钮图标档：xs（14，密集行内档）——尺寸同样只引用令牌 */
const CLOSE_ICON_SIZE = 'var(--et-icon-xs)'

const rootRef = ref(null)
const moreRef = ref(null)

/**
 * 溢出规划结果（条目下标划分）；null = 尚未测量。
 * 未测量按"全部可见"渲染：SSR / 首帧不能把所有条目都藏起来，测量在 onMounted 完成。
 */
const overflowPlan = ref(null)

/** 条目元素登记表（id → DOM）：量宽度用、漫游聚焦用 */
const itemEls = new Map()
function setItemRef(el, doc) {
  if (el) itemEls.set(doc.id, el)
  else itemEls.delete(doc.id)
}

const visibleDocuments = computed(() =>
  overflowPlan.value
    ? overflowPlan.value.visible.map((i) => props.documents[i]).filter(Boolean)
    : props.documents,
)
const overflowDocuments = computed(() =>
  overflowPlan.value ? overflowPlan.value.overflow.map((i) => props.documents[i]).filter(Boolean) : [],
)

const hasOverflow = computed(() => overflowDocuments.value.length > 0)

const visibleIndexById = computed(() => new Map(visibleDocuments.value.map((doc, i) => [doc.id, i])))
const isCollapsed = (doc) => !visibleIndexById.value.has(doc.id)
const isActive = (doc) => doc.id === props.modelValue
const isClosable = (doc) => doc.closable !== false

/** 读屏名：脏文档补"未保存"（与圆点的 role=img 名双通道兜底） */
const ariaLabel = (doc) => (doc.dirty ? `${doc.title}，未保存` : doc.title)

/** 漫游激活下标：激活文档被收进溢出列表时，入口落在首个可见条目 */
const activeVisibleIndex = computed(() => {
  const index = visibleDocuments.value.findIndex((doc) => doc.id === props.modelValue)
  return index >= 0 ? index : 0
})

function itemTabindex(doc) {
  const index = visibleIndexById.value.get(doc.id)
  return index === undefined ? -1 : tabindex(index)
}

// ─── 键盘漫游（左右 / Home / End；组字守卫在 roving 组合式函数内，G5）──
const { tabindex, onKeydown: onRovingKeydown } = useRovingTabindex({
  count: computed(() => visibleDocuments.value.length),
  active: activeVisibleIndex,
  orientation: 'horizontal',
  onMove: (target) => {
    selectDocument(visibleDocuments.value[target])
  },
})

function onKeydown(e) {
  onRovingKeydown(e)
}

// ─── 交互 ───
function selectDocument(doc) {
  if (!doc || doc.id === props.modelValue) return
  focusItem(doc.id)
  emit('update:modelValue', doc.id)
  emit('change', doc.id)
}

/** 焦点落到条目 DOM：漫游要求焦点跟着激活项走（nextTick 等渲染稳定） */
function focusItem(id) {
  nextTick(() => itemEls.get(id)?.focus())
}

function onItemClick(doc, event) {
  // 点条目内的关闭钮 / 脏圆点不触发选中：关闭与确认是独立交互
  // （弹确认态的关闭钮不拦冒泡——popper 的 click 监听挂在按钮父层上）
  if (event?.target?.closest?.('.et-doctabs__close')) return
  selectDocument(doc)
}

function emitClose(doc) {
  emit('close', doc.id)
}

/** 右键 / 上下文 tab：声明式唤出钩子（产品挂 EtContextMenu），不拦默认行为 */
function onItemContextMenu(doc, event) {
  emit('context', doc.id, event)
}

/** 溢出菜单点条目 = 切到该文档（选中态不随可见集走） */
function onOverflowCommand(id) {
  selectDocument(props.documents.find((doc) => doc.id === id))
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
    props.documents.map((doc) => itemEls.get(doc.id)?.offsetWidth ?? 0),
    root.clientWidth,
    { gap: readGap(), moreWidth: moreRef.value?.offsetWidth ?? 0 },
  )
  // 规划没变就不改状态：重渲染会改条目排布，进而在观察器里绕圈
  const key = (plan) => `${plan.visible.join(',')}|${plan.overflow.join(',')}`
  if (!overflowPlan.value || key(next) !== key(overflowPlan.value)) overflowPlan.value = next
}

// 条目文案 / 可关闭性 / 脏状态变化都会改实测宽，重新规划。
// 等一拍再量：新增条目要等 DOM 落下后才量得到它的宽（否则按 0 宽规划）
const documentsSignature = computed(() =>
  props.documents.map((doc) => `${doc.id}|${doc.title}|${doc.dirty ? 1 : 0}|${doc.closable ? 1 : 0}`).join(';'),
)

watch([documentsSignature, () => props.overflowLabel], async () => {
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
</script>

<style src="./style.css"></style>
