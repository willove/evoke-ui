import { defineConfig } from 'vitepress'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import llmstxt from 'vitepress-plugin-llms'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '../../packages/evoke-ui')

/**
 * Evoke UI 文档站
 * 默认主题 + 源码级消费组件库（theme/index.ts 内直接引 src，改动即时生效）
 * 仅全局注入 variables.css（令牌）与 utilities.css（工具类），
 * 不注入 base.css 元素级 reset，避免干扰默认主题排版
 */
export default defineConfig({
  lang: 'zh-CN',
  title: 'Evoke UI',
  description: '面向官网与纯前端站点的 Vue3 组件库 —— Clean Navy 设计语言，明暗双主题与运行时主题定制',

  // 暗色切换由库的 EvThemeToggle / useTheme 负责（与首页一致），关闭默认开关
  appearance: false,

  vite: {
    plugins: [llmstxt()],
    resolve: {
      alias: [
        {
          find: /^@wil-works\/evoke-ui$/,
          replacement: resolve(pkgRoot, 'src/index.js'),
        },
        {
          find: /^@wil-works\/evoke-ui\/styles$/,
          replacement: resolve(pkgRoot, 'src/styles/index.css'),
        },
      ],
      dedupe: ['vue'],
    },
    server: { fs: { allow: [pkgRoot, resolve(__dirname)] } },
  },

  themeConfig: {
    // 首页 EvNavbar 同款四项 + 官方库下拉（姊妹站收进面板），跨页切换导航内容不变
    nav: [
      { text: '首页', link: '/' },
      { text: '快速开始', link: '/guide/getting-started' },
      { text: '组件', link: '/components/overview' },
      { text: '移动端', link: '/mobile/' },
      { text: '案例', link: '/cases/' },
      {
        text: '官方库',
        items: [
          { text: '中后台 UI 框架 · Business UI', link: 'https://evoke-business-ui.wil-works.com' },
          { text: '图表库 · Evoke Charts', link: 'https://evoke-charts.wil-works.com' },
        ],
      },
    ],
    // 暗色切换与 GitHub 入口由 Layout 插槽注入（与首页同一套 Ev 组件）
    outline: { label: '本页目录' },
    docFooter: { prev: '上一页', next: '下一页' },
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '回到顶部',
    sidebar: {
      '/mobile/': [
        {
          text: '移动端',
          items: [
            { text: '适配总览', link: '/mobile/' },
            { text: '布局与导航壳', link: '/mobile/layout' },
            { text: '内容流', link: '/mobile/content' },
            { text: '表单与转化', link: '/mobile/forms' },
          ],
        },
        {
          text: '案例',
          items: [
            { text: 'H5 官网', link: '/mobile/case' },
            { text: '个人中心', link: '/mobile/case-profile' },
            { text: '商品详情与结算', link: '/mobile/case-shop' },
            { text: '登录注册', link: '/mobile/case-auth' },
          ],
        },
        {
          text: '移动端组件 · 手势与加载',
          items: [
            { text: 'PullRefresh 下拉刷新', link: '/mobile/components/pull-refresh' },
            { text: 'LoadMore 加载更多', link: '/mobile/components/load-more' },
          ],
        },
        {
          text: '移动端组件 · 浮层与导航',
          items: [
            { text: 'ActionSheet 动作面板', link: '/mobile/components/action-sheet' },
            { text: 'NavBar 页头', link: '/mobile/components/nav-bar' },
            { text: 'Tabbar 底部标签栏', link: '/mobile/components/tabbar' },
          ],
        },
      ],
      '/cases/': [
        {
          text: '案例',
          items: [
            { text: '案例总览', link: '/cases/' },
            { text: '企业官网', link: '/cases/corporate' },
            { text: '个人博客', link: '/cases/blog' },
            { text: '云笔记工作台', link: '/cases/notes' },
          ],
        },
      ],
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '设计语言', link: '/guide/design' },
            { text: '主题与暗色模式', link: '/guide/theming' },
            { text: '主题定制器', link: '/guide/customizer' },
            { text: '动效', link: '/guide/motion' },
          ],
        },
      ],
      '/components/': [
        {
          text: '总览',
          items: [
            { text: '组件总览', link: '/components/overview' },
          ],
        },
        {
          text: '基础',
          items: [
            { text: 'Icon 图标', link: '/components/icon' },
            { text: '全部图标', link: '/components/icons' },
            { text: 'Button 按钮', link: '/components/button' },
            { text: 'IconButton 图标按钮', link: '/components/icon-button' },
            { text: 'Tag 标签', link: '/components/tag' },
            { text: 'Badge 徽标', link: '/components/badge' },
            { text: 'Keycap 键帽', link: '/components/keycap' },
            { text: 'Input 输入框', link: '/components/input' },
            { text: 'Textarea 多行输入', link: '/components/textarea' },
            { text: 'Select 下拉选择', link: '/components/select' },
            { text: 'Field 字段包装', link: '/components/field' },
            { text: 'Tabs 标签页', link: '/components/tabs' },
            { text: 'Switch 开关', link: '/components/switch' },
            { text: 'Avatar 头像', link: '/components/avatar' },
            { text: 'AvatarGroup 头像组', link: '/components/avatar-group' },
          ],
        },
        {
          text: '布局',
          items: [
            { text: 'Container 容器', link: '/components/container' },
            { text: 'Section 区块', link: '/components/section' },
            { text: 'Card 卡片', link: '/components/card' },
            { text: 'Hero 首屏', link: '/components/hero' },
            { text: 'Navbar 导航', link: '/components/navbar' },
            { text: 'Footer 页脚', link: '/components/footer' },
          ],
        },
        {
          text: '站点区块',
          items: [
            { text: 'SearchBox 搜索框', link: '/components/search-box' },
            { text: 'IconGrid 图标网格', link: '/components/icon-grid' },
            { text: 'FeatureGrid 特性', link: '/components/feature-grid' },
            { text: 'Statistic 指标', link: '/components/statistic' },
            { text: 'LogoCloud 品牌墙', link: '/components/logo-cloud' },
            { text: 'PricingCard 定价卡', link: '/components/pricing-card' },
            { text: 'ComparisonTable 对比表', link: '/components/comparison-table' },
            { text: 'Faq 手风琴', link: '/components/faq' },
            { text: 'Quote 评价', link: '/components/quote' },
            { text: 'ArticleCard 文章卡', link: '/components/article-card' },
            { text: 'Article 文章内容', link: '/components/article' },
            { text: 'ProfileCard 个人名片', link: '/components/profile-card' },
            { text: 'ExecCard 高管介绍卡', link: '/components/exec-card' },
            { text: 'Timeline 时间线', link: '/components/timeline' },
            { text: 'Cta 行动召唤', link: '/components/cta' },
            { text: 'Newsletter 订阅', link: '/components/newsletter' },
            { text: 'Alert 公告', link: '/components/alert' },
          ],
        },
        {
          text: '媒体与交互',
          items: [
            { text: 'Video 视频', link: '/components/video' },
            { text: 'Audio 音频', link: '/components/audio' },
            { text: 'Carousel 轮播', link: '/components/carousel' },
            { text: 'ImageWall 图片墙', link: '/components/image-wall' },
            { text: 'Waterfall 瀑布流', link: '/components/waterfall' },
            { text: 'ImagePreview 图片预览', link: '/components/image-preview' },
            { text: 'Modal 弹出层', link: '/components/modal' },
            { text: 'Marquee 跑马灯', link: '/components/marquee' },
            { text: 'BorderBeam 边框流光', link: '/components/border-beam' },
            { text: 'ContactForm 留言表单', link: '/components/contact-form' },
          ],
        },
        {
          text: '反馈与主题',
          items: [
            { text: 'CodeBlock 命令块', link: '/components/code-block' },
            { text: 'Markdown 渲染', link: '/components/markdown' },
            { text: 'MarkdownEditor 编辑器', link: '/components/markdown-editor' },
            { text: 'ThemeToggle 主题切换', link: '/components/theme-toggle' },
            { text: 'ConfigProvider 主题配置', link: '/components/config-provider' },
          ],
        },
      ],
    },
    footer: {
      message: '基于 MIT 许可证发布',
      copyright: 'Copyright © 2026 willove',
    },
  },
})
