/**
 * AI 运营助手 mock——按场景 / 能力组装回复文案（纯字符串模板，无网络）。
 * 真实接入时把这些模板换成模型返回流即可，transport 骨架不变。
 */

export const SCENES = [
  { key: 'diagnose', label: '运营诊断', icon: 'compass' },
  { key: 'report', label: '报告生成', icon: 'file-text' },
  { key: 'copywriting', label: '文案创作', icon: 'edit' },
  { key: 'data', label: '数据解读', icon: 'funds' },
]

export const CAPABILITIES = [
  { key: 'deep-think', label: '深度思考', icon: 'brain' },
  { key: 'web', label: '联网检索', icon: 'global' },
]

export const MODELS = [
  { key: 'qwen-max', label: 'Qwen3.8-Max' },
  { key: 'glm-5', label: 'GLM-5' },
  { key: 'deepseek-v4', label: 'DeepSeek-V4' },
]

export const EXAMPLES = [
  '上周新增用户环比下降 12%，帮我诊断可能原因',
  '写一份双 11 大促复盘报告的框架',
  '把这条版本更新公告改写成朋友圈文案：新版本上线了智能周报功能',
  '解读一下本月渠道转化漏斗',
]

const MODEL_NAMES = {
  'qwen-max': 'Qwen3.8-Max',
  'glm-5': 'GLM-5',
  'deepseek-v4': 'DeepSeek-V4',
}

const SCENE_BODIES = {
  diagnose: (q) =>
    `针对「${q}」，先给结论：降幅大概率来自 **渠道结构变化**，而非产品本身。分析如下：\n\n` +
    `1. **现象拆解**：环比 -12% 需要先排除统计口径（去重规则、归因窗口）变动；\n` +
    `2. **渠道归因**：信息流渠道 CPM 近两周上涨约 20%，若投放未加量，新增自然回落；\n` +
    `3. **留存对冲**：次周留存稳定在 41%，说明产品侧没有恶化，问题集中在获客侧；\n\n` +
    `**建议动作**：拆开渠道看分端新增；对 ROI 跌破 1.5 的计划暂停 48 小时观察；同时把邀请裂变预算上调 15% 对冲。`,

  report: () =>
    `以下是双 11 大促复盘报告框架，可直接扩写成文：\n\n` +
    `## 一、大盘结果\nGMV / 订单量 / UV 三条主线，同比环比各一张表。\n\n` +
    `## 二、流量结构\n付费 / 自然 / 私域占比变化，重点标注爆发时段。\n\n` +
    `## 三、转化漏斗\n浏览 → 加购 → 支付逐层转化率，定位流失最重的一层。\n\n` +
    `## 四、商品与供给\nTop10 SKU 贡献度、缺货与超卖清单。\n\n` +
    `## 五、问题与改进\n3 条最值得投入的改进项，各带负责人与时间点。`,

  copywriting: () =>
    `改写好了，给你两版：\n\n**朋友圈版**\n更新悄悄上线了「智能周报」：每周一早上，自动把你团队的关键数据整理成一页纸，谁都不用再手抄报表。\n\n**简洁版**\n新功能上线｜智能周报：数据自己会汇报，周一早上见。`,

  data: () =>
    `从漏斗看，本月的问题卡在 **加购 → 支付** 这一层：\n\n` +
    `- 浏览 → 加购 12.4%（上期 12.1%，基本持平）\n- 加购 → 支付 38.2%（上期 45.7%，**下滑 7.5 个百分点，是主要流失口**）\n\n` +
    `交叉运费策略调整的时间点，下滑恰好从调整日开始——优先核对运费模板与凑单门槛。可视化建议：漏斗图叠上期对比 + 支付环节按设备端拆分柱状。`,
}

const DEFAULT_BODY = (q) =>
  `收到你的问题：「${q}」。\n\n这是一个演示回复——真实接入后，这里由你的模型服务流式返回。上下文里携带的场景、能力开关与模型选择，都可以在 transport 里拼进 prompt 或路由到不同模型。`

/**
 * 组装一次回复：深度思考返回 think 段，联网检索在正文前插入资料引用
 */
export function buildReply(content, { scene, capabilities = [], model } = {}) {
  const builder = SCENE_BODIES[scene]
  let body = builder ? builder(content) : DEFAULT_BODY(content)
  const think = capabilities.includes('deep-think')
    ? `先拆解问题：判断这是「现象解释」还是「动作建议」类提问。检索已有结论：留存稳定，问题集中在获客侧。需要交叉验证统计口径与投放节奏，再给分层建议，避免把相关当因果。`
    : null
  if (capabilities.includes('web')) {
    body =
      `> 已检索 3 条资料：《9 月投放渠道 ROI 周报》《留存与流失专题分析》《双 11 大促复盘（去年）》\n\n` + body
  }
  if (MODEL_NAMES[model]) {
    body += `\n\n—— 由 ${MODEL_NAMES[model]} 生成`
  }
  return { think, body }
}
