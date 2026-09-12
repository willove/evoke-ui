# 旭日图 sunburst

层级构成的环形表达：内圈是上层、外圈是下层，同一份数据同时看到**层级路径**与**各级占比**。与矩形树图同源，`sunburstData` 驱动。

## 何时使用

- 数据有**父子包含关系**且层级 2–3 层、每层类目 3–6 个——这是它和环形图的分界线；
- 想同时回答「各部门占多少」和「部门里面又是什么构成」；
- 只有一层构成、不需要路径感时，它退化成环形图，请直接用[环形图](/chart/doughnut)；
- 空间紧张、层级多到外圈切片过碎时，改用[矩形树图](/chart/treemap)。

## 示例

数据结构与 treemap 一致：`{ name, value?, children? }` 嵌套数组，叶子节点必须有 `value`，上层角宽由子节点汇总。

### 三级结构

旭日图的真正主场：三层预算树，内圈看事业群盘子、中圈看部门、外圈看细项——一条射线读完整条路径。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'sunburst',
      title: '研发预算层级拆解',
      sunburstData: [
        {
          name: '平台研发',
          children: [
            { name: '基础架构', children: [{ name: '容器化', value: 180 }, { name: '可观测', value: 140 }] },
            { name: '数据平台', value: 210 },
            { name: '安全', value: 120 },
          ],
        },
        {
          name: '业务研发',
          children: [
            { name: '交易中台', value: 260 },
            { name: '用户增长', children: [{ name: '增长实验', value: 100 }, { name: '活动系统', value: 80 }] },
            { name: '开放平台', value: 90 },
          ],
        },
        {
          name: '前沿探索',
          children: [
            { name: 'AI 实验室', value: 150 },
            { name: '创新孵化', value: 60 },
          ],
        },
      ],
    }"
    :height="320"
  />
</DemoBlock>

### 数值直标

外圈切片需要精确读数时开 `showValues`，数值随外层标签一起标出来。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'sunburst',
      title: '流量来源层级',
      showValues: true,
      sunburstData: [
        {
          name: '自有流量',
          children: [
            { name: 'App 启动', value: 540 },
            { name: '官网', value: 260 },
          ],
        },
        {
          name: '付费流量',
          children: [
            { name: '信息流广告', value: 380 },
            { name: '搜索关键词', value: 220 },
          ],
        },
        {
          name: '合作流量',
          children: [
            { name: '渠道互换', value: 150 },
          ],
        },
      ],
    }"
    :height="300"
  />
</DemoBlock>

### 分幕展开：从环形图长出旭日图

只有一层时旭日图就是环形图——所以它最自然的讲法是**先给结论、再展开构成**。用 `scenes` 分两幕：第一幕只有来源大类（环形图形态），推进到第二幕展开子层级。

<script setup>
import { ref } from 'vue'
const sbChart = ref()
const sbScene = ref(0)
const SB_TOP = [
  { name: '自有流量', value: 800 },
  { name: '付费流量', value: 600 },
  { name: '合作流量', value: 150 },
]
const SB_FULL = [
  { name: '自有流量', children: [{ name: 'App 启动', value: 540 }, { name: '官网', value: 260 }] },
  { name: '付费流量', children: [{ name: '信息流广告', value: 380 }, { name: '搜索关键词', value: 220 }] },
  { name: '合作流量', children: [{ name: '渠道互换', value: 150 }] },
]
</script>

<DemoBlock>
  <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px;">
    <ev-button @click="sbChart?.prevScene()">上一幕</ev-button>
    <ev-button @click="sbChart?.nextScene()">下一幕</ev-button>
    <span style="font-size: 12px; color: #94a3b8;">第 {{ sbScene + 1 }} / 2 幕</span>
  </div>
  <ev-chart
    ref="sbChart"
    :options="{
      type: 'sunburst',
      title: '流量来源构成',
      sunburstData: SB_TOP,
      scenes: {
        items: [
          { patch: { sunburstData: SB_TOP }, duration: 700 },
          { patch: { sunburstData: SB_FULL }, duration: 700 },
        ],
      },
    }"
    :height="300"
    @scene-change="(e) => (sbScene = e.index)"
  />
</DemoBlock>

## 配置要点

- 内圈角宽由子节点汇总决定，叶子节点必须有 `value`；
- 悬浮读取节点路径与数值；`showValues` 让外层标签带数值；
- 层级深、类目多的数据先做归并，否则外圈切片过碎；
- 分幕展示用 `scenes`（见上例），字段速查见 [API 参考](/chart/api)。

## 相关

- [矩形树图](/chart/treemap)（同数据的紧凑形态） · [环形图](/chart/doughnut)（单层构成） · [饼图](/chart/pie)
- [API 参考](/chart/api)
