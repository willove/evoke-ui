# 组件总览

Evoke UI 共内置 **48 个组件**，按用途分为六组：基础元件、布局骨架、站点区块、媒体与交互、
反馈与主题、移动端专属。每个组件卡片右上角带**平台兼容标识**：

<span class="ov-legend"><ew-icon name="desktop" :size="13" /><ew-icon name="smartphone" :size="13" /> 双端兼容</span>
<span class="ov-legend"><ew-icon name="desktop" :size="13" /> 仅桌面保证样式</span>
<span class="ov-legend"><ew-icon name="smartphone" :size="13" /> 移动端专属（文档在移动端板块）</span>

移动端适配范式与桌面 → 移动的重排手法见[移动端适配](/mobile/)板块。

<script setup>
const groups = [
  {
    name: '基础',
    items: [
      { name: 'Icon', cn: '图标', desc: '核心语义集 + 900+ 展示集，点击复制图标名', path: '/components/icon', platform: 'both' },
      { name: 'Button', cn: '按钮', desc: '五种强调层级，pill 胶囊形态', path: '/components/button', platform: 'both' },
      { name: 'IconButton', cn: '图标按钮', desc: '只有图标的紧凑按钮，hover 浮现底色', path: '/components/icon-button', platform: 'both' },
      { name: 'Tag', cn: '标签', desc: '胶囊轻标签，附促销色调', path: '/components/tag', platform: 'both' },
      { name: 'Badge', cn: '徽标', desc: '角标计数，99+ 折叠与圆点形态', path: '/components/badge', platform: 'both' },
      { name: 'Keycap', cn: '键帽', desc: '键盘快捷键的键帽视觉', path: '/components/keycap', platform: 'both' },
      { name: 'Input', cn: '输入框', desc: '前缀图标、一键清空与错误态', path: '/components/input', platform: 'both' },
      { name: 'Textarea', cn: '多行输入', desc: '行数控制与字数计数', path: '/components/textarea', platform: 'both' },
      { name: 'Select', cn: '下拉选择', desc: '自定义菜单替代原生 select', path: '/components/select', platform: 'both' },
      { name: 'Field', cn: '字段包装', desc: '标签 + 控件 + 提示的表单外壳', path: '/components/field', platform: 'both' },
      { name: 'Tabs', cn: '标签页', desc: '分段胶囊与下划线两种页签，窄屏可横滚', path: '/components/tabs', platform: 'both' },
      { name: 'Switch', cn: '开关', desc: '二元状态开关，spring 滑块', path: '/components/switch', platform: 'both' },
      { name: 'Avatar', cn: '头像', desc: '缺图时自动回退姓名首字', path: '/components/avatar', platform: 'both' },
      { name: 'AvatarGroup', cn: '头像组', desc: '头像层叠与 +N 折叠', path: '/components/avatar-group', platform: 'both' },
    ],
  },
  {
    name: '布局',
    items: [
      { name: 'Container', cn: '容器', desc: '居中限宽的栅格基座，四档宽度', path: '/components/container', platform: 'both' },
      { name: 'Section', cn: '区块', desc: '大写眉题 + 展示标题的区块头', path: '/components/section', platform: 'both' },
      { name: 'Card', cn: '卡片', desc: '粉彩、贴纸、深色渐变三种卡面', path: '/components/card', platform: 'both' },
      { name: 'Hero', cn: '首屏', desc: '淡蓝灰光带上的第一印象', path: '/components/hero', platform: 'desktop' },
      { name: 'Navbar', cn: '导航', desc: '吸顶磨砂导航，移动端折叠', path: '/components/navbar', platform: 'both' },
      { name: 'Footer', cn: '页脚', desc: '品牌区 + 多栏链接 + 版权条', path: '/components/footer', platform: 'desktop' },
    ],
  },
  {
    name: '站点区块',
    items: [
      { name: 'SearchBox', cn: '搜索框', desc: '分类/输入/动作三段一体的大搜索框', path: '/components/search-box', platform: 'both' },
      { name: 'IconGrid', cn: '图标网格', desc: '分类分节的致密图标网格', path: '/components/icon-grid', platform: 'desktop' },
      { name: 'FeatureGrid', cn: '特性', desc: 'bullets 特性条与三栏特性卡', path: '/components/feature-grid', platform: 'desktop' },
      { name: 'Statistic', cn: '指标', desc: '强字重数字，支持入视口滚动', path: '/components/statistic', platform: 'both' },
      { name: 'LogoCloud', cn: '品牌墙', desc: '弱化字标的信任背书位', path: '/components/logo-cloud', platform: 'desktop' },
      { name: 'PricingCard', cn: '定价卡', desc: '完整定价要素的转化卡', path: '/components/pricing-card', platform: 'desktop' },
      { name: 'ComparisonTable', cn: '对比表', desc: '多档位功能差异对照', path: '/components/comparison-table', platform: 'desktop' },
      { name: 'Faq', cn: '手风琴', desc: '平滑展开的常见问题', path: '/components/faq', platform: 'desktop' },
      { name: 'Quote', cn: '评价', desc: '引号装饰的用户评价', path: '/components/quote', platform: 'both' },
      { name: 'ArticleCard', cn: '文章卡', desc: '封面 + 摘要的博客条目', path: '/components/article-card', platform: 'desktop' },
      { name: 'ProfileCard', cn: '个人名片', desc: '团队墙与自我介绍位', path: '/components/profile-card', platform: 'desktop' },
      { name: 'Timeline', cn: '时间线', desc: '更新日志与里程碑', path: '/components/timeline', platform: 'both' },
      { name: 'Cta', cn: '行动召唤', desc: '页面收尾的转化区', path: '/components/cta', platform: 'desktop' },
      { name: 'Newsletter', cn: '订阅', desc: '一体式邮箱订阅框', path: '/components/newsletter', platform: 'desktop' },
      { name: 'Alert', cn: '公告', desc: '胶囊通告横幅与状态提示卡', path: '/components/alert', platform: 'both' },
    ],
  },
  {
    name: '媒体与交互',
    items: [
      { name: 'Video', cn: '视频', desc: '固定画幅承载视频与 iframe', path: '/components/video', platform: 'desktop' },
      { name: 'Audio', cn: '音频', desc: '胶囊卡片式播放器', path: '/components/audio', platform: 'desktop' },
      { name: 'Carousel', cn: '轮播', desc: '自动轮播，hover 暂停', path: '/components/carousel', platform: 'desktop' },
      { name: 'Marquee', cn: '跑马灯', desc: '无限循环的大字横幅', path: '/components/marquee', platform: 'desktop' },
      { name: 'ContactForm', cn: '留言表单', desc: '联系我们三字段表单', path: '/components/contact-form', platform: 'desktop' },
    ],
  },
  {
    name: '反馈与主题',
    items: [
      { name: 'CodeBlock', cn: '命令块', desc: '深色终端形态，一键复制', path: '/components/code-block', platform: 'desktop' },
      { name: 'ThemeToggle', cn: '主题切换', desc: '明暗切换按钮', path: '/components/theme-toggle', platform: 'both' },
      { name: 'ConfigProvider', cn: '主题配置', desc: '运行时换色/圆角/间距/容器宽', path: '/components/config-provider', platform: 'both' },
    ],
  },
  {
    name: '移动端专属',
    items: [
      { name: 'PullRefresh', cn: '下拉刷新', desc: '内容流顶部下拉刷新，对齐原生手感', path: '/mobile/components/pull-refresh', platform: 'mobile' },
      { name: 'LoadMore', cn: '加载更多', desc: '列表尾部点击/触底自动加载', path: '/mobile/components/load-more', platform: 'mobile' },
      { name: 'ActionSheet', cn: '动作面板', desc: '底部滑入的对象操作菜单', path: '/mobile/components/action-sheet', platform: 'mobile' },
      { name: 'NavBar', cn: '页头', desc: '返回 + 标题 + 动作的 H5 页面头部', path: '/mobile/components/nav-bar', platform: 'mobile' },
      { name: 'Tabbar', cn: '底部标签栏', desc: 'H5 一级导航吸底，安全区内置', path: '/mobile/components/tabbar', platform: 'mobile' },
    ],
  },
]
</script>

