<template>
  <div class="et-workbench">
    <!--
      EtWorkbench — 工作台布局运行时（tools-ui 计划 05 §四 L3 / M2 交付物 1 的门面）

      区域槽从上到下：titlebar → documents（文档标签位）→ toolbar（工具区）→
      主体行（[left 槽 | EtDock(left) | canvas 默认槽 | EtDock(right) | EtDock(bottom)]）
      → statusbar。停靠位上"面板"由 EtDock 从 layout.docks 按 side 取；left / right /
      bottom 三个槽只放 dock 之外的面板级 UI（一般留空）。

      纪律：本组件是布局树唯一的写处（单点状态，同 M1 命令纪律）——EtDock 的所有
      emit 都经 runtime/layout/tree 的纯函数产生新树后再 update:layout；消费方
      只需要 v-model 收树 + 在 UI 上自放"重置布局"入口。

      面板内容槽 panel：透传给每个 EtDock 的 #panel 槽（作用域 { panel, dock }，
      消费方按 panel.id 映射自己的内容组件——面板 id 在树里全局唯一）。
    -->
      <!-- 标题栏槽（chrome 顶带：产品名/文档名/窗口控制位由产品填） -->
    <div v-if="$slots.titlebar" class="et-workbench__band et-workbench__band--titlebar">
      <slot name="titlebar" />
    </div>

    <!-- 文档标签位：产品放 EtDocumentTabs 或 EtTabStrip -->
    <div v-if="$slots.documents" class="et-workbench__band et-workbench__band--documents">
      <slot name="documents" />
    </div>

    <!-- 工具栏槽：产品放 EtRibbonBar -->
    <div v-if="$slots.toolbar" class="et-workbench__band et-workbench__band--toolbar">
      <slot name="toolbar" />
    </div>

    <!--
      主体行。全屏面板（树里 maximized 非空）：对应停靠整幅、其余区域让位 ——
      纯 CSS grid 重排（style.css 的 is-maximized 段，注释在那边）。
    -->
    <div class="et-workbench__body" :class="{ 'is-maximized': !!maximizedDockSide }">
      <div
        v-if="leftDock || $slots.left"
        class="et-workbench__rail et-workbench__rail--left"
        :class="{ 'is-maximized': maximizedDockSide === 'left' }"
      >
        <slot name="left" />
        <et-dock
          v-if="leftDock"
          :dock="leftDock"
          :maximized="maximizedPanelId"
          @update:dock="onDockUpdate"
          @panel-collapse="onPanelCollapse"
          @panel-expand="onPanelExpand"
          @panel-close="onPanelClose"
          @panel-maximize="onPanelMaximize"
          @panel-restore="onPanelRestore"
          @dock-toggle="onDockToggle"
        >
          <!-- 面板内容槽透传：消费方按 panel.id 映射自己的内容组件（面板 id 全局唯一） -->
          <template #panel="panelScope">
            <slot name="panel" v-bind="panelScope" />
          </template>
        </et-dock>
      </div>

      <!-- canvas = 默认槽（中列画布） -->
      <div class="et-workbench__canvas">
        <slot />
      </div>

      <div
        v-if="rightDock || $slots.right"
        class="et-workbench__rail et-workbench__rail--right"
        :class="{ 'is-maximized': maximizedDockSide === 'right' }"
      >
        <slot name="right" />
        <et-dock
          v-if="rightDock"
          :dock="rightDock"
          :maximized="maximizedPanelId"
          @update:dock="onDockUpdate"
          @panel-collapse="onPanelCollapse"
          @panel-expand="onPanelExpand"
          @panel-close="onPanelClose"
          @panel-maximize="onPanelMaximize"
          @panel-restore="onPanelRestore"
          @dock-toggle="onDockToggle"
        >
          <template #panel="panelScope">
            <slot name="panel" v-bind="panelScope" />
          </template>
        </et-dock>
      </div>

      <div
        v-if="bottomDock || $slots.bottom"
        class="et-workbench__rail et-workbench__rail--bottom"
        :class="{ 'is-maximized': maximizedDockSide === 'bottom' }"
      >
        <slot name="bottom" />
        <et-dock
          v-if="bottomDock"
          :dock="bottomDock"
          :maximized="maximizedPanelId"
          @update:dock="onDockUpdate"
          @panel-collapse="onPanelCollapse"
          @panel-expand="onPanelExpand"
          @panel-close="onPanelClose"
          @panel-maximize="onPanelMaximize"
          @panel-restore="onPanelRestore"
          @dock-toggle="onDockToggle"
        >
          <template #panel="panelScope">
            <slot name="panel" v-bind="panelScope" />
          </template>
        </et-dock>
      </div>
    </div>

    <!-- 状态栏槽（chrome 底带） -->
    <div v-if="$slots.statusbar" class="et-workbench__band et-workbench__band--statusbar">
      <slot name="statusbar" />
    </div>
  </div>
