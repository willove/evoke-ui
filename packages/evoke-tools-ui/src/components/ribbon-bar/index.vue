<template>
  <div
    ref="rootRef"
    class="et-ribbonbar et-ribbonbar"
    :class="{ 'is-collapsed': collapsedModel }"
    role="toolbar"
    aria-label="工具区"
    @mouseenter="onTabsEnter"
    @mouseleave="onTabsLeave"
    @focusin="onTabsFocusIn"
    @focusout="onTabsFocusOut"
  >
    <!--
      tab 条：schema 常驻 tab + 上下文 tab（planContextTabs 声明式唤出）。
      双击空白/tab = 真折叠；折叠态 hover/focus 唤 peek 浮层（不改持久态）——
      hover 区挂在根上而不是只挂 tab 条：peek 浮层渲染在根内，指针从 tab 条
      移进浮层时 mouseleave 不该把它收掉（Excel 的 peek 也是整块热区）。
    -->
    <div class="et-ribbonbar__tabs" @dblclick="onTabsDblClick">
      <!-- 只监听 change：EtTabStrip 的 selectTab 同时 emit update:modelValue 与 change，两个都绑会双发 -->
      <et-tab-strip
        :model-value="activeTabKey"
        :tabs="stripTabs"
        :overflow-label="overflowLabel"
        @change="onTabSelect"
      />
    </div>

    <!--
      展开态控件行：组与组间分隔 + 行尾「更多」。禁换行（G7）：放不下的组先逐级
      降档（scaleGroup），仍放不下整组收进行尾溢出菜单（planGroupScaleTiers）。
    -->
    <div v-if="!collapsedModel" ref="bodyRef" class="et-ribbonbar__body">
      <template v-for="(entry, index) in bodyGroups" :key="entry.key">
        <et-divider
          v-if="index > 0"
          class="et-ribbonbar__sep"
          direction="vertical"
          :length="entry.tier === RIBBON_SCALE_TIERS.FULL ? 'large' : 'small'"
        />
        <component :is="renderGroup(entry)" />
      </template>
      <et-divider
        v-if="hasOverflow && bodyGroups.length > 0"
        class="et-ribbonbar__sep"
        direction="vertical"
        length="large"
      />
      <!-- 溢出入口常驻 DOM（无溢出时退出文档流但保留可测宽度：规划要知道它占多宽） -->
      <div ref="moreRef" class="et-ribbonbar__more" :class="{ 'is-hidden': !hasOverflow }">
        <et-overflow-menu
          :groups="overflowGroups"
          :registry="registry"
          :ctx="ctx"
          :label="overflowLabel"
          @command="onCommand"
        />
      </div>
    </div>

    <!-- 折叠态 peek：与展开态同一渲染路径（renderGroup），落 --et-z-peek 阶梯 -->
    <div v-else-if="peekOpen" class="et-ribbonbar__peek">
      <template v-for="(entry, index) in bodyGroups" :key="entry.key">
        <et-divider
          v-if="index > 0"
          class="et-ribbonbar__sep"
          direction="vertical"
          :length="entry.tier === RIBBON_SCALE_TIERS.FULL ? 'large' : 'small'"
        />
        <component :is="renderGroup(entry)" />
      </template>
      <div class="et-ribbonbar__more" :class="{ 'is-hidden': !hasOverflow }">
        <et-overflow-menu
          :groups="overflowGroups"
          :registry="registry"
          :ctx="ctx"
          :label="overflowLabel"
          @command="onCommand"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * EtRibbonBar — 工具区主体（tools-ui 计划 05 §四 L2 / 01 §3.1：M1 交付物 3 的门面）
 *
 * 结构 = tab 条 + 控件行（组 / 组间分隔 / 行尾「更多」）。四件产品级能力：
 *   ① 真折叠：Ctrl+F1 / ⌥⌘R 快捷键 + 双击 tab 条；折叠后工具区主体高度归零
 *      （--et-chrome-toolarea-collapsed = 0），命令经 peek 浮层仍可达；每产品
 *      持久化（persistKey → localStorage，异常静默降级）；
 *   ② 分量降级（ScalingPolicy）：容器宽度不足时逐组降档 —— FULL（大钮）→
 *      SMALL（小钮）→ GROUP_DROPDOWN（整组退化为一个下拉按钮）；
 *   ③ 溢出折叠：全部最小档仍放不下 → 组收进行尾「更多」（EtOverflowMenu）；
 *      控件行 flex-wrap: nowrap，禁换行撑高（G7）；
 *   ④ 上下文 tab：contextTabs 声明式唤出（when(ctx) 推演），条件消失即退场。
 *
 * 数据纪律：条目只消费 flattenSchema + scaleGroup 的输出，不自己递归 schema；
 * 命令 enabled/active 的唯一来源是 registry.state(id, ctx)（G3 ③），本件不做
 * 任何本地推演。点击只 emit('command', id)，跑不跑由消费方决定（registry.run）。
 */
