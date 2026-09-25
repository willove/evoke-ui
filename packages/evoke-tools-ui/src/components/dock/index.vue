<template>
  <div
    ref="rootRef"
    class="et-dock"
    :class="[
      `et-dock--${side}`,
      { 'is-collapsed': collapsed, 'is-maximized': dockMaximized },
    ]"
  >
    <!--
      内层是折叠/展开过渡的唯一载体（只过渡 width / height）。并列档（默认）
      不钉主轴尺寸：各面板位的声明宽之和 + 拖拽条即停靠宽（rail 的 auto 列
      "停靠声明宽"由此成立）；tabs 档才把激活面板的 size 钉在内层上。
      maximized 时不钉尺寸：EtWorkbench 的全屏是让位重排，停靠位跨满主体行。
    -->
    <div class="et-dock__inner" :style="innerStyle">
      <!--
        dock 折叠：整列收成一条可点把手。厚度复用面板标题栏高度令牌（同族件
        共用一档厚度，不新增令牌）；箭头指向"展开后停靠区出现的方向"。
      -->
      <button
        v-if="collapsed"
        type="button"
        class="et-dock__handle"
        :aria-label="handleLabel"
        @click="emit('dock-toggle', props.dock.id)"
      >
        <et-icon :name="handleIcon" :size="ICON_SIZE" />
      </button>
      <et-splitter
        v-else-if="visiblePanels.length"
        :layout="splitterLayout"
        class="et-dock__splitter"
        @resize="onResize"
      >
        <!--
          tabs 档（产品显式选择 dock.presentation === 'tabs'）：单槽 + EtPanelGroup，
          激活面板之外的面板在 tab 条里可达、不占位。尺寸度量取激活面板。
        -->
        <template v-if="isTabs && visiblePanels.length > 1">
          <et-splitter-panel :min="activePanel.min" :max="activePanel.max" :resizable="false">
            <et-panel-group
              :panels="visiblePanels"
              :active-id="activePanel.id"
              :maximized-panel="maximized"
              @select="onGroupSelect"
              @collapse="(id) => emit('panel-collapse', id)"
              @expand="(id) => emit('panel-expand', id)"
              @close="(id) => emit('panel-close', id)"
              @maximize="(id) => emit('panel-maximize', id)"
              @restore="() => emit('panel-restore')"
            >
              <template #default="{ panel }">
                <slot name="panel" :panel="panel" :dock="props.dock" />
              </template>
            </et-panel-group>
          </et-splitter-panel>
        </template>
        <!--
          并列档（默认）：每个可见面板一个面板位，同屏并列、尺寸分摊走底座。
          size / min / max 取自面板节点；resizable 无树字段 → 默认 true（夹角
          由 min/max 在底座拖拽里夹）。折叠位收成标题条高度（标题栏仍可达、
          展开钮可还原），且不参与尺寸回写——回写会把合成高度覆写进声明宽。
          全屏时只渲染全屏目标位（不钉 size → 吃满让位后的停靠位），兄弟面板
          让位，还原即回（与 tabs 档"只有激活面板渲染"同构）。
        -->
        <template v-else>
          <et-splitter-panel
            v-for="panel in renderedPanels"
            :key="panel.id"
            :size="slotSizeOf(panel)"
            :min="panel.collapsed ? undefined : panel.min"
            :max="panel.collapsed ? undefined : panel.max"
            :resizable="isResizable(panel)"
          >
            <et-panel
              :panel="panel"
              :maximized="maximized === panel.id"
              @collapse="(id) => emit('panel-collapse', id)"
              @expand="(id) => emit('panel-expand', id)"
              @close="(id) => emit('panel-close', id)"
              @maximize="(id) => emit('panel-maximize', id)"
              @restore="() => emit('panel-restore')"
            >
              <slot name="panel" :panel="panel" :dock="props.dock" />
            </et-panel>
          </et-splitter-panel>
        </template>
      </et-splitter>
    </div>
  </div>
</template>

