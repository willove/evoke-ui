<template>
  <!--
    浮层基座是 EbDropdown：#trigger = 触发内容（入口小钮 + 计数角标），
    #dropdown = 浮层里的菜单（默认子内容会被直接渲进根节点、不弹层，不能放错）。
  -->
  <eb-dropdown
    class="et-overflow et-overflow"
    trigger="click"
    placement="bottom-end"
    @command="onMenuCommand"
  >
    <template #trigger>
      <span class="et-overflow__entry">
        <et-tool-button size="small" icon="more" :label="label" />
        <!-- 计数角标：收起的条目数。藏 = 不占视野，不是不可达（可发现性兜底） -->
        <span v-if="count > 0" class="et-overflow__badge" aria-hidden="true">{{ count }}</span>
      </span>
    </template>

    <template #dropdown>
      <eb-dropdown-menu class="et-overflow__menu">
        <template v-for="group in menuGroups" :key="group.key">
          <!-- 组名做分组标题（保留组结构：收起的条目与展开态状态一致） -->
          <li v-if="group.label" class="et-overflow__title">{{ group.label }}</li>
          <eb-dropdown-item
            v-for="node in entriesOf(group)"
            :key="node.key"
            :command="node.command"
            :icon="iconOf(node)"
            :disabled="isDisabled(node)"
          >
            <span class="et-overflow__label">{{ titleOf(node) }}</span>
            <et-key-hint v-if="comboOf(node)" class="et-overflow__combo" :combo="comboOf(node)" />
          </eb-dropdown-item>
        </template>
      </eb-dropdown-menu>
    </template>
  </eb-dropdown>
</template>

<script setup>
/**
 * EtOverflowMenu — 溢出容器（tools-ui 计划 05 §四 L2，内部件：src/index.js 同文件导出）
 *
 * 两种被收进的组在这里按组分区呈现：宽度不足整组进「更多」（RibbonBar 行尾）、
 * 分量降级整组变下拉（GROUP_DROPDOWN）。共用一个呈现路径：
 *   · 入口 = 小钮（icon=more，label 可配）+ 计数角标（收起条目数）；
 *   · 菜单按组分区：组名做分组标题，条目 = 命令按钮行（名称 + 快捷键提示 +
 *     禁用态），disabled 来自 registry.state（G3 ③：状态只有一处实现）；
 *   · 点击条目 emit command(id)：跑不跑由消费方决定（registry.run）。
 *
 * 未注册的命令不进菜单（与展开态一致：悬空引用在 schema 期就该被发现）。
 */
import { computed } from 'vue'
import EbDropdown from '@wil-works/evoke-business-ui/dropdown'
import EbDropdownItem from '@wil-works/evoke-business-ui/dropdown-item'
import EbDropdownMenu from '@wil-works/evoke-business-ui/dropdown-menu'
import EtKeyHint from '../key-hint/index.vue'
import EtToolButton from '../tool-button/index.vue'

defineOptions({ name: 'EtOverflowMenu' })

const props = defineProps({
  /** 被收进的组节点（children 已按档位处理过；菜单只取 item/select 两类） */
  groups: { type: Array, default: () => [] },
  /** 命令注册表：名称 / 图标 / 快捷键 / 禁用态的唯一来源 */
  registry: { type: Object, default: null },
  /** 选区/焦点上下文（喂给 registry.state） */
  ctx: { type: Object, default: () => ({}) },
  /** 入口文案 */
  label: { type: String, default: '更多' },
})

const emit = defineEmits(['command'])

/** 组内可成菜单行的节点：item / select；未注册的命令过滤掉（与展开态一致） */
function entriesOf(group) {
  return (group.children ?? [])
    .filter((node) => node.type === 'item' || node.type === 'select')
    .filter((node) => !props.registry || props.registry.has(node.command))
}

const menuGroups = computed(() => (props.groups ?? []).filter((group) => entriesOf(group).length > 0))

/** 收起的条目数（角标） */
const count = computed(() => menuGroups.value.reduce((total, group) => total + entriesOf(group).length, 0))

function commandOf(node) {
  return props.registry?.get(node.command) ?? null
}

function iconOf(node) {
  return commandOf(node)?.icon ?? ''
}

function titleOf(node) {
  return commandOf(node)?.title ?? node.command
}

function comboOf(node) {
  return commandOf(node)?.keys ?? ''
}

function isDisabled(node) {
  return !(props.registry?.state?.(node.command, props.ctx)?.enabled ?? false)
}

function onMenuCommand(id) {
  emit('command', id)
}
</script>

<style src="./style.css"></style>