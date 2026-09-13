<template>
  <div class="case-cls">
    <header class="case-cls__header">
      <h3 class="case-cls__title">数学课堂 · 统计表与统计图</h3>
      <div class="case-cls__sub">四～六年级四个单元 · 每张图都由它上面那张统计表得来</div>
    </header>

    <section v-for="(board, i) in boards" :key="board.unit" class="case-cls__board" :class="{ 'is-first': i === 0 }">
      <div class="case-cls__head">
        <span class="case-cls__unit">{{ board.unit }}</span>
        <span class="case-cls__chart-name">{{ board.chartName }}</span>
        <span class="case-cls__ask">这道题问的是：{{ board.ask }}</span>
      </div>

      <div class="case-cls__caption">{{ board.table.caption }}</div>
      <table class="case-cls__table">
        <thead>
          <tr>
            <th class="case-cls__corner">{{ board.table.corner }}</th>
            <th v-for="col in board.table.columns" :key="col">{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in board.table.rows" :key="row.label">
            <th scope="row">{{ row.label }}</th>
            <td v-for="(v, index) in row.values" :key="index">{{ v }}</td>
          </tr>
        </tbody>
      </table>

      <EvChart :options="board.options" :height="250" />

      <p class="case-cls__read"><span class="case-cls__read-tag">读图</span>{{ board.read }}</p>
    </section>

    <section class="case-cls__board">
      <div class="case-cls__head">
        <span class="case-cls__unit">课堂追问</span>
        <span class="case-cls__chart-name">同一张表，换个问法换张图</span>
      </div>
      <p class="case-cls__lead">还是第一张表，数字一个没改，只换问法——用什么图，由问题决定。</p>
      <div class="case-cls__tabs">
        <EvButton
          v-for="q in questions"
          :key="q.id"
          :variant="q.id === activeQuestion ? 'primary' : 'soft'"
          @click="activeQuestion = q.id"
        >
          {{ q.label }}
        </EvButton>
      </div>
      <EvChart :options="activeOptions" :height="260" />
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { EvChart } from '@wil-works/evoke-charts'

// 第一张表的数据同时供「课堂追问」复用：表不动，问法决定画成什么图
const labels = ['跳绳', '篮球', '乒乓球', '足球', '羽毛球']
const classOne = [15, 12, 10, 8, 5]
const classTwo = [11, 14, 9, 12, 7]

const boards = [
  {
    unit: '四年级上册',
    chartName: '条形统计图',
    ask: '最喜欢哪个活动的人最多？',
    table: {
      caption: '四（1）班同学最喜欢的课外活动人数统计表',
      corner: '活动项目',
      columns: ['跳绳', '篮球', '乒乓球', '足球', '羽毛球', '合计'],
      rows: [{ label: '人数 / 人', values: [...classOne, 50] }],
    },
    options: {
      type: 'bar',
      title: '最喜欢的课外活动人数',
      labels,
      series: [{ name: '人数', data: classOne }],
      valueFormat: { suffix: ' 人' },
      legend: { show: false },
    },
    read: '纵轴从 0 开始，一格代表 5 人。柱子最高的是跳绳，最短的是羽毛球——谁最受欢迎，一眼看出来。',
  },
  {
    unit: '四年级下册',
    chartName: '复式条形统计图',
    ask: '两个班比一比，哪些活动不一样？',
    table: {
      caption: '四（1）班、四（2）班同学最喜欢的课外活动人数统计表',
      corner: '班级 ＼ 项目',
      columns: ['跳绳', '篮球', '乒乓球', '足球', '羽毛球', '合计'],
      rows: [
        { label: '四（1）班 / 人', values: [...classOne, 50] },
        { label: '四（2）班 / 人', values: [...classTwo, 53] },
      ],
    },
    options: {
      type: 'bar',
      title: '两个班的人数对照',
      labels,
      series: [
        { name: '四（1）班', data: classOne },
        { name: '四（2）班', data: classTwo },
      ],
      valueFormat: { suffix: ' 人' },
      legend: { show: true },
    },
    read: '一个项目两根柱：跳绳还是四（1）班多，篮球反而是四（2）班多。统计表多一列数据，图上就多一根柱子。',
  },
  {
    unit: '五年级下册',
    chartName: '折线统计图',
    ask: '这六次测验，成绩是升了还是降了？',
    table: {
      caption: '六（1）班 6 次数学单元测验平均分统计表',
      corner: '测验次序',
      columns: ['第1次', '第2次', '第3次', '第4次', '第5次', '第6次'],
      rows: [{ label: '平均分 / 分', values: [82, 85, 84, 89, 91, 94] }],
    },
    options: {
      type: 'line',
      title: '六次测验平均分',
      labels: ['第1次', '第2次', '第3次', '第4次', '第5次', '第6次'],
      series: [{ name: '平均分', data: [82, 85, 84, 89, 91, 94], showSymbol: true }],
      yAxis: { min: 80, max: 96 },
      valueFormat: { suffix: ' 分' },
      legend: { show: false },
      annotations: [
        { type: 'region', from: 2, to: 3, label: '进步最陡的一段' },
        { type: 'callout', x: 5, y: 94, label: '六次一共提高 12 分', anchor: 'top-left' },
      ],
    },
    read: '折线往上走，说明成绩在提高；第 3 次到第 4 次这一段最陡，那一次进步最大。从 82 分到 94 分，一共提高了 12 分。',
  },
  {
    unit: '六年级上册',
    chartName: '扇形统计图',
    ask: '走路上学的同学占全班几成？',
    table: {
      caption: '六（1）班 40 名同学上学方式统计表',
      corner: '上学方式',
      columns: ['步行', '家长接送', '公交', '自行车', '合计'],
      rows: [{ label: '人数 / 人', values: [12, 12, 10, 6, 40] }],
    },
    options: {
      type: 'pie',
      title: '上学方式构成',
      pieData: [
        { name: '步行', value: 12 },
        { name: '家长接送', value: 12 },
        { name: '公交', value: 10 },
        { name: '自行车', value: 6 },
      ],
      piePercentMode: true,
    },
    read: '整个圆代表全班 40 人：扇区越大，人数占的比例越高。步行和家长接送各占三成，都是 12 人。',
  },
]

const questions = [
  {
    id: 'bar',
    label: '谁最多？',
    options: {
      type: 'bar',
      title: '各项目人数（人）',
      labels,
      series: [{ name: '人数', data: classOne }],
      valueFormat: { suffix: ' 人' },
      legend: { show: false },
    },
  },
  {
    id: 'rank',
    label: '从多到少排一排',
    options: {
      type: 'horizontal-bar',
      title: '各项目人数排行（人）',
      // 横向条形图的第一个类目画在最下方，按升序传入，人数最多的才落在最上面
      labels: [...labels].reverse(),
      series: [{ name: '人数', data: [...classOne].reverse() }],
      valueFormat: { suffix: ' 人' },
      legend: { show: false },
    },
  },
  {
    id: 'pie',
    label: '各占全班的几成？',
    options: {
      type: 'pie',
      title: '各项目人数占全班（%）',
      pieData: labels.map((name, i) => ({ name, value: classOne[i] })),
      piePercentMode: true,
    },
  },
]

const activeQuestion = ref('bar')
const activeOptions = computed(() => questions.find((q) => q.id === activeQuestion.value).options)
</script>

<style scoped>
/* minimal：demo-block 已是唯一外框；表与图成对出现，发丝线分隔四个单元 */
.case-cls {
  padding: 4px 0 0;
}
.case-cls :deep(.ev-chart) {
  background: transparent;
}
.case-cls__header {
  margin-bottom: 4px;
}
.case-cls__title {
  margin: 0;
  font-size: 17px;
  color: var(--ev-text-color-primary);
}
.case-cls__sub {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--ev-text-color-secondary);
}
.case-cls__board {
  padding: 20px 0 12px;
  border-top: 1px solid var(--ev-border-color-light);
}
.case-cls__board.is-first {
  border-top: none;
  padding-top: 14px;
}
.case-cls__head {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}
.case-cls__unit {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  color: var(--ev-color-primary);
  background: var(--ev-color-primary-light-9);
}
.case-cls__chart-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ev-text-color-primary);
}
.case-cls__ask {
  font-size: 12px;
  color: var(--ev-text-color-secondary);
}
.case-cls__caption {
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--ev-text-color-secondary);
}
/* 站点表格规则特异性高（.cd-doc table:not([class*=…])），双类名 + 祖先类夺回写法 */
.case-cls .case-cls__table.case-cls__table {
  width: 100%;
  max-width: 620px;
  margin: 0 0 14px;
  border-collapse: collapse;
  border: 1px solid var(--ev-border-color);
  font-size: 13px;
}
.case-cls .case-cls__table.case-cls__table thead th {
  padding: 8px 10px;
  border-bottom: 1px solid var(--ev-border-color);
  border-left: 1px solid var(--ev-border-color-light);
  background: var(--ev-fill-color-light);
  font-size: 12px;
  font-weight: 500;
  color: var(--ev-text-color-secondary);
  white-space: nowrap;
  text-align: center;
}
.case-cls .case-cls__table.case-cls__table tbody th {
  padding: 8px 10px;
  border-left: none;
  background: var(--ev-fill-color-light);
  font-size: 12px;
  font-weight: 400;
  color: var(--ev-text-color-secondary);
  white-space: nowrap;
  text-align: left;
}
.case-cls .case-cls__table.case-cls__table tbody td {
  padding: 8px 10px;
  border-left: 1px solid var(--ev-border-color-light);
  color: var(--ev-text-color-primary);
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.case-cls .case-cls__table.case-cls__table .case-cls__corner {
  border-left: none;
  text-align: left;
}
.case-cls__read {
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.8;
  color: var(--ev-text-color-secondary);
}
.case-cls__read-tag {
  display: inline-block;
  margin-right: 8px;
  padding: 1px 6px;
  border: 1px solid var(--ev-border-color);
  border-radius: 4px;
  font-size: 11px;
  color: var(--ev-text-color-tertiary);
}
.case-cls__lead {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--ev-text-color-secondary);
}
.case-cls__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}
</style>
