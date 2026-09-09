<script setup>
/**
 * CorporateSite — 案例「云澈科技」企业官网的站点内容
 * 同一份源码用于两处：案例文档页的缩放舞台（CaseStage 内）
 * 与独立全屏窗口（/cases/live/corporate，传 sticky 开启导航吸顶）
 */
import { ref } from 'vue'

const props = defineProps({
  /** 导航是否吸顶（独立窗口下开启） */
  sticky: { type: Boolean, default: false },
})

const nav = [
  { label: '产品', href: '#features' },
  { label: '定价', href: '#pricing' },
  { label: '常见问题', href: '#faq' },
  { label: '博客', href: '#' },
]

const features = [
  { icon: 'database-2-line', title: '实时数据同步', description: '主流数据库与 SaaS 应用即插即用，增量同步延迟低至毫秒级，不必再等隔夜报表。' },
  { icon: 'bar-chart-box-line', title: '自助式分析', description: '业务同学拖拽即可完成透视与归因，常用看板保存成模板，一键共享给团队。' },
  { icon: 'brush-line', title: '可视化大屏', description: '为展厅与值班场景设计的投屏模板，字号、刷新频率与配色都为远距离阅读调校。' },
  { icon: 'alarm-line', title: '智能告警', description: '阈值、同环比与异常波动三套规则，告警只发一次，相关的噪声自动静默。' },
  { icon: 'code-line', title: '开放 API', description: '同步、查询、告警全部提供 REST 与 SDK，把数据能力嵌进自己的系统只需要一个下午。' },
  { icon: 'earth-line', title: '多地域部署', description: '数据驻留与合规策略按地域配置，跨境团队共享同一份指标口径。' },
]

const clients = ['栖云智造', '白泽数据', '拾贝科技', '南杉资本', '临港工场', '远山出行', '青梧网络', 'DeepRoot']

const bars = [42, 66, 51, 78, 60, 92, 74, 84]

const plans = [
  {
    title: '免费版',
    description: '个人与小型试点，够用再升级。',
    price: '¥0',
    features: ['3 个数据源', '每月 10 万行同步', '社区支持'],
    actionText: '免费开始',
  },
  {
    title: '团队版',
    description: '为增长期团队准备的完整能力。',
    price: '¥299',
    badge: '最受欢迎',
    features: ['数据源不限', '每月 5,000 万行同步', '实时协同与细粒度权限', '工单支持 24 小时响应'],
    actionText: '开始 14 天试用',
  },
  {
    title: '企业版',
    description: '私有化部署与专属服务。',
    price: '定制',
    features: ['私有化部署', 'SSO 与操作审计', 'SLA 99.99%', '专属客户成功经理'],
    actionText: '联系销售',
  },
]

const columns = [
  { label: '免费版' },
  { label: '团队版', note: '推荐', featured: true },
  { label: '企业版' },
]

const rows = [
  { label: '数据源数量', values: ['3 个', '不限', '不限'] },
  { label: '每月同步行数', values: ['10 万', '5,000 万', '不限'] },
  { label: '实时协同看板', values: [false, true, true] },
  { label: '权限与审计', values: ['基础', '高级', 'SSO + 审计日志'] },
  { label: '私有化部署', values: [false, false, true] },
  { label: '支持响应', values: ['社区', '工单 24h', '专属客户成功'] },
]

const faqs = [
  { question: '数据存在哪里？', answer: '默认存储在所选地域的托管集群，传输与落盘全程加密；企业版可私有化部署到自有机房或专有云。' },
  { question: '可以先用再买吗？', answer: '团队版提供 14 天全功能试用，不需要绑定信用卡，到期后自动降级为免费版，数据保留 90 天。' },
  { question: '如何计费？', answer: '按席位与同步量计费，月付与年付两种方式，年付八折；超出配额的部分按量计费，不会中途停服。' },
  { question: '支持哪些数据源？', answer: '主流关系型数据库、数仓与 60+ SaaS 应用开箱即连；其余来源可以通过开放 API 或自定义连接器接入。' },
  { question: '迁移成本高吗？', answer: '提供从常见 BI 与报表工具的一键迁移脚本，多数团队在一个下午内完成第一份数据的接入与校验。' },
]
</script>

