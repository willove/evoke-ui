export { mount } from '@vue/test-utils'
export { describe, it, expect, vi, beforeEach } from 'vitest'

// 从包内再导出 vue 常用 API，测试文件统一从 helpers 引入
export {
  defineComponent,
  h,
  ref,
  computed,
  nextTick,
} from 'vue'

// 根 vitest 配置通过 server.deps.inline 与 vue 别名保证单份 runtime；
// 这里统一再导出被测组件，测试文件按需引入
export { default as EwIcon } from '../src/components/icon/index.vue'
export { default as EwButton } from '../src/components/button/index.vue'
export { default as EwIconButton } from '../src/components/icon-button/index.vue'
export { default as EwTag } from '../src/components/tag/index.vue'
export { default as EwBadge } from '../src/components/badge/index.vue'
export { default as EwCard } from '../src/components/card/index.vue'
export { default as EwSection } from '../src/components/section/index.vue'
export { default as EwNavbar } from '../src/components/navbar/index.vue'
export { default as EwFooter } from '../src/components/footer/index.vue'
export { default as EwHero } from '../src/components/hero/index.vue'
export { default as EwSearchBox } from '../src/components/search-box/index.vue'
export { default as EwIconGrid } from '../src/components/icon-grid/index.vue'
export { default as EwFeatureGrid } from '../src/components/feature-grid/index.vue'
export { default as EwPricingCard } from '../src/components/pricing-card/index.vue'
export { default as EwFaq } from '../src/components/faq/index.vue'
export { default as EwAlert } from '../src/components/alert/index.vue'
export { default as EwCodeBlock } from '../src/components/code-block/index.vue'
export { default as EwKeycap } from '../src/components/keycap/index.vue'
export { default as EwStatistic } from '../src/components/statistic/index.vue'
export { default as EwThemeToggle } from '../src/components/theme-toggle/index.vue'
export { default as EwQuote } from '../src/components/quote/index.vue'
export { default as EwConfigProvider } from '../src/components/config-provider/index.vue'
export { default as EwTabs } from '../src/components/tabs/index.vue'
export { default as EwSwitch } from '../src/components/switch-comp/index.vue'
export { default as EwContainer } from '../src/components/container/index.vue'
export { default as EwAvatar } from '../src/components/avatar/index.vue'
export { default as EwAvatarGroup } from '../src/components/avatar/group.vue'
export { default as EwTimeline } from '../src/components/timeline/index.vue'
export { default as EwComparisonTable } from '../src/components/comparison-table/index.vue'
export { default as EwCta } from '../src/components/cta/index.vue'
export { default as EwNewsletter } from '../src/components/newsletter/index.vue'
export { default as EwLogoCloud } from '../src/components/logo-cloud/index.vue'
export { default as EwVideo } from '../src/components/video/index.vue'
export { default as EwAudio } from '../src/components/audio/index.vue'
export { default as EwContactForm } from '../src/components/contact-form/index.vue'
export { default as EwCarousel } from '../src/components/carousel/index.vue'
export { default as EwArticleCard } from '../src/components/article-card/index.vue'
export { default as EwProfileCard } from '../src/components/profile-card/index.vue'
export { default as EwMarquee } from '../src/components/marquee/index.vue'
export { default as EwInput } from '../src/components/input/index.vue'
export { default as EwTextarea } from '../src/components/textarea/index.vue'
export { default as EwSelect } from '../src/components/select/index.vue'
export { default as EwField } from '../src/components/field/index.vue'

// Components — 移动组件
export { default as EwPullRefresh } from '../src/components/pull-refresh/index.vue'
export { default as EwLoadMore } from '../src/components/load-more/index.vue'
export { default as EwActionSheet } from '../src/components/action-sheet/index.vue'
export { default as EwTabbar } from '../src/components/tabbar/index.vue'
export { default as EwTabbarItem } from '../src/components/tabbar/item.vue'

export { registerIcons, getIconByName, getIconNames, hasIcon } from '../src/components/icon/iconRegistry'
