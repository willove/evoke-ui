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
import { useScrollProgress } from './composables/useScrollProgress'
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
import EvIcon from './components/icon/index.vue'
import EvButton from './components/button/index.vue'
import EvIconButton from './components/icon-button/index.vue'
import EvTag from './components/tag/index.vue'
import EvBadge from './components/badge/index.vue'
import EvCard from './components/card/index.vue'
import EvSection from './components/section/index.vue'
import EvNavbar from './components/navbar/index.vue'
import EvFooter from './components/footer/index.vue'
import EvHero from './components/hero/index.vue'
import EvSearchBox from './components/search-box/index.vue'
import EvIconGrid from './components/icon-grid/index.vue'
import EvFeatureGrid from './components/feature-grid/index.vue'
import EvPricingCard from './components/pricing-card/index.vue'
import EvFaq from './components/faq/index.vue'
import EvAlert from './components/alert/index.vue'
import EvCodeBlock from './components/code-block/index.vue'
import EvMarkdown from './components/markdown/index.vue'
import EvMarkdownEditor from './components/markdown-editor/index.vue'
import EvKeycap from './components/keycap/index.vue'
import EvStatistic from './components/statistic/index.vue'
import EvThemeToggle from './components/theme-toggle/index.vue'
import EvQuote from './components/quote/index.vue'
// Components — 主题与自由度
import EvConfigProvider from './components/config-provider/index.vue'
// Components — 第二批功能组件
import EvTabs from './components/tabs/index.vue'
import EvSwitch from './components/switch-comp/index.vue'
// Components — 布局
import EvContainer from './components/container/index.vue'
import EvScrollScene from './components/scroll-scene/index.vue'
import EvBento from './components/bento/index.vue'
import EvAvatar from './components/avatar/index.vue'
import EvAvatarGroup from './components/avatar/group.vue'
import EvTimeline from './components/timeline/index.vue'
import EvComparisonTable from './components/comparison-table/index.vue'
import EvCta from './components/cta/index.vue'
import EvNewsletter from './components/newsletter/index.vue'
import EvLogoCloud from './components/logo-cloud/index.vue'
// Components — 媒体 / 内容 / 交互
import EvVideo from './components/video/index.vue'
import EvAudio from './components/audio/index.vue'
import EvContactForm from './components/contact-form/index.vue'
import EvCarousel from './components/carousel/index.vue'
import EvArticleCard from './components/article-card/index.vue'
import EvProfileCard from './components/profile-card/index.vue'
// Components — 内容与展示增强
import EvArticle from './components/article/index.vue'
import EvExecCard from './components/exec-card/index.vue'
import EvImageWall from './components/image-wall/index.vue'
import EvImagePreview from './components/image-preview/index.vue'
import EvWaterfall from './components/waterfall/index.vue'
import EvModal from './components/modal/index.vue'
// Components — 动效
import EvMarquee from './components/marquee/index.vue'
import EvBorderBeam from './components/border-beam/index.vue'
// Components — 表单
import EvInput from './components/input/index.vue'
import EvTextarea from './components/textarea/index.vue'
import EvSelect from './components/select/index.vue'
import EvField from './components/field/index.vue'
import EvSlider from './components/slider/index.vue'
// Components — 移动组件
import EvPullRefresh from './components/pull-refresh/index.vue'
import EvLoadMore from './components/load-more/index.vue'
import EvActionSheet from './components/action-sheet/index.vue'
import EvTabbar from './components/tabbar/index.vue'
import EvTabbarItem from './components/tabbar/item.vue'
import EvNavBar from './components/nav-bar/index.vue'

const components = {
  EvIcon,
  EvButton,
  EvIconButton,
  EvTag,
  EvBadge,
  EvCard,
  EvSection,
  EvNavbar,
  EvFooter,
  EvHero,
  EvSearchBox,
  EvIconGrid,
  EvFeatureGrid,
  EvPricingCard,
  EvFaq,
  EvAlert,
  EvCodeBlock,
  EvMarkdown,
  EvMarkdownEditor,
  EvKeycap,
  EvStatistic,
  EvThemeToggle,
  EvQuote,
  EvConfigProvider,
  EvTabs,
  EvSwitch,
  EvContainer,
  EvScrollScene,
  EvBento,
  EvAvatar,
  EvAvatarGroup,
  EvTimeline,
  EvComparisonTable,
  EvCta,
  EvNewsletter,
  EvLogoCloud,
  EvVideo,
  EvAudio,
  EvContactForm,
  EvCarousel,
  EvArticleCard,
  EvProfileCard,
  EvArticle,
  EvExecCard,
  EvImageWall,
  EvImagePreview,
  EvWaterfall,
  EvModal,
  EvMarquee,
  EvBorderBeam,
  EvInput,
  EvTextarea,
  EvSelect,
  EvField,
  EvSlider,
  EvPullRefresh,
  EvLoadMore,
  EvActionSheet,
  EvTabbar,
  EvTabbarItem,
  EvNavBar,
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
  EvIcon,
  EvButton,
  EvIconButton,
  EvTag,
  EvBadge,
  EvCard,
  EvSection,
  EvNavbar,
  EvFooter,
  EvHero,
  EvSearchBox,
  EvIconGrid,
  EvFeatureGrid,
  EvPricingCard,
  EvFaq,
  EvAlert,
  EvCodeBlock,
  EvMarkdown,
  EvMarkdownEditor,
  EvKeycap,
  EvStatistic,
  EvThemeToggle,
  EvQuote,
  EvConfigProvider,
  EvTabs,
  EvSwitch,
  EvContainer,
  EvScrollScene,
  EvBento,
  EvAvatar,
  EvAvatarGroup,
  EvTimeline,
  EvComparisonTable,
  EvCta,
  EvNewsletter,
  EvLogoCloud,
  EvVideo,
  EvAudio,
  EvContactForm,
  EvCarousel,
  EvArticleCard,
  EvProfileCard,
  EvArticle,
  EvExecCard,
  EvImageWall,
  EvImagePreview,
  EvWaterfall,
  EvModal,
  EvMarquee,
  EvBorderBeam,
  EvInput,
  EvTextarea,
  EvSelect,
  EvField,
  EvSlider,
  EvPullRefresh,
  EvLoadMore,
  EvActionSheet,
  EvTabbar,
  EvTabbarItem,
  EvNavBar,
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
  useScrollProgress,
  // Install
  install,
}
