<script setup>
/**
 * EtSplitter ── 工具界面分隔面板容器（tools-ui 计划 05 §三；M0）
 *
 * 底座 EbSplitter 已具备面板注册 / 尺寸分摊 / min-max 夹角 / 拖拽 / 折叠 / resize 回传，
 * 本件只做两件事，不改底座既有语义：
 *   1. props / events / slots 透传（inheritAttrs:false + v-bind="$attrs"；
 *      resize 显式转发——声明式 emits 不进 $attrs，手动转签供消费方与测试两侧拿到）
 *   2. 挂 .et-splitter 作用域：拖拽条的工具度量（可视厚度 / 热区 / 把手）在 style.css
 *      以 .et-splitter 前缀覆盖底座 .eb-splitter__bar 实现（度量全部走 --et-splitter-* 令牌）
 *
 * 键盘调整尺寸：M0 不做——拖拽条的键盘 resize 属于 M2 面板树运行时的射程，
 * 由 M2 的面板树/停靠运行时在焦点漫游（L0）之上补充键盘 resize 键位与可视化。
 */
import EbSplitter from '@wil-works/evoke-business-ui/splitter'

defineOptions({ name: 'EtSplitter', inheritAttrs: false })

const emit = defineEmits(['resize'])
</script>

<template>
  <eb-splitter v-bind="$attrs" class="et-splitter" @resize="(sizes) => emit('resize', sizes)">
    <template v-for="(_, SlotName) in $slots" #[SlotName]="slotProps">
      <slot :name="SlotName" v-bind="slotProps || {}" />
    </template>
  </eb-splitter>
</template>

<style src="./style.css"></style>
