/**
 * useThemeConfig — 全站主题配置（响应式）
 *
 * 管理 主色/圆角/间距/容器宽 四类可调风格，写入 documentElement 的 --ev-* 令牌，
 * 全库组件全部经令牌取值，因此即时生效、明暗两套自动兼容。
 *
 * Usage:
 *   const { config, setPrimary, setRadius, setSpace, setContainer, reset } = useThemeConfig()
 *   setPrimary('#7C5CFC')           // 淡色阶自动生成（light-3…9 / dark-2 / rgb 游标）
 *   setRadius('round')              // 'sharp' | 'soft' | 'default' | 'round'
 *   setSpace('loose')               // 'compact' | 'default' | 'loose'
 *   setContainer('wide')            // 'narrow' | 'default' | 'wide' | 'full'
 */
import { reactive } from 'vue'
import { resolveThemeVars, EV_STYLE_PRESETS } from '../presets'

const DEFAULT_CONFIG = {
  primary: '',
  semantic: null,
  radius: 'default',
  space: 'default',
  container: 'default',
  glass: false,
}

const config = reactive({ ...DEFAULT_CONFIG })

function apply() {
  if (typeof document === 'undefined') return
  const style = document.documentElement.style
  const vars = resolveThemeVars(config)
  for (const [name, value] of Object.entries(vars)) style.setProperty(name, value)
}

/** 清除已写入的主题令牌（回到 variables.css 默认值） */
function clearApplied() {
  if (typeof document === 'undefined') return
  const style = document.documentElement.style
  const probe = {
    primary: '#000000',
    semantic: { success: '#000000', warning: '#000000', danger: '#000000', info: '#000000' },
    radius: 'default', space: 'default', container: 'default',
  }
  for (const name of Object.keys(resolveThemeVars(probe))) {
    style.removeProperty(name)
  }
}

export function useThemeConfig() {
  function setPrimary(primary) {
    config.primary = primary || ''
    if (!config.primary) {
      style_removePrimary()
      return
    }
    apply()
  }

  function style_removePrimary() {
    if (typeof document === 'undefined') return
    const style = document.documentElement.style
    for (const name of [
      '--ev-color-primary', '--ev-color-primary-light-3', '--ev-color-primary-light-5',
      '--ev-color-primary-light-7', '--ev-color-primary-light-8', '--ev-color-primary-light-9',
      '--ev-color-primary-dark-2', '--ev-color-primary-rgb',
    ]) style.removeProperty(name)
  }

  /**
   * 整套语义色联动（success/warning/danger/info），各生成一整条淡色阶；
   * 传 null 清除、回到 variables.css 默认值
   */
  function setSemantic(semantic) {
    config.semantic = semantic || null
    if (!config.semantic) {
      const style = document.documentElement.style
      if (typeof document !== 'undefined') {
        for (const name of ['success', 'warning', 'danger', 'info']) {
          for (const suffix of ['', '-light-3', '-light-5', '-light-7', '-light-8', '-light-9', '-dark-2', '-rgb']) {
            style.removeProperty(`--ev-color-${name}${suffix}`)
          }
        }
      }
      return
    }
    apply()
  }

  function setRadius(preset) {
    config.radius = preset
    if (preset === 'default') {
      for (const name of ['--ev-radius-sm', '--ev-radius-md', '--ev-radius-lg', '--ev-radius-xl', '--ev-radius-2xl']) {
        document.documentElement.style.removeProperty(name)
      }
      return
    }
    apply()
  }

  function setSpace(preset) {
    config.space = preset
    if (preset === 'default') {
      for (let i = 1; i <= 20; i++) {
        document.documentElement.style.removeProperty(`--ev-space-${i}`)
      }
      return
    }
    apply()
  }

  function setContainer(preset) {
    config.container = preset
    if (preset === 'default') {
      document.documentElement.style.removeProperty('--ev-container-width')
      return
    }
    apply()
  }

  function setGlass(on) {
    config.glass = !!on
    if (typeof document === 'undefined') return
    if (config.glass) document.documentElement.setAttribute('data-ev-glass', 'on')
    else document.documentElement.removeAttribute('data-ev-glass')
  }

  function reset() {
    Object.assign(config, DEFAULT_CONFIG)
    clearApplied()
    setGlass(false)
  }

  /**
   * 应用一个风格方案（EV_STYLE_PRESETS 的 key）
   * 一整套 主色/圆角/间距/容器宽 即时生效
   */
  function applyPreset(key) {
    const preset = EV_STYLE_PRESETS[key]
    if (!preset) return
    Object.assign(config, DEFAULT_CONFIG, preset.config)
    clearApplied()
    apply()
  }

  return {
    config,
    setPrimary,
    setSemantic,
    setGlass,
    setRadius,
    setSpace,
    setContainer,
    applyPreset,
    reset,
    /** 一次性应用整份配置（EvConfigProvider 消费） */
    applyConfig(next) {
      Object.assign(config, DEFAULT_CONFIG, next || {})
      clearApplied()
      apply()
    },
  }
}
