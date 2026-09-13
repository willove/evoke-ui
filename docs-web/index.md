---
layout: false
---

<div class="dev-warn-banner">
  <span class="dev-warn-banner__full">项目正在快速迭代中，API 与视觉细节可能随版本调整，<strong>请勿用于生产环境</strong>。</span>
  <span class="dev-warn-banner__short">开发迭代中，<strong>请勿用于生产环境</strong>。</span>
</div>

<script setup>
import { ref } from 'vue'
import { useThemeConfig } from '../packages/evoke-ui/src/composables/useThemeConfig'
import { useTheme } from '../packages/evoke-ui/src/composables/useTheme'
import { EV_COLOR_PRESETS, EV_PALETTE_PRESETS } from '../packages/evoke-ui/src/presets'

const { config, setPrimary, setSemantic, reset } = useThemeConfig()
const { isDark, toggleTheme } = useTheme()
const swatches = Object.values(EV_COLOR_PRESETS)
const query = ref('')
const category = ref('')

// 首页换色点：主色 + 经典语义色整套回归（覆盖此前可能套用的色系语义）
function pickPrimary(color) {
  setPrimary(color)
  setSemantic(EV_PALETTE_PRESETS.classic.semantic)
}

// 首页搜索的站内索引：关键词命中即回车直达对应页
const searchIndex = [
  { cat: '文档', label: '快速开始', path: '/guide/getting-started', kw: '安装 install 引入 上手 npm pnpm 全量 按需' },
  { cat: '文档', label: '设计语言', path: '/guide/design', kw: '设计 clean navy 令牌 原则 排版 留白 气质' },
  { cat: '文档', label: '主题与暗色模式', path: '/guide/theming', kw: '主题 暗色 dark 令牌 变量 token' },
  { cat: '文档', label: '主题定制器', path: '/guide/customizer', kw: '定制器 换色 色系 主色 圆角 间距 莫兰迪 温柔安静 马卡龙 美拉德 马蒂斯 敦煌 多巴胺' },
  { cat: '文档', label: '动效', path: '/guide/motion', kw: '动效 动画 reveal 滚动 浮现 spring 弹性' },
  { cat: '组件', label: 'Icon 图标', path: '/components/icon', kw: '图标 icon remix svg 核心集' },
  { cat: '组件', label: '全部图标', path: '/components/icons', kw: '全部图标 图标库 remix 浏览 搜索' },
  { cat: '组件', label: 'Button 按钮', path: '/components/button', kw: '按钮 button cta 点击 胶囊' },
  { cat: '组件', label: 'IconButton 图标按钮', path: '/components/icon-button', kw: '图标按钮 icon button 紧凑' },
  { cat: '组件', label: 'Tag 标签', path: '/components/tag', kw: '标签 tag 状态 胶囊' },
  { cat: '组件', label: 'Badge 徽标', path: '/components/badge', kw: '徽标 badge 红点 计数 未读' },
  { cat: '组件', label: 'Keycap 键帽', path: '/components/keycap', kw: '键帽 keycap 快捷键 键盘' },
  { cat: '组件', label: 'Input 输入框', path: '/components/input', kw: '输入框 input 表单 文本 邮箱' },
  { cat: '组件', label: 'Textarea 多行输入', path: '/components/textarea', kw: '多行 输入 文本域 textarea 评论' },
  { cat: '组件', label: 'Select 下拉选择', path: '/components/select', kw: '下拉 选择 select 菜单 选项' },
  { cat: '组件', label: 'Field 字段包装', path: '/components/field', kw: '表单 字段 label 标签 校验 提示 外壳' },
  { cat: '组件', label: 'Tabs 标签页', path: '/components/tabs', kw: '标签页 tabs 分段 胶囊 切换 视图' },
  { cat: '组件', label: 'Switch 开关', path: '/components/switch', kw: '开关 switch 布尔 切换 设置' },
  { cat: '组件', label: 'Avatar 头像', path: '/components/avatar', kw: '头像 avatar 用户 图片' },
  { cat: '组件', label: 'AvatarGroup 头像组', path: '/components/avatar-group', kw: '头像组 团队 avatar 层叠 折叠' },
  { cat: '组件', label: 'Container 容器', path: '/components/container', kw: '容器 container 栅格 限宽 居中 宽度' },
  { cat: '组件', label: 'Section 区块', path: '/components/section', kw: '区块 section 眉题 标题 分节' },
  { cat: '组件', label: 'Card 卡片', path: '/components/card', kw: '卡片 card 粉彩 贴纸 容器' },
  { cat: '组件', label: 'Hero 首屏', path: '/components/hero', kw: '首屏 hero banner 大标题 第一印象' },
  { cat: '组件', label: 'Navbar 导航', path: '/components/navbar', kw: '导航 navbar header 菜单 吸顶' },
  { cat: '组件', label: 'Footer 页脚', path: '/components/footer', kw: '页脚 footer 链接 版权 社交' },
  { cat: '组件', label: 'SearchBox 搜索框', path: '/components/search-box', kw: '搜索框 search 搜索 三段 分类' },
  { cat: '组件', label: 'IconGrid 图标网格', path: '/components/icon-grid', kw: '图标网格 icon grid 浏览 复制' },
  { cat: '组件', label: 'FeatureGrid 特性', path: '/components/feature-grid', kw: '特性 feature 功能 三栏 亮点 介绍' },
  { cat: '组件', label: 'Statistic 指标', path: '/components/statistic', kw: '指标 statistic 数字 统计 滚动 计数' },
  { cat: '组件', label: 'LogoCloud 品牌墙', path: '/components/logo-cloud', kw: '品牌墙 logo 合作 客户 背书' },
  { cat: '组件', label: 'PricingCard 定价卡', path: '/components/pricing-card', kw: '定价 pricing 价格 会员 套餐 付费' },
  { cat: '组件', label: 'ComparisonTable 对比表', path: '/components/comparison-table', kw: '对比 comparison 表格 套餐 差异' },
  { cat: '组件', label: 'Faq 手风琴', path: '/components/faq', kw: '常见问题 faq 手风琴 问答 折叠 疑问' },
  { cat: '组件', label: 'Quote 评价', path: '/components/quote', kw: '评价 quote 引言 用户说 口碑' },
  { cat: '组件', label: 'ArticleCard 文章卡', path: '/components/article-card', kw: '文章 blog 博客 列表 卡片' },
  { cat: '组件', label: 'Article 文章内容', path: '/components/article', kw: '文章 内容 正文 长文 阅读 article' },
  { cat: '组件', label: 'ProfileCard 个人名片', path: '/components/profile-card', kw: '个人 名片 团队 介绍 profile 成员' },
  { cat: '组件', label: 'ExecCard 高管介绍卡', path: '/components/exec-card', kw: '高管 团队 管理 介绍 人物 executive' },
  { cat: '组件', label: 'Timeline 时间线', path: '/components/timeline', kw: '时间线 timeline 更新日志 里程碑 版本' },
  { cat: '组件', label: 'Cta 行动召唤', path: '/components/cta', kw: 'cta 行动召唤 转化 收尾 按钮' },
  { cat: '组件', label: 'Newsletter 订阅', path: '/components/newsletter', kw: '订阅 newsletter 邮件 订阅框' },
  { cat: '组件', label: 'Alert 公告', path: '/components/alert', kw: '公告 alert 提示 通告 横幅 警告' },
  { cat: '组件', label: 'Video 视频', path: '/components/video', kw: '视频 video 播放 画幅' },
  { cat: '组件', label: 'Audio 音频', path: '/components/audio', kw: '音频 audio 播客 播放 音乐' },
  { cat: '组件', label: 'Carousel 轮播', path: '/components/carousel', kw: '轮播 carousel 幻灯 滑动 自动' },
  { cat: '组件', label: 'ImageWall 图片墙', path: '/components/image-wall', kw: '图片墙 图集 网格 相册 wall 灯箱' },
  { cat: '组件', label: 'Waterfall 瀑布流', path: '/components/waterfall', kw: '瀑布流 waterfall 错落 多列 图片流 砌砖' },
  { cat: '组件', label: 'ImagePreview 图片预览', path: '/components/image-preview', kw: '图片预览 灯箱 lightbox 放大 全屏 预览' },
  { cat: '组件', label: 'Modal 弹出层', path: '/components/modal', kw: '弹窗 对话框 模态 dialog modal 弹出层' },
  { cat: '组件', label: 'Marquee 跑马灯', path: '/components/marquee', kw: '跑马灯 marquee 滚动 横幅 无限 循环' },
  { cat: '组件', label: 'BorderBeam 边框流光', path: '/components/border-beam', kw: '边框 流光 光边 描边 动效 beam' },
  { cat: '组件', label: 'ContactForm 留言表单', path: '/components/contact-form', kw: '留言 表单 联系 contact 合作' },
  { cat: '组件', label: 'CodeBlock 命令块', path: '/components/code-block', kw: '命令 code 终端 复制 安装 代码' },
  { cat: '组件', label: 'Markdown 渲染', path: '/components/markdown', kw: 'markdown md 渲染 文档 富文本 高亮' },
  { cat: '组件', label: 'MarkdownEditor 编辑器', path: '/components/markdown-editor', kw: 'markdown 编辑器 editor 写作 预览 工具栏' },
  { cat: '组件', label: 'ThemeToggle 主题切换', path: '/components/theme-toggle', kw: '主题 切换 暗色 dark 明暗' },
  { cat: '组件', label: 'ConfigProvider 主题配置', path: '/components/config-provider', kw: '配置 主题 provider 换肤 全局 换色' },
  { cat: '案例', label: '案例总览', path: '/cases/', kw: '案例 场景 模板 整页 示例 examples 全部' },
  { cat: '案例', label: '企业官网案例', path: '/cases/corporate', kw: '案例 官网 企业 营销页 landing 定价 hero 首页 公司' },
  { cat: '案例', label: '个人博客案例', path: '/cases/blog', kw: '案例 博客 博客首页 blog 文章 内容站 专栏 订阅' },
  { cat: '案例', label: '云笔记工作台案例', path: '/cases/notes', kw: '案例 笔记 工作台 应用 工具 cumubase 编辑 卡片 轻应用' },
]

