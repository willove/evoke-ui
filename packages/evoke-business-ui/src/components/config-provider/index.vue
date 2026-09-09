<template>
  <slot />
</template>

<script setup>
/**
 * EvConfigProvider — 全局配置（size / locale / namespace / platform / themeColor / density）
 * provide configProviderContextKey，子组件经 useConfigProvider/usePlatform 消费
 */
import { provide, toRef, watchEffect, onUnmounted } from 'vue'
import { configProviderContextKey } from '../../composables/useConfigProvider'
import { setPrimaryColor, setDensity } from '../../utils/theme'

const props = defineProps({
  /** 全局尺寸 */
  size: { type: String, default: 'default' },
  /** 语言包对象（zhCN / en / ja / zhTW，见 locale/） */
  locale: { type: Object, default: undefined },
  /** 类名前缀（保留扩展位，默认 ev） */
  namespace: { type: String, default: 'ev' },
  /** z-index 基准（保留扩展位） */
  zIndex: { type: Number, default: 2000 },
  /** 容器环境：auto（自动探测）/ desktop / mobile——移动端下 Select、DatePicker 等呈现底部弹出形态 */
  platform: { type: String, default: 'auto' },
  /** 运行时主色（十六进制），注入后全库 7 档梯度与图表色板自动跟随 */
  themeColor: { type: String, default: undefined },
  /** 全局密度：compact / default / loose（作用于 html[data-ev-density]） */
  density: { type: String, default: undefined },
  /** 权限码表：v-permission 指令 / EvAuth 组件 / usePermission 的判定来源 */
  permissions: { type: Array, default: undefined },
})

provide(configProviderContextKey, {
  size: toRef(props, 'size'),
  locale: toRef(props, 'locale'),
  namespace: toRef(props, 'namespace'),
  zIndex: toRef(props, 'zIndex'),
  platform: toRef(props, 'platform'),
  permissions: toRef(props, 'permissions'),
})

// 主题注入作用于 documentElement（全局语义）；卸载时恢复默认
watchEffect(() => {
  if (props.themeColor) setPrimaryColor(props.themeColor)
})
watchEffect(() => {
  if (props.density) setDensity(props.density)
})
onUnmounted(() => {
  if (props.themeColor) setPrimaryColor('#175DFF')
  if (props.density) setDensity('default')
})
</script>