import { computed, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { isImeComposing } from '@wil-works/evoke-business-ui'
import EtTabStrip from '../tab-strip/index.vue'
import EtToolButton from '../tool-button/index.vue'
import EtToolGroup from '../tool-group/index.vue'
import EtDivider from '../divider/index.vue'
import EtToolSpacer from '../tool-spacer/index.vue'
import EtSelect from '../select/index.vue'
import EtOverflowMenu from './overflow.vue'
import { comboMatchesEvent, currentPlatform } from '../../runtime/keys/keys'
import { flattenSchema } from '../../runtime/menu/schema'
import {
  RIBBON_SCALE_TIERS,
  loadCollapsed,
  nextCollapsed,
  planContextTabs,
  planGroupScaleTiers,
  saveCollapsed,
  scaleGroup,
} from '../../runtime/ribbon/state'

defineOptions({ name: 'EtRibbonBar' })

const props = defineProps({
  /** tab 节点树：{ key, type: 'tab', label, children: [group{ children: [item|select|separator|spacer] }] } */
  schema: { type: Array, default: () => [] },
  /** 命令注册表（createCommandRegistry() 的返回值）：状态唯一来源 */
  registry: { type: Object, default: null },
  /** 激活 tab 的 key */
  modelValue: { type: String, default: '' },
  /** 真折叠态（受控可选；内部 toggle 经 update:collapsed 回写） */
  collapsed: { type: Boolean, default: false },
  /** 上下文 tab：{ id, label, when(ctx) }，声明式唤出 */
  contextTabs: { type: Array, default: () => [] },
  /** 选区/焦点上下文：enabled/active 全靠它推演 */
  ctx: { type: Object, default: () => ({}) },
  /** 持久化键（'' = 不持久化；非空时 load/saveCollapsed 读写 localStorage） */
  persistKey: { type: String, default: '' },
  /** 窄屏溢出入口文案 */
  overflowLabel: { type: String, default: '更多' },
  /** 折叠后 hover/focus tab 条时浮层临时展开 */
  peek: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'update:collapsed', 'change', 'command'])

// ─── tab 条（常驻 tab + 上下文 tab） ───
const schemaTabs = computed(() =>
  (props.schema ?? [])
    .filter((node) => node.type === 'tab')
    .map((node) => ({ id: node.key, label: node.label ?? node.key })),
)

/** 上下文 tab：条件满足才进条（条件消失即退场；when 缺省视为常可见） */
const contextTabNodes = computed(() => {
  const visible = new Set(planContextTabs(props.contextTabs, props.modelValue, props.ctx).visible)
  return (props.contextTabs ?? [])
    .filter((tab) => visible.has(tab.id))
    .map((tab) => ({ id: tab.id, label: tab.label ?? tab.id }))
})

const stripTabs = computed(() => [...schemaTabs.value, ...contextTabNodes.value])

/** 激活 tab：modelValue 缺省时落到首个常驻 tab（上下文 tab 可能是无 schema 的壳） */
const activeTabKey = computed(
  () => props.modelValue || schemaTabs.value[0]?.id || contextTabNodes.value[0]?.id || '',
)

// ─── 组（flattenSchema 的过滤视图：tab → 组节点） ───
const activeGroups = computed(() =>
  flattenSchema(props.schema)
    .filter((entry) => entry.tab === activeTabKey.value)
    .map((entry) => entry.group),
)

/** 降档/溢出规划；null = 尚未测量（全部按 FULL 档渲染，与 tab 条溢出同范式） */
const scalePlan = ref(null)
/**
 * FULL 档实测宽缓存。规划只认 FULL 宽（planGroupScaleTiers 的 width 语义）：
 * 组一旦降过档，DOM 里就是小钮，量不到原宽 —— 首过时量准、之后复用。
 * key = 组 key（同层唯一由 schema 校验保证）。
 */
const fullWidths = new Map()
/** 布局指纹（控件行实测高）：密度换档后旧缓存宽全部作废，重走 FULL 首过 */
let measureEpoch = -1

const plannedGroups = computed(() => {
  const plan = scalePlan.value
  return activeGroups.value.map((group) => ({
    key: group.key,
    label: group.label ?? '',
    node: group,
    tier: plan ? (plan.tiers[group.key] ?? RIBBON_SCALE_TIERS.FULL) : RIBBON_SCALE_TIERS.FULL,
    overflowed: plan ? plan.overflow.includes(group.key) : false,
  }))
})
const bodyGroups = computed(() => plannedGroups.value.filter((entry) => !entry.overflowed))
const overflowGroups = computed(() =>
  plannedGroups.value.filter((entry) => entry.overflowed).map((entry) => entry.node),
)
const hasOverflow = computed(() => overflowGroups.value.length > 0)

// ─── 真折叠 ───
const collapsedModel = ref(props.collapsed)

watch(() => props.collapsed, (value) => {
  if (value !== collapsedModel.value) collapsedModel.value = value
})

function localStorageSafe() {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null // 隐私模式等：存取走 load/saveCollapsed 的 try/catch 静默降级
  }
}