<script setup>
/**
 * EtDock — 停靠区（tools-ui 计划 05 §四 L3 / M2；TD-4：在 EbSplitter 基元上
 * 自研面板树——尺寸分摊 / 折叠走底座，面板状态走布局树契约）
 *
 * 两种呈现（默认档 = 并列；tabs 档产品显式开）：
 *   · 并列（默认）：每个可见面板一个 EbSplitterPanel，同屏并列、尺寸分摊。
 *     停靠主轴 = 各面板位声明宽之和，拖拽条在底座 min/max 夹角内重分配，
 *     resize 百分比换算回 px 经 setPanelSize 写回树（过夹角、可持久化）——
 *     计划 05 §四 的验收点「尺寸分摊不越界；刷新后尺寸恢复」由这条路满足。
 *   · tabs（dock.presentation === 'tabs'）：单槽 + EtPanelGroup，多面板 tab
 *     化，任一时刻只有激活面板渲染内容，尺寸度量取激活面板。
 *
 * 共同口径：
 *   · side 定主轴：left / right → layout horizontal（位宽 = 声明宽，竖排
 *     分隔条）；bottom → layout vertical（位高 = 声明高）。EtWorkbench 的
 *     轨道列是 auto = "停靠面板声明宽"，画布吃剩余——并列档下停靠宽即各位
 *     声明宽之和，dock 不钉整体尺寸。
 *   · 隐藏面板整条退出渲染但留在树里（产品层用 visiblePanels / showPanel
 *     拉回来）；dock.collapsed → 整列收成把手条，点击 emit dock-toggle。
 *   · maximized 只透传给面板（视觉放大由 EtPanel 做），本件不拦事件；全屏
 *     时并列档只渲染目标位、tabs 档只渲染激活位（同构），停靠位由
 *     EtWorkbench 的 grid 让位跨满主体行。
 *   · 内容通道（为何是作用域槽而不是组件 map prop）：`#panel="{ panel, dock }"`
 *     —— 面板内容归消费方（按 panel.id 渲染自己的视图），框架不引入组件
 *     注册表；逐面板透传，不传槽 = 面板只有标题栏（合法空态）。
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
// 用族内包装件而不是裸底座：拖拽条的工具度量（厚度/热区/把手）随
// EtSplitter 的样式表一起进本件产物；裸底座会让 .et-splitter 作用域落空、
// 条形退到底座 6px（standalone 子路径入口实测过的坑）。
import EtSplitter from '../splitter/index.vue'
import EtSplitterPanel from '../splitter/panel.vue'
import EtIcon from '../../icons/icon.vue'
import EtPanel from '../panel/index.vue'
import EtPanelGroup from '../panel/group.vue'
import { findDock, findPanel, setPanelSize } from '../../runtime/layout/tree'

defineOptions({ name: 'EtDock' })

const props = defineProps({
  /** 停靠区节点：{ id, side, collapsed, panels, presentation? }（presentation === 'tabs' 走 tab 化） */
  dock: { type: Object, required: true },
  /** 当前全屏面板 id（全局唯一） */
  maximized: { type: String, default: null },
})

const emit = defineEmits([
  'update:dock',
  'panel-collapse',
  'panel-expand',
  'panel-close',
  'panel-maximize',
  'panel-restore',
  'dock-toggle',
])

const ICON_SIZE = 'var(--et-icon-sm)'
/** 折叠态把手图标：指向展开后停靠区出现的方向（库内已有语义名，G2） */
const HANDLE_ICONS = { left: 'arrow-right', right: 'arrow-left', bottom: 'arrow-up' }
/**
 * 尺寸回写的落定等待：拖拽 / 折叠展开的过渡期间 ResizeObserver 每帧都给
 * 中间尺寸，立即回写会把过程值写进布局树。等一拍（>一个过渡时长）只落稳定值。
 */
const SETTLE_MS = 120
/**
 * 折叠面板的并列位尺寸：内容折叠成标题条 → 位尺寸 = 标题栏高度（与
 * --et-panel-header-height 同值；该令牌不随密度档变化，底座 size 只吃数字，
 * 在这留一处同源常量）。标题条沿主轴收成一条（底部停靠下即完整的标题栏），
 * 展开钮与可访问名都在，回写跳过折叠位（声明宽不被合成高度覆写）。
 */
const COLLAPSED_SLOT_SIZE = 28

const rootRef = ref(null)
const side = computed(() => props.dock?.side ?? 'left')
const collapsed = computed(() => !!props.dock?.collapsed)
const isTabs = computed(() => props.dock?.presentation === 'tabs')

/** 隐藏面板退出渲染（树里保留）；顺序即并列位 / tab 顺序 */
const visiblePanels = computed(() => (props.dock?.panels ?? []).filter((panel) => !panel.hidden))

/** 激活 tab（视图态，仅 tabs 档用）：当前激活项消失（被关/被隐藏）时落到首个可见面板 */
const activeId = ref('')
watch(
  visiblePanels,
  (panels) => {
    if (!panels.some((panel) => panel.id === activeId.value)) activeId.value = panels[0]?.id ?? ''
  },
  { immediate: true },
)
const activePanel = computed(() => visiblePanels.value.find((panel) => panel.id === activeId.value) ?? null)

/**
 * 并列档实际渲染的面板位：全屏目标在本 dock 时只渲染它（兄弟面板让位，
 * 还原即回）——与 tabs 档"只有激活面板渲染"同构；全屏目标不在本 dock 时
 * 全量并列。
 */
