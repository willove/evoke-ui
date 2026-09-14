# 更新记录

evoke-charts 的版本演进，最新在上。完整的变更明细（含行为变化与升级注意事项）
见仓库根目录 CHANGELOG，或 [GitHub Releases](https://github.com/willove/evoke-ui/releases)。

<EvTimeline :items="releases">
  <template #description="{ item }">
    <ul class="cl-list">
      <li v-for="b in item.bullets" :key="b">{{ b }}</li>
    </ul>
  </template>
</EvTimeline>

<script setup>
const releases = [
  {
    tag: 'Unreleased',
    date: '即将发版',
    title: '命中链路收口 · 大数据抽稀 · 键盘巡历 · 去重复与边界回访',
    bullets: [
      'hover 命中链路缓存收口：图例 bounds（每次 move 全量重排）与甘特 / 桑基命中布局（Date.parse / 拓扑迭代）按输入键控缓存',
      '键盘 Enter / Space 在巡历落点触发数据点 click（与指针点击同一载荷）；exportSVG 修复旋转文本横排（雷达维度标签等导出保真）',
      '折线 / 面积大数据自动抽稀（DESIGN §16）：点数超像素列 2 倍时按列 min-max 抽稀，峰谷像素级不丢、绘制调用降到 O(宽度)，命中与悬浮仍走全量数据',
      '悬浮重绘合帧：同一帧至多一次全绘，指针高速扫过大图不逐事件重绘',
      '键盘巡历落地（DESIGN §13.7 期 1–2）：容器可聚焦 + 贴内缘焦点环；直角系类目图 ←/→（横向图 ↑/↓）步进悬浮、Home/End 跳首末，准线 / tooltip / 读屏播报与指针同通道',
      'hover 链路缓存：getPadding（每次 mousemove 2–3 次全量扫数据）与散点命中点位按引用键控缓存，悬浮期间零重算',
      '静默边界改空态占位：饼族全 0 / 负值、韦恩超 3 集合不再留白画布；散点量程过滤 NaN 不再静默空白',
      '实现收敛（行为不变）：涨跌色默认值单一出处、标签截断 6 份副本合一、瀑布累计口径 3 处合一（渲染 / 轴量程 / 命中共用 waterfallSteps）、环形内半径公式合一',
      'K 线 dataZoom 区间选择修复：纯 candleData 图纳入切片、volumeData 同步（此前滑块动了图不变、量带静默消失）',
      '日历热力格子矩形横向铺满；新增 calendar.granularity 周 / 月求和聚合视角（每日 / 每周 / 累计切换）',
      '弧形环状连接图归位弧长连接图：type arc + arcCircular: true，连线锚到节点圆点；文档章节迁移至弧长连接图页',
      '雷达环底色改同心圆环带（AntV 示例同款）；韦恩图主体按集合数分档放大；旭日图标签正文色优先（能用黑就用黑）',
      '悬浮强调全面缓动化：柱族 / 箱线 / K 线 / 漏斗 / 热力 / 日历 / 甘特随 220ms 缓动淡入淡出，仅准线与 tooltip 即时',
      '安全与健壮性：tooltip 默认模板转义（labels 带富文本不再可注入）、10 万点以上大数据不再栈溢出、缺 data 系列按空系列渲染不卡更新、实例 destroy() 清理补齐、emphasis 挂载即生效且运行中可切换、桑基图不再回写用户数据、gauge 数字简写与边界修正、sankey.nodeAlign 落地',
      'AI / MCP 面：generate_chart_spec 的 requirement 参数生效；schema 补齐已实现字段（radarRingFill / candleMaColors / quadrant / facet / valueFormat / calendar 系列等）；MCP 目录收录指南页与 0.5.0 新图型页',
      '文档口径对齐：设计页缓动 / 刻度密度 / 监控带与 DESIGN 一致，api 表补 palette 行与 legend 左右位，README 补 0.5.0 图型与 scene-change',
    ],
  },
  {
    tag: 'v0.5.0',
    date: '2026-09-14',
    title: '关系与流动图族 · 日历热力 · 体验回访',
    bullets: [
      '四个新图型：桑基图（能源流动 / 用户旅程）、韦恩图（群体重叠，基础+空心）、弦图与弧长连接图（两两关系强弱）、甘特图（排期进度 / 里程碑 / 依赖 / 今日线）',
      '新增日历热力图 calendar-heatmap：年月日周激活热度（GitHub 活动热力同款，今日描边 + 少多色阶）；弦图新增弧形环状形态（该形态现归位为弧长连接图的 arcCircular，见 Unreleased）',
      '散点图大版本：四象限参考线、点标注、group 颜色通道分组、回归线 R²、防重叠抖动、分面小倍数、散点矩阵看多变量相关性',
      'K 线量副图 + MA 均线（candleMa）+ dataZoom 区间选择；量副图扩展到折线/面积（分时图）；仪表盘指针形态与外观定制面；箱线图分组 / 横向 / 隐藏异常点',
      '雷达图环底色、轴线悬浮点亮；悬浮聚焦与图例焦点淡化全面缓动化；仪表盘弧向修正为经典形态；x 轴拥挤自动抽稀与截断',
    ],
  },
  {
    tag: 'v0.4.0',
    date: '2026-09-13',
    title: '内置色系 · 双轴 · 交互规范',
    bullets: [
      '七套现代色系 options.palette 一键固定：classic / aurora / sunset / morandi / forest / ink / candy，生效后不再跟随宿主换色',
      '双轴成为一等用法：series 逐系列 chartType + yAxis，右轴 yAxisRight；AI 生成面同步支持',
      '统一交互规范落地：Esc 清态、光标语义分级、tooltip 空值行不渲染',
      'AI 生成引擎认年份维度：裸年份自动归时间列；趋势数据量级悬殊时自动切双轴',
    ],
  },
  {
    tag: 'v0.3.1',
    date: '2026-09-13',
    title: '图型视觉精修',
    bullets: [
      '旭日图重做：子扇区收敛父扇区、分支同色系、标签分层与引线外置',
      '漏斗图标签与动效精修；雷达图渐变填充与环刻度标注；散点图点图例',
      '旭日图与矩形树图统一「聚焦子树」悬浮强调',
    ],
  },
  {
    tag: 'v0.3.0',
    date: '2026-09-12',
    title: 'AI 生成引擎与编排',
    bullets: [
      '数据直生图：generateChartSpec 从 CSV / 对象数组自动推断并选型生成图表',
      '叙述注解 annotations[]（callout / delta / region 等五类型）与 emphasis 焦点强调',
      'scenes 分幕编排：自动播放、循环、受控推进可挂滚动叙事',
      'layers 绘制钩子与 #overlay 插槽；lintChartSpec 自检与 buildChartPrompt 提示词契约',
      '行为变化：容器默认去边框、显式 ticks 升级为硬上限、y 轴刻度密度自适应',
    ],
  },
  {
    tag: 'v0.2.0',
    date: '2026-09-12',
    title: '渲染设计升级与配色方案',
    bullets: [
      '数据系列色板与语义色解耦（--ev-color-series-1..8），applySeriesPalette 一键换肤',
      '折线渲染对齐云控制台观感：数据点圆点默认不绘、线宽 1.5、标题左对齐',
      '左留白按刻度标签宽度自适应；新增平滑曲线与 padding 覆写',
    ],
  },
  {
    tag: 'v0.1.x',
    date: '2026-09',
    title: '首个公开版本',
    bullets: ['20+ 图表类型，Canvas 自绘零依赖，主题与暗色跟随宿主，交互与导出内建'],
  },
]
</script>

<style scoped>
.cl-list {
  margin: 6px 0 0;
  padding-left: 18px;
  font-size: 13.5px;
  color: var(--ev-text-secondary);
}
.cl-list li {
  margin: 3px 0;
}
</style>
