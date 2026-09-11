# 案例：企业官网

企业官网是 Evoke UI 最典型的场景：首屏讲清价值，中段给出证据（品牌墙、特性、指标），
下半段完成转化（定价、对比、FAQ、CTA）。本案例用 14 个组件拼出一份完整的营销页，
案例以积云数合为演示品牌，文案为演示内容；源码就在本页，可以直接拷走改文案。

**用到的组件**：[EvAlert](/components/alert) · [EvNavbar](/components/navbar) · [EvHero](/components/hero) · [EvLogoCloud](/components/logo-cloud) · [EvSection](/components/section) · [EvFeatureGrid](/components/feature-grid) · [EvStatistic](/components/statistic) · [EvCard](/components/card) · [EvPricingCard](/components/pricing-card) · [EvComparisonTable](/components/comparison-table) · [EvFaq](/components/faq) · [EvQuote](/components/quote) · [EvCta](/components/cta) · [EvFooter](/components/footer)

<script setup>
import CaseStage from '../.vitepress/theme/CaseStage.vue'
import CorporateSite from '../.vitepress/theme/case-sites/CorporateSite.vue'
</script>

<CaseStage url="www.cumubase.cn" live-url="/cases/live/corporate">
  <CorporateSite />
</CaseStage>

## 搭建要点

- **公告条放在导航之上**：`EvAlert` 去圆角贴顶（`border-radius:0`），发布新产品、限时活动时把它换回来就行。
- **首屏只做两件事**：一句话价值主张 + 一个主按钮。徽章（`#badge` 插槽）用胶囊公告引流到更新说明，右栏（`#aside` 插槽）放一张产品示意卡，比放抽象插画更有说服力。
- **信任背书紧贴首屏**：`EvLogoCloud` 用文字型品牌墙即可，真实客户名比 logo 图片更早可用。
- **指标带是节奏器**：特性区与定价区之间垫一条 `case-band`（淡雾底 + 上下细线），四枚 `EvStatistic` 开 `animated` 滚动计数，长页面在这里换口气。
- **定价区「卡片 + 对比表」成对出现**：`EvPricingCard` 三连讲卖点，`EvComparisonTable` 讲差异——`values` 与 `columns` 按下标对齐，布尔值自动渲染成对勾与横线。
- **CTA 收尾务必干脆**：一句行动号召 + 两个按钮，别在页尾再塞新信息。

## 关键代码

首屏的骨架，其实就是导航、Hero 与右栏示意卡：

```vue
<EvNavbar :items="nav" :sticky="false" logo-text="积云数合">
  <template #actions>
    <EvThemeToggle />
    <EvButton size="small" variant="soft">登录</EvButton>
    <EvButton size="small" pill icon-right="arrow-right" href="#pricing">免费试用</EvButton>
  </template>
</EvNavbar>

<EvHero reveal title="让数据安静地工作" description="…">
  <template #actions>
    <EvButton size="large" pill icon-right="arrow-right" href="#pricing">免费试用</EvButton>
    <EvButton size="large" variant="outline" href="#features">了解产品</EvButton>
  </template>
  <template #aside>
    <!-- 一张 EvCard 画「产品截图」：标题 + 迷你柱状 + 两枚指标 -->
  </template>
</EvHero>
```

定价区直接把方案数据 `v-bind` 给卡片，文案与结构分离：

```vue
<EvPricingCard
  v-for="p in plans"
  :key="p.title"
  v-bind="p"
  @action="onPlanAction"
/>
```
