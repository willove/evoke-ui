# 交互与联动

EvChart 的交互能力开箱即用：图例点选、tooltip、dataZoom 缩放、框选、多图联动、工具导出。绝大多数能力只在 `options` 里开字段，进阶控制走实例方法与事件。全部交互行为遵循一套统一规范：悬浮即时无动画、焦点淡化单一档位、光标语义分级。

## 统一手势约定

- **Esc**：随时清除悬浮、tooltip 与框选拖拽（随之派发 `unhover`）；
- **双击**：重置缩放窗口到全量（未开启 dataZoom 时无操作）；
- **光标**：绘图区十字（crosshair）、图例与工具箱手型（pointer）、缩放滑块抓取（grab / 拖拽中 grabbing）。

## 键盘巡历

图表容器可聚焦（空态与错误态除外，聚焦有贴内缘焦点环），直角系类目图支持键盘巡历：

- **← / →**（横向条形图为 **↑ / ↓**）：在类目间步进悬浮，准线、tooltip 与读屏播报（aria-live）与指针悬浮走同一通道；
- **Home / End**：跳到第一个 / 最后一个类目；
- **Esc**：清除键盘或指针产生的悬浮态。

## 图例：点选显隐与悬浮强调

多系列图表自动出现图例。`legend.interactive` 控制点选显隐（默认开启），`position` 支持 `top` / `bottom`，`hoverEmphasis` 控制悬浮时强调对应系列。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'line',
      title: '图例点选试试',
      labels: ['1 月', '2 月', '3 月', '4 月', '5 月', '6 月'],
      series: [
        { name: '新增', data: [320, 402, 361, 490, 530, 608] },
        { name: '留存', data: [240, 288, 276, 352, 401, 436] },
        { name: '流失', data: [58, 62, 51, 66, 72, 60] },
      ],
      legend: { show: true, position: 'top', interactive: true, hoverEmphasis: true },
    }"
    :height="260"
  />
</DemoBlock>

## tooltip：悬浮提示

`tooltip` 控制 hover 提示框：`trigger` 支持 `hover`（默认）/ `click`，`showAllSeries` 让十字对齐的所有系列同时展示（默认行为），`formatter` 自定义文案。关闭则只看图形本身。

```js
options.tooltip = {
  show: true,          // 默认开启
  trigger: 'hover',    // hover / click
  showAllSeries: true, // 展示对齐的所有系列
  formatter: (rows) => rows.map((r) => `${r.name}：${r.value}`).join('\n'),
}
```

## dataZoom：大数据量缩放

类目多、曲线密时开启 `dataZoom`：`position` 支持 `bottom` / `top`，`start` / `end` 设初始窗口（百分比），`mouseWheel` 开启滚轮缩放（以光标为锚点，双击复位）。拖动窗口或滚轮即可聚焦数据段。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'line',
      title: '全年订单量（拖动下方窗口缩放）',
      labels: ['1 月', '2 月', '3 月', '4 月', '5 月', '6 月', '7 月', '8 月', '9 月', '10 月', '11 月', '12 月'],
      series: [
        { name: '订单量', data: [420, 382, 501, 634, 590, 730, 812, 766, 890, 1020, 940, 1180] },
        { name: '取消量', data: [42, 38, 50, 63, 59, 73, 81, 76, 89, 102, 94, 118] },
      ],
      dataZoom: { enabled: true, start: 0, end: 60, position: 'bottom', mouseWheel: true },
      legend: { show: true },
    }"
    :height="280"
  />
</DemoBlock>

## 框选

在直角坐标系图表上按住拖动可以框选一段数据，松开后触发 `brush-select` 事件（返回 `startIndex` / `endIndex`），适合做"圈选一段再钻取"的交互。

## 多图联动 connectGroup

给多张图相同的 `connectGroup` 分组名，图例显隐与缩放范围自动同步——运营看板里"点一次图例，上下两张图一起切"就是它。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'line',
      title: '订单量（联动组 ops）',
      connectGroup: 'ops',
      labels: ['1 月', '2 月', '3 月', '4 月', '5 月', '6 月'],
      series: [
        { name: '订单', data: [420, 382, 501, 634, 590, 730] },
        { name: '取消', data: [42, 38, 50, 63, 59, 73] },
      ],
      dataZoom: { enabled: true, start: 0, end: 70 },
      legend: { show: true },
    }"
    :height="240"
    style="margin-bottom: 20px;"
  />
  <ev-chart
    :options="{
      type: 'bar',
      title: '成交额（联动组 ops）',
      connectGroup: 'ops',
      labels: ['1 月', '2 月', '3 月', '4 月', '5 月', '6 月'],
      series: [
        { name: '成交额（万）', data: [32, 28, 50, 63, 45, 73] },
      ],
      dataZoom: { enabled: true, start: 0, end: 70 },
      legend: { show: true },
    }"
    :height="240"
  />
</DemoBlock>

## 工具箱 toolbox

`toolbox: { show: true, filename }` 在图表右上角提供导出 PNG 与恢复复位按钮，做报表导出场景够用；更精细的导出走实例方法 `toDataURL` / `exportSVG`。

## 事件

| 事件 | 触发时机 | 回调参数 |
| --- | --- | --- |
| `ready` | 首次渲染完成 | — |
| `click` | 点击图形元素 | `{ seriesName, name, value, color, dataIndex, seriesIndex }` |
| `hover` / `unhover` | 悬浮进入 / 离开图形元素 | 同上 |
| `legend-click` | 点击图例切换显隐 | `(name, hidden)` |
| `zoom` | dataZoom 范围变化 | `{ start, end }` |
| `brush-select` | 框选完成 | `{ startIndex, endIndex }` |
| `animation-end` / `data-update` | 动画结束 / 数据补间更新完成 | — |
| `scene-change` | scenes 分幕推进 | `{ index, total }` |

点击事件可以做钻取：点击柱子跳转到对应明细页，是中后台图表最常见的进阶用法。

## 常用实例方法

通过组件 ref 调用，完整列表见 [API 参考](/chart/api)：

| 方法 | 用途 |
| --- | --- |
| `update(newOptions)` | 增量合并配置并重绘（同结构数据自动补间） |
| `toggleSeries(name)` / `getHiddenSeries()` | 程序化切换系列显隐 |
| `highlightSeries(name)` / `clearHighlight()` | 高亮某系列（跨图引导注意力） |
| `setDataZoomRange(start, end)` | 程序化缩放（配合 `zoom` 事件做播放器） |
| `toDataURL()` / `exportSVG()` | 导出位图 / 真矢量 SVG |
| `setTheme(theme)` | 运行时切换主题 |
| `destroy()` | 销毁实例与监听 |
