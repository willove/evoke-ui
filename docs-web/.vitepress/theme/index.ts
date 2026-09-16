// Evoke UI 文档站主题
// 默认主题之上，源码级注册全部 Ev 组件与 v-reveal 指令（改动即时生效），
// 并注入库的设计令牌与工具类（不注入 base.css 元素级 reset）
import DefaultTheme from 'vitepress/theme'

import EvIcon from '../../../packages/evoke-ui/src/components/icon/index.vue'
import EvButton from '../../../packages/evoke-ui/src/components/button/index.vue'
import EvIconButton from '../../../packages/evoke-ui/src/components/icon-button/index.vue'
import EvTag from '../../../packages/evoke-ui/src/components/tag/index.vue'
import EvBadge from '../../../packages/evoke-ui/src/components/badge/index.vue'
import EvKeycap from '../../../packages/evoke-ui/src/components/keycap/index.vue'
import EvSection from '../../../packages/evoke-ui/src/components/section/index.vue'
import EvCard from '../../../packages/evoke-ui/src/components/card/index.vue'
import EvHero from '../../../packages/evoke-ui/src/components/hero/index.vue'
import EvNavbar from '../../../packages/evoke-ui/src/components/navbar/index.vue'
import EvFooter from '../../../packages/evoke-ui/src/components/footer/index.vue'
import EvSearchBox from '../../../packages/evoke-ui/src/components/search-box/index.vue'
import EvAiPromptBox from '../../../packages/evoke-ui/src/components/ai-prompt-box/index.vue'
import EvIconGrid from '../../../packages/evoke-ui/src/components/icon-grid/index.vue'
import EvFeatureGrid from '../../../packages/evoke-ui/src/components/feature-grid/index.vue'
import EvPricingCard from '../../../packages/evoke-ui/src/components/pricing-card/index.vue'
import EvFaq from '../../../packages/evoke-ui/src/components/faq/index.vue'
import EvAlert from '../../../packages/evoke-ui/src/components/alert/index.vue'
import EvCodeBlock from '../../../packages/evoke-ui/src/components/code-block/index.vue'
import EvMarkdown from '../../../packages/evoke-ui/src/components/markdown/index.vue'
import EvMarkdownEditor from '../../../packages/evoke-ui/src/components/markdown-editor/index.vue'
import EvStatistic from '../../../packages/evoke-ui/src/components/statistic/index.vue'
import EvThemeToggle from '../../../packages/evoke-ui/src/components/theme-toggle/index.vue'
import EvQuote from '../../../packages/evoke-ui/src/components/quote/index.vue'
import EvConfigProvider from '../../../packages/evoke-ui/src/components/config-provider/index.vue'
import EvTabs from '../../../packages/evoke-ui/src/components/tabs/index.vue'
import EvSwitch from '../../../packages/evoke-ui/src/components/switch-comp/index.vue'
import EvOtpInput from '../../../packages/evoke-ui/src/components/otp-input/index.vue'
import EvContainer from '../../../packages/evoke-ui/src/components/container/index.vue'
import EvAvatar from '../../../packages/evoke-ui/src/components/avatar/index.vue'
import EvAvatarGroup from '../../../packages/evoke-ui/src/components/avatar/group.vue'
import EvTimeline from '../../../packages/evoke-ui/src/components/timeline/index.vue'
import EvComparisonTable from '../../../packages/evoke-ui/src/components/comparison-table/index.vue'
import EvCta from '../../../packages/evoke-ui/src/components/cta/index.vue'
import EvNewsletter from '../../../packages/evoke-ui/src/components/newsletter/index.vue'
import EvLogoCloud from '../../../packages/evoke-ui/src/components/logo-cloud/index.vue'
import EvVideo from '../../../packages/evoke-ui/src/components/video/index.vue'
import EvAudio from '../../../packages/evoke-ui/src/components/audio/index.vue'
import EvContactForm from '../../../packages/evoke-ui/src/components/contact-form/index.vue'
import EvCarousel from '../../../packages/evoke-ui/src/components/carousel/index.vue'
import EvArticleCard from '../../../packages/evoke-ui/src/components/article-card/index.vue'
import EvProfileCard from '../../../packages/evoke-ui/src/components/profile-card/index.vue'
import EvMarquee from '../../../packages/evoke-ui/src/components/marquee/index.vue'
import EvBorderBeam from '../../../packages/evoke-ui/src/components/border-beam/index.vue'
import EvExecCard from '../../../packages/evoke-ui/src/components/exec-card/index.vue'
import EvArticle from '../../../packages/evoke-ui/src/components/article/index.vue'
import EvImageWall from '../../../packages/evoke-ui/src/components/image-wall/index.vue'
import EvImagePreview from '../../../packages/evoke-ui/src/components/image-preview/index.vue'
import EvWaterfall from '../../../packages/evoke-ui/src/components/waterfall/index.vue'
import EvModal from '../../../packages/evoke-ui/src/components/modal/index.vue'
import EvInput from '../../../packages/evoke-ui/src/components/input/index.vue'
import EvTextarea from '../../../packages/evoke-ui/src/components/textarea/index.vue'
import EvSelect from '../../../packages/evoke-ui/src/components/select/index.vue'
import EvField from '../../../packages/evoke-ui/src/components/field/index.vue'
import EvSlider from '../../../packages/evoke-ui/src/components/slider/index.vue'
import EvScrollScene from '../../../packages/evoke-ui/src/components/scroll-scene/index.vue'
import EvBento from '../../../packages/evoke-ui/src/components/bento/index.vue'
import EvPullRefresh from '../../../packages/evoke-ui/src/components/pull-refresh/index.vue'
import EvLoadMore from '../../../packages/evoke-ui/src/components/load-more/index.vue'
import EvActionSheet from '../../../packages/evoke-ui/src/components/action-sheet/index.vue'
import EvTabbar from '../../../packages/evoke-ui/src/components/tabbar/index.vue'
import EvTabbarItem from '../../../packages/evoke-ui/src/components/tabbar/item.vue'
import EvNavBar from '../../../packages/evoke-ui/src/components/nav-bar/index.vue'
import { revealDirective } from '../../../packages/evoke-ui/src/directives/reveal'
import { loadShowcaseIcons } from '../../../packages/evoke-ui/src/components/icon/iconRegistry'

