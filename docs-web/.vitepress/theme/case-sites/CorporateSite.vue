<script setup>
/**
 * CorporateSite — 案例「积云数合」企业官网的站点内容
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

// 滚动场景缓动：区段归一 + easeOutCubic
const kpis = [
  { value: '12ms', label: '平均查询延迟' },
  { value: '99.99%', label: '服务可用性' },
  { value: '40+', label: '地域节点' },
]
function seg(p, a, b) {
  return Math.min(Math.max((p - a) / (b - a), 0), 1)
}
function easeOut(t) {
  return 1 - Math.pow(1 - t, 3)
}
function storyEntrance(p) {
  const e = easeOut(seg(p, 0, 0.22))
  // 0.3 下限：接近场景（未钉住）时先看到淡影预览，钉住后缓动到实色
  return { opacity: 0.3 + Math.min(e * 1.5, 1) * 0.7, transform: `translateY(${((1 - e) * 28).toFixed(2)}px)` }
}

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

const team = [
  { name: '林一舟', role: '创始人 / CEO', description: '连续创业者，相信好的工具应该安静地站在人的身后。' },
  { name: '苏晚晴', role: '产品合伙人', description: '主导 cumubase 的信息架构与交互语言，前咨询顾问。' },
  { name: '程亦风', role: '工程合伙人', description: '负责同步引擎与查询层，坚持延迟是可以设计出来的。' },
]

const demoVisible = ref(false)
const demoEmail = ref('')
const demoSent = ref(false)
const demoDone = ref(false)

function submitDemo() {
  demoDone.value = true
}
</script>

<template>
  <div class="case-site">
    <EvAlert icon="bell-line" closable style="border-radius:0;border-inline:none;border-top:none;">
      cumubase 3.0 发布：查询引擎全面提速，老用户升级后平均查询耗时下降 68%。
      <template #action>
        <a href="#features" style="display:inline-flex;align-items:center;gap:2px;">看看更新<EvIcon name="arrow-right" :size="14" /></a>
      </template>
    </EvAlert>

    <EvNavbar :items="nav" :sticky="sticky" logo-text="积云数合">
      <template #actions>
        <EvThemeToggle />
        <EvButton size="small" variant="soft">登录</EvButton>
        <EvButton size="small" pill icon-right="arrow-right" href="#pricing">免费试用</EvButton>
      </template>
    </EvNavbar>

    <EvHero
      reveal
      title="让数据安静地工作"
      description="cumubase 数据云把采集、同步与分析装进同一个工作台：连接数据源只要五分钟，剩下的时间留给业务判断。"
    >
      <template #badge>
        <EvAlert pill icon="flashlight-line">
          <span>cumubase 3.0 正式发布</span>
          <template #action>
            <a href="#features" style="display:inline-flex;align-items:center;gap:2px;">查看<EvIcon name="arrow-right" :size="14" /></a>
          </template>
        </EvAlert>
      </template>
      <template #actions>
        <EvButton size="large" pill icon-right="arrow-right" href="#pricing">免费试用</EvButton>
        <EvButton size="large" variant="outline" href="#features">了解产品</EvButton>
      </template>
      <template #aside>
        <div class="cs-shot">
          <EvCard class="cs-shot__main">
            <div class="cs-shot__head">
              <span class="cs-shot__title">营收总览</span>
              <EvTag tone="success" size="small" icon="arrow-up">12.4%</EvTag>
            </div>
            <div class="cs-shot__bars">
              <span v-for="(h, i) in bars" :key="i" class="cs-shot__bar" :style="{ height: h + '%' }" />
            </div>
            <div class="cs-shot__foot">
              <EvStatistic value="¥1,284" label="本周净收入" />
              <EvStatistic value="12ms" label="平均查询" />
            </div>
          </EvCard>
          <div class="cs-shot__chip">
            <EvTag tone="primary" size="small" icon="check-line">同步完成 · 3 个数据源</EvTag>
          </div>
        </div>
      </template>
    </EvHero>

    <EvSection align="center" gap="0" style="padding:40px 0 64px;">
      <EvLogoCloud title="超过 2,000 个团队的日常数据工作跑在 cumubase 上" :items="clients" />
    </EvSection>

    <EvSection id="features" eyebrow="产品能力" title="从数据源到决策，一条线打通" description="六个模块覆盖数据团队 80% 的日常工作，剩下的 20% 交给开放 API。">
      <EvFeatureGrid variant="cards" :columns="3" :items="features" />
    </EvSection>

    <EvScrollScene :duration="220" :top="37">
      <template #default="{ progress }">
        <div class="cs-story">
          <div class="cs-story__copy">
            <p class="cs-story__kicker">数据链路</p>
            <p class="cs-story__headline">查询延迟，随滚动一步步压下来</p>
            <p class="cs-story__desc">接入数据源、命中缓存、切换新引擎——这条折线随你的滚动逐段画出来，向上滚动原样回溯。</p>
          </div>
          <div class="cs-story__window" :style="storyEntrance(progress)">
            <div class="cs-story__chrome"><i></i><i></i><i></i></div>
            <div class="cs-story__body">
              <svg class="cs-story__chart" viewBox="0 0 320 140" fill="none" aria-hidden="true">
                <line v-for="i in 3" :key="i" x1="16" :y1="i * 36" x2="304" :y2="i * 36" class="cs-story__grid" />
                <path
                  class="cs-story__line"
                  d="M16 118 C 60 112, 84 96, 116 88 S 176 78, 208 56 S 276 28, 304 22"
                  pathLength="1"
                  :style="{ strokeDashoffset: 1 - easeOut(seg(progress, 0.04, 0.86)) }"
                />
                <circle class="cs-story__dot" cx="304" cy="22" r="4" :style="{ opacity: seg(progress, 0.8, 0.95) }" />
              </svg>
              <div class="cs-story__kpis">
                <div v-for="(k, i) in kpis" :key="k.label" class="cs-story__kpi" :style="{ opacity: easeOut(seg(progress, 0.42 + i * 0.1, 0.42 + i * 0.1 + 0.3)) }">
                  <b>{{ k.value }}</b><span>{{ k.label }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </EvScrollScene>

    <div class="case-band">
      <div class="ev-container cs-stats">
        <EvStatistic value="99.99%" label="服务可用性" align="center" animated />
        <EvStatistic value="2,000+" label="付费团队" align="center" animated />
        <EvStatistic value="12ms" label="平均查询延迟" align="center" animated />
        <EvStatistic value="40+" label="地域节点" align="center" animated />
      </div>
    </div>

    <EvSection id="pricing" eyebrow="定价" title="按团队规模选择，随时升级" description="所有付费方案都包含 14 天全功能试用，不需要绑定信用卡。" align="center">
      <div class="cs-pricing">
        <template v-for="p in plans" :key="p.title">
          <EvBorderBeam
            v-if="p.badge"
            :width="2"
            :duration="5000"
            style="border-radius: var(--ev-radius-xl); display: grid;"
          >
            <EvPricingCard v-bind="p" style="border-radius: calc(var(--ev-radius-xl) - 2px); height: 100%;" />
          </EvBorderBeam>
          <EvPricingCard v-else v-bind="p" />
        </template>
      </div>
    </EvSection>

    <EvSection eyebrow="功能对比" title="三个版本差在哪，一张表看清楚" align="center">
      <EvComparisonTable :columns="columns" :rows="rows" />
    </EvSection>

    <EvSection id="faq" eyebrow="常见问题" title="购买之前，你可能想知道" align="center">
      <EvFaq :items="faqs" :default-open="0" />
    </EvSection>

    <EvSection eyebrow="客户评价" title="他们已经在用 cumubase 开会了" align="center">
      <div class="cs-quote">
        <EvQuote
          quote="把三张内部报表搬上 cumubase 只花了一个下午，第二天早会大家第一次看到同一份实时数据——争论数字的会议少了一半。"
          author="沈知远"
          role="南杉资本 · 数据负责人"
          sticker
        />
      </div>
    </EvSection>

    <EvSection eyebrow="核心团队" title="一群把数据当产品做的人" description="小而专注的团队，一半时间在写代码，另一半在听客户怎么用。" align="center">
      <div class="cs-team">
        <EvExecCard
          v-for="m in team"
          :key="m.name"
          v-bind="m"
          :portrait-height="170"
        />
      </div>
    </EvSection>

    <EvCta
      title="把下一份报表交给 cumubase"
      description="14 天全功能试用，免费版永久可用。"
    >
      <template #actions>
        <EvButton size="large" pill icon="download">免费开始</EvButton>
        <EvButton size="large" pill variant="dark" icon="chat-3-line" @click="demoVisible = true">预约演示</EvButton>
      </template>
    </EvCta>

    <EvModal v-model="demoVisible" title="预约产品演示" width="440px" @close="demoDone = false">
      <p style="margin:0 0 14px;">留下工作邮箱，我们的解决方案顾问会与你约定 30 分钟的一对一演示，按你的业务场景现场连线真实数据。</p>
      <EvField label="工作邮箱" required>
        <EvInput v-model="demoEmail" type="email" placeholder="you@company.com" />
      </EvField>
      <p v-if="demoDone" style="margin:12px 0 0; font-size:13px; color:var(--ev-color-success);">
        ✓ 预约成功，确认邮件已发送至 {{ demoEmail }}，请注意查收。
      </p>
      <template #footer>
        <EvButton variant="outline" size="small" @click="demoVisible = false">取消</EvButton>
        <EvButton size="small" :disabled="!demoEmail" @click="submitDemo">{{ demoDone ? '已提交' : '提交预约' }}</EvButton>
      </template>
    </EvModal>

    <EvFooter
      soft
      logo-text="积云数合"
      slogan="让数据安静地工作。"
      copyright="© 2026 积云数合"
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
  box-shadow: var(--ev-shadow-3);
}
.cs-shot__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.cs-shot__title {
  font-size: 13px;
  font-weight: var(--ev-font-weight-medium);
  color: var(--ev-text-secondary);
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
  background: linear-gradient(180deg, var(--ev-color-primary-light-7), var(--ev-color-primary));
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
  border: 1px solid var(--ev-border-color-light);
  border-radius: var(--ev-radius-full);
  background: var(--ev-bg-container);
  box-shadow: var(--ev-shadow-2);
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
.cs-team {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  max-width: 920px;
  margin-inline: auto;
}

/* ─── 数据链路滚动场景：折线随滚动画出（EvScrollScene 实战）───
   进场/画线/亮点的缓动在模板里对 progress 做 easeOutCubic 区段映射（:style 绑定） */