<div v-for="g in groups" :key="g.name" class="ov-group">
  <h2 class="ov-group__name">{{ g.name }}</h2>
  <div class="ov-grid">
    <a v-for="it in g.items" :key="it.name" class="ov-item" :href="it.path">
      <span class="ov-item__row">
        <span class="ov-item__name">{{ it.name }}<em>{{ it.cn }}</em></span>
        <span class="ov-item__plat" :class="`is-${it.platform}`">
          <ew-icon v-if="it.platform !== 'mobile'" name="desktop" :size="13" />
          <ew-icon v-if="it.platform !== 'desktop'" name="smartphone" :size="13" />
          <i>{{ it.platform === 'both' ? '双端' : it.platform === 'mobile' ? '移动' : '桌面' }}</i>
        </span>
      </span>
      <span class="ov-item__desc">{{ it.desc }}</span>
    </a>
  </div>
</div>

## 想看整页效果？

单个组件之外，[案例](/cases/)分区用这些组件拼了三个完整页面——[企业官网](/cases/corporate)、
[个人博客](/cases/blog)与[云笔记工作台](/cases/notes)，整页可交互，源码可直接拷走作为起点。

<style>
.ov-legend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-right: 16px;
  padding: 3px 10px;
  border: 1px solid var(--ew-border-color-light);
  border-radius: var(--ew-radius-full);
  background: var(--ew-bg-soft);
  font-size: 12px;
  color: var(--ew-text-secondary);
}
.ov-group {
  margin-top: 32px;
}
.ov-group h2.ov-group__name {
  margin: 0 0 14px;
  padding-top: 0;
  border-top: none;
  font-size: 20px;
  font-weight: var(--ew-display-weight);
  letter-spacing: var(--ew-display-letter-spacing);
}
.ov-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 12px;
}
.ov-grid .ov-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border: 1px solid var(--ew-border-color-light);
  border-radius: var(--ew-radius-md);
  background: var(--ew-bg-container);
  color: var(--ew-text-primary);
  text-decoration: none;
  transition: border-color var(--ew-duration-base) var(--ew-ease-in-out),
    transform var(--ew-duration-base) var(--ew-ease-smooth),
    box-shadow var(--ew-duration-base) var(--ew-ease-in-out);
}
.ov-grid .ov-item:hover {
  border-color: var(--ew-color-primary-light-7);
  text-decoration: none;
  transform: translateY(-2px);
  box-shadow: var(--ew-shadow-2);
}
.ov-item__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.ov-grid .ov-item__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ew-text-primary);
}
.ov-grid .ov-item__name em {
  margin-left: 8px;
  font-style: normal;
  font-weight: 400;
  color: var(--ew-text-secondary);
}
.ov-item__plat {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex: none;
}
.ov-item__plat svg {
  display: block;
}
.ov-item__plat i {
  margin-left: 4px;
  font-style: normal;
  font-size: 11px;
  line-height: 1;
  color: var(--ew-text-secondary);
}
.ov-item__plat.is-both,
.ov-item__plat.is-mobile {
  color: var(--ew-color-primary);
}
.ov-item__plat.is-desktop {
  color: var(--ew-text-secondary);
}
.ov-grid .ov-item__desc {
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--ew-text-secondary);
}
</style>