import '../../../packages/evoke-ui/src/styles/variables.css'
import '../../../packages/evoke-ui/src/styles/utilities.css'
import './custom.css'

import DemoBlock from './DemoBlock.vue'
import MobileStage from './MobileStage.vue'
import Layout from './Layout.vue'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    const components = {
      EvIcon, EvButton, EvIconButton, EvTag, EvBadge, EvKeycap,
      EvSection, EvCard, EvHero, EvNavbar, EvFooter,
      EvSearchBox, EvIconGrid, EvFeatureGrid, EvPricingCard,
      EvAiPromptBox,
      EvFaq, EvAlert, EvCodeBlock, EvStatistic, EvThemeToggle, EvQuote,
      EvMarkdown, EvMarkdownEditor,
      EvConfigProvider, EvTabs, EvSwitch, EvContainer, EvAvatar, EvAvatarGroup,
      EvOtpInput,
      EvTimeline, EvComparisonTable, EvCta, EvNewsletter, EvLogoCloud,
      EvVideo, EvAudio, EvContactForm, EvCarousel, EvArticleCard, EvProfileCard,
      EvBorderBeam, EvExecCard, EvArticle, EvImageWall, EvImagePreview, EvWaterfall, EvModal,
      EvMarquee, EvInput, EvTextarea, EvSelect, EvField, EvSlider, EvScrollScene, EvBento,
      EvPullRefresh, EvLoadMore, EvActionSheet, EvTabbar, EvTabbarItem, EvNavBar,
      DemoBlock, MobileStage,
    }
    for (const [name, comp] of Object.entries(components)) app.component(name, comp)
    app.directive('reveal', revealDirective)
  },
  setup() {
    // 展示图标集按需预载（供 Icon 组件演示页直接使用 Remix 原生名）
    if (typeof window !== 'undefined') loadShowcaseIcons()
  },
}
