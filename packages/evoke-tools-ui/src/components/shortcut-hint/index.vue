<template>
  <span v-if="show" class="et-shortcuthint">
    <span v-if="label" class="et-shortcuthint__label">{{ label }}</span>
    <et-key-hint :combo="keys" :platform="platform" />
  </span>
</template>

<script setup>
/**
 * EtShortcutHint — 助记键内联提示（M1 交付物 6）
 *
 * 用途：工具区尾部 / ScreenTip 说明行 / 设置项旁边——一个键位 + 可选标签。
 * keys 为空且 label 为空时整体不渲染（不留空DOM）；平台符号化走 EtKeyHint。
 */
import { computed } from 'vue'
import EtKeyHint from '../key-hint/index.vue'

defineOptions({ name: 'EtShortcutHint' })

const props = defineProps({
  /** 规范组合键串（'mod+b'；空串不渲染键帽） */
  keys: { type: String, default: '' },
  /** 可选标签（命令名；为空时只有键帽） */
  label: { type: String, default: '' },
  platform: {
    type: String,
    default: 'auto',
    validator: (v) => ['auto', 'mac', 'win'].includes(v),
  },
})

const show = computed(() => !!props.keys || !!props.label)
</script>

<style src="./style.css"></style>
