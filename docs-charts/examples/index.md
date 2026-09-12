# 案例总览

案例把多个图表类型与交互能力放进一个完整页面里讲：每个案例都是可运行的真实场景，源码面板可以看到完整实现。

<div class="case-cards">
  <a class="case-card" href="/examples/dashboard">
    <strong class="case-card__title">运营数据看板</strong>
    <p class="case-card__desc">KPI 卡 + 营收趋势 + 渠道构成 + 区域排行，看板的经典四件套；附一键导出趋势图 PNG。</p>
    <span class="case-card__tags">sparkline · area · doughnut · horizontal-bar · toDataURL</span>
  </a>
  <a class="case-card" href="/examples/monitor">
    <strong class="case-card__title">服务器指标监控</strong>
    <p class="case-card__desc">云控制台式的批量指标列表：CPU / 内存 / 内网带宽七项指标细线小图，Max / Min / Avg 统计列每秒随窗口重算。</p>
    <span class="case-card__tags">line · showSymbol · animation · 批量时序</span>
  </a>
  <a class="case-card" href="/examples/report">
    <strong class="case-card__title">报表嵌入</strong>
    <p class="case-card__desc">图表嵌进表格行：迷你趋势图回答「在涨还是在跌」，子弹图回答「目标完成了没有」。</p>
    <span class="case-card__tags">sparkline · bullet · 令牌取色</span>
  </a>
  <a class="case-card" href="/examples/finance">
    <strong class="case-card__title">财务月度结算</strong>
    <p class="case-card__desc">KPI 行 + 利润桥 + 费用构成 + 部门报销结算，月度经营会一张页面讲完。</p>
    <span class="case-card__tags">waterfall · pie · stacked-bar</span>
  </a>
  <a class="case-card" href="/examples/fund">
    <strong class="case-card__title">基金持仓体检</strong>
    <p class="case-card__desc">自选列表、收益排行、风险-收益散点、资产配置环——个人盘面的一次完整体检。</p>
    <span class="case-card__tags">sparkline · horizontal-bar · scatter · doughnut</span>
  </a>
  <a class="case-card" href="/examples/hr">
    <strong class="case-card__title">人力资源年度盘点</strong>
    <p class="case-card__desc">招聘漏斗、薪酬五分位、年龄结构、部门人效——年度人才盘点的四个切面。</p>
    <span class="case-card__tags">funnel · boxplot · bin · scatter</span>
  </a>
</div>

## 挑案例还是挑图？

按场景找完整组合看案例；只想回答一个数据问题，去[总览与快速上手](/chart/)的选型表按问题挑图，每个图表类型页都有独立的可运行演示。

<style scoped>
.case-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
  margin: 18px 0 8px;
}
.case-card {
  display: block;
  padding: 18px 18px 14px;
  border: 1px solid var(--cd-border);
  border-radius: 10px;
  background: var(--cd-bg);
  text-decoration: none;
  transition: border-color 0.15s;
}
.case-card:hover {
  border-color: var(--ev-color-primary);
}
.case-card .case-card__title.case-card__title {
  display: block;
  margin-bottom: 8px;
  font-size: 15px;
  color: var(--ev-text-color-primary, #1f2329);
}
.case-card .case-card__desc.case-card__desc {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--ev-text-color-secondary, #646a73);
}
.case-card .case-card__tags.case-card__tags {
  font-size: 11px;
  color: var(--ev-text-color-tertiary, #8f959e);
  font-family: var(--ev-font-family-code, monospace);
}
</style>
