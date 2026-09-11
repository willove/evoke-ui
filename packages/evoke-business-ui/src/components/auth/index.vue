<template>
  <slot v-if="allowed" />
  <slot v-else name="fallback" />
</template>

<script setup>
/**
 * EbAuth — 权限容器
 *
 * <eb-auth has="sys:user:delete">…</eb-auth>
 * <eb-auth :has="['a','b']">任一满足</eb-auth>
 * <eb-auth :has="(perms) => perms.length > 0" ><template #fallback>无权限提示</template></eb-auth>
 * 权限来源：ConfigProvider permissions > setPermissions()
 */
import { computed } from 'vue'
import { usePermission } from '../../composables/usePermission'

defineOptions({ name: 'EbAuth' })

const props = defineProps({
  /** 权限要求：string / string[]（任一）/ (permissions) => boolean */
  has: { type: [String, Array, Function], default: null },
})

const { has } = usePermission()
const allowed = computed(() => has(props.has))
</script>