function goSearch() {
  const cat = category.value || '全部'
  const pool = searchIndex.filter((it) => cat === '全部' || it.cat === cat)
  const q = query.value.trim().toLowerCase()
  if (!q) {
    window.location.href = '/components/overview'
    return
  }
  const terms = q.split(/\s+/)
  const hits = pool
    .map((it) => {
      const hay = `${it.label} ${it.kw}`.toLowerCase()
      return { it, score: terms.reduce((n, t) => n + (hay.includes(t) ? 1 : 0), 0) }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
  window.location.href = hits[0]?.it.path ?? '/components/overview'
}
</script>

<EvNavbar class="home-navbar" logo-text="Evoke UI" :items="[
  { label: '首页', href: '/' },
  { label: '快速开始', href: '/guide/getting-started' },
  { label: '组件', href: '/components/overview' },
  { label: '案例', href: '/cases/' },
]">
  <template #logo>
    <a href="/" class="home-brand">
      <span class="home-brand__name">Evoke UI</span>
      <EvTag size="small">v0.6.0</EvTag>
    </a>
  </template>
  <template #actions>
    <div class="home-family">
      <button type="button" class="ev-navbar__link home-family__trigger">
        官方库
        <EvIcon name="chevron-down" :size="14" class="home-family__caret" />
      </button>
      <div class="home-family__panel">
        <a class="home-family__item" href="https://evoke-business-ui.wil-works.com" target="_blank" rel="noopener">
          <span>中后台 UI 框架 · Business UI</span>
          <EvIcon name="external-link" :size="13" />
        </a>
        <a class="home-family__item" href="https://evoke-charts.wil-works.com" target="_blank" rel="noopener">
          <span>图表库 · Evoke Charts</span>
          <EvIcon name="external-link" :size="13" />
        </a>
      </div>
    </div>
    <EvThemeToggle />
    <EvIconButton icon="github" aria-label="GitHub" />
    <EvButton
      size="small"
      variant="soft"
      icon="download"
      href="https://www.npmjs.com/package/@wil-works/evoke-ui"
      target="_blank"
      rel="noopener"
    >下载</EvButton>
  </template>
  <template #default>
    <a class="ev-navbar__mobile-link" href="https://evoke-business-ui.wil-works.com" target="_blank" rel="noopener">中后台 UI 框架 · Business UI</a>
    <a class="ev-navbar__mobile-link" href="https://evoke-charts.wil-works.com" target="_blank" rel="noopener">图表库 · Evoke Charts</a>
  </template>
</EvNavbar>

<EvHero
  reveal
  title="官网的气质，从首屏开始"
  description="一套为官网与营销页而生的 Vue3 组件库：排版疏朗、动效轻盈，明暗双主题与运行时换色开箱即用。"
>
  <template #badge>
    <EvAlert pill>
      <span>v0.6.0 发布：新增 Slider 滑块，磨砂质感支持按组件调参数</span>
      <template #action>
        <a href="/guide/changelog" style="display:inline-flex; align-items:center; gap:2px;">更新记录<EvIcon name="arrow-right" :size="14" /></a>
      </template>
    </EvAlert>
  </template>
  <template #actions>
    <EvFeatureGrid
      variant="bullets"
      :items="[
        { icon: 'device-line', title: '杂志感的大标题' },
        { icon: 'compass-3-line', title: '疏朗的留白节奏' },
        { icon: 'flashlight-line', title: '灵动的微交互' },
      ]"
    />
  </template>
  <EvSearchBox
    v-model="query"
    v-model:category="category"
    large
    placeholder="搜索组件、文档或案例，回车直达…"
    :categories="['全部', '组件', '文档', '案例']"
    style="max-width:760px;"
    @keydown.enter="goSearch"
  >
    <template #suffix>
      <EvKeycap :keys="['⌘', 'K']" />
    </template>
  </EvSearchBox>
  <template #aside>
    <div class="home-collage">
      <EvCard tone="cream" sticker class="home-collage__card is-a">
        <div class="home-collage__label">运行时换色</div>
        <div class="home-collage__dots">
          <button
            v-for="c in swatches"
            :key="c.primary"
            class="home-collage__dot"
            :class="{ 'is-active': config.primary === c.primary }"
            :style="{ '--swatch': c.primary }"
            :aria-label="`换主色为 ${c.label}`"
            @click="pickPrimary(c.primary)"
          />
        </div>
      </EvCard>
      <EvCard tone="blue" sticker class="home-collage__card is-b">
        <EvStatistic value="59" label="个组件" animated />
        <div class="home-collage__meta">内置 960+ 图标 · MIT 开源</div>
      </EvCard>
      <EvCard tone="mint" sticker class="home-collage__card is-c">
        <label class="home-collage__theme">
          <EvSwitch :model-value="isDark" @update:model-value="toggleTheme()" />
          <span>明暗双主题</span>
        </label>
      </EvCard>
      <div class="home-collage__chip">
        <EvTag tone="primary" size="small">v0.6.0</EvTag>
        <EvTag size="small">Vue 3</EvTag>
      </div>
    </div>
  </template>
