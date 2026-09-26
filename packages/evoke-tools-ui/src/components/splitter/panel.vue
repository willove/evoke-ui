<script setup>
/**
 * EtSplitterPanel ── 工具界面分隔面板子件（tools-ui 计划 05 §三；M0）
 *
 * 底座 EbSplitterPanel inject 父级 EbSplitter 上下文，自渲染面板内容与拖拽条；
 * size / defaultSize / min / max / resizable / collapsible 全部透传。
 * 拖拽条的工具度量由同目录 style.css 以 .et-splitter 容器作用域覆盖（与 EtSplitter 复用同一文件）。
 *
 * 键盘调整尺寸：底座拖拽条即 separator（方向键 / Home / End，Q 夹角与拖拽一致）；
 * keyboardStep prop 透传（默认 8px）。1.2.0 补齐 M0 计划的欠账项。
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