const renderedPanels = computed(() => {
  const target = visiblePanels.value.find((panel) => panel.id === props.maximized)
  return target ? [target] : visiblePanels.value
})

/** dock 是否持有全屏目标（根类 is-maximized：内层撑满让位后的停靠位） */
const dockMaximized = computed(() => visiblePanels.value.some((panel) => panel.id === props.maximized))

const handleIcon = computed(() => HANDLE_ICONS[side.value] ?? 'arrow-right')
const handleLabel = computed(() => {
  const first = renderedPanels.value[0]
  return first ? `展开${first.title}` : '展开停靠区'
})

const splitterLayout = computed(() => (side.value === 'bottom' ? 'vertical' : 'horizontal'))

/** 主轴声明尺寸：数字按 px、比例串原样（比例由停靠位的父级负责解释） */
function sizeToCss(size) {
  if (typeof size === 'number' && size > 0) return `${size}px`
  if (typeof size === 'string' && size) return size
  return null
}

/** 仅 tabs 档钉内层主轴尺寸（激活面板的声明尺寸）；并列档由各位之和决定 */
const innerStyle = computed(() => {
  if (!isTabs.value || collapsed.value || !activePanel.value) return null
  if (props.maximized === activePanel.value.id) return null // 全屏：撑满让位后的停靠位
  const css = sizeToCss(activePanel.value.size)
  if (!css) return null
  return side.value === 'bottom' ? { height: css } : { width: css }
})

/** 并列位尺寸：全屏位不钉（吃满）；折叠位收成标题条；其余取面板声明尺寸 */
function slotSizeOf(panel) {
  if (panel.id === props.maximized) return undefined
  if (panel.collapsed) return COLLAPSED_SLOT_SIZE
  return panel.size
}

/** 树契约没有 per-panel 可拖字段 → 默认 true（显式 false 也尊重）；夹角由 min/max 夹 */
function isResizable(panel) {
  return panel.resizable !== false
}

/** 切 tab 只换激活面板（视图态）：不产生树变更，也就不写盘 */
function onGroupSelect(id) {
  activeId.value = id
}

// ─── 尺寸回写（底座 resize 事件 → 布局树） ───
function mainAxisSize() {
  const el = rootRef.value
  if (!el) return 0
  return side.value === 'bottom' ? el.clientHeight : el.clientWidth
}

/**
 * 面板位 ↔ 底座百分比数组的位次映射：tabs 档只有激活面板一位（0 → 激活面板）；
 * 并列档按可见面板序一一对应（0,1,2…）。回写只对"声明尺寸是 px"的位做——
 * 比例尺寸由停靠位的父级管，dock 折叠中没有 splitter，全屏位与折叠位的尺寸
 * 是合成值（写回去会覆写声明宽），三类都不写。
 */
const slotPanels = computed(() => {
  if (isTabs.value && visiblePanels.value.length > 1) {
    return activePanel.value ? [{ panel: activePanel.value, index: 0 }] : []
  }
  return renderedPanels.value.map((panel, index) => ({ panel, index }))
})

let settleTimer = null
let latestSizes = []

function onResize(sizes) {
  if (settleTimer !== null) clearTimeout(settleTimer)
  settleTimer = setTimeout(flushResize, SETTLE_MS)
  latestSizes = Array.isArray(sizes) ? sizes : sizes == null ? [] : [sizes]
}

function flushResize() {
  settleTimer = null
  const main = mainAxisSize()
  if (!main || collapsed.value) return
  let tree = { docks: [props.dock], maximized: null }
  let changed = false
  for (const { panel, index } of slotPanels.value) {
    if (panel.id === props.maximized) continue // 全屏位：撑满让位后的停靠位，不是声明尺寸
    if (panel.collapsed) continue // 折叠位：合成标题条高度
    if (typeof panel.size !== 'number') continue // 比例尺寸：父级管
    const pct = Number.parseFloat(latestSizes[index])
    if (!Number.isFinite(pct)) continue
    const before = panel.size
    // 换算回 px 再过 setPanelSize 的 min/max 夹角（单一位的比例永远是 100%，
    // 直接写百分比只会冲掉声明宽；px 与布局树契约同源、夹永不越界）
    const next = setPanelSize(tree, panel.id, Math.round((pct / 100) * main))
    const after = findPanel(next, panel.id)?.panel.size
    if (after === undefined || after === before) continue
    tree = next
    changed = true
  }
  if (!changed) return
  const updated = findDock(tree, props.dock.id)
  if (updated) emit('update:dock', updated)
}

onBeforeUnmount(() => {
  if (settleTimer !== null) clearTimeout(settleTimer)
  settleTimer = null
})
</script>

<style src="./style.css"></style>
