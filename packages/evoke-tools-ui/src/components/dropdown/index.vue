<template>
  <eb-dropdown
    ref="baseRef"
    v-bind="$attrs"
    class="et-dropdown"
    @visible-change="(v) => emit('visible-change', v)"
    @command="(c) => emit('command', c)"
    @click="(e) => emit('click', e)"
  >
    <template v-for="(_, SlotName) in $slots" #[SlotName]="slotProps">
      <slot :name="SlotName" v-bind="slotProps || {}" />
    </template>
  </eb-dropdown>
</template>

<script setup>
/**
 * EtDropdown — 工具界面下拉（tools-ui 计划 05 §三；business-ui 同名件的密度适配包装）
 *
 * 底座 EbDropdown 已具备完整下拉语义（hover/click/contextmenu 触发、split-button、
 * 键盘 roving focus、命令冒泡），本件只做两件产品级改造，不改底座既有语义：
 *   1. props/events/slots 全透传（inheritAttrs:false + v-bind="$attrs"；
 *      visible-change / command / click 显式转发——声明式 emits 不会进 $attrs，
 *      故逐一手动转签，保证真实消费方与测试 wrapper.emitted 两侧都拿到）
 *   2. 菜单应用工具密度：条目高 / 图标位 / 圆角 / 内边距走 --et-menu-* 令牌
 *
 * 底座经 defineExpose 暴露 open / close / visible（无 hideOnClick）；本件转发命令式
 * open / close（visible 状态由 visible-change 事件即可观测），保持"包装"而非"重实现"。
 *
 * 密度菜单为何落在全局底座浮层类上：EbDropdown 的浮层经 <Teleport to="body"> 渲染，
 * 且 popper 容器类是固定的、不接受 popper-class 注入——`.et-dropdown` 作用域选不到
 * body 下的浮层。故 --et-menu-* 覆盖写在 .eb-dropdown__popper 上（见 style.css），
 * 这与计划 05 §二「密度适配由容器负责、不改组件内部」的口径一致。
 */
import { ref } from 'vue'
import EbDropdown from '@wil-works/evoke-business-ui/dropdown'

defineOptions({ name: 'EtDropdown', inheritAttrs: false })

const emit = defineEmits(['visible-change', 'command', 'click'])

const baseRef = ref(null)
// 转发底座命令式方法（读底座源码：defineExpose({ open, close, visible })）
defineExpose({
  open: (...args) => baseRef.value?.open?.(...args),
  close: (...args) => baseRef.value?.close?.(...args),
})
</script>

<style src="./style.css"></style>
