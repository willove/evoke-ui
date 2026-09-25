<template>
  <kbd class="et-keyhint" :class="`et-keyhint--${platform}`">
    <span class="et-keyhint__text">{{ text }}</span>
  </kbd>
</template>

<script setup>
/**
 * EtKeyHint — 快捷键文本（tools-ui 计划 05 §四，M0 原子件）
 *
 * 平台符号化：macOS ⌘ / ⌃ / ⌥ / ⇧，Windows Ctrl / Alt / Shift —— 平台识别后
 * 渲染，不硬编码字符（计划 04 §三 硬规则的同源要求）。
 */
import { computed } from 'vue'
import { formatCombo, currentPlatform } from '../../runtime/keys/keys'

defineOptions({ name: 'EtKeyHint' })

const props = defineProps({
  /** 规范组合键串：'mod+shift+z'（未规范化也接受，构造期即校验键名合法性） */
  combo: { type: String, default: '' },
  /** 平台：'auto' 走运行时识别；测试与文档可钉死 'mac' / 'win' */
  platform: {
    type: String,
    default: 'auto',
    validator: (v) => ['auto', 'mac', 'win'].includes(v),
  },
})

const platform = computed(() => (props.platform === 'auto' ? currentPlatform() : props.platform))
const text = computed(() => (props.combo ? formatCombo(props.combo, platform.value) : ''))

defineExpose({ text })
</script>

<style src="./style.css"></style>
