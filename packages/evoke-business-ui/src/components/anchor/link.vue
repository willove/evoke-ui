<template>
  <a
    class="ev-anchor-link"
    :class="{ 'is-active': active }"
    :href="href"
    :title="title"
    @click="onClick"
  >
    <span class="ev-anchor-link__title">{{ title }}</span>
  </a>
</template>

<script setup>
/**
 * EvAnchorLink — 锚点链接（EvAnchor 子项）
 * href 指向页面内区块选择器（#id）；title 为展示文案
 */
import { computed, inject, onBeforeUnmount, onMounted } from 'vue'
import { ANCHOR_KEY } from './context'

defineOptions({ name: 'EvAnchorLink' })

const props = defineProps({
  /** 目标区块选择器（#id） */
  href: { type: String, required: true },
  /** 展示标题 */
  title: { type: String, default: '' },
})

const anchor = inject(ANCHOR_KEY, null)
if (anchor) {
  onMounted(() => anchor.register({ href: props.href, title: props.title }))
  onBeforeUnmount(() => anchor.unregister(props.href))
}

const active = computed(() => anchor?.currentHref?.value === props.href)

function onClick(e) {
  anchor?.handleClick(e, props.href)
}
</script>