/** 每产品持久化：挂载时读回作初值（loadCollapsed 异常静默降级，坏数据不白屏） */
function restoreCollapsed() {
  if (!props.persistKey) return
  const stored = loadCollapsed(localStorageSafe(), props.persistKey)
  if (stored !== collapsedModel.value) {
    collapsedModel.value = stored
    emit('update:collapsed', stored)
  }
}

function setCollapsed(next) {
  if (next === collapsedModel.value) return
  collapsedModel.value = next
  emit('update:collapsed', next)
  if (props.persistKey) saveCollapsed(localStorageSafe(), props.persistKey, next)
}

function onTabsDblClick() {
  setCollapsed(nextCollapsed(collapsedModel.value, 'toggle'))
}

// ─── peek 浮层（折叠态临时展开，不改持久态） ───
const peekOpen = ref(false)

function openPeekIfCollapsed() {
  if (collapsedModel.value && props.peek) peekOpen.value = true
}

function onTabsEnter() {
  openPeekIfCollapsed()
}

function onTabsFocusIn() {
  openPeekIfCollapsed()
}

function onTabsLeave() {
  peekOpen.value = false
}

function onTabsFocusOut(e) {
  // 焦点在根内转移（tab → peek 里的钮）不算离开
  if (e.relatedTarget && rootRef.value?.contains(e.relatedTarget)) return
  peekOpen.value = false
}

// ─── 交互 ───
function onTabSelect(id) {
  if (!id || id === props.modelValue) return
  emit('update:modelValue', id)
  emit('change', id)
}

function onCommand(id) {
  emit('command', id)
}

// ─── 条目渲染（h 函数：展开态与 peek 共用一条路径） ───
/** 命令状态唯一来源（G3 ③）；未注册一律视为不可用 */
function commandState(id) {
  return props.registry?.state?.(id, props.ctx) ?? { known: false, enabled: false, active: false }
}

/** select 宽度：schema 声明的数值（px）或 CSS 串，消费方数据不进门禁扫描 */
function selectStyle(width) {
  if (typeof width === 'number' && width > 0) return { width: `${width}px` }
  if (typeof width === 'string' && width) return { width }
  return undefined
}