</EvHero>

<div class="home-band">
  <EvMarquee
    :items="['EVOKE UI', '为官网而生', '轻与快', '开箱即用', '明暗双主题', '即插即用']"
    separator="star-fill"
    :duration="20000"
    text-size="40px"
  />

  <EvSection eyebrow="playground" title="一键为品牌换装" description="点一个色板，整个页面——包括这套文档站——的主色会立刻跟着切换，这就是 EvConfigProvider 在做的事。" align="center">
    <div class="home-swatch-row">
      <button
        v-for="c in swatches"
        :key="c.primary"
        class="home-swatch"
        :class="{ 'is-active': config.primary === c.primary }"
        :style="{ '--swatch': c.primary }"
        @click="setPrimary(c.primary)"
      >
        <span class="home-swatch__dot" />
        {{ c.label }}
      </button>
      <EvButton size="small" variant="ghost" @click="reset">恢复默认</EvButton>
    </div>
    <div class="home-preview">
      <EvButton pill>立即开始</EvButton>
      <EvButton variant="soft">了解定价</EvButton>
      <EvTag tone="primary">运行时换色</EvTag>
      <EvSwitch :model-value="true" />
    </div>
  </EvSection>

  <EvSection eyebrow="components" title="官网需要的，这里都有" description="从首屏到页脚，企业官网与个人主页需要的版块，59 个组件基本都齐了。" align="center">
    <EvFeatureGrid
      variant="cards"
      :columns="3"
      :stagger="80"
      :items="[
        { icon: 'brush-line', title: '统一的设计语言', description: 'Clean Navy 设计基调：粉彩贴纸卡、藏青色软阴影与灵动的微交互，装进项目就能用。' },
        { icon: 'search', title: '标志性的大搜索框', description: '分类、输入、按钮三段一体，大圆角配藏青软阴影，放在首屏就是全页焦点。' },
        { icon: 'device-line', title: '响应式栅格', description: '特性卡、文章卡与图标网格全自适应，窄屏自动降列。' },
        { icon: 'star-fill', title: '转化组件', description: '定价卡、对比表、FAQ 与订阅框，产品介绍页的下半部分一次配齐。' },
        { icon: 'heart', title: '媒体与表单', description: '音视频、轮播与留言表单，个人站与企业站都用得上。' },
        { icon: 'flashlight-line', title: '轻量动效', description: 'v-reveal 滚动浮现、数字滚动与跑马灯，并自动跟随系统的减弱动效设置。' },
      ]"
    />
    <div class="home-links">
      <EvButton variant="outline" icon-right="arrow-right" href="/components/overview">浏览全部组件</EvButton>
    </div>
  </EvSection>

  <EvSection eyebrow="cases" title="整页案例，直接抄作业" description="官网、博客、笔记工作台——三个可交互的整页案例，源码就在文档里，拷走改文案就能用。" align="center">
    <div class="home-cases">
      <a class="home-case" href="/cases/corporate">
        <span class="home-case__icon"><EvIcon name="building-line" :size="22" /></span>
        <span class="home-case__title">企业官网</span>
        <span class="home-case__desc">从首屏到页脚的完整营销页，定价、对比表与 FAQ 一次配齐。</span>
        <span class="home-case__meta">14 个组件 · 整页</span>
      </a>
      <a class="home-case" href="/cases/blog">
        <span class="home-case__icon"><EvIcon name="article-line" :size="22" /></span>
        <span class="home-case__title">个人博客</span>
        <span class="home-case__desc">分类筛选的文章流、热榜轮播与订阅框，内容站的经典结构。</span>
        <span class="home-case__meta">10 个组件 · 可交互</span>
      </a>
      <a class="home-case" href="/cases/notes">
        <span class="home-case__icon"><EvIcon name="book-open-line" :size="22" /></span>
        <span class="home-case__title">云笔记工作台</span>
        <span class="home-case__desc">搜索、筛选、编辑与归档，用官网组件拼出一台轻应用。</span>
        <span class="home-case__meta">12 个组件 · 可交互</span>
      </a>
    </div>
    <div class="home-links">
      <EvButton variant="outline" icon-right="arrow-right" href="/cases/">查看全部案例</EvButton>
    </div>
  </EvSection>
