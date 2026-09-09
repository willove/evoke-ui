<script setup>
/**
 * BlogSite — 案例「山月札记」个人博客的站点内容
 * 同一份源码用于案例文档页的缩放舞台（CaseStage 内）
 * 与独立全屏窗口（/cases/live/blog，传 sticky 开启导航吸顶）
 */
import { ref, computed } from 'vue'

const props = defineProps({
  /** 导航是否吸顶（独立窗口下开启） */
  sticky: { type: Boolean, default: false },
})

const nav = [
  { label: '文章', href: '#articles' },
  { label: '热榜', href: '#hot' },
  { label: '关于', href: '#about' },
]

const categories = ['全部', '前端', '设计', '随想']
const active = ref('全部')

const posts = [
  { title: '把一个官网拆成 43 个组件的取舍', excerpt: '组件粒度、插槽设计与令牌边界——一次开源组件库 API 设计的完整复盘。', date: '2026-08-30', tags: ['组件设计'], category: '前端', icon: 'code-line' },
  { title: 'Vue3 指令的工程化实践：以 v-reveal 为例', excerpt: '一个滚动浮现指令，值得写一篇长文：观察器复用、减弱动效与 SSR 兜底。', date: '2026-08-12', tags: ['动效'], category: '前端', icon: 'flashlight-line' },
  { title: '给博客配明暗主题的正确姿势', excerpt: 'CSS 变量重映射 + html.dark 一键切换，一篇讲透双主题的落地方式。', date: '2026-07-30', tags: ['主题'], category: '前端', icon: 'device-line' },
  { title: '留白是内容的一部分', excerpt: '排版节奏、字重层级与 8px 网格，在长文页面里的具体用法。', date: '2026-07-28', tags: ['排版'], category: '设计', icon: 'brush-line' },
  { title: '从 Clean Navy 谈起：一套克制的配色系统', excerpt: '藏青、粉彩与雾面质感如何共处，以及为什么语义色只需要五种。', date: '2026-07-02', tags: ['配色'], category: '设计', icon: 'compass-3-line' },
  { title: '山中来信：关于慢生活的一次实验', excerpt: '在山里住满三十天之后，我对「效率」这个词有了新的理解。', date: '2026-06-18', tags: ['生活'], category: '随想', icon: 'flower-line' },
  { title: '咖啡馆写作工具清单（2026 版）', excerpt: '从离线编辑器到噪音耳机，十件让我在咖啡馆写完这本书的东西。', date: '2026-05-11', tags: ['效率'], category: '随想', icon: 'cup-line' },
]

const filtered = computed(() =>
  active.value === '全部' ? posts : posts.filter((p) => p.category === active.value)
)

const hot = [
  { quote: '组件文档写得像散文一样克制，抄完首页我就把公司的官网重构了。', author: '一位不愿透露姓名的前端', role: '来自读者来信' },
  { quote: '「留白是内容的一部分」这篇转给了整个设计组，本周例会的议题。', author: '阿澜', role: '视觉设计师' },
  { quote: '每篇都短，但每篇都有可以立刻用上的东西。', author: '何声', role: '独立开发者' },
]

const updates = [
  { date: '2026-08-30', title: '《把一个官网拆成 43 个组件的取舍》发布' },
  { date: '2026-08-12', title: '「动效」专栏开更，第一篇讲 v-reveal' },
  { date: '2026-07-02', tag: '设计', tagTone: 'orange', title: 'Clean Navy 配色系统长文完稿' },
]
</script>

