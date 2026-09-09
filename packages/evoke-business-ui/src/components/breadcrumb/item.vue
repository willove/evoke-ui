<template>
  <span class="ev-breadcrumb__item ev-breadcrumb__item">
    <span
      class="ev-breadcrumb__inner"
      :class="{ 'is-link': !!to }"
      :role="to ? 'link' : undefined"
      @click="handleClick"
    >
      <slot />
    </span>
    <span v-if="!isLast" class="ev-breadcrumb__separator" role="presentation">
      <ev-icon v-if="separatorIcon" :name="separatorIcon" :size="12" />
      <template v-else>{{ separator }}</template>
    </span>
  </span>
</template>

<script setup>
/**
 * EvBreadcrumbItem — 面包屑项
 * separator / separator-icon 从父级 breadcrumb 注入；is-last 按同层兄弟节点判定
 */
import { inject, computed, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'
import EvIcon from '../icon/index.vue'

const props = defineProps({
  to: { type: [String, Object], default: '' },
  replace: { type: Boolean, default: false },
})

const separator = inject('breadcrumbSeparator', '/')
const separatorIcon = inject('breadcrumbSeparatorIcon', '')
const registry = inject('breadcrumbRegistry', null)
const router = inject('router', null)

const myUid = getCurrentInstance()?.uid
// 最后一项判定：注册表尾项即最后一项（挂载顺序 = DOM 顺序）
const isLast = computed(() => (registry ? registry[registry.length - 1] === myUid : true))

onMounted(() => {
  registry?.push(myUid)
})
onBeforeUnmount(() => {
  const i = registry?.indexOf(myUid)
  if (i !== -1) registry?.splice(i, 1)
})

function handleClick() {
  if (!props.to) return
  if (router) {
    props.replace ? router.replace(props.to) : router.push(props.to)
  } else if (typeof props.to === 'string' && /^https?:/.test(props.to)) {
    window.location.href = props.to
  }
}
</script>