</div>

<div class="home-sibling-band">
  <EvSection eyebrow="sibling" title="做中后台管理系统？" description="看看同族的姊妹库 Evoke Business UI：150+ 中后台组件、8 个业务场景组件与 20+ 种 Canvas 自绘图表，与 Evoke UI 同一设计血统。" align="center">
    <EvButton variant="outline" icon-right="arrow-right" href="https://evoke-business-ui.wil-works.com" target="_blank" rel="noopener">访问 Evoke Business UI 文档</EvButton>
  </EvSection>
</div>

<div class="home-stats-band">
  <div class="ev-container home-stats">
    <EvStatistic value="59" label="组件" align="center" animated />
    <EvStatistic value="960+" label="内置图标" align="center" animated />
    <EvStatistic value="4" label="主题维度" align="center" animated />
    <EvStatistic value="2" label="明暗主题" align="center" animated />
  </div>
</div>

<EvCta title="用 Evoke UI 搭你的下一个官网" description="免费开源，MIT 协议，npm install 即用。">
  <template #actions>
    <EvButton size="large" pill icon="download" href="/guide/getting-started">开始使用</EvButton>
    <EvButton size="large" pill variant="dark" icon="github" href="https://github.com">GitHub</EvButton>
  </template>
</EvCta>

<EvFooter
  soft
  logo-text="Evoke UI"
  slogan="轻盈优雅的 Vue3 官网组件库。"
  copyright="© 2026 willove · MIT"
  :columns="[
    { title: '文档', links: [{ label: '快速开始', href: '/guide/getting-started' }, { label: '设计语言', href: '/guide/design' }, { label: '主题定制', href: '/guide/customizer' }] },
    { title: '组件', links: [{ label: '组件总览', href: '/components/overview' }, { label: '站点区块', href: '/components/hero' }, { label: '媒体交互', href: '/components/video' }] },
    { title: '案例', links: [{ label: '企业官网', href: '/cases/corporate' }, { label: '个人博客', href: '/cases/blog' }, { label: '云笔记工作台', href: '/cases/notes' }] },
    { title: '更多', links: [{ label: 'GitHub', href: 'https://github.com' }, { label: 'Evoke Business UI', href: 'https://evoke-business-ui.wil-works.com' }, { label: '更新日志', href: '/components/timeline' }] },
  ]"
