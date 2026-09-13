# 箱线图 boxplot

统计五分位的紧凑表达：箱体是四分位区间（Q1-Q3）、箱内横线是中位数、须线延伸到正常范围边缘。对比多个群体的"典型值与波动"最严谨的画法。

## 何时使用

- 每个群体已有（或可算出）**min / q1 / median / q3 / max** 统计值；
- 关心中位数、波动范围与分布偏态，而不是单个均值；
- 接口耗时、响应时长、成绩分布等"群体 vs 分布"的对比。

## 示例

专属数据字段 `boxData`（`{ label, min, q1, median, q3, max }`），一箱一个群体。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'boxplot',
      title: '各接口耗时分布',
      boxData: [
        { label: '用户接口', min: 20, q1: 45, median: 60, q3: 85, max: 140 },
        { label: '订单接口', min: 35, q1: 60, median: 78, q3: 110, max: 190 },
        { label: '报表接口', min: 50, q1: 90, median: 130, q3: 180, max: 260 },
      ],
    }"
    :height="260"
  />
</DemoBlock>

### 各岗位薪酬分布

HR 与财务的定薪依据：五个分位值来自薪酬调研报告，箱体高低与重叠区间直接回答「我们给得起吗」「和市场差多少」——均值会骗人，箱线图不会。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'boxplot',
      title: '各岗位年薪分布（万）',
      boxData: [
        { label: '后端研发', min: 18, q1: 26, median: 34, q3: 45, max: 68 },
        { label: '前端研发', min: 16, q1: 24, median: 30, q3: 40, max: 58 },
        { label: '产品经理', min: 15, q1: 22, median: 29, q3: 38, max: 55 },
        { label: '市场营销', min: 12, q1: 17, median: 22, q3: 30, max: 46 },
        { label: '职能支持', min: 10, q1: 14, median: 18, q3: 24, max: 35 },
      ],
    }"
    :height="280"
  />
</DemoBlock>

### 城市二手房挂牌价

生活购房决策：几个候选板块的挂牌价五分位对比——中位数定预算、箱体长度看板块价格是否混乱（箱体越长砍价空间的故事越多）。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'boxplot',
      title: '候选板块挂牌价（万 / 套）',
      boxData: [
        { label: '市中心学区', min: 380, q1: 450, median: 520, q3: 610, max: 780 },
        { label: '地铁新城区', min: 220, q1: 265, median: 300, q3: 345, max: 420 },
        { label: '老城生活区', min: 160, q1: 195, median: 230, q3: 270, max: 350 },
        { label: '远郊刚需盘', min: 110, q1: 135, median: 155, q3: 180, max: 230 },
      ],
    }"
    :height="280"
  />
</DemoBlock>

### 分组箱线：多组数据比较

`boxData` 带 `group` 字段即启用分组形态：同类目内两组箱体并排、颜色按组区分，图例点选整组显隐。适合「两个季度比」「两个机房比」这类成对对比。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'boxplot',
      title: '接口耗时 · 双机房对比（ms）',
      boxData: [
        { label: '用户接口', group: '华东机房', min: 20, q1: 45, median: 60, q3: 85, max: 140 },
        { label: '用户接口', group: '华北机房', min: 28, q1: 55, median: 74, q3: 98, max: 165 },
        { label: '订单接口', group: '华东机房', min: 35, q1: 60, median: 78, q3: 110, max: 190 },
        { label: '订单接口', group: '华北机房', min: 42, q1: 70, median: 92, q3: 128, max: 220 },
        { label: '报表接口', group: '华东机房', min: 50, q1: 90, median: 130, q3: 180, max: 260 },
        { label: '报表接口', group: '华北机房', min: 60, q1: 105, median: 150, q3: 205, max: 295 },
      ],
    }"
    :height="300"
  />
</DemoBlock>

### 横向箱线与异常值检测

`boxHorizontal: true` 翻转方向：类目走纵轴、耗时走横轴，类目名再长也放得下。`showOutliers: false` 可隐藏异常点只看分位主体——异常值检测则相反：离群的圆点就是你要的答案（超时毛刺、爬虫流量），悬浮箱体查看五分位明细。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'boxplot',
      title: '各接口耗时分布（含异常离群）',
      boxHorizontal: true,
      boxData: [
        { label: '用户接口', min: 20, q1: 45, median: 60, q3: 85, max: 140, outliers: [210, 260] },
        { label: '订单接口', min: 35, q1: 60, median: 78, q3: 110, max: 190, outliers: [305] },
        { label: '报表接口', min: 50, q1: 90, median: 130, q3: 180, max: 260 },
      ],
    }"
    :height="240"
  />
</DemoBlock>

## 配置要点

- 统计值由业务侧算好传入（与后端聚合口径一致）；
- 只有原始明细数据时，先看[直方图](/chart/bin)更直接；
- 箱体越"矮"说明群体越稳定，箱体越长波动越大；
- `group` 分组形态下 `showOutliers: false` 同样生效；图例按组聚合；
- 异常点检测口径在业务侧：`outliers` 数组单独传入，不参与箱体分位计算。

## 相关

- [直方图](/chart/bin) · [K 线图](/chart/candle)
- [API 参考](/chart/api)