<template>
  <div class="case-site">
    <EwAlert icon="bell-line" closable style="border-radius:0;border-inline:none;border-top:none;">
      CloudSure 3.0 发布：查询引擎全面提速，老用户升级后平均查询耗时下降 68%。
      <template #action>
        <a href="#features" style="display:inline-flex;align-items:center;gap:2px;">看看更新<EwIcon name="arrow-right" :size="14" /></a>
      </template>
    </EwAlert>

    <EwNavbar :items="nav" :sticky="sticky" logo-text="云澈科技">
      <template #actions>
        <EwThemeToggle />
        <EwButton size="small" variant="soft">登录</EwButton>
        <EwButton size="small" pill icon-right="arrow-right" href="#pricing">免费试用</EwButton>
      </template>
    </EwNavbar>

    <EwHero
      reveal
      title="让数据安静地工作"
      description="云澈数据云把采集、同步与分析装进同一个工作台：连接数据源只要五分钟，剩下的时间留给业务判断。"
    >
      <template #badge>
        <EwAlert pill icon="flashlight-line">
          <span>CloudSure 3.0 正式发布</span>
          <template #action>
            <a href="#features" style="display:inline-flex;align-items:center;gap:2px;">查看<EwIcon name="arrow-right" :size="14" /></a>
          </template>
        </EwAlert>
      </template>
      <template #actions>
        <EwButton size="large" pill icon-right="arrow-right" href="#pricing">免费试用</EwButton>
        <EwButton size="large" variant="outline" href="#features">了解产品</EwButton>
      </template>
      <template #aside>
        <div class="cs-shot">
          <EwCard class="cs-shot__main">
            <div class="cs-shot__head">
              <span class="cs-shot__title">营收总览</span>
              <EwTag tone="success" size="small" icon="arrow-up">12.4%</EwTag>
            </div>
            <div class="cs-shot__bars">
              <span v-for="(h, i) in bars" :key="i" class="cs-shot__bar" :style="{ height: h + '%' }" />
            </div>
            <div class="cs-shot__foot">
              <EwStatistic value="¥1,284" label="本周净收入" />
              <EwStatistic value="12ms" label="平均查询" />
            </div>
          </EwCard>
          <div class="cs-shot__chip">
            <EwTag tone="primary" size="small" icon="check-line">同步完成 · 3 个数据源</EwTag>
          </div>
        </div>
      </template>
    </EwHero>

    <EwSection align="center" gap="0" style="padding:40px 0 64px;">
      <EwLogoCloud title="超过 2,000 个团队的日常数据工作跑在云澈上" :items="clients" />
    </EwSection>

    <EwSection id="features" eyebrow="产品能力" title="从数据源到决策，一条线打通" description="六个模块覆盖数据团队 80% 的日常工作，剩下的 20% 交给开放 API。">
      <EwFeatureGrid variant="cards" :columns="3" :items="features" />
    </EwSection>

    <div class="case-band">
      <div class="ew-container cs-stats">
        <EwStatistic value="99.99%" label="服务可用性" align="center" animated />
        <EwStatistic value="2,000+" label="付费团队" align="center" animated />
        <EwStatistic value="12ms" label="平均查询延迟" align="center" animated />
        <EwStatistic value="40+" label="地域节点" align="center" animated />
      </div>
    </div>

    <EwSection id="pricing" eyebrow="定价" title="按团队规模选择，随时升级" description="所有付费方案都包含 14 天全功能试用，不需要绑定信用卡。" align="center">
      <div class="cs-pricing">
        <EwPricingCard
          v-for="p in plans"
          :key="p.title"
          v-bind="p"
        />
      </div>
    </EwSection>

    <EwSection eyebrow="功能对比" title="三个版本差在哪，一张表看清楚" align="center">
      <EwComparisonTable :columns="columns" :rows="rows" />
    </EwSection>

    <EwSection id="faq" eyebrow="常见问题" title="购买之前，你可能想知道" align="center">
      <EwFaq :items="faqs" :default-open="0" />
    </EwSection>

    <EwSection eyebrow="客户评价" title="他们已经在用云澈开会了" align="center">
      <div class="cs-quote">
        <EwQuote
          quote="把三张内部报表搬上云澈只花了一个下午，第二天早会大家第一次看到同一份实时数据——争论数字的会议少了一半。"
          author="沈知远"
          role="南杉资本 · 数据负责人"
          sticker
        />
      </div>
    </EwSection>

    <EwCta
      title="把下一份报表交给云澈"
      description="14 天全功能试用，免费版永久可用。"
    >
      <template #actions>
        <EwButton size="large" pill icon="download">免费开始</EwButton>
        <EwButton size="large" variant="dark" icon="chat-3-line">预约演示</EwButton>
      </template>
    </EwCta>

    <EwFooter
      soft
      logo-text="云澈科技"
      slogan="让数据安静地工作。"
      copyright="© 2026 CloudSure, Inc."
      :columns="[
        { title: '产品', links: [{ label: '产品能力', href: '#features' }, { label: '定价', href: '#pricing' }, { label: '常见问题', href: '#faq' }] },
        { title: '资源', links: [{ label: '帮助中心', href: '#' }, { label: '开发者 API', href: '#' }, { label: '博客', href: '#' }] },
        { title: '公司', links: [{ label: '关于我们', href: '#' }, { label: '加入我们', href: '#' }, { label: '联系我们', href: '#' }] },
      ]"
    />
  </div>
</template>

<style scoped>
.cs-shot {
  position: relative;
  width: 320px;
}
.cs-shot__main {
  box-shadow: var(--ew-shadow-3);
}
.cs-shot__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.cs-shot__title {
  font-size: 13px;
  font-weight: var(--ew-font-weight-medium);
  color: var(--ew-text-secondary);
}
.cs-shot__bars {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 96px;
  margin-bottom: 16px;
}
.cs-shot__bar {
  flex: 1;
  border-radius: 6px 6px 2px 2px;
  background: linear-gradient(180deg, var(--ew-color-primary-light-7), var(--ew-color-primary));
}
.cs-shot__foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.cs-shot__chip {
  position: absolute;
  top: -14px;
  right: -18px;
  padding: 6px 8px;
  border: 1px solid var(--ew-border-color-light);
  border-radius: var(--ew-radius-full);
  background: var(--ew-bg-container);
  box-shadow: var(--ew-shadow-2);
  transform: rotate(3deg);
}
.cs-stats {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 32px;
}
.cs-pricing {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  align-items: stretch;
  max-width: 960px;
  margin-inline: auto;
}
.cs-quote {
  max-width: 640px;
  margin-inline: auto;
}
</style>
