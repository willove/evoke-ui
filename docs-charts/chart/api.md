# API 参考

EvChart 全部能力的字段与方法速查。示例与场景见左侧其余章节。

## Chart Props

<ApiTable title="Chart Props" :rows="[
  { name: 'options', desc: '图表配置，声明式驱动（见下方 Options 字段）', type: 'object', default: '—' },
  { name: 'width / height', desc: '画布尺寸，数字按 px，字符串原样生效（height 设「100%」跟随父级高度，父级需有确定高度）', type: 'string | number', default: '100% / 400' },
  { name: 'responsive', desc: '跟随容器尺寸自适应重绘', type: 'boolean', default: 'true' },
  { name: 'devicePixelRatio', desc: '渲染倍率（缺省取设备实际值，高清屏自动适配）', type: 'number', default: '—' },
]" />

## Options 通用字段

所有类型共用；数据字段按图表类型二选一（见下一节）。

<ApiTable title="Options 通用字段" :rows="[
  { name: 'type', desc: '图表类型：line / bar / area / stacked-bar / horizontal-bar / pie / doughnut / rose / scatter / scatter-matrix / funnel / gauge / radar / heatmap / calendar-heatmap / candle / bullet / treemap / sunburst / boxplot / waterfall / bin / sparkline / mixed / sankey / venn / chord / arc / gantt', type: 'string', default: '—' },
  { name: 'title / subtitle', desc: '主标题 / 副标题', type: 'string', default: '—' },
  { name: 'labels', desc: 'x 轴类目数组，直角系与 sparkline / waterfall / mixed 的数据基线', type: 'array', default: '[]' },
  { name: 'series', desc: '系列数组，每项 { name, data, color?, showSymbol?, lineWidth?, smooth?, chartType?, yAxis? }，data 与 labels 对齐；数据点圆点默认不绘制（showSymbol: true 显示）；smooth: true 单调插值平滑；chartType 取 bar / line 定 mixed 系列柱线形态（缺省 line）；yAxis 取 left / right 定双轴归侧（缺省 left，需配 yAxisRight）', type: 'array', default: '[]' },
  { name: 'legend', desc: '图例：{ show, position（top / bottom / left / right）, interactive, hoverEmphasis }', type: 'object', default: '{ show: true }' },
  { name: 'tooltip', desc: '提示框：{ show, trigger（hover / click）, showAllSeries, formatter }', type: 'object', default: '—' },
  { name: 'animation', desc: '动画：{ enabled, duration（ms，默认 1200）, easing, stagger（分段进场占比，默认 0 关闭；> 0 时数据按类目错峰长入） }；系统开启「减弱动态效果」时自动跳过进场与补间', type: 'object', default: '—' },
  { name: 'valueFormat', desc: '数值格式：{ decimals, thousandSeparator, prefix, suffix, abbreviate }（abbreviate 开启后按 万 / 亿 / K 缩写）', type: 'object', default: '—' },
  { name: 'xAxis / yAxis', desc: '轴配置：{ min, max, ticks, width, grid: { show, style: dashed } }；yAxis.width 显式定 y 轴槽宽（px，横向条形图为分类列宽），列表场景多图传同一值对齐绘图区起点', type: 'object', default: '—' },
  { name: 'yAxisRight', desc: '右值轴，配置结构同 yAxis；与 series[].yAxis 取 right 搭配开启双轴（mixed / line / area 均可）。不设时所有系列落左轴；值轴以左、右两根为限', type: 'object', default: '—' },
  { name: 'dataZoom', desc: '缩放：{ enabled, start, end, position（bottom / top）, height, mouseWheel }', type: 'object', default: '—' },
  { name: 'toolbox', desc: '工具按钮：{ show, filename }（导出 PNG / 恢复复位）', type: 'object', default: '—' },
  { name: 'theme', desc: '主题覆盖（colors、textColor 等），暗色模式自动切换', type: 'object', default: '—' },
  { name: 'palette', desc: '内置色系一键固定（classic / aurora / sunset / morandi / forest / ink / candy），各带明暗双套 8 槽色板；生效后不再读取 --ev-color-* 令牌，宿主换肤不影响；与 theme.colors 同时设置时 theme.colors 优先。详见[主题配色](/guide/palette)', type: 'string', default: '—' },
  { name: 'padding', desc: '绘图区内边距覆写：数字（四边）或 { top, right, bottom, left }（未提供的边回落默认值）；标题、图例、dataZoom 的空间照常叠加。x 轴隐藏（xAxis.show: false）时底部自动收窄；left 未提供时按 y 刻度标签宽度自适应（40–140）', type: 'number | object', default: '—' },
  { name: 'annotations', desc: '叙述注解（旁白，非数据系列，单图 ≤ 3 处）：text 斜体文字 / callout 旁注+虚线引线 / point 固定高亮点 / delta 涨跌结论（三角+数值，涨跌色同 K 线）/ region 区间强调（primary @6% 填充）。定位 x（类目或索引）+ y（数值），或 xPx/yPx 像素（优先）；offsetX/offsetY 像素微调。直角系图表适用', type: 'array', default: '—' },
  { name: 'emphasis', desc: '焦点强调：{ series（名称或索引）, dimOthers: true }——焦点系列保持原样，其余降到 22% 透明度（与图例悬浮同一通道）；优先于图例悬浮强调', type: 'object', default: '—' },
  { name: 'scenes', desc: '编排时间轴：{ autoplay, loop, items }，每幕 { patch, duration, hold }——patch 为该幕 options 浅合并补丁（顶层键替换），duration 为该幕过渡时长 ms（覆盖全局动画），hold 为过渡后额外停留；autoplay 自动推进、loop 到尾幕回卷；初始停在第一幕（index 0）', type: 'object', default: '—' },
  { name: 'layers', desc: '图层逃逸口：[{ at, draw }]，at 为 back（数据层之下）/ after-series（系列之后、注解之前）/ front（注解之上、图例之前，默认）；draw(ctx, renderCtx) 拿到画布上下文与 { plotArea, theme, options, progress }，可画任意自定义内容', type: 'array', default: '—' },
  { name: 'connectGroup', desc: '联动分组名，同组图表图例与缩放联动', type: 'string', default: '—' },
  { name: 'emptyText / ariaLabel', desc: '空数据文案 / 无障碍标签', type: 'string', default: '暂无数据' },
]" />