function renderEntry(node, tier) {
  if (node.type === 'separator') {
    return h(EtDivider, {
      key: node.key,
      direction: 'vertical',
      length: tier === RIBBON_SCALE_TIERS.FULL ? 'large' : 'small',
    })
  }
  if (node.type === 'spacer') return h(EtToolSpacer, { key: node.key })
  if (node.type !== 'item' && node.type !== 'select') return null

  // 未注册的命令不渲染（悬空引用在 schema 期就该被发现，这里兜底不抛）
  const cmd = props.registry?.get(node.command)
  if (!cmd) return null
  const state = commandState(node.command)

  if (node.type === 'select') {
    return h(EtSelect, {
      key: node.key,
      class: 'et-ribbonbar__select',
      options: node.options ?? [],
      disabled: !state.enabled,
      style: selectStyle(node.width),
      'aria-label': cmd.title || undefined,
    })
  }

  // 形态只由 schema 声明定：grid.rowSpan=2 大钮 / SMALL 档后的小钮
  const large = node.grid?.rowSpan === 2 && node.size !== 'small'
  return h(EtToolButton, {
    key: node.key,
    size: large ? 'large' : 'small',
    icon: cmd.icon ?? '',
    label: cmd.title ?? '',
    active: state.active,
    disabled: !state.enabled,
    caret: !!node.caret,
    // 富提示两形态都挂：caption 可见 ≠ 快捷键可见（大钮同样要知道 ⌘B）。
    // 有 desc 或有 keys 才挂——纯名称的提示是冗余税（minimal-copy：0 档不写）
    tip: cmd.desc || cmd.keys ? { title: cmd.title ?? '', desc: cmd.desc ?? '', combo: cmd.keys ?? '' } : null,
    onClick: () => emit('command', node.command),
  })
}

/** 组渲染（展开态与 peek 浮层同一路径）；档位来自 scaleGroup 的输出 */
function renderGroup(entry) {
  if (entry.tier === RIBBON_SCALE_TIERS.GROUP_DROPDOWN) {
    // 整组退化：一个下拉按钮（组名作标签，条目进菜单）——官方建议几乎每个组
    // 都声明到最小档，任意宽度可渲染；菜单由 EtOverflowMenu 承担
    return h(EtOverflowMenu, {
      key: entry.key,
      class: 'et-ribbonbar__groupmenu',
      groups: [scaleGroup(entry.node, RIBBON_SCALE_TIERS.GROUP_DROPDOWN)],
      registry: props.registry,
      ctx: props.ctx,
      label: entry.label || props.overflowLabel,
      onCommand,
    })
  }
  const scaled = scaleGroup(entry.node, entry.tier)
  return h(
    EtToolGroup,
    { key: entry.key, label: entry.label, 'data-et-ribbon-group': entry.key },
    () => (scaled.children ?? []).map((child) => renderEntry(child, entry.tier)),
  )
}

// ─── 溢出测量与规划 ───
function countEntries(group) {
  return (group.children ?? []).filter((node) => node.type === 'item' || node.type === 'select').length
}

/** 可用宽 = 容器内容盒（扣掉左右内边距；间距由 planGroupScaleTiers 的 gap 计入） */
function availableWidth(el) {
  const style = typeof getComputedStyle === 'function' ? getComputedStyle(el) : null
  const pad = style ? (parseFloat(style.paddingInlineStart) || 0) + (parseFloat(style.paddingInlineEnd) || 0) : 0
  return Math.max(0, (el.clientWidth || 0) - pad)
}

function readGap(el) {
  if (!el || typeof getComputedStyle !== 'function') return 0
  const value = parseFloat(getComputedStyle(el).columnGap)
  return Number.isFinite(value) ? value : 0
}

function samePlan(a, b) {
  if (a === b) return true
  if (!a || !b) return false
  if (a.fits !== b.fits) return false
  if (a.overflow.length !== b.overflow.length) return false
  if (a.overflow.some((key, i) => key !== b.overflow[i])) return false
  const keys = Object.keys(a.tiers)
  if (keys.length !== Object.keys(b.tiers).length) return false
  return keys.every((key) => a.tiers[key] === b.tiers[key])
}

/**
 * 测量 + 规划（窄容器降档 / 收进行尾「更多」）。
 *
 * FULL 档的组保持自然宽在 DOM 里，随时可重新实测（换文案、密度换档后不失真）；
 * 已降档 / 被收进的组用首过缓存宽（它们已不是 FULL 形态，量到了也不是 FULL 宽）。
 * 密度换档会改控件行实测高（布局指纹）：指纹一变，缓存宽全部作废，重走首过。
 */
