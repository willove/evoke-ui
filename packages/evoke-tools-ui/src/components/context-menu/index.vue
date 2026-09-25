<template>
  <eb-context-menu
    ref="baseRef"
    :items="items"
    :disabled="disabled"
    @command="onCommand"
    @visible-change="onVisibleChange"
  >
    <slot />
  </eb-context-menu>
</template>

<script setup>
/**
 * EtContextMenu — 右键菜单包装（tools-ui 计划 05 §三 / 07 M1 交付物 5）
 *
 * 包装 EbContextMenu，在底座 items 配置之上补三件产品级能力：
 *   ① 分区：schema 的 separator 节点映射为底座的 divided——读底座 item.divided 语义
 *      （分隔线画在**该项自身**上方：margin-top + border-top）后，择「把 divider 落在
 *      紧随的下一项 divided 上」这一形态，不本地画独立分隔行；前导 / 连续分隔折叠；
 *   ② 子菜单：schema 的 submenu 节点递归映射为底座的 children；
 *   ③ 状态与工具区同源：item.disabled = !registry.state(command, ctx).enabled
 *      （G3：enabled/active 只有 registry.state 一处实现，菜单不本地推演）。
 *
 * 键盘漫游（底座只有 document 级 Esc，此处补齐其余键）：打开后把焦点接入浮层根，
 * 方向键 / Home / End 移动激活项（跳过禁用）、Enter/Space 执行、ArrowRight 进子菜单、
 * ArrowLeft 回退；执行 / 关闭后焦点归还触发器。Esc 收敛由底座负责，本包装不重复监听，
 * 避免双关；document 级 keydown 必过 isImeComposing 守卫（G5）。
 */
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import EbContextMenu from '@wil-works/evoke-business-ui/context-menu'
import { isImeComposing } from '@wil-works/evoke-business-ui'

defineOptions({ name: 'EtContextMenu' })

const props = defineProps({
  registry: { type: Object, required: true },
  // 菜单节点：item 绑命令 id；separator；submenu 带 label + 递归的 children
  schema: { type: Array, default: () => [] },
  ctx: { type: Object, default: () => ({}) },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['command', 'visible-change'])

const baseRef = ref(null)

// ─── schema → 底座 items（状态单点来自 registry.state）──
const items = computed(() => buildItems(props.schema))

function buildItems(nodes) {
  const out = []
  // 分隔线落在紧随其后的那一项上方（底座 divided 语义）；只在该项不是首项时生效
  let pendingDivider = false
  for (const node of nodes ?? []) {
    if (!node) continue
    if (node.type === 'separator') {
      if (out.length > 0) pendingDivider = true
      continue
    }
    if (node.type === 'submenu') {
      out.push({
        label: node.label ?? '',
        icon: node.icon ?? '',
        divided: pendingDivider,
        children: buildItems(node.children),
      })
      pendingDivider = false
      continue
    }
    // item：enabled 判定只从 registry.state 读，与工具区同一来源 / 同一函数（G3 同源）
    const cmd = props.registry.get(node.command)
    out.push({
      label: cmd?.title ?? node.command,
      icon: node.icon ?? cmd?.icon ?? '',
      command: node.command,
      disabled: !props.registry.state(node.command, props.ctx).enabled,
      divided: pendingDivider,
    })
    pendingDivider = false
  }
  return out
}

function onCommand(command) {
  emit('command', command)
}

// ─── 焦点管理 + 键盘漫游浮层辅助 ───
let lastActiveElement = null
let keysBound = false
// 子菜单由底座 hover 延时（OPEN_DELAY=120）打开；键盘唤出后按相近节拍聚焦首个子项
const SUBMENU_OPEN_DELAY = 140

function floatingRoot() {
  return document.querySelector('.eb-context-menu__popper')
}

// 当前焦点所在的那一层菜单（主浮层或子菜单）的可漫游项：跳过禁用项
function currentMenuItems() {
  const menu = document.activeElement?.closest?.('.eb-context-menu__popper, .eb-context-menu__submenu')
  if (!menu) return []
  return Array.from(menu.querySelectorAll('.eb-context-menu__item:not(.is-disabled)'))
}

function restoreFocus() {
  const el = lastActiveElement
  lastActiveElement = null
  if (el && el.isConnected && typeof el.focus === 'function') el.focus()
}

function openSubmenu(activeEl) {
  if (activeEl?.getAttribute?.('aria-haspopup') !== 'menu') return
  // 触发底座 hover 打开逻辑（底座无键盘唤出子菜单的 API）
  activeEl.dispatchEvent(new MouseEvent('mouseenter'))
  setTimeout(() => {
    document
      .querySelector('.eb-context-menu__submenu')
      ?.querySelector('.eb-context-menu__item:not(.is-disabled)')
      ?.focus()
  }, SUBMENU_OPEN_DELAY)
}

function closeSubmenu(activeEl) {
  if (!activeEl?.closest?.('.eb-context-menu__submenu')) return
  const parentItem = document.querySelector('.eb-context-menu__popper > .eb-context-menu__item.is-open')
  ;(parentItem ?? floatingRoot())?.focus()
}

async function onVisibleChange(open) {
  emit('visible-change', open)
  if (open) {
    lastActiveElement = document.activeElement
    await nextTick()
    const root = floatingRoot()
    if (root) {
      if (!root.hasAttribute('tabindex')) root.setAttribute('tabindex', '-1')
      root.focus()
    }
    bindKeys()
  } else {
    unbindKeys()
    restoreFocus()
  }
}

function bindKeys() {
  if (keysBound) return
  keysBound = true
  document.addEventListener('keydown', onDocKeydown)
}

function onDocKeydown(e) {
  // 组字期禁漫游（G5）：候选词上屏不应顺带移动菜单焦点
  if (isImeComposing(e)) return
  const menuItems = currentMenuItems()
  if (!menuItems.length) return
  const activeEl = document.activeElement
  const idx = menuItems.indexOf(activeEl)
  const focusAt = (i) => menuItems[i]?.focus()
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      focusAt(idx < 0 ? 0 : (idx + 1) % menuItems.length)
      break
    case 'ArrowUp':
      e.preventDefault()
      focusAt(idx < 0 ? menuItems.length - 1 : (idx - 1 + menuItems.length) % menuItems.length)
      break
    case 'Home':
      e.preventDefault()
      focusAt(0)
      break
    case 'End':
      e.preventDefault()
      focusAt(menuItems.length - 1)
      break
    case 'Enter':
    case ' ':
      if (idx >= 0) {
        e.preventDefault()
        menuItems[idx].click()
      }
      break
    case 'ArrowRight':
      openSubmenu(activeEl)
      break
    case 'ArrowLeft':
      closeSubmenu(activeEl)
      break
    default:
      // Escape 收敛交给底座 document 级监听，本处不重复实现（避免双关）
      break
  }
}

function unbindKeys() {
  if (!keysBound) return
  keysBound = false
  document.removeEventListener('keydown', onDocKeydown)
}

onBeforeUnmount(() => {
  unbindKeys()
})

defineExpose({
  open: (target, override) => baseRef.value?.open(target, override),
  close: () => baseRef.value?.close(),
})
</script>

<style src="./style.css"></style>