## Options 按类型数据字段

<ApiTable title="Options 按类型数据字段" :rows="[
  { name: 'pieData', desc: 'pie / doughnut / rose 数据源', type: '{ name, value }[]', default: '—' },
  { name: 'scatterData', desc: 'scatter 散点：label 进入图例与点标注，group 进入颜色通道分组（图例按组聚合），color / size 可覆写点样式', type: '{ x, y, label?, color?, group?, size? }[]', default: '—' },
  { name: 'pointLabels / jitter', desc: 'scatter 增强：pointLabels 显示每点 label 文本（重叠自动让位）；jitter（0–20px）确定性抖动防同值重叠，同数据同偏移', type: 'boolean / number', default: 'false / 0' },
  { name: 'quadrant', desc: 'scatter 四象限：{ xMid?, yMid?, labels? } 以均值或显式中线画十字参考线，labels 顺序为左上 / 右上 / 左下 / 右下', type: 'object', default: '—' },
  { name: 'scatterTrendline / trendlinePerGroup', desc: '回归线：linear / poly / exp，线性自动标注 R²；trendlinePerGroup 配合 group 每组各画一条', type: 'string / boolean', default: '—' },
  { name: 'facet', desc: 'scatter 分面：true + scatterData[].group 按组切小倍数网格，每格独立量程、自带迷你刻度与格标题', type: 'boolean', default: 'false' },
  { name: 'matrixFields / matrixData', desc: 'scatter-matrix 散点矩阵：字段名数组 × 记录数组，生成 n×n 小倍数（对角格为字段名，非对角格为两字段散点）', type: 'string[] / record[]', default: '—' },
  { name: 'funnelData', desc: 'funnel 漏斗；配 `funnelMinRatio`（0–0.5）定尾层最小宽度占比——极差悬殊时压缩尾段保可读，0 = 严格等比', type: '{ label, value }[]', default: '—' },
  { name: 'gauge', desc: 'gauge 仪表盘：{ value, min, max, unit, color, showProgress, startAngle, endAngle（数学角约定：0° 在右、逆时针为正、单位度，默认 220→-40 即弧走上/开口朝下）, pointer: { show, color, width, length }, axisWidth, tickCount, showTicks, tickMarks, valueFontSize, progressDim, cornerRadius }——pointer.show 切指针形态，进度环默认淡化（progressDim: false 保持原样）；也可传数字简写（gauge: 75 等价 { value: 75 }）', type: 'object | number', default: '—' },
  { name: 'radarIndicators', desc: 'radar 维度：{ name, max, min? }', type: 'array', default: '—' },
  { name: 'radarSeries / radarRingFill', desc: 'radar 系列：{ name, data, color?, area?, showSymbol? }——area 默认开（纵向浅渐变填充）；radarRingFill: true 环带交替铺极淡底色；悬浮维度标签 / 轴顶点点亮该轴并强调各系列顶点，悬浮图例走焦点淡化', type: 'array / boolean', default: '—' },
  { name: 'heatmapData', desc: 'heatmap 热力格', type: '{ x, y, value }[]', default: '—' },
  { name: 'candleData / volumeData', desc: 'candle K 线 + 成交量副图：volumeData 与 candleData 等长时绘图区下部 24%（volumeHeight 0.15–0.4 可调）为量带，量柱颜色跟随当日涨跌；volumeData 也可配 line / area（分时图），量柱按价格较前一刻涨跌着色；图例「成交量」点选隐去量带', type: '{ label, open, close, high, low }[] / number[]', default: '—' },
  { name: 'candleMa / candleMaColors', desc: 'K 线叠加均线：周期数组（如 [5, 10]）按收盘价画简单移动平均，颜色取系列色板（candleMaColors 可覆写），图例 MA5/MA10 点选显隐', type: 'number[] / string[]', default: '—' },
  { name: 'calendarData / calendar', desc: 'calendar-heatmap 日历热力：{ date, value } 按天一格（列=周、行=星期，矩形格横向铺满绘图区）；calendar: { start, end, weekStart（默认 1 周一）, granularity（day / week / month，周月为求和聚合视角）, colors（5 色阶）, cellGap, today（缺省当天）, weekdayLabels, showScale, showAllWeekdays }；今日格主色描边，右下「少—多」色阶', type: 'array / object', default: '—' },
  { name: 'arcCircular', desc: 'arc 环形弧长形态：true 时节点排圆周、连接为过圆心弧线（节点圆点 + 弧线，线宽按关系值），数据仍走 arcData', type: 'boolean', default: 'false' },
  { name: 'boxData', desc: 'boxplot 箱线：outliers 为异常点数组（不参与分位计算）；带 group 字段启用分组箱线（同类目并排、图例按组聚合）；boxHorizontal: true 翻转为横向；showOutliers: false 隐藏异常点', type: '{ label, min, q1, median, q3, max, outliers?, group? }[]', default: '—' },
  { name: 'treemapData / sunburstData', desc: '矩形树图 / 旭日图的层级数据', type: '{ name, value?, children? }[]', default: '—' },
  { name: 'bulletData', desc: 'bullet 子弹图', type: '{ name, value, target? }[]', default: '—' },
  { name: 'sankeyData', desc: 'sankey 桑基：nodes 与 links（source / target / value）；节点 value 缺省按链接自动汇总，流带颜色继承源节点色；图例点选节点隐去相连流带；sankey: { nodeAlign }（justify 末端节点贴右缘，默认 / left 按拓扑深度）', type: '{ nodes, links }', default: '—' },
  { name: 'vennData', desc: 'venn 韦恩：单集合 { name, value } + 交集 { sets: [A, B], value }；半径等面积映射、圆距按交集反解；vennHollow: true 切空心形态', type: 'array', default: '—' },
  { name: 'chordData / arcData', desc: 'chord 弦图（环形）/ arc 弧长连接图（线性）：{ nodes, links } 与桑基同构；连接带宽度即关系值，颜色继承源节点色；chordByValue: true 时弦图节点弧长按值占比', type: '{ nodes, links }', default: '—' },
  { name: 'ganttData / ganttToday', desc: 'gantt 甘特：{ name, start, end, progress?, milestone?, dependsOn?, color? }；ganttToday（日期）画今日线；悬浮行高亮并在 tooltip 给出起止与进度', type: 'array / string', default: '—' },
]" />

