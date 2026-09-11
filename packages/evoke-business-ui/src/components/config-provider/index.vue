<template>
  <slot />
</template>

<script setup>
/**
 * EbConfigProvider — 全局配置（size / locale / namespace / platform / themeColor / density）
 * provide configProviderContextKey，子组件经 useConfigProvider/usePlatform 消费
 */
import { provide, toRef, watchEffect, onUnmounted } from 'vue'
import { configProviderContextKey } from '../../composables/useConfigProvider'
import {
  setPrimaryColor,
  setSemanticColors,
  setDensity,
  setGlass,
  resetTheme,
  loadThemeConfig,
  saveThemeConfig,
} from '../../utils/theme'

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
  /** 全局密度：compact / default / loose（作用于 html[data-eb-density]） */
  density: { type: String, default: undefined },
  /** 权限码表：v-permission 指令 / EbAuth 组件 / usePermission 的判定来源 */
  permissions: { type: Array, default: undefined },
  /** 全局磨砂：开启后容器类组件（card/section-card/dialog/drawer…）默认玻璃质感，组件级 glass prop 可单独覆盖 */
  glass: { type: Boolean, default: false },
  /** 运行时语义色（{ success, warning, danger, info } 十六进制），梯度随主色规则自动生成 */
  semantic: { type: Object, default: undefined },
  /** 持久化主题（localStorage）：挂载时若有存档则优先生效，变更时自动保存 */
  persistTheme: { type: Boolean, default: false },
})

provide(configProviderContextKey, {
  size: toRef(props, 'size'),
  locale: toRef(props, 'locale'),
  namespace: toRef(props, 'namespace'),
  zIndex: toRef(props, 'zIndex'),
  platform: toRef(props, 'platform'),
  permissions: toRef(props, 'permissions'),
})

// 主题注入作用于 documentElement（全局语义）；卸载时移除注入令牌回到样式表默认
// persistTheme 开启时：挂载即应用持久化存档（用户上次选择优先于声明式 prop），变更自动保存
const savedTheme = props.persistTheme ? loadThemeConfig() : null
watchEffect(() => {
  const primary = savedTheme?.primary || props.themeColor
  if (primary) setPrimaryColor(primary)
})
watchEffect(() => {
  const semantic = savedTheme?.semantic || props.semantic
  if (semantic) setSemanticColors(semantic)
})
watchEffect(() => {
  if (props.density) setDensity(props.density)
})
watchEffect(() => {
  setGlass(props.glass)
})
watchEffect(() => {
  if (props.persistTheme && (props.themeColor || props.semantic)) {
    saveThemeConfig({ primary: props.themeColor, semantic: props.semantic })
  }
})
onUnmounted(() => {
  resetTheme()
  if (props.density) setDensity('default')
  setGlass(false)
})
</script>
