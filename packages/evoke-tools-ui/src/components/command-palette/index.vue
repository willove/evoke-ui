<template>
  <eb-command-palette
    ref="baseRef"
    :model-value="modelValue"
    :commands="items"
    :placeholder="placeholder"
    @update:model-value="onModelValue"
  >
    <!-- 底座默认子内容即触发器（#trigger）；底座当前版本不渲染该槽，
         仍原样透传，供消费方放触发内容，并在底座支持时直接生效 -->
    <slot />
  </eb-command-palette>
</template>

<script setup>
/**
 * EtCommandPalette — 命令面板适配器（tools-ui 计划 05 §三 / 07 M1 交付物 4）
 *
 * 包装 EbCommandPalette，把底座的 commands prop 换成**命令表驱动**：
 *   ① 数据源 = 命令注册表（含 title/desc/group/keywords + 快捷键列）；
 *   ② 快捷键列：cmd.keys 经 runtime/keys 的平台符号化渲染（⌘/Ctrl）；
 *   ③ 最近使用：recentKey 非空时按 localStorage 的最近 5 条置顶。
 *
 * 三条铁律（G3）：命令状态只从 registry.state 读；禁用命令**不过滤**（用户要
 * 看见为什么不可用）——item 标 disabled 且 action 返回 false，面板保持打开（底座
 * 契约：action() !== false 才关闭）；命令 id 一律运行时数据，不写死字面量。
 */
import { computed, ref, watch } from 'vue'
import EbCommandPalette from '@wil-works/evoke-business-ui/command-palette'
import { currentPlatform, formatCombo } from '../../runtime/keys/keys'

defineOptions({ name: 'EtCommandPalette' })

const props = defineProps({
  registry: { type: Object, required: true },
  modelValue: { type: Boolean, default: false },
  ctx: { type: Object, default: () => ({}) },
  // 默认透传底座（不传 = 底座自带占位符；defineProps 无默认即为 undefined，Vue 不下发该 prop）
  placeholder: { type: String },
  // '' = 不记最近使用；非空时以此键在 localStorage 存最近 5 个命令 id
  recentKey: { type: String, default: '' },
  // 开面板的快捷键：仅作声明 / 供消费方读取与展示；全局绑定由消费方决定
  hotkey: { type: String, default: 'mod+k' },
  /**
   * 选中条目时的执行体归属（两种模式，默认走「声明式一致」）：
   *   false（默认）—— 只 emit('command', id) 后返回 undefined 让底座关闭面板；是否执行、
   *     如何执行完全由消费方接到 @command 后自行调 registry.run 决定。与 EtRibbonBar 的
   *     @command / EtContextMenu 的 @command 约定一致（执行体归消费方），避免同一命令在两处
   *     「一处自动跑、一处要自己跑」的分裂。
   *   true —— 「快速自足」便捷模式：先 registry.run(id, ctx) 再 emit('command', id)，
   *     适合一次性演示 / 无集中命令总线的场景。两种模式下禁用命令都只保持面板打开、不 emit。
   */
  runOnSelect: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'command'])

const baseRef = ref(null)
// registry.list() 与 localStorage 均非响应式：打开 / 执行后各 bump 一次强制 items 重算
const revision = ref(0)

const RECENT_LIMIT = 5

function storageKey() {
  return `et-palette-recent:${props.recentKey}`
}

function readRecent() {
  if (!props.recentKey || typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey())
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

function writeRecent(id) {
  if (!props.recentKey || typeof localStorage === 'undefined') return
  try {
    const next = [id, ...readRecent().filter((x) => x !== id)].slice(0, RECENT_LIMIT)
    localStorage.setItem(storageKey(), JSON.stringify(next))
  } catch {
    // 隐私模式 / 配额满：最近使用降级为不记录，不影响主流程
  }
}

// 命中的置顶（组内相邻合并由底座 grouped 完成，此处不做分组算法）
function reorderByRecent(list) {
  if (!props.recentKey) return list
  const recent = readRecent()
  if (!recent.length) return list
  const rank = new Map(recent.map((id, i) => [id, i]))
  return [...list].sort((a, b) => {
    const ra = rank.has(a.id) ? rank.get(a.id) : Number.MAX_SAFE_INTEGER
    const rb = rank.has(b.id) ? rank.get(b.id) : Number.MAX_SAFE_INTEGER
    return ra - rb
  })
}

const items = computed(() => {
  void revision.value // 建立依赖：打开 / 执行后重算，取最新状态与最近使用序
  const mapped = props.registry.list().map((cmd) => {
    const disabled = !props.registry.state(cmd.id, props.ctx).enabled
    const hotkey = cmd.keys ? formatCombo(cmd.keys, currentPlatform()) : ''
    return {
      id: cmd.id,
      label: cmd.title ?? cmd.id,
      hint: cmd.desc ?? '',
      hotkey,
      group: cmd.group ?? '通用',
      disabled,
      icon: cmd.icon ?? '',
      keywords: [cmd.title, cmd.desc, cmd.group, cmd.id].filter(Boolean),
      action: () => {
        // 禁用 / 未注册命令：保持面板打开、不执行、不 emit、不记最近使用（读取即时 state，兼容 ctx 变化）
        if (!props.registry.state(cmd.id, props.ctx).enabled) return false
        // runOnSelect=true 时先执行（便捷模式）；默认模式把执行体留给消费方的 @command
        if (props.runOnSelect) props.registry.run(cmd.id, props.ctx)
        // 最近使用按「选中」记录，与是否自动执行无关
        writeRecent(cmd.id)
        emit('command', cmd.id)
        revision.value++
        // 返回 undefined（非 false）→ 底座关闭面板
      },
    }
  })
  return reorderByRecent(mapped)
})

function onModelValue(value) {
  emit('update:modelValue', value)
}

// 打开时刷新一次（拿最新 enabled 与最近使用序）
watch(
  () => props.modelValue,
  (open) => {
    if (open) revision.value++
  },
)

defineExpose({
  open: () => baseRef.value?.open(),
  close: () => baseRef.value?.close(),
})
</script>

<style src="./style.css"></style>
