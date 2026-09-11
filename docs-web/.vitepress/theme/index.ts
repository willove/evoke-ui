// Evoke UI 文档站主题
// 默认主题之上，源码级注册全部 Ew 组件与 v-reveal 指令（改动即时生效），
// 并注入库的设计令牌与工具类（不注入 base.css 元素级 reset）
import DefaultTheme from 'vitepress/theme'

import EwIcon from '../../../packages/evoke-ui/src/components/icon/index.vue'
import EwButton from '../../../packages/evoke-ui/src/components/button/index.vue'
import EwIconButton from '../../../packages/evoke-ui/src/components/icon-button/index.vue'
import EwTag from '../../../packages/evoke-ui/src/components/tag/index.vue'
import EwBadge from '../../../packages/evoke-ui/src/components/badge/index.vue'
import EwKeycap from '../../../packages/evoke-ui/src/components/keycap/index.vue'
import EwSection from '../../../packages/evoke-ui/src/components/section/index.vue'
import EwCard from '../../../packages/evoke-ui/src/components/card/index.vue'
import EwHero from '../../../packages/evoke-ui/src/components/hero/index.vue'
import EwNavbar from '../../../packages/evoke-ui/src/components/navbar/index.vue'
import EwFooter from '../../../packages/evoke-ui/src/components/footer/index.vue'
import EwSearchBox from '../../../packages/evoke-ui/src/components/search-box/index.vue'
import EwIconGrid from '../../../packages/evoke-ui/src/components/icon-grid/index.vue'
import EwFeatureGrid from '../../../packages/evoke-ui/src/components/feature-grid/index.vue'
import EwPricingCard from '../../../packages/evoke-ui/src/components/pricing-card/index.vue'
import EwFaq from '../../../packages/evoke-ui/src/components/faq/index.vue'
import EwAlert from '../../../packages/evoke-ui/src/components/alert/index.vue'
import EwCodeBlock from '../../../packages/evoke-ui/src/components/code-block/index.vue'
import EwMarkdown from '../../../packages/evoke-ui/src/components/markdown/index.vue'
import EwMarkdownEditor from '../../../packages/evoke-ui/src/components/markdown-editor/index.vue'
import EwStatistic from '../../../packages/evoke-ui/src/components/statistic/index.vue'
import EwThemeToggle from '../../../packages/evoke-ui/src/components/theme-toggle/index.vue'
import EwQuote from '../../../packages/evoke-ui/src/components/quote/index.vue'
import EwConfigProvider from '../../../packages/evoke-ui/src/components/config-provider/index.vue'
import EwTabs from '../../../packages/evoke-ui/src/components/tabs/index.vue'
import EwSwitch from '../../../packages/evoke-ui/src/components/switch-comp/index.vue'
import EwContainer from '../../../packages/evoke-ui/src/components/container/index.vue'
import EwAvatar from '../../../packages/evoke-ui/src/components/avatar/index.vue'
import EwAvatarGroup from '../../../packages/evoke-ui/src/components/avatar/group.vue'
import EwTimeline from '../../../packages/evoke-ui/src/components/timeline/index.vue'
import EwComparisonTable from '../../../packages/evoke-ui/src/components/comparison-table/index.vue'
import EwCta from '../../../packages/evoke-ui/src/components/cta/index.vue'
import EwNewsletter from '../../../packages/evoke-ui/src/components/newsletter/index.vue'
import EwLogoCloud from '../../../packages/evoke-ui/src/components/logo-cloud/index.vue'
import EwVideo from '../../../packages/evoke-ui/src/components/video/index.vue'
import EwAudio from '../../../packages/evoke-ui/src/components/audio/index.vue'
import EwContactForm from '../../../packages/evoke-ui/src/components/contact-form/index.vue'
import EwCarousel from '../../../packages/evoke-ui/src/components/carousel/index.vue'
import EwArticleCard from '../../../packages/evoke-ui/src/components/article-card/index.vue'
import EwProfileCard from '../../../packages/evoke-ui/src/components/profile-card/index.vue'
import EwMarquee from '../../../packages/evoke-ui/src/components/marquee/index.vue'
import EwBorderBeam from '../../../packages/evoke-ui/src/components/border-beam/index.vue'
import EwExecCard from '../../../packages/evoke-ui/src/components/exec-card/index.vue'
import EwArticle from '../../../packages/evoke-ui/src/components/article/index.vue'
import EwImageWall from '../../../packages/evoke-ui/src/components/image-wall/index.vue'
import EwImagePreview from '../../../packages/evoke-ui/src/components/image-preview/index.vue'
import EwWaterfall from '../../../packages/evoke-ui/src/components/waterfall/index.vue'
import EwModal from '../../../packages/evoke-ui/src/components/modal/index.vue'
import EwInput from '../../../packages/evoke-ui/src/components/input/index.vue'
import EwTextarea from '../../../packages/evoke-ui/src/components/textarea/index.vue'
import EwSelect from '../../../packages/evoke-ui/src/components/select/index.vue'
import EwField from '../../../packages/evoke-ui/src/components/field/index.vue'
import EwPullRefresh from '../../../packages/evoke-ui/src/components/pull-refresh/index.vue'
import EwLoadMore from '../../../packages/evoke-ui/src/components/load-more/index.vue'
import EwActionSheet from '../../../packages/evoke-ui/src/components/action-sheet/index.vue'
import EwTabbar from '../../../packages/evoke-ui/src/components/tabbar/index.vue'
import EwTabbarItem from '../../../packages/evoke-ui/src/components/tabbar/item.vue'
import EwNavBar from '../../../packages/evoke-ui/src/components/nav-bar/index.vue'
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
      EwIcon, EwButton, EwIconButton, EwTag, EwBadge, EwKeycap,
      EwSection, EwCard, EwHero, EwNavbar, EwFooter,
      EwSearchBox, EwIconGrid, EwFeatureGrid, EwPricingCard,
      EwFaq, EwAlert, EwCodeBlock, EwStatistic, EwThemeToggle, EwQuote,
      EwMarkdown, EwMarkdownEditor,
      EwConfigProvider, EwTabs, EwSwitch, EwContainer, EwAvatar, EwAvatarGroup,
      EwTimeline, EwComparisonTable, EwCta, EwNewsletter, EwLogoCloud,
      EwVideo, EwAudio, EwContactForm, EwCarousel, EwArticleCard, EwProfileCard,
      EwBorderBeam, EwExecCard, EwArticle, EwImageWall, EwImagePreview, EwWaterfall, EwModal,
      EwMarquee, EwInput, EwTextarea, EwSelect, EwField,
      EwPullRefresh, EwLoadMore, EwActionSheet, EwTabbar, EwTabbarItem, EwNavBar,
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
