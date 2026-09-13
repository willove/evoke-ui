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
    title: '七项回访：区间切片 · 日历铺满与粒度 · 弧形环状归位 · 动效全面化',
    bullets: [
      'K 线 dataZoom 区间选择修复：纯 candleData 图纳入切片、volumeData 同步（此前滑块动了图不变、量带静默消失）',
      '日历热力格子矩形横向铺满；新增 calendar.granularity 周 / 月求和聚合视角（每日 / 每周 / 累计切换）',
      '弧形环状连接图归位弧长连接图：type arc + arcCircular: true，连线锚到节点圆点；文档章节迁移至弧长连接图页',
      '雷达环底色改同心圆环带（AntV 示例同款）；韦恩图主体按集合数分档放大；旭日图标签正文色优先（能用黑就用黑）',
      '悬浮强调全面缓动化：柱族 / 箱线 / K 线 / 漏斗 / 热力 / 日历 / 甘特随 220ms 缓动淡入淡出，仅准线与 tooltip 即时',
    ],
  },
  {
    tag: 'v0.5.0',
    date: '2026-09-14',
    title: '关系与流动图族 · 日历热力 · 体验回访',
    bullets: [
      '四个新图型：桑基图（能源流动 / 用户旅程）、韦恩图（群体重叠，基础+空心）、弦图与弧长连接图（两两关系强弱）、甘特图（排期进度 / 里程碑 / 依赖 / 今日线）',
      '新增日历热力图 calendar-heatmap：年月日周激活热度（GitHub 活动热力同款，今日描边 + 少多色阶）；弦图新增弧形环状形态（chordMode: curve）',
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