/>

<style>
.home-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--ev-text-primary);
}
.home-brand__name {
  font-size: 18px;
  font-weight: var(--ev-display-weight-strong);
  letter-spacing: var(--ev-display-letter-spacing);
}
.home-collage {
  position: relative;
  width: 360px;
}
.home-collage__card {
  box-shadow: var(--ev-shadow-3);
  animation: home-collage-float 7s ease-in-out infinite;
}
.home-collage__card.is-a {
  transform: rotate(-4deg);
}
.home-collage__card.is-b {
  transform: rotate(3deg) translate(-18px, -10px);
  animation-delay: -2.4s;
}
.home-collage__card.is-c {
  transform: rotate(-2deg) translate(14px, -8px);
  width: fit-content;
  animation-delay: -4.8s;
}
@media (prefers-reduced-motion: reduce) {
  .home-collage__card {
    animation: none;
  }
}
@keyframes home-collage-float {
  0%, 100% { translate: 0 0; }
  50% { translate: 0 -6px; }
}
.home-collage__label {
  margin-bottom: 12px;
  font-size: 12px;
  font-weight: var(--ev-font-weight-medium);
  letter-spacing: 0.06em;
  color: var(--ev-text-secondary);
}
.home-collage__dots {
  display: flex;
  gap: 10px;
}
.home-collage__dot {
  width: 22px;
  height: 22px;
  padding: 0;
  border: 2px solid rgba(255, 255, 255, 0.9);
  border-radius: var(--ev-radius-circle);
  background: var(--swatch);
  box-shadow: 0 1px 4px rgba(26, 41, 71, 0.2);
  cursor: pointer;
  transition: transform var(--ev-duration-base) var(--ev-ease-spring),
    box-shadow var(--ev-duration-fast) var(--ev-ease-in-out);
}
.home-collage__dot:hover {
  transform: scale(1.15);
}
.home-collage__dot.is-active {
  box-shadow: 0 0 0 2px var(--swatch);
  transform: scale(1.12);
}
.home-collage__meta {
  margin-top: 6px;
  font-size: 12px;
  color: var(--ev-text-secondary);
}
.home-collage__theme {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--ev-text-regular);
  cursor: pointer;
}
.home-collage__chip {
  position: absolute;
  top: -16px;
  right: -20px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border: 1px solid var(--ev-border-color-light);
  border-radius: var(--ev-radius-full);
  background: var(--ev-bg-container);
  box-shadow: var(--ev-shadow-2);
  transform: rotate(5deg);
}
.home-band {
  padding: 64px 0 40px;
}
/* 区块内容随容器令牌限宽，超宽屏不再无限拉伸 */
.home-band .ev-section {
  max-width: var(--ev-container-width, 1152px);
  margin-inline: auto;
}
.home-band .ev-marquee {
  margin-bottom: 96px;
}
.home-swatch-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-bottom: 32px;
}
.home-swatch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border: 1px solid var(--ev-border-color-light);
  border-radius: var(--ev-radius-full);
  background: var(--ev-bg-container);
  cursor: pointer;
  font-size: 13px;
  color: var(--ev-text-secondary);
  transition: border-color .2s, box-shadow .2s, color .2s;
}
.home-swatch:hover { border-color: var(--ev-border-color); color: var(--ev-text-primary); }
.home-swatch.is-active {
  border-color: var(--swatch);
  color: var(--ev-text-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--swatch) 25%, transparent);
}
.home-swatch__dot { width: 14px; height: 14px; border-radius: 50%; background: var(--swatch); }
.home-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 14px;
  padding: 40px 24px;
  border: 1px dashed var(--ev-border-color);
  border-radius: var(--ev-radius-lg);
  max-width: 620px;
  margin-inline: auto;
}
.home-links {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}
.home-sibling-band {
  padding: 8px 24px 72px;
}
.home-sibling-band .ev-section {
  max-width: var(--ev-container-width, 1152px);
  margin-inline: auto;
}
.home-cases {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 18px;
  max-width: 960px;
  margin-inline: auto;
}
.home-case {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 24px 22px;
  border: 1px solid var(--ev-border-color-light);
  border-radius: var(--ev-radius-lg);
  background: var(--ev-bg-container);
  text-align: left;
  transition: border-color var(--ev-duration-base) var(--ev-ease-in-out),
    box-shadow var(--ev-duration-base) var(--ev-ease-in-out),
    transform var(--ev-duration-base) var(--ev-ease-smooth);
}
.home-case:hover {
  border-color: var(--ev-color-primary-light-7);
  box-shadow: var(--ev-shadow-2);
  transform: translateY(-3px);
}
.home-case__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--ev-radius-md);
  background: var(--vp-c-brand-soft);
  color: var(--ev-color-primary);
}
.home-case__title {
  font-size: 16px;
  font-weight: var(--ev-font-weight-medium);
  color: var(--ev-text-primary);
}
.home-case__desc {
  font-size: 13px;
  line-height: 1.7;
  color: var(--ev-text-secondary);
}
.home-case__meta {
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--ev-text-secondary);
}
.home-stats-band {
  padding: 88px 0;
  border-top: 1px solid var(--ev-border-color-light);
  border-bottom: 1px solid var(--ev-border-color-light);
  background-color: var(--ev-bg-muted);
}
.home-stats {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 32px;
}
/* 顶栏「官方库」下拉：hover / focus 展开，面板走卡片令牌（使用方自行叠加的动效） */
.home-family {
  position: relative;
  display: flex;
  align-items: center;
}
.home-family__trigger {
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
}
.home-family__caret {
  transition: transform var(--ev-duration-base) var(--ev-ease-in-out);
}
.home-family:hover .home-family__caret,
.home-family:focus-within .home-family__caret {
  transform: rotate(180deg);
}
.home-family__panel {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 60;
  min-width: 250px;
  padding: 5px;
  background: var(--ev-bg-container);
  border: 1px solid var(--ev-border-color);
  border-radius: var(--ev-radius-md);
  box-shadow: var(--ev-shadow-2);
  opacity: 0;
  visibility: hidden;
  transform: translateY(6px);
  transition: opacity 0.18s var(--ev-ease-in-out), transform 0.18s var(--ev-ease-in-out), visibility 0.18s;
}
.home-family__panel::before {
  content: '';
  position: absolute;
  top: -16px;
  right: 0;
  left: 0;
  height: 16px;
}
.home-family:hover .home-family__panel,
.home-family:focus-within .home-family__panel {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}
.home-family__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--ev-radius-sm);
  font-size: var(--ev-font-size-base);
  color: var(--ev-text-regular);
  white-space: nowrap;
}
.home-family__item:hover {
  background: var(--ev-bg-hover);
  color: var(--ev-text-primary);
}
</style>