.cs-story {
  max-width: 1040px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(280px, 400px) 1fr;
  gap: 56px;
  align-items: center;
  padding: 0 24px;
}
.cs-story__kicker {
  margin: 0;
  font-size: 12px;
  font-weight: var(--ev-font-weight-medium);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ev-color-primary);
}
.cs-story__headline {
  margin: 10px 0 0;
  font-size: 28px;
  font-weight: var(--ev-display-weight-strong, 600);
  line-height: 1.35;
  color: var(--ev-text-primary);
}
.cs-story__desc {
  margin: 14px 0 0;
  font-size: 14px;
  line-height: 1.75;
  color: var(--ev-text-secondary);
}
.cs-story__window {
  border: 1px solid var(--ev-border-color);
  border-radius: 14px;
  overflow: hidden;
  background: var(--ev-bg-container);
  box-shadow: var(--ev-shadow-3);
}
.cs-story__chrome {
  display: flex;
  gap: 6px;
  padding: 10px 14px;
  background: var(--ev-fill-1);
}
.cs-story__chrome i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--ev-border-color-dark);
}
.cs-story__body {
  padding: 20px 22px 22px;
}
.cs-story__chart {
  display: block;
  width: 100%;
}
.cs-story__grid {
  stroke: var(--ev-border-color-light);
  stroke-width: 1;
}
/* pathLength=1 归一化：dashoffset 由模板按缓动进度驱动，1 → 0 折线逐段画出 */
.cs-story__line {
  stroke: var(--ev-color-primary);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-dasharray: 1;
}
.cs-story__dot {
  fill: var(--ev-color-primary);
}
.cs-story__kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 16px;
}
.cs-story__kpi {
  padding: 12px 14px;
  border: 1px solid var(--ev-border-color-light);
  border-radius: 10px;
}
.cs-story__kpi b {
  display: block;
  font-size: 18px;
  color: var(--ev-text-primary);
}
.cs-story__kpi span {
  font-size: 11px;
  color: var(--ev-text-secondary);
}
@media (max-width: 760px) {
  .cs-story {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}
</style>
