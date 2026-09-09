# 案例

组件文档讲的是「单个组件怎么用」，本分区讲的是「整页怎么拼」。每个案例都是一份
完整的页面级模板：真实文案、真实数据结构，源码就是案例页里的那段 `<script setup>`
与模板，直接拷走、替换文案，就是一个可上线的起点。

## 在线案例

<a class="case-card" href="/cases/corporate">
  <span class="case-card__icon"><EwIcon name="building-line" :size="22" /></span>
  <span class="case-card__body">
    <span class="case-card__title">企业官网<EwTag size="small" tone="primary">14 个组件</EwTag></span>
    <span class="case-card__desc">从 Hero 到 Footer 的完整营销页：品牌墙、特性栅格、指标带、定价、对比表、FAQ、客户评价与 CTA。</span>
  </span>
  <EwIcon class="case-card__arrow" name="arrow-right" :size="16" />
</a>

<a class="case-card" href="/cases/blog">
  <span class="case-card__icon"><EwIcon name="article-line" :size="22" /></span>
  <span class="case-card__body">
    <span class="case-card__title">个人博客<EwTag size="small" tone="primary">10 个组件</EwTag></span>
    <span class="case-card__desc">内容站的经典结构：分类筛选的文章流、热榜轮播、作者名片、更新时间线与邮件订阅。</span>
  </span>
  <EwIcon class="case-card__arrow" name="arrow-right" :size="16" />
</a>

<a class="case-card" href="/cases/notes">
  <span class="case-card__icon"><EwIcon name="book-open-line" :size="22" /></span>
  <span class="case-card__body">
    <span class="case-card__title">云笔记工作台<EwTag size="small" tone="primary">12 个组件</EwTag></span>
    <span class="case-card__desc">用官网组件拼出的轻应用：搜索过滤、分类切换、笔记卡片、编辑面板、收藏与归档，全交互可玩。</span>
  </span>
  <EwIcon class="case-card__arrow" name="arrow-right" :size="16" />
</a>

## 怎么用这些案例

1. **在线浏览**：每个案例页的顶部就是跑在「浏览器舞台」里的整页预览，可以点击、筛选、编辑，明暗主题切换全局生效。
2. **拷贝源码**：案例页的 `.md` 文件（`docs-web/cases/`）就是完整源码，模板 + 数据 + 样式在一个文件里，没有隐藏依赖。
3. **对照组件文档改**：换文案、换数据只动 `<script setup>` 里的数组；某个组件的完整 Props 与插槽，回[组件总览](/components/overview)查。

## 场景路线图

| 场景 | 案例规划 | 状态 |
| --- | --- | --- |
| 企业官网 / 产品营销页 | [企业官网](/cases/corporate) | 已上线 |
| 内容站 / 个人博客 | [个人博客](/cases/blog) | 已上线 |
| 轻应用 / 工具型界面 | [云笔记工作台](/cases/notes) | 已上线 |
| 活动落地页 | 发布会、限时活动的单屏转化页 | 规划中 |
| 作品集主页 | 设计师 / 摄影师的作品陈列 | 规划中 |

有想看的场景，欢迎在仓库提 issue。

## 搭建心法

三个案例拆开看，套路是一致的：

- **版块化思维**：页面 = 一串版块。`EwSection` 的眉题 + 标题 + 描述三件套统一了每个版块的开头节奏，版块之间的留白交给组件自己。
- **数据进数组**：文案、卡片、FAQ、定价方案全部收进 `<script setup>` 的数组，模板只留一个 `v-for`。改版就是改数据，不是改结构。
- **动效节制**：`EwHero` 的 `reveal` 入场、`EwFeatureGrid` 的 `stagger` 交错、至多一处 `EwCarousel` 或 `EwMarquee`——整页有两处动效记忆点就足够，多了就吵。