</template>

<script setup>
/**
 * 布局运行时行为（契约见 runtime/layout/tree.js，M2 交付物 1 的 L0 部分）：
 *   ① 持久化：persistKey 非空 → 挂载 loadLayout 读回；树变更 → saveLayout
 *      （写盘前 layoutEquals 比对，无变更不写；异常静默——隐私模式/配额满不炸）；
 *   ② 损坏降级：layout prop 本身坏 / 持久化数据坏 → 一律降级到 defaultLayout
 *      渲染（不白屏），errors 走 layout-corrupted 事件，dev 下 console.warn；
 *   ③ 重置：resetLayout() 回默认树（更新 v-model + emit reset），产品自放入口；
 *   ④ 全屏：树里 maximized 非空 → 对应 dock 整幅、其它区域让位（CSS grid 重排）。
 */
import { computed, onMounted, ref, watch } from 'vue'
import EtDock from '../dock/index.vue'
import {
  dockOf,
  findPanel,
  hidePanel,
  layoutEquals,
  loadLayout,
  maximizePanel,
  normalizeLayout,
  resetLayout as cloneDefaultLayout,
  restorePanel,
  saveLayout,
  showPanel,
  toggleDockCollapsed,
  togglePanelCollapsed,
} from '../../runtime/layout/tree'

defineOptions({ name: 'EtWorkbench' })

const props = defineProps({
  /** 布局树（v-model：本组件是唯一的写树处） */
  layout: { type: Object, default: null },
  /** 默认布局（重置用；挂载读盘失败时的降级目标） */
  defaultLayout: { type: Object, default: null },
  /** 持久化键（'' = 不持久化；非空时 localStorage 读写在挂载/变更时发生） */
  persistKey: { type: String, default: '' },
})

const emit = defineEmits(['update:layout', 'reset', 'layout-corrupted'])

/**
 * 默认布局的可用形态。消费方传了坏 defaultLayout 也不能让组件失手：
 * 空树 = 只有画布的工作台（仍然可交互、可重置）。
 */
const defaultTree = computed(() => normalizeLayout(props.defaultLayout, null, []) ?? { docks: [], maximized: null })

/** 当前生效树（内部态）：props.layout 经同步 watch 流入；损坏时降落 defaultTree。
 *  未传 layout（null/undefined）= 合法初始态（产品只给 defaultLayout），不算损坏。 */
const tree = ref(resolveIncoming(props.layout).tree)

/** 入参解读：给了才校验；没给就用默认（不产 errors、不报损坏） */
function resolveIncoming(value) {
  if (value === null || value === undefined) return { tree: defaultTree.value, errors: [] }
  const errors = []
  const tree = normalizeLayout(value, defaultTree.value, errors)
  return { tree: tree ?? defaultTree.value, errors }
}

// ─── 查询（渲染面） ───
const dockBySide = (side) => tree.value.docks.find((dock) => dock.side === side) ?? null
const leftDock = computed(() => dockBySide('left'))
const rightDock = computed(() => dockBySide('right'))
const bottomDock = computed(() => dockBySide('bottom'))
const maximizedPanelId = computed(() => tree.value.maximized)
const maximizedDockSide = computed(() =>
  maximizedPanelId.value ? (dockOf(tree.value, maximizedPanelId.value)?.side ?? null) : null,
)

// ─── 损坏上报（同一处损坏不重复刷屏；恢复后重新武装） ───
let lastCorruption = ''

function reportCorruption(errors) {
  const list = Array.isArray(errors) ? errors.slice() : [String(errors)]
  if (!list.length) return
  const signature = list.join('|')
  if (signature === lastCorruption) return
  lastCorruption = signature
  emit('layout-corrupted', list)
  // dev 下留痕：损坏数据不该静默（契约：降级 + 报 errors，坏档看得见原因）
  if (import.meta.env?.DEV) {
    console.warn(`[EtWorkbench] 布局数据损坏，已降级到默认布局：\n${list.join('\n')}`)
  }
}

// ─── 持久化 ───
function localStorageSafe() {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null // 隐私模式等：load/saveLayout 内部还有 try/catch，双保险
  }
}