## Chart Slots

<ApiTable title="Chart Slots" :rows="[
  { name: 'overlay', desc: 'HTML 覆盖层（作用域插槽）：绝对定位铺满容器、默认不拦截鼠标（子元素可自行开启 pointer-events），不遮挡 tooltip。插槽参数 { plotArea, theme, options }，适合富文本旁白、自定义标记、嵌入式小组件', type: 'slot', default: '—' },
]" />

## Chart Events

<ApiTable title="Chart Events" :rows="[
  { name: 'ready', desc: '首次渲染完成', type: '() => void', default: '—' },
  { name: 'click', desc: '点击图形元素（可做钻取）', type: '(e: { seriesName, name, value, color, dataIndex, seriesIndex }) => void', default: '—' },
  { name: 'legend-click', desc: '点击图例切换显隐', type: '(name: string, hidden: boolean) => void', default: '—' },
  { name: 'hover / unhover', desc: '悬浮进入 / 离开图形元素', type: '(e) => void', default: '—' },
  { name: 'scene-change', desc: '场景切换（scenes 编排）', type: '(e: { index, total }) => void', default: '—' },
  { name: 'animation-end / data-update', desc: '动画结束 / 数据补间更新完成', type: '() => void', default: '—' },
  { name: 'zoom', desc: 'dataZoom 范围变化', type: '(e: { start, end }) => void', default: '—' },
  { name: 'brush-select', desc: '框选完成', type: '(e: { startIndex, endIndex }) => void', default: '—' },
]" />

