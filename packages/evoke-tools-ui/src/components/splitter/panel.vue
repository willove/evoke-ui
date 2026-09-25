<script setup>
/**
 * EtSplitterPanel ── 工具界面分隔面板子件（tools-ui 计划 05 §三；M0）
 *
 * 底座 EbSplitterPanel inject 父级 EbSplitter 上下文，自渲染面板内容与拖拽条；
 * size / defaultSize / min / max / resizable / collapsible 全部透传。
 * 拖拽条的工具度量由同目录 style.css 以 .et-splitter 容器作用域覆盖（与 EtSplitter 复用同一文件）。
 *
 * 键盘调整尺寸：M0 不做（同 EtSplitter），由 M2 面板树运行时补充键盘 resize。
 */
import EbSplitterPanel from '@wil-works/evoke-business-ui/splitter-panel'

defineOptions({ name: 'EtSplitterPanel', inheritAttrs: false })
</script>

<template>
  <eb-splitter-panel v-bind="$attrs">
    <template v-for="(_, SlotName) in $slots" #[SlotName]="slotProps">
      <slot :name="SlotName" v-bind="slotProps || {}" />
    </template>
  </eb-splitter-panel>
</template>

<style src="./style.css"></style>
