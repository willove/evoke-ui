<template>
  <slot v-if="allowed" />
  <slot v-else name="fallback" />
</template>

<script setup>
/**
 * EvAuth — 权限容器
 *
 * <ev-auth has="sys:user:delete">…</ev-auth>
 * <ev-auth :has="['a','b']">任一满足</ev-auth>
 * <ev-auth :has="(perms) => perms.length > 0" ><template #fallback>无权限提示</template></ev-auth>
 * 权限来源：ConfigProvider permissions > setPermissions()
 */
import { computed } from 'vue'
import { usePermission } from '../../composables/usePermission'

defineOptions({ name: 'EvAuth' })

const props = defineProps({
  /** 权限要求：string / string[]（任一）/ (permissions) => boolean */
  has: { type: [String, Array, Function], default: null },
})

const { has } = usePermission()
const allowed = computed(() => has(props.has))
</script>
