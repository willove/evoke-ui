/**
 * @wil-works/evoke-ui
 * Evoke UI — 纯 JS Vue3 官网/纯前端站点组件库
 * 设计主线「安静优雅」：Clean Navy 设计语言，明暗双主题与运行时主题定制
 *
 * Usage:
 *   import { createApp } from 'vue'
 *   import EvokeUI from '@wil-works/evoke-ui'
 *   import '@wil-works/evoke-ui/styles'
 *
 *   const app = createApp(App)
 *   app.use(EvokeUI)
 */

// ══════ CSS — 设计变量 + 全局基础样式 ══════
import './styles/index.css'

// ─── Composables ───
import { useTheme, initTheme } from './composables/useTheme'
import { useCopy } from './composables/useCopy'
import { useThemeConfig } from './composables/useThemeConfig'
import { useSafeArea, ensureViewportFit } from './composables/useSafeArea'

// ─── Presets ───
export * from './presets'

// ─── Directives ───
import { revealDirective } from './directives/reveal'

// ─── Icon Registry ───
import {
  registerIcons,
  getIconByName,
  getIconNames,
  hasIcon,
  loadShowcaseIcons,
} from './components/icon/iconRegistry'

// ─── Components ───
import EwIcon from './components/icon/index.vue'
import EwButton from './components/button/index.vue'
import EwIconButton from './components/icon-button/index.vue'
import EwTag from './components/tag/index.vue'
import EwBadge from './components/badge/index.vue'
import EwCard from './components/card/index.vue'
import EwSection from './components/section/index.vue'
import EwNavbar from './components/navbar/index.vue'
import EwFooter from './components/footer/index.vue'
import EwHero from './components/hero/index.vue'
import EwSearchBox from './components/search-box/index.vue'
import EwIconGrid from './components/icon-grid/index.vue'
import EwFeatureGrid from './components/feature-grid/index.vue'
import EwPricingCard from './components/pricing-card/index.vue'
import EwFaq from './components/faq/index.vue'
import EwAlert from './components/alert/index.vue'
import EwCodeBlock from './components/code-block/index.vue'
import EwMarkdown from './components/markdown/index.vue'
import EwMarkdownEditor from './components/markdown-editor/index.vue'
import EwKeycap from './components/keycap/index.vue'
import EwStatistic from './components/statistic/index.vue'
import EwThemeToggle from './components/theme-toggle/index.vue'
import EwQuote from './components/quote/index.vue'
// Components — 主题与自由度
import EwConfigProvider from './components/config-provider/index.vue'
// Components — 第二批功能组件
import EwTabs from './components/tabs/index.vue'
import EwSwitch from './components/switch-comp/index.vue'
import EwContainer from './components/container/index.vue'
import EwAvatar from './components/avatar/index.vue'
import EwAvatarGroup from './components/avatar/group.vue'
import EwTimeline from './components/timeline/index.vue'
import EwComparisonTable from './components/comparison-table/index.vue'
import EwCta from './components/cta/index.vue'
import EwNewsletter from './components/newsletter/index.vue'
import EwLogoCloud from './components/logo-cloud/index.vue'
// Components — 媒体 / 内容 / 交互
import EwVideo from './components/video/index.vue'
import EwAudio from './components/audio/index.vue'
import EwContactForm from './components/contact-form/index.vue'
import EwCarousel from './components/carousel/index.vue'
import EwArticleCard from './components/article-card/index.vue'
import EwProfileCard from './components/profile-card/index.vue'
// Components — 内容与展示增强
import EwArticle from './components/article/index.vue'
import EwExecCard from './components/exec-card/index.vue'
import EwImageWall from './components/image-wall/index.vue'
import EwImagePreview from './components/image-preview/index.vue'
import EwWaterfall from './components/waterfall/index.vue'
import EwModal from './components/modal/index.vue'
// Components — 动效
import EwMarquee from './components/marquee/index.vue'
import EwBorderBeam from './components/border-beam/index.vue'
// Components — 表单
import EwInput from './components/input/index.vue'
import EwTextarea from './components/textarea/index.vue'
import EwSelect from './components/select/index.vue'
import EwField from './components/field/index.vue'
// Components — 移动组件
import EwPullRefresh from './components/pull-refresh/index.vue'
import EwLoadMore from './components/load-more/index.vue'
import EwActionSheet from './components/action-sheet/index.vue'
import EwTabbar from './components/tabbar/index.vue'
import EwTabbarItem from './components/tabbar/item.vue'
import EwNavBar from './components/nav-bar/index.vue'