/** 上次落盘的树（写盘前比对，无变更不写） */
let lastSaved = tree.value

function maybeSave(next) {
  if (!props.persistKey) return
  if (lastSaved && layoutEquals(next, lastSaved)) return
  if (saveLayout(localStorageSafe(), props.persistKey, next)) lastSaved = next
}

// ─── 同步 watch（props → 内部态；回写自家的 emit 时等价跳过，不抖） ───
watch(
  () => props.layout,
  (value) => {
    const errors = []
    const next = normalizeLayout(value, defaultTree.value, errors)
    if (errors.length) {
      reportCorruption(errors)
      // 自愈：清理后的树写回 v-model —— 消费方手里的树与实际渲染的树不能是两份
      if (!layoutEquals(next, value)) emit('update:layout', next)
    } else {
      lastCorruption = ''
    }
    if (!layoutEquals(next, tree.value)) tree.value = next
    maybeSave(next)
  },
  { immediate: true, deep: true },
)

onMounted(() => {
  if (!props.persistKey) return
  // 挂载读回（空存储 = 默认布局；坏档降级默认布局并上报，照常渲染不白屏）
  const loaded = loadLayout(localStorageSafe(), props.persistKey, defaultTree.value)
  lastSaved = loaded.tree
  if (loaded.usedFallback) {
    reportCorruption(loaded.errors)
    // 自愈必须落盘：只降级不覆写的话，每次刷新都从同一份坏档降级一次，
    // 用户永远看到损坏提示（修好的树要替换掉坏档）
    if (saveLayout(localStorageSafe(), props.persistKey, loaded.tree)) lastSaved = loaded.tree
  }
  if (!layoutEquals(loaded.tree, tree.value)) {
    tree.value = loaded.tree
    emit('update:layout', loaded.tree)
  }
})

// ─── 变更（唯一的写树入口） ───
/**
 * 变更经纯函数产生新树，再过一遍校验才落：坏变更被拒并上报，保持原树
 * （Workbench 是唯一写树的地方，纯度与 M1 命令纪律同源）。
 */
function commit(mutate) {
  const base = tree.value
  const next = mutate(base)
  // 空操作（纯函数对未知 id 原样返回 / update:dock 未命中任何 dock）不产出事件
  if (!next || next === base || layoutEquals(next, base)) return
  const errors = []
  const normalized = normalizeLayout(next, null, errors)
  if (!normalized) {
    reportCorruption(errors)
    return
  }
  tree.value = normalized
  emit('update:layout', normalized)
  maybeSave(normalized)
}

// EtDock emit → 布局契约纯函数（面板 id 在树里唯一，找不到时纯函数原样返回 = 空操作）
function onDockUpdate(dock) {
  commit((base) =>
    dock && typeof dock === 'object'
      ? { ...base, docks: base.docks.map((item) => (item.id === dock.id ? dock : item)) }
      : base,
  )
}

function onPanelCollapse(id) {
  commit((base) => togglePanelCollapsed(base, id))
}

/** 展开 = 取消折叠 + 取消隐藏（hidden 是显式状态，展开即重新参与布局） */
function onPanelExpand(id) {
  commit((base) => {
    const found = findPanel(base, id)
    if (!found) return base
    let next = base
    if (found.panel.hidden) next = showPanel(next, id)
    if (findPanel(next, id)?.collapsed) next = togglePanelCollapsed(next, id)
    return next
  })
}

/** 关闭 = 隐藏（显式状态：重置布局 / 显示面板都能找回来——隐藏 ≠ 不可达） */
function onPanelClose(id) {
  commit((base) => hidePanel(base, id))
}

function onPanelMaximize(id) {
  commit((base) => maximizePanel(base, id))
}

function onPanelRestore() {
  commit((base) => restorePanel(base))
}

function onDockToggle(dockId) {
  commit((base) => toggleDockCollapsed(base, dockId))
}

// ─── 暴露（产品在 backstage / 命令里放入口，组件只提供能力） ───
function getLayout() {
  return tree.value
}

function saveNow() {
  if (!props.persistKey) return false
  const ok = saveLayout(localStorageSafe(), props.persistKey, tree.value)
  if (ok) lastSaved = tree.value
  return ok
}

function resetLayout() {
  const next = cloneDefaultLayout(defaultTree.value)
  tree.value = next
  emit('update:layout', next)
  emit('reset')
  maybeSave(next)
}

defineExpose({ resetLayout, saveNow, getLayout })
</script>

<style src="./style.css"></style>