<template>
  <div class="case-site">
    <EwNavbar :items="nav" :sticky="sticky" logo-text="山月札记">
      <template #actions>
        <EwThemeToggle />
        <EwIconButton icon="search" aria-label="搜索" />
        <EwButton size="small" variant="soft" icon="mail" href="#about">订阅</EwButton>
      </template>
    </EwNavbar>

    <EwSection align="center" gap="0" style="padding:64px 0 8px;">
      <p class="cb-motto">写下来，才算想清楚。</p>
      <p class="cb-sub">关于前端、设计与慢生活的个人札记，每周更新一至两篇。</p>
      <div class="cb-filter">
        <EwTabs v-model="active" :items="categories.map((c) => ({ label: c, value: c }))" />
        <span class="cb-count">{{ filtered.length }} 篇</span>
      </div>
    </EwSection>

    <EwSection id="articles" gap="0">
      <div class="cb-grid">
        <EwArticleCard
          v-for="p in filtered"
          :key="p.title"
          tag="a"
          href="#"
          :title="p.title"
          :excerpt="p.excerpt"
          :date="p.date"
          :tags="p.tags"
          :icon="p.icon"
        />
      </div>
      <p v-if="!filtered.length" class="cb-empty">这个分类下还没有文章。</p>
    </EwSection>

    <div class="case-band">
      <EwSection id="hot" eyebrow="热榜" title="读者转得最多的三段话" align="center">
        <div class="cb-hot">
          <EwCarousel :items="hot" :autoplay="5000">
            <template #item="{ item }">
              <EwQuote :quote="item.quote" :author="item.author" :role="item.role" />
            </template>
          </EwCarousel>
        </div>
      </EwSection>
    </div>

    <EwSection id="about" eyebrow="关于作者" title="白天写代码，晚上写札记" align="center">
      <div class="cb-about">
        <EwProfileCard
          name="陈山月"
          role="独立开发者 · 前端工程"
          bio="正在写一本关于组件设计的小书。相信好的工具应该安静，好的文字应该诚实。"
        >
          <template #stats>
            <div class="cb-stats">
              <span><strong>126</strong>篇文章</span>
              <span><strong>8</strong>个专栏</span>
              <span><strong>1.2w</strong>订阅</span>
            </div>
          </template>
          <template #social>
            <EwIconButton icon="github" aria-label="GitHub" />
            <EwIconButton icon="x" aria-label="X" />
            <EwIconButton icon="mail" aria-label="邮箱" />
          </template>
        </EwProfileCard>
        <EwCard tone="soft" class="cb-updates">
          <p class="cb-updates__title">最近更新</p>
          <EwTimeline :items="updates" />
          <div class="cb-subscribe">
            <p class="cb-subscribe__title">每周精选，直接进邮箱</p>
            <EwNewsletter placeholder="你的邮箱" button-text="订阅" />
          </div>
        </EwCard>
      </div>
    </EwSection>

    <EwFooter
      soft
      logo-text="山月札记"
      slogan="写下来，才算想清楚。"
      copyright="© 2026 陈山月"
      :columns="[
        { title: '内容', links: [{ label: '全部文章', href: '#articles' }, { label: '热榜', href: '#hot' }, { label: '关于作者', href: '#about' }] },
        { title: '订阅', links: [{ label: '邮件订阅', href: '#about' }, { label: 'RSS', href: '#' }] },
        { title: '友链', links: [{ label: 'Evoke UI', href: '/' }, { label: '拾贝科技', href: '#' }] },
      ]"
    />
  </div>
</template>

<style scoped>
.cb-motto {
  margin: 0;
  font-size: 34px;
  font-weight: var(--ew-display-weight);
  letter-spacing: var(--ew-display-letter-spacing);
  color: var(--ew-text-primary);
}
.cb-sub {
  margin: 12px 0 0;
  font-size: 15px;
  color: var(--ew-text-secondary);
}
.cb-filter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 24px;
}
.cb-count {
  font-size: 13px;
  color: var(--ew-text-secondary);
}
.cb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 18px;
  max-width: 1040px;
  margin-inline: auto;
}
.cb-empty {
  margin: 0;
  padding: 48px 0;
  text-align: center;
  font-size: 14px;
  color: var(--ew-text-secondary);
}
.cb-hot {
  max-width: 720px;
  margin-inline: auto;
}
.cb-about {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  max-width: 880px;
  margin-inline: auto;
  align-items: start;
}
.cb-stats {
  display: flex;
  justify-content: center;
  gap: 20px;
  font-size: 13px;
  color: var(--ew-text-secondary);
}
.cb-stats strong {
  margin-right: 4px;
  font-size: 18px;
  font-weight: var(--ew-display-weight-strong);
  color: var(--ew-text-primary);
}
.cb-updates__title {
  margin: 0 0 14px;
  font-size: 13px;
  font-weight: var(--ew-font-weight-medium);
  letter-spacing: 0.06em;
  color: var(--ew-text-secondary);
}
.cb-subscribe {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px dashed var(--ew-border-color);
}
.cb-subscribe__title {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: var(--ew-font-weight-medium);
  color: var(--ew-text-regular);
}
</style>