function measure() {
  const body = bodyRef.value
  if (collapsedModel.value || !body) return

  const epoch = body.offsetHeight
  if (epoch !== measureEpoch) {
    measureEpoch = epoch
    fullWidths.clear()
    if (scalePlan.value !== null) {
      // 先按 FULL 重新渲染，一帧后复测（否则量到的是旧档位的宽）
      scalePlan.value = null
      nextTick(measure)
      return
    }
  }

  const plan = scalePlan.value
  for (const group of activeGroups.value) {
    const tier = plan ? (plan.tiers[group.key] ?? RIBBON_SCALE_TIERS.FULL) : RIBBON_SCALE_TIERS.FULL
    if (tier !== RIBBON_SCALE_TIERS.FULL || plan?.overflow.includes(group.key)) continue
    const el = body.querySelector(`[data-et-ribbon-group="${group.key}"]`)
    const width = el?.offsetWidth
    if (Number.isFinite(width)) fullWidths.set(group.key, width)
  }

  const next = planGroupScaleTiers(
    activeGroups.value.map((group) => ({
      key: group.key,
      width: fullWidths.get(group.key) ?? 0,
      items: countEntries(group),
    })),
    availableWidth(body),
    { gap: readGap(body), moreWidth: moreRef.value?.offsetWidth ?? 0 },
  )
  // 规划没变就不改状态：重渲染会改组排布，进而在观察器里绕圈
  if (!samePlan(plan, next)) scalePlan.value = next
}

// 条目文案 / 组结构变化都会改实测宽（等 DOM 落下后再量：新增条目要量得到它的宽）
const groupsSignature = computed(() =>
  activeGroups.value
    .map((group) => `${group.key}:${group.label ?? ''}:${(group.children ?? []).length}`)
    .join(';'),
)

watch(groupsSignature, async () => {
  await nextTick()
  measure()
})

// 展开时重新测量（折叠期间 body 不在 DOM 里，量不到）
watch(collapsedModel, async (value) => {
  peekOpen.value = false
  if (!value) {
    await nextTick()
    measure()
  }
})

// ─── 全局键盘（一个 document 级监听） ───
/** 真折叠快捷键：Ctrl+F1（含 macOS 的物理 Ctrl+F1）/ ⌥⌘R（Win 上 Ctrl+Alt+R） */
const COLLAPSE_COMBO = 'ctrl+f1'
const COLLAPSE_ALT_COMBO = 'mod+alt+r'
const platform = currentPlatform()

const rootRef = ref(null)
const bodyRef = ref(null)
const moreRef = ref(null)
let resizeObserver = null

onMounted(() => {
  restoreCollapsed()
  measure()
  // 容器宽度变化才重算（条目自身宽变化由上面的签名 watch 覆盖）。
  // typeof 守卫与底座组件一致：jsdom / SSR 没有 ResizeObserver，不代表浏览器没有
  if (typeof ResizeObserver === 'function' && rootRef.value) {
    resizeObserver = new ResizeObserver(() => measure())
    resizeObserver.observe(rootRef.value)
  }
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onGlobalKeydown)
})

// 快捷键与 Esc：紧邻注册处定义，组字守卫就近可查（G5）。
// 组字期一律放过：候选词上屏不是应用命令（上一代 28 处缺陷的根因）
function onGlobalKeydown(e) {
  if (isImeComposing(e)) return
  if (
    comboMatchesEvent(COLLAPSE_COMBO, e, platform) ||
    comboMatchesEvent(COLLAPSE_ALT_COMBO, e, platform)
  ) {
    e.preventDefault()
    setCollapsed(nextCollapsed(collapsedModel.value, 'toggle'))
    return
  }
  if (e.key === 'Escape' && peekOpen.value) peekOpen.value = false
}

/** 点击别处收起 peek（浮层内容自身在根内，不误伤；命令点击先于本监听生效） */
function onDocumentClick(e) {
  if (!peekOpen.value) return
  if (rootRef.value && !rootRef.value.contains(e.target)) peekOpen.value = false
}

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onGlobalKeydown)
})

defineExpose({ measure })
</script>

<style src="./style.css"></style>