const components = {
  EwIcon,
  EwButton,
  EwIconButton,
  EwTag,
  EwBadge,
  EwCard,
  EwSection,
  EwNavbar,
  EwFooter,
  EwHero,
  EwSearchBox,
  EwIconGrid,
  EwFeatureGrid,
  EwPricingCard,
  EwFaq,
  EwAlert,
  EwCodeBlock,
  EwMarkdown,
  EwMarkdownEditor,
  EwKeycap,
  EwStatistic,
  EwThemeToggle,
  EwQuote,
  EwConfigProvider,
  EwTabs,
  EwSwitch,
  EwContainer,
  EwAvatar,
  EwAvatarGroup,
  EwTimeline,
  EwComparisonTable,
  EwCta,
  EwNewsletter,
  EwLogoCloud,
  EwVideo,
  EwAudio,
  EwContactForm,
  EwCarousel,
  EwArticleCard,
  EwProfileCard,
  EwArticle,
  EwExecCard,
  EwImageWall,
  EwImagePreview,
  EwWaterfall,
  EwModal,
  EwMarquee,
  EwBorderBeam,
  EwInput,
  EwTextarea,
  EwSelect,
  EwField,
  EwPullRefresh,
  EwLoadMore,
  EwActionSheet,
  EwTabbar,
  EwTabbarItem,
  EwNavBar,
}

function install(app) {
  for (const [name, comp] of Object.entries(components)) app.component(name, comp)
  app.directive('reveal', revealDirective)
  initTheme()
}

export default { install }

export {
  // Components
  components,
  EwIcon,
  EwButton,
  EwIconButton,
  EwTag,
  EwBadge,
  EwCard,
  EwSection,
  EwNavbar,
  EwFooter,
  EwHero,
  EwSearchBox,
  EwIconGrid,
  EwFeatureGrid,
  EwPricingCard,
  EwFaq,
  EwAlert,
  EwCodeBlock,
  EwMarkdown,
  EwMarkdownEditor,
  EwKeycap,
  EwStatistic,
  EwThemeToggle,
  EwQuote,
  EwConfigProvider,
  EwTabs,
  EwSwitch,
  EwContainer,
  EwAvatar,
  EwAvatarGroup,
  EwTimeline,
  EwComparisonTable,
  EwCta,
  EwNewsletter,
  EwLogoCloud,
  EwVideo,
  EwAudio,
  EwContactForm,
  EwCarousel,
  EwArticleCard,
  EwProfileCard,
  EwArticle,
  EwExecCard,
  EwImageWall,
  EwImagePreview,
  EwWaterfall,
  EwModal,
  EwMarquee,
  EwBorderBeam,
  EwInput,
  EwTextarea,
  EwSelect,
  EwField,
  EwPullRefresh,
  EwLoadMore,
  EwActionSheet,
  EwTabbar,
  EwTabbarItem,
  EwNavBar,
  // Icon Registry
  registerIcons,
  getIconByName,
  getIconNames,
  hasIcon,
  loadShowcaseIcons,
  // Directives
  revealDirective as vReveal,
  // Composables
  useTheme,
  initTheme,
  useCopy,
  // Composables — 移动端安全区
  useSafeArea,
  ensureViewportFit,
  useThemeConfig,
  // Install
  install,
}
