import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as WebUI from '../src/index.js'
import { createApp, h } from 'vue'

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('evoke-ui foundation', () => {
  it('导出全量组件注册表', () => {
    const names = Object.keys(WebUI.components)
    for (const name of [
      'EvIcon', 'EvButton', 'EvIconButton', 'EvTag', 'EvBadge', 'EvCard',
      'EvSection', 'EvNavbar', 'EvFooter', 'EvHero', 'EvSearchBox', 'EvIconGrid',
      'EvFeatureGrid', 'EvPricingCard', 'EvFaq', 'EvAlert', 'EvCodeBlock',
      'EvKeycap', 'EvStatistic', 'EvThemeToggle', 'EvQuote',
      'EvConfigProvider', 'EvTabs', 'EvSwitch', 'EvContainer', 'EvAvatar', 'EvAvatarGroup',
      'EvTimeline', 'EvComparisonTable', 'EvCta', 'EvNewsletter', 'EvLogoCloud',
      'EvVideo', 'EvAudio', 'EvContactForm', 'EvCarousel', 'EvArticleCard', 'EvProfileCard',
      'EvMarquee', 'EvInput', 'EvTextarea', 'EvSelect', 'EvField',
    ]) {
      expect(names, `${name} 应在注册表`).toContain(name)
    }
  })

  it('导出图标注册表 API 与组合式 API', () => {
    for (const key of [
      'registerIcons', 'getIconByName', 'getIconNames', 'hasIcon',
      'loadShowcaseIcons', 'useTheme', 'useCopy', 'vReveal', 'install',
    ]) {
      expect(WebUI[key], `导出 ${key}`).toBeTruthy()
    }
  })

  it('install 注册全量组件与 v-reveal 指令', () => {
    const app = createApp({ render: () => h('div') })
    const registered = new Map()
    app.component = function (name, comp) { registered.set(name, comp); return this }
    const directives = new Map()
    app.directive = function (name, def) { directives.set(name, def); return this }

    WebUI.install(app)
    expect(registered.size).toBe(Object.keys(WebUI.components).length)
    expect(directives.has('reveal')).toBe(true)
  })

  it('设计令牌：主色与暗色重映射存在于 variables.css', () => {
    const css = readFileSync(resolve(__dirname, '../src/styles/variables.css'), 'utf8')
    expect(css).toContain('--ev-color-primary:         #0D70FF')
    expect(css).toContain('--ev-color-ink:        #1a2947')
    expect(css).toContain('--ev-ease-spring:   cubic-bezier(0.3, 1.3, 0.3, 1)')
    expect(css).toContain('html.dark')
    expect(css).toContain('--ev-bg-page:      #17171a')
  })

  it('入口引入统一样式', () => {
    const entry = readFileSync(resolve(__dirname, '../src/index.js'), 'utf8')
    expect(entry).toContain("./styles/index.css")
  })
})