## Chart Methods

通过组件 ref 调用。

<ApiTable title="Chart Methods" :rows="[
  { name: 'update', desc: '增量合并配置并重绘（同结构数据自动补间）', type: '(newOptions) => void', default: '—' },
  { name: 'refresh / resize', desc: '强制重绘（含入场动画）/ 手动触发尺寸更新', type: '() => void', default: '—' },
  { name: 'toDataURL', desc: '导出画布图片', type: '(type?, quality?) => string', default: '—' },
  { name: 'exportSVG', desc: '导出真 SVG（指令重放，非 PNG 嵌入）', type: '(options?) => string', default: '—' },
  { name: 'toggleSeries / getHiddenSeries', desc: '切换系列显隐 / 获取隐藏系列', type: '(name) => void / () => string[]', default: '—' },
  { name: 'highlightSeries / clearHighlight', desc: '高亮某系列 / 清除高亮', type: '(name) => void / () => void', default: '—' },
  { name: 'setDataZoomRange / getDataZoomRange', desc: '设置 / 获取缩放范围', type: '(start, end) => void / () => { start, end }', default: '—' },
  { name: 'getDataExtent / getPlotArea', desc: '获取数据极值 / 实际绘图区域', type: '() => object', default: '—' },
  { name: 'setTheme / getOption', desc: '运行时切换主题 / 获取当前配置（活引用，直接改动即重绘）', type: '(theme) => void / () => object', default: '—' },
  { name: 'getSpec / setSpec', desc: '获取当前 Spec 深拷贝（可安全存储 / diff）/ 整体替换 Spec（清掉旧键与交互状态后重绘）', type: '() => object / (spec) => void', default: '—' },
  { name: 'nextScene / prevScene / gotoScene', desc: '场景推进 / 回退 / 跳转（首末幕夹界）', type: '(i?) => void', default: '—' },
  { name: 'getSceneIndex / getEffectiveSpec', desc: '当前幕序（0 起）/ 当前实际生效 Spec（含缩放切片与场景补丁）', type: '() => number / () => object', default: '—' },
  { name: 'getCanvas / destroy', desc: '获取 canvas 元素 / 销毁实例与监听', type: '() => HTMLCanvasElement / () => void', default: '—' },
]" />

## Spec 契约

options 本身就是图表的完整描述：拿到一份 Spec 就能在别处复现同一张图，改 Spec 就是改图表。这个性质让 Spec 成为「AI 生成、人来调」的通用载体——生成的结果可存档、可 diff、可局部修改后回放。

```js
import { chartOptionsSchema, validateOptions } from '@wil-works/evoke-charts'

// 生成 / 存档前先校验：ok 为 false 时 warnings 给出 path 定位
const { ok, warnings } = validateOptions(spec)

// 组件实例上往返
const snapshot = chartRef.value.getSpec()   // 深拷贝，改它不影响图表
chartRef.value.setSpec({ ...snapshot, type: 'bar' }) // 整体替换并重绘
```

`update()` 是增量合并（适合局部调数），`setSpec()` 是整体替换（适合换一张图），`getOption()` 返回活引用（改动即重绘，慎用）。函数字段（如 `tooltip.formatter`）按引用保留，会话内可完整往返；跨会话持久化时由宿主自行处理序列化。
