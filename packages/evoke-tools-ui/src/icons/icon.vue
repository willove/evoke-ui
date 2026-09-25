<template>
  <eb-icon
    :name="renderedName"
    :size="size"
    :color="color"
    v-bind="$attrs"
    class="et-icon"
  />
</template>

<script setup>
/**
 * EtIcon — 图标解析与兜底载体（内部件，tools-ui 计划 04 M0 交付物 1）
 *
 * 与直接用 EbIcon 的差别只有一个：未命中时不渲染空白。
 * 解析顺序（04 §四）：
 *   领域别名（③→②）→ builtin 同步命中 → builtin 未命中走注册表异步自愈
 *   （加载全量库再重试）→ 仍未命中共性兜底（question-circle + dev warn）
 */
import { computed, ref, watch } from 'vue'
import EbIcon from '@wil-works/evoke-business-ui/icon'
import { getIconByName, getIconByNameSync } from '@wil-works/evoke-business-ui'
import { resolveIconName, FALLBACK_ICON_NAME, isCustomIconName } from './resolve'

defineOptions({ name: 'EtIcon', inheritAttrs: false })

const props = defineProps({
  /** 图标名：第 ② 层组件语义名，或第 ③ 层领域名（已登记别名时） */
  name: { type: [String, Object], default: undefined },
  /** 图标盒尺寸档（04 §三：14/16/20/24/28） */
  size: { type: [String, Number], default: 16 },
  color: { type: String, default: undefined },
})

// 组件对象直通（消费方传 SFC 时保持既有用法）
const isComponentObject = computed(() => typeof props.name === 'object' && props.name !== null)

// 语义名（领域别名在此折叠掉）
const semanticName = computed(() => (isComponentObject.value ? props.name : resolveIconName(props.name)))

// 同步命中判定（builtin / custom / 已加载的全量库）
const syncHit = computed(() => {
  if (isComponentObject.value) return props.name
  if (!semanticName.value) return undefined
  return getIconByNameSync(semanticName.value)
})

const asyncHit = ref(undefined)
let asyncTriedFor = undefined

watch(
  [syncHit, semanticName],
  ([sync, semantic]) => {
    asyncHit.value = undefined
    if (sync || isComponentObject.value || !semantic) return
    if (isCustomIconName(semantic) && asyncTriedFor === semantic) return
    if (asyncTriedFor === semantic) return
    asyncTriedFor = semantic
    getIconByName(semantic)
      .then((comp) => {
        if (semanticName.value === semantic) asyncHit.value = comp ?? undefined
      })
      .catch(() => {})
  },
  { immediate: true },
)

// 最终交给 EbIcon 的名字：命中走原名；未命中才兜底（组件对象无兜底概念）
const renderedName = computed(() => {
  if (isComponentObject.value) return props.name
  if (!semanticName.value) return undefined
  if (syncHit.value) return semanticName.value
  if (asyncHit.value) return semanticName.value
  if (import.meta.env?.DEV) {
    console.warn(
      `[et-icon] 图标名未命中注册表，已回落兜底图标「${FALLBACK_ICON_NAME}」：${String(semanticName.value)}`,
    )
  }
  return FALLBACK_ICON_NAME
})
</script>
